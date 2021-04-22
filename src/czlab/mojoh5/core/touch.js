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
  function _module(Mojo){

    const {is,ute:_}=Mojo,
          P8=Math.PI/8;

    /**
     * @module mojoh5/Touch
     */

    /** @ignore */
    function _calcPower(s,cx,cy){
      const a= +cx;
      const b= +cy;
      return Math.min(1, Math.sqrt(a*a + b*b)/s.m5.outerRadius)
    }

    /** @ignore */
    function _calcDir(cx,cy){
      const rad= Math.atan2(+cy, +cx);
      let ret= Mojo.TOP_RIGHT;
      if((rad >= -P8 && rad<0) || (rad >= 0 && rad<P8)){
        ret= Mojo.RIGHT
      }
      else if(rad >= P8 && rad < 3*P8){
        ret= Mojo.BOTTOM_RIGHT
      }
      else if(rad >= 3*P8 && rad < 5*P8){
        ret= Mojo.BOTTOM
      }
      else if(rad >= 5*P8 && rad < 7*P8){
        ret= Mojo.BOTTOM_LEFT
      }
      else if((rad >= 7*P8 && rad<Math.PI) || (rad >= -Math.PI && rad < -7*P8)){
        ret= Mojo.LEFT
      }
      else if(rad >= -7*P8 && rad < -5*P8){
        ret= Mojo.TOP_LEFT
      }
      else if(rad >= -5*P8 && rad < -3*P8){
        ret= Mojo.TOP
      }
      return ret
    }

    /** @ignore */
    function _bindEvents(s){
      function onDragStart(e){
        let ct=e.changedTouches;
        let t= e.target;
        if(ct){
          s.m5.startX= ct[0].pageX - t.offsetLeft;
          s.m5.startY= ct[0].pageY - t.offsetTop;
          s.m5.touchId=ct[0].identifier;
        }else{
          s.m5.startX= e.pageX - t.offsetLeft;
          s.m5.startY= e.pageY - t.offsetTop;
          s.m5.touchId=0;
        }
        s.m5.drag= true;
        s.m5.inner.alpha = 1;
        s.m5.onStart();
      }
      function onDragEnd(e){
        if(s.m5.drag){
          s.m5.inner.alpha = s.m5.innerAlphaStandby;
          s.m5.inner.position.set(0,0);
          s.m5.drag= false;
          s.m5.onEnd();
        }
      }
      function onDragMove(e){
        if(!s.m5.drag){return}
        let ct=e.changedTouches;
        let t= e.target;
        let cx=null;
        let cy=null;
        if(ct){
          for(let i=0; i< ct.length; ++i){
            if(s.m5.touchId === ct[i].identifier){
              cx= ct[i].pageX-t.offsetLeft;
              cy= ct[i].pageY-t.offsetTop;
              break;
            }
          }
        }else{
          cx= e.pageX - t.offsetLeft;
          cy= e.pageY - t.offsetTop;
        }
        if(cx===null||cy===null){return}
        let sideX = cx - s.m5.startX;
        let sideY = cy - s.m5.startY;
        let calRadius = 0;
        let angle = 0;
        cx=0;
        cy=0;
        if(sideX === 0 && sideY === 0){return}
        if(sideX * sideX + sideY * sideY >= s.m5.outerRadius * s.m5.outerRadius){
          calRadius = s.m5.outerRadius
        }else{
          calRadius = s.m5.outerRadius - s.m5.innerRadius
        }
        /**
         * x:   -1 <-> 1
         * y:   -1 <-> 1
         *          Y
         *          ^
         *          |
         *     180  |  90
         *    ------------> X
         *     270  |  360
         *          |
         *          |
         */
        let direction=Mojo.LEFT;
        let sx=Math.abs(sideX);
        let sy=Math.abs(sideY);
        let power=0;
        if(sideX === 0){
          if(sideY>0){
            cx=0;
            cy=sideY>s.m5.outerRadius ? s.m5.outerRadius : sideY;
            angle=270;
            direction=Mojo.BOTTOM;
          }else{
            cx=0;
            cy= -(sy > s.m5.outerRadius ? s.m5.outerRadius : sy);
            angle = 90;
            direction = Mojo.TOP;
          }
          s.m5.inner.position.set(cx,cy);
          power = _calcPower(s,cx,cy);
          s.m5.onChange(direction,angle,power);
        } else if(sideY === 0){
          if(sideX>0){
            cx=sx > s.m5.outerRadius ? s.m5.outerRadius : sx;
            cy=0;
            angle=0;
            direction = Mojo.LEFT;
          }else{
            cx=-(sx > s.m5.outerRadius ? s.m5.outerRadius : sx);
            cy=0;
            angle = 180;
            direction = Mojo.RIGHT;
          }
          s.m5.inner.position.set(cx,cy);
          power = _calcPower(s,cx,cy);
          s.m5.onChange(direction, angle, power);
        }else{
          let tanVal= Math.abs(sideY/sideX);
          let radian= Math.atan(tanVal);
          angle = radian*180/Math.PI;
          cx=cy=0;
          if(sideX*sideX + sideY*sideY >= s.m5.outerRadius*s.m5.outerRadius){
            cx= s.m5.outerRadius * Math.cos(radian);
            cy= s.m5.outerRadius * Math.sin(radian);
          }else{
            cx= sx > s.m5.outerRadius ? s.m5.outerRadius : sx;
            cy= sy > s.m5.outerRadius ? s.m5.outerRadius : sy;
          }
          if(sideY<0)
            cy= -Math.abs(cy);
          if(sideX<0)
            cx= -Math.abs(cx);
          if(sideX>0 && sideY<0){
            // < 90
          } else if(sideX<0 && sideY<0){
            // 90 ~ 180
            angle= 180 - angle;
          } else if(sideX<0 && sideY>0){
            // 180 ~ 270
            angle= angle + 180;
          } else if(sideX>0 && sideY>0){
            // 270 ~ 369
            angle= 360 - angle;
          }
          power= _calcPower(s,cx,cy);
          direction= _calcDir(cx,cy);
          s.m5.inner.position.set(cx,cy);
          s.m5.onChange(direction, angle, power);
        }
      }
      _.addEvent([["mousemove", Mojo.canvas, onDragMove],
                  ["mousedown", Mojo.canvas, onDragStart],
                  ["mouseup", window, onDragEnd],
                  ["touchend", window, onDragEnd],
                  ["touchcancel", window, onDragEnd],
                  ["touchmove", Mojo.canvas, onDragMove],
                  ["touchstart", Mojo.canvas, onDragStart]]);
    }

    const _$={
      /**Create the joystick.
       * @memberof module:mojoh5/Touch
       * @param {object} options
       * @return {PIXIContainer} the stick
       */
      joystick(options){
        let mo= _.inject({outerScaleX:1,
                          outerScaleY:1,
                          outerRadius:0,
                          innerRadius:0,
                          innerScaleX:1,
                          innerScaleY:1,
                          innerAlphaStandby:0.5,
                          onStart(){},
                          onEnd(){},
                          onChange(dir,angle,power){}}, options);
        let outer= mo.outer= Mojo.Sprites.sprite("joystick.png");
        let inner= mo.inner= Mojo.Sprites.sprite("joystick-handle.png");
        let stick=new PIXI.Container();
        stick.m5=mo;
        outer.alpha = 0.5;
        outer.anchor.set(0.5);
        inner.anchor.set(0.5);
        inner.alpha = mo.innerAlphaStandby;
        outer.scale.set(mo.outerScaleX, mo.outerScaleY);
        inner.scale.set(mo.innerScaleX, mo.innerScaleY);
        stick.addChild(outer);
        stick.addChild(inner);
        mo.outerRadius = stick.width / 2.5;
        mo.innerRadius = inner.width / 2;
        _bindEvents(stick);
        return stick;
      }
    };

    return (Mojo.Touch=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Touch"]=function(M){
      return M.Touch ? M.Touch : _module(M)
    }
  }

})(this);


