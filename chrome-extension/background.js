/**
 * background.js — Manifest V3 Service Worker
 *
 * Acts as the trusted message broker between popup.js and content.js.
 * Chrome's MV3 security model requires a background service worker to
 * inject scripts into pages — the popup cannot do this directly.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    scrapePage(sendResponse);
    // Return true to keep the message channel open for async response
    return true;
  }
  
  if (message.type === 'PORTAL_LOG') {
    logPortalApplication(message.data);
    return false; // Sync response, no need to wait
  }

  if (message.type === 'AUTOFILL_FORM') {
    autofillForm(message.profile, sendResponse);
    return true; // Keep channel open
  }

  if (message.type === 'GENERATE_ANSWER') {
    generateAnswer(message, sendResponse);
    return true;
  }
});

/**
 * Proxies the GENERATE_ANSWER request to the backend.
 */
async function generateAnswer(message, sendResponse) {
  try {
    const stored = await chrome.storage.sync.get(['appUrl', 'apiKey']);
    
    if (!stored.appUrl || !stored.apiKey) {
      sendResponse({ success: false, error: 'Settings incomplete.' });
      return;
    }

    const response = await fetch(`${stored.appUrl}/api/generate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': stored.apiKey,
      },
      body: JSON.stringify({
        question: message.question,
        company: message.company,
        position: message.position,
      }),
    });

    const result = await response.json();
    sendResponse(result);
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Injects content.js into the active tab, triggers the scrape,
 * and sends the result back to the popup via sendResponse.
 */
async function scrapePage(sendResponse) {
  try {
    // Get the currently active tab in the focused window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      sendResponse({ success: false, error: 'Could not find the active tab.' });
      return;
    }

    // Chrome does not allow injecting scripts into chrome:// or other
    // restricted pages. Detect and fail gracefully.
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      sendResponse({
        success: false,
        error: 'Cannot capture content from browser system pages. Please navigate to a job posting.',
      });
      return;
    }

    // Inject the content script into the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    // The content script returns its result as the last expression value
    const result = results?.[0]?.result;

    if (!result || !result.pageText) {
      sendResponse({ success: false, error: 'Could not read page content. The page may still be loading.' });
      return;
    }

    sendResponse({
      success: true,
      pageText: result.pageText,
      pageUrl: tab.url,
      pageTitle: tab.title || '',
    });
  } catch (err) {
    console.error('[Auto-Apply] Background scrape error:', err);
    sendResponse({
      success: false,
      error: err?.message || 'An unexpected error occurred while reading the page.',
    });
  }
}

/**
 * Injects autofill.js into the active tab, and tells it to fill the form.
 */
async function autofillForm(profile, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      sendResponse({ success: false, error: 'Could not find the active tab.' });
      return;
    }

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      sendResponse({ success: false, error: 'Cannot auto-fill on this page.' });
      return;
    }

    // Inject the autofill content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['autofill.js'],
    });

    // Send a message to the newly injected content script with the profile data
    chrome.tabs.sendMessage(tab.id, { type: 'DO_AUTOFILL', profile }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { success: true }); // Assume success if no error
      }
    });
  } catch (err) {
    console.error('[Auto-Apply] Background autofill error:', err);
    sendResponse({ success: false, error: err?.message || 'Failed to inject autofill script.' });
  }
}

/**
 * Handles silent logging of portal applications detected by portal-detector.js
 */
async function logPortalApplication(data) {
  try {
    const stored = await chrome.storage.sync.get(['appUrl', 'apiKey']);
    if (!stored.appUrl || !stored.apiKey) {
      console.warn('[Auto-Apply] Cannot log portal application: Settings incomplete.');
      return;
    }

    const response = await fetch(`${stored.appUrl}/api/portal-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': stored.apiKey,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      console.log(`[Auto-Apply] Successfully logged portal app: ${data.position} at ${data.company}`);
    } else {
      console.warn(`[Auto-Apply] Portal log failed:`, result.error);
    }
  } catch (err) {
    console.error('[Auto-Apply] Portal log request error:', err);
  }
}
