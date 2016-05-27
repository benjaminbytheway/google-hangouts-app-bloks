'use strict';

require([
    'app',
    'game',
    'player',
    'events',
    'ui',
    'controllers/game',
  ], function (app, game, Player, events, ui) {

    var 
      hangoutOnApiReadyPromise = new Promise(function (resolve, reject) {
        gapi.hangout.onApiReady.add(function(evt) {
          if (evt.isApiReady) {
            resolve();
          }
        });
      });
    
    hangoutOnApiReadyPromise
      //----------------------------------------------------------------------
      // Initialize local copies
      //----------------------------------------------------------------------
      .then(function () {

        // start the app
        angular.bootstrap(document, ['app']);

        // TODO: loading screen fade out, app fade in...

      });

  });
  