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
}

export function ImageGrid({ images, selected, activeId, onClickImage, onToggleSelect }: Props) {
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
              <div className="image-tile-check">
                <CheckboxInput
                  label={isSelected ? "Deselect image" : "Select image"}
                  isLabelHidden
                  value={isSelected}
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
