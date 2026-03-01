import type { TagStats } from "../types/models";

interface Props {
  stats: TagStats[];
  onIncludeTag: (tag: string) => void;
  onExcludeTag: (tag: string) => void;
}

export function TagStatsPanel({ stats, onIncludeTag, onExcludeTag }: Props) {
  return (
    <div className="border-t border-slate-800 p-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Tag Frequency</h2>
      <div className="max-h-44 overflow-y-auto text-xs">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-slate-400">
              <th className="w-3/5 text-left">Tag</th>
              <th className="w-1/5 text-right">Count</th>
              <th className="w-1/5 text-right">Filter</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 100).map((s) => (
              <tr key={s.tag} className="border-t border-slate-800">
                <td className="truncate py-1">{s.tag}</td>
                <td className="py-1 text-right">{s.count}</td>
                <td className="py-1">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white hover:bg-emerald-600"
                      onClick={() => onIncludeTag(s.tag)}
                      title="Include this tag"
                    >
                      +
                    </button>
                    <button
                      className="rounded bg-rose-700 px-1.5 py-0.5 text-[10px] text-white hover:bg-rose-600"
                      onClick={() => onExcludeTag(s.tag)}
                      title="Exclude this tag"
                    >
                      -
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
