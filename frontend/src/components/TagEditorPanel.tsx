import { useMemo, useState } from "react";
import type { ImageEntry } from "../types/models";

interface Props {
  activeImage: ImageEntry | null;
  allTags: string[];
  onSetTags: (nextTags: string[]) => void;
  onFilterInclude: (tag: string) => void;
  onFilterExclude: (tag: string) => void;
}

function parseInputTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TagEditorPanel({ activeImage, allTags, onSetTags, onFilterInclude, onFilterExclude }: Props) {
  const [input, setInput] = useState("");

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return allTags.slice(0, 30);
    return allTags.filter((t) => t.toLowerCase().includes(q)).slice(0, 30);
  }, [allTags, input]);

  if (!activeImage) {
    return <div className="h-full border-l border-slate-800 p-3 text-sm text-slate-400">No image selected</div>;
  }

  const removeTag = (tag: string) => onSetTags(activeImage.tags.filter((t) => t !== tag));
  const addTags = (raw: string) => {
    const incoming = parseInputTags(raw);
    if (!incoming.length) return;
    const next = [...activeImage.tags];
    for (const t of incoming) {
      if (!next.includes(t)) next.push(t);
    }
    onSetTags(next);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col border-l border-slate-800 p-3">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Tag Cloud</h2>
      <div className="mb-3 flex flex-wrap gap-2 overflow-y-auto rounded border border-slate-800 bg-slate-900 p-2">
        {activeImage.tags.map((tag) => (
          <div key={tag} className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs">
            <button onClick={() => onFilterInclude(tag)} className="font-mono text-green-300" title="include">
              +
            </button>
            <button onClick={() => onFilterExclude(tag)} className="font-mono text-rose-300" title="exclude">
              -
            </button>
            <span>{tag}</span>
            <button onClick={() => removeTag(tag)} className="text-rose-300">
              ×
            </button>
          </div>
        ))}
      </div>

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
      <div className="grid grid-cols-1 gap-1 overflow-y-auto text-xs">
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

      <div className="mt-4 rounded border border-slate-800 bg-slate-900 p-2 text-xs text-slate-300">
        <div>{activeImage.baseName}</div>
        <div>
          {activeImage.metadata.width}×{activeImage.metadata.height}
        </div>
        <div>{(activeImage.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
      </div>
    </div>
  );
}
