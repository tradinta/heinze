import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRequestAdmin } from "@/lib/auth-util";

// Ensure client_crashes table exists dynamically
async function ensureCrashesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_crashes (
      id SERIAL PRIMARY KEY,
      error_message TEXT NOT NULL,
      error_stack TEXT,
      component_stack TEXT,
      url TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      user_email TEXT,
      login_status BOOLEAN DEFAULT FALSE,
      occurrence_count INTEGER DEFAULT 1,
      first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(error_message, device, browser, os, user_email, login_status)
    );
  `);
}

export async function POST(request: NextRequest) {
  try {
    await ensureCrashesTable();
    const body = await request.json();
    const { 
      errorMessage, 
      errorStack, 
      componentStack, 
      url, 
      device, 
      browser, 
      os, 
      userEmail, 
      loginStatus 
    } = body;

    if (!errorMessage) {
      return NextResponse.json({ error: "errorMessage is required" }, { status: 400 });
    }

    // Upsert crash event
    const query = `
      INSERT INTO client_crashes (
        error_message, 
        error_stack, 
        component_stack, 
        url, 
        device, 
        browser, 
        os, 
        user_email, 
        login_status, 
        occurrence_count
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
      ON CONFLICT (error_message, device, browser, os, user_email, login_status)
      DO UPDATE SET 
        occurrence_count = client_crashes.occurrence_count + 1,
        last_seen = CURRENT_TIMESTAMP,
        error_stack = COALESCE(EXCLUDED.error_stack, client_crashes.error_stack),
        component_stack = COALESCE(EXCLUDED.component_stack, client_crashes.component_stack),
        url = COALESCE(EXCLUDED.url, client_crashes.url)
      RETURNING id;
    `;

    const res = await db.query(query, [
      errorMessage,
      errorStack || null,
      componentStack || null,
      url || null,
      device || "unknown",
      browser || "unknown",
      os || "unknown",
      userEmail || null,
      loginStatus ?? false
    ]);

    return NextResponse.json({ success: true, id: res.rows[0]?.id });
  } catch (err: any) {
    console.error("Failed to log client crash:", err);
    return NextResponse.json({ error: err.message || "Failed to log crash" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    await ensureCrashesTable();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;
    let queryConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Filter by date (last_seen date matches input day)
    if (dateStr) {
      queryConditions.push(`last_seen::date = $${paramCounter}`);
      queryParams.push(dateStr);
      paramCounter++;
    }

    // Filter by search text in error_message or stack
    if (search.trim()) {
      queryConditions.push(`(error_message ILIKE $${paramCounter} OR error_stack ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(" AND ")}` : "";

    // Count query
    const countRes = await db.query(
      `SELECT COUNT(*)::INTEGER as total FROM client_crashes ${whereClause}`,
      queryParams
    );
    const totalCount = countRes.rows[0]?.total || 0;

    // Data query ordered by most recently seen errors
    const selectQuery = `
      SELECT * FROM client_crashes 
      ${whereClause} 
      ORDER BY last_seen DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const dataRes = await db.query(selectQuery, [...queryParams, limit, offset]);

    return NextResponse.json({ 
      crashes: dataRes.rows, 
      totalCount,
      page,
      limit
    });
  } catch (err: any) {
    console.error("GET client crashes error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve crashes" }, { status: 500 });
  }
}
