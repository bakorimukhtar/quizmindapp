"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { motion } from "framer-motion";
import { Edit2, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import LoadingModal from "@/components/LoadingModal";
import { getLevel } from "@/lib/xp";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = useSupabase();

  const fetchProfile = async () => {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setUsername(profileData.username || "");
      setBio(profileData.bio || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (supabase) fetchProfile();
  }, [supabase]);

  const saveProfile = async () => {
    if (!user || !supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setEditing(false);
      fetchProfile();
    } else {
      alert("Failed to save profile");
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(8);
    setSearchResults(data || []);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!supabase) return;
    await supabase.from('friends').insert({ user_id: user.id, friend_id: friendId });
    alert("Friend request sent!");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);
    if (error) {
      alert("Could not sign out. Please try again.");
      return;
    }
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <LoadingModal open={saving} message="Saving your profile..." />
      <LoadingModal open={loggingOut} message="Signing you out..." />
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold tracking-tighter">Profile</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 animate-pulse">
            <div className="w-28 h-28 mx-auto bg-slate-200 rounded-full mb-5" />
            <div className="h-6 bg-slate-200 rounded-xl w-40 mx-auto mb-3" />
            <div className="h-4 bg-slate-200 rounded-lg w-24 mx-auto" />
          </div>
        ) : (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 text-center">
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-6xl font-bold mb-5">
            {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "Q"}
          </div>

          <h2 className="text-2xl font-semibold">{profile?.full_name || "Student"}</h2>
          {profile?.username && <p className="text-blue-600">@{profile.username}</p>}
          <p className="mt-2 text-sm text-emerald-600 font-medium">
            Level {getLevel(profile?.total_xp ?? 0)} • {profile?.total_xp ?? 0} XP
          </p>
          {bio && <p className="mt-4 text-slate-600">{bio}</p>}

          <button onClick={() => setEditing(!editing)} className="mt-6 flex items-center gap-2 mx-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl">
            <Edit2 size={18} /> Edit Profile
          </button>

          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder:text-slate-500" placeholder="username" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-2xl h-24 bg-white text-slate-900 placeholder:text-slate-500" placeholder="Write something about yourself..." />
              </div>
              <button onClick={saveProfile} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-semibold">
                Save Changes
              </button>
            </motion.div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-60"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
        )}
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}