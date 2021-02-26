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
    let _Z=Mojo.Scenes,_S=Mojo.Sprites, _I=Mojo.Input;

    _Z.defScene("level1", function(){
      let hedgehog = _S.sprite("hedgehog.png");
      let tiger = _S.sprite("tiger.png");
      let cat = _S.sprite("cat.png");
      _I.makeDrag(hedgehog);
      _I.makeDrag(cat);
      _I.makeDrag(tiger);
      _S.setXY(tiger,64, 64);
      _S.setXY(hedgehog,128, 128);
      this.insert(cat);
      this.insert(tiger);
      this.insert(hedgehog);
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:640, height:640},
      assetFiles: ["images/animals.json"],
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

