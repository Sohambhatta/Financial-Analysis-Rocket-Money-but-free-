import { useMemo, useEffect, useState } from 'react';
import { Search, ListFilter, CalendarDays } from 'lucide-react';
import { CATEGORIES } from '../utils/categorize';
import { formatCurrency, formatDate } from '../utils/format';
import { CATEGORY_COLORS } from './CategoryPieChart';

export default function TransactionTable({
  transactions,
  onCategoryChange,
  monthOptions,
  monthFilter,
  onMonthFilterChange,
}) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Clear local search/category filters whenever a specific month is jumped to,
  // so the "view statement" drill-down isn't hidden behind a stale filter.
  useEffect(() => {
    if (monthFilter !== 'All') {
      setQuery('');
      setCategoryFilter('All');
    }
  }, [monthFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (categoryFilter === 'All' ? true : t.category === categoryFilter))
      .filter((t) => {
        if (monthFilter === 'All') return true;
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === monthFilter;
      })
      .filter((t) => (q ? t.description.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date - a.date);
  }, [transactions, query, categoryFilter, monthFilter]);

  return (
    <div id="transactions-section" className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-zinc-100">All Transactions</h3>
        <div className="flex flex-wrap gap-2 sm:items-center">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search merchant..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none sm:w-48"
            />
          </div>
          <div className="relative">
            <CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={monthFilter}
              onChange={(e) => onMonthFilterChange(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-700 bg-zinc-950/60 py-1.5 pl-8 pr-8 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="All">All months</option>
              {monthOptions.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <ListFilter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-700 bg-zinc-950/60 py-1.5 pl-8 pr-8 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
            >
              <option>All</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  No transactions match your filters.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                <td className="whitespace-nowrap px-5 py-2.5 text-zinc-400">{formatDate(t.date)}</td>
                <td className="px-5 py-2.5 text-zinc-200">{t.description}</td>
                <td
                  className={`whitespace-nowrap px-5 py-2.5 text-right font-medium ${
                    t.amount < 0 ? 'text-zinc-200' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-5 py-2.5">
                  <select
                    value={t.category}
                    onChange={(e) => onCategoryChange(t.id, e.target.value)}
                    style={{ color: CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Miscellaneous }}
                    className="rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} style={{ color: CATEGORY_COLORS[c] }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-zinc-800 px-5 py-2.5 text-xs text-zinc-500">
        Showing {filtered.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
