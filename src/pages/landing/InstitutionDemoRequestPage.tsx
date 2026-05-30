import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingPublicHeader from '../../components/layout/LandingPublicHeader';
import { LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE } from '../../constants/gysBrand';
import {
  useLandingRevealInContainer,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import {
  normalizeIndiaMobileE164,
  toIndiaMobileNationalDigits,
  withIndiaCountryCode,
} from '../../utils/indiaMobile';

const DEMO_NAV = [
  { id: 'demo-intro', label: 'Start' },
  { id: 'demo-form', label: 'Form' },
] as const;

const DEMO_SECTION_IDS_JOIN = DEMO_NAV.map((s) => s.id).join('|');

/** Same slugs as the previous single-select; stored in Firestore as `boards`. */
const DEMO_BOARD_OPTIONS = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'state', label: 'State Board' },
  { value: 'ib', label: 'IB' },
  { value: 'cambridge', label: 'Cambridge (IGCSE / A-Levels)' },
  { value: 'other', label: 'Other / Mixed' },
] as const;

interface FormState {
  name: string;
  role: string;
  schoolName: string;
  udisecode: string;
  city: string;
  state: string;
  boards: string[];
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
  boards: [],
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
        : name === 'phone'
          ? toIndiaMobileNationalDigits(value)
          : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const toggleBoard = (value: string) => {
    setForm((prev) => {
      const has = prev.boards.includes(value);
      const boards = has ? prev.boards.filter((b) => b !== value) : [...prev.boards, value];
      return { ...prev, boards };
    });
    setErrors((prev) => {
      if (!prev.board) return prev;
      const next = { ...prev };
      delete next.board;
      return next;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Required';
    if (!form.role.trim()) newErrors.role = 'Required';
    if (!form.schoolName.trim()) newErrors.schoolName = 'Required';
    if (!form.city.trim()) newErrors.city = 'Required';
    if (!form.state.trim()) newErrors.state = 'Required';
    if (form.boards.length === 0) newErrors.board = 'Select at least one board';
    if (!form.email.trim()) newErrors.email = 'Required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Required';
    } else if (!normalizeIndiaMobileE164(form.phone)) {
      newErrors.phone = 'Enter a valid 10-digit India mobile number starting with 6-9.';
    }

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
        phone: withIndiaCountryCode(form.phone),
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
      className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900"
    >
      <LandingSectionRail sections={DEMO_NAV} activeSectionId={activeSectionId} />
      <LandingPublicHeader scrollProgress={scrollProgress} />

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
                    href="mailto:globalyoungscholar@argus.ai"
                    className="font-medium text-slate-700 underline"
                  >
                    globalyoungscholar@argus.ai
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
                        'Jammu and Kashmir',
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

                {/* Board / curriculum (multi-select) */}
                <div>
                  <span className="block text-sm font-semibold text-slate-800 sm:text-[15px]">
                    Board / Curriculum<span className="text-red-500"> *</span>
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Select all that apply at your school.
                  </p>
                  <div
                    className={`mt-2 grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-2 ${
                      errors.board ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/80'
                    }`}
                  >
                    {DEMO_BOARD_OPTIONS.map(({ value, label }) => {
                      const checked = form.boards.includes(value);
                      return (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-900 ${
                            checked ? 'bg-white ring-1 ring-slate-200' : 'hover:bg-white/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                            checked={checked}
                            onChange={() => toggleBoard(value)}
                          />
                          <span className="leading-snug">{label}</span>
                        </label>
                      );
                    })}
                  </div>
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
                    Total Students (Classes 6 - 12)
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
                  <div
                    className={`mt-1 flex w-full overflow-hidden rounded-xl border bg-slate-50 text-sm text-slate-900 shadow-xs focus-within:border-slate-500 focus-within:bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-200 ${
                      errors.phone ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <span className="flex items-center border-r border-slate-300 bg-slate-100 px-3 font-medium text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-transparent px-3 py-2 placeholder:text-slate-400 focus:outline-none"
                      placeholder="98765 43210"
                      autoComplete="tel-national"
                      maxLength={10}
                    />
                  </div>
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

