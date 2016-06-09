'use strict';

define('app', [
    // no dependencies
  ], function () {

    var
      app,
      parseState = function (state) {
        var 
          property,
          stateParsed = {};

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            stateParsed[property] = JSON.parse(state[property]);
          } catch (e) {}
        }

        return stateParsed;
      },
      serializeState = function (state) {
        var 
          property,
          stateSerialized = {};

        for (property in state) {
          if (!state.hasOwnProperty(property)) {
            continue;
          }

          try {
            stateSerialized[property] = JSON.stringify(state[property]);
          } catch (e) {}
        }

        return stateSerialized;
      },
      STAGES = {
        LOBBY: 1, // waiting for game to start
        CHOOSE_COLOR: 2,
        PLAY: 3,
        DETERMINE_WINNER: 4,
        CONGRATULATIONS: 5
      };

    app = angular.module('app', [
        // TODO: dependencies
      ]);

    // run blocks
    app

      // initialize
      .run(['$rootScope', function ($rootScope) {

        // Get my participant
        $rootScope.me = gapi.hangout.getLocalParticipant();

        // get initial state, or initialize
        $rootScope.state = parseState(gapi.hangout.data.getState()) || {};

        //--------------------------------------------------------------------
        // Initialize the game (if not already initialized)
        //--------------------------------------------------------------------

        // game
        if (!$rootScope.state.game) {
          $rootScope.state.game = {};
        }

        // game.currentStage
        if (!$rootScope.state.game.currentStage) {
          $rootScope.state.game.currentStage = STAGES.LOBBY;
        }

        // players
        if (!$rootScope.state.players) {
          $rootScope.state.players = [];
        }

        // colors
        if (!$rootScope.state.colors) {
          $rootScope.state.colors = {};
        }
        
        //--------------------------------------------------------------------
        // get notifications from others in the hangout
        //--------------------------------------------------------------------
        gapi.hangout.data.onStateChanged.add(function(event) {
          // event.addedKeys
          // event.metadata
          // event.removedKeys
          // event.state

          var
            state,
            key,
            value,
            metadata;
          
          state = parseState(event.state);

          // If we sent the message, then return
          // if (state.writerId === $rootScope.me.person.id) {
          //   return;
          // } else {
          //   delete state.writerId;
          // }

          // TODO: Probably will need this in the future
          for (key in state) {
            value = state[key];
            metadata = event.metadata[key];

            if (key) {
              // console.log(key + ' updated elsewhere');
              // console.log(value);
              // console.log(metadata);
            }
          }

          $rootScope.state = state;

          // TODO: DEBUGGING (REMOVE)
          window.state = state;

          $rootScope.$apply();
        });

        //--------------------------------------------------------------------
        // notify others
        //--------------------------------------------------------------------
        $rootScope.$watch('state', function (newValue, oldValue, scope) {
          // console.log('---------------------$watch-------------------');
          // console.log('NEW');
          // console.log(newValue);
          // console.log('OLD');
          // console.log(oldValue);

          // set who is writing
          // $rootScope.state.writerId = $rootScope.me.person.id;

          // submit the changes
          gapi.hangout.data.submitDelta(serializeState($rootScope.state));

          // TODO: DEBUGGING (REMOVE)
          window.state = $rootScope.state;

        }, true); // TODO: Figure out a way not to do object equality


        //--------------------------------------------------------------------
        // Players
        //--------------------------------------------------------------------
        // TODO: Move this into it's own peice of code

        $rootScope.computers = 0;

        $rootScope.addPlayer = function (config) {
          var
            player,
            players;

          players = $rootScope.state.players;
          
          if (
            // make sure we have a player
            config.player &&
            // make sure we have an id for the player
            config.player.id &&
            // make sure that we only add up to 4 players
            players.length < 4 &&
            // make sure the player is added only once
            !$rootScope.findPlayerById(config.player.id)
          ) {
            player = {};

            // type
            if (config.player.type) {
              player.type = config.player.type;
            } else {
              throw new Error('config.player.type was not provided');
            }
            
            // human player
            if (player.type === 'human') {
              
              // id
              if (config.player.id) {
                player.id = config.player.id;
              } else {
                throw new Error('config.player.id was not provided');
              }

              // name
              if (config.player.name) {
                player.name = config.player.name;
              } else {
                throw new Error('config.player.name was not provided');
              }

              // image
              if (config.player.image) {
                player.image = config.player.image;
              } else {
                // TODO: Default image?
              }

            // computer player
            } else if (player.type === 'computer') {

              // id
              player.id = 'computer-' + Math.floor(Math.random() * 10000);

              // name
              player.name = 'Computer ' + $rootScope.computers + 1;

              // image
              // TODO: find a computer image

            } else {
              throw new Error('config.player.type is not a supported type (either "human", or "computer")');
            }

            // add the player
            players.push(player);

            // if we haven't set a host yet, set it
            if (
              !$rootScope.state.host &&
              player.type === 'human'
            ) {
              $rootScope.state.host = player;
            }

            return true;
          } else {
            return false;
          }
        };

        $rootScope.findPlayerById = function (id) {
          var
            i, l,
            player,
            players;

          players = $rootScope.state.players;

          for (i = 0, l = players.length; i < l; i++) {
            player = players[i];

            if (player.id === id) {
              return player;
            }
          }

          return null;
        };

        $rootScope.removePlayer = function (config) {
          var
            i,
            player,
            players;

          players = $rootScope.state.players;

          if (!config.player) {
            return false;
          }

          for (i = players.length - 1; i >= 0; i--) {
            if (players[i] === config.player) {
              player = players.splice(i, 1);
              return true;
            }
          }

          return false;
        };

        $rootScope.showLeaveModal = false;

        $rootScope.leave = function () {
          var
            i, l,
            player,
            players,
            isHostDisabled = false;

          players = $rootScope.state.players;

          if (
            $rootScope.state.host &&
            $rootScope.state.host.id === $rootScope.me.person.id
          ) {
            isHostDisabled = true;
          }

          if (isHostDisabled) {

            // assign no one as the host
            $rootScope.state.host = null;

            // loop through and find the first next human to become the host
            for (i = 0, l = players.length; i < l; i++) {
              player = players[i];

              if (
                // if this is not me
                $rootScope.me.person.id !== player.id &&
                // if the player is a human
                player.type === 'human'
              ) {
                // assign myself as the host
                $rootScope.state.host = player;
                break;
              }
            }
            
          }

          // remove myself from the game
          $rootScope.removePlayer({
            player: $rootScope.findPlayerById($rootScope.me.person.id)
          });
        };

        gapi.hangout.onParticipantsDisabled.add(function (event) {
          // event.disabledParticipants

          var 
            i, l,
            j,
            disabledParticipant,
            player,
            players,
            isHostDisabled = false,
            shouldHandle = false;

          players = $rootScope.state.players;

          // figure out if the host is leaving
          if ($rootScope.state.host) {
            for (i = 0, l = event.disabledParticipants.length; i < l; i++) {
              disabledParticipant = event.disabledParticipants[i];

              // Is the host leaving?
              if (disabledParticipant.person.id === $rootScope.state.host.id) {
                isHostDisabled = true;
                break;
              }

            }
          }

          // only handle this if:
          // a) I am the host or 
          // b) if the host is disconnecting and I am the first in line to become the host
          if (isHostDisabled) {

            // loop through and find the first next human to become the host
            for (i = 0, l = players.length; i < l; i++) {
              player = players[i];

              if (
                // if this is me
                $rootScope.me.person.id === player.id &&
                // if I am a human
                player.type === 'human' &&
                // if I am not the host
                $rootScope.state.host.id !== player.id
              ) {
                // assign myself as the host
                $rootScope.state.host = player;
                break;
              }
            }
            
          }

          // Only handle the removal of the player if you are the host or become the host
          if (
            $rootScope.state.host &&
            $rootScope.state.host.id === $rootScope.me.person.id
          ) {
            shouldHandle = true;
          }

          if (shouldHandle) {

            for (i = 0, l = event.disabledParticipants.length; i < l; i++) {
              disabledParticipant = event.disabledParticipants[i];
              
              for (j = players.length - 1; j >= 0; j--) {
                player = players[j];

                if (disabledParticipant.person.id === player.id) {
                  $rootScope.removePlayer({
                    player: player
                  });
                  break;
                }

              }

            }

          }

          $rootScope.$apply();
        });

        // TODO: window.unload to remove myself if I am the last human here...

        // TODO: When two of the same user ID (benjaminbytheway@gmail.com) connect to the hangout, and one of them is joineed and another drops out of the game,
        // make sure that we don't drop the one that is joined to the game...Or just identify users based on participant ID rather than person ID...so that multiple
        // can join and drop...

        // TODO: When a player drops, we need to either reassign the color(s) that the user is playing, or assign them to a computer...

        //--------------------------------------------------------------------
        // Stages
        //--------------------------------------------------------------------

        //--------------------------------------------------------------------
        // Stage 1
        //--------------------------------------------------------------------
        $rootScope.join = function () {
  
          $rootScope.addPlayer({
            player: {
              type: 'human',
              id: $rootScope.me.person.id,
              name: $rootScope.me.person.displayName,
              image: $rootScope.me.person.image.url
            }
          });

        };

        $rootScope.begin = function () {
          // NOTE: This will only be run by the host

          $rootScope.state.game.currentStage = STAGES.CHOOSE_COLOR;
        };

        $rootScope.isPlayer = function () {
          var
            player,
            players,
            i, l;

          players = $rootScope.state.players;

          for (i = 0, l = players.length; i < l; i++) {
            player = players[i];

            if ($rootScope.me.person.id === player.id) {
              return true;
            }
          }

          return false;
        };

        //--------------------------------------------------------------------
        // Stage 2
        //--------------------------------------------------------------------

        $rootScope.chooseColor = function (color) {
          var
            players,
            colors,
            random,
            player,
            order,
            i, l,
            map = {
              'blue': 'Blue',
              'red': 'Red',
              'green': 'Green',
              'yellow': 'Yellow'
            };

          colors = $rootScope.state.colors;
          players = $rootScope.state.players;

          if (
            $rootScope.myRemainingColors() && 
            !colors[color]
          ) {
            colors[color] = {
              type: 1,
              id: $rootScope.me.person.id,
              label: map[color]
            };
          }

          // assign the last color
          // to everyone
          if (
            // if it is a 3 person game
            players.length === 3 &&
            // and 3 colors have been assigned
            Object.keys(colors).length === 3
          ) {

            // get the last remaining color that hasn't 
            // been assigned
            for (color in map) {
              if (!colors[color]) {
                break;
              }
            }

            order = [];

            // randomly assign each player a position in the
            // handling of the color
            for (i = 0, l = players.length; i < l; i++) {
              player = players[i];

              // loop until we get an empty index
              do {
                random = Math.floor(Math.random() * 3);
              } while (order[random]);

              order[random] = player.id;
            }
            
            // finally add all of that to the colors object
            colors[color] = {
              type: 2,
              id: order[0],
              order: order,
              current: 0,
              label: map[color]
            };

          }
        };

        $rootScope.myRemainingColors = function () {
          var
            colorAgent,
            color,
            colors,
            players,
            myRemainingColors = 0;

          colors = $rootScope.state.colors;
          players = $rootScope.state.players;

          if ($rootScope.isPlayer()) {

            // 2 player game
            if (players.length === 2) {
              myRemainingColors = 2;

            // 3 player game or 4 player game
            } else if (players.length === 3 || players.length === 4) {
              myRemainingColors = 1;
            }

            for (color in colors) {
              colorAgent = colors[color];

              if (
                colorAgent.type === 1 &&
                $rootScope.me.person.id === colorAgent.id
              ) {
                myRemainingColors--;
              }
            }

          }

          return myRemainingColors;
        };

        $rootScope.getMyColors = function () {
          var
            colorAgent,
            color,
            colors,
            myColors = [];

          colors = $rootScope.state.colors;

          for (color in colors) {
            colorAgent = colors[color];

            if (
              colorAgent.type === 1 &&
              $rootScope.me.person.id === colorAgent.id
            ) {
              myColors.push(colorAgent);
            }
          }

          return myColors;
        };

        $rootScope.getSharedColor = function () {
          var
            colorAgent,
            color,
            colors,
            players;

          players = $rootScope.state.players;

          if (players.length === 3) {
            colors = $rootScope.state.colors;

            for (color in colors) {
              colorAgent = colors[color];

              if (colorAgent.type === 2) {
                return colorAgent;
              }
            }
          }
            
          return null;
        };

        $rootScope.displayColors = function () {
          var
            text = '',
            colors = $rootScope.getMyColors(true);

          if (colors[0] && colors[0].label) {
            text = colors[0].label;

            if (colors[1] && colors[1].label) {
              text += ' and ' + colors[1].label;
            }
          }

          return text;
        };

        $rootScope.displayChoosenColors = function () {
          return Object.keys($rootScope.state.colors);
        };

        $rootScope.displaySharedColor = function () {
          var
            colorAgent = $rootScope.getSharedColor();

          if (colorAgent && colorAgent.label) {
            return colorAgent.label;
          }

          return false;
        };

        $rootScope.start = function () {
          // NOTE: This will only be run by the host
          
          $rootScope.state.game.currentStage = STAGES.PLAY;

          $rootScope.play();
          $rootScope.init();
        };

        //--------------------------------------------------------------------
        // Stage 3
        //--------------------------------------------------------------------
        $rootScope.play = function () {

          // initialize the board
          $rootScope.state.board = [];
        };

        $rootScope.init = function () {
          var
            w = window,
            d = document,
            container = d.getElementById('canvas-container'),
            // three
            scene,
            camera,
            view1,
            view2,
            view3,
            renderer,
            directionalLights,
            directionalLightCount,
            ambientLight,
            raycaster,
            plane,
            offset,
            intersection,
            mouse,
            controls,
            loader = new THREE.JSONLoader(),
            // game objects
            tableMesh,
            tableGeometry,
            tableMaterial,
            boardSquareMesh,
            boardSquareGeometryTemplate,
            boardSquareMaterial,
            boardBaseGeometry,
            boardBaseMaterial,
            boardBaseMesh,
            group,
            squareMesh,
            squareGeometryTemplate,
            squareMaterial,
            // tweens
            rotationTween,
            dropTween,
            // other
            i, l,
            j, jl,
            k, kl,
            board,
            hintBlock,
            boardSquareMeshHovered,
            blocks = [],
            intersected,
            selectedSquare,
            selectedBlock,
            xIndex, zIndex,
            color,
            colorAgent,
            colors = { // TODO: Replace with $rootScope.colors
              blue: {
                hex: 0x0000ff
              }, 
              green: {
                hex: 0x00ff00
              }, 
              yellow: {
                hex: 0xffff00
              }, 
              red: {
                hex: 0xff0000
              }
            },
            blockDefinitions = [ // TODO: Replace with $rootScope.blockDefinitions possibly?
              //---------------------
              // 5 pieces
              //---------------------
              {
                id: 21,
                startPosition: new THREE.Vector3(2.2, 0.1, 1.5),
                squareCount: 5,
                layout: [
                  [1,1,1,1,1]
                ]
              }, {
                id: 20,
                startPosition: new THREE.Vector3(2.6, 0.1, 1.5),
                squareCount: 5,
                layout: [
                  [1,1,1,1],
                  [1,0,0,0]
                ]
              }, {
                id: 19,
                startPosition: new THREE.Vector3(3.1, 0.1, 1.5),
                squareCount: 5,
                layout: [
                  [1,1,1,1],
                  [0,1,0,0]
                ]
              }, {
                id: 18,
                startPosition: new THREE.Vector3(3.6, 0.1, 1.5),
                squareCount: 5,
                layout: [
                  [0,1,1,1],
                  [1,1,0,0]
                ]
              }, {
                id: 17,
                startPosition: new THREE.Vector3(2.4, 0.1, 0.6),
                squareCount: 5,
                layout: [
                  [1,1,1],
                  [1,0,0],
                  [1,0,0]
                ]
              }, {
                id: 16,
                startPosition: new THREE.Vector3(3.1, 0.1, 0.6),
                squareCount: 5,
                layout: [
                  [0,1,1],
                  [1,1,0],
                  [1,0,0]
                ]
              }, {
                id: 15,
                startPosition: new THREE.Vector3(3.8, 0.1, 0.6),
                squareCount: 5,
                layout: [
                  [0,1,1],
                  [0,1,0],
                  [1,1,0]
                ]
              }, {
                id: 14,
                startPosition: new THREE.Vector3(2.4, 0.1, -0.1),
                squareCount: 5,
                layout: [
                  [1,1,1],
                  [0,1,0],
                  [0,1,0]
                ]
              }, {
                id: 13,
                startPosition: new THREE.Vector3(3.1, 0.1, -0.1),
                squareCount: 5,
                layout: [
                  [0,1,1],
                  [1,1,0],
                  [0,1,0]
                ]
              }, {
                id: 12,
                startPosition: new THREE.Vector3(3.8, 0.1, -0.1),
                squareCount: 5,
                layout: [
                  [0,1,0],
                  [1,1,1],
                  [0,1,0]
                ]
              }, {
                id: 11,
                startPosition: new THREE.Vector3(4.1, 0.1, 1.5),
                squareCount: 5,
                layout: [
                  [1,1,1],
                  [1,1,0]
                ]
              }, {
                id: 10,
                startPosition: new THREE.Vector3(4.4, 0.1, 0.6),
                squareCount: 5,
                layout: [
                  [1,1,1],
                  [1,0,1]
                ]
              },
              //---------------------
              // 4 pieces
              //---------------------
              {
                id: 9,
                startPosition: new THREE.Vector3(2.2, 0.1, -0.9),
                squareCount: 4,
                layout: [
                  [1,1,1,1]
                ]
              }, {
                id: 8,
                startPosition: new THREE.Vector3(2.6, 0.1, -0.9),
                squareCount: 4,
                layout: [
                  [1,1,1],
                  [1,0,0]
                ]
              }, {
                id: 7,
                startPosition: new THREE.Vector3(3.1, 0.1, -0.9),
                squareCount: 4,
                layout: [
                  [1,1,1],
                  [0,1,0]
                ]
              }, {
                id: 6,
                startPosition: new THREE.Vector3(3.6, 0.1, -0.9),
                squareCount: 4,
                layout: [
                  [1,1,0],
                  [0,1,1]
                ]
              }, {
                id: 5,
                startPosition: new THREE.Vector3(4.1, 0.1, -0.9),
                squareCount: 4,
                layout: [
                  [1,1],
                  [1,1]
                ]
              },
              //---------------------
              // 3 pieces
              //---------------------
              {
                id: 4,
                startPosition: new THREE.Vector3(2.2, 0.1, -1.7),
                squareCount: 3,
                layout: [
                  [1,1,1]
                ]
              }, {
                id: 3,
                startPosition: new THREE.Vector3(2.6, 0.1, -1.7),
                squareCount: 3,
                layout: [
                  [1,1],
                  [1,0]
                ]
              },
              //---------------------
              // 2 pieces
              //---------------------
              {
                id: 2,
                startPosition: new THREE.Vector3(3.0, 0.1, -1.7),
                squareCount: 2,
                layout: [
                  [1,1]
                ]
              },
              //---------------------
              // 1 pieces
              //---------------------
              {
                id: 1,
                startPosition: new THREE.Vector3(3.3, 0.1, -1.7),
                squareCount: 1,
                layout: [
                  [1]
                ]
              }
            ],
            // dimensions
            WIDTH = container.offsetWidth,
            HEIGHT = container.offsetHeight,
            SQUARE_WIDTH = 0.2,
            SQUARE_HEIGHT = 0.2,
            SQUARE_DEPTH = 0.04,
            BOARD_WIDTH_IN_SQUARES = 20,
            BOARD_HEIGHT_IN_SQUARES = 20,
            BOARD_BASE_DEPTH = 0.6,
            TABLE_WIDTH = 10,
            TABLE_HEIGHT = 10;

          //------------------------------------------------------------------
          // renderer
          //------------------------------------------------------------------
          renderer = new THREE.WebGLRenderer();
          renderer.setSize(WIDTH, HEIGHT);
          renderer.setClearColor(0xffffff);
          renderer.shadowMap.enabled = true;

          //------------------------------------------------------------------
          // scene
          //------------------------------------------------------------------
          scene = new THREE.Scene();

          //------------------------------------------------------------------
          // camera
          //------------------------------------------------------------------
          camera = new THREE.PerspectiveCamera(
            45, 
            WIDTH/HEIGHT, 
            0.1, 
            1000
          );

          camera.position.x = 6;
          camera.position.y = 6;
          camera.position.z = 6;

          camera.rotation.x = 0;
          camera.rotation.y = 0;
          camera.rotation.z = 0;

          camera.lookAt(new THREE.Vector3(0,0,0));

          // listeners
          // TODO: Do views for:
          // - all corners - 4
          // - all sides - 4
          // - all rotations of to top view - 4

          view1 = d.getElementById('view-1');
          view2 = d.getElementById('view-2');
          view3 = d.getElementById('view-3');

          view1.addEventListener('click', function (evt) {
            camera.position.x = 0;
            camera.position.y = 10;
            camera.position.z = 0;

            camera.rotation.x = 0;
            camera.rotation.y = 0;
            camera.rotation.z = 0;

            camera.lookAt(new THREE.Vector3(0,0,0));
          });

          view2.addEventListener('click', function (evt) {
            camera.position.x = 0;
            camera.position.y = 6;
            camera.position.z = 9;

            camera.rotation.x = 0;
            camera.rotation.y = 0;
            camera.rotation.z = 0;
            
            camera.lookAt(new THREE.Vector3(0,0,0));
          });

          view3.addEventListener('click', function (evt) {
            camera.position.x = 6;
            camera.position.y = 6;
            camera.position.z = 6;

            camera.rotation.x = 0;
            camera.rotation.y = 0;
            camera.rotation.z = 0;
            
            camera.lookAt(new THREE.Vector3(0,0,0));
          });

          // resize if the window gets resized
          w.addEventListener('resize', function () {

            WIDTH = container.offsetWidth;
            HEIGHT = container.offsetHeight;
            
            // update the camera
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();

            // update the renderer
            renderer.setSize(WIDTH, HEIGHT);
            
          }, false);

          //------------------------------------------------------------------
          // controls
          //------------------------------------------------------------------
          controls = new THREE.TrackballControls(camera);
          controls.rotateSpeed = 1.0;
          controls.zoomSpeed = 1.2;
          controls.panSpeed = 0.3;
          controls.noZoom = false;
          controls.noPan = false;
          controls.noRotate = false;
          controls.staticMoving = false;
          controls.dynamicDampingFactor = 0.3;

          //------------------------------------------------------------------
          // lights
          //------------------------------------------------------------------
          directionalLights = [];

          // 1 - from above
          directionalLightCount = 0;
          directionalLights[directionalLightCount] = new THREE.DirectionalLight(0xffffff, 0.25);

          directionalLights[directionalLightCount].position.x = -50;
          directionalLights[directionalLightCount].position.y = 50;
          directionalLights[directionalLightCount].position.z = -50;

          directionalLights[directionalLightCount].castShadow = true;
          scene.add(directionalLights[directionalLightCount]);

          // 2 - from above
          directionalLightCount = 1;
          directionalLights[directionalLightCount] = new THREE.DirectionalLight(0xffffff, 0.25);

          directionalLights[directionalLightCount].position.x = 50;
          directionalLights[directionalLightCount].position.y = 50;
          directionalLights[directionalLightCount].position.z = 50;

          directionalLights[directionalLightCount].castShadow = true;
          scene.add(directionalLights[directionalLightCount]);

          // 3 - from above
          directionalLightCount = 2;
          directionalLights[directionalLightCount] = new THREE.DirectionalLight(0xffffff, 0.25);

          directionalLights[directionalLightCount].position.x = -50;
          directionalLights[directionalLightCount].position.y = 50;
          directionalLights[directionalLightCount].position.z = 50;

          directionalLights[directionalLightCount].castShadow = true;
          scene.add(directionalLights[directionalLightCount]);

          // 4 - from above
          directionalLightCount = 3;
          directionalLights[directionalLightCount] = new THREE.DirectionalLight(0xffffff, 0.25);

          directionalLights[directionalLightCount].position.x = 50;
          directionalLights[directionalLightCount].position.y = 50;
          directionalLights[directionalLightCount].position.z = -50;

          directionalLights[directionalLightCount].castShadow = true;
          scene.add(directionalLights[directionalLightCount]);

          // 5 - from below
          directionalLightCount = 4;
          directionalLights[directionalLightCount] = new THREE.DirectionalLight(0xffffff, 0.25);

          directionalLights[directionalLightCount].position.x = 0;
          directionalLights[directionalLightCount].position.y = -50;
          directionalLights[directionalLightCount].position.z = 0;

          directionalLights[directionalLightCount].castShadow = true;
          scene.add(directionalLights[directionalLightCount]);

          ambientLight = new THREE.AmbientLight(0x505050);
          scene.add(ambientLight);

          //------------------------------------------------------------------
          // Table
          //------------------------------------------------------------------
          // tableGeometry = new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_HEIGHT);
          // tableMaterial = new THREE.MeshStandardMaterial({
          //   color: 0xeeeeee,
          //   side: THREE.BackSide
          // });
          // tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);

          // tableMesh.position.y = -1;

          // tableMesh.rotation.x = 0.5 * Math.PI;

          // tableMesh.castShadow = false;
          // tableMesh.receiveShadow = true;

          // scene.add(tableMesh);

          //------------------------------------------------------------------
          // Board
          //------------------------------------------------------------------
          board = [];
          //boardSquareGeometryTemplate = new THREE.PlaneGeometry(SQUARE_WIDTH, SQUARE_HEIGHT);
          boardSquareGeometryTemplate = loader.parse({
            "metadata": {},
            "scale" : 1.000000,
            "materials": [],
            "vertices": [-0.100000,0.000000,0.100000,-0.100000,0.010000,0.100000,-0.100000,0.000000,-0.100000,-0.100000,0.010000,-0.100000,0.100000,0.000000,0.100000,0.100000,0.010000,0.100000,0.100000,0.000000,-0.100000,0.100000,0.010000,-0.100000,0.097500,0.010000,0.097500,-0.097500,0.010000,0.097500,0.097500,0.010000,-0.097500,-0.097500,0.010000,-0.097500,0.095000,0.000000,0.095000,-0.095000,0.000000,0.095000,0.095000,0.000000,-0.095000,-0.095000,0.000000,-0.095000],
            "morphTargets": [],
            "morphColors": [],
            "normals": [-1,0,0,0,0,-1,1,0,0,0,0,1,0,-1,0,0,1,0,-0.9701,0.2425,0,0,0.2425,0.9701,0,0.2425,-0.9701,0.9701,0.2425,0],
            "colors": [],
            "uvs": [[]],
            "faces": [35,1,3,2,0,0,0,0,0,0,35,3,7,6,2,0,1,1,1,1,35,7,5,4,6,0,2,2,2,2,35,5,1,0,4,0,3,3,3,3,35,0,2,6,4,0,4,4,4,4,35,9,11,3,1,0,5,5,5,5,35,5,8,9,1,0,5,5,5,5,35,5,7,10,8,0,5,5,5,5,35,8,10,14,12,0,6,6,6,6,35,10,7,3,11,0,5,5,5,5,35,12,14,15,13,0,5,5,5,5,35,10,11,15,14,0,7,7,7,7,35,9,8,12,13,0,8,8,8,8,35,11,9,13,15,0,9,9,9,9]
          }).geometry;

          for (i = 0, l = BOARD_WIDTH_IN_SQUARES; i < l; i++) {
            board[i] = [];

            for (j = 0, jl = BOARD_HEIGHT_IN_SQUARES; j < jl; j++) {
              boardSquareMaterial = new THREE.MeshPhongMaterial({
                color: 0xfcfcfc,
                shininess: 50,
                side: THREE.DoubleSide
              });
              boardSquareMesh = new THREE.Mesh(boardSquareGeometryTemplate, boardSquareMaterial);

              boardSquareMesh.position.x = (i * SQUARE_WIDTH) - ((BOARD_WIDTH_IN_SQUARES * SQUARE_WIDTH) / 2) + SQUARE_WIDTH / 2;
              boardSquareMesh.position.z = (j * SQUARE_HEIGHT) - ((BOARD_HEIGHT_IN_SQUARES * SQUARE_HEIGHT) / 2) + SQUARE_HEIGHT / 2;

              // boardSquareMesh.rotation.x = 0.5 * Math.PI;

              boardSquareMesh.castShadow = true;
              boardSquareMesh.receiveShadow = false;

              boardSquareMesh.userData.xIndex = i;
              boardSquareMesh.userData.zIndex = j;
              boardSquareMesh.userData.block = null;
              boardSquareMesh.userData.square = null;

              board[i][j] = boardSquareMesh;
              scene.add(boardSquareMesh);
            }
          }

          boardBaseGeometry = new THREE.BoxGeometry(
            (BOARD_WIDTH_IN_SQUARES * SQUARE_WIDTH), 
            BOARD_BASE_DEPTH, 
            (BOARD_HEIGHT_IN_SQUARES * SQUARE_HEIGHT)
          );
          boardBaseMaterial = new THREE.MeshPhongMaterial({
            color: 0xfcfcfc,
            shininess: 50,
            side: THREE.DoubleSide
          });
          boardBaseMesh = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
          boardBaseMesh.position.y = -(BOARD_BASE_DEPTH / 2) - 0.0001;

          scene.add(boardBaseMesh);

          //------------------------------------------------------------------
          // Blocks
          //------------------------------------------------------------------
          var 
            block,
            blockDefinition,
            layoutWidth,
            layoutHeight,
            row,
            square;

          for (color in colors) {
            colorAgent = colors[color];
            // TODO: find out who has which color

            for (k = 0, kl = blockDefinitions.length; k < kl; k++) {
              blockDefinition = blockDefinitions[k];

              block = new THREE.Group();

              block.userData.layout = JSON.parse(JSON.stringify(blockDefinition.layout));
              block.userData.squareCount = blockDefinition.squareCount;
              block.userData.colorAgent = colorAgent;
              block.userData.color = color;

              layoutWidth = block.userData.layout.length;
              layoutHeight = block.userData.layout[0].length;

              for (i = 0, l = blockDefinition.layout.length; i < l; i++) {
                row = blockDefinition.layout[i];

                for (j = 0, jl = row.length; j < jl; j++) {
                  square = row[j];

                  if (square) {
                    //squareGeometryTemplate = new THREE.BoxGeometry(SQUARE_WIDTH, SQUARE_DEPTH, SQUARE_HEIGHT);
                    squareGeometryTemplate = loader.parse({
                      metadata: {},
                      "scale" : 1.000000,
                      "materials": [],
                      "vertices": [0.100000,0.010000,-0.100000,-0.100000,0.010000,0.100000,0.100000,0.010000,0.100000,-0.100000,0.010000,-0.100000,-0.100000,0.030000,0.100000,0.100000,0.030000,0.100000,-0.100000,0.030000,-0.100000,0.100000,0.030000,-0.100000,-0.092500,0.030000,0.092500,-0.092500,0.030000,-0.092500,0.092500,0.030000,0.092500,0.092500,0.030000,-0.092500,-0.092500,0.040000,0.092500,-0.092500,0.040000,-0.092500,0.092500,0.040000,0.092500,0.092500,0.040000,-0.092500,-0.092500,0.010000,0.092500,0.092500,0.010000,0.092500,-0.092500,0.010000,-0.092500,0.092500,0.010000,-0.092500,-0.092500,0.000000,0.092500,0.092500,0.000000,0.092500,-0.092500,0.000000,-0.092500,0.092500,0.000000,-0.092500,-0.065000,0.040000,0.065000,-0.065000,0.040000,-0.065000,0.065000,0.040000,0.065000,0.065000,0.040000,-0.065000,-0.065000,0.030000,0.065000,-0.065000,0.030000,-0.065000,0.065000,0.030000,0.065000,0.065000,0.030000,-0.065000,-0.065000,0.000000,0.065000,0.065000,0.000000,0.065000,-0.065000,0.000000,-0.065000,0.065000,0.000000,-0.065000,-0.065000,0.010000,0.065000,0.065000,0.010000,0.065000,-0.065000,0.010000,-0.065000,0.065000,0.010000,-0.065000],
                      "morphTargets": [],
                      "morphColors": [],
                      "normals": [0,0,-1,0,0,1,1,0,0,-1,0,0,0,1,0,0,-1,0],
                      "colors": [],
                      "uvs": [[]],
                      "faces": [35,0,3,6,7,0,0,0,0,0,35,1,2,5,4,0,1,1,1,1,35,2,0,7,5,0,2,2,2,2,35,3,1,4,6,0,3,3,3,3,35,9,11,7,6,0,4,4,4,4,35,4,8,9,6,0,4,4,4,4,35,4,5,10,8,0,4,4,4,4,35,11,9,13,15,0,0,0,0,0,35,10,5,7,11,0,4,4,4,4,35,10,11,15,14,0,2,2,2,2,35,9,8,12,13,0,3,3,3,3,35,8,10,14,12,0,1,1,1,1,35,17,19,0,2,0,5,5,5,5,35,1,16,17,2,0,5,5,5,5,35,1,3,18,16,0,5,5,5,5,35,17,16,20,21,0,1,1,1,1,35,18,3,0,19,0,5,5,5,5,35,16,18,22,20,0,3,3,3,3,35,19,17,21,23,0,2,2,2,2,35,18,19,23,22,0,0,0,0,0,35,25,27,15,13,0,4,4,4,4,35,12,24,25,13,0,4,4,4,4,35,12,14,26,24,0,4,4,4,4,35,24,26,30,28,0,0,0,0,0,35,26,14,15,27,0,4,4,4,4,35,28,30,31,29,0,4,4,4,4,35,26,27,31,30,0,3,3,3,3,35,27,25,29,31,0,1,1,1,1,35,25,24,28,29,0,2,2,2,2,35,33,35,23,21,0,5,5,5,5,35,20,32,33,21,0,5,5,5,5,35,20,22,34,32,0,5,5,5,5,35,33,32,36,37,0,0,0,0,0,35,34,22,23,35,0,5,5,5,5,35,36,38,39,37,0,5,5,5,5,35,32,34,38,36,0,2,2,2,2,35,34,35,39,38,0,1,1,1,1,35,35,33,37,39,0,3,3,3,3]
                    }).geometry;
                    squareMaterial = new THREE.MeshPhongMaterial({
                      color: block.userData.colorAgent.hex,
                      transparent: true,
                      opacity: 0.75,
                      shininess: 75,
                      side: THREE.DoubleSide
                    });
                    squareMesh = new THREE.Mesh(squareGeometryTemplate, squareMaterial);

                    squareMesh.position.x = i * SQUARE_WIDTH - ((layoutWidth * SQUARE_WIDTH) / 2) + (SQUARE_WIDTH / 2);
                    squareMesh.position.z = j * SQUARE_HEIGHT - ((layoutHeight * SQUARE_HEIGHT) / 2) + (SQUARE_HEIGHT / 2);
                    squareMesh.position.y = - SQUARE_DEPTH / 2;

                    // squareMesh.position.x = i * SQUARE_WIDTH;
                    // squareMesh.position.z = j * SQUARE_HEIGHT;

                    squareMesh.userData.xIndex = i;
                    squareMesh.userData.zIndex = j;

                    block.add(squareMesh);
                  }

                }
              }

              block.startPosition = new THREE.Vector3();
              block.startRotation = new THREE.Vector3();

              block.isUpsideDown = false;
              block.isRotated = false;

              if (color === 'blue') {
                block.startPosition.x = blockDefinition.startPosition.x;
                block.startPosition.y = blockDefinition.startPosition.y;
                block.startPosition.z = blockDefinition.startPosition.z;

                block.startRotation.y = 0;
              } else if (color === 'green') {
                block.startPosition.x = -blockDefinition.startPosition.x;
                block.startPosition.y = blockDefinition.startPosition.y;
                block.startPosition.z = -blockDefinition.startPosition.z;

                block.startRotation.y = Math.PI;
                block.userData.layout = rotateClockwise(rotateClockwise(block.userData.layout));
              } else if (color === 'red') {
                block.startPosition.x = -blockDefinition.startPosition.z;
                block.startPosition.y = blockDefinition.startPosition.y;
                block.startPosition.z = blockDefinition.startPosition.x;

                block.startRotation.y = Math.PI + Math.PI / 2;
                block.userData.layout = rotateCounterclockwise(block.userData.layout);
                block.isRotated = true;
              } else if (color === 'yellow') {
                block.startPosition.x = blockDefinition.startPosition.z;
                block.startPosition.y = blockDefinition.startPosition.y;
                block.startPosition.z = -blockDefinition.startPosition.x;

                block.startRotation.y = Math.PI / 2;
                block.userData.layout = rotateClockwise(block.userData.layout);
                block.isRotated = true;
              }

              block.position.x = block.startPosition.x;
              block.position.y = block.startPosition.y;
              block.position.z = block.startPosition.z;

              block.rotation.y = block.startRotation.y;

              block.castShadow = true;
              block.receiveShadow = false;

              blocks.push(block);

              scene.add(block);
            }

          }

          //------------------------------------------------------------------
          // Interaction
          //------------------------------------------------------------------
          raycaster = new THREE.Raycaster();
          mouse = new THREE.Vector2();
          plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
          offset = new THREE.Vector3();
          intersection = new THREE.Vector3();

          function mousemove(e) {
            var
              intersect,
              intersects,
              i, il,
              j, jl,
              layoutWidth,
              layoutHeight,
              hoverable;

            e.preventDefault();

            mouse.x = (event.clientX / WIDTH) * 2 - 1;
            mouse.y = -(event.clientY / HEIGHT) * 2 + 1;

            xIndex = null;
            zIndex = null;

            raycaster.setFromCamera(mouse, camera);

            if (selectedSquare && selectedBlock) {
              // TODO: put boundaries on how far you can move the block so that
              // a) It doesn't get lost somewhere and 
              // b) You can't move it when it isn't your turn
              
              // move along the x and z plane
              if (raycaster.ray.intersectPlane(plane, intersection)) {
                selectedBlock.position.copy(intersection.sub(offset));

                layoutWidth = selectedBlock.userData.layout.length;
                layoutHeight = selectedBlock.userData.layout[0].length;

                xIndex = Math.floor((intersection.x + ((BOARD_WIDTH_IN_SQUARES * SQUARE_WIDTH) / 2) - ((layoutWidth * SQUARE_WIDTH) / 2) + (SQUARE_WIDTH / 2)) / SQUARE_WIDTH);
                zIndex = Math.floor((intersection.z + ((BOARD_HEIGHT_IN_SQUARES * SQUARE_HEIGHT) / 2) - ((layoutHeight * SQUARE_HEIGHT) / 2) + (SQUARE_HEIGHT / 2)) / SQUARE_HEIGHT);

                scene.remove(hintBlock);

                // reset previous hover
                // for (i = 0, il = board.length; i < il; i++) {
                //   for (j = 0, jl = board[i].length; j < jl; j++) {
                //     if (board[i][j].previousColor) {
                //       board[i][j].material.color = board[i][j].previousColor;
                //       board[i][j].previousColor = null;
                //     }
                //   }
                // }
                // if (boardSquareMeshHovered) {
                //   boardSquareMeshHovered.material.color = boardSquareMeshHovered.previousColor;
                // }

                if (
                  board[xIndex] &&
                  board[xIndex][zIndex]
                ) {
                  boardSquareMeshHovered = board[xIndex][zIndex];

                  // for (i = 0, il = selectedBlock.userData.layout.length; i < il; i++) {
                  //   for (j = 0, jl = selectedBlock.userData.layout[i].length; j < jl; j++) {
                  //     if (
                  //       board[xIndex + i] &&
                  //       board[xIndex + i][zIndex + j] &&
                  //       selectedBlock.userData.layout[i][j]
                  //     ) {
                  //       board[xIndex + i][zIndex + j].previousColor = board[xIndex + i][zIndex + j].material.color;
                  //       board[xIndex + i][zIndex + j].material.color = new THREE.Color(0xff0000);
                  //     }
                  //   }
                  // }
                  // boardSquareMeshHovered.previousColor = boardSquareMeshHovered.material.color;
                  // boardSquareMeshHovered.material.color = new THREE.Color(0xff0000);

                  // show the hint
                  if (canDrop(selectedBlock, xIndex, zIndex)) {
                    hintBlock = selectedBlock.clone();

                    hintBlock.position.copy(boardSquareMeshHovered.position);
                    hintBlock.position.x = hintBlock.position.x + ((layoutWidth * SQUARE_WIDTH) / 2) - (SQUARE_WIDTH / 2);
                    hintBlock.position.z = hintBlock.position.z + ((layoutHeight * SQUARE_HEIGHT) / 2) - (SQUARE_HEIGHT / 2);
                    hintBlock.position.y = hintBlock.position.y + SQUARE_DEPTH / 2;

                    // if (selectedBlock.isUpsideDown) {
                    //   hintBlock.position.y = hintBlock.position.y + SQUARE_DEPTH;
                    // }

                    scene.add(hintBlock);
                  }
                    
                }

              }

            } else {
              // TODO: Transform an object when hovered

              intersects = raycaster.intersectObjects(blocks, true);

              if (intersects.length > 0) {
                intersect = intersects[0];

                if (intersect.object.parent) {
                  intersected = intersect.object.parent;
                } else {
                  intersected = intersect.object;
                }

                container.style.cursor = 'move';

              } else {
                intersected = null;

                container.style.cursor = 'auto';
              }
            }
              
          }

          function mousedown(e) {
            var
              intersect,
              intersects;

            e.preventDefault();

            // NOTE: mouse.x and mouse.y should already be set because it was set above

            raycaster.setFromCamera(mouse, camera);

            intersects = raycaster.intersectObjects(blocks, true);

            if (intersects.length > 0) {
              intersect = intersects[0];

              // disable zoom, pan, etc. while dragging
              controls.enabled = false;

              // TODO: Disable movement if 
              // a) it isn't your blocks or 
              // b) it isn't your turn to move the shared one or
              // c) you already dropped your block

              selectedSquare = intersect.object;
              if (intersect.object.parent) {
                selectedBlock = intersect.object.parent;
              }

              if (raycaster.ray.intersectPlane(plane, intersection)) {
                offset.copy(intersection).sub(selectedBlock.position);
              }
            }

            container.style.cursor = 'move';
          }

          function mouseup(e) {
            var
              i, il,
              layoutWidth,
              layoutHeight,
              originalPosition,
              originalRotation;

            e.preventDefault();

            controls.enabled = true;

            if (
              selectedSquare &&
              selectedBlock
            ) {
              if (canDrop(selectedBlock, xIndex, zIndex)) {

                boardSquareMeshHovered = board[xIndex][zIndex];

                for (i = 0, il = selectedBlock.userData.layout.length; i < il; i++) {
                  for (j = 0, jl = selectedBlock.userData.layout[i].length; j < jl; j++) {
                    if (selectedBlock.userData.layout[i][j]) {
                      board[xIndex + i][zIndex + j].userData.block = selectedBlock;
                    }
                  }
                }

                // animate
                // selectedBlock.position.x = boardSquareMeshHovered.position.x + ((layoutWidth * SQUARE_WIDTH) / 2) - (SQUARE_WIDTH / 2);
                // selectedBlock.position.z = boardSquareMeshHovered.position.z + ((layoutHeight * SQUARE_HEIGHT) / 2) - (SQUARE_HEIGHT / 2);
                // selectedBlock.position.y = boardSquareMeshHovered.position.y + SQUARE_DEPTH / 2;
                layoutWidth = selectedBlock.userData.layout.length;
                layoutHeight = selectedBlock.userData.layout[0].length;

                dropTween = new TWEEN.Tween(selectedBlock.position)
                  .to({
                      x: boardSquareMeshHovered.position.x + ((layoutWidth * SQUARE_WIDTH) / 2) - (SQUARE_WIDTH / 2),
                      z: boardSquareMeshHovered.position.z + ((layoutHeight * SQUARE_HEIGHT) / 2) - (SQUARE_HEIGHT / 2),
                      y: boardSquareMeshHovered.position.y + SQUARE_DEPTH / 2
                    }, 200)
                  .easing(TWEEN.Easing.Bounce.Out)
                  .onComplete(function () {
                    dropTween = null;
                  })
                  .start();

                blocks.splice(blocks.indexOf(selectedBlock), 1);

                selectedSquare = null;
                selectedBlock = null;

                scene.remove(hintBlock);

              } else {

                // if we are just moving it around in space, then leave it how it is and reset the startPosition and startRotation
                if (
                  (
                    selectedBlock.position.x > 2.2 &&
                    selectedBlock.position.x < 8.0
                  ) && (
                    selectedBlock.position.z < 2.4 &&
                    selectedBlock.position.z > -2.4
                  )
                ) {
                  selectedBlock.startPosition.x = selectedBlock.position.x;
                  selectedBlock.startPosition.z = selectedBlock.position.z;
                  selectedBlock.startRotation = selectedBlock.rotation;
                }

                // move it back to original position and rotation
                originalPosition = selectedBlock.startPosition;
                originalRotation = selectedBlock.startRotation;
                
                dropTween = new TWEEN.Tween(selectedBlock.position)
                  .to({
                      x: originalPosition.x,
                      z: originalPosition.z,
                      y: originalPosition.y
                    }, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    dropTween = null;
                  })
                  .start();

                new TWEEN.Tween(selectedBlock.rotation)
                  .to({
                      y: originalRotation.y,
                      z: originalRotation.z
                    }, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    dropTween = null;
                  })
                  .start();
              }
            }

            if (intersected) {
              selectedSquare = null;
              selectedBlock = null;
            }
          }

          function keydown(e) {
            var
              xRotation,
              zRotation,
              yRotation,
              blockReference;

            e.preventDefault();

            if (selectedBlock && !rotationTween) {

              // maintain a referenced to the block
              // in case in the middle of the tween the
              // selectedBlock gets dereferenced by letting
              // go of the mousedown
              blockReference = selectedBlock;

              // left
              if (e.keyCode === 37) {

                blockReference.isRotated = !blockReference.isRotated;
                blockReference.userData.layout = rotateClockwise(blockReference.userData.layout);

                // animation
                yRotation = blockReference.rotation.y;

                rotationTween = new TWEEN.Tween(blockReference.rotation)
                  .to({y: yRotation + Math.PI/2}, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    rotationTween = null;
                    blockReference = null;
                  })
                  .start();

              // up
              } else if (e.keyCode === 38) {

                blockReference.isUpsideDown = !blockReference.isUpsideDown;
                if (blockReference.isRotated) {
                  blockReference.userData.layout = flipHorizontal(blockReference.userData.layout);
                } else {
                  blockReference.userData.layout = flipVertical(blockReference.userData.layout);
                }

                // animation
                zRotation = blockReference.rotation.z;

                rotationTween = new TWEEN.Tween(blockReference.rotation)
                  .to({z: zRotation + Math.PI}, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    rotationTween = null;
                    blockReference = null;
                  })
                  .start();

              // right
              } else if (e.keyCode === 39) {

                blockReference.isRotated = !blockReference.isRotated;
                blockReference.userData.layout = rotateCounterclockwise(blockReference.userData.layout);

                // animation
                yRotation = blockReference.rotation.y;

                rotationTween = new TWEEN.Tween(blockReference.rotation)
                  .to({y: yRotation - Math.PI/2}, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    rotationTween = null;
                    blockReference = null;
                  })
                  .start();

              // down
              } else if (e.keyCode === 40) {

                blockReference.isUpsideDown = !blockReference.isUpsideDown;
                if (blockReference.isRotated) {
                  blockReference.userData.layout = flipHorizontal(blockReference.userData.layout);
                } else {
                  blockReference.userData.layout = flipVertical(blockReference.userData.layout);
                }

                // animation
                zRotation = blockReference.rotation.z;

                rotationTween = new TWEEN.Tween(blockReference.rotation)
                  .to({z: zRotation - Math.PI}, 200)
                  .easing(TWEEN.Easing.Exponential.Out)
                  .onComplete(function () {
                    rotationTween = null;
                    blockReference = null;
                  })
                  .start();
              }
              
            }

          }

          // for (k = 0, kl = blockDefinitions.length; k < kl; k++) {
          //   blockDefinition = blockDefinitions[k];

          //   console.log('BEFORE');
          //   console.log(JSON.stringify(blockDefinition.layout, null, '  '));
          //   console.log('AFTER');
          //   console.log(JSON.stringify(rotateClockwise(rotateClockwise(blockDefinition.layout)), null, '  '));
          //   console.log('\n\n\n');
          // }

          function rotateClockwise(layout) {
            var 
              layoutRow,
              layoutRowLength = layout.length,
              layoutColumn,
              layoutColumnLength = layout[0].length,
              row,
              newLayoutRow = 0,
              newLayoutColumn = 0,
              newLayout = [];

            for (layoutColumn = 0; layoutColumn < layoutColumnLength; layoutColumn++) {
              for (layoutRow = layoutRowLength - 1; layoutRow >= 0; layoutRow--) {
                if (!newLayout[newLayoutRow]) {
                  newLayout[newLayoutRow] = [];
                }
                newLayout[newLayoutRow][newLayoutColumn] = layout[layoutRow][layoutColumn];
                newLayoutColumn++;
              }
              newLayoutRow++;
              newLayoutColumn = 0;
            }

            return newLayout;
          }

          // for (k = 0, kl = blockDefinitions.length; k < kl; k++) {
          //   blockDefinition = blockDefinitions[k];

          //   console.log('BEFORE');
          //   console.log(JSON.stringify(blockDefinition.layout, null, '  '));
          //   console.log('AFTER');
          //   console.log(JSON.stringify(rotateCounterclockwise(rotateCounterclockwise(blockDefinition.layout)), null, '  '));
          //   console.log('\n\n\n');
          // }

          function rotateCounterclockwise(layout) {
            var 
              layoutRow,
              layoutRowLength = layout.length,
              layoutColumn,
              layoutColumnLength = layout[0].length,
              row,
              newLayoutRow = 0,
              newLayoutColumn = 0,
              newLayout = [];

            for (layoutColumn = layoutColumnLength - 1; layoutColumn >= 0; layoutColumn--) {
              for (layoutRow = 0; layoutRow < layoutRowLength; layoutRow++) {
                if (!newLayout[newLayoutRow]) {
                  newLayout[newLayoutRow] = [];
                }
                newLayout[newLayoutRow][newLayoutColumn] = layout[layoutRow][layoutColumn];
                newLayoutColumn++;
              }
              newLayoutRow++;
              newLayoutColumn = 0;
            }

            return newLayout;
          }

          // for (k = 0, kl = blockDefinitions.length; k < kl; k++) {
          //   blockDefinition = blockDefinitions[k];

          //   console.log('BEFORE');
          //   console.log(JSON.stringify(blockDefinition.layout, null, '  '));
          //   console.log('AFTER');
          //   console.log(JSON.stringify(flipVertical(blockDefinition.layout), null, '  '));
          //   console.log('\n\n\n');
          // }

          function flipVertical(layout) {
            var 
              layoutRow,
              layoutRowLength = layout.length,
              layoutColumn,
              layoutColumnLength = layout[0].length,
              row,
              newLayoutRow = 0,
              newLayoutColumn = 0,
              newLayout = [];

            for (layoutRow = layoutRowLength - 1; layoutRow >= 0; layoutRow--) {
              for (layoutColumn = 0; layoutColumn < layoutColumnLength; layoutColumn++) {
                if (!newLayout[newLayoutRow]) {
                  newLayout[newLayoutRow] = [];
                }
                newLayout[newLayoutRow][newLayoutColumn] = layout[layoutRow][layoutColumn];
                newLayoutColumn++;
              }
              newLayoutRow++;
              newLayoutColumn = 0;
            }

            return newLayout;
          }

          // for (k = 0, kl = blockDefinitions.length; k < kl; k++) {
          //   blockDefinition = blockDefinitions[k];

          //   console.log('BEFORE');
          //   console.log(JSON.stringify(blockDefinition.layout, null, '  '));
          //   console.log('AFTER');
          //   console.log(JSON.stringify(flipHorizontal(blockDefinition.layout), null, '  '));
          //   console.log('\n\n\n');
          // }

          function flipHorizontal(layout) {
            var 
              layoutRow,
              layoutRowLength = layout.length,
              layoutColumn,
              layoutColumnLength = layout[0].length,
              row,
              newLayoutRow = 0,
              newLayoutColumn = 0,
              newLayout = [];

            for (layoutRow = 0; layoutRow < layoutRowLength; layoutRow++) {
              for (layoutColumn = layoutColumnLength - 1; layoutColumn >= 0; layoutColumn--) {
                if (!newLayout[newLayoutRow]) {
                  newLayout[newLayoutRow] = [];
                }
                newLayout[newLayoutRow][newLayoutColumn] = layout[layoutRow][layoutColumn];
                newLayoutColumn++;
              }
              newLayoutRow++;
              newLayoutColumn = 0;
            }

            return newLayout;
          }

          function canDrop(block, xIndex, zIndex) {
            var
              i, il,
              j, jl,
              layout = block.userData.layout,
              layoutWidth = layout.length,
              layoutHeight = layout[0].length,
              onBoard = true,
              squaresOpen = true,
              touchingFace = false,
              touchingCorner = false;
            
            // square on board, square open
            for (i = 0, il = layoutWidth; i < il; i++) {
              for (j = 0, jl = layoutHeight; j < jl; j++) {

                // is this square on the board?
                if (
                  !board[xIndex + i] ||
                  !board[xIndex + i][zIndex + j]
                ) {
                  onBoard = false;
                }

                // is this square open?
                if (
                  board[xIndex + i] &&
                  board[xIndex + i][zIndex + j] &&
                  board[xIndex + i][zIndex + j].userData.block &&
                  layout[i][j]
                ) {
                  squaresOpen = false;
                  break;
                }

                // is a touching the corner square?
                if (
                  (
                    (
                      (xIndex + i) === 0 ||
                      (xIndex + i) === 19 // board.length
                    ) && (
                      (zIndex + j) === 0 ||
                      (zIndex + j) === 19 // board.length
                    )
                    
                  ) && 
                  layout[i] &&
                  layout[i][j]
                ) {
                  touchingCorner = true;
                }

                // is it touching another corner of a square that is the same color?
                if (
                  board[xIndex + i] &&
                  board[xIndex + i][zIndex + j] &&
                  layout[i] &&
                  layout[i][j] &&
                  // touching on one of the corners?                  
                  (
                    // top left
                    (
                      board[xIndex + i - 1] &&
                      board[xIndex + i - 1][zIndex + j - 1] &&
                      board[xIndex + i - 1][zIndex + j - 1].userData.block &&
                      board[xIndex + i - 1][zIndex + j - 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // top right
                    ) || (
                      board[xIndex + i + 1] &&
                      board[xIndex + i + 1][zIndex + j - 1] &&
                      board[xIndex + i + 1][zIndex + j - 1].userData.block &&
                      board[xIndex + i + 1][zIndex + j - 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // bottom left
                    ) || (
                      board[xIndex + i - 1] &&
                      board[xIndex + i - 1][zIndex + j + 1] &&
                      board[xIndex + i - 1][zIndex + j + 1].userData.block &&
                      board[xIndex + i - 1][zIndex + j + 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // bottom right
                    ) || (
                      board[xIndex + i + 1] &&
                      board[xIndex + i + 1][zIndex + j + 1] &&
                      board[xIndex + i + 1][zIndex + j + 1].userData.block &&
                      board[xIndex + i + 1][zIndex + j + 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    )
                  )
                ) {
                  touchingCorner = true;
                }

                // is the block touching up against another block of the same color?
                if (
                  board[xIndex + i] &&
                  board[xIndex + i][zIndex + j] &&
                  layout[i] &&
                  layout[i][j] &&
                  // touching on one of the corners?
                  (
                    // left
                    (
                      board[xIndex + i - 1] &&
                      board[xIndex + i - 1][zIndex + j] &&
                      board[xIndex + i - 1][zIndex + j].userData.block &&
                      board[xIndex + i - 1][zIndex + j].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // right
                    ) || (
                      board[xIndex + i + 1] &&
                      board[xIndex + i + 1][zIndex + j] &&
                      board[xIndex + i + 1][zIndex + j].userData.block &&
                      board[xIndex + i + 1][zIndex + j].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // top
                    ) || (
                      board[xIndex + i] &&
                      board[xIndex + i][zIndex + j - 1] &&
                      board[xIndex + i][zIndex + j - 1].userData.block &&
                      board[xIndex + i][zIndex + j - 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    // bottom
                    ) || (
                      board[xIndex + i] &&
                      board[xIndex + i][zIndex + j + 1] &&
                      board[xIndex + i][zIndex + j + 1].userData.block &&
                      board[xIndex + i][zIndex + j + 1].userData.block.userData.colorAgent === 
                        block.userData.colorAgent
                    )
                  )
                ) {
                  touchingFace = true;
                }

              }

              if (!onBoard || !squaresOpen || touchingFace) {
                break;
              }
            }

            return onBoard && squaresOpen && !touchingFace && touchingCorner;
          }

          renderer.domElement.addEventListener('mousemove', mousemove, false);
          renderer.domElement.addEventListener('mousedown', mousedown, false);
          renderer.domElement.addEventListener('mouseup', mouseup, false);
          document.addEventListener('keydown', keydown, false);

          //------------------------------------------------------------------
          // Animate and Render
          //------------------------------------------------------------------
          function animate(time) {
            requestAnimationFrame(animate);

            TWEEN.update(time);
            render();
          }

          function render() {
            controls.update();
            renderer.render(scene,camera);
          }

          container.appendChild(renderer.domElement);

          animate();

        };


      }]);
    

    return app;
  });