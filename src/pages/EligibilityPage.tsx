import { useEffect, useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api, { apiError, getData, track, visitorId } from '../lib/api';
import FileUploader from '../components/common/FileUploader';
import type { ApiEnvelope, LookupMap, SubmissionResponse } from '../lib/types';

const intakeSchema = z.object({
  clientName: z.string().trim().min(2, 'Enter your name'),
  businessName: z.string().max(150),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  entityType: z.string().min(1, 'Choose an entity type'),
  businessStage: z.string().min(1, 'Choose your business stage'),
  promoterCategory: z.string().min(1, 'Choose a promoter category'),
  sector: z.string().min(1, 'Choose a sector'),
  state: z.string().min(1, 'Choose a state or union territory'),
  district: z.string().max(100),
  fundingPurpose: z.string().min(1, 'Choose a funding purpose'),
  udyam: z.enum(['Yes', 'No']), dpiit: z.enum(['Yes', 'No']), gst: z.enum(['Yes', 'No']),
  iec: z.enum(['Yes', 'No']), gem: z.enum(['Yes', 'No']), fssai: z.enum(['Yes', 'No']),
  businessAge: z.number().min(0, 'Enter 0 or more years'),
  annualTurnover: z.number().min(0, 'Enter 0 or more'),
  projectCost: z.number().min(0, 'Enter 0 or more'),
  website: z.string().max(300),
  social: z.object({ instagram: z.string().max(300), facebook: z.string().max(300), linkedin: z.string().max(300), youtube: z.string().max(300), x: z.string().max(300) }),
  documents: z.array(z.string()),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required to prepare your assessment.' }) }),
});

type IntakeForm = z.infer<typeof intakeSchema>;
const blank: IntakeForm = {
  clientName: '', businessName: '', mobile: '', email: '', entityType: '', businessStage: '', promoterCategory: '', sector: '', state: '', district: '', fundingPurpose: '',
  udyam: 'No', dpiit: 'No', gst: 'No', iec: 'No', gem: 'No', fssai: 'No', businessAge: 0, annualTurnover: 0, projectCost: 0,
  website: '', social: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' }, documents: [], consent: false as unknown as true,
};
const stepFields: FieldPath<IntakeForm>[][] = [
  ['clientName', 'businessName', 'mobile', 'email', 'entityType', 'businessStage'],
  ['promoterCategory', 'sector', 'state', 'district', 'fundingPurpose'],
  ['udyam', 'dpiit', 'gst', 'iec', 'gem', 'fssai'],
  ['businessAge', 'annualTurnover', 'projectCost'],
  ['website', 'social.instagram', 'social.facebook', 'social.linkedin', 'social.youtube', 'social.x'],
  ['consent'],
];
const steps = ['Your business', 'Profile & location', 'Registrations', 'Financials', 'Digital presence', 'Review & submit'];
const fallback: LookupMap = {
  entityType: ['Individual', 'Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Trust/Society', 'SHG/FPO', 'Cooperative'],
  businessStage: ['Idea', 'New', 'Existing', 'Growth'],
  promoterCategory: ['General', 'Women', 'SC', 'ST', 'Minority', 'Artisan', 'Farmer/FPO', 'Startup Founder'],
  sector: ['General', 'Manufacturing', 'Services', 'Technology', 'Food Processing', 'Agri', 'Textile', 'Pharma/MedTech', 'Electronics', 'Export'],
  fundingPurpose: ['Grant', 'Subsidy', 'Loan', 'Working Capital', 'Capex', 'Export', 'Procurement', 'Certification', 'Innovation'],
  state: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}

export default function EligibilityPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [lookups, setLookups] = useState<LookupMap>(fallback);
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, trigger, getFieldState, formState: { errors, isSubmitting }, setValue, getValues, watch, reset } = useForm<IntakeForm>({ resolver: zodResolver(intakeSchema), defaultValues: blank });

  useEffect(() => {
    void getData<LookupMap>('/public/lookups').then(setLookups).catch(() => undefined);
    void track('eligibility_started', '/check').catch(() => undefined);
    const saved = localStorage.getItem('growthora.eligibilityDraft');
    if (saved) {
      try { reset({ ...blank, ...(JSON.parse(saved) as Partial<IntakeForm>) }); } catch { localStorage.removeItem('growthora.eligibilityDraft'); }
    }
    const subscription = watch((values) => localStorage.setItem('growthora.eligibilityDraft', JSON.stringify(values)));
    return () => subscription.unsubscribe();
  }, [reset, watch]);

  async function nextStep() {
    if (await trigger(stepFields[step])) {
      const next = Math.min(step + 1, steps.length - 1);
      setStep(next);
      void track('wizard_step', '/check', { step: next + 1, name: steps[next] }).catch(() => undefined);
    }
  }

  async function submit(values: IntakeForm) {
    setSubmitError('');
    try {
      const result = await api.post<ApiEnvelope<SubmissionResponse>>('/public/submissions', { ...values, visitorId: visitorId() });
      localStorage.removeItem('growthora.eligibilityDraft');
      navigate(`/report/${result.data.data.shareToken}`);
    } catch (error) { setSubmitError(apiError(error)); }
  }

  function selectField(name: FieldPath<IntakeForm>, label: string, key: string, placeholder: string) {
    const error = getFieldState(name).error?.message;
    return <Field label={label} error={error}><select {...register(name)} defaultValue=""><option value="" disabled>{placeholder}</option>{(lookups[key] || fallback[key] || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>;
  }

  function registrationField(name: 'udyam' | 'dpiit' | 'gst' | 'iec' | 'gem' | 'fssai', title: string, detail: string) {
    return <div className="registration-item" key={name}><div><strong>{title}</strong><span>{detail}</span></div><div className="segmented"><label><input type="radio" value="Yes" {...register(name)} /><span>Yes</span></label><label><input type="radio" value="No" {...register(name)} /><span>No</span></label></div></div>;
  }

  const documents = watch('documents');

  return (
    <main className="page-main wizard-page">
      <section className="page-intro wizard-intro"><p className="eyebrow">Personalised scheme assessment</p><h1>Let’s understand your business.</h1><p>A few details help us identify relevant schemes and practical readiness steps. Your draft is saved in this browser as you go.</p></section>
      <div className="wizard-layout">
        <aside className="wizard-aside"><p className="eyebrow">YOUR ASSESSMENT</p>{steps.map((title, index) => <div className={`wizard-step${step === index ? ' current' : ''}${step > index ? ' done' : ''}`} key={title}><span>{step > index ? <FiCheck /> : `0${index + 1}`}</span><p>{title}</p></div>)}<div className="privacy-note">Your information is used to prepare your assessment and will not be shown on the shareable report.</div></aside>
        <form className="wizard-form" onSubmit={handleSubmit(submit)} noValidate>
          <div className="wizard-form-head"><div><span>STEP 0{step + 1} / 06</span><h2>{steps[step]}</h2></div><div className="progress-track"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
          {step === 0 && <div className="form-grid">
            <Field label="Your name" error={errors.clientName?.message}><input {...register('clientName')} placeholder="Full name" autoComplete="name" /></Field>
            <Field label="Business name" error={errors.businessName?.message}><input {...register('businessName')} placeholder="Registered or working name" /></Field>
            <Field label="Mobile number" error={errors.mobile?.message}><input {...register('mobile')} inputMode="numeric" maxLength={10} placeholder="10-digit Indian number" autoComplete="tel-national" /></Field>
            <Field label="Email address" error={errors.email?.message}><input {...register('email')} type="email" placeholder="you@business.com" autoComplete="email" /></Field>
            {selectField('entityType', 'Entity type', 'entityType', 'Choose entity type')}
            {selectField('businessStage', 'Business stage', 'businessStage', 'Choose stage')}
          </div>}
          {step === 1 && <div className="form-grid">
            {selectField('promoterCategory', 'Promoter category', 'promoterCategory', 'Choose category')}
            {selectField('sector', 'Primary sector', 'sector', 'Choose sector')}
            {selectField('state', 'State / union territory', 'state', 'Choose location')}
            <Field label="District" error={errors.district?.message}><input {...register('district')} placeholder="District" /></Field>
            {selectField('fundingPurpose', 'Funding purpose', 'fundingPurpose', 'Choose purpose')}
          </div>}
          {step === 2 && <div className="registration-list">{registrationField('udyam', 'Udyam registration', 'MSME registration number, if available')}{registrationField('dpiit', 'DPIIT recognition', 'Startup India recognition, if applicable')}{registrationField('gst', 'GST registration', 'GSTIN registration status')}{registrationField('iec', 'Import Export Code', 'IEC for import or export activity')}{registrationField('gem', 'GeM registration', 'Government e-Marketplace seller profile')}{registrationField('fssai', 'FSSAI / sector licence', 'Food or other relevant sector licence')}</div>}
          {step === 3 && <div className="form-grid financial-grid">
            <Field label="Business age (years)" error={errors.businessAge?.message}><input {...register('businessAge', { valueAsNumber: true })} type="number" min="0" step="1" /></Field>
            <Field label="Annual turnover (₹)" error={errors.annualTurnover?.message}><input {...register('annualTurnover', { valueAsNumber: true })} type="number" min="0" step="1000" /></Field>
            <Field label="Project cost / funding need (₹)" error={errors.projectCost?.message}><input {...register('projectCost', { valueAsNumber: true })} type="number" min="0" step="1000" /></Field>
            <p className="form-hint">Use your estimated project cost or funding need. This is assessed separately from annual turnover.</p>
          </div>}
          {step === 4 && <div className="form-grid digital-grid">
            <Field label="Business website" error={errors.website?.message}><input {...register('website')} type="url" placeholder="https://yourbusiness.in" /></Field>
            {(['instagram', 'facebook', 'linkedin', 'youtube', 'x'] as const).map((platform) => <Field key={platform} label={platform === 'x' ? 'X' : platform[0].toUpperCase() + platform.slice(1)} error={errors.social?.[platform]?.message}><input {...register(`social.${platform}`)} type="url" placeholder={`https://${platform}.com/...`} /></Field>)}
            <div className="upload-field"><p className="upload-field-title">Supporting documents <span>Optional</span></p><FileUploader value={documents} onChange={(ids) => setValue('documents', ids, { shouldDirty: true })} /></div>
          </div>}
          {step === 5 && <div className="review-panel">
            <p>We’ll use these details to compare your profile with currently published schemes. The result is guidance, not an approval or guarantee of funding.</p>
            <div className="review-summary"><span>Business</span><strong>{getValues('businessName') || getValues('clientName') || 'Your business'}</strong><span>Location</span><strong>{[getValues('district'), getValues('state')].filter(Boolean).join(', ') || 'Not provided'}</strong><span>Funding purpose</span><strong>{getValues('fundingPurpose') || 'Not provided'}</strong><span>Documents</span><strong>{documents.length ? `${documents.length} uploaded` : 'None attached'}</strong></div>
            <label className="consent-check"><input type="checkbox" {...register('consent')} /><span>I agree that Growthora may use these details to prepare my assessment and contact me about relevant support.</span></label>
            {errors.consent?.message && <small className="field-error">{errors.consent.message}</small>}
          </div>}
          {submitError && <p className="notice notice-error" role="alert">{submitError}</p>}
          <div className="wizard-actions">{step > 0 ? <button className="button button-quiet" type="button" onClick={() => setStep((current) => current - 1)}><FiArrowLeft /> Back</button> : <span />}{step < steps.length - 1 ? <button className="button button-primary" type="button" onClick={() => void nextStep()}>Continue <FiArrowRight /></button> : <button className="button button-copper" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Preparing assessment…' : 'Get my assessment'} <FiArrowRight /></button>}</div>
        </form>
      </div>
    </main>
  );
}