var mongoose = require('mongoose');
var express = require('express');
var auth = require('auth');

var mongourl = 'mongodb://localhost/test';
var app = express();
var HTTP_PORT = 4004;

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

    app.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});