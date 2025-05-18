chrome.devtools.panels.create('Twine Dugger', '', './index.html', (panel) => {
  console.log('DevTools panel created.');
  panel.onShown.addListener((window) => {
    console.log('Panel shown. Window:', window);
  });
});
