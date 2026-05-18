import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateQuestionsFromText,
  QUESTION_COUNT,
} from "@/lib/gemini";
import { shuffleArray } from "@/lib/shuffle";
import type { GeneratedQuestion, SessionQuestion } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function toSessionQuestion(
  q: GeneratedQuestion,
  index: number,
  extra?: Partial<SessionQuestion>
): SessionQuestion {
  return {
    id: `q-${index}-${Date.now()}`,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    hint: q.hint,
    explanation: q.explanation,
    ...extra,
  };
}

export async function POST(
  _request: Request,
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

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id, title, source_text, user_id")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    let sourceText = deck.source_text as string | null;

    if (!sourceText?.trim()) {
      const { data: legacy } = await supabase
        .from("questions")
        .select("question, explanation")
        .eq("deck_id", deckId)
        .order("order_index");

      if (legacy?.length) {
        sourceText = legacy
          .map((q) => `${q.question}\n${q.explanation}`)
          .join("\n\n");
      }
    }

    if (!sourceText?.trim()) {
      return NextResponse.json(
        {
          error:
            "This deck has no study material saved. Create a new deck from your PDF/TXT.",
        },
        { status: 400 }
      );
    }

    const { data: reviews } = await supabase
      .from("question_reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("deck_id", deckId)
      .order("times_seen", { ascending: false });

    const reviewItems = (reviews ?? []).slice(0, 3);
    const reviewCount = reviewItems.length;
    const newCount = Math.max(QUESTION_COUNT - reviewCount, 5);

    const avoidQuestions = [
      ...(reviews ?? []).map((r) => r.question),
    ];

    const newQuestions = await generateQuestionsFromText(sourceText, {
      count: newCount,
      avoidQuestions,
      extraInstructions:
        reviewCount > 0
          ? `Focus on NEW topics and angles not covered by the avoided questions. Use varied difficulty.`
          : `Use varied question styles: definitions, application, comparison, and cause-effect.`,
    });

    const reviewSession: SessionQuestion[] = reviewItems.map((r, i) =>
      toSessionQuestion(
        {
          question: r.question,
          correct_answer: r.correct_answer,
          options: r.options as string[],
          hint: r.hint,
          explanation: r.explanation,
        },
        i,
        {
          isReview: true,
          reviewType: r.review_type as "failed" | "explained",
        }
      )
    );

    const freshSession = newQuestions.map((q, i) =>
      toSessionQuestion(q, reviewCount + i)
    );

    const sessionQuestions = shuffleArray([
      ...reviewSession,
      ...freshSession,
    ]).slice(0, QUESTION_COUNT);

    await supabase
      .from("decks")
      .update({ last_studied_at: new Date().toISOString() })
      .eq("id", deckId);

    return NextResponse.json({
      title: deck.title,
      questions: sessionQuestions,
      reviewCount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate quiz";
    const isQuota = /quota|429|rate limit/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isQuota ? 429 : 500 }
    );
  }
}
