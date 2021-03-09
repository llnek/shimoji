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
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input, _2d=Mojo["2d"],_T=Mojo.Tiles;
    let {ute:_,is,EventBus}=Mojo;

    //0,12
    function Player(scene,p,ts,ps,o){
      Mojo.addMixin(p,"platformer");
      Mojo.addMixin(p,"2d");
      p.m5.type=E_PLAYER;
      p.m5.cmask=E_TOWER;
      p.m5.uuid="player";
      p.m5.speed=200;
      p.m5.gravity[1]=200;
      p.m5.step=function(dt){
        p["2d"].motion(dt);
        p["platformer"].motion(dt);
      };
      return p;
    }

    //5,1
    function Tower(scene,s,ts,ps,o){
      s.m5.type=E_TOWER;
      s.m5.uuid="tower";
      s.m5.sensor=true;
      s.m5.onSensor=()=>{
        Mojo.pause();
      };
      EventBus.sub(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }

    //32,3,22,3
    function Enemy(scene,e,ts,ps,o){
      Mojo.addMixin(e,"aiBounce",true,false);
      Mojo.addMixin(e,"2d");
      e.m5.uuid=`e#${_.nextId()}`;
      e.m5.cmask=E_PLAYER|E_ENEMY;
      e.m5.type=E_ENEMY;
      e.m5.gravity[1]=60;
      e.m5.speed=100*scene.getScaleFactor();
      e.m5.vel[0]= e.m5.speed;
      e.m5.step=function(dt){
        e["2d"].motion(dt);
      };
      e.m5.onbump=function(col){
        if(col.B.m5.uuid=="player"){
          //scene.remove(col.B);
          console.log("die!!!");
          Mojo.pause();
          //_Z.runScene("endGame",{msg: "You Died"});
        }
      };
      e.m5.onbtop=function(col){
        if(col.B.m5.uuid=="player"){
          scene.remove(e);
          col.B.m5.vel[1] = -300;
        }
      };
      EventBus.sub(["bump.top",e],"onbtop",e.m5);
      EventBus.sub(["bump.left,bump.right,bump.bottom",e], "onbump",e.m5);
      return e;
    }

    _Z.defScene("bg",{
      setup(){
        let w= this.wall=_S.tilingSprite("background-wall.png");
        _S.setSize(w,Mojo.width,Mojo.height);
        this.insert(w);
      }
    });

    function _objFactory(s){
      return {Player,Enemy,Tower}
    }

    _Z.defScene("level1",{
      setup(){
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //this.camera.follow(this.player);
      }
    },{sgridX:160,sgridY:160,centerStage:true,
       tiled:{name:"platformer.json",factory:_objFactory}});

    _Z.defScene("endGame",()=>{
    });

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


