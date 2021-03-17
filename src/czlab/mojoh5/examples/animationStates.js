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
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input;
    let {ute:_,is,EventBus}=Mojo;
    let G=Mojo.Game;

    _Z.defScene("level1",{
      setup(){
        let elf= G.elf=_S.animation("walkcycle.png", 64, 64);
        let forest=G.forest= _S.sprite("forest.png");
        let K=Mojo.getScaleFactor();

        forest.scale.x=K;
        forest.scale.y=K;
        elf.scale.x=K;
        elf.scale.y=K;

        this.addit(forest);
        this.addit(elf);
        _S.setXY(elf,32*K, 128*K);

        this.x=Math.floor((Mojo.width-forest.width)/2);
        this.y=Math.floor((Mojo.height-forest.height)/2);


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
          elf.m5.vel[0] = -1;
          elf.m5.vel[1] = 0;
        }, ()=>{
          if (!goRight.isDown && elf.m5.vel[1] === 0){
            elf.m5.vel[0] = 0;
            elf.m5.showFrame(elf.states.left);
          }
        });
        let goUp = _I.keybd(_I.keyUP, ()=>{
          elf.m5.playFrames(elf.states.walkUp);
          elf.m5.vel[1] = -1;
          elf.m5.vel[0] = 0;
        }, ()=>{
          if(!goDown.isDown && elf.m5.vel[0] === 0) {
            elf.m5.vel[1] = 0;
            elf.m5.showFrame(elf.states.up);
          }
        });
        let goRight = _I.keybd(_I.keyRIGHT, ()=>{
          elf.m5.playFrames(elf.states.walkRight);
          elf.m5.vel[0] = 1;
          elf.m5.vel[1] = 0;
        }, ()=>{
          if(!goLeft.isDown && elf.m5.vel[1] === 0) {
            elf.m5.vel[0] = 0;
            elf.m5.showFrame(elf.states.right);
          }
        });
        let goDown = _I.keybd(_I.keyDOWN, ()=>{
          elf.m5.playFrames(elf.states.walkDown);
          elf.m5.vel[1] = 1;
          elf.m5.vel[0] = 0;
        }, ()=>{
          if (!goUp.isDown && elf.m5.vel[0] === 0) {
            elf.m5.vel[1] = 0;
            elf.m5.showFrame(elf.states.down);
          }
        });
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        //-18 and +18 are to compensate for image padding around the sprite
        G.elf.x = Math.max(-18, Math.min(G.elf.x + G.elf.m5.vel[0],
                                            Mojo.width - G.elf.width + 18));
        G.elf.y = Math.max(64, Math.min(G.elf.y + G.elf.m5.vel[1],
                                           Mojo.height - G.elf.height));
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


