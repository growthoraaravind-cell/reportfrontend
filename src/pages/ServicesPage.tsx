import { FiArrowRight, FiBriefcase, FiCheckCircle, FiCompass, FiFileText, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const services = [
  { icon: FiCompass, title: 'Government scheme advisory', text: 'Understand central and state programmes that may support your business, and make a plan for the application process.' },
  { icon: FiTrendingUp, title: 'Funding and credit support', text: 'Get guidance on loan, working capital, subsidy and credit guarantee pathways that fit your business needs.' },
  { icon: FiFileText, title: 'Business registrations', text: 'Navigate Udyam, GST, DPIIT, IEC and sector-specific registrations with a clear sequence of next steps.' },
  { icon: FiBriefcase, title: 'Startup and export growth', text: 'Explore startup funding, export support, public procurement and capability-building opportunities.' },
  { icon: FiGlobe, title: 'Digital presence review', text: 'Review public website and social profile signals with practical recommendations for improving visibility.' },
  { icon: FiCheckCircle, title: 'Application readiness', text: 'Organise documents, business information and milestones before approaching a scheme or funding agency.' },
];

export default function ServicesPage() {
  return <main className="page-main"><section className="page-intro"><p className="eyebrow">How Growthora can help</p><h1>Practical support for the next stage of business.</h1><p>Clearer options, organised preparation and guidance from people who understand the process.</p></section><div className="service-grid service-page-grid">{services.map(({ icon: Icon, title, text }, index) => <article className="service-item" key={title}><span className="service-number">0{index + 1}</span><Icon className="service-icon" /><h3>{title}</h3><p>{text}</p></article>)}</div><section className="closing-band service-closing"><div><p className="eyebrow">Start with your profile</p><h2>Let’s identify the most useful first step.</h2></div><Link className="button button-light" to="/check">Check eligibility <FiArrowRight /></Link></section></main>;
}