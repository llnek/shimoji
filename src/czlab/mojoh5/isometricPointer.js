(function(window,undefined){
  "use strict";
  const MojH5=window.MojoH5;
  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    _Z.defScene("level1",{
      setup:function(){
        let world = this.world= _T.isoWorld(32,32,8,8);
        this.insert(world);
        //Create the world layers
        world.tiled.layers = [
          //The environment layer. `2` represents the walls,
          //`1` represents the floors
          [
            2, 2, 2, 2, 2, 2, 2, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 1, 2, 1, 1, 2, 1, 2,
            2, 1, 1, 1, 1, 2, 2, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 2, 2, 1, 2, 1, 1, 2,
            2, 1, 1, 1, 1, 1, 1, 2,
            2, 2, 2, 2, 2, 2, 2, 2
          ],

          //The character layer. `3` represents the game character
          //`0` represents an empty cell which won't contain any
          //sprites
          [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 3, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0
          ]
        ];
        //Build the game world by looping through each of the arrays
        world.tiled.layers.forEach(layer => {
          //Loop through each array element
          layer.forEach((gid, index) => {
            //If the cell isn't empty (0) then create a sprite
            if (gid !== 0) {
              //Find the column and row that the sprite is on and also
              //its x and y pixel values.
              let column, row, x, y;
              column = index % world.tiled.tilesInX;
              row = Math.floor(index / world.tiled.tilesInX);
              x = column * world.tiled.cartTileW;
              y = row * world.tiled.cartTileH;
              //Next, create a different sprite based on what its
              //`gid` number is
              let sprite;
              switch (gid) {
                //The floor
                case 1:
                  //Create a sprite using an isometric rectangle
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0xCCCCFF);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xCCCCFF);
                  break;

                  //The walls
                case 2:
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0x99CC00);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0x99CC00);
                  break;

                  //The character
                case 3:
                  sprite = _T.isoRectangle(world.tiled.cartTileW, world.tiled.cartTileH, 0xFF0000);
                  //Cartesian rectangle:
                  //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xFF0000);
              }

              //Add these properties to the sprite
              _T.addIsoProperties(sprite, world.tiled.cartTileW, world.tiled.cartTileH,x,y);

              let iso=sprite.tiled.isoXY();
              //Set the sprite's `x` and `y` pixel position based on its
              //isometric coordinates
              sprite.x = iso.x;
              sprite.y = iso.y;
              //Cartesian positioning
              //sprite.x = sprite.cartX;
              //sprite.y = sprite.cartY;
              //Add the sprite to the `world` container
              world.addChild(sprite);
            }
          });
        });

        //Position the world inside the canvas
        let canvasOffset = (Mojo.canvas.width / 2) - world.tiled.cartTileW;
        world.x += canvasOffset;
        world.y = 150;

        //Make a text object
        let message = this.message= _S.text("",
          {fontSize: 16, fontFamily:"Futura", fill:"black"},5,0);
        this.insert(message);

        //Add isometric properties to the pointer
        _T.makeIsoPointer(Mojo.pointer, world);

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        let world=this.world;
        let ptr=Mojo.pointer;
        let c=ptr.tiled.cartXY();
        let index=ptr.tiled.____index();
        this.message.mojoh5.content(`
          cartX: ${Math.floor(c.x)}
          cartY: ${Math.floor(c.y)}
          column: ${ptr.tiled.col()}
          row: ${ptr.tiled.row()}
          index: ${index}
          layer 1 gid: ${world.tiled.layers[0][Math.floor(index)]}
          layer 2 gid: ${world.tiled.layers[1][Math.floor(index)]}
        `);
      }
    })
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    arena: {width:512, height:512},
    scaleToWindow:true,
    start: setup
  };
})(this);


