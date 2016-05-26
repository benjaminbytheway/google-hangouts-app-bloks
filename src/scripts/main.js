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

      })
      //----------------------------------------------------------------------
      // Initialize listeners
      //----------------------------------------------------------------------
      .then(function () {

        //--------------------------------------------------------------------
        // from others in the hangout
        //--------------------------------------------------------------------

        // listener for onStateChanged
        gapi.hangout.data.onStateChanged.add(function(event) {
          // event.addedKeys
          // event.metadata
          // event.removedKeys
          // event.state
        });

        // listener for enabled participants
        gapi.hangout.onParticipantsDisabled.add(function (event) {
          // event.disabledParticipants

          console.log('disabled');

          var 
            i, l,
            j,
            disabledParticipant,
            player;

          for (i = 0, l = event.disabledParticipants.length; i < l; i++) {
            disabledParticipant = event.disabledParticipants[i];

            for (j = game.players.length - 1; j >= 0; j--) {
              player = game.players[j];

              if (disabledParticipant.id === player.id) {
                game.removePlayer({
                  player: player
                });
              }

            }

          }
        });

      });

  });
  