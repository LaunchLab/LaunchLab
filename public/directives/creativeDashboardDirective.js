/*
*	Marketplace directive
*/
app.directive('creativeDashboard', function(socket, $filter){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/directives/templates/creativeDashboardDirective.html',
    scope : {
    	tagFilter : "&"
    },
  	link: function(scope, element, attrs) {
  		scope.filterUpdate = function (value) {
  			tagFilter = value;
  			console.log(tagFilter);
  		}
		socket.emit('public', 'request creativeDashboard');
		socket.on('public', 'recieve creativeDashboard', function(data) {
		    scope.offerings = data.offerings;
		    //scope.$digest();
		});
	
    }
  }
})
