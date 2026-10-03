import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiUser } from 'react-icons/fi';
import '../styles/admin-settings.css';
import api, { apiError, getData } from '../lib/api';

interface LookupRecord { key: string; label: string; values: string[] }
interface SiteSettings { company: string; website: string; phone: string; whatsapp: string; email: string; seo: { title: string; description: string }; apiKeys?: { pagespeed: boolean; anthropic: boolean } }
interface AdminProfileValue { name: string; email: string; role: string }

export function AdminLookups() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-lookups'], queryFn: () => getData<LookupRecord[]>('/admin/lookups') });
  const [selected, setSelected] = useState('');
  const [values, setValues] = useState('');
  const [label, setLabel] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const active = query.data?.find((item) => item.key === selected);

  useEffect(() => {
    if (active) { setLabel(active.label); setValues(active.values.join('\n')); }
  }, [active]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    const list = values.split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
    try { await api.put(`/admin/lookups/${encodeURIComponent(selected)}`, { label, values: list }); setNotice('Lookup values saved.'); await client.invalidateQueries({ queryKey: ['admin-lookups'] }); }
    catch (cause) { setError(apiError(cause)); }
  }

  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">CONFIGURATION / DROPDOWNS</p><h1>Lookups</h1><p>Manage the choices shown in public business assessments.</p></div></div><div className="settings-layout"><section className="admin-panel lookup-list"><div className="panel-title"><div><h2>Lookup lists</h2><span>{query.data?.length || 0} lists</span></div></div>{(query.data || []).map((item) => <button className={selected === item.key ? 'lookup-item selected' : 'lookup-item'} key={item.key} type="button" onClick={() => setSelected(item.key)}><strong>{item.label}</strong><span>{item.values.length} values</span></button>)}</section><form className="admin-panel settings-form" onSubmit={save}><h2>{active?.label || 'Select a lookup'}</h2>{active ? <><label className="form-field"><span>Display label</span><input value={label} onChange={(event) => setLabel(event.target.value)} required /></label><label className="form-field"><span>Values (one per line)</span><textarea value={values} onChange={(event) => setValues(event.target.value)} rows={14} required /></label>{error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success">{notice}</p>}<button className="button button-copper" type="submit">Save lookup</button></> : <p className="form-hint">Choose a list to edit its values.</p>}</form></div></main>;
}

export function AdminSettings() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-site-settings'], queryFn: () => getData<SiteSettings>('/admin/settings') });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!query.data) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const updated: SiteSettings = { ...query.data, company: String(form.get('company')), website: String(form.get('website')), phone: String(form.get('phone')), whatsapp: String(form.get('whatsapp')), email: String(form.get('email')), seo: { title: String(form.get('seoTitle')), description: String(form.get('seoDescription')) } };
    setError(''); setNotice('');
    try { await api.put('/admin/settings', updated); setNotice('Company settings saved.'); await client.invalidateQueries({ queryKey: ['admin-site-settings'] }); }
    catch (cause) { setError(apiError(cause)); }
  }

  const settings = query.data;
  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">CONFIGURATION / COMPANY</p><h1>Settings</h1><p>Manage public company details and search metadata.</p></div></div>{settings && <form className="admin-panel settings-form" onSubmit={save}><div className="rules-section"><h2>Contact details</h2><div className="settings-fields"><label className="form-field"><span>Company name</span><input name="company" defaultValue={settings.company} required /></label><label className="form-field"><span>Website</span><input name="website" type="url" defaultValue={settings.website} /></label><label className="form-field"><span>Phone</span><input name="phone" defaultValue={settings.phone} /></label><label className="form-field"><span>WhatsApp link</span><input name="whatsapp" type="url" defaultValue={settings.whatsapp} /></label><label className="form-field"><span>Contact email</span><input name="email" type="email" defaultValue={settings.email} /></label></div></div><div className="rules-section"><h2>Search metadata</h2><div className="settings-fields"><label className="form-field"><span>Page title</span><input name="seoTitle" defaultValue={settings.seo.title} /></label><label className="form-field"><span>Description</span><textarea name="seoDescription" defaultValue={settings.seo.description} rows={3} /></label></div></div><div className="integration-status"><strong>Optional integrations</strong><span>PageSpeed: {settings.apiKeys?.pagespeed ? 'configured' : 'not configured'}</span><span>AI chat: {settings.apiKeys?.anthropic ? 'configured' : 'not configured'}</span></div>{error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success">{notice}</p>}<button className="button button-copper" type="submit">Save settings</button></form>}</main>;
}

export function AdminProfile() {
  const query = useQuery({ queryKey: ['admin-profile'], queryFn: () => getData<AdminProfileValue>('/admin/me') });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try { await api.put('/admin/me/password', { currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') }); formElement.reset(); setNotice('Password updated.'); }
    catch (cause) { setError(apiError(cause)); }
    finally { setSaving(false); }
  }

  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">ACCOUNT / PROFILE</p><h1>Profile</h1><p>Review your administrator account and update its password.</p></div></div>{query.data && <section className="admin-panel profile-summary"><span className="user-avatar"><FiUser aria-hidden="true" /></span><div><strong>{query.data.name}</strong><span>{query.data.email}</span><small>{query.data.role}</small></div></section>}<form className="admin-panel settings-form password-form" onSubmit={changePassword}><h2>Change password</h2><label className="form-field"><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label><label className="form-field"><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /><small className="form-hint">Use at least 8 characters.</small></label>{error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success">{notice}</p>}<button className="button button-copper" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></form></main>;
}