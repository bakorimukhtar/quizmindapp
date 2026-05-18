import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractRelevantContext } from "@/lib/extract-context";
import type { GeneratedQuestion } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const QUESTION_COUNT = 10;
const MAX_INPUT_CHARS = 12_000;

/** Stable models on Google AI Studio (2025+) — tried in order */
const DEFAULT_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
] as const;

export interface GenerateOptions {
  count?: number;
  avoidQuestions?: string[];
  extraInstructions?: string;
}

function getModelChain(): string[] {
  const custom = process.env.GEMINI_MODEL?.trim();
  const defaults = [...DEFAULT_MODEL_CHAIN];
  if (!custom) return defaults;
  return [custom, ...defaults.filter((m) => m !== custom)];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetrySeconds(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (match) return Math.min(Math.ceil(parseFloat(match[1])) + 2, 60);
  return 25;
}

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("429") ||
    /quota exceeded/i.test(msg) ||
    /too many requests/i.test(msg)
  );
}

function quotaUserMessage(): string {
  return (
    "Gemini free API quota is used up for now. Wait 1–2 minutes and try again, " +
    "upload a shorter PDF/TXT, or set GEMINI_MODEL=gemini-2.0-flash-lite in .env.local."
  );
}

function buildPrompt(text: string, options: GenerateOptions): string {
  const count = options.count ?? QUESTION_COUNT;
  let prompt = `Analyze this study material and generate exactly ${count} multiple-choice questions.
Each object must have: "question", "correct_answer", "options" (4 strings including correct), "hint", "explanation".
Return ONLY a JSON array of ${count} objects.`;

  if (options.avoidQuestions?.length) {
    const list = options.avoidQuestions
      .slice(0, 40)
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    prompt += `\n\nDo NOT repeat or closely rephrase these questions the student already saw:\n${list}`;
  }

  if (options.extraInstructions) {
    prompt += `\n\n${options.extraInstructions}`;
  }

  return `${prompt}\n\n---\n\n${text}`;
}

