var chai = require('chai');
var should = chai.should();
var simple = require('simple-mock');

var Watcher = require('../lib/watcher');

describe('watcher', function () {
  it('should get nodes on startup', function (done) {
    var connector = {
      getNodes: simple.spy(function () {
        done();
      }),
      on: function () {}
    };

    var watcher = new Watcher({
      port: 80,
      connector: connector,
      reloaddelay: 1000,
      forcessl: false,
      ssl: false,
      services: {
        web: {
          path: '/',
        }
      }
    });

    watcher.watch();
  });

  it('should render config', function (done) {
    var eventHandler = simple.spy(function (data) {
      should.exist(data.output);

      done();
    });

    var watcher = new Watcher({
      port: 80,
      connector: {},
      reloaddelay: 1000,
      forcessl: false,
      ssl: false,
      services: {
        web: {
          path: '/',
          proxydirective: 'proxy_pass',
          nodes: [
            {
              address: '10.0.0.1',
              port: '8003'
            }
          ]
        }
      }
    });

    watcher.on('render', eventHandler);

    watcher.render();
  });
});
