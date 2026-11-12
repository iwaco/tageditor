import { useEffect, useState } from "react";

import type { ImageEntry } from "../types/models";
import { CategoryList } from "./CategoryList";
import { PreviewPanel } from "./PreviewPanel";

interface Props {
  categories: string[];
  current: string;
  activeImage: ImageEntry | null;
  onSelect: (category: string) => void;
}

const PREVIEW_STATE_KEY = "tageditor.preview.v1";

/** Desktop left pane: the preview over the category list, split by a drag handle. */
export function CategoryTree({ categories, current, activeImage, onSelect }: Props) {
  const [previewHeight, setPreviewHeight] = useState(240);
  const [resizingPreview, setResizingPreview] = useState(false);
  const [manualResized, setManualResized] = useState(false);

  const getPreviewMaxHeight = (container: HTMLElement): number => {
    // Keep minimal room for categories list while allowing near full-height preview.
    return Math.max(180, container.clientHeight - 80);
  };

  useEffect(() => {
    const raw = localStorage.getItem(PREVIEW_STATE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { previewHeight?: number; manualResized?: boolean };
      if (typeof saved.previewHeight === "number") {
        setPreviewHeight(saved.previewHeight);
      }
      if (typeof saved.manualResized === "boolean") {
        setManualResized(saved.manualResized);
      }
    } catch {
      // ignore corrupted local state
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      PREVIEW_STATE_KEY,
      JSON.stringify({
        previewHeight,
        manualResized,
      }),
    );
  }, [previewHeight, manualResized]);

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

  return (
    <div id="category-pane" className="side-pane side-pane-left">
      <PreviewPanel
        activeImage={activeImage}
        height={previewHeight}
        footer={
          <div
            className="resize-handle resize-handle-row"
            onMouseDown={(e) => {
              e.preventDefault();
              setManualResized(true);
              setResizingPreview(true);
            }}
          />
        }
      />
      <CategoryList categories={categories} current={current} onSelect={onSelect} />
    </div>
  );
}
