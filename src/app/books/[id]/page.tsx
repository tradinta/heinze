import { Metadata } from "next";
import { db } from "@/lib/db";
import BookClientPage from "./BookClientPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getAbsoluteImageUrl = (url?: string | null) => {
  if (!url) return "https://heinze.vercel.app/robert_heinze.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://heinze.vercel.app${url.startsWith("/") ? "" : "/"}${url}`;
};

// Dynamic SEO metadata generation for Books
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const bookRes = await db.query("SELECT title, description, cover_url, pages FROM books WHERE id = $1", [id]);
    if (bookRes.rows.length === 0) {
      return {
        title: "Book Not Found | Robert Heinze Library",
        description: "The requested volume could not be found."
      };
    }
    
    const book = bookRes.rows[0];
    
    // Fetch author metadata from system config
    const configRes = await db.query("SELECT value FROM system_configs WHERE key = 'author_name'");
    const authorName = configRes.rows[0]?.value || "Robert Heinze";
    
    const bookCover = getAbsoluteImageUrl(book.cover_url);

    return {
      title: `${book.title} | ${authorName} Library`,
      description: book.description || `Read "${book.title}" in the digital library of ${authorName}.`,
      keywords: [book.title, authorName, "Library", "Book", "Cognition", "Digital Reading"],
      openGraph: {
        title: book.title,
        description: book.description,
        type: "book",
        url: `https://heinze.vercel.app/books/${id}`,
        images: [
          {
            url: bookCover,
            alt: book.title
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: book.title,
        description: book.description,
        images: [bookCover]
      }
    };
  } catch (e) {
    console.error("Error generating dynamic metadata for book:", e);
    return {
      title: "Robert Heinze Library"
    };
  }
}

export default async function BookPage({ params }: PageProps) {
  const { id } = await params;

  // Retrieve book details
  const bookRes = await db.query("SELECT * FROM books WHERE id = $1", [id]);
  if (bookRes.rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-mono">
        <p className="text-sm text-zinc-500">Book not found.</p>
      </div>
    );
  }

  const row = bookRes.rows[0];
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

  // Retrieve author details from system config tables
  const configRes = await db.query("SELECT key, value FROM system_configs WHERE key IN ('author_name', 'author_image')");
  let authorName = "Robert Heinze";
  let authorImage = "";

  configRes.rows.forEach((row: any) => {
    if (row.key === "author_name" && row.value) authorName = row.value;
    if (row.key === "author_image" && row.value) authorImage = row.value;
  });

  const resolvedAuthorImage = getAbsoluteImageUrl(authorImage);
  const resolvedCoverImage = getAbsoluteImageUrl(book.coverUrl);

  // Inject structural JSON-LD Schema (Google Structured Data)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "description": book.description,
    "image": resolvedCoverImage,
    "numberOfPages": book.pages,
    "bookFormat": "https://schema.org/EBook",
    "author": {
      "@type": "Person",
      "name": authorName,
      "image": resolvedAuthorImage,
      "url": "https://heinze.vercel.app"
    },
    "publisher": {
      "@type": "Organization",
      "name": authorName
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookClientPage initialBook={book} />
    </>
  );
}
