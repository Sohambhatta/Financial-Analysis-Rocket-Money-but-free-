import { TrendingDown, TrendingUp, RefreshCcw } from 'lucide-react';
import { formatCurrency } from '../utils/format';

function Card({ icon, label, value, sub, accent }) {
  const accentClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }[accent];

  return (
    <div className="flex flex-1 items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-zinc-50">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function SummaryCards({ totalMonthlySpending, totalRecurring, potentialSavings, subscriptionCount, cancelCount }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card
        icon={<TrendingUp size={20} />}
        label="Total Monthly Spending"
        value={formatCurrency(totalMonthlySpending)}
        sub="Avg. across parsed statement history"
        accent="indigo"
      />
      <Card
        icon={<RefreshCcw size={20} />}
        label="Recurring Subscriptions"
        value={formatCurrency(totalRecurring)}
        sub={`${subscriptionCount} detected subscription${subscriptionCount === 1 ? '' : 's'} / month`}
        accent="indigo"
      />
      <Card
        icon={<TrendingDown size={20} />}
        label="Potential Savings"
        value={formatCurrency(potentialSavings)}
        sub={`${cancelCount} item${cancelCount === 1 ? '' : 's'} flagged for cancellation`}
        accent="amber"
      />
    </div>
  );
}
