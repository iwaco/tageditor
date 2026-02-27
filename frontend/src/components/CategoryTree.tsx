interface Props {
  categories: string[];
  current: string;
  onSelect: (category: string) => void;
}

export function CategoryTree({ categories, current, onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto border-r border-slate-800 p-3">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Categories</h2>
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => onSelect("all")}
            className={`w-full rounded px-2 py-1 text-left text-sm ${
              current === "all" ? "bg-cyan-700 text-white" : "hover:bg-slate-800"
            }`}
          >
            All
          </button>
        </li>
        {categories.map((c) => (
          <li key={c}>
            <button
              onClick={() => onSelect(c)}
              className={`w-full rounded px-2 py-1 text-left text-sm ${
                current === c ? "bg-cyan-700 text-white" : "hover:bg-slate-800"
              }`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
