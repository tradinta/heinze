import { Metadata } from "next";
import { db } from "@/lib/db";
import ArticleClientPage from "./ArticleClientPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getAbsoluteImageUrl = (url?: string | null) => {
  if (!url) return "https://heinze.vercel.app/robert_heinze.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://heinze.vercel.app${url.startsWith("/") ? "" : "/"}${url}`;
};

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const artRes = await db.query("SELECT title, description, category, tags, published_date, cover_image FROM articles WHERE id = $1", [id]);
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
    let authorImage = "";
    
    configRes.rows.forEach((row: any) => {
      if (row.key === "author_name" && row.value) authorName = row.value;
      if (row.key === "author_image" && row.value) authorImage = row.value;
    });

    const ogImage = getAbsoluteImageUrl(article.cover_image || authorImage);

    return {
      title: `${article.title} | ${authorName}`,
      description: article.description || `Read "${article.title}" by ${authorName}.`,
      category: article.category,
      keywords: [article.category, ...(article.tags || []), authorName, "Heinze Insights", "Philosophy of Technology"],
      authors: [{ name: authorName, url: "https://heinze.vercel.app" }],
      publisher: authorName,
      openGraph: {
        title: article.title,
        description: article.description,
        type: "article",
        url: `https://heinze.vercel.app/articles/${id}`,
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
    status: row.status ?? "published",
    coverImage: row.cover_image || ""
  };

  // Retrieve author details from system config tables
  const configRes = await db.query("SELECT key, value FROM system_configs WHERE key IN ('author_name', 'author_bio', 'author_image')");
  let authorName = "Robert Heinze";
  let authorBio = "Researcher exploring the intersection of technology, philosophy, and human connection.";
  let authorImage = "";

  configRes.rows.forEach((row: any) => {
    if (row.key === "author_name" && row.value) authorName = row.value;
    if (row.key === "author_bio" && row.value) authorBio = row.value;
    if (row.key === "author_image" && row.value) authorImage = row.value;
  });

  const resolvedAuthorImage = getAbsoluteImageUrl(authorImage);
  const resolvedCoverImage = getAbsoluteImageUrl(article.coverImage || authorImage);

  // Inject structural JSON-LD Schema (Google Structured Data)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.description,
    "image": resolvedCoverImage,
    "datePublished": article.publishedDate ? new Date(article.publishedDate).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorName,
      "image": resolvedAuthorImage,
      "description": authorBio,
      "url": "https://heinze.vercel.app",
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
        "url": resolvedAuthorImage
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://heinze.vercel.app/articles/${id}`
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
        initialAuthorImage={resolvedAuthorImage}
      />
    </>
  );
}
