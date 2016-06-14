'use strict';

require([
    'app',
    'events'
  ], function (app, events) {

    var 
      hangoutOnApiReadyPromise = new Promise(function (resolve, reject) {
        gapi.hangout.onApiReady.add(function(evt) {
          if (evt.isApiReady) {
            resolve();
          }
        });
      });
    
    hangoutOnApiReadyPromise
      //----------------------------------------------------------------------
      // Initialize local copies
      //----------------------------------------------------------------------
      .then(function () {

        // start the app
        angular.bootstrap(document, ['app']);

        // fade it into view
        $('body').fadeIn();
      });

  });
  