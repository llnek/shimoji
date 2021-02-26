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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];

    _Z.defScene("level1",{
      setup(){
        let square = _S.rectangle(100, 100, "blue", "white", 1);
        square.anchor.set(1,1);
        this.insert(square);
        _S.pinBottom(this,square,-110);

        let square2 = _S.rectangle(60, 40, "red", "white", 1);
        this.insert(square2);
        _S.pinTop(square,square2,40);

        let square3 = _S.rectangle(20, 40, "green", "white", 1);
        square3.anchor.set(0.5, 0.5);
        this.insert(square3);
        _S.pinTop(square2,square3,30);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "cat.png", "star.png" ],
      arena: {width:512, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



