import type { MouseEvent } from "react";
import type { ImageEntry } from "../types/models";

interface Props {
  images: ImageEntry[];
  selected: string[];
  activeId: string | null;
  onClickImage: (imageId: string, index: number, e: MouseEvent<HTMLButtonElement>) => void;
  onToggleSelect: (imageId: string) => void;
  onOpenDetail: (imageId: string) => void;
}

export function ImageGrid({ images, selected, activeId, onClickImage, onToggleSelect, onOpenDetail }: Props) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-4 gap-3">
        {images.map((item, index) => {
          const isSelected = selected.includes(item.id);
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              className={`relative overflow-hidden rounded border text-left ${
                isActive
                  ? "border-cyan-400 ring-2 ring-cyan-500"
                  : isSelected
                    ? "border-teal-500"
                    : "border-slate-700"
              }`}
              onClick={(e) => onClickImage(item.id, index, e)}
              onDoubleClick={() => onOpenDetail(item.id)}
            >
              <button
                className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded border text-xs ${
                  isSelected
                    ? "border-cyan-300 bg-cyan-600 text-white"
                    : "border-slate-500 bg-slate-900/80 text-slate-300"
                }`}
                title={isSelected ? "Deselect image" : "Select image"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(item.id);
                }}
              >
                {isSelected ? "✓" : ""}
              </button>
              <img src={item.thumbnailUrl} alt={item.baseName} className="h-32 w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between bg-slate-900 p-2 text-xs">
                <span className="truncate">{item.baseName}</span>
                <span className="rounded bg-slate-700 px-1 py-0.5">{item.tags.length}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
