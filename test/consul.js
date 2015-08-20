var chai = require('chai');
var should = chai.should();
var simple = require('simple-mock')

var consulOptions = { host: 'consul' };
var consul = require('consul')(consulOptions);

var ConsulConnector = require('../lib/connectors/consul');

describe('consul', function () {
  before(function (done) {
    this.timeout(5000);
    attempts = 0;

    function checkLeader() {
      attempts++;
      consul.status.leader(function (err, l) {
        if (err || !l) {
          if (attempts < 5) {
            return setTimeout(function () {
              checkLeader();
            }, 500);
          } else {
            err = err || new Error('consul failed to initialize: no leader elected');
            return done(err);
          }
        }

        registerService();
      });
    }

    function registerService() {
      consul.agent.service.register('web', function (err) {
        if (err) {
          return done(err);
        }

        done();
      });
    }

    checkLeader();
  });

  it('should be able to get a list of nodes', function (done) {
    var connector = new ConsulConnector({ consul: consul });
    connector.getNodes('web', function (err, nodes) {
      if (err) {
        return done(err);
      }

      should.exist(nodes);
      nodes.length.should.not.equal(0);
      nodes[0].service.should.equal('web');

      done();
    });
  });

  it('should fire a change event when catalog changes', function (done) {
    this.timeout(5000);
    var eventHandlerStub = simple.stub().callFn(function (data) {
      consul.agent.maintenance(false, done);
    });

    var connector = new ConsulConnector({ consul: consul });

    connector.watch();

    setTimeout(function () {
      connector.once('change', eventHandlerStub);
      consul.agent.maintenance(true, function(err) {
        if (err) done(err);
      });
    }, 500);
  });

  it('should not list deregistered services', function (done) {
    var connector = new ConsulConnector({ consul: consul });
    consul.agent.service.deregister('web', function (err) {
      if (err) return done(err);

      connector.getNodes('web', function (err, results) {
        if (err) return done(err);

        results.should.not.equal(0);
        done();
      });
    })
  });

  it('should not list nodes that are in maintenance mode', function (done) {
    this.timeout(5000);

    var connector = new ConsulConnector({ consul: consul });

    connector.watch();

    setTimeout(function () {
      consul.agent.service.register('web', function (err) {
        if (err) {
          return done(err);
        }

        consul.agent.maintenance(true, function(err) {
          if (err) {
            return done(err);
          }

          connector.getNodes('web', function (err, nodes) {
            if (err) {
              return done(err);
            }

            nodes.should.be.empty;
            done();
          });
        });
      });
    }, 500);
  });

  after(function () {
    consul.agent.service.deregister('web', function () { });
  });
});