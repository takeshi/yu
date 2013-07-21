'use strict';

angular.module('d3App', [])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/datamodel.html',
        controller: 'DatamodelCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
