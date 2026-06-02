/**
 * content.js — Page Content Scraper
 *
 * This script is injected into the active tab by background.js.
 * Its sole job is to extract the most relevant text from the job posting page
 * and return it. It runs in the context of the web page, NOT the extension.
 *
 * Extraction strategy:
 * 1. Try known semantic selectors for major job boards
 * 2. Fall back to generic semantic HTML (main, article, section)
 * 3. Final fallback: document.body.innerText (entire visible page)
 */

(function () {
  const MAX_TEXT_LENGTH = 8000;

  /**
   * Selectors for known job boards, ordered by specificity.
   * Each entry is a CSS selector targeting the primary content area.
   */
  const KNOWN_SELECTORS = [
    // LinkedIn
    'div.job-view-layout',
    'div.jobs-details__main-content',
    'div[class*="job-details"]',
    // Wellfound / AngelList
    'div[class*="JobDescription"]',
    'div[data-test="JobDescription"]',
    // Y Combinator / Work at a Startup
    'div[class*="job-detail"]',
    'div[class*="JobDetail"]',
    // Greenhouse
    '#content',
    'div#app_body',
    // Lever
    'div.content',
    'div[class*="section-content"]',
    // Indeed
    'div[class*="jobDescriptionText"]',
    'div#jobDescriptionText',
    // Naukri / remote boards
    'div[class*="job-desc"]',
    'div[class*="jobDesc"]',
    // Generic semantic
    'main article',
    'main',
    'article',
    '[role="main"]',
  ];

  /**
   * Extract text from the page using the selector priority list.
   */
  function extractText() {
    // Try each selector in order
    for (const selector of KNOWN_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.innerText?.trim();
        if (text && text.length > 200) {
          return text;
        }
      }
    }

    // Final fallback — the entire visible page body
    return document.body.innerText?.trim() || '';
  }

  /**
   * Trim text to the maximum safe length for LLM token limits.
   * We keep the top portion of the page which is most likely to contain
   * job title, company name, and recruiter contact info.
   */
  function truncate(text) {
    if (text.length <= MAX_TEXT_LENGTH) return text;
    return text.slice(0, MAX_TEXT_LENGTH) + '\n...[truncated]';
  }

  const rawText = extractText();
  const pageText = truncate(rawText);

  // Return the result — this is captured by chrome.scripting.executeScript's result
  return { pageText };
})();
