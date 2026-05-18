"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Browser-only Supabase client. Avoids calling createClient during
 * Next.js static prerender / build when env vars are not inlined yet.
 */
export function useSupabase(): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    setClient(createClient());
  }, []);

  return client;
}
