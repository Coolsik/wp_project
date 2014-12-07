var express = require('express')
	, socketio = require('socket.io')
	, ejs = require('ejs')
	, busboy = require('connect-busboy')
	, morgan = require('morgan')
	, http = require('http')
	, path = require('path')
	, fs= require('fs')


var bodyParser = require('body-parser');
var crypto = require('crypto');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/user');

var app = express();
var router = express.Router();
app.use(morgan());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(busboy());
app.use(router);
app.use(bodyParser.json());                          // parse application/json
app.use(bodyParser.urlencoded({ extended: true }));  // parse application/x-www-form-urlencoded

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
	fs.readFile('./views/index.html',function(error,data) {
	//fs.readFile('./views/Lobby.html',function(error,data) {
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

var Memo = mongoose.model('MemoModel', MemoSchema);

var UserSchema = mongoose.Schema({
	id:String,
	password:String,
});
var User = mongoose.model('UserModel', UserSchema);

app.post('/LOGIN', function(req,res,next) {
	res.status(200);
	req.password = myHash(req.body.password);

	console.log("name : " + req.body.username);
	console.log("password : " + req.password);
	User.findOne({id: req.body.username, password:req.password}, function(err, member){
		
	console.log("member" + member);
	if(member != null){
		//req.session.login = 'login';
		//req.session.username = req.username;
		console.log("login Success");

		//var createSession = function createSession(){
		//	req.session.login = req.body.username;
		//};

		//console.log(req.session.login);
		fs.readFile('./views/Lobby.html',function(error,data) {
			res.end(req.body.username);
			res.send(data.toString());
		});
	};
		res.status(200);
	});

});

app.post('/SIGNUP', function(req,res){
	User.findOne({id:req.body.usernamesignup}, function(err, member){
		if(member == null){

			var pass, pass_con;
			pass = req.body.passwordsignup;
			pass_con = req.body.passwordsignup_confirm;

			if(pass == pass_con){

				req.passwordsignup = myHash(req.body.passwordsignup);

				var user = new User({id:req.body.usernamesignup,password:req.passwordsignup});
				user.save(function(err,silence){
					if(err){
						console.err(err);
						throw err;
					}
					res.redirect('/');
				});
			}
			else{
				fs.readFile('./views/wrongpass.html',function(error,data) {
					//fs.readFile('./views/Lobby.html',function(error,data) {
					res.send(data.toString());
				});
			}

		}
		else {
			fs.readFile('./views/sameid.html',function(error,data) {
				//fs.readFile('./views/Lobby.html',function(error,data) {
				res.send(data.toString());
			});
			//res.redirect('/#toregister');
		}
		//console.log("name : " + req.body.id);
		//console.log("password : " + req.passwordsignup);
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
		//console.log("base64 string : " + data);
		io.sockets.in(socket.room).emit('image',data);
		console.log("image send finish");
	});
});
