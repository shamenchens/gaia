'use strict';

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
  var mainVideo;
  var playEndTimer;

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
      window.systemConnection.hideAll(function() {
        appList.show();
        $('main-section').classList.add('app-list-shown');
      });
    });
    appList.on('closed', function() {
      $('main-section').classList.remove('app-list-shown');
      handleSomethingClosed();
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
              window.systemConnection.hideAll(function() {
                fullScreenElement = dom;
                dom.classList.add('fullscreen');
                $('main-section').classList.add('fullscreen-shown');
              });
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
    initFakeAppEvent();
    initGesture();
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
      console.log('ended');
      mainVideo.currentTime = 0;
      mainVideo.play();
    });
    mainVideo.addEventListener('timeupdate', function() {
      var diff  = mainVideo.duration - mainVideo.currentTime;
      if (diff < 1) {
        mainVideo.pause();
        mainVideo.src = ''
        mainVideo.load();
        window.setTimeout(function() {
          mainVideo.src = 'data/video.mp4';
          mainVideo.play();
        });
      }
    });
  }

  function handleSomethingClosed() {
    // widgetEditor may ask appList to show. We need to wait for widgetEditor
    // is hide before showAll widgets in this case.
    if (!widgetEditor.isShown() && !appList.isShown() &&
        fullScreenElement == null) {
      window.systemConnection.showAll();
    }
  }

  function handleKeyEvent(evt) {
    if (appList.isShown()) {
      if (!appList.handleEvent(evt)) {
        return;
      }
    } else if (widgetEditor.isShown()) {
      if (evt.key === 'Esc') {
        widgetEditor.hide();
      } else {
        widgetEditor.handleKeyDown(evt);
      }
    } else if (fullScreenElement) {
      switch(evt.key) {
        case 'Esc':
          $('main-section').classList.remove('fullscreen-shown');
          fullScreenElement.classList.remove('fullscreen');
          fullScreenElement = null;
          handleSomethingClosed();
          break;
      }
    } else {
      switch(evt.key) {
        case 'Left':
        case 'Right':
        case 'Up':
        case 'Down':
          spatialNav.move(evt.key);
          break;
        case 'Enter':
          handleEnterKey(spatialNav.currentFocus());
          break;
        case 'Esc':
          break;
        default:
          return;
      }
    }
    evt.preventDefault();
  }

  function handleEnterKey(focused) {
    if (focused === $('app-list-open-button')) {
      $('app-list-open-button').click();
    } else if (focused === $('edit-widget')) {
      $('edit-widget').click();
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
    $('main-section').classList.add('widget-editor-shown');
    window.systemConnection.hideAll(function() {
      $('widget-editor').hidden = false;
      widgetEditor.importConfig(widgetManager.widgetConfig);
      widgetEditor.show();
    });
  }

  function handleWidgetEditorClosed() {
    var newConfig = widgetEditor.exportConfig();
    widgetManager.save(newConfig);
    $('widget-editor').hidden = true;
    $('main-section').classList.remove('widget-editor-shown');
    handleSomethingClosed();
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
