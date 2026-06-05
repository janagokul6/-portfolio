const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: '/home/g/work/auto-apply/debug_screenshot.png' });
    await browser.close();
    console.log('Screenshot saved to /home/g/work/auto-apply/debug_screenshot.png');
  } catch (err) {
    console.error('Error taking screenshot:', err);
  }
})();
