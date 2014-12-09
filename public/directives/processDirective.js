app.directive("process", function(levelAuthorisation, $timeout) {
  return {
    restrict: 'E',
    templateUrl: '/directives/templates/processDirective.html',
    scope: {},
    link: function(scope, elements, attrs) {
        scope.updateLevelAuthority = function(levelAuthority){
            levelAuthorisation.levelAuthority = levelAuthority;
        };
    	scope.joinTeamModalEnterEventHandler = function() {
            scope.$root.$broadcast('updateLevelAuthority');
    		scope.$root.$broadcast('registerModalWindowOpen');
    	};
    	scope.newProjectModalEnterEventHandler = function() {
    		scope.$root.$broadcast('newProjectModalWindowOpen');
    	};
    }
  };
});

