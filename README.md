# Subscription & Expense Analyzer

A 100% local-first, client-side personal finance dashboard. Upload (or paste)
a bank statement and it will:

- Parse CSV/TXT statements with flexible column-header detection
- Auto-categorize transactions by merchant keywords (editable per row)
- Detect recurring subscriptions using a frequency scanner (28–31 day cadence)
- Visualize spending by category and project 1/6/12/24/60-month subscription costs
- Let you flag subscriptions to "Keep" or "Cancel" and see the savings update live

**No backend. No network calls. No data storage.** Everything — file reads,
parsing, categorization, and charting — runs in your browser's memory and
disappears on refresh.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Use `npm run build` to produce a static
`dist/` bundle you can host anywhere (or just open locally) — still no server
component required.

## Tech stack

- React + Vite
- Tailwind CSS v4
- Recharts (pie + bar charts)
- lucide-react (icons)
