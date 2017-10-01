var log = require('logger')('autos');
var nconf = require('nconf');
var bodyParser = require('body-parser');
var locate = require('locate');
var serand = require('serand');
var dust = require('dustjs-linkedin');
var errors = require('errors');

var domain = 'autos';
var version = nconf.get('INDEX_' + domain.toUpperCase());
var server = nconf.get('SERVER');
var cdn = nconf.get('CDN');

module.exports = function (router) {

    router.use(bodyParser.urlencoded({extended: true}));

    serand.index(domain, version, function (err, index) {
        if (err) {
            throw err;
        }
        dust.loadSource(dust.compile(index, domain));
        //index page with embedded oauth tokens
        router.all('/auth/oauth', function (req, res) {
            var context = {
                server: server,
                cdn: cdn,
                version: version,
                username: req.body.username,
                access: req.body.access_token,
                expires: req.body.expires_in,
                refresh: req.body.refresh_token
            };
            //TODO: check caching headers
            dust.render(domain, context, function (err, index) {
                if (err) {
                    log.error(err);
                    return res.pond(errors.serverError());
                }
                res.set('Content-Type', 'text/html').status(200).send(index);
            });
        });
        //index page
        router.all('*', function (req, res) {
            //TODO: check caching headers
            var context = {
                server: server,
                cdn: cdn,
                version: version
            };
            //TODO: check caching headers
            dust.render(domain, context, function (err, index) {
                if (err) {
                    log.error(err);
                    return res.pond(errors.serverError());
                }
                res.set('Content-Type', 'text/html').status(200).send(index);
            });
        });
    });
};