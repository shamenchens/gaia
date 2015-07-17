'use strict';

/* global require, exports */

var utils = require('utils');
var sh = new utils.Commander('sh');

exports.execute = function(options) {
  var appName = utils.getFile(options.APP_DIR).leafName;
  var bower = utils.getFile(options.APP_DIR, 'bower.json');
  if (bower.exists()) {
    // Switch to app dir and silently install bower
    sh.initPath(utils.getEnvPath());
    sh.run(['-c', 'cd ' + options.APP_DIR + ' && bower install -s']);
    sh.run(['-c', 'echo "[app] bower installed on ' + appName + ' app"']);
  }
};
