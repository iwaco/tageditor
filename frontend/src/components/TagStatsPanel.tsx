import type { TagStats } from "../types/models";

interface Props {
  stats: TagStats[];
}

export function TagStatsPanel({ stats }: Props) {
  return (
    <div className="border-t border-slate-800 p-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Tag Frequency</h2>
      <div className="max-h-44 overflow-y-auto text-xs">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-slate-400">
              <th className="w-2/3 text-left">Tag</th>
              <th className="w-1/3 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 100).map((s) => (
              <tr key={s.tag} className="border-t border-slate-800">
                <td className="truncate py-1">{s.tag}</td>
                <td className="py-1 text-right">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
