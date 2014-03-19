/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function(exports) {
  'use strict';

  function WidgetEditor(dom, appList) {
    this.dom = dom;
    this.appList = appList;
    this.editor = null;
    this.currentPlace = null;
    this.selectionBorder = new SelectionBorder({ multiple: false,
                                                 container: dom });
  }

  WidgetEditor.prototype.setVisible = function we_visible(visible) {
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
    if (this.dom.hidden) {
      return;
    }
    var targetPlace;
    switch (e.keyCode) {
      case KeyEvent.DOM_VK_UP:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                  HSLayoutEditor.DIRECTION.TOP,
                                                  true);
        break;
      case KeyEvent.DOM_VK_RIGHT:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                 HSLayoutEditor.DIRECTION.RIGHT,
                                                 true);
        break;
      case KeyEvent.DOM_VK_DOWN:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                HSLayoutEditor.DIRECTION.BOTTOM,
                                                true);
        break;
      case KeyEvent.DOM_VK_LEFT:
        targetPlace = this.editor.getAdjacentPlace(this.currentPlace,
                                                  HSLayoutEditor.DIRECTION.LEFT,
                                                  true);
        break;
      case KeyEvent.DOM_VK_RETURN:
        this.togglePlace();
        break;
    }
    this.switchFocus(targetPlace);
  }

  WidgetEditor.prototype.togglePlace = function() {
    if (this.currentPlace.app) {
      this.editor.removeWidget(this.currentPlace);
    } else {
      this.appList.oniconclick = this.handleAppChosen.bind(this);
      this.appList.show();
    }
  };

  WidgetEditor.prototype.handleAppChosen = function(data) {
    var self = this;
    Applications.getIconBlob(data.origin, data.entry_point, 0, function(blob) {
      if (!blob) {
        return;
      }
      var iconUrl = URL.createObjectURL(blob);
      self.editor.addWidget({ name: data.name,
                              iconUrl: iconUrl,
                              origin: data.origin,
                              entryPoint: data.entry_point},
                            self.currentPlace);
    });
    this.appList.oniconclick = null;
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
