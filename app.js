var express = require('express')
	, socketio = require('socket.io')
	, ejs = require('ejs')
	, busboy = require('connect-busboy')
	, morgan = require('morgan')
	, http = require('http')
	, path = require('path')
	, fs= require('fs')

var app = express();
var router = express.Router();
app.use(morgan());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(busboy());
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
var img;
var RoomName,index=0;
var RoomList = new Array();

var server = http.createServer(app);
server.listen(3000,function() {
	console.log('server running at http://211.189.127.27:3000');
});

var io = socketio.listen(server);
//app.get('/',lobby.lobby);
//app.get('/canvas/:room',canvas.canvas);

app.get('/',function(request,response) {
	fs.readFile('./views/Lobby.html',function(error,data) {
		response.send(data.toString());
	});
});
app.get('/canvas/:room',function(request,response) {
	fs.readFile('./views/Canvas.html','utf8',function(error,data) {
		response.send(ejs.render(data,{
			room : request.param('room')
		}));
		console.log("/canvas/:room");
	});
});
app.get('/room',function(request,response) {
	console.log("list : " + RoomList);
	response.send(RoomList);
});
// busboy : node.js용 데이터 streaming parser
app.post('/canvas/upload',function(request,response) {
	var fstream;
	request.pipe(request.busboy);
	request.busboy.on('file',function(fieldname,file,filename) {
		console.log('Uploading : ' + filename);
		img = __dirname+"\\images\\" + filename;
		fstream = fs.createWriteStream(img);
		file.pipe(fstream);
		fstream.on('close',function() {
			console.log("Upload Finished of " + filename);
			response.redirect('back');
		});
	});
});

io.sockets.on('connection',function(socket) {
	socket.on('join',function(data) {
		socket.join(data);
		//socket.set('room',data);
		socket.room=data;
	});
	socket.on('draw',function(data) {
		//socket.get('room',function(error,room) {
		io.sockets.in(socket.room).emit('line',data);
		//});
	});
	socket.on('create_room',function(data) {
		io.sockets.emit('create_room',data.toString());
		RoomList[index] = data.toString();
		index++;
	});
	socket.on('imagedraw',function(data) {
		setTimeout(function() {
			/*
			console.log("img : " + img);
			var base64Image = new Buffer(img,'binary').toString('base64');
			//var decodedImage = new Buffer(base64Image,'base64').toString('binary');
			console.log("decodedImage : " + base64Image);
			io.sockets.in(socket.room).emit('image',base64Image);
			console.log("image send finish");
			*/
			fs.readFile(img,function(err,original_data) {
				var base64Image = new Buffer(original_data,'binary').toString('base64');
				io.sockets.in(socket.room).emit('image',base64Image);
				console.log("image send finish");
			});
		},1500);
		//io.sockets.in(socket.room).emit('image',data);
		/*
		console.log("img : " + img);
		fs.readFile(img,function(err,buffer) {
			socket.emit('image',{buffer:buffer});
		});
		*/
	});
});
