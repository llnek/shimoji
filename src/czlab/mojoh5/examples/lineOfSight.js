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

    _Z.defScene("level1",{
      setup(){
        let alien = this.alien= _S.sprite("alien.png");
        this.insert(alien);
        _S.pinCenter(this,alien)
        alien.x -= Mojo.width/4;
        let monster = this.monster= _S.sprite([ "images/monsterNormal.png", "images/monsterAngry.png" ]);
        this.insert(monster);
        //Define the monster's two states: `normal` and `scared`
        //`0` and `1` refer to the monster's two animation frames
        monster.states = { normal: 0, angry: 1 };
        _S.pinCenter(this,monster);
        monster.x += Mojo.width/4;
        //Create the boxes
        let boxes = this.boxes= [];
        let numberOfboxes = 4;
        for (let s,i = 0; i < numberOfboxes; ++i){
          boxes.push(s=_S.sprite("box.png"));
          this.insert(s);
        }
        _S.pinCenter(this,boxes[0]);boxes[0].x -= 32; boxes[0].y -= 64;
        _S.pinCenter(this,boxes[1]);boxes[1].x += 32; boxes[1].y -= 64;
        _S.pinCenter(this,boxes[2], -32);boxes[2].x -=32;
        _S.pinCenter(this,boxes[3], 32); boxes[3].x += 32;
        //Switch on drag-and-drop for all the sprites
        _I.makeDrag(alien);
        _I.makeDrag(monster);
        boxes.forEach(b => {
          _I.makeDrag(b);
        });
        //Create a `line` sprite.
        //`line` arguments:
        //strokeStyle, lineWidth, ax, ay, bx, by
        //`ax` and `ay` define the line's start x/y point,
        //`bx`, `by` define the line's end x/y point.
        let line = this.line= _S.line("red", 4,_S.centerXY(monster),_S.centerXY(alien));
        this.insert(line);
        //Set the line's alpha to 0.3
        line.alpha = 0.3
        let message = this.message= _S.text("Drag and drop the sprites",
          {fontFamily: "Futura", fontSize:16, fill:"black"}, 30,10);
        this.insert(message);
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        let m= _S.centerXY(this.monster);
        let a= _S.centerXY(this.alien);
        //Update the position of the line
        this.line.m5.ptA(m[0], m[1]);
        this.line.m5.ptB(a[0], a[1]);
        //Check whether the monster can see the alien by setting its
        //`lineOfSight` property. `lineOfSight` will be `true` if there
        //are no boxes obscuring the view, and `false` if there are
        let lineOfSight = _S.lineOfSight( this.monster, this.alien, this.boxes, 16);
        //If the monster has line of sight, set its state to "angry" and
        if(lineOfSight){
          this.monster.m5.showFrame(1);
          this.line.alpha = 1;
        }else{
          this.monster.m5.showFrame(0);
          this.line.alpha = 0.3;
        }
      }
    });
  }


  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "box.png","alien.png", "monsterNormal.png", "monsterAngry.png" ],
      arena: {width:704, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);



