/*
*	Marketplace directive
*/
app.directive('mentorDashboard', function(socket, $filter){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/directives/templates/mentorDashboardDirective.html',
    scope : {
    	tagFilter : "&"
    },
  	link: function(scope, element, attrs) {
  		scope.filterUpdate = function (value) {
  			tagFilter = value;
  			console.log(tagFilter);
  		}
		socket.emit('public', 'request mentorDashboard');
		socket.on('public', 'recieve mentorDashboard', function(data) {
		    scope.offerings = data.offerings;
		    //scope.$digest();
		});
	
    }
  }
})
