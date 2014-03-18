'use strict';

(function(exports) {
  function AppList() {
    this._appList = document.getElementById('app-list');
    this._container = document.getElementById('app-list-container');
  }

  AppList.prototype = {
    _appList: null,
    _container: null,

    init: function appListInit() {
      var self = this;

      document.getElementById('app-list-close-button')
        .addEventListener('click', self);

      Applications.ready(function() {
        var iconTapHandler = function(evt) {
          evt.preventDefault();
          Applications.launch(this.dataset.origin, this.dataset.entry_point);
        };

        Applications.getAppEntries().forEach(function(entry) {
          var img = new Image();
          img.className = 'icon';
          img.src = '/style/images/default.png';

          var icon = document.createElement('div');
          icon.className = 'app-list-icon';
          icon.dataset.origin = entry.origin;
          icon.dataset.entry_point = entry.entry_point;
          icon.appendChild(img);
          icon.appendChild(document.createTextNode(entry.name));
          icon.addEventListener('click', iconTapHandler);

          self._container.appendChild(icon);

          Applications.getIconURL(entry.origin, entry.entry_point, 
            function(url) {
              if (url) {
                img.src = url;
              }
            }
          );
        });
      });
    },

    uninit: function appListUninit() {
      self.hide();
      self._container.innerHTML = '';

      document.getElementById('app-list-close-button')
        .removeEventListener('click', self);
    },

    show: function appListShow() {
      this._appList.style.display = 'block';
    },

    hide: function appListHide() {
      this._appList.style.display = 'none';
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
