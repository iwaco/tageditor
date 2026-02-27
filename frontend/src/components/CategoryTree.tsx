import { useEffect, useState } from "react";

import type { ImageEntry } from "../types/models";

interface Props {
  categories: string[];
  current: string;
  activeImage: ImageEntry | null;
  onOpenDetail: () => void;
  onSelect: (category: string) => void;
}

export function CategoryTree({ categories, current, activeImage, onOpenDetail, onSelect }: Props) {
  const [previewHeight, setPreviewHeight] = useState(240);
  const [resizingPreview, setResizingPreview] = useState(false);
  const [manualResized, setManualResized] = useState(false);

  useEffect(() => {
    if (!resizingPreview) return;

    const onMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("category-pane");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = e.clientY - rect.top - 24;
      setPreviewHeight(Math.max(120, Math.min(420, next)));
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
      const next = Math.floor(container.clientHeight * (2 / 3));
      setPreviewHeight(Math.max(120, Math.min(420, next)));
    };

    updateDefaultHeight();
    const observer = new ResizeObserver(updateDefaultHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [manualResized]);

  return (
    <div id="category-pane" className="flex h-full min-h-0 flex-col border-r border-slate-800 p-3">
      <div className="mb-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</div>
        <button
          onClick={onOpenDetail}
          className="w-full overflow-hidden rounded border border-slate-700 bg-slate-900 text-left hover:border-cyan-600"
          style={{ height: `${previewHeight}px` }}
          disabled={!activeImage}
        >
          {activeImage ? (
            <>
              <img
                src={activeImage.thumbnailUrl}
                alt={activeImage.baseName}
                className="h-[calc(100%-44px)] w-full object-cover"
              />
              <div className="border-t border-slate-700 p-2 text-xs">
                <div className="truncate">{activeImage.baseName}</div>
                <div className="text-slate-400">{activeImage.tags.length} tags</div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">No image selected</div>
          )}
        </button>
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
