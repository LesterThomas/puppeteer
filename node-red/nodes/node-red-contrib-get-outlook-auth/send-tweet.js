const puppeteer = require('puppeteer');

module.exports = function (RED) {
  class SendTweet {
    constructor (config) {
      RED.nodes.createNode(this, config);
      this.server = RED.nodes.getNode(config.server);
      this.on('input', this.handleMsg);
    }

    handleMsg (msg) {
      console.log('input message received');
      sendTweet(this.server.username, this.server.password, msg.payload);
    }
  }
  RED.nodes.registerType('send-tweet', SendTweet);
};

async function sendTweet (username, password, text) {
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 }); // devtools: true,
  const page = await browser.newPage();

  try {
    await page.goto('https://twitter.com');

    await page.waitFor('#doc > div > div.StaticLoggedOutHomePage-content > div.StaticLoggedOutHomePage-cell.StaticLoggedOutHomePage-utilityBlock > div.StaticLoggedOutHomePage-signupBlock > div.StaticLoggedOutHomePage-noSignupForm > div > a.js-nav.EdgeButton.EdgeButton--medium.EdgeButton--secondary.StaticLoggedOutHomePage-buttonLogin');
    await page.click('#doc > div > div.StaticLoggedOutHomePage-content > div.StaticLoggedOutHomePage-cell.StaticLoggedOutHomePage-utilityBlock > div.StaticLoggedOutHomePage-signupBlock > div.StaticLoggedOutHomePage-noSignupForm > div > a.js-nav.EdgeButton.EdgeButton--medium.EdgeButton--secondary.StaticLoggedOutHomePage-buttonLogin');
    await page.waitFor('#page-container > div > div.signin-wrapper > form > fieldset > div:nth-child(2) > input');
    await page.keyboard.type(username);
    await page.click('#page-container > div > div.signin-wrapper > form > fieldset > div:nth-child(3) > input');
    await page.keyboard.type(password);
    await page.click('#page-container > div > div.signin-wrapper > form > div.clearfix > button');
    await page.waitFor('#react-root > div > div > div > header > div > div > div > div > div.css-1dbjc4n.r-1awozwy.r-jw8lkh.r-e7q0ms > a > div > svg > g > path');
    await page.click('#react-root > div > div > div > header > div > div > div > div > div.css-1dbjc4n.r-1awozwy.r-jw8lkh.r-e7q0ms > a > div > svg > g > path');
    await page.keyboard.type(text);
    await page.click('#react-root > div > div > div.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af.r-184en5c > div > div > div > div > div.css-1dbjc4n.r-1habvwh.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv > div.css-1dbjc4n.r-t23y2h.r-1wbh5a2.r-rsyp9y.r-1pjcn9w.r-htvplk.r-1udh08x.r-1potc6q > div > div.css-1dbjc4n.r-16y2uox.r-1wbh5a2.r-1jgb5lz.r-1ye8kvj.r-13qz1uu > div > div > div:nth-child(1) > div > div > div > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-15d164r.r-9cviqr.r-bcqeeo.r-1bylmt5.r-13tjlyg.r-7qyjyx.r-1ftll1t > div:nth-child(2) > div > div > div:nth-child(2) > div.css-18t94o4.css-1dbjc4n.r-urgr8i.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-1w2pmg.r-1n0xq6e.r-1vuscfd.r-1dhvaqw.r-1fneopy.r-o7ynqc.r-6416eg.r-lrvibr > div > span > span');

    await delay(100000);
  } catch (error) {
    console.log(error);
  }
  await delay(1000);
  await delay(1000);
  await browser.close();
};

const delay = ms => new Promise(res => setTimeout(res, ms));
