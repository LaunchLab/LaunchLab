var enableArduino = true;		//set this to true if you want arduino sensor access on server side
//var socketconnect = 'http://fluentart.com/';
var socketconnect = '/';

var express = require('express');
var app = express();
var swig = require('swig');

var serveStatic = require('serve-static')
var favicon = require('serve-favicon');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('cookie-session')

var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users", "projects", "external", "talk", "reports"]
var mongojs = require("mongojs");
var db = mongojs.connect(databaseUrl, collections);

var scrypt = require("./scrypt.js"); // modified https://github.com/tonyg/js-scrypt

app.use(function(req, res, next){

  console.log('================================================================');
  console.log('%s %s', req.method, req.url);
  next();
});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(session({
  keys: ['key1', 'key2'],
  secureProxy: false // if you do SSL outside of node
}))

// DATA SCHEMA
// http://spacetelescope.github.io/understanding-json-schema/structuring.html



/*
app.use(function (req, res, next) {
  var n = req.session.views || 0
  req.session.views = ++n
  res.end(n + ' views')
})
*/

app.use(serveStatic(__dirname + '/public', {'index': ['default.html', 'default.htm']}))
//app.use(express.static(__dirname + '/public'));

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

//LOGOUT
app.get('/logout', function (req, res) {
  delete req.session.username;
  delete req.session.password;
  res.redirect('/');
});

//HANDLES LOGIN FORM DATA
app.post('/', function(req, res){
	  var minute = 60 * 1000;
	  console.log("new login/register:")
	  console.log(req.body)
	  console.log("-----")
	  //do login
	  // app.js
	var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(req.body.username), scrypt.encode_utf8(req.body.password), 128, 8, 1, 32);
	var encryptedhex = scrypt.to_hex(encrypted)		

	//finds users in the database that have the same username already
	db.users.find({username: req.body.username}, function(err, users) 
	{
		if ( err || !users) { 
			console.log("DB error"); 
			res.render('login', { foo: "Database error. Database offline?" });
		} else {
			console.log(users)


			if (users.length == 0) {
				//new username
				var newuser = {}

				newuser.username = req.body.username;
				newuser.email = req.body.email;
				newuser.password = encryptedhex;
				newuser.companyname = ""
				newuser.address = ""
				newuser.phonenumber = ""
				newuser.mobile = ""
				newuser.website = ""

				db.users.save( newuser, function(err, saved) 
				{

				  if( err || !saved ) { console.log("User not saved. DB error"); }
				  else { 
				  	//new user registered.
				  	console.log("User saved"); 
				  	socketlog("new user registered: "+req.body.username );
				  	console.log(saved); 
				  	req.session.username = req.body.username
					req.session.password = req.body.password
					req.session.email = req.body.email
				  	res.redirect('back'); 
				  }


				});
			}



			if (users.length == 1) {
				console.log("DB User Found.")
				
				if (users[0].password == encryptedhex) {
					//match!
					console.log("User logged in")
					socketlog("user login: "+req.body.username )
				  	req.session.username = req.body.username
					req.session.password = req.body.password
					req.session.email = req.body.email
					res.redirect('back'); 
				} else {
					//username exists
					//password wrong
					res.render('login', { foo: "Password wrong. This has been logged." });
				}
			}



		}
	});

	//req.session.username = req.body.username
	//req.session.password = req.body.password
	//if (req.body.remember) res.cookie('remember', 1, { maxAge: minute });
    
});




//CHECKS IF USER IS LOGGED IN
//IF NOT THEN SHOW FORM ELSE CONTINUES
app.use(checkAuth);
function checkAuth(req, res, next) {
  if ((!req.session.username)||(!req.session.password)) 
  	{	
  		socketlog("anonymous visitor active on page "+ req.url )
  		res.render('login', { foo: "please login with a new user, or existing username and password." }); 
  	} 
  else {
  

  var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(req.session.username), scrypt.encode_utf8(req.session.password), 128, 8, 1, 32);
  var encryptedhex = scrypt.to_hex(encrypted)

  console.log("AUTH " + req.url)
  console.log(req.session.username);
  console.log(req.session.password);
  console.log(encryptedhex);
  console.log("--------------")
  db.users.find({username: req.session.username, password: encryptedhex}, function(err, users) 
	{
		if ( err || !users) { 
			console.log("DB error. Is mongod running?");
			res.render('login', { foo: "Error. Database offline." });
		} else 
		{

			socketlog("user active: "+req.session.username+" on page "+ req.url )
			console.log("DB " + req.url)
			console.log(users)
			console.log("--------------")
			if (users.length == 1) { 
				req.session.db = users[0];
				next(); 
			}
			if (users.length == 0) { res.render('login', { foo: "wrong username and password. check your CAPSLOCK" }); }
		}
	});


  }

}

