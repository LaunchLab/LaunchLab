var controllers = {};

controllers.profileView = function ($scope, $window, socket) {
  socket.emit('request profile');
  socket.on('public', 'recieve profile',function(data) {
    $scope.message;
    $scope.user ={
      username : data.user.username,
      fullname : data.user.fullname,
      shortbio : data.user.shortbio,
      location : data.user.location,
      email : data.user.email,
      phonenumber : data.user.phonenumber,
      website : data.user.website,
    };
    //$scope.$digest();
  });

};

controllers.topNav = function ($scope, $window, socket, handshakeConstant) {
	$scope.var0 = 0;
	  var menuUp = false;
  $(".topnavOptionsMenu").hide();
  $(".topnavOptionsButton").hover( function() {
    $(".topnavOptionsMenu").css("top", "40px");
    $(".topnavOptionsMenu").css("left", $(this).offset().left);
    $(".topnavOptionsMenu").show();
  }, function() {
    $(".topnavOptionsMenu").hide();
  })

  $(".topnavOptionsMenu").hover( function() {
    $(".topnavOptionsMenu").show();
  },function() {
    $(this).hide();
  });
  };

controllers.AdminUserCtrl = function ($scope, $location, $window, UserService, AuthenticationService){
	//Admin User Controller (login, logout)
    $scope.logIn = function logIn(username, password) {
        if (username !== undefined && password !== undefined) {
 
            UserService.logIn(username, password).success(function(data) {
                AuthenticationService.isLogged = true;
                $window.sessionStorage.token = data.token;
                $location.path("/admin");
            }).error(function(status, data) {
                console.log(status);
                console.log(data);
            });
        }
    }
 
    $scope.logout = function logout() {
        if (AuthenticationService.isLogged) {
            AuthenticationService.isLogged = false;
            delete $window.sessionStorage.token;
            $location.path("/");
        }
    }
};

controllers.loginModalWindow = function ($scope, socket, $timeout) {
	$scope.login = {
		username : '',
		password : ''
	};

	socket.on('public', 'recieve login successful',function(data) {
		console.log(data);
		
	});
	$scope.submit = function() {
		// server-side

    };
    
    $scope.forgotReset = function() {
    	$scope.$root.$broadcast('loginModalWindowSwap');
    	$timeout(function() {$scope.$root.$broadcast('forgotResetModalWindowOpen');}, 300);
     };

     $scope.register = function() {
     	$scope.$root.$broadcast('loginModalWindowSwap');
    	$timeout(function() {$scope.$root.$broadcast('registerModalWindowOpen');}, 300);
     }; 
};

controllers.registerModalWindow = function ($scope, $location, socket, $timeout) {
	$scope.newuser= {
		username : '',
		email : '',
		password1 : '',
		password2 : '',
		levelAuthority : ''
	};
	$scope.hideLevelAuthority = false;
	$scope.showLevelAuthority = false;
	$scope.error=false;

	$scope.submit = function() {
		console.log($scope.newuser);
		socket.emit('public', 'request register user', $scope.newuser);
	};

	socket.on('public', 'recieve register user successful', function(newuser) {
		if(newuser.levelAuthority === 'client'){
			$location.path('/clients/dashboard');
			$scope.$apply();
		}else {
			$location.path('/:' + newuser.username);
			$scope.$apply();
		};
	});
	socket.on('public', 'recieve register user rejected',function(data) {
		console.log('rejected'+ data);
		$scope.error = data;
		$scope.$digest();
	});
    $scope.showLevelAuthorityDiv = function() {
    	$scope.hideLevelAuthority = true;
    	$scope.showLevelAuthority = true;
    };
    $scope.hideLevelAuthorityDiv = function() {
    	$scope.hideLevelAuthority = false;
    	$scope.showLevelAuthority = false;
    };
};

