import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function isRequestAdmin(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session?.user?.role === "admin";
  } catch (err) {
    console.error("isRequestAdmin check error:", err);
    return false;
  }
}
