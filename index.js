var debug = require('debug')('serandules:autos-services');
var agent = require('hub-agent');

agent(function () {
    var http = require('http');
    var mongoose = require('mongoose');
    var express = require('express');
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
        debug('connected to mongodb : ' + mongourl);

        app.use(auth);

        app.use(express.json());
        app.use(express.urlencoded());

        app.use('/apis/v', require('user-service'));
        app.use('/apis/v', require('client-service'));
        app.use('/apis/v', require('vehicle-service'));
        app.use('/apis/v', require('token-service'));
        app.use('/apis/v', require('menu-service'));

        //error handling
        app.use(agent.error);

        http.createServer(app).listen(0);
    });
});

process.on('uncaughtException', function (err) {
    debug('unhandled exception ' + err);
    debug(err.stack);
});