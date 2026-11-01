/**
 * Synthetic demo dataset so the dashboard has something interesting to show
 * before a user uploads their own statement. Purely generated in-memory.
 */
import { categorize } from './categorize';

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function generateSampleTransactions() {
  const today = new Date();
  const txs = [];
  let idCounter = 0;

  // Recurring subscriptions are modeled as credit card charges (typical real-world pattern).
  const recurring = [
    { desc: 'NETFLIX.COM', amount: -15.49 },
    { desc: 'SPOTIFY USA', amount: -11.99 },
    { desc: 'ADOBE CREATIVE CLOUD', amount: -54.99 },
    { desc: 'APPLE.COM/BILL', amount: -2.99 },
    { desc: 'AMAZON PRIME MEMBERSHIP', amount: -14.99 },
    { desc: 'PLANET FITNESS GYM', amount: -24.99 },
    { desc: 'GEICO INSURANCE', amount: -142.5 },
    { desc: 'CITY UTILITIES ELECTRIC', amount: -87.32 },
    { desc: 'HULU SUBSCRIPTION', amount: -7.99 },
  ];

  for (let m = 5; m >= 0; m--) {
    const base = addMonths(today, -m);
    recurring.forEach((r) => {
      const day = 3 + Math.floor(Math.random() * 3);
      const date = new Date(base.getFullYear(), base.getMonth(), day);
      if (date <= today) {
        txs.push({ date, description: r.desc, amount: r.amount, account: 'credit' });
      }
    });
  }

  // Debit card: everyday essentials, rent, and payroll deposits.
  const debitOneOff = [
    { desc: 'TRADER JOES #432', amountRange: [-20, -90] },
    { desc: 'WHOLE FOODS MARKET', amountRange: [-30, -120] },
    { desc: 'SHELL GAS STATION', amountRange: [-30, -65] },
    { desc: 'RENT PAYMENT - LANDLORD LLC', amountRange: [-1800, -1800] },
    { desc: 'DIRECT DEPOSIT PAYROLL', amountRange: [2400, 3100] },
    { desc: 'CVS PHARMACY', amountRange: [-10, -40] },
  ];

  // Credit card: discretionary / online spending.
  const creditOneOff = [
    { desc: 'UBER TRIP', amountRange: [-8, -45] },
    { desc: 'STARBUCKS COFFEE', amountRange: [-4, -9] },
    { desc: 'AMAZON.COM PURCHASE', amountRange: [-15, -150] },
    { desc: 'CHIPOTLE MEXICAN GRILL', amountRange: [-9, -18] },
    { desc: 'TARGET STORE', amountRange: [-20, -110] },
    { desc: 'AMC THEATRES', amountRange: [-14, -32] },
  ];

  for (let m = 5; m >= 0; m--) {
    const base = addMonths(today, -m);
    const genFor = (pool, account, countRange) => {
      const count = countRange[0] + Math.floor(Math.random() * (countRange[1] - countRange[0] + 1));
      for (let i = 0; i < count; i++) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const day = 1 + Math.floor(Math.random() * 27);
        const date = new Date(base.getFullYear(), base.getMonth(), day);
        if (date > today) continue;
        const [lo, hi] = pick.amountRange;
        const amount = Math.round((lo + Math.random() * (hi - lo)) * 100) / 100;
        txs.push({ date, description: pick.desc, amount, account });
      }
    };
    genFor(debitOneOff, 'debit', [5, 8]);
    genFor(creditOneOff, 'credit', [5, 8]);
  }

  txs.sort((a, b) => a.date - b.date);

  return txs.map((t) => ({
    id: `sample-${idCounter++}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    account: t.account,
    category: categorize(t.description),
  }));
}
