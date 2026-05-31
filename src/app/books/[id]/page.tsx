import { Metadata } from "next";
import { db } from "@/lib/db";
import BookClientPage from "./BookClientPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

// God-mode dynamic SEO metadata generation for Books
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
    
    const bookCover = book.cover_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCRejJqwFi6W0wMDLd3b6gCn8YVlczZBzKXLpq6evk-kxJ6JYN34jsL0PlrppBYAJ2mPgQykR5uoA1U72oFBiJ9Hpl8gXaQJxj2gICBSJ-otTvKYmVi0A28y93RQZ8uskvh9vLXq0uLWNiXJdVH27aRcQk4Z2oajjiJwbh9tY886vRfpA8TxzL7EuClskavKIGkl5W1DLNRcI55XQjtvspN3IVZ8QBOoMRDj66WW0L85XBBccbuTkZaMsv7dGX8fuk7fcIkrcpvH1sy";

    return {
      title: `${book.title} | ${authorName} Library`,
      description: book.description || `Read "${book.title}" in the digital library of ${authorName}.`,
      keywords: [book.title, authorName, "Library", "Book", "Cognition", "Digital Reading"],
      openGraph: {
        title: book.title,
        description: book.description,
        type: "book",
        url: `https://heinze-analytics.pages.dev/books/${id}`,
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
  let authorImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAXAbq5fmbDbwlQuGvhxtbDccY1fPh2n2k-qUk4gXmWWLdR0Gig_ozr37FflXFNZGeXau6fOpqtx59yBLmNZ1Dnd8W4d-R45U3CMmrJAW4vGqkRfVH1TJcxPVyZFl8dk8GnyTXL8gBCyfYPvzOztDm05yKA-8wPt3IRWH6Ebftp3ryQ5teJ9NRjL3_Q7NRsRc_wNMH4coDQQXU8F0y_Ukzk3s22mfj2_6N1DhHYh3Mt5AIBpr0KEncDPJDfhlMGBlT18NbqGw-UA325";

  configRes.rows.forEach((row: any) => {
    if (row.key === "author_name" && row.value) authorName = row.value;
    if (row.key === "author_image" && row.value) authorImage = row.value;
  });

  const bookCover = book.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCRejJqwFi6W0wMDLd3b6gCn8YVlczZBzKXLpq6evk-kxJ6JYN34jsL0PlrppBYAJ2mPgQykR5uoA1U72oFBiJ9Hpl8gXaQJxj2gICBSJ-otTvKYmVi0A28y93RQZ8uskvh9vLXq0uLWNiXJdVH27aRcQk4Z2oajjiJwbh9tY886vRfpA8TxzL7EuClskavKIGkl5W1DLNRcI55XQjtvspN3IVZ8QBOoMRDj66WW0L85XBBccbuTkZaMsv7dGX8fuk7fcIkrcpvH1sy";

  // Inject structural JSON-LD Schema (God Mode Google Structured Data)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "description": book.description,
    "image": bookCover,
    "numberOfPages": book.pages,
    "bookFormat": "https://schema.org/EBook",
    "author": {
      "@type": "Person",
      "name": authorName,
      "image": authorImage,
      "url": "https://heinze-analytics.pages.dev"
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
