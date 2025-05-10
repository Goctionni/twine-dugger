let isInjected = false;
export async function injectContentScript(tabId: number): Promise<void> {
  if (isInjected) return;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./content-script.js'], // Path relative to extension root
    });
    isInjected = true;
    console.log(`SW_INJECT: Content script injected into tab ${tabId}:`, results);
  } catch (err) {
    console.error(`SW_INJECT: Failed to inject content script into tab ${tabId}:`, err);
    throw err; // Re-throw for the caller to handle
  }
}
