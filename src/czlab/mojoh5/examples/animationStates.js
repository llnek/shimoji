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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           Game:G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;
    const int=Math.floor;

    _Z.scene("level1",{
      setup(){
        let K=Mojo.getScaleFactor(),
            forest= G.forest= _S.sprite("forest.png"),
            elf= G.elf=_S.animation("walkcycle.png", 64, 64);
        _S.scaleXY(forest,K,K);
        _S.scaleXY(elf,K,K);
        elf.m5.getImageOffsets=()=>{
          let h=elf.height/6;
          let w=elf.width/4;
          return{x1:w,y1:h,x2:w,y2:h/3}
        };
        this.insert(forest);
        this.insert(elf);
        _V.set(elf,32*K, 128*K);
        _V.set(this, _M.ndiv(Mojo.width-forest.width,2),
                     _M.ndiv(Mojo.height-forest.height,2));
        const states={
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [0, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35] };

        elf.m5.showFrame(states.right);

        let goLeft = _I.keybd(_I.LEFT, ()=>{
          elf.m5.playFrames(states.walkLeft);
          _V.set(elf.m5.vel, -K,0);
        }, ()=>{
          if (!goRight.isDown && elf.m5.vel[1] == 0){
            _V.setX(elf.m5.vel,0);
            elf.m5.showFrame(states.left);
          }
        });

        let goUp = _I.keybd(_I.UP, ()=>{
          elf.m5.playFrames(states.walkUp);
          _V.set(elf.m5.vel, 0,-K);
        }, ()=>{
          if(!goDown.isDown && elf.m5.vel[0] == 0){
            _V.setY(elf.m5.vel,0);
            elf.m5.showFrame(states.up);
          }
        });

        let goRight = _I.keybd(_I.RIGHT, ()=>{
          elf.m5.playFrames(states.walkRight);
          _V.set(elf.m5.vel,K,0);
        }, ()=>{
          if(!goLeft.isDown && elf.m5.vel[1] == 0){
            _V.setX(elf.m5.vel,0);
            elf.m5.showFrame(states.right);
          }
        });

        let goDown = _I.keybd(_I.DOWN, ()=>{
          elf.m5.playFrames(states.walkDown);
          _V.set(elf.m5.vel,0,K);
        }, ()=>{
          if(!goUp.isDown && elf.m5.vel[0] == 0){
            _V.setY(elf.m5.vel,0);
            elf.m5.showFrame(states.down);
          }
        });

        G.arena=Mojo.mockStage({x:0,y:0,
                                width:forest.width,
                                height:forest.height});
      },
      postUpdate(dt){
        _V.add$(G.elf, G.elf.m5.vel);
        _S.clamp(G.elf, G.arena,false);
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:[ "forest.png", "walkcycle.png" ],
      arena:{width:256,height:256},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("level1");
      }
    });
  });


})(this);


