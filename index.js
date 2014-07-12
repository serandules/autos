var mongoose = require('mongoose');
var express = require('express');
var token = require('serand-token');
var auth = require('auth');

var mongourl = 'mongodb://localhost/test';
var app = express();
var HTTP_PORT = 3000;

auth = auth(token, {
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

    app.use('/apis/v', require('user-service'));
    app.use('/apis/v', require('client-service'));
    app.use('/apis/v', require('vehicle-service'));
    app.use('/apis/v', require('token-service'));

    app.use(express.json());
    app.use(express.urlencoded());

    app.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});