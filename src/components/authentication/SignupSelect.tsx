import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

function parseOptions(children: React.ReactNode): Option[] {
  const options: Option[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type !== 'option') return;
    const props = child.props as {
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    };
    options.push({
      value: props.value == null ? '' : String(props.value),
      label: String(props.children ?? ''),
      disabled: Boolean(props.disabled),
    });
  });
  return options;
}

export type SignupSelectProps = {
  value?: string | number | readonly string[];
  onChange?: (event: { target: { value: string } }) => void;
  children?: React.ReactNode;
  /** Applied to the trigger button (use for error borders, etc.). */
  className?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
};

/**
 * Custom dropdown for public / light-theme forms. Closed + open menus are styled;
 * native &lt;select&gt; open menus cannot be restyled (OS picker).
 */
const SignupSelect: React.FC<SignupSelectProps> = ({
  className = '',
  value,
  onChange,
  children,
  required = false,
  disabled = false,
  name,
  id,
  'aria-label': ariaLabel,
}) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const options = useMemo(() => parseOptions(children), [children]);
  const stringValue = value == null ? '' : String(value);
  const selected = options.find((o) => o.value === stringValue);
  const empty = !stringValue;
  const displayLabel = selected?.label || options.find((o) => o.value === '')?.label || 'Select';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  const pick = (next: string) => {
    onChange?.({ target: { value: next } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <input
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        name={name}
        value={stringValue}
        required={required}
        onChange={() => undefined}
      />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`flex h-11 w-full items-center justify-between rounded-lg border bg-white py-2.5 pl-3.5 pr-3 text-left text-sm sm:text-base shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
          empty ? 'text-slate-400' : 'text-slate-900'
        } ${
          className.includes('border-red')
            ? ''
            : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-slate-400/20'
        } ${className}`.trim()}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.25}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-slate-100"
        >
          {options.map((option) => {
            const isSelected = option.value === stringValue;
            return (
              <li key={`${option.value}::${option.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) pick(option.value);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm sm:text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'bg-slate-100 font-medium text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-slate-700" strokeWidth={2.5} />
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

export default SignupSelect;
