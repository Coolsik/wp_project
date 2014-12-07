var express = require('express')
	, socketio = require('socket.io')
	, ejs = require('ejs')
	, busboy = require('connect-busboy')
	, morgan = require('morgan')
	, http = require('http')
	, path = require('path')
	, fs= require('fs');

var bodyParser = require('body-parser');
var crypto = require('crypto');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ex2');

var app = express();
var router = express.Router();
app.use(morgan());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(busboy());
app.use(router);
app.use(bodyParser.json());                          // parse application/json
app.use(bodyParser.urlencoded({ extended: true }));  // parse application/x-www-form-urlencoded

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
	//fs.readFile('./views/index.html',function(error,data) {
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
		if(filename=="") console.log("NULL");
		else {
			img = __dirname+"\\images\\" + filename;
			fstream = fs.createWriteStream(img);
			file.pipe(fstream);
			fstream.on('close',function() {
				console.log("Upload Finished of " + filename);
				response.redirect('back');
			});
		}
	});
});

// hash Key Generation for Password

var myHash = function myHash(key){
	var hash = crypto.createHash('sha1');
	hash.update(key);
	return hash.digest('hex');
}

var MemoSchema = mongoose.Schema({username:String,password:String});
var ImageSchema = mongoose.Schema({imgname:String});

var SaveImage = mongoose.model('ImageModel',ImageSchema);
var Memo = mongoose.model('MemoModel', MemoSchema);

app.post('/insert', function(req,res){
	/*
	var memo = new Memo({username:req.body.username,memo:req.body.password});
	memo.save(function(err,silence){
		if(err){
			console.err(err);
			throw err;
		}
		res.send('success');
	});
	*/
	req.password = myHash(req.body.password);
	console.log("name : " + req.body.username);
	console.log("password : " + req.password);
	
});

io.sockets.on('connection',function(socket) {
	socket.on('join',function(data) {
		socket.join(data);
		//socket.set('room',data);
		socket.room=data;
	});
	socket.on('draw',function(data) {
		//socket.get('room',function(error,room) {
		console.log(data);
		io.sockets.in(socket.room).emit('line',data);
		//});
	});
	socket.on('create_room',function(data) {
		console.log("room name : " +data);
		io.sockets.emit('create_room',data.toString());
		RoomList[index] = data.toString();
		index++;
	});
	socket.on('imagedraw',function(data) {
		//console.log("base64 string : " + data);
		var img_num = parseInt(data[0]) + 1;
		var imgdata = data.substr(img_num,data.length);
		var imgname = data.substr(1,img_num-1);
		var base64str = imgdata.split("base64,");
		var decodedimage = new Buffer(base64str[1],'base64');
		var img_path=__dirname+"\\images\\" + imgname +".jpg";
		var save_img = new SaveImage({imgname:imgname});
/*
		fs.readFile(img_path,function(err,data) {
			var bas = new Buffer(data,'binary').toString('base64');
			if(bas == base64str[1]) console.log("image matching");
		});
		*/
		fs.writeFile(img_path,decodedimage,function(err) {
			console.log(err);
		});
		save_img.save(function(err,silence) {
			if(err){
				console.err(err);
				throw err;
			}
			console.log('success');
		});
		setTimeout(function() {
			SaveImage.findOne({imgname:imgname},function(err,result) {
				var rename = result.imgname, bas,last;
				rename = __dirname+"\\images\\"+result.imgname+".jpg";
				console.log("result : " + rename);
				fs.readFile(rename,function(err,readimg) {
					bas = new Buffer(readimg,'binary').toString('base64');
					last = "data:image/jpeg;base64," + bas;
					console.log("data : " + imgdata);
					console.log("last : " + last);
					if(imgdata == last) console.log('equals data');
					//bas = "data:image/jpeg;base64," + bas;
					io.sockets.in(socket.room).emit('image',last);
					console.log("image send finish");
				});
			});
		},2000);
	});
	socket.on('imageMove',function(data) {
		//console.log(data);
		io.sockets.in(socket.room).emit('redraw',data);
	});
});
