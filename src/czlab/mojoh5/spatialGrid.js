(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;
  function scenes(Mojo){
    const _=Mojo.u;
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;

    _Z.defScene("level1",{
      setup:function(){

        let marbles = this.marbles= _S.grid(

          5, 5, 128, 128,
          true, 0, 0,

          //A function that describes how to make each marble in the grid
          () => {
            let frames = _S.animation("marbles.png", 32, 32);
            let marble = _S.sprite(frames);
            marble.mojoh5.show(_.randInt2(0, 5));
            _S.circular(marble, true);
            let sizes = [8, 12, 16, 20, 24, 28, 32];
            _S.radius(marble, sizes[_.randInt2(0, 6)]/2);
            marble.mojoh5.vx = _.randInt2(-10, 10);
            marble.mojoh5.vy = _.randInt2(-10, 10);
            marble.mojoh5.friction = _.p2(0.99,0.99);
            marble.mojoh5.mass = 0.75 + (_S.radius(marble)/32);
            return marble;
          },

          //Run any extra code after each peg is made, if you want to
          () => console.log("extra!")
        );
        this.insert(marbles);

        //Create the "sling" which is a line that will connect
        //the pointer to the marbles
        let sling = this.sling= _S.line("Yellow", 4);
        this.insert(sling);
        sling.visible = false;

        //A variable to store the captured marble
        this.capturedMarble = null;

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        //If a marble has been captured, draw the
        //sling (the yellow line) between the pointer and
        //the center of the captured marble
        if(this.capturedMarble){
          let c=_S.centerXY(this.capturedMarble);
          this.sling.visible = true;
          this.sling.mojoh5.ptA(c.x,c.y);
          this.sling.mojoh5.ptB(Mojo.pointer.x,Mojo.pointer.y);
        }
        //Shoot the marble if the pointer has been released
        if (Mojo.pointer.isUp){
          this.sling.visible = false;
          if(this.capturedMarble){
            //Find out how long the sling is
            this.sling.mojoh5.length = _S.distance(this.capturedMarble, Mojo.pointer);
            //Get the angle between the center of the marble and the pointer
            this.sling.angle = _S.angle(Mojo.pointer, this.capturedMarble);
            //Shoot the marble away from the pointer with a velocity
            //proportional to the sling's length
            this.capturedMarble.mojoh5.vx = Math.cos(this.sling.angle) * this.sling.mojoh5.length / 5;
            this.capturedMarble.mojoh5.vy = Math.sin(this.sling.angle) * this.sling.mojoh5.length / 5;
            //Release the captured marble
            this.capturedMarble = null;
          }
        }
        this.marbles.children.forEach(marble => {
          //Check for a collision with the pointer and marble
          if(Mojo.pointer.isDown && !this.capturedMarble){
            if(_2d.hit(Mojo.pointer, marble)){
              //If there's a collision, capture the marble
              this.capturedMarble = marble;
              this.capturedMarble.mojoh5.vx = 0;
              this.capturedMarble.mojoh5.vy = 0;
            }
          }
          marble.mojoh5.vx *= marble.mojoh5.friction.x;
          marble.mojoh5.vy *= marble.mojoh5.friction.y;
          //Move the marble by applying the new calculated velocity
          //to the marble's x and y position
          _S.move(marble);
          //Contain the marble inside the stage and make it bounce
          //off the edges
          _2d.contain(marble, this, true);
        });
        //Add the marbles to the spatial grid
        //this.marbles.children.forEach(marble => _T.getIndex(marble));
        //1. Create the spatial grid
        //A function to initialize the spatial grid
        function spatialGrid(widthInPixels, heightInPixels, cellSizeInPixels, spritesArray){
          //Find out how many cells we need and how long the
          //grid array should be
          let width = widthInPixels / cellSizeInPixels;
          let height = heightInPixels / cellSizeInPixels;
          let length = width * height;
          let gridArray = [];
          //Add empty sub-arrays to element
          for(let i = 0; i < length; ++i){
            //Add empty arrays to each element. This is where
            //we're going to store sprite references
            gridArray.push([]);
          }
          //Add the sprites to the grid
          spritesArray.forEach(sprite => {
            //Find out the sprite's current map index position
            let index = _T.getIndex(sprite.x, sprite.y, cellSizeInPixels, cellSizeInPixels, width);
            //Add the sprite to the array at that index position
            if(isNaN(index)){
              let poo=spritesArray;
              throw "poo";
            }
            gridArray[index].push(sprite);
          });
          return gridArray;
        }
        //Create the spatial grid and add the marble sprites to it
        let grid = spatialGrid(512, 512, 64, this.marbles.children);
        //2. Check for collisions between sprites in the grid
        //Loop through all the sprites
        for(let i = 0; i < this.marbles.children.length; ++i){
          //Get a reference to the current sprite in the loop
          let sprite = this.marbles.children[i];
          //Find out the sprite's current map index position
          let gridWidthInTiles = 512 / 64;
          let index = _T.getIndex(sprite.x, sprite.y, 64, 64, gridWidthInTiles);
          //Find out what all the surrounding nodes are, including those that
          //might be beyond the borders of the grid
          let allSurroundingCells = [
                                      grid[index - gridWidthInTiles - 1],
                                      grid[index - gridWidthInTiles],
                                      grid[index - gridWidthInTiles + 1],
                                      grid[index - 1],
                                      grid[index],
                                      grid[index + 1],
                                      grid[index + gridWidthInTiles - 1],
                                      grid[index + gridWidthInTiles],
                                      grid[index + gridWidthInTiles + 1]
                                    ];
          //Find all the sprites that might be colliding with this current sprite
          for(let j = 0; j < allSurroundingCells.length; ++j){
            //Get a reference to the current surrounding cell
            let cell = allSurroundingCells[j]
            //If the cell isn't `undefined` (beyond the grid borders)
            //and it's not empty, check for a collision between
            //the current sprite and sprites in the cell
            if(cell && cell.length !== 0){
              //Loop through all the sprites in the cell
              for(let k = 0; k < cell.length; ++k){
                //Get a reference to the current sprite being checked in the cell
                let surroundingSprite = cell[k];
                //If the sprite in the cell is not the same as the current
                //sprite in the main loop, then check for a collision
                //between those sprites
                if(surroundingSprite !== sprite)
                  //Perform a narrow-phase collision check to bounce the sprites apart
                  _2d.movingCircleCollision(sprite, surroundingSprite);
              }
            }
          }
          //Finally, remove this current sprite from the current
          //spatial grid cell because all possible collisions
          //involving this sprite have been checked
          grid[index] = grid[index].filter(x => x !== sprite);
        }
      }
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  MojoH5.Config={
    assetFiles: ["marbles.png"],
    arena: {width:512, height:512},
    scaleToWindow:true,
    start: setup,
    backgroundColor: "black"
  };
})(this);



