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
    let _S=Mojo.Sprites;
    Mojo.Scenes.defScene("level1",{
      setup(){
        let box = this.box= _S.tilingSprite("tile.png");
        this.insert(_S.sizeXY(box,Mojo.width,Mojo.height));
        _S.pinCenter(this,box);
      },
      postUpdate(dt){
        //this.box.tilePosition.x += 0.5;
        this.box.tilePosition.y -= 0.5;
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:256, height:256},
      assetFiles: ["tile.png"],
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    });
  });

})(this);

