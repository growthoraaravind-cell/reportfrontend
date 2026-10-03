import { useState, type DragEvent } from 'react';
import { FiCheck, FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import { apiError } from '../../lib/api';
import type { SchemeImportPreview, SchemeImportResult } from '../../lib/types';
import { importSchemeWorkbook, previewSchemeWorkbook } from '../../services/schemes';

export default function SchemeImportDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [preview, setPreview] = useState<SchemeImportPreview | null>(null);
  const [result, setResult] = useState<SchemeImportResult | null>(null);
  const [mode, setMode] = useState<'skip' | 'update'>('skip');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  async function selectFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx') || file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setError('Choose an Excel .xlsx workbook.'); return;
    }
    if (file.size > 10 * 1024 * 1024) { setError('The workbook must be 10 MB or smaller.'); return; }
    setBusy(true); setError(''); setPreview(null); setResult(null); setProgress(0);
    try { setPreview(await previewSchemeWorkbook(file, setProgress)); }
    catch (cause) { setError(apiError(cause)); }
    finally { setBusy(false); }
  }

  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); setDragging(false); void selectFile(event.dataTransfer.files[0]); }

  async function runImport() {
    if (!preview) return;
    setBusy(true); setError('');
    try { setResult(await importSchemeWorkbook(preview.fileId, mode)); }
    catch (cause) { setError(apiError(cause)); }
    finally { setBusy(false); }
  }

  return <div className="scheme-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="scheme-import-dialog" role="dialog" aria-modal="true" aria-labelledby="scheme-import-title">
      <header><div><p className="eyebrow">BULK CATALOGUE LOAD</p><h2 id="scheme-import-title">Import schemes from Excel</h2></div><button type="button" aria-label="Close import" onClick={onClose} disabled={busy}><FiX /></button></header>
      {!result ? <>
        {!preview && <label className={`scheme-dropzone${dragging ? ' is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}><FiUploadCloud /><strong>{busy ? 'Uploading and checking workbook…' : 'Drop your .xlsx workbook here'}</strong><span>or choose a file from this device · up to 10 MB</span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void selectFile(event.target.files?.[0])} disabled={busy} /></label>}
        {progress > 0 && busy && <div className="scheme-upload-progress"><progress max="100" value={progress} /><span>{progress}%</span></div>}
        {preview && <><div className="import-preview-summary"><FiFileText /><div><strong>{preview.originalName}</strong><span>{preview.totalRows} rows · {preview.newRows} new · {preview.existingRows} already in catalogue</span></div><button type="button" onClick={() => { setPreview(null); setProgress(0); }} aria-label="Choose another workbook"><FiX /></button></div><div className="import-stat-row"><span><strong>{preview.completeRows}</strong> complete</span><span><strong>{preview.placeholders}</strong> placeholders</span><span><strong>{preview.errors.length}</strong> parse errors</span></div><div className="import-mode"><strong>Existing scheme IDs</strong><label><input type="radio" name="import-mode" checked={mode === 'skip'} onChange={() => setMode('skip')} /> Skip existing</label><label><input type="radio" name="import-mode" checked={mode === 'update'} onChange={() => setMode('update')} /> Update existing</label></div><div className="import-preview-table-wrap"><table className="import-preview-table"><thead><tr><th>Excel row</th><th>Scheme ID</th><th>Name</th><th>Category</th><th>Rules</th></tr></thead><tbody>{preview.preview.map((scheme, index) => <tr key={`${scheme.schemeId}-${index}`}><td>{scheme.__excelRow}</td><td>{scheme.schemeId}</td><td>{scheme.name}</td><td>{scheme.category || '—'}</td><td>{scheme.isComplete ? 'Complete' : 'Draft'}</td></tr>)}</tbody></table></div>{preview.errors.length > 0 && <details className="import-errors"><summary>Review first {Math.min(preview.errors.length, 25)} parse errors</summary>{preview.errors.slice(0, 25).map((item, index) => <p key={`${item.row}-${index}`}>Row {item.row}{item.schemeId ? ` · ${item.schemeId}` : ''}: {item.message}</p>)}</details>}</>}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <footer><button className="button button-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" type="button" disabled={!preview || busy} onClick={() => void runImport()}>{busy ? 'Importing…' : 'Import workbook'}</button></footer>
      </> : <div className="import-result"><span className="import-result-icon"><FiCheck /></span><h3>Import finished</h3><p>{result.created} created · {result.updated} updated · {result.skipped} skipped · {result.failed} failed</p>{result.errors.length > 0 && <details className="import-errors" open><summary>Row errors ({result.errors.length})</summary>{result.errors.map((item, index) => <p key={`${item.row}-${index}`}>Row {item.row}{item.schemeId ? ` · ${item.schemeId}` : ''}: {item.message}</p>)}</details>}<footer><button className="button button-primary" type="button" onClick={onImported}>Done</button></footer></div>}
    </section>
  </div>;
}