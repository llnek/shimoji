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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

  "use strict";

  /**Create the module. */
  function _module(Mojo, TweensQueue, DustBin){
    const _M=gscope["io/czlab/mcfud/math"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is}=Mojo;
    const MFL=Math.floor,
          P5=Math.PI*5,
          PI_2= Math.PI/2,
          TWO_PI= Math.PI*2;

    /**
     * @module mojoh5/FX
     */

    function Tween(s,t,frames=60,loop=false,ext={}){
      return _.inject({
        sprite:s,
        easing:t,
        on:false,
        curf:0,
        loop,
        frames,
        onFrame(end,alpha){},
        _run(){
          this.on=true;
          this.curf=0;
          TweensQueue.push(this);
        },
        onTick(){
          if(this.on){
            if(this.curf<this.frames){
              this.onFrame(false,
                           this.easing(this.curf/this.frames));
              this.curf += 1;
            }else{
              this.onFrame(true);
              if(this.loop){
                if(is.num(this.loop)){
                  --this.loop
                }
                this.onLoopReset()
                this.curf=0;
              }else{
                this.on=false;
                this.onComplete &&
                  _.delay(0,()=> this.onComplete());
                this.dispose();
              }
            }
          }
        },
        dispose(){
          _.disj(TweensQueue,this);
          Mojo.emit(["tween.disposed"],this);
        }
      },ext)
    }

    /** scale */
    function TweenScale(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:null;
          this._y=is.num(ey)?[sy,ey]:null;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x){
            let [a,b]=this._x;
            this._x[0]=b;
            this._x[1]=a;
          }
          if(this._y){
            let [a,b]=this._y;
            this._y[0]=b;
            this._y[1]=a;
          }
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

    /** alpha */
    function TweenAlpha(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          //flip values
          let [a,b]=this._a;
          this._a[0]=b;
          this._a[1]=a;
        },
        onFrame(end,alpha){
          this.sprite.alpha= end ? this._a[1]
                                 : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    /** position */
    function TweenXY(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:null;
          this._y=is.num(ey)?[sy,ey]:null;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x){
            let [a,b]=this._x;
            this._x[0]=b;
            this._x[1]=a;
          }
          if(this._y){
            let [a,b]=this._y;
            this._y[0]=b;
            this._y[1]=a;
          }
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

    /** sequence */
    function BatchTweens(...ts){
      const t= {
        children:ts.slice(),
        onTweenEnd(t){
          for(let c,i=0;i<this.children.length;++i){
            c=this.children[i];
            if(c===t){
              this.children.splice(i,1);
              break;
            }
          }
          if(this.children.length===0){
            this.onComplete &&
              _.delay(0,()=>this.onComplete());
            this.dispose();
          }
        },
        size(){
          return this.children.length },
        dispose(){
          Mojo.off(["tween.disposed"],"onTweenEnd",this);
          this.children.forEach(c=>c.dispose());
          this.children.length=0;
        }
      };

      Mojo.on(["tween.disposed"],"onTweenEnd",t);
      return t;
    }

    const _$={
      /**Easing function: exponential-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  EXPO_IN(x){ return x===0 ? 0 : Math.pow(1024, x-1) },
      /**Easing function: exponential-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  EXPO_OUT(x){ return x===1 ? 1 : 1-Math.pow(2, -10*x) },
      /**Easing function: exponential-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  EXPO_INOUT(x){
			  return x===0 ? 0
                     : (x===1) ? 1
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
        return (2*b + (c-a)*t +
               (2*a - 5*b + 4*c - d)*t*t +
               (-a + 3*b - 3*c + d)*t*t*t) / 2 },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        return a*t*t*t +
               3*b*t*t*(1-t) +
               3*c*t*(1-t)*(1-t) +
               d*(1-t)*(1-t)*(1-t) },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_IN(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5) },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_OUT(x){
        return x===0 ? 0
                     : x===1 ? 1
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
        if(!is.num(ex)){ sx=ex=null }
        if(!is.num(ey)){ sy=ey=null }
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
        if(!is.num(ex)){sx=ex=null}
        if(!is.num(ey)){sy=ey=null}
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
      breathe(s, endX=0.8, endY=0.8, frames=60,loop=true){
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
      wobble(s, bounds, ex=1.2, ey=1.2, frames=10, loop=true){
        let {x1,x2,y1,y2}= bounds;
        return BatchTweens(this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,
                                                              _.or(x2,10)), ex, null, frames,loop),
                           this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,
                                                              _.or(y2,-10)), null,ey, frames,loop)) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      followCurve(s, type, points, frames=60){
        let t= TweenXY(s,type,frames);
        let self=this;
        t.start=function(ps){
          this._p = ps;
          this._run();
        };
        t.onFrame=function(end,alpha){
          let p = this._p;
          if(!end)
            _V.set(s, self.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                      self.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1])) };
        return t.start(points), t;
      },
      /**Make object walk in a path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      walkPath(s, type, points, frames=300){
        let _calcPath=(cur,frames)=>{
          let t= this.tweenXY(s,type,[points[cur][0], points[cur+1][0]],
                                     [points[cur][1], points[cur+1][1]],frames);
          t.onComplete=()=>{
            if(++cur < points.length-1)
              _.delay(0,()=> _calcPath(cur,frames)) };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length));
      },
      /**Make object appear to walk in a curved path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      walkCurve(s, type, points, frames=300){
        let _calcPath=(cur,frames)=>{
          let t=this.followCurve(s, type,
                                 points[cur], frames);
          t.onComplete=()=>{
            if(++cur < points.length)
              _.delay(0,()=> _calcPath(cur,frames)) };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length));
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/FX
       * @param {Tween} t
       */
      remove(t){
        t && t.dispose() },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.onTick(dt));
        _.rseq(DustBin, p=> p.onTick(dt));
      },
      /**Create particles.
       * @memberof module:mojoh5/FX
       * @return {}
       */
      createParticles(x, y, spriteCtor, container, gravity, mins, maxs, random=true, count= 20){
        mins= _.patch(mins,{angle:0, size:4, speed:0.3,
                            scale:0.01, alpha:0.02, rotate:0.01});
        maxs=_.patch(maxs,{angle:6.28, size:16, speed:3,
                           scale:0.05, alpha:0.02, rotate:0.03 });
        _.assert(count>1);
        gravity[0]=0;
        function _make(angle){
          let size = _.randInt2(mins.size, maxs.size);
          let p= spriteCtor();
          DustBin.push(p);
          container.addChild(p);
          if(p.totalFrames)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          Mojo.Sprites.sizeXY(p, size,size);
          _V.set(p,x,y);
          Mojo.Sprites.centerAnchor(p);
          p.m5.scaleSpeed = _.randFloat(mins.scale, maxs.scale);
          p.m5.alphaSpeed = _.randFloat(mins.alpha, maxs.alpha);
          p.m5.angVel = _.randFloat(mins.rotate, maxs.rotate);
          let speed = _.randFloat(mins.speed, maxs.speed);
          _V.set(p.m5.vel, speed * Math.cos(angle),
                           speed * Math.sin(angle));
          //the worker
          p.onTick=function(){
            _V.add$(p.m5.vel,gravity);
            _V.add$(p,p.m5.vel);
            if(p.scale.x - p.m5.scaleSpeed > 0){
              p.scale.x -= p.m5.scaleSpeed;
            }
            if(p.scale.y - p.m5.scaleSpeed > 0){
              p.scale.y -= p.m5.scaleSpeed;
            }
            p.rotation += p.m5.angVel;
            p.alpha -= p.m5.alphaSpeed;
            if(p.alpha <= 0){
              _.disj(DustBin,p);
              Mojo.Sprites.remove(p);
            }
          };
        }
        for(let gap= (maxs.angle-mins.angle)/(count-1),
            a=mins.angle,i=0; i<count; ++i){
          _make(random ? _.randFloat(mins.angle, maxs.angle) : a);
          a += gap;
        }
      },
      /**Shake this sprite.
       * @memberof module:mojoh5/FX
       * @return {}
       */
      shake(s, magnitude=16, angular=false,loop=true){
        let numberOfShakes=10,
            wrapper={},
            self = this,
            counter=1,
            startX = s.x,
            startY = s.y,
            startAngle = s.rotation,
            startMagnitude= magnitude,
            //Divide the magnitude into 10 units so that you can
            //reduce the amount of shake by 10 percent each frame
            magnitudeUnit = MFL(magnitude / numberOfShakes);
        function _upAndDownShake(){
          if(counter<numberOfShakes){
            s.x = startX;
            s.y = startY;
            magnitude -= magnitudeUnit;
            s.x += _.randInt2(-magnitude, magnitude);
            s.y += _.randInt2(-magnitude, magnitude);
            ++counter;
          }else{
            if(loop){
              magnitude=startMagnitude;
              counter=1;
            }else{
              _.disj(DustBin,wrapper);
            }
          }
        }
        let tiltAngle = 1;
        function _angularShake(){
          if(counter<numberOfShakes){
            s.rotation = startAngle;
            magnitude -= magnitudeUnit;
            s.rotation = magnitude * tiltAngle;
            ++counter;
            //yoyo it
            tiltAngle *= -1;
          }else{
            if(loop){
              magnitude=startMagnitude;
              counter=1;
            }else{
              _.disj(DustBin,wrapper);
            }
          }
        }
        wrapper.onTick=()=>{
          return angular ? _angularShake(wrapper)
                         : _upAndDownShake(wrapper)
        };
        DustBin.push(wrapper);
      }
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/FX"]=function(M){
      return M.FX ? M.FX : _module(M, [], [])
    }
  }

})(this);


