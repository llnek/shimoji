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
          fogDensity:  5,   // exponential fog density
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
        _G.resolution= _G.arena.height/480;

        let w= _S.sprite("player_straight.png").width;
        _G.spritesScale = 0.3 * (1/w); // the reference sprite width should be 1/3rd the (half-)roadWidth

        this.__resetRoad();
      },
      project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth){
        p.camera.x     = (p.world.x || 0) - cameraX;
        p.camera.y     = (p.world.y || 0) - cameraY;
        p.camera.z     = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth/p.camera.z;
        p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
        p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
        p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
      },
      setup(){
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        this.__init();
        this.sky= _S.sprite("images/jake/sky.png");
        this.hills= _S.sprite("images/jake/hills.png");
        this.trees= _S.sprite("images/jake/trees.png");
        this.gfx=_S.graphics();
      },
      __drawSky(width,height){
        let s= this.sky;
        s.width=width;
        s.height=height;
        this.insert(s);
      },
      __drawHills(width,height){
        let s= this.hills;
        s.width=width;
        s.height=height;
        this.insert(s);
      },
      __drawTrees(width,height){
        let s= this.trees;
        s.width=width;
        s.height=height;
        this.insert(s);
      },
      __drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color){
        this.gfx.beginFill(color);
        this.gfx.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
        this.gfx.endFill();
      },
      __drawSegment(width, lanes, x1, y1, w1, x2, y2, w2, fog, color){
        let r1 = this.rumbleWidth(w1, lanes),
            r2 = this.rumbleWidth(w2, lanes),
            l1 = this.laneMarkerWidth(w1, lanes),
            l2 = this.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;
        this.gfx.beginFill(color.grass);
        this.gfx.drawRect(0, y2, width, y1 - y2);
        this.gfx.endFill();
        this.__drawPolygon(x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
        this.__drawPolygon(x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
        this.__drawPolygon(x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
        if(color.lane){
          lanew1 = w1*2/lanes;
          lanew2 = w2*2/lanes;
          lanex1 = x1 - w1 + lanew1;
          lanex2 = x2 - w2 + lanew2;
          for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, ++lane)
            this.__drawPolygon(lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
        }
        //Render.fog(ctx, 0, y1, width, y2-y1, fog);
      },
      __draw(){
        let baseSegment = this.findSegment(_G.position);
        let width=_G.arena.width;
        let height=_G.arena.height;
        let maxy = height;
        this.__drawSky(width, height);
        this.__drawHills(width, height);
        this.__drawTrees(width, height);
        this.gfx.clear();
        this.insert(this.gfx);
        for(let segment,n = 0 ; n < _G.drawDistance ; ++n){
          segment = _G.segments[(baseSegment.index + n) % _G.segments.length];
          segment.looped = segment.index < baseSegment.index;
          //segment.fog = Util.exponentialFog(n/_G.drawDistance, fogDensity);
          this.project(segment.p1, (_G.playerX * _G.roadWidth),
            _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, width, height, _G.roadWidth);
          this.project(segment.p2, (_G.playerX * _G.roadWidth),
            _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, width, height, _G.roadWidth);
          if((segment.p1.camera.z <= _G.cameraDepth) || // behind us
             (segment.p2.screen.y >= maxy))          // clip by (already rendered) segment
          continue;
          this.__drawSegment(width, _G.lanes,
                             segment.p1.screen.x,
                             segment.p1.screen.y,
                             segment.p1.screen.w,
                             segment.p2.screen.x,
                             segment.p2.screen.y,
                             segment.p2.screen.w,
                             segment.fog,
                             segment.color);
          maxy = segment.p2.screen.y;
        }
        this.__drawPlayer(width, height, _G.resolution, _G.roadWidth, _G.speed/_G.maxSpeed,
                          _G.cameraDepth/_G.playerZ,
                          width/2,
                          height,
                          _G.speed * (_G.keyLeft ? -1 : _G.keyRight ? 1 : 0), 0);
      },
      __drawPlayer(width, height, resolution, roadWidth, speedPercent, scale, destX, destY, steer, updown){
        let sprite,bounce = (1.5 * Math.random() * speedPercent * resolution) * _.randSign();
        if(steer < 0)
          sprite = (updown > 0) ? "player_uphill_left.png" : "player_left.png";
        else if(steer > 0)
          sprite = (updown > 0) ? "player_uphill_right.png" : "player_right.png";
        else
          sprite = (updown > 0) ? "player_uphill_straight.png" : "player_straight.png";
        let s=_S.sprite(sprite);
        this.__drawSprite(width, height, resolution, roadWidth, s, scale, destX, destY + bounce, -0.5, -1);
      },
      __drawSprite(width, height, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY){
                    //  scale for projection AND relative to roadWidth (for tweakUI)
        let destW  = (sprite.width * scale * width/2) * (_G.spritesScale * roadWidth);
        let destH  = (sprite.height * scale * width/2) * (_G.spritesScale * roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        sprite.width=destW;
        sprite.height=destH;
        sprite.x=destX;
        sprite.y=destY;
        this.insert(sprite);

        /*
        let clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
        if(clipH < destH){
          //ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);
        }
        */
      },
      __resetRoad(){
        _G.segments.length=0;
        for(let n = 0 ; n < 500 ; ++n){
          _G.segments.push({
            index: n,
            p1: { world: { z:  n *_G.segmentLength }, camera: {}, screen: {} },
            p2: { world: { z: (n+1)* _G.segmentLength }, camera: {}, screen: {} },
            color: int(n/_G.rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
          });
        }
        _G.segments[this.findSegment(_G.playerZ).index + 2].color = COLORS.START;
        _G.segments[this.findSegment(_G.playerZ).index + 3].color = COLORS.START;
        for(let n = 0 ; n < _G.rumbleLength ; ++n)
          _G.segments[_G.segments.length-1-n].color = COLORS.FINISH;
        _G.trackLength = _G.segments.length * _G.segmentLength;
      },
      findSegment(z){
        return _G.segments[int(z/_G.segmentLength) % _G.segments.length];
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
      rumbleWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(6,  2*lanes); },
      laneMarkerWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(32, 8*lanes); },
      __update(dt){
        let dx = dt * 2 * (_G.speed/_G.maxSpeed); // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

        _G.position = this.__increase(_G.position, dt * _G.speed, _G.trackLength);
        _G.keyLeft=false;
        if(_I.keyDown(_I.LEFT)){
          _G.playerX = _G.playerX - dx;
          _G.keyLeft=true;
        }
        _G.keyRight=false;
        if(_I.keyDown(_I.RIGHT)){
          _G.playerX = _G.playerX + dx;
          _G.keyRight=true;
        }

        _G.keyFaster=false;
        if(_I.keyDown(_I.UP)){
          _G.keyFaster=true;
        }

        _G.keySlower=false;
        if(_I.keyDown(_I.DOWN)){
          _G.keySlower=true;
        }


        if(_G.keyFaster)
          _G.speed = this.__accelerate(_G.speed, _G.accel, dt);
        else if(_G.keySlower)
          _G.speed = this.__accelerate(_G.speed, _G.breaking, dt);
        else
          _G.speed = this.__accelerate(_G.speed, _G.decel, dt);

        if(((_G.playerX < -1) || (_G.playerX > 1)) && (_G.speed > _G.offRoadLimit))
          _G.speed = this.__accelerate(_G.speed, _G.offRoadDecel, dt);

        _G.playerX = this.__limit(_G.playerX, -2, 2);     // dont ever let player go too far out of bounds
        _G.speed   = this.__limit(_G.speed, 0, _G.maxSpeed); // or exceed maxSpeed
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


