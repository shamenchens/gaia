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
    },

    getIconElement: function alpGetIconElement(index) {
      if (index < 0 || index >= this._iconCount) {
        return null;
      }
      return this._dom.childNodes[index];
    },

    getIconCount: function alpGetIconCount() {
      return this._iconCount;
    }
  };

  function AppList() {
    this._appList = document.getElementById('app-list');
    this._container = document.getElementById('app-list-container');
    this._calcPagingSize();
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

    _currentPage: 0,
    _pages: null,

    oniconclick: null,

    _handleKeyDown: function appListHandleKeyDown(evt) {
      switch (evt.key) {
        case 'PageUp':
          this.previousPage();
          this.setFocus(0);
          break;
        case 'PageDown':
          this.nextPage();
          this.setFocus(0);
          break;
        case 'Up':
        case 'Down':
        case 'Left':
        case 'Right':
          this._handleArrowKey(evt.key);
          break;
        case 'Enter':
          var event = new MouseEvent('click', {
            'view': window,
            'bubbles': false,
            'cancelable': false
          });

          this._pages[this._currentPage].getIconElement(this._focus)
            .dispatchEvent(event);
          break;
        case 'Esc':
          this.hide();
          break;
        default:
          return false;
      }

      return true;
    },

    _handleArrowKey: function appListHandleArrowKey(direction) {
      var current_page = this._pages[this._currentPage];
      var icon_count = current_page.getIconCount();
      var numPerRow = this._pagingSize.numIconsPerRow;
      var new_focus;

      switch(direction) {
        case 'Up':
          new_focus = this._focus - numPerRow;
          break;
        case 'Down':
          new_focus = this._focus + numPerRow;
          break;
        case 'Left':
          if (this._focus % numPerRow == 0) {
            if (this._currentPage == 0) {
              return false;
            }

            this.previousPage();

            current_page = this._pages[this._currentPage];
            icon_count = current_page.getIconCount();
            new_focus = this._focus + numPerRow - 1;
          } else {
            new_focus = this._focus - 1;
          }
          break;
        case 'Right':
          if (this._focus % numPerRow == numPerRow - 1) {
            if (this._currentPage == this._pages.length - 1) {
              return false;
            }

            this.nextPage();

            current_page = this._pages[this._currentPage];
            icon_count = current_page.getIconCount();
            new_focus = this._focus - numPerRow + 1;

            if (new_focus >= icon_count) {
              new_focus = 0;
            }
          } else {
            new_focus = this._focus + 1;
          }
          break;
      }

      if (new_focus < 0 || new_focus >= icon_count) {
        return false;
      }

      return this.setFocus(new_focus);
    },

    _calcPagingSize: function appListCalcPagingSize() {
      this._appList.hidden = false;
      this._containerDimensions.width = this._container.clientWidth;
      this._containerDimensions.height = this._container.clientHeight;
      this._appList.hidden = true;

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

        self._pages = pages;
        self.setPage(0);

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
      var current_page = this._pages[this._currentPage];
      var icon_count = current_page.getIconCount();

      if (index >= 0) {
        if (index >= icon_count) {
          return false;
        }

        this._focus = index;
        this._selectionBorder
          .select(current_page.getIconElement(this._focus));
      } else if (this._focus >= 0) {
        this._focus = index;
        this._selectionBorder.deselectAll();
      }

      return true;
    },

    setPage: function appListSetPage(index) {
      if (index < 0 || index >= this._pages.length) {
        return false;
      }

      this._container.style.left =
        (-1 * index * this._containerDimensions.width) + 'px';
      this._currentPage = index;
      return true;
    },

    previousPage: function appListPreviousPage() {
      return this.setPage(this._currentPage - 1);
    },

    nextPage: function appListNextPage() {
      return this.setPage(this._currentPage + 1);
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
          if (this._handleKeyDown(evt)) {
            evt.preventDefault();
          }
          break;
      }
    }
  });

  exports.AppList = AppList;
})(window);
