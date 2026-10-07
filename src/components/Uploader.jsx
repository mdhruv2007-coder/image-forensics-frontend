import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drop zone + click-to-browse file picker for selecting a single image.
 * Does not call the analysis API itself — it only reports the chosen
 * file via onFileSelected, so the caller decides when to analyze it.
 *
 * @param {{ onFileSelected: (file: File) => void, disabled?: boolean }} props
 */
export default function Uploader({ onFileSelected, disabled = false }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const dragCounter = useRef(0);
  const inputRef = useRef(null);

  // Revoke the object URL whenever it's replaced or the component unmounts,
  // so we don't leak memory across repeated uploads.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const acceptFile = useCallback(
    (file) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setRejectionMessage(
          `"${file.name}" isn't an image file. Drop a JPEG, PNG, or other image to analyze.`
        );
        return;
      }

      setRejectionMessage("");
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDragEnter = useCallback(
    (event) => {
      event.preventDefault();
      if (disabled) return;
      dragCounter.current += 1;
      setIsDragActive(true);
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      if (disabled) return;
      event.dataTransfer.dropEffect = "copy";
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      dragCounter.current = 0;
      setIsDragActive(false);
      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      acceptFile(file);
    },
    [acceptFile, disabled]
  );

  const handleInputChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      acceptFile(file);
      // Allow re-selecting the same file name after a previous rejection.
      event.target.value = "";
    },
    [acceptFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : "cursor-pointer",
          !disabled && isDragActive
            ? "border-indigo-500 bg-indigo-50"
            : !disabled
              ? "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Preview of ${fileName}`}
            className="h-24 w-24 rounded-md border border-slate-200 object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-10 w-10 text-slate-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75m0 0L7.5 8.25M12 3.75v12.75"
            />
          </svg>
        )}

        <div>
          <p className="text-sm font-medium text-slate-700">
            {previewUrl ? fileName : "Drop an image here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {previewUrl ? "Click or drop a new file to replace it" : "JPEG, PNG, or other image file"}
          </p>
        </div>
      </div>

      {rejectionMessage && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {rejectionMessage}
        </p>
      )}
    </div>
  );
}
