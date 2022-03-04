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
           FX:_F,
           v2:_V,
           Game:G,
           ute:_,is}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let K=Mojo.getScaleFactor();
        let square = _S.rect(100*K, 100*K, "blue", "white", 1*K);
        this.insert(square);
        square.anchor.set(1,1);
        _S.pinBottom(this,square,-110*K);

        let square2 = _S.rect(60*K, 40*K, "red", "white", 1*K);
        _S.centerAnchor(square2);
        this.insert(square2);
        _S.pinTop(square,square2,40*K);
        //_F.shake(square2,10,true);
        //_F.shake(square2);

        let square3 = _S.rect(20*K, 40*K, "green", "white", 1*K);
        this.insert(square3);
        _S.centerAnchor(square3);
        _S.pinTop(square2,square3,30*K);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "cat.png", "star.png" ],
      arena: {width:512, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



