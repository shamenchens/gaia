'use strict';
/* global document, LayoutEditor */

requireApp('homescreen-tv-arch1/js/layout_editor.js');

suite('LayoutEditor', function() {
  var widgetView;

  suiteSetup(function() {
    widgetView = document.createElement('div');
    widgetView.style.width = '1280px';
    widgetView.style.height = '800px';
    document.body.appendChild(widgetView);
  });

  suiteTeardown(function() {
    document.body.removeChild(widgetView);
  });

  suite('init', function() {
    setup(function() {
      widgetView.innerHTML = '';
    });

    teardown(function() {
    });

    test('init 1x1', function() {
      var editor = new LayoutEditor({
        layout: {v: 1, h: 1},
        holders: [{ x: 0, y: 0, w: 1, h: 1 }]
      });
      var place = editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      assert.isNotNull(place);
      assert.equal(place.x, 10);
      assert.equal(place.y, 10);
      assert.equal(place.w, 1260);
      assert.equal(place.h, 780);
      assert.equal(editor.placeHolders.length, 1);
    });

    test('init 3x3', function() {
      var editor = new LayoutEditor({
        gap: {v: 0, h: 0},
        layout: {v: 3, h: 3},
        holders: [{ x: 0, y: 0, w: 1, h: 1 },
                  { x: 1, y: 0, w: 1, h: 1 },
                  { x: 2, y: 0, w: 1, h: 1 },
                  { x: 0, y: 1, w: 1, h: 1 },
                  { x: 1, y: 1, w: 1, h: 1 },
                  { x: 2, y: 1, w: 1, h: 1 },
                  { x: 0, y: 2, w: 1, h: 1 },
                  { x: 1, y: 2, w: 1, h: 1 },
                  { x: 2, y: 2, w: 1, h: 1 }]
      });
      editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      assert.equal(editor.placeHolders.length, 9);
      for (var i = 0; i < editor.placeHolders.length; i++) {
        assert.equal(editor.placeHolders[i].w, 420);
        assert.equal(editor.placeHolders[i].h, 260);
      }
    });

    test('init with scale', function() {
      var editor = new LayoutEditor({
        padding: {t: 0, b: 0, r: 0, l: 0},
        gap: {v: 0, h: 0},
        layout: {v: 1, h: 1},
        holders: [{ static: true, x: 0, y: 0, w: 1, h: 1 }]
      });
      // the target size is 640x480, scale ratio should be 0.5
      var place = editor.init(widgetView, {w: 640, h: 400}, {left: 0, top: 0});
      assert.equal(editor.scaleRatio, 0.5);
      // all UI element are still shown as 1280x800 in editor.
      assert.equal(place.w, 1280);
      assert.equal(place.h, 800);
      assert.equal(place.elm.style.left, '0px');
      assert.equal(place.elm.style.top, '0px');
      assert.equal(place.elm.style.width, '1280px');
      assert.equal(place.elm.style.height, '800px');
      // the exported config is fit to 640x400
      var config = editor.exportConfig();
      assert.equal(config[0].x, 0);
      assert.equal(config[0].y, 0);
      assert.equal(config[0].w, 640);
      assert.equal(config[0].h, 400);
    });
  });

  suite('modify widget', function() {
    var editor;
    var testApp = {
      'name': 'test-app',
      'iconUrl': '/dummy-icon.jpg',
      'origin': 'apps://test-app.gaiamobile.org',
      'entryPoint': ''
    };

    suiteSetup(function() {
      widgetView.innerHTML = '';
    });

    setup(function() {
      editor = new LayoutEditor({
        gap: {v: 0, h: 0},
        layout: {v: 3, h: 3},
        holders: [{ x: 0, y: 0, w: 1, h: 1 },
                  { x: 1, y: 0, w: 1, h: 1 },
                  { x: 2, y: 0, w: 1, h: 1 },
                  { x: 0, y: 1, w: 1, h: 1 },
                  { x: 1, y: 1, w: 1, h: 1 },
                  { x: 2, y: 1, w: 1, h: 1 },
                  { x: 0, y: 2, w: 1, h: 1 },
                  { x: 1, y: 2, w: 1, h: 1 },
                  { x: 2, y: 2, w: 1, h: 1 }]
      });
      editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      editor.addWidget(testApp, editor.placeHolders[0]);
    });

    test('addWidget', function() {
      var element = editor.placeHolders[0].elm;
      assert.equal(element.dataset.appName, testApp.name);
      var idx = element.style.backgroundImage.indexOf(testApp.iconUrl);
      assert.isTrue(idx > -1);
    });

    test('removeWidget', function() {
      editor.removeWidget(editor.placeHolders[0]);
      assert.isUndefined(editor.placeHolders[0].app);
      var element = editor.placeHolders[0].elm;
      assert.isTrue(!element.dataset.appName);
      assert.isTrue(!element.style.backgroundImage);
    });

    test('removeWidgets, test-app removed', function() {
      var found = false;
      editor.removeWidgets(function(place, resultCallback) {
        var matched = place.app.origin === testApp.origin &&
                      place.app.entryPoint === testApp.entryPoint;
        resultCallback(matched, place);
        found = found || matched;
      });
      assert.isTrue(found);
    });

    test('removeWidgets, other apps removed', function() {
      var found = false;
      editor.removeWidgets(function(place, resultCallback) {
        var matched = place.app.origin === 'other-app-origin' &&
                      place.app.entryPoint === '';
        resultCallback(matched, place);
        found = found || matched;
      });
      assert.isFalse(found);
    });

    test('updateWidgets, test-app is updated', function() {
      editor.updateWidgets(function(place, resultCallback) {
        if (place.app.origin === testApp.origin &&
            place.app.entryPoint === testApp.entryPoint) {
          place.app.name = 'updated-test-app';
          place.app.iconUrl = '/upated-dummy-icon.jpg';
          resultCallback(true, place);
        }
      });
      var element = editor.placeHolders[0].elm;
      assert.equal(element.dataset.appName, 'updated-test-app');
      var idx = element.style.backgroundImage.indexOf('/upated-dummy-icon.jpg');
      assert.isTrue(idx > -1);
    });

    test('swapWidget', function() {
      editor.swapWidget(editor.placeHolders[0], editor.placeHolders[1]);

      var element0 = editor.placeHolders[0].elm;
      assert.isTrue(!element0.dataset.appName);
      assert.isTrue(!element0.style.backgroundImage);

      var element1 = editor.placeHolders[1].elm;
      assert.equal(element1.dataset.appName, testApp.name);
      var idx = element1.style.backgroundImage.indexOf(testApp.iconUrl);
      assert.isTrue(idx > -1);
    });

    test('reset', function() {
      editor.reset(function(place) {
        assert.equal(place.app.origin, testApp.origin);
        assert.equal(place.app.entryPoint, testApp.entryPoint);
      });

      var element = editor.placeHolders[0].elm;
      assert.isTrue(!element.dataset.appName);
      assert.isTrue(!element.style.backgroundImage);
    });
  });

  suite('other API', function() {
    var editor;
    var testApp = {
      'name': 'test-app',
      'iconUrl': '/dummy-icon.jpg',
      'origin': 'apps://test-app.gaiamobile.org',
      'entryPoint': ''
    };

    test('getFirstNonStatic', function() {
      editor = new LayoutEditor({
        padding: {t: 0, b: 0, r: 0, l: 0},
        gap: {v: 0, h: 0},
        layout: {v: 2, h: 2},
        holders: [{ static: true, x: 0, y: 0, w: 1, h: 1 },
                  { static: true, x: 1, y: 0, w: 1, h: 1 },
                  { static: true, x: 0, y: 1, w: 1, h: 1 },
                  { x: 1, y: 1, w: 1, h: 1 }]
      });
      editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      var place = editor.getFirstNonStatic();
      assert.equal(place.x, 640);
      assert.equal(place.y, 400);
      assert.equal(place.w, 640);
      assert.equal(place.h, 400);
    });

    test('getFirstNonStatic, all static', function() {
      editor = new LayoutEditor({
        padding: {t: 0, b: 0, r: 0, l: 0},
        gap: {v: 0, h: 0},
        layout: {v: 2, h: 2},
        holders: [{ static: true, x: 0, y: 0, w: 1, h: 1 },
                  { static: true, x: 1, y: 0, w: 1, h: 1 },
                  { static: true, x: 0, y: 1, w: 1, h: 1 },
                  { static: true, x: 1, y: 1, w: 1, h: 1 }]
      });
      editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      var place = editor.getFirstNonStatic();
      assert.isTrue(!place);
    });

    test('loadWidget', function() {
      editor = new LayoutEditor({
        padding: {t: 0, b: 0, r: 0, l: 0},
        gap: {v: 0, h: 0},
        layout: {v: 2, h: 2},
        holders: [{ x: 0, y: 0, w: 1, h: 1 },
                  { x: 1, y: 0, w: 1, h: 1 },
                  { x: 0, y: 1, w: 1, h: 1 },
                  { x: 1, y: 1, w: 1, h: 1 }]
      });
      editor.init(widgetView, {w: 1280, h: 800}, {left: 0, top: 0});
      editor.loadWidget({ app: testApp, positionId: 0});
      var element = editor.placeHolders[0].elm;
      assert.equal(element.dataset.appName, testApp.name);
      var idx = element.style.backgroundImage.indexOf(testApp.iconUrl);
      assert.isTrue(idx > -1);
    });
  });
});
