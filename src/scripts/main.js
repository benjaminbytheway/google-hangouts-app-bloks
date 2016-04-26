'use strict';

(function () {
	var 
		init = function () {
			gapi.hangout.onApiReady.add(function(eventObj) {
	      if (eventObj.isApiReady) {
	        document.getElementById('showParticipants').style.visibility = 'visible';
	      }
	    });
		};



	gadgets.util.registerOnLoadHandler(init);
}());
	