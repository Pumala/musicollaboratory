var app = angular.module('music_app', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'home',
    url: '/',
    templateController: 'templates/home.html',
    controller: 'HomeController'
  }),
  .state({
    name: 'login',
    url: '/login',
    templateController: 'templates/login.html',
    controller: 'LoginController'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateController: 'templates/signup.html',
    controller: 'SignupController'
  })

  $urlRouterProvider.otherwise('/');

})
