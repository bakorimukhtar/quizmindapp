import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const XP_PER_CORRECT = 10;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: fetchError?.message || "Profile not found" },
        { status: 404 }
      );
    }

    const newXp = (profile.total_xp ?? 0) + XP_PER_CORRECT;

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ total_xp: newXp })
      .eq("id", user.id)
      .select("total_xp")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ total_xp: updated.total_xp });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update XP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
