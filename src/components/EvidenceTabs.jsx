import { useState } from "react";

/**
 * EvidenceTabs
 * ---------------------------------------------------------------
 * Tabbed, "case file" style viewer for the per_layer results of a
 * tamper-detection scan. One tab per analysis layer. Tab switching
 * is plain local state — every layer's data is already in memory,
 * so changing tabs only changes which panel is rendered, nothing
 * is re-fetched or remounted.
 *
 * Props
 *   perLayer        - array of { layer_name, score, reliability,
 *                      status, detail, heatmap_png_b64 }
 *   coordinateSpace - optional { width, height } the match_regions
 *                      coordinates (copy-move layer) are expressed
 *                      in. Defaults to 1024x768.
 */

const LAYER_ORDER = [
  {
    key: "ai_generated_classifier",
    label: "AI Detection",
    blurb: "Likelihood the image was produced or altered by a generative model.",
  },
  {
    key: "ela",
    label: "Error Level Analysis",
    blurb: "Compression-artifact differences that can expose edited regions.",
  },
  {
    key: "noise_residual",
    label: "Noise Residual",
    blurb: "Sensor-noise consistency across the image.",
  },
  {
    key: "copy_move",
    label: "Copy-Move",
    blurb: "Duplicated regions pasted elsewhere in the same image.",
  },
];

const DETAIL_LABELS = {
  jpeg_quality_estimate: "Estimated JPEG quality",
  hotspot_count: "Hotspot regions",
  residual_variance: "Noise variance",
  model: "Model",
  top_label: "Classifier label",
  match_count: "Matched region pairs",
  reason: "Reason code",
  message: "Message",
  error: "Error code",
};

