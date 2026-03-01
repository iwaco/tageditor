import { useEffect, useRef, useState, useMemo } from "react";

interface Props {
  selectedCount: number;
  commonTags: string[];
  allTags: string[];
  onAddTags: (tags: string[]) => Promise<void> | void;
  onRemoveTag: (tag: string) => Promise<void> | void;
  onFilterInclude: (tag: string) => void;
  onFilterExclude: (tag: string) => void;
}

function parseInputTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TagEditorPanel({
  selectedCount,
  commonTags,
  allTags,
  onAddTags,
  onRemoveTag,
  onFilterInclude,
  onFilterExclude,
}: Props) {
  const [input, setInput] = useState("");
  const [tagCloudHeight, setTagCloudHeight] = useState(224);
  const [resizingTagCloud, setResizingTagCloud] = useState(false);
  const dragStartRef = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    if (!resizingTagCloud) return;

    const onMouseMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const next = start.h + (e.clientY - start.y);
      setTagCloudHeight(Math.max(120, Math.min(520, next)));
    };
    const onMouseUp = () => {
      setResizingTagCloud(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingTagCloud]);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return allTags.slice(0, 30);
    return allTags.filter((t) => t.toLowerCase().includes(q)).slice(0, 30);
  }, [allTags, input]);

  if (!selectedCount) {
    return (
      <div className="flex h-full min-h-0 flex-col border-l border-slate-800 p-3 text-sm text-slate-400">
        No image selected
      </div>
    );
  }

  const addTags = (raw: string) => {
    const incoming = parseInputTags(raw);
    if (!incoming.length) return;
    onAddTags(incoming);
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-800 p-3">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">Tag Cloud (Common)</h2>
      <div className="mb-2 text-xs text-slate-400">Selected: {selectedCount} images</div>
      <div
        className="mb-1 min-h-24 flex-none overflow-y-auto rounded border border-slate-800 bg-slate-900 p-2"
        style={{ height: `${tagCloudHeight}px` }}
      >
        <div className="flex flex-wrap gap-2">
          {commonTags.map((tag) => (
            <div key={tag} className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs">
              <button onClick={() => onFilterInclude(tag)} className="font-mono text-green-300" title="include">
                +
              </button>
              <button onClick={() => onFilterExclude(tag)} className="font-mono text-rose-300" title="exclude">
                -
              </button>
              <span>{tag}</span>
              <button onClick={() => onRemoveTag(tag)} className="text-rose-300">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <div
        className="mb-3 h-1 w-full cursor-row-resize rounded bg-cyan-700/0 hover:bg-cyan-500/60"
        onMouseDown={(e) => {
          e.preventDefault();
          dragStartRef.current = { y: e.clientY, h: tagCloudHeight };
          setResizingTagCloud(true);
        }}
      />

      <label className="mb-1 text-xs text-slate-400">Add tags (comma separated)</label>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTags(input);
          }
        }}
        className="mb-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none focus:border-cyan-500"
        placeholder="1girl, blue eyes"
      />
      <button onClick={() => addTags(input)} className="mb-4 rounded bg-cyan-700 px-2 py-1 text-sm hover:bg-cyan-600">
        Add
      </button>

      <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Autocomplete</h3>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1 overflow-y-auto text-xs">
        {suggestions.map((tag) => (
          <button
            key={tag}
            onClick={() => addTags(tag)}
            className="rounded bg-slate-800 px-2 py-1 text-left hover:bg-slate-700"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
