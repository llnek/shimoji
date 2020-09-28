;(function(global){
  "use strict";
  const window=global;

  //let level, world, player, output, score;
  function setup(Mojo){
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,_2d=Mojo["2d"];
    const G=Mojo.Game;
    const _=Mojo.u, is=Mojo.is;
    G.score=0;
    G.level ={
      //The height and width of the level, in tiles
      tilesInX:16,
      tilesInY: 16,
      //The width and height of each tile, in pixels
      tileW:32,
      tileH:32,
      //Tileset image properties. You could use a texture atlas, but
      //let's go old-skool on this one and just blit from directly from
      //an image
      tileset: {
        //The source image
        source: "platforms.png",
        //The x/y coordinates for the sprites on the tileset
        player: [32, 32],
        treasure: [32, 0],
        cloud: [64, 0],
        sky: [64, 32],
        rock: [0, 32],
        grass: [0, 0]
      }
    };
    function makeWorld(level){
      let world = S.group();
      world.tiled={
        player: null,
        map: [],
        platforms: [],
        treasures: [],
        itemLocations: []
      };
      makeMap();
      terraformMap();
      addItems();
      makeTileSprites();
      //If you want to see what the world looks likes using simple shapes,
      //use `makeSprites` instead of `makeTileSprites`
      //makeSprites();
      function makeMap(){
        //The `cellIsAlive` helper function.
        //Give each cell a 1 in 4 chance to live. If it's "alive", it will
        //be rock, if it's "dead" it will be sky
        let cellIsAlive = () => _.randInt2(0, 3) === 0;
        //A loop creates a `cell` object for each
        //grid cell on the map. Each `cell` has a name, and a `x` and `y`
        //position. The loop uses the `cellIsAlive` function to
        //give each cell a 25% chance of being "rock" and a 75%
        //chance of being "sky".
        //First, figure out the number of cells in the grid
        let numberOfCells = level.tilesInY * level.tilesInX;
        for(let x,y,cell,i=0; i<numberOfCells; ++i){
          x = i % level.tilesInX;
          y = Math.floor(i / level.tilesInX);
          cell = { x: x, y: y, item: "" };
          cell.terrain= cellIsAlive() ? "rock" : "sky";
          _.conj(world.tiled.map,cell);
        }
      }
      function terraformMap() {
        //add border and grass.
        let _index = (x, y) => { return x + (y * level.tilesInX) };
        world.tiled.map.forEach((cell, index, map) => {
          let cellTotheLeft = map[_index(cell.x - 1, cell.y)],
              cellTotheRight = map[_index(cell.x + 1, cell.y)],
              cellBelow = map[_index(cell.x, cell.y + 1)],
              cellAbove = map[_index(cell.x, cell.y - 1)],
              cellTwoAbove = map[_index(cell.x, cell.y - 2)];
          if(cell.x === 0 || cell.y === 0 ||
            cell.x === level.tilesInX - 1 ||
            cell.y === level.tilesInY - 1){
            cell.terrain = "border";
          }else{
            //If the cell isn't on the border, find out if we can
            //grow some grass on it. Any rock with a sky cell above
            //it should be made into grass. Here's how to figure this out:
            //1. Is the cell a rock?
            if(cell.terrain === "rock")
              //2. Is there sky directly above it?
              if(cellAbove && cellAbove.terrain === "sky"){
                //3. Yes there is, so change its name to "grass"
                cell.terrain = "grass";
                //4. Make sure there are 2 sky cells above grass cells
                //so that it's easy to jump to higher platforms
                //without bumping your head. Change any rock cells that are
                //2 above the current grass cell to "sky"
                if(cellTwoAbove)
                  if(cellTwoAbove.terrain === "rock" ||
                    cellTwoAbove.terrain === "grass"){
                    cellTwoAbove.terrain = "sky";
                  }
              }
          }
        });
        //We now have the finished map.
        //Next, we're going to loop through the map one more time
        //to find all the item location cells and push them into the
        //itemLocations array. itemLocations is a list of cells that
        //we'll use later to place the player and treasure
        world.tiled.map.forEach((cell, index, map) => {
          //Is the cell a grass cell?
          if(cell.terrain === "grass"){
            //Yes, so find the cell directly above it and push it
            //into the itemLocations array
            let cellAbove = map[_index(cell.x, cell.y - 1)];
            _.conj(world.tiled.itemLocations,cellAbove);
          }
        });
      }
      function addItems(){
        //The `findStartLocation` helper function returns a random cell
        let _findStartLocation = () => {
          let r = _.randInt2(0, world.tiled.itemLocations.length - 1);
          let location = world.tiled.itemLocations[r];
          //Splice the cell from the array so we don't choose the
          //same cell for another item
          _.disj(world.tiled.itemLocations,location);
          return location;
        };
        //1. Add the player
        //Find a random cell from the itemLocations array
        let cell = _findStartLocation();
        cell.item = "player";

        //2. Add 3 treasure boxes
        for(let i = 0; i < 3; ++i) {
          cell = _findStartLocation();
          cell.item = "treasure";
        }
        //console.table(world.map);
      }
      function makeTileSprites(){
        //The map and gameObjects arrays are complete, so we can
        //now use them to create the sprites.
        //All the map sprites will use the same x, y, width and
        //height values as the cell objects in those arrays.
        //rock, grass and border sprites will be pushed into the
        //`platforms` array so that use them for collision in the game loop
        //Make the terrain
        world.tiled.map.forEach((cell, index, map) => {
          let sprite,
              frame,
              x = cell.x * level.tileW,
              y = cell.y * level.tileH,
              width = level.tileW,
              height = level.tileH;
          switch(cell.terrain){
          case "rock":
            frame = S.frame(level.tileset.source,
                            width, height,
                            level.tileset.rock[0],
                            level.tileset.rock[1]);
            sprite = S.sprite(frame);
            S.setXY(sprite, x, y);
            world.addChild(sprite);
            _.conj(world.tiled.platforms,sprite);
          break;
          case "grass":
            frame = S.frame(
              level.tileset.source,
              width, height,
              level.tileset.grass[0],
              level.tileset.grass[1]);
            sprite = S.sprite(frame);
            S.setXY(sprite,x, y);
            world.addChild(sprite);
            _.conj(world.tiled.platforms,sprite);
          break;
          case "sky":
            //Add clouds every 6 cells and only on the top
            //80% of the level
            let sourceY=
                (index % 6 === 0 && index < map.length * 0.8)
                ? level.tileset.cloud[1] : level.tileset.sky[1];
            frame = S.frame(
              level.tileset.source,
              width, height,
              level.tileset.sky[0], sourceY);
            sprite = S.sprite(frame);
            S.setXY(sprite,x, y);
            world.addChild(sprite);
          break;
          case "border":
            sprite = S.rectangle(level.tileW, level.tileH,"black");
            //sprite.fillStyle = "black";
            sprite.x = cell.x * level.tileW;
            sprite.y = cell.y * level.tileH;
            //sprite.width = level.tilewidth;
            //sprite.height = level.tileheight;
            world.addChild(sprite);
            _.conj(world.tiled.platforms,sprite);
          break;
          }
        });
        //Make the game items. (Do this after the terrain so
        //that the items sprites display above the terrain sprites)
        world.tiled.map.forEach(cell => {
          //Each game object will be half the size of the cell.
          //They should be centered and positioned so that they align
          //with the bottom of cell
          if(cell.item !== ""){
            let sprite,
                frame,
                x = cell.x * level.tileW + level.tileW / 4,
                y = cell.y * level.tileH + level.tileW / 2,
                width = level.tileW / 2,
                height = level.tileH / 2;
            switch(cell.item){
            case "player":
              frame = S.frame("platforms.png", 32, 32, 32, 32);
              sprite = S.sprite(frame);
              sprite.width = width;
              sprite.height = height;
              S.setXY(sprite,x, y);
              sprite.mojoh5.friction[0] =
              sprite.mojoh5.friction[0] =1;
              sprite.mojoh5.gravity[0] =
              sprite.mojoh5.gravity[1] = 0.3;
              sprite.mojoh5.jumpForce = [-6.8,-6.8];
              sprite.mojoh5.isOnGround = true;
              world.tiled.player = sprite;
              world.addChild(sprite);
            break;
            case "treasure":
              frame = S.frame("platforms.png", 32, 32, 32, 0);
              sprite = S.sprite(frame);
              sprite.width = width;
              sprite.height = height;
              S.setXY(sprite,x, y);
              world.addChild(sprite);
              _.conj(world.tiled.treasures,sprite);
            break;
            }
          }
        });
      }
      //OPTIONAL: the `makeSprites` function
      //`makeSprites` is an alternative to `makeTileSprites` that creates
      //the sprites from simple squares and colors, in the style of a
      //Commodore 64 or Vic 20.
      //To see this in action: comment-out the `makeTileSprites` function
      //call at the head of the `makeWorld` function, and un-comment the
      //`makeSprites` function call in the code just after it
      function makeSprites(){
        //The map and gameObjects arrays are complete, so we can
        //now use them to create the sprites.
        //All the map sprites will use the same x, y, width and
        //height values as the cell objects in those arrays.
        //rock, grass and border sprites will be pushed into the
        //`platforms` array so that use them for collision in the game loop

        //Make the terrain
        world.tiled.map.forEach(function(cell){
          let sprite = S.rectangle();
          sprite.x = cell.x * level.tileW;
          sprite.y = cell.y * level.tileH;
          sprite.width = level.tileW;
          sprite.height = level.tileH;
          switch(cell.terrain){
          case "rock":
            sprite.mojoh5.fillStyle = "black";
            _.conj(world.tiled.platforms,sprite);
          break;
          case "grass":
            sprite.mojoh5.fillStyle = "green";
            _.conj(world.tiled.platforms,sprite);
          break;
          case "sky":
            sprite.mojoh5.fillStyle = "cyan";
          break;
          case "border":
            sprite.mojoh5.fillStyle = "blue";
            _.conj(world.tiled.platforms,sprite);
          break;
          }
          world.addChild(sprite);
        });
        //Make the game items. (Do this after the terrain so
        //that the items sprites display above the terrain sprites)
        world.tiled.map.forEach(function(cell){
          //Each game object will be half the size of the cell.
          //They should be centered and positioned so that they align
          //with the bottom of cell
          if(cell.item !== ""){
            let sprite = S.rectangle();
            sprite.x = cell.x * level.tileW + level.tileW / 4;
            sprite.y = cell.y * level.tileH + level.tileW / 2;
            sprite.width = level.tileW / 2;
            sprite.height = level.tileH / 2;
            switch(cell.item){
            case "player":
              sprite.mojoh5.fillStyle = "red";
              sprite.mojoh5.acc[0]=
              sprite.mojoh5.acc[1]=0;
              sprite.mojoh5.friction[0] =
              sprite.mojoh5.friction[1] = 1;
              sprite.mojoh5.gravity[0] =
              sprite.mojoh5.gravity[1] = 0.3;
              sprite.mojoh5.jumpForce[0] =
              sprite.mojoh5.jumpForce[1] = -6.8;
              sprite.mojoh5.vel[0] = 0;
              sprite.mojoh5.vel[1] = 0;
              sprite.mojoh5.isOnGround = true;
              world.tiled.player = sprite;
              world.addChild(sprite);
            break;
            case "treasure":
              sprite.mojoh5.fillStyle = "gold";
              world.addChild(sprite);
              _.conj(world.tiled.treasures,sprite);
            break;
            }
          }
        });
      }

      return world;
    }

    Z.defScene("hud", {
      setup:function() {
        this.output = S.text("score: ",
          {fontFamily: "puzzler", fontSize: 16, fill:"white"}, 32, 8);
        this.insert(this.output);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function() {
        this.output.mojoh5.content("score: " + G.score);
      }
    });

    Z.defScene("level1", {
      setup: function() {
        let world = makeWorld(G.level);
        let player = world.tiled.player;
        this.world=world;
        this.insert(world);

        let leftArrow = I.keyboard(37),
          rightArrow = I.keyboard(39),
          spaceBar = I.keyboard(32);

        leftArrow.press = () => {
          if(rightArrow.isUp)
            player.mojoh5.acc[0]= -0.2;
        };

        leftArrow.release = () => {
          if(rightArrow.isUp)
            player.mojoh5.acc[0] = 0;
        };

        rightArrow.press = () => {
          if(leftArrow.isUp)
            player.mojoh5.acc[0] = 0.2;
        };
        rightArrow.release = () => {
          if(leftArrow.isUp)
            player.mojoh5.acc[0] = 0;
        };
        spaceBar.press = () => {
          if(player.mojoh5.isOnGround){
            player.mojoh5.vel[1] += player.mojoh5.jumpForce[1];
            player.mojoh5.isOnGround = false;
            player.mojoh5.friction[0] = 1;
          }
        };
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate: function(dt){
        let player=this.world.tiled.player;
        //Regulate the amount of friction acting on the player.
        //The is the most important variable to set if you want to
        //fine-tune the feel of the player control
        if(player.mojoh5.isOnGround){
          //Add some friction if the player is on the ground
          player.mojoh5.friction[0] = 0.92;
        } else {
          //Add less friction if it's in the air
          player.mojoh5.friction[0] = 0.97;
        }
        //Apply the acceleration
        player.mojoh5.vel[0] += player.mojoh5.acc[0];
        player.mojoh5.vel[1] += player.mojoh5.acc[1];
        //Apply friction
        player.mojoh5.vel[0] *= player.mojoh5.friction[0];
        //Apply gravity
        player.mojoh5.vel[1] += player.mojoh5.gravity[1];
        //Move the player
        S.move(player);
        //Use the `hit` method to check for a collision between the
        //player and the platforms
        let playerVsPlatforms = _2d.hitTest(
          player, this.world.tiled.platforms, false,true,
          function(col, platform){
            if(col){
              if(col.has(Mojo.BOTTOM) && player.mojoh5.vel[1] >= 0){
                player.mojoh5.isOnGround = true;
                //Neutralize gravity by applying its
                //exact opposite force to the character's vy
                //player.vy = -player.gravity;
                player.mojoh5.vel[1] = -player.mojoh5.gravity[1];
              }
              else if(col.has(Mojo.TOP) && player.mojoh5.vel[1] <= 0){
                player.mojoh5.vel[1] = 0;
              }
              else if(col.has(Mojo.RIGHT) && player.mojoh5.vel[0] >= 0){
                player.mojoh5.vel[0] = 0;
              }
              else if(col.has(Mojo.LEFT) && player.mojoh5.vel[0] <= 0){
                player.mojoh5.vel[0] = 0;
              }
              //Set `isOnGround` to `false` if the bottom of the player
              //isn't touching the platform
              if(!col.has(Mojo.BOTTOM) && player.mojoh5.vel[1] > 0){
                player.mojoh5.isOnGround = false;
              }
            }
          }
        );
        //Alternatively, use `forEach` and the lower-level
        //`rectangleCollision` method to achieve the same thing
        /*
        //Check for collisions between the player and the platforms
        world.platforms.forEach(function(platform) {

          //Use `rectangleCollision` to prevent the player and platforms
          //from overlapping
          let collision = g.rectangleCollision(player, platform);

          //Use the collision variable to figure out what side of the player
          //is hitting the platform
          if(collision === "bottom" && player.vy >= 0) {
            //Tell the game that the player is on the ground if
            //it's standing on top of a platform
            player.isOnGround = true;
            //Neutralize gravity by applying its
            //exact opposite force to the character's vy
            player.vy = -player.gravity;
          }
          else if(collision === "top" && player.vy <= 0) {
            player.vy = 0;
          }
          else if(collision === "right" && player.vx >= 0) {
            player.vx = 0;
          }
          else if(collision === "left" && player.vx <= 0) {
            player.vx = 0;
          }
          //Set `isOnGround` to `false` if the bottom of the player
          //isn't touching the platform
          if(collision !== "bottom" && player.vy > 0) {
            player.isOnGround = false;
          }
        });
        */

        //Treasure collection
        //Use `filter` and `hit` to check whether the player is touching a
        //star. If it is, add 1 to the score, remove the `star` sprite and filter it out of the
        //`world.treasure` array
        this.world.tiled.treasures = this.world.tiled.treasures.filter(function(star){
          if (_2d.hitTest(player, star)){
            G.score += 1;
            S.remove(star);
            return false;
          } else {
            return true;
          }
        });
      }
    });

    Z.runScene("level1");
    Z.runScene("hud");
  }

  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: ["platforms.png", "puzzler.otf" ],
    scaleToWindow: true,
    start: setup,
    arena: { width: 512, height: 512 }
  };

})(this);
