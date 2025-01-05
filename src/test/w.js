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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Ute2D:_U,
           FX:_F,
           Input:_I,
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    const E_GEO=1;

    const UI_FONT="Doki Lowercase";

    _Z.scene("level1",{
      setup(){
      },
      postUpdate(dt){

      }
    });

    Mojo.Scenes.run("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["click.mp3"],
      arena: {width:1344, height:840},
      scaleToWindow:"max",
      scaleFit:"x",
      start(Mojo){ scenes(Mojo) }

    })
  });

})(this);


