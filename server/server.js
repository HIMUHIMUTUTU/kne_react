var express = require('express');
var path = require('path');
var socket = require('socket.io');
var dirty = require('dirty');
var bodyParser = require('body-parser');
var element_input = require('./routes/element_input');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/element_input', element_input);

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