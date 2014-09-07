var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var auth = require('auth');
var agent = require('hub-agent');

var mongourl = 'mongodb://localhost/test';
var app = express();

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/tokens([\/].*|$)',
        '^\/apis\/v\/vehicles$'
    ]
});

mongoose.connect(mongourl);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('connected to mongodb : ' + mongourl);

    app.use(auth);

    app.use(express.json());
    app.use(express.urlencoded());

    app.use('/apis/v', require('user-service'));
    app.use('/apis/v', require('client-service'));
    app.use('/apis/v', require('vehicle-service'));
    app.use('/apis/v', require('token-service'));

    agent(http.createServer(app));
});

process.on('uncaughtException', function (err) {
    console.log('unhandled exception ' + err);
    console.log(err.stack);
});