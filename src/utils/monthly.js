/**
 * Groups transactions into month-by-month summaries: total spend, income,
 * and a per-category breakdown for that month. Used for the monthly
 * spending chart and the "view statement" drill-down.
 */
export function buildMonthlySummary(transactions) {
  const map = new Map();

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) {
      map.set(key, {
        monthKey: key,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
        total: 0,
        income: 0,
        count: 0,
        byCategory: {},
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    if (t.amount < 0) {
      const abs = Math.abs(t.amount);
      entry.total += abs;
      entry.byCategory[t.category] = (entry.byCategory[t.category] || 0) + abs;
    } else {
      entry.income += t.amount;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.sortDate - b.sortDate)
    .map((entry) => ({
      ...entry,
      total: Math.round(entry.total * 100) / 100,
      income: Math.round(entry.income * 100) / 100,
      categoryBreakdown: Object.entries(entry.byCategory)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value),
    }));
}
