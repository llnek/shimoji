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
  const E_BOX=2;

  function scenes(Mojo){
    const PStates={ walk_right: [0,10], jump_right: 13, duck_right: 15 };
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           "2d":_2d,
           ute:_,is}=Mojo;

    function Player(scene){
      let s= _S.sprite(_S.frames("player.png",72,97,0,0,0,1));
      let floor=_G.bgFloor;
      _V.set(s.m5.gravity,0,2000);
      _S.centerAnchor(s);
      s.m5.uuid="player";
      s.m5.type=E_PLAYER;
      s.m5.cmask=E_BOX;
      _V.set(s, 40, floor.y-MFL(s.height/2));
      s._mode=null;
      scene.insert(s,true);
      let speed= 500;
      let jump= -700;
      let landed=1;
      let upArrow = _I.keybd(_I.UP, ()=>{
        if(landed>0) { _V.setY(s.m5.vel, jump) }
        landed=0;
        s.m5.showFrame(PStates.jump_right);
        s._mode=PStates.jump_right;
      }, ()=>{
        s._mode=null;
      });
      let downArrow = _I.keybd(_I.DOWN, ()=>{
        s.m5.showFrame(PStates.duck_right);
        s._mode=PStates.duck_right;
      }, ()=>{
        s._mode=null;
      });

      Mojo.addMixin(s,"2d");
      s.m5.getContactPoints=function(){
        return s._mode==PStates.duck_right ? [[-16,44], [-23,35], [-23,-10], [23,-10], [23,35], [16,44]]
                                           : [[-16,44], [-23,35], [-23,-48], [23,-48], [23,35], [16,44]]
      };
      s.m5.bumped=(col)=>{
        _V.sub$(s, col.overlapV);
        _G.bumped=true;
        scene.future(()=>{
          _G.bumped=false;
        },5);
      };
      s.m5.tick=(dt)=>{
        s["2d"].onTick(dt);
        s.m5.vel[0] += (speed - s.m5.vel[0])/4;
        if(s.m5.vel[1]>0 && _S.bottomSide(s) > floor.y){
          _V.setY(s, floor.y - MFL(s.height/2));
          landed = 1;
          _V.setY(s.m5.vel,0);
        }
        if(landed && s._mode === null){
          s.m5.playFrames(PStates.walk_right);
          s._mode=PStates.walk_right;
        }
      };
      Mojo.on(["bump",s],"bumped",s.m5);
      return s;
    }

    const levels = [ 0,25,65,100 ];
    const tRatio=Mojo.PI_360/360;

    function Box(scene,player){
      let frames=_S.frames("crates.png",32,32,0,0,0,0);
      let theta= _.randSign()*(300*tRatio*_.rand() + 200*tRatio);
      let floor=_G.bgFloor;
      let b=_S.sprite(frames[_.rand() < 0.5 ? 1 : 0]);
      _V.set(b.scale,2,2);
      _S.centerAnchor(b);
      b.m5.type=E_BOX;
      _V.set(b,player.x + Mojo.width + 50,
               floor.y - levels[MFL(_.rand()*4)] - MFL(b.height/2));
      _V.set(b.m5.vel, -800 + 200*_.rand(),0);
      _V.setY(b.m5.acc,0);
      let base=floor.y- MFL(b.height/2);
      b.m5.collide=(col)=>{
        b.alpha = 0.5;
        _V.set(b.m5.vel, 200,-300);
        _V.setY(b.m5.acc,400);
      };
      b.m5.tick=(dt)=>{
        b.x += b.m5.vel[0] * dt;
        b.m5.vel[1] += b.m5.acc[1] * dt;
        b.y += b.m5.vel[1] * dt;
        if(!_.feq(b.y,base)){
          b.rotation += theta * dt;
        }
        if(b.y > floor.y ||
           b.x < scene["camera2d"].x){
          b.m5.dead=true;
          _S.remove(b);
        }
      };
      Mojo.on(["hit",b],"collide",b.m5);
      return b;
    }

    function BoxThrower(scene,p){
      let b= {
        launchDelay: 0.75,
        launchRandom: 1,
        launch: 2,
        update(dt){
          this.launch -= dt;
          if(this.launch < 0) {
            scene.insert(Box(scene,p),true);
            this.launch = this.launchDelay + this.launchRandom * _.rand();
          }
        }
      };
      Mojo.addBgTask(b);
    }

    _Z.defScene("bg",{
      setup(){
        let floor = _G.bgFloor = _S.tilingSprite("background-floor.png");
        let wall = _G.bgWall = _S.tilingSprite("background-wall.png");
        _S.sizeXY(wall,Mojo.width,Mojo.height);
        floor.width=Mojo.width;
        floor.y=Mojo.height-floor.height;
        this.insert(wall);
        this.insert(floor);
      },
      postUpdate(dt){
        if(_G.bumped){
          _G.bgWall.tilePosition.x -= 2;
          _G.bgFloor.tilePosition.x -= 4;
        }else{
          _G.bgWall.tilePosition.x -= 4;
          _G.bgFloor.tilePosition.x -= 8;
        }
      }
    });

    _Z.defScene("level1",{
      setup(){
        let p= this.player= Player(this);
        BoxThrower(this,p);
        let stage=Mojo.mockStage();
        Mojo.addMixin(this,"camera2d",stage.width,stage.height);
      },
      postUpdate(dt){
        this["camera2d"].centerOver(this.player.x+300);
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["player.png", "background-wall.png",
                   "background-floor.png", "crates.png"],
      arena: {},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
    });
  });

})(this);


