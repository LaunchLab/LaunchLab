app.directive("topNav", function(socket, levelAuthorisation) {
  return {
    restrict: 'E',
    templateUrl: '/directives/templates/topNavDirective.html',
    scope: {},
    link: function(scope, elements, attrs) {
    	scope.loginModalEnterEventHandler = function() {
        scope.$root.$broadcast('loginModalWindowOpen');
      };
      scope.settingsModalEnterEventHandler = function() {
        scope.$root.$broadcast('settingsModalWindowOpen');
      };
    }
  };
});

