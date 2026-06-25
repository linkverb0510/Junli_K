import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuestionCard } from "../components/QuestionCard";
import { useQuiz } from "../context/QuizContext";
import { filterQuestionsByMode } from "../lib/questionUtils";
import { gradeBlankAnswer } from "../lib/quizStore";
import type { StoredProgress } from "../types";

export function PracticePage() {
  const { mode = "random" } = useParams();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get("chapterId");
  const {
    questions,
    progress,
    loading,
    answerChoice,
    answerMultipleChoice,
    reviewBlank,
    overrideBlankReview,
    toggleQuestionFavorite,
  } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [blankInput, setBlankInput] = useState("");
  const [blankGrade, setBlankGrade] = useState<{
    result: "correct" | "wrong";
    matched: string[];
    missing: string[];
  } | null>(null);
  const [navExpanded, setNavExpanded] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<"correct" | "wrong" | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const neutralProgress = useMemo<StoredProgress>(() => ({ version: 1, byQuestionId: {} }), []);

  const neutralBaseQuestions = useMemo(
    () => filterQuestionsByMode(questions, neutralProgress, mode, chapterId),
    [chapterId, mode, neutralProgress, questions],
  );
  const progressBaseQuestions = useMemo(
    () => filterQuestionsByMode(questions, progress, mode, chapterId),
    [chapterId, mode, progress, questions],
  );
  const baseQuestions = mode === "wrong" || mode === "favorites" ? progressBaseQuestions : neutralBaseQuestions;

  const sessionQuestions = useMemo(() => {
    return mode === "random" ? [...baseQuestions] : baseQuestions;
  }, [baseQuestions, mode]);

  const currentQuestion = sessionQuestions[currentIndex];

  function moveTo(nextIndex: number, direction: "left" | "right" = "right") {
    setSlideDirection(direction);
    setCurrentIndex(nextIndex);
    setRevealAnswer(false);
    setSelectedChoices([]);
    setBlankInput("");
    setBlankGrade(null);
    setSubmissionResult(null);
  }

  // 键盘快捷键 (A3)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 如果焦点在输入框/文本域，不触发快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (!currentQuestion) return;

      // A/B/C/D 选择选项
      if (["a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
        const key = e.key.toUpperCase();
        if (currentQuestion.type === "single_choice" && !revealAnswer) {
          const option = currentQuestion.options?.find((o) => o.key === key);
          if (option) {
            setSelectedChoices([key]);
            const result = answerChoice(currentQuestion, key);
            setSubmissionResult(result);
            setRevealAnswer(true);
          }
        } else if (currentQuestion.type === "multiple_choice" && !revealAnswer) {
          const option = currentQuestion.options?.find((o) => o.key === key);
          if (option) {
            setSelectedChoices((current) =>
              current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
            );
          }
        }
      }

      // Enter 提交多选答案
      if (e.key === "Enter" && currentQuestion.type === "multiple_choice" && !revealAnswer && selectedChoices.length > 0) {
        const result = answerMultipleChoice(currentQuestion, selectedChoices);
        setSubmissionResult(result);
        setRevealAnswer(true);
      }

      // Enter 提交填空答案
      if (e.key === "Enter" && currentQuestion.type === "fill_blank" && !revealAnswer && blankInput.trim()) {
        const result = gradeBlankAnswer(currentQuestion, blankInput);
        setBlankGrade(result);
        reviewBlank(currentQuestion, result.result);
        setSubmissionResult(result.result);
        setRevealAnswer(true);
      }

      // ← 上一题
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        moveTo(currentIndex - 1, "left");
      }

      // → 下一题
      if (e.key === "ArrowRight" && currentIndex < sessionQuestions.length - 1) {
        moveTo(currentIndex + 1, "right");
      }

      // F 收藏
      if (e.key === "f" || e.key === "F") {
        toggleQuestionFavorite(currentQuestion.id);
      }

      // ? 显示快捷键帮助
      if (e.key === "?") {
        setShowKeyboardHelp((v) => !v);
      }

      // Escape 关闭帮助
      if (e.key === "Escape") {
        setShowKeyboardHelp(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, revealAnswer, selectedChoices, blankInput, currentIndex, sessionQuestions.length, answerChoice, answerMultipleChoice, reviewBlank, toggleQuestionFavorite]);

  if (loading) {
    return <p>正在加载题库...</p>;
  }

  if (sessionQuestions.length === 0) {
    return (
      <div className="empty-state">
        <h1>当前题单为空</h1>
        <p>这个模式下还没有可刷的题目，先去做题或收藏几道题。</p>
        <Link className="primary-button" to="/chapters">
          去章节练习
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" ref={pageRef}>
      <header className="section-header">
        <div>
          <p className="eyebrow">刷题模式</p>
          <h1>{mode === "chapter" ? "章节练习" : mode === "wrong" ? "错题重刷" : mode === "favorites" ? "收藏重刷" : "随机刷题"}</h1>
        </div>
      </header>

      {/* 题目导航面板 (A1) */}
      <div className="question-nav-panel">
        <div
          className={`question-nav-header ${navExpanded ? "expanded" : ""}`}
          onClick={() => setNavExpanded(!navExpanded)}
        >
          <span>题目导航 ({currentIndex + 1}/{sessionQuestions.length})</span>
          <span className="toggle-icon">{navExpanded ? "▴" : "▾"}</span>
        </div>
        <div className={`question-nav-grid ${navExpanded ? "expanded" : ""}`}>
          {sessionQuestions.map((q, idx) => {
            const qProgress = progress.byQuestionId[q.id];
            const statusClass = qProgress?.status === "correct" ? "correct" : qProgress?.status === "wrong" ? "wrong" : "";
            const currentClass = idx === currentIndex ? "current" : "";
            return (
              <button
                key={q.id}
                className={`question-nav-item ${statusClass} ${currentClass}`}
                onClick={() => moveTo(idx, idx > currentIndex ? "right" : "left")}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {currentQuestion ? (
        <>
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            progress={progress.byQuestionId[currentQuestion.id]}
            index={currentIndex}
            total={sessionQuestions.length}
            revealAnswer={revealAnswer}
            selectedChoices={selectedChoices}
            blankInput={blankInput}
            blankGrade={blankGrade}
            slideDirection={slideDirection}
            submissionResult={submissionResult}
            onChoiceSelect={(selected) => {
              setSelectedChoices([selected]);
              const result = answerChoice(currentQuestion, selected);
              setSubmissionResult(result);
              setRevealAnswer(true);
            }}
            onMultipleToggle={(selected) => {
              setSelectedChoices((current) =>
                current.includes(selected) ? current.filter((item) => item !== selected) : [...current, selected],
              );
            }}
            onMultipleSubmit={() => {
              const result = answerMultipleChoice(currentQuestion, selectedChoices);
              setSubmissionResult(result);
              setRevealAnswer(true);
            }}
            onBlankInputChange={setBlankInput}
            onBlankSubmit={() => {
              const result = gradeBlankAnswer(currentQuestion, blankInput);
              setBlankGrade(result);
              reviewBlank(currentQuestion, result.result);
              setSubmissionResult(result.result);
              setRevealAnswer(true);
            }}
            onBlankOverride={(result) => {
              overrideBlankReview(currentQuestion.id, result);
              setSubmissionResult(result);
              setBlankGrade((current) =>
                current ? { ...current, result, missing: result === "correct" ? [] : current.missing } : current,
              );
            }}
            onFavorite={() => toggleQuestionFavorite(currentQuestion.id)}
          />

          <div className="pager">
            <button
              type="button"
              className="secondary-button"
              disabled={currentIndex === 0}
              onClick={() => moveTo(currentIndex - 1, "left")}
            >
              ← 上一题
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={currentIndex >= sessionQuestions.length - 1}
              onClick={() => moveTo(currentIndex + 1, "right")}
            >
              下一题 →
            </button>
          </div>
        </>
      ) : null}

      {/* 快捷键提示条 */}
      <div className="keyboard-hint-bar">
        <span> 支持键盘操作：A/B/C/D 选选项 · ←→ 翻页 · Enter 提交 · </span>
        <button className="keyboard-hint-link" onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}>
          查看全部快捷键
        </button>
      </div>

      {/* 快捷键帮助弹窗 */}
      {showKeyboardHelp && (
        <div className="modal-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-panel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⌨️ 快捷键</h3>
            <div className="keyboard-panel-grid">
              <div className="keyboard-panel-row">
                <span>选选项</span>
                <kbd>A B C D</kbd>
              </div>
              <div className="keyboard-panel-row">
                <span>上一题</span>
                <kbd>←</kbd>
              </div>
              <div className="keyboard-panel-row">
                <span>下一题</span>
                <kbd>→</kbd>
              </div>
              <div className="keyboard-panel-row">
                <span>提交答案</span>
                <kbd>Enter</kbd>
              </div>
              <div className="keyboard-panel-row">
                <span>收藏题目</span>
                <kbd>F</kbd>
              </div>
              <div className="keyboard-panel-row">
                <span>关闭弹窗</span>
                <kbd>Esc</kbd>
              </div>
            </div>
            <button className="primary-button" onClick={() => setShowKeyboardHelp(false)}>
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
