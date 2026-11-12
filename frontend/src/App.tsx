import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack } from "@astryxdesign/core/Stack";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { batchAddTags, batchRemoveTags, fetchTagStats, listImages, openDataset } from "./lib/api";
import type { EditAction, ImageEntry, TagStats } from "./types/models";
import { useCompactLayout } from "./lib/useCompactLayout";
import { CategoryList } from "./components/CategoryList";
import { CategoryTree } from "./components/CategoryTree";
import { ImageGrid } from "./components/ImageGrid";
import { PreviewPanel } from "./components/PreviewPanel";
import { TagEditorPanel } from "./components/TagEditorPanel";
import { TagSearchBar } from "./components/TagSearchBar";
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

/** Panels of the compact (phone) layout, switched with the bottom tab bar. */
type CompactTab = "images" | "preview" | "tags" | "filter";

// rootPath used to be stored here; old saved values are ignored now that the
// dataset root comes from the server config.
interface PersistedUIState {
  activeCategory: string;
  includeTags: string[];
  excludeTags: string[];
  selected: string[];
  activeImageId: string | null;
  leftPaneWidth: number;
  tagSearchMode: "include" | "exclude";
  addToFront: boolean;
}

export default function App() {
  const [rootPath, setRootPath] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
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
  const [addToFront, setAddToFront] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const isCompact = useCompactLayout();
  const [compactTab, setCompactTab] = useState<CompactTab>("images");

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
      let state: Partial<PersistedUIState> = {};
      try {
        const raw = localStorage.getItem(UI_STATE_KEY);
        if (raw) state = JSON.parse(raw) as Partial<PersistedUIState>;
      } catch {
        state = {};
      }
      setLeftPaneWidth(Math.min(560, Math.max(220, state.leftPaneWidth ?? 280)));
      setTagSearchMode(state.tagSearchMode === "exclude" ? "exclude" : "include");
      setAddToFront(state.addToFront === true);

      try {
        const opened = await openDataset();
        setRootPath(opened.rootPath);
        setOpenError(null);
        setCategories(opened.categories);
        setStats(opened.tagStats);
        const nextCategory =
          state.activeCategory && opened.categories.includes(state.activeCategory) ? state.activeCategory : "all";
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
        setMessage(`Loaded ${listed.items.length} images`);
      } catch (err) {
        const reason = (err as Error).message;
        setOpenError(reason);
        setMessage("Failed to open dataset");
      } finally {
        setRestoring(false);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (restoring) return;
    const state: PersistedUIState = {
      activeCategory,
      includeTags,
      excludeTags,
      selected,
      activeImageId,
      leftPaneWidth,
      tagSearchMode,
      addToFront,
    };
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  }, [restoring, activeCategory, includeTags, excludeTags, selected, activeImageId, leftPaneWidth, tagSearchMode, addToFront]);

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

  const onClickImage = (id: string, index: number, e: ReactMouseEvent<HTMLButtonElement>) => {
    // On a phone there is no double-click or Enter: tapping the image that is
    // already active opens it in the preview tab.
    const isPlainClick = !e.shiftKey && !e.ctrlKey && !e.metaKey;
    if (isCompact && isPlainClick && id === activeImageId) {
      setCompactTab("preview");
    }
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

  // Stand-ins for the arrow keys in the compact preview.
  const stepActiveImage = (delta: number) => {
    const idx = images.findIndex((v) => v.id === activeImageId);
    const next = images[idx + delta];
    if (idx >= 0 && next) setActiveImageId(next.id);
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
    await batchAddTags(targetIds, normalized, addToFront ? "start" : "end");
    await reloadImages();
    await refreshStats();
    setMessage(
      `Added tags to the ${addToFront ? "front" : "end"} of ${targetIds.length} selected images`,
    );
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

  const paneStatus = (
    <div className="pane-status">
      <Text size="sm" color="secondary">
        images: {images.length} | selected: {selected.length}
        {includeTags.length ? ` | include: ${includeTags.join(", ")}` : ""}
        {excludeTags.length ? ` | exclude: ${excludeTags.join(", ")}` : ""}
      </Text>
    </div>
  );

  const selectCategory = async (c: string) => {
    setActiveCategory(c);
    await reloadImages({ category: c });
  };

  // Phone layout: one panel at a time, picked from a bottom tab bar. Every
  // panel stays mounted (only hidden) so typed input and scroll positions
  // survive switching tabs.
  const renderCompactMain = () => (
    <>
      <main className="compact-main">
        <section id="compact-panel-images" className="compact-panel" hidden={compactTab !== "images"}>
          {paneStatus}
          <div className="center-pane-grid">
            <ImageGrid
              images={images}
              selected={selected}
              activeId={activeImageId}
              onClickImage={onClickImage}
              onToggleSelect={onToggleSelect}
              isTouch
            />
          </div>
        </section>
        <section id="compact-panel-preview" className="compact-panel compact-panel-padded" hidden={compactTab !== "preview"}>
          <PreviewPanel
            activeImage={activeImage}
            isTouch
            onPrev={() => stepActiveImage(-1)}
            onNext={() => stepActiveImage(1)}
          />
        </section>
        <section id="compact-panel-tags" className="compact-panel" hidden={compactTab !== "tags"}>
          <TagEditorPanel
            selectedCount={selectedImages.length}
            commonTags={commonTags}
            allTags={tagDictionary}
            onAddTags={addTagsToSelected}
            onRemoveTag={removeTagFromSelected}
            addToFront={addToFront}
            onChangeAddToFront={setAddToFront}
            onFilterInclude={applyIncludeFilter}
            onFilterExclude={applyExcludeFilter}
            isTouch
          />
        </section>
        <section
          id="compact-panel-filter"
          className="compact-panel compact-panel-padded compact-panel-scroll"
          hidden={compactTab !== "filter"}
        >
          <TagSearchBar
            mode={tagSearchMode}
            onChangeMode={setTagSearchMode}
            value={tagSearchInput}
            onChange={setTagSearchInput}
            onApply={() => void applyTagSearch()}
            onClear={() => void clearTagFilters()}
            isTouch
          />
          {paneStatus}
          <div className="compact-categories">
            <CategoryList
              categories={categories}
              current={activeCategory}
              onSelect={(c) => void selectCategory(c)}
              isTouch
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
            isTouch
          />
        </section>
      </main>
      <nav className="compact-tabbar" aria-label="Panels">
        <TabList
          role="tablist"
          aria-label="Panels"
          value={compactTab}
          onChange={(v) => setCompactTab(v as CompactTab)}
          layout="fill"
          size="lg"
        >
          <Tab value="images" label="Images" panelId="compact-panel-images" />
          <Tab value="preview" label="Preview" panelId="compact-panel-preview" />
          <Tab
            value="tags"
            label="Tags"
            panelId="compact-panel-tags"
            endContent={selected.length ? <Badge variant="neutral" label={selected.length} /> : undefined}
          />
          <Tab value="filter" label="Filter" panelId="compact-panel-filter" />
        </TabList>
      </nav>
    </>
  );

  return (
    <div className={`app-shell ${isCompact ? "is-compact" : ""}`}>
      <HStack as="header" className="app-header" gap={2} align="center" padding={2}>
        <Text size="sm" color="secondary" maxLines={1} hasTruncateTooltip className="app-root-path">
          {rootPath || "No dataset opened"}
        </Text>
        <Button label="Undo" variant="secondary" size={isCompact ? "md" : "sm"} onClick={undo} />
        <Button label="Redo" variant="secondary" size={isCompact ? "md" : "sm"} onClick={redo} />
        {isCompact ? null : (
          <TagSearchBar
            className="app-header-search"
            mode={tagSearchMode}
            onChangeMode={setTagSearchMode}
            value={tagSearchInput}
            onChange={setTagSearchInput}
            onApply={() => void applyTagSearch()}
            onClear={() => void clearTagFilters()}
          />
        )}
        <Text size="sm" color="secondary" maxLines={isCompact ? 1 : undefined} className="app-message">
          {message}
        </Text>
      </HStack>

      {openError ? (
        <Banner
          role="alert"
          status="error"
          container="section"
          title="Cannot open dataset"
          description={openError}
          className="app-banner"
        />
      ) : null}

      {isCompact ? (
        renderCompactMain()
      ) : (
        <main className="app-main" style={{ gridTemplateColumns: `${leftPaneWidth}px 1fr 360px` }}>
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
            className="resize-handle resize-handle-col"
            style={{ left: `${leftPaneWidth - 1}px` }}
            onMouseDown={(e) => {
              e.preventDefault();
              setResizingLeftPane(true);
            }}
          />

          <div className="center-pane">
            {paneStatus}
            <div className="center-pane-grid">
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
            addToFront={addToFront}
            onChangeAddToFront={setAddToFront}
            onFilterInclude={applyIncludeFilter}
            onFilterExclude={applyExcludeFilter}
          />
        </main>
      )}
    </div>
  );
}
