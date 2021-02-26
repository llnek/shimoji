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

  /**Create the module.
   */
  function _module(Mojo, TweensQueue, DustBin){
    const _M=gscope["io/czlab/mcfud/math"]();
    const {ute:_, is}=Mojo;
    const MFL=Math.floor,
          P5=Math.PI*5,
          PI_2= Math.PI/2,
          TWO_PI= Math.PI*2;

    /**
     * @module mojoh5/FX
     */

    /**
     * @memberof module:mojoh5/FX
     * @class
     */
    class Particles{
      constructor(ps){ this.bits=ps }
    }

    /**
     * @memberof module:mojoh5/FX
     * @class
     */
    class Tween{
      constructor(s,t){
        this.sprite=s;
        this.easing=t;
      }
      onEnd(){}
      onFrame(end,alpha){}
      _stop(){ this.on=false }
      _s(frames){
        _.assert(is.num(frames));
        this.step=function(){
          if(this.on){
            if(this.curf<frames){
              let perc=this.curf/frames;
              let alpha=this.easing(perc);
              this.onFrame(false,alpha);
              this.curf += 1;
            }else{
              this.onFrame(true);
              this._e();
              this.onEnd();
            }
          }
        };
        this.on = true;
        this.curf = 0;
        _.conj(TweensQueue,this);
      }
      _e(){
        _$.remove(this);
        if(this.cb) this.cb();
      }
      /**Set a function to be called when the tween is done.
       * @param {function} cb
       */
      onComplete(cb){ this.cb=cb }
    }

    /**
     * @memberof module:mojoh5/FX
     * @class
     */
    class BatchTweens{
      constructor(...ts){
        this.cnt=0;
        let CF= ()=>{
          if(++this.cnt === this.size()){
            this.cnt=0;
            if(this.cb) this.cb();
          }
        };
        this.children= ts.map(t=>{
          let x=t._e;
          t._e=function(){
            x.call(t);
            CF();
          };
          return t;
        });
      }
      /**Set a function to be called when the tween is done.
       * @param {function} cb
       */
      onComplete(cb){ this.cb=cb }
      size(){ return this.children.length }
      dispose(){
        this.children.forEach(c=> Mojo.FX.remove(c))
        this.children.length=0;
      }
      _stop(){ this.children.forEach(c=> c._stop()) }
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
                     : (0.5 * (2 -Math.pow(2, -10 * (x-1))))
      },
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
      SMOOTH_QUAD(x){let n= this.SMOOTH(x); return n*n},
      /**Easing function: cubic-smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH_CUBIC(x){let n= this.SMOOTH(x); return n*n*n},
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
        if(x < 0.5){ return 4*x*x*x }else{
          let n= -2*x+2; return 1- n*n*n/2
        }
      },
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
        if(x < 0.5){ return 2*x*x }else{
          let n= -2*x+2; return 1 - n*n/2
        }
      },
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
               (-a + 3*b - 3*c + d)*t*t*t) / 2
      },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        return a*t*t*t +
               3*b*t*t*(1-t) +
               3*c*t*(1-t)*(1-t) +
               d*(1-t)*(1-t)*(1-t)
      },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_IN(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5)
		  },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_OUT(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : 1+ Math.pow(2, -10*x) * Math.sin((x-0.1)*P5)
		  },
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
                       : 1+ 0.5*Math.pow(2, -10*(x-1)) * Math.sin((x-1.1)*P5);
        }
      },
      /**Easing function: bounce-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      BOUNCE_IN(x){ return 1 - this.BOUNCE_OUT(1 - x) },
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
          return 7.5625 * (x -= 2.625/2.75) * x + 0.984375
        }
		  },
      /**Easing function: bounce-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  BOUNCE_INOUT(x){
			  return x < 0.5 ? this.BOUNCE_IN(x*2) * 0.5
                       : this.BOUNCE_OUT(x*2 - 1) * 0.5 + 0.5
		  },
      /**Create a tween operating on sprite's alpha value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenAlpha(s,type,endA,frames=60,loop=false){
        const t= _.inject(new Tween(s,type),{
          start(sa,ea){
            this._s(frames);
            this._a= [sa,ea];
            return this;
          },
          onFrame(end,alpha){
            this.sprite.alpha= end ? this._a[1]
                                   : _M.lerp(this._a[0], this._a[1], alpha)
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._a[1],this._a[0]))
          }
        });
        let sa=s.alpha;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0];ea=endA[1]}
        return t.start(sa,ea);
      },
      /**Create a tween operating on sprite's scale value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenScale(s,type,endX,endY,frames=60,loop=false){
        const t= _.inject(new Tween(s,type),{
          start(sx,ex,sy,ey){
            this._s(frames);
            this._x=[sx,ex];
            this._y=[sy,ey];
            return this;
          },
          onFrame(end,dt){
            if(is.num(this._x[1],this._x[0]))
              this.sprite.scale.x= end ? this._x[1]
                                       : _M.lerp(this._x[0], this._x[1], dt);
            if(is.num(this._y[1],this._y[0]))
              this.sprite.scale.y= end ? this._y[1]
                                       : _M.lerp(this._y[0], this._y[1], dt);
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._x[1],this._x[0],this._y[1],this._y[0]))
          }
        });
        let sx=s.scale.x;
        let sy=s.scale.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0];ex=endX[1]}
        if(is.vec(endY)){
          sy=endY[0];ey=endY[1]}
        return t.start(sx,ex,sy,ey);
      },
      /**Create a tween operating on sprite's position.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenXY(s,type,endX,endY,frames=60,loop=false){
        const t= _.inject(new Tween(s,type), {
          start(sx,ex,sy,ey){
            this._s(frames);
            this._x=[sx,ex];
            this._y=[sy,ey];
            return this;
          },
          onFrame(end,dt){
            if(is.num(this._x[0],this._x[1]))
              this.sprite.x= end ? this._x[1]
                                 : _M.lerp(this._x[0], this._x[1], dt);
            if(is.num(this._y[0],this._y[1]))
              this.sprite.y= end ? this._y[1]
                                 : _M.lerp(this._y[0], this._y[1], dt);
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this.ex,this.sx,this.ey,this.sy));
          }
        });
        let sx=s.x;
        let sy=s.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0]; ex=endX[1]}
        if(is.vec(endY)){
          sy=endY[0]; ey=endY[1]}
        return t.start(sx,ex,sy,ey);
      },
      /**Slowly fade out this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeOut(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,0,frames)
      },
      /**Slowly fade in this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeIn(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,1,frames)
      },
      /**Fades the sprite in and out at a steady rate.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} min
       * @param {number} frames
       * @return {}
       */
      pulse(s, min=0,frames=60){
        return this.tweenAlpha(s,this.SMOOTH,min,frames)
      },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      slide(s, type, endX, endY, frames=60, loop=false){
        return this.tweenXY(s,type,endX,endY,frames,loop)
      },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      breathe(s, endX=0.8, endY=0.8, frames=60, loop=true){
        return this.tweenScale(s, this.SMOOTH_QUAD,endX,endY,frames,loop)
      },
      /**Scale this sprite.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @return {}
       */
      scale(s, endX=0.5, endY=0.5, frames=60){
        return this.tweenScale(s,this.SMOOTH,endX,endY,frames)
      },
      /**Flashes this sprite.
       * @memberof module:mojoh5/affects
       * @param {Sprite} s
       * @param {number|number[]} scale
       * @param {number} start
       * @param {number} end
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      strobe(s, scale=1.3, start=10, end=20, frames=10, loop=true){
        return this.tweenScale(s,
                               (v)=> this.SPLINE(v,start,0,1,end), scale,scale,frames,loop)
      },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @param {number} frames
       * @param {number} friction
       * @param {object} bounds {x1,x2,y1,y2}
       * @param {boolean}
       * @return {}
       */
      wobble(s, bounds, sx=1.2, sy=1.2, frames=10, friction=0.98, loop=true){
        let {x1,x2,y1,y2}= bounds;
        let tx=this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,_.or(x2,10)),
                               sx, null, frames,loop);
        let ty= this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,_.or(y2,-10)),
                                null,sy, frames,loop);
        let oldX=tx.onFrame;
        let oldY=ty.onFrame;
        tx.onFrame=function(end,dt){
          if(end && this._x[1] > 1){
            this._x[1] *= friction;
            if(this._x[1] <= 1){ this._x[1]=1 }
          }
          oldX.call(tx,end,dt);
        };
        ty.onFrame=function(end,dt){
          if(end && this._y[1] > 1){
            this._y[1] *= friction;
            if(this._y[1] <= 1){ this._y[1]=1 }
          }
          oldY.call(ty,end,dt);
        };
        return new BatchTweens(tx,ty)
      },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      followCurve(s, type, points, frames=60, loop=false){
        let self=this,
          t= _.inject(new Tween(s,this.SMOOTH), {
          start(points){
            this._s(frames);
            this._p = points;
            return this;
          },
          onFrame(end,alpha){
            let p = this._p;
            if(!end)
              Mojo.Sprites.setXY(s, self.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                                    self.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1]))
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._p.reverse()))
          }
        });
        return t.start(points)
      },
      /**Make object walk in a path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      walkPath(s, type, points, frames=300, loop=false){
        let _calcPath=(cur,frames)=>{
          let t= this.tweenXY(s,type,[points[cur][0], points[cur+1][0]],
                                     [points[cur][1], points[cur+1][1]],frames);
          t.onEnd=function(){
            if(++cur < points.length-1){
              _.delay(0,()=> _calcPath(cur,frames))
            }else if(loop){
              points.reverse();
              _.delay(0,()=>{
                Mojo.Sprites.setXY(s, points[0][0], points[0][1]);
                _calcPath(0,frames);
              });
            }
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length))
      },
      /**Make object appear to walk in a curved path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      walkCurve(s, type, points, frames=300, loop=false){
        let _calcPath=(cur,frames)=>{
          let t=this.followCurve(s, type, points[cur], frames);
          t.onEnd=function(){
            if(++cur < points.length){
              _.delay(0,()=> _calcPath(cur,frames));
            }else if(loop){
              points.reverse().forEach(c=> c.reverse());
              _.delay(0,()=>{
                Mojo.Sprites.setXY(s, points[0][0], points[0][1]);
                _calcPath(0,frames);
              });
            }
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length))
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/FX
       * @param {Tween} t
       */
      remove(t){
        t._stop();
        t instanceof BatchTweens ? t.dispose() : _.disj(TweensQueue,t)
      },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.step(dt))
        _.rseq(DustBin, p=>{
          if(p.bits.length>0)
            _.rseq(p.bits, k=> k.m5.step())
          else
            _.disj(DustBin,p);
        });
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
        let pBag=[];
        function _make(angle){
          let size = _.randInt2(mins.size, maxs.size);
          let p= spriteCtor();
          pBag.push(p);
          container.addChild(p);
          if(p.totalFrames>0)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          Mojo.Sprites.setSize(p, size);
          Mojo.Sprites.setXY(p,x,y);
          Mojo.Sprites.centerAnchor(p);
          p.m5.scaleSpeed = _.randFloat(mins.scale, maxs.scale);
          p.m5.alphaSpeed = _.randFloat(mins.alpha, maxs.alpha);
          p.m5.angVel = _.randFloat(mins.rotate, maxs.rotate);
          let speed = _.randFloat(mins.speed, maxs.speed);
          p.m5.vel[0] = speed * Math.cos(angle);
          p.m5.vel[1] = speed * Math.sin(angle);
          //the worker
          p.m5.step=function(){
            p.m5.vel[1] += gravity[1];
            p.x += p.m5.vel[0];
            p.y += p.m5.vel[1];
            if(p.scale.x - p.m5.scaleSpeed > 0){
              p.scale.x -= p.m5.scaleSpeed;
            }
            if(p.scale.y - p.m5.scaleSpeed > 0){
              p.scale.y -= p.m5.scaleSpeed;
            }
            p.rotation += p.m5.angVel;
            p.alpha -= p.m5.alphaSpeed;
            if(p.alpha <= 0){
              _.disj(pBag,p);
              Mojo.Sprites.remove(p);
            }
          };
        }
        for(let gap= (maxs.angle-mins.angle)/(count-1),
            a=mins.angle,i=0; i<count; ++i){
          _make(random ? _.randFloat(mins.angle, maxs.angle) : a);
          a += gap;
        }
        let o=new Particles(pBag);
        _.conj(DustBin,o);
        return o;
      }
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/FX"]=function(M){
      return M.FX ? M.FX : _module(M, [], [])
    }
  }

})(this);

