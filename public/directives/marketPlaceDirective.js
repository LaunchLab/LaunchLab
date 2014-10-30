/*
*	Marketplace directive
*/
app.directive('marketPlace', function(socket, $filter){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/directives/templates/marketPlaceDirective.html',
    scope : {
    	tagFilter : "&"
    },
  	link: function(scope, element, attrs) {
  		scope.filterUpdate = function (value) {
  			tagFilter = value;
  			console.log(tagFilter);
  		}
		socket.emit('request dashboard');
		socket.on('recieve dashboard', function(data) {
		    scope.offerings = data.offerings;
		    scope.$digest();
		});
	
    }
  }
})
