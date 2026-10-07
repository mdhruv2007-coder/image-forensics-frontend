import { useState } from "react";

const PDF_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/api/report/pdf`;

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export buttons for the analysis result: a local JSON download and a
 * server-rendered PDF report.
 *
 * @param {{ result: object | null }} props
 */
export default function Downloads({ result }) {
  const [pdfError, setPdfError] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const hasResult = Boolean(result);

  const handleDownloadJson = () => {
    if (!hasResult) return;
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    triggerDownload(blob, "analysis-result.json");
  };

  const handleDownloadPdf = async () => {
    if (!hasResult) return;
    setPdfError(null);
    setIsPdfLoading(true);

    try {
      const response = await fetch(PDF_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      triggerDownload(blob, "analysis-report.pdf");
    } catch (err) {
      setPdfError("PDF export unavailable right now");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const baseButtonClasses =
    "rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const enabledClasses =
    "bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-500";
  const disabledClasses =
    "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownloadJson}
          disabled={!hasResult}
          className={`${baseButtonClasses} ${hasResult ? enabledClasses : disabledClasses}`}
        >
          Download JSON
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!hasResult || isPdfLoading}
          className={`${baseButtonClasses} ${
            hasResult && !isPdfLoading ? enabledClasses : disabledClasses
          }`}
        >
          {isPdfLoading ? "Preparing PDF…" : "Download PDF report"}
        </button>
      </div>

      {pdfError && (
        <p className="text-sm text-red-600" role="alert">
          {pdfError}
        </p>
      )}
    </div>
  );
}
