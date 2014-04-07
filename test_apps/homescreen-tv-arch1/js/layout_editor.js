/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function(exports) {
  'use strict';

  function LayoutEditor(options) {
    this.options = options || {};
    this.options.layout = this.options.layout || { v: 3, h: 3 };
    this.options.gap = this.options.gap || { v: 10, h: 10 };
    this.options.padding = this.options.padding ||
                           { t: 10, r: 10, b: 10, l: 10 };
    this.options.holders = this.options.holders || [
                             { static: true, x: 0, y: 0, w: 2, h: 2 },
                             { static: true, x: 0, y: 2, w: 1, h: 1 },
                             { x: 2, y: 0, w: 1, h: 1 },
                             { x: 2, y: 1, w: 1, h: 1 },
                             { x: 2, y: 2, w: 1, h: 1 },
                             { x: 1, y: 2, w: 1, h: 1 }];
  }

  LayoutEditor.DIRECTION = {TOP: 'top',
                              RIGHT: 'right',
                              BOTTOM: 'bottom',
                              LEFT: 'left'};

  LayoutEditor.prototype.init = function hsle_init(dom, targetSize, offset) {
    if (!targetSize) {
      this.scaleRatio = 1;
    } else {
      this.scaleRatio = Math.max(targetSize.w / dom.clientWidth,
                                 targetSize.h / dom.clientHeight);
    }

    this.containerSize = {
      w: targetSize.w / this.scaleRatio,
      h: targetSize.h / this.scaleRatio
    };

    this.offsetPosition = offset ? offset : {left: 0, top: 0};
    this.container = dom;
    this.initSingleRect();
    this.createPlaceHolders();
    // return the initial widget
    return this.placeHolders[0];
  };

  LayoutEditor.prototype.exportConfig = function hsle_export() {
    var ret = [];
    for (var i = 0; i < this.placeHolders.length; i++) {
      var place = this.placeHolders[i];
      if (place.app || place.static) {
        ret.push({
          positionId: i,
          static: place.static,
          x: this.offsetPosition.left + Math.round(place.x * this.scaleRatio),
          y: this.offsetPosition.top + Math.round(place.y * this.scaleRatio),
          w: Math.round(place.w * this.scaleRatio),
          h: Math.round(place.h * this.scaleRatio),
          origin: place.app ? place.app.origin : '',
          entryPoint: place.app ? place.app.entryPoint : ''
        });
      }
    }
    return ret;
  };

  LayoutEditor.prototype.loadWidget = function hsle_import(config) {
    if (config && this.placeHolders[config.positionId]) {
      this.addWidget(config.app, this.placeHolders[config.positionId]);
    }
  };

  LayoutEditor.prototype.getFirstNonStatic = function get1stNonStatic() {
    for (var i = 0; i < this.placeHolders.length; i++) {
      if (this.placeHolders[i].static) {
        continue;
      }
      return this.placeHolders[i];
    }
    return null;
  };

  LayoutEditor.prototype.createPlaceHolders = function hsle_createHolders() {
    this.placeHolders = [];
    for (var i = 0; i < this.options.holders.length; i++) {
      var place = this.options.holders[i];
      // convert grid to pixel coordinate system.
      var x = place.x * (this.options.gap.h + this.singleRect.width) +
              this.options.padding.l;
      var y = place.y * (this.options.gap.v + this.singleRect.height) +
              this.options.padding.t;
      var w = place.w * this.singleRect.width +
              (place.w - 1) * this.options.gap.h;
      var h = place.h * this.singleRect.height +
              (place.h - 1) * this.options.gap.v;
      var center = {
        x: (x + w / 2),
        y: (y + h / 2)
      };
      var placeHolder = { static: place.static,
                          center: center,
                          x: x, y: y, w: w, h: h };
      this.createPlaceHolderUI(placeHolder);
      this.placeHolders.push(placeHolder);
    }
  };

  LayoutEditor.prototype.createPlaceHolderUI = function hsle_create(place) {
    var div = document.createElement('div');
    div.classList.add('place-holder');
    if (place.static) {
      div.classList.add('static-place-holder');
    }

    var leftDiff = (this.container.clientWidth - this.containerSize.w) / 2;
    var topDiff = (this.container.clientHeight - this.containerSize.h) / 2;


    div.style.width = place.w + 'px';
    div.style.height = place.h + 'px';
    div.style.left = leftDiff + place.x + 'px';
    div.style.top = topDiff + place.y + 'px';

    this.container.appendChild(div);
    place.elm = div;
  };

  LayoutEditor.prototype.updatePlaceHolderUI = function hsle_update(place) {
    if (place.app) {
      place.elm.dataset.appName = place.app.name;
      place.elm.style.backgroundImage = 'url(' + place.app.iconUrl + ')';
    } else {
      place.elm.dataset.appName = '';
      place.elm.style.backgroundImage = '';
    }
  };

  LayoutEditor.prototype.addWidget = function hsle_add(app, place) {
    place.app = app;
    this.updatePlaceHolderUI(place);
  };

  LayoutEditor.prototype.removeWidget = function hsle_remove(place) {
    delete place.app;
    this.updatePlaceHolderUI(place);
  };

  LayoutEditor.prototype.removeWidgets = function hsle_removeItems(callback) {
    this.batchOps(callback, this.removeWidget.bind(this));
  };

  LayoutEditor.prototype.updateWidgets = function hsle_updateItems(callback) {
    this.batchOps(callback, this.updatePlaceHolderUI.bind(this));
  };

  LayoutEditor.prototype.batchOps = function hsle_batch(checkingFunc,
                                                        affectedFunc) {
    if (!checkingFunc || (typeof checkingFunc) !== 'function' ||
        !affectedFunc || (typeof affectedFunc) !== 'function') {
      return;
    }
    function handleResult(affected, place) {
      if (affected) {
        affectedFunc(place);
      }
    }
    for (var i = 0; i < this.placeHolders.length; i++) {
      if (!this.placeHolders[i].app) {
        continue;
      }
      try {
        checkingFunc(this.placeHolders[i], handleResult);
      } catch (ex) {
        console.error('Error while trying to execute callback of ' +
                      'batch tasks with place #' + i, ex);
      }
    }
  };

  LayoutEditor.prototype.swapWidget = function hsle_swap(place1, place2) {
    var tmp = place1.app;
    place1.app = place2.app;
    place2.app = tmp;
    this.updatePlaceHolderUI(place1);
    this.updatePlaceHolderUI(place2);
  };

  LayoutEditor.prototype.reset = function hsle_reset(callback) {
    for (var i = 0; i < this.placeHolders.length; i++) {
      if (callback && (typeof callback) === 'function' &&
          this.placeHolders[i].app) {
        callback(this.placeHolders[i]);
      }
      this.removeWidget(this.placeHolders[i]);
    }
  };

  LayoutEditor.prototype.initSingleRect = function hsle_initSingleRect() {
    var width = (this.containerSize.w -
                 (this.options.layout.h - 1) * this.options.gap.h -
                 this.options.padding.l -
                 this.options.padding.r) / this.options.layout.h;
    var height = (this.containerSize.h -
                  (this.options.layout.v - 1) * this.options.gap.v -
                  this.options.padding.t -
                  this.options.padding.b) / this.options.layout.v;
    this.singleRect = {width: Math.round(width),
                       height: Math.round(height)};
  };

  exports.LayoutEditor = LayoutEditor;
})(window);
