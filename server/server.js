var express = require('express');
var socket = require('socket.io');
var dirty = require('dirty');
var app = express();

server = app.listen(8080, function(){
    console.log('server is running on port 8080')
});

io = socket(server);
io.on('connection', function(socket){
    console.log(socket.id);

    socket.on('load_request', function (data) {
        console.log("startload")
        var db = dirty('kne_element.db');
        db.on('load', function () {
            var loaddata = []
            db.forEach(function (key, val) {
                loaddata.push({ key, val })
            });
            console.log(loaddata);
            socket.emit('load', loaddata);
        })
    })

    socket.on('save', function (_data) {
        console.log("startsave")
        var db = dirty('kne_element.db');
        db.on('load', function () {
            db.set('data', _data, function () {
                console.log('saved')
            });
        })
    })

});