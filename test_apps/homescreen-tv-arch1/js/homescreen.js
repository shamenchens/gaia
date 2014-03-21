'use strict';

(function() {
  var appList;
  var widgetEditor;
  var widgetManager;

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    Applications.init();

    appList = new AppList();
    appList.init();

    widgetManager = new WidgetManager(window.systemConnection);
    widgetManager.start();

    $('app-list-open-button').addEventListener('click', function() {
      appList.show();
    });

    document.addEventListener('visibilitychange', function(evt) {
      if (document.visibilityState === 'visible') {
        appList.hide();
      }
    });

    document.addEventListener('contextmenu', function(evt) {
      evt.preventDefault();
    });

    $('edit-widget').addEventListener('click', enterWidgetEditor);
    $('widget-editor-close').addEventListener('click', function() {
      widgetEditor.setVisible(false);
      var newConfig = widgetEditor.exportConfig();
      widgetManager.save(newConfig);
      $('widget-editor').hidden = true;
    });
  }

  function enterWidgetEditor() {
    // We need to init widget editor which uses the size of container to
    // calculate the block size. So, the widget-editor should be shown before
    // the creation of WidgetEditor.
    $('widget-editor').hidden = false;
    if (!widgetEditor) {
      var widgetPane = $('widget-pane');
      widgetEditor = new WidgetEditor({ 
                                        dom: $('widget-view'),
                                        appList: appList,
                                        targetSize: {
                                          w: widgetPane.clientWidth,
                                          h: widgetPane.clientHeight
                                        }
                                      });
      widgetEditor.start();
      widgetEditor.importConfig(widgetManager.widgetConfig);
    }
    widgetEditor.setVisible(true);
  }

  window.addEventListener('load', init);
})();