function humanize(key) {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function scoreTone(score) {
  if (score >= 0.6) return { bar: "bg-rose-600", text: "text-rose-700" };
  if (score >= 0.3) return { bar: "bg-amber-500", text: "text-amber-700" };
  return { bar: "bg-emerald-600", text: "text-emerald-700" };
}

function StatusBadge({ status }) {
  const map = {
    ok: { label: "Complete", dot: "bg-emerald-600", text: "text-emerald-800", ring: "ring-emerald-200" },
    skipped: { label: "Skipped", dot: "bg-amber-500", text: "text-amber-800", ring: "ring-amber-200" },
    failed: { label: "Failed", dot: "bg-rose-600", text: "text-rose-800", ring: "ring-rose-200" },
  };
  const s = map[status] || { label: status, dot: "bg-slate-400", text: "text-slate-700", ring: "ring-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ${s.ring} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ReliabilityBadge({ reliability }) {
  const styles = {
    high: "border-slate-700 text-slate-800",
    medium: "border-slate-400 text-slate-600",
    low: "border-dashed border-slate-300 text-slate-400",
  };
  const cls = styles[reliability] || styles.medium;
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {reliability || "unknown"} reliability
    </span>
  );
}

function ScoreMeter({ score }) {
  const tone = scoreTone(score);
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-sm font-semibold ${tone.text}`}>{pct}%</span>
    </div>
  );
}

function DetailList({ detail, omit = [] }) {
  const entries = Object.entries(detail || {}).filter(
    ([k, v]) => !omit.includes(k) && typeof v !== "object"
  );
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-1.5">
          <dt className="text-sm text-slate-500">{humanize(k)}</dt>
          <dd className="font-mono text-sm text-slate-800">{formatValue(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeatmapImage({ b64, alt }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <img src={`data:image/png;base64,${b64}`} alt={alt} className="block w-full" />
    </div>
  );
}

function CopyMoveVisual({ regions, coordinateSpace }) {
  const w = coordinateSpace?.width || 1024;
  const h = coordinateSpace?.height || 768;
  const pairs = [];
  for (let i = 0; i < regions.length - 1; i += 2) {
    pairs.push([regions[i], regions[i + 1]]);
  }
  const leftover = regions.length % 2 === 1 ? regions[regions.length - 1] : null;
  const center = (r) => ({ x: (r.x1 + r.x2) / 2, y: (r.y1 + r.y2) / 2 });

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width={w} height={h} fill="none" stroke="#e2e8f0" strokeWidth="2" />
        {pairs.map(([a, b], i) => {
          const ca = center(a);
          const cb = center(b);
          return (
            <g key={i}>
              <line x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke="#e11d48" strokeWidth="3" strokeDasharray="10 8" />
              {[a, b].map((r, j) => (
                <rect
                  key={j}
                  x={r.x1}
                  y={r.y1}
                  width={r.x2 - r.x1}
                  height={r.y2 - r.y1}
                  fill="rgba(225,29,72,0.08)"
                  stroke="#e11d48"
                  strokeWidth="4"
                />
              ))}
            </g>
          );
        })}
        {leftover && (
          <rect
            x={leftover.x1}
            y={leftover.y1}
            width={leftover.x2 - leftover.x1}
            height={leftover.y2 - leftover.y1}
            fill="rgba(225,29,72,0.08)"
            stroke="#e11d48"
            strokeWidth="4"
          />
        )}
      </svg>
    </div>
  );
}

function NonOkNotice({ status, detail }) {
  const heading = status === "skipped" ? "This layer was skipped" : "This layer failed to complete";
  const message =
    detail?.message ||
    (status === "skipped"
      ? "No reason was provided for skipping this layer."
      : "No error detail was provided.");
  const reasonCode = detail?.reason || detail?.error;

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-700">{heading}</p>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      {reasonCode && (
        <p className="mt-3 inline-flex items-center rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-600">
          {reasonCode}
        </p>
      )}
    </div>
  );
}

function LayerPanel({ meta, entry, coordinateSpace }) {
  if (!entry) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        No data was returned for this layer.
      </div>
    );
  }

  const { score, reliability, status, detail, heatmap_png_b64: heatmap } = entry;
  const isOk = status === "ok";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{meta.label}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{meta.blurb}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <StatusBadge status={status} />
        <ReliabilityBadge reliability={reliability} />
        {isOk && <ScoreMeter score={score} />}
      </div>

      {!isOk && <NonOkNotice status={status} detail={detail} />}

      {isOk && heatmap && (
        <HeatmapImage b64={heatmap} alt={`${meta.label} visualization`} />
      )}

      {isOk && !heatmap && meta.key === "copy_move" && detail?.match_regions?.length > 0 && (
        <CopyMoveVisual regions={detail.match_regions} coordinateSpace={coordinateSpace} />
      )}

      {isOk && meta.key === "copy_move" && (!detail?.match_regions || detail.match_regions.length === 0) && (
        <p className="text-sm text-slate-500">No duplicated regions were located.</p>
      )}

      {isOk && <DetailList detail={detail} omit={["match_regions"]} />}
    </div>
  );
}

export default function EvidenceTabs({ perLayer = [], coordinateSpace }) {
  const byName = Object.fromEntries((perLayer || []).map((e) => [e.layer_name, e]));
  const tabs = LAYER_ORDER.filter((t) => byName[t.key]);
  const [active, setActive] = useState(tabs[0]?.key);
  const activeMeta = tabs.find((t) => t.key === active) || tabs[0];

  if (tabs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No layer evidence is available for this result.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {tabs.map((t) => {
          const entry = byName[t.key];
          const isActive = t.key === active;
          const dotTone =
            entry.status === "ok"
              ? scoreTone(entry.score).bar
              : entry.status === "skipped"
              ? "bg-amber-500"
              : "bg-rose-600";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-selected={isActive}
              className={[
                "relative -mb-px flex items-center gap-2 whitespace-nowrap rounded-t-md border px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-slate-200 border-b-white bg-white text-slate-900"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              ].join(" ")}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotTone}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-b-md border border-t-0 border-slate-200 bg-white p-6">
        <LayerPanel meta={activeMeta} entry={byName[activeMeta.key]} coordinateSpace={coordinateSpace} />
      </div>
    </div>
  );
}
