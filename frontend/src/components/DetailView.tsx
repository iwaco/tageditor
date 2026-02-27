import { useEffect, useMemo, useState } from "react";
import type { ImageEntry } from "../types/models";

interface Props {
  image: ImageEntry;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function DetailView({ image, index, total, onClose, onPrev, onNext }: Props) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [image.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight" || e.key === " ") onNext();
      if (e.key === "+") setScale((s) => Math.min(6, s + 0.1));
      if (e.key === "-") setScale((s) => Math.max(0.1, s - 0.1));
      if (e.key === "0") {
        setScale(1);
        setTx(0);
        setTy(0);
      }
      if (e.key === "1") setScale(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  const transform = useMemo(() => `translate(${tx}px, ${ty}px) scale(${scale})`, [scale, tx, ty]);

  return (
    <div className="absolute inset-0 z-20 grid grid-cols-[1fr_360px] bg-slate-950">
      <div className="flex h-full flex-col border-r border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800 p-2 text-sm">
          <button onClick={onClose} className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700">
            Back
          </button>
          <button
            onClick={() => {
              setScale(1);
              setTx(0);
              setTy(0);
            }}
            className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
          >
            Fit
          </button>
          <button onClick={() => setScale(1)} className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700">
            100%
          </button>
          <button onClick={() => setScale((s) => Math.min(6, s + 0.1))} className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700">
            +
          </button>
          <button onClick={() => setScale((s) => Math.max(0.1, s - 0.1))} className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700">
            -
          </button>
          <div className="ml-2 truncate text-slate-300">{image.baseName}</div>
        </div>

        <div
          className="relative flex-1 overflow-hidden"
          onWheel={(e) => {
            e.preventDefault();
            setScale((s) => Math.min(6, Math.max(0.1, s + (e.deltaY < 0 ? 0.1 : -0.1))));
          }}
          onMouseDown={(e) => {
            setDragging(true);
            setLastX(e.clientX);
            setLastY(e.clientY);
          }}
          onMouseMove={(e) => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            setTx((v) => v + dx);
            setTy((v) => v + dy);
            setLastX(e.clientX);
            setLastY(e.clientY);
          }}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
        >
          <img
            src={image.imageUrl}
            alt={image.baseName}
            className="absolute left-1/2 top-1/2 max-h-[90%] max-w-[90%] -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ transform, transformOrigin: "center" }}
            draggable={false}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 p-2 text-xs text-slate-300">
          <button onClick={onPrev} className="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700">
            ◀ Prev
          </button>
          <span>
            [{index + 1}/{total}]
          </span>
          <button onClick={onNext} className="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700">
            Next ▶
          </button>
        </div>
      </div>
      <div className="p-3 text-sm text-slate-300">
        <h3 className="mb-2 font-semibold">Shortcuts</h3>
        <ul className="space-y-1 text-xs">
          <li>Esc: Back to grid</li>
          <li>←/→: Prev/Next image</li>
          <li>Mouse wheel: Zoom</li>
          <li>Drag: Pan</li>
          <li>0: Fit, 1: 100%</li>
        </ul>
      </div>
    </div>
  );
}
