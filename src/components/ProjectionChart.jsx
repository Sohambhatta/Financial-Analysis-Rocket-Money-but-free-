import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-100">{label}</p>
      <p className="text-indigo-300">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function ProjectionChart({ monthlyRecurringTotal }) {
  const data = [
    { label: '1 Month', value: monthlyRecurringTotal },
    { label: '6 Months', value: monthlyRecurringTotal * 6 },
    { label: '1 Year', value: monthlyRecurringTotal * 12 },
    { label: '2 Years', value: monthlyRecurringTotal * 24 },
    { label: '5 Years', value: monthlyRecurringTotal * 60 },
  ];

  if (!monthlyRecurringTotal) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        No recurring subscriptions detected yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
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
    </ResponsiveContainer>
  );
}
