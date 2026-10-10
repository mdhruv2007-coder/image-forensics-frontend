import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleHelp,
  Crosshair,
  FileImage,
  Fingerprint,
  LoaderCircle,
  Network,
  Plus,
  Scan,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ForensicsViewer } from "@/components/forensics-viewer";
import { EvidencePanel, VerdictPanel } from "@/components/forensics-evidence";
import { analyzeImage, configuredApiBase, type AnalysisResult } from "@/lib/forensics";

const PAGE_TITLE = "TRACE — Image Forensics Workspace";
const PAGE_DESCRIPTION =
  "Inspect image authenticity with multi-layer forensic evidence, tamper heatmaps, metadata, and downloadable case reports.";

export default function App() {
  useEffect(() => {
    document.title = PAGE_TITLE;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", PAGE_DESCRIPTION);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [activeLayer, setActiveLayer] = useState("ela");
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const [baseUrl, setBaseUrl] = useState(configuredApiBase);
  const [urlDraft, setUrlDraft] = useState(configuredApiBase);
  const [urlError, setUrlError] = useState("");
  const loading = status === "loading";

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (next?: File) => {
    if (!next || loading) return;
    if (!next.type.startsWith("image/")) {
      setError("Please select an image file.");
      setStatus("error");
      return;
    }
    setFile(next);
    setResult(null);
    setError("");
    setStatus("idle");
    setActiveLayer("ela");
  };

  const reset = () => {
    if (loading) return;
    setFile(null);
    setResult(null);
    setError("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const runAnalysis = async () => {
    if (!file || loading) return;
    if (!baseUrl) {
      setSettings(true);
      setUrlError("Add your existing analysis server URL to start a live scan.");
      return;
    }
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const response = await analyzeImage(file, baseUrl);
      setResult(response);
      setStatus("success");
      setActiveLayer(response.per_layer[0]?.layer_name ?? "ela");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const saveConnection = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const url = new URL(urlDraft);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      setBaseUrl(urlDraft.trim().replace(/\/$/, ""));
      setUrlError("");
      setSettings(false);
    } catch {
      setUrlError("Enter a valid https:// or http:// server address.");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a href="/" className="brand" aria-label="TRACE home">
          <span className="brand-symbol">
            <Aperture size={24} />
          </span>
          <span>
            TRACE<span className="brand-period">.</span>
          </span>
          <span className="brand-divider" />
          <span className="brand-caption">IMAGE FORENSICS</span>
        </a>
        <div className="header-right">
          <span className="session-label">
            <i className="status-dot amber" />
            FORENSIC WORKSPACE
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Connection settings"
            title="Connection settings"
            onClick={() => {
              setUrlDraft(baseUrl);
              setSettings(true);
            }}
          >
            <Settings2 />
          </Button>
          <span className="avatar-mark">MD</span>
        </div>
      </header>
      <div className="app-body">
        <nav className="icon-rail" aria-label="Workspace tools">
          <div className="rail-top">
            <Button
              variant="ghost"
              size="icon"
              className="rail-active"
              title="Image analysis"
              aria-label="Image analysis"
              onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Scan />
            </Button>
            <Button variant="ghost" size="icon" title="New analysis" aria-label="New analysis" disabled={loading} onClick={reset}>
              <Plus />
            </Button>
            <Button variant="ghost" size="icon" title="Connection settings" aria-label="API connection" onClick={() => setSettings(true)}>
              <Network />
            </Button>
          </div>
          <div className="rail-bottom">
            <Button variant="ghost" size="icon" title="About forensic analysis" aria-label="About forensic analysis" onClick={() => setHelp(true)}>
              <CircleHelp />
            </Button>
            <span className="rail-version">01</span>
          </div>
        </nav>
        <main className="main-workspace" id="workspace">
          <div className="breadcrumb">
            <span>WORKSPACE</span>
            <ChevronRight size={12} />
            <span className="text-foreground">IMAGE ANALYSIS</span>
            <span className="breadcrumb-end">PROTOCOL / 001</span>
          </div>
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> SEE BEYOND THE PIXELS
              </div>
              <h1>
                Image forensics<span className="text-primary">.</span>
              </h1>
              <p>Every image has a story. Uncover what&rsquo;s been altered.</p>
            </div>
            <Button variant="outline" onClick={reset} disabled={loading} className="new-analysis">
              <Plus />
              New analysis
            </Button>
          </section>
          <div className="pipeline-strip">
            <span className={`pipeline-phase ${file ? "completed" : "current"}`}>
              <span className="phase-number">{file ? <Check size={12} /> : "01"}</span>
              Upload image
            </span>
            <span className="pipeline-line" />
            <span className={`pipeline-phase ${loading ? "current" : result ? "completed" : ""}`}>
              <span className="phase-number">{result ? <Check size={12} /> : "02"}</span>
              Run analysis
            </span>
            <span className="pipeline-line" />
            <span className={`pipeline-phase ${result ? "current" : ""}`}>
              <span className="phase-number">03</span>
              Inspect evidence
            </span>
            <span className="pipeline-meta">
              <ShieldCheck size={13} />
              MULTI-LAYER FORENSICS
            </span>
          </div>
          <div className="workspace-grid">
            <section className="upload-panel">
              <div className="panel-heading">
                <span className="section-label">
                  <span className="text-primary">01</span> SOURCE INPUT
                </span>
                <FileImage size={14} className="text-muted-foreground" />
              </div>
              <div className="upload-body">
                <div
                  className={`drop-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!loading) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    selectFile(e.dataTransfer.files[0]);
                  }}
                >
                  <div className="upload-reticle">
                    <Upload size={24} />
                    <span className="reticle-corner tl" />
                    <span className="reticle-corner tr" />
                    <span className="reticle-corner bl" />
                    <span className="reticle-corner br" />
                  </div>
                  <h2>{file ? "Image acquired" : "Drop your image"}</h2>
                  <p>{file ? "Ready for forensic inspection" : "or select a file to investigate"}</p>
                  <Button variant="outline" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
                    {file ? <FileImage /> : <Plus />}
                    {file ? "Replace image" : "Browse files"}
                  </Button>
                  <span className="upload-formats">JPG · PNG · WEBP · TIFF</span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Upload image"
                    className="sr-only"
                    disabled={loading}
                    onChange={(e) => selectFile(e.target.files?.[0])}
                  />
                </div>
                <div className="source-file">
                  {file ? (
                    <>
                      <FileImage size={16} className="text-primary" />
                      <div>
                        <strong title={file.name}>{file.name}</strong>
                        <span>
                          {(file.size / 1024).toFixed(0)} KB · {file.type.split("/")[1]?.toUpperCase()}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Remove image" aria-label="Remove image" disabled={loading} onClick={reset}>
                        <X />
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileImage size={16} />
                      <div>
                        <strong>No image selected</strong>
                        <span>Awaiting source file</span>
                      </div>
                    </>
                  )}
                </div>
                <Button className="analyze-button" disabled={!file || loading} onClick={runAnalysis}>
                  {loading ? <LoaderCircle className="animate-spin" /> : <Crosshair />}
                  {loading ? "Analyzing image…" : "Analyze image"}
                  <ArrowUpRight className="ml-auto" />
                </Button>
                <div className="input-note">
                  <ShieldCheck size={13} />
                  <span>Original file remains unmodified</span>
                </div>
                <div className="pipeline-info">
                  <span className="micro-label">INSPECTION PIPELINE</span>
                  <div>
                    <Fingerprint size={15} />
                    <span>Compression & duplication</span>
                  </div>
                  <div>
                    <AudioLines size={15} />
                    <span>Noise & synthetic patterns</span>
                  </div>
                </div>
              </div>
            </section>
            <ForensicsViewer previewUrl={previewUrl} file={file} result={result} activeLayer={activeLayer} loading={loading} />
            <VerdictPanel result={result} loading={loading} error={error} baseUrl={baseUrl} />
          </div>
          <EvidencePanel result={result} loading={loading} activeLayer={activeLayer} onLayerChange={setActiveLayer} />
          <footer className="workspace-footer">
            <span>
              <i className={`status-dot ${loading ? "amber" : ""}`} />
              {loading ? "ANALYSIS RUNNING" : result ? "ANALYSIS COMPLETE" : "SYSTEM STANDBY"}
            </span>
            <span className="footer-center">TRACE / VISUAL INTEGRITY LAB</span>
            <span>
              {baseUrl ? "ENDPOINT CONFIGURED" : "ENDPOINT NOT CONFIGURED"}
              <span className="footer-separator">/</span>V.01
            </span>
          </footer>
        </main>
      </div>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analysis connection</DialogTitle>
            <DialogDescription>Connect to your existing image forensics server.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveConnection} className="space-y-4">
            <label htmlFor="server-url" className="text-sm">
              Server URL
            </label>
            <Input id="server-url" type="url" placeholder="https://your-analysis-server.com" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The existing /api/analyze and /api/report/pdf connections are preserved. Your server must allow this preview&rsquo;s origin. This address applies to the current session.
            </p>
            {urlError && (
              <p role="alert" className="text-xs text-destructive">
                {urlError}
              </p>
            )}
            <Button type="submit" className="w-full">
              <Network />
              Save connection
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visual integrity lab</DialogTitle>
            <DialogDescription>Image tamper detection</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Compression inconsistencies, sensor noise, duplicated regions and synthetic-image signals contribute to a combined tamper score. A result is
            forensic evidence, not definitive proof of authenticity. Skipped or failed checks reduce the available evidence.
          </p>
          <p className="text-xs text-muted-foreground">The landscape shown before upload is a generated reference specimen, not an analyzed image.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
