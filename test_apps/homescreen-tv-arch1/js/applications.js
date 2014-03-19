'use strict';

(function() {
  var HIDDEN_ROLES = ['system', 'input', 'homescreen', 'search'];

  var apps = {};

  var _ready = false;
  var _readyCallbacks = [];

  function init(callback) {
    var linkList = document.createElement('ul');
    linkList.id = 'links';

    navigator.mozApps.mgmt.getAll().onsuccess = function onsuccess(event) {
      event.target.result.forEach(function eachApp(app) {
        var manifest = app.manifest;
        if (!app.launch || !manifest || !manifest.launch_path ||
            !manifest.icons || isHiddenApp(manifest.role)) {
          return;
        }
        apps[app.origin] = app;
      });

      ready = true;

      if (callback) {
        callback();
      }

      while(_readyCallbacks.length) {
        setTimeout(_readyCallbacks.shift());
      }
    };
  }

  function getAppEntries() {
    if (!ready) {
      return null;
    }

    var entries = [];

    for (var origin in apps) {
      var manifest = apps[origin].manifest;
      var entryPoints = manifest.entry_points;

      if (!entryPoints || manifest.type !== 'certified') {
        entries.push({
          origin: origin,
          entry_point: '',
          name: manifest.name
        });
      } else {
        for (var entryPoint in entryPoints) {
          if (entryPoints[entryPoint].icons) {
            entries.push({
              origin: origin,
              entry_point: entryPoint,
              name: entryPoints[entryPoint].name
            });
          }
        }
      }
    }

    return entries;
  }

  function launch(origin, entryPoint) {
    if (!origin || !apps[origin] || !apps[origin].launch) {
      return false;
    }

    entryPoint = entryPoint || '';
    apps[origin].launch(entryPoint);

    return true;
  }

  function getEntryManifest(origin, entryPoint) {
    if (!origin || !apps[origin]) {
      return null;
    }

    var manifest = apps[origin].manifest;

    if (entryPoint) {
      var entry_manifest = manifest.entry_points[entryPoint];
      return entry_manifest || null;
    }

    return manifest;
  }

  function getAppName(origin, entryPoint) {
    var entry_manifest = getEntryManifest(origin, entryPoint);
    if (!entry_manifest) {
      return '';
    }
    return entry_manifest.name;
  }

  function getIconURL(origin, entryPoint, callback) {
    var entry_manifest = getEntryManifest(origin, entryPoint);
    if (! entry_manifest) {
      return false;
    }

    loadIcon({
      url: bestMatchingIcon(apps[origin], entry_manifest),
      onsuccess: function(blob) {
        if (callback) {
          callback(window.URL.createObjectURL(blob));
        }
      },
      onerror: function() {
        if (callback) {
          callback('');
        }
      }
    });

    return true;
  }

  function loadIcon(request) {
    if (!request.url) {
      if (request.onerror) {
        request.onerror();
      }
      return;
    }

    var xhr = new XMLHttpRequest({
      mozAnon: true,
      mozSystem: true
    });

    var icon = request.url;

    xhr.open('GET', icon, true);
    xhr.responseType = 'blob';

    xhr.onload = function onload(evt) {
      var status = xhr.status;

      if (status !== 0 && status !== 200) {
        console.error('Got HTTP status ' + status + ' trying to load icon ' +
                      icon);
        if (request.onerror) {
          request.onerror();
        }
        return;
      }

      if (request.onsuccess) {
        request.onsuccess(xhr.response);
      }
    };

    xhr.ontimeout = xhr.onerror = function onerror(evt) {
      console.error(evt.type, ' while HTTP GET: ', icon);
      if (request.onerror) {
        request.onerror();
      }
    };

    try {
      xhr.send(null);
    } catch (evt) {
      console.error('Got an exception when trying to load icon "' + icon +
            ' +" falling back to cached icon. Exception is: ' + evt.message);
      if (request.onerror) {
        request.onerror();
      }
    }
  }

  function bestMatchingIcon(app, manifest) {
    var max = 0;
    for (var size in manifest.icons) {
      size = parseInt(size, 10);
      if (size > max) {
        max = size;
      }
    }

    var url = manifest.icons[max];
    if (url.indexOf('data:') == 0 ||
        url.indexOf('app://') == 0 ||
        url.indexOf('http://') == 0 ||
        url.indexOf('https://') == 0) {
      return url;
    }
    if (url.charAt(0) != '/') {
      console.warn('`' + manifest.name + '` app icon is invalid. ' +
                   'Manifest `icons` attribute should contain URLs -or- ' +
                   'absolute paths from the origin field.');
      return '';
    }

    if (app.origin.slice(-1) == '/')
      return app.origin.slice(0, -1) + url;

    return app.origin + url;
  }

  function isHiddenApp(role) {
    if (!role) {
      return false;
    }
    return (HIDDEN_ROLES.indexOf(role) !== -1);
  }

  function ready(callback) {
    if (_ready) {
      window.setTimeout(callback);
    } else {
      _readyCallbacks.push(callback);
    }
  }

  window.Applications = {
    init: init,
    getAppEntries: getAppEntries,
    launch: launch,
    getAppName: getAppName,
    getIconURL: getIconURL,
    ready: ready
  };
})();