/////////////////////////////////////////////////////////////////////
//EVERYTHING BELOW IS FOR LOGGED IN USERS ONLY


//handles account updates
app.post('/account', function(req, res){
	console.log("account detail update:")
	console.log(req.body)
	console.log("-----")

	db.users.update({username: req.session.username}, {'$set' : req.body }, function (err, user) {
		console.log(user)
		res.redirect('/');
	});    
});


app.get('/', function (req, res) {
	var data = { username: req.session.username, email: req.session.email, password: req.session.password, socketserver: socketconnect, userdb: req.session.db };

	if (req.session.username == "rouan") {
		data.admin = true
	}

	db.projects.find({"creator": req.session.username}, function(err, projects) {
		console.log(projects);
		data.projects = projects;

		for (var project in projects) {
			projects[project]._id = JSON.stringify( projects[project]._id ).replace("\"", "").replace("\"", "");
		}

		res.render('account', data);
	})

  	
});

app.get('/project/*', function (req, res) {
	console.log("!!")
	var projectid = req.url.slice(9);

	var ObjectId = mongojs.ObjectId;

	db.projects.findOne({"_id": ObjectId(projectid)}, function(err, project) {
		console.log("FOUND!!")
		console.log(project)
		var a = project._id
		console.log(a)
		project._id = JSON.stringify(project._id);
		project._id.replace("\"", "")

		res.render('project', project);
	})

    
});

