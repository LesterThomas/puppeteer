
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false, devtools: true, slowMo: 500});
  const page = await browser.newPage();
  page.on('console', msg => console.log('Page Console: ${msg.text()}'));

  await page.goto('https://www.fundingcircle.com');

  await browser.close();
})();