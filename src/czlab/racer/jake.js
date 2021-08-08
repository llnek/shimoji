(function(window){

  "use strict";

  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           _M:_M,
           ute:_,is}=Mojo;

    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    const CARS = ["car01.png","car02.png","car03.png","car04.png","semi.png","truck.png"];
    const PLANTS = ["tree1.png", "tree2.png",
                            "dead_tree1.png", "dead_tree2.png",
                            "palm_tree.png",
                            "bush1.png", "bush2.png", "cactus.png",
                            "stump.png", "boulder1.png", "boulder2.png", "boulder3.png"];
    const ROAD= { NONE:0, EASY:25, NORMAL:50, HARD:100 };
    const HILL= { NONE:0, EASY:20, NORMAL:40, HARD:60 };
    const CURVE= { NONE:0, EASY:2, NORMAL:4, HARD:6 };

    const COLORS = {
      SKY:  _S.color("#72D7EE"),
      TREE: _S.color("#005108"),
      FOG:  _S.color("#005108"),
      LIGHT:  { road: _S.color("#6B6B6B"), grass: _S.color("#10AA10"), rumble: _S.color("#555555"), lane: _S.color("#CCCCCC")  },
      DARK:   { road: _S.color("#696969"), grass: _S.color("#009A00"), rumble: _S.color("#BBBBBB") },
      START:  { road: _S.color("white"),   grass: _S.color("white"),   rumble: _S.color("white") },
      FINISH: { road: _S.color("black"),   grass: _S.color("black"),   rumble: _S.color("black") }
    };

    const SEGLEN=Mojo.u.SEGLEN;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //utils
    function increase(start, increment, max){
      let r= start + increment;
      while(r >= max) r -= max;
      while(r < 0) r += max;
      return r;
    }
    function easeIn(a,b,percent){ return a + (b-a)*Math.pow(percent,2) }
    function easeOut(a,b,percent){ return a + (b-a)*(1-Math.pow(1-percent,2)) }
    function easeInOut(a,b,percent){ return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5) }
    function lastY(){ return _G.lines.length == 0 ? 0 : _G.lines[_G.lines.length-1].p2.world.y }

    function overlap(x1, w1, x2, w2, percent){
      let half = (percent || 1)/2;
      let min1 = x1 - (w1*half);
      let max1 = x1 + (w1*half);
      let min2 = x2 - (w2*half);
      let max2 = x2 + (w2*half);
      return ! ((max1 < min2) || (min1 > max2));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addStraight(n){
      n = n || ROAD.NORMAL;
      addRoad(n, n, n, 0, 0);
    }
    function addHill(n, height){
      n= n || ROAD.NORMAL;
      addRoad(n, n, n, 0, height || HILL.NORMAL);
    }
    function addCurve(n, curve, height){
      n = n || ROAD.NORMAL;
      addRoad(n, n, n, curve  || CURVE.NORMAL, height || HILL.NONE);
    }
    function addLowRollingHills(n, height){
      n= n || ROAD.EASY;
      height = height || HILL.EASY;
      addRoad(n, n, n,  0, height/2);
      addRoad(n, n, n,  0, -height);
      addRoad(n, n, n,  CURVE.EASY,  height);
      addRoad(n, n, n,  0, 0);
      addRoad(n, n, n, -CURVE.EASY,  height/2);
      addRoad(n, n, n,  0, 0);
    }
    function addSCurves(){
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL,  -CURVE.EASY,    HILL.NONE);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL,   CURVE.NORMAL,  HILL.NORMAL);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL,   CURVE.EASY,   -HILL.EASY);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL,  -CURVE.EASY,    HILL.NORMAL);
      addRoad(ROAD.NORMAL, ROAD.NORMAL, ROAD.NORMAL,  -CURVE.NORMAL, -HILL.NORMAL);
    }
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
    function addDownhillToEnd(n){
      n= n || 200;
      addRoad(n, n, n, -CURVE.EASY, - lastY()/SEGLEN);
    }
    function addRoad(enter, hold, leave, curve, y){
      let startY= lastY();
      let endY= startY + (_.toNum(y, 0) * SEGLEN);
      let n, total = enter + hold + leave;
      for(n = 0 ; n < enter ; ++n)
        addSegment(easeIn(0, curve, n/enter), easeInOut(startY, endY, n/total));
      for(n = 0 ; n < hold  ; ++n)
        addSegment(curve, easeInOut(startY, endY, (enter+n)/total));
      for(n = 0 ; n < leave ; ++n)
        addSegment(easeInOut(curve, 0, n/leave), easeInOut(startY, endY, (enter+hold+n)/total));
    }

    function addSprite(n, sprite, offset){
      _G.lines[n].sprites.push({source: ""+sprite, offset: offset});
    }

    function resetTrees(){
      let n, side, sprite, offset;
      for(n = 10; n < 200; n += 4 + int(n/100)){
        addSprite(n, "palm_tree.png", 0.5 + Math.random()*0.5);
        addSprite(n, "palm_tree.png", 1 + Math.random()*2);
      }
      for(n = 250 ; n < 1000 ; n += 5){
        addSprite(n,"column.png", 1.1);
        addSprite(n + _.randInt2(0,5), "tree1.png", -1 - (Math.random() * 2));
        addSprite(n + _.randInt2(0,5), "tree2.png", -1 - (Math.random() * 2));
      }
      for(n = 200 ; n < _G.lines.length ; n += 3){
        addSprite(n, _.randItem(PLANTS), _.randSign * (2 + Math.random() * 5));
      }
      for(n = 1000 ; n < (_G.lines.length-50) ; n += 100){
        side = _.randSign();
        for(let i = 0 ; i < 20 ; ++i){
          sprite = _.randItem(PLANTS);
          offset = side * (1.5 + Math.random());
          addSprite(n + _.randInt2(0, 50), sprite, offset);
        }
      }
    }

    function resetCars(){
      _G.cars.length=0;
      let n, car, segment, offset, z, sprite, speed;
      for(n = 0 ; n < totalCars ; ++n){
        offset = Math.random() * _.randSign()*0.8;
        z = int(Math.random() * _G.lines.length) * SEGLEN;
        sprite = _.randItem(CARS);
        speed  = _G.maxSpeed/4 + Math.random() * _G.maxSpeed/(sprite == "semi.png" ? 4 : 2);
        car = { offset, z, sprite, speed };
        segment = getLine(car.z);
        segment.cars.push(car);
        _G.cars.push(car);
      }
    }

    function resetRoad(){
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
      //resetCars();

      _G.lines[getLine(_G.player.z).index + 2].color = COLORS.START;
      _G.lines[getLine(_G.player.z).index + 3].color = COLORS.START;
      for(let n = 0 ; n < _G.rumbles ; ++n)
        _G.lines[_G.lines.length-1-n].color = COLORS.FINISH;

      _G.trackLength = _G.lines.length * SEGLEN;
    }

    function drawPolygon(g, x1, y1, x2, y2, x3, y3, x4, y4, color){
      g.beginFill(color);
      g.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
      g.endFill();
    }

    function laneMarkerWidth(road, lanes){ return road/Math.max(32, 8*lanes) }
    function rumbleWidth(road, lanes){ return road/Math.max(6,  2*lanes) }

    function drawSegment(gfx, lanes, p1, p2, color){
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
    function drawSprite(scene, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY){
      let K=(_G.spritesScale * roadWidth),
          t= Mojo.tcached(sprite),
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

    function drawPlayer(scene, resolution, roadWidth, speedPercent, scale, destX, destY, steer, updown){
      let sprite,bounce = (1.5 * Math.random() * speedPercent * resolution) * _.randSign();
      if(steer<0)
        sprite = (updown > 0) ? "player_uphill_left.png" : "player_left.png";
      else if(steer>0)
        sprite = (updown > 0) ? "player_uphill_right.png" : "player_right.png";
      else
        sprite = (updown > 0) ? "player_uphill_straight.png" : "player_straight.png";
      drawSprite(scene, resolution, roadWidth, sprite, scale, destX, destY + bounce, -0.5, -1);
    }

    function addSegment(curve,y){
      let n = _G.lines.length;
      _G.lines.push({
        index: n,
        p1:{ world: { y: lastY(), z:  n * SEGLEN }, camera: {}, screen: {} },
        p2:{ world: { y: y, z: (n+1)* SEGLEN }, camera: {}, screen: {} },
        curve,
        sprites: [],
        cars: [],
        color: int(n/_G.rumbles)%2 ? COLORS.DARK : COLORS.LIGHT
      });
    }

    function getLine(z){ return _G.lines[int(z/SEGLEN) % _G.lines.length] }

    function project(p, camX, camY, camZ, camDepth, roadWidth){
      p.camera.x     = (p.world.x || 0) - camX;
      p.camera.y     = (p.world.y || 0) - camY;
      p.camera.z     = (p.world.z || 0) - camZ;
      p.screen.scale = camDepth/p.camera.z;
      p.screen.w     = Math.round(p.screen.scale * roadWidth   * _G.W2);
      p.screen.x     = Math.round(_G.W2  + p.screen.scale * p.camera.x  * _G.W2);
      p.screen.y     = Math.round(_G.H2 - p.screen.scale * p.camera.y  * _G.H2);
    }

    _Z.defScene("level1",{
      __init(){
        let step=1/Mojo.u.fps, mspeed=SEGLEN/step;
        _.merge(_G, {
          step: step, // how long is each frame (in seconds)
          lines: [],
          cars:[],
          centrifugal: 0.3,
          skySpeed: 0.001,  // background sky layer scroll speed when going around curve (or up hill)
          hillSpeed: 0.002,  // background hill layer scroll speed when going around curve (or up hill)
          treeSpeed: 0.003,  // background tree layer scroll speed when going around curve (or up hill)
          skyOffset: 0,    // current sky scroll offset
          hillOffset: 0,   // current hill scroll offset
          treeOffset: 0,
          resolution:  0,  // scaling factor to provide resolution independence (computed)
          roadWidth:  2000, // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
          rumbles: 3, // number of segments per red/white rumble strip
          trackLength: 0, // z length of entire track (computed)
          lanes: 3,   // number of lanes
          fov: Math.PI/2, // field of view
          camH: 1000,  // z height of camera
          camD: 0,   // z distance camera is from screen (computed)
          drawRange: 300,  // number of segments to draw
          // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
          // player relative z distance from camera (computed)
          player: {x:0, y:0, z:0},
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
          H2:Mojo.height/2,
          arena: {x:0,y:0,width:Mojo.width,height:Mojo.height}
        });

        _G.camD  = 1 / Math.tan(_G.fov / 2);
        _G.player.z = _G.camH * _G.camD;
        _G.resolution= _G.H/480;

        let w= _S.sprite("player_straight.png").width;
        _G.spritesScale = 0.3 * (1/w); // the reference sprite width should be 1/3rd the (half-)roadWidth
        _G.player.w= w * _G.spriteScale;

        resetRoad();
      },
      setup(){
        this.__init();
        this.g.sky= _S.sizeXY(_S.sprite("images/jake/sky.png"), _G.W, _G.H);
        this.g.hills= _S.sizeXY(_S.sprite("images/jake/hills.png"), _G.W, _G.H);
        this.g.trees= _S.sizeXY(_S.sprite("images/jake/trees.png"), _G.W, _G.H);
        this.g.gfx= this.gfx=_S.graphics();
        this.g.addBackgd=()=>{
          this.insert(this.g.sky);
          this.insert(this.g.hills);
          this.insert(this.g.trees);
        };
        this.g.addGfx=()=>{
          this.insert(this.gfx);
        };
        this.g.draw=()=>{
          let baseLine = getLine(_G.pos),
              basePercent = _.percentRemain(_G.pos, SEGLEN),
              x = 0,
              maxY = _G.H,
              dx = - (baseLine.curve * basePercent),
              playerSegment = getLine(_G.pos+_G.player.z),
              playerPercent = _.percentRemain(_G.pos+_G.player.z, SEGLEN);
          _G.player.y = _M.lerp(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
          this.g.addBackgd();
          this.g.addGfx();
          for(let seg,n = 0 ; n < _G.drawRange ; ++n){
            seg= _G.lines[(baseLine.index + n) % _G.lines.length];
            seg.looped = seg.index < baseLine.index;
            seg.clip   = maxY;
            project(seg.p1, (_G.player.x * _G.roadWidth) - x,     _G.player.y+ _G.camH,
                    _G.pos - (seg.looped ? _G.trackLength : 0), _G.camD, _G.roadWidth);
            project(seg.p2, (_G.player.x * _G.roadWidth) - x - dx, _G.player.y+_G.camH,
                    _G.pos - (seg.looped ? _G.trackLength : 0), _G.camD, _G.roadWidth);
            x  += dx;
            dx += seg.curve;
            if((seg.p1.camera.z <= _G.camD) || // behind us
               (seg.p2.screen.y >= maxY))          // clip by (already rendered) segment
            continue;
            drawSegment(this.g.gfx, _G.lanes, seg.p1.screen, seg.p2.screen, seg.color);
            maxY = seg.p2.screen.y;
          }
          for(let d,s,i,seg,n = (_G.drawRange-1); n > 0 ; --n){
            seg= _G.lines[(baseLine.index + n) % _G.lines.length];
            for(i = 0 ; i < seg.cars.length ; ++i){
            }
            for(i = 0 ; i < seg.sprites.length ; ++i){
              s= seg.sprites[i];
              drawSprite(this, _G.resolution,_G.roadWidth, s.source,
                         seg.p1.screen.scale,
                         seg.p1.screen.x + (seg.p1.screen.scale * s.offset * _G.roadWidth * _G.W2),
                         seg.p1.screen.y,
                         (s.offset < 0 ? -1 : 0), -1, seg.clip);
            }
            if(seg == playerSegment){
              d=_G.camD/_G.player.z;
              drawPlayer(this,_G.resolution, _G.roadWidth, _G.speed/_G.maxSpeed,
                         d,
                         _G.W2,
                         _G.H2 - (d * _M.lerp(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * _G.H2),
                         _G.speed * (_G.keyLeft ? -1 : _G.keyRight ? 1 : 0),
                         playerSegment.p2.world.y - playerSegment.p1.world.y);
            }
          }
        }
        this.g.update=(dt)=>{
          let n, car, carW, sprite, spriteW;
          let playerSegment = getLine(_G.pos + _G.player.z);
          let speedPercent = _G.speed/_G.maxSpeed;
          let dx = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

          //updateCars(dt,playerSegment);

          _G.pos = increase(_G.pos, dt * _G.speed, _G.trackLength);
          n= playerSegment.curve * speedPercent;
          _G.skyOffset  = increase(_G.skyOffset,  _G.skySpeed  * n, 1);
          _G.hillOffset = increase(_G.hillOffset, _G.hillSpeed * n, 1);
          _G.treeOffset = increase(_G.treeOffset, _G.treeSpeed * n, 1);

          if(_I.keyDown(_I.LEFT)) _G.player.x -= dx;
          else if(_I.keyDown(_I.RIGHT)) _G.player.x += dx;

          _G.player.x -= (dx * speedPercent * playerSegment.curve * _G.centrifugal);

          if(_I.keyDown(_I.A)) _G.speed = Mojo.accel(_G.speed, _G.accel, dt);
          else if(_I.keyDown(_I.D)) _G.speed = Mojo.accel(_G.speed, _G.braking, dt);
          else _G.speed = Mojo.accel(_G.speed, _G.decel, dt);

          if((_G.player.x < -1) || (_G.player.x > 1)){
            let s,sw;
            if(_G.speed > _G.offRoadLimit)
              _G.speed = Mojo.accel(_G.speed, _G.offRoadDecel, dt);
            for(n=0; n < playerSegment.sprites.length ; ++n){
            }
          }
          for(n=0; n < playerSegment.cars.length; ++n){

          }
          _G.player.x = _M.clamp(-2,2,_G.player.x);// dont ever let it go too far out of bounds
          _G.speed   = _M.clamp(0, _G.maxSpeed,_G.speed); // or exceed maxSpeed
        }
      },
      postUpdate(dt){
        this.gfx && this.gfx.clear();
        this.removeChildren();
        this.g.update(dt);
        this.g.draw();
      }
    },{});
  }

  const _$={
    assetFiles: ["images/jake/sky.png","images/jake/hills.png","images/jake/trees.png", "images/jake/jake.png","images/jake/jake.json"],
    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    SEGLEN:200,
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);


