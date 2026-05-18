import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateExplanation,
  type ExplanationLevel,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      question,
      correctAnswer,
      options,
      level,
      previousExplanation,
    } = body as {
      question: string;
      correctAnswer: string;
      options: string[];
      level: ExplanationLevel;
      previousExplanation?: string;
    };

    if (!question || !correctAnswer || !Array.isArray(options)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (level !== "eli11" && level !== "eli5") {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const { data: deck } = await supabase
      .from("decks")
      .select("source_text, user_id")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    let sourceText = deck.source_text as string | null;

    if (!sourceText?.trim()) {
      const { data: legacy } = await supabase
        .from("questions")
        .select("question, explanation")
        .eq("deck_id", deckId)
        .limit(8);

      if (legacy?.length) {
        sourceText = legacy
          .map((q) => `${q.question}\n${q.explanation}`)
          .join("\n\n");
      }
    }

    const explanation = await generateExplanation({
      sourceText: sourceText ?? question,
      question,
      correctAnswer,
      options,
      level,
      previousExplanation,
    });

    return NextResponse.json({ explanation, level });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to explain";
    const isQuota = /quota|429|rate limit/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isQuota ? 429 : 500 }
    );
  }
}
