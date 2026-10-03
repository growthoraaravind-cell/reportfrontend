import { useQuery } from '@tanstack/react-query';
import { FiArrowRight, FiDownload, FiShare2 } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { getData, track } from '../lib/api';
import type { PublicResult, SchemeMatch } from '../lib/types';

export default function ResultPage() {
  const { token = '' } = useParams();
  const result = useQuery({ queryKey: ['public-result', token], queryFn: () => getData<PublicResult>(`/public/results/${token}`), enabled: Boolean(token) });

  async function shareReport() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: 'Growthora business assessment', url });
    else await navigator.clipboard.writeText(url);
  }

  if (result.isLoading) return <main className="page-main"><p className="page-loading">Preparing your report…</p></main>;
  if (result.isError || !result.data) return <main className="page-main"><div className="empty-state"><h1>We couldn’t find this report.</h1><p>Check that the link is correct or create a new assessment.</p><Link className="button button-primary" to="/check">Start a new assessment <FiArrowRight /></Link></div></main>;

  const report = result.data;
  const matches = report.topSchemes || [];
  const potential = report.resultSummary?.potential;

  return (
    <main className="page-main result-page">
      <section className="result-hero"><p className="eyebrow">YOUR GROWTHORA ASSESSMENT</p><h1>Good work, {report.clientName}.</h1><p>Here’s a practical snapshot of where your business may align and what can strengthen your next steps.</p><div className="result-actions"><button className="button button-light" type="button" onClick={() => void shareReport()}><FiShare2 /> Share report</button>{report.reportPdfUrl && <a className="button button-copper" href={report.reportPdfUrl} target="_blank" rel="noreferrer" onClick={() => void track('report_downloaded', window.location.pathname).catch(() => undefined)}><FiDownload /> Download PDF</a>}</div></section>
      <section className="result-summary"><div className="readiness-meter"><strong>{report.overallReadiness ?? 0}<small>%</small></strong><span>Business readiness</span></div><div className="result-counts"><div><strong>{report.counts?.eligibleNow ?? 0}</strong><span>Eligible now</span></div><div><strong>{report.counts?.afterAction ?? 0}</strong><span>Eligible after action</span></div><div><strong>{report.counts?.lowFit ?? 0}</strong><span>Low fit</span></div></div><div className="profile-summary"><span>{report.entityType}</span><span>{report.businessStage}</span><span>{report.sector}</span><span>{report.state}</span></div></section>
      {potential && potential.additionalSchemes > 0 && <p className="potential-note">Completing key registrations may help unlock up to {potential.additionalSchemes} additional scheme matches in this assessment.</p>}
      <section className="result-section"><div className="result-section-heading"><div><p className="eyebrow">YOUR MATCHES</p><h2>Recommended schemes</h2></div><span>Ranked for your profile</span></div>{matches.length ? <div className="matches-list">{matches.map((scheme, index) => <SchemeMatchCard key={scheme.schemeId} scheme={scheme} rank={index + 1} />)}</div> : <div className="empty-inline"><h3>No published schemes matched yet</h3><p>The assessment ran successfully, but this database has no published schemes. The requested workbook is needed to import and rank the 100 scheme records.</p></div>}</section>
      <section className="quick-wins"><div><p className="eyebrow">BUILD READINESS</p><h2>Quick wins to consider</h2><p>Registrations are profile-dependent. Confirm requirements with the relevant authority before applying.</p></div><div className="readiness-list">{Object.entries(report.readinessFlags || {}).map(([name, flag]) => <div key={name}><span className={flag.missing ? 'flag-dot missing' : 'flag-dot'} /><strong>{name}</strong><span>{flag.missing ? `${flag.unlocks} potential scheme${flag.unlocks === 1 ? '' : 's'} unlocked` : 'Already in place'}</span></div>)}</div></section>
      {(report.audit?.website || report.audit?.social) && <section className="result-digital"><div><p className="eyebrow">DIGITAL PRESENCE</p><h2>Your digital growth snapshot</h2><p>Scores are based on checks available when your assessment was prepared.</p></div><div className="audit-score-grid">{report.audit.website && <AuditScore title="Website" score={report.audit.website.score} />}{report.audit.social && <AuditScore title="Social presence" score={report.audit.social.score} />}</div></section>}
      <section className="result-contact"><div><p className="eyebrow">A real person can help</p><h2>Want to review the options together?</h2><p>Growthora can help you understand the process and prepare the next steps.</p></div><a className="button button-copper" href="https://wa.me/916360886843" target="_blank" rel="noreferrer">Talk to our team <FiArrowRight /></a></section>
      <div className="result-retake"><Link className="text-link" to="/check">Retake assessment <FiArrowRight /></Link></div>
    </main>
  );
}

function SchemeMatchCard({ scheme, rank }: { scheme: SchemeMatch; rank: number }) {
  const statusClass = scheme.status === 'Eligible Now' ? 'status-now' : scheme.status === 'Eligible After Action' ? 'status-action' : 'status-low';
  return <article className="match-card"><span className="match-rank">{String(rank).padStart(2, '0')}</span><div className="match-details"><div className="match-meta"><span>{scheme.category || 'Scheme'}</span><span>{scheme.level || 'Central'}</span></div><h3>{scheme.name}</h3><p>{scheme.why || scheme.description || 'Assessment based on the profile shared.'}</p>{scheme.benefits?.length ? <p className="match-benefits">{scheme.benefits.slice(0, 2).join(' · ')}</p> : null}{scheme.documentsRequired?.length ? <p className="match-documents"><strong>Prepare:</strong> {scheme.documentsRequired.slice(0, 4).join(', ')}</p> : null}{scheme.actions?.length ? <ul>{scheme.actions.map((action) => <li key={action}>{action}</li>)}</ul> : null}<div className="match-actions"><Link to="/contact">Apply with Growthora <FiArrowRight /></Link>{scheme.officialUrl && <a href={scheme.officialUrl} target="_blank" rel="noreferrer">Official details</a>}</div></div><div className="match-score"><span className={`status-badge ${statusClass}`}>{scheme.status}</span><strong>{scheme.score}<small>/{scheme.maxScore}</small></strong><span>match score</span></div></article>;
}

function AuditScore({ title, score }: { title: string; score?: number }) {
  if (typeof score !== 'number') return null;
  return <article className="audit-score"><span>{title}</span><strong>{score}<small>/100</small></strong><div className="score-progress"><i style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div><p>Improvement needed: {100 - score}%</p></article>;
}