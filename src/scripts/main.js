'use strict';

require([
    'game',
    'player',
    'events'
  ], function (game, Player, events) {

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
          // event.addedKeys
          // event.metadata
          // event.removedKeys
          // event.state

          if (event.state.eventName === 'playerJoined') {
            events.trigger('playerJoined', event.state.players);
          }
        });

        // listener for enabled participants
        gapi.hangout.onParticipantsDisabled.add(function (event) {
          // event.disabledParticipants

          var i, l;

          for (i = 0, l = event.enabledParticipants.length; i < l; i++) {
            // TODO: remove the participant that were removed
          }
        });

        // gapi.hangout.onEnabledParticipantsChanged.add(function (event) {
        //   // event.enabledParticipants

        //   var i, l;

        //   for (i = 0, l = event.enabledParticipants.length; i < l; i++) {
        //     // 
        //   }
        // });

        // start the Lobby stage of the game
        game.startStage(game.stages.LOBBY);
      });

  });
  