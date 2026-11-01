import { CalendarClock, Check, Ban, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

export default function SubscriptionList({ subscriptions, statusMap, onToggleStatus }) {
  if (!subscriptions.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-sm text-zinc-500">
        No recurring subscriptions detected yet. Upload a few months of statement history so the
        engine can spot charges that repeat every 28–31 days.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
        <CalendarClock size={18} className="text-indigo-400" />
        <h3 className="font-semibold text-zinc-100">Detected Subscriptions Calendar &amp; List</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Amount / mo</th>
              <th className="px-5 py-3 font-medium">Est. Next Due Date</th>
              <th className="px-5 py-3 font-medium">Seen</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const status = statusMap[sub.id] || 'keep';
              const isCancel = status === 'cancel';
              return (
                <tr key={sub.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100">{sub.merchant}</span>
                      {sub.matchedKeyword && (
                        <Sparkles size={13} className="text-amber-400" aria-label="Known subscription keyword match" />
                      )}
                    </div>
                  </td>
                  <td className={`px-5 py-3 font-semibold ${isCancel ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {formatCurrency(sub.amount)}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{formatDate(sub.nextDueDate)}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {sub.occurrences}x · ~{sub.avgIntervalDays}d apart
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(sub.id, 'keep')}
                        className={`inline-flex items-center gap-1 rounded-l-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          !isCancel
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <Check size={13} /> Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(sub.id, 'cancel')}
                        className={`inline-flex items-center gap-1 rounded-r-lg border border-l-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                          isCancel
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <Ban size={13} /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
