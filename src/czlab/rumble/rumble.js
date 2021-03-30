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
           Tiles:_T,
           Input:_I,
           "2d":_2d,
           Game:_G,
           ute:_,is,EventBus}=Mojo;

    _Z.defScene("level1",{
      _loadTank(color){
        let K=Mojo.getScaleFactor();
        let s= _S.sprite(`tank_${color}.png`);
        let b= _S.sprite(`turret_${color}.png`);
        _S.centerAnchor(s);
        _S.centerAnchor(b);
        s.addChild(b);
        _S.scaleXY(s,K,K);
        return this.insert(s);
      },
      setup(){
        _G.arena=_S.gridBox(0.95,0.95);
        this.insert(_S.drawGridBox(_G.arena));
        this._loadTank("green");
      }
    });

  }

  const _$={
    assetFiles: ["tank_blue.png","tank_green.png","tank_red.png",
                 "turret_blue.png","turret_green.png","turret_red.png"],
    arena: {width:10000,height:7500},
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


