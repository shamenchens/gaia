var rework = require('rework');
var vars = require('rework-vars');
var calc = require('rework-calc');
var move = require('rework-move-media');
var split = require('rework-split-media');
var stringify = require('css-stringify');
var fs = require('fs');

var css = fs.readFileSync('input.css', 'utf8');
var stylesheets = split(rework(css)
	.use(vars())
	.use(move())
	.use(calc)
);
var output = stringify(stylesheets['(min-width: 600px)']);
fs.writeFileSync('output.css', output);