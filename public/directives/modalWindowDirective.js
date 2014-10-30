app.directive("modalWindow", function($compile, $timeout, $location) {
  return {
  	// required to make it work as an element
    restrict: 'E',
    // replace <modalWindow> with this html
    template: '<modalWindow class="md-modal md-effect" id="modal"><div class="md-content"><md-close ng-click="modalWindowClose()"></md-close><md-title></md-title><md-view></md-view><hr class="md-hr" /><md-footer ng-click="modalWindowFooter()"></md-footer></div></modalWindow>',
    replace: true,
    scope: {
      rawHtml: '=bindCompiledHtml',
      title: '=bindTitle',
      use: '=use'
    },
    //DOM Manipulation
    link: function(scope, elements, attrs) {
    	$('.md-overlay').on('click', function(event) {
    		elements.find('modalWindow').prevObject[0].classList.remove("md-show");
    		$('.md-overlay').css('display', 'none');
    		$('.md-overlay').css('opacity', '0');
    	});
    	scope.$root.$on(scope.use+'Open', function() {
		    elements.find('modalWindow').prevObject[0].classList.add("md-show");
    		$('.md-overlay').css('display', 'initial');
    		$('.md-overlay').css('opacity', '1');
		});

		scope.$root.$on(scope.use+'Swap', function() {
    		elements.find('modalWindow').prevObject[0].classList.remove("md-show");
    	});

    	scope.modalWindowClose = function() {
    		elements.find('modalWindow').prevObject[0].classList.remove("md-show");
    		$('.md-overlay').css('opacity', '0');
    		$interval(function(){$('.md-overlay').css('display', 'none');},'3000' );
    	};

    	scope.modalWindowFooter = function() {
    		elements.find('modalWindow').prevObject[0].classList.remove("md-show");
    		$('.md-overlay').css('opacity', '0');
    		$interval(function(){$('.md-overlay').css('display', 'none');$location.path('/');},'3000' );
    	};

      	scope.$watch('rawHtml', function(value) {
        	if (!value) return;
			var newElem = $compile(value)(scope.$parent);
        	elements.find('md-view').html(newElem);
      	}); 

      	scope.$watch('title', function(value) {
        	if (!value) return;
        	elements.find('md-title').html(scope.title);
      	}); 
      	
    }
  };
});