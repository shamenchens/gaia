'use strict';

/* globals HomescreenConnection */

(function(exports) {
  var HomescreenConnection = function() {
    window.addEventListener('iac-homescreen-request', this);
  };

  HomescreenConnection.prototype = {
    start: function hc_start() {
      console.log('HomescreenConnection started!');
      return this;
    },
    stop: function hc_stop() {
      console.log('HomescreenConnection stopped!');
    },
    handleEvent: function hc_handleEvent(evt) {
      var messageObject = evt.detail;
      console.log('received homescreen-request message:[' +
        JSON.stringify(messageObject) + ']');
      window.dispatchEvent(
        new CustomEvent('homescreen-action-object', {'detail': messageObject}));
    },
    _sendMessage: function hc_sendMessage(message) {
      navigator.mozApps.getSelf().onsuccess = function(evt) {
        var app = evt.target.result;
        app.connect('system-response').then(function onConnAccepted(ports) {
          ports.forEach(function(port) {
            port.postMessage(message);
          });
        }, function onConnRejected(reason) {
          console.log('connection rejected due to: ' + reason);
        });
      };
    }
  };

  exports.HomescreenConnection = HomescreenConnection;
}(window));

window.homescreenConnection = new HomescreenConnection().start();