'use strict';

define('app', [
    // no dependencies
  ], function () {

    var
      app,
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
      STAGES = {
        LOBBY: 1, // waiting for game to start
        CHOOSE_COLOR: 2,
        PLAY: 3,
        DETERMINE_WINNER: 4,
        CONGRATULATIONS: 5
      };

    app = angular.module('app', [
        // TODO: dependencies
      ]);

    // run blocks
    app

      // initialize
      .run(['$rootScope', function ($rootScope) {

        // Get my participant
        $rootScope.me = gapi.hangout.getLocalParticipant();

        // get initial state, or initialize
        $rootScope.state = parseState(gapi.hangout.data.getState()) || {};

        //--------------------------------------------------------------------
        // Initialize the game (if not already initialized)
        //--------------------------------------------------------------------

        // game
        if (!$rootScope.state.game) {
          $rootScope.state.game = {};
        }

        // game.currentStage
        if (!$rootScope.state.game.currentStage) {
          $rootScope.state.game.currentStage = STAGES.LOBBY;
        }

        // players
        if (!$rootScope.state.players) {
          $rootScope.state.players = [];
        }

        // colors
        if (!$rootScope.state.colors) {
          $rootScope.state.colors = {};
        }
        
        //--------------------------------------------------------------------
        // get notifications from others in the hangout
        //--------------------------------------------------------------------
        gapi.hangout.data.onStateChanged.add(function(event) {
          // event.addedKeys
          // event.metadata
          // event.removedKeys
          // event.state

          var
            state,
            key,
            value,
            metadata;
          
          state = parseState(event.state);

          // If we sent the message, then return
          // if (state.writerId === $rootScope.me.person.id) {
          //   return;
          // } else {
          //   delete state.writerId;
          // }

          // TODO: Probably will need this in the future
          for (key in state) {
            value = state[key];
            metadata = event.metadata[key];

            if (key) {
              // console.log(key + ' updated elsewhere');
              // console.log(value);
              // console.log(metadata);
            }
          }

          $rootScope.state = state;

          // TODO: DEBUGGING (REMOVE)
          window.state = state;

          $rootScope.$apply();
        });

        //--------------------------------------------------------------------
        // notify others
        //--------------------------------------------------------------------
        $rootScope.$watch('state', function (newValue, oldValue, scope) {
          // console.log('---------------------$watch-------------------');
          // console.log('NEW');
          // console.log(newValue);
          // console.log('OLD');
          // console.log(oldValue);

          // set who is writing
          // $rootScope.state.writerId = $rootScope.me.person.id;

          // submit the changes
          gapi.hangout.data.submitDelta(serializeState($rootScope.state));

          // TODO: DEBUGGING (REMOVE)
          window.state = $rootScope.state;

        }, true); // TODO: Figure out a way not to do object equality


        //--------------------------------------------------------------------
        // Players
        //--------------------------------------------------------------------
        // TODO: Move this into it's own peice of code

        $rootScope.computers = 0;

        $rootScope.addPlayer = function (config) {
          var
            player,
            players;

          players = $rootScope.state.players;
          
          if (
            // make sure we have a player
            config.player &&
            // make sure we have an id for the player
            config.player.id &&
            // make sure that we only add up to 4 players
            players.length < 4 &&
            // make sure the player is added only once
            !$rootScope.findPlayerById(config.player.id)
          ) {
            player = {};

            // type
            if (config.player.type) {
              player.type = config.player.type;
            } else {
              throw new Error('config.player.type was not provided');
            }
            
            // human player
            if (player.type === 'human') {
              
              // id
              if (config.player.id) {
                player.id = config.player.id;
              } else {
                throw new Error('config.player.id was not provided');
              }

              // name
              if (config.player.name) {
                player.name = config.player.name;
              } else {
                throw new Error('config.player.name was not provided');
              }

              // image
              if (config.player.image) {
                player.image = config.player.image;
              } else {
                // TODO: Default image?
              }

            // computer player
            } else if (player.type === 'computer') {

              // id
              player.id = 'computer-' + Math.floor(Math.random() * 10000);

              // name
              player.name = 'Computer ' + $rootScope.computers + 1;

              // image
              // TODO: find a computer image

            } else {
              throw new Error('config.player.type is not a supported type (either "human", or "computer")');
            }

            // add the player
            players.push(player);

            // if we haven't set a host yet, set it
            if (
              !$rootScope.state.host &&
              player.type === 'human'
            ) {
              $rootScope.state.host = player;
            }

            return true;
          } else {
            return false;
          }
        };

        $rootScope.findPlayerById = function (id) {
          var
            i, l,
            player,
            players;

          players = $rootScope.state.players;

          for (i = 0, l = players.length; i < l; i++) {
            player = players[i];

            if (player.id === id) {
              return player;
            }
          }

          return null;
        };

        $rootScope.removePlayer = function (config) {
          var
            i,
            player,
            players;

          players = $rootScope.state.players;

          if (!config.player) {
            return false;
          }

          for (i = players.length - 1; i >= 0; i--) {
            if (players[i] === config.player) {
              player = players.splice(i, 1);
              return true;
            }
          }

          return false;
        };

        $rootScope.showLeaveModal = false;

        $rootScope.leave = function () {
          var
            i, l,
            player,
            players,
            isHostDisabled = false;

          players = $rootScope.state.players;

          if (
            $rootScope.state.host &&
            $rootScope.state.host.id === $rootScope.me.person.id
          ) {
            isHostDisabled = true;
          }

          if (isHostDisabled) {

            // assign no one as the host
            $rootScope.state.host = null;

            // loop through and find the first next human to become the host
            for (i = 0, l = players.length; i < l; i++) {
              player = players[i];

              if (
                // if this is not me
                $rootScope.me.person.id !== player.id &&
                // if the player is a human
                player.type === 'human'
              ) {
                // assign myself as the host
                $rootScope.state.host = player;
                break;
              }
            }
            
          }

          // remove myself from the game
          $rootScope.removePlayer({
            player: $rootScope.findPlayerById($rootScope.me.person.id)
          });
        };

        gapi.hangout.onParticipantsDisabled.add(function (event) {
          // event.disabledParticipants

          var 
            i, l,
            j,
            disabledParticipant,
            player,
            players,
            isHostDisabled = false,
            shouldHandle = false;

          players = $rootScope.state.players;

          // figure out if the host is leaving
          if ($rootScope.state.host) {
            for (i = 0, l = event.disabledParticipants.length; i < l; i++) {
              disabledParticipant = event.disabledParticipants[i];

              // Is the host leaving?
              if (disabledParticipant.person.id === $rootScope.state.host.id) {
                isHostDisabled = true;
                break;
              }

            }
          }

          // only handle this if:
          // a) I am the host or 
          // b) if the host is disconnecting and I am the first in line to become the host
          if (isHostDisabled) {

            // loop through and find the first next human to become the host
            for (i = 0, l = players.length; i < l; i++) {
              player = players[i];

              if (
                // if this is me
                $rootScope.me.person.id === player.id &&
                // if I am a human
                player.type === 'human' &&
                // if I am not the host
                $rootScope.state.host.id !== player.id
              ) {
                // assign myself as the host
                $rootScope.state.host = player;
                break;
              }
            }
            
          }

          // Only handle the removal of the player if you are the host or become the host
          if (
            $rootScope.state.host &&
            $rootScope.state.host.id === $rootScope.me.person.id
          ) {
            shouldHandle = true;
          }

          if (shouldHandle) {

            for (i = 0, l = event.disabledParticipants.length; i < l; i++) {
              disabledParticipant = event.disabledParticipants[i];
              
              for (j = players.length - 1; j >= 0; j--) {
                player = players[j];

                if (disabledParticipant.person.id === player.id) {
                  $rootScope.removePlayer({
                    player: player
                  });
                  break;
                }

              }

            }

          }

          $rootScope.$apply();
        });

        // TODO: window.unload to remove myself if I am the last human here...

        // TODO: When two of the same user ID (benjaminbytheway@gmail.com) connect to the hangout, and one of them is joineed and another drops out of the game,
        // make sure that we don't drop the one that is joined to the game...Or just identify users based on participant ID rather than person ID...so that multiple
        // can join and drop...

        // TODO: When a player drops, we need to either reassign the color(s) that the user is playing, or assign them to a computer...

        //--------------------------------------------------------------------
        // Stage 1
        //--------------------------------------------------------------------
        $rootScope.join = function () {
  
          $rootScope.addPlayer({
            player: {
              type: 'human',
              id: $rootScope.me.person.id,
              name: $rootScope.me.person.displayName,
              image: $rootScope.me.person.image.url
            }
          });

        };

        $rootScope.start = function () {
          $rootScope.state.game.currentStage = STAGES.CHOOSE_COLOR;
        };

        //--------------------------------------------------------------------
        // Stage 2
        //--------------------------------------------------------------------

        $rootScope.chooseColor = function (color) {
          if (
            $rootScope.remainingColors() && 
            !$rootScope.state.colors[color]
          ) {
            $rootScope.state.colors[color] = $rootScope.me.person.id;
          }
        };

        $rootScope.remainingColors = function () {
          var
            id,
            color,
            colors,
            players,
            remainingColors;

          colors = $rootScope.state.colors;
          players = $rootScope.state.players;

          // 2 player game
          if (players.length === 2) {
            remainingColors = 2;

          // 3 player game or 4 player game
          } else if (players.length === 3 || players.length === 4) {
            remainingColors = 1;
          }

          for (color in colors) {
            id = colors[color];

            if ($rootScope.me.person.id === id) {
              remainingColors--;
            }
          }

          return remainingColors;
        };

        $rootScope.getMyColors = function (labels) {
          var
            id,
            color,
            colors,
            myColors = [],
            map = {
              'blue': 'Blue',
              'red': 'Red',
              'green': 'Green',
              'yellow': 'Yellow'
            };

          colors = $rootScope.state.colors;

          for (color in colors) {
            id = colors[color];

            if ($rootScope.me.person.id === id) {
              if (labels && map[color]) {
                myColors.push(map[color]);
              } else {
                myColors.push(color);
              }
            }
          }

          return myColors;
        };

        $rootScope.displayColors = function () {
          var
            text = '',
            colors = $rootScope.getMyColors(true);

          if (colors[0]) {
            text = colors[0];

            if (colors[1]) {
              text += ' and ' + colors[1];
            }
          }

          return text;
        };


      }]);
    

    return app;
  });