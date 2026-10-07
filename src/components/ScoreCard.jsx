import React from "react";

/**
 * ScoreCard
 *
 * Displays the overall verdict, fused tamper_score, and a breakdown of
 * each detection layer's score/reliability/status from an AnalysisResult.
 *
 * Props:
 *   result: {
 *     verdict: "authentic" | "suspicious" | "likely_tampered",
 *     tamper_score: number (0-1),
 *     per_layer: Array<{
 *       layer_name: string,
 *       score: number (0-1),
 *       reliability: "low" | "medium" | "high",
 *       status: "ok" | "skipped" | "failed",
 *       detail?: object,
 *     }>,
 *   }
 */

const VERDICT_STYLES = {
  authentic: {
    label: "Authentic",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    barClass: "bg-emerald-500",
    ringClass: "ring-emerald-200",
    dotClass: "bg-emerald-500",
  },
  suspicious: {
    label: "Suspicious",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    barClass: "bg-amber-500",
    ringClass: "ring-amber-200",
    dotClass: "bg-amber-500",
  },
  likely_tampered: {
    label: "Likely Tampered",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    barClass: "bg-red-500",
    ringClass: "ring-red-200",
    dotClass: "bg-red-500",
  },
};

const FALLBACK_VERDICT_STYLE = {
  label: "Unknown",
  badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
  barClass: "bg-slate-400",
  ringClass: "ring-slate-200",
  dotClass: "bg-slate-400",
};

// Reliability badges are deliberately distinct from the verdict palette so the
// two signals never get confused with each other. "low" reliability also gets
// a hatched/muted bar fill so a high score at low reliability does not read
// with the same visual confidence as the same score at high reliability.
const RELIABILITY_STYLES = {
  low: {
    label: "low reliability",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    barOpacity: "opacity-40",
    barPattern: true,
  },
  medium: {
    label: "medium reliability",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    barOpacity: "opacity-70",
    barPattern: false,
  },
  high: {
    label: "high reliability",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    barOpacity: "opacity-100",
    barPattern: false,
  },
};

const FALLBACK_RELIABILITY_STYLE = {
  label: "unknown reliability",
  badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
  barOpacity: "opacity-60",
  barPattern: false,
};

function clampScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.min(1, Math.max(0, score));
}

function formatLayerName(name) {
  if (!name) return "Unknown layer";
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ScoreBar({ pct, colorClass, extraClass = "", striped = false }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${colorClass} ${extraClass} ${
          striped ? "bg-[length:10px_10px]" : ""
        }`}
        style={{
          width: `${Math.round(pct * 100)}%`,
          ...(striped
            ? {
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 4px, transparent 4px, transparent 8px)",
              }
            : {}),
        }}
      />
    </div>
  );
}

function LayerRow({ layer }) {
  const name = formatLayerName(layer?.layer_name);
  const status = layer?.status ?? "ok";
  const score = clampScore(layer?.score);
  const reliabilityKey = layer?.reliability;
  const reliabilityStyle =
    RELIABILITY_STYLES[reliabilityKey] ?? FALLBACK_RELIABILITY_STYLE;

  if (status === "skipped") {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-400 truncate">{name}</span>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            skipped
          </span>
        </div>
        <div className="w-28 shrink-0">
          <ScoreBar pct={0} colorClass="bg-slate-200" />
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-500 truncate">{name}</span>
          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">
            failed
          </span>
        </div>
        <div className="w-28 shrink-0">
          <ScoreBar pct={0} colorClass="bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-slate-700 truncate">
            {name}
          </span>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${reliabilityStyle.badgeClass}`}
          >
            {reliabilityStyle.label}
          </span>
        </div>
        <span className="text-xs tabular-nums text-slate-500 shrink-0">
          {Math.round(score * 100)}%
        </span>
      </div>
      <ScoreBar
        pct={score}
        colorClass="bg-slate-500"
        extraClass={reliabilityStyle.barOpacity}
        striped={reliabilityStyle.barPattern}
      />
    </div>
  );
}

export default function ScoreCard({ result }) {
  const verdictKey = result?.verdict;
  const verdictStyle = VERDICT_STYLES[verdictKey] ?? FALLBACK_VERDICT_STYLE;
  const tamperScore = clampScore(result?.tamper_score);
  const layers = Array.isArray(result?.per_layer) ? result.per_layer : [];

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Verdict */}
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${verdictStyle.badgeClass}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${verdictStyle.dotClass}`} />
        <span className="text-base font-semibold">{verdictStyle.label}</span>
      </div>

      {/* Fused score */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-600">
            Fused tamper score
          </span>
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            {Math.round(tamperScore * 100)}%
          </span>
        </div>
        <ScoreBar pct={tamperScore} colorClass={verdictStyle.barClass} />
      </div>

      {/* Per-layer breakdown */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
          Detection layers
        </h3>
        {layers.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">
            No layer results available.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {layers.map((layer, idx) => (
              <LayerRow key={layer?.layer_name ?? idx} layer={layer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