async function generateWithModel(
  modelName: string,
  prompt: string,
  json = true
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: json ? { responseMimeType: "application/json" } : undefined,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithRetries(
  modelName: string,
  prompt: string,
  json = true
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await generateWithModel(modelName, prompt, json);
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error) && attempt === 0) {
        await sleep(
          parseRetrySeconds(error instanceof Error ? error.message : "") * 1000
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export function normalizeQuestions(
  parsed: GeneratedQuestion[],
  count: number
): GeneratedQuestion[] {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI did not return valid questions. Try again.");
  }

  return parsed.slice(0, count).map((q, i) => {
    if (!q.question || !q.correct_answer || !Array.isArray(q.options)) {
      throw new Error(`Invalid question at index ${i}`);
    }
    const options = q.options.slice(0, 4);
    if (!options.includes(q.correct_answer)) {
      options[0] = q.correct_answer;
    }
    return {
      question: q.question,
      correct_answer: q.correct_answer,
      options,
      hint: q.hint || "Think about the core concept in the material.",
      explanation: q.explanation || q.correct_answer,
    };
  });
}

export async function generateQuestionsFromText(
  text: string,
  options: GenerateOptions = {}
): Promise<GeneratedQuestion[]> {
  const trimmed = text.trim().slice(0, MAX_INPUT_CHARS);
  if (trimmed.length < 100) {
    throw new Error(
      "Not enough text to generate questions. Upload a longer document."
    );
  }

  const count = options.count ?? QUESTION_COUNT;
  const prompt = buildPrompt(trimmed, options);
  const models = getModelChain();
  const errors: string[] = [];

  for (const modelName of models) {
    try {
      const raw = await generateWithRetries(modelName, prompt);
      return normalizeQuestions(JSON.parse(raw) as GeneratedQuestion[], count);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${modelName}: ${msg.slice(0, 120)}`);
      if (!isRateLimitError(error)) {
        throw error instanceof Error
          ? error
          : new Error("Failed to generate questions.");
      }
    }
  }

  if (errors.every((e) => e.includes("429") || /quota/i.test(e))) {
    throw new Error(quotaUserMessage());
  }

  const summary = errors.slice(0, 2).join(" | ");
  throw new Error(
    `Could not generate questions after trying ${models.length} models. ${summary}. ` +
      `Set GEMINI_MODEL=gemini-2.5-flash in .env.local or check https://ai.google.dev/gemini-api/docs/rate-limits`
  );
}

export type ExplanationLevel = "eli11" | "eli5";

/** Faster, smaller models for tutor explanations */
const EXPLAIN_MODEL_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
] as const;

export interface ExplainParams {
  sourceText: string;
  question: string;
  correctAnswer: string;
  options: string[];
  level: ExplanationLevel;
  previousExplanation?: string;
}

function getExplainModelChain(): string[] {
  const custom = process.env.GEMINI_MODEL?.trim();
  const liteFirst = [...EXPLAIN_MODEL_CHAIN];
  if (!custom) return liteFirst;
  return [custom, ...liteFirst.filter((m) => m !== custom)];
}

function buildExplanationPrompt(params: ExplainParams): string {
  const context = extractRelevantContext(
    params.sourceText,
    params.question,
    2200
  );

  const optionsBlock = params.options
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)
    .join("\n");

  const levelBlock =
    params.level === "eli5"
      ? `Style: Explain Like I'm 5. Very simple words, one playful analogy, 2–3 short sentences.`
      : `Style: Explain Like I'm 11. Clear steps, plain language, 3–4 sentences.`;

  const retryBlock =
    params.level === "eli5" && params.previousExplanation
      ? `\nThe student did not understand this earlier explanation—simplify further:\n"${params.previousExplanation}"`
      : "";

  return `You are a professional QuizMind tutor. Teach the concept behind this quiz item.

Question: ${params.question}

Options:
${optionsBlock}

Correct answer: ${params.correctAnswer}

${levelBlock}
${retryBlock}

Internal reference (for factual accuracy only—never mention or allude to it):
${context || "(use the question and correct answer)"}

Write directly to the student.

Format (plain text, no markdown):
1) Start with one sentence: "Option X is the correct answer because ..." (use the real option letter).
2) Then one sentence per wrong option: "Option Y is incorrect because ..." or "Option Y is wrong because ..."

Forbidden phrases (never use): study material, uploaded, document, PDF, passage, text says, according to, as shown in, the material, course notes, from the reading.

No bullet points or headings. Start immediately with Option X.`;
}

/** Remove meta references the model sometimes adds anyway */
export function polishExplanation(text: string): string {
  let out = text.trim();

  const banned = [
    /^the (study )?material (shows|states|tells us|explains|indicates|says|demonstrates)[^.]*\.\s*/i,
    /^according to (the )?(study )?material[,.\s]*/i,
    /^as (shown|mentioned|stated|described) in (the )?(study )?material[,.\s]*/i,
    /^based on (the )?(study )?material[,.\s]*/i,
    /^from (the )?(study )?material[,.\s]*/i,
    /^in (the )?(study )?material[,.\s]*/i,
    /^the (uploaded )?document (shows|states)[^.]*\.\s*/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const re of banned) {
      const next = out.replace(re, "");
      if (next !== out) {
        out = next.trim();
        changed = true;
      }
    }
  }

  return out;
}

async function generateExplanationOnce(
  modelName: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.35,
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateExplanation(
  params: ExplainParams
): Promise<string> {
  const prompt = buildExplanationPrompt(params);
  const models = getExplainModelChain();
  const maxTokens = params.level === "eli5" ? 180 : 280;
  const errors: string[] = [];

  for (const modelName of models) {
    try {
      const raw = await generateExplanationOnce(modelName, prompt, maxTokens);
      const cleaned = polishExplanation(raw);
      if (!cleaned) throw new Error("Empty explanation");
      return cleaned;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${modelName}: ${msg.slice(0, 80)}`);
      if (!isRateLimitError(error)) {
        throw error instanceof Error
          ? error
          : new Error("Failed to generate explanation.");
      }
    }
  }

  if (errors.every((e) => e.includes("429") || /quota/i.test(e))) {
    throw new Error(quotaUserMessage());
  }

  throw new Error("Could not generate explanation. Try again in a moment.");
}
