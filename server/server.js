var express = require('express');
var path = require('path');
var socket = require('socket.io');
var dirty = require('dirty');
var bodyParser = require('body-parser');
var element_input = require('./routes/element_input');
var presentation = require('./routes/presentation');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/element_input', element_input);
app.use('/presentation', presentation);

server = app.listen(8080, function(){
    console.log('server is running on port 8080')
});

io = socket(server);
io.on('connection', function(socket){
    console.log(socket.id);

    socket.on('load_request', function (_data) {
        console.log("startload")
        var db = dirty('kne_element.db');
        db.on('load', function () {
            loaddata = {user: db.get("user"), kne_element: db.get("kne_element"), file: db.get("file")}
            socket.emit('load', loaddata);
        })
    })

    //reply request for get user and file selection
    socket.on('load_request_user_new', function (_data) {
        var user_db = dirty('user.db');
        user_db.on('load', function () {
            loaddata = [];
            user_db.forEach(function(key, val) {
                loaddata.push(val)
              });
            socket.emit('load_user_new', loaddata);
        })
    })

    //reply request for get file and element 
    socket.on('load_request_file_element_new', function (_data) {
        //get file data
        var file_db = dirty('file.db');
        file_db.on('load', function () {
            console.log(_data.file_id);
            let file_data = file_db.get(_data.file_id);

            //get element data
            var element_db = dirty('element.db');
            element_data = [];
            element_db.on('load', function () {
                element_db.forEach(function (key, val) {
                    val.id = key;
                    element_data.push(val);
                })
                //send data to client
                socket.emit('load_file_element_new', {file:file_data, element:element_data});
            })
        })
    })

    //save updated file and element
    socket.on('save_new', function(_data){

        var element_convert_list = []; //list of before_id and after_id

        var element_db = dirty('element.db');
        element_db.on('load', function () {

            //get last element id 
            var last_key = 0;
            element_db.forEach(function (key, val) {
                if (key > last_key) {
                    last_key = key;
                }
            });
            //set new element_id
            for (var ei = 0; ei < _data.element.length; ei++) {
                element_db.set(last_key + 1 + ei, { mode: "dev", author_id: _data.author_id, text: _data.element[ei].text });
                element_convert_list.push([_data.element[ei].id, last_key + 1 + ei]);
            }

            console.log(element_convert_list);

            var file_db = dirty('file.db');
            //convert element id of modified element
            for (var fi = 0; fi < _data.file.length; fi++) {
                for (var ecli = 0; ecli < element_convert_list.length; ecli++) {
                    if (_data.file[fi].id == element_convert_list[ecli][0]) {
                        _data.file[fi].id = element_convert_list[ecli][1];
                    }
                }
            }
            //set file_id
            file_db.set(_data.file_id, _data.file);
        });

    })

});