(function(global,undefined) {

  "use strict";
  let MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded.";

  /**
   * @public
   * @function
   */
  MojoH5.Anim = function(Mojo) {

    let EBus= Mojo.EventBus,
      _ = Mojo.u,
      is=Mojo.is,
      /**
       * @private
       * @var {map}
       */
      _animations = _.jsMap();

    /**
     * @public
     * @function
     */
    Mojo.animations = (name,info) => {
      if(!_.get(_animations,name))
        _.assoc(_animations,name, {});
      _.inject(_.get(_animations,name),info);
    };

    /**
     * @public
     * @function
     */
    Mojo.animation = (name,selector) => {
      let a= _.get(_animations,name);
      return a && a[selector];
    };

    //register a feature
    Mojo.feature("animation", {
      added: function() {
        let p = this.entity.p;
        p.animation=null;
        p.animationFrame=0;
        p.animationTime=0;
        p.animationPriority= -1;
        EBus.sub("step",this.entity,"step",this);
      },
      disposed: function() {
        //you are dead, get rid of stuff you tagged onto the entity
        let p = this.entity.p;
        _.dissoc(p,"animation");
        _.dissoc(p,"animationFrame");
        _.dissoc(p,"animationTime");
        _.dissoc(p,"animationPriority");
        EBus.unsub("step",this.entity,"step",this);
      },
      step: function(dt) {
        let p = this.entity.p;
        if(!p.animation)
        return;
        let anim = Mojo.animation(p.sprite,p.animation),
            rate = anim.rate || p.rate,
            stepped=0;

        p.animationTime += dt;
        if(p.animationChanged) {
          p.animationChanged = false;
        } else if(p.animationTime > rate) {
          stepped = _.floor(p.animationTime/rate);
          p.animationTime -= stepped * rate;
          p.animationFrame += stepped;
        }
        if(stepped>0) {
          if(p.animationFrame >= anim.frames.length) {
            if(anim.loop === false || anim.next) {
              p.animationFrame = anim.frames.length - 1;
              EBus.pub("animEnd",this.entity);
              EBus.pub("animEnd." + p.animation,this.entity);
              p.animation = null;
              p.animationPriority = -1;
              if(anim.trigger)
                EBus.pub(anim.trigger,this.entity,anim.triggerData);
              if(anim.next)
                this.enact(anim.next,anim.nextPriority);
              return;
            }
            EBus.pub("animLoop",this.entity);
            EBus.pub("animLoop." + p.animation, this.entity);
            p.animationFrame = p.animationFrame % anim.frames.length;
          }
          EBus.pub("animFrame", this.entity);
        }
        if(anim.sheet)
          p.sheet = anim.sheet;
        p.frame = anim.frames[p.animationFrame];
        if(_.has(anim, "flip")) { p.flip  = anim.flip; }
      },
      enact: function(name,priority,resetFrame) {
        let p = this.entity.p;

        priority = priority || 0;
        if(name !== p.animation &&
           priority >= p.animationPriority) {

          if(resetFrame === undefined)
          resetFrame = true;

          p.animation = name;
          if(resetFrame) {
            p.animationChanged = true;
            p.animationTime = 0;
            p.animationFrame = 0;
          }
          p.animationPriority = priority;
          EBus.pub("anim", this.entity);
          EBus.pub("anim." + p.animation, this.entity);
        }
      }
    });

    /**
     * @public
     * @function
     */
    Mojo.defType(["Repeater", Mojo.Sprite], {
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
            curX, curY, startX, endX, endY,
            asset = this.asset(),
            sheet = this.sheet(),
            port = this.scene.camera,
            scale = port ? port.scale : 1,
            viewX = _.floor(port ? port.x : 0),
            viewY = _.floor(port ? port.y : 0),
            offsetX = _.floor(p.x + viewX * this.p.speedX),
            offsetY = _.floor(p.y + viewY * this.p.speedY);
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
        endX = Mojo.width / _.abs(scale) / _.abs(p.scale || 1) + p.repeatW;
        endY = Mojo.height / _.abs(scale) / _.abs(p.scale || 1) + p.repeatH;

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
        this.o= _.clone(options);
        this.duration = duration || 1;
        this.delay = this.o.delay || 0;
        this.startFrame = Mojo._loopFrame + 1;
        this.properties = properties;
        this.start = {};
        this.diff = {};
        this.easing = easing ||
                      this.o.easing || Mojo.Easing.Linear;
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
          let properties = this.properties;

          if(this.entity.camera)
            this.p= this.entity.camera;
          else
            this.p = this.entity.p;

          for(let k in properties)
            if(_.has(properties,k)) {
              this.start[k] = this.p[k];
              if(this.start[k] !== undefined)
                this.diff[k] = properties[k] - this.start[k];
            }
        }
        this.time += dt;

        let progress = _.min(1, this.time/this.duration),
            location = this.easing(progress);

        for(let k in this.start)
          if(_.has(this.start,k))
            if(this.p[k] !== undefined)
              this.p[k] = this.start[k] + this.diff[k] * location;

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

    //register a feature
    Mojo.feature("tween",{
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
        this.animate(properties,duration,easing,options);
      },
      stop: function() {
        this._tweens.length = 0;
      },
      step: function(dt) {
        for(let i=0; i < this._tweens.length; ++i)
          if(!this._tweens[i].step(dt)) {
            this._tweens.splice(i,1);
            --i;
          }
      }
    });


    return Mojo;
  };




})(this);


