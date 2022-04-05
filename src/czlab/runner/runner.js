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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const PStates={ walk_right: [0,2], hurt:3, jump_right: 4, duck_right: 5 };
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           Game:_G,
           math:_M,
           v2:_V,
           ute:_,is}=Mojo;


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Runner",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };


    const E_PLAYER=1,
    E_BOX=2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function cfgContacts(K){
      _G.Duck=[[-36,49],[-36,-13],[-25,-27],[25,-27],[32,-13],[36,49]].map(a=>{
        return [a[0]*K,a[1]*K]
      });
      _G.Walk=[[-25,49], [-35,-21], [-35,45], [0,46], [23,39], [34,2],[27,-49]].map(a=>{
        return [a[0]*K,a[1]*K]
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Player(scene){
      let s= _S.spriteFrom("walk1.png","walk2.png","stand.png","hurt.png","jump.png","duck.png");
      let K=Mojo.getScaleFactor();
      let floor=_G.bgFloor;
      _V.set(s.m5.gravity,0,2000*K);
      _S.scaleXY(s,1.5*K,1.5*K);
      _S.anchorXY(s,0.5);
      s.m5.uuid="player";
      s.m5.type=E_PLAYER;
      s.m5.cmask=E_BOX;
      _V.set(s, 40, _G.floorY-_M.ndiv(s.height,2));
      s.x=Mojo.width/3;
      s.g._mode=null;
      s.g.oldX=s.x;
      scene.insert(s,true);
      let speed= 500*K;
      let jump= -700*K;
      let landed=1;
      _G.upArrow =()=>{
        if(landed>0){ _V.setY(s.m5.vel, jump) }
        landed=0;
        s.m5.showFrame(PStates.jump_right);
        s.g._mode=PStates.jump_right;
      };
      _G.downArrow =()=>{
        s.m5.showFrame(PStates.duck_right);
        s.g._mode=PStates.duck_right;
      };

      cfgContacts(K);
      s.m5.getContactPoints=function(){
        return s.g._mode==PStates.duck_right ? _G.Duck: _G.Walk;
      };
      s.m5.bumped=(col)=>{
        Mojo.sound("boing2.mp3").play();
        _V.sub$(s, col.overlapV);
        _G.bumped=true;
        s.m5.showFrame(PStates.hurt);
        s.g._mode=PStates.hurt;
        scene.futureX(()=>{
          s.m5.playFrames(PStates.walk_right);
          s.g._mode=PStates.walk_right;
          _G.bumped=false;
        },10);
      };
      s.g.move=_U.Meander(s);
      s.m5.tick=(dt)=>{
        s.g.move(dt);
        s.m5.vel[0] += (speed - s.m5.vel[0])/4;
        if(s.m5.vel[1]>0 && _S.bottomSide(s) > _G.floorY){
          _V.setY(s, _G.floorY - _M.ndiv(s.height,2));
          landed = 1;
          _V.setY(s.m5.vel,0);
        }
        if(landed && s.g._mode === null){
          s.m5.playFrames(PStates.walk_right);
          s.g._mode=PStates.walk_right;
        }
        s.m5.vel[0]=0;
        s.x=s.g.oldX;
      };
      Mojo.on(["bump.*",s],"bumped",s.m5);
      return s;
    }

    const levels = [ 0,25,80,120 ].map(a=>a *Mojo.getScaleFactor());
    const tRatio=Mojo.PI_360/360;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Box(scene,player){
      let b=_S.spriteFrom("rock.png","box1.png","box2.png");
      let theta= _.randSign()*(300*tRatio*_.rand() + 200*tRatio);
      let floor=_G.bgFloor;
      let offset=levels[_.randInt(4)];
      let K=Mojo.getScaleFactor();
      b.m5.showFrame(offset==0?0:(_.randSign()>0?1:2));
      _V.set(b.scale,2.8*K,2.8*K);
      _S.anchorXY(b,0.5);
      b.m5.type=E_BOX;
      _V.set(b,player.x + Mojo.width + 50*K, _G.floorY - offset - _M.ndiv(b.height,2));
      _V.set(b.m5.vel, -1200*K + 200*K*_.rand(),0);
      _V.setY(b.m5.acc,0);
      let base=_G.floorY- _M.ndiv(b.height,2);
      b.m5.collide=(col)=>{
        b.alpha = 0.5;
        _V.set(b.m5.vel, 200*K,-300*K);
        _V.setY(b.m5.acc,400*K);
      };
      b.m5.tick=(dt)=>{
        b.x += b.m5.vel[0] * dt;
        b.m5.vel[1] += b.m5.acc[1] * dt;
        b.y += b.m5.vel[1] * dt;
        if(!_.feq(b.y,base)){
          b.rotation += theta * dt;
        }
        if(b.y > Mojo.height){
          b.m5.dead=true;
          _S.remove(b);
        }
      };
      Mojo.on(["hit",b],"collide",b.m5);
      return b;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function BoxThrower(scene,p){
      let b= {
        launchDelay: 0.75*Mojo.getScaleFactor(),
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let self=this;
        let K=Mojo.getScaleFactor();

        this.g.bgs=_.fill(2, ()=> _S.sprite("background-wall.jpg"));
        this.g.bgs.forEach(s=>{
          _S.scaleToCanvas(self.insert(s))
        });

        this.g.fls=_.fill(2, ()=> _S.sprite("background-floor.jpg"));
        this.g.fls.forEach(s=>{
          s.width=Mojo.width;
          s.height *= K;
          s.y=Mojo.height-s.height;
          _G.floorY=s.y;
          self.insert(s);
        });

        this.g.bgSpeed = 6.9*K;
        this.g.bgX = 0;

        this.g.flSpeed = (6.9/1.3)*K;
        this.g.flX = 0;

        _.delay(100,()=> _Z.run("PlayGame2"));
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();

        if(_G.bumped){
          this.g.bgX += this.g.bgSpeed*0.3;
          this.g.flX += this.g.flSpeed*0.3;
        }else{
          this.g.bgX += this.g.bgSpeed;
          this.g.flX += this.g.flSpeed;
        }

        this.g.bgs.forEach((s,i)=>{
          s.x= i * s.width - int(this.g.bgX % s.width);
          s.y=0;
        });

        this.g.fls.forEach((s,i)=>{
          s.x= i * s.width - int(this.g.flX % s.width);
        });


      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame2",{
      setup(){
        let K=Mojo.getScaleFactor();
        let p= this.player= Player(this);
        BoxThrower(this,p);
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
        _Z.run("HotKeys",{
          radius:48*K,
          fontSize:48*K,
          alpha:0.8,
          cb(obj){
            _V.set(obj.down,Mojo.width-obj.down.width,Mojo.height-obj.down.height);
            _S.pinLeft(obj.down,obj.up,obj.down.height/4);
            delete obj.right;
            delete obj.left;
            return obj;
          }
        });
      },
      postUpdate(dt){
        if(_I.keyDown(_I.UP)){
          _G.upArrow();
        }else if(_I.keyDown(_I.DOWN)){
          _G.downArrow();
        }else if(_G.bumped){
        }else if(this.player.g._mode != PStates.walk_right){
          this.player.m5.playFrames(PStates.walk_right);
          this.player.g._mode=PStates.walk_right;
        }
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["click.mp3", "boing2.mp3","background-wall.jpg",
                   "background-floor.jpg", "tiles.png","images/tiles.json"],
      arena: {width:1344,height:840},
      scaleToWindow:"max",
      scaleFit:"x",
      start(...args){ scenes(...args) }
    });
  });

})(this);


