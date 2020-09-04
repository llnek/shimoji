(function(global,undefined){
  "use strict";
  const window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  function defScenes(Mojo) {
    const Z=Mojo.Scenes, S=Mojo.Sprites, I=Mojo.Input, T=Mojo.Tiles;
    const _=Mojo.u;

    Z.defScene("level1",{
      setup:function(){
        this.world = S.group();
        this.world.tileWidth = 64;
        this.world.tileHeight = 64;
        this.world.widthInTiles = 10;
        this.world.heightInTiles = 8;
        this.world.layers = [//The environment layer. `2` represents the walls,
        //`1` represents the floors
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //The character layer. `3` represents the player's car,
        //`4` represents the AI car and
        //`0` represents an empty cell which won't contain any
        //sprites
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //Angles map
        [45, 45, 45, 45, 45, 45, 45, 45, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 315, 270, 315, 315, 315, 315, 90, 90, 135, 315, 315, 270, 135, 135, 135, 135, 90, 90, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 270, 270, 225, 225, 225, 225, 225, 225, 225]]; //Build the game world by looping through each
        //of the layers arrays one after the other
        this.world.layers.forEach(layer => {
          layer.forEach((gid, index) => {
            if(gid !== 0) {
              let sprite,column, row, x, y;
              column = index % this.world.widthInTiles;
              row = Math.floor(index / this.world.widthInTiles);
              x = column * this.world.tileWidth;
              y = row * this.world.tileHeight;
              switch (gid) {
              case 1://track
                sprite = S.sprite(S.frame("tileSet.png", 64,64,192, 64));
              break;
              case 2://grass
                sprite = S.sprite(S.frame("tileSet.png", 64,64,192, 0));
              break;
              case 3:
                this.car=sprite = S.sprite(S.frame("tileSet.png", 48,48,192, 192));
              break;
              case 4:
                this.aiCar = sprite = S.sprite(S.frame("tileSet.png", 48,48,192, 128));
              break;
              }
              if(sprite) {
                sprite.x = x;
                sprite.y = y;
                this.world.addChild(sprite);
              }
            }
          });
        });
        this.insert(this.world);
        function addCarProperties(carSprite) {
          carSprite.vx = 0;
          carSprite.vy = 0;
          carSprite.accelerationX = 0.2;
          carSprite.accelerationY = 0.2;
          carSprite.rotationSpeed = 0;
          carSprite.friction = 0.96;
          carSprite.speed = 0; //Center the car's rotation point
          carSprite.setPivot(0.5, 0.5); //Whether or not the car should move forward
          carSprite.moveForward = false;
        }
        addCarProperties(this.car);
        addCarProperties(this.aiCar);
        this.aiCar.moveForward = true;

        let leftArrow = I.keyboard(37),
          upArrow = I.keyboard(38),
          rightArrow = I.keyboard(39),
          downArrow = I.keyboard(40); //Set the car's `rotationSpeed` to -0.1 (to rotate left) if the
        //left arrow key is being pressed

        leftArrow.press = () => {
          this.car.rotationSpeed = -0.05;
        }; //If the left arrow key is released and the right arrow
  //key isn't being pressed down, set the `rotationSpeed` to 0

        leftArrow.release = () => {
          if (!rightArrow.isDown) this.car.rotationSpeed = 0;
        }; //Do the same for the right arrow key, but set
  //the `rotationSpeed` to 0.1 (to rotate right)

        rightArrow.press = () => {
          this.car.rotationSpeed = 0.05;
        };

        rightArrow.release = () => {
          if(!leftArrow.isDown) this.car.rotationSpeed = 0;
        }; //Set `car.moveForward` to `true` if the up arrow key is
  //pressed, and set it to `false` if it's released

        upArrow.press = () => {
          this.car.moveForward = true;
        };

        upArrow.release = () => {
          this.car.moveForward = false;
        }; //Start the game loop by setting the game state to `play`

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt) {
        //Move the AI car
        //If `aICar.moveForward` is `true`, increase the speed as long
        //it is under the maximum speed limit of 3
        if(this.aiCar.moveForward && this.aiCar.speed <= 3) {
          this.aiCar.speed += 0.08;
        }
        //Find the AI car's current angle, in degrees
        let currentAngle = this.aiCar.rotation * (180 / Math.PI);
        //Constrain the calculated angle to a value between 0 and 360
        currentAngle = currentAngle + Math.ceil(-currentAngle / 360) * 360;
        //Find out its index position on the map
        let aiCarIndex = T.getIndex(this.aiCar.x, this.aiCar.y, 64, 64, 10);
        //Find out what the target angle is for that map position
        let angleMap = this.world.layers[2];
        let mapAngle = angleMap[aiCarIndex];
        //Add an optional random variation of 20 degrees each time the aiCar
        //encounters a new map angle
        if(mapAngle !== this.previousMapAngle) {
          this.targetAngle = mapAngle + _.randInt2(-20, 20);
          this.previousMapAngle = mapAngle;
        } //If you don't want any random variation in the iaCar's angle
        //replace the above if statement with this line of code:
        //targetAngle = mapAngle;
        //Calculate the difference between the current
        //angle and the target angle
        let difference = currentAngle - this.targetAngle;
        //Figure out whether to turn the car left or right
        if(difference > 0 && difference < 180) {
          //Turn left
          this.aiCar.rotationSpeed = -0.03;
        } else {
          //Turn right
          this.aiCar.rotationSpeed = 0.03;
        } //Use the `rotationSpeed` to set the car's rotation

        this.aiCar.rotation += this.aiCar.rotationSpeed;
        //Use the `speed` value to figure out the acceleration in the
        //direction of the aiCar’s rotation
        this.aiCar.accelerationX = this.aiCar.speed * Math.cos(this.aiCar.rotation);
        this.aiCar.accelerationY = this.aiCar.speed * Math.sin(this.aiCar.rotation);
        //Apply the acceleration and friction to the aiCar's velocity

        this.aiCar.vx = this.aiCar.accelerationX;
        this.aiCar.vy = this.aiCar.accelerationY;
        this.aiCar.vx *= this.aiCar.friction;
        this.aiCar.vy *= this.aiCar.friction;
        //Apply the aiCar's velocity to its position to make the aiCar move

        this.aiCar.x += this.aiCar.vx;
        this.aiCar.y += this.aiCar.vy; //Move the player's car
        //Use the `rotationSpeed` to set the car's rotation

        this.car.rotation += this.car.rotationSpeed; //If `car.moveForward` is `true`, increase the speed

        if(this.car.moveForward) {
          this.car.speed += 0.05;
        } //If `car.moveForward` is `false`, use
        //friction to slow the car down
        else {
          this.car.speed *= this.car.friction;
        } //Use the `speed` value to figure out the acceleration in the
        //direction of the car’s rotation

        this.car.accelerationX = this.car.speed * Math.cos(this.car.rotation);
        this.car.accelerationY = this.car.speed * Math.sin(this.car.rotation);
        //Apply the acceleration and friction to the car's velocity

        this.car.vx = this.car.accelerationX;
        this.car.vy = this.car.accelerationY;
        this.car.vx *= this.car.friction;
        this.car.vy *= this.car.friction; //Apply the car's velocity to its position to make the car move

        this.car.x += this.car.vx;
        this.car.y += this.car.vy; //Slow the cars down if they're stuck in the grass
        //First find the car's map index position

        let carIndex = T.getIndex(this.car.x, this.car.y, 64, 64, 10); //Get a reference to the race track map

        let trackMap = this.world.layers[0]; //Slow the car if it's on a grass tile (gid 1) by setting
        //the car's friction to 0.25, to make it sluggish

        if(trackMap[carIndex] === 1) {
          this.car.friction = 0.25; //If the car isn't on a grass tile, restore its
          //original friction value
        } else {
          this.car.friction = 0.96;
        } //Slow the aiCar if it's on a grass tile (gid 1) by setting
        //its friction to 0.25, to make it sluggish

        if(trackMap[aiCarIndex] === 1) {
          this.aiCar.friction = 0.25; //If the car isn't on a grass tile, restore its
          //original friction value
        } else {
          this.aiCar.friction = 0.96;
        }
      }
    });
  }

  function isCenteredOverCell(sprite) {
    return Math.floor(sprite.x) % world.tilewidth === 0 && Math.floor(sprite.y) % world.tileheight === 0;
  }

  function setup(Mojo) {
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  MojoH5.Config= {
    assetFiles: ["tileSet.png"],
    arena: { width:640, height:512 },
    scaleToWindow: true,
    start: setup
  };

})(this);

