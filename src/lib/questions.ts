import rawQuestions from "../../data/questions.json";
import type { Question } from "../types";

function normalizeQuestion(question: Question): Question {
  const sourceKind = question.sourceKind ?? "pdf_original";

  if (question.type !== "fill_blank") {
    return {
      ...question,
      sourceKind,
    };
  }

  const answerParts = Array.isArray(question.answer) ? question.answer : [question.answer];

  return {
    ...question,
    answer: answerParts,
    gradingMode: question.gradingMode ?? "keywords",
    gradingKeywords: question.gradingKeywords ?? answerParts,
    sourceKind,
  };
}

export async function loadQuestions(): Promise<Question[]> {
  // 过滤掉 2018 期末题库
  return (rawQuestions as Question[])
    .filter((q) => q.sourceKind !== "2018_exam")
    .map(normalizeQuestion);
}
