'use strict';

(function(exports) {
  function AppListPage(parent, pagingSize) {
    if (!parent) {
      throw new Error('AppListPage requires a parent object.');
    }

    this._dom = document.createElement('div');
    this._dom.classList.add('app-list-page');

    this._numIconsPerRow = pagingSize.numIconsPerRow || 0;
    this._numIconsPerCol = pagingSize.numIconsPerCol || 0;
    this._maxIconCount = this._numIconsPerRow * this._numIconsPerCol;

    parent.appendChild(this._dom);
  }

  AppListPage.prototype = {
    _dom: null,

    _numIconsPerRow: 0,
    _numIconsPerCol: 0,
    _maxIconCount: 0,
    _defaultIconUrl: '',

    _iconCount: 0,

    addIcon: function alpAddIcon(entry, tapHandler) {
      if (this.isFull()) {
        return false;
      }

      var img = new Image();
      img.className = 'icon';
      img.src = Applications.DEFAULT_ICON_URL;

      var icon = document.createElement('div');
      icon.className = 'app-list-icon';
      icon.dataset.origin = entry.origin;
      icon.dataset.entry_point = entry.entry_point;
      icon.dataset.name = entry.name;
      icon.appendChild(img);
      icon.appendChild(document.createTextNode(entry.name));
      icon.addEventListener('click', tapHandler);

      this._dom.appendChild(icon);
      this._iconCount++;

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

      return true;
    },

    isFull: function alpIsFull() {
      if (this._iconCount == this._maxIconCount) {
        return true;
      }
      return false;
    }
  };

  function AppList() {
    this._appList = document.getElementById('app-list');
    this._container = document.getElementById('app-list-container');

    this._calcPagingSize();
    this.hide();
  }

  AppList.prototype = evt({
    _appList: null,
    _container: null,
    _selectionBorder: null,
    _focus: -1,
    _iconCount: 0,

    _containerDimensions: {},
    _iconDimensions: {},
    _pagingSize: {},

    oniconclick: null,

    _handleKeyDown: function appListHandleKeyDown(evt) {
      var icon_count = this._iconCount;
      var numPerRow = this._pagingSize.numIconsPerRow;
      var new_focus = -1;

      switch (evt.keyCode) {
        case KeyEvent.DOM_VK_UP:
          new_focus = this._focus - numPerRow;
          if (new_focus < 0) {
            return;
          }
          break;
        case KeyEvent.DOM_VK_DOWN:
          new_focus = this._focus + numPerRow;
          if (new_focus >= icon_count) {
            return;
          }
          break;
        case KeyEvent.DOM_VK_LEFT:
          new_focus = this._focus - 1;
          if (new_focus < 0 || Math.floor(new_focus / numPerRow) !=
              Math.floor(this._focus / numPerRow)) {
            return;
          }
          break;
        case KeyEvent.DOM_VK_RIGHT:
          new_focus = this._focus + 1;
          if (new_focus >= icon_count || Math.floor(new_focus / numPerRow) !=
              Math.floor(this._focus / numPerRow)) {
            return;
          }
          break;
        case KeyEvent.DOM_VK_RETURN:
          var event = new MouseEvent('click', {
            'view': window,
            'bubbles': false,
            'cancelable': false
          });
          var icons = this._container.querySelectorAll('.app-list-icon');
          icons[this._focus].dispatchEvent(event);
          break;
      }

      if (new_focus >= 0) {
        this.setFocus(new_focus);
        //icons[this._focus].scrollIntoView(false);
      }
    },

    _calcPagingSize: function appListCalcPagingSize() {
      this._containerDimensions.width = this._container.clientWidth;
      this._containerDimensions.height = this._container.clientHeight;

      var icon = document.createElement('div');
      icon.className = 'app-list-icon';
      this._container.appendChild(icon);

      var icon_computed_style = getComputedStyle(icon);

      this._iconDimensions.width =
        parseInt(icon_computed_style.getPropertyValue('width')) +
        parseInt(icon_computed_style.getPropertyValue('margin-left')) +
        parseInt(icon_computed_style.getPropertyValue('margin-right'));
      this._iconDimensions.height =
        parseInt(icon_computed_style.getPropertyValue('height')) +
        parseInt(icon_computed_style.getPropertyValue('margin-top')) +
        parseInt(icon_computed_style.getPropertyValue('margin-bottom'));

      this._container.removeChild(icon);

      this._pagingSize.numIconsPerRow = Math.floor(
        this._containerDimensions.width / this._iconDimensions.width);

      this._pagingSize.numIconsPerCol = Math.floor(
        this._containerDimensions.height / this._iconDimensions.height);
    },

    init: function appListInit() {
      var self = this;

      document.getElementById('app-list-close-button')
        .addEventListener('click', self);

      document.addEventListener('keydown', self);

      Applications.ready(function() {
        var iconTapHandler = function(evt) {
          evt.preventDefault();

          var data = {
            origin: this.dataset.origin,
            entry_point: this.dataset.entry_point,
            name: this.dataset.name
          };

          if (self.fire('iconclick', data)) {
            Applications.launch(data.origin, data.entry_point);
          }
        };

        var pages = [];
        var current_page = 0;
        pages.push(new AppListPage(self._container, self._pagingSize));

        Applications.getEntries().forEach(function(entry) {
          if (pages[current_page].isFull()) {
            pages.push(new AppListPage(self._container, self._pagingSize));
            current_page++;
          }
          pages[current_page].addIcon(entry, iconTapHandler);
          self._iconCount++;
        });

        self._selectionBorder = new SelectionBorder({
          multiple: false,
          container: self._container
        });

        self.fire('ready');
      });
    },

    uninit: function appListUninit() {
      this.oniconclick = null;

      this.hide();

      this._selectionBorder.deselectAll();
      this._container.innerHTML = '';
      this._iconCount = 0;

      document.removeEventListener('keydown', self);
      document.getElementById('app-list-close-button')
        .removeEventListener('click', this);
    },

    show: function appListShow() {
      if (!this.fire('opening')) {
        return false;
      }

      this._appList.hidden = false;

      if (this._focus < 0) {
        this._focus = 0;
      }

      this.setFocus(this._focus);
      this.fire('opened');
      return true;
    },

    hide: function appListHide() {
      if (!this.fire('closing')) {
        return false;
      }

      this._appList.hidden = true;
      this.fire('closed');
      return true;
    },

    isShown: function appListIsShown() {
      return !this._appList.hidden;
    },

    setFocus: function appListSetFocus(index) {
      var icons = this._container.querySelectorAll('.app-list-icon');

      if (index >= 0) {
        this._focus = index;
        this._selectionBorder.select(icons[this._focus]);
      } else {
        if (this._focus >= 0) {
          this._focus = index;
          this._selectionBorder.deselectAll();
        }
      }
    },

    handleEvent: function appListHandleEvent(evt) {
      var target = evt.target;

      if (target.id == 'app-list-close-button' && evt.type == 'click') {
        this.hide();
        return;
      }

      switch (evt.type) {
        case 'keydown':
          if (!this.isShown()) {
            return;
          }

          evt.preventDefault();
          this._handleKeyDown(evt);
          break;
      }
    }
  });

  exports.AppList = AppList;
})(window);
