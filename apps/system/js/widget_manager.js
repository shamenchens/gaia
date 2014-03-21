/* global widgetFactory, homescreenConnection, HomescreenLauncher */
'use strict';

(function(exports) {
  var DEBUG = false;

  var WidgetManager = function(app) {
    this.app = app;
    this.runningWidgets = [];
    window.addEventListener('widgetcreated', this);
    window.addEventListener('widgetterminated', this);
    window.addEventListener('launchwidget', this);
    window.addEventListener('homescreen-action-object', this);
    window.navigator.mozSetMessageHandler(
      'widget', this.handleEvent.bind(this));
  };

  WidgetManager.prototype = {
    idFormat: 'Widget_',


    receiveOperation: function(commands) {
      if (!commands) {
        return;
      }

      commands.forEach(function(command) {
        var app;
        switch (command.action) {
          case 'add':
            app = widgetFactory.createWidget(command.args.widgetOrigin,
              command.args.widgetOrigin + '/manifest.webapp', command.args);
            homescreenConnection.response(
              !!app,
              command.requestId,
              command.action,
              app.origin);
          break;
          case 'remove':
            if (!command.args.widgetId) {
              homescreenConnection.deny(
                command.requestId, command.action, command.args.widgetId);
            }
            homescreenConnection.response(
              this.remove(command.args.widgetId),
              command.requestId,
              command.action,
              command.args.widgetId);
          break;
          case 'update':
            app = this.runningWidgets[command.args.widgetId];
            if (!app) {
              homescreenConnection.deny(
                command.requestId, command.action, command.args.widgetId);
              return;
            }
            app.setStyle(command.args);
            homescreenConnection.confirm(
              command.requestId,
              command.action,
              command.args.widgetId);
            break;
          case 'hideall':
            HomescreenLauncher.getHomescreen().hideWidgetLayer();
            homescreenConnection.confirm(command.requestId, command.action);
            break;
          case 'showall':
            HomescreenLauncher.getHomescreen().showWidgetLayer();
            homescreenConnection.confirm(command.requestId, command.action);
            break;
        }
      }.bind(this));
    },

    getWidget: function(origin) {
      return this.runningWidgets[origin];
    },

    remove: function(origin) {
      if (this.runningWidgets[origin]) {
        this.runningWidgets[origin].kill();
        return true;
      } else {
        return false;
      }
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'widgetcreated':
          var app = evt.detail;
          this.runningWidgets[evt.detail.origin] = app;
          break;
        case 'launchwidget':
          var config = evt.detail;
          this.display(config.origin);
          break;
        case 'homescreen-action-object':
          this.receiveOperation(evt.detail);
          break;
        case 'widgetterminated':
          delete this.runningWidgets[evt.detail.origin];
          break;
      }
    },

    display: function wm_launch(origin) {
      var app = this.runningWidgets[origin];
      if (!app) {
        return;
      }
      app.open('immediate');
    }
  };
  exports.WidgetManager = WidgetManager;

  function getAppURL(origin, path) {
    path = path ? path : '';
    return window.location.protocol + '//' + origin +
          (window.location.port ? (':' + window.location.port) : '') + path;
  }
  if (DEBUG) {
    // XXX: For testing widget only. Remove when widget IAC is completed.
    setTimeout(function() {
      window.dispatchEvent(new CustomEvent('homescreen-action-object',
        {'detail': [
          {
            requestId: 'w001',
            action: 'add',
            args: {
              x: 150,
              y: 10,
              w: 100,
              h: 100,
              opacity: 0.7,
              widgetOrigin: getAppURL('clock.gaiamobile.org'),
            }
          },
          {
            requestId: 'w002',
            action: 'add',
            args: {
              x: 150,
              y: 230,
              w: 100,
              h: 150,
              opacity: 0.7,
              widgetOrigin: getAppURL('calendar.gaiamobile.org')
            }
          }
        ]}));
    }.bind(this), 5000);
    setTimeout(function() {
      window.dispatchEvent(new CustomEvent('homescreen-action-object',
        {'detail':[
          {
            requestId: 'w004',
            action:'hideall'
          }
        ]}
      ));
    }.bind(this), 10000);
    setTimeout(function() {
      window.dispatchEvent(new CustomEvent('homescreen-action-object',
        {'detail':[
          {
            requestId: 'w003',
            action: 'showall'
          }, {
            requestId: 'w004',
            action: 'remove',
            args: {
              widgetId: getAppURL('clock.gaiamobile.org')
            }
          }
        ]}
      ));
    }.bind(this), 15000);
  }
}(window));
