import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiArrowUpRight, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getData } from '../lib/api';
import type { Scheme } from '../lib/types';

export default function SchemesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const schemes = useQuery({
    queryKey: ['schemes', search, category],
    queryFn: () => getData<Scheme[]>('/public/schemes', { q: search, ...(category ? { category } : {}), limit: 100 }),
  });
  const rows = schemes.data || [];
  const categories = [...new Set(rows.map((scheme) => scheme.category).filter((value): value is string => Boolean(value)))];

  return (
    <main className="page-main">
      <section className="page-intro"><p className="eyebrow">The catalogue</p><h1>Explore business support schemes.</h1><p>Browse published schemes and see where your business profile may align. Final eligibility is confirmed by the relevant agency.</p></section>
      <section className="catalogue-controls" aria-label="Filter schemes"><label className="search-field"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search schemes or categories" aria-label="Search schemes" /></label><label className="select-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><span className="result-count">{schemes.isLoading ? 'Loading…' : `${rows.length} schemes`}</span></section>
      {schemes.isError && <p className="notice notice-error">Schemes could not be loaded. Check that the Growthora API is running.</p>}
      {!schemes.isLoading && rows.length === 0 && <div className="empty-state"><img className="empty-mark" src="/assets/images/logo.avif" alt="Growthora Advisory Private Limited" /><h2>No published schemes yet</h2><p>The scheme catalogue is ready, but no schemes are published in the connected database. The source workbook is needed to import the requested 100 schemes.</p><Link className="button button-primary" to="/check">Start your profile anyway <FiArrowUpRight /></Link></div>}
      <div className="scheme-grid">{rows.map((scheme) => <article className="scheme-card" key={scheme.schemeId}><div className="scheme-card-top"><span className="scheme-category">{scheme.category || 'Business support'}</span><span className="scheme-level">{scheme.level || 'Central'}</span></div><p className="scheme-id">{scheme.schemeId}</p><h2>{scheme.name}</h2><p className="scheme-summary">{scheme.description || scheme.ministry || 'Explore scheme information and see how it may align with your profile.'}</p><div className="scheme-card-bottom"><span>{scheme.stateFilter && scheme.stateFilter !== 'All' ? scheme.stateFilter : 'Pan-India'}</span><Link to="/check" aria-label={`Check eligibility for ${scheme.name}`}><FiArrowUpRight /></Link></div></article>)}</div>
    </main>
  );
}