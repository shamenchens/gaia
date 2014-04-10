'use strict';
/* global Applications, AppList, SelectionBorder, WidgetManager,
          WidgetEditor, OverlayManager, SpatialNavigator, KeyEvent */


(function(exports) {
  const PLAY_VIDEO = false;
  const VIDEO_URL = 'data/video.mp4';

  function Homescreen() {
    this.staticObjectPositions = [];
    this.staticObjectFunction = [];
  }

  function $(id) {
    return document.getElementById(id);
  }

  Homescreen.prototype.init = function init() {
    Applications.init();
    // app list
    this.appList = new AppList();
    this.appList.init();
    // selection border
    this.selectionBorder = new SelectionBorder({ multiple: false,
                                                 container: $('main-section'),
                                                 forground: true });
    // widgetManager
    this.widgetManager = new WidgetManager(window.systemConnection);
    this.widgetManager.on('update', this.updateSelection.bind(this));
    this.widgetManager.start();

    var self = this;
    // widget editor

    // We need to init widget editor which uses the size of container to
    // calculate the block size. So, the widget-editor should be shown before
    // the creation of WidgetEditor.
    $('widget-editor').hidden = false;
    var widgetPane = $('widget-pane');
    this.widgetEditor = new WidgetEditor({
                                      dom: $('widget-editor'),
                                      container: $('widget-view'),
                                      appList: this.appList,
                                      offset: {
                                        top: widgetPane.offsetTop,
                                        left: widgetPane.offsetLeft
                                      },
                                      targetSize: {
                                        w: widgetPane.clientWidth,
                                        h: widgetPane.clientHeight
                                      }
                                    });
    this.widgetEditor.on('closed', this.handleWidgetEditorClosed.bind(this));
    this.widgetEditor.start();
    this.widgetManager.on('update', function firstSyncWidgetManger() {
      self.widgetManager.off('update', firstSyncWidgetManger);
      self.widgetEditor.importConfig(self.widgetManager.widgetConfig);
    });

    $('widget-editor').hidden = true;

    $('app-list-open-button').addEventListener('click', this);
    $('edit-widget').addEventListener('click', this);
    $('widget-editor-close').addEventListener('click', this);

    this.initStaticObjects();

    // init spatial navigator
    this.spatialNav = new SpatialNavigator(this.staticObjectPositions);
    this.spatialNav.on('focus', this.handleSelection.bind(this));
    this.spatialNav.focus();

    document.addEventListener('contextmenu', this);
    window.addEventListener('keydown', this);

    // for testing only
    window.initFakeAppEvent();
    window.initGesture();

    return this;
  };

  Homescreen.prototype.uninit = function uninit() {
    // how to uninit FakeAppEvent and Gesture?
    window.removeEventListener('keydown', this);
    document.removeEventListener('contextmenu', this);
    $('edit-widget').removeEventListener('click', this);
    $('widget-editor-close').removeEventListener('click', this);
    $('app-list-open-button').removeEventListener('click', this);

    this.appList.uninit();
    this.spatialNav.reset();
    this.widgetManager.stop();
    this.widgetEditor.stop();

    this.appList = null;
    this.spatialNav = null;
    this.widgetManager = null;
    this.widgetEditor = null;
    this.selectionBorder = null;

    this.staticObjectPositions = [];
    this.staticObjectFunction = [];
  };

  Homescreen.prototype.initStaticObjects = function initStaticObjects() {
    var self = this;
    this.staticObjectPositions = [$('app-list-open-button'), $('edit-widget')];

    var staticPane = $('main-section');
    var staticPaneRect = staticPane.getBoundingClientRect();
    this.widgetEditor.exportConfig().forEach(function(config) {
      if (!config.static) {
        return;
      }
      var id = config.positionId;
      var dom = document.createElement('div');
      dom.classList.add('static-element');
      dom.classList.add('static-element-' + id);
      dom.style.left = (config.x - staticPaneRect.left) + 'px';
      dom.style.top = (config.y - staticPaneRect.top) + 'px';
      dom.style.width = config.w + 'px';
      dom.style.height = config.h + 'px';
      dom.dataset.id = id;

      switch (id) {
        case 0:
          if (PLAY_VIDEO) {
            self.createVideo(dom);
          }
          self.staticObjectFunction[id] = function() {
            self.setAsFullscreen(dom);
          };
          break;
        case 1:
          self.staticObjectFunction[id] = function() {
            window.open('http://www.mozilla.org', '_blank',
                        'remote=true,useAsyncPanZoom=true');
          };
          break;
      }

      staticPane.appendChild(dom);
      self.staticObjectPositions.push(dom);
    });

    if (PLAY_VIDEO) {
      // we need to take care the hardware codec removal.
      document.addEventListener('visibilitychange', function(evt) {
        if (document.visibilityState === 'visible') {
          self.appList.hide();
          self.mainVideo.src = VIDEO_URL;
          self.mainVideo.play();
        } else {
          self.mainVideo.pause();
          self.mainVideo.removeAttribute('src');
          self.mainVideo.load();
        }
      });
    }
  };

  Homescreen.prototype.setAsFullscreen = function setAsFullscreen(dom) {
    var self = this;
    OverlayManager.readyToOpen('fullscreen', function() {
      self.originalElementSize = {
        'left': dom.style.left,
        'top': dom.style.top,
        'width': dom.style.width,
        'height': dom.style.height
      };
      dom.style.left = '0px';
      dom.style.top = '0px';
      dom.style.width = '100%';
      dom.style.height = '100%';
      self.fullScreenElement = dom;
      self.fullScreenElement.classList.add('fullscreen');
    });
  };

  Homescreen.prototype.restoreFullscreen = function restoreFullscreen() {
    this.fullScreenElement.style.left = this.originalElementSize.left;
    this.fullScreenElement.style.top = this.originalElementSize.top;
    this.fullScreenElement.style.width = this.originalElementSize.width;
    this.fullScreenElement.style.height = this.originalElementSize.height;
    this.fullScreenElement.classList.remove('fullscreen');
    this.fullScreenElement = null;
    this.originalElementSize = null;
    setTimeout(function() {
      OverlayManager.afterClosed('fullscreen');
    }, 200);
  };

  Homescreen.prototype.createVideo = function createVideo(dom) {
    this.mainVideo = document.createElement('video');
    this.mainVideo.src = VIDEO_URL;
    this.mainVideo.mozAudioChannelType = 'content';
    this.mainVideo.loop = true;
    this.mainVideo.controls = false;
    this.mainVideo.autoplay = true;
    this.mainVideo.style.width = '100%';
    this.mainVideo.style.height = '100%';
    dom.appendChild(this.mainVideo);
    dom.classList.add('has-video');
  };

  Homescreen.prototype.convertKeyToString = function convertKeyToString(evt) {
    switch (evt.keyCode) {
      case KeyEvent.DOM_VK_UP:
        return 'Up';
      case KeyEvent.DOM_VK_RIGHT:
        return 'Right';
      case KeyEvent.DOM_VK_DOWN:
        return 'Down';
      case KeyEvent.DOM_VK_LEFT:
        return 'Left';
      case KeyEvent.DOM_VK_RETURN:
        return 'Enter';
      case KeyEvent.DOM_VK_ESCAPE:
        return 'Esc';
      case KeyEvent.DOM_VK_BACK_SPACE:
        return 'Esc';
      default:// we don't consume other keys.
        return null;
    }
  };

  Homescreen.prototype.handleEvent = function handleEvent(evt) {
    switch(evt.type) {
      case 'keydown':
        this.handleKeyEvent(evt);
        break;
      case 'contextmenu':
        evt.preventDefault();
        break;
      case 'click':
        switch (evt.target.id) {
          case 'edit-widget':
            this.widgetEditor.show();
            break;
          case 'widget-editor-close':
            this.widgetEditor.hide();
            break;
          case 'app-list-open-button':
            this.appList.show();
            break;
        }
        break;
    }
  };

  Homescreen.prototype.handleKeyEvent = function handleKeyEvent(evt) {
    var key = this.convertKeyToString(evt);

    if (this.appList.isShown() && this.appList.handleKeyDown(key)) {
      evt.preventDefault();
    } else if (this.widgetEditor.isShown() && key === 'Esc') {
      this.widgetEditor.hide();
      evt.preventDefault();
    } else if (this.widgetEditor.isShown() &&
               this.widgetEditor.handleKeyDown(key)) {
      evt.preventDefault();
    } else if (this.fullScreenElement && key === 'Esc') {
      this.restoreFullscreen();
      evt.preventDefault();
    } else if (!OverlayManager.hasOverlay() && key) {
      if (key === 'Enter') {
        this.handleEnterKey(this.spatialNav.currentFocus());
      } else if (key !== 'Esc') {
        this.spatialNav.move(key);
      }
      evt.preventDefault();
    }
  };

  Homescreen.prototype.handleEnterKey = function handleEnterKey(focused) {
    if (OverlayManager.hasOverlay()) {
      return;
    }

    if (focused === $('app-list-open-button') || focused === $('edit-widget')) {
      focused.click();
    } else if (focused.classList &&
               focused.classList.contains('static-element')) {
      if (this.staticObjectFunction[focused.dataset.id]) {
        this.staticObjectFunction[focused.dataset.id].apply(focused);
      }
    } else {
      Applications.launch(focused.origin, focused.entryPoint);
    }
  };

  Homescreen.prototype.handleWidgetEditorClosed = function wdgEditorClosed() {
    var newConfig = this.widgetEditor.exportConfig();
    this.widgetManager.save(newConfig);
  };

  Homescreen.prototype.updateSelection = function updateSelection(config) {
    var nonstatics = [];
    for (var i = 0; i < config.length; i++) {
      if (config[i].static) {
        continue;
      }
      nonstatics.push(config[i]);
    }
    var previousFocusedItem = this.spatialNav.currentFocus();
    var allSelectable = this.staticObjectPositions.concat(nonstatics);
    this.spatialNav.reset(allSelectable);
    if (!previousFocusedItem || !this.spatialNav.focus(previousFocusedItem)) {
      this.spatialNav.focus();
    }
  };

  Homescreen.prototype.handleSelection = function handleSelection(elem) {
    if (elem.nodeName) {
      this.selectionBorder.select(elem);
    } else {
      this.selectionBorder.selectRect(elem);
    }
  };

  exports.Homescreen = Homescreen;

})(window);
