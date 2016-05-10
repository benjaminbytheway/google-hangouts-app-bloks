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
      //events.trigger('ui.1.button.join.click');
    });

    //----------------------------------------------------------------------
    // From the App
    //----------------------------------------------------------------------
    events.on('ui.1.game.players.changed', function (data) {

      // var
      //   i, l,
      //   player,
      //   playerNumber,
      //   nameElement,
      //   imageElement;

      // for (i = 0, l = 4; i < l; i++) {
      //   player = data.game.players[i];
      //   playerNumber = 'player' + (i + 1);

      //   if (player) {
      //     // update text
      //     nameElement = d.getElementById(playerNumber + '-name');
      //     if (
      //       data.game.host &&
      //       data.game.host.id === player.id
      //     ) {
      //       nameElement.innerText = player.name + ' (Host)';
      //     } else {
      //       nameElement.innerText = player.name;
      //     }
          

      //     // update image
      //     imageElement = d.getElementById(playerNumber + '-image');
      //     imageElement.src = player.image;
      //     imageElement.style.display = 'inline';

      //   } else {
      //     // update text
      //     nameElement = d.getElementById(playerNumber + '-name');
      //     nameElement.innerText = ' -- ';

      //     // update image
      //     imageElement = d.getElementById(playerNumber + '-image');
      //     imageElement.src = '';
      //     imageElement.style.display = 'none';

      //   } 

      // }
      
    });

    return {};

  });
  