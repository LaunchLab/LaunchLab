var express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	databaseUrl = "mydb",
	collections = ["users", "projects", "messages","external", "talk", "reports", "creativeapplications", "offerings", "orders", "invoices"],
	mongojs = require("mongojs"),
	db = mongojs.connect(databaseUrl, collections),
	io = require('socket.io').listen(server),
	tempUsername = "Dagan",
	tempPassword = "Pass123",
	tempEmail = "daganread@gmail.com";


/* Start the server */

    server.listen(8080);

  app.use(express.static(__dirname + '/public'));
  app.use(express.static(__dirname + '/content'));
  app.use(express.static(__dirname + '/bower_components'));

  app.get('/', function(req,res) {
    res.sendfile(__dirname + '/index.html');
  });

  io.sockets.on('connection', function(socket) {
/*
*	Get Responses
*/
  	socket.on('request topnav', function() {
  		var data = {
	    			username: tempUsername,
	    			password: tempPassword
	    		};
		io.sockets.emit('recieve topnav', data);
	});

	socket.on('request market', function() {
  		var data = {
	    			username: tempUsername,
	    			password: tempPassword,
	    			socketserver: socketconnect,
	    			offerings: null
	    		};

  	 	db.offerings.find({}, function(err, results) {
			for (var x in results) {
				results[x].offering_id = results[x]._id.toHexString();
			}
			data.offerings = results;
		});//end find
		io.sockets.emit('recieve market', data);
	});

	socket.on('request attendance', function(data) {
		var data = {
			socketserver : socketconnect,
			students : [],
			studentcounttotal : 15,
			studentcountpresent : 0,
			studentcountabsent : 0,
			studentcountexempt : 0,
			studentcountwork : 0	
		};

		for (var a = 0; a < data.studentcounttotal; a++) {
		  var student = {
		  	name : "Name",
			surname : "Surname",
			count : a+1,
			number : 46400 + Math.round(Math.random()*500)	
		  }
		  data.students.push(student);
		}
		io.sockets.emit('recieve attendance', data);
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
	socket.on('request user', function(userId) {
		  var ObjectId = mongojs.ObjectId;

		  var data = {username: tempUsername, password: tempPassword}
		  data.socketserver = socketconnect;

		  db.users.find({"_ids": ObjectId(userId)}, function(err, users) {
		    if (err) {
		      //res.status(404);
		      //res.render('error', data)
		      //console.log('error event triggered');
		      io.sockets.emit('request error'); 
		    } else {
		      console.log(users)
		      if (users.length != 1) {
		        //res.status(404);
		        //res.render('error', data)
		        //console.log('error event triggered');
		        io.sockets.emit('request error'); 
		      } else {
		        console.log("FOUND")
		        data.user = users[0];

		        db.offerings.find({"creator":data.user.username, title: {"$ne": ""}}, function (err, offerings) {
		          data.offerings = offerings;
		          io.sockets.emit('recieve user', data);      
		        })

		        
		      }
		      
		    }
		    
		  });
	});

	socket.on('request username', function(username) {
		  var data = {
		  	username: tempUsername,
		  	password: tempPassword
		  };

		  //data.socketserver = socketconnect;

		  db.users.find({"username": username}, function(err, users) {
		    if (err) {
		      //res.status(404);
		      //res.render('error', data)
		      console.log('error event triggered');
		    } else {
		      console.log(users)
		      if (users.length != 1) {
		        next();
		      } else {

		        console.log("FOUND")
		        data.user = users[0];

		        //data.avatar = gravatar.url(users[0].email, {s: '100', r: 'pg', d: '404'});
		        //, title: {"$ne": ""}
		        db.offerings.find({"creator":data.user.username}, function (err, offerings) {
		          data.offerings = offerings;
		          io.sockets.emit('recieve username', data);      
		        })

		        
		      }
		      
		    }
		    
		  });
	});

	socket.on('request login', function() {
		var data = { 
			loginpage : true
		};
		io.sockets.emit('recieve login', data); 
	});

	socket.on('request logout', function() {
		var data = { 
			loginpage : true
		};
		io.sockets.emit('recieve logout', data); 
	});

	socket.on('request profile', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			email: tempEmail,
			socketserver: socketconnect,
			userdb: req.session.db
		};
		io.sockets.emit('recieve profile', data); 
	});

	socket.on('request creatives', function(data) {
		io.sockets.emit('recieve creatives', data); 
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
	socket.on('request project', function() {
		console.log("!!")
		  var data = { 
			username: tempUsername,
			password: tempPassword,
			email: tempEmail,
			socketserver: socketconnect
		};
		  //bugfix chop to correct length
		  var projectid = req.url.slice(9);
		  projectid = projectid.slice(0,"53e48f68832871c41306702d".length)


		  var ObjectId = mongojs.ObjectId;

		  db.projects.findOne({"_id": ObjectId(projectid)}, function(err, project) {

		    if (project) {
		      console.log("FOUND!!")
		      console.log(project)
		      project.id = project._id.toHexString();
		      //project._id = JSON.stringify(project._id);

		      data.project = project;

		      console.log("searching for messages")
		      db.messages.find( { "message.room" : project.id}, function (err, messages) {
		        console.log("FOUND MESSAGES:")
		        //avatars
		        for (var num in messages) {
		          if (messages[num].message.email) {
		            var avatar = gravatar.url(messages[num].message.email, {s: '200', r: 'pg', d: '404'});
		            messages[num].message.avatar = avatar;
		          } else {
		            messages[num].message.avatar = '/images/avatar_1.png';
		          }
		          
		        }

		        data.messagearray = JSON.stringify(messages);
		        console.log(messages)
		        console.log("#############")

		        var projectjson = JSON.stringify(project);
		        data.projectjson = projectjson
		        io.sockets.emit('recieve project', data); 
		      } )
		    } else {
		      //res.status(404);
		      //res.render('error', data)
		      data.message = "The project was not found in the database. Was it removed?"
		      io.sockets.emit('request error'); 
		    }
		    
		  });
	});

	socket.on('request projects', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect
		};
		io.sockets.emit('recieve projects', data); 
	});

	socket.on('message', function (data) {
	    console.log("SOCKET Message from " + socket.username + " in " + socket.room + ": " + data.messagetext);    
	    var nowdate = new Date;
	    var formatteddate = formatDate(nowdate);

	    var messagedata = {}

		var avatar = gravatar.url(socket.email, {s: '200', r: 'pg', d: '404'});
								

	    messagedata.message = { username: socket.username, avatar: avatar, email: socket.email, room: socket.room, text: data.messagetext, timestamp: nowdate.toISOString(), timeformatted: formatteddate }
	    io.sockets.in(socket.room).emit('message', messagedata);

	    db.messages.save(messagedata)  
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

	socket.on('request offeringsView', function(offering_id) {
  	 	//bugfix chop to correct length
	    var mongoid = offering_id;
	    var ObjectId = mongojs.ObjectId;
	    var data = {
	    			username: tempUsername,
	    			password: tempPassword,
	    		};

	    db.offerings.findOne({"_id": ObjectId(mongoid) }, function (err, result) {      
	        if (result) {
	          result.offering_id = result._id.toHexString();
	          result.descriptionmarked = result.description;//marked() #bugfix
	          console.log(result);
	          var editbool = 0;
	          if (tempUsername == "rouan") { editbool = 1}
	          if (tempUsername == result.creator) { editbool = 1}

	          db.users.findOne({username:result.creator}, function (err, creatorresult) {
	            data.offering = result;
	            data.editable = editbool;
	            data.creator = creatorresult;

	            io.sockets.emit('recieve offeringsView', data);
	          })
	        } else {
	        	io.sockets.emit('request error'); 
	        	//console.log('error event triggered')
	        };
	    });

	});

	socket.on('request offeringsEdit', function(offering_id) {
		//bugfix chop to correct length
		  var mongoid = offering_id;

		  var ObjectId = mongojs.ObjectId;

		  var data = { 
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect
		};

		  db.offerings.findOne({"_id": ObjectId(offering_id)}, function(err, result) {

		    result.offering_id = result._id.toHexString();
		    
		    if (result) {
		      var editbool = 0;
		      if (result.creator == tempUsername) { editbool = 1}
		      if (tempUsername == "rouan") {editbool = 1} 
		      data.offering = result;

		      console.log(result)

		      data.editable = editbool;
		      io.sockets.emit('recieve offeringsEdit', data); 
		    } else {
		    	io.sockets.emit('request error'); 
		    }
		  });
	});

	socket.on('request offeringsDelete', function(offering_id) {		  
		  //bugfix chop to correct length
		  var mongoid = offering_id;
		  var ObjectId = mongojs.ObjectId;

		  //////////
		  db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		      console.log(result)
		      
		      if ((tempUsername == "rouan") || (result.creator == tempUsername)) {
		        //start del
		          
		          db.offerings.remove({"_id": ObjectId(mongoid)}, function(err, result) {
		              console.log("REMOVED");
		              io.sockets.emit('recieve offeringsDelete'); 
		          });
		          

		        //end del
		      }
		    
		  });
		
		
	});


	socket.on('request offeringsNew', function(data) {
		var blankOffering = {
			creator : tempUsername,
			created : Date.now(),
			status : "pending",
			title : "",
			description : "",
			price : "",
			samplefiles : []
		};

		  db.offerings.save(blankOffering, function (err, result) {
		    console.log("new offering made");
		    console.log(result);
		    var offeringid = result._id.toHexString();
		    io.sockets.emit('recieve offeringsNew', offeringid);
		  });
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
	socket.on('request offeringsConfirm', function(offering_id) {
		//bugfix chop to correct length
		  var mongoid = offering_id;
		  var ObjectId = mongojs.ObjectId;

		  db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		    console.log("finding offering")
		    console.log(result)
		    result.offering_id = result._id.toHexString();
		    if (result) {
		    	var data = { 
		    		username: tempUsername,
		    		password: tempPassword,
		    		socketserver: socketconnect,
		    		offering: result,
		    		userdb: req.session.db
		    	}
		      //SUCCESSFUL ORDER
		      io.sockets.emit('recieve offeringsConfirm', data); 
		      
		      if (enableEmail) {
		        //test email sending
		        var email = {}
		        email.from = "noreply@launchlabapp.com";
		        email.fromname = "Launch Lab Orders";
		        email.rcpt = "rouan@8bo.org";
		        email.rcptname = "Rouan van der Ende";
		        email.subject = "Launch Lab Orders - "+tempUsername+" placed an order.";

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

		        io.sockets.emit('request offeringsConfirm'); 

		      }

		    } else {
		    	io.sockets.emit('request error'); 
		    }
		  });
	});

	socket.on('request talk', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect
		};
		io.sockets.emit('recieve talk', data); 
	});

	socket.on('request external', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect
		};
		io.sockets.emit('recieve external', data); 
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

