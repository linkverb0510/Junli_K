import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extractQuestionsFromRawText, readPdfDumpText } from "./extract-questions-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "data", "questions.json");
const dumpPath = path.join(rootDir, "pdf_dump.txt");
const sourcePdfPath = path.join(rootDir, "26春军理复习题集.pdf");
const extractorPath = path.join(rootDir, "scripts", "extract-pdf-text.py");

function detectPythonCommand() {
  const candidates = [
    {
      command: "C:\\Users\\李世旺\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
      args: [],
    },
    { command: process.env.PYTHON, args: [] },
    { command: "python", args: [] },
    { command: "py", args: ["-3"] },
  ].filter((candidate) => candidate.command);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate.command, [...candidate.args, "--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function readSourceText() {
  if (fs.existsSync(sourcePdfPath)) {
    const python = detectPythonCommand();
    if (python) {
      try {
        const rawText = execFileSync(
          python.command,
          [...python.args, extractorPath, sourcePdfPath],
          { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
        );
        fs.writeFileSync(dumpPath, rawText, "utf8");
        return rawText;
      } catch {
        // Fall through to the checked-in dump when python or pypdf is unavailable.
      }
    }
  }

  return readPdfDumpText();
}

const questions = extractQuestionsFromRawText(readSourceText());
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), "utf8");

console.log(`Wrote ${questions.length} questions to ${outputPath}`);
