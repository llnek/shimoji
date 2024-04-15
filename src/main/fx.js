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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  function _module(Mojo, TweensQueue, DustBin){

    const
      int=Math.floor,
      P5=Math.PI*5,
      PI_2= Math.PI/2,
      TWO_PI= Math.PI*2;
    const
      { v2:_V, math:_M, ute:_, is }=Mojo;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/FX
     */

    ////////////////////////////////////////////////////////////////////////////
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function StarWarp(C, options){
      options= options || {};
      let {Sprites:_S}=Mojo;
      let
        STAR_SIZE= 0.05,
        STAR_RANGE = 6,
        SPEED = 0.025,
        CYCLE=5000,
        DEPTH=2000,
        FOV = 20,
        RADIUS=50,
        camZ = 0,
        speed = 0,
        warp= 0,
        mark=_.now(),
        color = options.color ?? "yellow",
        items= options.items ?? 1000,
        img = Mojo.resource("boot/star.png");
      const
        stars = _.fill(items, i=>{
          i= _S.sprite(img);
          i.g.d3=[0,0,0];
          if(_.rand()<0.3)
            i.tint= _S.color(color);
          _S.anchorXY(i, 0.5,0.69);
          C.addChild(i);
          return cfgStar(i, _.rand()*DEPTH);
        });
      function cfgStar(s, zpos){
        let
          twist = _.rand() * TWO_PI,
          dist= _.rand() * RADIUS + 1;
        //calc star positions with radial random
        //coordinate so no star hits the camera.
        s.g.d3[0] = Math.cos(twist) * dist;
        s.g.d3[1] = Math.sin(twist) * dist;
        s.g.d3[2]= !isNaN(zpos)?zpos
                               :camZ + DEPTH*(1+_.rand()*0.5);
        //_.log(`star pos= ${s.g.d3}`);
        return s;
      }
      return{
        dispose(){
          stars.forEach(o=> _S.remove(o));
        },
        update(dt){
          let
            w2=Mojo.width/2,
            now,z, h2=Mojo.height/2;
          speed += (warp- speed) / 20;
          camZ += dt * 10 * (speed + SPEED);
          //_.log(`camz=${camZ}, speed=== ${speed}`);
          stars.forEach((o,i)=>{
            if(o.g.d3[2] < camZ) cfgStar(o);
            // project to fake 3D
            i= Mojo.width*FOV/z;
            z = o.g.d3[2] - camZ;
            o.x = o.g.d3[0] * i + w2;
            o.y = o.g.d3[1] * i + h2;
            //calculate star scale & rotation.
            let
              dx= o.x - w2,
              dy= o.y - h2,
              d= Math.sqrt(dx* dx+ dy* dy),
              ds= Math.max(0, 1 - z/DEPTH);
            o.rotation = Math.atan2(dy, dx) + PI_2;
            _S.scaleXY(o, ds * STAR_SIZE,
                          // Star is looking towards center so that y axis is towards center.
                          // Scale the star depending on how fast we are moving,
                          // what the stretchfactor is and depending on how far away it is from the center.
                          ds * (STAR_SIZE + speed * STAR_RANGE * d / Mojo.width));
          });
          now=_.now();
          if(now-mark>CYCLE){
            mark=now;
            warp= warp> 0 ? 0 : 1;
          }
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function Tween(sprite,easing,duration=60,loop=false,ext={}){
      return _.inject({
        duration,
        sprite,
        easing,
        loop,
        cur:0,
        on:0,
        dead:0,
        onFrame(end,alpha){},
        _run(){
          this.cur=0;
          this.on=1;
          this.dead=0;
          TweensQueue.push(this);
        },
        onTick(){
          if(this.on){
            if(this.cur<this.duration){
              this.onFrame(false,
                           this.easing(this.cur/this.duration));
              this.cur += 1;
            }else{
              this.onFrame(true);
              if(this.loop){
                if(is.num(this.loop)){
                  --this.loop
                }
                this.onLoopReset()
                this.cur=0;
              }else{
                this.on=0;
                this.dispose();
                this.onComplete && _.delay(0,()=> this.onComplete());
              }
            }
          }
        },
        dispose(){
          this.dead=1;
          Mojo.emit(["tween.disposed"],this);
        }
      },ext)
    }

    ////////////////////////////////////////////////////////////////////////////
    /** scale */
    ////////////////////////////////////////////////////////////////////////////
    function TweenScale(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:UNDEF;
          this._y=is.num(ey)?[sy,ey]:UNDEF;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x)
            _.swap(this._x,0,1);
          if(this._y)
            _.swap(this._y,0,1);
        },
        onFrame(end,dt){
          if(this._x)
            this.sprite.scale.x= end ? this._x[1]
                                     : _M.lerp(this._x[0], this._x[1], dt);
          if(this._y)
            this.sprite.scale.y= end ? this._y[1]
                                     : _M.lerp(this._y[0], this._y[1], dt);
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** rotation */
    ////////////////////////////////////////////////////////////////////////////
    function TweenAngle(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          _.swap(this._a,0,1)
        },
        onFrame(end,alpha){
          this.sprite.rotation= end ? this._a[1]
                                    : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** alpha */
    ////////////////////////////////////////////////////////////////////////////
    function TweenAlpha(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          _.swap(this._a,0,1)
        },
        onFrame(end,alpha){
          this.sprite.alpha= end ? this._a[1]
                                 : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** position */
    ////////////////////////////////////////////////////////////////////////////
    function TweenXY(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:UNDEF;
          this._y=is.num(ey)?[sy,ey]:UNDEF;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x)
            _.swap(this._x,0,1);
          if(this._y)
            _.swap(this._y,0,1);
        },
        onFrame(end,dt){
          if(this._x)
            this.sprite.x= end ? this._x[1]
                               : _M.lerp(this._x[0], this._x[1], dt);
          if(this._y)
            this.sprite.y= end ? this._y[1]
                               : _M.lerp(this._y[0], this._y[1], dt);
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** group */
    ////////////////////////////////////////////////////////////////////////////
    function BatchTweens(...ts){
      const cs=ts.slice(0);
      const tObj={
        onTweenEnd(t){
          for(let c,i=0;i<cs.length;++i){
            c=cs[i];
            if(c===t){
              cs.splice(i,1);
              break;
            }
          }
          if(cs.length==0){
            this.dispose();
            this.onComplete && _.delay(0,()=>this.onComplete());
          }
        },
        dispose(){
          Mojo.off(["tween.disposed"],"onTweenEnd",tObj);
          cs.length=0;
        }
      };
      Mojo.on(["tween.disposed"],"onTweenEnd",tObj);
      return tObj;
    }

    ////////////////////////////////////////////////////////////////////////////
    /** seq */
    ////////////////////////////////////////////////////////////////////////////
    function SeqTweens(...ts){
      let c,cs=[];
      ts.forEach(o=>{
        cs.push(o);
        _.disj(TweensQueue,o);
      });
      const t={
        onDone(){
          this.dispose();
          this.onComplete &&
            _.delay(0,()=>this.onComplete());
        },
        dispose(){
          cs.length=0;
        }
      };
      function iter(o){
        if(o){
          TweensQueue.push(o);
          o.onComplete=()=> iter(cs.shift());
        }else{
          t.onDone();
        }
      }
      iter(cs.shift());
      return t;
    }

    ////////////////////////////////////////////////////////////////////////////
    /**The Module */
    ////////////////////////////////////////////////////////////////////////////
    const _$={
      /**Easing function: exponential-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_IN(x){ return x==0 ? 0 : Math.pow(1024, x-1) },
      /**Easing function: exponential-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_OUT(x){ return x==1 ? 1 : 1-Math.pow(2, -10*x) },
      /**Easing function: exponential-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_INOUT(x){
        return x==0 ? 0
                    : (x==1) ? 1
                             : ((x*=2)<1) ? (0.5 * Math.pow(1024, x-1))
                                          : (0.5 * (2 -Math.pow(2, -10 * (x-1)))) },
      /**Easing function: linear.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      LINEAR(x){ return x },
      /**Easing function: smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH(x){ return 3*x*x - 2*x*x*x },
      /**Easing function: quadratic-smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH_QUAD(x){let n= _$.SMOOTH(x); return n*n},
      /**Easing function: cubic-smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH_CUBIC(x){let n= _$.SMOOTH(x); return n*n*n},
      /**Easing function: cubic-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_CUBIC(x){ return x*x*x },
      /**Easing function: cubic-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_CUBIC(x){ let n=1-x; return 1 - n*n*n },
      /**Easing function: cubic-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_CUBIC(x){
        if(x < 0.5){
          return 4*x*x*x
        }else{
          let n= -2*x+2;
          return 1- n*n*n/2 } },
      /**Easing function: quadratic-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_QUAD(x){ return x*x },
      /**Easing function: quadratic-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_QUAD(x){ return 1 - (1-x) * (1-x) },
      /**Easing function: quadratic-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_QUAD(x){
        if(x < 0.5){
          return 2*x*x
        }else{
          let n= -2*x+2;
          return 1 - n*n/2 } },
      /**Easing function: sinusoidal-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_SINE(x){ return 1 - Math.cos(x * PI_2) },
      /**Easing function: sinusoidal-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_SINE(x){ return Math.sin(x * PI_2) },
      /**Easing function: sinusoidal-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_SINE(x){ return 0.5 - Math.cos(x * Math.PI)/2 },
      /**Easing function: spline.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SPLINE(t, a, b, c, d){
        let
          tt = t * t,
          ttt = tt * t,
          q1 = -ttt + 2*tt - t,
          q2 = 3*ttt - 5*tt + 2,
          q3 = -3*ttt + 4*tt + t,
          q4 = ttt - tt;
        return 0.5 * (a * q1 + b * q2 + c * q3 + d * q4);
      },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
       * @param {number} t
       * @param {number} a
       * @param {number} b
       * @param {number} c
       * @param {number} d
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        let
          t2=t*t,
          t3=t2*t,
          tm1= 1-t,
          tm2=tm1*tm1,
          tm3=tm2*tm1;
        return tm3*a + 3*tm2*t*b + 3*tm1*t2*c + t3*d;
      },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      ELASTIC_IN(x){
        return x==0 ? 0
                    : x==1 ? 1
                           : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5) },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      ELASTIC_OUT(x){
        return x==0 ? 0
                    : x==1 ? 1
                           : 1+ Math.pow(2, -10*x) * Math.sin((x-0.1)*P5) },
      /**Easing function: elastic-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      ELASTIC_INOUT(x){
        switch(x){
          case 0: return 0;
          case 1: return 1;
          default:
            x *= 2;
            return x<1 ? -0.5*Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5)
                       : 1+ 0.5*Math.pow(2, -10*(x-1)) * Math.sin((x-1.1)*P5); } },
      /**Easing function: bounce-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      BOUNCE_IN(x){ return 1 - _$.BOUNCE_OUT(1 - x) },
      /**Easing function: bounce-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      BOUNCE_OUT(x){
        if(x < 1/2.75){
          return 7.5625 * x * x
        }else if(x < 2/2.75){
          return 7.5625 * (x -= 1.5/2.75) * x + 0.75
        }else if(x < 2.5/2.75){
          return 7.5625 * (x -= 2.25/2.75) * x + 0.9375
        }else{
          return 7.5625 * (x -= 2.625/2.75) * x + 0.984375 } },
      /**Easing function: bounce-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      BOUNCE_INOUT(x){
        return x < 0.5 ? _$.BOUNCE_IN(x*2) * 0.5
                       : _$.BOUNCE_OUT(x*2 - 1) * 0.5 + 0.5 },
      /**Create a tween operating on sprite's alpha value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAlpha}
       */
      tweenAlpha(s,type,endA,frames=60,loop=false){
        const t= TweenAlpha(s,type,frames,loop);
        let sa=s.alpha;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0];
          ea=endA[1]
        }
        return t.start(sa,ea), t;
      },
      /**Create a tween operating on sprite's rotation value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAngle}
       */
      tweenAngle(s,type,endA,frames=60,loop=false){
        const t= TweenAngle(s,type,frames,loop);
        let sa=s.rotation;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0];
          ea=endA[1]
        }
        return t.start(sa,ea), t;
      },
      /**Create a tween operating on sprite's scale value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {null|number|number[]} endX
       * @param {null|number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      tweenScale(s,type,endX,endY,frames=60,loop=false){
        const t= TweenScale(s,type,frames,loop);
        let sx=s.scale.x;
        let sy=s.scale.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0];
          ex=endX[1]
        }
        if(is.vec(endY)){
          sy=endY[0];
          ey=endY[1]
        }
        if(!is.num(ex)){ sx=ex=UNDEF }
        if(!is.num(ey)){ sy=ey=UNDEF }
        return t.start(sx,ex,sy,ey), t;
      },
      /**Create a tween operating on sprite's position.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenXY}
       */
      tweenXY(s,type,endX,endY,frames=60,loop=false){
        const t= TweenXY(s,type,frames,loop);
        let sx=s.x;
        let sy=s.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0];
          ex=endX[1]
        }
        if(is.vec(endY)){
          sy=endY[0];
          ey=endY[1]
        }
        if(!is.num(ex)){sx=ex=UNDEF}
        if(!is.num(ey)){sy=ey=UNDEF}
        return t.start(sx,ex,sy,ey), t;
      },
      /**Slowly fade out this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeOut(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,0,frames) },
      /**Slowly fade in this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeIn(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,1,frames) },
      /**Fades the sprite in and out at a steady rate.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} min
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAlpha}
       */
      pulse(s, min=0,frames=60,loop=true){
        return this.tweenAlpha(s,this.SMOOTH,min,frames,loop) },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @return {TweenXY}
       */
      slide(s, type, endX, endY, frames=60){
        return this.tweenXY(s,type,endX,endY,frames) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      throb(s, endX=0.9, endY=0.9, frames=60,loop=true){
        return this.tweenScale(s, this.SMOOTH_QUAD,endX,endY,frames,loop) },
      /**Scale this sprite.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @return {TweenScale}
       */
      scale(s, endX=0.5, endY=0.5, frames=60){
        return this.tweenScale(s,this.SMOOTH,endX,endY,frames) },
      /**Flashes this sprite.
       * @memberof module:mojoh5/affects
       * @param {Sprite} s
       * @param {number|number[]} scale
       * @param {number} start
       * @param {number} end
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      strobe(s, scale=1.3, start=10, end=20, frames=10,loop=true){
        return this.tweenScale(s,
                               (v)=> this.SPLINE(v,start,0,1,end), scale,scale,frames,loop) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {object} bounds {x1,x2,y1,y2}
       * @param {number} ex
       * @param {number} ey
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {BatchTweens}
       */
      jiggle(s, bounds, ex=1.4, ey=1.2, frames=10, loop=true){
        let {x1,x2,y1,y2}= bounds;
        return BatchTweens(this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,
                                                              _.or(x2,10)), ex, UNDEF, frames,loop),
                           this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,
                                                              _.or(y2,-10)), UNDEF,ey, frames,loop)) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {Vec2} c1
       * @param {Vec2} c2
       * @param {Vec2} c3
       * @param {number} frames
       * @return {TweenXY}
       */
      bezier(s,c1,c2,c3,frames=60){
        let t= TweenXY(s,this.SMOOTH,frames);
        t.start=function(){ this._run() };
        t.onFrame=function(end,alpha){
          if(!end)
            _V.set(s, _$.CUBIC_BEZIER(alpha, s.x, c1[0],c2[0],c3[0]),
                      _$.CUBIC_BEZIER(alpha, s.y, c1[1], c2[1], c3[1]));
        };
        return t.start(), t;
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/FX
       * @param {Tween} t
       */
      remove(t){ t?.dispose() },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.onTick(dt));
        _.rseq(DustBin, p=> p.onTick(dt));
        for(let i=TweensQueue.length-1;i>=0;--i) TweensQueue[i].dead? TweensQueue.splice(i,1):0;
        for(let i=DustBin.length-1;i>=0;--i) DustBin[i].m5.dead? _S.remove(DustBin[i]) && DustBin.splice(i,1):0;
      },
      /**Create particles.
       * @memberof module:mojoh5/FX
       * @return {any} undefined
       */
      particles(C,x, y, spriteCtor, count=24, mins={}, maxs={}, gravity=[0,0.3], random=true){
        mins= _.patch(mins,{angle:0, size:4, speed:0.3,
                            scale:0.01, alpha:0.02, rotate:0.01});
        maxs=_.patch(maxs,{angle:6.28, size:16, speed:3,
                           scale:0.05, alpha:0.02, rotate:0.03 });
        function _make(angle){
          let
            p= spriteCtor(),
            v,size = _.randInt2(mins.size, maxs.size);
          DustBin.push(p);
          C.addChild(p);
          if(p.totalFrames)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          _S.sizeXY(_S.centerAnchor(p), size, size);
          _V.set(p,x,y);
          p.g.scaleSpeed = _.randFloat2(mins.scale, maxs.scale);
          p.g.alphaSpeed = _.randFloat2(mins.alpha, maxs.alpha);
          p.g.angVel = _.randFloat2(mins.rotate, maxs.rotate);
          v= _.randFloat2(mins.speed, maxs.speed);
          _V.set(p.m5.vel, v * Math.cos(angle),
                           v * Math.sin(angle));
          //the worker
          p.onTick=function(){
            if(!this.m5.dead){
              _V.add$(this.m5.vel,gravity);
              _V.add$(this,this.m5.vel);
              if(this.scale.x - this.g.scaleSpeed > 0){ this.scale.x -= this.g.scaleSpeed }
              if(this.scale.y - this.g.scaleSpeed > 0){ this.scale.y -= this.g.scaleSpeed }
              this.rotation += this.m5.angVel;
              this.alpha -= this.g.alphaSpeed;
              if(this.alpha <= 0){ this.m5.dead=true; }
            }
          };
        }
        for(let diff= maxs.angle-mins.angle,
                gap= diff/(count-1), a=mins.angle, i=0; i<count; ++i){
          _make(random ? _.randFloat2(mins.angle, maxs.angle) : a);
          a += gap;
        }
      },
      /**Shake this sprite.
       * @memberof module:mojoh5/FX
       * @return {Sprite}
       */
      shake(s, magnitude=16, angular=false,loop=true){
        const CHUNK=8;
        let
          wrapper={},
          self=this,
          counter=1,
          startX = s.x,
          startY = s.y,
          tiltAngle = 1,
          startAngle = s.rotation,
          startMagnitude= magnitude,
          chunk = int(magnitude / CHUNK);
        function _upAndDownShake(){
          if(counter<CHUNK){
            s.x = startX;
            s.y = startY;
            magnitude -= chunk;
            s.x += _.randInt2(-magnitude, magnitude);
            s.y += _.randInt2(-magnitude, magnitude);
            ++counter;
          }else if(loop){
            magnitude=startMagnitude;
            counter=1;
          }else{
            _.disj(DustBin,wrapper);
          }
        }
        function _angularShake(){
          if(counter<CHUNK){
            s.rotation = startAngle;
            magnitude -= chunk;
            s.rotation = magnitude * tiltAngle;
            ++counter;
            //yoyo it
            tiltAngle *= -1;
          }else if(loop){
            magnitude=startMagnitude;
            counter=1;
          }else{
            _.disj(DustBin,wrapper);
          }
        }
        wrapper.onTick=()=>{
          return angular ? _angularShake(wrapper)
                         : _upAndDownShake(wrapper)
        };
        return DustBin.push(wrapper) && s;
      },
      StarWarp,
      SeqTweens,
      BatchTweens
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/FX"]=function(M){
      return M.FX ? M.FX : _module(M, [], [])
    }
  }

})(this);


