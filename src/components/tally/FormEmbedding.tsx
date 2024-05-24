import React, { useEffect } from 'react';

// Declare global interface to extend window object
declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

const FormEmbedding: React.FC = () => {
    useEffect(() => {
        const widgetScriptSrc = 'https://tally.so/widgets/embed.js';

        const load = () => {
          // Load Tally embeds
          if (window.Tally) {
            window.Tally.loadEmbeds();
            return;
          }

          // Fallback if window.Tally is not available
          document
            .querySelectorAll<HTMLIFrameElement>('iframe[data-tally-src]:not([src])')
            .forEach((iframeEl) => {
              if (iframeEl.dataset.tallySrc) {  // Make sure dataset.tallySrc exists
                iframeEl.src = iframeEl.dataset.tallySrc;  // Properly set src from dataset
              }
            });
        };

        // If Tally is already loaded, load the embeds
        if (window.Tally) {
          load();
          return;
        }

        // If the Tally widget script is not loaded yet, load it
        if (document.querySelector(`script[src="${widgetScriptSrc}"]`) === null) {
          const script = document.createElement('script');
          script.src = widgetScriptSrc;
          script.onload = load;
          script.onerror = load;
          document.body.appendChild(script);
          return;
        }
    }, []);
    
    return (
        <iframe 
          data-tally-src="https://tally.so/embed/npByEB?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" 
          loading="lazy" 
          width="100%"
          height="216"
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
          title="GYS  - Preliminary Exam (April24)"
        >
        </iframe>
    );
}

export default FormEmbedding;
