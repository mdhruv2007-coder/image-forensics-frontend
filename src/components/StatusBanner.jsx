/**
 * Maps a raw error string (network failure, server message, etc.) to a
 * plain-language message a non-technical viewer can understand.
 *
 * @param {string | null} error
 * @returns {string}
 */
function toFriendlyMessage(error) {
  if (!error) {
    return "Something went wrong while analyzing the image. Please try again.";
  }

  const normalized = error.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Couldn't reach the analysis server — check your connection.";
  }

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return "The analysis took too long and timed out. Please try again.";
  }

  if (normalized.includes("413") || normalized.includes("too large")) {
    return "That image is too large to analyze. Try a smaller file.";
  }

  if (normalized.includes("415") || normalized.includes("unsupported")) {
    return "That file type isn't supported. Try a JPEG or PNG image.";
  }

  if (normalized.includes("500") || normalized.includes("502") || normalized.includes("503")) {
    return "The analysis server is temporarily unavailable. Please try again shortly.";
  }

  return "Something went wrong while analyzing the image. Please try again.";
}

/**
 * Shows the current state of an in-flight analysis request.
 *
 * @param {{ status: "idle" | "loading" | "success" | "error", error: string | null }} props
 */
export default function StatusBanner({ status, error }) {
  if (status === "idle" || status === "success") {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
        role="status"
      >
        <span
          className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-700">
          Analyzing image — this can take a few seconds on the first request
          after idle time.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
        role="alert"
      >
        <span className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true">
          ⚠
        </span>
        <p className="text-sm text-red-700">{toFriendlyMessage(error)}</p>
      </div>
    );
  }

  return null;
}
