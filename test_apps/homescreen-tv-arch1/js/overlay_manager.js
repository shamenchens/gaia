'use strict';

(function(exports) {
  var OverlayManager = {
    _overlays: [],
    _callbacks: [],
    _widgetState: 'shown',

    _execCallbacks: function() {
      while (this._callbacks.length) {
        var cb = this._callbacks.shift();
        cb();
      }
    },

    reset: function() {
      this._overlays = [];
      this._callbacks = [];
      this._widgetState = 'shown';
    },

    readyToOpen: function(name, callback) {
      if (!name) {
        return false;
      }

      switch (this._widgetState) {
        case 'shown':
          var self = this;
          window.systemConnection.hideAll(function() {
            self._widgetState = 'hidden';
            self._execCallbacks();
          });
          this._widgetState = 'hiding';
          break;
        case 'showing':
          return false;
        case 'hiding':
          break;
        case 'hidden':
          setTimeout(this._execCallbacks.bind(this));
          break;
      }

      if (callback) {
        this._callbacks.push(callback);
      }

      if (this._overlays.indexOf(name) < 0) {
        this._overlays.push(name);
      }

      document.body.classList.add('overlay-shown');
      document.body.classList.add(name + '-shown');

      return true;
    },

    afterClosed: function(name) {
      if (!name) {
        return false;
      }

      var index = this._overlays.indexOf(name);

      if (index >= 0) {
        var rear = this._overlays.slice(index + 1);
        this._overlays.length = index;
        this._overlays.push.apply(this._overlays, rear);
      }

      if (this._overlays.length > 0) {
        document.body.classList.remove(name + '-shown');
        return false;
      }

      this._widgetState = 'showing';

      var self = this;
      window.systemConnection.showAll(function() {
        self._widgetState = 'shown';
        document.body.classList.remove('overlay-shown');
        document.body.classList.remove(name + '-shown');
      });

      return true;
    },

    hasOverlay: function() {
      return this._overlays.length > 0;
    }
  };

  exports.OverlayManager = OverlayManager;
})(window);
