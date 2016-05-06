'use strict';

define('game', [
    'player',
    'events'
  ], function (Player, events) {
    var game;

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
        if (config.player && self.players.length < 4) {
          player = new Player(config.player);

          self.setHost(player);

          self.players.push(player);

          if (!config.supressEvent) {
            events.trigger('game.addPlayer', {
              game: self
            });
          }

          return true;
        } else {
          return false;
        }
      },

      removePlayer: function (player) {
        var
          self = this,
          i;

        for (i = self.players.length - 1; i >= 0; i--) {
          if (self.players[i] === player) {
            self.players.splice(i, 1);
            return true;
          }
        }

        return false;
      },

      reconcilePlayers: function (players) {
        var
          self = this,
          i, l,
          j, jl,
          player,
          player2,
          found;

        for (i = 0, l = players.length; i < l; i++) {
          found = false;
          player = players[i];

          for (j = 0, jl = self.players.length; j < jl; j++) {
            player2 = self.players[j];

            if (player.id === player2.id) {
              found = true;
            }
          }

          if (!found) {
            self.addPlayer({
              player: player,
              supressEvent: true
            });
          }

        }
      },

      //------------------------------------------------------------------------
      // Host
      //------------------------------------------------------------------------

      host: null,

      setHost: function (player) {
        var 
          self = this;

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
      // Game stages
      //------------------------------------------------------------------------

      STAGES: {
        LOBBY: 1, // waiting for game to start
        LOADING: 2,
        PLAY: 3,
        DETERMINE_WINNER: 4,
        CONGRATULATIONS: 5
      },

      // The current stage of the game
      currentStage: 0,

      startStage: function (stage) {
        var
          self = this;

        self.currentStage = stage;

        if (self.currentStage === self.STAGES.LOBBY) {
          // TODO: Change UI
        } else if (self.currentStage === self.STAGES.LOADING) {

        }

        events.trigger('game.startStage', {
          game: self
        });
      },

      start: function (data) {
        var
          self = this;

        // start the game for me in the right spot
        if (data.currentStage === self.STAGES.LOBBY) {
          // TODO: Change UI
        } else if (data.currentStage === self.STAGES.LOADING) {

        }

      },

    };

    return game;

  });