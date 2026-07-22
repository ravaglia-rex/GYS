import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import type { SchoolEmailCheck } from '../../db/schoolAdminCollection';

export type SchoolAdminPickerOption = Pick<
  SchoolEmailCheck,
  'schoolId' | 'schoolName' | 'city'
>;

interface SchoolAdminSchoolPickerProps {
  schools: SchoolAdminPickerOption[];
  email?: string;
  /** Pre-selected school when switching from an already active portal. */
  initialSchoolId?: string;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onConfirm: (school: SchoolAdminPickerOption) => void | Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
  busy?: boolean;
}

function schoolLabel(school: SchoolAdminPickerOption): string {
  const name = school.schoolName?.trim() || 'Unnamed school';
  const city = school.city?.trim();
  return city ? `${name} (${city})` : name;
}

const SchoolAdminSchoolPicker: React.FC<SchoolAdminSchoolPickerProps> = ({
  schools,
  email,
  initialSchoolId,
  title = 'Choose your school',
  subtitle,
  confirmLabel = 'Continue',
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
  busy = false,
}) => {
  const defaultId = useMemo(() => {
    if (initialSchoolId && schools.some((s) => s.schoolId === initialSchoolId)) {
      return initialSchoolId;
    }
    return schools[0]?.schoolId ?? '';
  }, [initialSchoolId, schools]);

  const [selectedId, setSelectedId] = useState(defaultId);
  const [submitting, setSubmitting] = useState(false);

  const effectiveSubtitle =
    subtitle ??
    (email
      ? `Your email is an admin for more than one school. Select which portal to open.`
      : 'Select which school portal to open.');

  const handleContinue = async () => {
    const school = schools.find((s) => s.schoolId === selectedId);
    if (!school) return;
    setSubmitting(true);
    try {
      await onConfirm(school);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = busy || submitting;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg sm:px-7 sm:py-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{effectiveSubtitle}</p>
        {email ? (
          <p className="mt-1 text-xs text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{email}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="school-admin-school-picker" className="text-sm font-medium text-slate-900">
            School
          </label>
          <div className="relative">
            <select
              id="school-admin-school-picker"
              className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-3.5 pr-12 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-400 hover:bg-white focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              value={selectedId}
              disabled={isBusy}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {schools.map((school) => (
                <option key={school.schoolId} value={school.schoolId}>
                  {schoolLabel(school)}
                </option>
              ))}
            </select>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center border-l border-slate-200"
              aria-hidden
            >
              <ChevronDown className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
            </div>
          </div>
        </div>

        <Button
          type="button"
          disabled={isBusy || !selectedId}
          onClick={() => void handleContinue()}
          className="h-10 w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 py-2 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
        >
          {isBusy ? <Spinner /> : confirmLabel}
        </Button>

        {onCancel ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="w-full text-center text-sm font-medium text-slate-600 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SchoolAdminSchoolPicker;
