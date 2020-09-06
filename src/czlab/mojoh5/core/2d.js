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

;(function(global,undefined){
  "use strict";
  const window=global;
  const MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5["2d"]=function(Mojo){
    const _S=Mojo.Sprites;
    const is=Mojo.is;
    const _=Mojo.u;
    const V2=Mojo.V2;
    const _D= {};
    /**
     * Find out if a point is touching a circlular or rectangular sprite.
     *
     * @function
     * @public
     */
    _D.hitTestPoint=function(point, sprite){
      let hit, shape= sprite.mojoh5.circular ? "circle" : "rectangle";
      if(shape === "rectangle"){
        let offset= _S.anchorOffsetXY(sprite);
        let left = sprite.x - offset.x;
        let top = sprite.y - offset.y;
        let right = left + sprite.width;
        let bottom = top + sprite.height;
        //Find out if the point is intersecting the rectangle
        hit = point.x > left && point.x < right && point.y > top && point.y < bottom;
      }
      else if(shape === "circle"){
        //Find distance between point and the circle center
        let d= V2.sub(point,_S.centerXY(sprite));
        let r= _S.radius(sprite);
        hit = V2.len2(d) < r*r;
      }
      return hit;
    };
    /**
     * Find out if two circular sprites are touching.
     *
     * @function
     * @public
     *
     */
    _D.hitTestCircle=function(c1, c2, global = false){
      let rt= _S.radius(c1) + _S.radius(c2);
      let v1=_S.centerXY(c1,global);
      let v2=_S.centerXY(c2,global);
      let v= V2.sub(v2,v1);
      return V2.len2(v) < (rt * rt);
    };
    /**
     * Use to prevent a moving circular sprite from overlapping and optionally
     * bouncing off a non-moving circular sprite.
     *
     * @function
     * @public
     *
     */
    _D.circleCollision=function(c1, c2, bounce=false, global=false){
      let rt= _S.radius(c1) + _S.radius(c2);
      let v1=_S.centerXY(c1,global);
      let v2=_S.centerXY(c2,global);
      let v= V2.sub(v2,v1);
      let len2=V2.len2(v);
      let hit = false;
      //Add some "quantum padding". This adds a tiny amount of space
      //between the circles to reduce their surface tension and make
      //them more slippery.
      let pad= 0.3;
      let len,dx, dy, diff;
      if(len2 < (rt*rt)){
        len=Math.sqrt(len2);
        diff = rt-len+pad;
        hit = true;
        dx = diff * (v.x/len);
        dy = diff * (v.y/len);
        //Move circle 1 out of the collision by multiplying
        //the overlap with the normalized vector and subtract it from
        //circle 1's position
        c1.x -= dx;
        c1.y -= dy;
        if(bounce)
          this.bounceOffSurface(c1, _.p2(v.y,-v.x));
        //Create a collision vector object, `s` to represent the bounce "surface".
        //Find the bounce surface's x and y properties
        //(This represents the normal of the distance vector between the circles)
        //Bounce c1 off the surface
      }
      return hit;
    };
    /**
     * Use to make two moving circles bounce off each other.
     *
     * @function
     * @public
     */
    _D.movingCircleCollision=function(c1, c2, global=false){
      let rt= _S.radius(c1) + _S.radius(c2);
      let v1=_S.centerXY(c1,global);
      let v2=_S.centerXY(c2,global);
      let v= V2.sub(v2,v1);
      let dx,dy,len,len2=V2.len2(v);
      let diff, vxHalf,vyHalf,xSide, ySide;
      let p1A = {}, p1B = {}, p2A = {}, p2B = {}, hit = false;
      //Figure out if there's a collision
      if(len2 < (rt*rt)){
        len= _.sqrt(len2);
        diff = rt-len+0.3; // add padding
        hit = true;
        dx = v.x/len;
        dy = v.y/len;
        //Find the collision vector.
        //Divide it in half to share between the circles
        vxHalf = _.abs(dx * diff/2);
        vyHalf = _.abs(dy * diff/2);
        //Find the side that the collision is occurring on
        (c1.x > c2.x) ? xSide = 1 : xSide = -1;
        (c1.y > c2.y) ? ySide = 1 : ySide = -1;
        //Move c1 out of the collision by multiplying
        //the overlap with the normalized vector and adding it to
        //the circles' positions
        c1.x += (vxHalf * xSide);
        c1.y += (vyHalf * ySide);
        //Move c2 out of the collision
        c2.x += (vxHalf * -xSide);
        c2.y += (vyHalf * -ySide);
        //1. Calculate the collision surface's properties
        //Find the surface vector's left normal
        let lx = v.y;
        let ly = -v.x;
        //2. Bounce c1 off the surface (s)
        //Find the dot product between c1 and the surface
        let dp1 = c1.mojoh5.vx * dx + c1.mojoh5.vy * dy;
        //Project c1's velocity onto the collision surface
        p1A.x = dp1 * dx;
        p1A.y = dp1 * dy;
        //Find the dot product of c1 and the surface's left normal (s.lx and s.ly)
        let dp2 = c1.mojoh5.vx * (lx / len) + c1.mojoh5.vy * (ly / len);
        //Project the c1's velocity onto the surface's left normal
        p1B.x = dp2 * (lx / len);
        p1B.y = dp2 * (ly / len);
        //3. Bounce c2 off the surface (s)
        //Find the dot product between c2 and the surface
        let dp3 = c2.mojoh5.vx * dx + c2.mojoh5.vy * dy;
        //Project c2's velocity onto the collision surface
        p2A.x = dp3 * dx;
        p2A.y = dp3 * dy;
        //Find the dot product of c2 and the surface's left normal (s.lx and s.ly)
        let dp4 = c2.mojoh5.vx * (lx / len) + c2.mojoh5.vy * (ly / len);
        //Project c2's velocity onto the surface's left normal
        p2B.x = dp4 * (lx / len);
        p2B.y = dp4 * (ly / len);
        //4. Calculate the bounce vectors
        //Bounce c1 using p1B and p2A
        c1.mojoh5.bounce = _.p2(p1B.x + p2A.x, p1B.y + p2A.y);
        //Bounce c2 using p1A and p2B
        c2.mojoh5.bounce = _.p2(p1A.x + p2B.x, p1A.y + p2B.y);
        //Add the bounce vector to the circles' velocity
        //and add mass if the circle has a mass property
        c1.mojoh5.vx = c1.mojoh5.bounce.x / c1.mojoh5.mass;
        c1.mojoh5.vy = c1.mojoh5.bounce.y / c1.mojoh5.mass;
        c2.mojoh5.vx = c2.mojoh5.bounce.x / c2.mojoh5.mass;
        c2.mojoh5.vy = c2.mojoh5.bounce.y / c2.mojoh5.mass;
      }
      return hit;
    };
    /**
     * @public
     * @function
     *
     * Checks all the circles in an array for a collision against
     * all the other circles in an array, using `movingCircleCollision` (above)
     */
    _D.multipleCircleCollision=function(arrayOfCircles, global = false){
      for(let i=0; i < arrayOfCircles.length; ++i){
        //The first circle to use in the collision check
        let c1 = arrayOfCircles[i];
        for(let j = i+1; j < arrayOfCircles.length; ++j){
          //The second circle to use in the collision check
          let c2 = arrayOfCircles[j];
          //Check for a collision and bounce the circles apart if
          //they collide. Use an optional `mass` property on the sprite
          //to affect the bounciness of each marble
          this.movingCircleCollision(c1, c2, global);
        }
      }
    };
    /**
     * @private
     * @function
     */
    function _rectCollision(r1, r2, bounce = false, global = false,flipped=false){
      if(flipped) { let tmp=r1; r1=r2;r2=tmp; }
      let c1=_S.centerXY(r1,global);
      let c2=_S.centerXY(r2,global);
      let r1z=_S.halfSize(r1);
      let r2z=_S.halfSize(r2);
      let v= V2.sub(c1,c2);
      //the combined half-widths and half-heights
      let combinedHalfWidths = r1z.x + r2z.x;
      let combinedHalfHeights = r1z.y + r2z.y;
      let vx= _.abs(v.x), vy= _.abs(v.y);
      let collision, dx, dy;
      //Check whether vx is less than the combined half widths
      if(vx < combinedHalfWidths){
        if(vy < combinedHalfHeights){
          //Find out the size of the overlap on both the X and Y axes
          dx = combinedHalfWidths - vx;
          dy = combinedHalfHeights - vy;
          //find *smallest* amount of overlap
          if(dx >= dy){
            //collision is happening on the X axis, which side? vy can tell us
            if(v.y > 0){
              collision = Mojo.TOP;
              //move rectangle out of the collision
              r1.y += dy;
            }else{
              collision = Mojo.BOTTOM;
              //move rectangle out of the collision
              r1.y -= dy;
            }
            if(bounce)
              r1.mojoh5.vy *= -1;
          }else{
            //collision is happening on the Y axis, on which side? vx can tell us
            if(v.x > 0){
              collision = Mojo.LEFT;
              //move rectangle out of the collision
              r1.x += dx;
            }else{
              collision = Mojo.RIGHT;
              //move rectangle out of the collision
              r1.x -= dx;
            }
            if(bounce)
              r1.mojoh5.vx *= -1;
          }
        }
      }
      return collision;
    }
    /**
     * Use to prevent two rectangular sprites from overlapping.
     * Optionally, make the first rectangle bounce off the second rectangle.
     *
     * @public
     * @function
     *
     */
    _D.rectangleCollision=function(r1, r2, bounce = false, global = false){
      return _rectCollision(r1,r2,bounce,global);
    };
    /**
     * Use to find out if two rectangular sprites are touching.
     *
     * @public
     * @function
     *
    */
    _D.hitTestRectangle=function(r1, r2, global = false){
      let c1= _S.centerXY(r1,global);
      let c2= _S.centerXY(r2,global);
      let r1z= _S.halfSize(r1);
      let r2z= _S.halfSize(r2);
      let v= V2.sub(c1,c2);
      let hit = false;
      let combinedHalfHeights = r1z.y + r2z.y;
      let combinedHalfWidths = r1z.x + r2z.x;
      //Check for a collision on the x axis then y-axis
      if(Math.abs(v.x) < combinedHalfWidths){
        if(Math.abs(v.y) < combinedHalfHeights){
          hit = true;
        }
      }
      return hit;
    };
    /**
     * Use to find out if a circular shape is touching a rectangular shape.
     *
     * @public
     * @function
     *
    */
    _D.hitTestCircleRectangle=function(c1, r1, global = false){
      let c1off=_S.anchorOffsetXY(c1);
      let r1off=_S.anchorOffsetXY(r1);
      let r1z=_S.halfSize(r1);
      let p1,g1=_S.gposXY(c1);
      let p2,g2=_S.gposXY(r1);
      let region, collision;
      if(global) {
        p1=g1;p2=g2;
        //c1x = c1.gx; c1y = c1.gy; r1x = r1.gx; r1y = r1.gy;
      } else {
        p1=c1;p2=r1;
        //c1x = c1.x; c1y = c1.y; r1x = r1.x; r1y = r1.y;
      }
      //circle above the rectangle's top edge?
      if(p1.y - c1off.y < p2.y - r1z.y - r1off.y){
        //check if top left, top center or top right
        region = "topMiddle";
        if(p1.x - c1off.x < p2.x - 1 - r1z.x - r1off.x){
          region = "topLeft";
        }else if(p1.x - c1off.x > p2.x + 1 + r1z.x - r1off.x){
          region = "topRight";
        }
      }else if(p1.y - c1off.y > p2.y + r1z.y - r1off.y){
        //below the bottom edge?
        //check if bottom left, bottom center, or bottom right
        region = "bottomMiddle";
        if(p1.x - c1off.x < p2.x - 1 - r1z.x - r1off.x){
          region = "bottomLeft";
        }else if(p1.x - c1off.x > p2.x + 1 + r1z.x - r1off.x){
          region = "bottomRight";
        }
      }else{
        //The circle isn't above the top edge or below the bottom edge,
        //so it must be on the left or right side
        if(p1.x - c1off.x < p2.x - r1z.x - r1off.x){
          region = "leftMiddle";
        }else{
          region = "rightMiddle";
        }
      }
      //circle touching the flat sides of the rectangle?
      if(region === "topMiddle" || region === "bottomMiddle" ||
        region === "leftMiddle" || region === "rightMiddle"){
        collision = this.hitTestRectangle(c1, r1, global);
      }else{
        //circle is touching one of the corners, so do a circle vs point test
        let point;
        switch(region){
        case "topLeft":
          point= _.p2(p2.x - r1off.x, p2.y - r1off.y);
        break;
        case "topRight":
          point = _.p2(p2.x + r1.width - r1off.x, p2.y - r1off.y);
        break;
        case "bottomLeft":
          point = _.p2(p2.x - r1off.x, p2.y + r1.height - r1off.y);
        break;
        case "bottomRight":
          point = _.p2(p2.x + r1.width - r1off.x, p2.y + r1.height - r1off.y);
        }
        //Check for a collision between the circle and the point
        collision = this.hitTestCirclePoint(c1, point, global);
      }
      return collision ? region : undefined;
    };
    /**
     * Use to find out if a circular shape is touching a point.
     *
     * @public
     * @function
     *
     */
    _D.hitTestCirclePoint=function(c1, point, global = false){
      //point = circle with diameter 1 pixel. do circle vs. circle test
      //supply the point with the properties it needs
      let pos= _.p2(point.x, point.y);
      let p={
        x:point.x,
        y:point.y,
        width: 1,
        height: 1,
        anchor: _.p2(0.5,0.5)
      };
      p=_S.extend(p);
      p.mojoh5.circular=true;
      p.mojoh5.cpos= pos;
      p.mojoh5.gpos = pos;
      return this.hitTestCircle(c1, p, global);
    };
    /**
     * @private
     * @function
     */
    function _circleRectangleCollision(c1, r1, bounce = false, global = false, flipped=false){
      let c1off= _S.anchorOffsetXY(c1);
      let r1off= _S.anchorOffsetXY(r1);
      let r1z= _S.halfSize(r1);
      let p1,g1= _S.gposXY(c1);
      let p2,g2=_S.gposXY(r1);
      let region, collision;
      if(global){
        p1=g1;p2=g2;
      }else{
        p1=c1;p2=r1;
      }
      //circle above the rectangle's top edge?
      if(p1.y - c1off.y < p2.y - r1z.y - r1off.y){
        //check whether it's in the top left, top center or top right
        region = "topMiddle";
        if(p1.x - c1off.x < p2.x - 1 - r1z.x - r1off.x){
          region = "topLeft";
        }else if(p1.x - c1off.x > p2.x + 1 + r1z.x - r1off.x){
          region = "topRight";
        }
      }else if(p1.y - c1off.y > p2.y + r1z.y - r1off.y){
        //below the bottom edge, check whether it's in the bottom left,
        //bottom center, or bottom right
        region = "bottomMiddle";
        if(p1.x - c1off.x < p2.x - 1 - r1z.x - r1off.x){
          region = "bottomLeft";
        }else if(p1.x - c1off.x > p2.x + 1 + r1z.x - r1off.x){
          region = "bottomRight";
        }
      }else{
        //The circle isn't above the top edge or below the bottom edge,
        //so it must be on the left or right side
        if(p1.x - c1off.x < p2.x - r1z.x - r1off.x){
          region = "leftMiddle";
        }else{
          region = "rightMiddle";
        }
      }
      //Is this the circle touching the flat sides
      //of the rectangle?
      if(region === "topMiddle" || region === "bottomMiddle" ||
        region === "leftMiddle" || region === "rightMiddle"){
        collision = _rectCollision(c1, r1, bounce, global,flipped);
      }else{
        //The circle is touching one of the corners, so do a
        //circle vs. point collision test
        let point;
        switch(region){
        case "topLeft":
          point = _.p2(p2.x - r1off.x, p2.y - r1off.y);
        break;
        case "topRight":
          point = _.p2(p2.x + r1.width - r1off.x, p2.y - r1off.y);
        break;
        case "bottomLeft":
          point = _.p2(p2.x - r1off.x, p2.y + r1.height - r1off.y);
        break;
        case "bottomRight":
          point = _.p2(p2.x + r1.width - r1off.x, p2.y + r1.height - r1off.y);
        }
        //Check for a collision between the circle and the point
        //TODO: flipping doesnt work with corners!!!!
        //collision = _circlePointCollision(c1, point, bounce, global,flipped);
        collision = _circlePointCollision(c1, point, bounce, global);
      }
      return collision ? region : undefined;
    }
    /**
     * Use to bounce a circular shape off a rectangular shape.
     *
     * @public
     * @function
     *
     */
    _D.rectangleCircleCollision=function(r1, c1, bounce = false, global = false){
      return _circleRectangleCollision(c1, r1, bounce, global, true);
    };
    _D.circleRectangleCollision=function(c1, r1, bounce = false, global = false){
      return _circleRectangleCollision(c1, r1, bounce, global);
    };
    /**
     * @private
     * @function
     */
    function _circlePointCollision(c1, point, bounce = false, global = false,flipped=false){
      //point = circle with diameter 1 pixel. do circle vs. circle test
      //supply the point with the properties it needs
      let pos= _.p2(point.x, point.y);
      let p= {
        x: point.x,
        y: point.y,
        width: 1,
        height: 1,
        anchor: _.p2(0.5,0.5)
      };
      p=_S.extend(p);
      p.mojoh5.circular=true;
      p.mojoh5.cpos= pos;
      p.mojoh5.gpos = pos;
      return flipped ? _D.circleCollision(p,c1, bounce, global)
                     : _D.circleCollision(c1, p, bounce, global);
    }
    /**
     * Use to boucnce a circle off a point.
     *
     * @public
     * @function
     *
     */
    _D.circlePointCollision=function(c1, point, bounce = false, global = false){
      return _circlePointCollision(c1,point,bounce,global);
    };
    _D.pointCircleCollision=function(point,c1, bounce = false, global = false){
      return _circlePointCollision(c1,point,bounce,global,flipped);
    };
    /**
     * Use to bounce an object off another object.
     *
     * @public
     * @function
     *
     */
    _D.bounceOffSurface=function(o, s){
      //1. Calculate the collision surface's properties
      //Find the surface vector's left normal
      let mag= V2.len(s);
      let p1={}, p2={};
      let lx = s.y;
      let ly = -s.x;
      let dx = s.x/mag;
      let dy = s.y/mag;
      //2. Bounce the object (o) off the surface (s)
      //Find the dot product between the object and the surface
      let dp1 = o.mojoh5.vx * dx + o.mojoh5.vy * dy;
      //Project the object's velocity onto the collision surface
      p1.vx = dp1 * dx;
      p1.vy = dp1 * dy;
      //Find the dot product of the object and the surface's left normal (s.lx and s.ly)
      let dp2 = o.mojoh5.vx * (lx/mag) + o.mojoh5.vy * (ly/mag);
      //Project the object's velocity onto the surface's left normal
      p2.vx = dp2 * (lx/mag);
      p2.vy = dp2 * (ly/mag);
      //Reverse the projection on the surface's left normal
      p2.vx *= -1;
      p2.vy *= -1;
      //Add up the projections to create a new bounce vector
      let bx = p1.vx + p2.vx;
      let by = p1.vy + p2.vy;
      //Assign the bounce vector to the object's velocity
      //with optional mass to dampen the effect
      o.mojoh5.vx = bx / o.mojoh5.mass;
      o.mojoh5.vy = by / o.mojoh5.mass;
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
      if(container.mojoh5.stage) container= Mojo.adjustForStage(container);
      //Give the container x and y anchor offset values, if it doesn't have any
      //if(container.xAnchorOffset === undefined) container.xAnchorOffset = 0;
      //if(container.yAnchorOffset === undefined) container.yAnchorOffset = 0;
      //if(sprite.parent.gx === undefined) sprite.parent.gx = 0;
      //if(sprite.parent.gy === undefined) sprite.parent.gy = 0;
      //Create a Set called `collision` to keep track of the
      //boundaries with which the sprite is colliding
      let coff= _S.anchorOffsetXY(container);
      let soff= _S.anchorOffsetXY(sprite);
      let pg= _S.gposXY(sprite.parent);
      let collision = new Set();
      //Left
      if(sprite.x - soff.x < container.x - pg.x - coff.x){
        if(bounce) sprite.mojoh5.vx *= -1;
        sprite.mojoh5.vx /= sprite.mojoh5.mass;
        sprite.x = container.x - pg.x - coff.x + soff.x;
        collision.add(Mojo.LEFT);
      }
      //Top
      if(sprite.y - soff.y < container.y - pg.y - coff.y){
        if(bounce) sprite.mojoh5.vy *= -1;
        sprite.mojoh5.vy /= sprite.mojoh5.mass;
        sprite.y = container.y - pg.y - coff.y + soff.y;
        collision.add(Mojo.TOP);
      }
      //Right
      if(sprite.x - soff.x + sprite.width > container.width - coff.x){
        if(bounce) sprite.mojoh5.vx *= -1;
        sprite.mojoh5.vx /= sprite.mojoh5.mass;
        sprite.x = container.width - sprite.width - coff.x + soff.x;
        collision.add(Mojo.RIGHT);
      }
      //Bottom
      if(sprite.y - soff.y + sprite.height > container.height - coff.y){
        if(bounce) sprite.mojoh5.vy *= -1;
        sprite.mojoh5.vy /= sprite.mojoh5.mass;
        sprite.y = container.height - sprite.height - coff.y + soff.y;
        collision.add(Mojo.BOTTOM);
      }
      if(collision.size === 0) collision = undefined;
      if(collision && extra) extra(collision);
      return collision;
    };
    /**
     * Checks whether a sprite is outide the boundary of another object.
     *
     * @public
     * @function
     *
     */
    _D.outsideBounds=function(s, bounds, extra){
      if(bounds.mojoh5.stage) bounds = Mojo.adjustForStage(bounds);
      let height = bounds.height;
      let width = bounds.width;
      let x = bounds.x;
      let y = bounds.y;
      let collision = new Set();
      if(s.x < x - s.width) { collision.add(Mojo.LEFT); }
      if(s.y < y - s.height) { collision.add(Mojo.TOP); }
      if(s.x > width + s.width) { collision.add(Mojo.RIGHT); }
      if(s.y > height + s.height) { collision.add(Mojo.BOTTOM); }
      if(collision.size === 0) collision = undefined;
      if(collision && extra) extra(collision);
      return collision;
    };
    /**
     * A convenient universal collision function to test for collisions
     * between rectangles, circles, and points.
     *
     * @public
     * @function
     *
     */
    _D.hit=function(a, b, react = false, bounce = false, global, extra = undefined){
      let collision;
      function _circleVsCircle(a, b){
        return !react ? _D.hitTestCircle(a,b)
                      : (_S.moving(a) && _S.moving(b) ? _D.movingCircleCollision(a, b, global)
                                                      : _D.circleCollision(a, b, bounce, global));
      }
      function _rectVsRect(a, b){
        return !react ? _D.hitTestRectangle(a, b, global)
                      : _D.rectangleCollision(a, b, bounce, global);
      }
      function _circleVsRect(a, b){
        return !react ? _D.hitTestCircleRectangle(a, b, global)
                      : _D.circleRectangleCollision(a, b, bounce, global);
      }
      function _rectVsCircle(a, b){
        return !react ? _D.hitTestCircleRectangle(b,a, global)
                      : _circleRectangleCollision(b,a, bounce, global,true);
      }
      function _findCollisionType(a, b){
        let aisp = _.inst(Mojo.p.Sprite,a);//a.parent !== undefined;
        let bisp = _.inst(Mojo.p.Sprite,b);//b.parent !== undefined;
        if(bisp){
          if(!aisp) return _D.hitTestPoint(a, b);
          if(a.mojoh5.circular){
            return b.mojoh5.circular ? _circleVsCircle(a, b) : _circleVsRect(a,b);
          }else{
            return b.mojoh5.circular ? _rectVsCircle(a, b) : _rectVsRect(a,b);
          }
        }else{
          throw `Error: ${a} and ${b} cannot be use together in a collision test`;
        }
      }
      //if(aIsASprite && is.vec(b) || bIsASprite && is.vec(a))
      //Check to make sure one of the arguments isn't an array
      if(is.vec(a) || is.vec(b)){
        //If `a` happens to be the array, flip it around so that it becomes `b`
        if(is.vec(a)){ let tmp=a; a=b; b=tmp; }
        for(let i=b.length-1; i >= 0; --i){
          collision = _findCollisionType(a, b[i]);
          if(collision) if(extra) extra(collision, b[i]);
        }
      }else{
        collision = _findCollisionType(a, b);
        if(collision) if(extra) extra(collision, b);
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
          this.x = sprite.x + sz.x - (this.width/2);
          this.y = sprite.y + sz.y - (this.height/2);
        }
      };
      return camera;
    };

    return Mojo["2d"]= _D;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

