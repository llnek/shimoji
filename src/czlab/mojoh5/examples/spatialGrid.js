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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _G=Mojo.Game;
    const {ute:_,is,EventBus}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let qt= window["io/czlab/mcfud/qtree"]();
        _G.qtree=qt.quadtree({left:0,top:0,right:Mojo.width,bottom:Mojo.height});
        let marbles = this.marbles= _S.grid(
          5, 5, 128, 128,
          true, 0, 0,
          ()=>{
            let marble = _S.animation("marbles.png", 32, 32);
            marble.m5.showFrame(_.randInt2(0, 5));
            marble.m5.circular=true;
            let sizes = [8, 12, 16, 20, 24, 28, 32];
            _S.setSize(marble, sizes[_.randInt2(0, 6)]);
            marble.m5.vel[0] = _.randInt2(-400, 400);
            marble.m5.vel[1] = _.randInt2(-400, 400);
            marble.m5.friction[0] = 0.99;
            marble.m5.friction[1] = 0.99;
            marble.m5.mass = 0.75 + marble.width/2/32;
            marble.anchor.set(0.5);
            return marble;
          }
        );
        this.insert(marbles);

        //Create the "sling" which is a line that will connect
        //the pointer to the marbles
        let sling = this.sling= _S.line("Yellow", 4, [0,0],[32,32]);
        this.insert(sling);
        sling.visible = false;

        //A variable to store the captured marble
        this.capturedMarble = null;

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let self=this;
        _G.qtree.reset();
        this.marbles.children.forEach(c=>_G.qtree.insert(c));
        //If a marble has been captured, draw the
        //sling (the yellow line) between the pointer and
        //the center of the captured marble
        if(this.capturedMarble){
          let c=_S.centerXY(this.capturedMarble);
          this.sling.visible = true;
          this.sling.m5.ptA(c[0],c[1]);
          this.sling.m5.ptB(Mojo.mouse.x,Mojo.mouse.y);
        }
        //Shoot the marble if the pointer has been released
        if (Mojo.mouse.isUp){
          this.sling.visible = false;
          if(this.capturedMarble){
            //Find out how long the sling is
            this.sling.m5.length = _S.distance(this.capturedMarble, Mojo.mouse);
            //Get the angle between the center of the marble and the pointer
            this.sling.angle = _S.angle(Mojo.mouse, this.capturedMarble);
            //Shoot the marble away from the pointer with a velocity
            //proportional to the sling's length
            this.capturedMarble.m5.vel[0] = 64 * Math.cos(this.sling.angle) * this.sling.m5.length / 5;
            this.capturedMarble.m5.vel[1] = 64 * Math.sin(this.sling.angle) * this.sling.m5.length / 5;
            //Release the captured marble
            this.capturedMarble = null;
          }
        }
        this.marbles.children.forEach(marble => {
          //Check for a collision with the pointer and marble
          if(Mojo.mouse.isDown && !this.capturedMarble){
            if(_2d.hitTestPointXY(Mojo.mouse.x,Mojo.mouse.y, marble)){
              //If there's a collision, capture the marble
              this.capturedMarble = marble;
              this.capturedMarble.m5.vel[0] = 0;
              this.capturedMarble.m5.vel[1] = 0;
            }
          }
          marble.m5.vel[0] *= marble.m5.friction[0];
          marble.m5.vel[1] *= marble.m5.friction[1];
          //Move the marble by applying the new calculated velocity
          //to the marble's x and y position
          _S.move(marble,dt);
          //Contain the marble inside the stage and make it bounce
          //off the edges
          _2d.contain(marble, self,true);
        });
        for(let objs,sprite,i=0; i < this.marbles.children.length; ++i){
          sprite = this.marbles.children[i];
          objs=_G.qtree.search(sprite);
          objs.forEach(o=>{
            if(o !== sprite){
              _2d.collide(sprite, o);
              _2d.contain(sprite, self,true);
              _2d.contain(o, self,true);
            }
          });
        }
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["marbles.png"],
      arena: {width:512, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



