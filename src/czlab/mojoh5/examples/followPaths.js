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

    _Z.defScene("level1",function(){
      let cat = this.cat= _S.sprite("cat.png",32,32);
      this.insert(cat);
      let catPath = _W.walkPath(cat,                   //The sprite
                                _W.SMOOTH,
                                [
                                  [32, 32],            //First x/y point
                                  [32, 128],           //Next x/y point
                                  [300, 128],          //Next x/y point
                                  [300, 32],           //Next x/y point
                                  [32, 32]             //Last x/y point
                                ],
                                300,
                                true
                              );
      let hedgehog = _S.sprite("hedgehog.png",32,256);
      this.insert(hedgehog);
        //Use `walkCurve` to make the hedgehog follow a curved path
        //between a series of connected waypoints. Here's how to use it:
      let hedgehogPath = _W.walkCurve(hedgehog,              //The sprite
                                      _W.SMOOTH,
                                      //An array of Bezier curve points that
                                      //you want to connect in sequence
                                      [
                                        [[hedgehog.x, hedgehog.y],[75, 500],[200, 500],[300, 300]],
                                        [[300, 300],[250, 100],[100, 100],[hedgehog.x, hedgehog.y]]
                                      ],
                                      300,                   //Total duration, in frames
                                      true
                                    );
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["cat.png","hedgehog.png"],
      arena: {width:512, height:600},
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


