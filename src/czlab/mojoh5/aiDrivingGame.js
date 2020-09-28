(function(global){
  "use strict";
  const window=global;

  function defScenes(Mojo) {
    const Z=Mojo.Scenes, S=Mojo.Sprites, I=Mojo.Input, T=Mojo.Tiles;
    const _=Mojo.u;

    Z.defScene("level1",{
      setup:function(){
        this.world = S.group();
        let tiled= this.world.tiled= {tileW: 64, tileH: 64, tilesInX: 10, tilesInY: 8};
        let layers = tiled.layers = [//The environment layer. `2` represents the walls,
        //`1` represents the floors
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //The character layer. `3` represents the player's car,
        //`4` represents the AI car and
        //`0` represents an empty cell which won't contain any
        //sprites
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //Angles map
        [45, 45, 45, 45, 45, 45, 45, 45, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 315, 270, 315, 315, 315, 315, 90, 90, 135, 315, 315, 270, 135, 135, 135, 135, 90, 90, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 270, 270, 225, 225, 225, 225, 225, 225, 225]]; //Build the game world by looping through each
        //of the layers arrays one after the other
        layers.forEach(layer => {
          layer.forEach((gid, index) => {
            if(gid !== 0){
              let sprite;
              let column = index % tiled.tilesInX;
              let row = Math.floor(index / tiled.tilesInX);
              let x = column * tiled.tileW;
              let y = row * tiled.tileH;
              switch(gid){
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
              if(sprite){
                sprite.x = x;
                sprite.y = y;
                this.world.addChild(sprite);
              }
            }
          });
        });
        this.insert(this.world);
        function _addCarProperties(carSprite){
          carSprite.mojoh5.vel[0] = 0;
          carSprite.mojoh5.vel[1] = 0;
          carSprite.mojoh5.acc[0]= 0.2;
          carSprite.mojoh5.acc[1]= 0.2;
          carSprite.mojoh5.angVel= 0;
          carSprite.mojoh5.friction[0] = 0.96;
          carSprite.mojoh5.friction[1] = 0.96;
          carSprite.mojoh5.speed = 0; //Center the car's rotation point
          carSprite.anchor.set(0.5);
          //S.setPivot(carSprite,0.5, 0.5); //Whether or not the car should move forward
          carSprite.mojoh5.moveForward = false;
        }
        _addCarProperties(this.car);
        _addCarProperties(this.aiCar);
        this.aiCar.mojoh5.moveForward = true;

        let leftArrow = I.keyboard(37),
          upArrow = I.keyboard(38),
          rightArrow = I.keyboard(39),
          downArrow = I.keyboard(40); //Set the car's `rotationSpeed` to -0.1 (to rotate left) if the
        //left arrow key is being pressed

        leftArrow.press = () => {
          this.car.mojoh5.angVel = -0.05;
        }; //If the left arrow key is released and the right arrow
  //key isn't being pressed down, set the `rotationSpeed` to 0

        leftArrow.release = () => {
          if (!rightArrow.isDown) this.car.mojoh5.angVel = 0;
        }; //Do the same for the right arrow key, but set
  //the `rotationSpeed` to 0.1 (to rotate right)

        rightArrow.press = () => {
          this.car.mojoh5.angVel = 0.05;
        };

        rightArrow.release = () => {
          if(!leftArrow.isDown) this.car.mojoh5.angVel = 0;
        }; //Set `car.moveForward` to `true` if the up arrow key is
  //pressed, and set it to `false` if it's released

        upArrow.press = () => {
          this.car.mojoh5.moveForward = true;
        };

        upArrow.release = () => {
          this.car.mojoh5.moveForward = false;
        }; //Start the game loop by setting the game state to `play`

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt) {
        //Move the AI car
        //If `aICar.moveForward` is `true`, increase the speed as long
        //it is under the maximum speed limit of 3
        if(this.aiCar.mojoh5.moveForward && this.aiCar.mojoh5.speed <= 3) {
          this.aiCar.mojoh5.speed += 0.08;
        }
        //Find the AI car's current angle, in degrees
        let currentAngle = this.aiCar.rotation * (180 / Math.PI);
        //Constrain the calculated angle to a value between 0 and 360
        currentAngle = currentAngle + Math.ceil(-currentAngle / 360) * 360;
        //Find out its index position on the map
        let aiCarIndex = Mojo.getIndex(this.aiCar.x, this.aiCar.y, 64, 64, 10);
        //Find out what the target angle is for that map position
        let angleMap = this.world.tiled.layers[2];
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
          this.aiCar.mojoh5.angVel = -0.03;
        } else {
          //Turn right
          this.aiCar.mojoh5.angVel = 0.03;
        } //Use the `rotationSpeed` to set the car's rotation

        this.aiCar.rotation += this.aiCar.mojoh5.angVel;
        //Use the `speed` value to figure out the acceleration in the
        //direction of the aiCar’s rotation
        this.aiCar.mojoh5.acc[0]= this.aiCar.mojoh5.speed * Math.cos(this.aiCar.rotation);
        this.aiCar.mojoh5.acc[1]= this.aiCar.mojoh5.speed * Math.sin(this.aiCar.rotation);
        //Apply the acceleration and friction to the aiCar's velocity

        this.aiCar.mojoh5.vel[0] = this.aiCar.mojoh5.acc[0];
        this.aiCar.mojoh5.vel[1] = this.aiCar.mojoh5.acc[1];
        this.aiCar.mojoh5.vel[0] *= this.aiCar.mojoh5.friction[0];
        this.aiCar.mojoh5.vel[1] *= this.aiCar.mojoh5.friction[1];
        //Apply the aiCar's velocity to its position to make the aiCar move

        this.aiCar.x += this.aiCar.mojoh5.vel[0];
        this.aiCar.y += this.aiCar.mojoh5.vel[1]; //Move the player's car
        //Use the `rotationSpeed` to set the car's rotation

        this.car.rotation += this.car.mojoh5.angVel; //If `car.moveForward` is `true`, increase the speed

        if(this.car.mojoh5.moveForward) {
          this.car.mojoh5.speed += 0.05;
        } //If `car.moveForward` is `false`, use
        //friction to slow the car down
        else {
          this.car.mojoh5.speed *= this.car.mojoh5.friction[0];
        } //Use the `speed` value to figure out the acceleration in the
        //direction of the car’s rotation

        this.car.mojoh5.acc[0]= this.car.mojoh5.speed * Math.cos(this.car.rotation);
        this.car.mojoh5.acc[1]= this.car.mojoh5.speed * Math.sin(this.car.rotation);
        //Apply the acceleration and friction to the car's velocity

        this.car.mojoh5.vel[0] = this.car.mojoh5.acc[0];
        this.car.mojoh5.vel[1] = this.car.mojoh5.acc[1];
        this.car.mojoh5.vel[0] *= this.car.mojoh5.friction[0];
        this.car.mojoh5.vel[1] *= this.car.mojoh5.friction[1]; //Apply the car's velocity to its position to make the car move

        this.car.x += this.car.mojoh5.vel[0];
        this.car.y += this.car.mojoh5.vel[1]; //Slow the cars down if they're stuck in the grass
        //First find the car's map index position

        let carIndex = Mojo.getIndex(this.car.x, this.car.y, 64, 64, 10); //Get a reference to the race track map

        let trackMap = this.world.tiled.layers[0]; //Slow the car if it's on a grass tile (gid 1) by setting
        //the car's friction to 0.25, to make it sluggish

        if(trackMap[carIndex] === 1) {
          this.car.mojoh5.friction[0] = 0.25; //If the car isn't on a grass tile, restore its
          this.car.mojoh5.friction[1] = 0.25; //If the car isn't on a grass tile, restore its
          //original friction value
        } else {
          this.car.mojoh5.friction[0] = 0.96;
          this.car.mojoh5.friction[1] = 0.96;
        } //Slow the aiCar if it's on a grass tile (gid 1) by setting
        //its friction to 0.25, to make it sluggish

        if(trackMap[aiCarIndex] === 1) {
          this.aiCar.mojoh5.friction[0] = 0.25; //If the car isn't on a grass tile, restore its
          this.aiCar.mojoh5.friction[1] = 0.25; //If the car isn't on a grass tile, restore its
          //original friction value
        } else {
          this.aiCar.mojoh5.friction[0] = 0.96;
          this.aiCar.mojoh5.friction[1] = 0.96;
        }
      }
    });
  }

  function isCenteredOverCell(sprite,world) {
    return Math.floor(sprite.x) % world.tiled.tileW === 0 && Math.floor(sprite.y) % world.tiled.tileH === 0;
  }

  function setup(Mojo) {
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window["io.czlab.mojoh5.AppConfig"]= {
    assetFiles: ["tileSet.png"],
    arena: { width:640, height:512 },
    scaleToWindow: true,
    start: setup
  };

})(this);

