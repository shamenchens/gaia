'use strict';

(function() {
  var appList;

  function init() {
    Applications.init();

    appList = new AppList();
    appList.init();

    document.getElementById('app-list-open-button').addEventListener('click',
      function() {
        appList.show();
      }
    );

    document.addEventListener('visibilitychange', function(evt) {
      if (document.visibilityState == 'visible') {
        appList.hide();
      }
    });

    document.addEventListener('contextmenu', function(evt) {
      evt.preventDefault();
    });
  }

  window.addEventListener('load', init);
})();
