/* 	LaunchLab 0.1 
	
	Developed by Rouan van der Ende (rouan@8bo.org)

	OpenSource under MIT licence
	- - - - - - - - - - - - -

	To run in production mode with emails and cacheing enabled:

	# sudo NODE_ENV=production nodemon server	

	

	- - - - - - - - - - - - - -

	Cool ASCII Titles from (use banner3 font):
	http://www.network-science.de/ascii/
*/

/* BITCOIN MASTER ACCOUNT */

var bitcoinMasterWallet = "1EZ6S8YqfxzfMKCCtpzKeEJW1qMthQnCuD";
var domain = "launchlab.me";

var production = false;	
if (process.env.NODE_ENV == "production") {
	production = true;
	console.log("\nSTARTING LAUNCHLAB in PRODUCTION mode. Enabled caching and emails.\n\n")
} else {
	console.log("\nSTARTING LAUNCHLAB in DEVELOPMENT mode. Use for production:\n\tsudo NODE_ENV=production nodemon server\n\n")
}

var enableEmail = production;		
var enableArduino = false;		//set this to true if you want arduino sensor access on server side

//var socketconnect = 'http://fluentart.com/';
var socketconnect = '/';

var express = require('express');

var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')
var fs = require('fs');
var app = express();
var swig = require('swig');
var marked = require('marked'); // https://github.com/chjj/marked

var https = require('https');

var serveStatic = require('serve-static')
var favicon = require('serve-favicon');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('cookie-session')
var compress = require('compression');

var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users", "projects", "messages","external", "talk", "reports", "creativeapplications", "offerings", "orders", "invoices", "payments"]
var mongojs = require("mongojs");
var db = mongojs.connect(databaseUrl, collections);

var scrypt = require("./scrypt.js"); // modified https://github.com/tonyg/js-scrypt

app.use(compress());

app.use(favicon(__dirname + '/public/favicon.ico'));

/* BITCOIN PAYMENT INCOMING */


app.get('/paymentcallback/:id', function (req, res) {
	var invoiceid = req.params.id
	//to seperate phplike url parameters
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log(query);
	db.payments.save(query);

	var ObjectId = mongojs.ObjectId;
	console.log(" ** PAYMENT RECIEVED! **");

	db.invoices.findOne({"_id": ObjectId(invoiceid)}, function (err, invoice) {
		
		if (invoice.paymentsrecords == undefined) {
			invoice.paymentsrecords = [];
		}
		
		io.to(invoice.blockchainapi.input_address).emit('payment', "completed");

		invoice.paymentsrecords.push(query);
		db.invoices.update({"_id": ObjectId(invoiceid)}, invoice); //UPDATES INVOICE IN DATABASE
		res.send("*ok*");	
	})
});

app.get('/payments', function (req, res) {
	io.sockets.in("test").emit('payment', "completed");
	db.payments.find({}, function (err, results) {
		res.json(results);
	});
})

/* END BITCOIN PAYMENT INCOMING */




app.use(function(req, res, next) {

	if (req.url == "/") {
		io.sockets.emit("activity", {led: "1.0"})	
	}

	//HANDLE FILE UPLOADS
	var expectmulti = false;

	if (req.method === 'POST') {
		
		if (req.url.slice(0,'/upload'.length) === '/upload') {
			
			expectmulti = true;
		}

		if (req.url.slice(0,'/offerings/imageupload/'.length) === '/offerings/imageupload/') {
			
			expectmulti = true;
		}		

		if (req.url.slice(0,'/offerings/edit/'.length) === '/offerings/edit/') {
			
			expectmulti = true;
		}

		if (req.url.slice(0,'/project/upload/'.length) === '/project/upload/') { expectmulti = true; }		
		if (req.url == "/profile/uploadavatar") { expectmulti = true; }		
		
	}

	
	if (expectmulti) {
	    var form = new multiparty.Form();

	    form.parse(req, function(err, fields, files) {
	      //res.end(util.inspect({fields: fields, files: files}));
	      req.multipartparse = {fields: fields, files: files}
	      req.files = files;
	      next();
	    });

	} else {
		console.log('%s %s', req.method, req.url);
		next();
	}
});


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(session({
  keys: ['key1', 'key2'],
  secureProxy: false // if you do SSL outside of node
}))

//APP and theme
app.use(serveStatic(__dirname + '/public', {'index': ['default.html', 'default.htm']}))
//USER CONTENT
app.use(serveStatic(__dirname + '/content', {'index': ['default.html', 'default.htm']}))

//app.use(express.static(__dirname + '/public'));

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');


function limitlng (input, idx) { 


	if(input.length > idx) {
	    input = input.substring(0,idx-1)+"...";
	}

	return input; }
swig.setFilter('limitlng', limitlng);




////////////////
// CACHING 

app.set('view cache', production);

if (production == true) {
	swig.setDefaults({ cache: 'memory' });
} else {
	swig.setDefaults({ cache: false });
}

///////////////
//LOGOUT
app.get('/logout', function (req, res) {
  delete req.session.username;
  delete req.session.password;
  res.redirect('/');
});

var mailbot = require('./lib/email')
mailbot.debug = false;	

if (enableEmail) {
	mailbot.server.listen(25, domain);	
}


/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

app.get('/market', function (req, res) {
	db.offerings.find({}, function(err, results) {
		for (var x in results) {
			results[x].offering_id = results[x]._id.toHexString();
		}
		res.render('market', { username: req.session.username, password: req.session.password, socketserver: socketconnect, offerings: results });
	})//end find
	
})


/*   ANGULAR 


*/


app.get('/ang', function (req, res) {
	//swig.setDefaults({ varControls: ['<%=', '%>'] }); //. Defaults to ['{{', '}}'].
	res.sendFile(__dirname + '/views/angular.html')
	//swig.setDefaults({ varControls: ['{{', '}}'] })
});


app.get('/register', function (req, res) { 
	if (req.session.username) {
		res.redirect('/');
	} else {
		res.render('register');
	}
})




/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 



##     ## #### ######## ##      ## 
##     ##  ##  ##       ##  ##  ## 
##     ##  ##  ##       ##  ##  ## 
##     ##  ##  ######   ##  ##  ## 
 ##   ##   ##  ##       ##  ##  ## 
  ## ##    ##  ##       ##  ##  ## 
   ###    #### ########  ###  ###  


*/




app.get('/offerings/view/:id', function (req, res) {
	//bugfix chop to correct length
	var mongoid = req.params.id;

	var ObjectId = mongojs.ObjectId;

	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect}
	data.session = req.session;

	db.offerings.findOne({"_id": ObjectId(mongoid) }, function (err, result) {			
			if (result) {
				result.offering_id = result._id.toHexString();
				result.descriptionmarked = marked(result.description);
				console.log(result);

				if (result.views == undefined) { result.views = 0; }
				result.views = result.views + 1;

				db.offerings.update({"_id": ObjectId(mongoid) }, result)

				var editbool = 0;
				if (req.session.username == "rouan") { editbool = 1}
				if (req.session.username == result.creator) { editbool = 1}
				db.users.findOne({username:result.creator}, function (err, creatorresult) {
					data.offering = result;
					data.editable = editbool;
					data.creator = creatorresult;
					data.jsonimages = JSON.stringify(result.samplefiles);
					data.avatar = "";
					if (req.session.email) { data.avatar = gravatar.url(req.session.email, {s: '100', r: 'pg', d: '404'});	}
					 
					res.render('offerings_view', data);	
				})
			} else res.render('error', data);
	})
  	
});

/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

app.get('/tow/attendance', function (req, res) {
	var data = {}
	data.socketserver = socketconnect;
	data.students = []

	data.studentcounttotal = 15;
	data.studentcountpresent = 0;
	data.studentcountabsent = 0;
	data.studentcountexempt = 0;
	data.studentcountwork = 0;

	for (var a = 0; a < data.studentcounttotal; a++) {
		var student = {}
		student.name = "Name"
		student.surname = "Surname"
		student.count = a+1;
		student.number = 46400 + Math.round(Math.random()*500)
		data.students.push(student)
	}

	res.render('tow_attendance', data)
});

