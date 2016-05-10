'use strict';

define('game', [
    'player',
    'events'
  ], function (Player, events) {
    var 
      game;

    game = {

      //------------------------------------------------------------------------
      // Initialize
      //------------------------------------------------------------------------
      initialize: function (data) {
        var
          self = this;

        if (data.game.host) {
          self.host = data.game.host;
        }

        if (data.game.players) {
          self.players = data.game.players;
        }

        if (data.game.currentStage) {
          self.currentStage = data.game.currentStage;
        }

        return true;
      },

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
        if (
          config.player && 
          config.player.id &&
          self.players.length < 4 && 
          !self.findPlayerById(config.player.id) // make sure the player is added only once
        ) {
          player = new Player(config.player);

          self.players.push(player);

          if (
            !self.host
          ) {
            self.setHost({
              player: player
            });
          }

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

      updatePlayers: function (players) {
        var
          self = this,
          i, l,
          j, jl,
          player,
          player2,
          found;

        // add any that need to be added
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

        // remove any that need to be removed
        for (j = 0, jl = self.players.length; j < jl; j++) {
          found = false;
          player2 = self.players[j];

          for (i = 0, l = players.length; i < l; i++) {
            player = players[i];

            if (player.id === player2.id) {
              found = true;
            }
          }

          if (!found) {
            self.removePlayer({
              player: player,
              supressEvent: true
            });
          }
        }

      },

      removePlayer: function (config) {
        var
          self = this,
          player,
          i;

        if (!config.player) {
          return false;
        }

        // if the person who just quit was the host, reassign the host
        if (config.player.id === self.host.id) {
          if (self.players.length > 0) {
            self.setHost({
              player: self.players[0]
            });
          }
        }

        for (i = self.players.length - 1; i >= 0; i--) {
          if (self.players[i] === config.player) {
            player = self.players.splice(i, 1);

            if (!config.supressEvent) {
              events.trigger('game.removePlayer', {
                game: game
              });
            }

            return true;
          }
        }

        return false;
      },

      findPlayerById: function (id) {
        var
          self = this,
          i, l,
          player;

        for (i = 0, l = self.players.length; i < l; i++) {
          player = self.players[i];

          if (player.id === id) {
            return player;
          }
        }

        return null;
      },

      //------------------------------------------------------------------------
      // Host
      //------------------------------------------------------------------------

      host: null,

      setHost: function (config) {
        var 
          self = this;

        if (
          config.player.type === 'human'
        ) {
          self.host = config.player;

          if (!config.supressEvent) {
            events.trigger('game.setHost', {
              game: self
            });
          }

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