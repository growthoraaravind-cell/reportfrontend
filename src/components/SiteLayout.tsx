import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiArrowUpRight, FiMail, FiMenu, FiMessageCircle, FiPhone, FiX } from 'react-icons/fi';
import { track } from '../lib/api';
import ChatWidget from './common/ChatWidget';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/schemes', label: 'Schemes' },
  { to: '/digital-audit', label: 'Digital audit' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    void track('page_view', location.pathname).catch(() => undefined);
    if (!sessionStorage.getItem('growthora.sessionStarted')) {
      sessionStorage.setItem('growthora.sessionStarted', '1');
      void track('session_start', location.pathname).catch(() => undefined);
    }
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="site-frame">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Growthora home">
          <span className="brand-logo-frame"><img className="brand-logo" src="/assets/images/logo.avif" alt="Growthora Advisory Private Limited" /></span>
        </Link>
        <button className="icon-button menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {link.label}
            </NavLink>
          ))}
          <Link className="button button-primary nav-cta" to="/check" onClick={() => void track('cta_click', location.pathname, { label: 'Check eligibility' }).catch(() => undefined)}>
            Check eligibility <FiArrowUpRight aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="footer-main">
          <div>
            <Link className="wordmark footer-wordmark" to="/">
              <span className="brand-logo-frame"><img className="brand-logo" src="/assets/images/logo.avif" alt="Growthora Advisory Private Limited" /></span>
            </Link>
            <p>Practical guidance for your business's next stage of growth.</p>
          </div>
          <div className="footer-contact">
            <a href="tel:+916360886843">+91 63608 86843</a>
            <a href="mailto:info@growthora.co.in">info@growthora.co.in</a>
            <a href="https://growthora.co.in" target="_blank" rel="noreferrer">growthora.co.in</a>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Growthora</span><div className="footer-policies"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div><span>Built for business progress</span></div>
      </footer>

      <div className="contact-dock" aria-label="Contact Growthora">
        <a href="https://wa.me/916360886843" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" title="WhatsApp" onClick={() => void track('contact_click', location.pathname, { channel: 'whatsapp' }).catch(() => undefined)}><FiMessageCircle /></a>
        <a href="tel:+916360886843" aria-label="Call Growthora" title="Call" onClick={() => void track('contact_click', location.pathname, { channel: 'call' }).catch(() => undefined)}><FiPhone /></a>
        <a href="mailto:info@growthora.co.in" aria-label="Email Growthora" title="Email" onClick={() => void track('contact_click', location.pathname, { channel: 'email' }).catch(() => undefined)}><FiMail /></a>
      </div>
      <ChatWidget />
    </div>
  );
}