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

(function(global,undefined){
  "use strict";
  const window=global;
  const MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Tween=function(Mojo){
    const _T= {};
    const _=Mojo.u;
    const is=Mojo.is;
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
     * The low level `tweenProperty` function is used as the foundation
     * for the the higher level tween methods.
     * @private
     * @function
     */
    function _tweenProperty(sprite, property, startValue, endValue, totalFrames,
                            type = "smoothstep", //The easing type
                            yoyo = false, //Yoyo?
                            delayBeforeRepeat = 0){ //Delay in frames before repeating
      let o = {};
      //if tween is a bounce type(spline), set the start and end values
      let typeArray = type.split(" ");
      if(typeArray[0] === "bounce"){
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      o.start = function(startValue, endValue){
        //Clone the start and end values so that any possible references to sprite
        //properties are converted to ordinary numbers
        o.startValue = _.unpack(_.pack(startValue));
        o.endValue = _.unpack(_.pack(endValue));
        o.playing = true;
        o.totalFrames = totalFrames;
        o.frameCounter = 0;
        _.conj(_globalTweens,o);
      };
      o.start(startValue, endValue);
      //The `update` method will be called on each frame by the game loop.
      //This is what makes the tween move
      o.update = function(dt){
        let time, curvedTime;
        if(o.playing){
          //If the elapsed frames are less than the total frames,
          //use the tweening formulas to move the sprite
          if(o.frameCounter < o.totalFrames){
            let normalizedTime = o.frameCounter / o.totalFrames;
            //Select the correct easing function from the
            //`ease` object’s library of easing functions
            //If it's not a spline, use one of the ordinary easing functions
            if(typeArray[0] !== "bounce"){
              curvedTime = _easingFormulas[type](normalizedTime);
            }else{
              //If it's a spline, use the `spline` function and apply the
              //2 additional `type` array values as the spline's start and
              //end points
              curvedTime = _easingFormulas.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
            }
            //Interpolate the sprite's property based on the curve
            sprite[property] = (o.endValue * curvedTime) + (o.startValue * (1 - curvedTime));
            o.frameCounter += 1;
          }else{
            //When the tween has finished playing, run the end tasks
            sprite[property] = o.endValue;
            o.end();
          }
        }
      };
      o.end = function(){
        o.playing = false;
        o.onComplete && o.onComplete();
        _.disj(_globalTweens,o);
        //If the tween's `yoyo` property is `true`, create a new tween
        //using the same values, but use the current tween's `startValue`
        //as the next tween's `endValue`
        if(yoyo)
          _T.wait(delayBeforeRepeat).then(() => o.start(o.endValue, o.startValue));
      };
      o.play = function(){ o.playing = true;};
      o.pause = function(){ o.playing = false;};
      return o;
    }
    /**
     * A general low-level method for making complex tweens
     * out of multiple `tweenProperty` functions. Its one argument,
     * `tweensToAdd` is an array containing multiple `tweenProperty` calls
     * @public
     * @function
     */
    _T.makeTween= function(tweensToAdd){
      let o = { tweens: [] };
      tweensToAdd.forEach(tprop => _.conj(o.tweens, _tweenProperty(...tprop)));
      let completionCounter = 0;
      o.completed = function(){
        completionCounter += 1;
        if(completionCounter === o.tweens.length){
          o.onComplete && o.onComplete();
          completionCounter = 0;
        }
      };
      let f=function(){ o.completed() };
      o.tweens.forEach(tween => {tween.onComplete = f});
      o.pause = function(){
        o.tweens.forEach(tween => {tween.playing = false});
      };
      o.play = function(){
        o.tweens.forEach(tween => {tween.playing = true});
      };
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.fadeOut= function(sprite, frames = 60){
      return _tweenProperty(sprite, "alpha", sprite.alpha, 0, frames, "sine");
    };
    /**
     * @public
     * @function
     */
    _T.fadeIn= function(sprite, frames = 60){
      return _tweenProperty(sprite, "alpha", sprite.alpha, 1, frames, "sine");
    };
    /**
     * Fades the sprite in and out at a steady rate.
     * Set the `minAlpha` to something greater than 0 if you
     * don't want the sprite to fade away completely.
     *
     * @public
     * @function
     */
    _T.pulse=function(sprite, frames = 60, minAlpha = 0){
      return _tweenProperty(sprite, "alpha", sprite.alpha, minAlpha, frames, "smoothstep", true);
    };
    /**
     * @public
     * @function
     */
    _T.slide=function(sprite, endX, endY,
                      frames = 60, type = "smoothstep",
                      yoyo = false, delayBeforeRepeat = 0){
      return this.makeTween([
        [sprite, "x", sprite.x, endX, frames, type, yoyo, delayBeforeRepeat],
        [sprite, "y", sprite.y, endY, frames, type, yoyo, delayBeforeRepeat]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.breathe=function(sprite, endScaleX = 0.8, endScaleY = 0.8,
                        frames = 60, yoyo = true, delayBeforeRepeat = 0){
      return this.makeTween([
        [sprite, "scaleX", sprite.scale.x, endScaleX,
         frames, "smoothstepSquared", yoyo, delayBeforeRepeat],
        [sprite, "scaleY", sprite.scale.y, endScaleY,
         frames, "smoothstepSquared", yoyo, delayBeforeRepeat]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.scale=function(sprite, endScaleX = 0.5, endScaleY = 0.5, frames = 60){
      return this.makeTween([
        [sprite, "scaleX", sprite.scale.x, endScaleX, frames, "smoothstep", false],
        [sprite, "scaleY", sprite.scale.y, endScaleY, frames, "smoothstep", false]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.strobe=function(sprite, scaleFactor = 1.3,
                       startMagnitude = 10, endMagnitude = 20,
                       frames = 10, yoyo = true, delayBeforeRepeat = 0){
      let bounce = "bounce " + startMagnitude + " " + endMagnitude;
      return this.makeTween([
        [sprite, "scaleX", sprite.scale.x, scaleFactor, frames, bounce, yoyo, delayBeforeRepeat],
        [sprite, "scaleY", sprite.scale.y, scaleFactor, frames, bounce, yoyo, delayBeforeRepeat]
      ]);
    };
    /**
     * @public
     * @function
     */
    _T.wobble= function(
      sprite,
      scaleFactorX = 1.2,
      scaleFactorY = 1.2,
      frames = 10,
      xStartMagnitude = 10,
      xEndMagnitude = 10,
      yStartMagnitude = -10,
      yEndMagnitude = -10,
      friction = 0.98,
      yoyo = true,
      delayBeforeRepeat = 0
    ) {
      let bounceX = "bounce " + xStartMagnitude + " " + xEndMagnitude;
      let bounceY = "bounce " + yStartMagnitude + " " + yEndMagnitude;
      let o = this.makeTween([
        [sprite, "scaleX", sprite.scale.x, scaleFactorX, frames, bounceX, yoyo, delayBeforeRepeat],
        [sprite, "scaleY", sprite.scale.y, scaleFactorY, frames, bounceY, yoyo, delayBeforeRepeat]
      ]);
      //Add some friction to the `endValue` at the end of each tween
      o.tweens.forEach(tween => {
        tween.onComplete = function(){
          //Add friction if the `endValue` is greater than 1
          if(tween.endValue > 1){
            tween.endValue *= friction;
            //Set the `endValue` to 1 when the effect is finished and
            //remove the tween from the global `tweens` array
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
                            type = "smoothstep", yoyo = false, delayBeforeRepeat = 0){
      let o = {};
      //If the tween is a bounce type (a spline), set the
      //start and end magnitude values
      let typeArray = type.split(" ");
      if(typeArray[0] === "bounce"){
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }
      //Use `tween.start` to make a new tween using the current
      //end point values
      o.start = function(pointsArray){
        o.playing = true;
        o.totalFrames = totalFrames;
        o.frameCounter = 0;
        o.pointsArray = _.unpack(_.pack(pointsArray));
        _.conj(_globalTweens,o);
      };
      o.start(pointsArray);
      o.update = function(){
        let normalizedTime, curvedTime, p = o.pointsArray;
        if(o.playing){
          //If the elapsed frames are less than the total frames,
          //use the tweening formulas to move the sprite
          if(o.frameCounter < o.totalFrames){
            //Find the normalized value
            normalizedTime = o.frameCounter / o.totalFrames;
            if(typeArray[0] !== "bounce"){
              curvedTime = _easingFormulas[type](normalizedTime);
            }else{
              //If it's a spline, use the `spline` function and apply the
              //2 additional `type` array values as the spline's start and
              //end points
              //curve = tweenFunction.spline(n, type[1], 0, 1, type[2]);
              curvedTime = _easingFormulas.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
            }
            //Apply the Bezier curve to the sprite's position
            sprite.x = _easingFormulas.cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
            sprite.y = _easingFormulas.cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);
            //Add one to the `elapsedFrames`
            o.frameCounter += 1;
          } else {
            //When the tween has finished playing, run the end tasks
            //sprite[property] = o.endValue;
            o.end();
          }
        }
      };
      o.end = function(){
        o.playing = false;
        o.onComplete && o.onComplete();
        _.disj(_globalTweens,o);
        //If the tween's `yoyo` property is `true`, reverse the array and
        //use it to create a new tween
        if(yoyo){
          _T.wait(delayBeforeRepeat).then(() => {
            o.pointsArray = o.pointsArray.reverse();
            o.start(o.pointsArray);
          });
        }
      };
      o.pause = function(){ o.playing = false; };
      o.play = function(){ o.playing = true; };
      return o;
    };
    /**
     * @public
     * @function
     */
    _T.walkPath=function(sprite,
                         originalPathArray, //A 2D array of waypoints
                         totalFrames = 300, //The duration, in frames
                         type = "smoothstep", //The easing type
                         loop = false, //Should the animation loop?
                         yoyo = false, //Shoud the direction reverse?
                         delayBetweenSections = 0){ //Delay, in milliseconds, between sections
      //Clone the path array so that any possible references to sprite
      //properties are converted into ordinary numbers
      let pathArray = _.unpack(_.pack(originalPathArray));
      //Figure out the duration, in frames, of each path section by
      //dividing the `totalFrames` by the length of the `pathArray`
      let frames = totalFrames / pathArray.length;
      //Set the current point to 0, which will be the first waypoint
      let currentPoint = 0;
      //The `makePath` function creates a single tween between two points and
      //then schedules the next path to be made after it
      let makePath = function(currentPoint){
        let tween = this.makeTween([
          //Create the x axis tween between the first x value in the
          //current point and the x value in the following point
          [sprite, "x",
           pathArray[currentPoint][0],
           pathArray[currentPoint + 1][0], frames, type],
          //Create the y axis tween in the same way
          [sprite, "y",
           pathArray[currentPoint][1],
           pathArray[currentPoint + 1][1], frames, type]
        ]);
        //When the tween is complete, advance the `currentPoint` by one.
        //Add an optional delay between path segments, and then make the
        //next connecting path
        tween.onComplete = function(){
          currentPoint += 1;
          //If the sprite hasn't reached the end of the
          //path, tween the sprite to the next point
          if(currentPoint < pathArray.length - 1){
            _T.wait(delayBetweenSections).then(() => {
              tween = makePath(currentPoint);
            });
          }else{
            //If we've reached the end of the path, optionally
            //loop and yoyo it
            //Reverse the path if `loop` is `true`
            if(loop){
              //Reverse the array if `yoyo` is `true`
              if(yoyo) pathArray.reverse();
              //Optionally wait before restarting
              _T.wait(delayBetweenSections).then(() => {
                //Reset the `currentPoint` to 0 so that we can
                //restart at the first point
                currentPoint = 0;
                //Set the sprite to the first point
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                //Make the first new path
                tween = makePath(currentPoint);
              });
            }
          }
        };
        return tween;
      };
      return makePath(currentPoint);
    };
    /**
     * @public
     * @function
     */
    _T.walkCurve=function(sprite,
                          pathArray, //2D array of Bezier curves
                          totalFrames = 300, //The duration, in frames
                          type = "smoothstep", //The easing type
                          loop = false, //Should the animation loop?
                          yoyo = false, //Should the direction reverse?
                          delayBeforeContinue = 0){ //Delay, in milliseconds, between sections
      //Divide the `totalFrames` into sections for each part of the path
      let frames = totalFrames / pathArray.length;
      //Set the current curve to 0, which will be the first one
      let currentCurve = 0;
      let makePath = function(currentCurve){
        //Use the custom `followCurve` function to make
        //a sprite follow a curve
        let tween = this.followCurve(sprite, pathArray[currentCurve], frames, type);
        //When the tween is complete, advance the `currentCurve` by one.
        //Add an optional delay between path segments, and then make the
        //next path
        tween.onComplete = function(){
          currentCurve += 1;
          if(currentCurve < pathArray.length){
            _T.wait(delayBeforeContinue).then(() => {
              tween = makePath(currentCurve);
            });
          }else{
            //If we've reached the end of the path, optionally
            //loop and reverse it
            if(loop){
              if(yoyo){
                pathArray.reverse();
                pathArray.forEach(curveArray => curveArray.reverse());
              }
              //After an optional delay, reset the sprite to the
              //beginning of the path and make the next new path
              _T.wait(delayBeforeContinue).then(() => {
                currentCurve = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                tween = makePath(currentCurve);
              });
            }
          }
        };
        return tween;
      };

      return makePath(currentCurve);
    };
    /**
     * @public
     * @function
     */
    _T.wait=function(duration = 0){
      return new Promise((resolve, reject) => {
        _.timer(resolve, duration);
      });
    };
    _T.removeTween=function(tweenObject){
      if(!tweenObject.tweens){
        tweenObject.pause();
        _.disj(_globalTweens,tweenObject);
      }else{
        tweenObject.pause();
        tweenObject.tweens.forEach(e => _.disj(_globalTweens,e));
      }
    };
    _T.update=function(){
      if(_globalTweens.length > 0){
        for(let t,i=_globalTweens.length-1; i >= 0; --i){
          t= _globalTweens[i];
          if(t) t.update();
        }
      }
    };

    return Mojo.Tween= _T;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

