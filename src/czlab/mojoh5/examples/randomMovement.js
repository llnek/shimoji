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
           v2:_V,
           Game:G,
           ute:_, is}=Mojo;

    const E_PLAYER=1,
          E_ITEM=2;

    Mojo.defMixin("enemyAI", function(e){
      e.m5.heading=Mojo.LEFT;
      e.m5.reroute=15/100;

      function tryDir(){
        if(_S.isVX(e) && !_S.isVY(e))
          e.m5.heading = _.rand()<0.5 ? Mojo.UP : Mojo.DOWN;
        if(_S.isVY(e) && !_S.isVX(e))
          e.m5.heading = _.rand()<0.5 ? Mojo.LEFT : Mojo.RIGHT; }

      function changeDir(col){
        if(!_S.isMoving(e)){
          let c=col.overlapN;
          if(!_.feq0(c[0]))
            e.m5.heading = _.rand()<0.5 ? Mojo.UP : Mojo.DOWN;
          if(!_.feq0(c[1]))
            e.m5.heading = _.rand()<0.5 ? Mojo.LEFT : Mojo.RIGHT; } }

      const s= [["hit",e],changeDir];
      Mojo.on(...s);
      return{
        dispose(){
          Mojo.off(...s) },
        onTick(dt){
          if(_.rand() < e.m5.reroute){ tryDir() }
          switch(e.m5.heading){
            case Mojo.LEFT: _V.set(e.m5.vel,-e.m5.speed,0); break;
            case Mojo.RIGHT: _V.set(e.m5.vel, e.m5.speed,0); break;
            case Mojo.UP:   _V.set(e.m5.vel,0, -e.m5.speed); break;
            case Mojo.DOWN: _V.set(e.m5.vel,0, e.m5.speed); break;
          }
        }
      };
    });

    const _objF={
      Player:{
        c(scene,s,ts,ps,os){
          let K=scene.getScaleFactor();
          Mojo.addMixin(s,"2d",[_2d.MazeRunner]);
          s.m5.heading=Mojo.RIGHT;
          s.m5.type=E_PLAYER;
          s.m5.uuid="player";
          s.m5.speed=4*K;
          _V.set(s.m5.vel,s.m5.speed, s.m5.speed);
          _V.add$(s, [Math.floor(s.width/2),
                      Math.floor(s.height/2)]);
          _S.centerAnchor(s);
          s.m5.tick=()=>{
            s["2d"].onTick();
          };
          return G.player=s;
        },
        s(){}
      },
      Monster:{
        s(){
          return _S.sprite(_S.frameSelect("monsterMaze.png",
                                          64,64, [ [128, 0], [128, 64] ])) },
        c(scene,s,ts,ps,os){
          let K=scene.getScaleFactor();
          s.m5.uuid=`e#${_.nextId()}`;
          s.m5.cmask=E_PLAYER;
          s.m5.type=E_ITEM;
          _V.set(s.scale,K,K);
          _V.add$(s,[Math.floor(s.width/2),
                     Math.floor(s.height/2)]);
          s.m5.heading = Mojo.NONE;
          s.m5.speed = 4*K;
          _S.centerAnchor(s);
          _V.set(s.m5.vel,s.m5.speed, s.m5.speed);
          Mojo.addMixin(s,"2d");
          Mojo.addMixin(s,"enemyAI");
          s.m5.boom=(col)=>{
            if(col.B.m5.uuid=="player")
              Mojo.pause();
          };
          s.m5.tick=(dt)=>{
            s["2d"].onTick();
            s["enemyAI"].onTick();
            let ca= _S.centerXY(G.player);
            let cm= _S.centerXY(s);
            let d2=_V.len2(_V.sub$(ca,cm));
            s.m5.showFrame(d2<36864*K?1:0);
          };
          Mojo.on(["bump",s],"boom",s.m5);
          return s;
        }
      }
    };

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


