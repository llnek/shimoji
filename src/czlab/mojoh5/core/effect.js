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

;(function(global){
  "use strict";
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @private
   * @function
   */
  function _module(Mojo, WIPTweens, WIPDust){
    const Core=global["io.czlab.mcfud.core"]();
    const _M=global["io.czlab.mcfud.math"]();
    const TWO_PI= Math.PI*2;
    const PI_2= Math.PI/2;
    const _S=Mojo.Sprites;
    const is=Core.is;
    const _=Core.u;
    const _T={
      SMOOTH(x){ return 3*x*x - 2*x*x*x },
      SMOOTH_QUAD(x){let n= _T.SMOOTH(x); return n*n},
      SMOOTH_CUBIC(x){let n= _T.SMOOTH(x); return n*n*n},
      EASE_IN_CUBIC(x){ return x*x*x },
      EASE_OUT_CUBIC(x){ let n=1-x; return 1 - n*n*n },
      EASE_INOUT_CUBIC(x){
        if(x < 0.5){ return 4*x*x*x }else{
          let n= -2*x+2; return 1- n*n*n/2
        }
      },
      EASE_IN_QUAD(x){ return x*x },
      EASE_OUT_QUAD(x){ return 1 - (1-x) * (1-x) },
      EASE_INOUT_QUAD(x){
        if(x < 0.5){ return 2*x*x }else{
          let n= -2*x+2; return 1 - n*n/2
        }
      },
      EASE_IN_SINE(x){ return 1 - Math.cos(x * PI_2) },
      EASE_OUT_SINE(x){ return Math.sin(x * PI_2) },
      EASE_INOUT_SINE(x){ return 0.5 - Math.cos(x * Math.PI)/2 },
      SPLINE(t, a, b, c, d){
        return (2*b + (c-a)*t +
               (2*a - 5*b + 4*c - d)*t*t +
               (-a + 3*b - 3*c + d)*t*t*t) / 2
      },
      CUBIC_BEZIER(t, a, b, c, d){
        return a*t*t*t +
               3*b*t*t*(1-t) +
               3*c*t*(1-t)*(1-t) +
               d*(1-t)*(1-t)*(1-t)
      }
    };
    /**
     * @public
     * @function
     */
    class Tween{
      constructor(s,t){
        this.sprite=s;
        this.easing=t;
      }
      onEnd(){}
      onFrame(end,alpha){}
      _stop(){ this.on=false }
      _initStart(frames){
        _.assert(is.num(frames));
        this.step=function(){
          if(this.on){
            if(this.fcur < frames){
              let perc=this.fcur/frames;
              let alpha=this.easing(perc);
              this.onFrame(false,alpha);
              this.fcur += 1;
            }else{
              this.onFrame(true);
              this._initEnd();
              this.onEnd();
            }
          }
        };
        this.on = true;
        this.fcur = 0;
        _.conj(WIPTweens,this);
      }
      _initEnd(){
        _T.remove(this);
        if(this.cb) this.cb();
      }
      onComplete(cb){ this.cb=cb }
    }
    /**
     * @public
     * @function
     */
    class CompositeTween{
      constructor(...ts){
        this.cnt=0;
        let CF= () => {
          if(++this.cnt === this.size()){
            this.cnt = 0;
            if(this.cb) this.cb();
          }
        };
        this.children= ts.map(t => {
          let x=t._initEnd
          t._initEnd=function(){
            x.call(t);
            CF();
          }
          return t;
        });
      }
      onComplete(cb){ this.cb=cb }
      size(){ return this.children.length }
      dispose(){
        _.doseq(this.children, c => _T.remove(c))
      }
      _stop(){ _.doseq(this.children, c => c._stop()) }
    }
    /**
     * @public
     * @function
     */
    _T.tweenAlpha=function(sprite,type,endA,frames=60,yoyo=false,delay=0){
      let t= _.inject(new Tween(sprite,type),{
        start(sa,ea){
          this._initStart(frames);
          this.sa= sa;
          this.ea=ea;
          return this;
        },
        onFrame(end,alpha){
          if(end){
            this.sprite.alpha= this.ea;
          }else{
            this.sprite.alpha=_M.lerp(this.sa, this.ea, alpha);
          }
        },
        onEnd(){
          if(yoyo)
            _.delay(delay,() => this.start(this.ea,this.sa));
        }
      });
      let ea,sa=sprite.alpha;
      if(is.vec(endA)){sa=endA[0];ea=endA[1]}else ea=endA;
      return t.start(sa,ea);
    };
    /**
     * @public
     * @function
     */
    _T.tweenScale=function(sprite,type,endX,endY,frames=60,yoyo=false,delay=0){
      let t= _.inject(new Tween(sprite,type),{
        start(sx,ex,sy,ey){
          this._initStart(frames);
          this.sx= sx;
          this.ex=ex;
          this.sy=sy;
          this.ey=ey;
          return this;
        },
        onFrame(end,dt){
          if(is.num(this.ex,this.sx))
            this.sprite.scale.x= end ? this.ex : _M.lerp(this.sx, this.ex, dt);
          if(is.num(this.ey,this.sy))
            this.sprite.scale.y= end ? this.ey : _M.lerp(this.sy, this.ey, dt);
        },
        onEnd(){
          if(yoyo)
            _.delay(delay,() => this.start(this.ex,this.sx,this.ey,this.sy));
        }
      });
      let ex,sx=sprite.scale.x;
      let ey,sy=sprite.scale.y;
      if(is.vec(endX)){sx=endX[0];ex=endX[1]}else ex=endX;
      if(is.vec(endY)){sy=endY[0];ey=endY[1]}else ey=endY;
      return t.start(sx,ex,sy,ey);
    };
    /**
     * @public
     * @function
     */
    _T.tweenPosition=function(sprite,type,endX,endY,frames=60,yoyo=false,delay=0){
      let t= _.inject(new Tween(sprite,type), {
        start(sx,ex,sy,ey){
          this._initStart(frames);
          this.sx= sx;
          this.ex=ex;
          this.sy=sy;
          this.ey=ey;
          return this;
        },
        onFrame(end,dt){
          if(is.num(this.sx,this.ex))
            this.sprite.x= end ? this.ex : _M.lerp(this.sx, this.ex, dt);
          if(is.num(this.sy,this.ey))
            this.sprite.y= end ? this.ey : _M.lerp(this.sy, this.ey, dt);
        },
        onEnd(){
          if(yoyo)
            _.delay(delay,() => this.start(this.ex,this.sx,this.ey,this.sy));
        }
      });
      let ex,sx=sprite.x;
      let ey,sy=sprite.y;
      if(is.vec(endX)){sx=endX[0]; ex=endX[1]} else ex=endX;
      if(is.vec(endY)){sy=endY[0]; ey=endY[1]} else ey=endY;
      return t.start(sx,ex,sy,ey);
    };
    /**
     * @public
     * @function
     */
    _T.fadeOut=function(sprite, frames = 60){
      return this.tweenAlpha(sprite,_T.EASE_OUT_SINE,0,frames)
    };
    /**
     * @public
     * @function
     */
    _T.fadeIn=function(sprite, frames = 60){
      return this.tweenAlpha(sprite,_T.EASE_OUT_SINE,1,frames)
    };
    /**
     * Fades the sprite in and out at a steady rate.
     * @public
     * @function
     * @param minAlpha greater than 0 if you
     *                 don't want the sprite to fade away completely.
     */
    _T.pulse=function(sprite, minAlpha=0,frames = 60){
      return this.tweenAlpha(sprite,_T.SMOOTH,minAlpha,frames)
    };
    /**
     * @public
     * @function
     */
    _T.slide=function(sprite, type, endX, endY, frames = 60, yoyo = false, delay= 0){
      return this.tweenPosition(sprite,type,endX,endY,frames,yoyo,delay)
    };
    /**
     * @public
     * @function
     */
    _T.breathe=function(sprite, endX = 0.8, endY = 0.8,
                        frames = 60, yoyo = true, delay= 0){
      return this.tweenScale(sprite, this.SMOOTH_QUAD,endX,endY,frames,yoyo,delay)
    };
    /**
     * @public
     * @function
     */
    _T.scale=function(sprite, endX = 0.5, endY = 0.5, frames = 60){
      return this.tweenScale(sprite,this.SMOOTH,endX,endY,frames)
    };
    /**
     * @public
     * @function
     */
    _T.strobe=function(sprite, scale= 1.3,
                       startControl = 10, endControl = 20,
                       frames = 10, yoyo = true, delay= 0){
      return this.tweenScale(sprite,
                             (v)=> _T.SPLINE(v,startControl,0,1,endControl),
                             scale,scale,frames,yoyo,delay)
    };
    /**
     * @public
     * @function
     */
    _T.wobble= function(sprite, scaleX = 1.2, scaleY = 1.2, frames = 10,
                        xStartControl = 10, xEndControl = 10,
                        yStartControl = -10, yEndControl = -10,
                        friction = 0.98, yoyo = true, delay= 0){
      let tx= this.tweenScale(sprite,(v)=>_T.SPLINE(v,xStartControl,0,1,xEndControl),
                              scaleX, null, frames,yoyo,delay);
      let ty= this.tweenScale(sprite,(v)=>_T.SPLINE(v,yStartControl,0,1,yEndControl),
                              null,scaleY, frames,yoyo,delay);
      let oldX=tx.onFrame;
      let oldY=ty.onFrame;
      tx.onFrame=function(end,dt){
        if(end && this.ex > 1){
          this.ex *= friction;
          if(this.ex <= 1){ this.ex=1; }
        }
        oldX.call(tx,end,dt);
      };
      ty.onFrame=function(end,dt){
        if(end && this.ey > 1){
          this.ey *= friction;
          if(this.ey <= 1){ this.ey=1; }
        }
        oldY.call(ty,end,dt);
      };
      return new CompositeTween(tx,ty);
    };
    /**
     * @public
     * @function
     */
    _T.followCurve=function(sprite, type, wayPoints, frames, yoyo = false, delay= 0){
      let t= _.inject(new Tween(sprite,_T.SMOOTH), {
        start(points){
          this._initStart(frames);
          this.wayPoints = points;
          return this;
        },
        onFrame(end,alpha){
          let p = this.wayPoints;
          if(!end)
            _S.setXY(sprite, _T.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                             _T.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1]));
        },
        onEnd(){
          if(yoyo)
            _.delay(delay,() => this.start(this.wayPoints.reverse()));
        }
      });
      return t.start(wayPoints)
    };
    /** Make object walk in a path.
     * @public
     * @function
     */
    _T.walkPath=function(sprite,
                         type,
                         wayPoints,
                         totalFrames = 300,
                         loop = false, yoyo = false, delay = 0){
      function _calcPath(cur,frames){
        let t= _T.tweenPosition(sprite,type,[wayPoints[cur][0], wayPoints[cur+1][0]],
                                            [wayPoints[cur][1], wayPoints[cur+1][1]],frames);
        t.onEnd=function(){
          if(++cur < wayPoints.length-1){
            _.delay(delay,() => _calcPath(cur,frames));
          }else if(loop){
            if(yoyo) wayPoints.reverse();
            _.delay(delay,() => {
              _S.setXY(sprite, wayPoints[0][0], wayPoints[0][1]);
              _calcPath(0,frames);
            });
          }
        };
        return t;
      }
      return _calcPath(0, totalFrames / wayPoints.length)
    };
    /** Make object appear to walk in a curved path.
     * @public
     * @function
     */
    _T.walkCurve=function(sprite,
                          type,
                          wayPoints,
                          totalFrames = 300,
                          loop = false, yoyo = false, delay= 0){
      function _calcPath(cur,frames){
        let t=_T.followCurve(sprite, type, wayPoints[cur], frames);
        t.onEnd=function(){
          if(++cur < wayPoints.length){
            _.delay(delay,() => _calcPath(cur,frames));
          }else if(loop){
            if(yoyo)
              _.doseq(wayPoints.reverse(),c => c.reverse());
            _.delay(delay,()=>{
              _S.setXY(sprite, wayPoints[0][0], wayPoints[0][1]);
              _calcPath(0,frames);
            });
          }
        };
        return t;
      }
      return _calcPath(0, totalFrames / wayPoints.length)
    };
    /**
     * @public
     * @function
     */
    _T.remove=function(t){
      t._stop();
      t instanceof CompositeTween ? t.dispose() : _.disj(WIPTweens,t)
    };
    /**
     * @public
     * @function
     */
    _T.update=function(dt){
      _.rseq(WIPTweens, t => t.step(dt))
      _.rseq(WIPDust, p => {
        if(p.particles.length>0)
          _.rseq(p.particles, k => k.mojoh5.step())
        else
          _.disj(WIPDust,p);
      });
    };

    /**
     * @public
     * @class
     */
    class Particles{
      constructor(ps){
        this.particles=ps;
      }
    }
    /**
     * @public
     * @function
     */
    _T.createParticles=function(x, y,
                                spriteCtor,
                                container,
                                gravity,
                                random= true,
                                particles = 20,
                                minAngle = 0, maxAngle = 6.28,
                                minSize = 4, maxSize = 16,
                                minSpeed = 0.3, maxSpeed = 3,
                                minScaleSpeed = 0.01, maxScaleSpeed = 0.05,
                                minAlphaSpeed = 0.02, maxAlphaSpeed = 0.02,
                                minRotationSpeed = 0.01, maxRotationSpeed = 0.03){
      _.assert(particles>1);
      let pBag = [];
      function _make(angle){
        let size = _.randInt2(minSize, maxSize);
        let p= spriteCtor();
        _.conj(pBag,p);
        container.addChild(p);
        if(p.totalFrames>0)
          p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
        _S.setSize(p,size);
        _S.setXY(p,x,y);
        _S.centerAnchor(p);
        p.mojoh5.scaleSpeed = _.randFloat(minScaleSpeed, maxScaleSpeed);
        p.mojoh5.alphaSpeed = _.randFloat(minAlphaSpeed, maxAlphaSpeed);
        p.mojoh5.angVel = _.randFloat(minRotationSpeed, maxRotationSpeed);
        let speed = _.randFloat(minSpeed, maxSpeed);
        p.mojoh5.vel[0] = speed * Math.cos(angle);
        p.mojoh5.vel[1] = speed * Math.sin(angle);
        //the worker
        p.mojoh5.step=function(){
          p.mojoh5.vel[1] += gravity[1];
          p.x += p.mojoh5.vel[0];
          p.y += p.mojoh5.vel[1];
          if(p.scale.x - p.mojoh5.scaleSpeed > 0){
            p.scale.x -= p.mojoh5.scaleSpeed;
          }
          if(p.scale.y - p.mojoh5.scaleSpeed > 0){
            p.scale.y -= p.mojoh5.scaleSpeed;
          }
          p.rotation += p.mojoh5.angVel;
          p.alpha -= p.mojoh5.alphaSpeed;
          if(p.alpha <= 0){
            _.disj(pBag,p);
            container.removeChild(p);
          }
        };
      };
      for(let gap = (maxAngle-minAngle)/(particles-1),
          a=minAngle,i=0;
          i<particles; ++i){
        _make(random ? _.randFloat(minAngle, maxAngle) : a);
        a += gap;
      }
      let o=new Particles(pBag);
      return _.conj(WIPDust,o) && o;
    };

    return (Mojo.Effects= _T)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Effects"]=function(Mojo){
    return Mojo.Effects ? Mojo.Effects : _module(Mojo, [], [])
  };

})(this);


