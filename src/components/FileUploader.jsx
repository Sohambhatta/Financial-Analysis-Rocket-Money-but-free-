import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, ClipboardPaste, X, CreditCard, Wallet2 } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.csv', '.txt'];

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, text: e.target.result });
    reader.onerror = () => reject(new Error(`Could not read "${file.name}"`));
    // Reads happen entirely in-browser; file contents never leave this device.
    reader.readAsText(file);
  });
}

export default function FileUploader({ onFilesParsed }) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState('');
  const [account, setAccount] = useState('debit');
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const accepted = [];
      for (const file of files) {
        const lowerName = file.name.toLowerCase();
        const isAccepted =
          ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext)) ||
          file.type === 'text/csv' ||
          file.type === 'text/plain';
        if (isAccepted) accepted.push(file);
      }

      if (!accepted.length) {
        setError('Please upload .csv or .txt bank statement files.');
        return;
      }

      setError('');
      try {
        const results = await Promise.all(accepted.map(readFileAsText));
        onFilesParsed(results, account);
      } catch {
        setError('Could not read one or more of those files. Please try again.');
      }
    },
    [account, onFilesParsed],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Which account is this statement for?
        </p>
        <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-950/60 p-1">
          <button
            type="button"
            onClick={() => setAccount('debit')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              account === 'debit' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet2 size={14} /> Debit Card
          </button>
          <button
            type="button"
            onClick={() => setAccount('credit')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              account === 'credit' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard size={14} /> Credit Card
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? 'border-emerald-400 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <UploadCloud size={32} className={isDragging ? 'text-emerald-400' : 'text-zinc-500'} />
        <div>
          <p className="font-medium text-zinc-200">
            Drag &amp; drop one or more {account} card statements
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            .csv or .txt, multiple months at once — parsed locally, never uploaded
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          {pasteOpen ? <X size={16} /> : <ClipboardPaste size={16} />}
          {pasteOpen ? 'Close paste box' : 'Paste statement text instead'}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <FileText size={14} />
          Supports varying column headers automatically
        </div>
      </div>

      {pasteOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder={'Date, Description, Amount\n01/05/2024, NETFLIX.COM, -15.49\n01/06/2024, TRADER JOES, -64.20'}
            rows={6}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!pasteValue.trim()) {
                setError('Paste some statement text first.');
                return;
              }
              setError('');
              onFilesParsed([{ name: `Pasted ${account} statement`, text: pasteValue }], account);
              setPasteValue('');
              setPasteOpen(false);
            }}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Analyze pasted text
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-amber-400">{error}</p>}
    </div>
  );
}
