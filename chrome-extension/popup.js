/**
 * popup.js — Extension Popup Logic
 *
 * Handles all user interactions in the popup window:
 * - Loading settings (APP_URL, API_KEY) from chrome.storage
 * - Showing the settings screen on first run
 * - Triggering page scrape via background.js
 * - Calling the /api/capture backend endpoint
 * - Rendering all UI states (ready, loading, success, duplicate, error)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 45000; // 45 seconds — LLM can be slow

// ─── DOM References ───────────────────────────────────────────────────────────

const settingsScreen   = document.getElementById('settings-screen');
const mainScreen       = document.getElementById('main-screen');
const currentUrlEl     = document.getElementById('current-url');
const loadingSubEl     = document.getElementById('loading-sub');
const successTextEl    = document.getElementById('success-text');
const duplicateTextEl  = document.getElementById('duplicate-text');
const errorTextEl      = document.getElementById('error-text');
const btnCapture       = document.getElementById('btn-capture');
const btnAutofill      = document.getElementById('btn-autofill');
const btnRetry         = document.getElementById('btn-retry');
const btnAnother       = document.getElementById('btn-another');
const btnSaveSettings  = document.getElementById('btn-save-settings');
const btnSubmitManual  = document.getElementById('btn-submit-manual');
const inputAppUrl      = document.getElementById('input-app-url');
const inputApiKey      = document.getElementById('input-api-key');
const inputManualEmail = document.getElementById('input-manual-email');
const manualEmailSection = document.getElementById('manual-email-section');
const settingsError    = document.getElementById('settings-error');
const linkOpenSettings = document.getElementById('link-open-settings');
const linkOpenDashboard = document.getElementById('link-open-dashboard');

// ─── State ────────────────────────────────────────────────────────────────────

let savedAppUrl = '';
let savedApiKey = '';
let currentPageUrl = '';
let lastScrapedText = '';
let isAtsPage = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load settings from chrome.storage.sync
  const stored = await chrome.storage.sync.get(['appUrl', 'apiKey']);
  savedAppUrl = stored.appUrl || '';
  savedApiKey = stored.apiKey || '';

  if (!savedAppUrl || !savedApiKey) {
    showSettingsScreen();
    return;
  }

  showMainScreen();
  loadCurrentTabUrl();
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function showSettingsScreen() {
  settingsScreen.style.display = 'block';
  mainScreen.style.display = 'none';
  if (savedAppUrl) inputAppUrl.value = savedAppUrl;
  if (savedApiKey) inputApiKey.value = savedApiKey;
}

function showMainScreen() {
  settingsScreen.style.display = 'none';
  mainScreen.style.display = 'block';
  showState('ready');
}

// ─── State Machine ────────────────────────────────────────────────────────────

const STATES = ['ready', 'loading', 'success', 'duplicate', 'error', 'autofill-success'];

function showState(state) {
  STATES.forEach(s => {
    const el = document.getElementById(`state-${s}`);
    if (el) el.classList.toggle('active', s === state);
  });

  // Button visibility per state
  btnCapture.style.display   = ['ready'].includes(state) ? 'block' : 'none';
  btnAutofill.style.display  = ['ready'].includes(state) ? 'block' : 'none';
  btnRetry.style.display     = ['error'].includes(state) ? 'block' : 'none';
  btnAnother.style.display   = ['success', 'duplicate', 'autofill-success'].includes(state) ? 'block' : 'none';
  manualEmailSection.style.display = 'none'; // reset; shown only when needed
}

// ─── Tab URL ─────────────────────────────────────────────────────────────────

async function loadCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentPageUrl = tab?.url || '';
  const display = currentPageUrl.replace(/^https?:\/\//, '').substring(0, 50);
  currentUrlEl.textContent = display || 'Unknown page';
  
  // Detect if this is a supported ATS page (for Auto-fill)
  isAtsPage = /boards\.greenhouse\.io|jobs\.lever\.co|myworkdayjobs\.com|jobs\.ashbyhq\.com/i.test(currentPageUrl);
  
  // Update button visibility based on detection
  showState('ready');
}

// ─── Capture Flow ─────────────────────────────────────────────────────────────

async function startCapture(manualEmail = null) {
  showState('loading');
  loadingSubEl.textContent = manualEmail ? 'Sending with manual email...' : 'Reading page content...';
  btnCapture.disabled = true;

  try {
    // Step 1: Get page text (skip if we already have it and are doing manual email retry)
    if (!manualEmail) {
      loadingSubEl.textContent = 'Reading page content...';
      const scrapeResult = await requestPageScrape();

      if (!scrapeResult.success) {
        showError(scrapeResult.error || 'Could not read the page.');
        return;
      }

      lastScrapedText = scrapeResult.pageText;
      currentPageUrl = scrapeResult.pageUrl || currentPageUrl;
    }

    // Step 2: Call the backend
    loadingSubEl.textContent = 'Extracting job details with AI...';
    const payload = {
      pageText:    lastScrapedText,
      pageUrl:     currentPageUrl,
      ...(manualEmail ? { manualEmail } : {}),
    };

    const response = await fetchWithTimeout(
      `${savedAppUrl}/api/capture`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key':    savedApiKey,
        },
        body: JSON.stringify(payload),
      },
      TIMEOUT_MS
    );

    const data = await response.json();

    // Step 3: Handle all backend response scenarios
    if (data.requiresEmail) {
      // LLM couldn't find an email — show manual entry
      showState('ready');
      manualEmailSection.style.display = 'block';
      return;
    }

    if (data.duplicate) {
      duplicateTextEl.textContent = `Already applied to "${data.position}" at ${data.company}.`;
      showState('duplicate');
      return;
    }

    if (!data.success) {
      showError(data.error || 'Server returned an unknown error.');
      return;
    }

    // Success!
    const { company, position } = data.jobRecord || {};
    successTextEl.textContent = company && position
      ? `"${position}" at ${company} — scheduled for sending.`
      : 'Job queued and scheduled for sending.';
    showState('success');

  } catch (err) {
    if (err.name === 'AbortError') {
      showError('Request timed out (45s). The server may be busy — please try again.');
    } else {
      showError(err.message || 'Could not reach the server. Is your backend deployed and running?');
    }
  } finally {
    btnCapture.disabled = false;
  }
}

// ─── Autofill Flow ────────────────────────────────────────────────────────────

async function startAutofill() {
  showState('loading');
  loadingSubEl.textContent = 'Fetching Master Profile...';
  btnAutofill.disabled = true;

  try {
    // Fetch profile from backend
    const response = await fetchWithTimeout(
      `${savedAppUrl}/api/profile`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': savedApiKey,
        }
      },
      TIMEOUT_MS
    );
    
    const data = await response.json();
    
    if (!data.success || !data.profile) {
      showError(data.error || 'Failed to fetch Master Profile. Have you set it up in the dashboard?');
      return;
    }
    
    loadingSubEl.textContent = 'Auto-filling form...';
    
    // We send a message to background.js to inject and run the autofill script, 
    // or directly to the tab if the content script is already there.
    // Background can act as a proxy.
    chrome.runtime.sendMessage({ 
      type: 'AUTOFILL_FORM', 
      profile: data.profile 
    }, (res) => {
      if (chrome.runtime.lastError) {
        showError('Cannot connect to the page. Please reload the page and try again.');
        return;
      }
      
      if (!res || !res.success) {
        showError(res?.error || 'Failed to auto-fill the form.');
        return;
      }
      
      showState('autofill-success');
    });
    
  } catch (err) {
    if (err.name === 'AbortError') {
      showError('Request timed out while fetching profile.');
    } else {
      showError(err.message || 'Could not reach the server.');
    }
  } finally {
    btnAutofill.disabled = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showError(message) {
  errorTextEl.textContent = message;
  showState('error');
}

function reset() {
  lastScrapedText = '';
  manualEmailSection.style.display = 'none';
  inputManualEmail.value = '';
  showState('ready');
  loadCurrentTabUrl();
}

/**
 * Sends a SCRAPE_PAGE message to background.js and waits for the result.
 */
