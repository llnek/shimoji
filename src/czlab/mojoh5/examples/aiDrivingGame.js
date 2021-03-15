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

  function scenes(Mojo) {
    const Z=Mojo.Scenes, S=Mojo.Sprites, I=Mojo.Input, T=Mojo.Tiles;
    const G=Mojo.Game;
    const {ute:_,is,EventBus}=Mojo;

    function AiCar(scene,s,ts,ps,os){
      let K=scene.getScaleFactor();
      s= G.aiCar = S.frame("tileSet.png",48,48,192,128);
      s.scale.x=K;
      s.scale.y=K;
      s.x=os.column*s.width;
      s.y=os.row*s.height;
      return s;
    }

    function Player(scene,s,ts,ps,os){
      s= G.car= S.frame("tileSet.png", 48,48,192, 192);
      let K=scene.getScaleFactor();
      s.scale.x=K;
      s.scale.y=K;
      s.x=os.column*s.width;
      s.y=os.row*s.height;
      return s;
    }

    function _objF(){
      return {AiCar,Player}
    }

    function _config(car,K){
      car.m5.vel[0] = 0;
      car.m5.vel[1] = 0;
      car.m5.acc[0]= 0.2*K;
      car.m5.acc[1]= 0.2*K;
      car.m5.angVel= 0;
      car.m5.friction[0] = 0.96*K;
      car.m5.friction[1] = 0.96*K;
      car.m5.speed = 0;
      car.anchor.set(0.5);
      car.m5.moveForward = false;
    }

    function _move(car){
      car.rotation += car.m5.angVel;
      car.m5.acc[0]= car.m5.speed * Math.cos(car.rotation);
      car.m5.acc[1]= car.m5.speed * Math.sin(car.rotation);
      car.m5.vel[0] =car.m5.acc[0] * car.m5.friction[0];
      car.m5.vel[1] = car.m5.acc[1] * car.m5.friction[1];
      car.x += car.m5.vel[0];
      car.y += car.m5.vel[1];
    }

    Z.defScene("level1",{
      setup(){
        let K=this.getScaleFactor();

        G.previousMapAngle=0;
        G.targetAngle =0;
        _config(G.aiCar,K);
        G.aiCar.m5.moveForward = true;
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let K=this.getScaleFactor();
        if(G.aiCar.m5.moveForward && G.aiCar.m5.speed <= 3*K){
          G.aiCar.m5.speed += 0.08*K;
        }
        let curAngle = G.aiCar.rotation * (180 / Math.PI);
        curAngle += Math.ceil(-curAngle / 360) * 360;
        let aiCarIndex = Mojo.getIndex(G.aiCar.x, G.aiCar.y,
                                       this.tiled.tileW,
                                       this.tiled.tileH, this.tiled.tileInX);
        let angleMap = this.getTileLayer("Angles").data;
        let mapAngle = angleMap[aiCarIndex];
        if(!_.feq(mapAngle,G.previousMapAngle)){
          G.targetAngle = mapAngle + _.randInt2(-20*K, 20*K);
          G.previousMapAngle = mapAngle;
        }
        let diff= curAngle - G.targetAngle;
        if(diff> 0 && diff< 180){
          G.aiCar.m5.angVel = -0.03*K; //left
        }else{
          G.aiCar.m5.angVel = 0.03*K; //right
        }
        _move(G.aiCar);
        let trackMap = this.getTileLayer("Tiles").data;
        if(trackMap[aiCarIndex] === 8){
          G.aiCar.m5.friction[0] = 0.25*K;
          G.aiCar.m5.friction[1] = 0.25*K;
        }else{
          //more friction off track
          G.aiCar.m5.friction[0] = 0.96*K;
          G.aiCar.m5.friction[1] = 0.96*K;
        }
      }
    },{centerStage:true,tiled:{name:"aiDriving.json",factory:_objF}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["tileSet.png","aiDriving.json"],
      arena: { width:640, height:512 },
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);

