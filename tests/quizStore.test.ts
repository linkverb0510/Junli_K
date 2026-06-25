import { describe, expect, it, beforeEach } from "vitest";
import type { Question, StoredProgress } from "../src/types";
import {
  STORAGE_KEY,
  createEmptyProgress,
  gradeBlankAnswer,
  getProgress,
  getQuestionStats,
  overrideBlankResult,
  removeWrongMark,
  saveProgress,
  submitBlankSelfReview,
  submitChoice,
  submitMultipleChoice,
  toggleFavorite,
} from "../src/lib/quizStore";

const sampleQuestions: Question[] = [
  {
    id: "chapter-1-choice-1",
    chapterId: "chapter-1",
    chapterTitle: "第一章",
    type: "single_choice",
    starLevel: 3,
    prompt: "题目一",
    options: [
      { key: "A", text: "A" },
      { key: "B", text: "B" },
      { key: "C", text: "C" },
      { key: "D", text: "D" },
    ],
    answer: "B",
    explanation: "解析一",
  },
  {
    id: "chapter-1-blank-1",
    chapterId: "chapter-1",
    chapterTitle: "第一章",
    type: "fill_blank",
    starLevel: 2,
    prompt: "题目二",
    answer: ["答案一", "答案二"],
    explanation: "解析二",
    gradingMode: "keywords",
    gradingKeywords: ["答案一", "答案二"],
    sourceKind: "pdf_original",
  },
  {
    id: "chapter-1-multi-1",
    chapterId: "chapter-1",
    chapterTitle: "第一章",
    type: "multiple_choice",
    starLevel: 3,
    prompt: "题目三",
    options: [
      { key: "A", text: "A" },
      { key: "B", text: "B" },
      { key: "C", text: "C" },
      { key: "D", text: "D" },
    ],
    answer: ["A", "C"],
    explanation: "解析三",
    sourceKind: "docx_expanded",
  },
];

describe("quizStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates an empty versioned progress object", () => {
    expect(createEmptyProgress()).toEqual({
      version: 1,
      byQuestionId: {},
    });
  });

  it("returns the empty structure when local storage has nothing", () => {
    expect(getProgress()).toEqual(createEmptyProgress());
  });

  it("saves and reloads progress from local storage", () => {
    const progress: StoredProgress = {
      version: 1,
      byQuestionId: {
        "chapter-1-choice-1": {
          status: "correct",
          wrongCount: 0,
          favorite: true,
          lastReviewedAt: "2026-06-24T00:00:00.000Z",
        },
      },
    };

    saveProgress(progress);

    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("chapter-1-choice-1");
    expect(getProgress()).toEqual(progress);
  });

  it("marks a choice question correct when the selected option matches", () => {
    const next = submitChoice(createEmptyProgress(), sampleQuestions[0], "B");

    expect(next.result).toBe("correct");
    expect(next.progress.byQuestionId[sampleQuestions[0].id]).toMatchObject({
      status: "correct",
      wrongCount: 0,
      favorite: false,
    });
  });

  it("marks a choice question wrong and increments wrongCount when the answer is incorrect", () => {
    const onceWrong = submitChoice(createEmptyProgress(), sampleQuestions[0], "A");
    const twiceWrong = submitChoice(onceWrong.progress, sampleQuestions[0], "C");

    expect(onceWrong.result).toBe("wrong");
    expect(twiceWrong.progress.byQuestionId[sampleQuestions[0].id]).toMatchObject({
      status: "wrong",
      wrongCount: 2,
      favorite: false,
    });
  });

  it("marks a fill blank question from self review without trying to string-match answers", () => {
    const next = submitBlankSelfReview(createEmptyProgress(), sampleQuestions[1], "wrong");

    expect(next.progress.byQuestionId[sampleQuestions[1].id]).toMatchObject({
      status: "wrong",
      wrongCount: 1,
      favorite: false,
    });
  });

  it("grades a blank answer as correct when all keywords are covered after normalization", () => {
    const result = gradeBlankAnswer(sampleQuestions[1], "答案一； 答案二");

    expect(result).toEqual({
      result: "correct",
      matched: ["答案一", "答案二"],
      missing: [],
    });
  });

  it("grades a blank answer as wrong when required keywords are missing", () => {
    const result = gradeBlankAnswer(sampleQuestions[1], "答案一");

    expect(result).toEqual({
      result: "wrong",
      matched: ["答案一"],
      missing: ["答案二"],
    });
  });

  it("marks a multiple choice question correct only on exact set match", () => {
    const correct = submitMultipleChoice(createEmptyProgress(), sampleQuestions[2], ["C", "A"]);
    const wrong = submitMultipleChoice(createEmptyProgress(), sampleQuestions[2], ["A", "B"]);

    expect(correct.result).toBe("correct");
    expect(correct.progress.byQuestionId[sampleQuestions[2].id]).toMatchObject({
      status: "correct",
      wrongCount: 0,
      favorite: false,
    });
    expect(wrong.result).toBe("wrong");
    expect(wrong.progress.byQuestionId[sampleQuestions[2].id]).toMatchObject({
      status: "wrong",
      wrongCount: 1,
      favorite: false,
    });
  });

  it("allows overriding a blank result after auto grading", () => {
    const autoWrong = submitBlankSelfReview(createEmptyProgress(), sampleQuestions[1], "wrong").progress;
    const overridden = overrideBlankResult(autoWrong, sampleQuestions[1].id, "correct");

    expect(overridden.byQuestionId[sampleQuestions[1].id]).toMatchObject({
      status: "correct",
      wrongCount: 1,
      favorite: false,
    });
  });

  it("toggles favorite state without changing answer status", () => {
    const answered = submitChoice(createEmptyProgress(), sampleQuestions[0], "B").progress;
    const favorited = toggleFavorite(answered, sampleQuestions[0].id);

    expect(favorited.byQuestionId[sampleQuestions[0].id]).toMatchObject({
      status: "correct",
      wrongCount: 0,
      favorite: true,
    });
  });

  it("removes a wrong mark by resetting status while keeping favorite state", () => {
    const wrongProgress = toggleFavorite(
      submitChoice(createEmptyProgress(), sampleQuestions[0], "A").progress,
      sampleQuestions[0].id,
    );

    const cleaned = removeWrongMark(wrongProgress, sampleQuestions[0].id);

    expect(cleaned.byQuestionId[sampleQuestions[0].id]).toMatchObject({
      status: "unseen",
      wrongCount: 0,
      favorite: true,
    });
  });

  it("aggregates total, completed, wrong, favorite and correctRate stats", () => {
    const afterChoice = submitChoice(createEmptyProgress(), sampleQuestions[0], "B").progress;
    const afterBlank = submitBlankSelfReview(afterChoice, sampleQuestions[1], "wrong").progress;
    const afterMulti = submitMultipleChoice(afterBlank, sampleQuestions[2], ["A", "B"]).progress;
    const favorited = toggleFavorite(afterMulti, sampleQuestions[1].id);

    expect(getQuestionStats(sampleQuestions, favorited)).toEqual({
      total: 3,
      completed: 3,
      correctRate: 33,
      wrongCount: 2,
      favoriteCount: 1,
    });
  });
});
