(function(global,undefined){
  "use strict";
  const window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  //let level, world, player, output, score;
  function setup(Mojo) {
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,_2d=Mojo["2d"];
    const G=Mojo.Game;
    const _=Mojo.u, is=Mojo.is;
    G.score=0;
    G.level = {
      //The height and width of the level, in tiles
      widthInTiles: 16,
      heightInTiles: 16,
      //The width and height of each tile, in pixels
      tilewidth: 32,
      tileheight: 32,
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
    function makeWorld(level) {
      let world = S.group();
      world.map = [];
      world.platforms = [];
      world.treasures = [];
      world.itemLocations = [];
      world.player = null;
      makeMap();
      terraformMap();
      addItems();
      makeTileSprites();
      //If you want to see what the world looks likes using simple shapes,
      //use `makeSprites` instead of `makeTileSprites`
      //makeSprites();
      function makeMap() {
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
        let numberOfCells = level.heightInTiles * level.widthInTiles;
        for(let x,y,cell,i=0; i<numberOfCells; ++i) {
          x = i % level.widthInTiles;
          y = Math.floor(i / level.widthInTiles);
          cell = { x: x, y: y, item: "" };
          cell.terrain= cellIsAlive() ? "rock" : "sky";
          _.conj(world.map,cell);
        }
      }
      function terraformMap() {
        //add border and grass.
        let _index = (x, y) => { return x + (y * level.widthInTiles) };
        world.map.forEach((cell, index, map) => {
          let cellTotheLeft = map[_index(cell.x - 1, cell.y)],
              cellTotheRight = map[_index(cell.x + 1, cell.y)],
              cellBelow = map[_index(cell.x, cell.y + 1)],
              cellAbove = map[_index(cell.x, cell.y - 1)],
              cellTwoAbove = map[_index(cell.x, cell.y - 2)];
          if(cell.x === 0 || cell.y === 0 ||
            cell.x === level.widthInTiles - 1 ||
            cell.y === level.heightInTiles - 1) {
            cell.terrain = "border";
          } else {
            //If the cell isn't on the border, find out if we can
            //grow some grass on it. Any rock with a sky cell above
            //it should be made into grass. Here's how to figure this out:
            //1. Is the cell a rock?
            if(cell.terrain === "rock")
              //2. Is there sky directly above it?
              if(cellAbove && cellAbove.terrain === "sky") {
                //3. Yes there is, so change its name to "grass"
                cell.terrain = "grass";
                //4. Make sure there are 2 sky cells above grass cells
                //so that it's easy to jump to higher platforms
                //without bumping your head. Change any rock cells that are
                //2 above the current grass cell to "sky"
                if(cellTwoAbove)
                  if(cellTwoAbove.terrain === "rock" ||
                    cellTwoAbove.terrain === "grass") {
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
        world.map.forEach((cell, index, map) => {
          //Is the cell a grass cell?
          if(cell.terrain === "grass") {
            //Yes, so find the cell directly above it and push it
            //into the itemLocations array
            let cellAbove = map[_index(cell.x, cell.y - 1)];
            _.conj(world.itemLocations,cellAbove);
          }
        });
      }
      function addItems() {
        //The `findStartLocation` helper function returns a random cell
        let _findStartLocation = () => {
          let r = _.randInt2(0, world.itemLocations.length - 1);
          let location = world.itemLocations[r];
          //Splice the cell from the array so we don't choose the
          //same cell for another item
          _.disj(world.itemLocations,location);
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
      function makeTileSprites() {
        //The map and gameObjects arrays are complete, so we can
        //now use them to create the sprites.
        //All the map sprites will use the same x, y, width and
        //height values as the cell objects in those arrays.
        //rock, grass and border sprites will be pushed into the
        //`platforms` array so that use them for collision in the game loop
        //Make the terrain
        world.map.forEach((cell, index, map) => {
          let sprite,
              frame,
              x = cell.x * level.tilewidth,
              y = cell.y * level.tileheight,
              width = level.tilewidth,
              height = level.tileheight;
          switch(cell.terrain) {
          case "rock":
            frame = S.frame(level.tileset.source,
                            width, height,
                            level.tileset.rock[0],
                            level.tileset.rock[1]);
            sprite = S.sprite(frame);
            sprite.setPosition(x, y);
            world.addChild(sprite);
            _.conj(world.platforms,sprite);
          break;
          case "grass":
            frame = S.frame(
              level.tileset.source,
              width, height,
              level.tileset.grass[0],
              level.tileset.grass[1]);
            sprite = S.sprite(frame);
            sprite.setPosition(x, y);
            world.addChild(sprite);
            _.conj(world.platforms,sprite);
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
            sprite.setPosition(x, y);
            world.addChild(sprite);
          break;
          case "border":
            sprite = S.rectangle(level.tilewidth, level.tileheight,"black");
            //sprite.fillStyle = "black";
            sprite.x = cell.x * level.tilewidth;
            sprite.y = cell.y * level.tileheight;
            //sprite.width = level.tilewidth;
            //sprite.height = level.tileheight;
            world.addChild(sprite);
            _.conj(world.platforms,sprite);
          break;
          }
        });
        //Make the game items. (Do this after the terrain so
        //that the items sprites display above the terrain sprites)
        world.map.forEach(cell => {
          //Each game object will be half the size of the cell.
          //They should be centered and positioned so that they align
          //with the bottom of cell
          if(cell.item !== "") {
            let sprite,
                frame,
                x = cell.x * level.tilewidth + level.tilewidth / 4,
                y = cell.y * level.tileheight + level.tilewidth / 2,
                width = level.tilewidth / 2,
                height = level.tileheight / 2;
            switch (cell.item) {
            case "player":
              frame = S.frame("platforms.png", 32, 32, 32, 32);
              sprite = S.sprite(frame);
              sprite.width = width;
              sprite.height = height;
              sprite.setPosition(x, y);
              sprite.accelerationX = 0;
              sprite.accelerationY = 0;
              sprite.frictionX = 1;
              sprite.frictionY = 1;
              sprite.gravity = 0.3;
              sprite.jumpForce = -6.8;
              sprite.vx = 0;
              sprite.vy = 0;
              sprite.isOnGround = true;
              world.player = sprite;
              world.addChild(sprite);
            break;
            case "treasure":
              frame = S.frame("platforms.png", 32, 32, 32, 0);
              sprite = S.sprite(frame);
              sprite.width = width;
              sprite.height = height;
              sprite.setPosition(x, y);
              world.addChild(sprite);
              _.conj(world.treasures,sprite);
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
      function makeSprites() {
        //The map and gameObjects arrays are complete, so we can
        //now use them to create the sprites.
        //All the map sprites will use the same x, y, width and
        //height values as the cell objects in those arrays.
        //rock, grass and border sprites will be pushed into the
        //`platforms` array so that use them for collision in the game loop

        //Make the terrain
        world.map.forEach(function(cell) {
          let sprite = S.rectangle();
          sprite.x = cell.x * level.tilewidth;
          sprite.y = cell.y * level.tileheight;
          sprite.width = level.tilewidth;
          sprite.height = level.tileheight;
          switch (cell.terrain) {
          case "rock":
            sprite.fillStyle = "black";
            _.conj(world.platforms,sprite);
          break;
          case "grass":
            sprite.fillStyle = "green";
            _.conj(world.platforms,sprite);
          break;
          case "sky":
            sprite.fillStyle = "cyan";
          break;
          case "border":
            sprite.fillStyle = "blue";
            _.conj(world.platforms,sprite);
          break;
          }
          world.addChild(sprite);
        });
        //Make the game items. (Do this after the terrain so
        //that the items sprites display above the terrain sprites)
        world.map.forEach(function(cell) {
          //Each game object will be half the size of the cell.
          //They should be centered and positioned so that they align
          //with the bottom of cell
          if(cell.item !== "") {
            let sprite = S.rectangle();
            sprite.x = cell.x * level.tilewidth + level.tilewidth / 4;
            sprite.y = cell.y * level.tileheight + level.tilewidth / 2;
            sprite.width = level.tilewidth / 2;
            sprite.height = level.tileheight / 2;
            switch (cell.item) {
            case "player":
              sprite.fillStyle = "red";
              sprite.accelerationX = 0;
              sprite.accelerationY = 0;
              sprite.frictionX = 1;
              sprite.frictionY = 1;
              sprite.gravity = 0.3;
              sprite.jumpForce = -6.8;
              sprite.vx = 0;
              sprite.vy = 0;
              sprite.isOnGround = true;
              world.player = sprite;
              world.addChild(sprite);
            break;
            case "treasure":
              sprite.fillStyle = "gold";
              world.addChild(sprite);
              _.conj(world.treasures,sprite);
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
        this.output.content = "score: " + G.score;
      }
    });

    Z.defScene("level1", {
      setup: function() {
        let world = makeWorld(G.level);
        let player = world.player;
        this.world=world;
        this.insert(world);

        let leftArrow = I.keyboard(37),
          rightArrow = I.keyboard(39),
          spaceBar = I.keyboard(32);

        leftArrow.press = () => {
          if(rightArrow.isUp)
            player.accelerationX = -0.2;
        };

        leftArrow.release = () => {
          if(rightArrow.isUp)
            player.accelerationX = 0;
        };

        rightArrow.press = () => {
          if(leftArrow.isUp)
            player.accelerationX = 0.2;
        };
        rightArrow.release = () => {
          if(leftArrow.isUp)
            player.accelerationX = 0;
        };
        spaceBar.press = () => {
          if(player.isOnGround) {
            player.vy += player.jumpForce;
            player.isOnGround = false;
            player.frictionX = 1;
          }
        };
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate: function(dt) {
        let player=this.world.player;
        //Regulate the amount of friction acting on the player.
        //The is the most important variable to set if you want to
        //fine-tune the feel of the player control
        if(player.isOnGround) {
          //Add some friction if the player is on the ground
          player.frictionX = 0.92;
        } else {
          //Add less friction if it's in the air
          player.frictionX = 0.97;
        }
        //Apply the acceleration
        player.vx += player.accelerationX;
        player.vy += player.accelerationY;
        //Apply friction
        player.vx *= player.frictionX;
        //Apply gravity
        player.vy += player.gravity;
        //Move the player
        S.move(player);
        //Use the `hit` method to check for a collision between the
        //player and the platforms
        let playerVsPlatforms = _2d.hit(
          player, this.world.platforms, true, false, false,
          function(collision, platform) {
            if(collision) {
              if(collision === "bottom" && player.vy >= 0) {
                player.isOnGround = true;
                //Neutralize gravity by applying its
                //exact opposite force to the character's vy
                //player.vy = -player.gravity;
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
        this.world.treasures = this.world.treasures.filter(function(star) {
          if (_2d.hit(player, star)){
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

  MojoH5.Config={
    assetFiles: ["platforms.png", "puzzler.otf" ],
    scaleToWindow: true,
    start: setup,
    arena: { width: 512, height: 512 }
  };

})(this);
