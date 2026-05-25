/**
 * HTML Email Builder
 * Converts plain-text email body into a minimal HTML email with:
 * - A 1x1 transparent tracking pixel for open detection
 * - Wrapped links for click tracking (when portfolio URL is configured)
 * - Plain-text fallback for email clients that don't render HTML
 */

/**
 * Result of building an HTML email
 */
export interface HtmlEmailResult {
  html: string;   // HTML version with tracking pixel & wrapped links
  text: string;   // Original plain-text fallback
}

/**
 * Get the application base URL for constructing tracking endpoints.
 * Priority: APP_URL env > VERCEL_URL env > localhost fallback
 */
export function getAppBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, ''); // strip trailing slash
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Build the tracking pixel <img> tag
 */
function buildTrackingPixel(jobId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track/open?id=${encodeURIComponent(jobId)}`;
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
}

/**
 * Wrap a URL through the click tracking redirect endpoint
 */
function wrapLinkForTracking(originalUrl: string, jobId: string, baseUrl: string): string {
  return `${baseUrl}/api/track/click?id=${encodeURIComponent(jobId)}&url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Escape HTML special characters in plain text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert plain text body into HTML, preserving line breaks
 * and making bare URLs clickable
 */
function textToHtml(text: string): string {
  const escaped = escapeHtml(text);
  // Convert URLs to clickable <a> tags
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<>&]+)/g,
    '<a href="$1" style="color:#2563eb;text-decoration:underline;">$1</a>'
  );
  // Preserve line breaks
  return withLinks.replace(/\n/g, '<br>\n');
}

/**
 * Build an HTML email with tracking pixel and optional portfolio link.
 *
 * @param plainTextBody - The original plain-text email body
 * @param jobId - The job record UUID (used in tracking URLs)
 * @param portfolioUrl - Optional portfolio URL to append and track
 * @returns HtmlEmailResult with html and text versions
 */
export function buildTrackedEmail(
  plainTextBody: string,
  jobId: string,
  portfolioUrl?: string,
): HtmlEmailResult {
  const baseUrl = getAppBaseUrl();

  // Start with the original text as the fallback
  let text = plainTextBody;

  // Convert body text to HTML
  let htmlBody = textToHtml(text);

  // If portfolio URL exists, wrap it for click tracking in the HTML version
  if (portfolioUrl) {
    const trackedUrl = wrapLinkForTracking(portfolioUrl, jobId, baseUrl);
    // Replace the portfolio link in the HTML with the tracked version
    const escapedPortfolioUrl = escapeHtml(portfolioUrl);
    htmlBody = htmlBody.replace(
      new RegExp(`<a href="${escapedPortfolioUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>${escapedPortfolioUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</a>`, 'g'),
      `<a href="${trackedUrl}" style="color:#2563eb;text-decoration:underline;">${escapedPortfolioUrl}</a>`
    );
  }

  // Build the full HTML email
  const trackingPixel = buildTrackingPixel(jobId, baseUrl);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
  <div style="max-width:600px;">
    ${htmlBody}
  </div>
  ${trackingPixel}
</body>
</html>`;

  return { html, text };
}
