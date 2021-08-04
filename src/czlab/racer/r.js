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

    const int=Math.floor;
    const ceil=Math.ceil;

    const COLORS={
      SKY:  "#72D7EE",
      TREE: "#005108",
      FOG:  "#005108",
      LIGHT:{ road: "#6B6B6B", grass: "#10AA10", rumble: "#555555", lane: "#CCCCCC"  },
      DARK:{ road: "#696969", grass: "#009A00", rumble: "#BBBBBB"                   },
      START:{ road: "white",   grass: "white",   rumble: "white"                     },
      FINISH:{ road: "black",   grass: "black",   rumble: "black"                     }
    };

    const BACKGROUND ={
      HILLS: { x:   5, y:   5, w: 1280, h: 480 },
      SKY:   { x:   5, y: 495, w: 1280, h: 480 },
      TREES: { x:   5, y: 985, w: 1280, h: 480 }
    };

    const SPRITES ={
      PALM_TREE:              { x:    5, y:    5, w:  215, h:  540 },
      BILLBOARD08:            { x:  230, y:    5, w:  385, h:  265 },
      TREE1:                  { x:  625, y:    5, w:  360, h:  360 },
      DEAD_TREE1:             { x:    5, y:  555, w:  135, h:  332 },
      BILLBOARD09:            { x:  150, y:  555, w:  328, h:  282 },
      BOULDER3:               { x:  230, y:  280, w:  320, h:  220 },
      COLUMN:                 { x:  995, y:    5, w:  200, h:  315 },
      BILLBOARD01:            { x:  625, y:  375, w:  300, h:  170 },
      BILLBOARD06:            { x:  488, y:  555, w:  298, h:  190 },
      BILLBOARD05:            { x:    5, y:  897, w:  298, h:  190 },
      BILLBOARD07:            { x:  313, y:  897, w:  298, h:  190 },
      BOULDER2:               { x:  621, y:  897, w:  298, h:  140 },
      TREE2:                  { x: 1205, y:    5, w:  282, h:  295 },
      BILLBOARD04:            { x: 1205, y:  310, w:  268, h:  170 },
      DEAD_TREE2:             { x: 1205, y:  490, w:  150, h:  260 },
      BOULDER1:               { x: 1205, y:  760, w:  168, h:  248 },
      BUSH1:                  { x:    5, y: 1097, w:  240, h:  155 },
      CACTUS:                 { x:  929, y:  897, w:  235, h:  118 },
      BUSH2:                  { x:  255, y: 1097, w:  232, h:  152 },
      BILLBOARD03:            { x:    5, y: 1262, w:  230, h:  220 },
      BILLBOARD02:            { x:  245, y: 1262, w:  215, h:  220 },
      STUMP:                  { x:  995, y:  330, w:  195, h:  140 },
      SEMI:                   { x: 1365, y:  490, w:  122, h:  144 },
      TRUCK:                  { x: 1365, y:  644, w:  100, h:   78 },
      CAR03:                  { x: 1383, y:  760, w:   88, h:   55 },
      CAR02:                  { x: 1383, y:  825, w:   80, h:   59 },
      CAR04:                  { x: 1383, y:  894, w:   80, h:   57 },
      CAR01:                  { x: 1205, y: 1018, w:   80, h:   56 },
      PLAYER_UPHILL_LEFT:     { x: 1383, y:  961, w:   80, h:   45 },
      PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w:   80, h:   45 },
      PLAYER_UPHILL_RIGHT:    { x: 1385, y: 1018, w:   80, h:   45 },
      PLAYER_LEFT:            { x:  995, y:  480, w:   80, h:   41 },
      PLAYER_STRAIGHT:        { x: 1085, y:  480, w:   80, h:   41 },
      PLAYER_RIGHT:           { x:  995, y:  531, w:   80, h:   41 }
    };

    SPRITES.SCALE = 0.3 * (1/SPRITES.PLAYER_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth
    SPRITES.BILLBOARDS = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
    SPRITES.PLANTS     = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3];
    SPRITES.CARS       = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK];

    function _initLevel(){
      _G.segments= []; // road segments
      _G.bg = null;
      _G.resolution    = null; // scaling factor to provide resolution independence (computed)
      _G.roadWidth = 2000;    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
      _G.segmentLength = 200;
      _G.rumbleLength  = 3; // number of segments per red/white rumble strip
      _G.trackLength   = null; // z length of entire track (computed)
      _G.lanes      = 3;
      _G.fieldOfView   = 100; // angle (degrees) for field of view
      _G.cameraHeight  = 1000; // z height of camera
      _G.cameraDepth   = null; // z distance camera is from screen (computed)
      _G.drawDistance  = 300;    // number of segments to draw
      _G.playerX       = 0; // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
      _G.playerZ       = null;  // player relative z distance from camera (computed)
      _G.fogDensity    = 5;  // exponential fog density
      _G.position      = 0;     // current camera Z position (add playerZ to get player's absolute Z position)
      _G.speed         = 0;                       // current speed
      _G.maxSpeed      = _G.segmentLength/step; // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
      _G.accel         =  _G.maxSpeed/5;             // acceleration rate - tuned until it 'felt' right
      _G.braking      = -_G.maxSpeed;               // deceleration rate when braking
      _G.decel         = -_G.maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
      _G.offRoadDecel  = -_G.maxSpeed/2;             // off road deceleration is somewhere in between
      _G.offRoadLimit  =  _G.maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
      _G.keyLeft       = false;
      _G.keyRight      = false;
      _G.keyFaster     = false;
      _G.keySlower     = false;
    }

    _Z.defScene("level1",{
      setup(){
        _initLevel();
        this.reset();
      },
      reset(options){
        options = options || {};
        _G.cameraDepth = 1 / Math.tan((_G.fieldOfView/2) * Math.PI/180);
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _G.playerZ  = (_G.cameraHeight * _G.cameraDepth);
        _G.resolution = _G.arena.height/480;
        this.resetRoad(); // only rebuild road when necessary
      },
      resetRoad(){
        _G.segments = [];
        for(let i=0 ; i<500; ++i){
          _G.segments.push({
             index: i,
             color: int(n/_G.rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT,
             p1:{world:{ z: n *_G.segmentLength}, camera:{}, screen:{} },
             p2:{world:{ z: (n+1)*_G.segmentLength}, camera:{}, screen:{} }
          });
        }
        _G.segments[this.findSegment(_G.playerZ).index + 2].color = COLORS.START;
        _G.segments[this.findSegment(_G.playerZ).index + 3].color = COLORS.START;
        for(let j=0 ; j< _G.rumbleLength; ++j)
          _G.segments[_G.segments.length-1-n].color = COLORS.FINISH;
        _G.trackLength = _G.segments.length * _G.segmentLength;
      },
      findSegment(z){
        return _G.segments[int(z/_G.segmentLength) % _G.segments.length]
      },
      drawBackgd(background, width, height, layer, rotation, offset){
        rotation = rotation || 0;
        offset   = offset   || 0;
        let imageW = layer.w/2;
        let imageH = layer.h;
        let sourceX = layer.x + int(layer.w * rotation);
        let sourceY = layer.y
        let sourceW = Math.min(imageW, layer.x+layer.w-sourceX);
        let sourceH = imageH;
        let destX = 0;
        let destY = offset;
        let destW = int(width * (sourceW/imageW));
        let destH = height;
        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if(sourceW < imageW)
          ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
      },
      draw3d(){
        let width=_G.arena.width, height=_G.arena.height,maxy = height;
        let baseSegment = this.findSegment(_G.position);
        this.gfx.clear();
        this.drawBackgd(_G.bg, width, height, BACKGROUND.SKY);
        this.drawBackgd(_G.bg, width, height, BACKGROUND.HILLS);
        this.drawBackgd(_G.bg, width, height, BACKGROUND.TREES);
        let n, segment;
        for(n=0 ; n< _G.drawDistance ; ++n){
          segment= _G.segments[(baseSegment.index + n) % _G.segments.length];
          segment.looped = segment.index < baseSegment.index;
          segment.fog= Util.exponentialFog(n/_G.drawDistance, _G.fogDensity);
          Util.project(segment.p1, (_G.playerX * _G.roadWidth), _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, width, height, _G.roadWidth);
          Util.project(segment.p2, (_G.playerX * _G.roadWidth), _G.cameraHeight, _G.position - (segment.looped ? _G.trackLength : 0), _G.cameraDepth, width, height, _G.roadWidth);
          if((segment.p1.camera.z <= _G.cameraDepth) || // behind us
              (segment.p2.screen.y >= maxy))          // clip by (already rendered) segment
            continue;
          drawSegment(width, _G.lanes, segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
                      segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w, segment.fog, segment.color);
          maxy = segment.p2.screen.y;
        }
        drawPlayer(width, height, _G.resolution, _G.roadWidth, sprites, _G.speed/_G.maxSpeed,
                   _G.cameraDepth/_G.playerZ, width/2, height, _G.speed * (keyLeft ? -1 : keyRight ? 1 : 0), 0);
      },
      drawSegment(width, lanes, x1, y1, w1, x2, y2, w2, fog, color){
        let r1 = this.rumbleWidth(w1, lanes),
            r2 = this.rumbleWidth(w2, lanes),
            l1 = this.laneMarkerWidth(w1, lanes),
            l2 = this.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        this.drawPolygon(x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
        this.drawPolygon(x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
        this.drawPolygon(x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
        if(color.lane){
          lanew1 = w1*2/lanes;
          lanew2 = w2*2/lanes;
          lanex1 = x1 - w1 + lanew1;
          lanex2 = x2 - w2 + lanew2;
          for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
            this.drawPolygon(lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
        }
        this.drawFog(0, y1, width, y2-y1, fog);
      },
      timestamp(){ return new Date().getTime(); },
      toInt(obj, def){ if (obj !== null) { let x = parseInt(obj, 10); if (!isNaN(x)) return x; } return this.toInt(def, 0); },
      toFloat(obj, def){ if (obj !== null) { let x = parseFloat(obj);   if (!isNaN(x)) return x; } return this.toFloat(def, 0.0); },
      limit(value, min, max){ return Math.max(min, Math.min(value, max));                     },
      randomInt(min, max){ return Math.round(this.interpolate(min, max, Math.random()));   },
      randomChoice(options){ return options[this.randomInt(0, options.length-1)];            },
      percentRemaining(n, total){ return (n%total)/total;                                         },
      accelerate(v, accel, dt){ return v + (accel * dt);                                        },
      interpolate(a,b,percent){ return a + (b-a)*percent                                        },
      easeIn(a,b,percent){ return a + (b-a)*Math.pow(percent,2);                           },
      easeOut(a,b,percent){ return a + (b-a)*(1-Math.pow(1-percent,2));                     },
      easeInOut(a,b,percent){ return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        },
      exponentialFog(distance, density) { return 1 / (Math.pow(Math.E, (distance * distance * density))); },
      increase(start, increment, max){ // with looping
        let result = start + increment;
        while(result >= max) result -= max;
        while(result < 0) result += max;
        return result;
      },
      overlap(x1, w1, x2, w2, percent){
        let half = (percent || 1)/2;
        let min1 = x1 - (w1*half);
        let max1 = x1 + (w1*half);
        let min2 = x2 - (w2*half);
        let max2 = x2 + (w2*half);
        return ! ((max1 < min2) || (min1 > max2));
      },
      project3d(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth){
        p.camera.x     = (p.world.x || 0) - cameraX;
        p.camera.y     = (p.world.y || 0) - cameraY;
        p.camera.z     = (p.world.z || 0) - cameraZ;
        p.screen.scale = _G.cameraDepth/p.camera.z;
        p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
        p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
        p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
      },
      drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
      },
      drawPlayer(width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown){
        let bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
        let sprite;
        if(steer<0)
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
        else if(steer > 0)
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
        else
          sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
        this.drawSprite(width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
      },
      drawSprite(width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY){
        //  scale for projection AND relative to roadWidth (for tweakUI)
        let destW  = (sprite.width * scale * width/2) * (SPRITES.SCALE * roadWidth);
        let destH  = (sprite.height * scale * width/2) * (SPRITES.SCALE * roadWidth);
        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));
        let clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
        if(clipH < destH)
          ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);
      },
      drawFog(x, y, width, height, fog){
        if(fog < 1){
          ctx.globalAlpha = (1-fog)
          ctx.fillStyle = COLORS.FOG;
          ctx.fillRect(x, y, width, height);
          ctx.globalAlpha = 1;
        }
      },
      rumbleWidth(projectedRoadWidth, lanes){ return projectedRoadWidth/Math.max(6,  2*lanes) },
      laneMarkerWidth(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes) },
      postUpdate(dt){
        _G.position = this.increase(_G.position, dt * _G.speed, _G.trackLength);
        let dx = dt * 2 * (_G.speed/_G.maxSpeed); // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
        if(_I.keyDown(_I.LEFT))
          _G.playerX -= dx;
        else if(_I.keyDown(_I.RIGHT))
          _G.playerX += dx;

        if(_I.keyDown(_I.UP))
          _G.speed = this.accelerate(_G.speed, _G.accel, dt);
        else if(_I.keyDown(_I.DOWN))
          _G.speed = this.accelerate(_G.speed, _G.braking, dt);
        else
          _G.speed = this.accelerate(_G.speed, _G.decel, dt);

        if(((_G.playerX < -1) || (_G.playerX > 1)) && (_G.speed > _G.offRoadLimit))
          _G.speed = this.accelerate(_G.speed, _G.offRoadDecel, dt);

        _G.playerX = this.limit(_G.playerX, -2, 2);     // dont ever let player go too far out of bounds
        _G.speed   = this.limit(_G.speed, 0, m_G.axSpeed); // or exceed maxSpeed

        this.draw3d();
      }
    });
  }

	const _$={
    //assetFiles: [],
    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

	window.addEventListener("load",()=> MojoH5(_$));

})(this);

