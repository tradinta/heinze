import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { isRequestAdmin } from "@/lib/auth-util";

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a safe, unique filename
    const originalNameClean = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileExtension = originalNameClean.split(".").pop();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const safeName = `${Date.now()}-${randomSuffix}.${fileExtension}`;

    const fileUrl = await uploadToR2(buffer, safeName, file.type || "application/octet-stream");
    return NextResponse.json({ fileUrl, originalName: file.name });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
