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
  function _module(Mojo, GlobalTweens){
    const Core=global["io.czlab.mcfud.core"]();
    const is=Core.is;
    const _=Core.u;
    const _T= {};
    class EasingFormula{
      linear(x) { return x }
      smoothstep(x) { return x * x * (3 - 2 * x) }
      smoothstepSquared(x) { return Math.pow((x * x * (3 - 2 * x)), 2) }
      smoothstepCubed(x) { return Math.pow((x * x * (3 - 2 * x)), 3) }
      acceleration(x) { return x * x }
      accelerationCubed(x) { return Math.pow(x * x, 3) }
      deceleration(x) { return 1 - Math.pow(1 - x, 2) }
      decelerationCubed(x) { return 1 - Math.pow(1 - x, 3) }
      sine(x) { return Math.sin(x * Math.PI / 2) }
      sineSquared(x) { return Math.pow(Math.sin(x * Math.PI / 2), 2) }
      sineCubed(x) { return Math.pow(Math.sin(x * Math.PI / 2), 2) }
      inverseSine(x) { return 1 - Math.sin((1 - x) * Math.PI / 2) }
      inverseSineSquared(x) { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2) }
      inverseSineCubed(x) { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3) }
      spline(t, p0, p1, p2, p3) {
        return 0.5 * ((2 * p1) + (-p0 + p2) * t +
                      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
      }
      cubicBezier(t, a, b, c, d) {
        let t2 = t * t;
        let t3 = t2 * t;
        return a + (-a * 3 + t * (3 * a - a * t)) * t +
          (3 * b + t * (-6 * b + b * 3 * t)) * t +
          (c * 3 - c * 3 * t) * t2 + d * t3;
      }
    }
    const _EFS = new EasingFormula();
    /**
     * Used as the foundation for the the higher level tween methods.
     * @private
     * @function
     */
    function _tweenDecl(sprite, property,
                        startValue, endValue, totalFrames,
                        type = "smoothstep", yoyo = false, delayRepeat = 0){
      let o = {};
      //if tween is a bounce type(spline), set the start and end values
      let typeArray = type.split(" ");
      if(typeArray[0] === "bounce"){
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      o.start = function(startValue, endValue){
        //clone the start and end values so that any possible references to sprite
        //properties are converted to ordinary numbers
        o.totalFrames = totalFrames;
        o.startValue = startValue;
        o.endValue = endValue;
        o.playing = true;
        o.frameCounter = 0;
        _.conj(GlobalTweens,o);
      };
      //The `update` method will be called on each frame by the game loop.
      //This is what makes the tween move
      o.update=function(dt){
        let pv, time, curvedTime;
        if(o.playing){
          //if the elapsed frames are less than the total frames,
          //use the tweening formulas to move the sprite
          if(o.frameCounter < o.totalFrames){
            let t = o.frameCounter / o.totalFrames;
            curvedTime=
              typeArray[0] !== "bounce" ? _EFS[type](t)
                                        : _EFS.spline(t, o.startMagnitude, 0, 1, o.endMagnitude);
            //interpolate the sprite's property based on the curve
            pv= (o.endValue * curvedTime) + (o.startValue * (1 - curvedTime));
            is.fun(property) ? property(pv) : (sprite[property] = pv);
            o.frameCounter += 1;
          }else{
            pv= o.endValue;
            is.fun(property) ? property(pv) : (sprite[property] = pv);
            o.end();
          }
        }
      };
      o.end=function(){
        o.playing = false;
        o.onComplete && o.onComplete();
        _.disj(GlobalTweens,o);
        //create a new tween using the same values,
        //but use the current tween's `startValue`
        //as the next tween's `endValue`
        if(yoyo)
          _.timer(() => o.start(o.endValue, o.startValue), delayRepeat);
      };
      o.play = () => { o.playing = true };
      o.pause = () => { o.playing = false };
      o.start(startValue, endValue);
      return o;
    }
    /**
     * A general low-level method for making complex tweens
     * out of multiple `tweenDecl` functions. Its one argument,
     * `tweensToAdd` is an array containing multiple `tweenProperty` calls
     * @public
     * @function
     */
    _T.makeTween=function(tweensToAdd){
      let completionCounter = 0;
      let o = { tweens: [] };
      function f(){ o.completed() }
      tweensToAdd.forEach(p => _.conj(o.tweens, _tweenDecl(...p)));
      o.completed=function(){
        if(++completionCounter === o.tweens.length){
          o.onComplete && o.onComplete();
          completionCounter = 0;
        }
      };
      _.doseq(o.tweens, t => t.onComplete=f);
      o.pause= () => { _.doseq(o.tweens, t => t.playing=false) };
      o.play=() => { _.doseq(o.tweens, t => t.playing=true) };
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.fadeOut=function(sprite, frames = 60){
      return _tweenDecl(sprite, "alpha", sprite.alpha, 0, frames, "sine");
    };
    /**
     * @public
     * @function
     */
    _T.fadeIn=function(sprite, frames = 60){
      return _tweenDecl(sprite, "alpha", sprite.alpha, 1, frames, "sine");
    };
    /**
     * Fades the sprite in and out at a steady rate.
     * @public
     * @function
     * @param minAlpha greater than 0 if you
     *                 don't want the sprite to fade away completely.
     */
    _T.pulse=function(sprite, frames = 60, minAlpha = 0){
      return _tweenDecl(sprite, "alpha", sprite.alpha, minAlpha, frames, "smoothstep", true);
    };
    /**
     * @public
     * @function
     */
    _T.slide=function(sprite, endX, endY,
                      frames = 60, type = "smoothstep",
                      yoyo = false, delayRepeat = 0){
      return this.makeTween([
        [sprite, "x", sprite.x, endX, frames, type, yoyo, delayRepeat],
        [sprite, "y", sprite.y, endY, frames, type, yoyo, delayRepeat]
      ]);
    };
    /**
     * @private
     * @function
     */
    function _SX(s){ return (v) => s.scale.x=v }
    /**
     * @private
     * @function
     */
    function _SY(s){ return (v) => s.scale.y=v }
    /**
     * @public
     * @function
     */
    _T.breathe=function(sprite, endScaleX = 0.8, endScaleY = 0.8,
                        frames = 60, yoyo = true, delayRepeat = 0){
      return this.makeTween([
        [sprite, _SX(sprite), sprite.scale.x, endScaleX, frames, "smoothstepSquared", yoyo, delayRepeat],
        [sprite, _SY(sprite), sprite.scale.y, endScaleY, frames, "smoothstepSquared", yoyo, delayRepeat]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.scale=function(sprite, endScaleX = 0.5, endScaleY = 0.5, frames = 60){
      return this.makeTween([
        [sprite, _SX(sprite), sprite.scale.x, endScaleX, frames, "smoothstep", false],
        [sprite, _SY(sprite), sprite.scale.y, endScaleY, frames, "smoothstep", false]
      ]);
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
        [sprite, _SX(sprite), sprite.scale.x, scaleFactor, frames, bounce, yoyo, delayRepeat],
        [sprite, _SY(sprite), sprite.scale.y, scaleFactor, frames, bounce, yoyo, delayRepeat]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.wobble= function(sprite, scaleFactorX = 1.2, scaleFactorY = 1.2, frames = 10,
                        xStartMagnitude = 10, xEndMagnitude = 10,
                        yStartMagnitude = -10, yEndMagnitude = -10,
                        friction = 0.98, yoyo = true, delayRepeat = 0){
      let bounceX = "bounce " + xStartMagnitude + " " + xEndMagnitude;
      let bounceY = "bounce " + yStartMagnitude + " " + yEndMagnitude;
      let o = this.makeTween([
        [sprite, _SX(sprite), sprite.scale.x, scaleFactorX, frames, bounceX, yoyo, delayRepeat],
        [sprite, _SY(sprite), sprite.scale.y, scaleFactorY, frames, bounceY, yoyo, delayRepeat]
      ]);
      _.doseq(o.tweens,t=> {
        t.onComplete=function(){
          if(t.endValue > 1){
            t.endValue *= friction;
            if(t.endValue <= 1){
              t.endValue = 1;
              _T.removeTween(t);
            }
          }
        }
      });
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.followCurve=function(sprite, pointsArray, totalFrames,
                            type = "smoothstep", yoyo = false, delayRepeat = 0){
      let typeArray = type.split(" ");
      let o = {};
      if(typeArray[0] === "bounce"){
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      o.start=function(pointsArray){
        o.pointsArray = pointsArray;
        o.totalFrames = totalFrames;
        o.frameCounter = 0;
        o.playing = true;
        _.conj(GlobalTweens,o);
      };
      o.update=function(){
        let time, curvedTime, p = o.pointsArray;
        if(o.playing){
          if(o.frameCounter < o.totalFrames){
            time = o.frameCounter / o.totalFrames;
            curvedTime=
              typeArray[0] !== "bounce" ? _EFS[type](time)
                                        : _EFS.spline(time, o.startMagnitude, 0, 1, o.endMagnitude);
            sprite.x = _EFS.cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
            sprite.y = _EFS.cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);
            o.frameCounter += 1;
          }else{
            o.end();
          }
        }
      };
      o.end=function(){
        o.playing = false;
        o.onComplete && o.onComplete();
        _.disj(GlobalTweens,o);
        if(yoyo)
          _timer(() => o.start(o.pointsArray.reverse()),delayRepeat);
      };
      o.pause = () => { o.playing = false };
      o.play = () => { o.playing = true };
      o.start(pointsArray);
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.walkPath=function(sprite,
                         originalPathArray, //a 2D array of waypoints
                         totalFrames = 300,
                         type = "smoothstep",
                         loop = false,
                         yoyo = false,
                         delayPerSections = 0){
      let pathArray = originalPathArray;
      let frames = totalFrames / pathArray.length;
      //set the current point to 0, which will be the first waypoint
      let currentPoint = 0;
      //The `makePath` function creates a single tween between two points and
      //then schedules the next path to be made after it
      function _makePath(currentPoint){
        let tween = _T.makeTween([
          [sprite, "x",
           pathArray[currentPoint][0],
           pathArray[currentPoint + 1][0], frames, type],
          [sprite, "y",
           pathArray[currentPoint][1],
           pathArray[currentPoint + 1][1], frames, type]
        ]);
        tween.onComplete=function(){
          if(++currentPoint < pathArray.length-1){
            _.timer(() => {
              tween = _makePath(currentPoint)
            },delayPerSections);
          }else{
            if(loop){
              if(yoyo) pathArray.reverse();
              _.timer(() => {
                //restart at the first point
                currentPoint = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                tween = _makePath(currentPoint);
              },delayPerSections);
            }
          }
        };
        return tween;
      }
      return _makePath(currentPoint);
    };
    /**
     * @public
     * @function
     */
    _T.walkCurve=function(sprite,
                          pathArray, //2D array of Bezier curves
                          totalFrames = 300,
                          type = "smoothstep",
                          loop = false,
                          yoyo = false,
                          delayContinue = 0){
      let frames = totalFrames / pathArray.length;
      let currentCurve = 0;
      function _makePath(currentCurve){
        let tween = _T.followCurve(sprite, pathArray[currentCurve], frames, type);
        tween.onComplete=function(){
          if(++currentCurve < pathArray.length){
            _.timer(() => {
              tween = _makePath(currentCurve)
            },delayContinue);
          }else{
            if(loop){
              if(yoyo)
                _.doseq(pathArray.reverse(),c=> c.reverse());
              _.timer(() => {
                currentCurve = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                tween = _makePath(currentCurve);
              },delayContinue);
            }
          }
        };
        return tween;
      }
      return _makePath(currentCurve);
    };
    _T.XXXwait=function(duration = 0){
      return new Promise((resolve, reject) => {
        _.timer(resolve, duration);
      });
    };
    /**
     * @public
     * @function
     */
    _T.removeTween=function(tweenObject){
      tweenObject.pause();
      if(!tweenObject.tweens){
        _.disj(GlobalTweens,tweenObject);
      }else{
        _.doseq(tweenObject.tweens,e => _.disj(GlobalTweens,e));
      }
    };
    /**
     * @public
     * @function
     */
    _T.update=function(){
      if(GlobalTweens.length > 0)
        for(let t,i=GlobalTweens.length-1; i >= 0; --i){
          t= GlobalTweens[i];
          if(t) t.update();
        }
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


