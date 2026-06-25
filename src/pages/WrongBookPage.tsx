import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuiz } from "../context/QuizContext";
import { getChapterSummary } from "../lib/questionUtils";

export function WrongBookPage() {
  const { questions, progress, loading, clearWrongMark } = useQuiz();
  const [onlyActive, setOnlyActive] = useState(true);

  const wrongQuestions = useMemo(
    () =>
      questions.filter((question) => {
        const item = progress.byQuestionId[question.id];
        if (!item) {
          return false;
        }
        if (onlyActive) {
          return item.status === "wrong";
        }
        return item.wrongCount > 0;
      }),
    [onlyActive, progress.byQuestionId, questions],
  );
  const grouped = getChapterSummary(wrongQuestions, progress);

  if (loading) {
    return <p>正在加载题库...</p>;
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="empty-state">
        <h1>当前没有错题</h1>
        <p>继续保持，先去随机刷题或章节练习。</p>
        <Link className="primary-button" to="/practice/random">
          去刷题
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="section-header">
        <div>
          <p className="eyebrow">错题本</p>
          <h1>把做错的题单独拎出来复习。</h1>
        </div>
        <div className="question-tags">
          <label className="star-toggle">
            <input type="checkbox" checked={onlyActive} onChange={() => setOnlyActive((current) => !current)} /> 仅未掌握
          </label>
          <Link className="primary-button" to="/practice/wrong">
            重新练错题
          </Link>
        </div>
      </header>

      {grouped.map((chapter) => {
        const chapterQuestions = wrongQuestions.filter((question) => question.chapterId === chapter.chapterId);
        return (
          <section key={chapter.chapterId} className="wrong-group">
            <h2>{chapter.chapterTitle}</h2>
            <ul className="wrong-list">
              {chapterQuestions.map((question) => (
                <li key={question.id} className="wrong-item">
                  <div>
                    <p className="wrong-title">{question.prompt}</p>
                    <p className="wrong-meta">
                      {question.type === "single_choice" ? "单选题" : question.type === "multiple_choice" ? "多选题" : "填空题"}
                    </p>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => clearWrongMark(question.id)}>
                    移出错题
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
