import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function ensureNotesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS article_notes (
      id SERIAL PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      note_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function POST(request: NextRequest) {
  try {
    await ensureNotesTable();
    const body = await request.json();
    const { articleId, noteText } = body;

    if (!articleId || !noteText) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const userEmail = session?.user?.email || "Anonymous Guest";

    const insertQuery = `
      INSERT INTO article_notes (article_id, user_email, note_text)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const res = await db.query(insertQuery, [articleId, userEmail, noteText.trim()]);

    return NextResponse.json({ success: true, note: res.rows[0] });
  } catch (err: any) {
    console.error("POST notes error:", err);
    return NextResponse.json({ error: err.message || "Failed to save note" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureNotesTable();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!articleId) {
      return NextResponse.json({ error: "articleId parameter is required" }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Count total notes
    const countRes = await db.query(
      "SELECT COUNT(*)::INTEGER as total FROM article_notes WHERE article_id = $1",
      [articleId]
    );
    const totalCount = countRes.rows[0]?.total || 0;

    // Fetch notes ordered by recent
    const notesRes = await db.query(
      `SELECT * FROM article_notes 
       WHERE article_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [articleId, limit, offset]
    );

    return NextResponse.json({
      notes: notesRes.rows,
      totalCount,
      page,
      limit
    });
  } catch (err: any) {
    console.error("GET notes error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve notes" }, { status: 500 });
  }
}
