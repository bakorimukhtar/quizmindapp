"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Deck } from "@/types";
import BottomNav from "@/components/BottomNav";
import DeckCard from "@/components/DeckCard";
import { DeckGridSkeleton } from "@/components/PageSkeleton";

type DeckWithCount = Deck & { question_count: number };

export default function DecksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<DeckWithCount[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setDecks(
        (data || []).map((d) => ({
          id: d.id,
          user_id: d.user_id,
          title: d.title,
          source_filename: d.source_filename,
          last_studied_at: d.last_studied_at,
          created_at: d.created_at,
          question_count: 10,
        }))
      );
      setLoading(false);
    };

    load();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <motion.div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tighter">My Decks</h1>
          <Link
            href="/create"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600"
          >
            <PlusCircle size={18} /> New
          </Link>
        </motion.div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {loading ? (
          <DeckGridSkeleton />
        ) : decks.length === 0 ? (
          <motion.div className="text-center py-20">
            <p className="text-slate-400 mb-6">No decks yet. Create your first one!</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold"
            >
              <PlusCircle size={18} /> Create Deck
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="decks" />
    </div>
  );
}
