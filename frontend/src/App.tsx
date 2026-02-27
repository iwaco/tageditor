import { useEffect, useMemo, useRef, useState } from "react";
import { batchAddTags, batchRemoveTags, fetchTagStats, listImages, openDataset, updateTags } from "./lib/api";
import type { EditAction, ImageEntry, TagStats } from "./types/models";
import { CategoryTree } from "./components/CategoryTree";
import { ImageGrid } from "./components/ImageGrid";
import { TagEditorPanel } from "./components/TagEditorPanel";
import { TagStatsPanel } from "./components/TagStatsPanel";
import { DetailView } from "./components/DetailView";

function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag || out.includes(tag)) continue;
    out.push(tag);
  }
  return out;
}

export default function App() {
  const [rootPath, setRootPath] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [stats, setStats] = useState<TagStats[]>([]);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [message, setMessage] = useState("Ready");
  const [undoStack, setUndoStack] = useState<EditAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditAction[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [batchInput, setBatchInput] = useState("");

  const saveTimers = useRef<Record<string, number>>({});
  const imagesRef = useRef<ImageEntry[]>([]);

  const activeImage = useMemo(() => images.find((i) => i.id === activeImageId) ?? null, [images, activeImageId]);
  const tagDictionary = useMemo(() => stats.map((s) => s.tag), [stats]);

  const refreshStats = async () => {
    const data = await fetchTagStats();
    setStats(data.items);
  };

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const reloadImages = async (override?: { include?: string[]; exclude?: string[]; category?: string }) => {
    const data = await listImages({
      category: (override?.category ?? activeCategory) === "all" ? undefined : override?.category ?? activeCategory,
      hasTag: override?.include ?? includeTags,
      notTag: override?.exclude ?? excludeTags,
      page: 1,
      pageSize: 1000,
    });
    setImages(data.items);
    if (data.items.length && !data.items.some((v) => v.id === activeImageId)) {
      setActiveImageId(data.items[0].id);
    }
  };

  const applyLocalTags = (imageId: string, nextTags: string[], pushHistory: boolean) => {
    setImages((prev) =>
      prev.map((item) => {
        if (item.id !== imageId) return item;
        if (pushHistory) {
          setUndoStack((u) => [
            ...u,
            {
              type: "set_tags",
              imageId,
              beforeTags: item.tags,
              afterTags: nextTags,
              timestamp: Date.now(),
            },
          ]);
          setRedoStack([]);
        }
        return { ...item, tags: normalizeTags(nextTags) };
      }),
    );
  };

  const scheduleSave = (imageId: string, nextTags: string[]) => {
    if (saveTimers.current[imageId]) {
      window.clearTimeout(saveTimers.current[imageId]);
    }
    saveTimers.current[imageId] = window.setTimeout(async () => {
      const current = imagesRef.current.find((x) => x.id === imageId);
      if (!current) return;
      try {
        const res = await updateTags(imageId, nextTags, current.revision);
        setImages((prev) => prev.map((it) => (it.id === imageId ? res.item : it)));
        await refreshStats();
        setMessage(`Saved: ${imageId}`);
      } catch (err) {
        setMessage(`Save failed: ${(err as Error).message}`);
      }
    }, 500);
  };

  const setTagsForActive = (nextTags: string[]) => {
    if (!activeImage) return;
    const normalized = normalizeTags(nextTags);
    applyLocalTags(activeImage.id, normalized, true);
    scheduleSave(activeImage.id, normalized);
  };

  const handleOpenDataset = async () => {
    try {
      const res = await openDataset(rootPath);
      setCategories(res.categories);
      setImages(res.images);
      setStats(res.tagStats);
      setActiveCategory("all");
      setIncludeTags([]);
      setExcludeTags([]);
      setSelected([]);
      setUndoStack([]);
      setRedoStack([]);
      setActiveImageId(res.images[0]?.id ?? null);
      setMessage(`Loaded ${res.total} images`);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const onClickImage = (id: string, index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveImageId(id);
    if (e.shiftKey && lastSelectedIndex !== null) {
      const [start, end] = [lastSelectedIndex, index].sort((a, b) => a - b);
      const range = images.slice(start, end + 1).map((v) => v.id);
      setSelected((prev) => Array.from(new Set([...prev, ...range])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
      setLastSelectedIndex(index);
    } else {
      setSelected([id]);
      setLastSelectedIndex(index);
    }
  };

  const applyIncludeFilter = async (tag: string) => {
    const include = Array.from(new Set([...includeTags, tag]));
    setIncludeTags(include);
    await reloadImages({ include });
  };

  const applyExcludeFilter = async (tag: string) => {
    const exclude = Array.from(new Set([...excludeTags, tag]));
    setExcludeTags(exclude);
    await reloadImages({ exclude });
  };

  const runBatchAdd = async () => {
    const tags = normalizeTags(batchInput.split(","));
    if (!tags.length || !selected.length) return;
    await batchAddTags(selected, tags);
    await reloadImages();
    await refreshStats();
    setMessage(`Batch add updated ${selected.length} images`);
  };

  const runBatchRemove = async () => {
    const tags = normalizeTags(batchInput.split(","));
    if (!tags.length || !selected.length) return;
    await batchRemoveTags(selected, tags);
    await reloadImages();
    await refreshStats();
    setMessage(`Batch remove updated ${selected.length} images`);
  };

  const undo = () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) return;
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, action]);
    applyLocalTags(action.imageId, action.beforeTags, false);
    scheduleSave(action.imageId, action.beforeTags);
  };

  const redo = () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) return;
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, action]);
    applyLocalTags(action.imageId, action.afterTags, false);
    scheduleSave(action.imageId, action.afterTags);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeImage) scheduleSave(activeImage.id, activeImage.tags);
      }
      if (e.key === "Enter" && viewMode === "grid" && activeImageId) {
        setViewMode("detail");
      }
      if (e.key === "Escape" && viewMode === "detail") {
        setViewMode("grid");
      }
      if (e.key === "ArrowLeft" && viewMode === "grid" && activeImageId) {
        const idx = images.findIndex((v) => v.id === activeImageId);
        if (idx > 0) setActiveImageId(images[idx - 1].id);
      }
      if (e.key === "ArrowRight" && viewMode === "grid" && activeImageId) {
        const idx = images.findIndex((v) => v.id === activeImageId);
        if (idx + 1 < images.length) setActiveImageId(images[idx + 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeImage, activeImageId, images, viewMode]);

  return (
    <div className="h-screen min-w-[1280px] overflow-hidden">
      <header className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 p-2">
        <input
          value={rootPath}
          onChange={(e) => setRootPath(e.target.value)}
          placeholder="Dataset root path"
          className="w-[420px] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
        />
        <button onClick={handleOpenDataset} className="rounded bg-cyan-700 px-3 py-1 text-sm hover:bg-cyan-600">
          Open
        </button>
        <button onClick={undo} className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700">
          Undo
        </button>
        <button onClick={redo} className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700">
          Redo
        </button>
        <div className="mx-2 h-4 w-px bg-slate-700" />
        <input
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="batch tags: a, b, c"
          className="w-[260px] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
        />
        <button onClick={runBatchAdd} className="rounded bg-emerald-700 px-2 py-1 text-sm hover:bg-emerald-600">
          Batch Add
        </button>
        <button onClick={runBatchRemove} className="rounded bg-rose-700 px-2 py-1 text-sm hover:bg-rose-600">
          Batch Remove
        </button>
        <div className="ml-auto text-xs text-slate-400">{message}</div>
      </header>

      <main className="relative grid h-[calc(100vh-44px)] grid-cols-[220px_1fr_360px]">
        <CategoryTree
          categories={categories}
          current={activeCategory}
          onSelect={async (c) => {
            setActiveCategory(c);
            await reloadImages({ category: c });
          }}
        />

        <div className="flex min-h-0 flex-col">
          <div className="border-b border-slate-800 p-2 text-xs text-slate-400">
            images: {images.length} | selected: {selected.length}
            {includeTags.length ? ` | include: ${includeTags.join(", ")}` : ""}
            {excludeTags.length ? ` | exclude: ${excludeTags.join(", ")}` : ""}
          </div>
          <div className="min-h-0 flex-1">
            <ImageGrid
              images={images}
              selected={selected}
              activeId={activeImageId}
              onClickImage={onClickImage}
              onOpenDetail={(id) => {
                setActiveImageId(id);
                setViewMode("detail");
              }}
            />
          </div>
          <TagStatsPanel stats={stats} />
        </div>

        <TagEditorPanel
          activeImage={activeImage}
          allTags={tagDictionary}
          onSetTags={setTagsForActive}
          onFilterInclude={applyIncludeFilter}
          onFilterExclude={applyExcludeFilter}
        />

        {viewMode === "detail" && activeImage && (
          <DetailView
            image={activeImage}
            index={images.findIndex((v) => v.id === activeImage.id)}
            total={images.length}
            onClose={() => setViewMode("grid")}
            onPrev={() => {
              const idx = images.findIndex((v) => v.id === activeImage.id);
              if (idx > 0) setActiveImageId(images[idx - 1].id);
            }}
            onNext={() => {
              const idx = images.findIndex((v) => v.id === activeImage.id);
              if (idx + 1 < images.length) setActiveImageId(images[idx + 1].id);
            }}
          />
        )}
      </main>
    </div>
  );
}
