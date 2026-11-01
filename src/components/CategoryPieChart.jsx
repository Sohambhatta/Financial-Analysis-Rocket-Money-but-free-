import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';

const COLORS = {
  Housing: '#6366f1', // indigo
  Food: '#f59e0b', // amber
  Transportation: '#38bdf8', // sky
  Entertainment: '#a78bfa', // violet
  Subscriptions: '#34d399', // emerald
  Insurance: '#f472b6', // pink
  Utilities: '#facc15', // yellow
  Shopping: '#fb923c', // orange
  Health: '#4ade80', // green
  Income: '#22d3ee', // cyan
  Miscellaneous: '#a1a1aa', // zinc
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-100">{name}</p>
      <p className="text-zinc-400">
        {formatCurrency(value)} · {(percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export default function CategoryPieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const withPercent = data.map((d) => ({ ...d, percent: total ? d.value / total : 0 }));

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        No spending data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={withPercent}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          stroke="#09090b"
          strokeWidth={2}
        >
          {withPercent.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || COLORS.Miscellaneous} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 12, color: '#d4d4d8' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { COLORS as CATEGORY_COLORS };
