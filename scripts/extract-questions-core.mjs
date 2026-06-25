import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF_DUMP_PATH = path.join(ROOT_DIR, "pdf_dump.txt");

const CHAPTER_META = [
  { index: 1, numeral: "一", title: "国防基本理论" },
  { index: 2, numeral: "二", title: "国防法规与公民义务" },
  { index: 3, numeral: "三", title: "国防战略与武装力量" },
  { index: 4, numeral: "四", title: "国防动员与总体国家安全观" },
  { index: 5, numeral: "五", title: "军事思想" },
  { index: 6, numeral: "六", title: "新军事革命与信息化战争" },
  { index: 7, numeral: "七", title: "信息化装备" },
];

function countStars(starText) {
  return Math.max(1, Math.min(3, (starText.match(/★/g) ?? []).length));
}

function normalizeLines(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^=+ PAGE \d+ =+$/.test(line) && line !== "26 春军理复习题集" && !/^\d+$/.test(line) && line !== "AI生成");
}

function collectWrappedLines(lines, startIndex, stopPatterns) {
  const buffer = [lines[startIndex]];
  let cursor = startIndex + 1;

  while (cursor < lines.length && !stopPatterns.some((pattern) => pattern.test(lines[cursor]))) {
    buffer.push(lines[cursor]);
    cursor += 1;
  }

  return { text: buffer.join(" "), nextIndex: cursor };
}

function parseChoiceQuestions(lines, chapter) {
  const questions = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^(\d+)\.\s+(★[★☆]{2})\s+(.+)$/);
    if (!match) {
      index += 1;
      continue;
    }

    const number = Number(match[1]);
    const starLevel = countStars(match[2]);
    let prompt = match[3];
    const promptChunks = [];
    index += 1;
    while (index < lines.length && !/^[A-D]\.\s*/.test(lines[index]) && !/^(\d+)\.\s+(★[★☆]{2})\s+/.test(lines[index])) {
      promptChunks.push(lines[index]);
      index += 1;
    }
    if (promptChunks.length > 0) {
      prompt = `${prompt} ${promptChunks.join(" ")}`.replace(/\s+/g, " ").trim();
    }

    const options = [];
    while (index < lines.length && /^[A-D]\.\s*/.test(lines[index])) {
      const optionLine = lines[index];
      const optionKey = optionLine[0];
      let optionText = optionLine.slice(2).trim();
      index += 1;
      while (
        index < lines.length &&
        !/^[A-D]\.\s*/.test(lines[index]) &&
        !/^(\d+)\.\s+(★[★☆]{2})\s+/.test(lines[index])
      ) {
        optionText = `${optionText} ${lines[index]}`.replace(/\s+/g, " ").trim();
        index += 1;
      }
      options.push({ key: optionKey, text: optionText });
    }

    questions.push({
      id: `chapter-${chapter.index}-choice-${number}`,
      chapterId: `chapter-${chapter.index}`,
      chapterTitle: `第${chapter.numeral}章 ${chapter.title}`,
      type: "single_choice",
      starLevel,
      prompt,
      options,
      sourceKind: "pdf_original",
    });
  }

  return questions;
}

function parseBlankQuestions(lines, chapter) {
  const questions = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^(\d+)\.\s+(★[★☆]{2})\s+(.+)$/);
    if (!match) {
      index += 1;
      continue;
    }

    const number = Number(match[1]);
    const starLevel = countStars(match[2]);
    const collected = collectWrappedLines(lines, index, [/^(\d+)\.\s+(★[★☆]{2})\s+/, /^三、参考答案与解析$/]);
    questions.push({
      id: `chapter-${chapter.index}-blank-${number}`,
      chapterId: `chapter-${chapter.index}`,
      chapterTitle: `第${chapter.numeral}章 ${chapter.title}`,
      type: "fill_blank",
      starLevel,
      prompt: collected.text.replace(/^(\d+)\.\s+(★[★☆]{2})\s+/, "").trim(),
      sourceKind: "pdf_original",
    });
    index = collected.nextIndex;
  }

  return questions;
}

