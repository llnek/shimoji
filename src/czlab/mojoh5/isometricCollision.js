(function(window,undefined){
  "use strict";

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    const _T=window["io.czlab.mojoh5.IsoTiles"](Mojo);

    _Z.defScene("level1",{
      setup:function(){
        let world = this.world= _S.group();
        world.tiled={};
        this.insert(world);
        //Set the `tileWidth` and `tileHeight` of each tile, in pixels
        world.tiled.cartTileW = 32;
        world.tiled.cartTileH = 32;
        //Define the width and height of the world, in tiles
        world.tiled.tilesInX= 8;
        world.tiled.tilesInY= 8;
        //Create the world layers
        world.tiled.layers = [
          //The environment layer. `2` represents the walls,
          //`1` represents the floors
          [
            2, 2, 2, 2, 2, 2, 2, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 1, 2, 1, 1, 2, 1, 2,
            2, 1, 1, 1, 1, 2, 2, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 2, 2, 1, 2, 1, 1, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 2, 2, 2, 2, 2, 2, 2
          ],

          //The character layer. `3` represents the game character
          //`0` represents an empty cell which won't contain any
          //sprites
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
        //Build the game world by looping through each of the arrays
        world.tiled.layers.forEach(layer => {
          //Loop through each array element
          layer.forEach((gid, index) => {
            //If the cell isn't empty (0) then create a sprite
            if(gid !== 0) {
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
              switch(gid){
                //The floor
                case 1:
                  //Create a sprite using an isometric rectangle
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0xCCCCFF);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xCCCCFF);
                  break;
                  //The walls
                case 2:
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0x99CC00);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0x99CC00);
                  break;
                  //The character
                case 3:
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0xFF0000);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xFF0000);
                  //Define this sprite as the `player`
                  this.player = sprite;
              }
              //Add these properties to the sprite
              _T.addIsoProperties(sprite, world.tiled.cartTileW, world.tiled.cartTileH, x, y);

              //Set the sprite's `x` and `y` pixel position based on its
              //isometric coordinates
              let iso= sprite.tiled.isoXY();
              sprite.x = iso[0];
              sprite.y = iso[1];

              //Cartesian positioning
              //sprite.x = sprite.cartX;
              //sprite.y = sprite.cartY;

              //Add the sprite to the `world` container
              world.addChild(sprite);
            }
          });
        });

        //Position the world inside the canvas
        let canvasOffset = (Mojo.canvas.width / 2) - world.tiled.cartTileW;
        world.x += canvasOffset;
        world.y = 0;

        //Make a text object
        let message = this.message = _S.text("", {fontFamily:"Futura", fontSize:16, fill:"black"},5,0);
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
        let c=this.player.tiled.cartXY();
        let world=this.world;
        let player=this.player;
        //Change the player character's velocity if it's centered over a grid cell
        if(Math.floor(c[0]) % this.world.tiled.cartTileW === 0 &&
          Math.floor(c[1]) % this.world.tiled.cartTileH=== 0){
          switch(this.player.mojoh5.direction){
            case Mojo.UP:
              this.player.mojoh5.vel[1] = -2;
              this.player.mojoh5.vel[0] = 0;
              break;
            case Mojo.DOWN:
              this.player.mojoh5.vel[1] = 2;
              this.player.mojoh5.vel[0] = 0;
              break;
            case Mojo.LEFT:
              this.player.mojoh5.vel[0] = -2;
              this.player.mojoh5.vel[1] = 0;
              break;
            case Mojo.RIGHT:
              this.player.mojoh5.vel[0] = 2;
              this.player.mojoh5.vel[1] = 0;
              break;
            case Mojo.NONE:
              this.player.mojoh5.vel[0] = 0;
              this.player.mojoh5.vel[1] = 0;
              break;
          }
        }
        //Update the player's Cartesian position
        //based on its velocity
        this.player.tiled.cartXY(c[0] + this.player.mojoh5.vel[0], c[1]+this.player.mojoh5.vel[1]);

        //Wall collision
        //Get a reference to the wall map array
        let wallMapArray = this.world.tiled.layers[0];

        //Use `hiteTestIsoTile` to check for a collision
        let playerVsGround = _T.hitTestIsoTile(this.player, wallMapArray, 1, this.world, Mojo.EVERY);

        //If there's a collision, prevent the player from moving.
        //Subtract its velocity from its position and then set its velocity to zero
        if(!playerVsGround.hit){
          c= this.player.tiled.cartXY();
          this.player.tiled.cartXY(c[0] - this.player.mojoh5.vel[0], c[1]-this.player.mojoh5.vel[1]);
          this.player.mojoh5.vel[0] = 0;
          this.player.mojoh5.vel[1] = 0;
        }

        //Add world boundaries
        let top = 0,
          bottom = (world.tiled.tilesInY * world.tiled.cartTileH),
          left = 0,
          right = (world.tiled.tilesInX * world.tiled.cartTileW);

        c= this.player.tiled.cartXY();
        //Prevent the player from crossing any of the world boundaries
        //Top
        if (c[1] < 0){
          this.player.tiled.cartXY(c[0], top);
        }

        c= this.player.tiled.cartXY();
        //Bottom
        if(c[1] + this.player.tiled.cartHeight > bottom){
          this.player.tiled.cartXY(c[0], bottom - this.player.tiled.cartHeight);
        }

        c= this.player.tiled.cartXY();
        if(c[0] < left){
          this.player.tiled.cartXY(left,c[1]);
        }

        c= this.player.tiled.cartXY();
        //Right
        if(c[0] + this.player.tiled.cartWidth > right){
          this.player.tiled.cartXY(right - this.player.tiled.cartWidth,c[1]);
        }

        let iso=this.player.tiled.isoXY();
        //Position the sprite's screen `x` and `y` position
        //using its isometric coordinates
        this.player.x = iso[0];
        this.player.y = iso[1];


        c= this.player.tiled.cartXY();
        //Get the player's index position in the map array
        this.player.tiled.____index = Mojo.getIndex(c[0], c[1], world.tiled.cartTileW, world.tiled.cartTileH, world.tiled.tilesInX);

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
    arena: {width:512, height:512},
    scaleToWindow: true,
    start: setup
  };
})(this);


