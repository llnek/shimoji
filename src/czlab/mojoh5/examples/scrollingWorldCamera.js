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

  const E_PLAYER=1;
  const E_ITEM=2;

  function scenes(Mojo) {
    const {Scenes:Z,
           Sprites:S,
           Input:I,
           Game:G,
           v2:_V,
           "2d":_2d,
           Tiles:T,
           ute:_,is} =Mojo;

    Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        this.message = S.text("No items found",
                              {fontSize:12*K, fontFamily:"uniscii", fill:"white"},10*K,10*K);
        this.insert(this.message);
        this.message.visible = false;
        Mojo.on(["sync.ui",this],"syncUI");
      },
      syncUI(msg){
        this.message.text=msg;
        this.message.visible=true;
        _.delay(3000,()=> this.hideMessage());
      },
      hideMessage(){
        this.message.visible=false;
      }
    });

    const Player={
      s(){},
      c(scene,s,ts,ps,os){
        let mapcol=os.column,
            maprow=os.row,
            K= scene.getScaleFactor(),
            p= S.animation("walkcycle.png", 64, 64);
        p.m5.type=E_PLAYER;
        p.m5.cmask=E_ITEM;
        p.m5.speed=80*K;
        p.m5.uuid="player";
        _V.set(p.scale,K,K);
        _V.set(p,mapcol * s.width,
                 maprow * s.height);
        G.elf=p;
        Mojo.addMixin(p,"2d");
        p.m5.getImageOffsets=function(){
          return {x1:p.scale.x*18,x2: p.scale.x*16,
                  y1:p.scale.y*10,y2:p.scale.y*4}
        };
        p.m5.getContactPoints=function(){
          let a=[[48,60],[48,10],[18,10],[18,60]];
          a.forEach(o=>{
            _V.mul$(o,p.scale)
          });
          return a;
        };
        p.g.states = {
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [1, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35]
        };
        p.m5.showFrame(p.g.states.right);
        p.m5.tick=(dt)=>{
          p["2d"].onTick(dt)
        }
        scene.leftArrow = I.keybd(I.LEFT, ()=>{
          G.elf.m5.playFrames(G.elf.g.states.walkLeft);
          _V.set(G.elf.m5.vel, -G.elf.m5.speed,0);
        }, ()=>{
          if(!scene.rightArrow.isDown && G.elf.m5.vel[1] === 0){
            _V.setX(G.elf.m5.vel, 0);
            G.elf.m5.showFrame(G.elf.g.states.left);
          }
        });
        scene.upArrow = I.keybd(I.UP, ()=>{
          G.elf.m5.playFrames(G.elf.g.states.walkUp);
          _V.set(G.elf.m5.vel, 0, -G.elf.m5.speed)
        }, ()=>{
          if(!scene.downArrow.isDown && G.elf.m5.vel[0] === 0) {
            _V.setY(G.elf.m5.vel, 0);
            G.elf.m5.showFrame(G.elf.g.states.up);
          }
        });
        scene.rightArrow = I.keybd(I.RIGHT, ()=>{
          G.elf.m5.playFrames(G.elf.g.states.walkRight);
          _V.set(G.elf.m5.vel, G.elf.m5.speed,0)
        }, ()=>{
          if(!scene.leftArrow.isDown && G.elf.m5.vel[1] === 0) {
            _V.setX(G.elf.m5.vel, 0);
            G.elf.m5.showFrame(G.elf.g.states.right);
          }
        });
        scene.downArrow = I.keybd(I.DOWN, ()=>{
          G.elf.m5.playFrames(G.elf.g.states.walkDown);
          _V.set(G.elf.m5.vel,0, G.elf.m5.speed)
        }, ()=>{
          if(!scene.upArrow.isDown && G.elf.m5.vel[0] === 0) {
            _V.setY(G.elf.m5.vel, 0);
            G.elf.m5.showFrame(G.elf.g.states.down);
          }
        });
        return p;
      }
    };

    function _item(scene,s,id,ts,ps,os){
      s.m5.type=E_ITEM;
      s.m5.uuid=id;
      s.m5.sensor=true;
      s.m5.dispose=()=>{
        Mojo.off(["2d.sensor",s],"onSensor",s.m5)
      };
      s.m5.onSensor=()=>{
        let hud=Z.findScene("hud");
        S.remove(s);
        Mojo.emit(["sync.ui", hud], `You found a ${id}`);
      };
      Mojo.on(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }

    const Heart={
      c(scene,s,ts,ps,os){
        return _item(scene,s,"heart", ts,ps,os)
      },
      s(){}
    };

    const Marmot={
      c(scene,s,ts,ps,os){
        return _item(scene,s,"marmot", ts,ps,os)
      },
      s(){}
    };

    const Skull={
      c(scene,s,ts,ps,os){
        return _item(scene,s,"skull", ts,ps,os)
      },
      s(){}
    };

    const _objFactory={
      Elf:Player,Heart,Marmot,Skull };

    Z.defScene("level1",{
      setup(){
        Mojo.addMixin(this,"camera2d", this.tiled.tiledWidth, this.tiled.tiledHeight);
      },
      postUpdate:function(dt){
        this["camera2d"].follow(G.elf);
      }
    },{sgridX:128,sgridY:128,centerStage:true,
       tiled:{name:"fantasy.json",factory:_objFactory}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "fantasy.png", "walkcycle.png", "unscii.fnt", "fantasy.json"],
      arena: {width:512, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
      }
    });

  });

})(this);

