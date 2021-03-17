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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_W=Mojo.FX,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const {ute:_,is,EventBus}=Mojo;
    const G=Mojo.Game;

    _Z.defScene("level1",function(){
      let cat = G.cat= _S.sprite("cat.png",32,32);
      let K=Mojo.getScaleFactor();

      function _scale(arr){
        return arr.map(p=>{
          p[0]*=K;p[1]*=K;return p;
        })
      }

      cat.scale.x=K;
      cat.scale.y=K;
      this.addit(cat);

      let catPath = _W.walkPath(cat,                   //The sprite
                                _W.SMOOTH,
                                _scale([
                                  [32, 32],
                                  [32, 128],
                                  [300, 128],
                                  [300, 32],
                                  [32, 32]
                                ]),
                                300,
                                true
                              );
      let hedgehog = _S.sprite("hedgehog.png",32,256);
      hedgehog.scale.x=K;
      hedgehog.scale.y=K;
      this.addit(hedgehog);
      let hedgehogPath = _W.walkCurve(hedgehog,
                                      _W.SMOOTH,
                                      [
                                        _scale([[hedgehog.x, hedgehog.y],[75, 500],[200, 500],[300, 300]]),
                                        _scale([[300, 300],[250, 100],[100, 100],[hedgehog.x, hedgehog.y]])
                                      ],
                                      300,
                                      true
                                    );
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


