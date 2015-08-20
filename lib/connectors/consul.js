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

  self.nodeWatch = self.consul.watch({ method: self.consul.catalog.node.list });
  self.nodeWatch.on('change', function (data) {
    console.log('consul says things have changed');
    async.map(_.pluck(data, 'Node'),
      self.consul.catalog.node.services.bind(self.consul.catalog.node),
      function (err, results) {

      if (err) {
        return self.emit('error', err);
      }

      // iterate through nodes that have services we're interested in
      var changedNodes = _.filter(results, function (r) {
        return !!_.intersection(_.keys(r.Services), self.options.services);
      });

      self.emit('change', changedNodes.map(function (n) {
        return { node: n.Node.Node, address: n.Node.Address };
      }));
    });
  });

  var serviceHealthChanged = function (data) {
    self.emit('change', data.map(function (n) {
      return { node: n.Node.Node, address: n.Node.Address };
    }));
  };

  self.serviceWatches = [];
  Object.keys(self.options.services).forEach(function (service) {
    var watch = self.consul.watch({ method: self.consul.health.service, options: { service: service } });

    watch.on('change', serviceHealthChanged);

    self.serviceWatches.push(watch);
  });
};

ConsulConnector.prototype.stop = function () {
  this.nodeWatch.end();

  this.serviceWatches.forEach(function (watch) {
    watch.end();
  });

  this.removeAllListeners();
};

ConsulConnector.prototype.getNodes = function (options, callback) {
  var self = this;
  var serviceName = typeof options == 'string' ? options : options.service;

  if (!self.consul) {
    throw new Error('consul connector not initialized yet');
  }

  self.consul.catalog.service.nodes(options, function (err, result) {
    if (err) {
      return callback(err);
    }

    if (result.length === 0) {
      return callback(null, []);
    }

    async.map(result, function (res, done) {
      self.consul.health.node({ node: res.Node }, function (err, health) {
        if (err) {
          return done(err);
        }

        if (health.length === 0) {
          return done(null, res);
        }

        var maintenance = _.find(health, { CheckID: '_node_maintenance' });
        var failingServiceChecks = _.find(health, { ServiceName: serviceName, status: 'critical' });

        res.healthy = !!((maintenance === undefined || maintenance.Status === 'passing') && failingServiceChecks === undefined);

        done(null, res);
      });
    }, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(null, _.filter(result, { healthy: true }).map(function (r) {
        return {
          node: r.Node,
          address: r.Address,
          port: r.ServicePort,
          service: r.ServiceID,
          tags: r.ServiceTags
        };
      }));
    })
  });
};

_.extend(ConsulConnector.prototype, EventEmitter.prototype);

module.exports = ConsulConnector;