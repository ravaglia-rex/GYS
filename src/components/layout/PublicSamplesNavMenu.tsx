import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublicSamplesNavMenu: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const menuItems = [
    { label: 'Assessments', path: '/about/assessments' },
    { label: 'Student Interactive Dashboard', path: '/students/preview/dashboard' },
    { label: 'School Interactive Dashboard', path: '/for-schools/preview/dashboard' },
  ] as const;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors duration-150"
      >
        Explore
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[16rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                navigate(item.path);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicSamplesNavMenu;
