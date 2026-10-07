import { useEffect, useRef, useState } from "react";
import { useAnalysis } from "./state/useAnalysis";

const VERDICT_STYLES = {
  authentic: {
    label: "Looks authentic",
    badge: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-500",
  },
  suspicious: {
    label: "Suspicious",
    badge: "bg-amber-100 text-amber-800",
    bar: "bg-amber-500",
  },
  likely_tampered: {
    label: "Likely tampered",
    badge: "bg-red-100 text-red-800",
    bar: "bg-red-500",
  },
};

const LAYER_LABELS = {
  ela: "Error level analysis",
  noise_residual: "Noise residual",
  copy_move: "Copy-move detection",
  ai_generated_classifier: "AI-generated classifier",
  metadata: "Metadata",
};

const layerLabel = (name) => LAYER_LABELS[name] ?? name.replaceAll("_", " ");
const pct = (n) => `${Math.round(n * 100)}%`;

function Uploader({ onSelect, disabled, file, previewUrl }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (f) => {
    if (f && f.type.startsWith("image/")) onSelect(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) pick(e.dataTransfer.files?.[0]);
      }}
      className={`flex flex-1 flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
        dragging ? "border-slate-500 bg-slate-100" : "border-slate-300"
      }`}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file?.name ?? "Selected image"}
          className="max-h-96 max-w-full rounded border border-slate-200 object-contain"
        />
      ) : (
        <p className="text-sm text-slate-500">
          Drop an image here, or choose a file to check for tampering.
        </p>
      )}

      {file && (
        <p className="text-xs text-slate-500">
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-50"
      >
        {file ? "Choose a different image" : "Choose image"}
      </button>
    </div>
  );
}

function LayerCard({ layer }) {
  const inactive = layer.status !== "ok";
  return (
    <li className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{layerLabel(layer.layer_name)}</h3>
        <span className="text-xs text-slate-500">
          {inactive ? layer.status : `${pct(layer.score)} · ${layer.reliability} reliability`}
        </span>
      </div>

      {!inactive && (
        <div className="mt-2 h-1.5 w-full rounded bg-slate-100">
          <div
            className="h-1.5 rounded bg-slate-700"
            style={{ width: pct(layer.score) }}
          />
        </div>
      )}

      {inactive && layer.detail?.reason && (
        <p className="mt-2 text-xs text-slate-500">
          {String(layer.detail.reason).replaceAll("_", " ")}
        </p>
      )}

      {layer.heatmap_png_b64 && (
        <img
          src={`data:image/png;base64,${layer.heatmap_png_b64}`}
          alt={`${layerLabel(layer.layer_name)} heatmap`}
          className="mt-3 max-h-64 rounded border border-slate-200"
        />
      )}
    </li>
  );
}

function Results({ result }) {
  const v = VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.suspicious;
  const metaEntries = Object.entries(result.metadata ?? {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className={`inline-block rounded px-2.5 py-1 text-sm font-semibold ${v.badge}`}>
          {v.label}
        </span>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 rounded bg-slate-100">
            <div className={`h-2 rounded ${v.bar}`} style={{ width: pct(result.tamper_score) }} />
          </div>
          <span className="text-sm tabular-nums">{pct(result.tamper_score)} tamper score</span>
        </div>
        {result.offline_mode && (
          <p className="mt-2 text-xs text-slate-500">
            Ran in offline mode: some checks were skipped.
          </p>
        )}
      </div>

      {result.explanation?.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Why</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {result.explanation.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Checks</h2>
        <ul className="space-y-3">
          {result.per_layer.map((layer) => (
            <LayerCard key={layer.layer_name} layer={layer} />
          ))}
        </ul>
      </section>

      {metaEntries.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">File metadata</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {metaEntries.map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k.replaceAll("_", " ")}</dt>
                <dd className="break-words">{String(val ?? "none")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

export default function App() {
  const { status, result, error, analyze } = useAnalysis();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const loading = status === "loading";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Image Tamper Detection</h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="flex min-h-64 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <Uploader
            onSelect={setFile}
            disabled={loading}
            file={file}
            previewUrl={previewUrl}
          />
          <button
            type="button"
            disabled={!file || loading}
            onClick={() => analyze(file)}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Analyze image"}
          </button>
        </section>

        <section className="flex min-h-64 flex-col rounded-lg border border-slate-200 bg-white p-6" aria-live="polite">
          {status === "idle" && (
            <p className="text-sm text-slate-500">
              Results appear here after you analyze an image.
            </p>
          )}
          {loading && <p className="text-sm text-slate-500">Running forensic checks. This can take a few seconds.</p>}
          {status === "error" && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          {status === "success" && result && <Results result={result} />}
        </section>
      </main>
    </div>
  );
}