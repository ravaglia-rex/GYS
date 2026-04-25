import React from 'react';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import { scrollToLandingSectionId } from '../../hooks/useLandingPageScroll';

export type LandingNavSection = { readonly id: string; readonly label: string };

type LandingHeaderScrollProgressProps = {
  scrollProgress: number;
};

/** Sticky header child: place inside a `relative` header, flush to bottom */
export const LandingHeaderScrollProgress: React.FC<LandingHeaderScrollProgressProps> = ({
  scrollProgress,
}) => (
  <div
    className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-none transition-[width] duration-100 ease-out"
    style={{
      width: `${scrollProgress}%`,
      background: `linear-gradient(90deg, ${GYS_GOLD}, #38bdf8, ${GYS_BLUE})`,
    }}
    aria-hidden
  />
);

type LandingSectionRailProps = {
  sections: readonly LandingNavSection[];
  activeSectionId: string;
  className?: string;
};

/** Fixed right rail: in-page section jumps. Hidden below `xl`. Active dot: warm gold glow. */
export const LandingSectionRail: React.FC<LandingSectionRailProps> = ({
  sections,
  activeSectionId,
  className = '',
}) => (
  <nav
    className={`landing-scroll-rail fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center xl:flex ${className}`}
    aria-label="Jump to section on this page"
    title="Jump to a section"
  >
    <ul className="flex flex-col items-center gap-y-2 rounded-full border border-white/25 bg-slate-950/35 px-2 py-3 shadow-lg backdrop-blur-md ring-1 ring-white/10">
      {sections.map(({ id, label }) => {
        const active = activeSectionId === id;
        return (
          <li key={id} className="flex flex-col items-center">
            <button
              type="button"
              aria-label={`Go to ${label}`}
              aria-current={active ? 'location' : undefined}
              onClick={() => scrollToLandingSectionId(id)}
              className={`landing-scroll-rail__dot flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border border-white/50 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/80 ${
                active
                  ? 'landing-scroll-rail__dot--active border-amber-100 bg-amber-50 shadow-sm'
                  : 'bg-white/35 hover:bg-white/60'
              }`}
            />
          </li>
        );
      })}
    </ul>
  </nav>
);
