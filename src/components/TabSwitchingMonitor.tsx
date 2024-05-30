import React, { useEffect, useState } from 'react';

const TabSwitchingMonitor: React.FC = () => {
//   const [permissionGranted, setPermissionGranted] = useState(false);
//   const [displayStream, setDisplayStream] = useState<MediaStream | null>(null);
  const [tabSwitched, setTabSwitched] = useState(false);

  const checkMultipleDisplays = async () => {
    // if (navigator.mediaDevices.getDisplayMedia && !displayStream) {
    //   try {
    //     const stream = await navigator.mediaDevices.getDisplayMedia({
    //       video: true,
    //     });
    //     const track = stream.getVideoTracks()[0];
    //     const settings = track.getSettings();
        
    //     if (settings.width && settings.height) {
    //       const isMultipleDisplays = settings.displaySurface === 'monitor' || (settings.width / window.screen.width > 1);

    //       if (isMultipleDisplays) {
    //         alert('Violation: Multiple displays detected. Please use only one display.');
    //         stream.getTracks().forEach(track => track.stop());
    //       } else {
    //         setPermissionGranted(true);
    //         setDisplayStream(stream);
    //       }
    //     } else {
    //       alert('Please share your entire screen.');
    //     }
    //   } catch (err) {
    //     console.error('Error accessing display media.', err);
    //   }
    // }
    return;
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      alert('Violation: Tab switching detected.');
      setTabSwitched(true);
    } else {
        setTabSwitched(false);
    }
  };

  useEffect(() => {
    // Request screen sharing permission once
    checkMultipleDisplays();

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodically check for multiple displays
    const intervalId = setInterval(() => {
    //   if (displayStream) {
    //     const track = displayStream.getVideoTracks()[0];
    //     const settings = track.getSettings();
    //     if (settings.width && settings.height) {
    //       const isMultipleDisplays = settings.displaySurface === 'monitor' || (settings.width / window.screen.width > 1);
    //       if (isMultipleDisplays) {
    //         alert('Violation: Multiple displays detected. Please use only one display.');
    //       }
    //     }
    //   } else {
        checkMultipleDisplays();
    //   }
    }, 10000); // Check every 10 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div>
        {tabSwitched && <p>Tab switched</p>}
    </div>
  );
};

export default TabSwitchingMonitor;