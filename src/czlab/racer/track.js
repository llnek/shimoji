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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //original source: https://github.com/jakesgordon/javascript-racer
  window["io/czlab/racer/track"]= function(Mojo,SEGLEN){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const CARS = ["car01.png","car02.png","car03.png","car04.png","semi.png","truck.png"];
    const PLANTS = ["tree1.png", "tree2.png",
                    "dead_tree1.png", "dead_tree2.png",
                    "palm_tree.png",
                    "bush1.png", "bush2.png", "cactus.png",
                    "stump.png", "boulder1.png", "boulder2.png", "boulder3.png"];

    const ROAD= { NONE:0, EASY:25, NORMAL:50, HARD:100 };
    const HILL= { NONE:0, EASY:20, NORMAL:40, HARD:60 };
    const CURVE= { NONE:0, EASY:2, NORMAL:4, HARD:6 };

    const COLORS_LIGHT={ road: _S.color("#6B6B6B"), grass: _S.color("#10AA10"),
                         rumble: _S.color("#555555"), lane: _S.color("#CCCCCC")  };
    const COLORS_DARK={ road: _S.color("#696969"), grass: _S.color("#009A00"), rumble: _S.color("#bbbbbb") };
    const COLORS_START= { road: _S.color("white"),   grass: _S.color("white"),   rumble: _S.color("white") };
    const COLORS_FINISH= { road: _S.color("black"),   grass: _S.color("black"),   rumble: _S.color("yellow") };
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function lastY(){ return _G.lines.length == 0 ? 0 : _G.lines[_G.lines.length-1].p2.world.y }
    function easeInOut(a,b,percent){ return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5) }
    function easeIn(a,b,percent){ return a + (b-a)*Math.pow(percent,2) }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addStraight(n){
      n = n || ROAD.NORMAL;
      addRoad(n, n, n, 0, 0);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addHill(n, height){
      n= n || ROAD.NORMAL;
      addRoad(n, n, n, 0, height || HILL.NORMAL);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addCurve(n, curve, height){
      n = n || ROAD.NORMAL;
      addRoad(n, n, n, curve  || CURVE.NORMAL, height || HILL.NONE);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addLowRollingHills(n, height){
      height = height || HILL.EASY;
      n= n || ROAD.EASY;
      addRoad(n, n, n,  0, height/2);
      addRoad(n, n, n,  0, -height);
      addRoad(n, n, n,  CURVE.EASY,  height);
      addRoad(n, n, n,  0, 0);
      addRoad(n, n, n, -CURVE.EASY,  height/2);
      addRoad(n, n, n,  0, 0);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addSCurves(){
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL, -CURVE.EASY, HILL.NONE);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL, CURVE.NORMAL, HILL.NORMAL);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL, CURVE.EASY, -HILL.EASY);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL, -CURVE.EASY, HILL.NORMAL);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL, -CURVE.NORMAL, -HILL.NORMAL);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addBumps(){
      addRoad(10, 10, 10, 0,  5);
      addRoad(10, 10, 10, 0, -2);
      addRoad(10, 10, 10, 0, -5);
      addRoad(10, 10, 10, 0,  8);
      addRoad(10, 10, 10, 0,  5);
      addRoad(10, 10, 10, 0, -7);
      addRoad(10, 10, 10, 0,  5);
      addRoad(10, 10, 10, 0, -2);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addDownhillToEnd(n){
      n= n || 200;
      addRoad(n, n, n, -CURVE.EASY, - lastY()/SEGLEN);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addRoad(enter, hold, leave, curve, y){
      function newSeg(curve,Y){
        let n = _G.lines.length;
        _G.lines.push({
          index: n,
          p1:{ world: { y: lastY(), z:  n * SEGLEN }, camera: {}, screen: {} },
          p2:{ world: { y: Y, z: (n+1) * SEGLEN }, camera: {}, screen: {} },
          curve,
          sprites: [],
          cars: [],
          color: int(n/_G.rumbles)%2 ? COLORS_DARK : COLORS_LIGHT
        });
      }
      let startY= lastY();
      let endY= startY + (_.toNum(y, 0) * SEGLEN);
      let n, total = enter + hold + leave;
      for(n = 0 ; n < enter ; ++n)
        newSeg(easeIn(0, curve, n/enter), easeInOut(startY, endY, n/total));
      for(n = 0 ; n < hold  ; ++n)
        newSeg(curve, easeInOut(startY, endY, (enter+n)/total));
      for(n = 0 ; n < leave ; ++n)
        newSeg(easeInOut(curve, 0, n/leave), easeInOut(startY, endY, (enter+hold+n)/total));
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function resetTrees(){
      function add(n, sprite, offset){
        _G.lines[n].sprites.push({source: sprite, offset, w: Mojo.tcached(sprite).width });
      }
      let n, side, sprite, offset;
      for(n = 10; n < 200; n += 4 + int(n/100)){
        if(_.rand()<0.3){
          add(n, "palm_tree.png", 0.5 + _.rand()*0.5);
          add(n, "palm_tree.png", 1 + _.rand()*2);
        }
      }
      for(n = 250 ; n < 1000 ; n += 5){
        if(_.rand()>0.7){
          add(n,"column.png", 1.1);
          add(n + _.randInt2(0,5), "tree1.png", -1 - _.rand() * 2);
          add(n + _.randInt2(0,5), "tree2.png", -1 - _.rand() * 2);
        }
      }
      for(n = 200 ; n < _G.lines.length ; n += 3){
        if(_.rand()<0.3)
          add(n, _.randItem(PLANTS), _.randSign * (2 + _.rand() * 5));
      }
      for(n = 1000 ; n < (_G.lines.length-50) ; n += 100){
        if(_.rand()>0.7){
          side = _.randSign();
          for(let i = 0 ; i < 20 ; ++i){
            if(_.rand()<0.3){
              sprite = _.randItem(PLANTS);
              offset = side * (1.5 + _.rand());
              add(n + _.randInt2(0, 50), sprite, offset);
            }
          }
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function resetCars(){
      let t,n, car, segment, offset, z, sprite, speed;
      _G.cars.length=0;
      for(n = 0; n < _G.totalCars; ++n){
        offset = _.rand() * _.randSign()*0.8;
        z = int(_.rand() * _G.lines.length) * SEGLEN;
        sprite = _.randItem(CARS);
        speed  = _G.maxSpeed/4 + _.rand() * _G.maxSpeed/(sprite == "semi.png" ? 4 : 2);
        car = { offset, z, sprite, speed, w: Mojo.tcached(sprite).width};
        _G.getLine(car.z).cars.push(car);
        _G.cars.push(car);
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.resetRoad=function(){
      _G.lines.length=0;
      addStraight(ROAD.EASY);
      addLowRollingHills();
      addSCurves();
      addCurve(ROAD.NORMAL, CURVE.NORMAL, HILL.EASY);
      addBumps();
      addLowRollingHills();
      addCurve(ROAD.HARD*2, CURVE.NORMAL, HILL.NORMAL);
      addStraight();
      addHill(ROAD.NORMAL, HILL.HARD);
      addSCurves();
      addCurve(ROAD.HARD, -CURVE.NORMAL, HILL.NONE);
      addHill(ROAD.HARD, HILL.HARD);
      addCurve(ROAD.HARD, CURVE.NORMAL, -HILL.EASY);
      addBumps();
      addHill(ROAD.HARD, -HILL.NORMAL);
      addStraight();
      addSCurves();
      addDownhillToEnd();

      resetTrees();
      resetCars();

      _G.lines[_G.getLine(_G.player.z).index + 2].color = COLORS_START;
      _G.lines[_G.getLine(_G.player.z).index + 3].color = COLORS_START;
      for(let n = 0 ; n < _G.rumbles ; ++n)
        _G.lines[_G.lines.length-1-n].color = COLORS_FINISH;

      _G.SEGN=_G.lines.length;
      _G.trackLength = _G.SEGN * SEGLEN;
    };

  }

})(this);


