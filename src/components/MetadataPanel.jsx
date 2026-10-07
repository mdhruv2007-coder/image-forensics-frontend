import React from "react";

/**
 * MetadataPanel
 *
 * Renders an AnalysisResult.metadata dict (free-form EXIF/file-metadata
 * findings) as a clean key-value list. Handles missing, empty, or partial
 * metadata gracefully.
 *
 * Props:
 *   metadata: Record<string, any> | null | undefined
 */

// Known EXIF-ish keys get a friendly label and a defined display order.
// Anything else in the dict still renders, appended after these, so the
// panel never silently drops fields the backend adds later.
const KNOWN_FIELDS = [
  { key: "camera_make", label: "Camera make" },
  { key: "camera_model", label: "Camera model" },
  { key: "software_tag", label: "Software" },
  { key: "original_datetime", label: "Original date/time" },
  { key: "exif_present", label: "EXIF present" },
  { key: "gps_present", label: "GPS present" },
];

const NOT_AVAILABLE = "Not available";

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return NOT_AVAILABLE;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatUnknownKey(key) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MetadataPanel({ metadata }) {
  const safeMetadata =
    metadata && typeof metadata === "object" ? metadata : {};

  const knownRows = KNOWN_FIELDS.map(({ key, label }) => ({
    key,
    label,
    value: formatValue(safeMetadata[key]),
    present: safeMetadata[key] !== undefined,
  }));

  const knownKeys = new Set(KNOWN_FIELDS.map((f) => f.key));
  const extraRows = Object.keys(safeMetadata)
    .filter((key) => !knownKeys.has(key))
    .map((key) => ({
      key,
      label: formatUnknownKey(key),
      value: formatValue(safeMetadata[key]),
      present: true,
    }));

  const rows = [...knownRows, ...extraRows];
  const hasAnyData = Object.keys(safeMetadata).length > 0;

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        File metadata
      </h3>

      {!hasAnyData ? (
        <p className="text-sm text-slate-400 py-2">
          No metadata was found for this image.
        </p>
      ) : (
        <dl className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <dt className="text-sm text-slate-500 shrink-0">{row.label}</dt>
              <dd
                className={`text-sm text-right truncate ${
                  row.value === NOT_AVAILABLE
                    ? "text-slate-350 text-slate-400 italic"
                    : "text-slate-700 font-medium"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
