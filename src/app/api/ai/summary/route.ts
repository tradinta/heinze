import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "No content provided to summarize." }, { status: 400 });
    }

    // Retrieve the Gemini API key from database
    const configRes = await db.query("SELECT value FROM system_configs WHERE key = 'gemini_api_key'");
    const apiKey = configRes.rows[0]?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured in settings." }, { status: 500 });
    }

    console.log("AI Summary requested. Input content length:", content.length);

    const prompt = `You are Robert Heinze's publishing AI. Summarize the following essay in 1 to 2 clear, concise, and thought-provoking sentences. Maintain an intellectual, human-centric tone (absolutely no marketing fluff or jargon). You MUST finish your thought and output complete, fully formed sentences that do not cut off. Do not leave sentences incomplete. Output ONLY the summary text, with no introductory text, surrounding quotes, or commentary.\n\nEssay Content:\n${content.replace(/<[^>]*>/g, '')}`; // strip HTML tags for cleaner processing

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      return NextResponse.json({ error: "Google AI Studio request failed. Please check your API key." }, { status: 502 });
    }

    const data = await response.json();
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!summaryText) {
      return NextResponse.json({ error: "Gemini API returned an empty summary." }, { status: 502 });
    }

    await logEvent("Generated AI summary for essay", `Length: ${summaryText.length} characters`, "system");

    return NextResponse.json({ summary: summaryText });
  } catch (err: any) {
    console.error("AI Summary generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
