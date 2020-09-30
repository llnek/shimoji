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
  function _module(Mojo, WIPTweens){
    const Core=global["io.czlab.mcfud.core"]();
    const _M=global["io.czlab.mcfud.math"]();
    const TWO_PI= Math.PI*2;
    const PI_2= Math.PI/2;
    const _S=Mojo.Sprites;
    const is=Core.is;
    const _=Core.u;
    const _T={
      SMOOTH:function(x){ return 3*x*x - 2*x*x*x },
      SMOOTH_QUAD:function(x){let n= _T.SMOOTH(x); return n*n},
      SMOOTH_CUBIC:function(x){let n= _T.SMOOTH(x); return n*n*n},
      EASE_IN_CUBIC:function(x){ return x*x*x },
      EASE_OUT_CUBIC:function(x){ let n=1-x; return 1 - n*n*n },
      EASE_INOUT_CUBIC:function(x){
        if(x < 0.5){ return 4*x*x*x }else{
          let n= -2*x+2; return 1- n*n*n/2
        }
      },
      EASE_IN_QUAD:function(x){ return x*x },
      EASE_OUT_QUAD:function(x){ return 1 - (1-x) * (1-x) },
      EASE_INOUT_QUAD:function(x){
        if(x < 0.5){ return 2*x*x }else{
          let n= -2*x+2; return 1 - n*n/2
        }
      },
      EASE_IN_SINE:function(x){ return 1 - Math.cos(x * PI_2) },
      EASE_OUT_SINE:function(x){ return Math.sin(x * PI_2) },
      EASE_INOUT_SINE:function(x){ return 0.5 - Math.cos(x * Math.PI)/2 },
      SPLINE:function(t, a, b, c, d){
        return 0.5 * (2*b + (c-a)*t +
                     (2*a - 5*b + 4*c - d)*t*t +
                     (-a + 3*b - 3*c + d)*t*t*t)
      },
      CUBIC_BEZIER:function(t, a, b, c, d){
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
      play(){ this.active = true }
      stop(){ this.active = false }
      _initStart(){
        _.conj(WIPTweens,this);
        this.active = true;
        this.fcount = 0;
      }
      _initEnd(){
        this.active = false;
        this.onComplete && this.onComplete();
        _.disj(WIPTweens,this);
      }
    }
    /**
     * @public
     * @function
     */
    _T.tweenAlpha=function(sprite,type,endA,frames=60,bouncy=false,delay=0){
      let t= _.inject(new Tween(sprite,type),{
        //overrides
        start:function(sa,ea){
          this._initStart();
          this.sa= sa;
          this.ea=ea;
          return this;
        },
        step:function(){
          if(this.active){
            if(this.fcount < frames){
              this.sprite.alpha=_M.lerp(this.sa,
                                        this.ea,
                                        this.easing(this.fcount/frames));
              this.fcount += 1;
            }else{
              this.end();
            }
          }
          return this;
        },
        end:function(){
          this.sprite.alpha= this.ea;
          this._initEnd();
          if(bouncy)
            _.timer(() => this.start(this.ea,this.sa), delay);
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
    _T.tweenScale=function(sprite,type,endX,endY,frames=60,bouncy=false,delay=0){
      let t= _.inject(new Tween(sprite,type),{
        //overrides
        start:function(sx,ex,sy,ey){
          this._initStart();
          this.sx= sx;
          this.ex=ex;
          this.sy=sy;
          this.ey=ey;
          return this;
        },
        onFrame:function(perc){
          let dt=this.easing(perc);
          if(is.num(this.ex) &&
             is.num(this.sx))
            this.sprite.scale.x= _M.lerp(this.sx, this.ex, dt);
          if(is.num(this.ey) &&
             is.num(this.sy))
            this.sprite.scale.y= _M.lerp(this.sy, this.ey, dt);
        },
        step:function(){
          if(this.active){
            if(this.fcount < frames){
              this.onFrame(this.fcount/frames);
              this.fcount += 1;
            }else{
              this.end();
            }
          }
          return this;
        },
        end:function(){
          if(is.num(this.ex) &&
             is.num(this.sx))
            this.sprite.scale.x= this.ex;
          if(is.num(this.ey) &&
             is.num(this.sy))
            this.sprite.scale.y= this.ey;
          this._initEnd();
          if(bouncy)
            _.timer(() => this.start(this.ex,this.sx,this.ey,this.sy), delay);
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
    _T.tweenPosition=function(sprite,type,endX,endY,frames=60,bouncy=false,delay=0){
      let t= _.inject(new Tween(sprite,type), {
        //overrides
        start:function(sx,ex,sy,ey){
          this._initStart();
          this.sx= sx;
          this.ex=ex;
          this.sy=sy;
          this.ey=ey;
          return this;
        },
        step:function(){
          if(this.active){
            if(this.fcount < frames){
              let dt=this.easing(this.fcount/frames);
              if(is.num(this.sx) &&
                 is.num(this.ex))
                this.sprite.x=_M.lerp(this.sx, this.ex, dt);
              if(is.num(this.sy) &&
                 is.num(this.ey))
                this.sprite.y=_M.lerp(this.sy, this.ey, dt);
              this.fcount += 1;
            }else{
              this.end();
            }
          }
          return this;
        },
        end:function(){
          if(is.num(this.sx) &&
             is.num(this.ex))
            this.sprite.x= this.ex;
          if(is.num(this.sy) &&
             is.num(this.ey))
            this.sprite.y= this.ey;
          this._initEnd();
          if(bouncy)
            _.timer(() => this.start(this.ex,this.sx,this.ey,this.sy), delay);
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
    class CompositeTween{
      constructor(...ts){
        this.completionCounter=0;
        let CF= () => {
          if(++this.completionCounter === this.size()){
            this.onComplete && this.onComplete();
            this.completionCounter = 0;
          }
        };
        this.children= ts.map(t => {
          t.onComplete=CF;
          return t;
        });
      }
      size(){ return this.children.length }
      stop(){
        _.doseq(this.children, c => c.stop())
      }
      play(){
        _.doseq(this.children, c => c.play())
      }
      dispose(){
        _.doseq(this.children, c => _.disj(WIPTweens,c))
      }
    }
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
    _T.slide=function(sprite, type, endX, endY, frames = 60, bouncy = false, delay= 0){
      return this.tweenPosition(sprite,type,endX,endY,frames,bouncy,delay)
    };
    /**
     * @public
     * @function
     */
    _T.breathe=function(sprite, endX = 0.8, endY = 0.8,
                        frames = 60, bouncy = true, delay= 0){
      return this.tweenScale(sprite, this.SMOOTH_QUAD,endX,endY,frames,bouncy,delay)
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
                       frames = 10, bouncy = true, delay= 0){
      return this.tweenScale(sprite,
                             (v)=> _T.SPLINE(v,startControl,0,1,endControl),
                             scale,scale,frames,bouncy,delay)
    };
    /**
     * @public
     * @function
     */
    _T.wobble= function(sprite, scaleX = 1.2, scaleY = 1.2, frames = 10,
                        xStartControl = 10, xEndControl = 10,
                        yStartControl = -10, yEndControl = -10,
                        friction = 0.98, bouncy = true, delay= 0){
      let tx= this.tweenScale(sprite,(v)=>_T.SPLINE(v,xStartControl,0,1,xEndControl),
                              scaleX, null, frames,bouncy,delay);
      let ty= this.tweenScale(sprite,(v)=>_T.SPLINE(v,yStartControl,0,1,yEndControl),
                              null,scaleY, frames,bouncy,delay);
      let ct= new CompositeTween(tx,ty);
      tx.onComplete=function(){
        if(this.ex > 1){
          this.ex *= friction;
          if(this.ex <= 1){ this.ex=1; _T.removeTween(this) }
        }
      };
      ty.onComplete=function(){
        if(this.ey > 1){
          this.ey *= friction;
          if(this.ey <= 1){ this.ey=1; _T.removeTween(this) }
        }
      };
      return ct;
    };
    /**
     * @public
     * @function
     */
    _T.followCurve=function(sprite, type, wayPoints, frames, bouncy = false, delay= 0){
      let t= _.inject(new Tween(sprite,_T.SMOOTH), {
        start:function(points){
          this._initStart();
          this.wayPoints = points;
          return this;
        },
        step:function(){
          if(this.active){
            if(this.fcount < frames){
              let alpha= this.easing(this.fcount/frames);
              let p = this.wayPoints;
              _S.setXY(sprite, _T.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                               _T.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1]));
              this.fcount += 1;
            }else{
              this.end();
            }
          }
          return this;
        },
        end:function(){
          this._initEnd();
          if(bouncy)
            _timer(() => this.start(this.wayPoints.reverse()), delay);
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
                         loop = false, bouncy = false, delay = 0){
      function _makePath(cur,frames){
        let t= _T.tweenPosition(sprite,type,[wayPoints[cur][0], wayPoints[cur+1][0]],
                                            [wayPoints[cur][1], wayPoints[cur+1][1]],frames);
        t.onComplete=function(){
          if(++cur < wayPoints.length-1){
            _.timer(() => { _makePath(cur,frames) }, delay);
          }else if(loop){
            if(bouncy) wayPoints.reverse();
            _.timer(() => {
              _S.setXY(sprite, wayPoints[0][0], wayPoints[0][1]);
              _makePath(0,frames);
            },delay);
          }
        };
        return t;
      }
      return _makePath(0, totalFrames / wayPoints.length)
    };
    /** Make object appear to walk in a curved path.
     * @public
     * @function
     */
    _T.walkCurve=function(sprite,
                          type,
                          wayPoints,
                          totalFrames = 300,
                          loop = false, bouncy = false, delay= 0){
      function _makePath(cur,frames){
        let t=_T.followCurve(sprite, type, wayPoints[cur], frames);
        t.onComplete=function(){
          if(++cur < wayPoints.length){
            _.timer(() => _makePath(cur,frames), delay);
          }else if(loop){
            if(bouncy)
              _.doseq(wayPoints.reverse(),c => c.reverse());
            _.timer(()=>{
              _S.setXY(sprite, wayPoints[0][0], wayPoints[0][1]);
              _makePath(0,frames);
            },delay);
          }
        };
        return t;
      }
      return _makePath(0, totalFrames / wayPoints.length)
    };
    /**
     * @public
     * @function
     */
    _T.removeTween=function(t){
      t.stop();
      t instanceof CompositeTween ? t.dispose() : _.disj(Tween.instances,t)
    };
    /**
     * @public
     * @function
     */
    _T.update=function(dt){
      _.rseq(WIPTweens, t => t.step(dt))
    };

    return (Mojo.Tweens= _T)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Tweens"]=function(Mojo){
    return Mojo.Tweens ? Mojo.Tweens : _module(Mojo, [])
  };

})(this);


