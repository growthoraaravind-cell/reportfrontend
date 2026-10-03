import { useEffect, useMemo, useState } from 'react';
import { Controller, useController, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiCheck, FiPlus, FiSave, FiX } from 'react-icons/fi';
import { apiError, getData } from '../../lib/api';
import type { LookupMap, Scheme } from '../../lib/types';
import { fetchScheme, saveScheme } from '../../services/schemes';
import '../../styles/admin-schemes.css';

const schemeSchema = z.object({
  schemeId: z.string().trim().min(1, 'Scheme ID is required').max(40).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, 'Scheme name is required').max(200),
  category: z.string().max(120),
  level: z.enum(['Central', 'Central/State', 'State', '']),
  ministryAgency: z.string().max(200),
  targetApplicant: z.string().max(500),
  baseWeight: z.coerce.number().int().min(1).max(10),
  eligibleEntity: z.array(z.string()), sectorFit: z.array(z.string()), promoterCategoryFit: z.array(z.string()), stageFit: z.array(z.string()), fundingFit: z.array(z.string()),
  stateFilter: z.string().min(1),
  mustHaveRegn: z.enum(['None', 'Udyam', 'DPIIT', 'IEC', 'FSSAI', 'GST']),
  preferredRegn: z.enum(['None', 'GST', 'Udyam']),
  minProject: z.coerce.number().min(0), maxProject: z.coerce.number().min(0),
  description: z.string().max(5000), benefits: z.array(z.string()), documentsRequired: z.array(z.string()), howToApply: z.array(z.string()),
  officialUrl: z.string().url('Enter a valid URL').or(z.literal('')),
  docsNotes: z.string().max(3000),
}).superRefine((value, context) => {
  if (value.maxProject > 0 && value.maxProject < value.minProject) context.addIssue({ code: z.ZodIssueCode.custom, path: ['maxProject'], message: 'Maximum must be at least the minimum, or set it to 0 for no limit.' });
});

type SchemeFormValues = z.infer<typeof schemeSchema>;
const defaults: SchemeFormValues = {
  schemeId: '', name: '', category: '', level: '', ministryAgency: '', targetApplicant: '', baseWeight: 6,
  eligibleEntity: [], sectorFit: [], promoterCategoryFit: [], stageFit: [], fundingFit: [], stateFilter: 'All',
  mustHaveRegn: 'None', preferredRegn: 'None', minProject: 0, maxProject: 0, description: '', benefits: [], documentsRequired: [], howToApply: [], officialUrl: '', docsNotes: '',
};
const fallbackLookups: LookupMap = {
  entityType: ['Individual', 'Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Trust/Society', 'SHG/FPO', 'Cooperative'],
  sector: ['General', 'Manufacturing', 'Services', 'Technology', 'Food Processing', 'Agri', 'Textile', 'Pharma/MedTech', 'Electronics', 'Export'],
  promoterCategory: ['General', 'Women', 'SC', 'ST', 'Minority', 'Artisan', 'Farmer/FPO', 'Startup Founder'],
  businessStage: ['Idea', 'New', 'Existing', 'Growth'],
  fundingPurpose: ['Grant', 'Subsidy', 'Loan', 'Working Capital', 'Capex', 'Export', 'Procurement', 'Certification', 'Innovation'],
  state: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
};
const multiOptions = [
  ['eligibleEntity', 'Eligible entity', 'entityType'],
  ['sectorFit', 'Sector fit', 'sector'],
  ['promoterCategoryFit', 'Promoter category fit', 'promoterCategory'],
  ['stageFit', 'Business stage fit', 'businessStage'],
  ['fundingFit', 'Funding purpose fit', 'fundingPurpose'],
] as const;

