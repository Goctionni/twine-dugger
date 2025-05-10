import './inject-content-script';
import './message-router';

console.log('Service Hub (service-worker) main loaded and rpc-bridge initialized.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated.');
});
