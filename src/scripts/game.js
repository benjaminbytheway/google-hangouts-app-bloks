'use strict';

define([
    'player'
  ], function (Player) {

    return {

      //------------------------------------------------------------------------
      // Players
      //------------------------------------------------------------------------

      players: [],

      // to add a new player to the game
      addPlayer: function (config) {
        var
          self = this,
          player;

        // make sure that we only add up to 4 players
        if (self.players.length < 4) {
          player = new Player(config);

          self.setHost(player);

          self.players.push(player);

          return true;
        } else {
          return false;
        }
      },

      removePlayer: function (player) {
        var
          i;

        for (i = self.players.length - 1; i >= 0; i--) {
          if (self.players[i] === player) {
            self.players.splice(i, 1);
            return true;
          }
        }

        return false;
      },

      host: null,

      setHost: function (player) {
        if (
          self.players.length === 0 &&
          player.type === 'human'
        ) {
          self.host = player;
          return true;
        } else {
          return false;
        }
      },

      //------------------------------------------------------------------------
      // Game Stages
      //------------------------------------------------------------------------

      // The current stage of the game
      // 1) Lobby (waiting for game to start)
      currentStage: 1, 

      startGame: function () {

      },

    };

  });