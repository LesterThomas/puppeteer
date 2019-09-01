
module.exports = function (RED) {
  function TwitterConfigNode (n) {
    RED.nodes.createNode(this, n);
    this.username = n.username;
    this.password = n.password;
  }
  RED.nodes.registerType('twitter-connection', TwitterConfigNode);
};
