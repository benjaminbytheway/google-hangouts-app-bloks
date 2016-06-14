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

    document.body.style.opacity = 0.0;
    
    hangoutOnApiReadyPromise
      //----------------------------------------------------------------------
      // Initialize local copies
      //----------------------------------------------------------------------
      .then(function () {

        // start the app
        angular.bootstrap(document, ['app']);

        // fade it into view
        new TWEEN.Tween(document.body.style)
          .to({
              opacity: 1.0
            }, 1000)
          .easing(TWEEN.Easing.Exponential.Out)
          .start();
      });

  });
  