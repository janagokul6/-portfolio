/**
 * portal-detector.js — ATS Success Page Detector
 *
 * This content script is automatically injected into known ATS portal domains
 * (Greenhouse, Lever, Workday, Ashby) via the manifest's content_scripts entry.
 *
 * When a user successfully submits a job application through one of these portals,
 * the ATS redirects to a "Thank you" / confirmation page. This script detects
 * that page, extracts the company name and position, and silently logs the
 * application to the Auto-Apply backend.
 *
 * It runs on every page load on these domains, but only fires the API call
 * when it detects a legitimate success/confirmation page pattern.
 */

(function () {
  'use strict';

  const url = window.location.href.toLowerCase();
  const bodyText = (document.body?.innerText || '').toLowerCase();

  // ─── ATS Detection Rules ────────────────────────────────────────────────

  const ATS_RULES = [
    {
      name: 'greenhouse',
      domainPattern: /boards\.greenhouse\.io/i,
      isSuccessPage: () => {
        // Greenhouse confirmation pages contain specific elements or URL patterns
        return (
          url.includes('/confirmation') ||
          !!document.querySelector('.application--confirmation') ||
          !!document.querySelector('[data-test="confirmation"]') ||
          (bodyText.includes('your application has been submitted') ||
           bodyText.includes('thanks for applying') ||
           bodyText.includes('thank you for applying'))
        );
      },
      extractDetails: () => {
        // Try to get company from the page header or meta
        const companyEl = document.querySelector('.company-name') ||
                          document.querySelector('[class*="company"]') ||
                          document.querySelector('h1');
        const company = companyEl?.textContent?.trim() || extractFromTitle();

        // Position might be in a heading or the page title
        const positionEl = document.querySelector('.job-title') ||
                           document.querySelector('[class*="posting-title"]');
        const position = positionEl?.textContent?.trim() || extractPositionFromTitle();

        return { company, position };
      },
    },
    {
      name: 'lever',
      domainPattern: /jobs\.lever\.co/i,
      isSuccessPage: () => {
        return (
          url.includes('/thanks') ||
          bodyText.includes('your application has been submitted') ||
          bodyText.includes('thanks for applying') ||
          bodyText.includes('thank you for your application')
        );
      },
      extractDetails: () => {
        const companyEl = document.querySelector('.main-header-text') ||
                          document.querySelector('[class*="company"]') ||
                          document.querySelector('h1');
        const company = companyEl?.textContent?.trim() || extractFromTitle();

        const positionEl = document.querySelector('.posting-headline h2') ||
                           document.querySelector('[class*="posting-title"]');
        const position = positionEl?.textContent?.trim() || extractPositionFromTitle();

        return { company, position };
      },
    },
    {
      name: 'workday',
      domainPattern: /\.myworkdayjobs\.com/i,
      isSuccessPage: () => {
        return (
          bodyText.includes('application has been submitted') ||
          bodyText.includes('your application was successfully submitted') ||
          bodyText.includes('thank you for submitting your application') ||
          bodyText.includes('thanks for applying')
        );
      },
      extractDetails: () => {
        const company = extractFromTitle();
        const position = extractPositionFromTitle();
        return { company, position };
      },
    },
    {
      name: 'ashby',
      domainPattern: /jobs\.ashbyhq\.com/i,
      isSuccessPage: () => {
        return (
          url.includes('/confirmation') ||
          bodyText.includes('application submitted') ||
          bodyText.includes('thanks for applying') ||
          bodyText.includes('thank you for applying')
        );
      },
      extractDetails: () => {
        const companyEl = document.querySelector('[class*="company"]') ||
                          document.querySelector('h1');
        const company = companyEl?.textContent?.trim() || extractFromTitle();

        const positionEl = document.querySelector('[class*="job-title"]') ||
                           document.querySelector('h2');
        const position = positionEl?.textContent?.trim() || extractPositionFromTitle();

        return { company, position };
      },
    },
  ];

  // ─── Helpers ────────────────────────────────────────────────────────────

  /**
   * Extract company name from the page title.
   * Common patterns: "Apply for X at CompanyName" or "CompanyName - Careers"
   */
  function extractFromTitle() {
    const title = document.title || '';
    // Try "at CompanyName" pattern
    const atMatch = title.match(/at\s+(.+?)(?:\s*[-|]|$)/i);
    if (atMatch) return atMatch[1].trim();
    // Try "CompanyName - " or "CompanyName | " prefix
    const prefixMatch = title.match(/^(.+?)\s*[-|]/);
    if (prefixMatch) return prefixMatch[1].trim();
    return title.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Extract position from the page title.
   * Common patterns: "Apply for PositionTitle at Company"
   */
  function extractPositionFromTitle() {
    const title = document.title || '';
    const forMatch = title.match(/(?:apply\s+for|application\s+for)\s+(.+?)\s+at\s/i);
    if (forMatch) return forMatch[1].trim();
    // Try first part before " - " or " | "
    const parts = title.split(/\s*[-|]\s*/);
    if (parts.length > 1) return parts[0].trim();
    return 'Unknown Position';
  }

  // ─── Main Detection Loop ───────────────────────────────────────────────

  // Delay slightly to ensure the page is fully rendered (some ATS use client-side routing)
  setTimeout(() => {
    for (const rule of ATS_RULES) {
      if (!rule.domainPattern.test(window.location.hostname)) continue;
      if (!rule.isSuccessPage()) continue;

      // We found a success page! Extract details and log.
      const { company, position } = rule.extractDetails();

      if (!company || company.length < 2) {
        console.log('[Auto-Apply] Detected ATS success page but could not extract company name.');
        return;
      }

      console.log(`[Auto-Apply] Portal submission detected: "${position}" at ${company} via ${rule.name}`);

      // Send to backend via background script (to get settings)
      chrome.runtime.sendMessage({
        type: 'PORTAL_LOG',
        data: {
          company,
          position: position || 'Unknown Position',
          portalName: rule.name,
          pageUrl: window.location.href,
        },
      });

      // Only process the first matching rule
      return;
    }
  }, 1500); // 1.5s delay for client-side rendered pages
})();
