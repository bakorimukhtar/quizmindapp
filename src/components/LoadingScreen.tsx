"use client";
import { motion } from "framer-motion";
import QuizMindIcon from "@/components/QuizMindIcon";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Preparing your quiz experience",
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center space-y-10 relative z-10"
      >
        {/* Logo Section with Staggered Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-2">
            {/* Premium Icon - Brain/Quiz Symbol */}
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <QuizMindIcon size={52} />
            </motion.div>

            <h1 className="text-5xl font-bold tracking-[-3px] text-slate-900">
              QUIZ<span className="text-blue-600">MIND</span>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="text-sm font-medium tracking-widest text-slate-500 uppercase"
          >
            INTELLIGENT ASSESSMENT
          </motion.p>
        </motion.div>

        {/* Professional Loader */}
        <div className="relative flex items-center justify-center">
          {/* Outer Ring */}
          <svg width="88" height="88" viewBox="0 0 88 88" className="text-slate-200">
            <circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>

          {/* Animated Spinner */}
          <motion.svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            className="absolute text-blue-600"
          >
            <motion.circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0.2, rotate: 0 }}
              animate={{
                pathLength: [0.2, 0.85, 0.2],
                rotate: [0, 360],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>

          {/* Inner Pulse */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute w-6 h-6 bg-blue-600/10 rounded-full"
          />
        </div>

        {/* Loading Text with Elegant Dots */}
        <div className="flex flex-col items-center space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 font-medium text-lg tracking-tight"
          >
            {message}
          </motion.p>

          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-1.5 h-1.5 bg-blue-600 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom branding / version hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 text-xs text-slate-400 font-mono tracking-widest"
      >
        v1.0 • POWERED BY INTELLIGENCE
      </motion.div>
    </div>
  );
}