*/

	socket.on('request work', function() {
		var data = {username: tempUsername, password: tempPassword, socketserver: socketconnect};

		  db.projects.find({}, function (err, result) {
		    data.projects = result;

		    for (var r in result) {
		      var createddate = new Date(result[r].created);
		      result[r].createdformatted = createddate.toISOString();
		      var updateddate = new Date(result[r].created);
		      result[r].updatedformatted = updateddate.toISOString();     
		    }

		    io.sockets.emit('recieve work', data); 
		  });
	});

	socket.on('request workInvoices', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect
		};

		db.invoices.find({"creator": tempUsername}, function (err, result) {
		  data.invoices = result;
		  io.sockets.emit('recieve workInvoices', data);   
		});
	});

	socket.on('request workInvoicesNew', function() {
		var data = {
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect,
			userdb: req.session.db
		};

		  db.invoices.find({"creator": tempUsername}, function (err, result) {
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
		    invoice.creator = tempUsername;
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
		      io.sockets.emit('recieve workInvoicesNew', dbid); 
		    })

		  });
	});

	socket.on('request workInvoicesEdit', function(offering_id) {
		var data = {
			username: tempUsername,
			password: tempPassword,
			socketserver: socketconnect,
			userdb: req.session.db
		};
		var dbid = offering_id;
		var ObjectId = mongojs.ObjectId;

		db.invoices.findOne({"_id": ObjectId(dbid)}, function (err, result) {
			data.invoice = result;
		    io.sockets.emit('recieve workInvoicesEdit', data); 
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

	socket.on('request dashboard', function() {
		var data = { 
			username: tempUsername,
			password: tempPassword,
			email: tempEmail
		};
		  if (tempUsername == "rouan") {
		    data.admin = true
		  }

		  //

		  db.offerings.find({"title": { "$ne": "" }}, function(err, results) {
		          var sorted = results.sort(function(a,b) { return b.created - a.created } );
		          data.offerings = sorted;
		          io.sockets.emit('recieve dashboard', data);
		        }); 
	});

	socket.on('request admin', function() {
		db.users.find({}, function(err, users) {
			var data = {
				username: tempUsername,
				password: tempPassword,
				socketserver: socketconnect,
				users: users 
			};
		    io.sockets.emit('recieve admin', data); 
		  });
	});

	socket.on('request adminUsers', function() {
		db.users.find({}, function(err, users) {

		    for (var num in users) {
		      if (users[num].level == undefined) { 
		        //if we have user accounts without a level tag, we create it and set it to 0.
		        users[num].level = 0;
		        db.users.update({username: users[num].username}, users[num]);
		      } 
		    }
			var data = { 
				username: tempUsername,
				password: tempPassword,
				socketserver: socketconnect,
				users: users 
			};		    
		    io.sockets.emit('recieve adminUsers', data);
		  }); 
	});
/*
*	Post Responses
*/
	socket.on('request projectsNew', function(data) {
		//CREATE NEW PROJECT
		console.log(data)
		//res.end("it worked")
		var project = data;
		project.creator = tempUsername;
		project.created = Date.now();
		project.status = "new"
		project.costtodate = 0;
		console.log(project)
		db.projects.save( project, function(err, saved) {
			
			console.log("NEW PROJECT CREATED");		
			console.log(saved)
			console.log("====================");		
			var projectid = saved._id.toHexString();
			socketlog("NEW PROJECT CREATED: "+projectid);
			//res.render('projects_new', { username: tempUsername, password: tempPassword, socketserver: socketconnect });
			res.end(projectid)

			if (enableEmail) {
				//test email sending
				var email = {}
				email.from = "noreply@launchlabapp.com";
				email.fromname = "Launch Lab Projects";
				email.rcpt = "rouan@8bo.org";
				email.rcptname = "Rouan van der Ende";
				email.subject = "Launch Lab Projects - "+tempUsername+" created new project.";
				email.body = "User "+tempUsername+" created a new project http://launchlabapp.com/project/"+projectid;
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
						emailK.subject = "Launch Lab Projects - "+tempUsername+" created new project.";
						emailK.body = "User "+tempUsername+" created a new project http://launchlabapp.com/project/"+projectid;
						emailK.body += "\n\r"
						emailK.body += JSON.stringify(project)
						emailK.body += "\n\r"
						
						mailbot.sendemail(emailK, function (data) {
							console.log("EMAIL SENT")
						})
				})
			} else { console.log("EMAIL DISABLED. NOT IN PRODUCTION MODE.")}
				
		});
		io.sockets.emit('recieve projectsNew', data); 
	});

	socket.on('request offering imageDelete', function(data) {

		db.offerings.find({"creator": tempUsername }, function(err, results) {
			for (var a in results) {
				for (var b in results[a].samplefiles) {
					if (results[a].samplefiles[b] == data) {

						var ObjectId = mongojs.ObjectId;
						var newcopy = results[a]
						newcopy.samplefiles.splice(b,1);
						db.offerings.update({"_id": ObjectId(results[a]._id)}, newcopy, function(err, results) {
							console.log("BOOM FOUND AGAIN");
							io.sockets.emit('recieve offering imageDelete'); 
						});
					}
				}
			}
		});
	});

	socket.on('request offering edit form', function(offering_id) {
	//bugfix chop to correct length
	var mongoid = offering_id;
	var ObjectId = mongojs.ObjectId;

	var uploadedFilenames = []
	for (var f in req.multipartparse.files.upload) {
		if (req.multipartparse.files.upload[f].size > 0) {

			var source = fs.createReadStream(req.multipartparse.files.upload[f].path);

			//var dest = fs.createWriteStream(__dirname+'/uploads'+req.multipartparse.files.upload[f].path);
			
			var newfilename = Date.now()+req.multipartparse.files.upload[f].originalFilename
			var dest = fs.createWriteStream(__dirname+'/public/offerings/'+newfilename);

			console.log("COPY FILE!!!")
			uploadedFilenames.push(newfilename) 

			source.pipe(dest);

			source.on('end', function() { 
			/* copied */
				
			});
			source.on('error', function(err) { io.sockets.emit('request error'); /* error */ });
		}
	}

	db.offerings.findOne({"_id": ObjectId(mongoid)}, function(err, result) {
		var oldOffering = result;

		var newOffering = oldOffering
		newOffering.modified = Date.now();
		newOffering.title = req.multipartparse.fields.title[0]
		newOffering.description = req.multipartparse.fields.description[0]

		for (var file in uploadedFilenames) {
			if (newOffering.samplefiles) { 
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			} else {
				newOffering.samplefiles = []
				newOffering.samplefiles.push(uploadedFilenames[file]) 
			}
		}

		if ((newOffering.title == '')||(newOffering.description == '')) {
			mongoid += '?err=1';
			io.sockets.emit('recieve offering edit form', mongoid); 
		} else {
			//start update
			db.offerings.update({"_id": ObjectId(mongoid)}, newOffering, function(err, result) {
				console.log(result)
				if (result) {
					//res.render('thankyou', { username: tempUsername, password: tempPassword, socketserver: socketconnect });
					//res.redirect('/offerings/view/'+mongoid);
					io.sockets.emit('recieve offering edit form', mongoid); 
				} else {
					io.sockets.emit('request error'); 
					//res.render('error', { username: tempUsername, password: tempPassword, socketserver: socketconnect });
				}
			});
			//end update
		}

	});
	});

	socket.on('request offering edit', function(offering_id) {
		//bugfix chop to correct length
			var mongoid = offering_id;

			var ObjectId = mongojs.ObjectId;

			var data = {username: tempUsername, password: tempPassword, socketserver: socketconnect}

			db.offerings.findOne({"_id": ObjectId(offering_id)}, function(err, result) {

				result.offering_id = result._id.toHexString();
				
				if (result) {
					var editbool = 0;
					if (result.creator == tempUsername) { editbool = 1}
					if (tempUsername == "rouan") {editbool = 1}	
					data.offering = result;

					console.log(result)

					data.editable = editbool;
					io.sockets.emit('recieve offering edit', data); 
				} else {
					io.sockets.emit('request error'); 
					//res.render('error', { username: tempUsername, password: tempPassword, socketserver: socketconnect })
				};
			})
		});

	socket.on('request offering imageUpload', function(offering_id) {

		var mongoid = offering_id,
			ObjectId = mongojs.ObjectId,
			uploadedFilenames = [];

		for (var f in req.multipartparse.files.file) {
			if (req.multipartparse.files.file[f].size > 0) {

				var source = fs.createReadStream(req.multipartparse.files.file[f].path);

				//var dest = fs.createWriteStream(__dirname+'/files'+req.multipartparse.files.file[f].path);
				
				var newfilename = Date.now()+req.multipartparse.files.file[f].originalFilename
				var dest = fs.createWriteStream(__dirname+'/content/offerings/'+newfilename);

				console.log("COPY FILE!!!")
				uploadedFilenames.push(newfilename) 

				source.pipe(dest);

				source.on('end', function() { 
				/* copied */
					
				});
				source.on('error', function(err) { io.sockets.emit('request error'); /* error */ });
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
				if (result) {
					io.sockets.emit('recieve offering imageUpload', mongoid);
				} else {
					//res.render('error', { username: tempUsername, password: tempPassword, socketserver: socketconnect });
					io.sockets.emit('request error'); 
				}
			});
			//end update

		}); 
	});


/*
*	Notification responses
*/
	socket.on('request error', function() {
		console.log("NOT FOUND!!!!!%#$$@#");
		  //res.status(404);
		  var data = {username: tempUsername, password: tempPassword, socketserver: socketconnect}
		  data.message = "Could not find what you were looking for?! It might not exist, or your link is broken.";
		io.sockets.emit('recieve error', data); 
	});

    console.log('new connection on 8000');
  });