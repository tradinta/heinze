import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/logger";
import { isRequestAdmin } from "@/lib/auth-util";

// Auto-run schema migration query on database access
async function verifySchema() {
  try {
    await db.query("ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image TEXT;");
    await db.query("ALTER TABLE articles ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT FALSE;");
  } catch (err) {
    console.error("Migration error (articles schema update):", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifySchema();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Find single article
      const res = await db.query("SELECT * FROM articles WHERE id = $1", [id]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
      
      const row = res.rows[0];
      
      // Auto-increment visits count on direct article load
      await db.query("UPDATE articles SET visits = COALESCE(visits, 0) + 1 WHERE id = $1", [id]);

      const article = {
        id: row.id,
        title: row.title,
        category: row.category,
        publishedDate: row.published_date,
        readTime: row.read_time,
        description: row.description,
        content: row.content,
        summary: row.summary,
        tags: row.tags || [],
        visits: (row.visits ?? 0) + 1, // incremented
        bookmarksCount: row.bookmarks_count ?? 0,
        status: row.status ?? "published",
        coverImage: row.cover_image || null,
        highlighted: row.highlighted ?? false
      };
      return NextResponse.json({ article });
    }

    // Listing parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "recently_added";
    
    let statusParam = searchParams.get("status") || "published"; // 'published', 'draft', 'archived', or 'all'
    if (statusParam !== "published") {
      const isAdminUser = await isRequestAdmin(request);
      if (!isAdminUser) {
        statusParam = "published";
      }
    }

    const offset = (page - 1) * limit;

    let queryConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Status filter
    if (statusParam !== "all") {
      queryConditions.push(`status = $${paramCounter}`);
      queryParams.push(statusParam);
      paramCounter++;
    }

    // Category filter
    if (category.trim()) {
      queryConditions.push(`category = $${paramCounter}`);
      queryParams.push(category);
      paramCounter++;
    }

    // Search filter
    if (search.trim()) {
      queryConditions.push(`(title ILIKE $${paramCounter} OR description ILIKE $${paramCounter} OR content ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(" AND ")}` : "";

    // Sorting
    let orderBy = "published_date DESC";
    if (sort === "most_read") {
      orderBy = "visits DESC";
    } else if (sort === "most_bookmarked") {
      orderBy = "bookmarks_count DESC";
    } else if (sort === "recently_added") {
      orderBy = "published_date DESC";
    }

    // Total Count
    const countRes = await db.query(
      `SELECT COUNT(*) FROM articles ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0].count);

    // Fetch paginated
    const articlesQuery = `
      SELECT * FROM articles 
      ${whereClause} 
      ORDER BY ${orderBy} 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    const finalParams = [...queryParams, limit, offset];

    const res = await db.query(articlesQuery, finalParams);
    
    const articles = res.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      publishedDate: row.published_date,
      readTime: row.read_time,
      description: row.description,
      content: row.content,
      summary: row.summary,
      tags: row.tags || [],
      visits: row.visits ?? 0,
      bookmarksCount: row.bookmarks_count ?? 0,
      status: row.status ?? "published",
      coverImage: row.cover_image || null,
      highlighted: row.highlighted ?? false
    }));

    return NextResponse.json({ 
      articles, 
      totalCount, 
      page, 
      limit 
    });
  } catch (error: any) {
    console.error("GET articles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    await verifySchema();

    const body = await request.json();
    const { title, category, description, summary, tags, content, status, coverImage, highlighted } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required." }, { status: 400 });
    }

    const baseSlug = title.toLowerCase().trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const id = `${baseSlug}-${randomSuffix}`;

    const publishedDate = new Date().toISOString().split("T")[0];
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.max(2, Math.ceil(words / 180))} min read`;

    await db.query(
      `INSERT INTO articles (id, title, category, published_date, read_time, description, content, summary, tags, visits, bookmarks_count, status, cover_image, highlighted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        title,
        category || "General",
        publishedDate,
        readTime,
        description || "",
        content,
        summary || "",
        tags || [],
        0,
        0,
        status || "published", // 'published' or 'draft'
        coverImage || null,
        highlighted ? true : false
      ]
    );

    await logEvent(`Published new essay: "${title}"`, `Slug: ${id}, Status: ${status || "published"}`, "system");

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Save article error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'visit' or 'bookmark'

    if (!id || !action) {
      return NextResponse.json({ error: "ID and Action are required." }, { status: 400 });
    }

    const artRes = await db.query("SELECT title FROM articles WHERE id = $1", [id]);
    const artTitle = artRes.rows[0]?.title || id;

    if (action === "visit") {
      await db.query("UPDATE articles SET visits = COALESCE(visits, 0) + 1 WHERE id = $1", [id]);
      await logEvent(`Reader loaded essay: "${artTitle}"`, `ID: ${id}`, "reader");
    } else if (action === "bookmark") {
      const undo = searchParams.get("undo") === "true";
      const incrementVal = undo ? -1 : 1;
      await db.query(
        "UPDATE articles SET bookmarks_count = GREATEST(0, COALESCE(bookmarks_count, 0) + $1) WHERE id = $2",
        [incrementVal, id]
      );
      if (undo) {
        await logEvent(`Removed bookmark: "${artTitle}"`, `ID: ${id}`, "reader");
      } else {
        await logEvent(`Bookmarked essay: "${artTitle}"`, `ID: ${id}`, "reader");
      }
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT stats article error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    await verifySchema();

    const body = await request.json();
    const { articleId, title, category, description, summary, tags, content, status, coverImage, highlighted } = body;

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required for updates." }, { status: 400 });
    }

    let wordsCount = 0;
    let readTimeStr = "2 min read";
    if (content) {
      const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
      readTimeStr = `${Math.max(2, Math.ceil(words / 180))} min read`;
    }

    await db.query(
      `UPDATE articles 
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           summary = COALESCE($4, summary),
           tags = COALESCE($5, tags),
           content = COALESCE($6, content),
           read_time = CASE WHEN $6 IS NOT NULL THEN $7 ELSE read_time END,
           status = COALESCE($8, status),
           cover_image = CASE WHEN $10 = 'REMOVE' THEN NULL ELSE COALESCE($10, cover_image) END,
           highlighted = COALESCE($11, highlighted)
       WHERE id = $9`,
      [
        title,
        category,
        description,
        summary,
        tags,
        content,
        readTimeStr,
        status,
        articleId,
        coverImage !== undefined ? coverImage : null,
        highlighted !== undefined ? highlighted : null
      ]
    );

    await logEvent(`Updated essay properties: "${title || articleId}"`, `ID: ${articleId}, Status: ${status}`, "system");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH article error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await db.query("DELETE FROM articles WHERE id = $1", [id]);
    await logEvent(`Deleted essay: "${id}"`, `ID: ${id}`, "system");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