/*


##     ##  ######  ######## ########  
##     ## ##    ## ##       ##     ## 
##     ## ##       ##       ##     ## 
##     ##  ######  ######   ########  
##     ##       ## ##       ##   ##   
##     ## ##    ## ##       ##    ##  
 #######   ######  ######## ##     ## 


*/

app.get('/user/:ids', function (req, res) {
	console.log(req.params)
	var ObjectId = mongojs.ObjectId;

	var data = {username: req.session.username, password: req.session.password}
	data.socketserver = socketconnect;

	db.users.find({"_ids": ObjectId(req.params.id)}, function(err, users) {
		if (err) {
			res.status(404);
			res.render('error', data)
		} else {
			console.log(users)
			if (users.length != 1) {
				res.status(404);
				res.render('error', data)
			} else {
				console.log("FOUND")
				data.user = users[0];

				db.offerings.find({"creator":data.user.username, title: {"$ne": ""}}, function (err, offerings) {
					data.offerings = offerings;
					res.render('user', data)			
				})

				
			}
			
		}
		
	})
	
});

app.get('/:username', function (req, res,next) {
	var data = {username: req.session.username, password: req.session.password}
	data.session = req.session;
	data.socketserver = socketconnect;

	db.users.find({"username": req.params.username}, function(err, users) {
		if (err) {
			res.status(404);
			res.render('error', data)
		} else {
			if (users.length != 1) {
				next();
			} else {

				console.log("FOUND")
				data.user = users[0];

				data.avatar = gravatar.url(users[0].email, {s: '100', r: 'pg', d: '404'});
				//, title: {"$ne": ""}
				db.offerings.find({"creator":data.user.username, title: {"$ne": ""}}, function (err, offerings) {
					data.offerings = offerings;
					res.render('user', data)			
				})

				
			}
			
		}
		
	})
	
});


//OPENWINDOW TEST
app.post('/login', function (req, res) {
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
			res.render('home', { foo: "Database error. Database offline?" });
		} else {
			console.log(users)

			if (users.length == 1) {
				console.log("DB User Found.")
				
				if (users[0].password == encryptedhex) {
					//match!
					console.log("User logged in")
					socketlog("user login: "+req.body.username )
				  	req.session.username = req.body.username
					req.session.password = req.body.password
					req.session.email = users[0].email
					res.redirect("/"); 
				} else {
					//username exists
					//password wrong
					res.render('login', { loggedout: true, message: "Invalid username and/or password. This has been logged." });
				}


			} else {
			//ERROR NOT FOUND
			res.render('login', { loggedout: true, message: "Invalid login. This has been logged." });
			}
		}
	});
})

app.post('/', function(req, res){
	  var minute = 60 * 1000;

	  //do login
	  // app.js
	var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(req.body.username), scrypt.encode_utf8(req.body.password), 128, 8, 1, 32);
	var encryptedhex = scrypt.to_hex(encrypted)		

	//finds users in the database that have the same username already
	db.users.find({username: req.body.username}, function(err, users) 
	{
		if ( err || !users) { 
			res.render('home', { foo: "Database error. Database offline?" });
		} else {
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
				//newuser.level = 0;



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
				  	/////////////////////////

				  	//SEND EMAIL WHEN THERES A NEW USER

				  	//start email
				  	if (enableEmail) 
				  	{
		  				var email = {}
						email.from = "noreply@launchlabapp.com";
						email.fromname = "Launch Lab Signups";
						email.rcpt = "rouan@8bo.org";
						email.rcptname = "Rouan van der Ende";
						email.subject = "Launch Lab Admin notice new user "+req.body.username+" registered";
						email.body = "This is a notice to let you know a new user signed up. Username:"+req.body.username+" Email: "+req.body.email;

						mailbot.sendemail(email, function (data) 
						{
							console.log("EMAIL SENT")
							
							var emailK = {}
							emailK.from = "noreply@launchlabapp.com";
							emailK.fromname = "Launch Lab Signups";
							emailK.rcpt = "kevin@openwindow.co.za";
							emailK.rcptname = "Kevin Lawrie";
							emailK.subject = "Launch Lab Admin notice new user "+req.body.username+" registered";
							emailK.body = "This is a notice to let you know a new user signed up. Username:"+req.body.username+" Email: "+req.body.email;

							mailbot.sendemail(emailK, function (data) 
							{
								console.log("EMAIL SENT")
							})
						})
					} 
					// end email
		




				  	////////////////////////
				  }


				});
			}



			if (users.length == 1) {
				console.log("DB User Found.")
				res.redirect("/login")
			}



		}
	});

	//req.session.username = req.body.username
	//req.session.password = req.body.password
	//if (req.body.remember) res.cookie('remember', 1, { maxAge: minute });
    
});


/////////////////////////////////////////////////////////////////////
//LOGGED IN OPTIONAL

/*
 #######  ########  ########  ######## ########  
##     ## ##     ## ##     ## ##       ##     ## 
##     ## ##     ## ##     ## ##       ##     ## 
##     ## ########  ##     ## ######   ########  
##     ## ##   ##   ##     ## ##       ##   ##   
##     ## ##    ##  ##     ## ##       ##    ##  
 #######  ##     ## ########  ######## ##     ## 


 - - - - - - - - - -   OPTIONAL LOGGED IN - - - - - - - - - - - - - -  */

app.post('/offerings/contact/*', function (req, res) {
	console.log(req.body)
	//CREATE AN ORDER 

	//IF NEW USER, CREATE ACCOUNT AND EMAIL TO VERIFY

	//SAVE TO DATABASE


	//SEND EMAIL
  	//start email
  	if (enableEmail) 
  	{
		var email = {}
		email.from = "noreply@launchlabapp.com";
		email.fromname = "Launch Lab Contact";
		email.subject = "Launch Lab Admin notice new message";
		email.body = "This is a notice to let you know a new message has been recieved.\r\n"
		email.body += JSON.stringify(req.body)+"\r\n"
		email.body += JSON.stringify(req.session.username)+"\r\n";
		
		email.rcpt = "rouan@8bo.org";
		email.rcptname = "Rouan van der Ende";
		
		mailbot.sendemail(email, function (data) 
		{
			email.rcpt = "kevin@openwindow.co.za";
			email.rcptname = "Kevin Lawrie";
			
			mailbot.sendemail(email, function (data) { console.log("EMAIL SENT"); })
		})
	} 
	// end email	


	res.render('offerings_confirm', { username: req.session.username, password: req.session.password, socketserver: socketconnect, userdb: req.session.db });
});




app.get('/offerings/quote/:id', function (req, res) {
	//bugfix chop to correct length
	var mongoid = req.params.id

	var ObjectId = mongojs.ObjectId;

	db.offerings.findOne({"_id": ObjectId(req.params.id)}, function(err, result) {
		console.log("finding offering")
		console.log(result)
		
		if (result) {
			result.offering_id = req.params.id;
			if ((!req.session.username)||(!req.session.password)) 
  			{	
  				res.redirect("/register");
  			} else {
				var project = {}
				project.projecttitle = result.title;
				project.offeringid = ObjectId(req.params.id);
				project.offering = result;
				project.projectdetails = "future projectdetails";

				project.creator = req.session.username;
				project.created = Date.now();
				project.status = "new"
				project.paid = 0;
				project.used = 0;
				console.log(project)

  				db.projects.save( project , function (err, resultp) {

  					res.redirect("/project/brief/"+resultp._id.toHexString());	
  				});
  				
  				//res.render('offerings_order', { username: req.session.username, password: req.session.password, socketserver: socketconnect, offering: result, userdb: req.session.db });
  			}

			
		} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
	})
});


