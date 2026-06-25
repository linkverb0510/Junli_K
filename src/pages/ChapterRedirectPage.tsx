import { Navigate, useParams } from "react-router-dom";

export function ChapterRedirectPage() {
  const { chapterId } = useParams();
  return <Navigate to={`/practice/chapter?chapterId=${chapterId ?? "chapter-1"}`} replace />;
}
