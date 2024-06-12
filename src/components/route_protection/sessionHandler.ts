export const checkSingleTab = () => {
  const sessionId = 'single_tab_id';
  const uniqueTabId = new Date().getTime().toString();

  localStorage.setItem(sessionId, uniqueTabId);

  // Listen for changes in localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === sessionId && event.newValue !== uniqueTabId) {
      document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background-color:white;z-index:1000;text-align:center;padding-top:20%;">Only one tab of this application can be used at a time.</div>';
    }
  });

  window.addEventListener('unload', () => {
    if (localStorage.getItem(sessionId) === uniqueTabId) { // Check if closing tab is the active tab
      localStorage.removeItem(sessionId);
    }
  });
};