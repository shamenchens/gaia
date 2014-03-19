'use strict';

(function(exports) {
  function AppList() {
    this._appList = document.getElementById('app-list');
    this._container = document.getElementById('app-list-container');
    this.hide();
  }

  AppList.prototype = {
    DEFAULT_ICON_URL: '/style/images/default.png',

    _appList: null,
    _container: null,

    oniconclick: null,

    init: function appListInit() {
      var self = this;

      document.getElementById('app-list-close-button')
        .addEventListener('click', self);

      Applications.ready(function() {
        var iconTapHandler = function(evt) {
          evt.preventDefault();

          if (self.oniconclick) {
            var data = {
              origin: this.dataset.origin,
              entry_point: this.dataset.entry_point,
              name: this.dataset.name
            };

            if (!self.oniconclick(data)) {
              return;
            }
          }

          Applications.launch(this.dataset.origin, this.dataset.entry_point);
        };

        Applications.getEntries().forEach(function(entry) {
          var img = new Image();
          img.className = 'icon';
          img.src = self.DEFAULT_ICON_URL;

          var icon = document.createElement('div');
          icon.className = 'app-list-icon';
          icon.dataset.origin = entry.origin;
          icon.dataset.entry_point = entry.entry_point;
          icon.dataset.name = entry.name;
          icon.appendChild(img);
          icon.appendChild(document.createTextNode(entry.name));
          icon.addEventListener('click', iconTapHandler);

          self._container.appendChild(icon);

          Applications.getIconBlob(entry.origin, entry.entry_point, 32,
            function(blob) {
              if (!blob) {
                return;
              }
              img.onload = function() {
                window.URL.revokeObjectURL(this.src);
              };
              img.src = window.URL.createObjectURL(blob);
            }
          );
        });
      });
    },

    uninit: function appListUninit() {
      this.oniconclick = null;

      this.hide();
      this._container.innerHTML = '';

      document.getElementById('app-list-close-button')
        .removeEventListener('click', this);
    },

    show: function appListShow() {
      this._appList.hidden = false;
    },

    hide: function appListHide() {
      this._appList.hidden = true;
    },

    handleEvent: function appListHandleEvent(evt) {
      var target = evt.target;

      if (target.id == 'app-list-close-button' && evt.type == 'click') {
        this.hide();
      }
    }
  };

  exports.AppList = AppList;
})(window);
