import type { MouseEvent } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Text } from "@astryxdesign/core/Text";
import type { ImageEntry } from "../types/models";

interface Props {
  images: ImageEntry[];
  selected: string[];
  activeId: string | null;
  onClickImage: (imageId: string, index: number, e: MouseEvent<HTMLButtonElement>) => void;
  onToggleSelect: (imageId: string) => void;
  /** Larger checkbox hit area for touch screens. */
  isTouch?: boolean;
}

export function ImageGrid({ images, selected, activeId, onClickImage, onToggleSelect, isTouch = false }: Props) {
  return (
    <div className="image-grid-scroll">
      <div className="image-grid">
        {images.map((item, index) => {
          const isSelected = selected.includes(item.id);
          const isActive = activeId === item.id;
          const stateClass = isActive ? "is-active" : isSelected ? "is-selected" : "";
          return (
            <div key={item.id} className={`image-tile ${stateClass}`}>
              <button type="button" className="image-tile-button" onClick={(e) => onClickImage(item.id, index, e)}>
                <img src={item.thumbnailUrl} alt={item.baseName} className="image-tile-thumb" loading="lazy" />
                <span className="image-tile-caption">
                  <Text size="sm" maxLines={1}>
                    {item.baseName}
                  </Text>
                  <Badge variant="neutral" label={item.tags.length} />
                </span>
              </button>
              {/* The padding around the checkbox is part of the tap target on touch screens. */}
              <div
                className="image-tile-check"
                onClick={(e) => {
                  if (isTouch && e.target === e.currentTarget) onToggleSelect(item.id);
                }}
              >
                <CheckboxInput
                  label={isSelected ? "Deselect image" : "Select image"}
                  isLabelHidden
                  value={isSelected}
                  size={isTouch ? "md" : undefined}
                  onChange={() => onToggleSelect(item.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
