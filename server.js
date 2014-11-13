var express = require('express'),
	app = express(),
	http = require('http'),
	scrypt = require("./lib/scrypt.js"),
	mailbot = require('./lib/email.js'),
	_ = require('underscore'),
	tokenGenerator = require('./public/js/createToken.js'),
	tokenGetter = require('./public/js/getDataFromToken.js'),
	server = http.createServer(app),
	databaseUrl = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +  process.env.OPENSHIFT_APP_NAME,
	collections = ["users", "projects", "messages","external", "talk", "reports", "creativeapplications", "offerings", "orders", "invoices"],
	mongojs = require("mongojs"),
	db = mongojs.connect(databaseUrl, collections),
	io = require('socket.io').listen(server),
	tempUsername = "Dagan",
	tempPassword = "Pass123",
	tempEmail = "daganread@gmail.com",
	enableEmail = true,
	ip  = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
	port    = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8000,
	redisCloud = {
	  'host' : process.env.REDISCLOUD_URL,
	  'port' : process.env.REDISCLOUD_PORT,
	  'password' : process.env.REDISCLOUD_PASSWORD
	},
	redis = require("redis"),
	login,
	run = 0,
	developement = false;

	if(typeof(redisCloud.host) !== "undefined"){
	  var client = redis.createClient(
	      redisCloud.port,
	      redisCloud.host, {
	        auth_pass: redisCloud.password
	  });
	  client.on("error", function (err) {
		  console.log("Error " + err);
		});
	  console.log(client);
	};
 
	if (typeof ip === "undefined") {
    	console.log('No OPENSHIFT_NODEJS_IP environment variable');
  	};

/* Start the server */

    if (developement) {
		server.listen(8000);
	} else{
		server.listen(port, ip);	
	};

  app.use(express.static(__dirname + '/public'));
  app.use(express.static(__dirname + '/content'));
  app.use(express.static(__dirname + '/bower_components'));

app.post('/login', function (req, res) {
  	var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(req.body.username), scrypt.encode_utf8(req.body.password), 128, 8, 1, 32);
	var encryptedhex = scrypt.to_hex(encrypted);		
  	//finds users in the database that have the same username already
	db.users.find({username: req.body.username}, function(err, users){
		if ( err || !users) { 
			console.log("DB error"); 
			public.emit('request error');
		} else {
			console.log(users)

			if (users.length == 1) {
				console.log("DB User Found.")
				
				if (users[0].password == encryptedhex) {
					//match!
					console.log("User logged in")
				  	res.sendStatus(200)
  					login();
				} else {
					//username exists
					//password wrong
					public.emit('request error');
				}


			} else {
			//ERROR NOT FOUND
			public.emit('request error');
			}
		}
	});
});

  app.get('/', function(req,res) {
    res.sendfile(__dirname + '/index.html');
  });

/*	Socket.io Namespaces	*/
/*
*	Public Communication Chanels
*/
var public = io
  .of('/public')
  .on('connection', function (socket) {
	socket.on('request token', function() {
 		console.log('requested token');
		tokenGenerator.createToken(function (error, token) {
			if (error === null) {
				public.emit('recieve token', token);
			    /*client.set(token, 'Basic ', function(err, reply) {
			        if (err) {
			        	console.log('token not sent or stored!'+err);
			        }else if (reply) {
			            client.expire(token, 600, function(err, reply) {
			                if (err) {
			                	console.log('token not sent or ttl set!');

			                }else if (reply) {
			                    console.log('token sent and stored!');
			                    //public.emit('recieve token', token);
			                }
			                else {
			                    console.log(new Error('Expiration not set on redis'));
			                }
			            });
			        }else {
			            console.log(new Error('Token not set in redis'));
			        }
			    });*/
			}else{
				console.log('requested eroor token');
				public.emit('request error');
			}
		});
	});
	console.log('new connection on public:8000');
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
  });
/*
*	Private Communication Chanels
*/
var restricted = io
	.of('/restricted')
	.on('connection', function (socket) {
		/*	Restrict communication	*/
		socket.auth = false;
		delete restricted.connected[socket.id];
		var buf = [];

		login = function() {
			socket.auth = true;
	        restricted.connected[socket.id] = socket;
	        console.log('new connection on restricted:8000');
		};
	/*
		setTimeout(function(){
			//If the socket didn't authenticate, disconnect it
			if (!socket.auth) {
		    	console.log('Disconnecting socket '+ socket.id);
		    	socket.disconnect();
		    }
		}, 1000);*/

	  	socket.on('request token', function() {
	  		console.log('message called');
	  		restricted.emit('recieve private');
	  	});
		socket.on('disconnect', function(){
			console.log('user disconnected');
		});
	  });