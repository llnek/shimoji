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
           "2d":_2d,
           ute:_,is}=Mojo;


    _Z.defScene("level1",{
      setup(){
        let K=Mojo.getScaleFactor();
        let red = G.red= _S.rect(32*K, 32*K, "red");
        let blue = G.blue= _S.rect(64*K, 64*K, "blue");

        blue.angle=60;
        _S.centerAnchor(blue);
        _S.pinCenter(this,blue);
        _I.makeDrag(blue);
        this.insert(blue,true);

        //red.rotation=15;
        _S.centerAnchor(red);
        _S.pinTop(this,red,-60*K);
        _I.makeDrag(red);
        this.insert(red,true);

        G.message = _S.text("Drag the boxes...",
                            {fontFamily:"sans-serif",
                             fontSize:16*K,fill:"white"},10,10);
        this.insert(G.message);
      },
      postUpdate(){
        let s,col= _S.collide(G.blue, G.red, true);
        if(col){
          s=`Collided on: ${_S.dbgShowCol(col)}`;
        }else{
          s= `Drag the squares...`;
        }
        G.message.text=s;
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:256, height:256},
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



