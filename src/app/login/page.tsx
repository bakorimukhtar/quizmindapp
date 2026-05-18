"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";   // ← Updated import
import { motion, AnimatePresence } from "framer-motion";
import LoadingModal from "@/components/LoadingModal";
import { setAuthLoading } from "@/lib/auth-loading";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto redirect if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (error) throw error;

        setMessage({ 
          type: "success", 
          text: "Account created successfully! Please check your email to confirm." 
        });

        setLoading(false);
        setTimeout(() => {
          setIsSignUp(false);
          setFirstName("");
          setLastName("");
          setPassword("");
          setConfirmPassword("");
          setMessage(null);
        }, 2500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        setAuthLoading();
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <LoadingModal
        open={loading}
        message={isSignUp ? "Creating your account..." : "Signing you in..."}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-slate-100">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">Q</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tighter text-slate-900">
                QUIZ<span className="text-blue-600">MIND</span>
              </h1>
            </div>
            <p className="text-slate-600">
              {isSignUp 
                ? "Create your account to get started" 
                : "Sign in to continue your learning journey"}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          First Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Mukhtar"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          Last Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Abdullahi"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="mukhtar@school.edu.ng"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  {isSignUp ? "Create Password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {message && (
                <div
                  className={`text-sm p-4 rounded-2xl text-center ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-semibold rounded-2xl transition-all duration-200 text-base shadow-lg shadow-blue-500/20 active:scale-[0.985]"
              >
                {loading 
                  ? "Processing..." 
                  : isSignUp 
                    ? "Create Account" 
                    : "Sign In"
                }
              </button>
            </form>
          </div>

          {/* Toggle */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center rounded-b-3xl">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2026 QuizMind • All Rights Reserved
        </p>
      </motion.div>
    </div>
  );
}