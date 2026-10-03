import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2, FiUpload, FiDownload, FiX } from 'react-icons/fi';
import { apiError, getData } from '../../lib/api';
import type { LookupMap, Scheme } from '../../lib/types';
import { fetchSchemes, removeScheme, setSchemePublished } from '../../services/schemes';
import SchemeImportDialog from './SchemeImportDialog';
import '../../styles/admin-schemes.css';

const fallbackStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
const pageSize = 12;

export default function SchemesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [published, setPublished] = useState('');
  const [complete, setComplete] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState('');
  const lookupQuery = useQuery({ queryKey: ['scheme-form-lookups'], queryFn: () => getData<LookupMap>('/public/lookups') });
  const categoryQuery = useQuery({ queryKey: ['admin-scheme-categories'], queryFn: () => fetchSchemes({ limit: 100, sort: 'category' }) });
  const filters = { q: search, page, limit: pageSize, sort: 'schemeId', level, category, stateFilter, isPublished: published, isComplete: complete };
  const schemesQuery = useQuery({ queryKey: ['admin-schemes', filters], queryFn: () => fetchSchemes(filters) });
  const schemes = schemesQuery.data?.schemes || [];
  const categories = useMemo(() => [...new Set((categoryQuery.data?.schemes || []).map((scheme) => scheme.category).filter((value): value is string => Boolean(value)))].sort(), [categoryQuery.data]);
  const states = lookupQuery.data?.state || fallbackStates;
  const totalPages = schemesQuery.data?.pages || 1;

  async function togglePublished(scheme: Scheme) {
    setError('');
    try {
      await setSchemePublished(scheme._id || scheme.schemeId, !scheme.isPublished);
      await queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
    } catch (cause) { setError(apiError(cause)); }
  }

  async function deleteScheme(scheme: Scheme) {
    if (!window.confirm(`Delete ${scheme.schemeId} · ${scheme.name}? This cannot be undone.`)) return;
    setError('');
    try {
      await removeScheme(scheme._id || scheme.schemeId);
      await queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
    } catch (cause) { setError(apiError(cause)); }
  }

  function clearFilters() {
    setSearch(''); setLevel(''); setCategory(''); setStateFilter(''); setPublished(''); setComplete(''); setPage(1);
  }

  return <main className="admin-content schemes-page">
    <div className="admin-page-heading schemes-heading"><div><p className="eyebrow">CONFIGURATION / CATALOGUE</p><h1>Scheme management</h1><p>Complete eligibility rules and publish schemes for public assessments.</p></div><div className="scheme-toolbar"><button className="button button-quiet" type="button" onClick={() => setImportOpen(true)}><FiUpload /> Import Excel</button><button className="button button-quiet" type="button" onClick={() => void import('../../services/schemes').then(({ downloadSchemeWorkbook }) => downloadSchemeWorkbook())}><FiDownload /> Export Excel</button><Link className="button button-primary" to="/admin/schemes/new"><FiPlus /> Add scheme</Link></div></div>
    <div className="scheme-data-hint"><span>Import the source workbook to load the 100-scheme matrix. New schemes can be started as drafts and completed before publishing.</span><FiX aria-hidden="true" /></div>
    {error && <p className="notice notice-error" role="alert">{error}</p>}
    <section className="scheme-filter-bar" aria-label="Filter schemes">
      <label className="scheme-search"><FiSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search ID, scheme name or category" aria-label="Search schemes" /></label>
      <label><span className="visually-hidden">Level</span><select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="">All levels</option><option>Central</option><option>Central/State</option><option>State</option></select></label>
      <label><span className="visually-hidden">Category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span className="visually-hidden">State</span><select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }}><option value="">All states</option>{states.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span className="visually-hidden">Publish status</span><select value={published} onChange={(event) => { setPublished(event.target.value); setPage(1); }}><option value="">Any status</option><option value="true">Published</option><option value="false">Draft</option></select></label>
      <label><span className="visually-hidden">Completeness</span><select value={complete} onChange={(event) => { setComplete(event.target.value); setPage(1); }}><option value="">Any completeness</option><option value="true">Complete</option><option value="false">Incomplete</option></select></label>
      {(search || level || category || stateFilter || published || complete) && <button className="clear-filter" type="button" onClick={clearFilters}>Clear</button>}
    </section>
    {schemesQuery.isError && <p className="notice notice-error" role="alert">Schemes could not be loaded. Check the API connection and your admin session.</p>}
    {schemesQuery.isLoading ? <div className="scheme-loading-list" aria-label="Loading schemes">{Array.from({ length: 5 }, (_, index) => <div key={index} />)}</div> : schemes.length ? <>
      <section className="admin-panel scheme-table-panel"><div className="scheme-table-scroll"><table className="scheme-admin-table"><thead><tr><th>Scheme ID</th><th>Name</th><th>Category</th><th>Level</th><th>State</th><th>Weight</th><th>Complete</th><th>Published</th><th>Actions</th></tr></thead><tbody>{schemes.map((scheme) => <tr key={scheme._id || scheme.schemeId}><td className="scheme-id-cell">{scheme.schemeId}</td><td className="scheme-name-cell">{scheme.name}</td><td>{scheme.category || '—'}</td><td>{scheme.level || '—'}</td><td>{scheme.stateFilter || 'All'}</td><td>{scheme.baseWeight ?? 6}</td><td><span className={`scheme-state-badge ${scheme.isComplete ? 'complete' : 'incomplete'}`}>{scheme.isComplete ? 'Complete' : 'Incomplete'}</span></td><td><button className={`scheme-publish-toggle${scheme.isPublished ? ' is-on' : ''}`} type="button" role="switch" aria-checked={Boolean(scheme.isPublished)} disabled={!scheme.isComplete} title={!scheme.isComplete ? 'Complete required eligibility fields before publishing' : scheme.isPublished ? 'Unpublish' : 'Publish'} onClick={() => void togglePublished(scheme)}><i /><span>{scheme.isPublished ? 'Published' : 'Draft'}</span></button></td><td><div className="scheme-row-actions"><Link to={`/admin/schemes/${encodeURIComponent(scheme._id || scheme.schemeId)}`} aria-label={`View ${scheme.name}`} title="View"><FiEye /></Link><Link to={`/admin/schemes/${encodeURIComponent(scheme._id || scheme.schemeId)}/edit`} aria-label={`Edit ${scheme.name}`} title="Edit"><FiEdit2 /></Link><button type="button" onClick={() => void deleteScheme(scheme)} aria-label={`Delete ${scheme.name}`} title="Delete"><FiTrash2 /></button></div></td></tr>)}</tbody></table></div>
        <div className="scheme-mobile-list">{schemes.map((scheme) => <article className="scheme-mobile-card" key={scheme._id || scheme.schemeId}><div className="scheme-mobile-top"><span className="scheme-id-cell">{scheme.schemeId}</span><span className={`scheme-state-badge ${scheme.isComplete ? 'complete' : 'incomplete'}`}>{scheme.isComplete ? 'Complete' : 'Incomplete'}</span></div><h2>{scheme.name}</h2><p>{[scheme.category, scheme.level, scheme.stateFilter || 'All states'].filter(Boolean).join(' · ')}</p><div className="scheme-mobile-bottom"><button className={`scheme-publish-toggle${scheme.isPublished ? ' is-on' : ''}`} type="button" role="switch" aria-checked={Boolean(scheme.isPublished)} disabled={!scheme.isComplete} onClick={() => void togglePublished(scheme)}><i /><span>{scheme.isPublished ? 'Published' : 'Draft'}</span></button><div className="scheme-row-actions"><Link to={`/admin/schemes/${encodeURIComponent(scheme._id || scheme.schemeId)}`} aria-label={`View ${scheme.name}`}><FiEye /></Link><Link to={`/admin/schemes/${encodeURIComponent(scheme._id || scheme.schemeId)}/edit`} aria-label={`Edit ${scheme.name}`}><FiEdit2 /></Link><button type="button" onClick={() => void deleteScheme(scheme)} aria-label={`Delete ${scheme.name}`}><FiTrash2 /></button></div></div></article>)}</div>
        <div className="scheme-pagination"><span>{schemesQuery.data?.total || 0} schemes</span><div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><FiChevronLeft /></button><span>Page {page} of {totalPages}</span><button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><FiChevronRight /></button></div></div>
      </section>
    </> : <section className="admin-panel scheme-empty"><img src="/assets/images/orglogo.jpeg" alt="Growthora Advisory Private Limited" /><h2>No schemes match these filters</h2><p>Import an Excel workbook or create a scheme draft, then complete its eligibility rules before publishing.</p><div><button className="button button-quiet" type="button" onClick={() => setImportOpen(true)}><FiUpload /> Import Excel</button><Link className="button button-primary" to="/admin/schemes/new"><FiPlus /> Add scheme</Link></div></section>}
    {importOpen && <SchemeImportDialog onClose={() => setImportOpen(false)} onImported={() => { setImportOpen(false); void queryClient.invalidateQueries({ queryKey: ['admin-schemes'] }); void queryClient.invalidateQueries({ queryKey: ['admin-scheme-categories'] }); }} />}
  </main>;
}