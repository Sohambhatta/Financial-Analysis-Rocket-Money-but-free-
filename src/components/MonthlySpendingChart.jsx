import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-100">{label}</p>
      <p className="text-indigo-300">Spent: {formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function MonthlySpendingChart({ monthlySummary }) {
  const [chartType, setChartType] = useState('bar');

  const data = monthlySummary.map((m) => ({ label: m.label, value: m.total }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-400" />
          <h3 className="font-semibold text-zinc-100">Month-by-Month Spending</h3>
        </div>
        <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-950/60 p-1">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            aria-label="Bar chart"
            className={`rounded-md p-1.5 transition-colors ${
              chartType === 'bar' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            aria-label="Line chart"
            className={`rounded-md p-1.5 transition-colors ${
              chartType === 'line' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LineChartIcon size={15} />
          </button>
        </div>
      </div>

      {!data.length ? (
        <div className="flex h-72 items-center justify-center text-sm text-zinc-500">No monthly data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#34d399' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
