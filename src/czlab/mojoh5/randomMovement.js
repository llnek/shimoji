(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;
  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _=Mojo.u;

    //`isAtIntersection` returns true or false depending on whether a
    //sprite is exactly aligned to anintersection in the maze corridors
    function isCenteredOverCell(sprite,world){
      return Math.floor(sprite.x) % world.tiled.tileW === 0 && Math.floor(sprite.y) % world.tiled.tileH === 0;
    }
    function directionToVelocity(direction=Infinity, speed = 0){
      //Convert the direction string to an object with `vx` and `vy`
      //velocity properties
      switch(direction){
      case Mojo.UP: return { y: -speed, x: 0 };
      case Mojo.DOWN: return { y: speed, x: 0 };
      case Mojo.LEFT: return { x: -speed, y: 0 };
      case Mojo.RIGHT: return { x: speed, y: 0 };
      default: return { x: 0, y: 0 };
      }
    }
    function changeDirection(sprite, direction, speed){
      //Change the sprite's velocity if it's centered
      //over a tile grid cell
      switch(direction){
      case Mojo.UP:
        sprite.mojoh5.vy = -speed;
        sprite.mojoh5.vx = 0;
      break;
      case Mojo.DOWN:
        sprite.mojoh5.vy = speed;
        sprite.mojoh5.vx = 0;
      break;
      case Mojo.LEFT:
        sprite.mojoh5.vx = -speed;
        sprite.mojoh5.vy = 0;
      break;
      case Mojo.RIGHT:
        sprite.mojoh5.vx = speed;
        sprite.mojoh5.vy = 0;
      break;
      default:
        sprite.mojoh5.vx = 0;
        sprite.mojoh5.vy = 0;
      break;
      }
    }
    function surroundingDiagonalCells(index, widthInTiles){
      return [ index - widthInTiles - 1, index - widthInTiles + 1, index + widthInTiles - 1, index + widthInTiles + 1 ];
    }
    function _validDirections(sprite, mapArray, validGid, world){
      //Get the sprite's current map index position number
      let index = _T.getTileIndex(sprite, world);
      //An array containing the index numbers of tile cells
      //above, below and to the left and right of the sprite
      //Get the index position numbers of the 4 cells to the top, right, left
      //and bottom of the sprite
      //let surroundingIndexNumbers = _T.getCrossCells(index, world);
      //Find all the tile gid numbers that match the surrounding index numbers
      let surroundingTileGids = _T.getCrossTiles(index, mapArray, world);
        //surroundingIndexNumbers.map(index => mapArray[index]);
      //`directionList` is an array of 4 string values that can be either
      //"up", "left", "right", "down" or "none", depending on
      //whether there is a cell with a valid gid that matches that direction.
      let possibleDirections = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
      let directionList = surroundingTileGids.map((gid, i) => {
        //If the direction is valid, choose the matching string
        //identifier for that direction. Otherwise, return "none"
        return gid === validGid ? possibleDirections[i] : Mojo.NONE;
      });
      //We don't need "none" in the list of directions
      //(it's just a placeholder), so let's filter it out
      return directionList.filter(direction => direction !== Mojo.NONE);
    }
    function canChangeDirection(validDirections = []){
      //Is the sprite in a dead-end (cul de sac.) This will be true if there's only
      //one element in the `validDirections` array
      let inCulDeSac = validDirections.length === 1;
      //Is the sprite trapped? This will be true if there are no elements in
      //the `validDirections` array
      let trapped = validDirections.length === 0;
      //Is the sprite in a passage? This will be `true` if the the sprite
      //is at a location that contain the values
      //“left” or “right” and “up” or “down”
      let up = validDirections.find(x => x === Mojo.UP),
        down = validDirections.find(x => x === Mojo.DOWN),
        left = validDirections.find(x => x === Mojo.LEFT),
        right = validDirections.find(x => x === Mojo.RIGHT),
        atIntersection = (up || down) && (left || right);
      //Return `true` if the sprite can change direction or
      //`false` if it can't
      return trapped || atIntersection || inCulDeSac;
    }
    function randomDirection(sprite, validDirections = []){
      //Is the sprite trapped?
      let trapped = validDirections.length === 0;
      //If the sprite isn't trapped, randomly choose one of the valid
      //directions. Otherwise, return the string "trapped"
      return trapped ? Mojo.TRAPPED : validDirections[_.randInt2(0, validDirections.length - 1)];
    }
    _Z.defScene("level1",{
      setup:function(){
        let world = this.world= _T.makeTiledWorld( "monsterMaze.json");
        this.insert(world);
        //Create the alien sprite and set its speed
        let alien = this.alien= world.tiled.getObject("alien");
        alien.mojoh5.speed = 4;
        //Get a reference to the array that stores all the wall data
        let wallMapArray = this.wallMapArray= world.tiled.getObject("wallLayer").tiled.data;
        //We're just using the monsters sprites in the Tiled Editor
        //map as generic placeholders.  We're going to use their size and
        //position data to build new monster sprites from scratch and place
        //them in the world. That's because we want to give the monsters
        //custom animation frames. Here's how to do this:
        //1. Get a reference to the map's monster sprites and the
        //layer container that those sprites are one
        let mapMonsters = world.tiled.getObjects("monster");
        let monsterLayer = world.tiled.getObject("monsterLayer");
        //2.Define the monster's animation frames. In this example there are just
        //two: the monster mouth open, and the monster's mouth closed.
        let monsterFrames = _S.frames( "monsterMaze.png", 64,64, [ [128, 0], [128, 64] ]);
        //3.Create a new array called `monsters` that contains a new `monster`
        //sprite for each `mapMonster` in the original array. The new
        //`monster` sprites are created using the `monsterFrames` we defined
        //above and have the same `x` and `y` positions as the original
        //placeholder monsters from the Tiled Editor map. We're also going
        //to give them new `direction` and `speed`. Finally, we need to make the
        //placeholder monsters invisible and add the new `monster` sprite
        //to the `monsterLayer` container.
        let monsters = this.monsters= mapMonsters.map(mapMonster => {
          let monster = _S.sprite(monsterFrames);
          monster.x = mapMonster.x;
          monster.y = mapMonster.y;
          monster.mojoh5.direction = Mojo.NONE;
          monster.mojoh5.speed = 4;
          monsterLayer.addChild(monster);
          mapMonster.visible = false;
          //Define the monster's two states: `normal` and `scared`
          //`0` and `1` refer to the monster's two animation frames
          monster.states = { normal: 0, scared: 1 };
          return monster;
        });
        //Give the `alien` a `direction` property and initilize it to "none"
        alien.mojoh5.direction = Mojo.NONE;
        //Configure Hexi's built in arrow keys to assign the alien a direction
        //Create some keyboard objects
        let leftArrow = _I.keyboard(37);
        let upArrow = _I.keyboard(38);
        let rightArrow = _I.keyboard(39);
        let downArrow = _I.keyboard(40);
        //Program the keyboard objects
        leftArrow.press = () => alien.mojoh5.direction = Mojo.LEFT;
        upArrow.press = () => alien.mojoh5.direction = Mojo.UP;
        rightArrow.press = () => alien.mojoh5.direction = Mojo.RIGHT;
        downArrow.press = () => alien.mojoh5.direction = Mojo.DOWN;
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        let self=this;
        if(isCenteredOverCell(this.alien,this.world)){
          let velocity = directionToVelocity(this.alien.mojoh5.direction, this.alien.mojoh5.speed);
          this.alien.mojoh5.vx = velocity.x;
          this.alien.mojoh5.vy = velocity.y;
        }

        //Move the alien
        _S.move(this.alien);

        //Check for a collision between the alien and the floor
        let alienVsFloor = _T.hitTestTile(this.alien, this.wallMapArray, 0, this.world, Mojo.EVERY);
        //If every corner point on the alien isn't touching a floor
        //tile (array gridIDNumber: 0) then prevent the alien from moving
        if(!alienVsFloor.hit){
          //To prevent the alien from moving, subtract its velocity from its position
          this.alien.x -= this.alien.mojoh5.vx;
          this.alien.y -= this.alien.mojoh5.vy;
          this.alien.mojoh5.vx = 0;
          this.alien.mojoh5.vy = 0;
        }
        this.monsters.forEach(monster => {
          //1. Is the monster directly centered over a map tile cell?
          if(isCenteredOverCell(monster, this.world)){
            //2. Yes, it is, so find out which are valid directions to move.
            //`findValidDirections` returns an array which can include any
            //of these string values: "up", "right", "down", "left" or "none"
            let validDirections = _validDirections(
              monster, self.wallMapArray, 0, self.world
            );
            //3. Can the monster change its direction?
            if(canChangeDirection(validDirections)){
              //4. If it can, randomly select a new direction
              monster.mojoh5.direction = randomDirection(monster, validDirections);
            }
            //5. Use the monster's direction and speed to find its
            //new velocity
            let velocity = directionToVelocity(monster.mojoh5.direction, monster.mojoh5.speed);
            monster.mojoh5.vx = velocity.x;
            monster.mojoh5.vy = velocity.y;
          }
          //6. Move the monster
          monster.x += monster.mojoh5.vx;
          monster.y += monster.mojoh5.vy;
          //Change the monster's state
          //1. Plot a vector between the monster and the alien
          let ca= _S.centerXY(this.alien);
          let cm= _S.centerXY(monster);
          let v= {x:ca.x-cm.x,y:ca.y-cm.y};
          //2. Find the vector's magnitude. This tells you how far
          //apart the sprites are
          let magnitude = Math.sqrt(v.x * v.x + v.y * v.y);
          //3. If the monster is less than 192 pixels away from the alien,
          //change the monster's state to `scared`. Otherwise, set its
          //state to `normal`
          if(magnitude < 192){
            monster.mojoh5.showFrame(monster.states.scared);
          } else {
            monster.mojoh5.showFrame(monster.states.normal);
          }
        });
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
    arena: {width:704, height:512},
    scaleToWindow:true,
    start: setup
  }
})(this);


