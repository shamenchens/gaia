'use strict';

/* globals SystemConnection */

(function(exports){
  var SystemConnection = function() {
    window.addEventListener('iac-system-response', this);
  };

  SystemConnection.prototype = {
    start: function sc_start() {
      console.log('SystemConnection started!');
      return this;
    },
    stop: function sc_stop() {
      console.log('SystemConnection stopped!');
    },
    handleEvent: function sc_handleEvent(evt) {
      var message = evt.detail;
      console.log('received system-response message: [' + message + ']');
    },
    sendMessage: function sc_sendMessage(message) {
      navigator.mozApps.getSelf().onsuccess = function(evt) {
        var app = evt.target.result;
        app.connect('homescreen-request').then(function onConnAccepted(ports) {
          ports.forEach(function(port) {
            port.postMessage(message);
          });
        }, function onConnRejected(reason) {
          console.log('connection rejected due to: ' + reason);
        });
      };
    }
  };
  exports.SystemConnection = SystemConnection;
}(window));
window.systemConnection = new SystemConnection().start();
