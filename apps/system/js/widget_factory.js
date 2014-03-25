/* global BrowserConfigHelper, widgetManager, WidgetWindow */
'use strict';

(function(exports) {
  // var DEBUG = false;

  var WidgetFactory = function() {
  };

  WidgetFactory.prototype = {
    createWidget: function(args) {
      var manifestURL = args.widgetOrigin + '/manifest.webapp';
      var app = Applications.getByManifestURL(manifestURL);
      if (!app.manifest) {
        return;
      }

      var appURL = args.widgetOrigin + (args.widgetEntryPoint ?
        app.manifest.entry_points[args.widgetEntryPoint].launch_path :
        app.manifest.launch_path);

      console.log(appURL);
      console.log(manifestURL);
      var config = new BrowserConfigHelper(appURL, manifestURL);

      var widgetOverlay =
        document.getElementsByClassName('widget-overlay')[0];
      var app = new WidgetWindow(config, widgetOverlay);
      // XXX: Separate styles.
      app.setStyle(args);
      this.publish('launchwidget', app.instanceID);

      return app;
    },

    publish: function wf_publish(event, detail) {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, true, false, detail);
      window.dispatchEvent(evt);
    }
  };

  exports.WidgetFactory = WidgetFactory;
}(window));
