var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var async = require('async');

var ConsulConnector = function (options) {
  if (!(this instanceof ConsulConnector)) {
    return new ConsulConnector(options);
  }

  var self = this;

  self.options = options;
  if (options && options.consul) {
    self.consul = options.consul;
  } else {
    console.log('initializing consul with', options.connector);
    self.consul = require('consul')(options.connector);
  }
};

ConsulConnector.prototype.watch = function () {
  var self = this;

  self.watch = self.consul.watch({ method: self.consul.catalog.node.list });
  self.watch.on('change', function (data) {
    console.log('consul says things have changed');
    async.map(_.pluck(data, 'Node'),
      self.consul.catalog.node.services.bind(self.consul.catalog.node),
      function (err, results) {

      if (err) {
        return self.emit('error', err);
      }


      var changedNodes = {};
      // iterate through nodes that have services we're interested in
      _.filter(results, function (r) {
        return !!_.intersection(_.keys(r.Services), self.options.services);
      }).forEach(function (n) {
        changedNodes[n.Node.Node] = n;
      });

      _.keys(changedNodes).forEach(function (n) {
        self.emit('change', { node: changedNodes[n].Node.Node, address: changedNodes[n].Node.Address });
      });
    });
  });
};

ConsulConnector.prototype.stop = function () {
  this.watch.end();
  this.removeAllListeners();
};

ConsulConnector.prototype.getNodes = function (options, callback) {
  var self = this;
  if (!self.consul) {
    throw new Error('consul connector not initialized yet');
  }

  self.consul.catalog.service.nodes(options, function (err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, result.map(function (r) {
      return {
        node: r.Node,
        address: r.Address,
        port: r.ServicePort,
        service: r.ServiceID,
        tags: r.ServiceTags
      };
    }));
  });
};

_.extend(ConsulConnector.prototype, EventEmitter.prototype);

module.exports = ConsulConnector;