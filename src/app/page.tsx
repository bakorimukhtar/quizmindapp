"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
