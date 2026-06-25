import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { loadQuestions } from "../lib/questions";
import {
  createEmptyProgress,
  getProgress,
  overrideBlankResult,
  removeWrongMark,
  saveProgress,
  submitBlankSelfReview,
  submitChoice,
  submitMultipleChoice,
  toggleFavorite,
} from "../lib/quizStore";
import type { Question, StoredProgress } from "../types";

type QuizContextValue = {
  questions: Question[];
  progress: StoredProgress;
  loading: boolean;
  answerChoice: (question: Question, selected: string) => "correct" | "wrong";
  answerMultipleChoice: (question: Question, selected: string[]) => "correct" | "wrong";
  reviewBlank: (question: Question, result: "correct" | "wrong") => void;
  overrideBlankReview: (questionId: string, result: "correct" | "wrong") => void;
  toggleQuestionFavorite: (questionId: string) => void;
  clearWrongMark: (questionId: string) => void;
  resetAllProgress: () => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: PropsWithChildren) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<StoredProgress>(() => getProgress());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions().then((loadedQuestions) => {
      setQuestions(loadedQuestions);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const value = useMemo<QuizContextValue>(
    () => ({
      questions,
      progress,
      loading,
      answerChoice(question, selected) {
        const next = submitChoice(progress, question, selected);
        setProgress(next.progress);
        return next.result as "correct" | "wrong";
      },
      answerMultipleChoice(question, selected) {
        const next = submitMultipleChoice(progress, question, selected);
        setProgress(next.progress);
        return next.result;
      },
      reviewBlank(question, result) {
        const next = submitBlankSelfReview(progress, question, result);
        setProgress(next.progress);
      },
      overrideBlankReview(questionId, result) {
        setProgress((current) => overrideBlankResult(current, questionId, result));
      },
      toggleQuestionFavorite(questionId) {
        setProgress((current) => toggleFavorite(current, questionId));
      },
      clearWrongMark(questionId) {
        setProgress((current) => removeWrongMark(current, questionId));
      },
      resetAllProgress() {
        setProgress(createEmptyProgress());
      },
    }),
    [loading, progress, questions],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
