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

  function _isCenteredOverCell(sprite,world) {
    return Math.floor(sprite.x) % world.tiled.tileW === 0 &&
           Math.floor(sprite.y) % world.tiled.tileH === 0
  }

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_G=Mojo.Game,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const {ute:_,is,EventBus}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let world =this.world= _T.tiledWorld("walkThePath.json");
        let alien= this.alien= _T.getTileLayer(world,"alienLayer").children[0];
        this.insert(world);

        this.calculateNewPath = false;
        this.wayPoints2DArray = [];
        let onMouseUp=()=>{
          this.destinationX = Mojo.mouse.x;
          this.destinationY = Mojo.mouse.y;
          this.calculateNewPath = true;
        };
        EventBus.sub(["mouseup"],onMouseUp);
        EventBus.sub(["post.update",this], "postUpdate");
      },
      postUpdate(dt){
        if(_isCenteredOverCell(this.alien,this.world)){
          if(this.calculateNewPath) {
            let c=_S.centerXY(this.alien);
            let path = _T.shortestPath(
              Mojo.getIndex(c[0], c[1], 64, 64, 13),
              Mojo.getIndex(this.destinationX, this.destinationY, 64, 64, 13),
              _T.getTileLayer(this.world,"wallLayer").tiled.data,
              this.world,
              [2, 3],
              "manhattan",
              false
            );
            //ignore first node, the start point
            path.shift();
            if(path.length !== 0) {
              this.wayPoints2DArray = path.map(node => {
                return [node.col * 64, node.row * 64]
              });
            }
            this.calculateNewPath = false;
          }
          if(this.wayPoints2DArray.length !== 0) {
            //Left
            if(this.wayPoints2DArray[0][0] < this.alien.x){
              this.alien.m5.vel[0] = -4;
              this.alien.m5.vel[1] = 0;
              //Right
            } else if(this.wayPoints2DArray[0][0] > this.alien.x) {
              this.alien.m5.vel[0] = 4;
              this.alien.m5.vel[1] = 0;
              //Up
            } else if(this.wayPoints2DArray[0][1] < this.alien.y) {
              this.alien.m5.vel[0] = 0;
              this.alien.m5.vel[1] = -4;
              //Down
            } else if(this.wayPoints2DArray[0][1] > this.alien.y) {
              this.alien.m5.vel[0] = 0;
              this.alien.m5.vel[1] = 4;
            }
            this.wayPoints2DArray.shift();
          } else {
            this.alien.m5.vel[0] = 0;
            this.alien.m5.vel[1] = 0;
          }
        }

        this.alien.x += this.alien.m5.vel[0];
        this.alien.y += this.alien.m5.vel[1];
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["timeBombPanic.png","walkThePath.json"],
      arena: {width: 832, height:768},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);

