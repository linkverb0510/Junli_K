import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { QuizProvider } from "./context/QuizContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <QuizProvider>
        <App />
      </QuizProvider>
    </HashRouter>
  </React.StrictMode>,
);
