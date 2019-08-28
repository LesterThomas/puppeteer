module.exports = function (RED) {
  class GetOutlookCalendarNode {
    constructor (config) {
      RED.nodes.createNode(this, config);
      this.server = RED.nodes.getNode(config.server);
      this.on('input', this.handleMsg);
    }

    handleMsg (msg) {
      console.log('input message received');
      this.server.getAccessToken(this, this.handleCallback);

    }

    handleCallback(node, accessToken) {
      console.log('accessToken=');
      console.log(accessToken);

      var request = require('request');
      var moment = require('moment')
      var startdatetime =moment().format("YYYY-MM-DDTHH:mm:ss.SSS");

      var date = new Date();
      // add a day
      date.setDate(date.getDate() + 1);

      var enddatetime = moment(date).format("YYYY-MM-DDTHH:mm:ss.SSS");

      var options = {
        url: 'https://graph.microsoft.com/v1.0/me/calendarview?$select=subject,start,end&$top=20&$skip=0&startdatetime=' + startdatetime + 'Z&enddatetime=' + enddatetime + 'Z',
        method: 'GET',
        headers: {
          'Authorization': accessToken
        }
      };
  
      console.log('calling calendarview with options: ');
      console.log(options);
  
      request(options, async function (error, response, body) {
        console.log(error);
        console.log(response);
        console.log(body);
  
        if (!error && response.statusCode === 200) {
          console.log('server returned : ');
          console.log(body);
          var jsonResponse = JSON.parse(body);
          var msg = {payload: jsonResponse};
          node.send(msg);
          //callbackFunction(node, jsonResponse.access_token);
        } else {
          console.log('server returned error: ');
          console.log('status: ' + response.statusCode);
          console.log('Error: ' + body);
          var errmsg = { payload: { status: response.statusCode, error: body } };
        }
      });
    }
  }
  RED.nodes.registerType('get-outlook-calendar', GetOutlookCalendarNode);
};
