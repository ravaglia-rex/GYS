import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state_data/reducer';
import { setTabSwitched, setFullScreenSwitched } from '../state_data/tabSwitchingSlice';
import FullScreenDialog from './FullScreenDialog';

const TabSwitchingMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const [isFullScreen, setIsFullScreen] = useState(true);
  const tabSwitching = useSelector((state: RootState) => state.tabSwitching);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      alert('Violation: Tab switching detected.');
      dispatch(setTabSwitched({
        count: tabSwitching.tab_switch_count + 1,
        timestamp: new Date().toISOString()
      }));
    }
  }, [dispatch, tabSwitching.tab_switch_count]);

  const onFullScreenChange = useCallback(() => {
    const isFullScreenNow = Boolean(document.fullscreenElement);
    setIsFullScreen(isFullScreenNow);
    if (!isFullScreenNow) {
      dispatch(setFullScreenSwitched({
        count: tabSwitching.full_screen_switch_count + 1,
        timestamp: new Date().toISOString()
      }));
    }
  }, [dispatch, tabSwitching.full_screen_switch_count]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
    };
  }, [onFullScreenChange]); 

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]); 

  return (
    <div>
      {<FullScreenDialog isFullScreen={isFullScreen}/>}
    </div>
  );
};

export default TabSwitchingMonitor;
