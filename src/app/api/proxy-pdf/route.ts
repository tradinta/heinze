import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get("url");

    if (!pdfUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(pdfUrl);
    } catch {
      return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
    }

    const parsedUrl = new URL(pdfUrl);
    const host = parsedUrl.host.toLowerCase();
    
    // Allow proxying from trusted locations (Cloudflare R2 domain fragments, vercel, local, googlecdn)
    const isAllowed = 
      host.includes("r2.dev") || 
      host.includes("cloudflare") || 
      host.includes("google") || 
      host.includes("vercel.app") || 
      host.includes("localhost") || 
      host.includes("127.0.0.1");

    if (!isAllowed) {
      return NextResponse.json({ error: "Host not allowed for proxying" }, { status: 403 });
    }

    // Fetch the PDF file
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        "Accept": "application/pdf"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch PDF: ${response.statusText}` }, { status: response.status });
    }

    // Get the headers to forward
    const contentType = response.headers.get("Content-Type") || "application/pdf";
    const contentLength = response.headers.get("Content-Length");
    const contentDisposition = response.headers.get("Content-Disposition") || "inline";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }
    if (contentDisposition) {
      headers["Content-Disposition"] = contentDisposition;
    }

    // Return the response stream
    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error("PDF Proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
