/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* globals Applications */

(function(exports) {
  'use strict';

  function WidgetManager(systemConn, appList) {
    this.systemConn = systemConn;
    this.appList = appList;
    this.widgetConfig;
    this.posIdToWidgetId = {};
    this.reqIdToPosId = {};
  }

  WidgetManager.prototype = new window.evt();

  WidgetManager.prototype.start = function wm_start() {
    this.boundHandleAppRemoved = this.handleAppRemoved.bind(this);
    Applications.on('uninstall', this.boundHandleAppRemoved);
    this.syncWidgets();
  };

  WidgetManager.prototype.stop = function wm_start() {
    Applications.off('uninstall', this.boundHandleAppRemoved);
    this.syncWidgets();
  };

  WidgetManager.prototype.syncWidgets = function wm_sync() {
    var self = this;

    window.asyncStorage.getItem('widget-list', function gotConfig(config) {
      if (!config) {
        return;
      }

      var eventList = self.compareConfig([], config);
      self.dispatchMessageToIAC(eventList);
      self.widgetConfig = config;
      self.fire('update', self.widgetConfig);
    });
  };

  WidgetManager.prototype.handleSystemWidgetMsg = function(detail) {
    if (detail.action === 'remove' || detail.action === 'add') {
      var posId = this.reqIdToPosId[detail.requestId];
      this.posIdToWidgetId[posId] = detail.widgetId;
      delete this.reqIdToPosId[detail.requestId];
    }
  };

  WidgetManager.prototype.compareConfig = function we_compare(oldCfg, newCfg) {
    function comparer(a, b) {
      return a.positionId - b.positionId;
    }
    oldCfg = oldCfg || [];
    newCfg = newCfg || [];
    oldCfg.sort(comparer);
    newCfg.sort(comparer);
    var eventList = [];
    var oldIdx = 0;
    var newIdx = 0;
    // to iterate all oldCfg + newCfg.
    while (oldIdx < oldCfg.length || newIdx < newCfg.length) {
      if (oldIdx < oldCfg.length && newIdx === newCfg.length) {
        // no more newCfg, all oldCfg should be removed
        eventList.push({ action: 'remove', config: oldCfg[oldIdx] });
        oldIdx++;
      } else if (oldIdx === oldCfg.length && newIdx < newCfg.length) {
        // no more oldCfg, all newCfg should be added
        eventList.push({ action: 'add', config: newCfg[newIdx] });
        newIdx++;
      } else if (oldCfg[oldIdx].positionId < newCfg[newIdx].positionId) {
        // oldCfg[oldIdx] should be removed
        eventList.push({ action: 'remove', config: oldCfg[oldIdx] });
        oldIdx++;
      } else if (oldCfg[oldIdx].positionId === newCfg[newIdx].positionId) {
        // index the same compare origin
        if (oldCfg[oldIdx].origin !== newCfg[newIdx].origin) {
          eventList.push({ action: 'remove', config: oldCfg[oldIdx] });
          eventList.push({ action: 'add', config: newCfg[newIdx] });
        }
        oldIdx++;
        newIdx++;
      } else if (oldCfg[oldIdx].positionId > newCfg[newIdx].positionId) {
        // newCfg[newIdx] should be added.
        eventList.push({ action: 'add', config: newCfg[newIdx] });
        newIdx++;
      }
    }
    return eventList;
  };

  WidgetManager.prototype.dispatchMessageToIAC = function wm_dispatch(events) {
    for (var i = 0; i < events.length; i++) {
      var config = events[i].config;

      if (config.static) {
        continue;
      }

      switch (events[i].action) {
        case 'add':
          var payload = { 'widgetOrigin': config.origin,
                          'widgetEntryPoint': config.entryPoint,
                          'x': config.x, 'y': config.y,
                          'w': config.w, 'h': config.h };
          var reqId = this.systemConn.addWidget(
            payload,
            this.handleSystemWidgetMsg.bind(this));
          this.reqIdToPosId[reqId] = config.positionId;
          break;
        case 'remove':
          var widgetId = this.posIdToWidgetId[config.positionId];
          this.systemConn.removeWidget(
            { 'widgetId': widgetId },
            this.handleSystemWidgetMsg.bind(this));
          delete this.posIdToWidgetId[config.positionId];
          break;
      }
    }
  };

  WidgetManager.prototype.save = function wm_save(newConfig) {
    var self = this;
    window.asyncStorage.getItem('widget-list', function gotConfig(config) {
      var eventList = self.compareConfig(config, newConfig);
      self.dispatchMessageToIAC(eventList);
      window.asyncStorage.setItem('widget-list', newConfig);
      self.widgetConfig = newConfig;
      self.fire('update', self.widgetConfig);
    });
  };

  WidgetManager.prototype.handleAppRemoved = function wm_appRemoved(apps) {
    if (!this.widgetConfig) {
      return;
    }

    var affected = false;
    for (var idx = 0; idx < apps.length; idx++) {
      var app = apps[idx];
      for (var i = 0; i < this.widgetConfig.length; i++) {
        if (this.widgetConfig[i].origin === app.origin &&
            this.widgetConfig[i].entryPoint === app.entry_point) {
          this.widgetConfig.splice(i, 1);
          i--;
          affected = true;
        }
      }
    }
    // save is expensive, we don't need to do save all the time.
    if (affected) {
      this.save(this.widgetConfig);
    }
  };

  exports.WidgetManager = WidgetManager;
})(window);
