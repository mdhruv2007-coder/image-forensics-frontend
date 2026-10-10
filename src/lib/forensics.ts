export interface ForensicLayer {
  layer_name: string;
  score: number;
  reliability: string;
  status: string;
  detail?: Record<string, unknown>;
  heatmap_png_b64?: string | null;
}

export interface AnalysisResult {
  verdict: string;
  tamper_score: number;
  per_layer: ForensicLayer[];
  explanation?: string[];
  metadata?: Record<string, unknown>;
  coordinate_space?: { width: number; height: number };
  offline_mode?: boolean;
  generated_at?: string;
  [key: string]: unknown;
}

export const configuredApiBase = import.meta.env['VITE_API_BASE_URL'] ?? "";
export const layerNames: Record<string, string> = {
  ela: "Error level analysis",
  noise_residual: "Noise residual",
  copy_move: "Copy-move detection",
  ai_generated_classifier: "AI detection",
  metadata: "Metadata inspection",
};
export const humanize = (key: string) => layerNames[key] ?? key.replaceAll("_", " ");
export const percentage = (n: number) => Math.round(Math.max(0, Math.min(1, n || 0)) * 100);
export const displayValue = (value: unknown): string => {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replaceAll("_", " ");
};

// Preserve the source's multipart field and endpoint; never substitute mock results.
export async function analyzeImage(file: File, baseUrl = configuredApiBase): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image", file);
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/analyze`, { method: "POST", body: formData });
  } catch (error) {
    throw new Error(`Could not reach the analysis server at ${baseUrl || "this origin"}. Check the server address and its allowed origins.`, { cause: error });
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.detail ? ` ${typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)}` : "";
    } catch { /* Preserve HTTP status if the server does not return JSON. */ }
    throw new Error(`Analysis failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}).${detail}`);
  }
  let result: AnalysisResult;
  try { result = await response.json(); }
  catch (error) { throw new Error("The analysis server returned a response that could not be read.", { cause: error }); }
  if (!result || typeof result.tamper_score !== "number" || !Array.isArray(result.per_layer)) {
    throw new Error("The server response is missing its tamper score or analysis layers.");
  }
  return result;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdf(result: AnalysisResult, baseUrl = configuredApiBase) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!response.ok) throw new Error(`PDF export unavailable (HTTP ${response.status}).`);
  downloadBlob(await response.blob(), "analysis-report.pdf");
}