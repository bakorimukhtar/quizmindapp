"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo, type ReactNode } from "react";

const LABELS = ["A", "B", "C", "D"];

type SegmentKind = "correct" | "wrong" | "other";

interface Segment {
  letter?: string;
  kind: SegmentKind;
  text: string;
}

function correctLetterForAnswer(
  correctAnswer: string,
  options: string[]
): string | null {
  const idx = options.findIndex((o) => o === correctAnswer);
  if (idx >= 0) return LABELS[idx] ?? null;
  const loose = options.findIndex(
    (o) => o.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  );
  return loose >= 0 ? LABELS[loose] ?? null : null;
}

function classifySegment(text: string): SegmentKind {
  const lower = text.toLowerCase();
  if (
    /\b(is|are)\s+(the\s+)?correct\b/.test(lower) ||
    /\bcorrect answer\b/.test(lower) ||
    /\bis right\b/.test(lower) ||
    /\bright answer\b/.test(lower)
  ) {
    return "correct";
  }
  if (
    /\b(incorrect|wrong|not correct|is not|isn't|aren't)\b/.test(lower) ||
    /\bnot the right\b/.test(lower)
  ) {
    return "wrong";
  }
  return "other";
}

function segmentExplanation(text: string): Segment[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/(?=Option\s+[A-D]\b)/i).filter(Boolean);

  if (parts.length <= 1 && !/^Option\s+[A-D]/i.test(trimmed)) {
    return [{ kind: "other", text: trimmed }];
  }

  return parts.map((part) => {
    const letterMatch = part.match(/^Option\s+([A-D])\b/i);
    const letter = letterMatch?.[1]?.toUpperCase();
    return {
      letter,
      kind: letter ? classifySegment(part) : "other",
      text: part.trim(),
    };
  });
}

function highlightOptionMentions(
  text: string,
  correctLetter: string | null
): ReactNode[] {
  const re = /\b(Option\s+([A-D]))\b/gi;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const [full, , letterRaw] = match;
    const letter = letterRaw.toUpperCase();
    const start = match.index;

    if (start > last) {
      nodes.push(text.slice(last, start));
    }

    const isCorrect = correctLetter === letter;
    nodes.push(
      <span
        key={`${start}-${letter}`}
        className={
          isCorrect
            ? "font-semibold text-emerald-300"
            : "font-semibold text-slate-300"
        }
      >
        {full}
      </span>
    );
    last = start + full.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length ? nodes : [text];
}

interface ExplanationRendererProps {
  text: string;
  correctAnswer: string;
  options: string[];
}

export default function ExplanationRenderer({
  text,
  correctAnswer,
  options,
}: ExplanationRendererProps) {
  const correctLetter = useMemo(
    () => correctLetterForAnswer(correctAnswer, options),
    [correctAnswer, options]
  );

  const segments = useMemo(() => segmentExplanation(text), [text]);

  const correctSegment = segments.find((s) => s.kind === "correct");
  const wrongSegments = segments.filter((s) => s.kind === "wrong");
  const leadSegments = segments.filter((s) => s.kind === "other");

  const correctOptionText =
    options.find((o) => o === correctAnswer) ?? correctAnswer;

  const showFallback =
    !correctSegment &&
    wrongSegments.length === 0 &&
    segments.length === 1 &&
    segments[0].kind === "other";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-400/50 bg-emerald-500/15 p-4 shadow-sm shadow-emerald-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300/90">
              Correct answer
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {correctLetter && (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-md">
                  {correctLetter}
                </span>
              )}
              <span className="text-base font-semibold leading-snug text-emerald-50">
                {correctOptionText}
              </span>
            </div>
            {correctSegment ? (
              <p className="text-sm leading-relaxed text-emerald-50/95">
                {highlightOptionMentions(
                  correctSegment.text.replace(
                    /^Option\s+[A-D]\s+is\s+(the\s+)?correct\s+answer\s+because\s*/i,
                    ""
                  ),
                  correctLetter
                )}
              </p>
            ) : showFallback ? (
              <p className="text-sm leading-relaxed text-emerald-50/95">
                {highlightOptionMentions(segments[0].text, correctLetter)}
              </p>
            ) : leadSegments[0] ? (
              <p className="text-sm leading-relaxed text-emerald-50/95">
                {highlightOptionMentions(leadSegments[0].text, correctLetter)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {leadSegments.length > (correctSegment ? 0 : 1) && (
        <div className="rounded-xl border border-sky-400/20 bg-sky-950/30 px-4 py-3">
          {leadSegments.slice(correctSegment ? 0 : 1).map((seg, i) => (
            <p key={i} className="text-sm leading-relaxed text-sky-50/90">
              {highlightOptionMentions(seg.text, correctLetter)}
            </p>
          ))}
        </div>
      )}

      {wrongSegments.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Why other options don&apos;t fit
          </p>
          {wrongSegments.map((seg, i) => (
            <div
              key={`${seg.letter}-${i}`}
              className="flex gap-3 rounded-xl border border-rose-500/25 bg-rose-950/25 px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-200">
                {seg.letter ? (
                  <span className="text-sm font-bold">{seg.letter}</span>
                ) : (
                  <XCircle size={16} className="text-rose-300/80" />
                )}
              </div>
              <p className="pt-0.5 text-sm leading-relaxed text-slate-200/90">
                {highlightOptionMentions(
                  seg.text.replace(
                    /^Option\s+[A-D]\s+is\s+(also\s+)?(incorrect|wrong)\s+because\s*/i,
                    ""
                  ),
                  correctLetter
                )}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