function requestPageScrape() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'SCRAPE_PAGE' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: 'No response from background script.' });
      }
    });
  });
}

/**
 * fetch() with an AbortController timeout.
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

btnCapture.addEventListener('click', () => startCapture());
btnAutofill.addEventListener('click', () => startAutofill());
btnRetry.addEventListener('click', () => {
  if (isAtsPage) {
    startAutofill();
  } else {
    startCapture();
  }
});
btnAnother.addEventListener('click', reset);

btnSubmitManual.addEventListener('click', () => {
  const email = inputManualEmail.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    inputManualEmail.style.borderColor = '#f87171';
    return;
  }
  inputManualEmail.style.borderColor = '';
  startCapture(email);
});

btnSaveSettings.addEventListener('click', async () => {
  const appUrl = inputAppUrl.value.trim().replace(/\/$/, '');
  const apiKey = inputApiKey.value.trim();

  if (!appUrl || !appUrl.startsWith('http')) {
    settingsError.textContent = 'Please enter a valid URL (starting with http:// or https://)';
    settingsError.style.display = 'block';
    return;
  }

  if (!apiKey) {
    settingsError.textContent = 'API key is required.';
    settingsError.style.display = 'block';
    return;
  }

  settingsError.style.display = 'none';
  await chrome.storage.sync.set({ appUrl, apiKey });
  savedAppUrl = appUrl;
  savedApiKey = apiKey;
  showMainScreen();
  loadCurrentTabUrl();
});

linkOpenSettings.addEventListener('click', showSettingsScreen);

linkOpenDashboard.addEventListener('click', () => {
  if (savedAppUrl) {
    chrome.tabs.create({ url: savedAppUrl });
  }
});
