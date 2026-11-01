/**
 * Rocket Money-style recurring subscription detection engine.
 * Runs entirely client-side over already-parsed transactions.
 */

// Keywords that strongly suggest a recurring subscription merchant, used to
// give an initial "known subscription" boost even on a single occurrence.
export const SUBSCRIPTION_KEYWORDS = [
  'netflix',
  'spotify',
  'gym',
  'fitness',
  'adobe',
  'apple',
  'google',
  'amazon prime',
  'prime video',
  'prime',
  'msft',
  'microsoft',
  'insurance',
  'utilities',
  'hulu',
  'disney',
  'icloud',
  'youtube premium',
  'playstation plus',
  'xbox game pass',
  'patreon',
  'audible',
  'hbo',
  'paramount',
  'peacock',
  'crunchyroll',
  'dropbox',
  'notion',
  'canva',
  'openai',
  'chatgpt',
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function normalizeMerchant(description) {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(a, b) {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / MS_PER_DAY);
}

function matchesKnownKeyword(merchantKey) {
  return SUBSCRIPTION_KEYWORDS.some((kw) => merchantKey.includes(kw));
}

/**
 * Detects recurring subscriptions by grouping transactions with the exact
 * same normalized merchant description and amount sign, then checking
 * whether they repeat roughly monthly (28-31 days apart).
 *
 * @param {{date: Date, description: string, amount: number}[]} transactions
 * @returns {Array<{merchant: string, amount: number, occurrences: number, lastDate: Date, nextDueDate: Date, avgIntervalDays: number, matchedKeyword: boolean}>}
 */
export function detectSubscriptions(transactions) {
  const groups = new Map();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // subscriptions are charges (negative amounts)
    const key = `${normalizeMerchant(tx.description)}|${Math.abs(tx.amount).toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tx);
  }

  const results = [];

  for (const [key, txs] of groups.entries()) {
    if (txs.length < 2) continue;
    const sorted = [...txs].sort((a, b) => a.date - b.date);

    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    const monthlyIntervals = intervals.filter((d) => d >= 28 && d <= 31);
    const isRecurring = monthlyIntervals.length >= 1 && monthlyIntervals.length === intervals.length;

    const merchantKey = key.split('|')[0];
    const keywordMatch = matchesKnownKeyword(merchantKey);

    // Flag as recurring when the strict 28-31 day cadence holds for every
    // gap, OR when most gaps are monthly-ish and the merchant name matches a
    // well-known subscription keyword (covers slightly irregular billing).
    const looseMonthly =
      intervals.length > 0 &&
      intervals.filter((d) => d >= 27 && d <= 33).length / intervals.length >= 0.6;

    if (!isRecurring && !(keywordMatch && looseMonthly)) continue;

    const last = sorted[sorted.length - 1];
    const avgIntervalDays =
      intervals.reduce((a, b) => a + b, 0) / intervals.length || 30;
    const nextDueDate = new Date(last.date.getTime() + Math.round(avgIntervalDays) * MS_PER_DAY);

    results.push({
      id: key,
      merchant: last.description.trim(),
      amount: Math.abs(last.amount),
      occurrences: sorted.length,
      lastDate: last.date,
      nextDueDate,
      avgIntervalDays: Math.round(avgIntervalDays),
      matchedKeyword: keywordMatch,
    });
  }

  // Highest monthly cost first so the biggest recurring spends surface first.
  results.sort((a, b) => b.amount - a.amount);
  return results;
}
