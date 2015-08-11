var chai = require('chai');
var should = chai.should();

describe('options', function () {
  it('should parse options', function () {
    var env = {
      'NGA_PORT': '80',
      'NGA_SERVICES_WEB_PATH': '/',
      'NGA_SERVICES_WEB_NGINXDIRECTIVE': 'proxy_pass',
      'NGA_SERVICES_API_PATH': '/api',
      'NGA_SERVICES_API_NGINXDIRECTIVE': 'uwsgi_pass',
      'NGA_CONNECTOR_NAME': 'consul',
    };

    var options = require('../lib/options')(env);

    should.exist(options);
    should.exist(options.port, 'options.port');
    should.exist(options.services, 'options.services');
    should.exist(options.services.web, 'options.services.web');
    should.exist(options.services.api, 'options.services.api');

    options.port.should.equal('80');
    options.services.web.path.should.equal('/');
    options.services.web.nginxdirective.should.equal('proxy_pass');
    options.services.api.path.should.equal('/api');
    options.services.api.nginxdirective.should.equal('uwsgi_pass');
    options.connector.name.should.equal('consul');
  });
});