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
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        this.insert(blue);
        blue.anchor.set(0.5, 0.5);
        blue.angle=60;
        _S.pinCenter(this,blue);
        _I.makeDrag(blue);

        let red = this.red= _S.rectangle(32, 32, "red");
        this.insert(red);
        red.anchor.set(0.5, 0.5);
        //red.rotation=15;
        _S.pinTop(this,red,-60);
        _I.makeDrag(red);

        this.message = _S.text("Drag the boxes...",{fontFamily:"sans-serif",fontSize:16,fill:"white"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        let s,col= _2d.collide(this.blue, this.red, true);
        if(col){
          s=`Collided on: ${_2d.dbgShowCol(col)}`;
        }else{
          s= `Drag the squares...`;
        }
        this.message.text=s;
      }

    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:256, height:256},
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



