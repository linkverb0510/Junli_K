import { useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { useQuiz } from "../context/QuizContext";
import { getQuestionStats } from "../lib/quizStore";

export function DashboardPage() {
  const { questions, progress, loading, resetAllProgress } = useQuiz();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(2);
  const [canConfirm, setCanConfirm] = useState(false);

  if (loading) {
    return <p>正在加载题库...</p>;
  }

  const stats = getQuestionStats(questions, progress);

  function handleResetClick() {
    setShowConfirmModal(true);
    setConfirmCountdown(2);
    setCanConfirm(false);

    // 2 秒倒计时后才允许确认
    let count = 2;
    const timer = setInterval(() => {
      count--;
      setConfirmCountdown(count);
      if (count <= 0) {
        setCanConfirm(true);
        clearInterval(timer);
      }
    }, 1000);
  }

  function handleConfirmReset() {
    if (canConfirm) {
      resetAllProgress();
      setShowConfirmModal(false);
    }
  }

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">军理本地刷题</p>
          <h1>先把高频题刷熟，再用错题本反复巩固。</h1>
          <p className="hero-copy">
            题库来自原始复习题和重点扩充题，单选即时判定，多选提交后判定，填空题按关键词自动判定并支持手动改判。
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/practice/random">
            开始随机刷题
          </Link>
          <Link className="secondary-button" to="/chapters">
            按章节练习
          </Link>
          <button type="button" className="ghost-button" onClick={handleResetClick}>
            清空本地进度
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="总题数" value={stats.total} hint="包含原始题和重点扩充题" />
        <StatCard label="已做题数" value={stats.completed} hint="只统计已经提交过答案的题目" />
        <StatCard label="正确率" value={`${stats.correctRate}%`} hint="按已做题统计" />
        <StatCard label="错题数" value={stats.wrongCount} hint="可进入错题本反复练习" />
        <StatCard label="收藏题" value={stats.favoriteCount} hint="适合单独重刷重点题目" />
      </section>

      <section className="quick-links">
        <Link className="feature-card" to="/practice/random">
          <h2>随机刷题</h2>
          <p>打散章节顺序，适合临考前查漏补缺。</p>
        </Link>
        <Link className="feature-card" to="/practice/favorites">
          <h2>收藏重刷</h2>
          <p>把容易混淆的题先收起来，后面集中巩固。</p>
        </Link>
        <Link className="feature-card" to="/wrong-book">
          <h2>错题本</h2>
          <p>只看做错的题，减少重复刷已经掌握的内容。</p>
        </Link>
      </section>

      {/* 清空进度确认 Modal (A7) */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠ 确认清空所有进度？</h2>
            <p className="modal-body">
              此操作不可撤销，所有做题记录和收藏将丢失。
            </p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowConfirmModal(false)}>
                取消
              </button>
              <button
                className="danger-button"
                onClick={handleConfirmReset}
                disabled={!canConfirm}
              >
                {canConfirm ? "确认清空" : `确认清空 (${confirmCountdown}s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
