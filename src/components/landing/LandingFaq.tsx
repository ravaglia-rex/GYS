import React, { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type LandingFaqItem = {
  question: string;
  answer: React.ReactNode;
};

export type LandingFaqProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  sections: { heading: string; items: LandingFaqItem[] }[];
  className?: string;
};

const LandingFaq: React.FC<LandingFaqProps> = ({
  id,
  title = 'Frequently Asked Questions',
  subtitle,
  sections,
  className = '',
}) => {
  const baseId = useId().replace(/:/g, '');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);

  useEffect(() => {
    setOpenItemIndex(null);
  }, [activeTabIndex]);

  if (sections.length === 0) {
    return null;
  }

  const activeSection = sections[Math.min(activeTabIndex, sections.length - 1)];

  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{subtitle}</p>
      ) : null}

      <div
        className="mt-6 flex flex-wrap gap-2 sm:mt-8"
        role="tablist"
        aria-label="FAQ categories"
      >
        {sections.map((section, index) => {
          const selected = index === activeTabIndex;
          return (
            <button
              key={section.heading}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTabIndex(index)}
              className={`rounded-xl px-4 py-2.5 text-left text-xs font-semibold transition-all duration-200 sm:text-sm sm:px-5 ${
                selected
                  ? 'bg-[#1e3a8a] text-white shadow-md ring-2 ring-[#1e3a8a] ring-offset-2 ring-offset-slate-50'
                  : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
              }`}
            >
              {section.heading}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTabIndex}`}
        aria-labelledby={`${baseId}-tab-${activeTabIndex}`}
        className="mt-6"
      >
        <div className="space-y-2">
          {activeSection.items.map((item, itemIndex) => {
            const isOpen = openItemIndex === itemIndex;
            const panelId = `${baseId}-faq-${activeTabIndex}-${itemIndex}`;
            const toggleItem = (e: React.MouseEvent | React.KeyboardEvent) => {
              e.preventDefault();
              setOpenItemIndex((prev) => (prev === itemIndex ? null : itemIndex));
            };
            return (
              <div
                key={item.question}
                className={`rounded-2xl bg-white px-4 py-1 shadow-sm ring-1 transition-[box-shadow,ring-color] duration-300 ease-out sm:px-5 ${
                  isOpen ? 'ring-slate-200 shadow-md ring-1' : 'ring-slate-100'
                }`}
              >
                <button
                  type="button"
                  id={`${panelId}-trigger`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full cursor-pointer items-start justify-between gap-3 py-3 pr-2 text-left text-sm font-semibold text-slate-900 sm:text-base"
                  onClick={toggleItem}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleItem(e);
                    }
                  }}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ease-out motion-reduce:duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                    strokeWidth={2}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${panelId}-trigger`}
                  aria-hidden={!isOpen}
                  className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none motion-reduce:duration-0"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-slate-100 pb-4 pt-3 text-xs leading-relaxed text-slate-600 sm:text-sm [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li+li]:mt-1 [&_a]:break-words">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFaq;
