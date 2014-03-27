 'use strict';

/* globals SystemConnection, uuid */

(function(exports) {
  var SystemConnection = function() { };

  // Homescreen app should send request object like this
  // {
  //   requestId: ‘87548a9b-3e64-4aca-9366-f4856e5f7a65’,
  //   action: ‘add’,
  //   args: {
  //     x: 220,
  //     y: 10,
  //     w: 200,
  //     h: 150,
  //     widgetOrigin: 'app://widget.gaiamobile.org/',
  //     widgetEntryPoint: 'entry'
  //   }
  // }
  // and shoould expect incoming response object like
  // {
  //   requestId: ‘87548a9b-3e64-4aca-9366-f4856e5f7a65’,
  //   action: 'add',
  //   result: true,
  //   widgetId: ‘widget-idY’
  // }
  SystemConnection.prototype = {
    RESPONSE_TIMEOUT: 1000,
    start: function sc_start() {
      console.log('SystemConnection started!');
      this._connect();
      return this;
    },
    stop: function sc_stop() {
      // TODO: clean up all ports onmessage binding
      console.log('SystemConnection stopped!');
    },
    // each item in _wrappedUnrespondRequests is like:
    // {
    //   requestId: requesId           // mandatary
    //   requestObject: requestObject, // mandatary
    //   callback: callback            // optional
    // }
    _wrappedUnrespondRequests: [],
    _findUnrespondRequest: function sc_findUnrespondRequest(requestId) {
      var result,
        i;
      if (!requestId) {
        return result;
      }
      for (i = 0; i < this._wrappedUnrespondRequests.length; i += 1) {
        if (this._wrappedUnrespondRequests[i].requestId === requestId) {
          result = this._wrappedUnrespondRequests[i];
          break;
        }
      }
      return result;
    },
    _removeUnrespondRequest: function sc_removeUnrespondRequest(requestId) {
      var i;
      for (i = 0; i < this._wrappedUnrespondRequests.length; i += 1) {
        if (this._wrappedUnrespondRequests[i].requestId === requestId) {
          this._wrappedUnrespondRequests.splice(i, 1);
          break;
        }
      }
    },
    _onMessage: function sc_onMessage(evt) {
      var messageObject = evt.data,
        wrappedUnrespondRequest;
      console.log('received response of homescreen-request message: [' +
        JSON.stringify(messageObject) + ']');
      wrappedUnrespondRequest =
        this._findUnrespondRequest(messageObject && messageObject.requestId);
      if (wrappedUnrespondRequest) {
        if (typeof wrappedUnrespondRequest.callback === 'function') {
          wrappedUnrespondRequest.callback(messageObject);
        }
        this._removeUnrespondRequest(messageObject.requestId);
      } else {
        if (messageObject && messageObject.requestId) {
          console.log('Cannot find wrappedUnrespondRequest of requestId = ' +
            messageObject.requestId);
        }
      }
    },
    // all connAcceptedCallback should have signature as
    //   function connAcceptedCallback(ports) {}
    // all connRejectedCallback should have signature as
    //   function connRejectedCallback(reason) {}
    _connect: function sc_connect(connAcceptedCallback, connRejectedCallback) {
      var that = this;
      if (this.app) {
        send.apply(this);
        return;
      }

      navigator.mozApps.getSelf().onsuccess = function(evt) {
        that.app = evt.target.result;
        send.apply(that);
      };

      function send() {
        var port = (document.location.port === '') ?
          '' : ':' + document.location.port;

        var systemManifestURLs = [];
        systemManifestURLs.push(document.location.protocol +
          '//system.gaiamobile.org' + port + '/manifest.webapp');

        that.app.connect('homescreen-request', {
          // establish a connection with system app only
          // others cannot eavesdrop
          manifestURLs: systemManifestURLs
        }).then(function onConnAccepted(ports) {
          ports.forEach(function(port) {
            if (!port.onmessage) {
              port.onmessage = that._onMessage.bind(that);
            }
          });
          if (typeof connAcceptedCallback === 'function') {
            connAcceptedCallback(ports);
          }
        }, function onConnRejected(reason) {
          console.log('connection rejected due to: ' + reason);
          if (typeof connRejectedCallback === 'function') {
            connRejectedCallback(reason);
          }
        });
      }
    },
    _sendMessage: function sc_sendMessage(message) {
      var that = this,
        wrappedUnrespondRequest;
      this._connect(function connAcceptedCallback(ports) {
        ports.forEach(function(port) {
          port.postMessage(message);
        });
      }, function connRejectedCallback(reason) {
        if ((wrappedUnrespondRequest =
            that._findUnrespondRequest(message.requestId))) {
          if (wrappedUnrespondRequest &&
              typeof wrappedUnrespondRequest.callback === 'function') {
            wrappedUnrespondRequest.callback({
              requestId: message.requestId,
              action: message.action,
              result: false,
              errorCause: reason
            });
          }
          that._removeUnrespondRequest(message.requestId);
        }
      });
    },
    _packRequestObject: function sc_packRequestObject(action, args) {
      if (args) {
        return {
          requestId: uuid.v4(),
          action: action,
          args: args
        };
      } else {
        return {
          requestId: uuid.v4(),
          action: action
        };
      }
    },
    _commonAction: function sc_commonAction(action, args, callback) {
      var requestObject = this._packRequestObject(action, args),
        wrappedUnrespondRequest = {
          requestId: requestObject.requestId,
          requestObject: requestObject,
          callback: callback
        },
        that = this;
      this._wrappedUnrespondRequests.push(wrappedUnrespondRequest);
      this._sendMessage(requestObject);
      window.setTimeout(function() {
        // invoke callback to inform timeout only when
        // unresponseRequest of requestId still in the array
        // (means: not respond yet)
        if (that._findUnrespondRequest(requestObject.requestId)) {
          if (typeof wrappedUnrespondRequest.callback === 'function') {
            wrappedUnrespondRequest.callback({
              requestId: requestObject.requestId,
              action: requestObject.action,
              result: false,
              errorCause: 'timeout'
            });
          }
          that._removeUnrespondRequest(requestObject.requestId);
        }
      }, this.RESPONSE_TIMEOUT);
      return requestObject.requestId;
    },
    // callback should have signature like this:
    //   function callback(messageObject)
    // and all messageObject would be like this if we DID get response
    //   {
    //     requestId: ‘87548a9b-3e64-4aca-9366-f4856e5f7a65’,
    //     action: 'add',
    //     result: true,
    //     widgetId: ‘widget-idY’
    //   }
    // or be like this if timeout
    //   {
    //     requestId: ‘87548a9b-3e64-4aca-9366-f4856e5f7a65’,
    //     action: 'add',
    //     result: false,
    //     errorCause: ‘timeout’
    //   }
    addWidget: function sc_addWidget(args, callback) {
      return this._commonAction('add', args, callback);
    },
    removeWidget: function sc_removeWidget(args, callback) {
      return this._commonAction('remove', args, callback);
    },
    updateWidget: function sc_updateWidget(args, callback) {
      return this._commonAction('update', args, callback);
    },
    showAll: function sc_showAll(callback) {
      return this._commonAction('showall', undefined, callback);
    },
    hideAll: function sc_hideAll(callback) {
      return this._commonAction('hideall', undefined, callback);
    }
  };
  exports.SystemConnection = SystemConnection;
}(window));
window.systemConnection = new SystemConnection().start();
