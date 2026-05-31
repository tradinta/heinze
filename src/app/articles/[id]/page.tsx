import { Metadata } from "next";
import { db } from "@/lib/db";
import ArticleClientPage from "./ArticleClientPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

// God-mode dynamic SEO metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const artRes = await db.query("SELECT title, description, category, tags, published_date FROM articles WHERE id = $1", [id]);
    if (artRes.rows.length === 0) {
      return {
        title: "Essay Not Found | Robert Heinze",
        description: "The requested essay could not be found."
      };
    }
    
    const article = artRes.rows[0];
    
    // Fetch author metadata from system config
    const configRes = await db.query("SELECT key, value FROM system_configs WHERE key IN ('author_name', 'author_image')");
    let authorName = "Robert Heinze";
    let authorImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAXAbq5fmbDbwlQuGvhxtbDccY1fPh2n2k-qUk4gXmWWLdR0Gig_ozr37FflXFNZGeXau6fOpqtx59yBLmNZ1Dnd8W4d-R45U3CMmrJAW4vGqkRfVH1TJcxPVyZFl8dk8GnyTXL8gBCyfYPvzOztDm05yKA-8wPt3IRWH6Ebftp3ryQ5teJ9NRjL3_Q7NRsRc_wNMH4coDQQXU8F0y_Ukzk3s22mfj2_6N1DhHYh3Mt5AIBpr0KEncDPJDfhlMGBlT18NbqGw-UA325";
    
    configRes.rows.forEach((row: any) => {
      if (row.key === "author_name" && row.value) authorName = row.value;
      if (row.key === "author_image" && row.value) authorImage = row.value;
    });

    const ogImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCRejJqwFi6W0wMDLd3b6gCn8YVlczZBzKXLpq6evk-kxJ6JYN34jsL0PlrppBYAJ2mPgQykR5uoA1U72oFBiJ9Hpl8gXaQJxj2gICBSJ-otTvKYmVi0A28y93RQZ8uskvh9vLXq0uLWNiXJdVH27aRcQk4Z2oajjiJwbh9tY886vRfpA8TxzL7EuClskavKIGkl5W1DLNRcI55XQjtvspN3IVZ8QBOoMRDj66WW0L85XBBccbuTkZaMsv7dGX8fuk7fcIkrcpvH1sy";

    return {
      title: `${article.title} | ${authorName}`,
      description: article.description || `Read "${article.title}" by ${authorName}.`,
      category: article.category,
      keywords: [article.category, ...(article.tags || []), authorName, "Heinze Insights", "Philosophy of Technology"],
      authors: [{ name: authorName, url: "https://heinze-analytics.pages.dev" }],
      publisher: authorName,
      openGraph: {
        title: article.title,
        description: article.description,
        type: "article",
        url: `https://heinze-analytics.pages.dev/articles/${id}`,
        publishedTime: article.published_date ? new Date(article.published_date).toISOString() : undefined,
        authors: [authorName],
        tags: article.tags || [],
        section: article.category,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.title
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.description,
        creator: "@robertheinze",
        images: [ogImage]
      }
    };
  } catch (e) {
    console.error("Error generating dynamic metadata for article:", e);
    return {
      title: "Robert Heinze Insights"
    };
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;

  // Retrieve article details
  const artRes = await db.query("SELECT * FROM articles WHERE id = $1", [id]);
  if (artRes.rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-mono">
        <p className="text-sm text-zinc-500">Article not found.</p>
      </div>
    );
  }

  const row = artRes.rows[0];
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
    visits: row.visits ?? 0,
    bookmarksCount: row.bookmarks_count ?? 0,
    status: row.status ?? "published"
  };

  // Retrieve author details from system config tables
  const configRes = await db.query("SELECT key, value FROM system_configs WHERE key IN ('author_name', 'author_bio', 'author_image')");
  let authorName = "Robert Heinze";
  let authorBio = "Researcher exploring the intersection of technology, philosophy, and human connection.";
  let authorImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAXAbq5fmbDbwlQuGvhxtbDccY1fPh2n2k-qUk4gXmWWLdR0Gig_ozr37FflXFNZGeXau6fOpqtx59yBLmNZ1Dnd8W4d-R45U3CMmrJAW4vGqkRfVH1TJcxPVyZFl8dk8GnyTXL8gBCyfYPvzOztDm05yKA-8wPt3IRWH6Ebftp3ryQ5teJ9NRjL3_Q7NRsRc_wNMH4coDQQXU8F0y_Ukzk3s22mfj2_6N1DhHYh3Mt5AIBpr0KEncDPJDfhlMGBlT18NbqGw-UA325";

  configRes.rows.forEach((row: any) => {
    if (row.key === "author_name" && row.value) authorName = row.value;
    if (row.key === "author_bio" && row.value) authorBio = row.value;
    if (row.key === "author_image" && row.value) authorImage = row.value;
  });

  // Inject structural JSON-LD Schema (God Mode Google Structured Data)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.description,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCRejJqwFi6W0wMDLd3b6gCn8YVlczZBzKXLpq6evk-kxJ6JYN34jsL0PlrppBYAJ2mPgQykR5uoA1U72oFBiJ9Hpl8gXaQJxj2gICBSJ-otTvKYmVi0A28y93RQZ8uskvh9vLXq0uLWNiXJdVH27aRcQk4Z2oajjiJwbh9tY886vRfpA8TxzL7EuClskavKIGkl5W1DLNRcI55XQjtvspN3IVZ8QBOoMRDj66WW0L85XBBccbuTkZaMsv7dGX8fuk7fcIkrcpvH1sy",
    "datePublished": article.publishedDate ? new Date(article.publishedDate).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorName,
      "image": authorImage,
      "description": authorBio,
      "url": "https://heinze-analytics.pages.dev",
      "sameAs": [
        "https://twitter.com/robertheinze",
        "https://github.com/robertheinze"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": authorName,
      "logo": {
        "@type": "ImageObject",
        "url": authorImage
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://heinze-analytics.pages.dev/articles/${id}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleClientPage 
        initialArticle={article}
        initialAuthorName={authorName}
        initialAuthorBio={authorBio}
        initialAuthorImage={authorImage}
      />
    </>
  );
}
