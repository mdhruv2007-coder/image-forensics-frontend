import { useState } from "react";
import { Maximize, Minus, Plus, ScanLine, Image as ImageIcon, Layers, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { humanize, type AnalysisResult } from "@/lib/forensics";
import referenceSpecimen from "@/assets/reference-specimen.jpg";

interface Region { x1: number; y1: number; x2: number; y2: number }
function isRegion(value: unknown): value is Region {
  if (!value || typeof value !== "object") return false;
  return ["x1", "y1", "x2", "y2"].every(k => k in value && typeof (value as Record<string, unknown>)[k] === "number");
}
export function ForensicsViewer({ previewUrl, file, result, activeLayer, loading }: { previewUrl: string | null; file: File | null; result: AnalysisResult | null; activeLayer: string; loading: boolean }) {
  const [mode, setMode] = useState("original");
  const [zoom, setZoom] = useState(100);
  const [opacity, setOpacity] = useState([55]);
  const [fullscreen, setFullscreen] = useState(false);
  const layer = result?.per_layer.find(l => l.layer_name === activeLayer);
  const regionData = layer?.detail?.['match_regions'];
  const regions = Array.isArray(regionData) ? regionData.filter(isRegion) : [];
  const source = previewUrl ?? referenceSpecimen;
  const visual = (expanded = false) => <div className={`specimen-stage ${loading ? "is-scanning" : ""} ${expanded ? "expanded" : ""}`}>
    <div className="specimen-image-wrap" style={{ transform: `scale(${expanded ? 1 : zoom / 100})` }}>
      <img src={source} alt={file?.name ?? "Reference specimen: Iceland glacial valley"} width={1536} height={1024} className="specimen-image" />
      {mode === "overlay" && layer?.heatmap_png_b64 && <img src={`data:image/png;base64,${layer.heatmap_png_b64}`} alt={`${humanize(activeLayer)} heatmap overlay`} className="heatmap-image" style={{ opacity: (opacity[0] ?? 55) / 100 }} />}
      {mode === "overlay" && regions.length > 0 && <svg className="region-overlay" viewBox={`0 0 ${result?.coordinate_space?.width ?? 1024} ${result?.coordinate_space?.height ?? 768}`} preserveAspectRatio="none" aria-label="Detected duplicated regions">{regions.map((r, i) => {
        const paired = i % 2 === 0 ? regions[i + 1] : undefined;
        return <g key={i}><rect x={r.x1} y={r.y1} width={r.x2 - r.x1} height={r.y2 - r.y1} />{paired && <line x1={(r.x1 + r.x2) / 2} y1={(r.y1 + r.y2) / 2} x2={(paired.x1 + paired.x2) / 2} y2={(paired.y1 + paired.y2) / 2} />}</g>;
      })}</svg>}
    </div>
    <span className="image-corner top-left" /><span className="image-corner top-right" /><span className="image-corner bottom-left" /><span className="image-corner bottom-right" />
    <span className="stage-tag"><i className="status-dot amber" />{file ? "SOURCE IMAGE" : "REFERENCE SPECIMEN"}</span>
    <div className="stage-coordinates"><Crosshair size={12} />{file ? file.name : "ICELAND / GLACIAL VALLEY"}</div>
    {loading && <div className="scan-beam" />}
  </div>;
  return <section className="viewer-panel">
    <div className="panel-heading"><span className="section-label"><span className="text-primary">02</span> IMAGE WORKSPACE</span><Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Expand image" title="Expand image" onClick={() => setFullscreen(true)}><Maximize /></Button></div>
    <div className="viewer-toolbar"><div className="viewer-modes"><Button variant="ghost" size="sm" className={mode === "original" ? "mode-active" : ""} onClick={() => setMode("original")}><ImageIcon />Original</Button><Button variant="ghost" size="sm" className={mode === "overlay" ? "mode-active" : ""} onClick={() => setMode("overlay")}><Layers />Evidence overlay</Button></div><span className="micro-label hidden xl:block">{file ? "IMAGE LOADED" : "STANDBY"}</span></div>
    <div className="viewer-image-area">{visual()}</div>
    <div className="viewer-bottom"><span className="micro-label flex min-w-0 items-center gap-2"><ScanLine size={13} />{mode === "original" ? "ORIGINAL VIEW" : layer?.heatmap_png_b64 || regions.length ? humanize(activeLayer).toUpperCase() : "NO OVERLAY AVAILABLE"}</span><div className="zoom-controls"><Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" className="h-6 w-6" disabled={zoom <= 100} onClick={() => setZoom(v => Math.max(100, v - 25))}><Minus /></Button><span>{zoom}%</span><Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" className="h-6 w-6" disabled={zoom >= 250} onClick={() => setZoom(v => Math.min(250, v + 25))}><Plus /></Button></div></div>
    {mode === "overlay" && layer?.heatmap_png_b64 && <div className="overlay-slider"><span>Opacity</span><Slider min={0} max={100} step={1} value={opacity} onValueChange={setOpacity} aria-label="Heatmap overlay opacity" /><span>{opacity[0]}%</span></div>}
    <Dialog open={fullscreen} onOpenChange={setFullscreen}><DialogContent className="image-dialog"><DialogTitle className="text-sm">{file?.name ?? "Reference specimen"}</DialogTitle>{visual(true)}</DialogContent></Dialog>
  </section>;
}