app.get('/offerings/order/:id', function (req, res) {
	//bugfix chop to correct length
	var mongoid = req.params.id

	var ObjectId = mongojs.ObjectId;

	db.offerings.findOne({"_id": ObjectId(req.params.id)}, function(err, result) {
		console.log("finding offering")
		console.log(result)
		
		if (result) {
			result.offering_id = req.params.id;
			if ((!req.session.username)||(!req.session.password)) 
  			{	
  				res.redirect("/register");
  			} else {
				var project = {}
				project.projecttitle = result.title;
				project.offeringid = ObjectId(req.params.id);
				project.offering = result;
				project.projectdetails = "future projectdetails";
				project.price = result.price;
				project.creator = req.session.username;
				project.created = Date.now();
				project.status = "new"
				project.paid = 0;
				project.used = 0;
				console.log(project)

  				db.projects.save( project );
  				res.redirect("/cart");
  				//res.render('offerings_order', { username: req.session.username, password: req.session.password, socketserver: socketconnect, offering: result, userdb: req.session.db });
  			}

			
		} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
	})
});



var gravatar = require('gravatar');

//CHECKS IF USER IS LOGGED IN
//IF NOT THEN SHOW FORM ELSE CONTINUES
app.use(checkAuth);
function checkAuth(req, res, next) {
  if ((!req.session.username)||(!req.session.password)) 
  	{	
  		if (req.url == "/login") {
  			res.render('login', { loggedout: true, loginpage: true } ); 
  		} else {

  			//MAIN ENTRY FOR VISITORS
  			socketlog("anonymous visitor active on page "+ req.url )

  			if (req.url == '/') {
				
  				
				var data = {};
				db.offerings.find({"title": { "$ne": "" }}, function(err, results) {
					var sorted = results.sort(function(a,b) { return b.created - a.created } );
					for (var a in sorted) {
						sorted[a].id = sorted[a]._id.toHexString();
						sorted[a].description = "...";
					}
					data.offerings = sorted;
					
					data.offeringsjson = JSON.stringify(sorted);
					console.log("DEBUG")
					res.render('home', data);
				})





  			} else {
  				res.redirect('/login');
  			}
  			
  		}
  		
  	} 
  else {
  

  var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(req.session.username), scrypt.encode_utf8(req.session.password), 128, 8, 1, 32);
  var encryptedhex = scrypt.to_hex(encrypted)


  db.users.find({username: req.session.username, password: encryptedhex}, function(err, users) 
	{
		if ( err || !users) { 
			console.log("DB error. Is mongod running?");
			res.render('home', { foo: "Error. Database offline." });
		} else 
		{

			socketlog("user active: "+req.session.username+" on page "+ req.url )

			console.log("--------------")
			if (users.length == 1) { 
				req.session.db = users[0];
				//gravatar
				// https://github.com/emerleite/node-gravatar
				var avatar = gravatar.url(req.session.db.email, {s: '200', r: 'pg', d: '404'});
				req.session.avatar = users[0].avatar;
				/*

					status = new     -new cart item, not paid for yet and not started on yet
					status = paid    -paid for in full

				*/
				db.projects.find({"creator":req.session.username, "status": "new"}, function (err, projects) {
					
					req.session.carttotal = 0;
					for (var x in projects) {
						if (projects[x].price) {
							req.session.carttotal += projects[x].price - projects[x].paid;	
						}
						
					}
									
					next();
				})

 
			}
			if (users.length == 0) { res.render('home', { foo: "wrong username and password. check your CAPSLOCK" }); }
		}
	});


  }

}
/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/*

 ######  ########  ######  ##     ## ########  #### ######## ##    ## 
##    ## ##       ##    ## ##     ## ##     ##  ##     ##     ##  ##  
##       ##       ##       ##     ## ##     ##  ##     ##      ####   
 ######  ######   ##       ##     ## ########   ##     ##       ##    
      ## ##       ##       ##     ## ##   ##    ##     ##       ##    
##    ## ##       ##    ## ##     ## ##    ##   ##     ##       ##    
 ######  ########  ######   #######  ##     ## ####    ##       ##    

*/


/* #######################################################################  MUST BE LOGGED IN BELOW ######### */







/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//EVERYTHING BELOW IS FOR LOGGED IN USERS ONLY

app.use(enforceLogin);
function enforceLogin(req, res, next) {
  if ((!req.session.username)||(!req.session.password)) 
  	{	
  		res.render('login', { loggedout: true, loginpage: true } ); 
  	}
  	else {
  		next();
  	}
  	
}




app.get('/login', function (req, res) { 

	res.render('login', { loginpage: true });
})


/*


 ######     ###    ########  ######## 
##    ##   ## ##   ##     ##    ##    
##        ##   ##  ##     ##    ##    
##       ##     ## ########     ##    
##       ######### ##   ##      ##    
##    ## ##     ## ##    ##     ##    
 ######  ##     ## ##     ##    ##   


*/



app.get('/cart', function (req,res) {
	//Displays the user's cart.
	console.log("cart")
	console.log(JSON.stringify(req.session));
	db.projects.find({"creator":req.session.username}, function (err, projects) {
		var cartitems = []
		for (var item in projects) {

			if (projects[item].paid < projects[item].price) {
				cartitems.push(projects[item])
			}

			projects[item].funded = (projects[item].paid - projects[item].used) / projects[item].price * 100.0;
			projects[item].completed = projects[item].used / projects[item].paid * 100.0;


			
		}
		res.render('cart', { username: req.session.username, password: req.session.password, userdb: req.session.db, session: req.session, cart: cartitems, projects: projects });			
	});
})


app.get('/cart/delete/:id', function (req,res) {
	//delete an item from customer cart, before payment
	var ObjectId = mongojs.ObjectId;
	console.log("cart delete item")

	var deleteid = req.params.id;
	db.projects.remove({"creator":req.session.username, "_id": ObjectId(deleteid) }, function (err, orders) {
		res.redirect("/cart");
	});
})

/*

########     ###    ##    ## ##     ## ######## ##    ## ######## 
##     ##   ## ##    ##  ##  ###   ### ##       ###   ##    ##    
##     ##  ##   ##    ####   #### #### ##       ####  ##    ##    
########  ##     ##    ##    ## ### ## ######   ## ## ##    ##    
##        #########    ##    ##     ## ##       ##  ####    ##    
##        ##     ##    ##    ##     ## ##       ##   ###    ##    
##        ##     ##    ##    ##     ## ######## ##    ##    ##    


*/

app.get('/payment', function (req, res) {



    /* USER CLICKED MAKE PAYMENT
    we create a new order and save their cart contents and payment details so we can confirm payment confirmation
    */

    //CART CONTENTS UNPAID FOR (INVOICE BASICLLY)
	/*

		status = new     -new cart item, not paid for yet and not started on yet
		status = paid    -paid for in full

	*/
	db.projects.find({"creator":req.session.username, "status": "new", paid: 0 } , function (err, projects) {
		//calculate cart total
		var carttotal = 0;
		for (var x in projects) {
			carttotal += projects[x].price;

			/* JIPPO PAYMENT - debug*/
			projects[x].paid = projects[x].price;
			var ObjectId = mongojs.ObjectId;
			
			db.projects.update({"_id": projects[x]._id}, projects[x] , function (err, result) {
				console.log("PAID PROJECT")
			})

			/* END JIPPO PAYMENT - debug*/
		}



		//create invoice
		var invoice = {}
		invoice.creator = req.session.username;
		invoice.created = Date.now();
		invoice.status = "new";

		//calculate total for the invoice
		//todo: taxes and shipping
		invoice.total = 0;
		for (var p in projects) {
			invoice.total += projects[p].price;
		}
		
		invoice.issuedate = new Date(); // MM/DD/YYYY
		invoice.payments = 0;
		invoice.from = {}; 	//launchlab company?
		invoice.for = req.session.username;;
		invoice.items = projects;

		db.invoices.save(invoice, function (err, result) {
			var invoiceid = result._id.toHexString();
			//GOT INVOICE ID.

			/* BLOCKCHAIN API START */
			/* https://blockchain.info/api/receive?method=create&address=$receiving_address&callback=$callback_url */
			var btc_address = bitcoinMasterWallet;
		    var api_url = 'https://blockchain.info/api/receive';
		    var callback_url = 'http://launchlabapp.com/paymentcallback/'+invoiceid;

		    var url = api_url + '?method=create&address=' + btc_address + '&callback=' + encodeURIComponent(callback_url);
			if (btc_address)
		    {
		        https.get(url, function(resp) {
		            //console.log("Calling Blockchain API at " + url)
		            var body = '';

		            resp.on('data', function(chunk) {
		                body += chunk;
		            });

		            resp.on('end', function() {
		                try
		                {
		                    //console.log('Blockchain returns: ' + body);

		                    invoice.blockchainapi = JSON.parse(body);
		                    var ObjectId = mongojs.ObjectId;
		                    db.invoices.update({"_id": ObjectId(invoiceid)}, invoice, function (err, result) {
		                    	res.json(JSON.parse(body));
		                    } )
		                    
		                }
		                catch(e)
		                {
		                	console.log(e)
		                    res.json({"error":e})
		                }           

		            });
		        }).on('error', function(e) {
		        	console.log(e)
		            res.json({"error":e})
		        });
		    }
		    /* BLOCKCHAIN API END */
		
		})//SAVED INVOICE
	});//END PROJECTS/CART FIND
});//END ROUTE





