/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const {ute:_,is,EventBus}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let self=this;
        let world = this.world= _T.tiledWorld("astar.json");
        this.insert(world);
        let alien=_T.getTileLayer(world,"alienLayer").children[0];
        let wall= _T.getTileLayer(world,"wallLayer");
        let currentPathSprites = [];
        let mouseup= () => {
          let path = _T.shortestPath(
            Mojo.getIndex(alien.x, alien.y, 64, 64, 13), //The start map index
            Mojo.getIndex(Mojo.mouse.x, Mojo.mouse.y, 64, 64, 13), //The destination index
            wall.tiled.data,
            world,
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
            let square = _S.rectangle(64, 64, "yellow");
            square.x = x;
            square.y = y;
            //Push the sprites into the `currentPath` array,
            //so that we can easily remove them the next time
            //the mouse is clicked
            currentPathSprites.push(square);
          });
          currentPathSprites.forEach(s=> this.insert(s));
        };

        EventBus.sub(["mouseup"],mouseup);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "timeBombPanic.png", "astar.json" ],
      arena: {width:832, height:768},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



