import React, { useEffect, useRef, useState } from 'react';
import type { SchoolPhoneDialCode } from '../../utils/indiaMobile';

const PHONE_DIAL_OPTIONS: { value: SchoolPhoneDialCode; label: string }[] = [
  { value: '91', label: '+91' },
  { value: '974', label: '+974' },
];

export type PhoneDialCodeSelectProps = {
  value: SchoolPhoneDialCode;
  onChange: (next: SchoolPhoneDialCode) => void;
  /** Dark profile settings theme uses light text on dark controls. */
  variant?: 'light' | 'dark';
};

/**
 * Compact +91 / +974 dial picker for school + student forms (styled, not native OS select).
 */
const PhoneDialCodeSelect: React.FC<PhoneDialCodeSelectProps> = ({
  value,
  onChange,
  variant = 'light',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = PHONE_DIAL_OPTIONS.find((o) => o.value === value) ?? PHONE_DIAL_OPTIONS[0];
  const isDark = variant === 'dark';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Phone country code"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={
          isDark
            ? 'flex h-full items-center gap-1 border-r border-white/20 bg-transparent px-2 py-2.5 font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none'
            : 'flex h-full items-center gap-1 border-r border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:bg-slate-100'
        }
      >
        <span>{selected.label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            isDark ? 'text-white/60' : 'text-slate-400'
          } ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className={
            isDark
              ? 'absolute left-0 top-full z-30 mt-1.5 min-w-[5.5rem] overflow-hidden rounded-xl border border-white/15 bg-slate-900 py-1 shadow-lg ring-1 ring-black/40'
              : 'absolute left-0 top-full z-30 mt-1.5 min-w-[5.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-100'
          }
        >
          {PHONE_DIAL_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={
                    isDark
                      ? `flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-white/15 text-white'
                            : 'text-white/80 hover:bg-white/10'
                        }`
                      : `flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`
                  }
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <svg
                      className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-white' : 'text-slate-700'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default PhoneDialCodeSelect;
