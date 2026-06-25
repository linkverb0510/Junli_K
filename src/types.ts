export type QuestionType = "single_choice" | "multiple_choice" | "fill_blank";

export type ChoiceKey = "A" | "B" | "C" | "D";

export type QuestionOption = {
  key: ChoiceKey;
  text: string;
};

export type Question = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  type: QuestionType;
  starLevel: 1 | 2 | 3;
  prompt: string;
  options?: QuestionOption[];
  answer: string | string[];
  explanation: string;
  memoryHint?: string;
  sourcePage?: number;
  gradingMode?: "keywords";
  gradingKeywords?: string[];
  sourceKind?: "pdf_original" | "docx_expanded";
};

export type QuestionProgress = {
  status: "unseen" | "correct" | "wrong";
  wrongCount: number;
  favorite: boolean;
  lastReviewedAt?: string;
};

export type StoredProgress = {
  version: 1;
  byQuestionId: Record<string, QuestionProgress>;
};

export type QuestionStats = {
  total: number;
  completed: number;
  correctRate: number;
  wrongCount: number;
  favoriteCount: number;
};
