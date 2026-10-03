import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { getData } from '../lib/api';
import type { Scheme } from '../lib/types';

export default function SchemeDetailPage() {
  const { schemeId = '' } = useParams();
  const scheme = useQuery({ queryKey: ['scheme', schemeId], queryFn: () => getData<Scheme>(`/public/schemes/${encodeURIComponent(schemeId)}`) });
  if (scheme.isLoading) return <main className="page-main"><p>Loading scheme…</p></main>;
  if (scheme.isError || !scheme.data) return <main className="page-main"><div className="empty-state"><h1>Scheme details are unavailable</h1><p>This scheme may no longer be published.</p><Link className="button button-primary" to="/schemes"><FiArrowLeft /> Back to schemes</Link></div></main>;
  const item = scheme.data;
  return <main className="page-main scheme-detail"><Link className="text-link" to="/schemes"><FiArrowLeft /> All schemes</Link><p className="eyebrow">{item.schemeId} · {item.category || 'Business support'}</p><h1>{item.name}</h1><p className="scheme-detail-summary">{item.description || item.ministry || 'Explore how this programme may support your business.'}</p><div className="scheme-detail-meta"><span>{item.level || 'Central'}</span><span>{item.stateFilter && item.stateFilter !== 'All' ? item.stateFilter : 'Pan-India'}</span>{item.subsidyPercent ? <span>Up to {item.subsidyPercent}% support</span> : null}</div>{item.benefits?.length ? <section><h2>Potential benefits</h2><ul>{item.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section> : null}{item.documentsRequired?.length ? <section><h2>Documents to prepare</h2><ul>{item.documentsRequired.map((document) => <li key={document}>{document}</li>)}</ul></section> : null}{item.howToApply?.length ? <section><h2>Application steps</h2><ol>{item.howToApply.map((step) => <li key={step}>{step}</li>)}</ol></section> : null}<div className="scheme-detail-actions"><Link className="button button-copper" to="/check">Check your eligibility <FiArrowUpRight /></Link>{item.officialUrl && <a className="button button-quiet" href={item.officialUrl} target="_blank" rel="noreferrer">Official scheme information <FiArrowUpRight /></a>}</div></main>;
}