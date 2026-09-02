const devtools = globalThis.chrome.devtools ?? browser.devtools;
devtools.panels.create('Twine Dugger', './icons/16.png', './index.html');
