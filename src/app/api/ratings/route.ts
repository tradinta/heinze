import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Ensure the ratings table exists dynamically
async function ensureRatingsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS article_ratings (
      id SERIAL PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(article_id, user_email)
    );
  `);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "articleId parameter is required" }, { status: 400 });
    }

    await ensureRatingsTable();

    // Fetch average rating and count
    const statsResult = await db.query(
      `SELECT COALESCE(AVG(rating), 0)::FLOAT as average, COUNT(*)::INTEGER as count 
       FROM article_ratings 
       WHERE article_id = $1`,
      [articleId]
    );

    const average = statsResult.rows[0]?.average || 0;
    const count = statsResult.rows[0]?.count || 0;

    // Check if current user has rated
    let userRating = null;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user?.email) {
      const userRatingResult = await db.query(
        `SELECT rating FROM article_ratings WHERE article_id = $1 AND user_email = $2`,
        [articleId, session.user.email]
      );
      if (userRatingResult.rows.length > 0) {
        userRating = userRatingResult.rows[0].rating;
      }
    }

    return NextResponse.json({ average, count, userRating });
  } catch (err: any) {
    console.error("GET ratings error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch ratings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to rate." }, { status: 401 });
    }

    const body = await request.json();
    const { articleId, rating } = body;

    if (!articleId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid parameters. articleId and rating (1-5) are required." }, { status: 400 });
    }

    await ensureRatingsTable();

    // Upsert rating
    await db.query(
      `INSERT INTO article_ratings (article_id, user_email, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (article_id, user_email)
       DO UPDATE SET rating = EXCLUDED.rating`,
      [articleId, session.user.email, rating]
    );

    // Fetch new stats
    const statsResult = await db.query(
      `SELECT COALESCE(AVG(rating), 0)::FLOAT as average, COUNT(*)::INTEGER as count 
       FROM article_ratings 
       WHERE article_id = $1`,
      [articleId]
    );

    const average = statsResult.rows[0]?.average || 0;
    const count = statsResult.rows[0]?.count || 0;

    return NextResponse.json({ success: true, average, count, userRating: rating });
  } catch (err: any) {
    console.error("POST rating error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit rating" }, { status: 500 });
  }
}
