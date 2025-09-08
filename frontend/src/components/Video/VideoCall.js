import React, { useEffect, useRef } from 'react';

const VideoCall = ({ roomName, displayName }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const domain = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';

    // Load script if not present
    const ensureScript = () => new Promise((resolve) => {
      if (window.JitsiMeetExternalAPI) return resolve();
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });

    let disposed = false;

    ensureScript().then(() => {
      if (disposed || !containerRef.current) return;
      const options = {
        roomName: roomName || `StudyHive-${Math.random().toString(36).slice(2)}`,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: displayName || 'Guest' },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_POWERED_BY: false,
        },
        configOverwrite: {
          prejoinPageEnabled: true,
        }
      };
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    });

    return () => {
      disposed = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (_) {}
        apiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  return (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden" ref={containerRef} />
  );
};

export default VideoCall;
