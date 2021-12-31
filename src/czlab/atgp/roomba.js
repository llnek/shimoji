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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const int=Math.floor;
  const sin=Math.sin;
  const cos=Math.cos;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let s= _S.sprite("roomba.png");
            s.m5.circle=true;
            s.m5.speed=1;
            s.g.trail=[];
            s.g.ticks=0;
            _S.centerAnchor(s);
            _S.scaleXY(s, 0.2*K,0.2*K);
            self.insert(_V.set(s,Mojo.width/2,Mojo.height/2));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      postUpdate(dt){
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roomba.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


