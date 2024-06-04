import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state_data/reducer.ts';
import { setTabSwitched } from '../state_data/tabSwitchingSlice.ts';

const TabSwitchingMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const tabSwitching = useSelector((state: RootState) => state.tabSwitching);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      alert('Violation: Tab switching detected.');
      dispatch(setTabSwitched({tab_switch_count: tabSwitching.tab_switch_count+1, timestamp: new Date().toISOString()}));
    }
  };

  useEffect(() => {
    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line
  }, []);

  return (
    null
  );
};

export default TabSwitchingMonitor;