import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/logger";
import { isRequestAdmin } from "@/lib/auth-util";

export async function GET(request: NextRequest) {
  try {
    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Seed default policies
    const defaultPolicies = [
      {
        key: "page_privacy",
        value: `# Privacy Policy\nLast Updated: May 31, 2026\n\nWe believe in absolute transparency and minimal tracking. This page explains how we handle your information.\n\n## 1. Information We Collect\n* **Telemetry Data:** When you visit our website, we log raw telemetry (IP address, approximate location, device type, browser, and referring website). This is used strictly for security auditing and counting views.\n* **No Personal Tracking:** We do not sell your personal data or target you with advertisements.\n\n## 2. Reading and Download History\n* **Local Storage:** Bookmarks, notes, and reading progress are saved directly in your web browser's local storage. This data never leaves your device unless you log in to sync your profile.\n\n## 3. Contacting Us\nIf you have any questions, you can contact fic.callus@gmail.com.`
      },
      {
        key: "page_terms",
        value: `# Terms of Service\nLast Updated: May 31, 2026\n\nWelcome to the Robert Heinze publication shelf. By using our website, you agree to these simple terms.\n\n## 1. Permitted Use\n* You may read all essays and preview books for personal, non-commercial purposes.\n* You may download PDF copies of books where offered.\n\n## 2. Intellectual Property\n* All books, essays, and resources are copyrighted by Robert Heinze. You may not re-publish, sell, or rent these materials without explicit written permission.\n\n## 3. Disclaimers\n* All content is provided "as is" for informational and educational purposes. We make no guarantees of suitability or completeness.`
      },
      {
        key: "page_cookie",
        value: `# Cookie Policy\nLast Updated: May 31, 2026\n\nWe use cookies to ensure a secure, fast, and functioning experience.\n\n## 1. Strictly Necessary Cookies\n* **Authentication:** We use session cookies to identify your login status if you create an account or access the admin panel.\n\n## 2. Local Browser Storage\n* We use your browser's local storage to persist bookmarks, reading progress, and theme choices. These are strictly functional and do not track you across other websites.`
      }
    ];

    for (const policy of defaultPolicies) {
      await db.query(
        "INSERT INTO system_configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [policy.key, policy.value]
      );
    }

    const res = await db.query("SELECT key, value FROM system_configs");
    const configs: Record<string, string> = {};
    for (const row of res.rows) {
      configs[row.key] = row.value;
    }
    return NextResponse.json({ configs });
  } catch (err: any) {
    console.error("GET config error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isRequestAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ error: "Config Key is required." }, { status: 400 });
    }

    await db.query(
      `INSERT INTO system_configs (key, value) 
       VALUES ($1, $2)
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );

    // Make sure we don't log the raw API key secret in the audit log itself
    const loggedValue = key === "gemini_api_key" ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : value;
    await logEvent(`Updated system config: "${key}"`, `Value set to: ${loggedValue}`, "system");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST config error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
