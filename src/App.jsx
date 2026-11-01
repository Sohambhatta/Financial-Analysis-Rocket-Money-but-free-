import { useMemo, useState, useCallback } from 'react';
import {
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RotateCcw,
  Wallet2,
  CreditCard,
  Layers,
} from 'lucide-react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import FileUploader from './components/FileUploader';
import CategoryPieChart from './components/CategoryPieChart';
import ProjectionChart from './components/ProjectionChart';
import MonthlySpendingChart from './components/MonthlySpendingChart';
import MonthlyBreakdown from './components/MonthlyBreakdown';
import SubscriptionList from './components/SubscriptionList';
import TransactionTable from './components/TransactionTable';
import { parseStatementText } from './utils/parser';
import { categorize } from './utils/categorize';
import { detectSubscriptions } from './utils/subscriptions';
import { generateSampleTransactions } from './utils/sampleData';
import { buildMonthlySummary } from './utils/monthly';

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `tx-${Date.now()}-${idCounter}`;
}

function monthsSpanned(transactions) {
  if (!transactions.length) return 1;
  const dates = transactions.map((t) => t.date.getTime());
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  const months = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
  return Math.max(1, months);
}

export default function App() {
  const [transactions, setTransactions] = useState(() => generateSampleTransactions());
  const [uploadedSources, setUploadedSources] = useState([]);
  const [isSampleData, setIsSampleData] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState({});
  const [parseNotice, setParseNotice] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [tableMonthFilter, setTableMonthFilter] = useState('All');

  const handleFilesParsed = useCallback((fileResults, account) => {
    let totalParsed = 0;
    let totalFailed = [];
    const newTransactions = [];

    for (const { text, name } of fileResults) {
      const parsed = parseStatementText(text);
      if (!parsed.length) {
        totalFailed.push(name);
        continue;
      }
      totalParsed += parsed.length;
      for (const t of parsed) {
        newTransactions.push({
          id: nextId(),
          date: t.date,
          description: t.description,
          amount: t.amount,
          account,
          category: categorize(t.description),
        });
      }
    }

    if (!newTransactions.length) {
      setParseNotice(
        'Could not detect any transactions in those file(s). Try a standard CSV export with Date, Description, and Amount columns.',
      );
      return;
    }

    setTransactions((prev) => (isSampleData ? newTransactions : [...prev, ...newTransactions]));
    setIsSampleData(false);
    setSubscriptionStatus({});
    setUploadedSources((prev) => {
      const base = isSampleData ? [] : prev;
      return [
        ...base,
        ...fileResults
          .filter((f) => !totalFailed.includes(f.name))
          .map((f) => ({ name: f.name, account })),
      ];
    });

    const failedNote = totalFailed.length ? ` Could not parse: ${totalFailed.join(', ')}.` : '';
    setParseNotice(
      `Parsed ${totalParsed} transaction${totalParsed === 1 ? '' : 's'} from ${fileResults.length - totalFailed.length} ${account} statement file(s).${failedNote}`,
    );
  }, [isSampleData]);

  const handleCategoryChange = useCallback((id, category) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
  }, []);

  const handleToggleSubscriptionStatus = useCallback((id, status) => {
    setSubscriptionStatus((prev) => ({ ...prev, [id]: status }));
  }, []);

  const resetToSample = useCallback(() => {
    setTransactions(generateSampleTransactions());
    setUploadedSources([]);
    setIsSampleData(true);
    setSubscriptionStatus({});
    setParseNotice('');
    setAccountFilter('all');
    setTableMonthFilter('All');
  }, []);

  const handleViewStatement = useCallback((monthKey) => {
    setTableMonthFilter(monthKey);
    requestAnimationFrame(() => {
      document.getElementById('transactions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Everything below derives from the account-filtered transaction set so the
  // "All / Debit / Credit" toggle drives the whole dashboard at once.
  const visibleTransactions = useMemo(
    () => (accountFilter === 'all' ? transactions : transactions.filter((t) => t.account === accountFilter)),
    [transactions, accountFilter],
  );

  const subscriptions = useMemo(() => detectSubscriptions(visibleTransactions), [visibleTransactions]);

  const months = useMemo(() => monthsSpanned(visibleTransactions), [visibleTransactions]);

  const totalMonthlySpending = useMemo(() => {
    const totalSpend = visibleTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return totalSpend / months;
  }, [visibleTransactions, months]);

  const monthlyRecurringTotal = useMemo(
    () => subscriptions.reduce((sum, s) => sum + s.amount, 0),
    [subscriptions],
  );

  const potentialSavings = useMemo(() => {
    return subscriptions
      .filter((s) => subscriptionStatus[s.id] === 'cancel')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions, subscriptionStatus]);

  const cancelCount = useMemo(
    () => subscriptions.filter((s) => subscriptionStatus[s.id] === 'cancel').length,
    [subscriptions, subscriptionStatus],
  );

  const categoryData = useMemo(() => {
    const totals = new Map();
    for (const t of visibleTransactions) {
      if (t.amount >= 0) continue;
      const amt = Math.abs(t.amount);
      totals.set(t.category, (totals.get(t.category) || 0) + amt);
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [visibleTransactions]);

  const monthlySummary = useMemo(() => buildMonthlySummary(visibleTransactions), [visibleTransactions]);

  const monthOptions = useMemo(
    () => monthlySummary.map((m) => ({ monthKey: m.monthKey, label: m.label })),
    [monthlySummary],
  );

  const debitCount = useMemo(() => transactions.filter((t) => t.account === 'debit').length, [transactions]);
  const creditCount = useMemo(() => transactions.filter((t) => t.account === 'credit').length, [transactions]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      <Header />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section className="space-y-3">
          <FileUploader onFilesParsed={handleFilesParsed} />

          <div className="flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Currently analyzing:{' '}
              <span className="text-zinc-300">
                {isSampleData ? 'Sample demo data' : `${uploadedSources.length} uploaded statement(s)`}
              </span>{' '}
              ({transactions.length} transactions)
            </span>
            <button
              type="button"
              onClick={resetToSample}
              className="inline-flex items-center gap-1.5 self-start text-zinc-400 hover:text-zinc-200"
            >
              <RotateCcw size={13} /> Reset to sample data
            </button>
          </div>
          {parseNotice && <p className="text-sm text-indigo-300">{parseNotice}</p>}

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">View:</span>
            <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900/60 p-1">
              <button
                type="button"
                onClick={() => setAccountFilter('all')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  accountFilter === 'all' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers size={13} /> All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setAccountFilter('debit')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  accountFilter === 'debit' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wallet2 size={13} /> Debit ({debitCount})
              </button>
              <button
                type="button"
                onClick={() => setAccountFilter('credit')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  accountFilter === 'credit'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CreditCard size={13} /> Credit ({creditCount})
              </button>
            </div>
          </div>
        </section>

        <SummaryCards
          totalMonthlySpending={totalMonthlySpending}
          totalRecurring={monthlyRecurringTotal}
          potentialSavings={potentialSavings}
          subscriptionCount={subscriptions.length}
          cancelCount={cancelCount}
        />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-zinc-100">Spending by Category</h3>
            </div>
            <CategoryPieChart data={categoryData} />
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <LineChartIcon size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-zinc-100">Projected Subscription Cost</h3>
            </div>
            <ProjectionChart monthlyRecurringTotal={monthlyRecurringTotal} />
          </div>
        </section>

        <section>
          <MonthlySpendingChart monthlySummary={monthlySummary} />
        </section>

        <section>
          <MonthlyBreakdown monthlySummary={monthlySummary} onViewStatement={handleViewStatement} />
        </section>

        <section>
          <SubscriptionList
            subscriptions={subscriptions}
            statusMap={subscriptionStatus}
            onToggleStatus={handleToggleSubscriptionStatus}
          />
        </section>

        <section>
          <TransactionTable
            transactions={visibleTransactions}
            onCategoryChange={handleCategoryChange}
            monthOptions={monthOptions}
            monthFilter={tableMonthFilter}
            onMonthFilterChange={setTableMonthFilter}
          />
        </section>
      </main>
    </div>
  );
}
