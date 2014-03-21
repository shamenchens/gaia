'use strict';

function initTestModule() {
  Applications.ready(function() {
    const TEST_ORIGIN = "http://2048widget.gaiamobile.org:8080";

    var testApp = Applications.installedApps[TEST_ORIGIN];

    document.addEventListener('keydown', function keyDownHandler(evt) {
      switch(evt.key) {
        case 'F1':
          if (!Applications.installedApps[TEST_ORIGIN]) {
            Applications.installedApps[TEST_ORIGIN] = testApp;
            Applications.fire('install',
              Applications.getAppEntries(TEST_ORIGIN));
          }
          break;
        case 'F2':
          if (Applications.installedApps[TEST_ORIGIN]) {
            Applications.fire('update', [{
              origin:
                Applications.installedApps[TEST_ORIGIN].origin,
              entry_point:
                Applications.installedApps[TEST_ORIGIN].entry_point || '',
              name:
                new Date().getTime()
            }]);
          }
          break;
        case 'F3':
          if (Applications.installedApps[TEST_ORIGIN]) {
            var entries = Applications.getAppEntries(TEST_ORIGIN);
            delete Applications.installedApps[TEST_ORIGIN];
            Applications.fire('uninstall', entries);
          }
          break;
        default:
          return;
      }
      console.log(evt.key);
      evt.preventDefault();
    });
  });
}