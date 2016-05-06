'use strict';

define('game', [
    'player',
    'events'
  ], function (Player) {
    var game,
      gameData;

    game = {

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

      stages: {
        LOBBY: 1, // waiting for game to start
        LOADING: 2,
        PLAY: 3,
        DETERMINE_WINNER: 4,
        CONGRATULATIONS: 5
      },

      // The current stage of the game
      currentStage: 0,

      startStage: function (stage) {
        var self = this;

        self.currentStage = stage;

        if (self.currentStage === self.stages.LOBBY) {

        } else if (self.currentStage === self.stages.LOADING) {

        }
      },

      startGame: function () {

      },

    };

    return game;

  });