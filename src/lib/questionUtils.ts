import type { Question, StoredProgress } from "../types";

export function getChapterSummary(questions: Question[], progress: StoredProgress) {
  const grouped = new Map<
    string,
    {
      chapterId: string;
      chapterTitle: string;
      total: number;
      completed: number;
      wrong: number;
      starred: number;
    }
  >();

  for (const question of questions) {
    const current =
      grouped.get(question.chapterId) ?? {
        chapterId: question.chapterId,
        chapterTitle: question.chapterTitle,
        total: 0,
        completed: 0,
        wrong: 0,
        starred: 0,
      };

    current.total += 1;
    if (question.starLevel === 3) {
      current.starred += 1;
    }

    const item = progress.byQuestionId[question.id];
    if (item?.status && item.status !== "unseen") {
      current.completed += 1;
    }
    if (item?.status === "wrong") {
      current.wrong += 1;
    }

    grouped.set(question.chapterId, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.chapterId.localeCompare(b.chapterId));
}

export function shuffleQuestions(questions: Question[]): Question[] {
  const copy = [...questions];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function filterQuestionsByMode(
  questions: Question[],
  progress: StoredProgress,
  mode: string,
  chapterId?: string | null,
) {
  let result = chapterId ? questions.filter((question) => question.chapterId === chapterId) : [...questions];

  if (mode === "wrong") {
    result = result.filter((question) => progress.byQuestionId[question.id]?.status === "wrong");
  }
  if (mode === "favorites") {
    result = result.filter((question) => progress.byQuestionId[question.id]?.favorite);
  }
  if (mode === "random") {
    result = shuffleQuestions(result);
  }

  return result;
}