function parseAnswerEntries(lines) {
  const entries = new Map();
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^(\d+)\.\s+答案：(.+)$/);
    if (!match) {
      index += 1;
      continue;
    }

    const number = Number(match[1]);
    const collected = collectWrappedLines(lines, index, [/^(\d+)\.\s+答案：/, /^填空题答案$/, /^选择题答案$/]);
    const full = collected.text;
    const answerMatch = full.match(/^\d+\.\s+答案：(.+?)\s+解析：(.+)$/);
    if (answerMatch) {
      entries.set(number, {
        answer: answerMatch[1].trim(),
        explanation: answerMatch[2].trim(),
      });
    }
    index = collected.nextIndex;
  }

  return entries;
}

function splitAnswer(answerText, type) {
  if (type === "single_choice") {
    return answerText;
  }
  return answerText.split("；").map((item) => item.trim()).filter(Boolean);
}

function deriveMemoryHint(question) {
  if (question.starLevel !== 3) {
    return undefined;
  }

  const normalizedAnswer = Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer;
  return `高频必背：${normalizedAnswer}`;
}

function parseChapterBlock(lines, chapter) {
  const choiceStart = lines.indexOf("一、选择题");
  const blankStart = lines.indexOf("二、填空题");
  const answerStart = lines.indexOf("三、参考答案与解析");
  const choiceAnswerStart = lines.indexOf("选择题答案");
  const blankAnswerStart = lines.indexOf("填空题答案");

  const choiceQuestions = parseChoiceQuestions(lines.slice(choiceStart + 1, blankStart), chapter);
  const blankQuestions = parseBlankQuestions(lines.slice(blankStart + 1, answerStart), chapter);
  const choiceAnswers = parseAnswerEntries(lines.slice(choiceAnswerStart + 1, blankAnswerStart));
  const blankAnswers = parseAnswerEntries(lines.slice(blankAnswerStart + 1));

  return [
    ...choiceQuestions.map((question, index) => {
      const answerEntry = choiceAnswers.get(index + 1);
      return {
        ...question,
        answer: splitAnswer(answerEntry.answer, question.type),
        explanation: answerEntry.explanation,
        memoryHint: deriveMemoryHint({
          ...question,
          answer: splitAnswer(answerEntry.answer, question.type),
        }),
      };
    }),
    ...blankQuestions.map((question, index) => {
      const answerEntry = blankAnswers.get(index + 1);
      const answer = splitAnswer(answerEntry.answer, question.type);
      return {
        ...question,
        answer,
        explanation: answerEntry.explanation,
        gradingMode: question.type === "fill_blank" ? "keywords" : undefined,
        gradingKeywords: question.type === "fill_blank" ? answer : undefined,
        memoryHint: deriveMemoryHint({ ...question, answer }),
      };
    }),
  ];
}

export function readPdfDumpText() {
  return fs.readFileSync(PDF_DUMP_PATH, "utf8");
}

export function extractQuestionsFromRawText(text) {
  const normalizedLines = normalizeLines(text);
  const contentStart = normalizedLines.findIndex((line) => line === "第一章 国防基本理论");
  const lines = normalizedLines.slice(contentStart);

  const chapterRanges = CHAPTER_META.map((chapter) => {
    const heading = `第${chapter.numeral}章 ${chapter.title}`;
    const start = lines.findIndex((line) => line === heading);
    const nextChapter = CHAPTER_META.find((candidate) => candidate.index === chapter.index + 1);
    const end = nextChapter
      ? lines.findIndex((line) => line === `第${nextChapter.numeral}章 ${nextChapter.title}`)
      : lines.length;
    return { chapter, start, end };
  });

  return chapterRanges.flatMap(({ chapter, start, end }) => parseChapterBlock(lines.slice(start, end), chapter));
}
