var app = angular.module('app', ['ngRoute','ngSanitize', 'ngImgCrop']);
app.constant('levelAuthorisation', { levelAuthority : '' });
app.config(function($routeProvider, $locationProvider, levelAuthorisation){

	/*	use the HTML5 History API	*/
	$locationProvider.html5Mode(true);

	/*	Router	*/
	$routeProvider
		.when('/',
		{
			controller:'landingPage',
			templateUrl:'views/landingPage.html'
		})
		.when('/:username', 
                {   
                    controller:'profile', 
                    templateUrl: function(){
						switch (levelAuthorisation.levelAuthority) {
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
						    return 'views/error.html';
						}
                    }
                }
            )
		.when('/projects/view/:id',
		{
			controller:'offeringsView',
			templateUrl:'views/projects/view.html'
		})
		.when('/projects/new',
		{
			controller:'offeringsEdit',
			templateUrl:'views/projects/edit.html'
		})
		.when('/projects/order/:id',
		{
			controller:'offeringsOrder',
			templateUrl:'views/projects/order.html'
		})
		.when('/projects/edit/:id',
		{
			controller:'offeringsEdit',
			templateUrl:'views/projects/edit.html'
		})
		.when('/projects/confirm:id',
		{
			controller:'offeringsConfirm',
			templateUrl:'views/projects/confirm.html'
		})
		.when('/projects/delete/:id',
		{
			controller:'offeringsDelete',
			templateUrl:'views/projects/delete.html'
		})
		.when('/work',
		{
			controller:'workView',
			templateUrl:'views/work/work.html'
		})
		.when('/work/invoices',
		{
			controller:'workInvoicesView',
			templateUrl:'views/work/work_invoices.html'
		})
		.when('/work/invoices/new',
		{
			controller:'workInvoicesNew',
			templateUrl:'views/work/work.html'
		})
		.when('/work/invoices/edit/:id',
		{
			controller:'workView',
			templateUrl:'views/work/work_invoices_edit.html'
		})
		.when('/admin/dashboard',
		{
			controller:'adminDashboard',
			templateUrl:'views/admin/dashboard.html'
		})
		.when('/mentor/dashboard',
		{
			controller:'mentorDashboard',
			templateUrl:'views/mentor/dashboard.html'
		})
		.when('/creative/dashboard',
		{
			controller:'creativeDashboard',
			templateUrl:'views/mentor/dashboard.html'
		})
		.when('/error',
		{
			controller:'error',
			templateUrl:'views/error.html'
		})
		.otherwise({ redirectTo: '/error' });
});