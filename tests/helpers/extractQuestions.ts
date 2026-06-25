import { extractQuestionsFromRawText, readPdfDumpText } from "../../scripts/extract-questions-core.mjs";
import type { Question } from "../../src/types";

export function extractQuestionsFromText(): Question[] {
  return extractQuestionsFromRawText(readPdfDumpText()) as Question[];
}
