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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_G=Mojo.Game,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const {ute:_,is,EventBus}=Mojo;
    const G=Mojo.Game;

    function _isCenteredOverCell(s,world){
      return Math.floor(s.x) % world.tiled.tileW === 0 &&
             Math.floor(s.y) % world.tiled.tileH === 0
    }

    function Player(scene,s,ts,ps,os){
      return G.player=s;
    }
    function _objF(){ return {Player} }

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
        EventBus.sub(["mouseup"],G.onMouseUp);
        EventBus.sub(["post.update",this], "postUpdate");
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();
        if(_isCenteredOverCell(G.player,this)){
          if(G.calculateNewPath){
            let c=_S.centerXY(G.player);
            let tw=this.tiled.tileW,
                th=this.tiled.tileH;
            let path = _T.shortestPath(
              Mojo.getIndex(c[0], c[1], tw,th, this.tiled.tilesInX),
              Mojo.getIndex(G.destinationX, G.destinationY, tw,th, this.tiled.tilesInX),
              this.getTileLayer("Tiles").data,
              this,
              [2,3],
              "manhattan",
              false
            );
            //ignore first node, the start point
            path.shift();
            if(path.length>0){
              G.wayPoints2DArray = path.map(n => [n.col * tw, n.row * th]);
            }
            G.calculateNewPath = false;
          }
          if(G.wayPoints2DArray.length > 0){
            if(G.wayPoints2DArray[0][0] < G.player.x){//left
              G.player.m5.vel[0] = -2;
              G.player.m5.vel[1] = 0;
            }else if(G.wayPoints2DArray[0][0] > G.player.x){ //right
              G.player.m5.vel[0] = 2;
              G.player.m5.vel[1] = 0;
            }else if(G.wayPoints2DArray[0][1] < G.player.y){//up
              G.player.m5.vel[0] = 0;
              G.player.m5.vel[1] = -2;
            }else if(G.wayPoints2DArray[0][1] > G.player.y){//down
              G.player.m5.vel[0] = 0;
              G.player.m5.vel[1] = 2;
            }
            G.wayPoints2DArray.shift();
          }else{
            G.player.m5.vel[0] = 0;
            G.player.m5.vel[1] = 0;
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

