import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOL_LEGAL_PATHS } from '../../constants/schoolLegal';

/** Same footer as the home page use on every public marketing route. */
const LandingSiteFooter: React.FC = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-gray-200 bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-600 sm:gap-x-6">
          <button type="button" onClick={() => navigate('/for-schools')} className="text-gray-600 hover:text-gray-900">
            For Schools
          </button>
          <button type="button" onClick={() => navigate('/students')} className="text-gray-600 hover:text-gray-900">
            For Students
          </button>
          <a href="mailto:globalyoungscholar@argus.ai" className="text-gray-600 hover:text-gray-900">
            Contact
          </a>
          <button
            type="button"
            onClick={() => navigate(SCHOOL_LEGAL_PATHS.terms)}
            className="text-gray-600 hover:text-gray-900"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => navigate(SCHOOL_LEGAL_PATHS.dataProcessing)}
            className="text-gray-600 hover:text-gray-900"
          >
            Data processing
          </button>
          <button
            type="button"
            onClick={() => navigate(SCHOOL_LEGAL_PATHS.privacy)}
            className="text-gray-600 hover:text-gray-900"
          >
            Privacy
          </button>
        </nav>
        <p className="mt-4 text-center text-xs leading-relaxed text-gray-500 sm:mt-5 sm:text-sm">
          © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and
          EducationWorld.
        </p>
      </div>
    </footer>
  );
};

export default LandingSiteFooter;
