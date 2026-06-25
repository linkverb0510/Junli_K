import { Link } from "react-router-dom";
import { useQuiz } from "../context/QuizContext";
import { getChapterSummary } from "../lib/questionUtils";

export function ChaptersPage() {
  const { questions, progress, loading } = useQuiz();

  if (loading) {
    return <p>正在加载题库...</p>;
  }

  const chapters = getChapterSummary(questions, progress);

  return (
    <div className="stack">
      <header className="section-header">
        <div>
          <p className="eyebrow">章节练习</p>
          <h1>按章节稳扎稳打地刷。</h1>
        </div>
      </header>
      <div className="chapter-grid">
        {chapters.map((chapter) => (
          <section key={chapter.chapterId} className="chapter-card">
            <h2>{chapter.chapterTitle}</h2>
            <p>题量：{chapter.total}</p>
            <p>已完成：{chapter.completed}</p>
            <p>错题：{chapter.wrong}</p>
            <p>三星题：{chapter.starred}</p>
            <Link className="primary-button" to={`/practice/chapter?chapterId=${chapter.chapterId}`}>
              进入本章
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
