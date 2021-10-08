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

  //original source: https://github.com/jakesgordon/javascript-racer
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;
    const SEGLEN=Mojo.u.SEGLEN;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.png"));
      return scene.insert(_S.opacity(_G.backDropSprite,0.15));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    window["io/czlab/racer/track"](Mojo,SEGLEN);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getLine(z){ return _G.lines[int(z/SEGLEN) % _G.lines.length] }
    const mspeed= Mojo.u.fps * SEGLEN;
    _.merge(_G, {
      getLine,
      lines: [],
      cars:[],
      centrifugal: 0.3,
      lookAhead:20,
      lapTime:0,
      totalCars: 16,
      roadWidth:  2000,
      rumbles: 3, // number of segments per red/white rumble strip
      trackLength: 0, // z length of entire track (computed)
      lanes: 3,
      fov: Math.PI/2, // field of view
      //camH  // z height of camera
      //camD  // z distance camera is from screen (computed)
      drawRange: 300,  // number of segments to draw
      pos:  0,  // current camera Z position (add playerZ to get player's absolute Z position)
      speed:  0,  // current speed
      maxSpeed: mspeed, // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
      accel:  mspeed/5,  // acceleration rate - tuned until it 'felt' right
      braking: -mspeed,  // deceleration rate when braking
      decel:  -mspeed/5, // 'natural' deceleration rate when neither accelerating, nor braking
      offRoadDecel: -mspeed/2,  // off road deceleration is somewhere in between
      offRoadLimit: mspeed/4,   // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
      W:Mojo.width,
      H:Mojo.height,
      W2:Mojo.width/2,
      H2:Mojo.height/2
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function increase(start, increment, max){
      let r= start + increment;
      while(r >= max) r -= max;
      while(r < 0) r += max;
      return r;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function overlap(x1, w1, x2, w2, percent){
      let half = (percent||1)/2,
          min1 = x1 - w1*half,
          max1 = x1 + w1*half,
          min2 = x2 - w2*half,
          max2 = x2 + w2*half;
      return ! (max1 < min2 || min1 > max2);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function updateCars(seg,dt){
      function updateCarOffset(car, carSeg, playerSeg){
        let dir,other,otherW,
            carW = scaleToRefWidth(car.w);
        if((carSeg.index - playerSeg.index) > _G.drawRange){
          return 0; //ignore when 'out of sight' of the player
        }
        for(let seg, j, i = 1 ; i < _G.lookAhead ; ++i){
          seg = _G.lines[(carSeg.index+i)%_G.SEGN];
          if(seg == playerSeg &&
             car.speed > _G.speed &&
             overlap(_G.player.x, _G.player.w, car.offset, carW, 1.2)){
            dir= _G.player.x > 0.5? -1
                                  :(_G.player.x < -0.5? 1
                                                      : (car.offset > _G.player.x ?1:-1));
            //the closer the cars (smaller i) and
            //the greated the speed ratio, the larger the offset
            return dir * 1/i * (car.speed-_G.speed)/_G.maxSpeed;
          }
          for(j = 0 ; j < seg.cars.length ; ++j){
            other= seg.cars[j];
            otherW = scaleToRefWidth(other.w);
            if(car.speed > other.speed &&
               overlap(car.offset, carW, other.offset, otherW, 1.2)){
              dir= other.offset > 0.5?-1
                                     :(other.offset < -0.5?1
                                                          :(car.offset > other.offset ? 1 : -1));
              return dir * 1/i * (car.speed-other.speed)/_G.maxSpeed;
            }
          }
        }
        // if no cars ahead, but have somehow
        // ended up off road, then steer back on
        return car.offset < -0.9? 0.1 : (car.offset > 0.9? -0.1: 0);
      }
      for(let s1,s2,car,i=0;i<_G.cars.length;++i){
        car=_G.cars[i];
        s1= getLine(car.z);
        car.offset  += updateCarOffset(car, s1, seg);
        car.z= increase(car.z, dt * car.speed, _G.trackLength);
        car.percent = (car.z%SEGLEN)/SEGLEN; //for interpolation
        s2 = getLine(car.z);
        if(s1 !== s2){
          s2.cars.push(car);
          _.disj(s1.cars,car);
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawPolygon(g, x1, y1, x2, y2, x3, y3, x4, y4, color){
      g.beginFill(color);
      g.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
      g.endFill();
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawSegment(gfx, lanes, p1, p2, color){
      function laneMarkerWidth(road, lanes){ return road/Math.max(32, 8*lanes) }
      function rumbleWidth(road, lanes){ return road/Math.max(6,  2*lanes) }
      let r1 = rumbleWidth(p1.w, lanes),
          r2 = rumbleWidth(p2.w, lanes),
          l1 = laneMarkerWidth(p1.w, lanes),
          l2 = laneMarkerWidth(p2.w, lanes);
      gfx.beginFill(color.grass);
      gfx.drawRect(0, p2.y, _G.W, p1.y - p2.y);
      gfx.endFill();
      drawPolygon(gfx, p1.x-p1.w-r1, p1.y,
                       p1.x-p1.w, p1.y,
                       p2.x-p2.w, p2.y,
                       p2.x-p2.w-r2, p2.y, color.rumble);
      drawPolygon(gfx, p1.x+p1.w+r1, p1.y,
                       p1.x+p1.w, p1.y,
                       p2.x+p2.w, p2.y,
                       p2.x+p2.w+r2, p2.y, color.rumble);
      drawPolygon(gfx, p1.x-p1.w, p1.y,
                       p1.x+p1.w, p1.y,
                       p2.x+p2.w, p2.y,
                       p2.x-p2.w,p2.y, color.road);
      if(color.lane){
        let lanew1 = p1.w*2/lanes,
            lanew2 = p2.w*2/lanes,
            lanex1 = p1.x - p1.w + lanew1,
            lanex2 = p2.x - p2.w + lanew2;
        for(let lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, ++lane)
          drawPolygon(gfx, lanex1 - l1/2, p1.y,
                           lanex1 + l1/2, p1.y,
                           lanex2 + l2/2, p2.y,
                           lanex2 - l2/2, p2.y, color.lane);
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawSprite(scene, sprite, scale, destX, destY, offsetX, offsetY, clipY){
      let t= Mojo.tcached(sprite),
          K=ratioToRoadWidth(),
          destW  = (t.width * scale * _G.W2) * K,
          destH  = (t.height * scale * _G.W2) * K;

      destX += (destW * (offsetX || 0));
      destY += (destH * (offsetY || 0));

      let s,clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
      if(clipH < destH){
        s= _S.frame(sprite, t.width, t.height-(t.height*clipH/destH),t.orig.x,t.orig.y);
        s.x=destX;
        s.y=destY;
        s.width=destW;
        s.height=destH-clipH;
        scene.insert(s);
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawPlayer(scene, speedPercent, scale, destX, destY, steer, updown){
      let resolution= _G.H/480,
          bounce = 1.5 * _.rand() * speedPercent * resolution * _.randSign();
      drawSprite(scene, "player.png", scale, destX, destY + bounce, -0.5, -1);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function project(p, camX, camY, camZ, camDepth){
      p.camera.x     = (p.world.x || 0) - camX;
      p.camera.y     = (p.world.y || 0) - camY;
      p.camera.z     = (p.world.z || 0) - camZ;
      p.screen.scale = camDepth/p.camera.z;
      p.screen.w     = Math.round(p.screen.scale * _G.roadWidth   * _G.W2);
      p.screen.x     = Math.round(_G.W2  + p.screen.scale * p.camera.x  * _G.W2);
      p.screen.y     = Math.round(_G.H2 - p.screen.scale * p.camera.y  * _G.H2);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            W2=Mojo.width/2,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Retro Racer",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,W2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame"));
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function scaleToRefWidth(sw){
      return sw * _G.SPRITES_SCALE
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function ratioToRoadWidth(){
      return _G.roadWidth * _G.SPRITES_SCALE
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        function perc(a,b){ return (a%b)/b }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          hills: _S.fillMax(_S.sprite("images/jake/hills.png")),
          trees: _S.fillMax(_S.sprite("images/jake/trees.png")),
          sky: _S.fillMax(_S.sprite("images/jake/sky.png")),
          gfx: _S.graphics(),
          initLevel(){
             let r= 1/_G.lanes,
                 camH=1000,
                 camD= 1/Math.tan(_G.fov / 2),
                 w= Mojo.tcached("player.png").width;
            _.merge(_G,{
              //the way to scale sprites by using the player's car
              //as the reference.  the player is logically as wide
              //as a lane (so if 3 lanes then 1/3), then compare
              //the sprite's width to the player's width
              SPRITES_SCALE: r/w, //0.00375
              camH,
              camD,
              //player x offset from center of road
              //(-1 to 1 to stay independent of roadWidth)
              //player relative z distance from camera (computed)
              player: {w: r, x:0, y:0, z: camH * camD }
            });
            _G.resetRoad();
          },
          resetGfx(){
            self.insert(this.sky);
            self.insert(this.hills);
            self.insert(this.trees);
            self.insert(this.gfx.clear());
          },
          draw(){
            let baseLine = getLine(_G.pos),
                basePerc= perc(_G.pos,SEGLEN),
                x = 0,
                maxY = _G.H,
                dx = - (baseLine.curve * basePerc),
                playerSeg= getLine(_G.pos+_G.player.z),
                playerPerc= perc(_G.pos+_G.player.z,SEGLEN);
            _G.player.y = _M.lerp(playerSeg.p1.world.y, playerSeg.p2.world.y, playerPerc);
            this.resetGfx();
            for(let cx,cy, cz, seg,n = 0; n < _G.drawRange; ++n){
              seg= _G.lines[(baseLine.index + n) % _G.SEGN];
              seg.clip = maxY;
              cx= _G.player.x * _G.roadWidth;
              cy= _G.player.y + _G.camH;
              cz= _G.pos - (seg.index < baseLine.index ? _G.trackLength : 0);
              project(seg.p1, cx - x, cy, cz, _G.camD);
              project(seg.p2, cx - x - dx, cy, cz, _G.camD);
              x  += dx;
              dx += seg.curve;
              if(seg.p2.screen.y >= maxY || // clip by (already rendered) segment
                 seg.p1.camera.z <= _G.camD){continue} // behind us
              drawSegment(this.gfx, _G.lanes, seg.p1.screen, seg.p2.screen, seg.color);
              maxY = seg.p2.screen.y;
            }
            for(let ss,d,s,i,c,seg,n = (_G.drawRange-1); n > 0 ; --n){
              seg= _G.lines[(baseLine.index + n) % _G.SEGN];
              seg.cars.forEach(car=>{
                s= car.sprite;
                ss=_M.lerp(seg.p1.screen.scale, seg.p2.screen.scale, car.percent);
                drawSprite(self, s, ss,
                           _M.lerp(seg.p1.screen.x, seg.p2.screen.x,car.percent) +
                           (ss * car.offset * _G.roadWidth * _G.W2),
                           _M.lerp(seg.p1.screen.y, seg.p2.screen.y,car.percent), -0.5, -1, seg.clip);
              });
              for(i = 0 ; i < seg.sprites.length ; ++i){
                s= seg.sprites[i];
                drawSprite(self, s.source,
                           seg.p1.screen.scale,
                           seg.p1.screen.x + (seg.p1.screen.scale * s.offset * _G.roadWidth * _G.W2),
                           seg.p1.screen.y,
                           (s.offset < 0 ? -1 : 0), -1, seg.clip);
              }
              if(seg == playerSeg){
                d=_G.camD/_G.player.z;
                drawPlayer(self, _G.speed/_G.maxSpeed,
                           d,
                           _G.W2,
                           _G.H2 - (d * _M.lerp(playerSeg.p1.camera.y, playerSeg.p2.camera.y, playerPerc) * _G.H2),
                           _G.speed * (_G.keyLeft ? -1 : _G.keyRight ? 1 : 0),
                           playerSeg.p2.world.y - playerSeg.p1.world.y);
              }
            }
          },
          update(dt){
            let n, car, carW, sprite, spriteW;
            let playerSeg= getLine(_G.pos + _G.player.z);
            let speedPercent = _G.speed/_G.maxSpeed;
            let startPos=_G.pos,
                dx = dt * 2 * speedPercent;
            // at top speed, should be able to cross
            // from left to right (-1 to 1) in 1 second

            updateCars(playerSeg,dt);

            _G.pos = increase(_G.pos, dt * _G.speed, _G.trackLength);

            _G.player.x += _I.keyDown(_I.LEFT) ? -dx : (_I.keyDown(_I.RIGHT) ? dx : 0);
            _G.player.x -= (dx * speedPercent * playerSeg.curve * _G.centrifugal);
            _G.speed = _I.keyDown(_I.SPACE) ? Mojo.accel(_G.speed, _G.accel, dt)
                                            : (_I.keyDown(_I.DOWN) ? Mojo.accel(_G.speed, _G.braking, dt)
                                                                   : Mojo.accel(_G.speed, _G.decel, dt));

            if(_G.player.x < -1 || _G.player.x > 1){
              if(_G.speed > _G.offRoadLimit)
                _G.speed = Mojo.accel(_G.speed, _G.offRoadDecel, dt);
              for(n=0; n < playerSeg.sprites.length ; ++n){
                sprite  = playerSeg.sprites[n];
                spriteW = scaleToRefWidth(sprite.w);
                if(overlap(_G.player.x, _G.player.w, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)){
                  _G.speed = _G.maxSpeed/5;
                  // stop in front of sprite (at front of segment)
                  _G.pos= increase(playerSeg.p1.world.z, -_G.player.z, _G.trackLength);
                  break;
                }
              }
            }
            for(n=0; n < playerSeg.cars.length; ++n){
              car  = playerSeg.cars[n];
              carW = scaleToRefWidth(car.w);
              if(_G.speed > car.speed){
                if(overlap(_G.player.x, _G.player.w, car.offset, carW, 0.8)){
                  _G.speed= car.speed * (car.speed/_G.speed);
                  _G.pos= increase(car.z, -_G.player.z, _G.trackLength);
                  break;
                }
              }
            }
            _G.player.x = _M.clamp(-3,3,_G.player.x);// dont ever let it go too far out of bounds
            _G.speed = _M.clamp(0, _G.maxSpeed,_G.speed); // or exceed maxSpeed

            if(_G.pos > _G.player.z){
              if(_G.lapTime && (startPos< _G.player.z)){
                //_G.lastLapTime= _G.lapTime;
                _G.lapTime = 0;
              }else{
                _G.lapTime += dt;
              }
            }

          }
        });
        this.g.initLevel();
        _Z.runScene("HUD");
      },
      postUpdate(dt){
        this.removeChildren();
        this.g.update(dt);
        this.g.draw();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor(),
            s= _S.bmpText("0",{fontName:"unscii",fontSize:36*K});
        _V.set(s, 0,0);
        this.insert(this.g.lapTime=s);
      },
      postUpdate(){
        this.g.lapTime.text=`Lap Time: ${Number(_G.lapTime).toFixed(3)}`;
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bg.png","player.png","click.mp3","images/jake/sky.png","images/jake/hills.png","images/jake/trees.png", "images/jake/jake.png","images/jake/jake.json"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"x",
    SEGLEN:200,
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


