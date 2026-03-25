import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface SchoolAdminBelowNavContextValue {
  belowNav: React.ReactNode;
  setBelowNav: (node: React.ReactNode) => void;
}

const SchoolAdminBelowNavContext = createContext<SchoolAdminBelowNavContextValue | null>(null);

export function SchoolAdminBelowNavProvider({ children }: { children: React.ReactNode }) {
  const [belowNav, setBelowNavState] = useState<React.ReactNode>(null);
  const setBelowNav = useCallback((node: React.ReactNode) => {
    setBelowNavState(node);
  }, []);
  const value = useMemo(() => ({ belowNav, setBelowNav }), [belowNav, setBelowNav]);
  return (
    <SchoolAdminBelowNavContext.Provider value={value}>
      {children}
    </SchoolAdminBelowNavContext.Provider>
  );
}

export function useSchoolAdminBelowNav(): SchoolAdminBelowNavContextValue {
  const ctx = useContext(SchoolAdminBelowNavContext);
  if (!ctx) {
    throw new Error('useSchoolAdminBelowNav must be used within SchoolAdminBelowNavProvider');
  }
  return ctx;
}
