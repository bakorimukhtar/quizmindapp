// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export function createClient() {
  const { url, key } = getSupabaseEnv();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them in .env.local (local) or Vercel → Project Settings → Environment Variables, then redeploy."
    );
  }

  return createBrowserClient(url, key);
}