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
  const E_ENEMY=2;
  const E_TOWER=4;

  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           Tiles:_T,
           Game:G,
           ute:_,is,EventBus}=Mojo;

    //0,12
    function Player(scene,p,ts,ps,o){
      Mojo.addMixin(p,"2d",[_2d.Platformer]);
      p.m5.type=E_PLAYER;
      p.m5.cmask=E_TOWER;
      p.m5.uuid="player";
      p.m5.speed=200;
      _S.gravityXY(p,null,200);
      p.m5.tick=(dt)=>{
        p["2d"].onTick(dt);
      };
      return p;
    }

    //5,1
    function Tower(scene,s,ts,ps,o){
      const e=[["2d.sensor",s],"onSensor",s.m5];
      s.m5.type=E_TOWER;
      s.m5.uuid="tower";
      s.m5.sensor=true;
      s.m5.onSensor=()=>{
        Mojo.pause()
      };
      s.m5.dispose=()=>{
        EventBus.unsub.apply(EventBus,e)
      }
      EventBus.sub.apply(EventBus,e);
      return s;
    }

    //32,3,22,3
    function Enemy(scene,e,ts,ps,o){
      const signals= [[["bump.top",e],"onbtop",e.m5],
                      [["bump.left,bump.right,bump.bottom",e], "onbump",e.m5]];
      Mojo.addMixin(e,"2d",[_2d.Patrol,true,false]);
      e.m5.speed=100*scene.getScaleFactor();
      e.m5.uuid=`e#${_.nextId()}`;
      e.m5.cmask=E_PLAYER|E_ENEMY;
      e.m5.type=E_ENEMY;
      _S.gravityXY(e,null,60);
      _S.velXY(e, e.m5.speed);
      e.m5.dispose=()=>{
        signals.forEach(s=> EventBus.unsub.apply(EventBus,s))
      };
      e.m5.tick=(dt)=>{
        e["2d"].onTick(dt)
      };
      e.m5.onbump=(col)=>{
        if(col.B.m5.uuid=="player"){
          console.log("die!!!");
          Mojo.pause();
        }
      };
      e.m5.onbtop=(col)=>{
        if(col.B.m5.uuid=="player"){
          _S.remove(e);
          col.B.m5.vel[1] = -300;
        }
      };
      signals.forEach(s=> EventBus.sub.apply(EventBus,s));
      return e;
    }

    _Z.defScene("bg",{
      setup(){
        let w= _S.tilingSprite("background-wall.png");
        _S.sizeXY(w,Mojo.width,Mojo.height);
        this.insert(w);
      }
    });

    function _objFactory(s){ return {Player,Enemy,Tower} }

    _Z.defScene("level1",{
      setup(){
      }
    },{sgridX:160,sgridY:160,centerStage:true,
       tiled:{name:"platformer.json",factory:_objFactory}});

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "platformer.json", "tiles.png", "background-wall.png"],
      arena: {},
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


