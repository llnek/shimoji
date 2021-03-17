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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_2d=Mojo["2d"],_I=Mojo.Input;
    const {ute:_,is,EventBus}=Mojo;
    const G=Mojo.Game;

    _Z.defScene("level1",{
      setup(){
        let player = G.player= _S.sprite("alien.png");
        let K=Mojo.getScaleFactor();

        this.addit(player);
        _S.pinCenter(this,player)
        player.x -= Mojo.width/4;

        let monster = G.monster= _S.sprite(["monsterNormal.png",
                                            "monsterAngry.png" ]);
        this.addit(monster);
        _S.pinCenter(this,monster);
        monster.x += Mojo.width/4;

        //Create the boxes
        let boxes = G.boxes= _.fill(4);
        let bw,bh,bw2,bh2;
        for(let s,i=0; i < boxes.length; ++i){
          boxes[i]=(s=_S.sprite("box.png"));
          s.scale.x=K;
          s.scale.y=K;
          this.addit(s);
          _I.makeDrag(s);
          _S.pinCenter(this,s);
        }
        bh=boxes[0].height;
        bw=boxes[0].width;
        bw2=Math.floor(bw/2);
        bh2=Math.floor(bh/2);
        boxes[0].x -= bw2; boxes[0].y -= bh2;
        boxes[1].x += bw2; boxes[1].y -= bh2;
        boxes[2].x -= bw2; boxes[2].y += bh2;
        boxes[3].x += bw2; boxes[3].y += bh2;

        _I.makeDrag(monster);
        _I.makeDrag(player);

        let line = G.line= _S.line("red", 4,_S.centerXY(monster),_S.centerXY(player));
        this.addit(line);
        line.alpha = 0.3;
        let message = G.message= _S.text("Drag and drop the sprites",
          {fontFamily: "Futura", fontSize:16*K, fill:"white"}, 30*K,10*K);
        this.addit(message);
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        let m= _S.centerXY(G.monster),
            a= _S.centerXY(G.player);

        G.line.m5.ptA(m[0], m[1]);
        G.line.m5.ptB(a[0], a[1]);

        let hit = _S.lineOfSight(G.monster,G.player,G.boxes,16);
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
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);



