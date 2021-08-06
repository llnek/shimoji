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

    _Z.defScene("level1",{
      __init(){
        let segmentLength=200,
            step=1/Mojo.u.fps,
            maxSpeed=segmentLength/step;
        _.merge(_G,{
          step,
          maxSpeed,
          segmentLength,
          centrifugal: 0.3, // centrifugal force multiplier when going around curves
          offRoadDecel: 0.99, // speed multiplier when off road (e.g. you lose 2% speed each update frame)
          skySpeed: 0.001, // background sky layer scroll speed when going around curve (or up hill)
          hillSpeed: 0.002, // background hill layer scroll speed when going around curve (or up hill)
          treeSpeed: 0.003, // background tree layer scroll speed when going around curve (or up hill)
          skyOffset: 0, // current sky scroll offset
          hillOffset:  0,                       // current hill scroll offset
          treeOffset: 0, // current tree scroll offset
          segments: [], // array of road segments
          cars: [], // array of cars on the road
          resolution: null,  // scaling factor to provide resolution independence (computed)
          roadWidth: 2000, // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
          rumbleLength: 3, // number of segments per red/white rumble strip
          trackLength:  null, // z length of entire track (computed)
          lanes:  3, // number of lanes
          fieldOfView: 100, // angle (degrees) for field of view
          cameraHeight: 1000, // z height of camera
          cameraDepth:  null, // z distance camera is from screen (computed)
          drawDistance: 300, // number of segments to draw
          playerX: 0, // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
          playerZ: null, // player relative z distance from camera (computed)
          fogDensity: 5, // exponential fog density
          position: 0, // current camera Z position (add playerZ to get player's absolute Z position)
          speed: 0, // current speed
          accel: maxSpeed/5, // acceleration rate - tuned until it 'felt' right
          breaking: -maxSpeed, // deceleration rate when braking
          decel:  -maxSpeed/5, // 'natural' deceleration rate when neither accelerating, nor braking
          offRoadDecel: -maxSpeed/2, // off road deceleration is somewhere in between
          offRoadLimit: maxSpeed/4, // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
          totalCars:  200,  // total number of cars on the road
          currentLapTime: 0,  // current lap time
          lastLapTime: null, // last lap time
          keyLeft: false,
          keyRight: false,
          keyFaster: false,
          keySlower: false
        });
        _G.cameraDepth  = 1 / Math.tan((_G.fieldOfView/2) * Math.PI/180);
        _G.playerZ  = (_G.cameraHeight * _G.cameraDepth);
        _G.resolution = Mojo.height/480;
        this.__resetRoad();
        let w= _S.sprite("player_straight.png").width;
        _G.spritesScale = 0.3 * (1/w); // the reference sprite width should be 1/3rd the (half-)roadWidth
      },
      setup(){
        this.__init();
        this.sky= _S.sprite("images/jake/sky.png");
        this.hills= _S.sprite("images/jake/hills.png");
        this.trees= _S.sprite("images/jake/trees.png");
        this.gfx=_S.graphics();
      },
      __drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color){
        this.gfx.beginFill(color);
        this.gfx.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
        this.gfx.endFill();
      },
      __tstamp(){ return new Date().getTime()},
      toInt(obj, def) { if (obj !== null) { let x = parseInt(obj, 10); if (!isNaN(x)) return x; } return this.toInt(def, 0); },
      toFloat(obj, def) { if (obj !== null) { let x = parseFloat(obj);   if (!isNaN(x)) return x; } return this.toFloat(def, 0.0); },
      __limit(value, min, max){ return Math.max(min, Math.min(value, max))},
      __percentRemaining(n, total) { return (n%total)/total},
      __accelerate(v, accel, dt) { return v + (accel * dt)},
      __easeIn(a,b,percent)       { return a + (b-a)*Math.pow(percent,2);                           },
      __easeOut(a,b,percent)       { return a + (b-a)*(1-Math.pow(1-percent,2));                     },
      __easeInOut(a,b,percent)       { return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        },
      __exponentialFog(distance, density) { return 1 / (Math.pow(Math.E, (distance * distance * density))); },
      __increase(start, increment, max) { // with looping
        let result = start + increment;
        while (result >= max) result -= max;
        while (result < 0) result += max;
        return result;
      },
      __project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth){
        p.camera.x     = (p.world.x || 0) - cameraX;
        p.camera.y     = (p.world.y || 0) - cameraY;
        p.camera.z     = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth/p.camera.z;
        p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
        p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
        p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
      },
      __overlap(x1, w1, x2, w2, percent){
        let half = (percent || 1)/2;
        let min1 = x1 - (w1*half);
        let max1 = x1 + (w1*half);
        let min2 = x2 - (w2*half);
        let max2 = x2 + (w2*half);
        return ! ((max1 < min2) || (min1 > max2));
      },
      rumbleWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(6,  2*lanes); },
      laneMarkerWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(32, 8*lanes); },
      __update(dt){
        let n, car, carW, sprite, spriteW;
        let playerSegment = this.__findSegment(_G.position + _G.playerZ);
        let playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
        let speedPercent = _G.speed/_G.maxSpeed;
        let dx = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
        let startPosition = _G.position;

        this.__updateCars(dt, playerSegment, playerW);
        _G.position = this.__increase(_G.position, dt * _G.speed, _G.trackLength);

        if(_I.keyDown(_I.LEFT)) _G.playerX -= dx;
        else if(_I.keyDown(_I.RIGHT)) _G.playerX += dx;

        _G.playerX -= (dx * speedPercent * playerSegment.curve * _G.centrifugal);

        if(_I.keyDown(_I.A))
          _G.speed = this.__accelerate(_G.speed, _G.accel, dt);
        else if(_I.keyDown(_I.D))
          _G.speed = this.__accelerate(_G.speed, _G.breaking, dt);
        else
          _G.speed = this.__accelerate(_G.speed, _G.decel, dt);

        if((_G.playerX < -1) || (_G.playerX > 1)){
          if(_G.speed > _G.offRoadLimit)
            _G.speed = this.__accelerate(_G.speed, _G.offRoadDecel, dt);
          for(n=0; n < playerSegment.sprites.length ; ++n){
            sprite  = playerSegment.sprites[n];
            spriteW = sprite.source.w * SPRITES.SCALE;
            if(this.__overlap(_G.playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)){
              _G.speed = _G.maxSpeed/5;
              _G.position = this.__increase(playerSegment.p1.world.z, -_G.playerZ, _G.trackLength); // stop in front of sprite (at front of segment)
              break;
            }
          }
        }

        for(n=0; n < playerSegment.cars.length; ++n){
          car  = playerSegment.cars[n];
          carW = car.sprite.w * SPRITES.SCALE;
          if(_G.speed > car.speed){
            if(this.__overlap(_G.playerX, playerW, car.offset, carW, 0.8)){
              _G.speed = car.speed * (car.speed/_G.speed);
              _G.position = this.__increase(car.z, -_G.playerZ, _G.trackLength);
              break;
            }
          }
        }

        _G.playerX = this.__limit(_G.playerX, -3, 3);// dont ever let it go too far out of bounds
        _G.speed   = this.__limit(_G.speed, 0, _G.maxSpeed); // or exceed maxSpeed

        n= playerSegment.curve * (_G.position-startPosition)/_G.segmentLength;
        _G.skyOffset  = this.__increase(_G.skyOffset,  _G.skySpeed  * n, 1);
        _G.hillOffset = this.__increase(_G.hillOffset, _G.hillSpeed * n, 1);
        _G.treeOffset = this.__increase(_G.treeOffset, _G.treeSpeed * n, 1);

        if(_G.position > _G.playerZ){
        }
      },
      __updateCars(dt, playerSegment, playerW){
        let i,n, car, oldSegment, newSegment;
        _G.cars.forEach(car=>{
          oldSegment  = this.__findSegment(car.z);
          car.offset  += this.__updateCarOffset(car, oldSegment, playerSegment, playerW);
          car.z = this.__increase(car.z, dt * car.speed, _G.trackLength);
          car.percent = this.__percentRemaining(car.z, _G.segmentLength); // useful for interpolation during rendering phase
          newSegment = this.__findSegment(car.z);
          if(oldSegment != newSegment){
            i = oldSegment.cars.indexOf(car);
            oldSegment.cars.splice(i, 1);
            newSegment.cars.push(car);
          }
        });
      },
      __updateCarOffset(car, carSegment, playerSegment, playerW){
        let i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;
        // optimization, dont bother steering around other cars when 'out of sight' of the player
        if((carSegment.index - playerSegment.index) > _G.drawDistance) return 0;
        for(i = 1 ; i < lookahead ; ++i){
          segment = _G.segments[(carSegment.index+i)%_G.segments.length];
          if(segment === playerSegment &&
             car.speed > speed &&
             this.__overlap(_G.playerX, playerW, car.offset, carW, 1.2)){
            if(_G.playerX > 0.5)
              dir = -1;
            else if(_G.playerX < -0.5)
              dir = 1;
            else
              dir = (car.offset > _G.playerX) ? 1 : -1;
            return dir * 1/i * (car.speed-_G.speed)/_G.maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
          }
          for(j = 0 ; j < segment.cars.length ; ++j){
            otherCar  = segment.cars[j];
            otherCarW = otherCar.sprite.w * SPRITES.SCALE;
            if(car.speed > otherCar.speed &&
               this.__overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)){
              if(otherCar.offset > 0.5)
                dir = -1;
              else if(otherCar.offset < -0.5)
                dir = 1;
              else
                dir = (car.offset > otherCar.offset) ? 1 : -1;
              return dir * 1/i * (car.speed-otherCar.speed)/_G.maxSpeed;
            }
          }
        }
        //if no cars ahead, but I have somehow ended up off road, then steer back on
        if(car.offset < -0.9) return 0.1;
        if(car.offset > 0.9) return -0.1;
        return 0;
      },
      __updateHud(key, value){
      },
      __formatTime(dt){
        let minutes = int(dt/60);
        let seconds = int(dt - (minutes * 60));
        let tenths  = int(10 * (dt - int(dt)));
        if(minutes > 0)
          return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
        else
          return seconds + "." + tenths;
      },
      __findSegment(z){
        return _G.segments[int(z/_G.segmentLength) % _G.segments.length];
      },
      __lastY(){
        return _G.segments.length == 0 ? 0 : _G.segments[_G.segments.length-1].p2.world.y;
      },
      __addSegment(curve, y){
        let n = _G.segments.length;
        _G.segments.push({
          index: n,
          p1:{ world: { y: this.__lastY(), z:  n * _G.segmentLength }, camera: {}, screen: {} },
          p2:{ world: { y: y, z: (n+1)*_G.segmentLength }, camera: {}, screen: {} },
          curve,
          sprites: [],
          cars: [],
          color: int(n/_G.rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
        });
      },
      __addSprite(n, sprite, offset){
        _G.segments[n].sprites.push({ source: sprite, offset: offset });
      },
      __addRoad(enter, hold, leave, curve, y){
        let startY= this.__lastY();
        let endY= startY + (this.__toInt(y, 0) * _G.segmentLength);
        let n, total = enter + hold + leave;
        for(n = 0 ; n < enter ; ++n)
          this.__addSegment(this.__easeIn(0, curve, n/enter), this.__easeInOut(startY, endY, n/total));
        for(n = 0 ; n < hold  ; ++n)
          this.__addSegment(curve, this.__easeInOut(startY, endY, (enter+n)/total));
        for(n = 0 ; n < leave ; ++n)
          this.__addSegment(this.__easeInOut(curve, 0, n/leave), this.__easeInOut(startY, endY, (enter+hold+n)/total));
      },
      __render(){
        let baseSegment   = this.__findSegment(_G.position);
        let basePercent   = this.__percentRemaining(_G.position, _G.segmentLength);
        let playerSegment = this.__findSegment(_G.position+_G.playerZ);
        let playerPercent = this.__percentRemaining(_G.position+_G.playerZ, _G.segmentLength);
        let playerY       = this.__interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        let maxy = Mojo.height;
        let x  = 0;
        let dx = - (baseSegment.curve * basePercent);

        this.gfx.clear();

        //Render.background(ctx, background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
        //Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
        //Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

        let n, i, segment, car, sprite, spriteScale, spriteX, spriteY;
        for(n = 0 ; n < _G.drawDistance ; ++n){
          segment = _G.segments[(baseSegment.index + n) % _G.segments.length];
          segment.looped = segment.index < baseSegment.index;
          segment.fog    = this.__exponentialFog(n/_G.drawDistance, _G.fogDensity);
          segment.clip   = maxy;
          this.__project(segment.p1, (_G.playerX * _G.roadWidth) - x,      playerY + _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, Mojo.width, Mojo.height, _G.roadWidth);
          this.__project(segment.p2, (_G.playerX * _G.roadWidth) - x - dx, playerY + _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, Mojo.width, Mojo.height, _G.roadWidth);
          x  = x + dx;
          dx = dx + segment.curve;
          if((segment.p1.camera.z <= _G.cameraDepth)         || // behind us
             (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
             (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
            continue;
          this.__segment(Mojo.width, lanes,
                         segment.p1.screen.x,
                         segment.p1.screen.y,
                         segment.p1.screen.w,
                         segment.p2.screen.x,
                         segment.p2.screen.y,
                         segment.p2.screen.w,
                         segment.fog,
                         segment.color);
          maxy = segment.p1.screen.y;
        }

        for(n = (_G.drawDistance-1) ; n > 0 ; --n){
          segment = _G.segments[(baseSegment.index + n) % _G.segments.length];
          for(i = 0 ; i < segment.cars.length ; ++i){
            car         = segment.cars[i];
            sprite      = car.sprite;
            spriteScale = this.__interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
            spriteX     = this.__interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * _G.roadWidth * Mojo.width/2);
            spriteY     = this.__interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
            this.__sprite(Mojo.width, Mojo.height, _G.resolution, _G.roadWidth, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
          }
          for(i = 0 ; i < segment.sprites.length ; ++i){
            sprite      = segment.sprites[i];
            spriteScale = segment.p1.screen.scale;
            spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * _G.roadWidth * Mojo.width/2);
            spriteY     = segment.p1.screen.y;
            this.__sprite(Mojo.width, Mojo.height, _G.resolution, _G.roadWidth, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
          }
          if(segment == playerSegment){
            this.__player(Mojo.width, Mojo.height, _G.resolution, _G.roadWidth, _G.speed/_G.maxSpeed,
                          _G.cameraDepth/_G.playerZ,
                          Mojo.width/2,
                          (Mojo.height/2) - (_G.cameraDepth/_G.playerZ * this.__interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * Mojo.height/2),
                          _G.speed * (_G.keyLeft ? -1 : _G.keyRight ? 1 : 0),
                          playerSegment.p2.world.y - playerSegment.p1.world.y);
          }
        }
      },
      __addStraight(num){
        num = num || ROAD.LENGTH.MEDIUM;
        this.__addRoad(num, num, num, 0, 0);
      },
      __addHill(num, height){
        num    = num    || ROAD.LENGTH.MEDIUM;
        height = height || ROAD.HILL.MEDIUM;
        this.__addRoad(num, num, num, 0, height);
      },
      __addCurve(num, curve, height){
        num    = num    || ROAD.LENGTH.MEDIUM;
        curve  = curve  || ROAD.CURVE.MEDIUM;
        height = height || ROAD.HILL.NONE;
        this.__addRoad(num, num, num, curve, height);
      },
      __addLowRollingHills(num, height){
        num    = num    || ROAD.LENGTH.SHORT;
        height = height || ROAD.HILL.LOW;
        this.__addRoad(num, num, num,  0,                height/2);
        this.__addRoad(num, num, num,  0,               -height);
        this.__addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
        this.__addRoad(num, num, num,  0,                0);
        this.__addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
        this.__addRoad(num, num, num,  0,                0);
      },
      __addSCurves(){
        this.__addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
        this.__addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
        this.__addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
        this.__addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
        this.__addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
      },
      __addBumps(){
        this.__addRoad(10, 10, 10, 0,  5);
        this.__addRoad(10, 10, 10, 0, -2);
        this.__addRoad(10, 10, 10, 0, -5);
        this.__addRoad(10, 10, 10, 0,  8);
        this.__addRoad(10, 10, 10, 0,  5);
        this.__addRoad(10, 10, 10, 0, -7);
        this.__addRoad(10, 10, 10, 0,  5);
        this.__addRoad(10, 10, 10, 0, -2);
      },
      __addDownhillToEnd(num){
        num = num || 200;
        this.__addRoad(num, num, num, -ROAD.CURVE.EASY, - this.__lastY()/_G.segmentLength);
      },
      __resetRoad(){
        _G.segments.length=0;
        this.__addStraight(ROAD.LENGTH.SHORT);
        this.__addLowRollingHills();
        this.__addSCurves();
        this.__addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
        this.__addBumps();
        this.__addLowRollingHills();
        this.__addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
        this.__addStraight();
        this.__addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
        this.__addSCurves();
        this.__addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
        this.__addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
        this.__addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
        this.__addBumps();
        this.__addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
        this.__addStraight();
        this.__addSCurves();
        this.__addDownhillToEnd();

        this.__resetSprites();
        this.__resetCars();

        _G.segments[this.__findSegment(_G.playerZ).index + 2].color = COLORS.START;
        _G.segments[this.__findSegment(_G.playerZ).index + 3].color = COLORS.START;
        for(let n = 0 ; n < _G.rumbleLength ; ++n)
          _G.segments[_G.segments.length-1-n].color = COLORS.FINISH;

        _G.trackLength = _G.segments.length * _G.segmentLength;
      },
      __resetSprites(){
        let n, i;
        this.__addSprite(20,  SPRITES.BILLBOARD07, -1);
        this.__addSprite(40,  SPRITES.BILLBOARD06, -1);
        this.__addSprite(60,  SPRITES.BILLBOARD08, -1);
        this.__addSprite(80,  SPRITES.BILLBOARD09, -1);
        this.__addSprite(100, SPRITES.BILLBOARD01, -1);
        this.__addSprite(120, SPRITES.BILLBOARD02, -1);
        this.__addSprite(140, SPRITES.BILLBOARD03, -1);
        this.__addSprite(160, SPRITES.BILLBOARD04, -1);
        this.__addSprite(180, SPRITES.BILLBOARD05, -1);

        this.__addSprite(240,                  SPRITES.BILLBOARD07, -1.2);
        this.__addSprite(240,                  SPRITES.BILLBOARD06,  1.2);
        this.__addSprite(_G.segments.length - 25, SPRITES.BILLBOARD07, -1.2);
        this.__addSprite(_G.segments.length - 25, SPRITES.BILLBOARD06,  1.2);

        for(n = 10 ; n < 200 ; n += 4 + int(n/100)){
          this.__addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random()*0.5);
          this.__addSprite(n, SPRITES.PALM_TREE,   1 + Math.random()*2);
        }

        for(n = 250 ; n < 1000 ; n += 5){
          this.__addSprite(n,     SPRITES.COLUMN, 1.1);
          this.__addSprite(n + this.__randomInt(0,5), SPRITES.TREE1, -1 - (Math.random() * 2));
          this.__addSprite(n + this.__randomInt(0,5), SPRITES.TREE2, -1 - (Math.random() * 2));
        }

        for(n = 200 ; n < _G.segments.length ; n += 3){
          this.__addSprite(n, this.__randomChoice(SPRITES.PLANTS), _.randSign() * (2 + Math.random() * 5));
        }

        let side, sprite, offset;
        for(n = 1000 ; n < (_G.segments.length-50) ; n += 100){
          side      = _.randSign();
          this.__addSprite(n + this.__randomInt(0, 50), this.__randomChoice(SPRITES.BILLBOARDS), -side);
          for(i = 0 ; i < 20 ; ++i){
            sprite = Util.randomChoice(SPRITES.PLANTS);
            offset = side * (1.5 + Math.random());
            this.__addSprite(n + this.__randomInt(0, 50), sprite, offset);
          }
        }
      },
      __resetCars(){
        _G.cars.length=0;
        let n, car, segment, offset, z, sprite, speed;
        for(let n = 0 ; n < _G.totalCars ; ++n){
          offset = Math.random() * _.randSign() * 0.8;
          z      = int(Math.random() * _G.segments.length) * _G.segmentLength;
          sprite = this.__randomChoice(SPRITES.CARS);
          speed  = _G.maxSpeed/4 + Math.random() * _G.maxSpeed/(sprite == SPRITES.SEMI ? 4 : 2);
          car = { offset: offset, z: z, sprite: sprite, speed: speed };
          segment = this.__findSegment(car.z);
          segment.cars.push(car);
          _G.cars.push(car);
        }
      },
      __player(width, height, resolution, roadWidth, speedPercent, scale, destX, destY, steer, updown){
        let bounce = (1.5 * Math.random() * speedPercent * resolution) * _.randSign();
        let sprite;
        if(steer < 0)
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
        else if(steer > 0)
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
        else
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
        this.__sprite(width, height, resolution, roadWidth, sprite, scale, destX, destY + bounce, -0.5, -1);
      },
      __polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color){
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y4);
          ctx.closePath();
          ctx.fill();
      },
      __segment(width, lanes, x1, y1, w1, x2, y2, w2, fog, color){
        let r1 = Render.rumbleWidth(w1, lanes),
            r2 = Render.rumbleWidth(w2, lanes),
            l1 = Render.laneMarkerWidth(w1, lanes),
            l2 = Render.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        Render.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
        Render.polygon(ctx, x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
        Render.polygon(ctx, x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
        if (color.lane) {
          lanew1 = w1*2/lanes;
          lanew2 = w2*2/lanes;
          lanex1 = x1 - w1 + lanew1;
          lanex2 = x2 - w2 + lanew2;
          for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
            Render.polygon(ctx, lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
        }
        Render.fog(ctx, 0, y1, width, y2-y1, fog);
      },
      __background(background, width, height, layer, rotation, offset){
        rotation = rotation || 0;
        offset   = offset   || 0;

        let imageW = layer.w/2;
        let imageH = layer.h;

        let sourceX = layer.x + Math.floor(layer.w * rotation);
        let sourceY = layer.y
        let sourceW = Math.min(imageW, layer.x+layer.w-sourceX);
        let sourceH = imageH;

        let destX = 0;
        let destY = offset;
        let destW = Math.floor(width * (sourceW/imageW));
        let destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if(sourceW < imageW)
          ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
      },
      __sprite(width, height, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY){
        //scale for projection AND relative to roadWidth (for tweakUI)
        let destW  = (sprite.w * scale * width/2) * (SPRITES.SCALE * roadWidth);
        let destH  = (sprite.h * scale * width/2) * (SPRITES.SCALE * roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        let clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
        if (clipH < destH)
          ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);
      },
      postUpdate(dt){
        this.removeChildren();
        this.__update(dt);
        this.__draw();
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

