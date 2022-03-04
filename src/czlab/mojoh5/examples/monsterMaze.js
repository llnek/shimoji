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

  function scenes(Mojo){
    const _M=window["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           Tiles: _T,
           v2:_V,
           "D2":_2d,
           ute:_,is,EventBus}=Mojo;

    const E_PLAYER=1,
          E_ITEM=2;

    const _objF={
      Player:{
        s(){},
        c(scene,s,ts,ps,os){
          let K=scene.getScaleFactor();
          s.m5.heading=Mojo.RIGHT;
          s.m5.type=E_PLAYER;
          s.m5.cmask=E_ITEM;
          s.m5.speed=4*K;
          _S.centerAnchor(s);
          _V.add$(s, [_M.ndiv(s.width,2),
                      _M.ndiv(s.height,2)]);
          s.m5.uuid="player";
          s.m5.tick=()=>{ s["arcade"].onTick() };
          _V.set(s.m5.vel, s.m5.speed, s.m5.speed);
          return Mojo.addMixin(s,"arcade",[_2d.MazeRunner]);
        }
      },
      Monster:{
        s(){},
        c(scene,s,ts,ps,os){
          const e= [["2d.sensor",s],"onSensor",s.m5];
          s.m5.sensor=true;
          s.m5.type=E_ITEM;
          s.m5.onSensor=()=> _S.remove(s);
          s.m5.dispose=()=> Mojo.off(...e);
          Mojo.on(...e);
          return s;
        }
      }
    };

    _Z.defScene("level1", {
      setup(){
      }
    },{centerStage:true,tiled:{name:"monsterMaze.json",factory:_objF}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
      arena: { width: 704, height: 512 },
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


