import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function NotFoundPage() {
  return <main className="page-main"><section className="not-found"><span>404</span><p className="eyebrow">That page isn’t here</p><h1>Let’s get you back on track.</h1><Link className="button button-primary" to="/"><FiArrowLeft /> Back to Growthora</Link></section></main>;
}