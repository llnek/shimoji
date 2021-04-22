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
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           v2:_V,
           Tiles:_T,
           Game:G,
           ute:_,is}=Mojo;

    const _objF={
      Player:{
        c(scene,s,ts,ps,os){
          return G.player=s
        },
        s(){}
      }
    };

    _Z.defScene("level1",{
      setup(){
        let self=this,
            offX=this.parent.x,
            offY=this.parent.y,
            tw=this.tiled.tileW,
            th=this.tiled.tileH;

        G.pathSprites = [];

        function _mouseup(){
          let path = _T.shortestPath(
            Mojo.getIndex(G.player.x, G.player.y, tw,th,self.tiled.tilesInX),
            Mojo.getIndex(Mojo.mouse.x-offX, Mojo.mouse.y-offY, tw,th,self.tiled.tilesInX),
            self.getTileLayer("Tiles").data,
            self,
            [2, 3, 5],
            "euclidean",
            //"diagonal",
            //"manhattan",
            true
          );
          _S.remove(G.pathSprites);
          G.pathSprites.length=0;
          //show path
          path.forEach(node=>{
            let x = node.col * tw,
                y = node.row * th,
                s= _S.rectangle(tw,th,"yellow");
            _V.set(s,x,y);
            self.insert(s);
            G.pathSprites.push(s);
          });
        };
        Mojo.on(["mouseup"],_mouseup);
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



