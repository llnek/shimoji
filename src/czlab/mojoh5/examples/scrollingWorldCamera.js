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

  function scenes(Mojo) {
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,G=Mojo.Game,_2d=Mojo["2d"],T=Mojo.Tiles;
    const {ute:_,is,EventBus} =Mojo;

    Z.defScene("hud",{
      setup(){
        this.message = S.text("No items found", {fontSize:12, fontFamily:"puzzler", fill:"black"},10,10);
        this.insert(this.message);
        this.message.visible = false;
        EventBus.sub(["sync.ui",this],"syncUI");
      },
      syncUI(msg){
        this.message.text=msg;
        this.message.visible=true;
      },
      hideMessage(){
        this.message.visible=false;
      }
    });

    Z.defScene("level1",{
      setup(){
        let w=this.world = T.tiledWorld("fantasy.json");
        this.insert(w);
        this.elf = S.animation("walkcycle.png", 64, 64);
        let objects=T.getObjectGroup(w,"objects");
        objects.addChild(this.elf);
        let elfObj=T.getNamedItem(objects,"elf")[0];
        this.elf.x = elfObj.x;
        this.elf.y = elfObj.y;
        let items= T.getTileLayer(w,"items");
        this.items= items.children.slice();

        this.camera = _2d.worldCamera(w, w.tiled.tiledWidth, w.tiled.tiledHeight, Mojo.canvas);
        this.camera.centerOver(this.elf);

        //Define a `collisionArea` on the elf that will be sensitive to
        //collisions. `hitTestTile` will use this information later to check
        //whether the elf is colliding with any of the tiles
        this.elf.m5.collisionArea = {x1: 22, y1: 44, x2:42, y2: 64};
        this.elf.states = {
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [1, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35]
        };

        this.elf.m5.showFrame(this.elf.states.right);
        this.elf.fps = 18;

        this.leftArrow = I.keybd(I.keyLEFT, ()=>{
          this.elf.m5.playFrames(this.elf.states.walkLeft);
          this.elf.m5.vel[0] = -2;
          this.elf.m5.vel[1] = 0;
        }, ()=>{
          if(!this.rightArrow.isDown && this.elf.m5.vel[1] === 0) {
            this.elf.m5.vel[0] = 0;
            this.elf.m5.showFrame(this.elf.states.left);
          }
        });
        this.upArrow = I.keybd(I.keyUP, ()=>{
          this.elf.m5.playFrames(this.elf.states.walkUp);
          this.elf.m5.vel[1] = -2;
          this.elf.m5.vel[0] = 0;
        }, ()=>{
          if(!this.downArrow.isDown && this.elf.m5.vel[0] === 0) {
            this.elf.m5.vel[1] = 0;
            this.elf.m5.showFrame(this.elf.states.up);
          }
        });
        this.rightArrow = I.keybd(I.keyRIGHT, ()=>{
          this.elf.m5.playFrames(this.elf.states.walkRight);
          this.elf.m5.vel[0] = 2;
          this.elf.m5.vel[1] = 0;
        }, ()=>{
          if(!this.leftArrow.isDown && this.elf.m5.vel[1] === 0) {
            this.elf.m5.vel[0] = 0;
            this.elf.m5.showFrame(this.elf.states.right);
          }
        });
        this.downArrow = I.keybd(I.keyDOWN, ()=>{
          this.elf.m5.playFrames(this.elf.states.walkDown);
          this.elf.m5.vel[1] = 2;
          this.elf.m5.vel[0] = 0;
        }, ()=>{
          if(!this.upArrow.isDown && this.elf.m5.vel[0] === 0) {
            this.elf.m5.vel[1] = 0;
            this.elf.m5.showFrame(this.elf.states.down);
          }
        });

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(dt){
        //Move the elf and constrain it to the world boundaries
        //(-10 and -18 are to compensate for image padding around the sprite)
        this.elf.x = Math.max(-18, Math.min(this.elf.x + this.elf.m5.vel[0], this.world.tiled.tiledWidth - this.elf.width + 18));
        this.elf.y = Math.max(-10, Math.min(this.elf.y + this.elf.m5.vel[1], this.world.tiled.tiledHeight - this.elf.height));
        this.camera.follow(this.elf);
        let obs= T.getTileLayer(this.world,"obstacles");
        let elfVsGround = T.hitTestTile(this.elf, obs.tiled.data, 0, this.world, Mojo.EVERY);
        if(!elfVsGround.hit){
          this.elf.x -= this.elf.m5.vel[0];
          this.elf.y -= this.elf.m5.vel[1];
          this.elf.m5.vel[0] = 0;
          this.elf.m5.vel[1] = 0;
        }
        let items=T.getTileLayer(this.world,"items");
        let elfVsItems = T.hitTestTile(this.elf, items.tiled.data, 0, this.world, Mojo.SOME);
        if(!elfVsItems.hit){
          this.items = this.items.filter(item => {
            if(item.tiled.____index === elfVsItems.index){
              let hud=Z.findScene("hud");
              EventBus.pub(["sync.ui", hud], `You found a ${item.tiled.props.name}`);
              hud.future(function(){ hud.hideMessage(); }, 180);
              //Remove the item
              items.tiled.data[elfVsItems.index]=0;
              S.remove(item);
              return false;
            } else {
              return true;
            }
          });
        }
      }
    });

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "fantasy.png", "walkcycle.png", "puzzler.otf", "fantasy.json"],//, "level1.tmx" ],
      arena: {width:512, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
      }
    });

  });

})(this);

