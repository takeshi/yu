'use strict';

describe('Controller: DatamodelCtrl', function () {

  // load the controller's module
  beforeEach(module('d3App'));

  var DatamodelCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DatamodelCtrl = $controller('DatamodelCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
