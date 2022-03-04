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
           FX:_W,
           "2d":_2d,
           v2:_V,
           Tiles:_T,
           Game:G,
           ute:_,is,EventBus}=Mojo;

    _Z.defScene("level1",function(){
      let cat = G.cat= _S.sprite("cat.png",32,32);
      let K=Mojo.getScaleFactor();
      const _scale=(arr)=> arr.map(p=> _V.mul$(p,K));

      _S.scaleXY(cat,K,K);
      this.insert(cat);
      _W.walkPath(cat, _W.SMOOTH,
                       _scale([ [32, 32], [32, 128], [300, 128], [300, 32], [32, 32] ]), 300);

      let hedgehog = _S.sprite("hedgehog.png",32,256);
      this.insert( _S.scaleXY(hedgehog,K,K));
      _W.walkCurve(hedgehog, _W.SMOOTH,
                             [ _scale([[hedgehog.x, hedgehog.y],[75, 500],[200, 500],[300, 300]]),
                               _scale([[300, 300],[250, 100],[100, 100],[hedgehog.x, hedgehog.y]]) ], 300);
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["cat.png","hedgehog.png"],
      arena: {width:512, height:600},
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


