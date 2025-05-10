chrome.devtools.panels.create(
  'My RPC Panel', // Panel title
  '', // Path to an icon (optional, place in /public)
  './index.html', // Path to your panel's HTML (Vite's entry point)
  (panel) => {
    console.log('DevTools panel created.');
    panel.onShown.addListener((window) => {
      console.log('Panel shown. Window:', window);
    });
  },
);
