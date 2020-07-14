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
  let MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.Anim = function(Mojo) {

    let _ = Mojo.u,
      is=Mojo.is,
      EBus= Mojo.EventBus,
      /**
       * @private
       * @var {map}
       */
      _animations = _.jsMap();

    /**
     * @public
     * @function
     */
    Mojo.defAnimation = (name,info) => {
      let m= _.get(_animations,name);
      if(!m)
        _.assoc(_animations, name, m= {});
      _.inject(m, info);
    };

    /**
     * @public
     * @function
     */
    Mojo.animation = (name,selector) => {
      return _.get(_.get(_animations,name), selector);
    };

    /**
     * @public
     * @function
     */
    Mojo.defFeature("animation", {
      added: function() {
        this.animation=null;
        this.animationFrame=0;
        this.animationTime=0;
        this.animationPriority= -1;
        EBus.sub("step",this.entity,"step",this);
      },
      disposed: function() {
        EBus.unsub("step",this.entity,"step",this);
      },
      step: function(dt) {
        if(this.animation) {
          let p= this.entity.p,
              a= Mojo.animation(p.sprite, this.animation);
          this._step(p,a,dt);
        }
      },
      _step: function(p,anim,dt) {
        let stepped=0,
            flen=anim.frames.length,
            rate = anim.rate || p.rate;
        this.animationTime += dt;
        if(this.animationChanged) {
          this.animationChanged = false;
        } else if(this.animationTime > rate) {
          stepped = _.floor(this.animationTime/rate);
          this.animationTime -= stepped * rate;
          this.animationFrame += stepped;
        }
        if(stepped>0) {
          if(this.animationFrame >= flen) {
            if(anim.loop === false || anim.next) {
              this.animationFrame = flen-1;
              EBus.pub([["animEnd",this.entity]
                        ["animEnd."+this.animation,this.entity]]);
              this.animation = null;
              this.animationPriority = -1;
              if(anim.trigger)
                EBus.pub(anim.trigger,this.entity,anim.triggerData);
              if(anim.next)
                this.enact(anim.next,anim.nextPriority);
              return;
            }
            EBus.pub([["animLoop",this.entity]
                      ["animLoop."+this.animation, this.entity]]);
            this.animationFrame = this.animationFrame % flen;
          }
          EBus.pub("animFrame", this.entity);
        }
        if(anim.sheet)
          p.sheet = anim.sheet;
        p.frame = anim.frames[this.animationFrame];
        if(_.has(anim, "flip")) { p.flip  = anim.flip; }
      },
      enact: function(name,priority,resetFrame) {
        priority = priority || 0;
        if(name !== this.animation &&
           priority >= this.animationPriority) {
          if(resetFrame===undefined)
          resetFrame = true;
          this.animation = name;
          if(resetFrame) {
            this.animationChanged = true;
            this.animationTime = 0;
            this.animationFrame = 0;
          }
          this.animationPriority = priority;
          EBus.pub([["anim", this.entity]
                    ["anim."+this.animation, this.entity]]);
        }
        return this;
      }
    });

    /**
     * @public
     * @function
     */
    Mojo.defType(["Repeater", Mojo.Sprite], {
      /**
       * @constructs
       */
      init: function(props) {
        this._super(props, {speedX: 1,
                            speedY: 1,
                            repeatY: true,
                            repeatX: true,
                            type: Mojo.E_NONE,
                            renderAlways: true});
        this.p.repeatW = this.p.repeatW || this.p.w;
        this.p.repeatH = this.p.repeatH || this.p.h;
      },
      draw: function(ctx) {
        let p = this.p,
            asset = this.asset(),
            sheet = this.sheet(),
            scale=[1,1],
            curX, curY, startX, endX, endY,
            port = Mojo.getf(this.scene,"camera"),
            viewX = _.floor(port ? port.x : 0),
            viewY = _.floor(port ? port.y : 0),
            offsetX = _.floor(p.x + viewX * this.p.speedX),
            offsetY = _.floor(p.y + viewY * this.p.speedY);
        if(port) {
          scale[0] = port.scale[0];
          scale[1]=port.scale[1];
        }
        if(p.repeatX) {
          curX = -offsetX % p.repeatW;
          if(curX > 0)
            curX -= p.repeatW;
        } else {
          curX = p.x - viewX;
        }
        if(p.repeatY) {
          curY = -offsetY % p.repeatH;
          if(curY > 0)
            curY -= p.repeatH;
        } else {
          curY = p.y - viewY;
        }

        startX = curX;
        endX = Mojo.width / _.abs(scale[0]) / _.abs(p.scale[0]) + p.repeatW;
        endY = Mojo.height / _.abs(scale[1]) / _.abs(p.scale[1]) + p.repeatH;

        while(curY < endY) {
          curX = startX;
          while(curX < endX) {
            sheet ? sheet.draw(ctx,curX + viewX,curY + viewY,p.frame)
                  : ctx.drawImage(asset,curX + viewX,curY + viewY);
            curX += p.repeatW;
            if(!p.repeatX)
            break;
          }
          curY += p.repeatH;
          if(!p.repeatY)
          break;
        }
      }
    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo.defType("Tween",{
      /**
       * @constructs
       */
      init: function(entity,properties,duration,easing,options) {
        if(is.obj(easing)) {
          options = easing;
          easing = Mojo.Easing.Linear;
        }
        if(is.obj(duration)) {
          options = duration;
          duration = 1;
        }
        this.entity = entity;
        this.time = 0;
        this.start = {};
        this.diff = {};
        this.o= _.clone(options);
        this.duration = duration || 1;
        this.delay = this.o.delay || 0;
        this.properties = properties;
        this.startFrame = Mojo._loopFrame + 1;
        this.easing = easing ||
                      this.o.easing || Mojo.Easing.Linear;
      },
      step: function(dt) {
        if(this.startFrame > Mojo._loopFrame) { return true; }
        if(this.delay >= dt) { this.delay -= dt; return true; }
        if(this.delay > 0) {
          dt -= this.delay;
          this.delay = 0;
        }
        if(this.time === 0) {
          // first time running? Initialize the properties to chaining correctly.
          let v,cam= Mojo.getf(this.entity,"camera");
          this.p= cam ? cam : this.entity.p;
          _.keys(this.properties).forEach(k => {
            v=this.p[k];
            if(is.vec(v)) {
              _.assert(k==="scale","Ooops, only scale can be array");
              v=v.slice();
            }
            this.start[k] = v;
            if(v  !== undefined) {
              v= this.properties[k];
              if(k==="scale") {
                this.diff[k]=[v[0] - this.start[k][0],
                              v[1] - this.start[k][1]];
              } else {
                this.diff[k] = v  - this.start[k];
              }
            };
          });
        }
        this.time += dt;

        let progress = _.min(1, this.time/this.duration),
            v, location = this.easing(progress);

        _.keys(this.start).forEach(k => {
          if(this.p[k] !== undefined) {
            v=this.start[k];
            if(k==="scale") {
              this.p[k][0] = v[0] + this.diff[k][0] * location;
              this.p[k][1] = v[1] + this.diff[k][1] * location;
            }
            else
              this.p[k] = v + this.diff[k] * location;
          }
        });

        (progress >= 1) &&
          this.o.callback &&
            this.o.callback.apply(this.entity);

        return progress < 1;
      }
    }, Mojo);

    /**Code ripped directly from Tween.js
     * https://github.com/sole/tween.js/blob/master/src/Tween.js
     * @public
     * @function
     */
    Mojo.Easing = {
      Linear: (k) => { return k; },
      Quadratic: {
        In: (k) =>  { return k * k; },
        Out: (k) => {return k * ( 2 - k ); },
        InOut: (k) => {
          if ((k *= 2 ) < 1) { return 0.5 * k * k; }
          return -0.5 * (--k * (k - 2) - 1);
        }
      }
    };

    Mojo.defFeature("tween",{
      added: function() {
        this._tweens = [];
        EBus.sub("step",this.entity,"step",this);
      },
      disposed:function() {
        EBus.unsub("step",this.entity,"step",this);
      },
      animate: function(properties,duration,easing,options) {
        _.conj(this._tweens,
               new Mojo.Tween(this.entity,
                              properties,duration,easing,options));
        return this;
      },
      chain: function(properties,duration,easing,options) {
        if(is.obj(easing)) {
          options = easing;
          easing = Mojo.Easing.Linear;
        }
        // Chain an animation to the end
        let cnt = this._tweens.length;
        if(cnt>0) {
          let lastTween = this._tweens[cnt-1];
          options = options || {};
          options.delay = lastTween.duration - lastTween.time + lastTween.delay;
        }
        return this.animate(properties,duration,easing,options);
      },
      stop: function() {
        this._tweens.length = 0;
        return this;
      },
      step: function(dt) {
        for(let i=0; i < this._tweens.length; ++i)
          if(!this._tweens[i].step(dt)) {
            this._tweens.splice(i,1);
            --i;
          }
        return this;
      }
    });


    return Mojo;
  };




})(this);


