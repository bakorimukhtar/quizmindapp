"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingModalProps {
  open: boolean;
  message?: string;
}

export default function LoadingModal({
  open,
  message = "Please wait...",
}: LoadingModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label="Loading"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 px-8 py-10 max-w-sm w-full text-center"
          >
            <motion.div
              className="mx-auto w-14 h-14 border-4 border-slate-200 border-t-blue-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />

            <div className="flex items-center justify-center gap-3 mt-5 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                QUIZ<span className="text-blue-600">MIND</span>
              </span>
            </div>

            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              {message}
            </p>

            <div className="flex justify-center gap-1.5 mt-5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
