import { describe, expect, it } from "vitest";
import { loadQuestions } from "../src/lib/questions";

describe("loadQuestions", () => {
  it("returns a merged dataset with original and expanded questions", async () => {
    const questions = await loadQuestions();
    const sourceKinds = new Set(questions.map((question) => question.sourceKind));
    const multiCount = questions.filter((question) => question.type === "multiple_choice").length;

    expect(questions.length).toBeGreaterThanOrEqual(175);
    expect(questions.length).toBeLessThanOrEqual(185);
    expect(sourceKinds.has("pdf_original")).toBe(true);
    expect(sourceKinds.has("docx_expanded")).toBe(true);
    expect(multiCount).toBeGreaterThanOrEqual(35);
  });
});
