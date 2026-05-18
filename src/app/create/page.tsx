"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusCircle, Upload, FileText } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import LoadingModal from "@/components/LoadingModal";

export default function CreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const handleFile = (file: File | null) => {
    if (!file) return;
    const valid =
      file.type === "application/pdf" ||
      file.type === "text/plain" ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".txt");

    if (!valid) {
      setError("Please upload a PDF or TXT file.");
      return;
    }

    setError(null);
    setFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleSubmit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setProcessing(true);
    setError(null);
    setStatus("Reading your document...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());

      setStatus("Saving your deck...");

      const res = await fetch("/api/decks/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create deck");
      }

      setStatus("Done! Redirecting...");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProcessing(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 overflow-x-hidden">
      <LoadingModal open={processing} message={status || "Processing your file..."} />

      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter">
            Create New Deck
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 sm:pt-12 w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <PlusCircle size={40} className="text-blue-600 sm:w-12 sm:h-12" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Upload Course Material</h2>
          <p className="text-slate-600 mb-8 text-sm sm:text-base px-2">
            PDF or plain text saved to your library. Each quiz session generates
            10 fresh AI questions — missed topics come back for review.
          </p>
        </motion.div>

        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-5 w-full min-w-0 overflow-hidden">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Deck Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology - Cell Structure"
              className="w-full min-w-0 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full min-w-0 py-6 sm:py-8 px-3 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition flex flex-col items-center gap-2 overflow-hidden"
          >
            {fileName ? (
              <>
                <FileText className="text-blue-600 shrink-0" size={32} />
                <span className="font-medium text-slate-800 text-sm sm:text-base text-center break-all line-clamp-3 max-w-full px-1">
                  {fileName}
                </span>
                <span className="text-sm text-slate-500">Tap to change file</span>
              </>
            ) : (
              <>
                <Upload className="text-slate-400 shrink-0" size={32} />
                <span className="font-medium text-slate-700 text-sm sm:text-base">
                  Choose File (PDF / TXT)
                </span>
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl break-words">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!fileName || processing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-lg font-semibold transition"
          >
            Save Deck
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Powered by Gemini Flash • Free tier
        </p>
      </div>

      <BottomNav activeTab="create" />
    </div>
  );
}
