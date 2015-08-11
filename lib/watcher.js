var _ = require('underscore');
var async = require('async');
var assert = require('assert');
var ejs = require('ejs');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var Watcher = function (options) {
  assert(options.connector, 'connector required');
  assert(options.services, 'services required');

  this.options = options;
};

Watcher.prototype.watch = function (callback) {
  var self = this;
  async.map(_.keys(self.options.services), function (s, done) {
    self.options.connector.getNodes({ service: s }, function (err, results) {
      if (err) {
        return done(err);
      }

      self.options.services[s].nodes = results;
      done();
    });
  }, function (err) {
    self.options.connector.on('change', function () {
      if (!self.renderTimeout) {
        self.renderTimeout = setTimeout(self.render.bind(self), self.options.reloaddelay);
      }
    });

    if (err) {
      return callback(err);
    }

    if (!self.renderTimeout) {
      self.renderTimeout = setTimeout(self.render.bind(self), self.options.reloaddelay);
    }
  });
};

Watcher.prototype.render = function (callback) {
  var self = this;

  self.renderTimeout = null;

  console.log('rendering config file');

  fs.readFile('./templates/nginx.ejs', { encoding: 'utf8' }, function (err, template) {
    if (err) {
      return callback(err);
    }

    var scope = _.omit(self.options, 'connector');
    var output = ejs.render(template, scope);

    self.emit('render', { output: output });

    return callback && callback(null, output);
  });
};

Watcher.prototype.stop = function () {
 this.removeAllListeners();
};

_.extend(Watcher.prototype, EventEmitter.prototype);

module.exports = Watcher;