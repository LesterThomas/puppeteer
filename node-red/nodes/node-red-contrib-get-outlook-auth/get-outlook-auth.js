var credentials = require('./cred.js'); 
const puppeteer = require('puppeteer');
const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};


module.exports = function (RED) {
  class GetOutlookAuthNode {
    constructor (config) {
      RED.nodes.createNode(this, config);
      this.on('input', this.handleMsg);
    }

    handleMsg (msg) {
      console.log('input message received');
      getOutlookToken(this.handleCallback, this);
    }

    handleCallback(node, code) {
      var msg={payload: code}
      node.send(msg);    
    }


  }
  RED.nodes.registerType('get-outlook-auth', GetOutlookAuthNode);
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




const getOutlookToken = async(callbackHandler, node) => {


  var code = await processPuppeteerCommands();
  console.log('After await');
  
  callbackHandler(node, code);

}

const processPuppeteerCommands = async() => {

  const browser = await puppeteer.launch({headless: true,  slowMo: 10}); //devtools: true,
  const page = await browser.newPage();


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

  await delay(1000);
  await browser.close();
  return code;
}


const delay = ms => new Promise(res => setTimeout(res, ms));



