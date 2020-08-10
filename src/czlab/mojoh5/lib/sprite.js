(function(global,undefined){
  "use strict";
  let window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Sprites=function(Mojo) {
    let _S={},
      _=Mojo.u,
      is=Mojo.is,
      dom=Mojo.dom,
      _shakingSprites = [];

    _.inject(Mojo.p, {
      Matrix: PIXI.Matrix.TEMP_MATRIX,
      RTexture: PIXI.RenderTexture,
      Rectangle: PIXI.Rectangle,
      BText: PIXI.BitmapText,
      Sprite: PIXI.Sprite,
      Graphics: PIXI.Graphics,
      Text: PIXI.Text,
      TSprite: PIXI.TilingSprite,
      ASprite: PIXI.AnimatedSprite,
      PContainer: PIXI.ParticleContainer });

    /**
     * @private
     * @function
     */
    function _enhanceAnimSprite(s) {
      let timeInterval,
        frameCounter = 0,
        startFrame = 0,
        endFrame = 0,
        numberOfFrames = 0;
      function reset() {
        if(s.animating && timerInterval !== undefined) {
          s.animating = false;
          frameCounter=
          startFrame=
          endFrame=
          numberOfFrames = 0;
          _.clrTimer(timerInterval);
        }
      }
      s.show = (frame) => { reset(); s.gotoAndStop(frame); };
      s.stopAnimation = () => { reset(); s.gotoAndStop(s.currentFrame); }
      function advanceFrame() {
        if(frameCounter < numberOfFrames+1) {
          s.gotoAndStop(s.currentFrame+1);
          frameCounter += 1;
        } else if(s.loop) {
          s.gotoAndStop(startFrame);
          frameCounter = 1;
        }
      }
      s.playAnimation= (seq) => {
        reset();
        if(seq) {
          endFrame = seq[1];
          startFrame = seq[0];
        } else {
          startFrame = 0;
          endFrame = s.totalFrames - 1;
        }
        numberOfFrames = endFrame - startFrame;
        if(!s.fps) s.fps = 12;
        let frameRate = 1000 / s.fps;
        s.gotoAndStop(startFrame);
        frameCounter = 1;
        if(!s.animating) {
          timerInterval = _.setTimer(advanceFrame.bind(this), frameRate);
          s.animating = true;
        }
      }
    }
    /**
     * @private
     * @function
     */
    function _getCenter(o, dimension, axis) {
      if(o.anchor !== undefined) {
        return (o.anchor[axis] !== 0) ? 0 : dimension / 2;
      } else {
        return dimension;
      }
    }
    /**
     * @public
     * @function
     * Make a sprite ease to the position of another sprite.
     * Parameters:
     * a. A sprite object. This is the `follower` sprite.
     * b. A sprite object. This is the `leader` sprite that the follower will chase.
     * c. The easing value, such as 0.3. A higher number makes the follower move faster.
       gu.followEase(follower, leader, speed);
     */
    _S.followEase=function(follower, leader, speed) {
      let vx = (leader.x + _getCenter(leader, leader.width, "x")) - (follower.x + _getCenter(follower, follower.width, "x")),
          vy = (leader.y + _getCenter(leader, leader.height, "y")) - (follower.y + _getCenter(follower, follower.height, "y")),
          distance = _.sqrt(vx * vx + vy * vy);
      //Move the follower if it's more than 1 pixel
      //away from the leader
      if(distance >= 1) {
        follower.x += vx * speed;
        follower.y += vy * speed;
      }
    };
    /**
     * @public
     * @function
     * Make a sprite move towards another sprite at a constant speed.
     * Parameters:
     * a. A sprite object. This is the `follower` sprite.
     * b. A sprite object. This is the `leader` sprite that the follower will chase.
     * c. The speed value, such as 3. The is the pixels per frame that the sprite will move. A higher number makes the follower move faster.
       gu.followConstant(follower, leader, speed);
     */
    _S.followConstant=function(follower, leader, speed) {
      let vx = (leader.x + _getCenter(leader, leader.width, "x")) - (follower.x + _getCenter(follower, follower.width, "x")),
          vy = (leader.y + _getCenter(leader, leader.height, "y")) - (follower.y + _getCenter(follower, follower.height, "y")),
          distance = _.sqrt(vx * vx + vy * vy);
      //Move the follower if it's more than 1 move away from the leader
      if(distance >= speed) {
        follower.x += (vx / distance) * speed;
        follower.y += (vy / distance) * speed;
      }
    };
    /**
     * @public
     * @function
     * Return the angle in Radians between two sprites.
     * Parameters:
     * a. A sprite object.
     * b. A sprite object.
     * You can use it to make a sprite rotate towards another sprite like this:
     * box.rotation = gu.angle(box, pointer);
     */
    _S.angle= function(s1, s2) {
      return Math.atan2(
        //This is the code you need if you don't want to compensate
        //for a possible shift in the sprites' x/y anchor points
        /*
        (s2.y + s2.height / 2) - (s1.y + s1.height / 2),
        (s2.x + s2.width / 2) - (s1.x + s1.width / 2)
        */
        //This code adapts to a shifted anchor point
        (s2.y + _getCenter(s2, s2.height, "y")) - (s1.y + _getCenter(s1, s1.height, "y")),
        (s2.x + _getCenter(s2, s2.width, "x")) - (s1.x + _getCenter(s1, s1.width, "x"))
      );
    };
    /**
     * @public
     * @function
     * Make a sprite rotate around another sprite.
     * Parameters:
     * a. The sprite you want to rotate.
     * b. The sprite around which you want to rotate the first sprite.
     * c. The distance, in pixels, that the roating sprite should be offset from the center.
     * d. The angle of rotations, in radians.
     * gu.rotateAroundSprite(orbitingSprite, centerSprite, 50, angleInRadians);
     * Use it inside a game loop, and make sure you update the angle value (the 4th argument) each frame.
     */
    _S.rotateAroundSprite= function(rotatingSprite, centerSprite, distance, angle) {
      rotatingSprite.x
        = (centerSprite.x + _getCenter(centerSprite, centerSprite.width, "x")) - rotatingSprite.parent.x
        + (distance * Math.cos(angle))
        - _getCenter(rotatingSprite, rotatingSprite.width, "x");

      rotatingSprite.y
        = (centerSprite.y + _getCenter(centerSprite, centerSprite.height, "y")) - rotatingSprite.parent.y
        + (distance * Math.sin(angle))
        - _getCenter(rotatingSprite, rotatingSprite.height, "y");
    };
    /**
     * @public
     * @function
     * Make a point rotate around another point.
     * Parameters:
     * a. The point you want to rotate.
     * b. The point around which you want to rotate the first point.
     * c. The distance, in pixels, that the roating sprite should be offset from the center.
     * d. The angle of rotations, in radians.
     * gu.rotateAroundPoint(orbitingPoint, centerPoint, 50, angleInRadians);
     * Use it inside a game loop, and make sure you update the angle value (the 4th argument) each frame.
     */
    _S.rotateAroundPoint=function(pointX, pointY, distanceX, distanceY, angle) {
      return _.p2(pointX + Math.cos(angle) * distanceX, pointY + Math.sin(angle) * distanceY );
    };
    _S.move=function(...sprites) {
      if(sprites.length===1 && is.vec(sprites[0])) {
        sprites=sprites[0];
      }
      sprites.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
      });
    };
    /**
     * @public
     * @function
     * The `lineOfSight` method will return `true` if there’s clear line of sight
     * between two sprites, and `false` if there isn’t. Here’s how to use it in your game code:
     *  monster.lineOfSight = gu.lineOfSight(
     *      monster, //Sprite one
     *      alien,   //Sprite two
     *      boxes,   //An array of obstacle sprites
     *      16       //The distance between each collision point
     *  );
     * The 4th argument determines the distance between collision points.
     * For better performance, make this a large number, up to the maximum
     * width of your smallest sprite (such as 64 or 32). For greater precision,
     * use a smaller number. You can use the lineOfSight value to decide how
     * to change certain things in your game. For example:
     *
     *  if (monster.lineOfSight)
     *    monster.show(monster.states.angry)
     *  else
     *    monster.show(monster.states.normal)
     *
     */
    _S.lineOfSight= function(s1, s2, obstacles, segment = 32) {
      //The distance between collision points
      let spriteOneCenterX = s1.x + _getCenter(s1, s1.width, "x"),
        spriteOneCenterY = s1.y + _getCenter(s1, s1.height, "y"),
        spriteTwoCenterX = s2.x + _getCenter(s2, s2.width, "x"),
        spriteTwoCenterY = s2.y + _getCenter(s2, s2.height, "y"),
        //Plot a vector between spriteTwo and spriteOne
        vx = spriteTwoCenterX - spriteOneCenterX,
        vy = spriteTwoCenterY - spriteOneCenterY,
        magnitude = Math.sqrt(vx * vx + vy * vy),
        //How many points will we need to test?
        numberOfPoints = magnitude / segment;

      //Create an array of x/y points, separated by 64 pixels, that
      //extends from `spriteOne` to `spriteTwo`
      let points = () => {
        let arrayOfPoints = [];
        //Create a point object for each segment of the vector and
        //store its x/y position as well as its index number on
        //the map array
        for(let i=1; i<=numberOfPoints; ++i) {
          let newMagnitude = segment * i;
          //Find the unit vector. This is a small, scaled down version of
          //the vector between the sprites that's less than one pixel long.
          //It points in the same direction as the main vector, but because it's
          //the smallest size that the vector can be, we can use it to create
          //new vectors of varying length
          let dx = vx / magnitude,
            dy = vy / magnitude,
            //Use the unit vector and newMagnitude to figure out the x/y
            //position of the next point in this loop iteration
            x = spriteOneCenterX + dx * newMagnitude,
            y = spriteOneCenterY + dy * newMagnitude;
          _.conj(arrayOfPoints.push(_.p2(x, y)));
        }
        return arrayOfPoints;
      };
      let hitTestPoint = (point, sprite) => {
        //Find out if the point's position is inside the area defined
        //by the sprite's left, right, top and bottom sides
        let left = point.x > sprite.x,
          right = point.x < (sprite.x + sprite.width),
          top = point.y > sprite.y,
          bottom = point.y < (sprite.y + sprite.height);
        //If all the collision conditions are met, you know the
        //point is intersecting the sprite
        return left && right && top && bottom;
      };
      //The `noObstacles` function will return `true` if all the tile
      //index numbers along the vector are `0`, which means they contain
      //no obstacles. If any of them aren't 0, then the function returns
      //`false` which means there's an obstacle in the way
      let noObstacles = points().every(pt => {
        return obstacles.every(o => {
          return !hitTestPoint(pt, o);
        });
      });

      return noObstacles;
    };
    /**
     * @public
     * @function
     *
     * Find the distance in pixels between two sprites.
     */
    _S.distance= function(s1, s2) {
      let vx = (s2.x + _getCenter(s2, s2.width, "x")) - (s1.x + _getCenter(s1, s1.width, "x")),
        vy = (s2.y + _getCenter(s2, s2.height, "y")) - (s1.y + _getCenter(s1, s1.height, "y"));
      return _.sqrt(vx * vx + vy * vy);
    };
    /**
     * @public
     * @function
     */
    _S.update= (dt) => {
      _.rseq(s => s.updateShake && s.updateShake());
    };
    /**
     * @private
     * @function
     */
    function _sprite(source, width, height, tiling, x, y) {
      let C= tiling ? Mojo.p.TSprite : Mojo.p.Sprite;
      let o, texture;
      if(is.str(source)) {
        texture= Mojo.p.TCache[source];
        if(!texture)
          texture = Mojo.p.Texture.fromImage(source);
        if(!texture)
          throw `Error: ${source} not found`;
        o= tiling ? new C(texture,width,height) : new C(texture);
      } else if(_.inst(Mojo.p.Texture,source)) {
        o= tiling ? new C(source,width,height) : new C(source);
      } else if(is.vec(source)) {
        if(is.str(source[0])) {
          o= Mojo.p.ASprite[Mojo.p.TCache[source[0]] ? "fromFrames" : "fromImages"](source);
        } else if(_.inst(Mojo.p.Texture,source[0])) {
          o = new Mojo.p.ASprite(source);
        }
      }
      if(o) {
        o.x = x;
        o.y = y;
        if(width) o.width = width;
        if(height) o.height = height;
      }
      return o;
    }
    /**
     * @public
     * @function
     */
    _S.sprite= function(source, x=0, y=0) {
      let o= _sprite(source,0,0,false,x,y);
      _.inst(Mojo.p.ASprite,o) && _enhanceAnimSprite(o);
      return o;
    };
    /**
     * @public
     * @function
     */
    _S.tilingSprite= function(source, width, height, x, y) {
      if(width === undefined || height === undefined)
        throw "Error: tilingSprite() requires width and height";
      let o = _sprite(source, width, height, true, x,y);
      Object.defineProperties(o, {

        "tileX": _.pdef({
          get() { return o.tilePosition.x; },
          set(v) { o.tilePosition.x = v; }}),

        "tileY": _.pdef({
          get() { return o.tilePosition.y; },
          set(v) { o.tilePosition.y = v; }}),

        "tileScaleX": _.pdef({
          get() { return o.tileScale.x; },
          set(v) { o.tileScale.x = v; }}),

        "tileScaleY": _.pdef({
          get() { return o.tileScale.y; },
          set(v) { o.tileScale.y = v; }})

      });
      return o
    };
    /**
     * @public
     * @function
     */
    _S.animation=function(texture, tileW, tileH, spacing = 0) {
      let pos= [],
        t= Mojo.p.TCache[texture],
        cols = t.width / tileW,
        rows = t.height / tileH,
        cells = cols * rows;
      for(let x,y,i=0; i<cells; ++i) {
        x = (i % cols) * tileW;
        y = _.floor(i / cols) * tileH;
        //Compensate for any optional spacing (padding) around the tiles if
        //there is any. This bit of code accumlates the spacing offsets from the
        //left side of the tileset and adds them to the current tile's position
        if(spacing > 0) {
          x += spacing + (spacing * i % cols);
          y += spacing + (spacing * _.floor(i/cols));
        }
        _.conj(pos,[x, y]);
      }
      return this.frames(texture, pos, tileW, tileH);
    };
    /**
     * @public
     * @function
     */
    _S.frame=function(source, width, height,x,y) {
      let obj, texture;
      if(is.str(source)) {
        obj=Mojo.p.TCache[source];
        if(obj)
          texture = new Mojo.p.Texture(obj);
      } else if(_.inst(Mojo.p.Texture,source)) {
        texture = new Mojo.p.Texture(source);
      }
      if(!texture)
        throw `Error: ${source} not loaded`;
      texture.frame = new Mojo.p.Rectangle(x, y, width, height);
      return texture;
    };
    /**
     * @public
     * @function
     */
    _S.frames=function(source, coordinates, tileW, tileH) {
      let obj,texture;
      if(is.str(source)) {
        obj=Mojo.p.TCache[source];
        if(obj)
          texture = new Mojo.p.Texture(obj);
      } else if (_.inst(Mojo.p.Texture,source)) {
        texture = new Mojo.p.Texture(source);
      }
      if (!texture)
        throw `Error: ${source} not loaded`;
      return coordinates.map(p => {
        let f= new Mojo.p.Texture(texture);
        f.frame = new Mojo.p.Rectangle(p[0], p[1], tileW, tileH);
        return f;
      });
    };
    /**
     * @public
     * @function
     */
    _S.frameSeries=function(startNumber, endNumber, baseName, extension) {
      let frames = [];
      for(let i=startNumber; i < endNumber+1; ++i) {
        _.conj(frames, Mojo.p.TCache[`${baseName + i + extension}`]);
      }
      return frames;
    };
    /**
     * @public
     * @function
     */
    _S.text=function(content,fontSpec, x = 0, y = 0) {
      let msg = new Mojo.p.Text(content, fontSpec);
      msg._content = content;
      msg.x = x;
      msg.y = y;
      Object.defineProperty(msg, "content", _.pdef({
        get() { return this._content; },
        set(v) { this._content = v; this.text = v; }
      }));
      return msg;
    };
    /**
     * @public
     * @function
     */
    _S.bitmapText= function(content, font, align, tint, x = 0, y = 0) {
      let msg = new Mojo.p.BText(content, {font: font, align: align, tint: tint});
      msg._content = content;
      msg.x = x;
      msg.y = y;
      Object.defineProperty(msg, "content", _.pdef({
        get() { return this._content; },
        set(v) { this._content = v; this.text = v; }
      }));
      return msg;
    };
    /**
     * @public
     * @function
     */
    _S.rectangle=function(width, height,
      fillStyle = 0xFF3300,
      strokeStyle = 0x0033CC, lineWidth = 0, x = 0, y = 0) {

      let self=this,
        o = new Mojo.p.Graphics();
      o.__sprite = undefined;
      o.__width = width;
      o.__height = height;
      o.__fillStyle = this.color(fillStyle);
      o.__strokeStyle = this.color(strokeStyle);
      o.__lineWidth = lineWidth;

      let draw = (width, height, fillStyle, strokeStyle, lineWidth) => {
        o.clear();
        o.beginFill(fillStyle);
        if(lineWidth > 0)
          o.lineStyle(lineWidth, strokeStyle, 1);
        o.drawRect(0, 0, width, height);
        o.endFill();
      };
      draw(o.__width, o.__height, o.__fillStyle, o.__strokeStyle, o.__lineWidth);
      let sprite = new Mojo.p.Sprite(_S.generateTexture(o));
      sprite.x = x;
      sprite.y = y;
      Object.defineProperties(sprite, {
        "fillStyle": _.pdef({
          get() { return o.__fillStyle; },
          set(v) {
            o.__fillStyle = self.color(v);
            draw(o.__width, o.__height, o.__fillStyle, o.__strokeStyle, o.__lineWidth);
            o.__sprite.texture = _S.generateTexture(o);
          }}),
        "strokeStyle": _.pdef({
          get() { return o.__strokeStyle; },
          set(v) {
            o.__strokeStyle = self.color(v);
            draw(o.__width, o.__height, o.__fillStyle, o.__strokeStyle, o.__lineWidth);
            o.__sprite.texture = _S.generateCanvasTexture(o); } }),
        "lineWidth": _.pdef({
          get() { return o.__lineWidth; },
          set(v) {
            o.__lineWidth = v;
            draw(o.__width, o.__height, o.__fillStyle, o.__strokeStyle, o.__lineWidth);
            o.__sprite.texture = _S.generateCanvasTexture(o);
          }})
      });
      return (o.__sprite = sprite);
    };
    /**
     * @public
     * @function
     */
    _S.circle= function(diameter, fillStyle=0xFF3300, strokeStyle=0x0033CC, lineWidth=0, x=0, y=0) {
      let self=this,
        o = new Mojo.p.Graphics();
      o._diameter = diameter;
      o._fillStyle = this.color(fillStyle);
      o._strokeStyle = this.color(strokeStyle);
      o._lineWidth = lineWidth;

      let draw = (diameter, fillStyle, strokeStyle, lineWidth) => {
        o.clear();
        o.beginFill(fillStyle);
        if(lineWidth > 0)
          o.lineStyle(lineWidth, strokeStyle, 1);
        o.drawCircle(0, 0, diameter/2);
        o.endFill();
      };
      draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);
      let sprite = new this.Sprite(o.generateTexture());
      sprite.x = x;
      sprite.y = y;
      Object.defineProperties(sprite, {
        "fillStyle": _.pdef({
          get() { return o._fillStyle; },
          set(v) {
            o._fillStyle = self.color(v);
            draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);
            o._sprite.texture = o.generateTexture(); } }),
        "strokeStyle": _.pdef({
          get() { return o._strokeStyle; },
          set(v) {
            o._strokeStyle = self.color(v);
            draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);
            o._sprite.texture = o.generateTexture(); } }),
        "diameter": _.pdef({
          get() { return o._diameter; },
          set(v) {
            o._lineWidth = 10;
            draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);
            o._sprite.texture = o.generateTexture(); } }),
        "radius": _.pdef({
          get() { return o._diameter/2; },
          set(v) {
            draw(v*2, o._fillStyle, o._strokeStyle, o._lineWidth);
            o._sprite.texture = o.generateTexture(); } })
      });
      return (o._sprite = sprite);
    };
    /**
     * @public
     * @function
     */
    _S.line=function(strokeStyle, lineWidth, ax = 0, ay = 0, bx = 32, by = 32) {
      let self=this,
        o = new Mojo.p.Graphics();
      o._strokeStyle = this.color(strokeStyle);
      o._width = lineWidth;
      o._ax = ax;
      o._ay = ay;
      o._bx = bx;
      o._by = by;
      let draw = (strokeStyle, lineWidth, ax, ay, bx, by) => {
        o.clear();
        o.lineStyle(lineWidth, strokeStyle, 1);
        o.moveTo(ax, ay);
        o.lineTo(bx, by);
      };
      draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
      Object.defineProperties(o, {
        "ax": _.pdef({
          get() { return o._ax; },
          set(v) {
            o._ax = v;
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } }),
        "ay": _.pdef({
          get() { return o._ay; },
          set(v) {
            o._ay = v;
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } }),
        "bx": _.pdef({
          get() { return o._bx; },
          set(v) {
            o._bx = v;
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } }),
        "by": _.pdef({
          get() { return o._by; },
          set(v) {
            o._by = v;
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } }),
        "strokeStyle": _.pdef({
          get() { return o._strokeStyle; },
          set(v) {
            o._strokeStyle = self.color(v);
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } }),
        "width": _.pdef({
          get() { return o._width; },
          set(v) {
            o._width = v;
            draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by); } })
      });
      return o;
    };
    /**
     * @public
     * @function
     */
    _S.grid= function(cols, rows, cellW, cellH,
                      isCenterCell, xOffset, yOffset, makeSprite, extra) {
      let container = new Mojo.p.Container();
      let length = cols * rows;
      for(let s,x,y,i = 0; i < length; ++i) {
        x = (i % cols) * cellW;
        y = _.floor(i / cols) * cellH;
        s= makeSprite();
        container.addChild(s);
        if(!isCenterCell) {
          s.x = x + xOffset;
          s.y = y + yOffset;
        } else {
          s.x = x + (cellW/2) - (s.width/2) + xOffset;
          s.y = y + (cellH/2) - (s.width/2) + yOffset;
        }
        extra && extra(s);
      }
      return container;
    };
    /**
     * @public
     * @function
     */
    _S.shoot=function(shooter, angle, container, bulletSpeed, bulletArray, bulletSprite,x,y) {
      let b= bulletSprite();
      b.anchor.set(0.5, 0.5);
      shooter.addChild(b);
      b.x = x;
      b.y = y;
      //Find the bullet's global coordinates so that we can use
      //them to position the bullet on the new parent container
      let tempGx = b.getGlobalPosition().x,
        tempGy = b.getGlobalPosition().y;
      container.addChild(b);
      b.x = tempGx;
      b.y = tempGy;
      //Set the bullet's velocity
      b.vx = Math.cos(angle) * bulletSpeed;
      b.vy = Math.sin(angle) * bulletSpeed;
      _.conj(bulletArray,b);
    };
    /**
     * @public
     * @function
     */
    _S.shake=function(sprite, magnitude = 16, angular = false) {
      let self = this,
        counter = 1,
        numberOfShakes = 10,
        startX = sprite.x,
        startY = sprite.y,
        startAngle = sprite.rotation,
        //Divide the magnitude into 10 units so that you can
        //reduce the amount of shake by 10 percent each frame
        magnitudeUnit = magnitude / numberOfShakes;
      function upAndDownShake() {
        if(counter < numberOfShakes) {
          sprite.x = startX;
          sprite.y = startY;
          magnitude -= magnitudeUnit;
          sprite.x += _.randXY(-magnitude, magnitude);
          sprite.y += _.randXY(-magnitude, magnitude);
          counter += 1;
        }
        if(counter >= numberOfShakes) {
          sprite.x = startX;
          sprite.y = startY;
          _.disj(_shakingSprites,sprite);
        }
      }
      let tiltAngle = 1;
      function angularShake() {
        if(counter < numberOfShakes) {
          sprite.rotation = startAngle;
          magnitude -= magnitudeUnit;
          //Rotate the sprite left or right, depending on the direction,
          //by an amount in radians that matches the magnitude
          sprite.rotation = magnitude * tiltAngle;
          counter += 1;
          //Reverse the tilt angle so that the sprite is tilted
          //in the opposite direction for the next shake
          tiltAngle *= -1;
        }
        //When the shaking is finished, reset the sprite's angle and
        //remove it from the `shakingSprites` array
        if(counter >= numberOfShakes) {
          sprite.rotation = startAngle;
          _.disj(_shakingSprites,sprite);
        }
      }
      if(!_.has(_shakingSprites,sprite)) {
        _.conj(_shakingSprites,sprite);
        sprite.updateShake = () => {
          angular ? angularShake() : upAndDownShake();
        };
      }
    };
    /**
     * @public
     * @function
     */
    _S.group=function(...sprites) {
      let c= new Mojo.p.Container();
      _.doseq(sprites, s => c.addChild(s));
      return c;
    };
    /**
     * @public
     * @function
     */
    _S.batch=function(size = 15000, options = {rotation: true,
                                               alpha: true, scale: true, uvs: true}) {
      return new Mojo.p.PContainer(size, options);
    };
    /**
     * @public
     * @function
     */
    _S.remove=function(...sprites) {
      if(sprites.length===1 && is.vec(sprites[0])) {
        sprites=sprites[0];
      }
      _.doseq(sprites, s => s.parent.removeChild(s));
    };
    /**
     *From: http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
     *Utilities to convert HTML color string names to hexadecimal codes
     * @public
     * @function
     */
    _S.colorToRGBA= function(color) {
      // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
      // color must be a valid canvas fillStyle. This will cover most anything
      // you'd want to use.
      // Examples:
      // colorToRGBA('red')  # [255, 0, 0, 255]
      // colorToRGBA('#f00') # [255, 0, 0, 255]
      let cvs, ctx;
      cvs = dom.newElm("canvas");
      cvs.height = 1;
      cvs.width = 1;
      ctx = cvs.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data;
    };
    /**
     * @public
     * @function
     */
    _S.byteToHex=function(num) {
      //turns a number (0-255) into a 2-character hex number (00-ff)
      //grab last 2 digits
      return ("0"+num.toString(16)).slice(-2);
    };
    /**
     * @public
     * @function
     */
    _S.colorToHex=function(color) {
      // Convert any CSS color to a hex representation
      // Examples:
      // colorToHex('red')            # '#ff0000'
      // colorToHex('rgb(255, 0, 0)') # '#ff0000'
      let rgba = this.colorToRGBA(color),
        hex = [0,1,2].map(i => this.byteToHex(rgba[i])).join("");
      return "0x" + hex;
    };
    /**
     * @public
     * @function
     */
    _S.color=function(value) {
      if(!isNaN(value)){
        return value;
      } else {
        return parseInt(this.colorToHex(value));
      }
    };
    /**
     * @public
     * @function
     */
    _S.swapChildren=function(par, c1, c2) {
      if(par && par.children) {
        let i1= par.children.indexOf(c1),
          i2 = par.children.indexOf(c2);
        if(i1 !== -1 && i2 !== -1) {
          c1.childIndex = i2;
          c2.childIndex = i1;
          par.children[i1] = c2;
          par.children[i2] = c1;
        }
      }
      return par;
    };
    /**
     * @public
     * @function
     */
    _S.add=function(par, ...sprites) {
      _.doseq(sprites,s => par.addChild(s));
      return par;
    };
    /**
     * @public
     * @function
     */
    _S.remove=function(par, ...sprites) {
      _.doseq(sprites,s => par.removeChild(s));
      return par;
    };
    /**
     * @public
     * @function
     */
    _S.extend=function(o) {
      let a, self = this;
      o=_.patch(o, {
        vx: 0, vy: 0,
        _layer: 0, _circular: false,
        _interact: false, _draggable: false, _bumpPropertiesAdded: true});
      a=o;
      function nudge(o, value, axis) {
        return o.anchor !== undefined
          ? (o.anchor[axis] === 0 ? value : value * ((1 - o.anchor[axis]) - o.anchor[axis])) : value;
      }
      function compensate(a, b, p1, p2) {
        let comp= (o, value, axis) => {
          return o.anchor ? (o.anchor[axis] !== 0 ? value * o.anchor[axis] : 0) : 0; };
        return comp(a, a[p1], p2) + comp(b, b[p1], p2);
      };
      //The `put` methods:
      //Center a sprite inside this sprite. `xOffset` and `yOffset`
      //arguments determine by how much the other sprite's position
      //should be offset from the center. These methods use the
      //sprites' global coordinates (`gx` and `gy`).
      //In all these functions, `b` is the second sprite that is being
      //positioned relative to the first sprite (this one), `a`.
      //Center `b` inside `a`.
      o.putCenter = function(b, xOffset = 0, yOffset = 0) {
        if(o._stage) a = Mojo.adjustForStage(o);
        b.x = (a.x + nudge(a, a.halfWidth, "x") - nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y + nudge(a, a.halfHeight, "y") - nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) o.adjustForParent(a, b);
      };
      //Position `b` to the left of `a`.
      o.putLeft = function(b, xOffset = 0, yOffset = 0) {
        if(o._stage) a = Mojo.adjustForStage(o);
        b.x = (a.x - nudge(b, b.width, "x")) + xOffset - compensate(a, b, "width", "x");
        b.y = (a.y + nudge(a, a.halfHeight, "y") - nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) o.adjustForParent(a, b);
      };
      //Position `b` above `a`.
      o.putTop = function(b, xOffset = 0, yOffset = 0) {
        if(o._stage) a = Mojo.adjustForStage(o);
        b.x = (a.x + nudge(a, a.halfWidth, "x") - nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y - nudge(b, b.height, "y")) + yOffset - compensate(a, b, "height", "y");
        if(!o._stage) o.adjustForParent(a, b);
      };
      //Position `b` to the right of `a`.
      o.putRight = function(b, xOffset = 0, yOffset = 0) {
        if(o._stage) a = Mojo.adjustForStage(o);
        b.x = (a.x + nudge(a, a.width, "x")) + xOffset + compensate(a, b, "width", "x");
        b.y = (a.y + nudge(a, a.halfHeight, "y") - nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) o.adjustForParent(a, b);
      };
      //Position `b` below `a`.
      o.putBottom = function(b, xOffset = 0, yOffset = 0) {
        if(o._stage) a = Mojo.adjustForStage(o);
        b.x = (a.x + nudge(a, a.halfWidth, "x") - nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y + nudge(a, a.height, "y")) + yOffset + compensate(a, b, "height", "y");
        if(!o._stage) o.adjustForParent(a, b);
      };
      //`adjustForParent` is a helper function for the above
      //`put` methods that subracts the parent's global position from
      //the nested child's position.
      o.adjustForParent = (a, b) => {
        if(b.parent.gx !== 0 || b.parent.gy !== 0) { b.x -= a.gx; b.y -= a.gy; }
      };
      Object.defineProperties(o, {
        "gx": _.pdef({
          get() { return o.getGlobalPosition().x } }),
        "gy": _.pdef({
          get() { return o.getGlobalPosition().y } }),
        "centerX": _.pdef({
          get() { return o.x + (o.width / 2) - o.xAnchorOffset; } }),
        "centerY": _.pdef({
          get() { return o.y + (o.height / 2) - o.yAnchorOffset; } }),
        "halfWidth": _.pdef({
          get() { return o.width / 2; }}),
        "halfHeight": _.pdef({
          get() { return o.height / 2; } }),
        "scaleModeNearest": _.pdef({
          set(v) {
            if(!o.texture.baseTexture) throw "Error: no baseTexture";
            o.texture.baseTexture.scaleMode =
              v ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR; } }),
        "pivotX": _.pdef({
          get() { return o.anchor.x; },
          set(v) {
            if(o.anchor === undefined)
              throw `${o} does not have a PivotX value`;
            o.anchor.x = v;
            if(!o._previousPivotX) {
              o.x += v * o.width;
            } else {
              o.x += (v - o._previousPivotX) * o.width;
            }
            o._previousPivotX = v; } }),
        "pivotY": _.pdef({
          get() { return o.anchor.y; },
          set(v) {
            if(o.anchor === undefined)
              throw `${o} does not have a PivotY value`;
            o.anchor.y = v;
            if(!o._previousPivotY) {
              o.y += v * o.height;
            } else {
              o.y += (v - o._previousPivotY) * o.height;
            }
            o._previousPivotY = v; } }),
        "xAnchorOffset": _.pdef({
          get() {
            return (o.anchor !== undefined) ? o.width * o.anchor.x : 0; } }),
        "yAnchorOffset": _.pdef({
          get() {
            return (o.anchor !== undefined) ? o.height * o.anchor.y : 0; } }),
        "scaleX": _.pdef({
          get() { return o.scale.x },
          set(v) { o.scale.x = v; } }),
        "scaleY": _.pdef({
          get() { return o.scale.y },
          set(value) { o.scale.y = value; } }),
        //Depth layer
        "layer": _.pdef({
          get() { return o._layer },
          set(v) {
            o._layer = v;
            if(o.parent) {
              //Sort the sprite’s parent’s `children` array so that sprites with a
              //higher `layer` value are moved to the end of the array
              o.parent.children.sort((a, b) => a.layer - b.layer);
            }
          } }),
        "interact": _.pdef({
          get() { return o._interact },
          set(v) {
            if(v) {
              if(!o._interact) {
                Mojo.makeInteractive(o);
                o._interact = true;
              }
            } else {
              if(_.disj(Mojo.Input.buttons, o))
                o._interact = false;
            }
          } }),
        //Drag and drop
        "draggable": _.pdef({
          get() { return o._draggable },
          set(v) {
            if(v) {
              if(!o._draggable) {
                Mojo.makeDraggable(o);
                o._draggable = true;
              }
            } else {
              Mojo.makeUndraggable(o)
              o._draggable = false;
            }
          } }),
        //The `localBounds` and `globalBounds` methods return an object
        //with `x`, `y`, `width`, and `height` properties that define
        //the dimensions and position of the sprite. This is a convenience
        //to help you set or test boundaries without having to know
        //these numbers or request them specifically in your code.
        "localBounds": _.pdef({
          get() {
            return { x: 0, y: 0, width: o.width, height: o.height }; } }),
        "globalBounds": _.pdef({
          get() { return { x: o.gx, y: o.gy, width: o.gx + o.width, height: o.gy + o.height }; } }),
        "empty": _.pdef({
          get() { return o.children.length === 0; } }),
        "circular": _.pdef({
          get() { return o._circular; },
          set(v) {
            if(v && o._circular === false) {
              Object.defineProperties(o, {
                "diameter": _.pdef({
                  get() { return o.width; },
                  set(v) { o.width = v; o.height = v; } }),
                "radius": _.pdef({
                  get() { return o.halfWidth; },
                  set(v) { o.width = v*2; o.height = v*2; } })
              });
              o._circular = true;
            }
            if(!value && o._circular) {
              delete o.diameter;
              delete o.radius;
              o._circular = false;
            }
          } })
      });
      o.setPosition = (x, y) => { o.x = x; o.y = y; };
      o.setScale = (xScale, yScale) => { o.scale.x = xScale; o.scale.y = yScale; };
      o.setPivot = (xPivot, yPivot) => { o.pivotX = xPivot; o.pivotY = yPivot; };
      if(o.circular)
        Object.defineProperty(o, "radius", _.pdef({
          get() { return o.width / 2; }
        }));
    };
    /**
     * Copied from pixi.legacy, why didn;t they want to keep this????
     * so useful!
     * @public
     * @function
     */
    _S.generateTexture = function(displayObject, scaleMode, resolution, region) {
      region = region || displayObject.getLocalBounds(null, true);
      // minimum texture size is 1x1, 0x0 will throw an error
      if(region.width === 0)
      { region.width = 1; }
      if(region.height === 0)
      { region.height = 1; }
      let renderTexture = Mojo.p.RTexture.create({
        width: region.width | 0,
        height: region.height | 0,
        scaleMode: scaleMode,
        resolution: resolution,
      });
      Mojo.p.Matrix.tx = -region.x;
      Mojo.p.Matrix.ty = -region.y;
      Mojo.ctx.render(displayObject, renderTexture, false, Mojo.p.Matrix, !!displayObject.parent);
      return renderTexture;
    };

    return Mojo.Sprites= _S;
  };


})(this);