export default function SchemeFormPage({ readOnly = false }: { readOnly?: boolean }) {
  const { id = '' } = useParams();
  const editMode = Boolean(id) && !readOnly;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const form = useForm<SchemeFormValues>({ resolver: zodResolver(schemeSchema), defaultValues: defaults });
  const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty, isSubmitting } } = form;
  const schemeQuery = useQuery({ queryKey: ['admin-scheme', id], queryFn: () => fetchScheme(id), enabled: Boolean(id) });
  const lookupQuery = useQuery({ queryKey: ['scheme-form-lookups'], queryFn: () => getData<LookupMap>('/public/lookups') });
  const lookups = lookupQuery.data || fallbackLookups;
  const formValues = watch();
  const complete = useMemo(() => Boolean(formValues.name?.trim()) && !/^scheme\s*\d+$/i.test(formValues.name || '') && Boolean(formValues.level) && Boolean(formValues.eligibleEntity?.length) && Boolean(formValues.sectorFit?.length) && Boolean(formValues.promoterCategoryFit?.length) && Boolean(formValues.stageFit?.length) && Boolean(formValues.fundingFit?.length), [formValues]);

  useEffect(() => {
    if (schemeQuery.data) reset(toFormValues(schemeQuery.data));
  }, [reset, schemeQuery.data]);

  useEffect(() => {
    if (readOnly || !isDirty) return;
    const preventClose = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [isDirty, readOnly]);

  function cancel() {
    if (isDirty && !window.confirm('Discard unsaved scheme changes?')) return;
    navigate('/admin/schemes');
  }

  async function save(values: SchemeFormValues, publish: boolean) {
    setError(''); setNotice('');
    if (publish) {
      const missing = getMissing(values);
      if (missing.length) { setError(`Complete these fields before publishing: ${missing.join(', ')}`); return; }
    }
    const payload = { ...values, level: values.level || undefined, ministry: values.ministryAgency, ministryAgency: values.ministryAgency, promoterFit: values.promoterCategoryFit, mustHaveReg: values.mustHaveRegn, preferredReg: values.preferredRegn, notes: values.docsNotes, isPublished: publish };
    try {
      const saved = await saveScheme(payload, id || undefined);
      await queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-scheme-categories'] });
      setNotice(publish ? 'Scheme saved and published.' : 'Draft saved.');
      if (!id && saved._id) navigate(`/admin/schemes/${encodeURIComponent(saved._id)}/edit`, { replace: true });
      else if (publish) navigate('/admin/schemes');
    } catch (cause) { setError(apiError(cause)); }
  }

  if (schemeQuery.isLoading) return <main className="admin-content"><p>Loading scheme…</p></main>;
  if (id && (schemeQuery.isError || !schemeQuery.data)) return <main className="admin-content"><p className="notice notice-error">Scheme could not be loaded.</p><Link className="button button-quiet" to="/admin/schemes">Back to schemes</Link></main>;

  return <form className="scheme-editor" onSubmit={handleSubmit((values) => save(values, false))}>
    <main className="admin-content scheme-form-content">
      <div className="admin-page-heading"><div><Link className="scheme-back-link" to="/admin/schemes"><FiArrowLeft /> Schemes</Link><p className="eyebrow">CONFIGURATION / {readOnly ? 'DETAILS' : editMode ? 'EDIT SCHEME' : 'NEW SCHEME'}</p><h1>{readOnly ? formValues.name || 'Scheme details' : editMode ? 'Edit scheme' : 'Add scheme'}</h1><p>{readOnly ? 'Review eligibility rules and scheme content.' : 'Complete the scheme information and eligibility rules. Save a draft any time.'}</p></div><span className={`scheme-state-badge ${complete ? 'complete' : 'incomplete'}`}>{complete ? <><FiCheck /> Complete</> : 'Incomplete'}</span></div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}{notice && <p className="notice notice-success" role="status">{notice}</p>}
      <section className="admin-panel scheme-form-section"><div className="scheme-section-heading"><span>01</span><div><h2>Basic information</h2><p>Identify this programme in the Growthora catalogue.</p></div></div><div className="scheme-form-grid">
        <Field label="Scheme ID" error={errors.schemeId?.message}><input {...register('schemeId')} placeholder="SCH001" disabled={readOnly} /></Field>
        <Field label="Scheme name" error={errors.name?.message}><input {...register('name')} placeholder="Scheme name" disabled={readOnly} /></Field>
        <Field label="Category"><input {...register('category')} placeholder="e.g. Self Employment" disabled={readOnly} /></Field>
        <Field label="Level" error={errors.level?.message}><select {...register('level')} disabled={readOnly}><option value="">Choose level</option><option value="Central">Central</option><option value="Central/State">Central / State</option><option value="State">State</option></select></Field>
        <Field label="Ministry / agency"><input {...register('ministryAgency')} placeholder="Ministry or implementing agency" disabled={readOnly} /></Field>
        <Field label="Target applicant"><input {...register('targetApplicant')} placeholder="Who can apply?" disabled={readOnly} /></Field>
        <Field label="Base weight" error={errors.baseWeight?.message}><input {...register('baseWeight')} type="number" min="1" max="10" disabled={readOnly} /></Field>
      </div></section>

      <section className="admin-panel scheme-form-section"><div className="scheme-section-heading"><span>02</span><div><h2>Eligibility rules</h2><p>Choose exact matching values. Select General to include all sectors or promoter categories.</p></div></div><div className="scheme-chip-fields">{multiOptions.map(([field, label, lookupKey]) => <Controller key={field} control={control} name={field} render={({ field: controller }) => <ChipSelect label={label} options={lookups[lookupKey] || fallbackLookups[lookupKey]} value={controller.value || []} onChange={controller.onChange} disabled={readOnly} error={errors[field]?.message as string | undefined} />} />)}</div><div className="scheme-form-grid scheme-rules-bottom"><Field label="State filter"><select {...register('stateFilter')} disabled={readOnly}><option value="All">All states / union territories</option>{(lookups.state || fallbackLookups.state).map((state) => <option key={state} value={state}>{state}</option>)}</select></Field><Field label="Must-have registration"><select {...register('mustHaveRegn')} disabled={readOnly}>{['None', 'Udyam', 'DPIIT', 'IEC', 'FSSAI', 'GST'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Preferred registration"><select {...register('preferredRegn')} disabled={readOnly}>{['None', 'GST', 'Udyam'].map((item) => <option key={item}>{item}</option>)}</select></Field></div></section>

      <section className="admin-panel scheme-form-section"><div className="scheme-section-heading"><span>03</span><div><h2>Project cost</h2><p>Enter zero for no minimum or maximum.</p></div></div><div className="scheme-form-grid"><Field label="Minimum project cost (₹)" error={errors.minProject?.message}><div className="currency-input"><span>₹</span><input {...register('minProject')} type="number" min="0" step="1000" disabled={readOnly} /></div></Field><Field label="Maximum project cost (₹)" error={errors.maxProject?.message}><div className="currency-input"><span>₹</span><input {...register('maxProject')} type="number" min="0" step="1000" disabled={readOnly} /></div></Field></div></section>

      <section className="admin-panel scheme-form-section"><div className="scheme-section-heading"><span>04</span><div><h2>Scheme content</h2><p>Help applicants understand the programme and prepare the right information.</p></div></div><div className="scheme-content-fields"><Field label="Description"><textarea {...register('description')} rows={4} placeholder="Short explanation of the scheme" disabled={readOnly} /></Field><StringListEditor label="Benefits" control={control} name="benefits" disabled={readOnly} /><StringListEditor label="Documents required" control={control} name="documentsRequired" disabled={readOnly} /><StringListEditor label="How to apply" control={control} name="howToApply" disabled={readOnly} /><Field label="Official URL" error={errors.officialUrl?.message}><input {...register('officialUrl')} type="url" placeholder="https://..." disabled={readOnly} /></Field><Field label="Documents / notes"><textarea {...register('docsNotes')} rows={3} placeholder="Additional eligibility notes" disabled={readOnly} /></Field></div></section>
      {readOnly && <section className="admin-panel scheme-form-section"><div className="scheme-section-heading"><span>05</span><div><h2>Publishing</h2><p>{schemeQuery.data?.isPublished ? 'This scheme is visible in public assessments.' : 'This scheme is currently a draft.'}</p></div></div><span className={`scheme-state-badge ${schemeQuery.data?.isPublished ? 'complete' : 'incomplete'}`}>{schemeQuery.data?.isPublished ? 'Published' : 'Draft'}</span></section>}
    </main>
    {!readOnly ? <div className="scheme-sticky-actions"><span>{complete ? 'Eligibility fields complete' : 'Complete the eligibility fields to publish'}</span><div><button className="button button-quiet" type="button" onClick={cancel}>Cancel</button><button className="button button-quiet" type="submit" disabled={isSubmitting}><FiSave /> Save draft</button><button className="button button-copper" type="button" disabled={!complete || isSubmitting || publishing} title={!complete ? getMissing(formValues).join(', ') : 'Save and publish this scheme'} onClick={async () => { setPublishing(true); await handleSubmit((values) => save(values, true))(); setPublishing(false); }}>{publishing ? 'Publishing…' : 'Save & publish'} <FiCheck /></button></div></div> : <div className="scheme-sticky-actions"><span>{schemeQuery.data?.isPublished ? 'Published scheme' : 'Draft scheme'}</span><div><Link className="button button-quiet" to="/admin/schemes">Back to schemes</Link><Link className="button button-primary" to={`/admin/schemes/${encodeURIComponent(id)}/edit`}>Edit scheme</Link></div></div>}
  </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}

function ChipSelect({ label, options, value, onChange, disabled, error }: { label: string; options: string[]; value: string[]; onChange: (value: string[]) => void; disabled: boolean; error?: string }) {
  return <fieldset className="scheme-chip-select"><legend>{label}</legend><div>{options.map((option) => { const selected = value.includes(option); return <button key={option} type="button" className={selected ? 'selected' : ''} disabled={disabled} aria-pressed={selected} onClick={() => onChange(selected ? value.filter((item) => item !== option) : [...value, option])}>{selected && <FiCheck />}{option}</button>; })}</div>{error && <small className="field-error">{error}</small>}</fieldset>;
}

function StringListEditor({ label, control, name, disabled }: { label: string; control: Control<SchemeFormValues>; name: 'benefits' | 'documentsRequired' | 'howToApply'; disabled: boolean }) {
  const { field } = useController({ control, name });
  const values = field.value || [];
  function change(index: number, value: string) { const updated = [...values]; updated[index] = value; field.onChange(updated); }
  return <div className="scheme-list-editor"><div className="scheme-list-editor-heading"><span>{label}</span><button type="button" disabled={disabled} onClick={() => field.onChange([...values, ''])}><FiPlus /> Add item</button></div>{values.length ? values.map((value, index) => <div className="scheme-list-editor-row" key={`${name}-${index}`}><input aria-label={`${label} item ${index + 1}`} value={value} onChange={(event) => change(index, event.target.value)} disabled={disabled} /><button type="button" aria-label={`Remove ${label} item ${index + 1}`} disabled={disabled} onClick={() => field.onChange(values.filter((_, item) => item !== index))}><FiX /></button></div>) : <p className="scheme-list-empty">No items added.</p>}</div>;
}

function toFormValues(scheme: Scheme): SchemeFormValues {
  return {
    ...defaults,
    schemeId: scheme.schemeId || '', name: scheme.name || '', category: scheme.category || '', level: scheme.level || '',
    ministryAgency: scheme.ministryAgency || scheme.ministry || '', targetApplicant: scheme.targetApplicant || '', baseWeight: scheme.baseWeight ?? 6,
    eligibleEntity: scheme.eligibleEntity || [], sectorFit: scheme.sectorFit || [], promoterCategoryFit: scheme.promoterCategoryFit || scheme.promoterFit || [],
    stageFit: scheme.stageFit || [], fundingFit: scheme.fundingFit || [], stateFilter: scheme.stateFilter || 'All',
    mustHaveRegn: scheme.mustHaveRegn || (scheme.mustHaveReg as SchemeFormValues['mustHaveRegn']) || 'None',
    preferredRegn: scheme.preferredRegn || (scheme.preferredReg as SchemeFormValues['preferredRegn']) || 'None',
    minProject: scheme.minProject || 0, maxProject: scheme.maxProject || 0, description: scheme.description || '', benefits: scheme.benefits || [],
    documentsRequired: scheme.documentsRequired || [], howToApply: scheme.howToApply || [], officialUrl: scheme.officialUrl || '', docsNotes: scheme.docsNotes || scheme.notes || '',
  };
}

function getMissing(values: Partial<SchemeFormValues>) {
  const missing: string[] = [];
  if (!values.level) missing.push('Level');
  if (!values.eligibleEntity?.length) missing.push('Eligible entity');
  if (!values.sectorFit?.length) missing.push('Sector fit');
  if (!values.promoterCategoryFit?.length) missing.push('Promoter category fit');
  if (!values.stageFit?.length) missing.push('Stage fit');
  if (!values.fundingFit?.length) missing.push('Funding fit');
  if (/^scheme\s*\d+$/i.test(values.name || '')) missing.push('Replace placeholder name');
  return missing;
}