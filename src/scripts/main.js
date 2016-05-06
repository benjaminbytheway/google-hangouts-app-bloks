'use strict';

require([
    'game',
    'player',
    'events',
    'ui'
  ], function (game, Player, events, ui) {

    var 
      hangoutOnApiReadyPromise = new Promise(function (resolve, reject) {
        gapi.hangout.onApiReady.add(function(evt) {
          if (evt.isApiReady) {
            resolve();
          }
        });
      }),
      parseState = function (state) {
        var property;

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            state[property] = JSON.parse(state[property]);
          } catch (e) {}
        }

        return state;
      },
      serializeState = function (state) {
        var property;

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            state[property] = JSON.stringify(state[property]);
          } catch (e) {}
        }

        return state;
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

        // Get my participant
        me = gapi.hangout.getLocalParticipant();

        // Get the current state of the app and determine where to bring this enabled user into the flow
        state = parseState(gapi.hangout.data.getState());

        // Start the game
        if (!state.game) {

          // Start the game
          // TODO: figure out conflicts when two people join at the same time
          events.trigger('game.initalize', {
            game: {
              currentStage: game.STAGES.LOBBY
            }
          });
          gapi.hangout.data.submitDelta(serializeState(state));

        } else {

          events.trigger('game.initalize', {
            game: state.game
          });

        }

      })
      //----------------------------------------------------------------------
      // Initialize listeners
      //----------------------------------------------------------------------
      .then(function () {

        //--------------------------------------------------------------------
        // from others in the hangout
        //--------------------------------------------------------------------
        events.on('game.initalize', function (data) {
          game.initalize(data);
        }, true);

        // listener for onStateChanged
        gapi.hangout.data.onStateChanged.add(function(event) {
          // event.addedKeys
          // event.metadata
          // event.removedKeys
          // event.state

          var 
            state = parseState(event.state);

          // If we sent the message, then return
          if (state.writerId === me.id) {
            return;
          }

          // handle events
          if (event.state.eventName === 'game.addPlayer') {
            game.reconcilePlayers(state.game.players);

            events.trigger('ui.1.game.players.changed', {
              players: game.players
            });
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

        //--------------------------------------------------------------------
        // from me
        //--------------------------------------------------------------------
        events.on('game.addPlayer', function (data) {
          state.game.players = data.game.players;
          state.eventName = 'game.addPlayer';

          updateState();
        });

        events.on('game.startStage', function (data) {
          state.game.stage = data.game.stage;
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
              name: me.person.displayName
            }
          });
        });

      });

  });
  