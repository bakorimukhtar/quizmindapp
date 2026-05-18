import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/extract-text";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titleInput = (formData.get("title") as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(
      buffer,
      file.type,
      file.name
    );

    const title =
      titleInput ||
      file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ||
      "Untitled Deck";

    const sourceText = text.trim().slice(0, 12000);

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({
        user_id: user.id,
        title,
        source_filename: file.name,
        source_text: sourceText,
        last_studied_at: null,
      })
      .select("id")
      .single();

    if (deckError || !deck) {
      return NextResponse.json(
        { error: deckError?.message || "Failed to create deck" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deckId: deck.id, title });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process document";
    const isQuota =
      /quota|429|rate limit/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isQuota ? 429 : 500 }
    );
  }
}
