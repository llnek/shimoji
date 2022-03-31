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
           Ute2D:_U,
           Input:_I,
           Game:G,
           math:_M,
           v2:_V,
           ute:_,is,EventBus}=Mojo;

    _Z.scene("level1",{
      setup(){
        let player = G.player= _S.sprite("alien.png");
        let K=Mojo.getScaleFactor();

        this.insert(player);
        _S.pinCenter(this,player);
        player.x -= Mojo.width/4;

        let monster = G.monster= _S.sprite(["monsterNormal.png",
                                            "monsterAngry.png" ]);
        this.insert(monster);
        _S.pinCenter(this,monster);
        monster.x += Mojo.width/4;

        //Create the boxes
        let boxes = G.boxes= _.fill(4);
        let bw,bh,bw2,bh2;
        for(let s,i=0; i < boxes.length; ++i){
          boxes[i]=(s=_S.sprite("box.png"));
          _S.scaleXY(s,K,K);
          _I.makeDrag(s);
          _S.pinCenter(this, this.insert(s));
        }
        bh=boxes[0].height;
        bw=boxes[0].width;
        bw2=_M.ndiv(bw,2);
        bh2=_M.ndiv(bh,2);
        boxes[0].x -= bw2; boxes[0].y -= bh2;
        boxes[1].x += bw2; boxes[1].y -= bh2;
        boxes[2].x -= bw2; boxes[2].y += bh2;
        boxes[3].x += bw2; boxes[3].y += bh2;

        _S.centerAnchor(boxes[0]);
        _S.centerAnchor(boxes[3]);
        boxes[0].m5.circle=true;
        boxes[3].m5.circle=true;

        //_S.centerAnchor(boxes[1]);
        //_S.centerAnchor(boxes[2]);
        //boxes[1].m5.circle=true;
        //boxes[2].m5.circle=true;

        _I.makeDrag(monster);
        _I.makeDrag(player);

        let line = G.line= _S.line("red", 4*K,
                                   _S.centerXY(monster),_S.centerXY(player));
        this.insert(line);
        line.alpha = 0.3;
        let message = G.message= _S.text("Drag and drop the sprites",
          {fontFamily: "Futura", fontSize:16*K, fill:"white"}, 30*K,10*K);
        this.insert(message);
      },
      postUpdate(){
        let m= _S.centerXY(G.monster),
            a= _S.centerXY(G.player);

        G.line.m5.ptA(m[0], m[1]);
        G.line.m5.ptB(a[0], a[1]);

        let hit = _U.lineOfSight(G.monster,G.player,G.boxes);
        if(hit){
          G.monster.m5.showFrame(1);
          G.line.alpha = 1;
        }else{
          G.monster.m5.showFrame(0);
          G.line.alpha = 0.3;
        }
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "box.png","alien.png", "monsterNormal.png", "monsterAngry.png" ],
      arena: {width:704, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("level1");
      }
    })
  });


})(this);