app.get('/projects', function (req, res) {
  res.render('projects', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

app.get('/projects/new', function (req, res) {
	//NEW PROJECT FORM
  res.render('projects_new', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

app.post('/projects/new', function (req, res) {
	//CREATE NEW PROJECT
	console.log(req.body)
	res.end("it worked")
	var project = req.body;
	project.creator = req.session.username;
	project.created = Date.now();

	db.projects.save( project, function(err, saved) {
		socketlog("NEW PROJECT CREATED: "+req.body.username );
		console.log("NEW PROJECT CREATED");		
		//res.render('projects_new', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
		res.write("NEW PROJECT CREATED")
	});
});

app.get('/talk', function (req, res) {
  res.render('talk', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

app.get('/external', function (req, res) {
  res.render('external', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

//SUPER ADMIN

app.use(checkAdmin);
function checkAdmin(req, res, next) {
	if (req.session.username == "rouan") {
		//super admin usename
		next();
	}
}

app.get('/admin', function (req, res) {
	db.users.find({}, function(err, users) {
		console.log("ADMIN")
		res.render('admin', { username: req.session.username, password: req.session.password, socketserver: socketconnect, users: users });
	});
});

app.use(errorHandler);

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.send(500, 'Something broke! '+err);
}

/*
	ARDUINO
*/
var SerialPort = require("serialport"); //so we can access the serial port
var scraper = require('json-scrape')();
var arduino;

//DETECT DEVICES AND CONNECT
if (enableArduino == true) {
	SerialPort.list( function (err, ports) {
		for (var num in ports) {
			console.log(ports[num])

			if (ports[num].manufacturer == undefined) {
				//LINUX
				if (ports[num].pnpId.slice(0,5) == "usb-Arduino".slice(0,5)) {
					console.log("Arduino detected")
					arduino = new SerialPort.SerialPort(ports[num].comName, {baudrate: 9600});
					arduConnect(arduino);
				}				
			} else {
				//WINDOWS
				if (ports[num].manufacturer.slice(0,5) == "Arduino".slice(0,5)) {
					console.log("Arduino detected")
					arduino = new SerialPort.SerialPort(ports[num].comName, {baudrate: 9600});
					arduConnect(arduino);
				}
			}

		}
	});
}

var arduConnect = function (connection) {

		console.log('open');
	  	
	  	arduino.on('data', function(data) 
		{				
			scraper.write(data); 
		});


	
} //end arduConnect

scraper.on('data', function (data) {
	//console.log(data)
	//RECORD TO DATABASE


	for (var item in data) {		
		//console.log(item)
		/* 			

			PIN/RELAY DATA HANDLER 			

		*/
		if (item.slice(0,3) == 'pin') {
			//clean data entry (temperature)
			var entry = {}
			entry.type = "digitalpin"
			entry.device = item;
			entry.timestamp = Date.now();
			entry.value = data[item];
			console.log(entry)
			//end clean data entry 
			
			//REALTIME DATA TO CLIENT
			io.sockets.emit("externalfeed", entry)	

			//DO RECORD/SEARCH
			var search = {}
			search.type = entry.type;
			search.device = entry.device;
			search.value = entry.value; //IF NO CHANGE THEN WE SKIP

			
			db.external.find(search, function(err, results) {
				if( err | !results ) { 
					console.log("Sensor data could not be saved. DB error"); 
				} else {
					if (results.length > 0) {
						//console.log("FOUND! Skipping")
					} else {
						//console.log(data)
						console.log("Recording to database")
						db.external.save(entry, function(err, saved) {
							if( err || !saved ) { console.log("Sensor data could not be saved. DB error"); }
						});
						io.sockets.emit("externalhistoryfeed", entry)	
					}	
				}		
			});

			
		}	// END PIN/RELAY
		/* 			

			TEMPERATATURE DATA HANDLER 			

		*/
		if (item.slice(0,4) == 'temp') {
			//clean data entry (temperature)
			var entry = {}
			entry.type = "temperature"
			entry.device = item;
			entry.timestamp = Date.now();
			entry.value = data[item];
			//console.log(entry)
			//end clean data entry 
			
			//REALTIME DATA TO CLIENT
			io.sockets.emit("externalfeed", entry)	

			//DO RECORD
			var search = {}
			search.type = entry.type;
			search.device = entry.device;
			
			search.timestamp = {}
			search.timestamp.$gt = data.timestamp - (1000*60); //any data newer than 1minute then we'll not save to database

			
			db.external.find(search, function(err, results) {
				if( err | !results ) { 
					console.log("Sensor data could not be saved. DB error"); 
				} else {
					if (results.length > 0) {
						//console.log("FOUND! Skipping")
					} else {
						//console.log(data)
						console.log("Recording to database")
						db.external.save(entry, function(err, saved) {
							if( err || !saved ) { console.log("Sensor data could not be saved. DB error"); }
						});
						io.sockets.emit("externalhistoryfeed", entry)	
					}	
				}		
			});

			
		}	// END TEMPERATURE


		//end parse
	}



	
		
});

var socketlog = function(message) {
	io.sockets.emit("log", {message: message})	
	console.log(message)
}

var server = app.listen(80, function() {
	console.log(server.address())
    console.log('Listening on port %d', server.address().port);
});



var io = require('socket.io').listen(server, {log: false});

io.sockets.on('connection', function (socket) {
	console.log("SOCKET New Connection")

	socket.on('authenticate', function(user) {
		console.log("SOCKET User auth: "+user.username)
		socket.username = user.username;
		socket.password = user.password;
  	});
	//to arduino
	socket.on('arduino', function (data) {
	    var test = JSON.stringify(data)    
	    console.log(test);
	    arduino.write(test);
	});

	//external
	socket.on('externalhistory', function(data) {
		db.external.find(data, function(err, results) {
			if( err ) { console.log("Sensor data could not be saved. DB error"); }
			if (results.length > 0) {
				//console.log(results)
				socket.emit('externalhistoryresponse', results)
			}
		});

	})

	//talk
	socket.on('room', function(data) {
		console.log("SOCKET User "+ socket.username +" connected to room: "+data.room)
		socket.room = data.room;
    	socket.join(data.room);
  	});


  socket.on('message', function (data) {
    console.log("SOCKET Message from " + socket.username + " in " + socket.room + ": " + data.messagetext);    
    var nowdate = new Date;
    var formatteddate = formatDate(nowdate);

    io.sockets.in(socket.room).emit('message', {message: { username: socket.username, room: socket.room, text: data.messagetext, timestamp: nowdate.toISOString(), timeformatted: formatteddate }});
  });
  
});


//io.sockets.emit("ardu", {serial: cleandata})		

function formatDate( date ) {
	return date.getFullYear()+"/"+('0'+(date.getMonth()+1)).slice(-2)+"/"+('0'+date.getDate()).slice(-2);
}
