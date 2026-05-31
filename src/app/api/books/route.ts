import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/logger";
import { isRequestAdmin } from "@/lib/auth-util";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const res = await db.query("SELECT * FROM books WHERE id = $1", [id]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }
      const row = res.rows[0];
      const book = {
        id: row.id,
        title: row.title,
        description: row.description,
        publishedDate: row.published_date,
        pages: row.pages,
        pdfUrl: row.pdf_url,
        summary: row.summary,
        tableOfContents: row.table_of_contents || [],
        mockPages: row.mock_pages || [],
        archived: row.archived ?? false,
        coverUrl: row.cover_url || "",
        iconName: row.icon_name || "",
        impressions: row.impressions ?? 0,
        downloads: row.downloads ?? 0
      };
      return NextResponse.json({ book });
    }

    // Pagination, Sorting & Filtering
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "recently_added";
    
    let archivedParam = searchParams.get("archived") || "false"; // 'true', 'false', or 'all'
    if (archivedParam === "true" || archivedParam === "all") {
      const isAdminUser = await isRequestAdmin(request);
      if (!isAdminUser) {
        archivedParam = "false";
      }
    }

    const offset = (page - 1) * limit;

    let queryConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Filter by archived status
    if (archivedParam === "true") {
      queryConditions.push(`archived = true`);
    } else if (archivedParam === "false") {
      queryConditions.push(`(archived = false OR archived IS NULL)`);
    } // if 'all', do not add archived filter

    // Search filter
    if (search.trim()) {
      queryConditions.push(`(title ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(" AND ")}` : "";

    // Sorting
    let orderBy = "published_date DESC";
    if (sort === "most_read") {
      orderBy = "downloads DESC, impressions DESC";
    } else if (sort === "largest") {
      orderBy = "pages DESC";
    } else if (sort === "recently_added") {
      orderBy = "published_date DESC";
    }

    // Get total count for pagination calculations
    const countRes = await db.query(
      `SELECT COUNT(*) FROM books ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0].count);

    // Fetch paginated books
    const booksQuery = `
      SELECT * FROM books 
      ${whereClause} 
      ORDER BY ${orderBy} 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    const finalParams = [...queryParams, limit, offset];

    const res = await db.query(booksQuery, finalParams);
    
    const books = res.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      publishedDate: row.published_date,
      pages: row.pages,
      pdfUrl: row.pdf_url,
      summary: row.summary,
      tableOfContents: row.table_of_contents || [],
      mockPages: row.mock_pages || [],
      archived: row.archived ?? false,
      coverUrl: row.cover_url || "",
      iconName: row.icon_name || "",
      impressions: row.impressions ?? 0,
      downloads: row.downloads ?? 0
    }));

    return NextResponse.json({ 
      books, 
      totalCount, 
      page, 
      limit 
    });
  } catch (error: any) {
    console.error("GET books error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, pdfUrl, pages, coverUrl, iconName, summary } = body;

    if (!title || !pdfUrl) {
      return NextResponse.json({ error: "Title and PDF URL are required." }, { status: 400 });
    }

    const baseSlug = title.toLowerCase().trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const id = `${baseSlug}-${randomSuffix}`;
    const todayStr = new Date().toISOString().split("T")[0];

    await db.query(
      `INSERT INTO books (id, title, description, published_date, pages, pdf_url, summary, table_of_contents, mock_pages, archived, cover_url, icon_name, impressions, downloads)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        title,
        description || "",
        todayStr,
        Number(pages) || 1,
        pdfUrl,
        summary || `Themes outline for ${title}`,
        ["Introduction"],
        [`Title Page: ${title}.`, "Introduction content goes here."],
        false,
        coverUrl || null,
        iconName || null,
        0,
        0
      ]
    );

    await logEvent(`Uploaded new book: "${title}"`, `URL: ${pdfUrl}, Pages: ${pages}`, "system");

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Save book error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support incrementing stats (impressions / downloads)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'impression' or 'download'

    if (!id || !action) {
      return NextResponse.json({ error: "ID and Action are required." }, { status: 400 });
    }

    const bookRes = await db.query("SELECT title FROM books WHERE id = $1", [id]);
    const bookTitle = bookRes.rows[0]?.title || id;

    if (action === "impression") {
      await db.query("UPDATE books SET impressions = COALESCE(impressions, 0) + 1 WHERE id = $1", [id]);
      await logEvent(`Book previewed: "${bookTitle}"`, `ID: ${id}`, "reader");
    } else if (action === "download") {
      await db.query("UPDATE books SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1", [id]);
      await logEvent(`PDF downloaded: "${bookTitle}"`, `ID: ${id}`, "action");
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT stats increment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support batch actions: archiving, unarchiving, deletion, editing
export async function PATCH(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids, bookId, title, description, coverUrl, iconName, archived } = body;

    // Batch updates (archiving, unarchiving, batch delete)
    if (action && Array.isArray(ids) && ids.length > 0) {
      if (action === "archive") {
        await db.query("UPDATE books SET archived = true WHERE id = ANY($1)", [ids]);
        await logEvent(`Batch archived books`, `IDs: ${ids.join(", ")}`, "system");
        return NextResponse.json({ success: true, message: `Archived ${ids.length} books.` });
      }
      if (action === "unarchive") {
        await db.query("UPDATE books SET archived = false WHERE id = ANY($1)", [ids]);
        await logEvent(`Batch unarchived books`, `IDs: ${ids.join(", ")}`, "system");
        return NextResponse.json({ success: true, message: `Unarchived ${ids.length} books.` });
      }
      if (action === "delete") {
        await db.query("DELETE FROM books WHERE id = ANY($1)", [ids]);
        await logEvent(`Batch deleted books`, `IDs: ${ids.join(", ")}`, "system");
        return NextResponse.json({ success: true, message: `Deleted ${ids.length} books.` });
      }
      return NextResponse.json({ error: "Invalid batch action" }, { status: 400 });
    }

    // Single item edit
    if (bookId) {
      await db.query(
        `UPDATE books 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             cover_url = $3, 
             icon_name = $4,
             archived = COALESCE($5, archived)
         WHERE id = $6`,
        [title, description, coverUrl || null, iconName || null, archived, bookId]
      );
      await logEvent(`Updated book properties: "${title || bookId}"`, `ID: ${bookId}`, "system");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing batch details or bookId" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH book error:", error);
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
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    await logEvent(`Deleted book: "${id}"`, `ID: ${id}`, "system");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
