'use strict';

define('ui', [
    'events'
  ], function (events) {
    var
      d = document;

    //----------------------------------------------------------------------
    // STAGE.LOBBY listeners
    //----------------------------------------------------------------------

    //----------------------------------------------------------------------
    // From the UI
    //----------------------------------------------------------------------
    var buttonJoin = d.getElementById('buttonJoin');
    buttonJoin.addEventListener('click', function () {
      events.trigger('ui.1.button.join.click');
    });

    //----------------------------------------------------------------------
    // From the App
    //----------------------------------------------------------------------
    events.on('ui.1.game.players.changed', function (data) {
      var
        i, l,
        player,
        element; 

      for (i = 0, l = data.players.length; i < l; i++) {
        player = data.players[i];

        element = d.getElementById('player' + i);

        element.text = player.name;
      }
      
    });

    return {};

  });
  