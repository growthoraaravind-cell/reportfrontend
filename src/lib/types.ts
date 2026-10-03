export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; pages?: number };
}

export type LookupMap = Record<string, string[]>;

export interface Scheme {
  _id?: string;
  schemeId: string;
  name: string;
  category?: string;
  level?: 'Central' | 'Central/State' | 'State';
  ministryAgency?: string;
  ministry?: string;
  targetApplicant?: string;
  eligibleEntity?: string[];
  sectorFit?: string[];
  promoterCategoryFit?: string[];
  promoterFit?: string[];
  stageFit?: string[];
  mustHaveRegn?: 'None' | 'Udyam' | 'DPIIT' | 'IEC' | 'FSSAI' | 'GST';
  mustHaveReg?: string;
  preferredRegn?: 'None' | 'GST' | 'Udyam';
  preferredReg?: string;
  description?: string;
  docsNotes?: string;
  notes?: string;
  benefits?: string[];
  subsidyPercent?: number;
  officialUrl?: string;
  documentsRequired?: string[];
  howToApply?: string[];
  stateFilter?: string;
  fundingFit?: string[];
  minProject?: number;
  maxProject?: number;
  baseWeight?: number;
  isActive?: boolean;
  isPublished?: boolean;
  isComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchemePageResponse {
  schemes: Scheme[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SchemeImportPreview {
  fileId: string;
  originalName: string;
  totalRows: number;
  newRows: number;
  existingRows: number;
  completeRows: number;
  placeholders: number;
  preview: Array<Scheme & { alreadyExists: boolean; __excelRow: number }>;
  errors: Array<{ row: number; schemeId: string; message: string }>;
}

export interface SchemeImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; schemeId: string; message: string }>;
}

export interface SchemeMatch extends Scheme {
  score: number;
  maxScore: number;
  status: 'Eligible Now' | 'Eligible After Action' | 'Low Fit';
  missingRegistration?: string | null;
  actions?: string[];
  why?: string;
}

export interface EligibilityCounts {
  eligibleNow: number;
  afterAction: number;
  lowFit: number;
}

export interface ReadinessFlag {
  missing: boolean;
  unlocks: number;
}

export interface SubmissionResponse {
  submissionId: string;
  shareToken: string;
  reportPdfUrl?: string;
  counts: EligibilityCounts;
  top15: SchemeMatch[];
  readinessFlags: Record<string, ReadinessFlag>;
  schemeReadiness: number;
  overallReadiness: number;
  potential: { additionalSchemes: number; readinessAfter: number };
  audit: { website?: unknown; social?: unknown };
}

export interface PublicResult {
  clientName: string;
  businessName?: string;
  entityType: string;
  businessStage: string;
  promoterCategory: string;
  sector: string;
  state: string;
  fundingPurpose: string;
  counts: EligibilityCounts;
  topSchemes: SchemeMatch[];
  readinessFlags: Record<string, ReadinessFlag>;
  overallReadiness: number;
  reportPdfUrl?: string;
  resultSummary?: { potential?: SubmissionResponse['potential'] };
  audit?: DigitalAuditResult;
}

export interface DigitalAuditResult {
  website?: { score?: number; grade?: string; quickWins?: Array<{ title: string; tip: string }>; [key: string]: unknown } | null;
  social?: { score?: number; platforms?: Record<string, { score?: number; valid?: boolean; tips?: string[] }>; [key: string]: unknown } | null;
  recommendations?: Array<{ area: string; title: string; tip: string }>;
  combinedDigitalScore?: number;
}