var express = require('express')
	, socketio = require('socket.io')
	, ejs = require('ejs')
	, morgan = require('morgan')
//	, routes = require('./routes')
//	, lobby = require('./routes/lobby')
//	, canvas = require('./routes/canvas')
	, http = require('http')
	, path = require('path')
	, fs= require('fs');

var app = express();
var router = express.Router();
app.use(morgan());
app.use(express.static('public'));
app.use(router);
/*
app.use(app.router);
app.use(express.static('public'));
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//app.get('/',routes.Lobby);
*/
var RoomName,RoomList = " ";
var server = http.createServer(app);
server.listen(3000,function() {
	console.log('server running at http://211.189.127.27:3000');
});

var io = socketio.listen(server);
//app.get('/',lobby.lobby);
//app.get('/canvas/:room',canvas.canvas);

router.get('/',function(request,response) {
	fs.readFile('./views/Lobby.html',function(error,data) {
		response.send(data.toString());
	});
});
router.get('/canvas/:room',function(request,response) {
	fs.readFile('./views/Canvas.html','utf8',function(error,data) {
		response.send(ejs.render(data,{
			room : request.param('room')
		}));
		console.log("/canvas/:room");
	});
});
router.get('/room',function(request,response) {
	RoomList += RoomName;
	console.log("list : " + RoomList);
	//response.send(io.sockets.adapter.rooms);
});
io.sockets.on('connection',function(socket) {
	socket.on('join',function(data) {
		console.log("join data : " + data);
		socket.join(data);
		//socket.set('room',data);
		socket.room=data;
		RoomName = data.toString();
	});
	socket.on('draw',function(data) {
		//socket.get('room',function(error,room) {
		io.sockets.in(socket.room).emit('line',data);
		//});
	});
	socket.on('create_room',function(data) {
		io.sockets.emit('create_room',data.toString());
	});
});
