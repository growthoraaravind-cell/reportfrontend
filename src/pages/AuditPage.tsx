import { useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiGlobe } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { apiError, postData, visitorId } from '../lib/api';
import type { DigitalAuditResult } from '../lib/types';

interface PlatformAnswers { followers: string; frequency: string; responseTime: string; usesVideo: string; hasCta: string; runsAds: string; consistentBranding: string }
interface AuditForm { website: string; social: { instagram: string; facebook: string; linkedin: string; youtube: string; x: string }; socialSelfReported: Record<string, PlatformAnswers> }
const platforms = ['instagram', 'facebook', 'linkedin', 'youtube', 'x'] as const;
const emptyAnswers: PlatformAnswers = { followers: '', frequency: '', responseTime: '', usesVideo: '', hasCta: '', runsAds: '', consistentBranding: '' };

export default function AuditPage() {
  const { register, handleSubmit, watch } = useForm<AuditForm>({ defaultValues: { website: '', social: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' }, socialSelfReported: Object.fromEntries(platforms.map((platform) => [platform, emptyAnswers])) } });
  const [result, setResult] = useState<DigitalAuditResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasInputs = Boolean(watch('website') || platforms.some((platform) => watch(`social.${platform}`)));

  async function submit(values: AuditForm) {
    setBusy(true); setError(''); setResult(null);
    try { setResult(await postData<DigitalAuditResult>('/public/audit/run', { ...values, visitorId: visitorId() })); }
    catch (cause) { setError(apiError(cause)); }
    finally { setBusy(false); }
  }

  return (
    <main className="page-main audit-page">
      <section className="page-intro"><p className="eyebrow">Digital presence review</p><h1>Make your online presence work harder.</h1><p>Share the links you want reviewed. We’ll return practical findings from the available checks and clearly identify where results are based on public signals.</p></section>
      <div className="audit-layout">
        <form className="audit-form" onSubmit={handleSubmit(submit)}><h2>Your website and profiles</h2><label className="form-field"><span>Website URL</span><input {...register('website')} type="url" placeholder="https://yourbusiness.in" /></label><div className="audit-divider"><span>Social profiles</span></div><div className="form-grid">{platforms.map((platform) => <label className="form-field" key={platform}><span>{platform === 'x' ? 'X' : platform[0].toUpperCase() + platform.slice(1)}</span><input {...register(`social.${platform}`)} type="url" placeholder={`https://${platform}.com/...`} /></label>)}</div><p className="form-hint">Optional: share a few details about each profile for a more useful social score. Growthora does not scrape private social data.</p><div className="self-report-list">{platforms.map((platform) => <details key={platform}><summary>{platform === 'x' ? 'X' : platform[0].toUpperCase() + platform.slice(1)} profile details</summary><div className="form-grid"><label className="form-field"><span>Follower range</span><select {...register(`socialSelfReported.${platform}.followers`)}><option value="">Choose range</option><option value="&lt;500">Under 500</option><option value="500-2k">500 to 2,000</option><option value="2k-10k">2,000 to 10,000</option><option value="10k+">Over 10,000</option></select></label><label className="form-field"><span>Posting frequency</span><select {...register(`socialSelfReported.${platform}.frequency`)}><option value="">Choose frequency</option><option value="rarely">Rarely</option><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="3+/week">3+ times a week</option><option value="daily">Daily</option></select></label><label className="form-field"><span>Response time</span><select {...register(`socialSelfReported.${platform}.responseTime`)}><option value="">Choose response time</option><option value="same-day">Same day</option><option value="1-2d">1-2 days</option><option value="slow">Longer</option><option value="never">Not monitored</option></select></label>{([['usesVideo', 'Uses video or Reels'], ['hasCta', 'Clear bio and call to action'], ['runsAds', 'Runs paid promotions'], ['consistentBranding', 'Consistent brand identity']] as const).map(([field, label]) => <label className="form-field" key={field}><span>{label}</span><select {...register(`socialSelfReported.${platform}.${field}`)}><option value="">Choose</option><option value="yes">Yes</option><option value="no">Not yet</option></select></label>)}</div></details>)}</div>{error && <p className="notice notice-error">{error}</p>}<button className="button button-copper" type="submit" disabled={busy || !hasInputs}>{busy ? 'Reviewing your links…' : 'Run digital review'} <FiArrowRight /></button><p className="form-hint">Social results are identified as based on the details you shared. Website checks are estimates, not guarantees.</p></form>
        {result ? <section className="audit-results" aria-live="polite"><p className="eyebrow">Your review</p><h2>Here are the clearest opportunities.</h2><div className="audit-score-grid">{result.website && <ScorePanel title="Website" score={result.website.score} grade={result.website.grade} />}{result.social && <ScorePanel title="Social presence" score={result.social.score} />}{typeof result.combinedDigitalScore === 'number' && <ScorePanel title="Combined digital score" score={result.combinedDigitalScore} />}</div>{result.recommendations?.length ? <div className="recommendation-list"><h3>Recommended improvements</h3>{result.recommendations.map((item, index) => <div key={`${item.area}-${index}`}><FiCheckCircle /><p><strong>{item.title}</strong><span>{item.tip}</span></p></div>)}</div> : <p className="form-hint">No priority recommendations were returned for these links.</p>}<p className="form-hint">Improvement needed is the remaining distance to a score of 100. Public checks are estimates, not a guarantee of platform performance.</p></section> : <aside className="audit-aside"><div className="audit-aside-icon"><FiGlobe /></div><p className="eyebrow">A practical snapshot</p><h2>See what’s working, then focus on what’s next.</h2><ul><li>Website accessibility and metadata signals</li><li>Reachability and profile completeness</li><li>Prioritised, actionable improvements</li></ul><span className="audit-disclaimer">Public checks may be limited by platform access and optional API availability.</span></aside>}
      </div>
    </main>
  );
}

function ScorePanel({ title, score, grade }: { title: string; score?: number; grade?: string }) {
  const value = typeof score === 'number' ? score : 0;
  return <article className="audit-score"><span>{title}</span><strong>{value}<small>/100</small></strong><div className="score-progress"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><p>{grade || `Improvement needed: ${100 - value}%`}</p></article>;
}