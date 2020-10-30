(function(window){
  "use strict";

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _=Mojo.u,is=Mojo.is;

    _Z.defScene("level1",{
      setup:function(){
        let self=this;
        let world = this.world= _T.makeTiledWorld("astar.json");
        this.insert(world);
        //Create the alien sprite
        let alien = world.tiled.getOne("alien");
        //Create the bomb sprite
        //bomb = world.getObject("bomb");
        //Get a reference to the array that stores all the wall data
        let wallMapArray = world.tiled.getOne("wallLayer").tiled.data;
        //An array to store the sprites that will be used to display
        //the shortest path
        let currentPathSprites = [];
        //The mouse pointer's `release` function runs the code that
        //calculates the shortest path and draws that sprites that
        //represent it
        Mojo.pointer.release = () => {
          //calculate the shortest path
          let path = _T.shortestPath(
            Mojo.getIndex(alien.x, alien.y, 64, 64, 13), //The start map index
            Mojo.getIndex(Mojo.pointer.x, Mojo.pointer.y, 64, 64, 13), //The destination index
            wallMapArray, //The map array
            world, //Map width, in tiles
            [2, 3], //Obstacle gid array
            "euclidean",
            //"diagonal",
            //"manhattan", //Heuristic to use
            true //Either use all diagonal nodes (true) or orthagonally adjacent nodes (false)
          );
          //Use Hexi's `remove` method to remove any possible
          //sprites in the `currentPathSprites` array
          _S.remove(currentPathSprites);
          currentPathSprites.length=0;
          //Display the shortest path
          path.forEach(node => {
            //Figure out the x and y location of each square in the path by
            //multiplying the node's `column` and `row` by the height, in
            //pixels, of each square: 64
            let x = node.col * 64;
            let y = node.row * 64;
            //Create the square sprite and set it to the x and y location
            //we calculated above
            let square = _S.rectangle(64, 64, "black");
            square.x = x;
            square.y = y;
            //Push the sprites into the `currentPath` array,
            //so that we can easily remove them the next time
            //the mouse is clicked
            currentPathSprites.push(square);
          });
          currentPathSprites.forEach(s=> this.insert(s));
        };
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: [ "timeBombPanic.png", "astar.json" ],
    arena: {width:832, height:768},
    start: setup,
    scaleToWindow:true
  };
})(this);



