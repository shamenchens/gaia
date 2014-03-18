/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function(exports) {
  'use strict';

  function HSLayoutEditor() {
    this.widgets = [];
  }

  HSLayoutEditor.LAYOUT = { v: 4, h: 4 };
  HSLayoutEditor.GAP = { v: 10, h: 10 };
  HSLayoutEditor.PADDING = { t: 10, r: 10, b: 10, l: 10 };
  HSLayoutEditor.PLACEHOLDERS = [
    { static: true, x: 0, y: 0, w: 1, h: 2 },
    { static: true, x: 1, y: 0, w: 1, h: 1 },
    { x: 1, y: 1, w: 1, h: 2 },
    { x: 0, y: 2, w: 1, h: 1 },
    { x: 2, y: 0, w: 1, h: 2 },
    { x: 2, y: 2, w: 1, h: 1 },
    { x: 0, y: 3, w: 4, h: 1 },
    { x: 3, y: 0, w: 1, h: 3 }
  ];

  HSLayoutEditor.DIRECTION = {TOP: 'top',
                              RIGHT: 'right',
                              BOTTOM: 'bottom',
                              LEFT: 'left'};

  HSLayoutEditor.prototype.init = function hsle_init(dom) {
    this.container = dom;

    this.initSingleRect();
    this.createPlaceHolders();
    // return the initial widget
    return this.placeHolders[0];
  };

  HSLayoutEditor.prototype.exportConfig = function hsle_export() {
    var ret = [];
    for (var i = 0; i < this.placeHolders.length; i++) {
      var place = this.placeHolders[i];
      ret.push({
        index: i,
        x: place.x, y: place.y, w: place.w, h: place.h,
        widgetOrign: place.app.origin
      })
    }
  };

  HSLayoutEditor.prototype.getFirstNonStatic = function get1stNonStatic() {
    for (var i = 0; i < this.placeHolders.length; i++) {
      if (this.placeHolders[i].static) {
        continue;
      }
      return this.placeHolders[i];
    }
    return null;
  }

  HSLayoutEditor.prototype.getAdjacentPlace = function getP(place, direction,
                                                            skipStatic) {
    if (!this.placeHolders.length) {
      console.error('No place holder, we cannot find adjacent place for you');
      return null;
    }

    if (!place) {
      return this.placeHolders[0];
    }

    function calcDistanceWithoutSQRT(p1, p2, dir) {
      var xDiff = 0;
      var yDiff = 0;
      // We use the middle point of each side border to calculate the distance:
      // Like: p1 move left to p2, we calculate the distance between the middle
      //       point of p1' left border and middle point of p2's right border.
      switch (dir) {
        case HSLayoutEditor.DIRECTION.TOP:
          xDiff = p1.center.x - p2.center.x;
          yDiff = p1.y - (p2.y + p2.h);
          break;
        case HSLayoutEditor.DIRECTION.RIGHT:
          xDiff = (p1.x + p1.w) - p2.x;
          yDiff = p1.center.y - p2.center.y;
          break;
        case HSLayoutEditor.DIRECTION.BOTTOM:
          xDiff = p1.center.x - p2.center.x;
          yDiff = (p1.y + p1.h) - p2.y;
          break;
        case HSLayoutEditor.DIRECTION.LEFT:
          xDiff = p1.x - (p2.x + p2.w);
          yDiff = p1.center.y - p2.center.y;
          break;
      }
      return Math.round(xDiff * xDiff + yDiff * yDiff);
    }

    /**
     * check if p2 is at the "dir" direction of p1.
     */
    function checkDirection(p1, p2, dir) {
      switch (dir) {
        case HSLayoutEditor.DIRECTION.TOP:
          return p2.center.y < p1.center.y && p2.y < p1.y;
        case HSLayoutEditor.DIRECTION.RIGHT:
          return p2.center.x > p1.center.x && (p2.x + p2.w) > (p1.x + p1.w);
        case HSLayoutEditor.DIRECTION.BOTTOM:
          return p2.center.y > p1.center.y && (p2.y + p2.h) > (p1.y + p1.h);
        case HSLayoutEditor.DIRECTION.LEFT:
          return p2.center.x < p1.center.x && p2.x < p1.x;
      }
      return false;
    }

    var adjacent;
    var adjacentDist;
    for (var i = 0; i < this.placeHolders.length; i++) {
      var targetPlace = this.placeHolders[i];
      if ((skipStatic && targetPlace.static === skipStatic) ||
          targetPlace === place ||
          !checkDirection(place, targetPlace, direction)) {
        continue;
      }
      var dist = calcDistanceWithoutSQRT(place, targetPlace, direction);
      if (!adjacent) {
        adjacent = targetPlace;
        adjacentDist = dist
      } else if (dist < adjacentDist) {
        adjacent = targetPlace;
        adjacentDist = dist
      }
    }
    return adjacent;
  }

  HSLayoutEditor.prototype.createPlaceHolders = function hsle_createHolders() {
    this.placeHolders = [];
    for (var i = 0; i < HSLayoutEditor.PLACEHOLDERS.length; i++) {
      var place = HSLayoutEditor.PLACEHOLDERS[i];
      // convert grid to pixel coordinate system.
      var x = place.x * (HSLayoutEditor.GAP.h + this.singleRect.width) +
              HSLayoutEditor.PADDING.l;
      var y = place.y * (HSLayoutEditor.GAP.v + this.singleRect.height) +
              HSLayoutEditor.PADDING.t;
      var w = place.w * this.singleRect.width +
              (place.w - 1) * HSLayoutEditor.GAP.h;
      var h = place.h * this.singleRect.height +
              (place.h - 1) * HSLayoutEditor.GAP.v;
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

  HSLayoutEditor.prototype.createPlaceHolderUI = function hsle_create(place) {
    var div = document.createElement('div');
    div.classList.add('place-holder');
    if (place.static) {
      div.classList.add('static-place-holder');
    }

    div.style.width = place.w + 'px';
    div.style.height = place.h + 'px';
    div.style.left = place.x + 'px';
    div.style.top = place.y + 'px';

    this.container.appendChild(div);
    place.elm = div;
  };

  HSLayoutEditor.prototype.updatePlaceHolderUI = function hsle_update(place) {
    if (place.app) {
      place.elm.dataset.appName = place.app.name;
      place.elm.style.backgroundImage = 'url(' + place.app.iconUrl + ')';
    } else {
      place.elm.dataset.appName = '';
      place.elm.style.backgroundImage = '';
    }
  };

  HSLayoutEditor.prototype.addWidget = function hsle_add(app, place) {
    place.app = app;
    this.updatePlaceHolderUI(place);
  };

  HSLayoutEditor.prototype.removeWidget = function hsle_remove(place) {
    delete place.app;
    this.updatePlaceHolderUI(place);
  };

  HSLayoutEditor.prototype.swapWidget = function hsle_swap(place1, place2) {
    var tmp = place1.app;
    place1.app = place2.app;
    place1.app = tmp;
    this.updatePlaceHolderUI(place1);
    this.updatePlaceHolderUI(place2);
  };

  HSLayoutEditor.prototype.reset = function hsle_reset() {
    this.widgets = [];
    this.container = null;
  };

  HSLayoutEditor.prototype.initSingleRect = function hsle_initSingleRect() {
    var width = (this.container.clientWidth
                 - (HSLayoutEditor.LAYOUT.h - 1) * HSLayoutEditor.GAP.h
                 - HSLayoutEditor.PADDING.l
                 - HSLayoutEditor.PADDING.r) / HSLayoutEditor.LAYOUT.h;
    var height = (this.container.clientHeight
                  - (HSLayoutEditor.LAYOUT.v - 1) * HSLayoutEditor.GAP.v
                  - HSLayoutEditor.PADDING.t
                  - HSLayoutEditor.PADDING.b) / HSLayoutEditor.LAYOUT.v;
    this.singleRect = {width: width,
                       height: height};
  };

  exports.HSLayoutEditor = HSLayoutEditor;
})(window);
