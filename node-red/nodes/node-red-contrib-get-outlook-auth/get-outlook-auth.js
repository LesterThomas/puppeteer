module.exports = function (RED) {
  class ServiceOrderNode {
    constructor (config) {
      RED.nodes.createNode(this, config);
      this.server = RED.nodes.getNode(config.server);
      if (this.server) {
        // Do something with:
        this.host = this.server.host;
        //  this.server.port
      } else {
        // No config node configured
        this.host = 'no host';
      }
      this.serviceSpecArray = [];
      this.on('input', this.handleMsg);
    }

    handleMsg (msg) {
      console.log('input message received');
      this.serviceSpecArray.push(msg.payload);

      if (this.timer) {
        console.log('Cancel previous timer');
        // cancel previous timer
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.timer = setTimeout(function () { this.buildServiceOrder(); }.bind(this), 1000);
    }

    postServiceOrder (inServiceOrder) {
      var request = require('request');
      var options = {
        url: this.host,
        method: 'POST',
        body: inServiceOrder,
        json: true,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      options.headers[this.server.apikeyname] = this.server.apikeyvalue;
      console.log('calling naas server with options: ');
      console.log(options);

      request(options, async function (error, response, body) {
        if (!error && response.statusCode === 200) {
          console.log('naas server returned : ');
          console.log(body);
          var msg = {
            payload: body
          };
          this.send(msg);
        } else {
          console.log('naas server returned error: ');
          console.log('status: ' + response.statusCode);
          console.log('Error: ' + body);
          var errmsg = { payload: { status: response.statusCode, error: body } };
          this.send(errmsg);
        }
      }.bind(this));
    }

    buildServiceOrder () {
      console.log('in PostServiceOrder');
      console.log(this); 
      for (var key = 0; key < this.serviceSpecArray.length; key++) {
        this.serviceSpecArray[key].id = key + 1;
        this.serviceSpecArray[key].action = 'add';
      }
      var serviceOrder = {
        description: 'Service Order',
        category: 'Network Service',
        orderDate: Date.now(),
        relatedParty: [],
        orderItem: this.serviceSpecArray
      };

      this.serviceSpecArray = [];
      console.log(serviceOrder);

      // POST this order to the API
      this.postServiceOrder(serviceOrder);
    }
  }
  RED.nodes.registerType('service-order', ServiceOrderNode);
};
