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
           Game:_G,
           ute:_,is,EventBus}=Mojo;
    const MFL=Math.floor;

    const E_PLAYER=1;
    const E_ENEMY=2;
    const E_COIN=4;
    const E_TOWER=8;

    Mojo.defMixin("enemyAI", function(e){
      e.m5.direction=Mojo.LEFT;
      //e.m5.speed=100;
      e.m5.switchPercent=2;
      function tryDir(){
        if(e.m5.vel[1] !== 0 && e.m5.vel[0]=== 0){
          e.m5.direction = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }else if(e.m5.vel[0] !== 0 && e.m5.vel[1]=== 0){
          e.m5.direction = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDir(col){
        if(e.m5.vel[0]=== 0 && e.m5.vel[1]=== 0){
          let c=col.overlapN;
          if(c[1] !== 0){
            e.m5.direction = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(c[0] !== 0){
            e.m5.direction = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      let self={
        dispose(){
          EventBus.unsub(["hit",e],changeDir)
        },
        onTick(dt){
          if(_.rand() < e.m5.switchPercent/100){
            tryDir()
          }
          switch(e.m5.direction){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      EventBus.sub(["hit",e],changeDir);
      return self;
    });

    function Tower(scene,t,ts,ps){
      t.m5.type=E_TOWER;
      t.m5.sensor=true;
      t.m5.onSensor=(colObj)=>{
        scene.removeTile(t)
      };
      t.m5.dispose=()=>{
        EventBus.unsub(["2d.sensor",t],"onSensor",t.m5)
      };
      EventBus.sub(["2d.sensor",t],"onSensor",t.m5);
      return t;
    }

    function Dot(scene,s,ts,ps){
      scene.dotCount = _.or(scene.dotCount,0);
      scene.dotCount += 1;
      s.m5.uuid=`dot#${scene.dotCount}`;
      s.m5.type=E_COIN;
      s.m5.sensor=true;
      s.m5.onSensor=(colObj)=>{
        scene.removeTile(s);
        scene.dotCount -= 1;
        if(scene.dotCount===0){}
      };
      s.m5.dispose=()=>{
        EventBus.unsub(["2d.sensor",s],"onSensor",s.m5)
      };
      EventBus.sub(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }

    function Player(scene,p,ts,ps,os){
      p.m5.type=E_PLAYER;
      p.m5.cmask=E_TOWER | E_COIN;
      _S.centerAnchor(p);
      p.x += MFL(p.width/2);
      p.y += MFL(p.height/2);
      p.m5.uuid="player";
      p.m5.speed= 150 * scene.getScaleFactor();
      _S.velXY(p,p.m5.speed, p.m5.speed);
      Mojo.addMixin(p,"2d");
      Mojo.addMixin(p,"2dControls",true);
      p.m5.tick=function(dt){
        p["2d"].onTick(dt);
        p["2dControls"].onTick(dt);
      };
      return p;
    }

    function Enemy(scene,s,ts,ps,os){
      s.m5.uuid=`e#${_.nextId()}`;
      s.m5.type=E_ENEMY;
      s.m5.cmask=E_PLAYER;
      s.x = os.column * s.width+MFL(s.width/2);
      s.y = os.row * s.height+MFL(s.height/2);
      _S.centerAnchor(s);
      s.m5.speed= 150 * scene.getScaleFactor();
      _S.velXY(s,s.m5.speed, s.m5.speed);
      Mojo.addMixin(s,"2d");
      Mojo.addMixin(s,"enemyAI");
      s.m5.boom=function(col){
        if(col.B.m5.uuid=="player"){
          Mojo.pause();
        }
      };
      s.m5.tick=function(dt){
        s["2d"].onTick(dt);
        s["enemyAI"].onTick(dt);
      };
      EventBus.sub(["bump",s],"boom",s.m5);
      return s;
    }

    function _objFactory(scene){
      return{ Player, Enemy, Dot, Tower }
    }

    _Z.defScene("level1",{
      setup(options){
      }
    },{sgridX:128,sgridY:128,centerStage:true,
       tiled:{name: "tower_man.json",factory:_objFactory}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "tower_man.json","tiles.png"],
      arena: {width:640,height:480},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


