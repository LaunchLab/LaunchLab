app.factory('socket', function ($rootScope, handshakeConstant) {
	var public = io.connect(),
		restricted = io.connect('http://localhost/restricted');

  return {
    on: function (nameSpace, eventName, callback) {
    	if (nameSpace !== 'restricted') {
    		public.on(eventName, function () {  
		        var args = arguments;
		        $rootScope.$apply(function () {
		          callback.apply(public, args);
		        });
		    });
    	} else{
    		restricted.on(eventName, function () {  
		        var args = arguments;
		        $rootScope.$apply(function () {
		          callback.apply(restricted, args);
		        });
		    });
    	};
    },
    emit: function (nameSpace, eventName, data, callback) {
    	if (nameSpace !== 'restricted') {
    		public.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(public, args);
	          }
	        });
	      })
    	} else{
    		restricted.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(restricted, args);
	          }
	        });
	      })
    	};
    },
    levelAuthority : handshakeConstant.levelAuthority
  };
});
