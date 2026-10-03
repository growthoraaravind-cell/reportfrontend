import { useQuery } from '@tanstack/react-query';
import { FiArrowRight, FiCheck, FiCompass, FiFileText, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getData } from '../lib/api';

interface PublicStats { schemes: number; businessesHelped: number }

const services = [
  { icon: FiCompass, title: 'Scheme discovery', text: 'Find central and state support that fits your business profile.' },
  { icon: FiTrendingUp, title: 'Funding guidance', text: 'Make sense of grants, subsidies, credit and procurement pathways.' },
  { icon: FiGlobe, title: 'Digital presence', text: 'See practical improvements for your website and social profiles.' },
];

export default function HomePage() {
  const stats = useQuery({ queryKey: ['public-stats'], queryFn: () => getData<PublicStats>('/public/stats') });
  const schemeCount = stats.data?.schemes ?? 0;

  return (
    <main>
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Growthora · Business support, made clearer</p>
          <h1>Find the support that can move your business forward.</h1>
          <p className="hero-description">A practical eligibility assessment for government schemes, funding pathways and the registrations that can unlock your next step.</p>
          <div className="hero-actions"><Link className="button button-copper pulse-cta" to="/check">Check your eligibility <FiArrowRight /></Link><Link className="text-link" to="/schemes">Explore schemes <FiArrowRight /></Link></div>
          <div className="trust-row"><span><FiCheck /> Personalised assessment</span><span><FiCheck /> Clear next steps</span><span><FiCheck /> No approval promises</span></div>
        </div>
        <div className="hero-visual" aria-label="Eligibility assessment preview">
          <div className="visual-heading"><span>GROWTHORA / ILLUSTRATIVE VIEW</span><FiArrowRight /></div>
          <div className="visual-score"><div className="score-ring"><span>78<small>%</small></span></div><div><strong>Business readiness</strong><span>Build your next move</span></div></div>
          <div className="visual-lines"><div><span>Scheme fit</span><strong><i style={{ width: '82%' }} /></strong><b>Strong</b></div><div><span>Registration profile</span><strong><i style={{ width: '56%' }} /></strong><b>In progress</b></div><div><span>Digital presence</span><strong><i style={{ width: '68%' }} /></strong><b>Growing</b></div></div>
          <div className="visual-footer"><FiFileText /><span>Recommendations shaped around your profile</span></div>
          <span className="visual-index">01 — DISCOVER</span>
        </div>
        <div className="hero-rail" aria-hidden="true">BUSINESS GROWTH / INDIA</div>
      </section>

      <section className="metric-band" aria-label="Growthora platform statistics">
        <div><strong>{schemeCount}</strong><span>published schemes</span></div>
        <div><strong>{stats.data?.businessesHelped ?? '—'}</strong><span>business assessments</span></div>
        <p>Start with your profile. Leave with a clearer set of options.</p>
        {stats.isError && <span className="metric-status">Live figures appear when the Growthora API is connected.</span>}
      </section>

      <section className="content-section service-section">
        <div className="section-heading"><div><p className="eyebrow">Useful guidance, in one place</p><h2>Make the next step a more informed one.</h2></div><p>From registrations to digital readiness, get an organised view of the work that can strengthen your business.</p></div>
        <div className="service-grid">{services.map(({ icon: Icon, title, text }, index) => <article className="service-item" key={title}><span className="service-number">0{index + 1}</span><Icon className="service-icon" aria-hidden="true" /><h3>{title}</h3><p>{text}</p><Link to={index === 2 ? '/digital-audit' : '/check'} aria-label={`Explore ${title}`}><FiArrowRight /></Link></article>)}</div>
      </section>

      <section className="steps-band"><div className="content-section"><p className="eyebrow">A clearer route</p><h2>Four steps to a stronger plan.</h2><div className="steps-grid">{['Share your business profile', 'Review your scheme matches', 'Prioritise readiness actions', 'Connect with an advisor'].map((step, index) => <div className="step-item" key={step}><span>0{index + 1}</span><p>{step}</p></div>)}</div></div></section>

      <section className="closing-band"><div><p className="eyebrow">Take the first step</p><h2>Your business has options. Let’s map them.</h2></div><Link className="button button-light" to="/check">Start assessment <FiArrowRight /></Link></section>
    </main>
  );
}