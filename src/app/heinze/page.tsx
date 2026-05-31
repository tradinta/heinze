import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { 
  ArrowLeft, Mail, Phone, Twitter, 
  Github, Linkedin, Youtube, Globe
} from "lucide-react";

const formatLinkUrl = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") || 
    trimmed.startsWith("https://") || 
    trimmed.startsWith("mailto:") || 
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const configRes = await db.query("SELECT key, value FROM system_configs WHERE key IN ('author_name', 'author_bio', 'author_image')");
    let name = "Robert Heinze";
    let bio = "Researcher exploring the intersection of technology, philosophy, and human connection.";
    let image = "";
    
    configRes.rows.forEach((row: any) => {
      if (row.key === "author_name" && row.value) name = row.value;
      if (row.key === "author_bio" && row.value) bio = row.value;
      if (row.key === "author_image" && row.value) image = row.value;
    });

    const getAbsoluteImageUrl = (url?: string | null) => {
      if (!url) return "https://heinze.vercel.app/robert_heinze.png";
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `https://heinze.vercel.app${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const ogImage = getAbsoluteImageUrl(image);

    return {
      title: `${name} | Author Profile`,
      description: bio,
      openGraph: {
        title: name,
        description: bio,
        type: "profile",
        images: [
          {
            url: ogImage,
            alt: name
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: name,
        description: bio,
        images: [ogImage]
      }
    };
  } catch (e) {
    return { title: "Robert Heinze | Author Profile" };
  }
}

export default async function AuthorProfilePage() {
  // Retrieve configs
  const configRes = await db.query(
    `SELECT key, value FROM system_configs WHERE key IN (
      'author_name', 'author_bio', 'author_image', 'author_email', 
      'author_phone', 'author_twitter', 'author_github', 
      'author_linkedin', 'author_youtube', 'author_long_bio_html'
    )`
  );
  
  let authorName = "Robert Heinze";
  let authorBio = "Researcher exploring the intersection of technology, philosophy, and human connection.";
  let authorImage = "";
  
  let authorEmail = "";
  let authorPhone = "";
  let authorTwitter = "";
  let authorGithub = "";
  let authorLinkedin = "";
  let authorYoutube = "";
  let authorLongBioHtml = "";

  configRes.rows.forEach((row: any) => {
    if (row.key === "author_name" && row.value) authorName = row.value;
    if (row.key === "author_bio" && row.value) authorBio = row.value;
    if (row.key === "author_image" && row.value) authorImage = row.value;
    if (row.key === "author_email" && row.value) authorEmail = row.value;
    if (row.key === "author_phone" && row.value) authorPhone = row.value;
    if (row.key === "author_twitter" && row.value) authorTwitter = row.value;
    if (row.key === "author_github" && row.value) authorGithub = row.value;
    if (row.key === "author_linkedin" && row.value) authorLinkedin = row.value;
    if (row.key === "author_youtube" && row.value) authorYoutube = row.value;
    if (row.key === "author_long_bio_html" && row.value) authorLongBioHtml = row.value;
  });

  const getAbsoluteImageUrl = (url?: string | null) => {
    if (!url) return "/robert_heinze.png";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://heinze.vercel.app${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const resolvedAuthorImage = getAbsoluteImageUrl(authorImage);

  const hasAnySocials = authorEmail || authorPhone || authorTwitter || authorGithub || authorLinkedin || authorYoutube;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 font-mono select-text animate-fade-in">
      
      {/* Back link */}
      <div className="mb-8 select-none">
        <Link 
          href="/articles" 
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-foreground text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to essays
        </Link>
      </div>

      {/* Main layout card */}
      <div className="border border-border bg-card-bg/20 p-6 md:p-10 space-y-8">
        
        {/* Profile header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-border">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-zinc-800 shrink-0 select-none">
            {resolvedAuthorImage ? (
              <img 
                src={resolvedAuthorImage} 
                alt={`${authorName} portrait`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-2xl">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{authorName}</h1>
              {/* Twitter-like verified checkmark badge matched to theme-primary variable color */}
              <svg 
                className="h-4.5 w-4.5 text-primary fill-current shrink-0" 
                viewBox="0 0 24 24"
              >
                <title>Verified Author</title>
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.407-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.407.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.16l-3.32-3.32 1.42-1.42 1.9 1.9 4.7-4.7 1.42 1.42-6.12 6.12z" />
              </svg>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed max-w-xl">
              {authorBio}
            </p>
            
            {/* Render dynamic socials with icons */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[10px] text-zinc-500 select-none">
              {hasAnySocials ? (
                <>
                  {authorEmail && (
                    <a href={`mailto:${authorEmail}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      {authorEmail}
                    </a>
                  )}
                  {authorPhone && (
                    <a href={`tel:${authorPhone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      {authorPhone}
                    </a>
                  )}
                  {authorTwitter && (
                    <a href={formatLinkUrl(authorTwitter)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-bold">
                      <Twitter className="h-3.5 w-3.5" />
                      Twitter
                    </a>
                  )}
                  {authorGithub && (
                    <a href={formatLinkUrl(authorGithub)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-bold">
                      <Github className="h-3.5 w-3.5" />
                      GitHub
                    </a>
                  )}
                  {authorLinkedin && (
                    <a href={formatLinkUrl(authorLinkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-bold">
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  )}
                  {authorYoutube && (
                    <a href={formatLinkUrl(authorYoutube)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-bold">
                      <Youtube className="h-3.5 w-3.5" />
                      YouTube
                    </a>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    heinze-insights.net
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    robert@heinze-insights.net
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Extended Rich Text Biography Content */}
        {authorLongBioHtml && (
          <div className="pb-4">
            <div 
              className="prose dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: authorLongBioHtml }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
