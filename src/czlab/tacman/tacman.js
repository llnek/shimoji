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
           Tiles:_T,
           Input:_I,
           "2d":_2d,
           v2:_V,
           Game:_G,
           ute:_,is}=Mojo;
    const MFL=Math.floor;

    const E_PLAYER=1;
    const E_ENEMY=2;
    const E_COIN=4;
    const E_TOWER=8;

    Mojo.defMixin("enemyAI", function(e){
      e.m5.heading=Mojo.LEFT;
      //e.m5.speed=100;
      e.m5.switchPercent=2;
      function tryDir(){
        if(e.m5.vel[1] !== 0 && e.m5.vel[0]=== 0){
          e.m5.heading = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }else if(e.m5.vel[0] !== 0 && e.m5.vel[1]=== 0){
          e.m5.heading = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDir(col){
        if(e.m5.vel[0]=== 0 && e.m5.vel[1]=== 0){
          let c=col.overlapN;
          if(c[1] !== 0){
            e.m5.heading = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(c[0] !== 0){
            e.m5.heading = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      let self={
        dispose(){
          Mojo.off(["hit",e],changeDir)
        },
        onTick(dt){
          if(_.rand() < e.m5.switchPercent/100){
            tryDir()
          }
          switch(e.m5.heading){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      Mojo.on(["hit",e],changeDir);
      return self;
    });

    const Tower={
      s(){},
      c(scene,t,ts,ps){
        t.m5.type=E_TOWER;
        t.m5.sensor=true;
        t.m5.onSensor=(colObj)=>{
          scene.removeTile("Tiles",t)
        };
        t.m5.dispose=()=>{
          Mojo.off(t.m5)
        };
        Mojo.on(["2d.sensor",t],"onSensor",t.m5);
        return t;
      }
    };

    const Dot={
      s(){},
      c(scene,s,ts,ps){
        scene.dotCount = _.or(scene.dotCount,0);
        scene.dotCount += 1;
        s.m5.uuid=`dot#${scene.dotCount}`;
        s.m5.type=E_COIN;
        s.m5.sensor=true;
        s.m5.onSensor=(colObj)=>{
          scene.removeTile("Tiles",s);
          scene.dotCount -= 1;
          if(scene.dotCount===0){}
        };
        s.m5.dispose=()=>{
          Mojo.off(s.m5);
        };
        Mojo.on(["2d.sensor",s],"onSensor",s.m5);
        return s;
      }
    };

    const Player={
      s(){},
      c(scene,p,ts,ps,os){
        p.m5.type=E_PLAYER;
        p.m5.cmask=E_TOWER | E_COIN;
        _S.centerAnchor(p);
        p.x += MFL(p.width/2);
        p.y += MFL(p.height/2);
        p.m5.uuid="player";
        p.m5.speed= 150 * scene.getScaleFactor();
        _V.set(p.m5.vel,p.m5.speed, p.m5.speed);
        Mojo.addMixin(p,"2d",[_2d.MazeRunner,true]);
        p.m5.tick=function(dt){
          p["2d"].onTick(dt);
        };
        _G.player=p;
        return p;
      }
    };

    const Enemy={
      s(){},
      c(scene,s,ts,ps,os){
        s.m5.uuid=`e#${_.nextId()}`;
        s.m5.type=E_ENEMY;
        s.m5.cmask=E_PLAYER;
        s.x = os.column * s.width+MFL(s.width/2);
        s.y = os.row * s.height+MFL(s.height/2);
        _S.centerAnchor(s);
        s.m5.speed= 150 * scene.getScaleFactor();
        _V.set(s.m5.vel,s.m5.speed, s.m5.speed);
        Mojo.addMixin(s,"2d");
        Mojo.addMixin(s,"enemyAI");
        s.m5.boom=function(col){
          if(col.B.m5.uuid=="player"){
            Mojo.pause();
          }
        };
        s.m5.dispose=()=>{
          Mojo.off(["bump",s],"boom",s.m5)
        }
        s.m5.tick=function(dt){
          s["2d"].onTick(dt);
          s["enemyAI"].onTick(dt);
        };
        Mojo.on(["bump",s],"boom",s.m5);
      return s;
      }
    };

    const _objFactory={
      Player, Enemy, Dot, Tower
    };

    _Z.defScene("level1",{
      setup(options){
      }
    },{sgridX:128,sgridY:128,centerStage:true,
       tiled:{name: "map.json",factory:_objFactory}});

    _Z.defScene("hud",{
      setup(){
        let s= Mojo.Touch.joystick({
          onChange(dir){
            if(Mojo.sideRight(dir)){
              _G.player.m5.heading=Mojo.RIGHT; }
            if(Mojo.sideLeft(dir)){
              _G.player.m5.heading=Mojo.LEFT; }
            if(Mojo.sideTop(dir)){
              _G.player.m5.heading=Mojo.UP; }
            if(Mojo.sideBottom(dir)){
              _G.player.m5.heading=Mojo.DOWN; }
          }
        });
        this.insert(s);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "map.json","tiles.png"],
      arena: {width:640,height:480},
      scaleToWindow:"max",
      //touchOnly:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
      }
    })
  });

})(this);


