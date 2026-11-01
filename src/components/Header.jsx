import { ShieldCheck, Wallet } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-50 sm:text-xl">
              Subscription &amp; Expense Analyzer
            </h1>
            <p className="text-xs text-zinc-500">Rocket Money-style insights, fully in your browser</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:self-auto">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">
            100% Private &amp; Local-Only — nothing ever leaves your device
          </span>
        </div>
      </div>
    </header>
  );
}
