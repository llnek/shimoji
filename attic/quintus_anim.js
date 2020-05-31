(function(global) {
  "use strict";
  let Mojo = global.Mojo, _ = Mojo._;
  Mojo.Anim = function(Mo) {
    Mo._animations = {};
    Mo.animations = (sprite,animations) => {
      if(!Mo._animations[sprite])
        Mo._animations[sprite] = {};
      _.inject(Mo._animations[sprite],animations);
    };

    Mo.animation = (sprite,name) => {
      return Mo._animations[sprite] && Mo._animations[sprite][name];
    };

    Mo.component("animation", {
      added: function() {
        let p = this.entity.p;
        p.animation = null;
        p.animationFrame = 0;
        p.animationTime = 0;
        p.animationPriority = -1;
        this.entity.on("step","step",this);
      },
      ____entity: {
        play: function(name,priority,resetFrame) {
          this.animation.play(name,priority,resetFrame);
        }
      },
      step: function(dt) {
        let entity = this.entity,
            p = entity.p;
        if(p.animation) {
          let stepped=0,
              anim = Mo.animation(p.sprite,p.animation),
              rate = anim.rate || p.rate;
          p.animationTime += dt;
          if(p.animationChanged) {
            p.animationChanged = false;
          } else if(p.animationTime > rate) {
            stepped = Math.floor(p.animationTime / rate);
            p.animationTime -= stepped * rate;
            p.animationFrame += stepped;
          }
          if(stepped > 0) {
            if(p.animationFrame >= anim.frames.length) {
              if(anim.loop === false || anim.next) {
                p.animationFrame = anim.frames.length - 1;
                entity.trigger('animEnd');
                entity.trigger('animEnd.' + p.animation);
                p.animation = null;
                p.animationPriority = -1;
                if(anim.trigger)
                  entity.trigger(anim.trigger,anim.triggerData);
                if(anim.next)
                  this.play(anim.next,anim.nextPriority);
                return;
              } else {
                entity.trigger('animLoop');
                entity.trigger('animLoop.' + p.animation);
                p.animationFrame = p.animationFrame % anim.frames.length;
              }
            }
            entity.trigger("animFrame");
          }
          p.sheet = anim.sheet || p.sheet;
          p.frame = anim.frames[p.animationFrame];
          if(_.has(anim, "flip")) { p.flip  = anim.flip; }
        }
      },
      play: function(name,priority,resetFrame) {
        let entity = this.entity,
            p = entity.p;
        priority = priority || 0;
        if(name !== p.animation &&
           priority >= p.animationPriority) {
          if(resetFrame === void 0) {
            resetFrame = true;
          }
          p.animation = name;
          if(resetFrame) {
            p.animationChanged = true;
            p.animationTime = 0;
            p.animationFrame = 0;
          }
          p.animationPriority = priority;
          entity.trigger('anim');
          entity.trigger('anim.' + p.animation);
        }
      }

    });

    Mo.defType(["Repeater", Mo.Sprite], {
      init: function(props) {
        this._super(_.inject(props,{
          speedX: 1,
          speedY: 1,
          type: 0,
          repeatY: true,
          repeatX: true,
          renderAlways: true
        }));
        this.p.repeatW = this.p.repeatW || this.p.w;
        this.p.repeatH = this.p.repeatH || this.p.h;
      },
      draw: function(ctx) {
        let p = this.p,
            asset = this.asset(),
            sheet = this.sheet(),
            scale = this.stage.viewport ? this.stage.viewport.scale : 1,
            viewX = Math.floor(this.stage.viewport ? this.stage.viewport.x : 0),
            viewY = Math.floor(this.stage.viewport ? this.stage.viewport.y : 0),
            offsetX = Math.floor(p.x + viewX * this.p.speedX),
            offsetY = Math.floor(p.y + viewY * this.p.speedY),
            curX, curY, startX, endX, endY;
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
        endX = Mo.width / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatW;
        endY = Mo.height / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatH;

        while(curY < endY) {
          curX = startX;
          while(curX < endX) {
            if(!sheet)
              ctx.drawImage(asset,curX + viewX,curY + viewY);
            else
              sheet.draw(ctx,curX + viewX,curY + viewY,p.frame);
            curX += p.repeatW;
            if(!p.repeatX)
            break;
          }
          curY += p.repeatH;
          if(!p.repeatY)
          break;
        }
      }
    });

    Mo.defType("Tween",{
      init: function(entity,properties,duration,easing,options) {
        if(_.isObject(easing)) {
          options = easing;
          easing = Mo.Easing.Linear;
        }
        if(_.isObject(duration)) {
          options = duration;
          duration = 1;
        }
        this.entity = entity;
        //this.p = (entity instanceof Mo.Stage) ? entity.viewport : entity.p;
        this.duration = duration || 1;
        this.time = 0;
        this.options = options || {};
        this.delay = this.options.delay || 0;
        this.easing = easing ||
                      this.options.easing || Mo.Easing.Linear;
        this.startFrame = Mo._loopFrame + 1;
        this.properties = properties;
        this.start = {};
        this.diff = {};
      },
      step: function(dt) {
        if(this.startFrame > Mo._loopFrame) { return true; }
        if(this.delay >= dt) {
          this.delay -= dt;
          return true;
        }
        if(this.delay > 0) {
          dt -= this.delay;
          this.delay = 0;
        }
        if(this.time === 0) {
          // first time running? Initialize the properties to chaining correctly.
          let entity = this.entity,
              properties = this.properties;
          this.p = (entity instanceof Mo.Stage) ? entity.viewport : entity.p;
          for(let p in properties) {
            this.start[p] = this.p[p];
            if(!_.isUndef(this.start[p]))
              this.diff[p] = properties[p] - this.start[p];
          }
        }
        this.time += dt;

        let progress = Math.min(1,this.time / this.duration),
            location = this.easing(progress);

        for(let k in this.start) {
          if(!_.isUndef(this.p[k]))
            this.p[k] = this.start[k] + this.diff[k] * location;
        }

        (progress >= 1) &&
          this.options.callback &&
            this.options.callback.apply(this.entity);

        return progress < 1;
      }
    });

    // Code ripped directly from Tween.js
    // https://github.com/sole/tween.js/blob/master/src/Tween.js
    Mo.Easing = {
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

    Mo.component('tween',{
      added: function() {
        this._tweens = [];
        this.entity.on("step","step",this);
      },
      ____entity: {
        animate: function(properties,duration,easing,options) {
          this.tween._tweens.push(new Mo.Tween(this,properties,duration,easing,options));
          return this;
        },
        chain: function(properties,duration,easing,options) {
          if(_.isObject(easing)) {
            options = easing;
            easing = Mo.Easing.Linear;
          }
          // Chain an animation to the end
          let tweenCnt = this.tween._tweens.length;
          if(tweenCnt > 0) {
            let lastTween = this.tween._tweens[tweenCnt - 1];
            options = options || {};
            options.delay = lastTween.duration - lastTween.time + lastTween.delay;
          }

          this.animate(properties,duration,easing,options);
          return this;
        },
        stop: function() {
          this.tween._tweens.length = 0;
          return this;
        }
      },
      step: function(dt) {
        for(let i=0; i < this._tweens.length; ++i) {
          if(!this._tweens[i].step(dt)) {
            this._tweens.splice(i,1);
            --i;
          }
        }
      }
    });


  };




})(this);


