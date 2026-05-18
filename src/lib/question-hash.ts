import { createHash } from "crypto";

export function questionHash(question: string): string {
  return createHash("md5").update(question.trim().toLowerCase()).digest("hex");
}