controllers.forgotResetModalWindow = function ($scope, $window, socket, $timeout) {
	 $scope.login = function() {
    	$scope.$root.$broadcast('forgotResetModalWindowSwap');
    	$timeout(function() {$scope.$root.$broadcast('loginModalWindowOpen');}, 300);
    };
	$scope.submit = function() {
    	alert();
    };
};

controllers.home = function ($scope, $window, socket) {
	$scope.loginModalWindow = {
      html: '<form ng-submit="submit()" ng-controller="loginModalWindow"><span>Username:</span> <br/> <input type="text" ng-model="login.username" placeholder="Username"/> <br/><span>Password:</span> <br/> <input type="password" ng-model="login.password" placeholder="Password"/> <br/> <input type="submit" value="Submit"/> <br/><span ng-click="forgotReset()" class="forgotReset">Forgot / Reset Password</span> <br/><span ng-click="register()" class="register">Need an account? Go register.</span></form>',
      title:'Login',
      use : 'loginModalWindow'
    };
    $scope.registerModalWindow = {
      html: '<form class="registerForm" ng-submit="submit()" ng-controller="registerModalWindow"> <div class="animate-hide register-basic" ng-hide="hideLevelAuthority"> <br/> <label for="usernameText">Username</label> <input type="text" ng-model="newuser.username" id="usernameText" placeholder="Username"/> <br/> <label for="emailAddressEmail">Email Address</label> <input type="email" ng-model="newuser.email" id="emailAddressEmail" placeholder="Email Address"/> <br/> <label for="passwordPassword1">Password</label> <input type="password" ng-model="newuser.password1" id="passwordPassword1" placeholder="Password"/> <br/> <label for="passwordPassword2">Password</label> <input type="password" ng-model="newuser.password2" id="passwordPassword2" placeholder="Password"/> <br/> <md-next ng-click="showLevelAuthorityDiv()">Next</md-next></div><div class="register-levelAuthority animate-show" ng-show="showLevelAuthority"> <md-prev ng-click="hideLevelAuthorityDiv()"></md-prev> <br/> <input type="radio" id="clientRadio" ng-model="newuser.levelAuthority" value="client" ng-change="updateLevelAuthority(newuser.levelAuthority)"> <label for="clientRadio"> <div class="levelAuthority-item client-avatar"> <div class="persona-info"> <h3>Client</h3> </div> </div> <p>Do business with us.</p> </label> <input type="radio" id="mentorRadio" ng-model="newuser.levelAuthority" value="mentor" ng-change="updateLevelAuthority(newuser.levelAuthority)"> <label for="mentorRadio"> <div class="levelAuthority-item mentor-avatar"> <div class="persona-info"> <h3>Mentor</h3> </div> </div> <p>Apply to lead teams of creatives on projects.</p> </label> <input type="radio" id="creativeRadio" ng-model="newuser.levelAuthority" value="creative" ng-change="updateLevelAuthority(newuser.levelAuthority)"> <label for="creativeRadio"> <div class="levelAuthority-item creative-avatar"> <div class="persona-info"> <h3>Creative</h3> </div> </div> <p>Take on creative projects.</p> </label> <br/> <input type="submit" value="Submit"/> </div><br/></form>',
      title:'Register',
      use : 'registerModalWindow'
    };
    $scope.forgotResetModalWindow = {
      html: '<form ng-submit="submit()" ng-controller="forgotResetModalWindow"><md-prev ng-click="login()"></md-prev><span >Username:</span><br /><input type="text" placeholder="Username"/><br/>Or<br/><span >Email:</span><br /><input type="email" placeholder="Email Address"/><br /><br /><input type="submit" value="Submit"/></form>',
      title:'Reset your password',
      use : 'forgotResetModalWindow'
    };

};
/*


########  ########   #######        ## ########  ######  ######## 
##     ## ##     ## ##     ##       ## ##       ##    ##    ##    
##     ## ##     ## ##     ##       ## ##       ##          ##    
########  ########  ##     ##       ## ######   ##          ##    
##        ##   ##   ##     ## ##    ## ##       ##          ##    
##        ##    ##  ##     ## ##    ## ##       ##    ##    ##    
##        ##     ##  #######   ######  ########  ######     ##    

*/
controllers.projectView = function ($scope, $window, socket) { //bugfix
  socket.emit('public', 'request project');
  socket.on('public', 'recieve project',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};
/*
 #######  ######## ######## ######## ########   ######  
##     ## ##       ##       ##       ##     ## ##    ## 
##     ## ##       ##       ##       ##     ## ##       
##     ## ######   ######   ######   ########   ######  
##     ## ##       ##       ##       ##   ##         ## 
##     ## ##       ##       ##       ##    ##  ##    ## 
 #######  ##       ##       ######## ##     ##  ######  
*/
controllers.offeringsView = function ($scope, $window, socket, $routeParams) {
  socket.emit('public', 'request offeringsView', $routeParams.id);
  socket.on('public', 'recieve offeringsView',function(data) {
    $scope.image;
    console.log(data);
    $scope.offering = data.offering;
    $scope.$digest();
  });
};

controllers.offeringsNew = function ($scope, $window, socket) {
  socket.emit('public', 'request offeringsNew');
  socket.on('public', 'recieve offeringsNew',function(data) {
    $window.location = $window.location.href + "/offerings/edit/" + data;//this should redirect to the new blank offering once we have a database entry
    //$scope.$digest();
  });
};

controllers.offeringsEdit = function ($scope, $window, socket, $routeParams) {
  socket.emit('public', 'request offeringsEdit', $routeParams.id);
  socket.on('public', 'recieve offeringsEdit', function(data) {
    $scope.image;
    $scope.offerings = {
      _id : data.offerings.id,
      title : data.offerings.title,
      description : data.offerings.description,
      creator : data.offerings.creator,
      samplefiles : data.offerings.samplefiles,
      offering_id : data.offering_id,
      descriptionmarked : data.descriptionmarked
    };

    $scope.$digest();
    //
     /*
     * expose the event object to the scope
     */
    $scope.delImageEventHandler = function(clickEvent) {
      socket.emit('public', 'request offering imageDelete', clickEvent.target.data('imagename'));
    };
    $scope.offeringEditEventHandler = function(offering_id) {
      socket.emit('public', 'request offering edit form', offering_id);
    };
    $scope.offeringImageUploadEventHandler = function(offering_id) {
      socket.emit('request offering imageUpload', offering_id);
    };
    //
    socket.on('public', 'recieve offering imageDelete',function() {
      $scope.$digest();
    });
    socket.on('public', 'recieve offering edit form',function(data) {
      $scope.loginpage = data.loginpage;
      $scope.$digest();
    });
    socket.on('public', 'recieve offering imageUpload',function(offering_id) {
      $location.path('/offerings/view/' + offering_id );
    });
    //
    $(".delimage").hover( function () {
        $(this).css("background", "rgb(225, 76, 7)");
        $(this).css("cursor", "pointer")
      },function () {
        $(this).css("color", "rgb(255,255,255)")
        $(this).css("background", "#fff")
    });
  var sizeblock = function () {
    console.log( )
    var h = parseInt($(".uploadimgblock").css("height"))
    if (h < 10) {
      $(".uploadimgblock").css("height", $(".uploadimgblock").css("width"))
      $(".uploadimgblock").css("background", "rgb(240,240,240)");
      $(".uploadimgblock").css("border", "2px #ccc dashed");
    }
  }();
    //end
  });

};

controllers.offeringsConfirm = function ($scope, $window, socket, $routeParams) {
  socket.emit('public', 'request offeringsConfirm', $routeParams.id);
  socket.on('public', 'recieve offeringsConfirm',function() {
    $location.path('/projects');
  });

};

controllers.offeringsDelete = function ($scope, $window, socket) {
  socket.emit('public', 'request offeringsDelete');
  socket.on('public', 'recieve offeringsDelete',function(offering_id) {
    $location.path('/projects');
  });
};

controllers.talk = function ($scope, $window, socket) {
  socket.emit('public', 'request talk');
  socket.on('public', 'recieve talk',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.user = {
      username : '{{ username }}',
      password : '{{ password }}'
    };
    socket.on('public', 'connect', function() {
       // Connected, let's authenticate over sockets.
       console.log("AUTH")
       socket.emit('public', 'authenticate', {username: user.username, password: user.password });
    });

    socket.on('public', 'message', function (data) {
      //BUILDS THE HTML WHEN A MESSAGE IS CREATED/RECIEVED. THIS CAN BE FROM OTHERS, OR WHAT WE SENT OURSELVES.
      console.log(data)
      var htmlperson = 
      '<div class="person">'
        +'<img src="/images/avatar_1.png" class="avatarimg">'
        
        +'<div class="persondata">'
          +'<div class="personname">'+data.message.username+'</div>'
          +'<div class="persontitle">title <span class="persontask">task</span> </div>'
          +'<div class="persononline">online</div>'
        +'</div>'
      +'</div>';

      var left = '';
      var right = '';
      var side = '';
      if (data.message.username == user.username) {
        //We sent this so left align
        left = htmlperson;
        side = 'message_l';
      } else {
        //Someone sent this to us, so right align.
        right = htmlperson;
        side = 'message_r';
      }
      

      var htmlmessage = 
       '<div class="pure-g-r">'
        +'<div class="pure-u-1-3">'+left+'</div>'
        
        +'<div class="pure-u-1-3">'
          +'<div class="message '+side+'">'
            +'<div class="messagetext">'+data.message.text+'</div>'
            +'<div class="timeago"><abbr class="timeago" title="'+data.message.timestamp+'">'+data.message.timeformatted+'</abbr></div>'
          +'</div>'
        +'</div>'

        +'<div class="pure-u-1-3">'+right+'</div>'
      +'</div>'
      
      //APPENDS INTO THE DOM
      $("#talkstream").append(htmlmessage)
      $("abbr.timeago").timeago();
    });

    $("#roomconnect").click( function() {
      user.roomname = $("#roomname").val();
      console.log("Connecting to room " + user.roomname )
      socket.emit('public', 'room', {room:user.roomname});
    });

    $("#chatsend").click( function(data) {
      data.preventDefault();
      console.log("Sending "+ $("#chatmessage").val() +" to "+ $("#roomname").val() )
      var messagetextinput = $("#chatmessage").val();
      socket.emit('public', 'message', {messagetext: messagetextinput} );
    })

    $scope.$digest();
  });

};

controllers.workView = function ($scope, $window, socket) {
  socket.emit('public', 'request work');
  socket.on('public', 'recieve work',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.workInvoicesView = function ($scope, $window, socket) {
  socket.emit('public', 'request workInvoices');
  socket.on('public', 'recieve workInvoices',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.workInvoicesNew = function ($scope, $window, socket) {
  socket.emit('public', 'request workInvoicesNew');
  socket.on('public', 'recieve workInvoicesNew',function(data) {
    $window.location = "/work/invoices/edit/"+data; //takes us to the new blank invoice
    //$scope.$digest();
  });

};

controllers.workInvoicesEdit = function ($scope, $window, socket) {
  socket.emit('public', 'request workInvoicesEdit');
  socket.on('public', 'recieve workInvoicesEdit',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};


controllers.adminDashboard = function ($scope, $window, socket) {

};
controllers.creativeDashboard = function ($scope, $window, socket) {

};

controllers.mentorDashboard = function ($scope, $window, socket) {

};
controllers.error = function ($scope, $window, socket) {
  socket.emit('public', 'request error');
  socket.on('public', 'recieve error',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });
};

//search up prototype chain
app.controller(controllers);