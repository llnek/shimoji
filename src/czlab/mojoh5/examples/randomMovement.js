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
    const G=Mojo.Game;
    const {ute:_, is, EventBus}=Mojo;

    const E_PLAYER=1,
      E_ITEM=2;

    Mojo.defMixin("enemyControls", function(e){
      e.m5.direction=Mojo.LEFT;
      e.m5.switchPercent=2;
      function tryDirection(){
        let from = e.m5.direction;
        if(e.m5.vel[1] !== 0 && e.m5.vel[0]=== 0){
          e.m5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }else if(e.m5.vel[0] !== 0 && e.m5.vel[1]=== 0){
          e.m5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDirection(col){
        if(e.m5.vel[0]=== 0 && e.m5.vel[1]=== 0){
          let c=col.overlapN;
          if(c[1] !== 0){
            e.m5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(c[0] !== 0){
            e.m5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      let self={
        step(dt){
          if(Math.random() < e.m5.switchPercent/100){
            tryDirection()
          }
          switch(e.m5.direction){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      EventBus.sub(["hit",e],changeDirection);
      return self;
    });
    function Player(scene,s,ts,ps,os){
      let K=scene.getScaleFactor();
      Mojo.addMixin(s,"2dControls",false);
      Mojo.addMixin(s,"2d");
      s.m5.type=E_PLAYER;
      s.m5.speed=4*K;
      s.m5.direction=Mojo.RIGHT;
      s.anchor.set(0.5);
      s.x += Math.floor(s.width/2);
      s.y += Math.floor(s.height/2);
      s.m5.uuid="player";
      s.m5.vel[0]=s.m5.speed;
      s.m5.vel[1]=s.m5.speed;
      s.m5.step=()=>{
        s["2d"].motion();
        s["2dControls"].step();
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
      s.scale.x=K;
      s.scale.y=K;
      s.x = m.x+ Math.floor(s.width/2);
      s.y = m.y + Math.floor(s.height/2);
      s.m5.direction = Mojo.NONE;
      s.m5.speed = 1*K;
      s.anchor.set(0.5);
      s.m5.vel[0]=s.m5.speed;
      s.m5.vel[1]=s.m5.speed;
      Mojo.addMixin(s,"2d");
      Mojo.addMixin(s,"enemyControls");
      s.m5.boom=function(col){
        if(col.B.m5.uuid=="player"){
          Mojo.pause();
          //game over
        }
      };
      s.m5.step=function(dt){
        s["2d"].motion();
        s["enemyControls"].step();
        let ca= _S.centerXY(G.player);
        let cm= _S.centerXY(s);
        let vx=ca[0]-cm[0];
        let vy=ca[1]-cm[1];
        let d2 = vx * vx + vy * vy;
        //3. If the monster is less than 192 pixels away from the alien,
        //change the monster's state to `scared`. Otherwise, set its
        //state to `normal`
        if(d2 < 36864*K){//192 x 192
          s.m5.showFrame(1);
        } else {
          s.m5.showFrame(0);
        }
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


