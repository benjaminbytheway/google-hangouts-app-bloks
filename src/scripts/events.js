'use strict';

define('events', [
  ], function () {

    var
      handlers = {},
      triggered = {};

    return {

      on: function (name, func, executeIfFired) {

        if (triggered[name]) {
          if (executeIfFired) {
            try {
              func(triggered[name]);
            } catch (e) {
              console.error(e);
            }
          } else {
            return;
          }
        }

        if (!handlers[name]) {
          handlers[name] = [];
        }
        handlers[name].push(func);
      },

      off: function (name, func) {
        var i;

        if (handlers[name] && handlers[name].length) {
          for (i = handlers[name].length - 1; i >= 0; i--) {
            if (handlers[name][i] === func) {
              handlers[name][i].splice(i, 1);
            }
          }
        }

      },

      trigger: function (name, data) {
        var i, l,
          func;

        triggered[name] = data;

        if (handlers[name] && handlers[name].length) {
          for (i = 0, l = handlers[name].length; i < l; i++) {
            func = handlers[name][i];
            if (func) {
              try {
                func(data);
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
        
        return true;
      }

    };

  });
  