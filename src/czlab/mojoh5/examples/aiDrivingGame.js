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
    const {Scenes:Z,
           Sprites:S,
           Input:I,
           Tiles:T,
           Game:G,
           v2:_V,
           ute:_,is,EventBus}=Mojo;

    const _objF= {
      AiCar:{
        s(){},
        c(scene,s,ts,ps,os){
          s=G.aiCar = S.frame("tileSet.png",48,48,192,128);
          let K=scene.getScaleFactor();
          _V.set(s,K,K);
          _V.set(s, os.column*s.width, os.row*s.height);
          return s;
        }
      },
      Player:{
        s(){},
        c(){}
      }
    };

    function _move(car){
      car.rotation += car.m5.angVel;
      _V.set(car.m5.acc,car.m5.speed * Math.cos(car.rotation),
                        car.m5.speed * Math.sin(car.rotation));
      _V.copy(car.m5.vel,_V.mul(car.m5.acc,car.m5.friction));
      _V.add$(car,car.m5.vel);
    }

    Z.scene("level1",{
      setup(){
        let car=G.aiCar,
            K=this.getScaleFactor();
        G.targetAngle =0;
        G.prevAngle=0;
        _V.set(car.m5.friction,0.96*K,0.96*K);
        G.aiCar.g.moveForward = true;
        _V.set(car.m5.acc,0.2*K, 0.2*K);
        _V.set(car.m5.vel,0,0);
        S.centerAnchor(car);
        car.m5.tick=()=>{
          let pos = Mojo.getIndex(car.x, car.y,
                                  this.tiled.tileW,
                                  this.tiled.tileH, this.tiled.tilesInX);
          let angleMap = this.getTileLayer("Angles").data;
          let mapAngle = angleMap[pos];
          let curAngle = car.angle;
          curAngle += Math.ceil(-curAngle / 360) * 360;
          if(car.g.moveForward && car.m5.speed <= 3*K){
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
          if(trackMap[pos] == 8){
            _V.set(car.m5.friction,0.25*K, 0.25*K);
          }else{
            //more friction off track
            _V.set(car.m5.friction,0.96*K, 0.96*K);
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
        Mojo.Scenes.run("level1");
      }
    })
  });


})(this);


