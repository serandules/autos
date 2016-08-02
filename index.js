var log = require('logger')('autos-services');
var nconf = require('nconf');
var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var agent = require('hub-agent');
var procevent = require('procevent')(process);
var auth = require('auth');
var serandi = require('serandi');
var serand = require('serand');
var dust = require('dustjs-linkedin');

var client = 'autos';
var version = nconf.get('AUTOS_CLIENT');

var app = express();

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/configs\/boot$',
        '^\/apis\/v\/tokens([\/].*|$)',
        '^\/apis\/v\/vehicles$'
    ],
    hybrid: [
        '^\/apis\/v\/menus\/.*'
    ]
});

module.exports = function (done) {
    serand.index(client, version, function (err, index) {
        if (err) {
            throw err;
        }

        dust.loadSource(dust.compile(index, 'index'));

        app.use(serandi.ctx)
        app.use(auth);

        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(bodyParser.json());

        app.use('/apis/v', require('vehicle-service'));

        //error handling
        //app.use(agent.error);

        //index page with embedded oauth tokens
        app.all('/auth/oauth', function (req, res) {
            var context = {
                version: version,
                code: req.body.code || req.query.code,
                error: req.body.error || req.query.error,
                errorCode: req.body.error_code || req.query.error_code
            };
            //TODO: check caching headers
            dust.render('index', context, function (err, index) {
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
                version: version
            };
            //TODO: check caching headers
            dust.render('index', context, function (err, index) {
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