/*
*	Featured Marketplace directive
*/
app.directive('featuredMarketPlace', function(socket){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/directives/templates/featuredMarketPlaceDirective.html',
    scope:{
    	//data: '=data'
    },
  link: function(scope, element, attrs) {
	socket.emit('request dashboard');
	socket.on('recieve dashboard', function(data) {
	    console.log(data.offerings);
	    scope.currentProject = 0;
	    scope.featured = data.offerings[scope.currentProject];
	    scope.offerings = data.offerings;

	    scope.leftBanner = function() {
	        scope.currentProject -= 1;
	        if (scope.currentProject < 0) {
	            scope.currentProject = scope.offerings.length - 1
	        }
	        updateBanner();
	    };

	    scope.rightBanner = function() {
	        scope.currentProject += 1;
	        if (scope.currentProject > scope.offerings.length - 1) {
	            scope.currentProject = 0
	        }
	        updateBanner();
	    };

	    var updateBanner = function() {
	        $("#bannerTitle").html(scope.offerings[scope.currentProject].title)

	        var shortdesc = "";

	        function limitlng(input, idx) {
	            if (input.length > idx) {
	                input = input.substring(0, idx - 1) + "...";
	            }
	            return input;
	        }

	        shortdesc = limitlng(scope.offerings[scope.currentProject].descriptionmarked, 50);

	        $("#bannerDescription").html("");
	        $("#bannerDescription").html(shortdesc);
	        $("#bannerImage").css("background-image", 'url("/offerings/' + scope.offerings[scope.currentProject].samplefiles[0] + '")');

	        var creatorHtml = 'BY <a href="/#/' + scope.offerings[scope.currentProject].creator + '">' + scope.offerings[scope.currentProject].creator + '</a>'
	        $("#bannerCreator").html(creatorHtml)
	        console.log('url("/offerings/' + scope.offerings[scope.currentProject].samplefiles[0] + '")')

	        $("#bannerLink").attr("href", "/#/offerings/view/" + scope.offerings[scope.currentProject]._id)
	        $("#bannerLinkButton").attr("href", "/#/offerings/view/" + scope.offerings[scope.currentProject]._id)
	    }

	    function keyDown(event) {
	        if (event.keyCode == 37) {
	            scope.leftBanner();
	        }
	        if (event.keyCode == 39) {
	            scope.rightBanner();
	        }
	    }

	    updateBanner();

	    document.addEventListener('keydown', keyDown, false);

	    var resizeBanner = function() {
	        var bannerheight = $(".bannerWrap").width() * 0.375;

	        if (window.innerWidth < 768) {
	            $(".bannerWrap").height(bannerheight * 2);
	        } else {
	            $(".bannerWrap").height(bannerheight);
	        }

	        $(".bannerImage").height(bannerheight);
	        $(".bannerText").height(bannerheight);

	        $(".bannerNav").height(bannerheight);
	        var postop = 128; //$(".bannerWrap").offset().top;
	        console.log(postop)
	        $(".bannerNav").css("top", postop);
	        $(".bannerNav i").css("margin-top", (bannerheight / 2) - 10);
	        $(".bannerTextWrap").css("font-size", Math.round($(".bannerWrap").width() * 0.015));
	    }
	    resizeBanner();

	    window.addEventListener('resize', resizeBanner, false);

	    scope.loginpage = data.loginpage;
	    scope.$digest();
	});

      scope.$watch('data', function (newVal, oldVal) {
        //el.datum(newVal).call(chart);
      });

    scope.$watch(function(){
      return element[0].clientWidth * element[0].clientHeight;
    },function(){
    	//resize function
    });
    }
  }
})
