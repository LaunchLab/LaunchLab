app.directive("topNav", function($document) {
  return {
    restrict: 'E',
    template: '<div class="topnav" ng-controller="topNav"><div class="topnavProfile"><div ng-if="var0" class="animate-if" ><div class="topnavProfileName"><a href="/{{user.username}}"><div class="topnavProfilePicture" style="background-image: url(/images/avatar.jpg)"><img src="{{user.avatar}}" width="40" height="40" ></div><div class="topnavProfileNameButton">{{user.username}}</div></a></div><div class="topnavOptions"><div class="topnavOptionsButton" ng-click="var4"><i class="fa fa-gear"></i></div></div><a href="/work"><div class="topnavMessages"><div class="topnavMessagesButton"><span ng-if="user.unreadmessages > 0" class="animate-if spotcolour"><i class="fa fa-envelope "></i>! 1</span><span ng-if="user.unreadmessages===0"><i class="animate-if fa fa-envelope "></i></span></div></div></a><div class="topnavCart"><a href="/cart"><div class="topnavCartButton"><i class="fa fa-shopping-cart carticon"></i> TOTAL &nbsp;&nbsp;&nbsp;<span class="spotcolour"><i class="fa fa-bitcoin"></i>{{user.cart.carttotal}}</span></div></a></div></div><div ng-if="!var0" class="animate-if"><div class="topnavLogin"><div ng-click="loginModalEnterEventHandler()" class="topnavLoginButton"> LOGIN </div></div><div class="topnavRegister"><div ng-click="registerModalEnterEventHandler()" class="topnavRegisterButton"> CREATE ACCOUNT </div></div></div></div></div><div class="topnavOptionsMenu"><a href="/profile"><i class="fa fa-fw fa-edit "></i> edit profile</a><br><a href="/offerings/new"><i class="fa fa-fw fa-upload "></i> upload</a><br><a href="/logout"><i class="fa fa-fw fa-times "></i> logout</a><br></div>',
    scope: {
      //rawHtml: '=bindCompiledHtml',
      //modalWindowExitEventHandler: '&ngClick'
    },
    link: function(scope, elements, attrs, modalWindowCtrl) {
    	scope.loginModalEnterEventHandler = function() {
    		$document.triggerHandler('loginModalWindowOpen');
		};
		scope.registerModalEnterEventHandler = function() {
			$document.triggerHandler('registerModalWindowOpen');
		};
      /*scope.$watch('rawHtml', function(value) {
        if (!value) return;
        // we want to use the scope OUTSIDE of this directive
        // (which itself is an isolate scope).
        var newElem = $compile('<div class="md-modal md-effect" id="modal"><div class="md-content"><button class="md-close" ng-click="modalWindowExitEventHandler()">Close</button><h3></h3><div>'+value+'</div></div></div>')(scope.$parent);
        elements.contents().remove();
          console.log(elements);
        elements.prepend(newElem);
      });*/
    }
  };
});