/*

 #######  ########  ########  ######## ########  
##     ## ##     ## ##     ## ##       ##     ## 
##     ## ##     ## ##     ## ##       ##     ## 
##     ## ########  ##     ## ######   ########  
##     ## ##   ##   ##     ## ##       ##   ##   
##     ## ##    ##  ##     ## ##       ##    ##  
 #######  ##     ## ########  ######## ##     ## 

 */



app.get('/offerings/neworder/:id', function (req, res) {
	//ADD TO CART
	//adds a certain offering to a user's cart. Effectively letting them build their own quote/invoice.
	//bugfix chop to correct length

	var mongoid = req.params.id
	var ObjectId = mongojs.ObjectId;

	db.offerings.findOne({"_id": ObjectId(req.params.id)}, function(err, result) {
		console.log("finding offering")
		console.log(result)
		if (result) {
			result.offering_id = req.params.id;

				var blankOrder = {}
				blankOrder.creator = req.session.username;
				blankOrder.created = Date.now();
				blankOrder.offeringid = req.params.id;
				blankOrder.status = "new";
				blankOrder.title = "";
				blankOrder.description = "";
				blankOrder.price = "";
				blankOrder.samplefiles = [];

				db.orders.save(blankOrder, function (err, result) {
					console.log("new order made")
					console.log(result)
					var orderid = result._id.toHexString();
					res.redirect("/orders/edit/"+orderid); //this should redirect to the new blank offering once we have a database entry
				})
			
		} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
	})
});











app.post('/profile/uploadavatar', function (req, res) {
	var uploadedFilenames = []
	for (var f in req.multipartparse.files.file) {
		if (req.multipartparse.files.file[f].size > 0) {
			var source = fs.createReadStream(req.multipartparse.files.file[f].path);
			
			//extension check
			var a = req.multipartparse.files.file[f].originalFilename;
			var aext = a.slice(a.length-4, a.length)
			console.log(aext)



			var newfilename = Date.now()+req.multipartparse.files.file[f].originalFilename
			var dest = fs.createWriteStream(__dirname+'/content/avatars/'+newfilename);

			console.log("COPY FILE!!! IF YOU GET A CRASH MAKE SURE /content/avatars folder exists")
			uploadedFilenames.push(newfilename) 

			source.pipe(dest);

			source.on('end', function() { 
			/* copied */
				
			});
			source.on('error', function(err) { /* error */ });
		}
	}

	db.users.findOne({"username": req.session.username }, function(err, user) {
		user.modified = Date.now();
		user.avatar = uploadedFilenames[0]
		db.users.update({"username": req.session.username }, user, function(err, result) {
			console.log(result);
			res.end("success");
		});
		//end update
		

	});
	
});




app.post('/profile', function (req,res) {
	db.users.update({username: req.session.username}, {'$set' : req.body }, function (err, user) {
		console.log(user)
		res.redirect('/')
	});  
})

app.get('/profile', function (req,res) {
	var data = { username: req.session.username, password: req.session.password, email: req.session.email, socketserver: socketconnect, userdb: req.session.db  }
	data.session = req.session;
	res.render('profile', data);
})


