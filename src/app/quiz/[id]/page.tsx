"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  HelpCircle,
  Eye,
  BookOpen,
  CheckCircle2,
  Trophy,
  Sparkles,
  RotateCcw,
  Zap,
  GraduationCap,
  Baby,
  Loader2,
} from "lucide-react";
import type { ExplanationLevel } from "@/lib/gemini";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { shuffleArray } from "@/lib/shuffle";
import { getLevel, getLevelProgress } from "@/lib/xp";
import { QUESTION_COUNT } from "@/lib/gemini";
import type { SessionQuestion } from "@/types";
import LoadingModal from "@/components/LoadingModal";
import ExplanationRenderer from "@/components/ExplanationRenderer";

type OptionState = "idle" | "correct" | "wrong" | "revealed";

const LABELS = ["A", "B", "C", "D"];

async function trackProgress(
  deckId: string,
  q: SessionQuestion,
  action: "failed" | "explained" | "resolved"
) {
  await fetch("/api/quiz/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deckId,
      action,
      question: q.question,
      correct_answer: q.correct_answer,
      options: q.options,
      hint: q.hint,
      explanation: q.explanation,
      reviewType: action === "explained" ? "explained" : undefined,
    }),
  });
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: deckId } = use(params);
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Generating your personalized quiz..."
  );
  const [deckTitle, setDeckTitle] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [optionState, setOptionState] = useState<OptionState>("idle");
  const [showHint, setShowHint] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explainLevel, setExplainLevel] = useState<ExplanationLevel | null>(
    null
  );
  const [explainError, setExplainError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [explainedTracked, setExplainedTracked] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const startSession = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setFinished(false);
    setCurrentIndex(0);
    setScore(0);
    setSessionXp(0);
    setLoadingMessage("Generating fresh questions with AI...");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .single();
    setTotalXp(profile?.total_xp ?? 0);

    const res = await fetch(`/api/quiz/${deckId}/session`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not start quiz");
      setLoading(false);
      return;
    }

    setDeckTitle(data.title);
    setQuestions(data.questions);
    setReviewCount(data.reviewCount ?? 0);
    if (data.questions?.[0]) {
      setShuffledOptions(shuffleArray(data.questions[0].options));
    }
    setLoading(false);
  }, [deckId, router, supabase]);

  useEffect(() => {
    if (!supabase) return;
    startSession();
  }, [supabase, startSession]);

  useEffect(() => {
    if (current) {
      setShuffledOptions(shuffleArray(current.options));
      setSelected(null);
      setOptionState("idle");
      setShowHint(false);
      setShowExplain(false);
      setAiExplanation(null);
      setExplainLevel(null);
      setExplainError(null);
      setExplainLoading(false);
      setRevealed(false);
      setExplainedTracked(false);
    }
  }, [currentIndex, current]);

  const fetchExplanation = async (level: ExplanationLevel) => {
    if (!current) return;

    setExplainError(null);
    setShowExplain(true);
    setExplainLoading(true);

    // Show something immediately while the tutor generates a richer answer
    if (level === "eli11" && current.explanation) {
      setAiExplanation(current.explanation);
      setExplainLevel("eli11");
    }

    try {
      const res = await fetch(`/api/quiz/${deckId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: current.question,
          correctAnswer: current.correct_answer,
          options: current.options,
          level,
          previousExplanation:
            level === "eli5" ? aiExplanation ?? undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load explanation");

      setAiExplanation(data.explanation);
      setExplainLevel(level);

      if (!explainedTracked) {
        setExplainedTracked(true);
        void trackProgress(deckId, current, "explained");
      }
    } catch (err) {
      setExplainError(
        err instanceof Error ? err.message : "Failed to load explanation"
      );
      if (level === "eli11" && !aiExplanation && current.explanation) {
        setAiExplanation(current.explanation);
        setExplainLevel("eli11");
      }
    } finally {
      setExplainLoading(false);
    }
  };

  const awardXp = async () => {
    const res = await fetch("/api/profile/xp", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setTotalXp(data.total_xp);
      setSessionXp((s) => s + 10);
    }
  };

  const handleSelect = async (option: string) => {
    if (!current || optionState !== "idle" || revealed) return;

    setSelected(option);
    const isCorrect = option === current.correct_answer;

    if (isCorrect) {
      setOptionState("correct");
      setScore((s) => s + 1);
      await awardXp();
      if (current.isReview) {
        await trackProgress(deckId, current, "resolved");
      }
    } else {
      setOptionState("wrong");
      await trackProgress(deckId, current, "failed");
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    setOptionState("revealed");
    if (!showExplain && !aiExplanation) {
      fetchExplanation("eli11");
    }
  };

  const handleExplain = () => {
    if (showExplain && explainLevel === "eli11" && aiExplanation) {
      setShowExplain(false);
      return;
    }
    fetchExplanation("eli11");
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const optionClass = (option: string) => {
    const base =
      "w-full text-left px-4 py-4 rounded-2xl border-2 font-medium transition-all text-[15px] flex items-center gap-3";

    if (revealed || optionState === "revealed") {
      if (option === current?.correct_answer)
        return `${base} border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm`;
      if (option === selected)
        return `${base} border-red-400 bg-red-50 text-red-900`;
      return `${base} border-slate-200/80 bg-white/80 text-slate-700`;
    }

    if (optionState === "idle") {
      return `${base} border-white/60 bg-white/90 hover:border-indigo-300 hover:shadow-md text-slate-800 backdrop-blur-sm active:scale-[0.99]`;
    }

    if (option === current?.correct_answer)
      return `${base} border-emerald-500 bg-emerald-50 text-emerald-900`;
    if (option === selected)
      return `${base} border-red-500 bg-red-50 text-red-900`;
    return `${base} border-slate-100 bg-slate-50/80 text-slate-400`;
  };

  const level = useMemo(() => getLevel(totalXp), [totalXp]);
  const levelProgress = useMemo(() => getLevelProgress(totalXp), [totalXp]);

  if (error && !loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl border border-white/20"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Session Complete</h1>
          <p className="text-slate-500 text-sm mb-6">{deckTitle}</p>
          <p className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {pct}%
          </p>
          <p className="text-slate-600 mt-2 mb-1">
            {score} of {questions.length} correct
          </p>
          {sessionXp > 0 && (
            <p className="text-emerald-600 font-semibold text-sm mb-6 flex items-center justify-center gap-1">
              <Zap size={16} /> +{sessionXp} XP earned
            </p>
          )}
          <p className="text-xs text-slate-400 mb-6">
            Missed or explained topics will appear in your next session.
          </p>
          <div className="space-y-3">
            <button
              onClick={startSession}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> New Session
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      <LoadingModal open={loading} message={loadingMessage} />

      <motion.div className="h-1 bg-white/10 w-full shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 to-violet-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35 }}
        />
      </motion.div>

      <header className="px-4 pt-4 pb-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">
              Level {level}
            </p>
            <motion.div className="h-1.5 bg-white/10 rounded-full mt-1 mx-8 overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                animate={{ width: `${levelProgress}%` }}
              />
            </motion.div>
          </div>

          <span className="text-sm font-bold text-white tabular-nums bg-white/10 px-3 py-1.5 rounded-xl">
            {currentIndex + 1}/{questions.length || QUESTION_COUNT}
          </span>
        </div>
        <p className="text-center text-sm text-indigo-200/90 mt-2 truncate max-w-2xl mx-auto px-2">
          {deckTitle}
        </p>
        {reviewCount > 0 && !loading && (
          <p className="text-center text-xs text-amber-300/90 mt-1 flex items-center justify-center gap-1">
            <Sparkles size={12} /> Includes {reviewCount} review question
            {reviewCount > 1 ? "s" : ""} from last time
          </p>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {current && !loading && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-3 py-1 rounded-full">
                  Question {currentIndex + 1}
                </span>
                {current.isReview && (
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      current.reviewType === "failed"
                        ? "bg-red-500/20 text-red-200"
                        : "bg-sky-500/20 text-sky-200"
                    }`}
                  >
                    {current.reviewType === "failed" ? "Review · Missed" : "Review · Studied"}
                  </span>
                )}
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {current.question}
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {shuffledOptions.map((option, idx) => (
                  <button
                    key={option}
                    disabled={optionState !== "idle" && !revealed}
                    onClick={() => handleSelect(option)}
                    className={optionClass(option)}
                  >
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                      {LABELS[idx] ?? "?"}
                    </span>
                    <span className="flex-1 text-left">{option}</span>
                  </button>
                ))}
              </div>

              <motion.div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition ${
                    showHint
                      ? "bg-amber-500 text-white"
                      : "bg-white/10 text-amber-100 hover:bg-white/15"
                  }`}
                >
                  <HelpCircle size={18} /> Hint
                </button>
                <button
                  type="button"
                  onClick={handleReveal}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold bg-white/10 text-violet-100 hover:bg-white/15"
                >
                  <Eye size={18} /> Reveal
                </button>
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={explainLoading}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition ${
                    showExplain
                      ? "bg-sky-500 text-white"
                      : "bg-white/10 text-sky-100 hover:bg-white/15"
                  } disabled:opacity-60`}
                >
                  <BookOpen size={18} /> Explain
                </button>
              </motion.div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-4 bg-amber-500/15 border border-amber-400/30 rounded-2xl text-amber-50 text-sm"
                  >
                    <strong className="text-amber-200">Hint · </strong>
                    {current.hint}
                  </motion.div>
                )}
                {showExplain && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-sky-400/20 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {explainLevel === "eli5" ? (
                          <Baby size={18} className="text-pink-200" />
                        ) : (
                          <GraduationCap size={18} className="text-sky-200" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-100">
                          {explainLevel === "eli5"
                            ? "Explain Like I'm 5"
                            : explainLevel === "eli11"
                              ? "Explain Like I'm 11"
                              : "AI Tutor"}
                        </span>
                      </div>
                      {explainLoading && (
                        <span className="text-[10px] text-sky-200/70 animate-pulse">
                          Refining answer…
                        </span>
                      )}
                    </div>

                    <div className="p-4 text-sky-50 text-sm leading-relaxed">
                      {explainLoading && !aiExplanation && (
                        <div className="flex items-center gap-3 py-4 justify-center text-sky-200">
                          <Loader2 size={22} className="animate-spin" />
                          <span>
                            {explainLevel === "eli5"
                              ? "Simplifying…"
                              : "Preparing your explanation…"}
                          </span>
                        </div>
                      )}

                      {explainError && !explainLoading && (
                        <p className="text-red-200 text-sm">{explainError}</p>
                      )}

                      {aiExplanation && current && (
                        <ExplanationRenderer
                          text={aiExplanation}
                          correctAnswer={current.correct_answer}
                          options={current.options}
                        />
                      )}

                      {!aiExplanation && !explainLoading && !explainError && (
                        <p className="text-sky-200/80 italic">
                          Tap Explain for a clear breakdown of this question.
                        </p>
                      )}
                    </div>

                    {aiExplanation &&
                      explainLevel === "eli11" &&
                      !explainLoading && (
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() => fetchExplanation("eli5")}
                            disabled={explainLoading}
                            className="w-full py-3 rounded-xl bg-pink-500/25 border border-pink-400/40 text-pink-50 text-sm font-semibold hover:bg-pink-500/35 transition flex items-center justify-center gap-2"
                          >
                            <Baby size={18} />
                            Still confused? Explain like I&apos;m 5
                          </button>
                        </div>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>

              {(optionState === "correct" ||
                optionState === "wrong" ||
                optionState === "revealed") && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNext}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 hover:opacity-95 mt-auto"
                >
                  <CheckCircle2 size={20} />
                  {currentIndex < questions.length - 1
                    ? "Continue"
                    : "Finish Session"}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
