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
           v2:_V,
           Game:G,
           ute:_,is}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let K=Mojo.getScaleFactor();
        let _64=64*K;
        let _10=10*K;
        let box = G.box= _S.rect(_64, _64, "green", "red", 4*K);
        this.insert(box);
        _S.pinCenter(this,box);

        let cat = G.cat= _S.sprite("cat.png");
        this.insert(cat);
        _S.pinLeft(box,cat);

        let tiger = G.tiger= _S.sprite("tiger.png");
        this.insert(tiger);
        _S.pinRight(box,tiger);

        let hedgehog = G.hedgehog=  _S.sprite("hedgehog.png");
        this.insert(hedgehog);
        _S.pinTop(box,hedgehog);

        let rocket = G.rocket= _S.sprite("rocket.png");
        this.insert(rocket);
        _S.pinBottom(box,rocket);

        let star = G.star= _S.sprite("star.png");
        star.alpha=0.5;
        this.insert(star);
        _S.pinCenter(box,star);

        let b1 = _S.rect(_10, _10, "white");
        box.addChild(b1);
        _S.pinRight(box,b1,-b1.width);
        b1 = _S.rect(_10, _10, "white");
        box.addChild(b1);
        _S.pinLeft(box,b1,-b1.width);
        b1 = _S.rect(_10, _10, "white");
        box.addChild(b1);
        _S.pinTop(box,b1,-b1.height);
        b1 = _S.rect(_10, _10, "white");
        box.addChild(b1);
        _S.pinBottom(box,b1,-b1.height);
        b1 = _S.rect(_10, _10, "white");
        box.addChild(b1);
        _S.pinCenter(box,b1);

      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "rocket.png", "images/animals.json", "star.png" ],
      arena: {width:256, height:256},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

