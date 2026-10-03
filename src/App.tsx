import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SiteLayout from './components/SiteLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const EligibilityPage = lazy(() => import('./pages/EligibilityPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const SchemesPage = lazy(() => import('./pages/SchemesPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SchemeDetailPage = lazy(() => import('./pages/SchemeDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="page-loading" role="status">Loading Growthora...</div>}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/check" element={<EligibilityPage />} />
              <Route path="/digital-audit" element={<AuditPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/schemes/:schemeId" element={<SchemeDetailPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/report/:token" element={<ResultPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}