var app = angular.module('app', ['ngRoute','ngSanitize']);
app.constant('handshakeConstant', { levelAuthority : '' });
app.config(function($routeProvider, $locationProvider, handshakeConstant, $httpProvider){

	/*	use the HTML5 History API	*/
	$locationProvider.html5Mode(true);

	/*	use token interceptors	*/
	$httpProvider.interceptors.push('TokenInterceptor');

	/*	Router	*/
	$routeProvider
		.when('/',
		{
			controller:'home',
			templateUrl:'views/home.html',
			access: { requiredLogin: false }
		})
		/*
		.when('/:username', 
                {   
                    controller:profileView, 
                    templateUrl: function(handshakeConstant){
						switch (handshakeConstant) {
						  case "":
						    return 'views/home.html';
						    break;
						  case "admin":
						    return 'views/admin/profile.html';
						    break;
						  case "client":
						    return 'views/client/profile.html'
						    break;
						  case "mentor":
						    return 'views/mentor/profile.html';
						    break;
						  case "creative":
						    return 'views/creative/portfolio.html';
						    break;
						  default:
						    return 'views/home_loggedin.html';
						}
                    },
                    access: { requiredLogin: false }
                }
            )
		*/
		.when('/:username',
		{
			controller:'profileView',
			templateUrl:'views/profile.html',
			access: { requiredLogin: false }
		})
		.when('/projects/view/:id',
		{
			controller:'offeringsView',
			templateUrl:'views/projects/view.html',
			access: { requiredLogin: false }
		})
		.when('/projects/new',
		{
			controller:'offeringsEdit',
			templateUrl:'views/projects/edit.html',
			access: { requiredLogin: false }
		})
		.when('/projects/order/:id',
		{
			controller:'offeringsOrder',
			templateUrl:'views/projects/order.html',
			access: { requiredLogin: false }
		})
		.when('/projects/edit/:id',
		{
			controller:'offeringsEdit',
			templateUrl:'views/projects/edit.html',
			access: { requiredLogin: false }
		})
		.when('/projects/confirm:id',
		{
			controller:'offeringsConfirm',
			templateUrl:'views/projects/confirm.html',
			access: { requiredLogin: false }
		})
		.when('/projects/delete/:id',
		{
			controller:'offeringsDelete',
			templateUrl:'views/projects/delete.html',
			access: { requiredLogin: false }
		})
		.when('/work',
		{
			controller:'workView',
			templateUrl:'views/work/work.html',
			access: { requiredLogin: false }
		})
		.when('/work/invoices',
		{
			controller:'workInvoicesView',
			templateUrl:'views/work/work_invoices.html',
			access: { requiredLogin: false }
		})
		.when('/work/invoices/new',
		{
			controller:'workInvoicesNew',
			templateUrl:'views/work/work.html',
			access: { requiredLogin: false }
		})
		.when('/work/invoices/edit/:id',
		{
			controller:'workView',
			templateUrl:'views/work/work_invoices_edit.html',
			access: { requiredLogin: false }
		})
		.when('/admin/dashboard',
		{
			controller:'adminDashboard',
			templateUrl:'views/admin/dashboard.html',
			access: { requiredLogin: false }
		})
		.when('/mentor/dashboard',
		{
			controller:'mentorDashboard',
			templateUrl:'views/mentor/dashboard.html',
			access: { requiredLogin: false }
		})
		.when('/creative/dashboard',
		{
			controller:'creativeDashboard',
			templateUrl:'views/mentor/dashboard.html',
			access: { requiredLogin: false }
		})
		.when('/error',
		{
			controller:'error',
			templateUrl:'views/error.html',
			access: { requiredLogin: false }
		})
		.otherwise({ redirectTo: '/error' });
});

app.run(function($rootScope, $location, AuthenticationService) {
    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
        if (nextRoute.access.requiredLogin && !AuthenticationService.isLogged) {
            $location.path("/admin/login");
        }
    });
});