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
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Tiles:_T,
           Input:_I,
           "2d":_2d,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    window["io/czlab/rumble/warzone"](Mojo);

    const C_RUN="run",
        C_INIT="init",
        C_RESOLVE="resolve",
        C_ALERT="alert",
        C_BCAST="bcast",
        C_TURRET="turret",
        C_FIRE="fire",
        C_TURN="turn",
        C_FORWARD="forward",
        C_BACKWARD="backward";

    const BLOCKING_CMDS = [C_TURN, C_FORWARD, C_BACKWARD];
    const TANKS=["blue","red","green"];

    _G.SHELL_INTERVAL=15;
    _G.BOT_HEALTH=20;
    _G.MAX_SHELLS=5;
    _G.SHELL_SPEED=3;

    _G.explosions=[];
    _G.bots=[];

    /** @ignore */
    function makeShell(scene,color){
      let K=Math.max(0.7,Mojo.getScaleFactor());
      let s= _S.sprite("bullet.png");
      s.tint=_S.color(color);
      _S.centerAnchor(s);
      _S.scaleXY(s,K,K);
      s.height=MFL(s.height);
      s.width=MFL(s.width);
      s.m5.speed=_G.SHELL_SPEED;
      if(!_.isEven(s.width))--s.width;
      if(!_.isEven(s.height))--s.height;
      return scene.insert(s);
    };

    /** @ignore */
    function makeBot(scene,color){
      let s= _S.sprite(`tank_${color}.png`);
      let b= _S.sprite(`turret_${color}.png`);
      _S.centerAnchor(b);
      _S.centerAnchor(s);
      s.addChild(b);
      _S.sizeXY(s,_G.tileW,_G.tileH);
      s.g.color=color;
      if(scene){
        scene.insert(s);
      }else{
        s=null;
      }
      return s;
    }

    /** @ignore */
    _Z.defScene("level1",{
      setup(){
        let g= _G.grid= _S.gridSQ(16,0.8);
        let g0=g[0][0];
        _G.arena= _S.gridBBox(0,0,g);
        _G.tileW=g0.x2-g0.x1;
        _G.tileH=g0.y2-g0.y1;
        _G.shell= color=> makeShell(this,color);
        _G.bot= color=> makeBot(this,color);
        makeBot(null,"red");
        _G.warZone.init();
      },
      postUpdate(){
        if(!_G.go){
          _G.go=true;
          _G.warZone.start();
        }
      }
    });

    /** @ignore */
    _Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        let s= _S.bboxFrame(_G.arena,K*32);
        this.insert(s);
      }
    });
  }

  const _$={
    assetFiles: ["tank_blue.png","tank_green.png","tank_red.png",
                 "bullet.png","turret_blue.png","turret_green.png","turret_red.png"],
    arena: {width:4000,height:2800},
    zoneMillis:10,
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


