var controllers = {},
    makeSealer = function () {
        var users = [], passwords = [];

        return {
            sealer: function (username, password) {
                var i = users.length,
                    user = {username: username};
                users[i] = user;
                passwords[i] = password;
                return user;
            },
            unsealer: function (user, password) {
                return passwords[users.indexOf(user)] === password;
            }
        };
    };
controllers.topNav = function ($scope, $window, socket) {
	$scope.modalWindowEnterEventHandler = function(){
    	$(".md-modal").addClass( "md-show" );
    };
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

  socket.emit('request topNav');
  socket.on('recieve topNav',function(data) {
    console.log(data);
    $scope.users = data.users;
    $scope.$digest();
  });

};

controllers.market = function ($scope, $window, socket) {
  socket.emit('request market');
  socket.on('recieve market',function(data) {
    console.log(data);
    $scope.offerings = {
      price : data.price,
      samplefiles : data.samplefiles,
      title : data.title
    };
    $scope.$digest();
  });

};

controllers.userView = function ($scope, $window, socket, $routeParams) {
  socket.emit('request user', $routeParams.id);

  socket.on('recieve user',function(data) {
    $scope.offerings = {
      _id : data.offerings.id,
      creator : data.offerings.creator,
      samplefiles : data.offerings.samplefiles,
      title : data.offerings.title
    };
    $scope.user ={
      username : data.user.username,
      fullname : data.user.fullname,
      shortbio : data.user.shortbio,
      location : data.user.location,
      email : data.user.email,
      phonenumber : data.user.phonenumber,
      website : data.user.website,
    };
    $scope.avatar;

    $scope.$digest();
  });

};

controllers.usernameView = function ($scope, $window, socket, $routeParams) {
  socket.emit('request username', $routeParams.username);
  socket.on('recieve username',function(data) {
    $scope.room = data.room;
    $scope.$digest();
  });

};

controllers.profileView = function ($scope, $window, socket) {
  socket.emit('request profile');
  socket.on('recieve profile',function(data) {
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
    $scope.$digest();
  });

};
/*
controllers.creativesView = function ($scope, $window, socket) {

      $('.briefbutton').click( function() {

        $('.skillschecklist').each(function(){ 
          if (this.checked == true) {
            console.log( $(this).prop('value') );
            console.log( $(this).prop('checked') );
            entry["skills"].push( $(this).prop('value') )
          }
            
        });

        briefdata.entry["coding"] = $("input:radio[name ='coding']:checked").val();

        console.log(briefdata.entry)
        socket.emit('request projectsNew', briefdata);
         
      });
  socket.on('recieve creatives',function(data) {
    $scope.briefdata = {
      entry = {
        companyname : ,
        companyurl : ,
        companydescription : ,
        companylocation : ,
        projecttitle : ,
        projectsummary : ,
        designertype : ,
        budgetrange : ,
        projectdetails : ,
        projectinspiration : ,
        projecttimeframe:,
        skills : []
      }
    };
    //$location.path('/project/'+data.entry.projectid);
  });

};
*/

