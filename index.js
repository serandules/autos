var log = require('logger')('autos-services');
var clustor = require('clustor');

var self = 'autos.serandives.com';

clustor(function () {
    var http = require('http');
    var mongoose = require('mongoose');
    var express = require('express');
    var bodyParser = require('body-parser');
    var agent = require('hub-agent');
    var procevent = require('procevent')(process);
    var auth = require('auth');

    var mongourl = 'mongodb://localhost/test';

    var app = express();

    auth = auth({
        open: [
            '^(?!\\/apis(\\/|$)).+',
            '^\/apis\/v\/tokens([\/].*|$)',
            '^\/apis\/v\/vehicles$'
        ],
        hybrid: [
            '^\/apis\/v\/menus\/.*'
        ]
    });

    mongoose.connect(mongourl);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback() {
        log.debug('connected to mongodb : ' + mongourl);

        app.use(auth);

        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(bodyParser.json());

        app.use('/apis/v', require('user-service'));
        app.use('/apis/v', require('client-service'));
        app.use('/apis/v', require('vehicle-service'));
        //app.use('/apis/v', require('token-service'));
        app.use('/apis/v', require('menu-service'));

        //error handling
        //app.use(agent.error);

        var server = http.createServer(app);
        server.listen(0);

        agent('/drones', function (err, io) {
            io.once('connect', function () {
                io.on('join', function (drone) {
                    log.info(drone);
                });
                io.on('leave', function (drone) {
                    log.info(drone);
                });
                procevent.emit('started');
            });
        });
    });
}, function (err, address) {
    log.info('drone started | domain:%s, address:%s, port:%s', self, address.address, address.port);
});

process.on('uncaughtException', function (err) {
    log.debug('unhandled exception ' + err);
    log.debug(err.stack);
});