'use strict';

define('app', [
    'game',
    'player',
    'events',
    'ui'
  ], function (game, player, events, ui) {

    var 
      app;

    app = angular.module('app', [
        // TODO: dependencies
      ]);

    // run blocks
    app.run(['$rootScope', function ($rootScope) {
        $rootScope.game = game;

        // hook up the UI
        $rootScope.join = function () {
          events.trigger('ui.1.button.join.click');
        };

        events.on('ui.1.game.players.changed', function (data) {
          $rootScope.$apply();
        });

      }]);
    

    return app;
  });