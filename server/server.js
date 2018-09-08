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
            loaddata = {kne_element: db.get("kne_element"), workspace: db.get("workspace")}
            socket.emit('load', loaddata);
        })
    })

    socket.on('save', function (_data) {
        console.log("startsave")
        var db = dirty('kne_element.db');
        db.on('load', function () {
            //update element
            let id_old_new = [];
            db.update('kne_element', function(_currentdata){
                let len = _currentdata.length;
                let new_element = _currentdata;
                for(let i = 0; i <_data.element.length; i++){
                    new_element.push({id:len+i+1, mode:"dev", author_id:"1", text:_data.element[i].text});
                    //set pair of old id and new id
                    id_old_new.push([_data.element[i].id, len+i+1]);
                }
                return new_element; 
            });
            console.log("es")
            
            //update workspace
            //replace element id to update element id
            let new_workspace =  _data.workspace;
            for(let i = 0; i < new_workspace.length; i++){
                for(let ii = 0; ii < id_old_new.length; ii++){
                    if(new_workspace[i][0] == id_old_new[ii][0]){
                        new_workspace[i][0] = id_old_new[ii][1];
                    }
                }
            }
            console.log("ws")
            //db input
            db.set('workspace', new_workspace, function () {
                console.log('saved')
            });
        })
    })

});