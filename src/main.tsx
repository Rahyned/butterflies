import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { invoke } from "@tauri-apps/api/core";

function reportWebError(message: string) {
  try {
    invoke("append_error_log", { message }).catch(() => {});
  } catch {
    // silencioso: no romper la app si falla el log
  }
}

window.addEventListener("error", (e) => {
  reportWebError(`[window.onerror] ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
});

window.addEventListener("unhandledrejection", (e) => {
  reportWebError(`[unhandledrejection] ${String(e.reason)}`);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);