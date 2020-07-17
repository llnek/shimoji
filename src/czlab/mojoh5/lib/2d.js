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

(function(global,undefined) {
  "use strict";
  let MojoH5 = global.MojoH5,
      document = global.document;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @public
   * @function
   */
  MojoH5["2d"] = function(Mojo) {

    let _ = Mojo.u,
        is = Mojo.is,
        EBus= Mojo.EventBus;

    Mojo.defFeature("camera",{
      _sx: function() { return Mojo.width_div2/this.scale[0]; },
      _sy: function() { return Mojo.height_div2/this.scale[1]; },
      added: function() {
        EBus.sub([["prerender",this.entity,"prerender",this],
                  ["render",this.entity,"postrender",this]]);
        this.scale = [1,1];
        this.x = 0;
        this.y = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.centerX = Mojo.width_div2;
        this.centerY = Mojo.height_div2;
      },
      disposed: function() {
        EBus.unsub([["prerender",this.entity,"prerender",this],
                    ["render",this.entity,"postrender",this]]);
      },
      follow: function(sprite,directions,boundingBox) {
        EBus.unsub("poststep",this.entity,"_follow", this);
        this.directions = directions || {x: true, y: true};
        this.following = sprite;
        this.boundingBox = boundingBox;
        if(boundingBox===undefined &&
           _.inst(Mojo.Scene,this.entity) &&
          this.entity.overlays.length > 0) {
          this.boundingBox = _.some(this.entity.overlays, (obj) => {
            if(obj.p && obj.p.boundingBox)
              return {minX: 0, minY: 0, maxX: obj.p.w, maxY: obj.p.h };
          });
        }
        EBus.sub("poststep",this.entity,"_follow",this);
        return this._follow(true);
      },
      unfollow: function() {
        EBus.unsub("poststep",this.entity,"_follow",this);
        return this;
      },
      _follow: function(first) {
        let fx = is.fun(this.directions.x)
                      ? this.directions.x(this.following) : this.directions.x;
        let fy = is.fun(this.directions.y)
                      ? this.directions.y(this.following) : this.directions.y;
        return this[first === true ? "centerOn" : "softCenterOn"](
                      fx ? this.following.p.x - this.offsetX : undefined,
                      fy ? this.following.p.y - this.offsetY : undefined);
      },
      offset: function(x,y) {
        this.offsetX = x;
        this.offsetY = y;
        return this;
      },
      softCenterOn: function(x,y) {
        if(x !== undefined) {
          let dx = (x - this._sx() - this.x)/3;
          if(this.boundingBox) {
            let mx= this.boundingBox.minX,
                wx= this.boundingBox.maxX - Mojo.width;
            if(this.x + dx < mx)
              this.x = mx/this.scale[0];
            else
            if(this.x + dx > wx/this.scale[0])
              this.x = _.max(wx, mx)/this.scale[0];
            else
              this.x += dx;
          } else {
            this.x += dx;
          }
        }
        if(y !== undefined) {
          let dy = (y - this._sy() - this.y)/3;
          if(this.boundingBox) {
            let my= this.boundingBox.minY,
                hy= this.boundingBox.maxY - Mojo.height;
            if(this.y + dy < my)
              this.y = my/this.scale[1];
            else
            if(this.y + dy > hy/this.scale[1])
              this.y = _.max(hy, my)/this.scale[1];
            else
              this.y += dy;
          } else {
            this.y += dy;
          }
        }
        return this;
      },
      centerOn: function(x,y) {
        if(x !== undefined)
          this.x = x - this._sx();
        if(y !== undefined)
          this.y = y - this._sy();
        return this;
      },
      moveTo: function(x,y) {
        if(x !== undefined) this.x = x;
        if(y !== undefined) this.y = y;
        return this;
      },
      prerender: function() {
        this.centerX = this.x + this._sx();
        this.centerY = this.y + this._sy();
        Mojo.ctx.save();
        Mojo.ctx.translate(_.floor(Mojo.width_div2),_.floor(Mojo.height_div2));
        Mojo.ctx.scale(this.scale[0],this.scale[1]);
        Mojo.ctx.translate(-_.floor(this.centerX), -_.floor(this.centerY));
        return this;
      },
      postrender: function() {
        Mojo.ctx.restore();
        return this;
      }
    });

    Mojo.gravity.x=0;
    Mojo.gravity.y = 9.8*100;
    /**
     * @object
     */
    Mojo.defFeature("2d",{
      added: function() {
        this.entity.p.gravity=1;
        EBus.sub([["step",this.entity,"step",this],
                  ["hit",this.entity,'collision',this]]);
      },
      disposed: function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["hit",this.entity,'collision',this]]);
      },
      collision: function(col,last) {
        let p = this.entity.p;
        if(col.obj.p && col.obj.p.sensor) {
          EBus.pub("sensor", col.obj, this.entity);
        } else {
        let magnitude=0,
            impactX = _.abs(p.vx),
            impactY = _.abs(p.vy);
          col.impact = 0;
          p.x -= col.separate[0];
          p.y -= col.separate[1];
          // Top collision
          if(col.normalY < -0.3) {
            if(!p.skipCollide && p.vy > 0) { p.vy = 0; }
            col.impact = impactY;
            EBus.pub([["bump.bottom", this.entity,col],
                      ["bump", this.entity,col]]);
          }
          if(col.normalY > 0.3) {
            if(!p.skipCollide && p.vy < 0) { p.vy = 0; }
            col.impact = impactY;
            EBus.pub([["bump.top",this.entity,col],
                      ["bump",this.entity,col]]);
          }
          if(col.normalX < -0.3) {
            if(!p.skipCollide && p.vx > 0) { p.vx = 0;  }
            col.impact = impactX;
            EBus.pub([["bump.right",this.entity,col],
                      ["bump",this.entity,col]]);
          }
          if(col.normalX > 0.3) {
            if(!p.skipCollide && p.vx < 0) { p.vx = 0; }
            col.impact = impactX;
            EBus.pub([["bump.left",this.entity,col],
                      ["bump",this.entity,col]]);
          }
        }
      },
      step: function(dt) {
        let dtStep = dt,
            p = this.entity.p;
        // TODO: check the entity's magnitude of vx and vy,
        // reduce the max dtStep if necessary to prevent
        // skipping through objects.
        while(dtStep > 0) {
          dt = _.min(1/30,dtStep);
          // Updated based on the velocity and acceleration
          p.vx += p.ax * dt + (p.gravityX === undefined ? Mojo.gravity.x : p.gravityX) * dt * p.gravity;
          p.vy += p.ay * dt + (p.gravityY === undefined ? Mojo.gravity.y : p.gravityY) * dt * p.gravity;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          this.entity.scene.collide(this.entity);
          dtStep -= dt;
        }
      }
    });

    Mojo.defFeature("aiBounce", {
      added: function() {
        this.defaultDirection = Mojo.D_RIGHT;
        EBus.sub([["bump.right",this.entity,"goLeft",this],
                  ["bump.left",this.entity,"goRight",this]]);
      },
      disposed:function() {
        EBus.unsub([["bump.right",this.entity,"goLeft",this],
                    ["bump.left",this.entity,"goRight",this]]);
      },
      goLeft: function(col) {
        this.entity.p.vx = -col.impact;
        if(this.defaultDirection === Mojo.D_RIGHT)
          this.entity.p.flip = "x";
        else
          this.entity.p.flip = false;
      },
      goRight: function(col) {
        this.entity.p.vx = col.impact;
        if(this.defaultDirection === Mojo.D_LEFT)
          this.entity.p.flip = "x";
        else
          this.entity.p.flip = false;
      }
    });

    Mojo.defFeature("platformer", {
      added: function() {
        this.jumpSpeed= -300;
        this.jumping=false;
        this.landed = 0;
        EBus.sub([["step",this.entity,"step",this],
                  ["bump.bottom",this.entity,"onLanded",this]]);
      },
      disposed:function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["bump.bottom",this.entity,"onLanded",this]]);
      },
      onLanded: function(col) {
        this.landed= 1/5;
      },
      step: function(dt) {
        let p = this.entity.p;
        if(p.ignoreControls===undefined || !p.ignoreControls) {
          let col= null;
          // Follow along the current slope, if possible.
          if(p.collisions !== undefined &&
             p.collisions.length > 0 &&
             (_.get(Mojo.inputs,"left") ||
              _.get(Mojo.inputs,"right") || this.landed > 0)) {
            if(p.collisions.length === 1) {
              col= p.collisions[0];
            } else {
              // If there's more than one possible slope, follow slope with negative Y normal
              col= null;
              for(let i = 0; i < p.collisions.length; ++i) {
                if(p.collisions[i].normalY < 0)
                col= p.collisions[i];
              }
            }
            // Don't climb up walls.
            if(col !== null &&
               col.normalY > -0.3 &&
               col.normalY < 0.3) {
              col= null;
            }
          }

          if(_.get(Mojo.inputs,"left")) {
            p.direction = Mojo.D_LEFT;//"left";
            if(col && this.landed > 0) {
              p.vx = p.speed * col.normalY;
              p.vy = -p.speed * col.normalX;
            } else {
              p.vx = -p.speed;
            }
          } else if(_.get(Mojo.inputs,"right")) {
            p.direction = Mojo.D_RIGHT;//"right";
            if(col && this.landed > 0) {
              p.vx = -p.speed * col.normalY;
              p.vy = p.speed * col.normalX;
            } else {
              p.vx = p.speed;
            }
          } else {
            p.vx = 0;
            if(col && this.landed > 0)
            p.vy = 0;
          }

          if(this.landed > 0 &&
             (_.get(Mojo.inputs,"up") ||
              _.get(Mojo.inputs,"action")) && !this.jumping) {
            p.vy = this.jumpSpeed;
            this.landed = -dt;
            this.jumping = true;
          } else if(_.get(Mojo.inputs,"up") ||
                    _.get(Mojo.inputs,"action")) {
            EBus.pub("jump", this.entity,this.entity);
            this.jumping = true;
          }

          if(this.jumping && !(_.get(Mojo.inputs,"up") ||
                               _.get(Mojo.inputs,"action"))) {
            this.jumping = false;
            EBus.pub("jumped", this.entity,this.entity);
            if(p.vy < this.jumpSpeed/3) {
              p.vy = this.jumpSpeed/3;
            }
          }
        }
        this.landed -= dt;
      }
    });

    Mojo.defFeature("stepper", {
      added: function() {
        let p = this.entity.p;
        if(!this.stepDistance) this.stepDistance = 32;
        if(!this.stepDelay) this.stepDelay = 0.2;
        this.stepWait = 0;
        EBus.sub([["step",this.entity,"step",this],
                  ["hit", this.entity,"collision",this]]);
      },
      disposed:function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["hit", this.entity,"collision",this]]);
      },
      collision: function(col) {
        let p = this.entity.p;
        if(this.stepping) {
          this.stepping = false;
          p.x = p.origX;
          p.y = p.origY;
        }
      },
      step: function(dt) {
        let p = this.entity.p,
            moved = false;
        this.stepWait -= dt;

        if(this.stepping) {
          p.x += p.diffX * dt / this.stepDelay;
          p.y += p.diffY * dt / this.stepDelay;
        }

        if(this.stepWait > 0) { return; }

        if(this.stepping) {
          p.x = p.destX;
          p.y = p.destY;
        }

        this.stepping = false;
        p.diffX = 0;
        p.diffY = 0;

        if(_.get(Mojo.inputs,"left")) {
          p.diffX = -this.stepDistance;
        } else if(_.get(Mojo.inputs,"right")) {
          p.diffX = this.stepDistance;
        }

        if(_.get(Mojo.inputs,"up")) {
          p.diffY = -this.stepDistance;
        } else if(_.get(Mojo.inputs,"down")) {
          p.diffY = this.stepDistance;
        }

        if(p.diffY || p.diffX ) {
          this.stepping = true;
          p.origX = p.x;
          p.origY = p.y;
          p.destX = p.x + p.diffX;
          p.destY = p.y + p.diffY;
          this.stepWait = this.stepDelay;
        }
      }
    });

    /**
     * @public
     * @function
     */
    Mojo.overlap = (o1,o2) => {
      let c1 = o1.c || o1.p || o1;
      let c2 = o2.c || o2.p || o2;

      let o1x = c1.x - (c1.cx || 0),
          o1y = c1.y - (c1.cy || 0);
      let o2x = c2.x - (c2.cx || 0),
          o2y = c2.y - (c2.cy || 0);

      return !((o1y+c1.h<o2y) || (o1y>o2y+c2.h) ||
               (o1x+c1.w<o2x) || (o1x>o2x+c2.w));
    };

    /**
     * @public
     * @function
     */
    Mojo.collision = (function() {
      let normalX,
          normalY,
          offset = Mojo.v2(),
          result1 = { separate: [] },
          result2 = { separate: [] };
      let calculateNormal= (points,idx) => {
        let pt1 = points[idx],
            pt2 = points[idx+1] || points[0];
        normalX = -(pt2[1] - pt1[1]);
        normalY = pt2[0] - pt1[0];
        let dist = _.sqrt(normalX*normalX + normalY*normalY);
        if(dist > 0) {
          normalX /= dist;
          normalY /= dist;
        }
      };
      let dotProductAgainstNormal = (point) => {
        return (normalX * point[0]) + (normalY * point[1]);
      };
      let collide = (o1,o2,flip) => {
        let min1,max1,
            min2,max2,
            d1, d2,
            offsetLength,
            tmp, i, j,
            minDist, minDistAbs,
            p1, p2,
            collided = false,
            shortestDist = _.POS_INF,
            result = flip ? result2 : result1;
        offset[0] = 0; //o1.x + o1.cx - o2.x - o2.cx;
        offset[1] = 0; //o1.y + o1.cy - o2.y - o2.cy;
        // If we have a position matrix, just use those points,
        if(o1.c) {
          p1 = o1.c.points;
        } else {
          p1 = o1.p.points;
          offset[0] += o1.p.x;
          offset[1] += o1.p.y;
        }
        if(o2.c) {
          p2 = o2.c.points;
        } else {
          p2 = o2.p.points;
          offset[0] += -o2.p.x;
          offset[1] += -o2.p.y;
        }

        o1 = o1.p;
        o2 = o2.p;

        for(let i = 0;i<p1.length;++i) {
          calculateNormal(p1,i);
          min1 = dotProductAgainstNormal(p1[0]);
          max1 = min1;
          for(let j = 1; j<p1.length;++j) {
            tmp = dotProductAgainstNormal(p1[j]);
            if(tmp < min1) min1 = tmp;
            if(tmp > max1) max1 = tmp;
          }
          min2 = dotProductAgainstNormal(p2[0]);
          max2 = min2;
          for(let j = 1;j<p2.length;++j) {
            tmp = dotProductAgainstNormal(p2[j]);
            if(tmp < min2) min2 = tmp;
            if(tmp > max2) max2 = tmp;
          }
          offsetLength = dotProductAgainstNormal(offset);
          min1 += offsetLength;
          max1 += offsetLength;
          d1 = min1 - max2;
          d2 = min2 - max1;
          if(d1 > 0 || d2 > 0) { return null; }
          minDist = (max2 - min1) * -1;
          if(flip) { minDist *= -1; }
          minDistAbs = _.abs(minDist);
          if(minDistAbs < shortestDist) {
            result.distance = minDist;
            result.magnitude = minDistAbs;
            result.normalX = normalX;
            result.normalY = normalY;
            if(result.distance > 0) {
              result.distance *= -1;
              result.normalX *= -1;
              result.normalY *= -1;
            }
            collided = true;
            shortestDist = minDistAbs;
          }
        }
        return collided ? result : null;
      };
      //satCollision
      return (o1,o2) => {
        let result1, result2, result;
        if(!o1.p.points)
          Mojo.genPts(o1);
        if(!o2.p.points)
          Mojo.genPts(o2);
        result1 = collide(o1,o2);
        if(!result1) { return false; }
        result2 = collide(o2,o1,true);
        if(!result2) { return false; }
        result = (result2.magnitude < result1.magnitude) ? result2 : result1;
        if(result.magnitude === 0) { return false; }
        result.separate[0] = result.distance * result.normalX;
        result.separate[1] = result.distance * result.normalY;
        return result;
      };
    })();

    return Mojo;
  };




})(this);


