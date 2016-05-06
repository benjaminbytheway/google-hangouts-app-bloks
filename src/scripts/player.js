'use strict';

define('player', [
    'events'
  ], function () {

    var 
      Player = function (config) {
        var
          self = this;

        //------------------------------------------------------------------------
        // type
        // 
        // 'human'
        // 'computer'
        //------------------------------------------------------------------------
        if (config.type) {
          self.type = config.type;
        } else {
          throw new Error('config.type was not provided');
        }
        
        //------------------------------------------------------------------------
        // id
        // TODO: generisize this for other platforms other than Google+ Hangouts
        //------------------------------------------------------------------------
        if (self.type === 'human') {
          if (config.id) {
            self.id = config.id;
          } else {
            throw new Error('config.id was not provided');
          }

          if (config.name) {
            self.name = config.name;
          } else {
            throw new Error('config.name was not provided');
          }
        } else if (self.type === 'computer') {
          // TODO: Determine what to do here...
          if (true) {

          } else {

          }
        } else {
          throw new Error('config.type is not a supported type (either "human", or "computer")');
        }

      },
      proto = Player.prototype;

    // TODO: proto methods
    proto.takeTurn = function () {
      // done
    };

    return Player;

  });