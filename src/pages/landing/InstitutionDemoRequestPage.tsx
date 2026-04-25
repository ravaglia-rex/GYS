import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress, LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE } from '../../constants/gysBrand';
import {
  useLandingRevealInContainer,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const DEMO_NAV = [
  { id: 'demo-intro', label: 'Start' },
  { id: 'demo-form', label: 'Form' },
] as const;

const DEMO_SECTION_IDS_JOIN = DEMO_NAV.map((s) => s.id).join('|');

interface FormState {
  name: string;
  role: string;
  schoolName: string;
  udisecode: string;
  city: string;
  state: string;
  board: string;
  totalStudents: string;
  email: string;
  phone: string;
  subscriptionInterest: string;
  notes: string;
  wantsBrochure: boolean;
}

const initialFormState: FormState = {
  name: '',
  role: '',
  schoolName: '',
  udisecode: '',
  city: '',
  state: '',
  board: '',
  totalStudents: '',
  email: '',
  phone: '',
  subscriptionInterest: 'not_sure',
  notes: '',
  wantsBrochure: false,
};

const InstitutionDemoRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const pageRootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(DEMO_SECTION_IDS_JOIN);
  useLandingRevealInContainer(pageRootRef);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const nextValue =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Required';
    if (!form.role.trim()) newErrors.role = 'Required';
    if (!form.schoolName.trim()) newErrors.schoolName = 'Required';
    if (!form.city.trim()) newErrors.city = 'Required';
    if (!form.state.trim()) newErrors.state = 'Required';
    if (!form.board.trim()) newErrors.board = 'Required';
    if (!form.email.trim()) newErrors.email = 'Required';
    if (!form.phone.trim()) newErrors.phone = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'institution_demo_requests'), {
        ...form,
        createdAt: serverTimestamp(),
        status: 'new',
        source: 'for-schools-landing',
      });
      setSubmitted(true);
      setForm(initialFormState);
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={pageRootRef}
      className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900"
    >
      <LandingSectionRail sections={DEMO_NAV} activeSectionId={activeSectionId} />
      {/* Top nav  -  aligned with landing pages */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
        <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex w-10 h-10 rounded items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="hidden sm:block font-bold text-lg text-gray-900 tracking-tight">
                Global Young Scholar
              </h1>
              <p className="text-xs text-gray-500">
                Powered by Argus, Access USA, EducationWorld
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PublicHomeNavButton />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 sm:px-5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 text-[15px] sm:px-6 sm:py-10 sm:text-base">
        <div className="mx-auto w-full max-w-xl sm:max-w-2xl">
          <div id="demo-intro" data-landing-reveal className="mb-5 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Request a Demo
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500">
              Tell us about your school and we&apos;ll schedule a walkthrough.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Prefer to explore first?{' '}
              <button
                type="button"
                onClick={() => navigate('/for-schools/preview')}
                className="font-semibold text-[#1e3a8a] underline decoration-[#1e3a8a]/40 underline-offset-2 hover:decoration-[#1e3a8a]"
              >
                Open the interactive preview
              </button>
              {' '}(no login)
            </p>
          </div>

          <div
            id="demo-form"
            data-landing-reveal
            className="rounded-3xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200 sm:px-5 sm:py-6"
          >
            {submitted ? (
              <div className="flex flex-col items-center text-center py-4 sm:py-6">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: GYS_BLUE }}
                  >
                    GYS
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Global Young Scholar
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl text-emerald-600">
                    ✓
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 sm:text-2xl">
                    Demo Request Received
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-slate-600 sm:text-[15px]">
                    Thank you! Our team will contact you within 1 business day to schedule your
                    demo. In the meantime, check your email for the GYS School Brochure.
                  </p>
                </div>

                <div className="mt-6 w-full max-w-md rounded-2xl bg-slate-50 px-4 py-4 text-left sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    What happens next
                  </p>
                  <ol className="mt-3 space-y-1.5 text-sm text-slate-700 sm:text-[15px]">
                    <li>
                      <span className="font-medium">1.</span> Our team reviews your request
                    </li>
                    <li>
                      <span className="font-medium">2.</span> We schedule a 20-min demo call
                    </li>
                    <li>
                      <span className="font-medium">3.</span> We customize a proposal for your school
                    </li>
                    <li>
                      <span className="font-medium">4.</span> Onboarding &amp; student roster setup
                    </li>
                  </ol>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500 sm:text-sm">
                  Questions? Contact us at{' '}
                  <a
                    href="mailto:schools@globalyoungscholar.com"
                    className="font-medium text-slate-700 underline"
                  >
                    schools@globalyoungscholar.com
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Your name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Your Name<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Full name"
                  />
                  {errors.name && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* School name (full width) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    School Name<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Full school name"
                  />
                  {errors.schoolName && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.schoolName}
                    </p>
                  )}
                </div>

                {/* UDISE on its own line */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    UDISE Code
                  </label>
                  <input
                    type="text"
                    name="udisecode"
                    value={form.udisecode}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Optional  -  helps us locate your school"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    India&apos;s universal school identifier. Find yours at{' '}
                    <a
                      href="https://udiseplus.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      udiseplus.gov.in
                    </a>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                      City<span className="text-red-500"> *</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="e.g. Bangalore"
                    />
                    {errors.city && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                      State<span className="text-red-500"> *</span>
                    </label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="">Select state</option>
                      {[
                        'Andhra Pradesh',
                        'Arunachal Pradesh',
                        'Assam',
                        'Bihar',
                        'Chhattisgarh',
                        'Delhi',
                        'Goa',
                        'Gujarat',
                        'Haryana',
                        'Himachal Pradesh',
                        'Jammu & Kashmir',
                        'Jharkhand',
                        'Karnataka',
                        'Kerala',
                        'Madhya Pradesh',
                        'Maharashtra',
                        'Manipur',
                        'Meghalaya',
                        'Mizoram',
                        'Nagaland',
                        'Odisha',
                        'Punjab',
                        'Rajasthan',
                        'Sikkim',
                        'Tamil Nadu',
                        'Telangana',
                        'Tripura',
                        'Uttar Pradesh',
                        'Uttarakhand',
                        'West Bengal',
                        'Other',
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* Board / curriculum */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Board / Curriculum<span className="text-red-500"> *</span>
                  </label>
                  <select
                    name="board"
                    value={form.board}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select board</option>
                    <option value="cbse">CBSE</option>
                    <option value="icse">ICSE</option>
                    <option value="state">State Board</option>
                    <option value="ib">IB</option>
                    <option value="cambridge">Cambridge (IGCSE / A-Levels)</option>
                    <option value="other">Other / Mixed</option>
                  </select>
                  {errors.board && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.board}</p>
                  )}
                </div>

                {/* Role + Email on one row */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                      Your Role<span className="text-red-500"> *</span>
                    </label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="">Select role</option>
                      <option value="principal_head">
                        Principal / Head of School
                      </option>
                      <option value="vice_principal">Vice Principal</option>
                      <option value="academic_director">Academic Director</option>
                      <option value="department_head">Department Head</option>
                      <option value="administrator">Administrator</option>
                      <option value="trustee_board_member">
                        Trustee / Board Member
                      </option>
                      <option value="other">Other</option>
                    </select>
                    {errors.role && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.role}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                      Email<span className="text-red-500"> *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="admin@school.edu.in"
                    />
                    {errors.email && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Total students */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Total Students (Grades 6 - 12)
                  </label>
                  <input
                    type="number"
                    name="totalStudents"
                    value={form.totalStudents}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="e.g. 800"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Phone Number<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Subscription interest */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Which subscription are you interested in?
                  </label>
                  <select
                    name="subscriptionInterest"
                    value={form.subscriptionInterest}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="not_sure">Not sure yet - help me decide</option>
                    <option value="entry">Entry</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Anything else you&apos;d like us to know?
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                    placeholder="Questions, timing, special needs..."
                  />
                </div>

                {/* Brochure opt-in */}
                <div className="flex items-start gap-2">
                  <input
                    id="wantsBrochure"
                    type="checkbox"
                    name="wantsBrochure"
                    checked={form.wantsBrochure}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                  />
                  <label
                    htmlFor="wantsBrochure"
                    className="text-sm sm:text-[15px] text-slate-700"
                  >
                    I&apos;d also like to receive the GYS School Brochure by email.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-80"
                  style={{ backgroundColor: GYS_BLUE }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Demo Request →'}
                </button>

                <p className="pt-3 text-center text-xs sm:text-sm text-slate-500">
                  Our team will contact you within 1 business day to schedule a demo.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionDemoRequestPage;

