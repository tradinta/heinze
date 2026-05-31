import { db } from "./db";

export async function logEvent(event: string, meta: string, type: "system" | "auth" | "action" | "reader") {
  try {
    await db.query(
      "INSERT INTO logs (event, meta, type) VALUES ($1, $2, $3)",
      [event, meta, type]
    );
  } catch (err) {
    console.error("Failed to write to audit log database:", err);
  }
}
