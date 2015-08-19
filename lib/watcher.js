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

Watcher.prototype.refreshNodes = function (callback) {
  var self = this;
  var changed = false;

  async.map(_.keys(self.options.services), function (s, done) {
    self.options.connector.getNodes({ service: s }, function (err, results) {
      if (err) {
        return done(err);
      }

      if (!_.isEqual(self.options.services[s].nodes, results)) {
        changed = true;
      }

      self.options.services[s].nodes = results;

      done();
    });
  }, function (err) {
    if (err) {
      console.error('failed to refresh nodes:', err);
      return callback && callback(err);
    }

    return callback && callback(null, changed);
  });
};

Watcher.prototype.watch = function (callback) {
  var self = this;
  self.refreshNodes(function (err) {
    self.options.connector.on('change', function () {
      self.refreshNodes(function (err, changed) {
        if (changed && !self.renderTimeout) {
          console.log('available nodes have changed, refreshing configuration in %d ms', self.options.reloaddelay);
          self.renderTimeout = setTimeout(self.render.bind(self), self.options.reloaddelay);
        }
      });
    });

    if (err) {
      return callback && callback(err);
    }

    if (!self.renderTimeout) {
      self.renderTimeout = setTimeout(self.render.bind(self), self.options.reloaddelay);
    }

    return callback && callback();
  });
};

Watcher.prototype.render = function (callback) {
  var self = this;

  self.renderTimeout = null;

  console.log('rendering config file');

  fs.readFile('./templates/upstream.ejs', { encoding: 'utf8' }, function (err, template) {
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