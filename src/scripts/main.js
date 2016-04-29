'use strict';

require([
    'game',
    'player'
  ], function (game, Player) {

    var 
      initializedPromise = new Promise(function (resolve, reject) {
        gapi.hangout.onApiReady.add(function(evt) {
          if (evt.isApiReady) {
            resolve();
          }
        });
      });

    //------------------------------------------------------------------------
    // Initialize listeners
    //------------------------------------------------------------------------
    initializedPromise
      .then(function () {
        // TODO:
      });

  });
  