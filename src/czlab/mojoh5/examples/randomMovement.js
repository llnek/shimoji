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
           Input:_I,
           "2d":_2d,
           Tiles:_T,
           Game:G,
           ute:_, is, EventBus}=Mojo;

    const E_PLAYER=1,
          E_ITEM=2;


    Mojo.defMixin("enemyAI", function(e){
      e.m5.heading=Mojo.LEFT;
      e.m5.switchPercent=5/100;
      function tryDir(){
        if(e.m5.vel[1] !== 0 && e.m5.vel[0]=== 0){
          e.m5.heading = _.rand()<0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }
        if(e.m5.vel[0] !== 0 && e.m5.vel[1]=== 0){
          e.m5.heading = _.rand()<0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDir(col){
        if(e.m5.vel[0]=== 0 && e.m5.vel[1]=== 0){
          let c=col.overlapN;
          if(c[1] !== 0){
            e.m5.heading = _.rand()<0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }
          if(c[0] !== 0){
            e.m5.heading = _.rand()<0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      const s= [["hit",e],changeDir];
      let self={
        dispose(){
          EventBus.unsub.apply(EventBus,s)
        },
        onTick(dt){
          if(_.rand() < e.m5.switchPercent){
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
      EventBus.sub.apply(EventBus,s);
      return self;
    });

    function Player(scene,s,ts,ps,os){
      let K=scene.getScaleFactor();
      Mojo.addMixin(s,"2d",[_2d.MazeRunner,false]);
      s.m5.type=E_PLAYER;
      s.m5.speed=4*K;
      s.m5.heading=Mojo.RIGHT;
      _S.centerAnchor(s);
      s.x += Math.floor(s.width/2);
      s.y += Math.floor(s.height/2);
      s.m5.uuid="player";
      _S.velXY(s,s.m5.speed, s.m5.speed);
      s.m5.tick=()=>{
        s["2d"].onTick();
      };
      return G.player=s;
    }

    function Monster(scene,m,ts,ps,os){
      let fs = _S.frameSelect("monsterMaze.png", 64,64, [ [128, 0], [128, 64] ]);
      let K=scene.getScaleFactor();
      let s = _S.sprite(fs);
      s.m5.uuid=`e#${_.nextId()}`;
      s.m5.cmask=E_PLAYER;
      s.m5.type=E_ITEM;
      _S.scaleXY(s,K,K);
      s.x = m.x+ Math.floor(s.width/2);
      s.y = m.y + Math.floor(s.height/2);
      s.m5.heading = Mojo.NONE;
      s.m5.speed = 1*K;
      _S.centerAnchor(s);
      _S.velXY(s,s.m5.speed, s.m5.speed);
      Mojo.addMixin(s,"2d");
      Mojo.addMixin(s,"enemyAI");
      s.m5.boom=(col)=>{
        if(col.B.m5.uuid=="player"){
          Mojo.pause();
        }
      };
      s.m5.tick=(dt)=>{
        s["2d"].onTick();
        s["enemyAI"].onTick();
        let ca= _S.centerXY(G.player);
        let cm= _S.centerXY(s);
        let vx=ca[0]-cm[0];
        let vy=ca[1]-cm[1];
        let d2 = vx * vx + vy * vy;
        s.m5.showFrame(d2<36864*K?1:0);
      };
      EventBus.sub(["bump",s],"boom",s.m5);
      return s;
    }

    function _objF(){ return {Player,Monster} }

    _Z.defScene("level1",{
      setup(){
      }
    },{sgridX:180,sgridX:180,
       centerStage:true,tiled:{name:"monsterMaze.json",factory:_objF}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
      arena: {width:704, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


