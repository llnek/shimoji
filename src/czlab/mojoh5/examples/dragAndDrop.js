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
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    _Z.defScene("level1", function(){
      let A=_S.rect(Mojo.width/2,Mojo.height/2,0xaa4455);
      let C=_S.rect(Mojo.width/2,Mojo.height/2);
      let hedgehog = _S.sprite("hedgehog.png");
      let tiger = _S.sprite("tiger.png");
      let cat = _S.sprite("cat.png");
      let K=Mojo.getScaleFactor();
      _I.makeDrag(hedgehog);
      _I.makeDrag(cat);
      _I.makeDrag(tiger);
      _V.set(tiger,64*K, 64*K);
      _V.set(hedgehog,128*K, 128*K);
      if(false){
        this.insert(cat);
        this.insert(tiger);
        this.insert(hedgehog);
      }else{
        C.addChild(cat);
        C.addChild(tiger);
        C.addChild(hedgehog);
        C.x=14;
        C.y= 32;
        A.addChild(C);
        A.x= 30;
        A.y= 23;
        this.insert(A);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["images/animals.json"],
      arena: {width:640, height:640},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

