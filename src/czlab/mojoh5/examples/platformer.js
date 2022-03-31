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

;(function(window){

  "use strict";

  const E_PLAYER=1;
  const E_ENEMY=2;
  const E_TOWER=4;

  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           Tiles:_T,
           v2:_V,
           Game:G,
           ute:_,is}=Mojo;

    //0,12
    const Player={
      s(){},
      c(scene,p,ts,ps,o){
        _V.set(p.m5.gravity,0,200);
        p.m5.type=E_PLAYER;
        p.m5.cmask=E_TOWER;
        p.m5.uuid="player";
        p.m5.speed=200;
        p.g.arcade=_U.Meander(p);
        p.g.plat=_U.Platformer(p);
        p.m5.tick=(dt)=>{
          p.g.plat(dt,p.g.arcade(dt))
        };
        return p;
      }
    };

    //5,1
    const Tower={
      s(){},
      c(scene,s,ts,ps,o){
        const e=[["bump.sensor",s],"onSensor",s.m5];
        s.m5.type=E_TOWER;
        s.m5.uuid="tower";
        s.m5.sensor=true;
        s.m5.onSensor=()=>{ Mojo.pause() };
        s.m5.dispose=()=>{ Mojo.off(...e) }
        Mojo.on(...e);
        return s;
      }
    };

    //32,3,22,3
    const Enemy={
      s(){},
      c(scene,e,ts,ps,o){
        let signals= [[["bump.top",e],"onbtop",e.m5],
                      [["bump.left,bump.right,bump.bottom",e], "onbump",e.m5]];
        e.m5.speed=200*scene.getScaleFactor();
        e.m5.uuid=`e#${_.nextId()}`;
        e.m5.cmask=E_PLAYER|E_ENEMY;
        e.m5.type=E_ENEMY;
        _V.set(e.m5.gravity,0,60);
        _V.set(e.m5.vel,e.m5.speed,e.m5.speed);
        e.m5.dispose=()=>{
          signals.forEach(s=> Mojo.off(...s))
          e.g.pat.dispose();
        };
        e.g.arcade=_U.Meander(e);
        e.g.pat=_U.Patrol(e,true,false);
        e.m5.tick=(dt)=>{
          e.g.arcade(dt);
          e.m5.flip="";//no flipping
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
        signals.forEach(s=> Mojo.on(...s));
        return e;
      }
    };

    _Z.scene("bg",{
      setup(){
        let w= _S.tilingSprite("background-wall.png");
        _S.sizeXY(w,Mojo.width,Mojo.height);
        this.insert(w);
      }
    });

    const _objFactory={
      Player,Enemy,Tower
    };

    _Z.scene("level1",{
      setup(){
      }
    },{sgridX:160,sgridY:160,centerStage:true,
       tiled:{name:"platformer.json",factory:_objFactory}});

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "platformer.json",
                   "tiles.png", "background-wall.png"],
      arena: {},
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("bg");
        Mojo.Scenes.run("level1");
      }
    })
  });

})(this);


