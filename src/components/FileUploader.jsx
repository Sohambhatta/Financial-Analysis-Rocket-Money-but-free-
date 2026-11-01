import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, ClipboardPaste, X } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.csv', '.txt'];

export default function FileUploader({ onParseText }) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (!file) return;

      const lowerName = file.name.toLowerCase();
      const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext)) || file.type === 'text/csv' || file.type === 'text/plain';

      if (!isAccepted) {
        setError('Please upload a .csv or .txt bank statement file.');
        return;
      }

      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        onParseText(e.target.result, file.name);
      };
      reader.onerror = () => setError('Could not read that file. Please try again.');
      // Reads happen entirely in-browser; the file content never leaves this device.
      reader.readAsText(file);
    },
    [onParseText],
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
          <p className="font-medium text-zinc-200">Drag &amp; drop your bank statement</p>
          <p className="mt-1 text-sm text-zinc-500">.csv or .txt — parsed locally, never uploaded</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
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
              onParseText(pasteValue, 'Pasted statement');
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
