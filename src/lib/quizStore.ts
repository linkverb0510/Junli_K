import type { Question, QuestionProgress, QuestionStats, StoredProgress } from "../types";

export const STORAGE_KEY = "junli-quiz-progress-v1";

export function createEmptyProgress(): StoredProgress {
  return {
    version: 1,
    byQuestionId: {},
  };
}

function createDefaultQuestionProgress(): QuestionProgress {
  return {
    status: "unseen",
    wrongCount: 0,
    favorite: false,
  };
}

function getQuestionProgress(progress: StoredProgress, questionId: string): QuestionProgress {
  return progress.byQuestionId[questionId] ?? createDefaultQuestionProgress();
}

function withQuestionProgress(
  progress: StoredProgress,
  questionId: string,
  updater: (current: QuestionProgress) => QuestionProgress,
): StoredProgress {
  return {
    ...progress,
    byQuestionId: {
      ...progress.byQuestionId,
      [questionId]: updater(getQuestionProgress(progress, questionId)),
    },
  };
}

export function getProgress(): StoredProgress {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(raw) as StoredProgress;
    if (parsed.version !== 1 || typeof parsed.byQuestionId !== "object") {
      return createEmptyProgress();
    }
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: StoredProgress): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function stamp(status: QuestionProgress["status"], wrongCount: number, favorite: boolean): QuestionProgress {
  return {
    status,
    wrongCount,
    favorite,
    lastReviewedAt: new Date().toISOString(),
  };
}

function normalizeAnswerText(text: string) {
  return text
    .trim()
    .replace(/[；;、，,]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeAnswerTokens(text: string) {
  return normalizeAnswerText(text)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function submitChoice(progress: StoredProgress, question: Question, selected: string) {
  const isCorrect = question.answer === selected;
  const nextProgress = withQuestionProgress(progress, question.id, (current) =>
    stamp(isCorrect ? "correct" : "wrong", isCorrect ? current.wrongCount : current.wrongCount + 1, current.favorite),
  );

  return {
    result: isCorrect ? "correct" : "wrong" as const,
    progress: nextProgress,
  };
}

export function submitMultipleChoice(progress: StoredProgress, question: Question, selectedOptions: string[]) {
  const correctAnswers = Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer];
  const normalizedSelected = [...selectedOptions].sort();
  const isCorrect =
    correctAnswers.length === normalizedSelected.length &&
    correctAnswers.every((answer, index) => answer === normalizedSelected[index]);

  const nextProgress = withQuestionProgress(progress, question.id, (current) =>
    stamp(isCorrect ? "correct" : "wrong", isCorrect ? current.wrongCount : current.wrongCount + 1, current.favorite),
  );

  return {
    result: (isCorrect ? "correct" : "wrong") as "correct" | "wrong",
    progress: nextProgress,
  };
}

export function submitBlankSelfReview(
  progress: StoredProgress,
  question: Question,
  result: "correct" | "wrong",
) {
  const nextProgress = withQuestionProgress(progress, question.id, (current) =>
    stamp(result, result === "wrong" ? current.wrongCount + 1 : current.wrongCount, current.favorite),
  );

  return { progress: nextProgress };
}

export function gradeBlankAnswer(question: Question, userInput: string) {
  const keywords =
    question.gradingKeywords && question.gradingKeywords.length > 0
      ? question.gradingKeywords
      : Array.isArray(question.answer)
        ? question.answer
        : [question.answer];

  const normalizedInput = normalizeAnswerText(userInput);
  const matched = keywords.filter((keyword) => {
    const normalizedKeyword = normalizeAnswerText(keyword);
    return normalizedInput.includes(normalizedKeyword) || normalizeAnswerTokens(userInput).includes(normalizedKeyword);
  });
  const missing = keywords.filter((keyword) => !matched.includes(keyword));

  return {
    result: (missing.length === 0 ? "correct" : "wrong") as "correct" | "wrong",
    matched,
    missing,
  };
}

export function overrideBlankResult(
  progress: StoredProgress,
  questionId: string,
  result: "correct" | "wrong",
): StoredProgress {
  return withQuestionProgress(progress, questionId, (current) => ({
    ...current,
    status: result,
    lastReviewedAt: new Date().toISOString(),
  }));
}

export function toggleFavorite(progress: StoredProgress, questionId: string): StoredProgress {
  return withQuestionProgress(progress, questionId, (current) => ({
    ...current,
    favorite: !current.favorite,
  }));
}

export function removeWrongMark(progress: StoredProgress, questionId: string): StoredProgress {
  return withQuestionProgress(progress, questionId, (current) => ({
    ...current,
    status: "unseen",
    wrongCount: 0,
  }));
}

export function getQuestionStats(questions: Question[], progress: StoredProgress): QuestionStats {
  const summary = questions.reduce(
    (acc, question) => {
      const item = progress.byQuestionId[question.id];
      if (!item) {
        return acc;
      }
      if (item.status !== "unseen") {
        acc.completed += 1;
      }
      if (item.status === "correct") {
        acc.correct += 1;
      }
      if (item.status === "wrong") {
        acc.wrongCount += 1;
      }
      if (item.favorite) {
        acc.favoriteCount += 1;
      }
      return acc;
    },
    { completed: 0, correct: 0, wrongCount: 0, favoriteCount: 0 },
  );

  return {
    total: questions.length,
    completed: summary.completed,
    correctRate: summary.completed === 0 ? 0 : Math.round((summary.correct / summary.completed) * 100),
    wrongCount: summary.wrongCount,
    favoriteCount: summary.favoriteCount,
  };
}
