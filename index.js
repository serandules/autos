var log = require('logger')('autos');
var nconf = require('nconf');
var bodyParser = require('body-parser');
var locate = require('locate');
var utils = require('utils');
var serand = require('serand');
var dust = require('dustjs-linkedin');
var errors = require('errors');
var serandi = require('serandi');

var domain = 'autos';
var version = nconf.get('INDEX_' + domain.toUpperCase());
var server = utils.serverUrl();
var cdn = nconf.get('CDN');
var googleKey = nconf.get('GOOGLE_KEY');

module.exports = function (router) {

    router.use(bodyParser.urlencoded({extended: true}));

    serand.index(domain, version, function (err, index) {
        if (err) {
            throw err;
        }
        dust.loadSource(dust.compile(index, domain));
        //index page with embedded oauth tokens
        router.all('/auth', function (req, res) {
            var context = {
                server: server,
                cdn: cdn,
                version: version,
                tid: req.body.tid,
                username: req.body.username,
                access: req.body.access_token,
                expires: req.body.expires_in,
                refresh: req.body.refresh_token,
                googleKey: googleKey
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
                server: server,
                cdn: cdn,
                version: version,
                googleKey: googleKey
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
    });
};