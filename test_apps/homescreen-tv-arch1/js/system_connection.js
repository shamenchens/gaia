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
      var messageObject = evt.detail;
      console.log('received system-response message: [' +
        JSON.stringify(messageObject) + ']');
      window.dispatchEvent(
        new CustomEvent('system-action-object', {'detail': messageObject}));
    },
    _sendMessage: function sc_sendMessage(message) {
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
    },
    _packActionObject: function sc_packActionObject(action, args) {
      return {
        requestId: uuid.v4(),
        action: action,
        args: args
      };
    },
    addWidget: function sc_addWidget(args) {
      var actionObject = this._packActionObject('add', args);
      this._sendMessage(actionObject);
      return actionObject.requestId;
    },
    removeWidget: function sc_removeWidget(args) {
      var actionObject = this._packActionObject('remove', args);
      this._sendMessage(actionObject);
      return actionObject.requestId;
    },
    updateWidget: function sc_updateWidget(args) {
      var actionObject = this._packActionObject('update', args);
      this._sendMessage(actionObject);
      return actionObject.requestId;
    }
  };
  exports.SystemConnection = SystemConnection;
}(window));
window.systemConnection = new SystemConnection().start();
