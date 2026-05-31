import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/logger";
import { isRequestAdmin } from "@/lib/auth-util";

export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let countQuery = "SELECT COUNT(*) FROM logs";
    let query = "SELECT id, timestamp, event, meta, type FROM logs";
    // Admin actions are logged as type = 'system'
    let conditions: string[] = ["type = 'system'"];
    let params: any[] = [];
    let counter = 1;

    if (search) {
      conditions.push(`(event ILIKE $${counter} OR meta ILIKE $${counter})`);
      params.push(`%${search}%`);
      counter++;
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    const countRes = await db.query(countQuery, params);
    const totalCount = parseInt(countRes.rows[0].count || "0");
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    query += ` ORDER BY timestamp DESC LIMIT $${counter} OFFSET $${counter + 1}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    
    const logs = res.rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp).toISOString().replace("T", " ").substring(0, 19),
      event: row.event,
      meta: row.meta,
      type: row.type
    }));

    return NextResponse.json({ 
      logs, 
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (err: any) {
    console.error("GET logs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { event, meta, type } = body;
    if (!event || !type) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await logEvent(event, meta || "", type);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST logs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
