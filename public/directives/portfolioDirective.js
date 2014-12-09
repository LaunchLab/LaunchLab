app.directive("portfolio", function(socket, upload, ms, $timeout) {
  return {
    restrict: 'E',
    templateUrl: '/directives/templates/portfolioDirective.html',
    scope: {},
    link: function(scope, elements, attrs) {
    	socket.emit('restricted', 'request portfolio', localStorage['token']);
      scope.portfolio = [];
      var uploads = [];

      socket.on('restricted', 'recieve portfolio',function(data) {
        var newData = JSON.parse(data);
        console.log(newData);
        scope.portfolio = newData.projects;
        if (scope.portfolio == undefined) {
          scope.portfolio = [];
        }    	  
        console.log(scope.portfolio);
      });

      socket.on('restricted', 'recieve portfolioUpdate',function(project) {
        scope.portfolio.push(JSON.parse(project));
        console.log(scope.portfolio);
        scope.$root.$broadcast('portfolioCropModalWindowClose');
      });

      socket.on('public', 'upload complete',function(event) {
        for(var i=0; i<uploads.length; i++){
          if(ms.unsealer(uploads[i][0], event.file.name)){
            scope.$root.$broadcast('crop portfolio', uploads[i][1]);
          };
        };
        uploads = []; 
      });
      document.getElementById('portfolioDropZone').addEventListener("drop", function(event){
        event.preventDefault();
        var files = event.target.files || event.dataTransfer.files;
        for(var i=0; i<files.length; i++){
          uploads.push([ms.sealer("portfolio" + i, files[i].name), event]);
        };
      }, false);
      //3
      document.getElementById('portfolioDrop').addEventListener("change", function(event){
        event.preventDefault();
        var files = event.target.files || event.dataTransfer.files;
        for(var i=0; i<files.length; i++){
          uploads.push([ms.sealer("portfolio" + i, files[i].name), event]);
        };
      }, false);
        upload.listenOnInput(document.getElementById('portfolioDrop'));
        upload.listenOnDrop(document.getElementById('portfolioDropZone'));
    }
  };
});