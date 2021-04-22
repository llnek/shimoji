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
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:G,
           "2d":_2d,
           v2:_V,
           Tiles:_T,
           ute:_,is}=Mojo;

    //assumes anchor 0
    function _isAligned(s,world){
      return MFL(s.x) % world.tiled.tileW === 0 &&
             MFL(s.y) % world.tiled.tileH === 0
    }

    const _objF={
      Player:{
        c(scene,s,ts,ps,os){ return G.player=s},
        s(){}
      }
    };

    _Z.defScene("level1",{
      setup(){
        let offX=this.parent.x;
        let offY=this.parent.y;

        G.calculateNewPath = false;
        G.wayPoints2DArray = [];
        G.onMouseUp=()=>{
          G.destinationX = Mojo.mouse.x-offX;
          G.destinationY = Mojo.mouse.y-offY;
          G.calculateNewPath = true;
        };
        Mojo.on(["mouseup"],G.onMouseUp);
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();
        if(_isAligned(G.player,this)){
          if(G.calculateNewPath){
            let c=_S.centerXY(G.player);
            let tw=this.tiled.tileW,
                th=this.tiled.tileH;
            let path = _T.shortestPath(
              Mojo.getIndex(c[0], c[1],
                            tw,th, this.tiled.tilesInX),
              Mojo.getIndex(G.destinationX,
                            G.destinationY,
                            tw,th, this.tiled.tilesInX),
              this.getTileLayer("Tiles").data,
              this,
              [2,3,5],
              "manhattan",
              false
            );
            //ignore first node, the start point
            path.shift();
            if(path.length>0)
              G.wayPoints2DArray = path.map(n => [n.col * tw, n.row * th]);
            G.calculateNewPath = false;
          }
          if(G.wayPoints2DArray.length > 0){
            if(G.wayPoints2DArray[0][0] < G.player.x){//left
              _V.set(G.player.m5.vel, -2,0);
            }else if(G.wayPoints2DArray[0][0] > G.player.x){ //right
              _V.set(G.player.m5.vel, 2,0);
            }else if(G.wayPoints2DArray[0][1] < G.player.y){//up
              _V.set(G.player.m5.vel, 0,-2);
            }else if(G.wayPoints2DArray[0][1] > G.player.y){//down
              _V.set(G.player.m5.vel, 0,2);
            }
            G.wayPoints2DArray.shift();
          }else{
            _V.set(G.player.m5.vel,0,0)
          }
        }
        G.player.x += G.player.m5.vel[0];
        G.player.y += G.player.m5.vel[1];
      }
    },{centerStage:true,
       tiled:{name:"walkThePath.json",factory:_objF}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["timeBombPanic.png","walkThePath.json"],
      arena: {width: 832, height:768},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);

