import { useEffect, useState } from "react";

import type { ImageEntry } from "../types/models";

interface Props {
  categories: string[];
  current: string;
  activeImage: ImageEntry | null;
  onSelect: (category: string) => void;
}

export function CategoryTree({ categories, current, activeImage, onSelect }: Props) {
  const [previewHeight, setPreviewHeight] = useState(240);
  const [resizingPreview, setResizingPreview] = useState(false);
  const [manualResized, setManualResized] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [draggingPreview, setDraggingPreview] = useState(false);

  const getPreviewMaxHeight = (container: HTMLElement): number => {
    // Keep minimal room for categories list while allowing near full-height preview.
    return Math.max(180, container.clientHeight - 80);
  };

  useEffect(() => {
    if (!resizingPreview) return;

    const onMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("category-pane");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = e.clientY - rect.top - 24;
      setPreviewHeight(Math.max(120, Math.min(getPreviewMaxHeight(container), next)));
    };
    const onMouseUp = () => setResizingPreview(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingPreview]);

  useEffect(() => {
    if (manualResized) return;
    const container = document.getElementById("category-pane");
    if (!container) return;

    const updateDefaultHeight = () => {
      const maxHeight = getPreviewMaxHeight(container);
      const next = Math.floor(container.clientHeight * (2 / 3));
      setPreviewHeight(Math.max(120, Math.min(maxHeight, next)));
    };

    updateDefaultHeight();
    const observer = new ResizeObserver(updateDefaultHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [manualResized]);

  useEffect(() => {
    setPreviewZoom(1);
    setPanX(0);
    setPanY(0);
  }, [activeImage?.id]);

  return (
    <div id="category-pane" className="flex h-full min-h-0 flex-col border-r border-slate-800 p-3">
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</div>
          <div className="flex items-center gap-1">
            <button
              className="rounded bg-slate-800 px-2 py-1 text-[10px] hover:bg-slate-700"
              onClick={() => setPreviewZoom((v) => Math.max(0.25, v - 0.1))}
              title="Zoom out"
              disabled={!activeImage}
            >
              -
            </button>
            <button
              className="rounded bg-slate-800 px-2 py-1 text-[10px] hover:bg-slate-700"
              onClick={() => {
                setPreviewZoom(1);
                setPanX(0);
                setPanY(0);
              }}
              title="Reset zoom"
              disabled={!activeImage}
            >
              100%
            </button>
            <button
              className="rounded bg-slate-800 px-2 py-1 text-[10px] hover:bg-slate-700"
              onClick={() => setPreviewZoom((v) => Math.min(4, v + 0.1))}
              title="Zoom in"
              disabled={!activeImage}
            >
              +
            </button>
          </div>
        </div>
        <div
          className="w-full overflow-hidden rounded border border-slate-700 bg-slate-900"
          style={{ height: `${previewHeight}px` }}
        >
          {activeImage ? (
            <>
              <div
                className={`flex h-[calc(100%-44px)] items-center justify-center overflow-hidden bg-slate-950 ${
                  draggingPreview ? "cursor-grabbing" : "cursor-grab"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDraggingPreview(true);
                }}
                onMouseUp={() => setDraggingPreview(false)}
                onMouseLeave={() => setDraggingPreview(false)}
                onMouseMove={(e) => {
                  if (!draggingPreview) return;
                  setPanX((v) => v + e.movementX);
                  setPanY((v) => v + e.movementY);
                }}
              >
                <img
                  src={activeImage.imageUrl}
                  alt={activeImage.baseName}
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${previewZoom})`,
                    transformOrigin: "center",
                  }}
                  draggable={false}
                />
              </div>
              <div className="border-t border-slate-700 p-2 text-xs">
                <div className="truncate">{activeImage.baseName}</div>
                <div className="text-slate-400">{activeImage.tags.length} tags</div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">No image selected</div>
          )}
        </div>
        <div
          className="mt-1 h-1 w-full cursor-row-resize rounded bg-cyan-700/0 hover:bg-cyan-500/60"
          onMouseDown={(e) => {
            e.preventDefault();
            setManualResized(true);
            setResizingPreview(true);
          }}
        />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Categories</h2>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        <li>
          <button
            onClick={() => onSelect("all")}
            className={`w-full rounded px-2 py-1 text-left text-sm ${
              current === "all" ? "bg-cyan-700 text-white" : "hover:bg-slate-800"
            }`}
          >
            All
          </button>
        </li>
        {categories.map((c) => (
          <li key={c}>
            <button
              onClick={() => onSelect(c)}
              className={`w-full rounded px-2 py-1 text-left text-sm ${
                current === c ? "bg-cyan-700 text-white" : "hover:bg-slate-800"
              }`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
