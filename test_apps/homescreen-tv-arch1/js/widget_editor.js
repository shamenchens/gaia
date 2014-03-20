/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function(exports) {
  'use strict';

  const DEFAULT_ICON = Applications.DEFAULT_ICON_URL;

  function WidgetEditor(dom, appList) {
    this.dom = dom;
    this.appList = appList;
    this.editor = null;
    this.currentPlace = null;
    this.selectionBorder = new SelectionBorder({ multiple: false,
                                                 container: dom });
  }

  WidgetEditor.prototype.setVisible = function we_visible(visible) {
    if (this.dom.hidden !== visible) {
      return;
    }

    this.dom.hidden = !visible;

    if (visible && !this.editor) {
      this.editor = new HSLayoutEditor();
      this.editor.init(this.dom);
      window.addEventListener('keypress', this.handleKeyPress.bind(this));
    }

    if (visible) {
      this.currentPlace = this.editor.getFirstNonStatic();
      this.switchFocus(this.currentPlace);
    }
  };

  WidgetEditor.prototype.save = function we_save() {
    window.asyncStorage.setItem('widget-list', this.editor.exportConfig());
  };

  WidgetEditor.prototype.load = function we_load() {
    var self = this;

    window.asyncStorage.getItem('widget-list', function gotConfig(config) {
      if (!config) {
        return;
      }

      self.editor.reset(self.revokeUrl.bind(self));
      for (var i = config.length - 1; i >= 0; i--) {
        self.fillAppInfo(config[i], function fillReady(config) {
          self.editor.loadWidget(config);
        });
      };
    });
  };

  WidgetEditor.prototype.revokeUrl = function we_revokeUrl(app) {
    if (app.iconUrl !== DEFAULT_ICON) {
      URL.revokeObjectURL(app.iconUrl);
    }
  };

  WidgetEditor.prototype.fillAppInfo = function we_fillInfo(cfg, callback) {
    cfg.app = {
      origin: cfg.origin,
      entryPoint: cfg.entryPoint,
      name: Applications.getName(cfg.origin, cfg.entryPoint)
    };
    Applications.getIconBlob(cfg.origin, cfg.entryPoint, 0, function(blob) {
      cfg.app.iconUrl = blob ? URL.createObjectURL(blob) : DEFAULT_ICON;
      if (callback && (typeof callback) === 'function') {
        callback(cfg);
      }
    });
  };

  WidgetEditor.prototype.handleKeyPress = function we_handleKeyPress(e) {
    if (this.dom.hidden || this.appList.isShown()) {
      return;
    }
    var targetPlace;
    switch (e.keyCode) {
      case KeyEvent.DOM_VK_UP:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                  HSLayoutEditor.DIRECTION.TOP,
                                                  true);
        this.switchFocus(targetPlace);
        break;
      case KeyEvent.DOM_VK_RIGHT:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                 HSLayoutEditor.DIRECTION.RIGHT,
                                                 true);
        this.switchFocus(targetPlace);
        break;
      case KeyEvent.DOM_VK_DOWN:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                HSLayoutEditor.DIRECTION.BOTTOM,
                                                true);
        this.switchFocus(targetPlace);
        break;
      case KeyEvent.DOM_VK_LEFT:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                  HSLayoutEditor.DIRECTION.LEFT,
                                                  true);
        this.switchFocus(targetPlace);
        break;
      case KeyEvent.DOM_VK_RETURN:
        this.togglePlace();
        break;
    }
  }

  WidgetEditor.prototype.togglePlace = function we_togglePlace() {
    if (this.currentPlace.app) {
      this.revokeUrl(this.currentPlace.app);
      this.editor.removeWidget(this.currentPlace);
    } else {
      this.appList.on('iconclick', this.handleAppChosen.bind(this));
      this.appList.show();
    }
  };

  WidgetEditor.prototype.handleAppChosen = function we_handleAppChosen(data) {
    var self = this;
    Applications.getIconBlob(data.origin, data.entry_point, 0, function(blob) {
      var iconUrl = blob ? URL.createObjectURL(blob) : DEFAULT_ICON;

      self.editor.addWidget({ name: data.name,
                              iconUrl: iconUrl,
                              origin: data.origin,
                              entryPoint: data.entry_point},
                            self.currentPlace);
    });
    this.appList.off('iconclick');
    this.appList.hide();
    return false;
  };

  WidgetEditor.prototype.switchFocus = function we_switchFocus(place) {
    if (!place) {
      return;
    }
    this.currentPlace = place;
    this.selectionBorder.select(place.elm);
  }

  exports.WidgetEditor = WidgetEditor;
})(window);