//CREATIVES
app.get('/creatives/apply', function (req, res) {
	//Apply as creative form
  	res.render('creatives_apply', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

//CREATIVES
app.post('/creatives/applyform', function (req, res) {
	//Apply as creative form
	console.log("applyform")
	console.log(req.body)
	//save application to database
	var creativeApplication = req.body;
	creativeApplication.username = req.session.username;
	creativeApplication.email = req.session.email;
	db.creativeapplications.save(creativeApplication)
	//send emails
	if (enableEmail) 
  	{
		var email = {}
		email.from = "noreply@launchlabapp.com";
		email.fromname = "Launch Lab Applications";
		email.rcpt = "rouan@8bo.org";
		email.rcptname = "Rouan van der Ende";
		email.subject = "New creative application from "+req.body.username+" needs moderation.";
		email.body = "A user applied to become a LaunchLab creative.\n\r";
		email.body += "\n\r"
		email.body += JSON.stringify(creativeApplication)
		email.body += "\n\r"

		mailbot.sendemail(email, function (data) 
		{
			console.log("EMAIL SENT")
			
			var emailK = {}
			emailK.from = "noreply@launchlabapp.com";
			emailK.fromname = "Launch Lab Applications";
			emailK.rcpt = "kevin@openwindow.co.za";
			emailK.rcptname = "Kevin Lawrie";
			emailK.subject = "New creative application from "+req.body.username+" needs moderation.";
			emailK.body = "A user applied to become a LaunchLab creative.\n\r";
			emailK.body += "\n\r"
			emailK.body += JSON.stringify(creativeApplication)
			emailK.body += "\n\r"
			mailbot.sendemail(emailK, function (data) 
			{
				console.log("EMAIL SENT")
			})
		})
	}
	//thank the user
  	res.render('creatives_applyformdone', { username: req.session.username, email: req.session.email, password: req.session.password, socketserver: socketconnect });
});

//CREATIVES
app.get('/creatives/applyform', function (req, res) {
	//Apply as creative form
  	res.render('creatives_applyform', { username: req.session.username, email: req.session.email, password: req.session.password, socketserver: socketconnect });
});

//LAUNCHLAB MAIN
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

/*






FRONT






*/

//DASHBOARD FOR USERS
app.get('/', function (req, res) {



	var data = { username: req.session.username, email: req.session.email, password: req.session.password, socketserver: socketconnect, userdb: req.session.db };

	if (req.session.username == "rouan") {
		data.admin = true
	}

	///////

	db.offerings.find({"title": { "$ne": "" }}, function(err, results) {
					var sorted = results.sort(function(a,b) { return b.created - a.created } );
					for (var a in sorted) {
						sorted[a].id = sorted[a]._id.toHexString();
						sorted[a].description = "..."
						
					}
					data.offerings = sorted;
					//data.avatar = gravatar.url(req.session.email, {s: '100', r: 'pg', d: '404'});
					data.offeringsjson = JSON.stringify(sorted);
					data.session = req.session;

					res.render('home', data);
				})

	/*
	//PROJECTS DASHBOARD
	db.projects.find({"creator": req.session.username}, function(err, projects) {
		console.log(projects);
		

		for (var project in projects) {
			projects[project]._id = JSON.stringify( projects[project]._id ).replace("\"", "").replace("\"", "");
			var nowdate = new Date(projects[project].created);
			projects[project].createdformatted = nowdate.toISOString();

			var updateddate = new Date(projects[project].created);
			projects[project].updatedformatted = updateddate.toISOString();
			//
		}
		data.projects = projects;
		////// OFFERINGS DASHBOARD
		db.offerings.find({"creator": req.session.username}, function(err, offerings) {
			console.log(offerings);
			

			for (var project in offerings) {
				offerings[project]._id = JSON.stringify( offerings[project]._id ).replace("\"", "").replace("\"", "");
				var nowdate = new Date(offerings[project].created);
				offerings[project].createdformatted = nowdate.toISOString();

				if (offerings[project].modified) {
					var updateddate = new Date(offerings[project].modified);
					offerings[project].updatedformatted = updateddate.toISOString();
				} else {
					offerings[project].updatedformatted = offerings[project].createdformatted
				}
				
				//
			}
			data.offerings = offerings;
			res.render('home', data);
		})//end find

		
	})//end find
	*/
  	
});

/*


########  ########   #######        ## ########  ######  ######## 
##     ## ##     ## ##     ##       ## ##       ##    ##    ##    
##     ## ##     ## ##     ##       ## ##       ##          ##    
########  ########  ##     ##       ## ######   ##          ##    
##        ##   ##   ##     ## ##    ## ##       ##          ##    
##        ##    ##  ##     ## ##    ## ##       ##    ##    ##    
##        ##     ##  #######   ######  ########  ######     ##    

*/
var ObjectId = mongojs.ObjectId;




app.post('/project/upload/:id', function (req, res) {


	//bugfix chop to correct length
	var mongoid = req.params.id; // req.url.slice( '/offerings/edit/'.length );
	var ObjectId = mongojs.ObjectId;



	var uploadedFilenames = []
	for (var f in req.multipartparse.files.file) {
		console.log("= = = = = = = = = = = = = = = = = =  ")
		console.log(req.multipartparse.files.file[f])
		console.log("= = = = = = = = = = = = = = = = = = ")
		if (req.multipartparse.files.file[f].size > 0) {

			var source = fs.createReadStream(req.multipartparse.files.file[f].path);

			//var dest = fs.createWriteStream(__dirname+'/files'+req.multipartparse.files.file[f].path);
			console.log("work - extension limit")
			console.log(req.multipartparse.files.file[f].originalFilename)
			//extension check
			var a = req.multipartparse.files.file[f].originalFilename;
			var aext = a.slice(a.length-4, a.length)
			console.log(aext)


			var newfilename = Date.now()+req.multipartparse.files.file[f].originalFilename
			var dest = fs.createWriteStream(__dirname+'/content/projectfiles/'+newfilename);

			console.log("COPY FILE!!! IF YOU GET A CRASH MAKE SURE /content/projectfiles folder exists")
			uploadedFilenames.push(newfilename) 

			source.pipe(dest);

			source.on('end', function() { 
			/* copied */
				
			});
			source.on('error', function(err) { /* error */ });
		}
	}

	db.projects.findOne({"_id": ObjectId(mongoid)}, function(err, project) {
		project.modified = Date.now();
		if (project.brief == undefined) { project.brief = {}; }

		if (project.brief.samplefiles) { /* do nada */ } else { project.brief.samplefiles = []; }

		for (var file in uploadedFilenames) {
			var curfile = uploadedFilenames[file];
			project.brief.samplefiles.push(curfile) 
			/* sockets */

			db.users.findOne({"username":req.session.username}, function (err, user) {
				var nowdate = new Date;
			    var formatteddate = formatDate(nowdate);
			    var messagedata = {}
				messagedata.message = { username: req.session.username, avatar: user.avatar, email: user.email, room: req.params.id, timestamp: nowdate.toISOString(), timeformatted: formatteddate }
			    messagedata.message.text = '<img src="/projectfiles/'+curfile+'">'+curfile;
			    //messagedata.message.text = 'new upload';
			    io.sockets.in(req.params.id).emit('message', messagedata);
			    db.messages.save(messagedata)
			});	
			/* end sockets */			
		}


	
		db.projects.update({"_id": ObjectId(mongoid)}, project, function(err, updatedproject) {
			
			if (updatedproject) {
				res.redirect('/project/'+mongoid)
			} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
		});
		//end update
		

	});
	
});




app.post('/project/brief/:id', function (req, res) {
	//get a project briefing
	console.log(req.params)
	console.log(req.body)
	
	//find the project
	db.projects.findOne({"_id":ObjectId(req.params.id)}, function (err, project) {
		if (project.brief == undefined) { 
			project.brief = req.body; 
		} else {
			req.body.brief.samplefiles = project.brief.samplefiles;
		}

		project.brief = req.body;
		db.projects.update({"_id":ObjectId(req.params.id)}, project, function (err, result) {
			res.json({"result":result})



			//SEND EMAILS WHEN BRIEF RECIEVED

			if (enableEmail) 
		  	{
				var email = {}
				email.from = "noreply@launchlabapp.com";
				email.fromname = "Launch Lab";
				email.subject = "Incoming brief from "+req.session.username+".";
				email.body = "A user submitted a brief.\n\r";
				email.body += "LINK:\n\r"
				email.body += "http://launchlab.me/project/"+project._id.toHexString();
				email.body += "\n\r"
				email.body += "BRIEF:\n\r"
				email.body += JSON.stringify(req.body)
				email.body += "\n\r"
				email.body += "PROJECT:\n\r"
				email.body += JSON.stringify(project)
				email.body += "\n\r"
				
				email.rcpt = "rouan@8bo.org";
				email.rcptname = "Rouan van der Ende";
				
				mailbot.sendemail(email, function (data) { 
					console.log("EMAIL SENT"); 
					email.rcpt = "kevin@openwindow.co.za";
					email.rcptname = "Kevin Lawrie";
					mailbot.sendemail(email, function (data) { console.log("EMAIL SENT"); });
				});
			}

			//END BRIEF EMAILS
		});
	});
});

app.get('/project/brief/:id', function (req, res) {
	//get a project briefing
	console.log(req.params)
	console.log(req.body)
	
	var data = {}
	data.username = req.session.username;
	data.password = req.session.password; 
	data.email = req.session.email;
	data.socketserver = socketconnect;

	//find the project
	db.projects.findOne({"_id":ObjectId(req.params.id)}, function (err, project) {
		data.project = project;
		res.render("project_brief",data)
	});
});



app.post('/project/:id/tasks/update/:created', function (req, res) {
	//find the project
	db.projects.findOne({"_id":ObjectId(req.params.id)}, function (err, project) {
		if (project.tasks == undefined) { project.tasks = []}
		//find the individual sub task
		for (var t in project.tasks) {
			if (project.tasks[t].created == req.params.created) {
				//found task

				switch (project.tasks[t].status) {
                    case "new":
                        {  project.tasks[t].status = "started"; 
                        	req.body.started = Date.now();
                        	req.body.startedby = req.session.username;

                    	}
                        break;
                    case "started":
                        {  project.tasks[t].status = "completed";  
                        	req.body.completed = Date.now();
                        	req.body.completedby = req.session.username;

                    	}
                        break;
                }

				project.tasks[t] = req.body;
				db.projects.update({"_id":ObjectId(req.params.id)},project, function (err, result) {
					res.end('1')
				})
			}
		}
		//update task
		//update project entry in database
	});//endfindone
});

app.post('/project/:id/tasks/new', function (req, res) {

	req.body.status = "new"
	var ObjectId = mongojs.ObjectId;
	db.projects.findOne({"_id":ObjectId(req.params.id)}, function (err, result) {
		if (result.tasks == undefined) { result.tasks = []}
		req.body.created = Date.now();
		req.body.creator = req.session.username;
		result.tasks.push(req.body);
		var createddate = new Date(req.body.created);
		req.body.createdformatted = createddate.toISOString();

		//update db
		db.projects.update({"_id":ObjectId(req.params.id)}, result, function (err, result) {
			res.end(JSON.stringify(req.body))
		});
		//end update
	})
	
})

app.get('/paid/:id', function (req, res) {
	//debug
	var projectid = req.params.id;
	var ObjectId = mongojs.ObjectId;
	db.projects.findOne({"_id": ObjectId(projectid)}, function(err, project) {
		project.paid = project.price;
		
		db.projects.update({"_id": ObjectId(projectid)}, project, function(err,result) {
			res.redirect("/work/invoices")
		});
	});
});


app.get('/project/:id', function (req, res) {
	var data = {}
	data.username = req.session.username;
	data.password = req.session.password; 
	data.email = req.session.email;
	data.socketserver = socketconnect;
	data.session = req.session;


	var projectid = req.params.id;
	var ObjectId = mongojs.ObjectId;

	db.projects.findOne({"_id": ObjectId(projectid)}, function(err, project) {

		if (project) {
			project.id = project._id.toHexString();
			//project._id = JSON.stringify(project._id);

			if (project.tasks == undefined) { project.tasks = []}
			project.tasks = project.tasks.sort(function(a,b) { return b.created - a.created } );

			data.project = project;

			var createddate = new Date(project.created);
			project.createdformatted = createddate.toISOString();
			db.messages.find( { "message.room" : project.id}, function (err, messages) {
				//avatars


				data.messagearray = JSON.stringify(messages);

				var projectjson = JSON.stringify(project);
				data.projectjson = projectjson


				res.render('project', data);
			} )
		} else {
			res.status(404);
			data.message = "The project was not found in the database. Was it removed?"
			res.render('error', data)
		}
		

		
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
	//CREATE NEW PROJECT (MANUAL ENTRY) 
	//USUALLY CLIENTS WOULD CLICK ADD TO CART WHICH AUTO FILLS OUT PROJECT

	//res.end("it worked")
	var project = req.body;
	project.creator = req.session.username;
	project.created = Date.now();
	project.status = "new"
	project.costtodate = 0;
	db.projects.save( project, function(err, saved) {
		
		console.log("NEW PROJECT CREATED");		
		console.log(saved)
		console.log("====================");		
		var projectid = saved._id.toHexString();
		socketlog("NEW PROJECT CREATED: "+projectid);
		//res.render('projects_new', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
		res.end(projectid)

		if (enableEmail) {
			//test email sending
			var email = {}
			email.from = "noreply@launchlabapp.com";
			email.fromname = "Launch Lab Projects";
			email.rcpt = "rouan@8bo.org";
			email.rcptname = "Rouan van der Ende";
			email.subject = "Launch Lab Projects - "+req.session.username+" created new project.";
			email.body = "User "+req.session.username+" created a new project http://launchlabapp.com/project/"+projectid;
			email.body += "\n\r"
			email.body += JSON.stringify(project)
			email.body += "\n\r"

			mailbot.sendemail(email, function (data) {
				console.log("EMAIL SENT")
					//test email sending
					var emailK = {}
					emailK.from = "noreply@launchlabapp.com";
					emailK.fromname = "Launch Lab Projects";
					emailK.rcpt = "kevin@openwindow.co.za";
					emailK.rcptname = "Kevin Lawrie";
					emailK.subject = "Launch Lab Projects - "+req.session.username+" created new project.";
					emailK.body = "User "+req.session.username+" created a new project http://launchlabapp.com/project/"+projectid;
					emailK.body += "\n\r"
					emailK.body += JSON.stringify(project)
					emailK.body += "\n\r"
					
					mailbot.sendemail(emailK, function (data) {
						console.log("EMAIL SENT")
					})
			})
		} else { console.log("EMAIL DISABLED. NOT IN PRODUCTION MODE.")}
			
	});
});


/*
 #######  ######## ######## ######## ########   ######  
##     ## ##       ##       ##       ##     ## ##    ## 
##     ## ##       ##       ##       ##     ## ##       
##     ## ######   ######   ######   ########   ######  
##     ## ##       ##       ##       ##   ##         ## 
##     ## ##       ##       ##       ##    ##  ##    ## 
 #######  ##       ##       ######## ##     ##  ######  
*/

//uploads

app.get('/offerings/new', function (req, res) {

	var blankOffering = {}
	blankOffering.creator = req.session.username;
	blankOffering.created = Date.now();
	blankOffering.status = "pending";
	blankOffering.title = "";
	blankOffering.description = "";
	blankOffering.price = "";
	blankOffering.samplefiles = [];

	db.offerings.save(blankOffering, function (err, result) {
		console.log("new offering made")
		console.log(result)
		var offeringid = result._id.toHexString();
		res.redirect("/offerings/edit/"+offeringid); //this should redirect to the new blank offering once we have a database entry
	})
});

/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


app.post('/offerings/imagedelete/', function (req, res) {
	console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")

    console.log(req.body) // with multipart there is no body.
	console.log("- - - - - - - - - - - -")


	/////////
	//db.offerings.find({"creator": req.session.username }, function(err, results) {
	db.offerings.find({}, function(err, results) {
		for (var a in results) {
			for (var b in results[a].samplefiles) {
				if (results[a].samplefiles[b] == req.body.delimage) {

					var ObjectId = mongojs.ObjectId;
					var newcopy = results[a]
					newcopy.samplefiles.splice(b,1);
					db.offerings.update({"_id": ObjectId(results[a]._id)}, newcopy, function(err, results) {
						console.log("BOOM FOUND AGAIN")
					});
					//- - - - -
				}
			}
		}
	});
	/////////
	
	
});





app.post('/offerings/imageupload/:id', function (req, res) {
	console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")

    //console.log(req.body) // with multipart there is no body.
	console.log(req.multipartparse)

	//bugfix chop to correct length
	var mongoid = req.params.id; // req.url.slice( '/offerings/edit/'.length );
	var ObjectId = mongojs.ObjectId;

	console.log("multipartfiles:")
	console.log(req.multipartparse.files)

	var uploadedFilenames = []
	for (var f in req.multipartparse.files.file) {
		console.log("= = = = = = = = = = = = = = = = = =  ")
		console.log(req.multipartparse.files.file[f])
		console.log("= = = = = = = = = = = = = = = = = = ")
		if (req.multipartparse.files.file[f].size > 0) {

			var source = fs.createReadStream(req.multipartparse.files.file[f].path);

			//var dest = fs.createWriteStream(__dirname+'/files'+req.multipartparse.files.file[f].path);
			console.log("work - extension limit")
			console.log(req.multipartparse.files.file[f].originalFilename)
			//extension check
			var a = req.multipartparse.files.file[f].originalFilename;
			var aext = a.slice(a.length-4, a.length)
			console.log(aext)
			if (aext == ".jpg") { console.log("correct")} else {
				alert("test");
				console.log("block");
				res.send("/error");
				return;
				
			}

			var newfilename = Date.now()+req.multipartparse.files.file[f].originalFilename
			var dest = fs.createWriteStream(__dirname+'/content/offerings/'+newfilename);

			console.log("COPY FILE!!! IF YOU GET A CRASH MAKE SURE /content/offerings folder exists")
			uploadedFilenames.push(newfilename) 

			source.pipe(dest);

			source.on('end', function() { 
			/* copied */
				
			});
			source.on('error', function(err) { /* error */ });
		}
	}

	db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		var oldOffering = result;

		var newOffering = oldOffering
		newOffering.modified = Date.now();

		for (var file in uploadedFilenames) {
			if (newOffering.samplefiles) { 
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			} else {
				newOffering.samplefiles = []
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			}
		}

	
		db.offerings.update({"_id": ObjectId(mongoid)}, newOffering, function(err, result) {
			console.log(result)
			if (result) {
				//res.render('thankyou', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
				res.redirect('/offerings/view/'+mongoid)
			} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
		});
		//end update
		

	});
	
});

app.post('/offerings/edit/:id', function (req, res) {
	console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")

    //console.log(req.body) // with multipart there is no body.
	console.log(req.multipartparse)

	//bugfix chop to correct length
	var mongoid = req.params.id; // req.url.slice( '/offerings/edit/'.length );
	var ObjectId = mongojs.ObjectId;

	console.log("multipartfiles:")
	console.log(req.multipartparse.files)

	var uploadedFilenames = []
	for (var f in req.multipartparse.files.upload) {
		console.log("= = = = = = = = = = = = = = = = = =  ")
		console.log(req.multipartparse.files.upload[f])
		console.log("= = = = = = = = = = = = = = = = = = ")
		if (req.multipartparse.files.upload[f].size > 0) {

			var source = fs.createReadStream(req.multipartparse.files.upload[f].path);

			//var dest = fs.createWriteStream(__dirname+'/uploads'+req.multipartparse.files.upload[f].path);
			
			var newfilename = Date.now()+req.multipartparse.files.upload[f].originalFilename
			var dest = fs.createWriteStream(__dirname+'/content/offerings/'+newfilename);

			console.log("COPY FILE!!!")
			uploadedFilenames.push(newfilename) 

			source.pipe(dest);

			source.on('end', function() { 
			/* copied */
				
			});
			source.on('error', function(err) { /* error */ });
		}
	}

	db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		var oldOffering = result;

		var newOffering = oldOffering
		newOffering.modified = Date.now();
		newOffering.title = req.multipartparse.fields.title[0]
		newOffering.description = req.multipartparse.fields.description[0]
		newOffering.price = parseFloat(req.multipartparse.fields.price[0]);
		newOffering.typeoption = req.multipartparse.fields.typeoption[0]
		newOffering.saleoption = req.multipartparse.fields.saleoption[0]
		console.log("- - - -")
		console.log(req.multipartparse.fields)

		for (var file in uploadedFilenames) {
			if (newOffering.samplefiles) { 
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			} else {
				newOffering.samplefiles = []
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			}
		}

		if ((newOffering.title == '')||(newOffering.description == '')) {
			res.redirect('/offerings/edit/'+mongoid+'?err=1')
		} else {
			//start update
			db.offerings.update({"_id": ObjectId(mongoid)}, newOffering, function(err, result) {
				console.log(result)
				if (result) {
					//res.render('thankyou', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
					res.redirect('/offerings/view/'+mongoid)
				} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
			});
			//end update
		}

	});
	
});


/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

app.get('/offerings/edit/:id', function (req, res) {


	//bugfix chop to correct length
	var mongoid = req.params.id;

	var ObjectId = mongojs.ObjectId;

	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect}

	db.offerings.findOne({"_id": ObjectId(req.params.id)}, function(err, result) {

		result.offering_id = result._id.toHexString();
		
		if (result) {
			var editbool = 0;
			if (result.creator == req.session.username) { editbool = 1}
			if (req.session.username == "rouan") {editbool = 1}	
			data.offering = result;

			console.log(result)

			data.editable = editbool;
			res.render('offerings_edit', data);
		} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
	})

  	
});
/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */



