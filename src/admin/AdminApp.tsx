import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiChevronDown, FiFileText, FiLogOut, FiMenu, FiSettings, FiShield, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '../styles/admin.css';
import api, { apiError, getData } from '../lib/api';
import type { ApiEnvelope } from '../lib/types';
import { AdminLookups, AdminProfile, AdminSettings } from './AdminSettingsPages';
import SchemesPage from '../pages/admin/SchemesPage';
import SchemeFormPage from '../pages/admin/SchemeFormPage';

interface AdminUser { id: string; name: string; email: string; role: string }
interface AdminDashboard {
  cards: Record<string, { value: number; prev: number; change: number }>;
  trend: { visitors: Array<{ _id: string; n: number }>; submissions: Array<{ _id: string; n: number }> };
  schemeStatus: Array<{ name: string; count: number }>;
  topSchemes: Array<{ name: string; count: number }>;
  byState: Array<{ name: string; count: number }>;
  latestSubmissions: Array<Record<string, unknown>>;
  latestVisitors: Array<Record<string, unknown>>;
  range: { from: string; to: string };
}
interface Rules { points: Record<string, number>; thresholds: { eligibleNow: number; afterAction: number }; gates: Record<string, boolean>; sectorAliases: Record<string, string[]>; readinessWeights: Record<string, number> }

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: FiBarChart2, end: true },
  { to: '/admin/visitors', label: 'Visitors', icon: FiUsers },
  { to: '/admin/submissions', label: 'Submissions', icon: FiFileText },
  { to: '/admin/leads', label: 'Leads', icon: FiActivity },
  { to: '/admin/audits', label: 'Digital audits', icon: FiActivity },
  { to: '/admin/schemes', label: 'Schemes', icon: FiFileText },
  { to: '/admin/rules', label: 'Rule settings', icon: FiSettings },
  { to: '/admin/chats', label: 'Chat conversations', icon: FiActivity },
  { to: '/admin/files', label: 'Uploaded files', icon: FiFileText },
  { to: '/admin/contacts', label: 'Contact requests', icon: FiUsers },
  { to: '/admin/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/admin/lookups', label: 'Lookups', icon: FiSettings },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
  { to: '/admin/profile', label: 'Profile', icon: FiUsers },
];

function storedUser(): AdminUser | null {
  const value = localStorage.getItem('growthora.adminUser');
  if (!value) return null;
  try { return JSON.parse(value) as AdminUser; } catch { localStorage.removeItem('growthora.adminUser'); return null; }
}

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(storedUser);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const isLogin = window.location.pathname === '/admin/login';

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.post<ApiEnvelope<{ token: string; admin: AdminUser }>>('/admin/auth/login', { email: form.get('email'), password: form.get('password') });
      localStorage.setItem('growthora.adminToken', result.data.data.token);
      localStorage.setItem('growthora.adminUser', JSON.stringify(result.data.data.admin));
      setUser(result.data.data.admin);
      navigate('/admin', { replace: true });
    } catch (error) { window.dispatchEvent(new CustomEvent('growthora-admin-login-error', { detail: apiError(error) })); }
  }

  async function logout() {
    await api.post('/admin/auth/logout').catch(() => undefined);
    localStorage.removeItem('growthora.adminToken');
    localStorage.removeItem('growthora.adminUser');
    setUser(null);
    client.clear();
    navigate('/admin/login', { replace: true });
  }

  if (isLogin) return user ? <Navigate to="/admin" replace /> : <AdminLogin onSubmit={login} />;
  if (!user || !localStorage.getItem('growthora.adminToken')) return <Navigate to="/admin/login" replace />;

  return <div className="admin-frame">
    {drawer && <button className="admin-scrim" aria-label="Close navigation" onClick={() => setDrawer(false)} />}
    <aside className={`admin-sidebar${drawer ? ' drawer-open' : ''}`}>
      <div className="admin-brand"><span className="brand-logo-frame"><img className="brand-logo" src="/assets/images/orglogo.jpeg" alt="Growthora Advisory Private Limited" /></span><button type="button" aria-label="Close navigation" onClick={() => setDrawer(false)}><FiX /></button></div>
      <p className="admin-nav-label">WORKSPACE</p>
      <nav>{adminLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setDrawer(false)} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}><Icon /><span>{label}</span></NavLink>)}</nav>
      <div className="admin-user"><span className="user-avatar"><FiUser aria-hidden="true" /></span><span className="admin-user-name"><strong>{user.name}</strong><small>{user.role}</small></span><button type="button" onClick={() => void logout()} title="Sign out" aria-label="Sign out"><FiLogOut /></button></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><button type="button" className="admin-menu-button" onClick={() => setDrawer(true)} aria-label="Open navigation"><FiMenu /></button><div><FiShield /><span>Growthora operations</span></div><span className="admin-topbar-user">{user.email}<FiChevronDown /></span></header><Routes><Route index element={<AdminDashboard />} /><Route path="rules" element={<RuleSettings />} /><Route path="schemes" element={<SchemesPage />} /><Route path="schemes/new" element={<SchemeFormPage />} /><Route path="schemes/:id/edit" element={<SchemeFormPage />} /><Route path="schemes/:id" element={<SchemeFormPage readOnly />} /><Route path="lookups" element={<AdminLookups />} /><Route path="settings" element={<AdminSettings />} /><Route path="profile" element={<AdminProfile />} /><Route path="visitors/:recordId" element={<AdminRecordDetail />} /><Route path="submissions/:recordId" element={<AdminRecordDetail />} /><Route path="audits/:recordId" element={<AdminRecordDetail />} /><Route path="chats/:recordId" element={<AdminRecordDetail />} /><Route path="*" element={<RecordPage />} /></Routes></div>
  </div>;
}

