import { useCallback, useState } from "react";
import { analyzeImage } from "../api/client";

/**
 * @typedef {"idle" | "loading" | "success" | "error"} AnalysisStatus
 */

/**
 * Drives the analyze-image request lifecycle.
 *
 * @returns {{
 *   status: AnalysisStatus,
 *   result: object | null,
 *   error: string | null,
 *   analyze: (file: File) => Promise<void>,
 * }}
 */
export function useAnalysis() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (file) => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeImage(file);
      setResult(analysisResult);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong while analyzing the image. Please try again.";
      setError(message);
      setStatus("error");
    }
  }, []);

  return { status, result, error, analyze };
}
