var _ = require('underscore');
var fs = require('fs');

var defaults = {
  port: 80,
  services: {},
  connector: {
    name: 'consul'
  },
  nginxConfigFileName: '/etc/nginx/nginx.conf',
  forcessl: false,
  reloaddelay: 5000
};

var serviceDefaults = {};

module.exports = function (args) {
  var options = {};

  for (var k in args) {
    if (k.indexOf('NGA_') === 0) {
      var parts = k.split('_');
      if (k.substring(4).indexOf('_') === -1) {
        // site-wide options

        options[parts[1].toLowerCase()] = args[k];
      } else {
        // service and connector options
        var optionCategory = parts[1].toLowerCase();
        if (optionCategory === 'services') {
          var serviceName = parts[2].toLowerCase();
          var optionName = parts[3].toLowerCase();

          options[optionCategory] = options[optionCategory] || {};
          options[optionCategory][serviceName] = options[optionCategory][serviceName] || {};

          _.defaults(options[optionCategory][serviceName], serviceDefaults);

          options[optionCategory][serviceName][optionName] = args[k];
        } else if (optionCategory === 'connector') {
          options[optionCategory] = options[optionCategory] || defaults.connector;
          options[optionCategory][parts[2].toLowerCase()] = args[k];
        }
      }
    }
  }

  options.ssl = !!fs.existsSync('/etc/nginx/ssl/cert.key') &&
                !!fs.existsSync('/etc/nginx/ssl/cert.crt');

  _.defaults(options, defaults);

  return options;
};