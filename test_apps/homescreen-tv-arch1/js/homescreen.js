'use strict';

(function() {
  var appList;
  var widgetEditor;

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    Applications.init();

    appList = new AppList();
    appList.init();

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
      widgetEditor.save();
      $('widget-editor').hidden = true;
    });
  }

  function enterWidgetEditor() {
    // We need to init widget editor which uses the size of container to
    // calculate the block size. So, the widget-editor should be shown before
    // the creation of WidgetEditor.
    $('widget-editor').hidden = false;
    if (!widgetEditor) {
      widgetEditor = new WidgetEditor($('widget-view'), appList);
      widgetEditor.load();
    }
    widgetEditor.setVisible(true);
  }

  window.addEventListener('load', init);
})();
