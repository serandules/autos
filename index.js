var log = require('logger')('autos');
var nconf = require('nconf');
var bodyParser = require('body-parser');
var dust = require('dustjs-linkedin');
var _ = require('lodash');

var locate = require('locate');
var utils = require('utils');
var serand = require('serand');
var errors = require('errors');
var serandi = require('serandi');

var domain = 'autos';
var version = nconf.get('INDEX_' + domain.toUpperCase());
var server = utils.serverUrl();
var subdomain = utils.subdomain();
var cdn = nconf.get('CDN_STATICS');
var googleKey = nconf.get('GOOGLE_KEY');
var adsense = nconf.get('GOOGLE_ADSENSE');

module.exports = function (router, done) {

  router.use(bodyParser.urlencoded({extended: true}));

  log.info('index:autos', 'version:%s', version);
  serand.index(domain, version, function (err, index) {
    if (err) {
      return done(err);
    }
    log.info('content:autos', 'content:%s', index);
    dust.loadSource(dust.compile(index, domain));
    serand.configs(['boot', 'boot-autos', 'groups'], function (err, configs) {
      if (err) {
        return done(err);
      }
      //index page with embedded oauth tokens
      router.all('/auth', function (req, res) {
        var context = {
          cdn: cdn,
          version: version,
          adsense: adsense,
          googleKey: googleKey,
          server: server,
          subdomain: subdomain,
          configs: configs,
          tid: req.body.tid,
          username: req.body.username,
          access: req.body.access_token,
          expires: req.body.expires_in,
          refresh: req.body.refresh_token
        };
        //TODO: check caching headers
        dust.render(domain, context, function (err, index) {
          if (err) {
            log.error('dust:render', err);
            return res.pond(errors.serverError());
          }
          res.set('Content-Type', 'text/html').status(200).send(index);
        });
      });

      router.use('/apis/*', serandi.notFound);

      //index page
      router.all('*', function (req, res) {
        //TODO: check caching headers
        var context = {
          cdn: cdn,
          version: version,
          adsense: adsense,
          googleKey: googleKey,
          server: server,
          subdomain: subdomain,
          configs: configs
        };
        //TODO: check caching headers
        dust.render(domain, context, function (err, index) {
          if (err) {
            log.error('dust:render', err);
            return res.pond(errors.serverError());
          }
          res.set('Content-Type', 'text/html').status(200).send(index);
        });
      });

      done();
    });
  });
};
