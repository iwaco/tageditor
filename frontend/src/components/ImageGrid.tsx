import { useMemo, useState, type MouseEvent } from "react";
import type { ImageEntry } from "../types/models";

interface Props {
  images: ImageEntry[];
  selected: string[];
  activeId: string | null;
  onClickImage: (imageId: string, index: number, e: MouseEvent<HTMLButtonElement>) => void;
  onOpenDetail: (imageId: string) => void;
}

const ROW_HEIGHT = 170;
const COLS = 4;
const OVERSCAN = 5;

export function ImageGrid({ images, selected, activeId, onClickImage, onOpenDetail }: Props) {
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(680);

  const totalRows = Math.ceil(images.length / COLS);
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN);

  const visible = useMemo(() => {
    const startIdx = startRow * COLS;
    const endIdx = Math.min(images.length, endRow * COLS);
    return images.slice(startIdx, endIdx).map((item, i) => ({ item, index: startIdx + i }));
  }, [endRow, images, startRow]);

  return (
    <div
      className="h-full overflow-y-auto p-3"
      onScroll={(e) => {
        const target = e.currentTarget;
        setScrollTop(target.scrollTop);
        setHeight(target.clientHeight);
      }}
    >
      <div style={{ height: totalRows * ROW_HEIGHT, position: "relative" }}>
        <div style={{ position: "absolute", top: startRow * ROW_HEIGHT, left: 0, right: 0 }}>
          <div className="grid grid-cols-4 gap-3">
            {visible.map(({ item, index }) => {
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
      </div>
    </div>
  );
}