controllers.topNav = function ($scope, $window, socket) {
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

controllers.loginModalWindowSubmit = function ($scope, $document, socket, $timeout) {
	$scope.loginModalWindowSubmit = function() {
    	alert();
    };
    
    $scope.forgotReset = function() {
    	$document.triggerHandler('loginModalWindowSwap');
    	$timeout(function() {$document.triggerHandler('forgotResetModalWindowOpen');}, 300);
     };

     $scope.register = function() {
     	$document.triggerHandler('loginModalWindowSwap');
     	$timeout(function() {$document.triggerHandler('registerModalWindowOpen');}, 300);
     }; 
};

controllers.registerModalWindowSubmit = function ($scope, $window, socket) {
	$scope.registerModalWindowSubmit = function() {
      		alert();
      	};
};

controllers.forgotResetModalWindowSubmit = function ($scope, $window, socket) {
	$scope.forgotResetModalWindowSubmit = function() {
      		alert();
      	};
};

controllers.dashboard = function ($scope, $window, socket) {
	$scope.loginModalWindow = {
      html: '<form ng-submit="loginModalWindowSubmit()" ng-controller="loginModalWindowSubmit"><span >Username:</span><br /><input type="text" placeholder="Username"/><br /><br /><span >Password:</span><br /><input type="password" placeholder="Password"/><br/><br/><input type="submit" value="Submit"/><br /><span ng-click="forgotReset()" class="forgotReset">Forgot / Reset Password</span><br/><span ng-click="register()" class="register">Need an account? Go register.</span></form>',
      title:'Login',
      use : 'loginModalWindow'
    };
    $scope.registerModalWindow = {
      html: '<form ng-submit="registerModalWindowSubmit()" ng-controller="registerModalWindowSubmit"><span >Username:</span><br /><input type="text" placeholder="Username"/><br/><br/><span >Email:</span><br /><input type="email" placeholder="Email Address"/><br/><br/><span >Password:</span><br /><input type="text" placeholder="Password"/><br /><br /><span >Confirm password:</span><br /><input type="text" placeholder="Password"/><br/><br/><input type="submit" value="Submit"/></form>',
      title:'Register',
      use : 'registerModalWindow'
    };
    $scope.forgotResetModalWindow = {
      html: '<form ng-submit="forgotResetModalWindowSubmit()" ng-controller="forgotResetModalWindowSubmit"><span >Username:</span><br /><input type="text" placeholder="Username"/><br/><span>Or<span><br/><span >Email:</span><br /><input type="email" placeholder="Email Address"/><br /><br /><input type="submit" value="Submit"/></form>',
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
  socket.emit('request project');
  socket.on('recieve project',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.projectsView = function ($scope, $window, socket) {
  //socket.emit('request projects');
  socket.on('recieve projects',function(data) {
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
  socket.emit('request offeringsView', $routeParams.id);
  socket.on('recieve offeringsView',function(data) {
    $scope.image;
    console.log(data);
    $scope.offering = data.offering;
    $scope.$digest();
  });
};

controllers.offeringsNew = function ($scope, $window, socket) {
  socket.emit('request offeringsNew');
  socket.on('recieve offeringsNew',function(data) {
    $window.location = $window.location.href + "/offerings/edit/" + data;//this should redirect to the new blank offering once we have a database entry
    //$scope.$digest();
  });
};

controllers.offeringsEdit = function ($scope, $window, socket, $routeParams) {
  socket.emit('request offeringsEdit', $routeParams.id);
  socket.on('recieve offeringsEdit', function(data) {
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
      socket.emit('request offering imageDelete', clickEvent.target.data('imagename'));
    };
    $scope.offeringEditEventHandler = function(offering_id) {
      socket.emit('request offering edit form', offering_id);
    };
    $scope.offeringImageUploadEventHandler = function(offering_id) {
      socket.emit('request offering imageUpload', offering_id);
    };
    //
    socket.on('recieve offering imageDelete',function() {
      $scope.$digest();
    });
    socket.on('recieve offering edit form',function(data) {
      $scope.loginpage = data.loginpage;
      $scope.$digest();
    });
    socket.on('recieve offering imageUpload',function(offering_id) {
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
  socket.emit('request offeringsConfirm', $routeParams.id);
  socket.on('recieve offeringsConfirm',function() {
    $location.path('/projects');
  });

};

controllers.offeringsDelete = function ($scope, $window, socket) {
  socket.emit('request offeringsDelete');
  socket.on('recieve offeringsDelete',function(offering_id) {
    $location.path('/projects');
  });
};

controllers.talk = function ($scope, $window, socket) {
  socket.emit('request talk');
  socket.on('recieve talk',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.user = {
      username : '{{ username }}',
      password : '{{ password }}'
    };
    socket.on('connect', function() {
       // Connected, let's authenticate over sockets.
       console.log("AUTH")
       socket.emit('authenticate', {username: user.username, password: user.password });
    });

    socket.on('message', function (data) {
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
      socket.emit('room', {room:user.roomname});
    });

    $("#chatsend").click( function(data) {
      data.preventDefault();
      console.log("Sending "+ $("#chatmessage").val() +" to "+ $("#roomname").val() )
      var messagetextinput = $("#chatmessage").val();
      socket.emit('message', {messagetext: messagetextinput} );
    })

    $scope.$digest();
  });

};

controllers.external = function ($scope, $window, socket) {
  socket.emit('request external');
  socket.on('recieve external',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.workView = function ($scope, $window, socket) {
  socket.emit('request work');
  socket.on('recieve work',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.workInvoicesView = function ($scope, $window, socket) {
  socket.emit('request workInvoices');
  socket.on('recieve workInvoices',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.workInvoicesNew = function ($scope, $window, socket) {
  socket.emit('request workInvoicesNew');
  socket.on('recieve workInvoicesNew',function(data) {
    $window.location = "/work/invoices/edit/"+data; //takes us to the new blank invoice
    //$scope.$digest();
  });

};

controllers.workInvoicesEdit = function ($scope, $window, socket) {
  socket.emit('request workInvoicesEdit');
  socket.on('recieve workInvoicesEdit',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};


controllers.admin = function ($scope, $window, socket) {
  socket.emit('request admin');
  socket.on('recieve admin',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};


controllers.adminUsers = function ($scope, $window, socket) {
  socket.emit('request adminUsers');
  socket.on('recieve adminUsers',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });

};

controllers.error = function ($scope, $window, socket) {
  socket.emit('request error');
  socket.on('recieve error',function(data) {
    $scope.loginpage = data.loginpage;
    $scope.$digest();
  });
};

//search up prototype chain
app.controller(controllers);