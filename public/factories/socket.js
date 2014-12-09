//var io = require('socket.io-client');
app.factory('socket', function ($rootScope) {
    var public = io('http://beta-launchlab.rhcloud.com:8000/public'),
        restricted = io('http://beta-launchlab.rhcloud.com:8000/restricted');

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
    disconnect: function(close) {
        return socket.disconnect(close);
    },
    id: public.id
  };
});
