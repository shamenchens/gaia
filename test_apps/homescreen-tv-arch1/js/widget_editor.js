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

  WidgetEditor.prototype.togglePlace = function() {
    if (this.currentPlace.app) {
      if (this.currentPlace.app.iconUrl !== DEFAULT_ICON) {
        URL.revokeObjectURL(this.currentPlace.app.iconUrl);
      }
      this.editor.removeWidget(this.currentPlace);
    } else {
      this.appList.on('iconclick', this.handleAppChosen.bind(this));
      this.appList.show();
    }
  };

  WidgetEditor.prototype.handleAppChosen = function(data) {
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
