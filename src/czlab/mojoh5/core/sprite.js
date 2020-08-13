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
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

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
    const _S={},
      _=Mojo.u,
      is=Mojo.is,
      dom=Mojo.dom,
      _shakingSprites = [];

    //------------------------------------------------------------------------
    //create aliases for various PIXI objects
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
    //------------------------------------------------------------------------
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
          _.clear(timerInterval);
          s.animating = false;
          frameCounter= startFrame= endFrame= numberOfFrames = 0;
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
          timerInterval = _.timer(advanceFrame, frameRate);
          s.animating = true;
        }
      }
      return s;
    }
    /**
     * @private
     * @function
     */
    function old_getCenter(o, dimension, axis) {
      if(o.anchor !== undefined) {
        return (o.anchor[axis] !== 0) ? 0 : dimension / 2;
      } else {
        return dimension;
      }
    }
    function _getCenter(o, axis) {
      let dimension= axis==="x" ? o.width : (axis==="y" ? o.height : 0),
        middle= dimension/2,
        offset=middle,
        a= o.anchor && o.anchor[axis];
      //return is.num(a) ? (middle - a * dimension) : middle;
      //anchor values should be 0, 0.5 or 1, so below should be faster?!
      if(is.num(a)) {
        if(a > 0.7) offset = -middle; // 1
        else if (a > 0) offset =0; // 0.5
      }
      return offset;
    }
    function _midY(o) { return o.y + _getCenter(o,"y"); }
    function _midX(o) { return o.x + _getCenter(o,"x"); }
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
      let vx = _midX(leader) - _midX(follower),
          vy = _midY(leader) - _midY(follower),
          dist= _.sqrt(vx * vx + vy * vy);
      //Move the follower if it's more than 1 pixel away from the leader
      if(dist >= 1) {
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
      let vx = _midX(leader) - _midX(follower),
          vy = _midY(leader) - _midY(follower),
          dist = _.sqrt(vx * vx + vy * vy);
      //Move the follower if it's more than 1 move away from the leader
      if(dist >= speed) {
        follower.x += (vx / dist) * speed;
        follower.y += (vy / dist) * speed;
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
      return Math.atan2( _midY(s2) - _midY(s1), _midX(s2) - _midX(s1));
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
     */
    _S.rotateAroundSprite= function(rotatingSprite, centerSprite, distance, angle) {
      rotatingSprite.x = _midX(centerSprite) - rotatingSprite.parent.x +
                         (distance * Math.cos(angle)) - _getCenter(rotatingSprite, "x");
      rotatingSprite.y = _midY(centerSprite.y) - rotatingSprite.parent.y +
                         (distance * Math.sin(angle)) - _getCenter(rotatingSprite, "y");
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
     */
    _S.rotateAroundPoint=function(pointX, pointY, distanceX, distanceY, angle) {
      return _.p2(pointX + Math.cos(angle) * distanceX, pointY + Math.sin(angle) * distanceY );
    };
    /**
     * @public
     * @function
     */
    _S.move=function(...sprites) {
      if(sprites.length===1 && is.vec(sprites[0])) {
        sprites=sprites[0];
      }
      sprites.forEach(s => { s.x += s.vx; s.y += s.vy; });
    };
    /**
     * @public
     * @function
     */
    _S.leftSide=function(sprite) {
      let w= sprite.width,
        w2= w/2,
        x = sprite.x,
        a= sprite.anchor && sprite.anchor.x;
      if(is.num(a)) {
        if(a > 0.7) x = x - w;
        else if (a > 0) x = x - w/2;
      }
      return x;
    }
    /**
     * @public
     * @function
     */
    _S.rightSide=function(sprite) {
      let w= sprite.width,
        w2= w/2,
        x = sprite.x,
        a= sprite.anchor && sprite.anchor.x;
      if(is.num(a)) {
        if(a > 0.7) {}
        else if (a > 0) x += w/2;
        else x += w;
      } else {
        x += w;
      }
      return x;
    }
    /**
     * @public
     * @function
     */
    _S.topSide=function(sprite) {
      let h= sprite.height,
        h2= h/2,
        y = sprite.y,
        a= sprite.anchor && sprite.anchor.y;
      if(is.num(a)) {
        if(a > 0.7) y = y - h;
        else if (a > 0) y = y - h/2;
      }
      return y;
    }
    /**
     * @public
     * @function
     */
    _S.bottomSide=function(sprite) {
      let h= sprite.height,
        h2= h/2,
        y = sprite.y,
        a= sprite.anchor && sprite.anchor.y;
      if(is.num(a)) {
        if(a > 0.7) {}
        else if (a > 0) y += h/2;
        else y += h;
      } else {
        y += h;
      }
      return y;
    }
    /**
     * @public
     * @function
     */
    _S.bbox4=function(sprite) {
      return {x1: this.leftSide(sprite), x2: this.rightSide(sprite),
              y1: this.topSide(sprite), y2: this.bottomSide(sprite) };
    }
    /**
     * @public
     * @function
     */
    _S.pointInBBox=function(pt,box) {
      return pt.x >= box.x1 && pt.x <= box.x2 && pt.y >= box.y1 && pt.y <= box.y2;
    }
    /**
     * @public
     * @function
     */
    _S.hitTestPoint=function(pt,sprite) {
      return this.pointInBBox(pt, this.bbox4(sprite));
    }
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
      let s1cx = _midX(s1), s1cy = _midY(s1),
        s2cx = _midX(s2), s2cy = _midY(s2),
        //Plot a vector between spriteTwo and spriteOne
        vx = s2cx - s1cx,
        vy = s2cy - s1cy,
        magnitude = Math.sqrt(vx * vx + vy * vy),
        numberOfPoints = magnitude / segment;  // pts to test
      //Create an array of x/y points, separated by 64 pixels, that
      //extends from `spriteOne` to `spriteTwo`
      let arrayOfPoints = [],
        dx = vx / magnitude,
        dy = vy / magnitude; // unit vector
      //Create a point object for each segment of the vector and
      //store its x/y position as well as its index number on the map array
      for(let mag,i=1; i<=numberOfPoints; ++i) {
        mag = segment * i;
        //Use the unit vector and newMagnitude to figure out the x/y
        //position of the next point in this loop iteration
        _.conj(arrayOfPoints, _.p2(s1cx + dx * mag, s1cy + dy * mag))
      }
      //return `true` if all the tile
      //index numbers along the vector are `0`, which means they contain
      //no obstacles. If any of them aren't 0, then the function returns
      //`false` which means there's an obstacle in the way
      return arrayOfPoints.every(pt => {
        return obstacles.every(o => {
          return !_S.hitTestPoint(pt, o);
        });
      });
    };
    /**
     * @public
     * @function
     *
     * Find the distance in pixels between two sprites.
     */
    _S.distance= function(s1, s2) {
      let vx = _midX(s2) - _midX(s1),
        vy = _midY(s2) - _midY(s1);
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
    function _mkTexture(source) {
      let obj, texture;
      if(is.str(source)) {
        if(obj=Mojo.tcached[source])
          texture = new Mojo.p.Texture(obj);
      } else if(_.inst(Mojo.p.Texture,source)) {
        texture = new Mojo.p.Texture(source);
      }
      if(!texture)
        throw `Error: ${source} not loaded`;
      return texture;
    }
    /**
     * @private
     * @function
     */
    function _sprite(source, width, height, tiling, x, y) {
      let C= tiling ? Mojo.p.TSprite : Mojo.p.Sprite;
      let o, texture;
      if(is.str(source)) {
        texture= Mojo.tcached(source);
        if(!texture)
          texture = Mojo.textureFromImage(source);
        if(!texture)
          throw `Error: ${source} not found`;
        o= tiling ? new C(texture,width,height) : new C(texture);
      } else if(_.inst(Mojo.p.Texture,source)) {
        o= tiling ? new C(source,width,height) : new C(source);
      } else if(is.vec(source)) {
        let s0=source[0];
        if(is.str(s0)) {
          o= Mojo.tcached(s0) ? Mojo.animFromFrames(source) : Mojo.animFromImages(source);
        } else if(_.inst(Mojo.p.Texture,s0)) {
          o = new Mojo.p.ASprite(source);
        }
      }
      if(o) {
        o.x = x;
        o.y = y;
        if(width) o.width = width;
        if(height) o.height = height;
        o= _S.extend(o);
      }
      return o;
    }
    /**
     * @public
     * @function
     */
    _S.sprite= function(source, x=0, y=0) {
      let o= _sprite(source,0,0,false,x,y);
      return _.inst(Mojo.p.ASprite,o) ? _enhanceAnimSprite(o) : o;
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
      let t= Mojo.tcached[texture];
      if(!t) return null;
      let pos= [],
        cols = t.width / tileW,
        rows = t.height / tileH,
        cells = cols * rows;
      for(let x,y,i=0; i<cells; ++i) {
        x = (i % cols) * tileW;
        y = _.floor(i / cols) * tileH;
        //cater for any optional spacing (padding) around the tiles
        if(spacing > 0) {
          x += spacing + (spacing * i % cols);
          y += spacing + (spacing * _.floor(i/cols));
        }
        _.conj(pos, _.v2(x,y));
      }
      return this.frames(texture, pos, tileW, tileH);
    };
    /**
     * @private
     * @function
     */
    function _cfgTexture(t,width,height,x,y) {
      t.frame = new Mojo.p.Rectangle(x, y, width, height);
      return t;
    }
    /**
     * @public
     * @function
     */
    _S.frame=function(source, width, height,x,y) {
      return _cfgTexture(_mkTexture(source),width,height,x,y);
    };
    /**
     * @public
     * @function
     */
    _S.frames=function(source, coordinates, tileW, tileH) {
      let t= _mkTexture(source);
      return coordinates.map(p => {
        return _cfgTexture(new Mojo.p.Texture(t),tileW,tileH,p[0],p[1]);
      });
    };
    /**
     * @public
     * @function
     */
    _S.frameSeries=function(startNumber, endNumber, baseName, extension) {
      let frames = [];
      for(let i=startNumber; i < endNumber+1; ++i)
        _.conj(frames, Mojo.tcached[`${baseName+i+extension}`]);
      return frames;
    };
    /**
     * @public
     * @function
     */
    _S.text=function(content,fontSpec, x = 0, y = 0) {
      let msg = new Mojo.p.Text(content, fontSpec);
      msg._kontent = content;
      msg.x = x;
      msg.y = y;
      Object.defineProperty(msg, "content", _.pdef({
        get() { return this._kontent; },
        set(v) { this._kontent = v; this.text = v; }
      }));
      return this.extend(msg);
    };
    /**
     * @public
     * @function
     */
    _S.bitmapText= function(content, fontStyle, x = 0, y = 0) {
      let msg = new Mojo.p.BText(content, fontStyle);
      msg._kontent = content;
      msg.x = x;
      msg.y = y;
      Object.defineProperty(msg, "content", _.pdef({
        get() { return this._kontent; },
        set(v) { this._kontent = v; this.text = v; }
      }));
      return this.extend(msg);
    };
    /**
     * @public
     * @function
     */
    _S.rectangle=function(width, height,
      fillStyle = 0xFF3300,
      strokeStyle = 0x0033CC, lineWidth = 0, x = 0, y = 0) {
      let o = new Mojo.p.Graphics();
      o.__sprite = null;
      o.__width = width;
      o.__height = height;
      o.__lineW = lineWidth;
      o.__fill = this.color(fillStyle);
      o.__stroke = this.color(strokeStyle);
      let drawRect = () => {
        o.clear();
        o.beginFill(o.__fill);
        if(o.__lineW > 0)
          o.lineStyle(o.__lineW, o.__stroke, 1);
        o.drawRect(0, 0, o.__width, o.__height);
        o.endFill();
      };
      drawRect();
      let sprite = new Mojo.p.Sprite(_S.generateTexture(o));
      sprite.x = x;
      sprite.y = y;
      Object.defineProperties(sprite, {
        "fillStyle": _.pdef({
          get() { return o.__fill; },
          set(v) {
            o.__fill= _S.color(v);
            drawRect();
            o.__sprite.texture = _S.generateTexture(o);
          }}),
        "strokeStyle": _.pdef({
          get() { return o.__stroke; },
          set(v) {
            o.__stroke= _S.color(v);
            drawRect();
            o.__sprite.texture = _S.generateTexture(o); } }),
        "lineWidth": _.pdef({
          get() { return o.__lineW; },
          set(v) {
            o.__lineW= v;
            drawRect();
            o.__sprite.texture = _S.generateTexture(o);
          }})
      });
      return (o.__sprite = this.extend(sprite));
    };
    /**
     * @public
     * @function
     */
    _S.circle= function(diameter, fillStyle=0xFF3300, strokeStyle=0x0033CC, lineWidth=0, x=0, y=0) {
      let o = new Mojo.p.Graphics();
      o.__sprite=null;
      o.__diameter = diameter;
      o.__fill= this.color(fillStyle);
      o.__stroke= this.color(strokeStyle);
      o.__lineW = lineWidth;
      let drawCircle= () => {
        o.clear();
        o.beginFill(o.__fill);
        if(o.__lineW > 0)
          o.lineStyle(o.__lineW, o.__stroke, 1);
        o.drawCircle(0, 0, o.__diameter/2);
        o.endFill();
      };
      drawCircle();
      let sprite = new Mojo.p.Sprite(_S.generateTexture(o));
      sprite.x = x;
      sprite.y = y;
      Object.defineProperties(sprite, {
        "fillStyle": _.pdef({
          get() { return o.__fill; },
          set(v) {
            o.__fill= _S.color(v);
            drawCircle();
            o.__sprite.texture = _S.generateTexture(o); } }),
        "strokeStyle": _.pdef({
          get() { return o.__stroke; },
          set(v) {
            o.__stroke= _S.color(v);
            drawCircle();
            o.__sprite.texture = _S.generateTexture(o); } }),
        "diameter": _.pdef({
          get() { return o.__diameter; },
          set(v) {
            o.__diameter=v;
            drawCircle();
            o.__sprite.texture = _S.generateTexture(o); } }),
        "radius": _.pdef({
          get() { return o.__diameter/2; },
          set(v) {
            o.__diameter=v*2;
            drawCircle();
            o.__sprite.texture = _S.generateTexture(o); } })
      });
      return (o._sprite = this.extend(sprite));
    };
    /**
     * @public
     * @function
     */
    _S.line=function(strokeStyle, lineWidth, ax = 0, ay = 0, bx = 32, by = 32) {
      let o = new Mojo.p.Graphics();
      o.__stroke= this.color(strokeStyle);
      o.__width = lineWidth;
      o.__ax = ax;
      o.__ay = ay;
      o.__bx = bx;
      o.__by = by;
      let drawLine = () => {
        o.clear();
        o.lineStyle(o.__lineW, o.__stroke, 1);
        o.moveTo(o.__ax, o.__ay);
        o.lineTo(o.__bx, o.__by);
      };
      drawLine();
      Object.defineProperties(o, {
        "ax": _.pdef({
          get() { return o.__ax; },
          set(v) { o.__ax = v; drawLine(); } }),
        "ay": _.pdef({
          get() { return o.__ay; },
          set(v) { o.__ay = v; drawLine(); } }),
        "bx": _.pdef({
          get() { return o.__bx; },
          set(v) { o.__bx = v; drawLine(); } }),
        "by": _.pdef({
          get() { return o.__by; },
          set(v) { o.__by = v; drawLine(); } }),
        "width": _.pdef({
          get() { return o.__width; },
          set(v) { o.__width = v; drawLine(); } }),
        "strokeStyle": _.pdef({
          get() { return o.__stroke; },
          set(v) { o.__stroke= _S.color(v); drawLine(); } })
      });
      return this.extend(o);
    };
    /**
     * @public
     * @function
     */
    _S.grid= function(cols, rows, cellW, cellH,
                      centerCell, xOffset, yOffset, spriteFunc, extraFunc) {
      let length = cols * rows,
        container = new Mojo.p.Container();
      for(let s,x,y,i=0; i < length; ++i) {
        x = (i % cols) * cellW;
        y = _.floor(i / cols) * cellH;
        s= spriteFunc();
        container.addChild(s);
        s.x = x + xOffset;
        s.y = y + yOffset;
        if(centerCell) {
          s.x += (cellW/2) - (s.width/2);
          s.y += (cellH/2) - (s.width/2);
        }
        extraFunc && extraFunc(s);
      }
      return container;
    };
    /**
     * @public
     * @function
     */
    _S.shoot=function(shooter, angle, container,
                      bulletSpeed, bulletArray, bulletSprite,x,y) {
      let b= bulletSprite();
      b.anchor.set(0.5);
      shooter.addChild(b);
      b.x = x;
      b.y = y;
      //Find the bullet's global coordinates so that we can use
      //them to position the bullet on the new parent container
      let gx = b.getGlobalPosition().x,
        gy = b.getGlobalPosition().y;
      container.addChild(b);
      b.x = gx;
      b.y = gy;
      //set bullet's velocity
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
      function _upAndDownShake() {
        if(counter < numberOfShakes) {
          sprite.x = startX;
          sprite.y = startY;
          magnitude -= magnitudeUnit;
          sprite.x += _.randInt2(-magnitude, magnitude);
          sprite.y += _.randInt2(-magnitude, magnitude);
          counter += 1;
        }
        if(counter >= numberOfShakes) {
          sprite.x = startX;
          sprite.y = startY;
          _.disj(_shakingSprites,sprite);
        }
      }
      let tiltAngle = 1;
      function _angularShake() {
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
        if(counter >= numberOfShakes) {
          sprite.rotation = startAngle;
          _.disj(_shakingSprites,sprite);
        }
      }
      if(!_.has(_shakingSprites,sprite)) {
        _.conj(_shakingSprites,sprite);
        sprite.updateShake = () => {
          angular ? _angularShake() : _upAndDownShake();
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
      return isNaN(value) ? parseInt(this.colorToHex(value)) : value;
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
      let self = this;
      o=_.patch(o, {
        vx: 0, vy: 0,
        _layer: 0, _circular: false,
        _interact: false, _draggable: false, _bumpProps: true});
      function _nudge(o, value, axis) {
        let v= o.anchor && o.anchor[axis];
        return is.num(v) ? (v === 0 ? value : value * ((1-v) - v)) : value;
      }
      function _compensate(a, b, p1, p2) {
        let comp= (o, value, axis) => {
          return o.anchor ? (o.anchor[axis] !== 0 ? value * o.anchor[axis] : 0) : 0; };
        return comp(a, a[p1], p2) + comp(b, b[p1], p2);
      }
      //`adjustForParent` is a helper function for the above
      //`put` methods that subracts the parent's global position from
      //the nested child's position.
      function _adjustForParent(a, b) {
        if(b.parent.gx !== 0 || b.parent.gy !== 0) { b.x -= a.gx; b.y -= a.gy; }
      }
      //Center a sprite inside this sprite. `xOffset` and `yOffset`
      //arguments determine by how much the other sprite's position
      //should be offset from the center. These methods use the
      //sprites' global coordinates (`gx` and `gy`).
      //center `b` inside `a`.
      o.putCenter = function(b, xOffset = 0, yOffset = 0) {
        let a= o._stage ? Mojo.adjustForStage(o) : o;
        b.x = (a.x + _nudge(a, a.halfWidth, "x") - _nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y + _nudge(a, a.halfHeight, "y") - _nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) _adjustForParent(a, b);
      };
      //Position `b` to the left of `a`.
      o.putLeft = function(b, xOffset = 0, yOffset = 0) {
        let a= o._stage ? Mojo.adjustForStage(o) : o;
        b.x = (a.x - _nudge(b, b.width, "x")) + xOffset - _compensate(a, b, "width", "x");
        b.y = (a.y + _nudge(a, a.halfHeight, "y") - _nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) _adjustForParent(a, b);
      };
      //Position `b` above `a`.
      o.putTop = function(b, xOffset = 0, yOffset = 0) {
        let a = o._stage? Mojo.adjustForStage(o) : o;
        b.x = (a.x + _nudge(a, a.halfWidth, "x") - _nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y - _nudge(b, b.height, "y")) + yOffset - _compensate(a, b, "height", "y");
        if(!o._stage) _adjustForParent(a, b);
      };
      //Position `b` to the right of `a`.
      o.putRight = function(b, xOffset = 0, yOffset = 0) {
        let a= o._stage ? Mojo.adjustForStage(o) : o;
        b.x = (a.x + _nudge(a, a.width, "x")) + xOffset + _compensate(a, b, "width", "x");
        b.y = (a.y + _nudge(a, a.halfHeight, "y") - _nudge(b, b.halfHeight, "y")) + yOffset;
        if(!o._stage) _adjustForParent(a, b);
      };
      //Position `b` below `a`.
      o.putBottom = function(b, xOffset = 0, yOffset = 0) {
        let a= o._stage ? Mojo.adjustForStage(o) : o;
        b.x = (a.x + _nudge(a, a.halfWidth, "x") - _nudge(b, b.halfWidth, "x")) + xOffset;
        b.y = (a.y + _nudge(a, a.height, "y")) + yOffset + _compensate(a, b, "height", "y");
        if(!o._stage) _adjustForParent(a, b);
      };
      Object.defineProperties(o, {
        "gx": _.pdef({ get() { return o.getGlobalPosition().x } }),
        "gy": _.pdef({ get() { return o.getGlobalPosition().y } }),
        "centerX": _.pdef({
          get() { return o.x + (o.width/2) - o.xAnchorOffset; } }),
        "centerY": _.pdef({
          get() { return o.y + (o.height/2) - o.yAnchorOffset; } }),
        "halfWidth": _.pdef({
          get() { return o.width/2; }}),
        "halfHeight": _.pdef({
          get() { return o.height/2; } }),
        "scaleModeNearest": _.pdef({
          set(v) {
            if(!o.texture.baseTexture) throw "Error: no baseTexture";
            o.texture.baseTexture.scaleMode =
              v ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR; } }),
        "xAnchorOffset": _.pdef({
          get() { return o.anchor ? o.width * o.anchor.x : 0; } }),
        "yAnchorOffset": _.pdef({
          get() { return o.anchor ? o.height * o.anchor.y : 0; } }),
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
            //Sort the sprite’s parent’s `children` array so that sprites with a
            //higher `layer` value are moved to the end of the array
            if(o.parent)
              o.parent.children.sort((a, b) => a.layer - b.layer);
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
          get() { return Mojo.rect(0, 0, o.width, o.height); } }),
        "globalBounds": _.pdef({
          get() { return Mojo.rect(o.gx, o.gy, o.gx+o.width, o.gy+o.height); } }),
        "empty": _.pdef({ get() { return o.children.length === 0; } }),
        "circular": _.pdef({
          get() { return o._circular; },
          set(v) {
            if(v && o._circular===false) {
              Object.defineProperties(o, {
                "diameter": _.pdef({
                  get() { return o.width; },
                  set(v) { o.width = v; o.height = v; } }),
                "radius": _.pdef({
                  get() { return o.width/2; },
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
      o.setScale = (xScale, yScale) => { o.scale.x = xScale; o.scale.y = yScale; };
      o.setAnchor= (x,y) => { return o.anchor && o.anchor.set(x,y); };
      o.setPivot= (x,y) => { return o.pivot && o.pivot.set(x,y); };
      o.setPosition = (x, y) => { o.x = x; o.y = y; };
      if(o.circular)
        Object.defineProperty(o, "radius", _.pdef({
          get() { return o.width/2; }
        }));
      return o;
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

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF


