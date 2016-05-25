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
      }),
      parseState = function (state) {
        var 
          property,
          stateParsed = {};

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            stateParsed[property] = JSON.parse(state[property]);
          } catch (e) {}
        }

        return stateParsed;
      },
      serializeState = function (state) {
        var 
          property,
          stateSerialized = {};

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            stateSerialized[property] = JSON.stringify(state[property]);
          } catch (e) {}
        }

        return stateSerialized;
      },
      state,
      me,
      updateState = function () {
        state.writerId = me.id;
        gapi.hangout.data.submitDelta(serializeState(state));
      };

    
    hangoutOnApiReadyPromise
      //----------------------------------------------------------------------
      // Initialize local copies
      //----------------------------------------------------------------------
      .then(function () {

        // start the app
        angular.bootstrap(document, ['app']);

        // Get my participant
        me = gapi.hangout.getLocalParticipant();

        // Get the current state of the app and determine where to bring this enabled user into the flow
        state = parseState(gapi.hangout.data.getState());

        // Start the game
        // TODO: figure out conflicts when two people join at the same time
        if (!state.game) {

          // update State with the new game config
          state.game = {
            currentStage: game.STAGES.LOBBY
          };
          updateState();

          // start the game
          game.initialize({
            game: state.game
          });

          // don't need this anymore with angular
          // events.trigger('ui.1.game.players.changed', {
          //   game: game
          // });

        } else {

          game.initialize({
            game: state.game
          });

          // don't need this anymore with angular
          // events.trigger('ui.1.game.players.changed', {
          //   game: game
          // });

        }

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

          state = parseState(event.state);

          // If we sent the message, then return
          if (state.writerId === me.id) {
            return;
          }

          // handle events
          if (state.eventName === 'game.addPlayer') {
            game.updatePlayers(state.game.players);

            events.trigger('ui.1.game.players.changed', {
              game: game
            });
          }

          if (state.eventName === 'game.removePlayer') {
            game.updatePlayers(state.game.players);

            events.trigger('ui.1.game.players.changed', {
              game: game
            });
          }

          if (state.eventName === 'game.setHost') {
            game.setHost({
              player: state.game.host,
              supressEvent: true
            });

            events.trigger('ui.1.game.players.changed', {
              game: game
            });
          }
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

        //--------------------------------------------------------------------
        // from me
        //--------------------------------------------------------------------
        events.on('game.addPlayer', function (data) {

          // tell UI to update
          // don't need this anymore with angular
          // events.trigger('ui.1.game.players.changed', {
          //   game: game
          // });

          // tell everyone else to update
          state.game.players = game.players;
          state.eventName = 'game.addPlayer';
          updateState();
        });

        events.on('game.removePlayer', function (data) {
          
          // tell UI to update
          // don't need this anymore with angular
          // events.trigger('ui.1.game.players.changed', {
          //   game: game
          // });

          // tell everyone else to update
          state.game.players = game.players;
          state.eventName = 'game.removePlayer';
          updateState();
        });

        events.on('game.setHost', function (data) {

          // tell the layout to display a notice
          if (me.id === game.host.id) {
            gapi.hangout.layout.displayNotice('You have just been made the game host.');
          }

          // tell UI to update
          // don't need this anymore with angular
          // events.trigger('ui.1.game.players.changed', {
          //   game: game
          // });

          // tell everyone else to update
          state.game.host = game.host;
          state.eventName = 'game.setHost';
          updateState();
        });

        events.on('game.startStage', function (data) {
          state.game.stage = game.stage;
          state.eventName = 'game.startStage';

          updateState();
        });

        //--------------------------------------------------------------------
        // from ui
        //--------------------------------------------------------------------
        events.on('ui.1.button.join.click', function () {

          game.addPlayer({
            player: {
              type: 'human',
              id: me.id,
              name: me.person.displayName,
              image: me.person.image.url
            }
          });

        });

      });

  });
  