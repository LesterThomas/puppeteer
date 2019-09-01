const puppeteer = require('puppeteer');

module.exports = function (RED) {
  function MicrosoftAPIConfigNode (n) {
    RED.nodes.createNode(this, n);
    this.username = n.username;
    this.password = n.password;
    this.getAccessToken = getAccessToken;
  }

  async function getAccessToken (node, callbackFunction) {
    console.log('this.accessToken');
    console.log(this.accessToken);
    console.log('this.accessCode');
    console.log(this.accessCode);

    if (!this.accessToken) {
      this.accessCode = await getAccessCode(this.username, this.password);
      console.log(this.accessCode);
      postGetAuthToken(this, node, callbackFunction, 'client_id=631ac5af-28a2-4dd5-940d-919a914b8a4b&client_secret=Ey1zM%5DR29Aj%2B-jy5ILLK%3Ac%5D*he*4rv5L&scope=openid https://graph.microsoft.com/user.read https://graph.microsoft.com/calendars.read&redirect_uri=https://google.com/auth&grant_type=authorization_code&code=' + this.accessCode);
    } else {
      callbackFunction(node, this.accessToken);
    }
  }

  function postGetAuthToken (thisObj, node, callbackFunction, inTokenRequestBody) {
    var request = require('request');
    var options = {
      url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      method: 'POST',
      body: inTokenRequestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    };

    // console.log('calling postGetAuthToken with options: ');
    // console.log(options);

    request(options, async function (error, response, body) {
      // console.log(error);
      // console.log(response);
      // console.log(body);

      if (!error && response.statusCode === 200) {
        console.log('server returned : ');
        console.log(body);
        var jsonResponse = JSON.parse(body);
        thisObj.accessToken = jsonResponse.access_token;
        callbackFunction(node, jsonResponse.access_token);
      } else {
        console.log('server returned error: ');
        console.log('status: ' + response.statusCode);
        console.log('Error: ' + body);
        var errmsg = { payload: { status: response.statusCode, error: body } };
      }
    });
  }

  RED.nodes.registerType('microsoft-api-connection', MicrosoftAPIConfigNode);
};

const getAccessCode = async (username, password) => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 10 }); // devtools: true,
  const page = await browser.newPage();

  try {
    await page.goto('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=631ac5af-28a2-4dd5-940d-919a914b8a4b&response_type=code&redirect_uri=https://google.com/auth&response_mode=query&scope=openid%20https://graph.microsoft.com/user.read%20https://graph.microsoft.com/calendars.read&state=12345');
    await page.waitFor('#i0116');
    await page.click('#i0116');
    await page.keyboard.type(username);
    await page.click('#idSIButton9');
  } catch (error) {
    console.log(error);
  }
  await delay(1000);

  try {
    await page.waitFor('#i0118');
    await page.click('#i0118');
    await page.keyboard.type(password);
    await page.click('#idSIButton9');
  } catch (error) {
    console.log(error);
  }
  await delay(1000);

  var url = page.url();
  // console.log(url);
  var code = url.split('code=')[1];
  code = code.split('&state')[0];
  console.log(code);

  await delay(1000);
  await browser.close();
  return code;
};

const delay = ms => new Promise(res => setTimeout(res, ms));
