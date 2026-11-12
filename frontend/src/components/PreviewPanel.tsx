import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

import type { ImageEntry } from "../types/models";

interface Props {
  activeImage: ImageEntry | null;
  /** Fixed frame height in px. Omit to let the frame fill its container. */
  height?: number;
  /** Large controls for touch screens. */
  isTouch?: boolean;
  /** Stand-ins for the arrow keys; the buttons are shown only when given. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Rendered under the frame, inside the section (the desktop resize handle). */
  footer?: ReactNode;
}

export function PreviewPanel({ activeImage, height, isTouch = false, onPrev, onNext, footer }: Props) {
  const [previewZoom, setPreviewZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [draggingPreview, setDraggingPreview] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const size = isTouch ? "lg" : "sm";
  const iconSize = isTouch ? 18 : 14;

  useEffect(() => {
    setPreviewZoom(1);
    setPanX(0);
    setPanY(0);
  }, [activeImage?.id]);

  const stopDragging = () => {
    lastPointRef.current = null;
    setDraggingPreview(false);
  };

  return (
    <div className={`preview-section ${height === undefined ? "is-fill" : ""}`}>
      <HStack justify="between" align="center" gap={2} paddingBlockEnd={2}>
        <Text size="sm" weight="semibold" color="secondary">
          Preview
        </Text>
        <HStack gap={1} align="center">
          {onPrev ? (
            <IconButton
              label="Previous image"
              size={size}
              variant="secondary"
              icon={<ChevronLeft size={iconSize} />}
              isDisabled={!activeImage}
              onClick={onPrev}
            />
          ) : null}
          {onNext ? (
            <IconButton
              label="Next image"
              size={size}
              variant="secondary"
              icon={<ChevronRight size={iconSize} />}
              isDisabled={!activeImage}
              onClick={onNext}
            />
          ) : null}
          <IconButton
            label="Zoom out"
            tooltip="Zoom out"
            size={size}
            variant="secondary"
            icon={<ZoomOut size={iconSize} />}
            isDisabled={!activeImage}
            onClick={() => setPreviewZoom((v) => Math.max(0.25, v - 0.1))}
          />
          <Button
            label="100%"
            tooltip="Reset zoom"
            size={size}
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
            size={size}
            variant="secondary"
            icon={<ZoomIn size={iconSize} />}
            isDisabled={!activeImage}
            onClick={() => setPreviewZoom((v) => Math.min(4, v + 0.1))}
          />
        </HStack>
      </HStack>
      <div className="preview-frame" style={height === undefined ? undefined : { height: `${height}px` }}>
        {activeImage ? (
          <>
            {/* Pointer events so the image pans with a finger as well as a mouse. */}
            <div
              className={`preview-canvas ${draggingPreview ? "is-grabbing" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                lastPointRef.current = { x: e.clientX, y: e.clientY };
                setDraggingPreview(true);
              }}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onPointerLeave={stopDragging}
              onPointerMove={(e) => {
                const last = lastPointRef.current;
                if (!last) return;
                setPanX((v) => v + e.clientX - last.x);
                setPanY((v) => v + e.clientY - last.y);
                lastPointRef.current = { x: e.clientX, y: e.clientY };
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
      {footer}
    </div>
  );
}
