(function(global,undefined) {

  "use strict";
  let MojoH5 = global.MojoH5;

  MojoH5.Anim = function(Mojo) {

    let _ = Mojo.u,
        is=Mojo.is, _animations = {};

    Mojo.animations = (sprite,animations) => {
      if(!_animations[sprite])
        _animations[sprite] = {};
      _.inject(_animations[sprite],animations);
    };

    Mojo.animation = (sprite,name) => {
      return _animations[sprite] && _animations[sprite][name];
    };

    Mojo.feature("animation", {
      added: function() {
        let p = this.entity.p;
        p.animation = null;
        p.animationFrame = 0;
        p.animationTime = 0;
        p.animationPriority = -1;
        Mojo.EventBus.sub("step",this.entity,"step",this);
      },
      step: function(dt) {
        let entity = this.entity,
            p = entity.p;
        if(p.animation) {
          let stepped=0,
              anim = Mojo.animation(p.sprite,p.animation),
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
                Mojo.EventBus.pub("animEnd",entity);
                Mojo.EventBus.pub("animEnd." + p.animation,entity);
                p.animation = null;
                p.animationPriority = -1;
                if(anim.trigger)
                  Mojo.EventBus.pub(anim.trigger,entity,anim.triggerData);
                if(anim.next)
                  this.enact(anim.next,anim.nextPriority);
                return;
              } else {
                Mojo.EventBus.pub("animLoop",entity);
                Mojo.EventBus.pub("animLoop." + p.animation, entity);
                p.animationFrame = p.animationFrame % anim.frames.length;
              }
            }
            Mojo.EventBus.pub("animFrame", entity);
          }
          p.sheet = anim.sheet || p.sheet;
          p.frame = anim.frames[p.animationFrame];
          if(_.has(anim, "flip")) { p.flip  = anim.flip; }
        }
      },
      enact: function(name,priority,resetFrame) {
        let entity = this.entity,
            p = entity.p;
        priority = priority || 0;
        if(name !== p.animation &&
           priority >= p.animationPriority) {
          if(resetFrame === undefined) {
            resetFrame = true;
          }
          p.animation = name;
          if(resetFrame) {
            p.animationChanged = true;
            p.animationTime = 0;
            p.animationFrame = 0;
          }
          p.animationPriority = priority;
          Mojo.EventBus.pub("anim", entity);
          Mojo.EventBus.pub("anim." + p.animation, entity);
        }
      }

    });

    Mojo.defType(["Repeater", Mojo.Sprite], {
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
            scale = this.layer.viewport ? this.layer.viewport.scale : 1,
            viewX = Math.floor(this.layer.viewport ? this.layer.viewport.x : 0),
            viewY = Math.floor(this.layer.viewport ? this.layer.viewport.y : 0),
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
        endX = Mojo.width / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatW;
        endY = Mojo.height / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatH;

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

    Mojo.defType("Tween",{
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
        //this.p = (entity instanceof Mojo.Layer) ? entity.viewport : entity.p;
        this.duration = duration || 1;
        this.time = 0;
        this.options = options || {};
        this.delay = this.options.delay || 0;
        this.easing = easing ||
                      this.options.easing || Mojo.Easing.Linear;
        this.startFrame = Mojo._loopFrame + 1;
        this.properties = properties;
        this.start = {};
        this.diff = {};
      },
      step: function(dt) {
        if(this.startFrame > Mojo._loopFrame) { return true; }
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
          this.p = (entity instanceof Mojo.Layer) ? entity.viewport : entity.p;
          for(let p in properties) {
            this.start[p] = this.p[p];
            if(!is.undef(this.start[p]))
              this.diff[p] = properties[p] - this.start[p];
          }
        }
        this.time += dt;

        let progress = Math.min(1,this.time / this.duration),
            location = this.easing(progress);

        for(let k in this.start) {
          if(!is.undef(this.p[k]))
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

    Mojo.feature('tween',{
      added: function() {
        this._tweens = [];
        Mojo.EventBus.sub("step",this.entity,"step",this);
      },
      animate: function(properties,duration,easing,options) {
        this._tweens.push(new Mojo.Tween(this.entity,properties,duration,easing,options));
      },
      chain: function(properties,duration,easing,options) {
        if(is.obj(easing)) {
          options = easing;
          easing = Mojo.Easing.Linear;
        }
        // Chain an animation to the end
        let tweenCnt = this._tweens.length;
        if(tweenCnt > 0) {
          let lastTween = this._tweens[tweenCnt - 1];
          options = options || {};
          options.delay = lastTween.duration - lastTween.time + lastTween.delay;
        }
        this.animate(properties,duration,easing,options);
      },
      stop: function() {
        this._tweens.length = 0;
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


    return Mojo;
  };




})(this);


