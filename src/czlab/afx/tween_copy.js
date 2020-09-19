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
   * @public
   * @function
   */
  global["io.czlab.mojoh5.Tweens"]=function(Mojo){
    if(Mojo.Tweens) { return Mojo.Tweens }
    const Core=global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const is=Core.is;
    const _T= {};
    const _globalTweens = [];
    const _easingFormulas = {
      linear: (x) => { return x },
      smoothstep: (x) => { return x * x * (3 - 2 * x) },
      smoothstepSquared: (x) => { return Math.pow((x * x * (3 - 2 * x)), 2) },
      smoothstepCubed: (x) => { return Math.pow((x * x * (3 - 2 * x)), 3) },
      acceleration: (x) => { return x * x },
      accelerationCubed: (x) => { return Math.pow(x * x, 3) },
      deceleration: (x) => { return 1 - Math.pow(1 - x, 2) },
      decelerationCubed: (x) => { return 1 - Math.pow(1 - x, 3) },
      sine: (x) => { return Math.sin(x * Math.PI / 2) },
      sineSquared: (x) => { return Math.pow(Math.sin(x * Math.PI / 2), 2) },
      sineCubed: (x) => { return Math.pow(Math.sin(x * Math.PI / 2), 2) },
      inverseSine: (x) => { return 1 - Math.sin((1 - x) * Math.PI / 2) },
      inverseSineSquared: (x) => { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2) },
      inverseSineCubed: (x) => { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3) },
      spline: (t, p0, p1, p2, p3) => {
        return 0.5 * ((2 * p1) + (-p0 + p2) * t +
                      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
      },
      cubicBezier: (t, a, b, c, d) => {
        let t2 = t * t;
        let t3 = t2 * t;
        return a + (-a * 3 + t * (3 * a - a * t)) * t +
          (3 * b + t * (-6 * b + b * 3 * t)) * t +
          (c * 3 - c * 3 * t) * t2 + d * t3;
      }
    };
    /**
     * @private
     * @function
     */
    function _tweenFuncs(sprite, property, startValue, endValue, totalFrames,
                         easingType = "smoothstep",
                         yoyo = false,
                         delayRepeat = 0){
      const typeArray = easingType.split(" ");
      const o={
        start: function(startValue, endValue){
          o.totalFrames = totalFrames;
          o.startValue = startValue;
          o.endValue = endValue;
          o.playing = true;
          o.frameCounter = 0;
          _.conj(_globalTweens,o);
        },
        update: function(dt){
          if(o.playing){
            if(o.frameCounter < o.totalFrames){
              let t = o.frameCounter / o.totalFrames; // normalize it
              let curvedTime= (typeArray[0] !== "bounce") ? _easingFormulas[easingType](t)
                                                          : _easingFormulas.spline(easingType, o.startMagnitude, 0, 1, o.endMagnitude);
              //interpolate the sprite's property based on the curve
              let pv= (o.endValue * curvedTime) + (o.startValue * (1-curvedTime));
              is.fun(property) ? property(pv) : (sprite[property] = pv);
              o.frameCounter += 1;
            }else{
              let pv= o.endValue;
              is.fun(property) ? property(pv) : (sprite[property] = pv);
              o.end();
            }
          }
        },
        end: function(){
          o.playing = false;
          o.onComplete && o.onComplete();
          _.disj(_globalTweens,o);
          //if yoyo, create a new tween using the same values, but flip the startValue and endValue
          yoyo && _T.wait(delayRepeat).then(() => o.start(o.endValue, o.startValue))
        },
        play: () => { o.playing = true },
        pause: () => { o.playing = false }
      };
      //if tween is a bounce type(spline), set the start and end values
      if(typeArray[0] === "bounce"){
        _.assert(typeArray.length > 2);
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      o.start(startValue, endValue);
      return o;
    }
    /**
     * For making complex tweens.
     * @public
     * @function
     */
    _T.makeTween= function(tweenDecls){
      let _completionCounter = 0;
      const o = {
        tweens: [],
        play: () => { o.tweens.forEach(t => t.playing = true) },
        pause: () => { o.tweens.forEach(t => t.playing = false) }
      };
      function _done(){
        if(++_completionCounter === o.tweens.length){
          o.onComplete && o.onComplete();
          _completionCounter = 0;
        }
      }
      for(let t,i=0; i<tweenDecls.length; ++i){
        t= _tweenFuncs(...tweenDecls[i]);
        t.onComplete= _done;
        o.tweens.push(t);
      }
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.fadeOut= function(sprite, frames = 60){
      return _tweenFuncs(sprite, "alpha", sprite.alpha, 0, frames, "sine")
    };
    /**
     * @public
     * @function
     */
    _T.fadeIn= function(sprite, frames = 60){
      return _tweenFuncs(sprite, "alpha", sprite.alpha, 1, frames, "sine")
    };
    /**
     * Fades the sprite in and out at a steady rate.
     * Set `minAlpha` to non-zero to prevent the sprite to fade away completely.
     *
     * @public
     * @function
     */
    _T.pulse=function(sprite, frames = 60, minAlpha = 0){
      return _tweenFuncs(sprite, "alpha", sprite.alpha, minAlpha, frames, "smoothstep", true)
    };
    /**
     * @public
     * @function
     */
    _T.slide=function(sprite, endX, endY, frames = 60,
                      easingType = "smoothstep", yoyo = false, delayRepeat = 0){
      return this.makeTween([[sprite, "x", sprite.x, endX, frames, easingType, yoyo, delayRepeat],
                             [sprite, "y", sprite.y, endY, frames, easingType, yoyo, delayRepeat]])
    };
    /**
     * @private
     * @function
     */
    function __sx(s){
      return function(v){
        s.scale.x=v
      }
    }
    /**
     * @private
     * @function
     */
    function __sy(s){
      return function(v){
        s.scale.y=v
      }
    }
    /**
     * @public
     * @function
     */
    _T.breathe=function(sprite, endScaleX = 0.8, endScaleY = 0.8,
                        frames = 60, yoyo = true, delayRepeat = 0){
      return this.makeTween([
        [sprite, __sx(sprite), sprite.scale.x, endScaleX, frames, "smoothstepSquared", yoyo, delayRepeat],
        [sprite, __sy(sprite), sprite.scale.y, endScaleY, frames, "smoothstepSquared", yoyo, delayRepeat]
      ])
    };
    /**
     * @public
     * @function
     */
    _T.scale=function(sprite, endScaleX = 0.5, endScaleY = 0.5, frames = 60){
      return this.makeTween([
        [sprite, __sx(sprite), sprite.scale.x, endScaleX, frames, "smoothstep", false],
        [sprite, __sy(sprite), sprite.scale.y, endScaleY, frames, "smoothstep", false]
      ])
    };
    /**
     * @public
     * @function
     */
    _T.strobe=function(sprite, scaleFactor = 1.3,
                       startMagnitude = 10, endMagnitude = 20,
                       frames = 10, yoyo = true, delayRepeat = 0){
      let bounce = "bounce " + startMagnitude + " " + endMagnitude;
      return this.makeTween([
        [sprite, __sx(sprite), sprite.scale.x, scaleFactor, frames, bounce, yoyo, delayRepeat],
        [sprite, __sy(sprite), sprite.scale.y, scaleFactor, frames, bounce, yoyo, delayRepeat]
      ])
    };
    /**
     * @public
     * @function
     */
    _T.wobble= function(sprite, scaleFactorX = 1.2, scaleFactorY = 1.2,
                        frames = 10, xStartMagnitude = 10, xEndMagnitude = 10,
                        yStartMagnitude = -10, yEndMagnitude = -10,
                        friction = 0.98, yoyo = true, delayRepeat = 0) {
      let bounceX = "bounce " + xStartMagnitude + " " + xEndMagnitude;
      let bounceY = "bounce " + yStartMagnitude + " " + yEndMagnitude;
      let o = this.makeTween([
        [sprite, __sx(sprite), sprite.scale.x, scaleFactorX, frames, bounceX, yoyo, delayRepeat],
        [sprite, __sy(sprite), sprite.scale.y, scaleFactorY, frames, bounceY, yoyo, delayRepeat]
      ]);
      //add some friction to the `endValue` at the end of each tween
      o.tweens.forEach(tween => {
        tween.onComplete = function(){
          if(tween.endValue > 1){
            tween.endValue *= friction;
            if(tween.endValue <= 1){
              tween.endValue = 1;
              _T.removeTween(tween);
            }
          }
        };
      });
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.followCurve=function(sprite, pointsArray, totalFrames,
                            easingType = "smoothstep", yoyo = false, delayRepeat = 0){
      //If the tween is a bounce type (a spline), set the start and end magnitude values
      let typeArray = easingType.split(" ");
      const o = {
        //Use `tween.start` to make a new tween using the current end point values
        start: function(pointsArray){
          o.pointsArray = pointsArray;
          o.totalFrames = totalFrames;
          o.playing = true;
          o.frameCounter = 0;
          _.conj(_globalTweens,o);
        },
        update: function(){
          if(o.playing){
            if(o.frameCounter < o.totalFrames){
              let t = o.frameCounter / o.totalFrames;
              let curvedTime= typeArray[0] !== "bounce" ? _easingFormulas[easingType](t)
                                                        : _easingFormulas.spline(t, o.startMagnitude, 0, 1, o.endMagnitude);
              //apply the Bezier curve to the sprite's position
              let p = o.pointsArray;
              sprite.x = _easingFormulas.cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
              sprite.y = _easingFormulas.cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);
              o.frameCounter += 1;
            } else {
              o.end();
            }
          }
        },
        end: function(){
          o.playing = false;
          o.onComplete && o.onComplete();
          _.disj(_globalTweens,o);
          yoyo && _T.wait(delayRepeat).then(() => o.start(o.pointsArray.reverse()));
        },
        pause: () => { o.playing = false },
        play: () => { o.playing = true }
      };
      if(typeArray[0] === "bounce"){
        _.assert(typeArray.length>2);
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      o.start(pointsArray);
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.walkPath=function(sprite,
                         originalPathArray, //A 2D array of waypoints
                         totalFrames = 300, //The duration, in frames
                         easingType = "smoothstep", //The easing type
                         loop = false,
                         yoyo = false, //Shoud the direction reverse?
                         delaySectionMillis = 0){
      let pathArray = originalPathArray;
      let frames = totalFrames / pathArray.length;
      //let currentPoint = 0;
      //create a single tween between two points and
      //then schedules the next path to be made after it
      function _makePath(currentPoint){
        let tween = _T.makeTween([
          [sprite, "x", pathArray[currentPoint][0], pathArray[currentPoint+1][0], frames, easingType],
          [sprite, "y", pathArray[currentPoint][1], pathArray[currentPoint+1][1], frames, easingType]
        ]);
        tween.onComplete = function(){
          //if the sprite hasn't reached the end of the path, tween the sprite to the next point
          if(++currentPoint < pathArray.length-1){
            _T.wait(delaySectionMillis).then(() => _makePath(currentPoint));
          }else{
            //at the end of the path, optionally loop and yoyo it,
            //reverse the path if `loop` is `true`
            if(loop){
              if(yoyo) pathArray.reverse();
              _T.wait(delaySectionMillis).then(() => {
                currentPoint = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                _makePath(currentPoint);
              });
            }
          }
        };
        return tween;
      }
      return _makePath(0);
    };
    /**
     * @public
     * @function
     */
    _T.walkCurve=function(sprite,
                          pathArray, //2D array of Bezier curves
                          totalFrames = 300, //The duration, in frames
                          easingType = "smoothstep",
                          loop = false,
                          yoyo = false,
                          delayContinueMillis = 0){
      let frames = totalFrames / pathArray.length;
      function _makePath(currentCurve){
        let tween = _T.followCurve(sprite, pathArray[currentCurve], frames, easingType);
        tween.onComplete = function(){
          if(++currentCurve < pathArray.length){
            _T.wait(delayContinueMillis).then(() => _makePath(currentCurve));
          }else{
            //at the end of the path, optionally loop and reverse it
            if(loop){
              yoyo && pathArray.reverse().forEach(c => c.reverse());
              _T.wait(delayContinueMillis).then(() => {
                currentCurve = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                _makePath(currentCurve);
              });
            }
          }
        };
        return tween;
      };
      return _makePath(0);
    };
    /**
     * @public
     * @function
     */
    _T.wait=function(duration = 0){
      return new Promise((resolve, reject) => _.timer(resolve, duration))
    };
    /**
     * @public
     * @function
     */
    _T.removeTween=function(tweenObject){
      tweenObject.pause();
      if(!tweenObject.tweens){
        _.disj(_globalTweens,tweenObject);
      }else{
        tweenObject.tweens.forEach(e => _.disj(_globalTweens,e));
      }
    };
    /**
     * @public
     * @function
     */
    _T.update=function(){
      if(_globalTweens.length > 0)
        for(let t,i=_globalTweens.length-1; i >= 0; --i){
          t= _globalTweens[i];
          t && t.update();
        }
    };

    return (Mojo.Tweens = _T)
  };

})(this);


