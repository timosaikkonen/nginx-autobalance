var _ = require('underscore');
var fs = require('fs');
var childProcess = require('child_process');

var options = require('./lib/options')(process.env);

console.log('configuration:', options);

var Connector = require('./lib/connectors/' + options.connector.name);
var Watcher = require('./lib/watcher');

var connector = new Connector(options);

var watcherOptions = _.omit(options, 'connector');
watcherOptions.connector = connector;

var watcher = new Watcher(watcherOptions);

watcher.on('render', function (data) {
  console.log('writing nginx config file to', options.nginxUpstreamFileName);
  fs.writeFile(options.nginxUpstreamFileName, data.output, function (err) {
    if (err) {
      return console.error('failed to write nginx config file:', err);
    }

    childProcess.exec('nginx -s reload', function (err) {
      if (err) {
        return console.error('nginx reload failed:', err);
      }

      console.log('nginx reloaded successfully');
    });
  });
});

watcher.watch();
connector.watch();

process.on('exit', function () {
  watcher.stop();
  connector.stop();
});