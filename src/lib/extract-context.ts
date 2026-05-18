/** Pull a short, question-relevant slice of deck text for faster, focused AI calls. */
export function extractRelevantContext(
  sourceText: string,
  question: string,
  maxLen = 2200
): string {
  const text = sourceText.trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;

  const keywords = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 40);

  if (paragraphs.length === 0) return text.slice(0, maxLen);

  const ranked = paragraphs
    .map((p) => {
      const lower = p.toLowerCase();
      const score = keywords.reduce(
        (s, w) => s + (lower.includes(w) ? 1 : 0),
        0
      );
      return { p: p.trim(), score };
    })
    .sort((a, b) => b.score - a.score);

  let out = "";
  for (const { p } of ranked) {
    if (out.length + p.length + 2 > maxLen) break;
    out += `${p}\n\n`;
  }

  if (out.length < 150) return text.slice(0, maxLen);
  return out.trim().slice(0, maxLen);
}
