import { useEffect, useMemo, useState } from "react";
import { batchAddTags, batchRemoveTags, fetchTagStats, listImages, openDataset } from "./lib/api";
import type { EditAction, ImageEntry, TagStats } from "./types/models";
import { CategoryTree } from "./components/CategoryTree";
import { ImageGrid } from "./components/ImageGrid";
import { TagEditorPanel } from "./components/TagEditorPanel";
import { TagStatsPanel } from "./components/TagStatsPanel";

function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag || out.includes(tag)) continue;
    out.push(tag);
  }
  return out;
}

const UI_STATE_KEY = "tageditor.ui.v1";

interface PersistedUIState {
  rootPath: string;
  activeCategory: string;
  includeTags: string[];
  excludeTags: string[];
  selected: string[];
  activeImageId: string | null;
  leftPaneWidth: number;
  tagSearchMode: "include" | "exclude";
}

export default function App() {
  const [rootPath, setRootPath] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<ImageEntry | null>(null);
  const [stats, setStats] = useState<TagStats[]>([]);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [message, setMessage] = useState("Ready");
  const [undoStack, setUndoStack] = useState<EditAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditAction[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [leftPaneWidth, setLeftPaneWidth] = useState(280);
  const [resizingLeftPane, setResizingLeftPane] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [tagSearchMode, setTagSearchMode] = useState<"include" | "exclude">("include");
  const [restoring, setRestoring] = useState(true);

  const tagDictionary = useMemo(() => stats.map((s) => s.tag), [stats]);
  const selectedImages = useMemo(
    () => images.filter((img) => selected.includes(img.id)),
    [images, selected],
  );
  const commonTags = useMemo(() => {
    if (!selectedImages.length) return [] as string[];
    const [head, ...rest] = selectedImages;
    return head.tags.filter((tag) => rest.every((img) => img.tags.includes(tag)));
  }, [selectedImages]);

  const refreshStats = async () => {
    const data = await fetchTagStats();
    setStats(data.items);
  };

  useEffect(() => {
    const restore = async () => {
      const raw = localStorage.getItem(UI_STATE_KEY);
      if (!raw) {
        setRestoring(false);
        return;
      }

      try {
        const state = JSON.parse(raw) as PersistedUIState;
        setRootPath(state.rootPath ?? "");
        setLeftPaneWidth(Math.min(560, Math.max(220, state.leftPaneWidth ?? 280)));
        setTagSearchMode(state.tagSearchMode === "exclude" ? "exclude" : "include");

        if (!state.rootPath) {
          setRestoring(false);
          return;
        }

        const opened = await openDataset(state.rootPath);
        setCategories(opened.categories);
        setStats(opened.tagStats);
        const nextCategory = state.activeCategory || "all";
        const nextInclude = state.includeTags ?? [];
        const nextExclude = state.excludeTags ?? [];
        setActiveCategory(nextCategory);
        setIncludeTags(nextInclude);
        setExcludeTags(nextExclude);

        const listed = await listImages({
          category: nextCategory === "all" ? undefined : nextCategory,
          hasTag: nextInclude,
          notTag: nextExclude,
          page: 1,
          pageSize: 1000,
        });
        setImages(listed.items);
        const visibleIdSet = new Set(listed.items.map((v) => v.id));
        const restoredSelected = (state.selected ?? []).filter((id) => visibleIdSet.has(id));
        setSelected(restoredSelected);

        const requestedActiveId = state.activeImageId;
        const activeId =
          requestedActiveId && visibleIdSet.has(requestedActiveId)
            ? requestedActiveId
            : (listed.items[0]?.id ?? null);
        setActiveImageId(activeId);
        setActiveImage(activeId ? (listed.items.find((v) => v.id === activeId) ?? null) : null);
        setMessage(`Restored ${listed.items.length} images`);
      } catch {
        setMessage("Failed to restore previous session state");
      } finally {
        setRestoring(false);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (restoring) return;
    const state: PersistedUIState = {
      rootPath,
      activeCategory,
      includeTags,
      excludeTags,
      selected,
      activeImageId,
      leftPaneWidth,
      tagSearchMode,
    };
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  }, [restoring, rootPath, activeCategory, includeTags, excludeTags, selected, activeImageId, leftPaneWidth, tagSearchMode]);

  useEffect(() => {
    if (!activeImageId) {
      setActiveImage(null);
      return;
    }
    const next = images.find((i) => i.id === activeImageId) ?? null;
    if (next) {
      setActiveImage(next);
    }
  }, [images, activeImageId]);

  useEffect(() => {
    if (!resizingLeftPane) return;

    const onMouseMove = (e: MouseEvent) => {
      const min = 220;
      const max = 560;
      setLeftPaneWidth(Math.min(max, Math.max(min, e.clientX)));
    };
    const onMouseUp = () => setResizingLeftPane(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingLeftPane]);

  const reloadImages = async (override?: { include?: string[]; exclude?: string[]; category?: string }) => {
    const data = await listImages({
      category: (override?.category ?? activeCategory) === "all" ? undefined : override?.category ?? activeCategory,
      hasTag: override?.include ?? includeTags,
      notTag: override?.exclude ?? excludeTags,
      page: 1,
      pageSize: 1000,
    });
    const visibleIdSet = new Set(data.items.map((v) => v.id));
    setSelected((prev) => prev.filter((id) => visibleIdSet.has(id)));
    setImages(data.items);
    const hasCurrent = !!activeImageId && data.items.some((v) => v.id === activeImageId);
    const nextActiveId = hasCurrent ? activeImageId : (data.items[0]?.id ?? null);
    const nextActiveImage = nextActiveId ? (data.items.find((v) => v.id === nextActiveId) ?? null) : null;
    setActiveImageId(nextActiveId);
    setActiveImage(nextActiveImage);
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
      const first = res.images[0] ?? null;
      setActiveImageId(first?.id ?? null);
      setActiveImage(first);
      setMessage(`Loaded ${res.total} images`);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const onClickImage = (id: string, index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveImageId(id);
    setActiveImage(images[index] ?? null);
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

  const onToggleSelect = (id: string) => {
    setActiveImageId(id);
    setActiveImage(images.find((v) => v.id === id) ?? null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
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

  const applyTagSearch = async () => {
    const tag = tagSearchInput.trim();
    if (!tag) return;
    if (tagSearchMode === "include") {
      await applyIncludeFilter(tag);
    } else {
      await applyExcludeFilter(tag);
    }
    setTagSearchInput("");
  };

  const clearTagFilters = async () => {
    setIncludeTags([]);
    setExcludeTags([]);
    await reloadImages({ include: [], exclude: [] });
  };

  const addTagsToSelected = async (tags: string[]) => {
    const normalized = normalizeTags(tags);
    const targetIds = selectedImages.map((v) => v.id);
    if (!normalized.length || !targetIds.length) return;
    await batchAddTags(targetIds, normalized);
    await reloadImages();
    await refreshStats();
    setMessage(`Added tags to ${targetIds.length} selected images`);
  };

  const removeTagFromSelected = async (tag: string) => {
    const targetIds = selectedImages.map((v) => v.id);
    if (!tag || !targetIds.length) return;
    await batchRemoveTags(targetIds, [tag]);
    await reloadImages();
    await refreshStats();
    setMessage(`Removed tag from ${targetIds.length} selected images`);
  };

  const undo = () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) return;
    void action;
    setMessage("Undo is currently disabled for shared tag operations");
  };

  const redo = () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) return;
    void action;
    setMessage("Redo is currently disabled for shared tag operations");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingContext =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const isInteractiveControl =
        !!target &&
        !!target.closest("button, a, [role='button'], [role='link'], [role='menuitem']");

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
        setMessage("Auto-save via batch operations is active");
      }
      if (isTypingContext || isInteractiveControl) {
        return;
      }
      if (e.key === "ArrowLeft" && activeImageId) {
        const idx = images.findIndex((v) => v.id === activeImageId);
        if (idx > 0) setActiveImageId(images[idx - 1].id);
      }
      if (e.key === "ArrowRight" && activeImageId) {
        const idx = images.findIndex((v) => v.id === activeImageId);
        if (idx + 1 < images.length) setActiveImageId(images[idx + 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeImage, activeImageId, images]);

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
        <div className="ml-auto flex items-center gap-2">
          <select
            value={tagSearchMode}
            onChange={(e) => setTagSearchMode(e.target.value as "include" | "exclude")}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            title="Tag search mode"
          >
            <option value="include">Include</option>
            <option value="exclude">Exclude</option>
          </select>
          <input
            value={tagSearchInput}
            onChange={(e) => setTagSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void applyTagSearch();
              }
            }}
            placeholder="Tag search"
            className="w-[220px] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          />
          <button onClick={() => void applyTagSearch()} className="rounded bg-cyan-700 px-2 py-1 text-sm hover:bg-cyan-600">
            Apply
          </button>
          <button onClick={() => void clearTagFilters()} className="rounded bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700">
            Clear
          </button>
        </div>
        <div className="text-xs text-slate-400">{message}</div>
      </header>

      <main
        className="relative grid h-[calc(100vh-44px)]"
        style={{ gridTemplateColumns: `${leftPaneWidth}px 1fr 360px` }}
      >
        <CategoryTree
          categories={categories}
          current={activeCategory}
          activeImage={activeImage}
          onSelect={async (c) => {
            setActiveCategory(c);
            await reloadImages({ category: c });
          }}
        />

        <div
          className="absolute bottom-0 top-0 z-10 w-1 cursor-col-resize bg-cyan-700/0 hover:bg-cyan-500/60"
          style={{ left: `${leftPaneWidth - 1}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingLeftPane(true);
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
              onToggleSelect={onToggleSelect}
            />
          </div>
          <TagStatsPanel
            stats={stats}
            onIncludeTag={(tag) => {
              void applyIncludeFilter(tag);
            }}
            onExcludeTag={(tag) => {
              void applyExcludeFilter(tag);
            }}
          />
        </div>

        <TagEditorPanel
          selectedCount={selectedImages.length}
          commonTags={commonTags}
          allTags={tagDictionary}
          onAddTags={addTagsToSelected}
          onRemoveTag={removeTagFromSelected}
          onFilterInclude={applyIncludeFilter}
          onFilterExclude={applyExcludeFilter}
        />
      </main>
    </div>
  );
}
