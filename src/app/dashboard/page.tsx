"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLevel, getLevelProgress } from "@/lib/xp";
import type { Deck, Profile } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import BottomNav from "@/components/BottomNav";
import DeckCard from "@/components/DeckCard";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { consumeAuthLoading } from "@/lib/auth-loading";

type DeckWithCount = Deck & { question_count: number };

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [showAuthSplash, setShowAuthSplash] = useState(false);
  const [fullName, setFullName] = useState("Student");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentDecks, setRecentDecks] = useState<DeckWithCount[]>([]);
  const [allDecks, setAllDecks] = useState<DeckWithCount[]>([]);

  useEffect(() => {
    setShowAuthSplash(consumeAuthLoading());
  }, []);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const name = user.user_metadata?.first_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
        : user.email?.split("@")[0] || "Student";
      setFullName(name);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      const { data: decks } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const mapped: DeckWithCount[] = (decks || []).map((d) => ({
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        source_filename: d.source_filename,
        last_studied_at: d.last_studied_at,
        created_at: d.created_at,
        question_count: 10,
      }));

      setAllDecks(mapped);

      const recent = [...mapped]
        .filter((d) => d.last_studied_at)
        .sort(
          (a, b) =>
            new Date(b.last_studied_at!).getTime() -
            new Date(a.last_studied_at!).getTime()
        )
        .slice(0, 3);

      setRecentDecks(recent.length > 0 ? recent : mapped.slice(0, 3));
      setLoading(false);
    };

    load();
  }, [router, supabase]);

  if (showAuthSplash && loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const totalXp = profile?.total_xp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pb-24"
    >
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <motion.div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Q</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900">
              QUIZ<span className="text-blue-600">MIND</span>
            </h1>
          </motion.div>

          <div className="bg-emerald-100 text-emerald-700 text-xs font-medium px-4 py-1.5 rounded-full">
            Level {level} • {totalXp} XP
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {greeting}, {fullName.split(" ")[0]}!
          </h2>
          <p className="text-slate-600 mb-8">Continue your learning journey</p>

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
            <motion.div className="flex justify-between mb-4">
              <p className="text-sm font-semibold text-slate-500">YOUR PROGRESS</p>
              <p className="text-sm text-slate-500">
                {progress} / 100 XP to Level {level + 1}
              </p>
            </motion.div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Link
            href="/create"
            className="flex items-center justify-center gap-2 w-full py-4 mb-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg transition active:scale-[0.99]"
          >
            <PlusCircle size={22} />
            Create New Deck
          </Link>

          {recentDecks.length > 0 && (
            <>
              <h3 className="font-semibold text-slate-900 mb-4">Jump Back In</h3>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {recentDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} variant="compact" />
                ))}
              </motion.div>
            </>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">My Decks</h3>
            {allDecks.length > 6 && (
              <Link href="/decks" className="text-sm text-blue-600 font-medium">
                View all
              </Link>
            )}
          </div>

          {allDecks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <p className="text-slate-500 mb-4">
                No decks yet. Upload course material to get started.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold"
              >
                <PlusCircle size={18} /> Create Your First Deck
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDecks.slice(0, 6).map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
            </>
          )}
        </motion.div>
      </div>

      <BottomNav activeTab="home" />
    </motion.div>
  );
}
