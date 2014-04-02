'use strict';
/* global Applications, AppList, SelectionBorder, WidgetManager,
          WidgetEditor, OverlayManager, SpatialNavigator, KeyEvent */


(function() {
  const PLAY_VIDEO = false;
  var appList;
  var widgetEditor;
  var widgetManager;
  var spatialNav;
  var staticObjectPositions = [];
  var staticObjectFunction = [];
  var selectionBorder;
  var fullScreenElement = null;
  var originalElementSize;
  var mainVideo;

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    staticObjectPositions = [$('app-list-open-button'), $('edit-widget')];

    Applications.init();

    appList = new AppList();
    appList.init();

    selectionBorder = new SelectionBorder({ multiple: false,
                                            container: $('main-section'),
                                            forground: true });

    widgetManager = new WidgetManager(window.systemConnection);
    widgetManager.on('update', updateSelection);
    widgetManager.start();

    // app list
    $('app-list-open-button').addEventListener('click', function() {
      appList.show();
    });

    // widget editor

    // We need to init widget editor which uses the size of container to
    // calculate the block size. So, the widget-editor should be shown before
    // the creation of WidgetEditor.
    $('widget-editor').hidden = false;
    var widgetPane = $('widget-pane');
    widgetEditor = new WidgetEditor({
                                      dom: $('widget-view'),
                                      appList: appList,
                                      offset: {
                                        top: widgetPane.offsetTop,
                                        left: widgetPane.offsetLeft
                                      },
                                      targetSize: {
                                        w: widgetPane.clientWidth,
                                        h: widgetPane.clientHeight
                                      }
                                    });
    widgetEditor.on('closed', handleWidgetEditorClosed);
    widgetEditor.start();
    $('widget-editor').hidden = true;

    $('edit-widget').addEventListener('click', enterWidgetEditor);
    $('widget-editor-close').addEventListener('click', function() {
      widgetEditor.hide();
    });

    var staticPane = $('main-section');
    var staticPaneRect = staticPane.getBoundingClientRect();
    widgetEditor.exportConfig().forEach(function(config) {
      if (config.static) {
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
              createVideo();
              dom.appendChild(mainVideo);
              dom.classList.add('has-video');
            }
            staticObjectFunction[id] = function() {
              setAsFullscreen(dom);
            };
            break;
          case 1:
            staticObjectFunction[id] = function() {
              window.open('http://www.mozilla.org', '_blank',
                          'remote=true,useAsyncPanZoom=true');
            };
            break;
        }

        staticPane.appendChild(dom);
        staticObjectPositions.push(dom);
      }
    });

    spatialNav = new SpatialNavigator(staticObjectPositions);
    spatialNav.on('focus', handleSelection);
    spatialNav.focus();

    document.addEventListener('visibilitychange', function(evt) {
      if (document.visibilityState === 'visible') {
        appList.hide();
        if (mainVideo) {
          mainVideo.src = 'data/video.mp4';
          mainVideo.play();
        }
      } else {
        if (mainVideo) {
          mainVideo.pause();
          mainVideo.removeAttribute('src');
          mainVideo.load();
        }
      }
    });
    document.addEventListener('contextmenu', function(evt) {
      evt.preventDefault();
    });
    window.addEventListener('keydown', handleKeyEvent);

    // for testing only
    window.initFakeAppEvent();
    window.initGesture();
  }

  function setAsFullscreen(dom) {
    OverlayManager.readyToOpen('fullscreen', function() {
      originalElementSize = {
        'left': dom.style.left,
        'top': dom.style.top,
        'width': dom.style.width,
        'height': dom.style.height,
      };
      dom.style.left = '0px';
      dom.style.top = '0px';
      dom.style.width = '100%';
      dom.style.height = '100%';
      fullScreenElement = dom;
      fullScreenElement.classList.add('fullscreen');
    });
  }

  function restoreFullscreen() {
    fullScreenElement.style.left = originalElementSize.left;
    fullScreenElement.style.top = originalElementSize.top;
    fullScreenElement.style.width = originalElementSize.width;
    fullScreenElement.style.height = originalElementSize.height;
    fullScreenElement.classList.remove('fullscreen');
    fullScreenElement = null;
    originalElementSize = null;
    setTimeout(function() {
      OverlayManager.afterClosed('fullscreen');
    }, 200);
  }

  function createVideo() {
    mainVideo = document.createElement('video');
    mainVideo.src = 'data/video.mp4';
    mainVideo.loop = false;
    mainVideo.controls = false;
    mainVideo.autoPlay = true;
    mainVideo.style.width = '100%';
    mainVideo.style.height = '100%';
    mainVideo.addEventListener('ended', function() {
      mainVideo.currentTime = 0;
      mainVideo.play();
    });
    mainVideo.addEventListener('timeupdate', function() {
      var diff = mainVideo.duration - mainVideo.currentTime;
      if (diff < 1) {
        mainVideo.pause();
        mainVideo.src = '';
        mainVideo.load();
        window.setTimeout(function() {
          mainVideo.src = 'data/video.mp4';
          mainVideo.play();
        });
      }
    });
  }

  function convertKeyToString(evt) {
    console.log('Trying to check key code: ' + evt.keyCode);
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
  }

  function handleKeyEvent(evt) {
    var key = convertKeyToString(evt);

    if (appList.isShown() && appList.handleKeyDown(key)) {
      evt.preventDefault();
    } else if (widgetEditor.isShown() && key === 'Esc') {
      widgetEditor.hide();
      evt.preventDefault();
    } else if (widgetEditor.isShown() && widgetEditor.handleKeyDown(key)){
      evt.preventDefault();
    } else if (fullScreenElement && key === 'Esc') {
      restoreFullscreen();
      evt.preventDefault();
    } else if (!OverlayManager.hasOverlay() && key) {
      if (key === 'Enter') {
        handleEnterKey(spatialNav.currentFocus());
      } else if (key !== 'Esc') {
        spatialNav.move(key);
      }
      evt.preventDefault();
    }
  }

  function handleEnterKey(focused) {
    if (OverlayManager.hasOverlay()) {
      return;
    }

    if (focused === $('app-list-open-button') || focused === $('edit-widget')) {
      focused.click();
    } else if (focused.classList &&
               focused.classList.contains('static-element')) {
      if (staticObjectFunction[focused.dataset.id]) {
        staticObjectFunction[focused.dataset.id].apply(focused);
      }
    } else {
      Applications.launch(focused.origin, focused.entryPoint);
    }
  }

  function enterWidgetEditor() {
    OverlayManager.readyToOpen('widget-editor', function() {
      $('widget-editor').hidden = false;
      widgetEditor.importConfig(widgetManager.widgetConfig);
      widgetEditor.show();
    });
  }

  function handleWidgetEditorClosed() {
    var newConfig = widgetEditor.exportConfig();
    widgetManager.save(newConfig);
    $('widget-editor').hidden = true;
    OverlayManager.afterClosed('widget-editor');
  }

  function updateSelection(config) {
    var previousFocusedItem = spatialNav.currentFocus();
    var allSelectable = staticObjectPositions.concat(config);
    spatialNav.reset(allSelectable);
    if (!previousFocusedItem || !spatialNav.focus(previousFocusedItem)) {
      spatialNav.focus();
    }
  }

  function handleSelection(elem) {
    if (elem.nodeName) {
      selectionBorder.select(elem);
    } else {
      selectionBorder.selectRect(elem);
    }
  }

  window.addEventListener('load', init);
})();
