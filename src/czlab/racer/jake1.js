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
           ute:_,is}=Mojo;

    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    const ROAD = {
      LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
      HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
      CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
    };

    const COLORS = {
      SKY:  _S.color("#72D7EE"),
      TREE: _S.color("#005108"),
      FOG:  _S.color("#005108"),
      LIGHT:  { road: _S.color("#6B6B6B"), grass: _S.color("#10AA10"), rumble: _S.color("#555555"), lane: _S.color("#CCCCCC")  },
      DARK:   { road: _S.color("#696969"), grass: _S.color("#009A00"), rumble: _S.color("#BBBBBB") },
      START:  { road: _S.color("white"),   grass: _S.color("white"),   rumble: _S.color("white") },
      FINISH: { road: _S.color("black"),   grass: _S.color("black"),   rumble: _S.color("black") }
    };

    //qqqq
    function interpolate(a,b,percent){ return a + (b-a)*percent }
    function limit(value, min, max){ return Math.max(min, Math.min(value, max))}
    function percentRemaining(n, total) { return (n%total)/total}
    function accelerate(v, accel, dt) { return v + (accel * dt)}
    function increase(start, increment, max) { // with looping
      let result = start + increment;
      while(result >= max) result -= max;
      while (result < 0) result += max;
      return result;
    }
    function easeIn(a,b,percent){ return a + (b-a)*Math.pow(percent,2) }
    function easeOut(a,b,percent){ return a + (b-a)*(1-Math.pow(1-percent,2)) }
    function easeInOut(a,b,percent){ return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5) }
    function lastY(){
      return _G.segments.length == 0 ? 0 : _G.segments[_G.segments.length-1].p2.world.y;
    }
    function toInt(obj, def){ if(obj !== null){ let x = parseInt(obj, 10); if (!isNaN(x)) return x; } return toInt(def, 0); }
    function toFloat(obj, def){ if(obj !== null){ let x = parseFloat(obj);   if (!isNaN(x)) return x; } return toFloat(def, 0.0); }
    function addStraight(num){
      num = num || ROAD.LENGTH.MEDIUM;
      addRoad(num, num, num, 0, 0);
    }
    function addHill(num, height){
      num    = num    || ROAD.LENGTH.MEDIUM;
      height = height || ROAD.HILL.MEDIUM;
      addRoad(num, num, num, 0, height);
    }
    function addCurve(num, curve, height){
      num    = num    || ROAD.LENGTH.MEDIUM;
      curve  = curve  || ROAD.CURVE.MEDIUM;
      height = height || ROAD.HILL.NONE;
      addRoad(num, num, num, curve, height);
    }
    function addLowRollingHills(num, height){
      num    = num    || ROAD.LENGTH.SHORT;
      height = height || ROAD.HILL.LOW;
      addRoad(num, num, num,  0,                height/2);
      addRoad(num, num, num,  0,               -height);
      addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
      addRoad(num, num, num,  0,                0);
      addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
      addRoad(num, num, num,  0,                0);
    }
    function addSCurves(){
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
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
    function addDownhillToEnd(num){
      num = num || 200;
      addRoad(num, num, num, -ROAD.CURVE.EASY, - lastY()/_G.segmentLength);
    }
    function addRoad(enter, hold, leave, curve, y){
        let startY= lastY();
        let endY= startY + (toInt(y, 0) * _G.segmentLength);
        let n, total = enter + hold + leave;
        for(n = 0 ; n < enter ; ++n)
          addSegment(easeIn(0, curve, n/enter), easeInOut(startY, endY, n/total));
        for(n = 0 ; n < hold  ; ++n)
          addSegment(curve, easeInOut(startY, endY, (enter+n)/total));
        for(n = 0 ; n < leave ; ++n)
          addSegment(easeInOut(curve, 0, n/leave), easeInOut(startY, endY, (enter+hold+n)/total));
    }
    function resetRoad(){
      _G.segments.length=0;
      addStraight(ROAD.LENGTH.SHORT);
      addLowRollingHills();
      addSCurves();
      addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
      addBumps();
      addLowRollingHills();
      addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
      addStraight();
      addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
      addSCurves();
      addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
      addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
      addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
      addBumps();
      addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
      addStraight();
      addSCurves();
      addDownhillToEnd();

      //this.__resetSprites();
      //this.__resetCars();

      _G.segments[findSegment(_G.playerZ).index + 2].color = COLORS.START;
      _G.segments[findSegment(_G.playerZ).index + 3].color = COLORS.START;
      for(let n = 0 ; n < _G.rumbleLength ; ++n)
        _G.segments[_G.segments.length-1-n].color = COLORS.FINISH;

      _G.trackLength = _G.segments.length * _G.segmentLength;
    }

    function drawPolygon(g, x1, y1, x2, y2, x3, y3, x4, y4, color){
      g.beginFill(color);
      g.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
      g.endFill();
    }
    function rumbleWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(6,  2*lanes) }
    function laneMarkerWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(32, 8*lanes) }
    function drawSegment(gfx, width, lanes, p1, p2, color){
      let r1 = rumbleWidth(p1.w, lanes),
          r2 = rumbleWidth(p2.w, lanes),
          l1 = laneMarkerWidth(p1.w, lanes),
          l2 = laneMarkerWidth(p2.w, lanes),
          lanew1, lanew2, lanex1, lanex2, lane;
      gfx.beginFill(color.grass);
      gfx.drawRect(0, p2.y, width, p1.y - p2.y);
      gfx.endFill();
      drawPolygon(gfx, p1.x-p1.w-r1, p1.y, p1.x-p1.w, p1.y, p2.x-p2.w, p2.y, p2.x-p2.w-r2, p2.y, color.rumble);
      drawPolygon(gfx, p1.x+p1.w+r1, p1.y, p1.x+p1.w, p1.y, p2.x+p2.w, p2.y, p2.x+p2.w+r2, p2.y, color.rumble);
      drawPolygon(gfx, p1.x-p1.w,    p1.y, p1.x+p1.w, p1.y, p2.x+p2.w, p2.y, p2.x-p2.w,    p2.y, color.road);
      if(color.lane){
        lanew1 = p1.w*2/lanes;
        lanew2 = p2.w*2/lanes;
        lanex1 = p1.x - p1.w + lanew1;
        lanex2 = p2.x - p2.w + lanew2;
        for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, ++lane)
          drawPolygon(gfx, lanex1 - l1/2, p1.y, lanex1 + l1/2, p1.y, lanex2 + l2/2, p2.y, lanex2 - l2/2, p2.y, color.lane);
      }
    }
    function drawSprite(scene, width, height, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY){
      //  scale for projection AND relative to roadWidth (for tweakUI)
      let destW  = (sprite.width * scale * width/2) * (_G.spritesScale * roadWidth);
      let destH  = (sprite.height * scale * width/2) * (_G.spritesScale * roadWidth);

      destX = destX + (destW * (offsetX || 0));
      destY = destY + (destH * (offsetY || 0));

      sprite.width=destW;
      sprite.height=destH;
      sprite.x=destX;
      sprite.y=destY;
      scene.insert(sprite);

      /*
      let clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
      if(clipH < destH){
        //ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);
      }
      */
    }

    function drawPlayer(scene, width, height, resolution, roadWidth, speedPercent, scale, destX, destY, steer, updown){
      let sprite,bounce = (1.5 * Math.random() * speedPercent * resolution) * _.randSign();
      if(steer<0)
        sprite = (updown > 0) ? "player_uphill_left.png" : "player_left.png";
      else if(steer>0)
        sprite = (updown > 0) ? "player_uphill_right.png" : "player_right.png";
      else
        sprite = (updown > 0) ? "player_uphill_straight.png" : "player_straight.png";
      let s=_S.sprite(sprite);
      drawSprite(scene, width, height, resolution, roadWidth, s, scale, destX, destY + bounce, -0.5, -1);
    }

    function addSegment(curve,y){
      let n = _G.segments.length;
      _G.segments.push({
        index: n,
        p1:{ world: { y: lastY(), z:  n * _G.segmentLength }, camera: {}, screen: {} },
        p2:{ world: { y: y, z: (n+1)*_G.segmentLength }, camera: {}, screen: {} },
        curve,
        sprites: [],
        cars: [],
        color: int(n/_G.rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
      });
    }

    function findSegment(z){
      return _G.segments[int(z/_G.segmentLength) % _G.segments.length];
    }

    function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth){
      p.camera.x     = (p.world.x || 0) - cameraX;
      p.camera.y     = (p.world.y || 0) - cameraY;
      p.camera.z     = (p.world.z || 0) - cameraZ;
      p.screen.scale = cameraDepth/p.camera.z;
      p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
      p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
      p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
    }

    _Z.defScene("level1",{
      __init(){
        let N=200, step=1/Mojo.u.fps, mspeed=N/step;
        _.merge(_G, {
          step: step, // how long is each frame (in seconds)
          segments: [],
          centrifugal: 0.3,
          skySpeed: 0.001,    // background sky layer scroll speed when going around curve (or up hill)
          hillSpeed: 0.002,                   // background hill layer scroll speed when going around curve (or up hill)
          treeSpeed: 0.003,                   // background tree layer scroll speed when going around curve (or up hill)
          skyOffset: 0,                       // current sky scroll offset
          hillOffset: 0,                       // current hill scroll offset
          treeOffset: 0,
          resolution:  0,  // scaling factor to provide resolution independence (computed)
          roadWidth:  2000,    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
          segmentLength: N,  // length of a single segment
          rumbleLength: 3, // number of segments per red/white rumble strip
          trackLength: 0, // z length of entire track (computed)
          lanes: 3,   // number of lanes
          fieldOfView: Math.PI/2,
          cameraHeight: 1000,  // z height of camera
          cameraDepth: 0,   // z distance camera is from screen (computed)
          drawDistance: 300,  // number of segments to draw
          playerX:  0,  // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
          playerZ: 0,  // player relative z distance from camera (computed)
          position:  0,  // current camera Z position (add playerZ to get player's absolute Z position)
          speed:  0,  // current speed
          maxSpeed: mspeed, // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
          accel:  mspeed/5,  // acceleration rate - tuned until it 'felt' right
          breaking: -mspeed,               // deceleration rate when braking
          decel:  -mspeed/5,             // 'natural' deceleration rate when neither accelerating, nor braking
          offRoadDecel: -mspeed/2,             // off road deceleration is somewhere in between
          offRoadLimit: mspeed/4              // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
        });
        _G.cameraDepth  = 1 / Math.tan(_G.fieldOfView/2); // === 146
        _G.playerZ = (_G.cameraHeight * _G.cameraDepth);
        _G.resolution= Mojo.height/480;

        let w= _S.sprite("player_straight.png").width;
        _G.spritesScale = 0.3 * (1/w); // the reference sprite width should be 1/3rd the (half-)roadWidth
        _G.playerW=w * _G.spriteScale;

        resetRoad();
      },
      setup(){
        let w=Mojo.width, h=Mojo.height;
        this.__init();
        this.g.sky= _S.sizeXY(_S.sprite("images/jake/sky.png"),w,h);
        this.g.hills= _S.sizeXY(_S.sprite("images/jake/hills.png"),w,h);
        this.g.trees= _S.sizeXY(_S.sprite("images/jake/trees.png"),w,h);
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
          let baseSegment = findSegment(_G.position),
              basePercent = percentRemaining(_G.position, _G.segmentLength),
              x  = 0,
              maxY = Mojo.height,
              dx = - (baseSegment.curve * basePercent),
              playerSegment = findSegment(_G.position+_G.playerZ),
              playerPercent = percentRemaining(_G.position+_G.playerZ, _G.segmentLength),
              playerY = interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
          this.g.addBackgd();
          this.g.addGfx();
          for(let seg,n = 0 ; n < _G.drawDistance ; ++n){
            seg= _G.segments[(baseSegment.index + n) % _G.segments.length];
            seg.looped = seg.index < baseSegment.index;
            project(seg.p1, (_G.playerX * _G.roadWidth) - x,     playerY+ _G.cameraHeight,
                    _G.position - (seg.looped ? _G.trackLength : 0), _G.cameraDepth, Mojo.width, Mojo.height, _G.roadWidth);
            project(seg.p2, (_G.playerX * _G.roadWidth) - x - dx, playerY+_G.cameraHeight,
                    _G.position - (seg.looped ? _G.trackLength : 0), _G.cameraDepth, Mojo.width, Mojo.height, _G.roadWidth);
            x  += dx;
            dx += seg.curve;
            if((seg.p1.camera.z <= _G.cameraDepth) || // behind us
               (seg.p2.screen.y >= maxY))          // clip by (already rendered) segment
            continue;
            drawSegment(this.g.gfx, Mojo.width, _G.lanes, seg.p1.screen, seg.p2.screen, seg.color);
            maxY = seg.p2.screen.y;
          }
          drawPlayer(this, Mojo.width, Mojo.height, _G.resolution, _G.roadWidth, _G.speed/_G.maxSpeed,
                          _G.cameraDepth/_G.playerZ, Mojo.width/2, Mojo.height, _G.speed * (_G.keyLeft ? -1 : _G.keyRight ? 1 : 0), 0);
        }
        this.g.update=(dt)=>{
          let n, car, carW, sprite, spriteW;
          let playerSegment = findSegment(_G.position + _G.playerZ);
          let speedPercent = _G.speed/_G.maxSpeed;
          let dx = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

          _G.position = increase(_G.position, dt * _G.speed, _G.trackLength);
          n= playerSegment.curve * speedPercent;
          _G.skyOffset  = increase(_G.skyOffset,  _G.skySpeed  * n, 1);
          _G.hillOffset = increase(_G.hillOffset, _G.hillSpeed * n, 1);
          _G.treeOffset = increase(_G.treeOffset, _G.treeSpeed * n, 1);

          if(_I.keyDown(_I.LEFT)) _G.playerX -= dx;
          else if(_I.keyDown(_I.RIGHT)) _G.playerX += dx;

          _G.playerX -= (dx * speedPercent * playerSegment.curve * _G.centrifugal);

          if(_I.keyDown(_I.A)) _G.speed = accelerate(_G.speed, _G.accel, dt);
          else if(_I.keyDown(_I.D)) _G.speed = accelerate(_G.speed, _G.breaking, dt);
          else _G.speed = accelerate(_G.speed, _G.decel, dt);

          if((_G.playerX < -1) || (_G.playerX > 1)){
            if(_G.speed > _G.offRoadLimit)
              _G.speed = accelerate(_G.speed, _G.offRoadDecel, dt);
            for(n=0; n < playerSegment.sprites.length ; ++n){ }
          }
          for(n=0; n < playerSegment.cars.length; ++n){ }
          _G.playerX = limit(_G.playerX, -2, 2);// dont ever let it go too far out of bounds
          _G.speed   = limit(_G.speed, 0, _G.maxSpeed); // or exceed maxSpeed
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
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);