app.get('/offerings/confirm/*', function (req, res) {


	//bugfix chop to correct length
	var mongoid = req.url.slice( '/offerings/confirm/'.length );
	mongoid = mongoid.slice(0,24); //the length of a mongo id

	var ObjectId = mongojs.ObjectId;

	db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		console.log("finding offering")
		console.log(result)
		result.offering_id = result._id.toHexString();
		if (result) {
			//SUCCESSFUL ORDER
			res.render('offerings_confirm', { username: req.session.username, password: req.session.password, socketserver: socketconnect, offering: result, userdb: req.session.db });
			
			if (enableEmail) {
				//test email sending
				var email = {}
				email.from = "noreply@launchlabapp.com";
				email.fromname = "Launch Lab Orders";
				email.rcpt = "rouan@8bo.org";
				email.rcptname = "Rouan van der Ende";
				email.subject = "Launch Lab Orders - "+req.session.username+" placed an order.";

				email.body = "Order Details\n"
				email.body += "================\n"	
				email.body += "Title: "+result.title+"\n";
				email.body += "Page: http://launchlabapp.com/offering/"+mongoid+"\n";	
				email.body += "Price: "+result.price+"\n";	
				email.body += "\n"
				email.body += "Customer Details\n"
				email.body += "================\n"
				email.body += "Fullname: "+req.session.db.fullname+"\n"
				email.body += "Username: "+req.session.db.username+"\n"
				email.body += "Email: "+req.session.db.email+"\n"
				email.body += "Phone: "+req.session.db.phonenumber+"\n"
				email.body += "Shortbio: "+req.session.db.shortbio+"\n"
				email.body += "Location: "+req.session.db.location+"\n"
				email.body += "\n"

				mailbot.sendemail(email, function (data) {
					email.rcpt = "kevin@openwindow.co.za";
					email.rcptname = "Kevin Lawrie";
					mailbot.sendemail(email, function (data) { console.log("EMAIL SENT"); })
				});

			}


		} else res.render('error', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
	})

  	
});

