import { useMemo, useState, useEffect } from 'react';
import { CalendarRange, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { CATEGORY_COLORS } from './CategoryPieChart';

export default function MonthlyBreakdown({ monthlySummary, onViewStatement }) {
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (monthlySummary.length && !monthlySummary.some((m) => m.monthKey === selectedKey)) {
      setSelectedKey(monthlySummary[monthlySummary.length - 1].monthKey);
    }
  }, [monthlySummary, selectedKey]);

  const selected = useMemo(
    () => monthlySummary.find((m) => m.monthKey === selectedKey) || null,
    [monthlySummary, selectedKey],
  );

  if (!monthlySummary.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-sm text-zinc-500">
        No transactions yet to break down by month.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarRange size={18} className="text-indigo-400" />
        <h3 className="font-semibold text-zinc-100">Purchase Types by Month</h3>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {monthlySummary.map((m) => (
          <button
            key={m.monthKey}
            type="button"
            onClick={() => setSelectedKey(m.monthKey)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              m.monthKey === selectedKey
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200'
                : 'border-zinc-700 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="font-semibold">{m.label}</div>
            <div className="text-zinc-500">{formatCurrency(m.total)}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-1 gap-5 border-t border-zinc-800 pt-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Spend by category — {selected.label}
            </p>
            <ul className="space-y-2">
              {selected.categoryBreakdown.length === 0 && (
                <li className="text-sm text-zinc-500">No spending this month.</li>
              )}
              {selected.categoryBreakdown.map((c) => {
                const pct = selected.total ? (c.value / selected.total) * 100 : 0;
                return (
                  <li key={c.name} className="text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[c.name] || CATEGORY_COLORS.Miscellaneous }}
                        />
                        {c.name}
                      </span>
                      <span className="font-medium text-zinc-200">{formatCurrency(c.value)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[c.name] || CATEGORY_COLORS.Miscellaneous,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total spent</span>
                <span className="font-semibold text-zinc-100">{formatCurrency(selected.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Income / deposits</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(selected.income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Transactions</span>
                <span className="font-semibold text-zinc-100">{selected.count}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onViewStatement(selected.monthKey)}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30"
            >
              View {selected.label} statement <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
