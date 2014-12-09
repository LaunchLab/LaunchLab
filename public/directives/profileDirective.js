app.directive("profile", function(socket, upload, ms) {
  return {
    restrict: 'E',
    templateUrl: '/directives/templates/profileDirective.html',
    scope: {},
    link: function(scope, elements, attrs) {
    	socket.emit('restricted', 'request profile', localStorage["token"]);
      	socket.on('restricted', 'recieve profile',function(data) {
          var newData = JSON.parse(data);
    		  scope.user = newData;
      	});
      socket.on('restricted', 'recieve profileUpdated',function(fileName) {
      		console.log("profile updated successfully");
      		//scope.profileUpdated = true;
      });
      var uploads = [];
      upload.addEventListener("complete", function(event) {
        console.log("complete called successfully");
        console.log(uploads);
        for(var i=0; i<uploads.length; i++){
          if(ms.unsealer(uploads[i][0], event.file.name)){
            console.log('calling avatar modal');
            scope.$root.$broadcast('crop avatar', uploads[i][1]);
          }
        };
        uploads = [];      
      });
      socket.on('restricted', 'recieve avatarSaved',function(fileName) {
        scope.user.avatar = fileName;
        scope.$root.$broadcast('avatarCropModalWindowClose');
      });

      document.getElementById('avatar_drop_zone2').addEventListener("drop", function(event){
        event.preventDefault();
        var files = event.target.files || event.dataTransfer.files;
        for(var i=0; i<files.length; i++){
          uploads.push([ms.sealer("profile" + i, files[i].name), event]);
          console.log(uploads);
        };
      }, false)
      document.getElementById('avatarOverlay').addEventListener("drop", function(event){
        event.preventDefault();
        var files = event.target.files || event.dataTransfer.files;
        for(var i=0; i<files.length; i++){
          uploads.push([ms.sealer("profile" + i, files[i].name), event]);
          console.log(uploads);
        };
      }, false);
      //3
      document.getElementById('avatar_drop2').addEventListener("change", function(event){
        event.preventDefault();
        var files = event.target.files || event.dataTransfer.files;
        for(var i=0; i<files.length; i++){
          uploads.push([ms.sealer("profile" + i, files[i].name), event]);
          console.log(uploads);
        };
      }, false);

      upload.listenOnInput(document.getElementById('avatar_drop2'));
      upload.listenOnDrop(document.getElementById('avatar_drop_zone2'));
      upload.listenOnDrop(document.getElementById('avatarOverlay'));

    	scope.submit = function() {
    		var data = scope.user;
    		data.token = localStorage["token"];
      		socket.emit('restricted', 'request profileUpdate', JSON.stringify(data));
    	};
    }
  };
});