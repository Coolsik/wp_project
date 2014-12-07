// ------- DB Connection -------
var fs = require('fs');
var mongoose = require('mongoose');
var url = require('url');


//	------ connect to MongoDB ------
mongoose.connect('mongodb://localhost/ex2');
var db = mongoose.connection;

var memberSchema = mongoose.Schema({
	username:'string',
	password:'string'
});

// ------- route functions -------
// Main (page: 0)
exports.index = function(req, res) {
	res.status(200);
	res.render('index', {
		title: 'GCHOI',
		page: 0,
		url: req.url,
		login: req.session.login,
		username: req.session.username
	});
};

// Login Post
exports.login_post = function(req, res) {
	res.status(200);
	// Pull Member info out of MongoDB here...
	Member.findOne({ username: req.username, password: req.password }, function (err, member) {
		if(member != null) {
			req.session.login = 'login';
			req.session.username = req.username;
		};
		res.status(200);
		// after logging in, stay in the current page
		res.redirect(url.parse(req.url,true).query.url);
	});
};
