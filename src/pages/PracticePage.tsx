import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuestionCard } from "../components/QuestionCard";
import { useQuiz } from "../context/QuizContext";
import { filterQuestionsByMode } from "../lib/questionUtils";
import { gradeBlankAnswer } from "../lib/quizStore";
import type { Question, StoredProgress } from "../types";

type QuestionTypeFilter = "all" | "single_choice" | "multiple_choice" | "fill_blank";

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
  const [typeFilter, setTypeFilter] = useState<QuestionTypeFilter>("all");
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // 应用题型筛选
  const filteredQuestions = useMemo(() => {
    if (typeFilter === "all") return baseQuestions;
    return baseQuestions.filter((q) => q.type === typeFilter);
  }, [baseQuestions, typeFilter]);

  const sessionQuestions = useMemo(() => {
    return mode === "random" ? [...filteredQuestions] : filteredQuestions;
  }, [filteredQuestions, mode]);

  // 确保 currentIndex 不超出范围（修复错题本 bug）
  const safeIndex = useMemo(() => {
    if (sessionQuestions.length === 0) return 0;
    return Math.min(currentIndex, sessionQuestions.length - 1);
  }, [currentIndex, sessionQuestions.length]);

  const currentQuestion = sessionQuestions[safeIndex];

  // 清理自动切题定时器
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  function moveTo(nextIndex: number, direction: "left" | "right" = "right") {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setSlideDirection(direction);
    setCurrentIndex(nextIndex);
    setRevealAnswer(false);
    setSelectedChoices([]);
    setBlankInput("");
    setBlankGrade(null);
    setSubmissionResult(null);
  }

  // 处理答题结果（核心逻辑：答对自动切题，答错停留）
  function handleAnswerResult(result: "correct" | "wrong") {
    setSubmissionResult(result);
    setRevealAnswer(true);

    if (result === "correct") {
      // 答对：延迟后自动切到下一题
      autoAdvanceTimer.current = setTimeout(() => {
        if (safeIndex < sessionQuestions.length - 1) {
          moveTo(safeIndex + 1, "right");
        } else {
          // 最后一题答对，显示完成提示
          setRevealAnswer(true);
        }
      }, 600);
    }
    // 答错：不做任何事，停留在当前题展示解析
  }

  // 键盘快捷键
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!currentQuestion) return;

      if (["a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
        const key = e.key.toUpperCase();
        if (currentQuestion.type === "single_choice" && !revealAnswer) {
          const option = currentQuestion.options?.find((o) => o.key === key);
          if (option) {
            setSelectedChoices([key]);
            const result = answerChoice(currentQuestion, key);
            handleAnswerResult(result);
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

      if (e.key === "Enter" && currentQuestion.type === "multiple_choice" && !revealAnswer && selectedChoices.length > 0) {
        const result = answerMultipleChoice(currentQuestion, selectedChoices);
        handleAnswerResult(result);
      }

      if (e.key === "Enter" && currentQuestion.type === "fill_blank" && !revealAnswer && blankInput.trim()) {
        const result = gradeBlankAnswer(currentQuestion, blankInput);
        setBlankGrade(result);
        reviewBlank(currentQuestion, result.result);
        handleAnswerResult(result.result);
      }

      if (e.key === "ArrowLeft" && safeIndex > 0) {
        moveTo(safeIndex - 1, "left");
      }

      if (e.key === "ArrowRight" && safeIndex < sessionQuestions.length - 1) {
        moveTo(safeIndex + 1, "right");
      }

      if (e.key === "f" || e.key === "F") {
        toggleQuestionFavorite(currentQuestion.id);
      }

      if (e.key === "?") {
        setShowKeyboardHelp((v) => !v);
      }

      if (e.key === "Escape") {
        setShowKeyboardHelp(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, revealAnswer, selectedChoices, blankInput, safeIndex, sessionQuestions.length, answerChoice, answerMultipleChoice, reviewBlank, toggleQuestionFavorite]);

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

  const typeFilterLabels: Record<QuestionTypeFilter, string> = {
    all: "全部",
    single_choice: "单选",
    multiple_choice: "多选",
    fill_blank: "填空",
  };

  return (
    <div className="stack" ref={pageRef}>
      <header className="section-header">
        <div>
          <p className="eyebrow">刷题模式</p>
          <h1>{mode === "chapter" ? "章节练习" : mode === "wrong" ? "错题重刷" : mode === "favorites" ? "收藏重刷" : "随机刷题"}</h1>
        </div>
      </header>

      {/* 题目导航面板 */}
      <div className="question-nav-panel">
        <div
          className={`question-nav-header ${navExpanded ? "expanded" : ""}`}
          onClick={() => setNavExpanded(!navExpanded)}
        >
          <span>题目导航 ({safeIndex + 1}/{sessionQuestions.length})</span>
          <span className="toggle-icon">{navExpanded ? "▴" : "▾"}</span>
        </div>
        {navExpanded && (
          <>
            {/* 题型筛选 */}
            <div className="question-nav-type-filter">
              {(Object.keys(typeFilterLabels) as QuestionTypeFilter[]).map((type) => (
                <button
                  key={type}
                  className={`nav-type-btn${typeFilter === type ? " active" : ""}`}
                  onClick={() => {
                    setTypeFilter(type);
                    setCurrentIndex(0);
                    setRevealAnswer(false);
                    setSelectedChoices([]);
                    setBlankInput("");
                    setBlankGrade(null);
                    setSubmissionResult(null);
                  }}
                >
                  {typeFilterLabels[type]}
                </button>
              ))}
            </div>
            {/* 题号网格 */}
            <div className="question-nav-grid expanded">
              {sessionQuestions.map((q, idx) => {
                const qProgress = progress.byQuestionId[q.id];
                const statusClass = qProgress?.status === "correct" ? "correct" : qProgress?.status === "wrong" ? "wrong" : "";
                const currentClass = idx === safeIndex ? "current" : "";
                return (
                  <button
                    key={q.id}
                    className={`question-nav-item ${statusClass} ${currentClass}`}
                    onClick={() => moveTo(idx, idx > safeIndex ? "right" : "left")}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {currentQuestion ? (
        <>
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            progress={progress.byQuestionId[currentQuestion.id]}
            index={safeIndex}
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
              handleAnswerResult(result);
            }}
            onMultipleToggle={(selected) => {
              setSelectedChoices((current) =>
                current.includes(selected) ? current.filter((item) => item !== selected) : [...current, selected],
              );
            }}
            onMultipleSubmit={() => {
              const result = answerMultipleChoice(currentQuestion, selectedChoices);
              handleAnswerResult(result);
            }}
            onBlankInputChange={setBlankInput}
            onBlankSubmit={() => {
              const result = gradeBlankAnswer(currentQuestion, blankInput);
              setBlankGrade(result);
              reviewBlank(currentQuestion, result.result);
              handleAnswerResult(result.result);
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
              disabled={safeIndex === 0}
              onClick={() => moveTo(safeIndex - 1, "left")}
            >
              ← 上一题
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={safeIndex >= sessionQuestions.length - 1}
              onClick={() => moveTo(safeIndex + 1, "right")}
            >
              下一题 →
            </button>
          </div>
        </>
      ) : null}

      {/* 快捷键提示条 */}
      <div className="keyboard-hint-bar">
        <span>💡 支持键盘操作：A/B/C/D 选选项 · ←→ 翻页 · Enter 提交 · </span>
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
