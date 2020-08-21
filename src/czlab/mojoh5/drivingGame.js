(function(global,undefined){
  "use strict";
  const window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  function defScenes(Mojo) {
    const Z=Mojo.Scenes,S=Mojo.Sprites,T=Mojo.Tiles,I=Mojo.Input;
    const _=Mojo.u;

    Z.defScene("level1", {
      setup:function(){
        let world = S.group();
        world.tileWidth = 64;
        world.tileHeight = 64;
        world.widthInTiles = 10;
        world.heightInTiles = 8;
        world.layers = [
          //The environment layer. `2` represents the walls, //`1` represents the floors
          [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
            1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
            1, 2, 2, 1, 1, 1, 1, 2, 2, 1,
            1, 2, 2, 1, 1, 1, 1, 2, 2, 1,
            1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
            1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1
          ],
          //The character layer. `3` represents the game character
          //`0` represents an empty cell which won't contain any //sprites
          [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 3, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
          ]
        ];
        world.layers.forEach(layer => {
          layer.forEach((gid, index) => {
            if(gid !== 0) {
              //Find the column and row that the sprite is on and also
              //its x and y pixel values that match column and row position
              let sprite,column, row, x, y;
              column = index % world.widthInTiles;
              row = Math.floor(index / world.widthInTiles);
              x = column * world.tileWidth;
              y = row * world.tileHeight;
              //Next, create a different sprite based on what its //`gid` number is
              switch(gid) {
              //track
              case 1:
                sprite = S.sprite(S.frame("tileSet.png", 64,64,192, 64));
              break;
              //The grass
              case 2:
                sprite = S.sprite(S.frame("tileSet.png", 64,64,192, 0));
              break;
              //The car
              case 3:
                this.car =
                    sprite = S.sprite(S.frame("tileSet.png", 48,48,192, 192));
              break;
              }
              //Position the sprite using the calculated `x` and `y` values
              //that match its column and row in the tile map
              sprite.x = x;
              sprite.y = y;
              world.addChild(sprite);
            }
          });
        });
        this.world=world;
        //Add some physics properties to the car
        this.car.vx = 0;
        this.car.vy = 0;
        this.car.accelerationX = 0.2;
        this.car.accelerationY = 0.2;
        this.car.rotationSpeed = 0;
        this.car.friction = 0.96;
        this.car.speed = 0;
        this.car.setPivot(0.5);
        this.car.moveForward = false;

        let leftArrow = I.keyboard(37),
          upArrow = I.keyboard(38),
          rightArrow = I.keyboard(39),
          downArrow = I.keyboard(40);
        //Set the car's `rotationSpeed` to -0.1 (to rotate left) if the
        //left arrow key is being pressed
        leftArrow.press = () => {
          this.car.rotationSpeed = -0.05;
        };
        //If the left arrow key is released and the right arrow
        //key isn't being pressed down, set the `rotationSpeed` to 0
        leftArrow.release = () => {
          if (!rightArrow.isDown) this.car.rotationSpeed = 0;
        };
        //Do the same for the right arrow key, but set
        //the `rotationSpeed` to 0.1 (to rotate right)
        rightArrow.press = () => {
          this.car.rotationSpeed = 0.05;
        };
        rightArrow.release = () => {
          if (!leftArrow.isDown) this.car.rotationSpeed = 0;
        };
        //Set `car.moveForward` to `true` if the up arrow key is
        //pressed, and set it to `false` if it's released
        upArrow.press = () => {
          this.car.moveForward = true;
        };
        upArrow.release = () => {
          this.car.moveForward = false;
        };

        this.insert(world);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt){
        //Use the `rotationSpeed` to set the car's rotation
        this.car.rotation += this.car.rotationSpeed;
        //If `car.moveForward` is `true`, increase the speed
        if(this.car.moveForward)
          this.car.speed += 0.05;
        //If `car.moveForward` is `false`, use
        //friction to slow the car down
        else
          this.car.speed *= this.car.friction;

        //Use the `speed` value to figure out the acceleration in the
        //direction of the car’s rotation
        this.car.accelerationX = this.car.speed * Math.cos(this.car.rotation);
        this.car.accelerationY = this.car.speed * Math.sin(this.car.rotation);
        //Apply the acceleration and friction to the car's velocity
        this.car.vx = this.car.accelerationX
        this.car.vy = this.car.accelerationY
        this.car.vx *= this.car.friction;
        this.car.vy *= this.car.friction

        //Apply the car's velocity to its position to make the car move
        this.car.x += this.car.vx;
        this.car.y += this.car.vy;
        //Slow the car down if it's stuck in the grass
        //First find the car's map index position
        let carIndex = T.getIndex(this.car.x, this.car.y, 64, 64, 10);
        //Get a reference to the race track map
        let trackMap = this.world.layers[0];
        //Slow the car if it's on a grass tile (gid 1) by setting
        //the car's friction to 0.25, to make it sluggish
        if (trackMap[carIndex] === 1) {
          this.car.friction = 0.25;
          //If the car isn't on a grass tile, restore its
          //original friction value
        } else {
          this.car.friction = 0.96
        }
      }
    });
  }

  function setup(Mojo) {
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  MojoH5.Config= {
    assetFiles: [ "tileSet.png" ],
    arena: { width:640, height:512 },
    scaleToWindow: true,
    start: setup
  };

})(this);
