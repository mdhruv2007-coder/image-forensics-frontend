import { useState } from "react";
import { ChevronRight, FileJson, Download, LoaderCircle, ShieldAlert, CircleCheck, CircleDashed, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { downloadBlob, downloadPdf, displayValue, humanize, percentage, type AnalysisResult } from "@/lib/forensics";

export function ExportActions({ result, baseUrl }: { result: AnalysisResult | null; baseUrl: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pdf = async () => {
    if (!result) return;
    setBusy(true); setError("");
    try { await downloadPdf(result, baseUrl); }
    catch (err) { setError(err instanceof Error ? err.message : "PDF export unavailable right now."); }
    finally { setBusy(false); }
  };
  return <div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={() => result && downloadBlob(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }), "analysis-result.json")}><FileJson /> JSON</Button>
      <Button variant="outline" size="sm" className="flex-1" disabled={!result || busy} onClick={pdf}>{busy ? <LoaderCircle className="animate-spin" /> : <Download />} {busy ? "Preparing…" : "PDF report"}</Button>
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}

export function VerdictPanel({ result, loading, error, baseUrl }: { result: AnalysisResult | null; loading: boolean; error: string; baseUrl: string }) {
  const score = result ? percentage(result.tamper_score) : 0;
  const authentic = result?.verdict === "authentic";
  const label = authentic ? "Looks authentic" : result?.verdict === "likely_tampered" ? "Likely tampered" : "Suspicious";
  return <aside className="verdict-panel">
    <div className="panel-heading"><span className="section-label"><span className="text-primary">03</span> ANALYSIS OVERVIEW</span><Info size={14} className="text-muted-foreground" /></div>
    <div className="verdict-body" aria-live="polite">
      <div className={`score-gauge ${result ? authentic ? "is-authentic" : "has-result" : ""}`}>
        <svg viewBox="0 0 180 180" aria-hidden="true"><circle className="gauge-track" cx="90" cy="90" r="75" /><circle className="gauge-ticks" cx="90" cy="90" r="86" />{result && <circle className="gauge-value" cx="90" cy="90" r="75" strokeDasharray={`${score * 4.712} 471.2`} />}</svg>
        <div className="gauge-center"><span className="gauge-number">{result ? score : "—"}<small>{result ? "%" : ""}</small></span><span className="micro-label">TAMPER SCORE</span></div>
      </div>
      <div className="text-center">
        <div className={`verdict-label ${authentic ? "text-success" : result ? "text-primary" : "text-muted-foreground"}`}>{loading ? <LoaderCircle size={15} className="animate-spin" /> : result ? authentic ? <CircleCheck size={15} /> : <ShieldAlert size={15} /> : <CircleDashed size={15} />}{loading ? "Analysis in progress" : result ? label : "Awaiting analysis"}</div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{loading ? "Processing your image through the forensic pipeline." : result ? result.offline_mode ? "Offline result · some checks may be unavailable." : "Combined assessment across forensic layers." : "No verdict has been generated."}</p>
      </div>
      {error && <div role="alert" className="mt-5 rounded border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</div>}
      <div className="verdict-stats"><div><span>Completed checks</span><strong>{result ? `${result.per_layer.filter(l => l.status === "ok").length} / ${result.per_layer.length}` : "— / 4"}</strong></div><div><span>Image dimensions</span><strong>{result?.coordinate_space ? `${result.coordinate_space.width} × ${result.coordinate_space.height}` : "—"}</strong></div><div><span>Processing mode</span><strong>{result ? result.offline_mode ? "Offline" : "Online" : "Standby"}</strong></div></div>
      <div className="export-block"><span className="micro-label mb-3 block">EXPORT CASE REPORT</span><ExportActions result={result} baseUrl={baseUrl} /></div>
    </div>
  </aside>;
}

const defaultLayers = ["ela", "noise_residual", "copy_move", "ai_generated_classifier"];
export function EvidencePanel({ result, loading, activeLayer, onLayerChange }: { result: AnalysisResult | null; loading: boolean; activeLayer: string; onLayerChange: (name: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const layers = result?.per_layer ?? defaultLayers.map(layer_name => ({ layer_name, status: loading ? "running" : "standby", score: 0, reliability: "", detail: {} }));
  return <section className="evidence-section">
    <Tabs defaultValue="signals">
      <div className="evidence-header"><TabsList className="evidence-tab-list"><TabsTrigger value="signals">Forensic signals <span className="tab-count">{layers.length.toString().padStart(2, "0")}</span></TabsTrigger><TabsTrigger value="explanation">Findings</TabsTrigger><TabsTrigger value="metadata">File metadata</TabsTrigger></TabsList><span className="micro-label hidden sm:block">MULTI-LAYER INSPECTION</span></div>
      <TabsContent value="signals" className="mt-0">
        <div className="signal-grid">{layers.map((layer, index) => {
          const selected = activeLayer === layer.layer_name;
          return <div key={layer.layer_name} className={`signal-item ${selected ? "selected" : ""}`}>
            <Button variant="ghost" className="signal-select" onClick={() => { onLayerChange(layer.layer_name); setExpanded(expanded === layer.layer_name ? null : layer.layer_name); }} aria-expanded={expanded === layer.layer_name}>
              <span className="signal-index">0{index + 1}</span><span className="signal-title">{humanize(layer.layer_name)}</span><ChevronRight className={expanded === layer.layer_name ? "rotate-90" : ""} />
            </Button>
            <div className="signal-data"><span className={layer.status === "ok" ? "text-success" : "text-muted-foreground"}><i className={layer.status === "ok" ? "status-dot success" : "status-dot"} />{layer.status === "ok" ? "Complete" : layer.status === "standby" ? "Not run" : humanize(layer.status)}</span><strong>{layer.status === "ok" ? `${percentage(layer.score)}%` : "—"}</strong></div>
            <div className="signal-meter"><span style={{ width: `${layer.status === "ok" ? percentage(layer.score) : 0}%` }} /></div>
            {expanded === layer.layer_name && <div className="signal-details"><p>{layer.reliability ? `${layer.reliability} reliability` : "Awaiting image analysis"}</p>{Object.entries(layer.detail ?? {}).map(([key, value]) => <div key={key}><span>{humanize(key)}</span><strong>{displayValue(value)}</strong></div>)}</div>}
          </div>;
        })}</div>
      </TabsContent>
      <TabsContent value="explanation" className="detail-tab">{result?.explanation?.length ? <ol className="finding-list">{result.explanation.map((line, i) => <li key={i}><span className="text-primary font-mono">0{i + 1}</span><p>{line}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">{loading ? "Collecting forensic findings…" : "No findings available yet."}</p>}</TabsContent>
      <TabsContent value="metadata" className="detail-tab">{result && Object.keys(result.metadata ?? {}).length ? <dl className="metadata-grid">{Object.entries(result.metadata ?? {}).map(([key, value]) => <div key={key}><dt>{humanize(key)}</dt><dd>{displayValue(value)}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">No file metadata available yet.</p>}</TabsContent>
    </Tabs>
  </section>;
}