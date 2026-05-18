"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { formatLastStudied } from "@/lib/xp";
import type { Deck } from "@/types";

interface DeckCardProps {
  deck: Deck & { question_count?: number };
  variant?: "default" | "compact";
}

export default function DeckCard({ deck, variant = "default" }: DeckCardProps) {
  const router = useRouter();
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/quiz/${deck.id}`)}
        className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all text-left w-full"
      >
        <p className="font-medium text-lg text-slate-900">{deck.title}</p>
        <p className="text-sm text-slate-500 mt-1">
          10 questions / session • {formatLastStudied(deck.last_studied_at)}
        </p>
        <span className="mt-6 block w-full py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold text-center hover:bg-blue-700">
          Continue Learning
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all flex flex-col"
    >
      <motion.div className="flex items-start gap-3 mb-4">
        <motion.div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen className="text-blue-600" size={20} />
        </motion.div>
        <div>
          <p className="font-semibold text-lg text-slate-900 line-clamp-2">
            {deck.title}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            10 fresh questions each session
            {deck.last_studied_at &&
              ` • ${formatLastStudied(deck.last_studied_at)}`}
          </p>
        </div>
      </motion.div>
      <button
        onClick={() => router.push(`/quiz/${deck.id}`)}
        className="mt-auto w-full py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        Start Quiz
      </button>
    </motion.div>
  );
}
