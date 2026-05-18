"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import LoadingScreen from "@/components/LoadingScreen";

/** Minimum time to show the welcome splash before redirecting */
const SPLASH_DURATION_MS = 15_000;

export default function Home() {
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    if (!supabase) return;

    const checkUser = async () => {
      const startedAt = Date.now();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, SPLASH_DURATION_MS - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkUser();
  }, [router, supabase]);

  return <LoadingScreen message="Welcome to QuizMind" />;
}
