(function(global){
  "use strict";
  const window=global;

  function setup(Mojo) {
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,G=Mojo.Game,T=Mojo.Tiles,_2d=Mojo["2d"];
    const _=Mojo.u,is=Mojo.is;

    Z.defScene("level1", {
      setup:function(){
        this.world = T.makeTiledWorld("monsterMaze.json");
        this.insert(this.world);
        this.alien = this.world.tiled.getObject("alien");
        /*
        Each Tiled Editor layer has a `name` that can be accessed in your
        game code using
        `world.getObject` Tiled Editor's `tilelayers` have a `data` property
        that is an array containing all the grid index numbers (`gid`) of
        the tiles in that array. In this example we want to access all the
        wall sprites. In Tiled Editor, all the wall sprites were added to
        a tile layer called `wallLayer`. We can access the `wallLayer`'s
        `data` array of sprites like this:
        */
        this.wallMapArray = this.world.tiled.getObject("wallLayer").tiled.data;
        /*
        We also need a reference to the bomb layer. All Tiled Editor layers are
        created as `groups` by Hexi's `makeTiledWorld` method. That means they
        all have a `children` array that lets' you access all the sprites on
        that layer, if you even need to do that.
        */
        this.monsterLayer = this.world.tiled.getObject("monsterLayer");
        this.monsterMapArray = this.monsterLayer.tiled.data;
        /*
        You can use `world.getObjects` (with an "s") to get an array of all
        the things in the world that have the same `name` properties. There
        are 5 bombs in the world, all which have share the same `name`
        property: "bomb". Here's how you can access to all of them in an
        array:
        */
        //this.monsterSprites = this.world.getObjects("monster");

        this.alien.direction = "";
        this.leftArrow = I.keyboard(37);
        this.upArrow = I.keyboard(38);
        this.rightArrow = I.keyboard(39);
        this.downArrow = I.keyboard(40);
        this.leftArrow.press = () => this.alien.direction = "left";
        this.upArrow.press = () => this.alien.direction = "up";
        this.rightArrow.press = () => this.alien.direction = "right";
        this.downArrow.press = () => this.alien.direction = "down";
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt){
        let self=this;
        function _isAtIntersection(s){
          return Math.floor(s.x) % self.world.tiled.tileW === 0 &&
                 Math.floor(s.y) % self.world.tiled.tileH === 0;
        }
        if(_isAtIntersection(this.alien)){
          switch(this.alien.direction){
          case "up":
            this.alien.mojoh5.vel[1] = -4;
            this.alien.mojoh5.vel[0] = 0;
          break;
          case "down":
            this.alien.mojoh5.vel[1] = 4;
            this.alien.mojoh5.vel[0] = 0;
          break;
          case "left":
            this.alien.mojoh5.vel[0] = -4;
            this.alien.mojoh5.vel[1] = 0;
          break;
          case "right":
            this.alien.mojoh5.vel[0] = 4;
            this.alien.mojoh5.vel[1] = 0;
          break;
          case "none":
            this.alien.mojoh5.vel[0] = 0;
            this.alien.mojoh5.vel[1] = 0;
          break;
          }
        }
        S.move(this.alien);
        //Keep the alien contained inside the canvas
        //g.contain(alien, g.stage);
        /*
        Prevent the alien from walking through walls using the
        versatile `hitTestTile` method. `hitTestTile` checks for a
        collision between a sprite and a tile in any map array that you
        specify. It returns a `collision` object.
        `collision.hit` is a Boolean that tells you if a sprite is colliding
        with the tile that you're checking. `collision.index` tells you the
        map array's index number of the colliding sprite. You can check for
        a collision with the tile against "every" corner point on the
        sprite, "some" corner points, or the sprite's "center" point. (Each
        of these three options has a different and useful effect, so experiment with
        them.)

        `hitTestTile` arguments:
        sprite, array, collisionTileGridIdNumber, worldObject, spritesPointsToCheck

        The `world` object (the 4th argument) has to have these properties:
        `tileheight`, `tilewidth`, `widthInTiles`.

        `hitTestTile` will work for any map array, not just those made with
        Tiled Editor. So you can use it with your own game maps in the same way.

        */
        let alienVsFloor = T.hitTestTile(this.alien, this.wallMapArray, 0, this.world, Mojo.EVERY);
        //If every corner point on the alien isn't touching a floor tile (array gridIDNumber: 0) then
        //prevent the alien from moving
        //
        if(!alienVsFloor.hit){
          //To prevent the alien from moving, subtract its velocity from its position
          this.alien.x -= this.alien.mojoh5.vel[0];
          this.alien.y -= this.alien.mojoh5.vel[1];
          this.alien.mojoh5.vel[0] = 0;
          this.alien.mojoh5.vel[1] = 0;
        }
        /*
        //Check for a collision between the alien and the bombs
        let alienVsBomb = g.hitTestTile(alien, bombMapArray, 5, world, "every");

        //Find out if the alien's position in the bomb array matches a bomb gid number
        if (alienVsBomb.hit) {

          //If it does, filter through the bomb sprites and find the one
          //that matches the alien's position
          bombSprites = bombSprites.filter(function(bomb) {

            //Does the bomb sprite have the same index number as the alien?
            if (bomb.index === alienVsBomb.index) {

              //If it does, remove the bomb from the
              //`bombMapArray` by setting its gid to `0`
              bombMapArray[bomb.index] = 0;

              //Remove the bomb sprite from its container group
              g.remove(bomb);

              //Alternatively, remove the bomb with `removeChild` on
              //the `bombLayer` group
              //bombLayer.removeChild(bomb);
              //Filter the bomb out of the `bombSprites` array
              return false;
            } else {

              //Keep the bomb in the `bombSprites` array if it doesn't match
              return true;
            }
          });
        }
  */
      }
    });

    Z.runScene("level1");
  }

  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
    arean: { width: 704, height: 512 },
    scaleToWindow: true,
    start: setup
  };

})(this);


