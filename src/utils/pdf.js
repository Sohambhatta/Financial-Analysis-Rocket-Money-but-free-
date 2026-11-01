/**
 * Client-side PDF text extraction using pdf.js.
 *
 * The PDF bytes are decoded and parsed entirely in the browser (pdf.js runs
 * as local JS/WASM) -- the file is never uploaded or sent over the network.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/**
 * Extracts the text of a PDF file, reconstructing each visual row (pdf.js
 * only gives us individual positioned text fragments, not lines/tables) by
 * grouping fragments that share roughly the same vertical position.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const rows = new Map();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      // Round the baseline Y so fragments on the same printed line land in
      // the same bucket even with minor sub-pixel offsets.
      const y = Math.round(item.transform[5] / 2) * 2;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], str: item.str });
    }

    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const cells = rows.get(y).sort((a, b) => a.x - b.x);
      const line = cells
        .map((c) => c.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) lines.push(line);
    }
  }

  return lines.join('\n');
}
