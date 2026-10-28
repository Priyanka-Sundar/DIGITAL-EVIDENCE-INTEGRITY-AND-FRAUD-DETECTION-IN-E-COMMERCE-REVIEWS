import { AnalyzeRequest, AnalyzeResponse } from "./types";

const RESULT_KEY = "fa_last_analysis";
const HISTORY_KEY = "fa_history";

export function saveResult(result: AnalyzeResponse, request: AnalyzeRequest) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const history: { result: AnalyzeResponse; request: AnalyzeRequest }[] = raw ? JSON.parse(raw) : [];
    history.unshift({ result, request });
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {
    // storage unavailable
  }
}

export function loadResult(): AnalyzeResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as AnalyzeResponse) : null;
  } catch {
    return null;
  }
}

export function loadHistory(): { result: AnalyzeResponse; request: AnalyzeRequest }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
