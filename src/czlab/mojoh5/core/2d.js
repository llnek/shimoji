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
  global["io.czlab.mojoh5.2d"]=function(Mojo){
    if(Mojo["2d"]){return Mojo["2d"]}
    const _S=global["io.czlab.mojoh5.Sprites"](Mojo);
    const _Z=global["io.czlab.mojoh5.Scenes"](Mojo);
    const Core=global["io.czlab.mcfud.core"]();
    const Geo=global["io.czlab.mcfud.geo2d"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    const is=Core.is;
    const _=Core.u;
    const _D= {};
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
     * Find out if a point is touching a circlular or rectangular sprite.
     *
     * @function
     * @public
     */
    const _PT=_V.V2();
    _D.hitTestPointXY=function(px,py,sprite,global=true){
      _PT[0]=px;
      _PT[1]=py;
      return this.hitTestPoint(_PT,sprite,global)
    };
    /**
     * @public
     * @function
     */
    _D.hitTestPoint=function(point, sprite,global=true){
      let hit;
      if(sprite.mojoh5.circular){
        let c= _S.centerXY(sprite,global);
        let d= _V.makeVecAB(c,point);
        let r= _S.radius(sprite);
        hit= _V.vecLen2(d) < r*r;
      }else{
        let p= _S.toPolygon(sprite,global);
        let ps= _V.translate(p.pos,p.calcPoints);
        hit= _pointInPoly(point[0],point[1],ps);
        _V.dropV2(ps);
      }
      return hit;
    };
    /**
     * @function
     * @public
     *
     */
    _D.collide=function(a,b, bounce=true, global = true){
      let a_,m, ret= null;
      if(_S.circular(a)){
        a_= _S.toCircle(a,global);
        m= _S.circular(b) ? Geo.hitCircleCircle(a_, _S.toCircle(b,global))
                          : Geo.hitCirclePolygon(a_, _S.toPolygon(b,global));
      }else{
        a_= _S.toPolygon(a,global);
        m= _S.circular(b) ? Geo.hitPolygonCircle(a_, _S.toCircle(b,global))
                          : Geo.hitPolygonPolygon(a_, _S.toPolygon(b,global));
      }
      if(m){
        let dx2=m.overlapV[0]/2;
        let dy2=m.overlapV[1]/2;
        a.x -= dx2; a.y -= dy2;
        b.x += dx2; b.y += dy2;
        if(bounce)
          _bounceOff(a,b,m);
        ret= _collideDir(m);
      }
      return ret;
    };
    /**
     * @private
     * @function
     */
    function _bounceOff(c1,c2,m){
      // calculate the collision surface's properties
      let N= m.overlapN;
      let L= _V.perp(N);
      // bounce off each other
      let p1A= _V.vecMul(N, c1.mojoh5.vel[0] * N[0] + c1.mojoh5.vel[1] * N[1]);
      let p2A= _V.vecMul(N, c2.mojoh5.vel[0] * N[0] + c2.mojoh5.vel[1] * N[1]);
      let p1B= _V.vecMul(L, c1.mojoh5.vel[0] * L[0] + c1.mojoh5.vel[1] * L[1]);
      let p2B= _V.vecMul(L, c2.mojoh5.vel[0] * L[0] + c2.mojoh5.vel[1] * L[1]);
      // calculate the bounce vectors
      if(!c1.mojoh5.bounce) c1.mojoh5.bounce=_V.V2();
      if(!c2.mojoh5.bounce) c2.mojoh5.bounce=_V.V2();
      _V.vecCopy(c1.mojoh5.bounce, p1B[0] + p2A[0], p1B[1] + p2A[1]);
      _V.vecCopy(c2.mojoh5.bounce, p1A[0] + p2B[0], p1A[1] + p2B[1]);
      c1.mojoh5.vel[0] = c1.mojoh5.bounce[0] / c1.mojoh5.mass;
      c1.mojoh5.vel[1] = c1.mojoh5.bounce[1] / c1.mojoh5.mass;
      c2.mojoh5.vel[0] = c2.mojoh5.bounce[0] / c2.mojoh5.mass;
      c2.mojoh5.vel[1] = c2.mojoh5.bounce[1] / c2.mojoh5.mass;
      _V.dropV2(L,p1A,p2A,p1B,p2B);
    }
    /**
     * @private
     * @function
     */
    function _collideDir(m){
      let collision=new Set();
      if(m.overlapN[0] > 0){ //left->right
        collision.add(Mojo.RIGHT);
      }
      if(m.overlapN[0] < 0){ //right->left
        collision.add(Mojo.LEFT);
      }
      if(m.overlapN[1] > 0){ //bot->top
        collision.add(Mojo.BOTTOM);
      }
      if(m.overlapN[0] < 0){ //top->bot
        collision.add(Mojo.TOP);
      }
      return collision;
    }
    /**
     * @public
     * @function
     *
    */
    _D.hitTest=function(a,b,global=true){
      let a_,m;
      if(_S.circular(a)){
        a_= _S.toCircle(a,global);
        m= _S.circular(b) ? Geo.hitCircleCircle(a_, _S.toCircle(b,global))
                          : Geo.hitCirclePolygon(a_, _S.toPolygon(b,global));
      }else{
        a_= _S.toPolygon(a,global);
        m= _S.circular(b) ? Geo.hitPolygonCircle(a_, _S.toCircle(b,global))
                          : Geo.hitPolygonPolygon(a_, _S.toPolygon(b,global));
      }
      return m ? _collideDir(m) : null;
    };
    /**
     * Use to bounce an object off another object.
     *
     * @public
     * @function
     *
     */
    _D.bounceOffSurface=function(o, S){
      let s= _V.vecUnit(S);
      let L= _V.perp(s);
      let p1={}, p2={};
      let dx = s[0];
      let dy = s[1];
      //2. Bounce the object (o) off the surface (s)
      //project the object's velocity onto the surface
      let dp1 = o.mojoh5.vel[0] * dx + o.mojoh5.vel[1] * dy;
      p1x = dp1 * dx;
      p1y = dp1 * dy;
      //project the object's velocity onto the surface's left normal
      let dp2 = o.mojoh5.vel[0] * L[0] + o.mojoh5.vel[1] * L[1];
      //Reverse the projection on the surface's left normal
      p2x = (dp2 * L[0]) * -1;
      p2y = (dp2 * L[1]) * -1;
      //create new bounce vector
      let bx = p1x + p2x;
      let by = p1y + p2y;
      o.mojoh5.vel[0] = bx / o.mojoh5.mass;
      o.mojoh5.vel[1] = by / o.mojoh5.mass;
      return o;
    };
    /**
     * Use to contain a sprite with `x` and
     * `y` properties inside a rectangular area.
     *
     * @public
     * @function
     *
     */
    _D.contain=function(sprite, container, bounce = false, extra = undefined){
      let c= container instanceof _Z.Scene ? Mojo.mockStage() : container;
      let coff= _S.anchorOffsetXY(c);
      let collision = new Set();
      let CX=false,CY=false;
      let R= Geo.getAABB(_S.circular(sprite) ? _S.toCircle(sprite,false)
                                             : _S.toPolygon(sprite,false));
      let cl= c.x-coff[0], cb=c.y-coff[1], cr=cl+c.width, ct=cb+c.height;
      //left
      if(R.pos[0] < cl){
        sprite.x -= (R.pos[0] - cl);
        CX=true;
        collision.add(Mojo.LEFT);
      }
      //bottom
      if(R.pos[1] < cb){
        sprite.y -= (R.pos[1] - cb);
        CY=true;
        collision.add(Mojo.TOP);
      }
      //right
      if(R.pos[0]+R.width > cr){
        sprite.x -= R.pos[0]+R.width - cr;
        CX=true;
        collision.add(Mojo.RIGHT);
      }
      //top
      if(R.pos[1]+R.height > ct){
        sprite.y -= R.pos[1]+R.height - ct;
        CY=true;
        collision.add(Mojo.BOTTOM);
      }
      if(collision.size > 0){
        if(CX){
          sprite.mojoh5.vel[0] /= sprite.mojoh5.mass;
          if(bounce) sprite.mojoh5.vel[0] *= -1;
        }
        if(CY){
          sprite.mojoh5.vel[1] /= sprite.mojoh5.mass;
          if(bounce) sprite.mojoh5.vel[1] *= -1;
        }
        extra && extra(collision)
      }else{
        collision=null;
      }
      return collision;
    };
    /**
     * The `worldCamera` method returns a `camera` object
     * with `x` and `y` properties. It has
     * two useful methods: `centerOver`, to center the camera over
     * a sprite, and `follow` to make it follow a sprite.
     * `worldCamera` arguments: worldObject, theCanvas
     * The worldObject needs to have a `width` and `height` property.
     *
     * @public
     * @function
     *
     */
    _D.worldCamera= function(world, worldWidth, worldHeight, canvas){
      let camera = {
        width: canvas.width,
        height: canvas.height,
        _x: 0,
        _y: 0,
        //`x` and `y` getters/setters
        //When you change the camera's position,
        //they shift the position of the world in the opposite direction
        get x() { return this._x; },
        set x(value) { this._x = value; world.x = -this._x; },
        get y() { return this._y; },
        set y(value) { this._y = value; world.y = -this._y; },
        get centerX() { return this.x + (this.width / 2); },
        get centerY() { return this.y + (this.height / 2); },
        //Boundary properties that define a rectangular area, half the size
        //of the game screen. If the sprite that the camera is following
        //is inide this area, the camera won't scroll. If the sprite
        //crosses this boundary, the `follow` function ahead will change
        //the camera's x and y position to scroll the game world
        get rightInnerBoundary() {
          return this.x + (this.width/2) + (this.width/4);
        },
        get leftInnerBoundary() {
          return this.x + (this.width/2) - (this.width/4);
        },
        get topInnerBoundary() {
          return this.y + (this.height/2) - (this.height/4);
        },
        get bottomInnerBoundary() {
          return this.y + (this.height/2) + (this.height/4);
        },
        //Use the `follow` method to make the camera follow a sprite
        follow: function(sprite){
          //Check the sprites position in relation to the inner
          //boundary. Move the camera to follow the sprite if the sprite
          //strays outside the boundary
          if(sprite.x < this.leftInnerBoundary){
            this.x = sprite.x - (this.width/4);
          }
          if(sprite.y < this.topInnerBoundary){
            this.y = sprite.y - (this.height/4);
          }
          if(sprite.x + sprite.width > this.rightInnerBoundary){
            this.x = sprite.x + sprite.width - (this.width / 4 * 3);
          }
          if(sprite.y + sprite.height > this.bottomInnerBoundary){
            this.y = sprite.y + sprite.height - (this.height / 4 * 3);
          }
          //If the camera reaches the edge of the map, stop it from moving
          if(this.x < 0) { this.x = 0; }
          if(this.y < 0) { this.y = 0; }
          if(this.x + this.width > worldWidth){
            this.x = worldWidth - this.width;
          }
          if(this.y + this.height > worldHeight){
            this.y = worldHeight - this.height;
          }
        },
        centerOver: function(sprite){
          let sz= _S.halfSize(sprite);
          //Center the camera over a sprite
          this.x = sprite.x + sz[0] - (this.width/2);
          this.y = sprite.y + sz[1] - (this.height/2);
        }
      };
      return camera;
    };

    return (Mojo["2d"]= _D)
  };

})(this);


