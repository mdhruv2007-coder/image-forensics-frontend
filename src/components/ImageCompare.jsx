import { useState } from "react";

/**
 * ImageCompare
 *
 * Stacks the original uploaded image with a semi-transparent heatmap
 * overlay, controlled by a slider. The heatmap is expected as a base64
 * PNG string (e.g. a per_layer entry's `heatmap_png_b64` field from the
 * forensics API response) and is rendered as its own <img>, layered on
 * top of the original with CSS opacity — no backend blending involved.
 *
 * Props:
 *   originalSrc   - string, URL or data URI for the original image (required)
 *   heatmapB64     - string | null | undefined, raw base64 PNG data (no
 *                     "data:image/png;base64," prefix). Omit/null/undefined
 *                     when no heatmap is available for this result.
 *   alt            - string, alt text for the original image (optional)
 *   defaultOpacity - number 0-1, initial slider value (optional, default 0.5)
 */
export default function ImageCompare({
  originalSrc,
  heatmapB64,
  alt = "Analyzed image",
  defaultOpacity = 0.5,
}) {
  const [opacity, setOpacity] = useState(defaultOpacity);

  const hasHeatmap = Boolean(heatmapB64);

  return (
    <div className="w-full max-w-2xl">
      <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <img
          src={originalSrc}
          alt={alt}
          className="block w-full h-auto select-none"
          draggable={false}
        />
        {hasHeatmap && (
          <img
            src={`data:image/png;base64,${heatmapB64}`}
            alt="Tamper heatmap overlay"
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{ opacity }}
            draggable={false}
          />
        )}
      </div>

      {hasHeatmap ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-slate-500 w-16">Original</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="flex-1 h-1.5 accent-rose-500 cursor-pointer"
            aria-label="Heatmap overlay opacity"
          />
          <span className="text-sm text-slate-500 w-16 text-right">Heatmap</span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No heatmap available for this result.</p>
      )}
    </div>
  );
}
