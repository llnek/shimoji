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
    const G=Mojo.Game;

    function Player(scene,s,ts,ps,os){
      return G.player=s;
    }

    function _objF(){ return {Player} }

    _Z.defScene("level1",{
      setup(){
        let self=this,
            tw=this.tiled.tileW,
            th=this.tiled.tileH;

        let offX=this.parent.x;
        let offY=this.parent.y;

        G.pathSprites = [];

        function _mouseup(){
          let path = _T.shortestPath(
            Mojo.getIndex(G.player.x, G.player.y, tw,th,self.tiled.tilesInX),
            Mojo.getIndex(Mojo.mouse.x-offX, Mojo.mouse.y-offY, tw,th,self.tiled.tilesInX),
            self.getTileLayer("Tiles").data,
            self,
            [2, 3, 5], //Obstacle gid array
            "euclidean",
            //"diagonal",
            //"manhattan", //Heuristic to use
            true //Either use all diagonal nodes (true) or orthagonally adjacent nodes (false)
          );
          _S.remove(G.pathSprites);
          G.pathSprites.length=0;
          //show path
          path.forEach(node => {
            let x = node.col * tw,
                y = node.row * th,
                s= _S.rectangle(tw,th,"yellow");
            s.x = x;
            s.y = y;
            self.addit(s);
            G.pathSprites.push(s);
          });
        };
        EventBus.sub(["mouseup"],_mouseup);
      }
    },{centerStage:true,tiled:{name:"astar.json",factory:_objF}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "timeBombPanic.png", "astar.json" ],
      arena: {width:832, height:768},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



