import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageFooter from '../../components/layout/LandingSiteFooter';
import LandingPublicHeader from '../../components/layout/LandingPublicHeader';
import { useLandingScrollProgress } from '../../hooks/useLandingPageScroll';
import { simpleMarkdownToHtml } from '../../utils/simpleMarkdownToHtml';
import { SCHOOL_LEGAL_PATHS } from '../../constants/schoolLegal';

const GYS_BLUE = '#1e3a8a';

type LegalDocKey = keyof typeof SCHOOL_LEGAL_PATHS;

const LEGAL_DOCS: Record<
  LegalDocKey,
  { title: string; file: string; description: string; path: string; navLabel: string }
> = {
  privacy: {
    title: 'GYS Privacy Notice - India school services',
    file: '/legal/privacy-notice-school-services.md',
    description: 'How Global Young Scholar handles personal data for India school services.',
    path: SCHOOL_LEGAL_PATHS.privacy,
    navLabel: 'Privacy',
  },
  terms: {
    title: 'GYS Website and Platform Terms - India school services',
    file: '/legal/school-terms.md',
    description: 'Terms governing school registration and school-procured GYS services in India.',
    path: SCHOOL_LEGAL_PATHS.terms,
    navLabel: 'Terms',
  },
  dataProcessing: {
    title: 'GYS School Data Processing Terms - India',
    file: '/legal/school-data-processing-terms.md',
    description:
      'Data processing terms incorporated into the School Terms of Service for India school registrations.',
    path: SCHOOL_LEGAL_PATHS.dataProcessing,
    navLabel: 'Data processing',
  },
};

const PATH_TO_KEY: Record<string, LegalDocKey> = {
  [SCHOOL_LEGAL_PATHS.privacy]: 'privacy',
  [SCHOOL_LEGAL_PATHS.terms]: 'terms',
  [SCHOOL_LEGAL_PATHS.dataProcessing]: 'dataProcessing',
};

/** Same order as school registration acceptance text: Terms → Data processing → Privacy. */
const NAV_ORDER: LegalDocKey[] = ['terms', 'dataProcessing', 'privacy'];

const SchoolLegalDocumentPage: React.FC = () => {
  const location = useLocation();
  const key = PATH_TO_KEY[location.pathname];
  const meta = key ? LEGAL_DOCS[key] : undefined;
  const scrollProgress = useLandingScrollProgress();
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navItems = useMemo(() => NAV_ORDER.map((k) => LEGAL_DOCS[k]), []);

  useEffect(() => {
    if (!meta) {
      setLoading(false);
      setError('Document not found.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(meta.file)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load document (${res.status}).`);
        return res.text();
      })
      .then((md) => {
        if (cancelled) return;
        setHtml(simpleMarkdownToHtml(md));
        setLoading(false);
        const hash = window.location.hash.replace(/^#/, '');
        if (hash) {
          requestAnimationFrame(() => {
            document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load document.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meta]);

  useEffect(() => {
    if (meta) document.title = `${meta.title} | Global Young Scholar`;
  }, [meta]);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <LandingPublicHeader scrollProgress={scrollProgress} />

      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav
            className="-mb-px flex items-center gap-1 overflow-x-auto py-2"
            aria-label="School legal documents"
          >
            {navItems.map((item) => {
              const isActive = meta?.path === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#1e3a8a]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.navLabel}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {!meta ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h1 className="text-xl font-semibold text-slate-900">Document not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              Return to{' '}
              <Link to="/for-schools" className="font-medium underline" style={{ color: GYS_BLUE }}>
                For Schools
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              India school services
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {meta.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{meta.description}</p>

            <article className="legal-doc mt-8 rounded-xl border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
              {loading && <p className="text-sm text-slate-500">Loading…</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!loading && !error && (
                <div
                  className="legal-doc-body prose-legal"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </article>
          </>
        )}
      </main>

      <PageFooter />

      <style>{`
        .prose-legal h1 { font-size: 1.5rem; font-weight: 700; margin: 1.75rem 0 0.75rem; color: #0f172a; scroll-margin-top: 5rem; }
        .prose-legal h2 { font-size: 1.25rem; font-weight: 700; margin: 1.75rem 0 0.65rem; color: #0f172a; scroll-margin-top: 5rem; }
        .prose-legal h3 { font-size: 1.05rem; font-weight: 650; margin: 1.35rem 0 0.5rem; color: #1e293b; scroll-margin-top: 5rem; }
        .prose-legal p { margin: 0.65rem 0; font-size: 0.95rem; line-height: 1.65; color: #334155; }
        .prose-legal ul, .prose-legal ol { margin: 0.65rem 0 0.65rem 1.25rem; font-size: 0.95rem; line-height: 1.65; color: #334155; }
        .prose-legal li { margin: 0.25rem 0; }
        .prose-legal a { color: ${GYS_BLUE}; text-decoration: underline; text-underline-offset: 2px; }
        .prose-legal strong { color: #0f172a; font-weight: 650; }
        .prose-legal code { font-size: 0.85em; background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
        .prose-legal hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
        .prose-legal blockquote { border-left: 3px solid #cbd5e1; margin: 0.85rem 0; padding-left: 0.85rem; color: #475569; }
        .legal-table-wrap { overflow-x: auto; margin: 1rem 0; }
        .prose-legal table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .prose-legal th, .prose-legal td { border: 1px solid #e2e8f0; padding: 0.5rem 0.6rem; text-align: left; vertical-align: top; }
        .prose-legal th { background: #f8fafc; font-weight: 650; color: #0f172a; }
      `}</style>
    </div>
  );
};

export default SchoolLegalDocumentPage;
