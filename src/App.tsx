import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ChaptersPage } from "./pages/ChaptersPage";
import { PracticePage } from "./pages/PracticePage";
import { WrongBookPage } from "./pages/WrongBookPage";
import { ChapterRedirectPage } from "./pages/ChapterRedirectPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/chapters" element={<ChaptersPage />} />
        <Route path="/chapter/:chapterId" element={<ChapterRedirectPage />} />
        <Route path="/practice/:mode" element={<PracticePage />} />
        <Route path="/wrong-book" element={<WrongBookPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
