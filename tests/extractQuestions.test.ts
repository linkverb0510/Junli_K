import { describe, expect, it } from "vitest";
import { extractQuestionsFromText } from "./helpers/extractQuestions";

describe("extractQuestionsFromText", () => {
  it("parses the PDF text into seven chapters and 121 body questions", () => {
    const parsed = extractQuestionsFromText();

    expect(parsed.length).toBe(121);
    expect(new Set(parsed.map((question) => question.chapterId)).size).toBe(7);
  });

  it("parses the first choice question with the correct option and explanation", () => {
    const parsed = extractQuestionsFromText();
    const first = parsed[0];

    expect(first).toMatchObject({
      id: "chapter-1-choice-1",
      chapterId: "chapter-1",
      type: "single_choice",
      starLevel: 3,
      answer: "B",
    });
    expect(first.options).toHaveLength(4);
    expect(first.explanation).toContain("国防定义");
  });

  it("parses fill blank questions as answer arrays", () => {
    const parsed = extractQuestionsFromText();
    const blank = parsed.find((question) => question.id === "chapter-1-blank-1");

    expect(blank).toBeDefined();
    expect(blank?.type).toBe("fill_blank");
    expect(blank?.answer).toEqual(["主权", "统一", "领土完整", "安全"]);
  });

  it("tags original extracted questions with the PDF source kind", () => {
    const parsed = extractQuestionsFromText();

    expect(parsed[0]?.sourceKind).toBe("pdf_original");
  });
});
