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
           "2d":_2d,
           ute:_,is,EventBus}=Mojo;

    function Player(scene){
      let s= _S.sprite(_S.frames("player.png",72,97,0,0,0,1));
      let floor=scene.bgFloor;
      _S.centerAnchor(s);
      _S.gravityXY(s,null,2000);
      s.m5.uuid="player";
      s.m5.type=E_PLAYER;
      s.m5.cmask=E_BOX;
      _S.setXY(s, 40, floor.y-MFL(s.height/2));
      s._mode=null;
      scene.insert(s,true);
      let speed= 500;
      let jump= -700;
      let landed=1;
      let upArrow = _I.keybd(_I.keyUP, ()=>{
        if(landed>0) { _S.velXY(s,null, jump) }
        landed=0;
        s.m5.showFrame(PStates.jump_right);
        s._mode=PStates.jump_right;
      }, ()=>{
        s._mode=null;
      });
      let downArrow = _I.keybd(_I.keyDOWN, ()=>{
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
        _S.setXY(s, s.x - col.overlapV[0], s.y - col.overlapV[1])
      };
      s.m5.tick=(dt)=>{
        s["2d"].onTick(dt);
        s.m5.vel[0] += (speed - s.m5.vel[0])/4;
        if(s.m5.vel[1]>0 && _S.bottomSide(s) > floor.y){
          s.y = floor.y - MFL(s.height/2);
          landed = 1;
          s.m5.vel[1] = 0;
        }
        if(landed && s._mode === null){
          s.m5.playFrames(PStates.walk_right);
          s._mode=PStates.walk_right;
        }
      };
      EventBus.sub(["bump",s],"bumped",s.m5);
      return s;
    }

    const levels = [ 0,25,65,100 ];
    const tRatio=Mojo.PI_360/360;

    function Box(scene,player){
      let frames=_S.frames("crates.png",32,32,0,0,0,0);
      _.assert(frames.length===2);
      let theta= _.randSign()*(300*tRatio*_.rand() + 200*tRatio);
      let floor=scene.bgFloor;
      let b=_S.sprite(frames[_.rand() < 0.5 ? 1 : 0]);
      _S.scaleXY(b,2,2);
      _S.centerAnchor(b);
      b.m5.type=E_BOX;
      b.x= player.x + Mojo.width + 50;
      b.y= floor.y - levels[MFL(_.rand()*4)] - MFL(b.height/2);
      _S.velXY(b, -800 + 200*_.rand(),0);
      _S.accXY(b,null,0);
      let base=floor.y- MFL(b.height/2);
      b.m5.collide=(col)=>{
        b.alpha = 0.5;
        _S.velXY(b, 200,-300);
        _S.accXY(b,null,400);
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
      EventBus.sub(["hit",b],"collide",b.m5);
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

    _Z.defScene("level1",{
      setup(){
        let floor = this.bgFloor = _S.tilingSprite("background-floor.png");
        let wall = this.bgWall = _S.tilingSprite("background-wall.png");
        let parent=this.parent;
        parent.removeChildren();
        _S.sizeXY(wall,Mojo.width,Mojo.height);
        floor.width=Mojo.width;
        floor.y=Mojo.height-floor.height;
        parent.addChild(wall);
        parent.addChild(floor);
        parent.addChild(this);
        let p= this.player= Player(this);
        BoxThrower(this,p);
        let stage=Mojo.mockStage();
        Mojo.addMixin(this,"camera2d",stage.width,stage.height);
      },
      postUpdate(dt){
        this.bgWall.tilePosition.x -= 4;
        //this.bgWall.tilePosition.y += 1;
        this.bgFloor.tilePosition.x -= 8;
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
        Mojo.Scenes.runScene("level1");
      }
    });
  });

})(this);


