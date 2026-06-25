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
  return (rawQuestions as Question[]).map(normalizeQuestion);
}
