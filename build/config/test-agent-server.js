'use strict';
/* jslint node: true */
/* global TestAgent, server */
var fsPath = require('path');

// All require paths must be absolute -- use __dirname
var Agent = TestAgent,
    Apps = Agent.server,
    Suite = Agent.Suite,
    suite = new Suite({
      paths: [fsPath.resolve(__dirname + '/../../tv_apps/')],
      strictMode: false,
      testDir: '/_test/unit/',
      libDir: 'js/',
      testSuffix: '_test.js'
    });

server.use(Apps.Suite, suite);