function AdminLogin({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [error, setError] = useState('');
  useEffect(() => {
    const showError = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('growthora-admin-login-error', showError);
    return () => window.removeEventListener('growthora-admin-login-error', showError);
  }, []);
  return <main className="admin-login"><Link className="wordmark" to="/" aria-label="Growthora home"><span className="brand-logo-frame"><img className="brand-logo" src="/assets/images/logo.avif" alt="Growthora Advisory Private Limited" /></span></Link><div className="admin-login-card"><p className="eyebrow">ADMINISTRATOR ACCESS</p><h1>Welcome back.</h1><p>Sign in to manage Growthora operations.</p><form onSubmit={onSubmit}><label className="form-field"><span>Email</span><input type="email" name="email" autoComplete="username" required /></label><label className="form-field"><span>Password</span><input type="password" name="password" autoComplete="current-password" required /></label>{error && <p className="notice notice-error">{error}</p>}<button className="button button-primary" type="submit">Sign in</button></form><small>Change the seeded credentials before production deployment.</small></div></main>;
}

function AdminDashboard() {
  const [range, setRange] = useState('last30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dashboard = useQuery({ queryKey: ['admin-dashboard', range, from, to], queryFn: () => getData<AdminDashboard>('/admin/stats', { range, ...(range === 'custom' ? { from, to } : {}) }), enabled: range !== 'custom' || Boolean(from && to) });
  const data = dashboard.data;
  const keys = [['totalVisitors', 'Visits'], ['uniqueVisitors', 'Unique visitors'], ['newVisitors', 'New visitors'], ['returningVisitors', 'Returning visitors'], ['pageViews', 'Page views'], ['checksStarted', 'Checks started'], ['checksCompleted', 'Checks completed'], ['conversionRate', 'Conversion'], ['auditsRun', 'Digital audits'], ['avgWebsiteScore', 'Website score'], ['avgSocialScore', 'Social score'], ['contactRequests', 'Contact requests'], ['whatsappCallClicks', 'WhatsApp / call clicks'], ['chatSessions', 'Chat sessions'], ['reportsDownloaded', 'Reports downloaded'], ['avgEligibleNow', 'Avg. eligible-now matches'], ['documentsUploaded', 'Documents uploaded']];
  const chartData = (data?.trend.visitors || []).map((item) => ({ date: item._id.slice(5), visitors: item.n, submissions: data?.trend.submissions.find((sub) => sub._id === item._id)?.n || 0 }));
  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">OPERATIONS / OVERVIEW</p><h1>Dashboard</h1><p>Your recent platform activity and client pipeline.</p></div><div className="admin-filter-group"><label className="admin-range"><span>Period</span><select value={range} onChange={(event) => setRange(event.target.value)}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="thisWeek">This week</option><option value="lastWeek">Last week</option><option value="last7">Last 7 days</option><option value="thisMonth">This month</option><option value="lastMonth">Last month</option><option value="last30">Last 30 days</option><option value="custom">Custom</option></select></label>{range === 'custom' && <><label className="admin-range"><span>From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="admin-range"><span>To</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></>}</div></div>
    {dashboard.isError && <p className="notice notice-error">Analytics could not load. Confirm MongoDB and the API server are available.</p>}
    <div className="admin-stat-grid">{keys.map(([key, label]) => { const card = data?.cards[key]; return <article key={key}><span>{label}</span><strong>{dashboard.isLoading ? '—' : card?.value ?? 0}{key === 'conversionRate' || key === 'avgWebsiteScore' || key === 'avgSocialScore' ? '%' : ''}</strong><small className={(card?.change || 0) >= 0 ? 'trend-up' : 'trend-down'}>{card?.change ?? 0}% vs previous period</small></article>; })}</div>
    <div className="admin-chart-grid"><section className="admin-panel admin-wide"><div className="panel-title"><div><h2>Visits and assessments</h2><span>Daily activity</span></div></div><div className="chart-wrap">{data && <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#eee4df" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="visitors" stroke="#5E1F4F" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="submissions" stroke="#B8643C" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}</div></section>
      <section className="admin-panel"><div className="panel-title"><div><h2>Eligibility outcomes</h2><span>Across submitted profiles</span></div></div><div className="chart-wrap donut-wrap">{data?.schemeStatus.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.schemeStatus} dataKey="count" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{data.schemeStatus.map((entry, index) => <Cell key={entry.name} fill={['#4b9674', '#d19b33', '#c46d61'][index % 3]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="chart-empty">No submissions in this period</p>}</div><div className="legend-row">{data?.schemeStatus.map((item, index) => <span key={item.name}><i style={{ backgroundColor: ['#4b9674', '#d19b33', '#c46d61'][index % 3] }} />{item.name}: {item.count}</span>)}</div></section>
      <section className="admin-panel"><div className="panel-title"><div><h2>Top scheme matches</h2><span>Most recommended</span></div></div><div className="chart-wrap">{data?.topSchemes.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.topSchemes.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 15 }}><CartesianGrid stroke="#eee4df" horizontal={false} /><XAxis type="number" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9 }} /><Tooltip /><Bar dataKey="count" fill="#B8643C" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer> : <p className="chart-empty">No recommendations recorded yet</p>}</div></section></div>
    <section className="admin-panel admin-table-panel"><div className="panel-title"><div><h2>Latest submissions</h2><span>Most recent assessments</span></div><Link to="/admin/submissions">View all</Link></div><DataTable rows={data?.latestSubmissions || []} /></section>
  </main>;
}

function RecordPage() {
  const section = window.location.pathname.split('/')[2] || 'visitors';
  const config: Record<string, { title: string; endpoint: string; columns: string[] }> = {
    visitors: { title: 'Visitors', endpoint: '/admin/visitors', columns: ['visitorId', 'device', 'browser', 'state', 'converted', 'lastSeen'] },
    submissions: { title: 'Submissions', endpoint: '/admin/submissions', columns: ['clientName', 'mobile', 'state', 'sector', 'status', 'overallReadiness', 'createdAt'] },
    leads: { title: 'Leads', endpoint: '/admin/leads', columns: ['clientName', 'mobile', 'email', 'state', 'status', 'createdAt'] },
    audits: { title: 'Digital audits', endpoint: '/admin/audits', columns: ['websiteUrl', 'websiteScore', 'socialScore', 'createdAt'] },
    chats: { title: 'Chat conversations', endpoint: '/admin/chats', columns: ['name', 'phone', 'visitorId', 'handoff', 'messageCount', 'createdAt'] },
    files: { title: 'Uploaded files', endpoint: '/admin/files', columns: ['originalName', 'kind', 'mimeType', 'size', 'uploadedAt'] },
    contacts: { title: 'Contact requests', endpoint: '/admin/contacts', columns: ['name', 'mobile', 'email', 'type', 'status', 'createdAt'] },
    reports: { title: 'Reports', endpoint: '/admin/reports/submissions', columns: ['clientName', 'businessName', 'state', 'status', 'createdAt'] },
    lookups: { title: 'Lookups', endpoint: '/admin/lookups', columns: ['key', 'label', 'values'] },
    settings: { title: 'Settings', endpoint: '/admin/settings', columns: ['name', 'email', 'phone', 'website'] },
  };
  const selected = config[section] || config.visitors;
  const detailField = section === 'visitors' ? 'visitorId' : section === 'chats' ? 'sessionId' : '_id';
  const [search, setSearch] = useState('');
  const data = useQuery({ queryKey: ['admin-records', section], queryFn: async () => {
    const response = await api.get<ApiEnvelope<Record<string, unknown>[] | unknown>>(selected.endpoint, { params: selected.endpoint.includes('/reports/') ? { format: 'json' } : { limit: 100 } });
    const rows = Array.isArray(response.data.data)
      ? response.data.data as Array<Record<string, unknown>>
      : response.data.data && typeof response.data.data === 'object'
        ? [response.data.data as Record<string, unknown>]
        : [];
    return { rows, total: response.data.meta?.total };
  } });
  const rows = (data.data?.rows || []).filter((row) => !search || JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const detailBase = ['visitors', 'submissions', 'audits', 'chats'].includes(section) ? `/admin/${section}` : undefined;
  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">OPERATIONS / RECORDS</p><h1>{selected.title}</h1><p>Search and review records from the Growthora platform.</p></div><div className="admin-heading-actions"><input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${selected.title.toLowerCase()}`} /><a className="button button-quiet" href={`${import.meta.env.VITE_API_URL || '/api/v1'}${selected.endpoint}?format=csv`} onClick={(event) => { event.preventDefault(); void api.get(selected.endpoint, { params: { format: 'csv' }, responseType: 'blob' }).then((response) => { const link = document.createElement('a'); link.href = URL.createObjectURL(response.data); link.download = `${section}.csv`; link.click(); URL.revokeObjectURL(link.href); }); }}>Export CSV</a></div></div>{data.isError && <p className="notice notice-error">These records could not be loaded. Confirm your admin session and the API server.</p>}<section className="admin-panel admin-table-panel"><div className="panel-title"><div><h2>{selected.title}</h2><span>{data.data?.total ?? rows.length} records</span></div></div><DataTable rows={rows} columns={selected.columns} getHref={detailBase ? (row) => row[detailField] ? `${detailBase}/${encodeURIComponent(String(row[detailField]))}` : undefined : undefined} /></section></main>;
}

function DataTable({ rows, columns, getHref }: { rows: object[]; columns?: string[]; getHref?: (row: Record<string, unknown>) => string | undefined }) {
  const records = rows as Array<Record<string, unknown>>;
  const fields = columns || Object.keys(records[0] || {}).filter((key) => !['_id', '__v', 'resultSummary', 'topSchemes', 'notes'].includes(key)).slice(0, 6);
  if (!rows.length) return <div className="admin-empty">No records to display for this period.</div>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{fields.map((field) => <th key={field}>{field.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody>{records.map((row, index) => { const href = getHref?.(row); return <tr key={String(row._id || index)}>{fields.map((field, columnIndex) => <td key={field}>{href && columnIndex === 0 ? <Link to={href}>{formatCell(row[field])}</Link> : formatCell(row[field])}</td>)}</tr>; })}</tbody></table></div>;
}

function AdminRecordDetail() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const section = parts[1] || 'submissions';
  const recordId = decodeURIComponent(parts[2] || '');
  const detail = useQuery({ queryKey: ['admin-detail', section, recordId], queryFn: () => getData<unknown>(`/admin/${section}/${encodeURIComponent(recordId)}`), enabled: Boolean(recordId) });
  const endpointTitle: Record<string, string> = { visitors: 'Visitor journey', submissions: 'Submission details', audits: 'Digital audit details', chats: 'Chat conversation' };
  const data = detail.data && typeof detail.data === 'object' ? detail.data as Record<string, unknown> : {};
  const record = section === 'submissions' && data.submission && typeof data.submission === 'object' ? data.submission as Record<string, unknown> : section === 'visitors' && data.visitor && typeof data.visitor === 'object' ? data.visitor as Record<string, unknown> : data;
  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">OPERATIONS / {section.toUpperCase()}</p><h1>{endpointTitle[section] || 'Record details'}</h1><p>Protected information for this Growthora record.</p></div><Link className="button button-quiet" to={`/admin/${section}`}>Back to list</Link></div>{detail.isLoading && <p>Loading record…</p>}{detail.isError && <p className="notice notice-error">This record could not be loaded.</p>}{Boolean(detail.data) && <><RecordFields value={record} /><RecordFields title={section === 'submissions' ? 'Digital audit, conversations and visit journey' : 'Associated information'} value={Object.fromEntries(Object.entries(data).filter(([key]) => !['submission', 'visitor'].includes(key)))} /></>}</main>;
}

function RecordFields({ title, value }: { title?: string; value: Record<string, unknown> }) {
  return <section className="admin-panel detail-panel">{title && <div className="panel-title"><h2>{title}</h2></div>}<dl>{Object.entries(value).map(([key, item]) => <div key={key}><dt>{key.replace(/([A-Z])/g, ' $1')}</dt><dd>{typeof item === 'string' && item.startsWith('/uploads/') ? <a href={item} target="_blank" rel="noreferrer">Open file</a> : formatCell(item)}</dd></div>)}</dl></section>;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
  return String(value);
}

function RuleSettings() {
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: ['admin-rules'], queryFn: () => getData<Rules>('/admin/rules') });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!rules.data) return;
    const form = new FormData(event.currentTarget);
    const updated: Rules = { ...rules.data, points: { ...rules.data.points }, thresholds: { ...rules.data.thresholds }, gates: { ...rules.data.gates }, readinessWeights: { ...rules.data.readinessWeights } };
    Object.keys(updated.points).forEach((key) => { updated.points[key] = Number(form.get(`points.${key}`)); });
    updated.thresholds.eligibleNow = Number(form.get('eligibleNow'));
    updated.thresholds.afterAction = Number(form.get('afterAction'));
    Object.keys(updated.readinessWeights).forEach((key) => { updated.readinessWeights[key] = Number(form.get(`weights.${key}`)); });
    Object.keys(updated.gates).forEach((key) => { updated.gates[key] = form.get(`gates.${key}`) === 'on'; });
    setSaving(true); setError(''); setMessage('');
    try { await api.put('/admin/rules', updated); setMessage('Rule settings saved.'); await queryClient.invalidateQueries({ queryKey: ['admin-rules'] }); }
    catch (cause) { setError(apiError(cause)); }
    finally { setSaving(false); }
  }
  if (!rules.data) return <main className="admin-content"><p>{rules.isError ? 'Rule settings could not be loaded.' : 'Loading rule settings…'}</p></main>;
  return <main className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">CONFIGURATION / ELIGIBILITY ENGINE</p><h1>Rule settings</h1><p>Adjust scoring values and readiness weights. Changes affect future assessments.</p></div></div><form className="admin-panel rules-form" onSubmit={save}><div className="rules-section"><h2>Classification thresholds</h2><div className="rules-fields"><label className="form-field"><span>Eligible now from</span><input name="eligibleNow" type="number" defaultValue={rules.data.thresholds.eligibleNow} /></label><label className="form-field"><span>After action from</span><input name="afterAction" type="number" defaultValue={rules.data.thresholds.afterAction} /></label></div></div><div className="rules-section"><h2>Scoring points</h2><div className="rules-fields">{Object.entries(rules.data.points).map(([key, value]) => <label className="form-field" key={key}><span>{key.replace(/[A-Z]/g, (c) => ` ${c}`).replace(/^./, (c) => c.toUpperCase())}</span><input name={`points.${key}`} type="number" min="0" defaultValue={value} /></label>)}</div></div><div className="rules-section"><h2>Readiness weights</h2><div className="rules-fields">{Object.entries(rules.data.readinessWeights).map(([key, value]) => <label className="form-field" key={key}><span>{key}</span><input name={`weights.${key}`} type="number" min="0" max="100" defaultValue={value} /></label>)}</div></div><div className="rules-section"><h2>Eligibility gates</h2>{Object.entries(rules.data.gates).map(([key, value]) => <label className="gate-setting" key={key}><input type="checkbox" name={`gates.${key}`} defaultChecked={value} /><span>{key.replace(/[A-Z]/g, (c) => ` ${c}`).replace(/^./, (c) => c.toUpperCase())}</span></label>)}</div>{error && <p className="notice notice-error">{error}</p>}{message && <p className="notice notice-success">{message}</p>}<button className="button button-copper" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save rule settings'}</button></form></main>;
}
