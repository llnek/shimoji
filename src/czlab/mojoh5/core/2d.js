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
  MojoH5["2d"]=function(Mojo) {
    const _D= {};
    let _=Mojo.u,
      is=Mojo.is;
    /**
     * @private
     * @function
     */
    function _addCollisionProperties(s) {
      return s._bumpProps ? s : Mojo.Sprites.extend(s);
    };
    /**
     * @public
     * @function
     * Use it to find out if a point is touching a circlular or rectangular sprite.
     * Parameters:
     * a. An object with `x` and `y` properties.
     * b. A sprite object with `x`, `y`, `centerX` and `centerY` properties.
     * If the sprite has a `radius` property, the function will interpret
     * the shape as a circle.
     */
    _D.hitTestPoint=function(point, sprite) {
      let shape, left, right, top, bottom, vx, vy, magnitude, hit;
      //_addCollisionProperties(sprite);
      shape= sprite.radius ? "circle" : "rectangle";
      if(shape === "rectangle") {
        //Get the position of the sprite's edges
        left = sprite.x - sprite.xAnchorOffset;
        right = sprite.x + sprite.width - sprite.xAnchorOffset;
        top = sprite.y - sprite.yAnchorOffset;
        bottom = sprite.y + sprite.height - sprite.yAnchorOffset;
        //Find out if the point is intersecting the rectangle
        hit = point.x > left && point.x < right && point.y > top && point.y < bottom;
      }
      if(shape === "circle") {
        //Find the distance between the point and the
        //center of the circle
        let vx = point.x - sprite.x - (sprite.width / 2) + sprite.xAnchorOffset,
            vy = point.y - sprite.y - (sprite.height / 2) + sprite.yAnchorOffset,
            magnitude = Math.sqrt(vx * vx + vy * vy);
        //The point is intersecting the circle if the magnitude
        //(distance) is less than the circle's radius
        hit = magnitude < sprite.radius;
      }
      return hit;
    };
    /**
     * @public
     * @function
     *
     * Use it to find out if two circular sprites are touching.
     * Parameters:
     * a. A sprite object with `centerX`, `centerY` and `radius` properties.
     * b. A sprite object with `centerX`, `centerY` and `radius`.
     */
    _D.hitTestCircle=function(c1, c2, global = false) {
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      //if(!c2._bumpProps) _addCollisionProperties(c2);
      let vx, vy,
        r1=c1.radius,
        r2= c2.radius;

      //Calculate the vector between the circles’ center points
      if(global) {
        vx = (c2.gx + r2 - c2.xAnchorOffset) - (c1.gx + r1 - c1.xAnchorOffset);
        vy = (c2.gy + r2 - c2.yAnchorOffset) - (c1.gy + r1 - c1.yAnchorOffset);
      } else {
        vx = (c2.x + r2 - c2.xAnchorOffset) - (c1.x + r1 - c1.xAnchorOffset);
        vy = (c2.y + r2 - c2.yAnchorOffset) - (c1.y + r1 - c1.yAnchorOffset);
      }
      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      return Math.sqrt(vx * vx + vy * vy) < (r1+r2);
    };
    /**
     * @public
     * @function
     *
     * Use it to prevent a moving circular sprite from overlapping and optionally
     * bouncing off a non-moving circular sprite.
     * Parameters:
     * a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
     * b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
     * c. Optional: true or false to indicate whether or not the first sprite
     * should bounce off the second sprite.
     * The sprites can contain an optional mass property that should be greater than 1.
     */
    _D.circleCollision=function(c1, c2, bounce = false, global = false) {
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      //if(!c2._bumpProps) _addCollisionProperties(c2);
      let r1=c1.radius, r2=c2.radius,
        magnitude, combinedRadii, overlap,
        vx, vy, dx, dy, s = {}, hit = false;
      if(global) {
        vx = (c2.gx + r2 - c2.xAnchorOffset) - (c1.gx + r1 - c1.xAnchorOffset);
        vy = (c2.gy + r2 - c2.yAnchorOffset) - (c1.gy + r1 - c1.yAnchorOffset);
      } else {
        vx = (c2.x + r2 - c2.xAnchorOffset) - (c1.x + r1 - c1.xAnchorOffset);
        vy = (c2.y + r2 - c2.yAnchorOffset) - (c1.y + r1 - c1.yAnchorOffset);
      }
      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      magnitude = Math.sqrt(vx * vx + vy * vy);
      combinedRadii = r1+r2;
      if(magnitude < combinedRadii) {
        hit = true;
        overlap = combinedRadii - magnitude;
        //Add some "quantum padding". This adds a tiny amount of space
        //between the circles to reduce their surface tension and make
        //them more slippery. "0.3" is a good place to start but you might
        //need to modify this slightly depending on the exact behaviour
        //you want. Too little and the balls will feel sticky, too much
        //and they could start to jitter if they're jammed together
        let quantumPadding = 0.3;
        overlap += quantumPadding;
        //Normalize the vector
        //These numbers tell us the direction of the collision
        dx = vx / magnitude;
        dy = vy / magnitude;
        //Move circle 1 out of the collision by multiplying
        //the overlap with the normalized vector and subtract it from
        //circle 1's position
        c1.x -= overlap * dx;
        c1.y -= overlap * dy;
        if(bounce) {
          //Create a collision vector object, `s` to represent the bounce "surface".
          //Find the bounce surface's x and y properties
          //(This represents the normal of the distance vector between the circles)
          s.x = vy;
          s.y = -vx;
          //Bounce c1 off the surface
          this.bounceOffSurface(c1, s);
        }
      }
      return hit;
    };
    /**
     * @public
     * @function
     *
     * Use it to make two moving circles bounce off each other.
     * Parameters:
     * a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
     * b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
     * The sprites can contain an optional mass property that should be greater than 1.
    */
    _D.movingCircleCollision=function(c1, c2, global = false) {
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      //if(!c2._bumpProps) _addCollisionProperties(c2);
      let combinedRadii, overlap, xSide, ySide,
        r1=c1.radius, r2=c2.radius,
        //`s` refers to the distance vector between the circles
        s = {},
        p1A = {},
        p1B = {},
        p2A = {},
        p2B = {},
        hit = false;
      //Apply mass, if the circles have mass properties
      c1.mass = c1.mass || 1;
      c2.mass = c2.mass || 1;
      //Calculate the vector between the circles’ center points
      if(global) {
        s.vx = (c2.gx + r2 - c2.xAnchorOffset) - (c1.gx + r1 - c1.xAnchorOffset);
        s.vy = (c2.gy + r2 - c2.yAnchorOffset) - (c1.gy + r1 - c1.yAnchorOffset);
      } else {
        s.vx = (c2.x + r2 - c2.xAnchorOffset) - (c1.x + r1 - c1.xAnchorOffset);
        s.vy = (c2.y + r2 - c2.yAnchorOffset) - (c1.y + r1 - c1.yAnchorOffset);
      }
      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      s.magnitude = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      //Add together the circles' combined half-widths
      combinedRadii = r1 + r2;
      //Figure out if there's a collision
      if(s.magnitude < combinedRadii) {
        hit = true;
        //Find the amount of overlap between the circles
        overlap = combinedRadii - s.magnitude;
        //Add some "quantum padding" to the overlap
        overlap += 0.3;
        //Normalize the vector.
        //These numbers tell us the direction of the collision
        s.dx = s.vx / s.magnitude;
        s.dy = s.vy / s.magnitude;
        //Find the collision vector.
        //Divide it in half to share between the circles, and make it absolute
        s.vxHalf = Math.abs(s.dx * overlap / 2);
        s.vyHalf = Math.abs(s.dy * overlap / 2);
        //Find the side that the collision is occurring on
        (c1.x > c2.x) ? xSide = 1 : xSide = -1;
        (c1.y > c2.y) ? ySide = 1 : ySide = -1;
        //Move c1 out of the collision by multiplying
        //the overlap with the normalized vector and adding it to
        //the circles' positions
        c1.x = c1.x + (s.vxHalf * xSide);
        c1.y = c1.y + (s.vyHalf * ySide);
        //Move c2 out of the collision
        c2.x = c2.x + (s.vxHalf * -xSide);
        c2.y = c2.y + (s.vyHalf * -ySide);
        //1. Calculate the collision surface's properties
        //Find the surface vector's left normal
        s.lx = s.vy;
        s.ly = -s.vx;
        //2. Bounce c1 off the surface (s)
        //Find the dot product between c1 and the surface
        let dp1 = c1.vx * s.dx + c1.vy * s.dy;
        //Project c1's velocity onto the collision surface
        p1A.x = dp1 * s.dx;
        p1A.y = dp1 * s.dy;
        //Find the dot product of c1 and the surface's left normal (s.lx and s.ly)
        let dp2 = c1.vx * (s.lx / s.magnitude) + c1.vy * (s.ly / s.magnitude);
        //Project the c1's velocity onto the surface's left normal
        p1B.x = dp2 * (s.lx / s.magnitude);
        p1B.y = dp2 * (s.ly / s.magnitude);
        //3. Bounce c2 off the surface (s)
        //Find the dot product between c2 and the surface
        let dp3 = c2.vx * s.dx + c2.vy * s.dy;
        //Project c2's velocity onto the collision surface
        p2A.x = dp3 * s.dx;
        p2A.y = dp3 * s.dy;
        //Find the dot product of c2 and the surface's left normal (s.lx and s.ly)
        let dp4 = c2.vx * (s.lx / s.magnitude) + c2.vy * (s.ly / s.magnitude);
        //Project c2's velocity onto the surface's left normal
        p2B.x = dp4 * (s.lx / s.magnitude);
        p2B.y = dp4 * (s.ly / s.magnitude);
        //4. Calculate the bounce vectors
        //Bounce c1
        //using p1B and p2A
        c1.bounce = {};
        c1.bounce.x = p1B.x + p2A.x;
        c1.bounce.y = p1B.y + p2A.y;
        //Bounce c2
        //using p1A and p2B
        c2.bounce = {};
        c2.bounce.x = p1A.x + p2B.x;
        c2.bounce.y = p1A.y + p2B.y;
        //Add the bounce vector to the circles' velocity
        //and add mass if the circle has a mass property
        c1.vx = c1.bounce.x / c1.mass;
        c1.vy = c1.bounce.y / c1.mass;
        c2.vx = c2.bounce.x / c2.mass;
        c2.vy = c2.bounce.y / c2.mass;
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
    _D.multipleCircleCollision=function(arrayOfCircles, global = false) {
      for(let i=0; i < arrayOfCircles.length; ++i) {
        //The first circle to use in the collision check
        let c1 = arrayOfCircles[i];
        for(let j = i+1; j < arrayOfCircles.length; ++j) {
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
     * @public
     * @function
     *
     * Use it to prevent two rectangular sprites from overlapping.
     * Optionally, make the first rectangle bounce off the second rectangle.
     * Parameters:
     * a. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     * b. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     * c. Optional: true or false to indicate whether or not the first sprite
     * should bounce off the second sprite.
     */
    _D.rectangleCollision=function(r1, r2, bounce = false, global = true) {
      //if(!r1._bumpProps) _addCollisionProperties(r1);
      //if(!r2._bumpProps) _addCollisionProperties(r2);
      let collision, combinedHalfWidths, combinedHalfHeights,
        overlapX, overlapY, vx, vy;

      let r1w2= Math.abs(r1.halfWidth);
      let r1h2= Math.abs(r1.halfHeight);
      let r2w2= Math.abs(r2.halfWidth);
      let r2h2= Math.abs(r2.halfHeight);

      if(global) {
        vx = (r1.gx + r1w2 - r1.xAnchorOffset) - (r2.gx + r2w2 - r2.xAnchorOffset);
        vy = (r1.gy + r1h2 - r1.yAnchorOffset) - (r2.gy + r2h2 - r2.yAnchorOffset);
      } else {
        vx = (r1.x + r1w2 - r1.xAnchorOffset) - (r2.x + r2w2 - r2.xAnchorOffset);
        vy = (r1.y + r1h2 - r1.yAnchorOffset) - (r2.y + r2h2 - r2.yAnchorOffset);
      }
      //Figure out the combined half-widths and half-heights
      combinedHalfWidths = r1w2 + r2w2;
      combinedHalfHeights = r1h2 + r2h2;
      //Check whether vx is less than the combined half widths
      if(Math.abs(vx) < combinedHalfWidths) {
        //A collision might be occurring!
        //Check whether vy is less than the combined half heights
        if(Math.abs(vy) < combinedHalfHeights) {
          //A collision has occurred! This is good!
          //Find out the size of the overlap on both the X and Y axes
          overlapX = combinedHalfWidths - Math.abs(vx);
          overlapY = combinedHalfHeights - Math.abs(vy);
          //The collision has occurred on the axis with the
          //*smallest* amount of overlap. Let's figure out which
          //axis that is
          if(overlapX >= overlapY) {
            //The collision is happening on the X axis
            //But on which side? vy can tell us
            if(vy > 0) {
              collision = "top";
              //Move the rectangle out of the collision
              r1.y = r1.y + overlapY;
            } else {
              collision = "bottom";
              //Move the rectangle out of the collision
              r1.y = r1.y - overlapY;
            }
            //Bounce
            if(bounce) {
              r1.vy *= -1;
            }
          } else {
            //The collision is happening on the Y axis
            //But on which side? vx can tell us
            if(vx > 0) {
              collision = "left";
              //Move the rectangle out of the collision
              r1.x = r1.x + overlapX;
            } else {
              collision = "right";
              //Move the rectangle out of the collision
              r1.x = r1.x - overlapX;
            }
            if(bounce) {
              r1.vx *= -1;
            }
          }
        } else {
          //No collision
        }
      } else {
        //No collision
      }
      //Return the collision string. it will be either "top", "right",
      //"bottom", or "left" depending on which side of r1 is touching r2.
      return collision;
    };
    /**
     * @public
     * @function
     *
     * Use it to find out if two rectangular sprites are touching.
     * Parameters:
     * a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     * b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    */
    _D.hitTestRectangle=function(r1, r2, global = false) {
      //if(!r1._bumpProps) _addCollisionProperties(r1);
      //if(!r2._bumpProps) _addCollisionProperties(r2);
      let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
      let r1w2= Math.abs(r1.halfWidth);
      let r1h2= Math.abs(r1.halfHeight);
      let r2w2= Math.abs(r2.halfWidth);
      let r2h2= Math.abs(r2.halfHeight);
      hit = false;
      //Calculate the distance vector
      if(global) {
        vx = (r1.gx + r1w2 - r1.xAnchorOffset) - (r2.gx + r2w2 - r2.xAnchorOffset);
        vy = (r1.gy + r1h2 - r1.yAnchorOffset) - (r2.gy + r2h2 - r2.yAnchorOffset);
      } else {
        vx = (r1.x + r1w2 - r1.xAnchorOffset) - (r2.x + r2w2 - r2.xAnchorOffset);
        vy = (r1.y + r1h2 - r1.yAnchorOffset) - (r2.y + r2h2 - r2.yAnchorOffset);
      }
      //Figure out the combined half-widths and half-heights
      combinedHalfWidths = r1w2 + r2w2;
      combinedHalfHeights = r1h2 + r2h2;
      //Check for a collision on the x axis
      if(Math.abs(vx) < combinedHalfWidths) {
        //A collision might be occuring. Check for a collision on the y axis
        if(Math.abs(vy) < combinedHalfHeights) {
          hit = true;
        } else {
          hit = false;
        }
      } else {
        hit = false;
      }
      return hit;
    };
    /**
     * @public
     * @function
     *
     * Use it to find out if a circular shape is touching a rectangular shape
     * Parameters:
     * a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     * b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    */
    _D.hitTestCircleRectangle=function(c1, r1, global = false) {
      //if(!r1._bumpProps) _addCollisionProperties(r1);
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      let region, collision, c1x, c1y, r1x, r1y;
      let r1w2=Math.abs(r1.halfWidth), r1h2=Math.abs(r1.halfHeight);

      if(global) {
        c1x = c1.gx; c1y = c1.gy; r1x = r1.gx; r1y = r1.gy;
      } else {
        c1x = c1.x; c1y = c1.y; r1x = r1.x; r1y = r1.y;
      }
      //Is the circle above the rectangle's top edge?
      if(c1y - c1.yAnchorOffset < r1y - r1h2 - r1.yAnchorOffset) {
        //If it is, we need to check whether it's in the
        //top left, top center or top right
        if(c1x - c1.xAnchorOffset < r1x - 1 - r1w2 - r1.xAnchorOffset) {
          region = "topLeft";
        } else if (c1x - c1.xAnchorOffset > r1x + 1 + r1w2 - r1.xAnchorOffset) {
          region = "topRight";
        } else {
          region = "topMiddle";
        }
      } else if(c1y - c1.yAnchorOffset > r1y + r1h2 - r1.yAnchorOffset) {
        //The circle isn't above the top edge, so it might be
        //below the bottom edge
        //If it is, we need to check whether it's in the bottom left,
        //bottom center, or bottom right
        if(c1x - c1.xAnchorOffset < r1x - 1 - r1w2 - r1.xAnchorOffset) {
          region = "bottomLeft";
        } else if (c1x - c1.xAnchorOffset > r1x + 1 + r1w2 - r1.xAnchorOffset) {
          region = "bottomRight";
        } else {
          region = "bottomMiddle";
        }
      } else {
        //The circle isn't above the top edge or below the bottom edge,
        //so it must be on the left or right side
        if(c1x - c1.xAnchorOffset < r1x - r1w2 - r1.xAnchorOffset) {
          region = "leftMiddle";
        } else {
          region = "rightMiddle";
        }
      }
      //Is this the circle touching the flat sides
      //of the rectangle?
      if(region === "topMiddle" || region === "bottomMiddle" ||
        region === "leftMiddle" || region === "rightMiddle") {
        collision = this.hitTestRectangle(c1, r1, global);
      } else {
        //The circle is touching one of the corners, so do a
        //circle vs. point collision test
        let point = {};
        switch (region) {
        case "topLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
        break;
        case "topRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
        break;
        case "bottomLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
        break;
        case "bottomRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
        }
        //Check for a collision between the circle and the point
        collision = this.hitTestCirclePoint(c1, point, global);
      }
      return collision ? region : undefined;
    };
    /**
     * @public
     * @function
     * Use it to find out if a circular shape is touching a point
     * Parameters:
     * a. A sprite object with `centerX`, `centerY`, and `radius` properties.
     * b. A point object with `x` and `y` properties.
     */
    _D.hitTestCirclePoint=function(c1, point, global = false) {
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      //A point is just a circle with a diameter of
      //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
      //Collision test. Just supply the point with the properties
      //it needs
      point.diameter = 1;
      point.width = point.height=point.diameter;
      point.radius = 0.5;
      point.centerX = point.x;
      point.centerY = point.y;
      point.gx = point.x;
      point.gy = point.y;
      point.xAnchorOffset = 0;
      point.yAnchorOffset = 0;
      point._bumpProps = true;
      return this.hitTestCircle(c1, point, global);
    };
    /**
     * @public
     * @function
     *
     * Use it to bounce a circular shape off a rectangular shape
     * Parameters:
     * a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     * b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     */
    _D.circleRectangleCollision=function(c1, r1, bounce = false, global = false) {
      //if(!r1._bumpProps) _addCollisionProperties(r1);
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      let r1w2=Math.abs(r1.halfWidth), r1h2=Math.abs(r1.halfHeight);
      let region, collision, c1x, c1y, r1x, r1y;

      if(global) {
        c1x = c1.gx; c1y = c1.gy; r1x = r1.gx; r1y = r1.gy;
      } else {
        c1x = c1.x; c1y = c1.y; r1x = r1.x; r1y = r1.y;
      }

      //Is the circle above the rectangle's top edge?
      if(c1y - c1.yAnchorOffset < r1y - r1h2 - r1.yAnchorOffset) {
        //If it is, we need to check whether it's in the
        //top left, top center or top right
        if(c1x - c1.xAnchorOffset < r1x - 1 - r1w2 - r1.xAnchorOffset) {
          region = "topLeft";
        } else if (c1x - c1.xAnchorOffset > r1x + 1 + r1w2 - r1.xAnchorOffset) {
          region = "topRight";
        } else {
          region = "topMiddle";
        }
      } else if (c1y - c1.yAnchorOffset > r1y + r1h2 - r1.yAnchorOffset) {
        //The circle isn't above the top edge, so it might be
        //below the bottom edge
        //If it is, we need to check whether it's in the bottom left,
        //bottom center, or bottom right
        if(c1x - c1.xAnchorOffset < r1x - 1 - r1w2 - r1.xAnchorOffset) {
          region = "bottomLeft";
        } else if (c1x - c1.xAnchorOffset > r1x + 1 + r1w2 - r1.xAnchorOffset) {
          region = "bottomRight";
        } else {
          region = "bottomMiddle";
        }
      } else {
        //The circle isn't above the top edge or below the bottom edge,
        //so it must be on the left or right side
        if(c1x - c1.xAnchorOffset < r1x - r1w2 - r1.xAnchorOffset) {
          region = "leftMiddle";
        } else {
          region = "rightMiddle";
        }
      }
      //Is this the circle touching the flat sides
      //of the rectangle?
      if(region === "topMiddle" || region === "bottomMiddle" ||
        region === "leftMiddle" || region === "rightMiddle") {
        collision = this.rectangleCollision(c1, r1, bounce, global);
      } else {
        //The circle is touching one of the corners, so do a
        //circle vs. point collision test
        let point = {};
        switch (region) {
        case "topLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
        break;
        case "topRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
        break;
        case "bottomLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
        break;
        case "bottomRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
        }
        //Check for a collision between the circle and the point
        collision = this.circlePointCollision(c1, point, bounce, global);
      }
      return collision ? region : undefined;
    };
    /**
     * @public
     * @function
     *
     * Use it to boucnce a circle off a point.
     * Parameters:
     * a. A sprite object with `centerX`, `centerY`, and `radius` properties.
     * b. A point object with `x` and `y` properties.
     */
    _D.circlePointCollision=function(c1, point, bounce = false, global = false) {
      //if(!c1._bumpProps) _addCollisionProperties(c1);
      //A point is just a circle with a diameter of
      //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
      //Collision test. Just supply the point with the properties
      //it needs
      point.diameter = 1;
      point.width = point.height= point.diameter;
      point.radius = 0.5;
      point.centerX = point.x;
      point.centerY = point.y;
      point.gx = point.x;
      point.gy = point.y;
      point.xAnchorOffset = 0;
      point.yAnchorOffset = 0;
      point._bumpProps = true;
      return this.circleCollision(c1, point, bounce, global);
    };
    /**
     * @public
     * @function
     *
     * Use this to bounce an object off another object.
     * Parameters:
     * a. An object with `v.x` and `v.y` properties. This represents the object that is colliding
     * with a surface.
     * b. An object with `x` and `y` properties. This represents the surface that the object
     * is colliding into.
     * The first object can optionally have a mass property that's greater than 1. The mass will
     * be used to dampen the bounce effect.
     */
    _D.bounceOffSurface=function(o, s) {
      //if(!o._bumpProps) _addCollisionProperties(o);
      let dp1, dp2,
        p1 = {}, p2 = {},
        bounce = {}, mass = o.mass || 1;
      //1. Calculate the collision surface's properties
      //Find the surface vector's left normal
      s.lx = s.y;
      s.ly = -s.x;
      //Find its magnitude
      s.magnitude = Math.sqrt(s.x * s.x + s.y * s.y);
      //Find its normalized values
      s.dx = s.x / s.magnitude;
      s.dy = s.y / s.magnitude;
      //2. Bounce the object (o) off the surface (s)
      //Find the dot product between the object and the surface
      dp1 = o.vx * s.dx + o.vy * s.dy;
      //Project the object's velocity onto the collision surface
      p1.vx = dp1 * s.dx;
      p1.vy = dp1 * s.dy;
      //Find the dot product of the object and the surface's left normal (s.lx and s.ly)
      dp2 = o.vx * (s.lx / s.magnitude) + o.vy * (s.ly / s.magnitude);
      //Project the object's velocity onto the surface's left normal
      p2.vx = dp2 * (s.lx / s.magnitude);
      p2.vy = dp2 * (s.ly / s.magnitude);
      //Reverse the projection on the surface's left normal
      p2.vx *= -1;
      p2.vy *= -1;
      //Add up the projections to create a new bounce vector
      bounce.x = p1.vx + p2.vx;
      bounce.y = p1.vy + p2.vy;
      //Assign the bounce vector to the object's velocity
      //with optional mass to dampen the effect
      o.vx = bounce.x / mass;
      o.vy = bounce.y / mass;
    };
    /**
     * @public
     * @function
     *
     * `contain` can be used to contain a sprite with `x` and
     * `y` properties inside a rectangular area.
     *
     * The `contain` function takes four arguments: a sprite with `x` and `y`
     * properties, an object literal with `x`, `y`, `width` and `height` properties. The
     * third argument is a Boolean (true/false) value that determines if the sprite
     * should bounce when it hits the edge of the container. The fourth argument
     * is an extra user-defined callback function that you can call when the
     * sprite hits the container
     * ```js
     * contain(anySprite, {x: 0, y: 0, width: 512, height: 512}, true, callbackFunction);
     * ```
     * The code above will contain the sprite's position inside the 512 by
     * 512 pixel area defined by the object. If the sprite hits the edges of
     * the container, it will bounce. The `callBackFunction` will run if
     * there's a collision.
     *
     * An additional feature of the `contain` method is that if the sprite
     * has a `mass` property, it will be used to dampen the sprite's bounce
     * in a natural looking way.
     *
     * If the sprite bumps into any of the containing object's boundaries,
     * the `contain` function will return a value that tells you which side
     * the sprite bumped into: “left”, “top”, “right” or “bottom”. Here's how
     * you could keep the sprite contained and also find out which boundary
     * it hit:
     * ```js
     * //Contain the sprite and find the collision value
     * let collision = contain(anySprite, {x: 0, y: 0, width: 512, height: 512});
     *
     * //If there's a collision, display the boundary that the collision happened on
     * if(collision) {
     *  if collision.has("left") console.log("The sprite hit the left");
     *  if collision.has("top") console.log("The sprite hit the top");
     *  if collision.has("right") console.log("The sprite hit the right");
     *  if collision.has("bottom") console.log("The sprite hit the bottom");
     * }
     * ```
     * If the sprite doesn't hit a boundary, the value of
     * `collision` will be `undefined`.
     */
    _D.contain=function(sprite, container, bounce = false, extra = undefined) {
      //if(!sprite._bumpProps) _addCollisionProperties(sprite);
      if(container._stage) container= Mojo.adjustForStage(container);
      //Give the container x and y anchor offset values, if it doesn't have any
      if(container.xAnchorOffset === undefined) container.xAnchorOffset = 0;
      if(container.yAnchorOffset === undefined) container.yAnchorOffset = 0;
      if(sprite.parent.gx === undefined) sprite.parent.gx = 0;
      if(sprite.parent.gy === undefined) sprite.parent.gy = 0;

      //Create a Set called `collision` to keep track of the
      //boundaries with which the sprite is colliding
      let collision = new Set();
      //Left
      if(sprite.x - sprite.xAnchorOffset < container.x - sprite.parent.gx - container.xAnchorOffset) {
        if(bounce) sprite.vx *= -1;
        if(sprite.mass) sprite.vx /= sprite.mass;
        sprite.x = container.x - sprite.parent.gx - container.xAnchorOffset + sprite.xAnchorOffset;
        collision.add("left");
      }
      //Top
      if(sprite.y - sprite.yAnchorOffset < container.y - sprite.parent.gy - container.yAnchorOffset) {
        if(bounce) sprite.vy *= -1;
        if(sprite.mass) sprite.vy /= sprite.mass;
        sprite.y = container.y - sprite.parent.gy - container.yAnchorOffset + sprite.yAnchorOffset;;
        collision.add("top");
      }
      //Right
      if(sprite.x - sprite.xAnchorOffset + sprite.width > container.width - container.xAnchorOffset) {
        if(bounce) sprite.vx *= -1;
        if(sprite.mass) sprite.vx /= sprite.mass;
        sprite.x = container.width - sprite.width - container.xAnchorOffset + sprite.xAnchorOffset;
        collision.add("right");
      }
      //Bottom
      if(sprite.y - sprite.yAnchorOffset + sprite.height > container.height - container.yAnchorOffset) {
        if(bounce) sprite.vy *= -1;
        if(sprite.mass) sprite.vy /= sprite.mass;
        sprite.y = container.height - sprite.height - container.yAnchorOffset + sprite.yAnchorOffset;
        collision.add("bottom");
      }
      if(collision.size === 0) collision = undefined;
      if(collision && extra) extra(collision);
      return collision;
    };
    /**
     * @public
     * @function
     *
     * `outsideBounds` checks whether a sprite is outide the boundary of
     * another object. It returns an object called `collision`. `collision` will be `undefined` if there's no
     * collision. But if there is a collision, `collision` will be
     * returned as a Set containg strings that tell you which boundary
     * side was crossed: "left", "right", "top" or "bottom"
     */
    _D.outsideBounds=function(s, bounds, extra) {
      if(bounds._stage) bounds = Mojo.adjustForStage(bounds);
      let x = bounds.x,
        y = bounds.y,
        width = bounds.width,
        height = bounds.height,
        collision = new Set();
      if(s.x < x - s.width) { collision.add("left"); }
      if(s.y < y - s.height) { collision.add("top"); }
      if(s.x > width + s.width) { collision.add("right"); }
      if(s.y > height + s.height) { collision.add("bottom"); }
      if(collision.size === 0) collision = undefined;
      if(collision && extra) extra(collision);
      return collision;
    };
    /**
     * @public
     * @function
     *
     * A convenient universal collision function to test for collisions
     * between rectangles, circles, and points.
     */
    _D.hit=function(a, b, react = false, bounce = false, global, extra = undefined) {
      let hitTestPoint = this.hitTestPoint.bind(this),
          hitTestRectangle = this.hitTestRectangle.bind(this),
          hitTestCircle = this.hitTestCircle.bind(this),
          movingCircleCollision = this.movingCircleCollision.bind(this),
          circleCollision = this.circleCollision.bind(this),
          hitTestCircleRectangle = this.hitTestCircleRectangle.bind(this),
          rectangleCollision = this.rectangleCollision.bind(this),
          circleRectangleCollision = this.circleRectangleCollision.bind(this);
      let collision,
        aIsASprite = a.parent !== undefined,
        bIsASprite = b.parent !== undefined;
      //
      function _findCollisionType(a, b) {
        let aIsASprite = a.parent !== undefined;
        let bIsASprite = b.parent !== undefined;
        if(aIsASprite && bIsASprite) {
          if(a.diameter && b.diameter) {
            return _circleVsCircle(a, b);
          } else if (a.diameter && !b.diameter) {
            return _circleVsRectangle(a, b);
          } else {
            return _rectangleVsRectangle(a, b);
          }
        } else if(bIsASprite && !(a.x === undefined) && !(a.y === undefined)) {
          //so this is a point vs. sprite collision test
          return hitTestPoint(a, b);
        } else {
          throw `${a} and ${b} cannot be use together in a collision test`;
        }
      }
      function _spriteVsArray() {
        //If `a` happens to be the array, flip it around so that it becomes `b`
        if(is.vec(a)) {
          //let [a, b] = [b, a];
          let tmp=a; a=b; b=tmp;
        }
        for(let s,i=b.length-1; i >= 0; --i) {
          s= b[i];
          collision = _findCollisionType(a, s);
          if(collision && extra) extra(collision, s);
        }
      }
      function _circleVsCircle(a, b) {
        //If the circles shouldn't react to the collision,
        //just test to see if they're touching
        if(!react) {
          return hitTestCircle(a, b);
        } else {
          //Yes, the circles should react to the collision
          //Are they both moving?
          if(a.vx + a.vy !== 0 && b.vx + b.vy !== 0) {
            //Yes, they are both moving
            //(moving circle collisions always bounce apart so there's
            //no need for the third, `bounce`, argument)
            return movingCircleCollision(a, b, global);
          } else {
            //No, they're not both moving
            return circleCollision(a, b, bounce, global);
          }
        }
      }
      function _rectangleVsRectangle(a, b) {
        //If the rectangles shouldn't react to the collision, just
        //test to see if they're touching
        if(!react) {
          return hitTestRectangle(a, b, global);
        } else {
          return rectangleCollision(a, b, bounce, global);
        }
      }
      function _circleVsRectangle(a, b) {
        //If the rectangles shouldn't react to the collision, just
        //test to see if they're touching
        if(!react) {
          return hitTestCircleRectangle(a, b, global);
        } else {
          return circleRectangleCollision(a, b, bounce, global);
        }
      }
      //Check to make sure one of the arguments isn't an array
      if(aIsASprite && is.vec(b) || bIsASprite && is.vec(a)) {
        _spriteVsArray();
      } else {
        //If one of the arguments isn't an array, find out what type of
        //collision check to run
        collision = _findCollisionType(a, b);
        if(collision && extra) extra(collision);
      }
      //Return the result of the collision.
      //It will be `undefined` if there's no collision and `true` if
      //there is a collision. `rectangleCollision` sets `collsision` to
      //"top", "bottom", "left" or "right" depeneding on which side the
      //collision is occuring on
      return collision;
    };
    /**
     * @public
     * @function
     *
     * The `worldCamera` method returns a `camera` object
     * with `x` and `y` properties. It has
     * two useful methods: `centerOver`, to center the camera over
     * a sprite, and `follow` to make it follow a sprite.
     * `worldCamera` arguments: worldObject, theCanvas
     * The worldObject needs to have a `width` and `height` property.
     */
    _D.worldCamera= function(world, worldWidth, worldHeight, canvas) {
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
        follow: function(sprite) {
          //Check the sprites position in relation to the inner
          //boundary. Move the camera to follow the sprite if the sprite
          //strays outside the boundary
          if(sprite.x < this.leftInnerBoundary) {
            this.x = sprite.x - (this.width/4);
          }
          if(sprite.y < this.topInnerBoundary) {
            this.y = sprite.y - (this.height/4);
          }
          if(sprite.x + sprite.width > this.rightInnerBoundary) {
            this.x = sprite.x + sprite.width - (this.width / 4 * 3);
          }
          if(sprite.y + sprite.height > this.bottomInnerBoundary) {
            this.y = sprite.y + sprite.height - (this.height / 4 * 3);
          }
          //If the camera reaches the edge of the map, stop it from moving
          if(this.x < 0) { this.x = 0; }
          if(this.y < 0) { this.y = 0; }
          if(this.x + this.width > worldWidth) {
            this.x = worldWidth - this.width;
          }
          if(this.y + this.height > worldHeight) {
            this.y = worldHeight - this.height;
          }
        },
        centerOver: function(sprite) {
          //Center the camera over a sprite
          this.x = (sprite.x + sprite.halfWidth) - (this.width/2);
          this.y = (sprite.y + sprite.halfHeight) - (this.height/2);
        }
      };
      return camera;
    };

    return Mojo["2d"]= _D;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

