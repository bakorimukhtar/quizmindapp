import pdfParse from "pdf-parse";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType === "text/plain" || lower.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }

  throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
}
