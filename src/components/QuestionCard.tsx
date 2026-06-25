import { useState } from "react";
import type { Question, QuestionProgress } from "../types";

type BlankGradeResult = {
  result: "correct" | "wrong";
  matched: string[];
  missing: string[];
};

type QuestionCardProps = {
  question: Question;
  progress?: QuestionProgress;
  index: number;
  total: number;
  revealAnswer: boolean;
  selectedChoices: string[];
  blankInput: string;
  blankGrade: BlankGradeResult | null;
  slideDirection?: "left" | "right";
  submissionResult?: "correct" | "wrong" | null;
  onChoiceSelect: (selected: string) => void;
  onMultipleToggle: (selected: string) => void;
  onMultipleSubmit: () => void;
  onBlankInputChange: (value: string) => void;
  onBlankSubmit: () => void;
  onBlankOverride: (result: "correct" | "wrong") => void;
  onFavorite: () => void;
};

function renderAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join("；") : answer;
}

export function QuestionCard({
  question,
  progress,
  index,
  total,
  revealAnswer,
  selectedChoices,
  blankInput,
  blankGrade,
  slideDirection = "right",
  submissionResult = null,
  onChoiceSelect,
  onMultipleToggle,
  onMultipleSubmit,
  onBlankInputChange,
  onBlankSubmit,
  onBlankOverride,
  onFavorite,
}: QuestionCardProps) {
  const [answerExpanded, setAnswerExpanded] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  // 确定答案面板的正确/错误状态
  const isAnswerCorrect = submissionResult === "correct" || 
    (submissionResult === null && blankGrade?.result === "correct");

  // 是否显示答案面板
  const shouldShowAnswer = revealAnswer || showExplanation;

  return (
    <article className={`question-card-wrapper ${slideDirection === "left" ? "slide-left" : ""}`}>
      <div className="question-card">
        {/* 进度条 (A2) */}
        <div className="question-progress-bar">
          <div className="question-progress-fill" style={{ width: "100%" }}>
            {/* 进度条由父组件传入进度数据 */}
          </div>
        </div>

        <div className="question-progress-info">
          <span>
            第 <strong>{index + 1}</strong> / {total} 题
          </span>
          <span>{question.chapterTitle}</span>
        </div>

        <div className="question-tags">
          <span className={`tag status ${progress?.status ?? "unseen"}`}>
            {progress?.status === "correct" ? "已掌握" : progress?.status === "wrong" ? "错题" : "未作答"}
          </span>
          <button className="ghost-button" type="button" onClick={onFavorite}>
            {progress?.favorite ? "已收藏" : "收藏题目"}
          </button>
        </div>

        <h2 className="question-prompt">{question.prompt}</h2>

        {question.type === "single_choice" && question.options ? (
          <div className="options">
            {question.options.map((option) => {
              const isSelected = selectedChoices.includes(option.key);
              const isCorrect = revealAnswer && question.answer === option.key;
              const isWrong = revealAnswer && isSelected && question.answer !== option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`option-button${isSelected ? " selected" : ""}${isCorrect ? " correct" : ""}${isWrong ? " wrong" : ""}`}
                  disabled={revealAnswer}
                  onClick={() => onChoiceSelect(option.key)}
                >
                  <span>
                    <strong>{option.key}.</strong> {option.text}
                  </span>
                  {isCorrect && <span className="option-icon">✓</span>}
                  {isWrong && <span className="option-icon">✗</span>}
                </button>
              );
            })}
          </div>
        ) : question.type === "multiple_choice" && question.options ? (
          <div className="options">
            {question.options.map((option) => {
              const isSelected = selectedChoices.includes(option.key);
              const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
              const isCorrect = revealAnswer && answers.includes(option.key);
              const isWrong = revealAnswer && isSelected && !answers.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`option-button${isSelected ? " selected" : ""}${isCorrect ? " correct" : ""}${isWrong ? " wrong" : ""}`}
                  disabled={revealAnswer}
                  onClick={() => onMultipleToggle(option.key)}
                >
                  <span>
                    <strong>{option.key}.</strong> {option.text}
                  </span>
                  {isCorrect && <span className="option-icon">✓</span>}
                  {isWrong && <span className="option-icon">✗</span>}
                </button>
              );
            })}
            {!revealAnswer ? (
              <button
                type="button"
                className="primary-button"
                disabled={selectedChoices.length === 0}
                onClick={onMultipleSubmit}
              >
                提交答案
              </button>
            ) : (
              <p className="blank-tip">
                你的选择：{selectedChoices.length > 0 ? selectedChoices.join("、") : "未选择"}；标准答案：
                {Array.isArray(question.answer) ? question.answer.join("、") : question.answer}
              </p>
            )}
          </div>
        ) : (
          <div className="blank-actions">
            <p className="blank-tip">先输入答案，再由程序按关键词自动判定。</p>
            <textarea
              className="blank-input"
              value={blankInput}
              onChange={(event) => onBlankInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (blankInput.trim()) {
                    onBlankSubmit();
                  }
                }
              }}
              placeholder="请输入你的答案，多个要点可用分号、逗号或空格分隔（按 Enter 提交，Shift+Enter 换行）"
              disabled={revealAnswer}
            />
            {!revealAnswer ? (
              <button type="button" className="primary-button" disabled={!blankInput.trim()} onClick={onBlankSubmit}>
                提交判定
              </button>
            ) : (
              <p className="blank-tip">系统已完成初判，下面可以查看标准答案并按需要手动改判。</p>
            )}
          </div>
        )}

        {/* 查看解析按钮（已做过的题目） */}
        {!revealAnswer && progress?.status !== "unseen" && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowExplanation(true)}
            style={{ marginTop: "16px" }}
          >
            📖 查看解析
          </button>
        )}

        {/* 答案面板 (A4: 折叠) */}
        {shouldShowAnswer && (
          <section className="answer-panel">
            <div
              className={`answer-panel-header ${isAnswerCorrect ? "correct" : "wrong"}`}
              onClick={() => setAnswerExpanded(!answerExpanded)}
            >
              <span>
                {revealAnswer ? (isAnswerCorrect ? "✓ 回答正确" : "✗ 回答错误") : "📖 答案解析"} · {answerExpanded ? "收起答案" : "点击查看答案与解析"}
              </span>
              <span className="toggle-icon">{answerExpanded ? "▴" : "▾"}</span>
            </div>
            {answerExpanded && (
              <div className="answer-panel-content">
                <p>
                  <strong>标准答案：</strong>
                  {renderAnswer(question.answer)}
                </p>
                <p className="explanation">
                  <strong>解析：</strong>
                  {question.explanation}
                </p>
                {question.type === "fill_blank" && blankGrade ? (
                  <>
                    <p>
                      <strong>程序判定：</strong>
                      {blankGrade.result === "correct" ? "判定正确" : "判定错误"}
                    </p>
                    <p>
                      <strong>已命中关键词：</strong>
                      {blankGrade.matched.length > 0 ? blankGrade.matched.join("；") : "无"}
                    </p>
                    <p>
                      <strong>未命中关键词：</strong>
                      {blankGrade.missing.length > 0 ? blankGrade.missing.join("；") : "无"}
                    </p>
                    <div className="review-actions">
                      {blankGrade.result === "wrong" ? (
                        <button type="button" className="success-button" onClick={() => onBlankOverride("correct")}>
                          改判为答对
                        </button>
                      ) : (
                        <button type="button" className="danger-button" onClick={() => onBlankOverride("wrong")}>
                          改判为答错
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
                {question.memoryHint ? (
                  <div className="memory-hint">
                    <strong>记忆提示：</strong>
                    {question.memoryHint}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>
    </article>
  );
}
