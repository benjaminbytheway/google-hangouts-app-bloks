'use strict';

define([
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
        // participant
        // TODO: generisize this for other platforms other than Google+ Hangouts
        //------------------------------------------------------------------------
        if (self.type === 'human') {
          if (config.participant) {
            self.participant = config.participant;
          } else {
            throw new Error('config.participant was not provided');
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

    return Player;

  });