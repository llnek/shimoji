(function(global){
  "use strict";
  const window=global;

  function setup(Mojo) {
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,G=Mojo.Game,_2d=Mojo["2d"],T=Mojo.Tiles;
    const _=Mojo.u,is=Mojo.is;
    Z.defScene("hud",{
      setup:function(){
        this.message = S.text("No items found", {fontSize:12, fontFamily:"puzzler", fill:"black"},10,10);
        this.insert(this.message);
        this.message.visible = false;
        Mojo.EventBus.sub(["sync.ui",this],"syncUI");
      },
      syncUI:function(msg){
        this.message.mojoh5.content(msg);
        this.message.visible=true;
      },
      hideMessage:function(){
        this.message.visible=false;
      }
    });
    Z.defScene("level1",{
      setup:function(){
        this.world = T.makeTiledWorld("fantasy.json");
        this.insert(this.world);
        this.elf = S.sprite(S.animation("walkcycle.png", 64, 64));
        let elfObj = this.world.tiled.getObject("elf");
        this.elf.x = elfObj.x;
        this.elf.y = elfObj.y;
        //Add the elf sprite the map's "objects" layer group
        let objectsLayer = this.world.tiled.getObject("objects");
        objectsLayer.addChild(this.elf);

        //If you want to, add the sprite to a different world layer,
        //you can do it like this:
        //world.getObject("treeTops").addChild(elf);

        //Use `world.getObjects` to get an array of objects on the map
        //console.log(world.getObjects("marmot", "skull", "heart"));

        //Get all the items on the items layer (the skull, marmot and heart).
        //The `itemLayer` group's `children` array contains all of them.
        this.itemsLayer = this.world.tiled.getObject("items");

        //Clone the `itemLayer.children` array so that you have your own
        //array of all three item sprites (the heart, skull and marmot)
        this.items = this.itemsLayer.children.slice(0);

        /*
        If you ever need to extract sprites with specific gid numbers in a
        layer that contains different kinds of things, you can do it like this:

        items = itemsLayer.children.map(function(sprite) {
          if (sprite.gid !== 0) return sprite;
        });

        */
        //Get a reference to the array containing the map items
        this.itemsMapArray = this.world.tiled.getObject("items").tiled.data;

        /*
        Create the camera and center it over the elf.
        The `worldCamera` method returns a `camera` object
        with `x` and `y` properties. It has
        two useful methods: `centerOver`, to center the camera over
        a sprite, and `follow` to make it follow a sprite.
        `worldCamera` arguments: worldObject, worldWidth, worldHeight, theCanvas
        The `world.woldWidth` and `world.worldHeight` values are the dimensions
        of the Tiled map data's width and height.
        */

        this.camera = _2d.worldCamera(this.world, this.world.tiled.tiledWidth, this.world.tiled.tiledHeight, Mojo.canvas);
        this.camera.centerOver(this.elf);

        //Define a `collisionArea` on the elf that will be sensitive to
        //collisions. `hitTestTile` will use this information later to check
        //whether the elf is colliding with any of the tiles

        //this.elf.collisionArea = {x: 22, y: 44, width: 20, height: 20};
        this.elf.collisionArea = {x1: 22, y1: 44, x2:42, y2: 64};

        /*
        Define the elf's animation states. These are names that correspond
        to frames and frame sequences in the elf's animation frames. It's
        entirely up to you to decide what you want to call these states.
        Define animation sequences as a 2-value array:

            wallkleft: [startFrame, endFrame]

        The first value is the frame number that the sequence should start
        at, and the second value is the frame number that the sequence
        should end at.
        */

        this.elf.states = {
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [1, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35]
        };

        //Use the `show` method to display the elf's `right` state
        this.elf.mojoh5.showFrame(this.elf.states.right);
        this.elf.fps = 18;

        //Create some keyboard objects
        this.leftArrow = I.keyboard(37);
        this.upArrow = I.keyboard(38);
        this.rightArrow = I.keyboard(39);
        this.downArrow = I.keyboard(40);

        //Assign key `press` and release methods that
        //show and play the elf's different states
        this.leftArrow.press = () => {
          this.elf.mojoh5.playFrames(this.elf.states.walkLeft);
          this.elf.mojoh5.vel[0] = -2;
          this.elf.mojoh5.vel[1] = 0;
        };
        this.leftArrow.release = () => {
          if (!this.rightArrow.isDown && this.elf.mojoh5.vel[1] === 0) {
            this.elf.mojoh5.vel[0] = 0;
            this.elf.mojoh5.showFrame(this.elf.states.left);
          }
        };
        this.upArrow.press = () => {
          this.elf.mojoh5.playFrames(this.elf.states.walkUp);
          this.elf.mojoh5.vel[1] = -2;
          this.elf.mojoh5.vel[0] = 0;
        };
        this.upArrow.release = () => {
          if (!this.downArrow.isDown && this.elf.mojoh5.vel[0] === 0) {
            this.elf.mojoh5.vel[1] = 0;
            this.elf.mojoh5.showFrame(this.elf.states.up);
          }
        };
        this.rightArrow.press = () => {
          this.elf.mojoh5.playFrames(this.elf.states.walkRight);
          this.elf.mojoh5.vel[0] = 2;
          this.elf.mojoh5.vel[1] = 0;
        };
        this.rightArrow.release = () => {
          if (!this.leftArrow.isDown && this.elf.mojoh5.vel[1] === 0) {
            this.elf.mojoh5.vel[0] = 0;
            this.elf.mojoh5.showFrame(this.elf.states.right);
          }
        };
        this.downArrow.press = () => {
          this.elf.mojoh5.playFrames(this.elf.states.walkDown);
          this.elf.mojoh5.vel[1] = 2;
          this.elf.mojoh5.vel[0] = 0;
        };
        this.downArrow.release = () => {
          if (!this.upArrow.isDown && this.elf.mojoh5.vel[0] === 0) {
            this.elf.mojoh5.vel[1] = 0;
            this.elf.mojoh5.showFrame(this.elf.states.down);
          }
        };

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt){
        //Move the elf and constrain it to the world boundaries
        //(-10 and -18 are to compensate for image padding around the sprite)
        this.elf.x = Math.max(-18, Math.min(this.elf.x + this.elf.mojoh5.vel[0], this.world.tiled.tiledWidth - this.elf.width + 18));
        this.elf.y = Math.max(-10, Math.min(this.elf.y + this.elf.mojoh5.vel[1], this.world.tiled.tiledHeight - this.elf.height));
        this.camera.follow(this.elf);
        //Get a reference to the obstacles map array and use `hitTestTile`
        //check for a collision between the elf and the ground tiles
        //(See the example `tiledEditorSupport.html` for details on how to
        //`hitTestTile` - it's not difficult)
        let obstaclesMapArray = this.world.tiled.getObject("obstacles").tiled.data;
        let elfVsGround = T.hitTestTile(this.elf, obstaclesMapArray, 0, this.world, Mojo.EVERY);
        //If the elf isn't touching any ground tiles, it means its touching
        //an obstacle, like a bush, the bottom of a wall, or the bottom of a
        //tree
        if(!elfVsGround.hit){
          //To prevent the elf from moving, subtract its velocity from its position
          this.elf.x -= this.elf.mojoh5.vel[0];
          this.elf.y -= this.elf.mojoh5.vel[1];
          this.elf.mojoh5.vel[0] = 0;
          this.elf.mojoh5.vel[1] = 0;
          //You can find the gid number of the thing the elf hit like this:
          //console.log(obstaclesMapArray[elfVsGround.index]);
        }
        //Check for a collision with the items
        let elfVsItems = T.hitTestTile(this.elf, this.itemsMapArray, 0, this.world, Mojo.SOME);
        //You'll know whether the elf is touching an item if `elfVsItem.hit`
        //isn't `0`. `0` indicates a empty cell in the array, so any tile
        //doesn't have a grid index number (`gid`) of `0` must be one of the
        //items (The heart, marmot or skull).
        //If the elf is touching an item tile, filter through all the items
        //in the `items` array and remove the item being touched.
        if (!elfVsItems.hit){
          this.items = this.items.filter(item => {
            //Does the current item match the elf's position?
            if(item.tiled.____index === elfVsItems.index){
              let hud=Z.findScene("hud");
              Mojo.EventBus.pub(["sync.ui", hud], `You found a ${item.tiled.name}`);
              hud.future(function(){ hud.hideMessage(); }, 180);
              //Remove the item
              this.itemsMapArray[item.tiled.____index] = 0;
              S.remove(item);
              return false;
            } else {
              return true;
            }
          });
        }
      }
    });

    Z.runScene("level1");
    Z.runScene("hud");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "fantasy.png", "walkcycle.png", "puzzler.otf", "fantasy.json"],//, "level1.tmx" ],
      arena: {width:512, height:512},
      scaleToWindow:true,
      start: setup
    });

  });

})(this);

