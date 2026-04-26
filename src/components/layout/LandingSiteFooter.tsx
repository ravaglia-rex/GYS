import React from 'react';
import { useNavigate } from 'react-router-dom';

/** Same footer as the home page use on every public marketing route. */
const LandingSiteFooter: React.FC = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <button type="button" onClick={() => navigate('/for-schools')} className="text-gray-600 hover:text-gray-900">
            For Schools
          </button>
          <button type="button" onClick={() => navigate('/students')} className="text-gray-600 hover:text-gray-900">
            For Students
          </button>
          <button
            type="button"
            onClick={() => navigate('/about/assessments')}
            className="text-gray-600 hover:text-gray-900"
          >
            Assessments
          </button>
          <a href="mailto:schools@globalyoungscholar.com" className="text-gray-600 hover:text-gray-900">
            Contact
          </a>
        </nav>
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and
          EducationWorld.
        </p>
      </div>
    </footer>
  );
};

export default LandingSiteFooter;
