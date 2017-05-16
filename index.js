var log = require('logger')('autos');
var nconf = require('nconf');
var express = require('express');
var bodyParser = require('body-parser');
var locate = require('locate');
var auth = require('auth');
var serandi = require('serandi');
var serand = require('serand');
var dust = require('dustjs-linkedin');

var domain = 'autos';
var version = nconf.get('clients')[domain];
var server = nconf.get('server');
var cdn = nconf.get('cdn');

var app = express();

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/configs\/boot$',
        '^\/apis\/v\/tokens([\/].*|$)',
        '^\/apis\/v\/vehicles$',
        '^\/apis\/v\/vehicle-makes([\/].*|$)',
        '^\/apis\/v\/vehicle-models([\/].*|$)'
    ],
    hybrid: [
        '^\/apis\/v\/menus\/.*'
    ]
});

module.exports = function (done) {
    serand.index(domain, version, function (err, index) {
        if (err) {
            throw err;
        }

        dust.loadSource(dust.compile(index, domain));

        app.use(locate('/apis/v'));
        app.use(serandi.ctx)
        app.use(auth);

        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(bodyParser.json());

        app.use('/apis/v', require('vehicle-service'));
        app.use('/apis/v', require('vehicle-make-service'));
        app.use('/apis/v', require('vehicle-model-service'));

        //error handling
        //app.use(agent.error);

        //index page with embedded oauth tokens
        app.all('/auth/oauth', function (req, res) {
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
                    res.status(500).send({
                        error: 'error rendering requested page'
                    });
                    return;
                }
                res.set('Content-Type', 'text/html').status(200).send(index);
            });
        });
        //index page
        app.all('*', function (req, res) {
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
                    res.status(500).send({
                        error: 'error rendering requested page'
                    });
                    return;
                }
                res.set('Content-Type', 'text/html').status(200).send(index);
            });
        });

        //error handling
        //app.use(agent.error);
        done(null, app);
    });
};