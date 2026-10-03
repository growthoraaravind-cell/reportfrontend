import { useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiMail, FiPhone, FiMessageCircle } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { apiError, postData } from '../lib/api';

interface ContactForm { name: string; mobile: string; email: string; message: string; type: 'callback' | 'enquiry' }

export default function ContactPage() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ContactForm>({ defaultValues: { name: '', mobile: '', email: '', message: '', type: 'callback' } });

  async function submit(values: ContactForm) {
    setError(''); setNotice('');
    try { await postData<null>('/public/contact', values); setNotice('Thank you. The Growthora team will be in touch shortly.'); reset(); }
    catch (cause) { setError(apiError(cause)); }
  }

  return (
    <main className="page-main contact-page"><section className="page-intro"><p className="eyebrow">Let’s talk</p><h1>Good guidance starts with a conversation.</h1><p>Share what you’re working toward. Our team can help you find a sensible next step.</p></section>
      <div className="contact-layout"><div className="contact-options"><a href="https://wa.me/916360886843" target="_blank" rel="noreferrer"><FiMessageCircle /><span><strong>WhatsApp</strong><small>+91 63608 86843</small></span><FiArrowRight /></a><a href="tel:+916360886843"><FiPhone /><span><strong>Call Growthora</strong><small>+91 63608 86843</small></span><FiArrowRight /></a><a href="mailto:info@growthora.co.in"><FiMail /><span><strong>Email us</strong><small>info@growthora.co.in</small></span><FiArrowRight /></a></div>
        <form className="contact-form" onSubmit={handleSubmit(submit)}><h2>Request a callback</h2><div className="form-grid"><label className="form-field"><span>Your name</span><input {...register('name', { required: true, minLength: 2 })} autoComplete="name" required /></label><label className="form-field"><span>Mobile number</span><input {...register('mobile', { required: true, pattern: /^[6-9]\d{9}$/ })} inputMode="numeric" maxLength={10} required /></label><label className="form-field"><span>Email (optional)</span><input {...register('email')} type="email" autoComplete="email" /></label><label className="form-field"><span>How can we help?</span><textarea {...register('message')} rows={4} maxLength={1000} placeholder="Tell us what you would like help with" /></label></div>{error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success"><FiCheckCircle /> {notice}</p>}<button className="button button-copper" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Request a callback'} <FiArrowRight /></button></form></div>
    </main>
  );
}