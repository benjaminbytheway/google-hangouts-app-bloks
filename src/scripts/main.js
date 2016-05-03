'use strict';

require([
    'game',
    'player'
  ], function (game, Player) {

    var 
      hangoutOnApiReadyPromise = new Promise(function (resolve, reject) {
        gapi.hangout.onApiReady.add(function(evt) {
          if (evt.isApiReady) {
            resolve();
          }
        });
      }),
      initialize = function () {
        
      };

    //------------------------------------------------------------------------
    // Initialize listeners
    //------------------------------------------------------------------------
    hangoutOnApiReadyPromise
      .then(function () {
        var state;

        // listener for onStateChanged
        gapi.hangout.data.onStateChanged.add(function(event) {
          // TODO:
          event.addedKeys
          event.metadata
          event.removedKeys
          event.state
        });

        state = gapi.hangout.data.getState();

        // start the Lobby stage of the game
        game.startStage(game.stages.LOBBY);
      });

  });
  