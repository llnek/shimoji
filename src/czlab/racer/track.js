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

;(function(window,UNDEF){

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
    const FLORA = ["tree1.png", "tree2.png", "dead_tree1.png", "dead_tree2.png",
                   "palm_tree.png", "bush1.png", "bush2.png", "cactus.png",
                   "stump.png", "boulder1.png", "boulder2.png", "boulder3.png"];

    const ROAD= { E:25, M:50, H:100 };
    const BEND= { E:2, M:4, H:6 };
    const HILL= { E:20, M:40, H:60 };

    const C_LIGHT={ road: _S.color("#6B6B6B"), grass: _S.color("#10AA10"),
                    rumble: _S.color("#555555"), lane: _S.color("#CCCCCC")  };
    const C_DARK={ road: _S.color("#696969"), grass: _S.color("#009A00"), rumble: _S.color("#bbbbbb") };
    const C_START= { road: _S.SomeColors.white,   grass: _S.SomeColors.white,   rumble: _S.SomeColors.white };
    const C_FINISH= { road: _S.SomeColors.black,   grass: _S.SomeColors.black,   rumble: _S.SomeColors.yellow };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const easeInOut=(a,b,perc)=> a + (b-a)*((-Math.cos(perc*Math.PI)/2) + 0.5);
    const easeIn=(a,b,perc)=> a + (b-a)*Math.pow(perc,2);
    const lastY=()=> _G.lines.length == 0 ? 0 : _.last(_G.lines).p2.world.y;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const addBend=(n=ROAD.M, curve=BEND.M, height=0)=> addStretch(n, curve, height);
    const addHill=(n=ROAD.M, height=HILL.M)=> addStretch(n,0, height);
    const addRoad=(n=ROAD.M)=> addStretch(n,0, 0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const addLowRollingHills=(n=ROAD.E, height=HILL.E)=>
      [[n, 0, height/2],
       [n, 0, -height],
       [n, BEND.E,  height],
       [n, 0, 0],
       [n, -BEND.E,  height/2],
       [n, 0, 0]].forEach(a=>addStretch(...a));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const addSBends=()=>
      [[ROAD.M, -BEND.E, 0],
       [ROAD.M, BEND.M, HILL.M],
       [ROAD.M, BEND.E, -HILL.E],
       [ROAD.M, -BEND.E, HILL.M],
       [ROAD.M, -BEND.M, -HILL.M]].forEach(a=>addStretch(...a));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const addBumps=()=>
      [[10, 0,  5],
       [10, 0, -2],
       [10, 0, -5],
       [10, 0,  8],
       [10, 0,  5],
       [10, 0, -7],
       [10, 0,  5],
       [10, 0, -2]].forEach(a=>addStretch(...a));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const addDownhillToEnd=(n=200)=> addStretch(n, -BEND.E, - lastY()/SEGLEN);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addStretch(enter, curve, y){
      function newSeg(curve,Y){
        let n = _G.lines.length;
        _G.lines.push({
          index: n,
          p1:{ world: { y: lastY(), z:  n * SEGLEN }, camera: {}, screen: {} },
          p2:{ world: { y: Y, z: (n+1) * SEGLEN }, camera: {}, screen: {} },
          curve,
          sprites: [],
          cars: [],
          color: _M.ndiv(n,_G.rumbles)%2 ? C_DARK : C_LIGHT
        });
      }
      let hold=enter,
        leave=enter,
        startY= lastY(),
        total = enter + hold + leave,
        n,endY= startY + (_.toNum(y, 0) * SEGLEN);
      for(n = 0 ; n < enter ; ++n)
        newSeg(easeIn(0, curve, n/enter), easeInOut(startY, endY, n/total));
      for(n = 0 ; n < hold  ; ++n)
        newSeg(curve, easeInOut(startY, endY, (enter+n)/total));
      for(n = 0 ; n < leave ; ++n)
        newSeg(easeInOut(curve, 0, n/leave), easeInOut(startY, endY, (enter+hold+n)/total));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addTrees(){
      function add(n, sprite, offset){
        _G.lines[n].sprites.push({source: sprite, offset, w: Mojo.tcached(sprite).width })
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
          add(n, _.randItem(FLORA), _.randSign * (2 + _.rand() * 5));
      }
      for(n = 1000 ; n < (_G.lines.length-50) ; n += 100){
        if(_.rand()>0.7){
          side = _.randSign();
          for(let i = 0 ; i < 20 ; ++i){
            if(_.rand()<0.3){
              sprite = _.randItem(FLORA);
              offset = side * (1.5 + _.rand());
              add(n + _.randInt2(0, 50), sprite, offset);
            }
          }
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addCars(){
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
    _G.initTrack=function(){
      _G.lines.length=0;
      addRoad(ROAD.E);
      addLowRollingHills();
      addSBends();
      addBend(ROAD.M, BEND.M, HILL.E);
      addBumps();
      addLowRollingHills();
      addBend(ROAD.H*2, BEND.M, HILL.M);
      addRoad();
      addHill(ROAD.M, HILL.H);
      addSBends();
      addBend(ROAD.H, -BEND.M, 0);
      addHill(ROAD.H, HILL.H);
      addBend(ROAD.H, BEND.M, -HILL.E);
      addBumps();
      addHill(ROAD.H, -HILL.M);
      addRoad();
      addSBends();
      addDownhillToEnd();

      addTrees();
      addCars();

      _G.lines[_G.getLine(_G.player.z).index + 2].color = C_START;
      _G.lines[_G.getLine(_G.player.z).index + 3].color = C_START;

      for(let n = 0 ; n < _G.rumbles ; ++n)
        _G.lines[_G.lines.length-1-n].color = C_FINISH;

      _G.SEGN=_G.lines.length;
      _G.trackLength = _G.SEGN * SEGLEN;
    };

  }

})(this);


