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

;(function(global){
  "use strict";
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Sprites"]=function(Mojo){
    if(Mojo.Sprites){return Mojo.Sprites}
    const Core=global["io.czlab.mcfud.core"]();
    const Geo=global["io.czlab.mcfud.geo2d"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    const _S={};
    const _=Core.u;
    const is=Core.is;
    const dom=Core.dom;
    const _shakingSprites = [];
    //------------------------------------------------------------------------
    //create aliases for various PIXI objects
    _.inject(Mojo.p, {Matrix:PIXI.Matrix.TEMP_MATRIX,
                      RTexture:PIXI.RenderTexture,
                      Rectangle:PIXI.Rectangle,
                      BText:PIXI.BitmapText,
                      Sprite:PIXI.Sprite,
                      Graphics:PIXI.Graphics,
                      Text:PIXI.Text,
                      TSprite:PIXI.TilingSprite,
                      ASprite:PIXI.AnimatedSprite,
                      PContainer:PIXI.ParticleContainer});
    /**
     * @public
     * @function
     */
    _S.assertAnchorCenter=function(s){
      _.assert(s.anchor.x > 0.3 && s.anchor.x < 0.7, "anchor not in center")
    };
    /**
     * @public
     * @function
     */
    _S.setAnchorCenter=function(s){
      s.anchor.set(0.5,0.5);
      return s;
    };
    /**
     * @public
     * @function
     */
    _S.toPolygon=function(sprite, global=true){
      this.assertAnchorCenter(sprite);
      let c= this.centerXY(sprite,global);
      let h2=sprite.height/2;
      let w2=sprite.width/2;
      let l= -w2;
      let t= h2;
      let r= w2;
      let b= -h2;
      let p= new Geo.Polygon(c[0],c[1]);
      let ps=[_V.V2(r,b),_V.V2(r,t),_V.V2(l,t),_V.V2(l,b)];
      p.setOrient(sprite.rotation).set(ps);
      _V.dropV2(...ps);
      return p;
    };
    /**
     * @public
     * @function
     */
    _S.toCircle=function(sprite, global=true){
      this.assertAnchorCenter(sprite);
      let c= this.centerXY(sprite,global);
      let h2=sprite.height/2;
      let w2=sprite.width/2;
      let p= new Geo.Circle(w2).setPos(c[0],c[1]);
      p.setOrient(sprite.rotation);
      return p;
    };
    /**
     * @public
     * @function
     */
    _S.anchorOffsetXY=function(o){
      return o.anchor ? _V.V2(o.width*o.anchor.x,o.height*o.anchor.y) : _V.V2()
    };
    /**
     * @public
     * @function
     */
    _S.gposXY=function(o){
      if(o.mojoh5 && o.mojoh5.gpos){
        return is.fun(o.mojoh5.gpos) ? o.mojoh5.gpos() : o.mojoh5.gpos;
      }
      let p= o.getGlobalPosition();
      return _V.V2(p.x,p.y)
    };
    /**
     * @public
     * @function
     */
    _S.centerXY=function(o,global=false){
      if(o.mojoh5 && o.mojoh5.cpos){
        return is.fun(o.mojoh5.cpos) ? o.mojoh5.cpos() : o.mojoh5.cpos;
      }
      let a= this.anchorOffsetXY(o);
      let x=o.x, y=o.y;
      if(global){
        let g=o.getGlobalPosition();
        x=g.x;
        y=g.y;
      }
      let r= _V.V2(x + (o.width/2) - a[0], y + (o.height/2) - a[1]);
      _V.dropV2(a);
      return r;
    };
    /**
     * @public
     * @function
     */
    _S.halfSize=function(o){
      return _V.V2(o.width/2,o.height/2)
    };
    /**
     * @public
     * @function
     */
    _S.setScaleModeNearest=function(o,v){
      _.assert(o.texture.baseTexture, "Error: no baseTexture");
      o.texture.baseTexture.scaleMode = v ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR;
      return o;
    };
    /**
     * @public
     * @function
     */
    _S.setScaleX=function(o,v){ o.scale.x = v; return o };
    /**
     * @public
     * @function
     */
    _S.setScaleY=function(o,v){ o.scale.y = v; return o };
    /**
     * @public
     * @function
     */
    _S.scaleXY=function(o){ return o.scale };
    /**
     * @public
     * @function
     */
    _S.tileXY=function(o){ return o.mojoh5.tilePos };
    /**
     * @public
     * @function
     */
    _S.tileScaleXY=function(o){ return o.mojoh5.tileScale };
    /**
     * @public
     * @function
     */
    _S.layer=function(o,v){
      if(v !== undefined){
        o.mojoh5.layer = v;
        //higher `layer` value are moved to the end of the array
        if(o.parent)
          o.parent.children.sort((a, b) => a.mojoh5.layer - b.mojoh5.layer);
      }
      return o.mojoh5.layer;
    };
    /**
     * @public
     * @function
     */
    _S.interact=function(o,v){
      if(v !== undefined){
        if(v){
          if(!o.mojoh5.interact)
            Mojo.makeInteractive(o);
          o.mojoh5.interact = true;
        }else if(_.disj(Mojo.Input.buttons, o)){
          o.mojoh5.interact = false;
        }
      }
      return o.mojoh5.interact;
    };
    /**
     * @public
     * @function
     */
    _S.draggable=function(o,v){
      if(v !== undefined){
        if(v){
          if(!o.mojoh5.draggable)
            Mojo.makeDraggable(o);
        }else{
          Mojo.makeUndraggable(o);
        }
        o.mojoh5.draggable = v;
      }
      return o.mojoh5.draggable;
    };
    /**
     * @public
     * @function
     */
    _S.empty=function(o){ return o.children.length === 0 };
    /**
     * @public
     * @function
     */
    _S.setXY=function(o,x,y){ o.x = x; o.y = y };
    /**
     * @public
     * @function
     */
    _S.circular=function(o,v){
      if(v!==undefined){ o.mojoh5.circular=v }
      return o.mojoh5.circular;
    };
    /**
     * @public
     * @function
     */
    _S.diameter=function(o){
      return o.mojoh5.circular ? o.width : undefined
    };
    /**
     * @public
     * @function
     */
    _S.radius=function(o,r){
      if(o.mojoh5.circular && r !== undefined){
        o.width=r*2;
        o.height=o.width;
      }
      return o.mojoh5.circular ? o.width/2 : undefined;
    };
    /**
     * @public
     * @function
     */
    _S.setScale=function(o, sx, sy){
      o.scale && o.scale.set(sx,sy);
      return o;
    };
    /**
     * @public
     * @function
     */
    _S.setAnchor=function(o,x,y){
      o.anchor && o.anchor.set(x,y);
      return o;
    };
    /**
     * @public
     * @function
     */
    _S.setPivot=function(o,x,y){
      o.pivot && o.pivot.set(x,y);
      return o;
    };
    /**
     * @private
     * @function
     */
    function _enhanceAnimSprite(s){
      let numberOfFrames = 0;
      let frameCounter = 0;
      let startFrame = 0;
      let endFrame = 0;
      let timerInterval;
      function _reset(){
        if(s.mojoh5.animating && timerInterval !== undefined){
          _.clear(timerInterval);
          s.mojoh5.animating = false;
          frameCounter= startFrame= endFrame= numberOfFrames = 0;
        }
      }
      function _advanceFrame(){
        if(frameCounter < numberOfFrames+1){
          s.gotoAndStop(s.currentFrame+1);
          frameCounter += 1;
        }else if(s.loop){
          s.gotoAndStop(startFrame);
          frameCounter = 1;
        }
      }
      s.mojoh5.stopAnimation = function(){ _reset(); s.gotoAndStop(s.currentFrame) };
      s.mojoh5.show = function(frame){ _reset(); s.gotoAndStop(frame) };
      s.mojoh5.playAnimation= function(seq){
        _reset();
        if(seq){
          startFrame = seq[0];
          endFrame = seq[1];
        }else{
          startFrame = 0;
          endFrame = s.totalFrames-1;
        }
        numberOfFrames = endFrame - startFrame;
        if(!s.mojoh5.fps) s.mojoh5.fps = 12;
        let frameRate = 1000 / s.mojoh5.fps;
        s.gotoAndStop(startFrame);
        frameCounter = 1;
        if(!s.mojoh5.animating){
          timerInterval = _.timer(_advanceFrame, frameRate);
          s.mojoh5.animating = true;
        }
      }
      return s;
    }
    /**
     * Make a sprite ease to the position of another sprite.
     * @public
     * @function
     */
    _S.followEase=function(follower, leader, speed=0.3){
      let a=this.centerXY(follower);
      let b=this.centerXY(leader);
      let d= _V.makeVecAB(a,b)
      //move the follower if it's more than 1 pixel away from the leader
      if(_V.vecLen2(d) >= 4){
        follower.x += d[0] * speed;
        follower.y += d[1] * speed;
      }
      _V.dropV2(d);
    };
    /**
     * Make a sprite move towards another sprite at a constant speed.
     * @public
     * @function
     */
    _S.followConstant=function(follower, leader, speed=3){
      let a=this.centerXY(follower);
      let b=this.centerXY(leader);
      let d=_V.makeVecAB(a,b);
      let dist2= _V.vecLen2(d);
      //move the follower if it's more than 1 move away from the leader
      if(dist2 >= (speed*speed)){
        let n=_.sqrt(dist2);
        follower.x += (d[0] / n) * speed;
        follower.y += (d[1] / n) * speed;
      }
      _V.dropV2(d);
    };
    /**
     * Use it to make a sprite rotate towards another sprite like this:
     * sprite.rotation = angle(sprite, pointer);
     * @public
     * @function
     * @returns the angle in radians between two sprites.
     */
    _S.angle=function(s1, s2){
      let v2=this.centerXY(s2);
      let v1=this.centerXY(s1);
      return Math.atan2(v2[1] - v1[1], v2[0] - v1[0])
    };
    /**
     * Make a sprite rotate around another sprite.
     * @public
     * @function
     */
    _S.rotateAroundSprite= function(rotatingSprite, centerSprite, distance, angle){
      let c=this.centerXY(centerSprite);
      let r=this.centerXY(rotatingSprite);
      rotatingSprite.x = c[0] - rotatingSprite.parent.x + (distance * Math.cos(angle)) - r[0];
      rotatingSprite.y = c[1] - rotatingSprite.parent.y + (distance * Math.sin(angle)) - r[1];
    };
    /**
     * Make a point rotate around another point.
     * @public
     * @function
     */
    _S.rotateAroundPoint=function(point, distanceX, distanceY, angle){
      return _V.V2(point[0] + Math.cos(angle) * distanceX,
                   point[1] + Math.sin(angle) * distanceY);
    };
    /**
     * @public
     * @function
     */
    _S.move=function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      sprites.forEach(s => { s.x += s.mojoh5.vel[0]; s.y += s.mojoh5.vel[1] });
    };
    /**
     * @public
     * @function
     */
    _S.leftSide=function(sprite,global=false){
      let x= global ? sprite.getGlobalPosition().x : sprite.x;
      let a= sprite.anchor ? sprite.anchor.x : null;
      let w= sprite.width;
      if(is.num(a)){
        if(a>0.7) x -= w;
        else if(a>0) x -= w/2;
      }
      return x;
    };
    /**
     * @public
     * @function
     */
    _S.rightSide=function(sprite,global=false){
      let x= global ? sprite.getGlobalPosition().x : sprite.x;
      let a= sprite.anchor ? sprite.anchor.x : null;
      let w= sprite.width;
      if(is.num(a)){
        if(a > 0.7) {}
        else if(a > 0) x += w/2;
        else x += w;
      }else{
        x += w;
      }
      return x;
    };
    /**
     * @public
     * @function
     */
    _S.topSide=function(sprite,global=false){
      let y= global ? sprite.getGlobalPosition().y : sprite.y;
      let a= sprite.anchor ? sprite.anchor.y : null;
      let h= sprite.height;
      if(is.num(a)){
        if(a > 0.7) y -= h;
        else if(a > 0) y -= h/2;
      }
      return y;
    };
    /**
     * @public
     * @function
     */
    _S.bottomSide=function(sprite,global=false){
      let y= global ? sprite.getGlobalPosition().y : sprite.y;
      let a= sprite.anchor ? sprite.anchor.y : null;
      let h= sprite.height;
      if(is.num(a)){
        if(a > 0.7) {}
        else if(a > 0) y += h/2;
        else y += h;
      }else{
        y += h;
      }
      return y;
    };
    /**
     * @public
     * @function
     */
    _S.getBBox=function(sprite,global=false){
      return {x1: this.leftSide(sprite,global),
              x2: this.rightSide(sprite,global),
              y1: this.topSide(sprite,global),
              y2: this.bottomSide(sprite,global) };
    };
    /**
     * @public
     * @function
     */
    _S.bbox4=function(left,right,top,bottom){
      return {x1: left, x2: right, y1: top, y2: bottom};
    };
    /**
     * @public
     * @function
     */
    _S.pointInBBox=function(pt,box){
      return pt.x > box.x1 && pt.x < box.x2 && pt.y > box.y1 && pt.y < box.y2;
    };
    /**
     * @private
     * @function
     */
    function _pointInPoly(testx,testy,points){
      let nvert=points.length;
      let c = false;
      for(let p,q, i=0, j=nvert-1; i<nvert;){
        p=points[i];
        q=points[j];
        if(((p[1]>testy) !== (q[1]>testy)) &&
          (testx < (q[0]-p[0]) * (testy-p[1]) / (q[1]-p[1]) + p[0])) c = !c;
        j=i;
        ++i;
      }
      return c;
    }
    /**
     * @public
     * @function
     */
    _S.hitTestPoint=function(point, sprite,global=false){
      let hit;
      if(sprite.mojoh5.circular){
        let c= this.centerXY(sprite,global);
        let d= _V.makeVAB(c,point);
        let r= this.radius(sprite);
        hit= _V.vecLen2(d) < r*r;
      }else{
        let p= this.toPolygon(sprite,global);
        let ps= _V.translate(p.pos[0],p.pos[1],p.calcPoints);
        hit= _pointInPoly(point[0],point[1],ps);
        _V.dropV2(ps);
      }
      return hit;
    };
    /**
     * The 4th argument determines the distance between collision points.
     * For better performance, make this a large number, up to the maximum
     * width of your smallest sprite (such as 64 or 32). For greater precision,
     * use a smaller number. You can use the lineOfSight value to decide how
     * to change certain things in your game. For example:
     *  if (monster.lineOfSight)
     *    monster.show(monster.states.angry)
     *  else
     *    monster.show(monster.states.normal)
     *
     * @public
     * @function
     * @returns `true` if there’s clear line of sight between two sprites,
     * and `false` if there isn’t.
     *
     */
    _S.lineOfSight=function(s1, s2, obstacles, segment = 32){
      let s1c=this.centerXY(s1);
      let s2c=this.centerXY(s2);
      let v= _V.makeVecAB(s1c,s2c)
      let dist= _V.vecLen(v);
      let numPoints = dist / segment;  // pts to test
      //Create an array of x/y points, separated by 64 pixels, that
      //extends from `spriteOne` to `spriteTwo`
      let dx = v[0] / dist;
      let dy = v[1] / dist;
      let points = [];
      _V.dropV2(v);
      //Create a point object for each segment of the vector and
      //store its x/y position as well as its index number on the map array
      for(let mag,i=1; i<=numPoints; ++i){
        mag = segment*i;
        //use the unit vector and newMagnitude to figure out the x/y
        //position of the next point in this loop iteration
        _.conj(points, _V.V2(s1c[0] + dx * mag, s1c[1] + dy * mag));
      }
      return points.every(pt => obstacles.every(o => !_S.hitTestPoint(pt, o)))
    };
    /**
     * Find the distance in pixels between two sprites.
     * @public
     * @function
     */
    _S.distance=function(s1, s2){
      let c2=this.centerXY(s2);
      let c1=this.centerXY(s1);
      return _V.vecDist(c1,c2);
    };
    /**
     * @public
     * @function
     */
    _S.update=function(dt){
      _.rseq(s => s.mojoh5.updateShake && s.mojoh5.updateShake(dt))
    };
    /**
     * @private
     * @function
     */
    _S.mkTexture=function(source){
      let obj, texture;
      if(is.str(source)){
        if(obj=Mojo.tcached(source))
          texture = new Mojo.p.Texture(obj);
      }else if(_.inst(Mojo.p.Texture,source)){
        texture = new Mojo.p.Texture(source);
      }
      if(!texture)
        throw `Error: ${source} not loaded`;
      return texture;
    };
    /**
     * @private
     * @function
     */
    function _sprite(source, width, height, tiling, x, y){
      let C= tiling ? Mojo.p.TSprite : Mojo.p.Sprite;
      let o, texture;
      if(is.str(source)){
        texture= Mojo.tcached(source);
        if(!texture)
          texture = Mojo.textureFromImage(source);
        if(!texture)
          throw `Error: ${source} not found`;
        o= tiling ? new C(texture,width,height) : new C(texture);
      } else if(_.inst(Mojo.p.Texture,source)){
        o= tiling ? new C(source,width,height) : new C(source);
      } else if(is.vec(source)){
        let s0=source[0];
        if(is.str(s0)){
          o= Mojo.tcached(s0) ? Mojo.animFromFrames(source) : Mojo.animFromImages(source);
        } else if(_.inst(Mojo.p.Texture,s0)){
          o = new Mojo.p.ASprite(source);
        }
      }
      if(o){
        o= _S.extend(o);
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
    _S.sprite=function(source, x=0, y=0, center=true){
      let o= _sprite(source,0,0,false,x,y);
      if(center)
        o.anchor.set(0.5,0.5);
      return _.inst(Mojo.p.ASprite,o) ? _enhanceAnimSprite(o) : o;
    };
    /**
     * @public
     * @function
     */
    _S.tilingSprite=function(source, width, height, x, y){
      if(width === undefined || height === undefined)
        throw "Error: tilingSprite() requires width and height";
      let o = _sprite(source, width, height, true, x,y);
      o.mojoh5.tileScale= _V.V2();
      o.mojoh5.tilePos= _V.V2();
      return o
    };
    /**
     * @public
     * @function
     */
    _S.animation=function(texture, tileW, tileH, spacing = 0){
      let t= Mojo.tcached(texture);
      if(!t) return null;
      let pos= [];
      let cols = t.width / tileW;
      let rows = t.height / tileH;
      let cells = cols * rows;
      for(let x,y,i=0; i<cells; ++i){
        x = (i % cols) * tileW;
        y = _.floor(i / cols) * tileH;
        //cater for any optional spacing (padding) around the tiles
        if(spacing > 0){
          x += spacing + (spacing * i % cols);
          y += spacing + (spacing * _.floor(i/cols));
        }
        _.conj(pos, _V.V2(x,y));
      }
      return this.frames(texture, tileW, tileH,pos);
    };
    /**
     * @private
     * @function
     */
    function _cfgTexture(t,width,height,x,y){
      t.frame = new Mojo.p.Rectangle(x, y, width, height);
      return t;
    }
    /**
     * @public
     * @function
     */
    _S.frame=function(source, width, height,x,y){
      return _cfgTexture(this.mkTexture(source),width,height,x,y);
    };
    /**
     * @public
     * @function
     */
    _S.frames=function(source, tileW, tileH, coordinates){
      let t= this.mkTexture(source);
      return coordinates.map(p => _cfgTexture(new Mojo.p.Texture(t),tileW,tileH,p[0],p[1]));
    };
    /**
     * @public
     * @function
     */
    _S.frameSeries=function(startNumber, endNumber, baseName, extension){
      let frames = [];
      for(let i=startNumber; i < endNumber+1; ++i)
        _.conj(frames, Mojo.tcached(`${baseName+i+extension}`));
      return frames;
    };
    /**
     * @private
     * @function
     */
    function _initText(C,content,spec,x=0, y=0){
      let msg=new C(content,spec);
      _S.extend(msg);
      msg.x = x;
      msg.y = y;
      msg.mojoh5.kontent=content;
      msg.mojoh5.content=function(v){
        if(v !== undefined){
          msg.mojoh5.kontent=v;
          msg.text=v;
        }
        return msg.mojoh5.kontent;
      };
      return msg;
    };
    /**
     * @public
     * @function
     */
    _S.text=function(content,fontSpec, x=0, y=0){
      return _initText(Mojo.p.Text,content,fontSpec,x,y);
    };
    /**
     * @public
     * @function
     */
    _S.bitmapText=function(content, fontStyle, x=0, y=0){
      return _initText(Mojo.p.BText,content,fontStyle,x,y);
    };
    /**
     * @public
     * @function
     */
    _S.rectangle=function(width, height,
                          fillStyle = 0xFF3300,
                          strokeStyle = 0x0033CC, lineWidth = 0, x = 0, y = 0){
      let o = new Mojo.p.Graphics();
      let gprops={
        width:  width,
        height: height,
        lineW: lineWidth,
        fill: _S.color(fillStyle),
        stroke: _S.color(strokeStyle)
      };
      let draw= function(){
        o.clear();
        o.beginFill(gprops.fill);
        if(gprops.lineW > 0)
          o.lineStyle(gprops.lineW, gprops.stroke, 1);
        o.drawRect(0, 0, gprops.width, gprops.height);
        o.endFill();
        return o;
      };
      draw();
      let sprite = new Mojo.p.Sprite(_S.generateTexture(o));
      this.extend(sprite);
      sprite.x = x;
      sprite.y = y;
      sprite.mojoh5.fillStyle=function(v){
        if(v !== undefined){
          gprops.fill= _S.color(v);
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.fill;
      };
      sprite.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.stroke;
      };
      sprite.mojoh5.lineWidth=function(v){
        if(v !== undefined){
          gprops.lineW= v;
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.lineW;
      };
      return sprite;
    };
    /**
     * @public
     * @function
     */
    _S.circle=function(diameter, fillStyle=0xFF3300, strokeStyle=0x0033CC, lineWidth=0, x=0, y=0){
      let o = new Mojo.p.Graphics();
      let gprops={
        radius: diameter/2,
        lineW: lineWidth,
        fill: _S.color(fillStyle),
        stroke: _S.color(strokeStyle)
      };
      let draw= function(){
        o.clear();
        o.beginFill(gprops.fill);
        if(gprops.lineW > 0)
          o.lineStyle(grops.lineW, gprops.stroke, 1);
        o.drawCircle(0, 0, gprops.radius);
        o.endFill();
        return o;
      };
      draw();
      let sprite = new Mojo.p.Sprite(_S.generateTexture(o));
      this.extend(sprite);
      this.circular(sprite,true);
      sprite.x = x;
      sprite.y = y;
      sprite.mojoh5.fillStyle=function(v){
        if(v !== undefined){
          gprops.fill= _S.color(v);
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.fill;
      };
      sprite.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.stroke;
      };
      sprite.mojoh5.radius=function(v){
        if(v !== undefined){
          gprops.radius=v;
          sprite.texture = draw() && _S.generateTexture(o);
        }
        return gprops.radius;
      };
      return sprite;
    };
    /**
     * @public
     * @function
     */
    _S.line=function(strokeStyle, lineWidth, A,B){
      A=A || _V.V2(0,0);
      B=B || _V.V2(32,32);
      let o = new Mojo.p.Graphics();
      let gprops={
        stroke: _S.color(strokeStyle),
        lineW: lineWidth,
        A: _V.V2(A[0],A[1]),
        B: _V.V2(B[0],B[1])
      };
      let draw= function(){
        o.clear();
        o.lineStyle(gprops.lineW, gprops.stroke, 1);
        o.moveTo(gprops.A[0], gprops.A[1]);
        o.lineTo(gprops.B[0], gprops.B[1]);
      };
      draw();
      let sprite=this.extend(o);
      sprite.mojoh5.ptA=function(x,y){
        if(x !== undefined){
          gprops.A[0] = x;
          gprops.A[1] = y===undefined?x:y;
          draw();
        }
        return gprops.A;
      };
      sprite.mojoh5.ptB=function(x,y){
        if(x !== undefined){
          gprops.B[0] = x;
          gprops.B[1] = y===undefined?x:y;
          draw();
        }
        return gprops.B;
      };
      sprite.mojoh5.lineWidth=function(v){
        if(v !== undefined){
          gprops.lineW= v;
          draw();
        }
        return gprops.lineW;
      };
      sprite.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          draw();
        }
        return gprops.stroke;
      };
      return sprite;
    };
    /**
     * @public
     * @function
     */
    _S.moving=function(o){
      return !_.feq(o.mojoh5.vel[0],0.0) || !_.feq(o.mojoh5.vel[1], 0.0)
    };
    /**
     * @public
     * @function
     */
    _S.grid= function(cols, rows, cellW, cellH,
                      centerCell, xOffset, yOffset, spriteFunc, extraFunc){
      let length = cols * rows;
      let container = [];//new Mojo.p.Container();
      for(let s,x,y,i=0; i < length; ++i){
        x = (i % cols) * cellW;
        y = _.floor(i / cols) * cellH;
        s= spriteFunc();
        _.conj(container,s);
        //container.addChild(s);
        s.x = x + xOffset;
        s.y = y + yOffset;
        if(centerCell){
          s.x += (cellW/2) - (s.width/2);
          s.y += (cellH/2) - (s.height/2);
        }
        extraFunc && extraFunc(s);
      }
      return container;//this.extend(container);
    };
    /**
     * @public
     * @function
     */
    _S.shoot=function(shooter, angle, container,
                      bulletSpeed, bulletArray, bulletSprite,x,y){
      let soff=this.anchorOffsetXY(shooter);
      let g=this.gposXY(shooter);
      let b= bulletSprite();
      container.addChild(b);
      b.x= g[0]-soff[0]+x;
      b.y= g[1]-soff[1]+y;
      //set bullet's velocity
      this.extend(b);
      b.mojoh5.vel[0] = Math.cos(angle) * bulletSpeed;
      b.mojoh5.vel[1] = Math.sin(angle) * bulletSpeed;
      _.conj(bulletArray,b);
      _V.dropV2(soff);
      return shooter;
    };
    /**
     * @public
     * @function
     */
    _S.shake=function(sprite, magnitude = 16, angular = false){
      let self = this;
      let counter = 1;
      let numberOfShakes = 10;
      let startX = sprite.x;
      let startY = sprite.y;
      let startAngle = sprite.rotation;
      //Divide the magnitude into 10 units so that you can
      //reduce the amount of shake by 10 percent each frame
      let magnitudeUnit = magnitude / numberOfShakes;
      function _upAndDownShake(){
        if(counter < numberOfShakes){
          sprite.x = startX;
          sprite.y = startY;
          magnitude -= magnitudeUnit;
          sprite.x += _.randInt2(-magnitude, magnitude);
          sprite.y += _.randInt2(-magnitude, magnitude);
          counter += 1;
        }
        if(counter >= numberOfShakes){
          sprite.x = startX;
          sprite.y = startY;
          _.disj(_shakingSprites,sprite);
        }
      }
      let tiltAngle = 1;
      function _angularShake(){
        if(counter < numberOfShakes){
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
        if(counter >= numberOfShakes){
          sprite.rotation = startAngle;
          _.disj(_shakingSprites,sprite);
        }
      }
      if(!_.has(_shakingSprites,sprite)){
        _.conj(_shakingSprites,sprite);
        sprite.updateShake = function(){
          angular ? _angularShake() : _upAndDownShake();
        };
      }
    };
    /**
     * @public
     * @function
     */
    _S.group=function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      let c= new Mojo.p.Container();
      _.doseq(sprites, s => c.addChild(s));
      return this.extend(c);
    };
    /**
     * @public
     * @function
     */
    _S.batch=function(size = 15000, options = {rotation:true,
                                               alpha:true,
                                               uvs:true,
                                               scale:true}){
      return new Mojo.p.PContainer(size, options);
    };
    /**
     * @public
     * @function
     */
    _S.remove=function(...sprites) {
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites, s => s.parent && s.parent.removeChild(s));
    };
    /**
     *From: http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
     *Utilities to convert HTML color string names to hexadecimal codes
     * @public
     * @function
     */
    _S.colorToRGBA= function(color){
      // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
      // color must be a valid canvas fillStyle. This will cover most anything
      // you'd want to use.
      // Examples:
      // colorToRGBA('red')  # [255, 0, 0, 255]
      // colorToRGBA('#f00') # [255, 0, 0, 255]
      let cvs = dom.newElm("canvas");
      let ctx = cvs.getContext("2d");
      cvs.height = 1;
      cvs.width = 1;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data;
    };
    /**
     * @public
     * @function
     */
    _S.byteToHex=function(num){
      //turns a number (0-255) into a 2-character hex number (00-ff)
      //grab last 2 digits
      return ("0"+num.toString(16)).slice(-2);
    };
    /**
     * @public
     * @function
     */
    _S.colorToHex=function(color){
      // Convert any CSS color to a hex representation
      // Examples:
      // colorToHex('red')            # '#ff0000'
      // colorToHex('rgb(255, 0, 0)') # '#ff0000'
      let rgba = this.colorToRGBA(color);
      let hex = [0,1,2].map(i => this.byteToHex(rgba[i])).join("");
      return "0x" + hex;
    };
    /**
     * @public
     * @function
     */
    _S.color=function(value){
      return isNaN(value) ? parseInt(this.colorToHex(value)) : value;
    };
    /**
     * @public
     * @function
     */
    _S.add=function(par, ...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites,s => par.addChild(s));
      return par;
    };
    /**
     * @private
     * @function
     */
    function _nudge(o, value, axis){
      let v= o.anchor ? o.anchor[axis] : null;
      return v !== null ? (v < 0.3 ? value : value * ((1-v) - v)) : value;
    }
    function _compensate(a, b, p1, p2){
      function comp(o, v, axe){ return o.anchor ? (o.anchor[axe] > 0 ? (v*o.anchor[axe]) : 0) : 0 }
      return comp(a, a[p1], p2) + comp(b, b[p1], p2);
    }
    function _adjustForParent(a, b){
      let bg= _S.gposXY(b.parent);
      let ag= _S.gposXY(a);
      if(bg[0] !== 0 || bg[1] !== 0){
        b.x -= ag[0];
        b.y -= ag[1];
      }
    }
    /**
     * Put b inside a's center.
     *
     * @public
     * @function
     */
    _S.putCenter=function(o, b, xOffset = 0, yOffset = 0){
      let a= Mojo.adjustForStage(o);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!o.mojoh5.stage)
        _adjustForParent(a, b);
    };
    /**
     * Position `b` to the left of `a`.
     * @public
     * @function
     */
    _S.putLeft=function(o,b, xOffset = 0, yOffset = 0){
      let a= Mojo.adjustForStage(o);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x - _nudge(b, b.width, "x") + xOffset - _compensate(a, b, "width", "x");
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!o.mojoh5.stage)
        _adjustForParent(a, b);
    };
    /**
     * Position `b` above `a`.
     * @public
     * @function
     */
    _S.putTop=function(o, b, xOffset = 0, yOffset = 0){
      let a = Mojo.adjustForStage(o);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y - _nudge(b, b.height, "y") + yOffset - _compensate(a, b, "height", "y");
      if(!o.mojoh5.stage)
        _adjustForParent(a, b);
    };
    /**
     * Position `b` to the right of `a`.
     *
     * @function
     * @public
     */
    _S.putRight=function(o, b, xOffset = 0, yOffset = 0){
      let a= Mojo.adjustForStage(o);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, a.width, "x") + xOffset + _compensate(a, b, "width", "x");
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!o.mojoh5.stage)
        _adjustForParent(a, b);
    };
    /**
     * Position `b` below `a`.
     *
     * @public
     * @function
     */
    _S.putBottom=function(o, b, xOffset = 0, yOffset = 0){
      let a= Mojo.adjustForStage(o);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y + _nudge(a, a.height, "y") + yOffset + _compensate(a, b, "height", "y");
      if(!o.mojoh5.stage)
        _adjustForParent(a, b);
    };
    /**
     * @public
     * @function
     */
    _S.extend=function(o){
      if(!o.mojoh5) o.mojoh5={};
      _.inject(o.mojoh5, {uuid: _.nextId(),
                          layer: 0,
                          mass: 1,
                          invMass: 1,
                          vel: _V.V2(),
                          angVel: 0,
                          stage: false,
                          dead: false,
                          circular: false,
                          interact: false, draggable: false });
      return o;
    };
    /**
     * Copied from pixi.legacy, why didn;t they want to keep this????
     * so useful!
     * @public
     * @function
     */
    _S.generateTexture=function(displayObject, scaleMode, resolution, region){
      region = region || displayObject.getLocalBounds(null, true);
      // minimum texture size is 1x1, 0x0 will throw an error
      if(region.width === 0){ region.width = 1; }
      if(region.height === 0){ region.height = 1; }
      let renderTexture = Mojo.p.RTexture.create({
        width: region.width | 0,
        height: region.height | 0,
        scaleMode: scaleMode,
        resolution: resolution
      });
      Mojo.p.Matrix.tx = -region.x;
      Mojo.p.Matrix.ty = -region.y;
      Mojo.ctx.render(displayObject, renderTexture, false, Mojo.p.Matrix, !!displayObject.parent);
      return renderTexture;
    };

    return (Mojo.Sprites= _S)
  };

})(this);