/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

app.get('/offerings/delete/*', function (req, res) {
	console.log("deleting offering")
	

	//bugfix chop to correct length
	var mongoid = req.url.slice( '/offerings/delete/'.length );
	mongoid = mongoid.slice(0,24); //the length of a mongo id
	var ObjectId = mongojs.ObjectId;

	//////////
	db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
			console.log(result)
			
			if ((req.session.username == "rouan") || (result.creator == req.session.username)) {
				//start del
					
					db.offerings.remove({"_id": ObjectId(mongoid)}, function(err, result) {
							console.log("REMOVED");
							res.redirect('/');
					});
					

				//end del
			}
		
	})
	//////////



});

/*
	=========================================================
*/

app.get('/talk', function (req, res) {
  res.render('talk', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

app.get('/external', function (req, res) {
  res.render('external', { username: req.session.username, password: req.session.password, socketserver: socketconnect });
});

/*
##      ##  #######  ########  ##    ## 
##  ##  ## ##     ## ##     ## ##   ##  
##  ##  ## ##     ## ##     ## ##  ##   
##  ##  ## ##     ## ########  #####    
##  ##  ## ##     ## ##   ##   ##  ##   
##  ##  ## ##     ## ##    ##  ##   ##  
 ###  ###   #######  ##     ## ##    ## 

all the functionality under /work.

this will include:
------------------
dashboard 	/work
invoices	/work/invoices
clients		/work/clients
projects 	/work/projects
tasks 		/work/tasks
pricing 	/work/pricing		lets users set prices on their goods/services

*/

app.get('/work', function (req, res) {
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect};

	db.projects.find({}, function (err, result) {
		data.projects = result;

		for (var r in result) {
			var createddate = new Date(result[r].created);
			result[r].createdformatted = createddate.toISOString();
			var updateddate = new Date(result[r].created);
			result[r].updatedformatted = updateddate.toISOString();			
		}

		res.render('work', data);	
	})

});

app.get('/work/invoices', function (req, res) {
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect};
	
	db.invoices.find({"creator": req.session.username}, function (err, result) {
		data.invoices = result;
		res.render('work_invoices', data);	
	});
});

app.get('/work/invoices/new', function (req, res) {
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect, userdb: req.session.db};

	db.invoices.find({"creator": req.session.username}, function (err, result) {
		var invoice = {}

		var lastid = 0;

		//start lastid update (update lastid to new number automatically)
		if (result.length > 0) {
			// has invoiced before		
			for (var num in result) {
				if (result[num].id != undefined) { 
					console.log("DEBUG"+result[num].id)
					if (result[num].id >= lastid) { lastid = result[num].id + 1;}
				}
			}
		} 
		//end lastid update (update lastid to new number automatically)
		invoice.id = lastid;
		invoice.creator = req.session.username;
		invoice.created = Date.now();
		invoice.status = "draft";
		invoice.issuedate = new Date(); // MM/DD/YYYY
		invoice.duedate = new Date(invoice.issuedate);
		invoice.duedate.setDate(invoice.duedate.getDate()+14)
		invoice.subject = ""
		invoice.payments = 0;
		invoice.deposit = 100/100; // amount payable.. 
		invoice.orderNumber = ""
		invoice.from = req.session.db; //gets the user data
		invoice.for; //who the invoice is for
		invoice.items = [];
		
		db.invoices.save(invoice, function (err, result) {
			var dbid = result._id.toHexString();
			res.redirect("/work/invoices/edit/"+dbid); //takes us to the new blank invoice
		})

	});

});

app.get('/work/invoices/edit/:id', function (req, res) {
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect, userdb: req.session.db};
	var dbid = req.params.id;
	var ObjectId = mongojs.ObjectId;

	db.invoices.findOne({"_id": ObjectId(dbid)}, function (err, result) {
		data.invoice = result;
		res.render('work_invoices_edit', data);	
	});
});

app.get('/work/invoices/view/:id', function (req, res) {
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect, userdb: req.session.db};
	var dbid = req.params.id;
	var ObjectId = mongojs.ObjectId;

	db.invoices.findOne({"_id": ObjectId(dbid)}, function (err, result) {
		data.invoice = result;
		res.render('work_invoices_view', data);	
	});
});

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
   ###    ########  ##     ## #### ##    ## 
  ## ##   ##     ## ###   ###  ##  ###   ## 
 ##   ##  ##     ## #### ####  ##  ####  ## 
##     ## ##     ## ## ### ##  ##  ## ## ## 
######### ##     ## ##     ##  ##  ##  #### 
##     ## ##     ## ##     ##  ##  ##   ### 
##     ## ########  ##     ## #### ##    ##     // http://www.network-science.de/ascii/
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */



app.use(checkAdmin);
function checkAdmin(req, res, next) {
	if (req.session.username == "rouan") {
		//super admin usename
		next();
	}
}

app.get('/admin', function (req, res) {
	db.users.find({}, function(err, users) {
		res.render('admin', { username: req.session.username, password: req.session.password, socketserver: socketconnect, users: users });
	});
});

app.get('/admin/users', function (req, res) {
	db.users.find({}, function(err, users) {

		for (var num in users) {
			if (users[num].level == undefined) { 
				//if we have user accounts without a level tag, we create it and set it to 0.
				users[num].level = 0;
				db.users.update({username: users[num].username}, users[num]);
			}	
		}
		
		res.render('admin_users', { username: req.session.username, password: req.session.password, socketserver: socketconnect, users: users });
	});
});


/*

   ###    ########  #### 
  ## ##   ##     ##  ##  
 ##   ##  ##     ##  ##  
##     ## ########   ##  
######### ##         ##  
##     ## ##         ##  
##     ## ##        #### 

*/

app.get('/api/u/:id/:cmd/:subcmd', function (req, res) {
	console.log(req.params)
});

app.get('/api/username/:username', function (req, res) {
	db.users.find({"username":req.params.username}, function (err, result) {
		console.log(result)
	})
});

app.get('/*', function (req, res) {
	res.status(404);
	var data = {username: req.session.username, password: req.session.password, socketserver: socketconnect}
	data.message = "Could not find what you were looking for?! It might not exist, or your link is broken.";
	res.render('error', data)
})

app.use(errorHandler);

function errorHandler(err, req, res, next) {
	
  console.error(err.stack);
  res.status(500);
  res.send(500, 'Something broke! '+err);
}

/*

   ###    ########  ########  ##     ## #### ##    ##  #######  
  ## ##   ##     ## ##     ## ##     ##  ##  ###   ## ##     ## 
 ##   ##  ##     ## ##     ## ##     ##  ##  ####  ## ##     ## 
##     ## ########  ##     ## ##     ##  ##  ## ## ## ##     ## 
######### ##   ##   ##     ## ##     ##  ##  ##  #### ##     ## 
##     ## ##    ##  ##     ## ##     ##  ##  ##   ### ##     ## 
##     ## ##     ## ########   #######  #### ##    ##  #######  
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

/*

########  ########    ###    ##       ######## #### ##     ## ######## 
##     ## ##         ## ##   ##          ##     ##  ###   ### ##       
##     ## ##        ##   ##  ##          ##     ##  #### #### ##       
########  ######   ##     ## ##          ##     ##  ## ### ## ######   
##   ##   ##       ######### ##          ##     ##  ##     ## ##       
##    ##  ##       ##     ## ##          ##     ##  ##     ## ##       
##     ## ######## ##     ## ########    ##    #### ##     ## ######## 

*/


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
		socket.email = user.email
		socket.emit('authed', {auth:true})
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

socket.on('invite', function (data) {
	console.log(data)
	console.log(socket.room)

	db.projects.findOne({"_id": ObjectId(socket.room)}, function (err, project) {
		console.log(project);
		if (project.members == undefined) {
			project.members = []
		}
		db.users.findOne({"username":data.user}, function (err,user) {
			if (user) {
				project.members.push(user.username)	;	
				db.projects.update({"_id": ObjectId(socket.room)}, project, function (err, result) {
					console.log("success")
				});
			} else {
				//not found
				console.log("user not found");
			}
			
		})
		
	})
});

  socket.on('message', function (data) {
    console.log("SOCKET Message from " + socket.username + " in " + socket.room + ": " + data.messagetext);    
    
    db.projects.findOne({"_id": ObjectId(socket.room)}, function (err, project) {
    	

    	/* ---------------------------------------------------
    	SEND EMAIL TO CLIENT */
		if (enableEmail) 
	  	{	
	  		if (project.creator) {
		    	db.users.findOne({"username":project.creator}, function (err, client) {
		    		
			    	/* START EMAIL */
					var email = {}
					email.from = "noreply@launchlabapp.com";
					email.fromname = "Launch Lab";
					email.rcpt = client.email;
					email.rcptname = client.fullname;
					email.subject = "New message in "+project.brief.title+" from "+socket.username;
					email.body = "Hi "+client.username;
					email.body += "\n\r"
					email.body += "There is a new message in a project you are involved with.\n\r"
					email.body += "http://launchlab.me/project/"+socket.room+"\n\r"
					email.body += "\n\r"

					mailbot.sendemail(email, function (data) 
					{
						console.log("EMAIL SENT")
					});
					/* END EMAIL */	    		
		    	});// end db.users.findOne(..)	
	  		}
  		
		} //end (enableEmail)
		/* SEND EMAIL TO CLIENT 
		---------------------------------------------------*/

    	/* ---------------------------------------------------
    	SEND EMAIL TO OFFERING OWNER */
		if (enableEmail)
	  	{
	  		if (project.offering) {
				db.users.findOne({"username":project.offering.creator}, function (err, offeringowner) {
			    	/* START EMAIL */
					var email = {}
					email.from = "noreply@launchlabapp.com";
					email.fromname = "Launch Lab";
					email.rcpt = offeringowner.email;
					email.rcptname = offeringowner.fullname;
					email.subject = "New message in "+project.brief.title+" from "+socket.username;
					email.body = "Hi "+offeringowner.username;
					email.body += "\n\r"
					email.body += "There is a new message in a project.\n\r"
					email.body += "http://launchlab.me/project/"+socket.room+"\n\r"
					email.body += "\n\r"

					mailbot.sendemail(email, function (data) 
					{
						console.log("EMAIL SENT")
					});
					/* END EMAIL */	    		
	    		});// end db.users.findOne(..)	  		
	  		}
	    	
		} //end (enableEmail)
		/* SEND EMAIL TO OFFERING OWNER 
		---------------------------------------------------*/

    	/* ---------------------------------------------------
    	SEND EMAIL TO KEVIN */
		if (enableEmail)
	  	{
	    		
		    	/* START EMAIL */
				var email = {}
				email.from = "noreply@launchlabapp.com";
				email.fromname = "Launch Lab Admin";
				email.rcpt = "kevin@openwindow.co.za";
				email.rcptname = "Kevin Lawrie";
				email.subject = "New message in "+project.brief.title+" from "+socket.username;
				email.body = "Hi Kevin";
				email.body += "\n\r"
				email.body += "There is a new message in a project.\n\r"
				email.body += "http://launchlab.me/project/"+socket.room+"\n\r"
				email.body += "\n\r"

				mailbot.sendemail(email, function (data) 
				{
					console.log("EMAIL SENT")
				});
				/* END EMAIL */	    		
	    	  		
		} //end (enableEmail)
		/* SEND EMAIL TO CLIENT 
		---------------------------------------------------*/


    	//FIND CLIENT
    })
    var nowdate = new Date;
    var formatteddate = formatDate(nowdate);

    var messagedata = {}

	

	db.users.findOne({"username":socket.username}, function (err, user) {
		messagedata.message = { username: socket.username, avatar: user.avatar, email: socket.email, room: socket.room, text: data.messagetext, timestamp: nowdate.toISOString(), timeformatted: formatteddate }
	    io.sockets.in(socket.room).emit('message', messagedata);
	    db.messages.save(messagedata)
	});							

        
  });
  
});


//io.sockets.emit("ardu", {serial: cleandata})		

function formatDate( date ) {
	return date.getFullYear()+"/"+('0'+(date.getMonth()+1)).slice(-2)+"/"+('0'+date.getDate()).slice(-2);
}
