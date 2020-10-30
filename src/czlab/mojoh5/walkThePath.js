(function(window){
  "use strict";

  function _isCenteredOverCell(sprite,world) {
    return Math.floor(sprite.x) % world.tiled.tileW === 0 &&
           Math.floor(sprite.y) % world.tiled.tileH === 0
  }

  function defScenes(){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_G=Mojo.Game,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _=Mojo.u,is=Mojo.is;

    _Z.defScene("level1",{
      setup:function(){
        let world =this.world= _T.makeTiledWorld("walkThePath.json");
        let alien = this.alien= world.tiled.getOne("alien");
        this.insert(world);

        this.wallMapArray = world.tiled.getOne("wallLayer").tiled.data;
        //An array that will be used to store sub-arrays of
        //x/y position value pairs that we're going to use
        //to change the velocity of the alien sprite
        this.wayPoints2DArray = [];
        //A Boolean that will be set to true when the pointer
        //is clicked, and set to false when the new path
        //is calculated
        this.calculateNewPath = false;
        //The mouse pointer's `release` function runs the code that
        //calculates the shortest path and draws that sprites that
        //represent it
        Mojo.pointer.release = () => {
          //Set the new path's desination to the pointer's
          //current x and y position
          this.destinationX = Mojo.pointer.x;
          this.destinationY = Mojo.pointer.y;
          this.calculateNewPath = true;
        };
        Mojo.EventBus.sub(["post.update",this], "postUpdate");
      },
      postUpdate:function(dt){
        if(_isCenteredOverCell(this.alien,this.world)){
          if(this.calculateNewPath) {
            let c=_S.centerXY(this.alien);
            let path = _T.shortestPath(
              Mojo.getIndex(c[0], c[1], 64, 64, 13),
              Mojo.getIndex(this.destinationX, this.destinationY, 64, 64, 13),
              this.wallMapArray, //The map array
              this.world,//13, //Map width, in tiles
              [2, 3], //Obstacle gid array
              "manhattan", //Heuristic to use
              false //Use diagonals (true) or only use orthogonally adjacent tiles (false)
            );
            //Remove the first node of the `path` array. That's because we
            //don't need it: the alien sprite's current location and the
            //first node in the `path` array share the same location.
            //In the code ahead we're going to tell the alien sprite to move
            //from its current location, to first new node in the path.
            path.shift();
            //If the path isn't empty, fill the `wayPoints2DArray` with
            //sub arrays of x/y position value pairs.
            if(path.length !== 0) {
              //Get a 2D array of x/y points
              this.wayPoints2DArray = path.map(node => {
                //Figure out the x and y location of each square in the path by
                //multiplying the node's `column` and `row` by the height, in
                //pixels, of each cell: 64
                let x = node.col * 64,
                  y = node.row * 64;
                //Return a sub-array containing the x and y position of each node
                return [x, y];
              });
            }
            //Set `calculateNewPath` to `false` so that this block of code.
            //won't run again inside the game loop. (It can be set to `true`
            //again by clicking the pointer.)
            this.calculateNewPath = false;
          }
          //Set the alien's new velocity based on
          //the alien's relative x/y position to the current, next, way point.
          //Because we are always going to
          //remove a way point element after we set this new
          //velocity, the first element in the `wayPoints2DArray`
          //will always refer to the next way point that the
          //alien sprite has to move to
          if(this.wayPoints2DArray.length !== 0) {
            //Left
            if(this.wayPoints2DArray[0][0] < this.alien.x){
              this.alien.mojoh5.vel[0] = -4;
              this.alien.mojoh5.vel[1] = 0;
              //Right
            } else if(this.wayPoints2DArray[0][0] > this.alien.x) {
              this.alien.mojoh5.vel[0] = 4;
              this.alien.mojoh5.vel[1] = 0;
              //Up
            } else if(this.wayPoints2DArray[0][1] < this.alien.y) {
              this.alien.mojoh5.vel[0] = 0;
              this.alien.mojoh5.vel[1] = -4;
              //Down
            } else if(this.wayPoints2DArray[0][1] > this.alien.y) {
              this.alien.mojoh5.vel[0] = 0;
              this.alien.mojoh5.vel[1] = 4;
            }
            //Remove the current way point, so that next time around
            //the first element in the `wayPoints2DArray` will correctly refer
            //to the next way point that that alien sprite has
            //to move to
            this.wayPoints2DArray.shift();
            //If there are no way points remaining,
            //set the alien's velocity to 0
          } else {
            this.alien.mojoh5.vel[0] = 0;
            this.alien.mojoh5.vel[1] = 0;
          }
        }

        //Move the alien based on the new velocity
        this.alien.x += this.alien.mojoh5.vel[0];
        this.alien.y += this.alien.mojoh5.vel[1];
      }
    });
  }

  function setup(Mojo){
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: ["timeBombPanic.png","walkThePath.json"],
    arena: {width: 832, height:768},
    scaleToWindow:true,
    start: setup
  };


})(this);

