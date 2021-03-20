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
    const {Scenes:Z,
           Sprites:S,
           Input:I,
           Tiles:T,
           Game:G,
           ute:_,is,EventBus}=Mojo;

    function AiCar(scene,s,ts,ps,os){
      s= G.aiCar = S.frame("tileSet.png",48,48,192,128);
      let K=scene.getScaleFactor();
      S.scaleXY(s,K,K);
      S.setXY(s, os.column*s.width, os.row*s.height);
      return s;
    }

    //dummy
    function Player(scene,s,ts,ps,os){ return s }

    function _objF(){ return {AiCar,Player} }

    function _move(car){
      car.rotation += car.m5.angVel;
      S.accXY(car,car.m5.speed * Math.cos(car.rotation),
                  car.m5.speed * Math.sin(car.rotation));
      S.velXY(car, car.m5.acc[0] * car.m5.friction[0],
                   car.m5.acc[1] * car.m5.friction[1]);
      car.x += car.m5.vel[0];
      car.y += car.m5.vel[1];
    }


    Z.defScene("level1",{
      setup(){
        let car=G.aiCar,
            K=this.getScaleFactor();
        G.targetAngle =0;
        G.prevAngle=0;
        S.frictionXY(car,0.96*K,0.96*K);
        G.aiCar.m5.moveForward = true;
        S.accXY(car,0.2*K, 0.2*K);
        S.velXY(car,0,0);
        S.centerAnchor(car);
        car.m5.tick=()=>{
          let curAngle = car.rotation * (180 / Math.PI);
          let pos = Mojo.getIndex(car.x, car.y,
                                  this.tiled.tileW,
                                  this.tiled.tileH, this.tiled.tilesInX);
          let angleMap = this.getTileLayer("Angles").data;
          let mapAngle = angleMap[pos];

          curAngle += Math.ceil(-curAngle / 360) * 360;
          if(car.m5.moveForward && car.m5.speed <= 3*K){
            car.m5.speed += 0.08*K
          }
          if(!_.feq(mapAngle,G.prevAngle)){
            G.targetAngle = mapAngle + _.randInt2(-20*K, 20*K);
            G.prevAngle = mapAngle;
          }
          let trackMap = this.getTileLayer("Tiles").data;
          let diff= curAngle - G.targetAngle;
          if(diff>0 && diff<180){
            car.m5.angVel = -0.03*K; //left
          }else{
            car.m5.angVel = 0.03*K; //right
          }
          _move(car);
          if(trackMap[pos] === 8){
            S.frictionXY(car,0.25*K, 0.25*K);
          }else{
            //more friction off track
            S.frictionXY(car,0.96*K, 0.96*K);
          }
        };
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


