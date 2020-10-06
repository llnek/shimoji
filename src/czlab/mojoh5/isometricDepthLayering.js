(function(window,undefined){
  "use strict";

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    const _T=window["io.czlab.mojoh5.IsoTiles"](Mojo);

    _Z.defScene("level1",{
      setup:function(){
        let world = this.world= _T.isoWorld(32,32,8,8);
        this.insert(world);
        world.tiled.layers = [
          //The floor layer
          [
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1
          ],
          //The wall layer
          [
            2, 2, 2, 2, 2, 2, 2, 2,
            2, 0, 0, 0, 0, 0, 0, 2,
            2, 0, 2, 0, 0, 2, 0, 2,
            2, 0, 0, 0, 0, 2, 2, 2,
            2, 0, 0, 0, 0, 0, 0, 2,
            2, 2, 2, 0, 2, 0, 0, 2,
            2, 0, 0, 0, 0, 0, 0, 2,
            2, 2, 2, 2, 2, 2, 2, 2
          ],
          //The player layer
          [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 3, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0
          ]
        ];

        //The `z` index
        let z = 0;
        //Build the game world by looping through each of the arrays
        world.tiled.layers.forEach(layer => {
          //Loop through each array element
          layer.forEach((gid, index) => {
            //If the cell isn't empty (0) then create a sprite
            if (gid !== 0) {
              //Find the column and row that the sprite is on and also
              //its x and y pixel values.
              let column, row, x, y;
              column = index % world.tiled.tilesInX;
              row = Math.floor(index / world.tiled.tilesInX);
              x = column * world.tiled.cartTileW;
              y = row * world.tiled.cartTileH;
              //Next, create a different sprite based on what its
              //`gid` number is
              let sprite;
              switch (gid) {
                //The floor
                case 1:
                  sprite = _S.sprite(_S.frame("isoTileset.png", 64,64,128, 0));
                  break;

                  //The walls
                case 2:
                  sprite = _S.sprite(_S.frame("isoTileset.png", 64,64,0, 0));
                  break;

                  //The player
                case 3:
                  sprite = _S.sprite(_S.frame("isoTileset.png", 64,64,64, 0));
                  this.player = sprite;
                  break;
              }

              //Add these properties to the sprite
              _T.addIsoProperties(sprite, world.tiled.cartTileW, world.tiled.cartTileH,x,y);

              let iso=sprite.tiled.isoXY();
              //Set the sprite's `x` and `y` pixel position based on its
              //isometric coordinates
              sprite.x = iso[0];
              sprite.y = iso[1];

              //Add the new `z` depth property to the sprite
              sprite.z = z;

              //Cartesian positioning
              //sprite.x = sprite.cartX;
              //sprite.y = sprite.cartY;

              //Add the sprite to the `world` container
              world.addChild(sprite);
            }
          });

          //Add `1` to `z` for each new layer
          z += 1;
        });

        //Move the player into the environment's depth layer
        this.player.z = 1;

        //Sort the world by depth
        world.children.sort(_T.byDepth);

        //Position the world inside the canvas
        let canvasOffset = (Mojo.canvas.width / 2) - world.tiled.cartTileW;
        world.x += canvasOffset;
        world.y = 0;

        //Make a text object
        let message = this.message= _S.text("",
          {fontSize:16,fontFamily:"Futura", fill:"black"},5,0);
        this.insert(message);

        //Create the keyboard objects
        let leftArrow = _I.keyboard(37);
        let upArrow = _I.keyboard(38);
        let rightArrow = _I.keyboard(39);
        let downArrow = _I.keyboard(40);

        let player=this.player;
        //Assign the key `press` actions
        this.player.mojoh5.direction = Mojo.NONE;
        leftArrow.press = () => player.mojoh5.direction = Mojo.LEFT;
        upArrow.press = () => player.mojoh5.direction = Mojo.UP;
        rightArrow.press = () => player.mojoh5.direction = Mojo.RIGHT;
        downArrow.press = () => player.mojoh5.direction = Mojo.DOWN;
        leftArrow.release = () => player.mojoh5.direction = Mojo.NONE;
        upArrow.release = () => player.mojoh5.direction = Mojo.NONE;
        rightArrow.release = () => player.mojoh5.direction = Mojo.NONE;
        downArrow.release = () => player.mojoh5.direction = Mojo.NONE;
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        let player=this.player;
        let world=this.world;
        let c=player.tiled.cartXY();
        //Change the player character's velocity if it's centered over a grid cell
        if(Math.floor(c[0]) % world.tiled.cartTileW === 0 &&
          Math.floor(c[1]) % world.tiled.cartTileH === 0){
          switch(player.mojoh5.direction){
            case Mojo.UP:
              player.mojoh5.vel[1] = -2;
              player.mojoh5.vel[0] = 0;
              break;
            case Mojo.DOWN:
              player.mojoh5.vel[1] = 2;
              player.mojoh5.vel[0] = 0;
              break;
            case Mojo.LEFT:
              player.mojoh5.vel[0] = -2;
              player.mojoh5.vel[1] = 0;
              break;
            case Mojo.RIGHT:
              player.mojoh5.vel[0] = 2;
              player.mojoh5.vel[1] = 0;
              break;
            case Mojo.NONE:
              player.mojoh5.vel[0] = 0;
              player.mojoh5.vel[1] = 0;
              break;
          }
        }

        //Update the player's Cartesian position
        //based on its velocity
        player.tiled.cartXY(c[0] + player.mojoh5.vel[0], c[1] + player.mojoh5.vel[1]);
        //Wall collision
        //Get a reference to the wall map array
        let wallMapArray = world.tiled.layers[1];

        //Use `hiteTestIsoTile` to check for a collision
        let playerVsGround = _T.hitTestIsoTile(player, wallMapArray, 0, world, Mojo.EVERY);

        c=player.tiled.cartXY();

        //If there's a collision, prevent the player from moving.
        //Subtract its velocity from its position and then set its velocity to zero
        if(!playerVsGround.hit){
          player.tiled.cartXY(c[0] - player.mojoh5.vel[0], c[1] - player.mojoh5.vel[1]);
          player.mojoh5.vel[0] = 0;
          player.mojoh5.vel[1] = 0;
        }

        //Add world boundaries
        let top = 0,
          bottom = (world.tiled.tilesInY * world.tiled.cartTileH),
          left = 0,
          right = (world.tiled.tilesInX * world.tiled.cartTileW);

        c=player.tiled.cartXY();

        //Prevent the player from crossing any of the world boundaries
        //Top
        if(c[1] < 0){
          player.tiled.cartXY(c[0],top);
        }

        c=player.tiled.cartXY();
        //Bottom
        if(c[1] + player.tiled.cartHeight > bottom){
          player.tiled.cartXY(c[0], bottom - player.tiled.cartHeight);
        }

        c=player.tiled.cartXY();
        //Left
        if(c[0] < left){
          player.tiled.cartXY(left,c[1]);
        }

        c=player.tiled.cartXY();
        //Right
        if(c[0] + player.tiled.cartWidth > right){
          player.tiled.cartXY(right - player.tiled.cartWidth,c[1]);
        }

        let iso=player.tiled.isoXY();
        //Position the sprite's sceen `x` and `y` position
        //using its isometric coordinates
        player.x = iso[0];
        player.y = iso[1];

        c=player.tiled.cartXY();
        //Get the player's index position in the map array
        player.tiled.____index = Mojo.getIndex(
          c[0], c[1],
          world.tiled.cartTileW, world.tiled.cartTileH, world.tiled.tilesInX
        );

        //Depth sort the sprites if the player is moving
        if(player.mojoh5.vel[0] !== 0 || player.mojoh5.vel[1] !== 0){
          world.children.sort(_T.byDepth);
        }

        //Display the player's x, y and index values
        this.message.mojoh5.content(`index: ${player.tiled.____index}`);
      }
    })
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: ["isoTileset.png"],
    arena: {width:512, height:512},
    scaleToWindow:true,
    start: setup
  };
})(this);


