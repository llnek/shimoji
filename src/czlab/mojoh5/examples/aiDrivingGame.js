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
    const {ute:_,EventBus}=Mojo;

    Z.defScene("level1",{
      setup(){
        this.previousMapAngle=0;
        this.targetAngle =0;
        this.world = T.mockTiledWorld(64,64,10,8);
        let tiled= this.world.tiled;
        let layers = tiled.layers = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //The character layer. `3` represents the player's car,
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //Angles map
        [45, 45, 45, 45, 45, 45, 45, 45, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 0, 0, 0, 0, 0, 0, 90, 135, 135, 315, 315, 270, 315, 315, 315, 315, 90, 90, 135, 315, 315, 270, 135, 135, 135, 135, 90, 90, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 315, 270, 180, 180, 180, 180, 180, 180, 135, 315, 270, 270, 225, 225, 225, 225, 225, 225, 225]];
        layers.forEach(layer => {
          layer.forEach((gid, index) => {
            if(gid !== 0){
              let sprite;
              let column = index % tiled.tilesInX;
              let row = Math.floor(index / tiled.tilesInX);
              let x = column * tiled.tileW;
              let y = row * tiled.tileH;
              switch(gid){
              case 1://track
                sprite = S.frame("tileSet.png", 64,64,192, 64);
              break;
              case 2://grass
                sprite = S.frame("tileSet.png", 64,64,192, 0);
              break;
              case 3:
                this.car=sprite = S.frame("tileSet.png", 48,48,192, 192);
              break;
              case 4:
                this.aiCar = sprite = S.frame("tileSet.png", 48,48,192, 128);
              break;
              }
              if(sprite){
                sprite.x = x;
                sprite.y = y;
                this.world.addChild(sprite);
              }
            }
          });
        });
        this.insert(this.world);
        this._addCarProperties(this.car);
        this._addCarProperties(this.aiCar);
        this.aiCar.m5.moveForward = true;

        let leftArrow = I.keybd(I.keyLEFT, ()=>{
          this.car.m5.angVel = -0.05;
        }, ()=>{
          if(!rightArrow.isDown) this.car.m5.angVel = 0;
        });
        let rightArrow = I.keybd(I.keyRIGHT, ()=>{
          this.car.m5.angVel = 0.05;
        }, ()=>{
          if(!leftArrow.isDown) this.car.m5.angVel = 0;
        });
        let upArrow = I.keybd(I.keyUP, ()=>{
          this.car.m5.moveForward = true;
        }, ()=>{
          this.car.m5.moveForward = false;
        });
        //let downArrow = I.keybd(I.keyDOWN);

        EventBus.sub(["post.update",this],"postUpdate");
      },
      _addCarProperties(car){
        car.m5.vel[0] = 0;
        car.m5.vel[1] = 0;
        car.m5.acc[0]= 0.2;
        car.m5.acc[1]= 0.2;
        car.m5.angVel= 0;
        car.m5.friction[0] = 0.96;
        car.m5.friction[1] = 0.96;
        car.m5.speed = 0;
        car.anchor.set(0.5);
        car.m5.moveForward = false;
      },
      _move(car){
        car.rotation += car.m5.angVel;
        car.m5.acc[0]= car.m5.speed * Math.cos(car.rotation);
        car.m5.acc[1]= car.m5.speed * Math.sin(car.rotation);
        car.m5.vel[0] =car.m5.acc[0] * car.m5.friction[0];
        car.m5.vel[1] = car.m5.acc[1] * car.m5.friction[1];
        car.x += car.m5.vel[0];
        car.y += car.m5.vel[1];
      },
      postUpdate(dt) {
        if(this.aiCar.m5.moveForward && this.aiCar.m5.speed <= 3) {
          this.aiCar.m5.speed += 0.08;
        }
        //aicar's current angle, in degrees
        let currentAngle = this.aiCar.rotation * (180 / Math.PI);
        currentAngle += Math.ceil(-currentAngle / 360) * 360;
        let aiCarIndex = Mojo.getIndex(this.aiCar.x, this.aiCar.y, 64, 64, 10);
        let angleMap = this.world.tiled.layers[2];
        let mapAngle = angleMap[aiCarIndex];
        if(mapAngle !== this.previousMapAngle) {
          this.targetAngle = mapAngle + _.randInt2(-20, 20);
          this.previousMapAngle = mapAngle;
        }
        let difference = currentAngle - this.targetAngle;
        if(difference > 0 && difference < 180) {
          this.aiCar.m5.angVel = -0.03; //left
        }else{
          this.aiCar.m5.angVel = 0.03; //right
        }
        this._move(this.aiCar);

        if(this.car.m5.moveForward) {
          this.car.m5.speed += 0.05;
        }else{
          //decelarate
          this.car.m5.speed *= this.car.m5.friction[0];
        }
        this._move(this.car);

        let carIndex = Mojo.getIndex(this.car.x, this.car.y, 64, 64, 10);
        let trackMap = this.world.tiled.layers[0];
        if(trackMap[aiCarIndex] === 1) {
          this.car.m5.friction[0] = 0.25;
          this.car.m5.friction[1] = 0.25;
          this.aiCar.m5.friction[0] = 0.25;
          this.aiCar.m5.friction[1] = 0.25;
        }else{
          //more friction off track
          this.car.m5.friction[0] = 0.96;
          this.car.m5.friction[1] = 0.96;
          this.aiCar.m5.friction[0] = 0.96;
          this.aiCar.m5.friction[1] = 0.96;
        }
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["tileSet.png"],
      arena: { width:640, height:512 },
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });


})(this);

