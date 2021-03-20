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
           Game:G,
           ute:_,is,EventBus}=Mojo;


    _Z.defScene("level1",{
      setup(){
        let elf= G.elf=_S.animation("walkcycle.png", 64, 64);
        let forest=G.forest= _S.sprite("forest.png");
        let K=Mojo.getScaleFactor();

        _S.scaleXY(forest,K,K);
        _S.scaleXY(elf,K,K);

        this.insert(forest);
        this.insert(elf);
        _S.setXY(elf,32*K, 128*K);

        _S.setXY(this, Math.floor((Mojo.width-forest.width)/2),
                       Math.floor((Mojo.height-forest.height)/2));

        elf.states = {
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [0, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35]
        };

        elf.m5.showFrame(elf.states.right);

        let goLeft = _I.keybd(_I.keyLEFT, ()=>{
          elf.m5.playFrames(elf.states.walkLeft);
          _S.velXY(elf, -K,0);
        }, ()=>{
          if (!goRight.isDown && elf.m5.vel[1] === 0){
            _S.velXY(elf,0);
            elf.m5.showFrame(elf.states.left);
          }
        });
        let goUp = _I.keybd(_I.keyUP, ()=>{
          elf.m5.playFrames(elf.states.walkUp);
          _S.velXY(elf,0,-K);
        }, ()=>{
          if(!goDown.isDown && elf.m5.vel[0] === 0){
            _S.velXY(elf,null,0);
            elf.m5.showFrame(elf.states.up);
          }
        });
        let goRight = _I.keybd(_I.keyRIGHT, ()=>{
          elf.m5.playFrames(elf.states.walkRight);
          _S.velXY(elf,K,0);
        }, ()=>{
          if(!goLeft.isDown && elf.m5.vel[1] === 0){
            _S.velXY(elf,0);
            elf.m5.showFrame(elf.states.right);
          }
        });
        let goDown = _I.keybd(_I.keyDOWN, ()=>{
          elf.m5.playFrames(elf.states.walkDown);
          _S.velXY(elf,0,K);
        }, ()=>{
          if(!goUp.isDown && elf.m5.vel[0] === 0){
            _S.velXY(elf,null,0);
            elf.m5.showFrame(elf.states.down);
          }
        });


        let out={x:0,y:0,width:forest.width,height:forest.height};
        G.arena=Mojo.mockStage(out);
      },
      postUpdate(dt){
        G.elf.x += G.elf.m5.vel[0];
        G.elf.y += G.elf.m5.vel[1];
        _2d.contain(G.elf,G.arena,false);
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
        Mojo.Scenes.runScene("level1");
      }
    });
  });


})(this);


