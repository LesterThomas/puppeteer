var credentials = require('./cred.js'); 
const puppeteer = require('puppeteer');
const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};


const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};



//helper function to login and get code
const loginAndNavigateToApp = async (page, browser) => {
  try {
    await page.goto('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=631ac5af-28a2-4dd5-940d-919a914b8a4b&response_type=code&redirect_uri=https://google.com/auth&response_mode=query&scope=openid%20https://graph.microsoft.com/user.read%20https://graph.microsoft.com/calendars.read&state=12345');
    await page.waitFor('#i0116');
    await page.click('#i0116'); 
    await page.keyboard.type(credentials.username);
    await page.click('#idSIButton9'); 
  } catch (error){
    console.log(error);
  }
  await delay(1000);

  try {
    await page.waitFor('#i0118');
    await page.click('#i0118'); 
    await page.keyboard.type(credentials.password);
    await page.click('#idSIButton9'); 
  } catch (error){
    console.log(error);
  }
  await delay(1000);

  var url=page.url();
  //console.log(url);  
  var code = url.split('code=')[1];
  code =code.split('&state')[0];
  console.log(code);


}



const getOutlookToken = async(page, browser) => {

  await loginAndNavigateToApp(page, browser);



}


const delay = ms => new Promise(res => setTimeout(res, ms));



(async () => {

  const browser = await puppeteer.launch({headless: true,  slowMo: 10}); //devtools: true,
  const page = await browser.newPage();
  await getOutlookToken(page, browser);
  await delay(5000);
  await browser.close();
})();