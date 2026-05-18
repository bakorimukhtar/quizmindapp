import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { questionHash } from "@/lib/question-hash";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      deckId,
      action,
      question,
      correct_answer,
      options,
      hint,
      explanation,
      reviewType,
    } = body;

    if (!deckId || !question) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hash = questionHash(question);

    if (action === "resolved") {
      await supabase
        .from("question_reviews")
        .delete()
        .eq("user_id", user.id)
        .eq("deck_id", deckId)
        .eq("question_hash", hash);
      return NextResponse.json({ ok: true });
    }

    const type =
      action === "explained" || reviewType === "explained"
        ? "explained"
        : "failed";

    const { data: existing } = await supabase
      .from("question_reviews")
      .select("id, times_seen, review_type")
      .eq("user_id", user.id)
      .eq("deck_id", deckId)
      .eq("question_hash", hash)
      .maybeSingle();

    if (existing) {
      const mergedType =
        existing.review_type === "failed" || type === "failed"
          ? "failed"
          : "explained";

      await supabase
        .from("question_reviews")
        .update({
          times_seen: existing.times_seen + 1,
          last_seen_at: new Date().toISOString(),
          review_type: mergedType,
          correct_answer,
          options,
          hint: hint ?? "",
          explanation: explanation ?? "",
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("question_reviews").insert({
        user_id: user.id,
        deck_id: deckId,
        question,
        question_hash: hash,
        correct_answer,
        options,
        hint: hint ?? "",
        explanation: explanation ?? "",
        review_type: type,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
