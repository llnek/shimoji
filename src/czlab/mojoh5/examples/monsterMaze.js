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
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,G=Mojo.Game,T=Mojo.Tiles,_2d=Mojo["2d"];
    const {ute:_,is,EventBus}=Mojo;

    const E_PLAYER=1,
      E_ITEM=2;

    function Player(scene,s,ts,ps,os){
      let K=scene.getScaleFactor();
      Mojo.addMixin(s,"2dControls",false);
      Mojo.addMixin(s,"2d");
      s.m5.type=E_PLAYER;
      s.m5.cmask=E_ITEM;
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
      return s;
    }
    function Monster(scene,s,ts,ps,os){
      s.m5.sensor=true;
      s.m5.type=E_ITEM;
      s.m5.onSensor=()=>{
        scene.remove(s)
      };
      EventBus.sub(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }
    function _objF(){
      return {Player,Monster}
    }

    Z.defScene("level1", {
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


