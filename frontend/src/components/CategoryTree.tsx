import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList";
import { ZoomIn, ZoomOut } from "lucide-react";

import type { ImageEntry } from "../types/models";

interface Props {
  categories: string[];
  current: string;
  activeImage: ImageEntry | null;
  onSelect: (category: string) => void;
}

const PREVIEW_STATE_KEY = "tageditor.preview.v1";

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

  useEffect(() => {
    setPreviewZoom(1);
    setPanX(0);
    setPanY(0);
  }, [activeImage?.id]);

  const categoryItems: TreeListItemData[] = ["all", ...categories].map((c) => ({
    id: c,
    label: c === "all" ? "All" : c,
    isSelected: current === c,
    onClick: () => onSelect(c),
  }));

  return (
    <div id="category-pane" className="side-pane side-pane-left">
      <div className="preview-section">
        <HStack justify="between" align="center" gap={2} paddingBlockEnd={2}>
          <Text size="sm" weight="semibold" color="secondary">
            Preview
          </Text>
          <HStack gap={1} align="center">
            <IconButton
              label="Zoom out"
              tooltip="Zoom out"
              size="sm"
              variant="secondary"
              icon={<ZoomOut size={14} />}
              isDisabled={!activeImage}
              onClick={() => setPreviewZoom((v) => Math.max(0.25, v - 0.1))}
            />
            <Button
              label="100%"
              tooltip="Reset zoom"
              size="sm"
              variant="secondary"
              isDisabled={!activeImage}
              onClick={() => {
                setPreviewZoom(1);
                setPanX(0);
                setPanY(0);
              }}
            />
            <IconButton
              label="Zoom in"
              tooltip="Zoom in"
              size="sm"
              variant="secondary"
              icon={<ZoomIn size={14} />}
              isDisabled={!activeImage}
              onClick={() => setPreviewZoom((v) => Math.min(4, v + 0.1))}
            />
          </HStack>
        </HStack>
        <div className="preview-frame" style={{ height: `${previewHeight}px` }}>
          {activeImage ? (
            <>
              <div
                className={`preview-canvas ${draggingPreview ? "is-grabbing" : ""}`}
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
                  className="preview-image"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${previewZoom})`,
                    transformOrigin: "center",
                  }}
                  draggable={false}
                />
              </div>
              <div className="preview-caption">
                <Text size="sm" maxLines={1}>
                  {activeImage.baseName}
                </Text>
                <Text size="sm" color="secondary">
                  {activeImage.tags.length} tags
                </Text>
              </div>
            </>
          ) : (
            <div className="preview-empty">
              <Text size="sm" color="secondary">
                No image selected
              </Text>
            </div>
          )}
        </div>
        <div
          className="resize-handle resize-handle-row"
          onMouseDown={(e) => {
            e.preventDefault();
            setManualResized(true);
            setResizingPreview(true);
          }}
        />
      </div>

      <Text as="h2" type="label" weight="semibold" className="pane-heading">
        Categories
      </Text>
      <div className="scroll-area">
        <TreeList items={categoryItems} density="compact" variant="noGuides" aria-label="Categories" />
      </div>
    </div>
  );
}
