'use strict';

require('/shared/test/unit/mocks/mock_navigator_moz_apps.js');
requireApp('homescreen-tv-arch1/js/system_connection.js');
requireApp('homescreen-tv-arch1/test/unit/mock_uuid.js');

suite('SystemConntection', function() {
  setup(function() {
    window.navigator.mozApps = MockNavigatormozApps;
  });

  teardown(function() {
    systemConnection._unrespondRequests = [];
    MockNavigatormozApps.mTeardown();
  });

  test('addWidget', function() {
    var args = {
      x: 220,
      y: 10,
      w: 200,
      h: 150,
      widgetOrigin: 'app://widget.gaiamobile.org/',
      widgetEntryPoint: 'entry'
    };
    var app = {
      name: 'homescreen',
      launch: MockNavigatormozApps._mLaunch.bind(MockNavigatormozApps),
      connect: function(keyword) {
        MockNavigatormozApps.mLastConnectionKeyword = keyword;
        return {
          then: function(cb) {
            MockNavigatormozApps.mLastConnectionCallback = cb;
          }
        };
      }
    };
    assert.isTrue(systemConnection._unrespondRequests.length === 0);
    systemConnection.addWidget(args);
    MockNavigatormozApps.mTriggerLastRequestSuccess(app);
    if (MockNavigatormozApps.mLastConnectionCallback) {
      MockNavigatormozApps.mLastConnectionCallback([]);
    }
    assert.isTrue(systemConnection._unrespondRequests.length > 0);
    assert.isTrue(systemConnection._unrespondRequests[0].args === args);
    assert.isTrue(systemConnection._unrespondRequests[0].action === 'add');
    assert.isTrue(
      systemConnection._unrespondRequests[0].requestId === uuid.FAKE_UUID);
  });
});