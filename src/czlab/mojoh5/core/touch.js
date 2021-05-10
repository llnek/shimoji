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
      return Math.min(1, Math.sqrt(a*a + b*b)/s.m5.outerRadius) }

    /** @ignore */
    function _calcDir(cx,cy){
      const rad= Math.atan2(+cy, +cx);
      let ret= Mojo.TOP_RIGHT;
      if((rad >= -P8 && rad<0) ||
         (rad >= 0 && rad<P8)){
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
      else if((rad >= 7*P8 && rad<Math.PI) ||
              (rad >= -Math.PI && rad < -7*P8)){
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
          e=ct[0];
          s.m5.touchId=ct[0].identifier;
        }else{
          s.m5.touchId=0;
        }
        s.m5.startX= e.pageX - t.offsetLeft;
        s.m5.startY= e.pageY - t.offsetTop;
        s.m5.drag= true;
        s.m5.inner.alpha = 1;
        if(!s.m5.static){
          s.visible=true;
          s.x=s.m5.startX;
          s.y=s.m5.startY;
        }
        s.m5.onStart();
      }
      function onDragEnd(e){
        if(s.m5.drag){
          s.m5.inner.alpha = s.m5.innerAlphaDft;
          s.m5.inner.position.set(0,0);
          s.m5.drag= false;
          if(!s.m5.static){
            s.visible=false;
          }
          s.m5.onEnd();
        }
      }
      function onDragMove(e){
        if(!s.visible || !s.m5.drag){return}
        let c,t= e.target;
        if(e.changedTouches){
          for(let i=0,
                  ct=e.changedTouches; i< ct.length; ++i){
            if(s.m5.touchId === ct[i].identifier){
              c= [ct[i].pageX-t.offsetLeft,
                  ct[i].pageY-t.offsetTop];
              break;
            }
          }
          if(!c){return}
        }else{
          c= [e.pageX - t.offsetLeft,
              e.pageY - t.offsetTop];
        }
        let X = c[0] - s.m5.startX;
        let Y = c[1] - s.m5.startY;
        let limit=s.m5.outerRadius;
        let calRadius = 0;
        let angle = 0;
        c[0]=0;
        c[1]=0;
        if(_.feq0(X) && _.feq0(Y)){return}
        calRadius= (X*X + Y*Y >= limit*limit)?limit
                                             :limit-s.m5.innerRadius;
        /**
         * x:   -1 <-> 1
         * y:   -1 <-> 1
         *          Y
         *          ^
         *     180  |  90
         *    ------------> X
         *     270  |  360
         */
        let direction=Mojo.LEFT;
        let sx=Math.abs(X);
        let sy=Math.abs(Y);
        let power=0;
        if(_.feq0(X)){
          if(Y>0){
            c[0]=0;
            c[1]=Y>limit ? limit : Y;
            angle=270;
            direction=Mojo.BOTTOM;
          }else{
            c[0]=0;
            c[1]= -(sy > limit ? limit : sy);
            angle = 90;
            direction = Mojo.UP;
          }
          s.m5.inner.position.set(c[0],c[1]);
          power = _calcPower(s,c[0],c[1]);
          s.m5.onChange(direction,angle,power);
        }else if(_.feq0(Y)){
          if(X>0){
            c[0]=sx > limit ? limit : sx;
            c[1]=0;
            angle=0;
            direction = Mojo.RIGHT;
          }else{
            c[0]=-(sx > limit ? limit : sx);
            c[1]=0;
            angle = 180;
            direction = Mojo.LEFT;
          }
          s.m5.inner.position.set(c[0],c[1]);
          power = _calcPower(s,c[0],c[1]);
          s.m5.onChange(direction, angle, power);
        }else{
          let rad= Math.atan(Math.abs(Y/X));
          angle = rad*180/Math.PI;
          c[0]=0;
          c[1]=0;
          if(X*X + Y*Y >= limit*limit){
            c[0]= limit * Math.cos(rad);
            c[1]= limit * Math.sin(rad);
          }else{
            c[0]= sx > limit ? limit : sx;
            c[1]= sy > limit ? limit : sy;
          }
          if(Y<0)
            c[1]= -Math.abs(c[1]);
          if(X<0)
            c[0]= -Math.abs(c[0]);
          if(X>0 && Y<0){
            // < 90
          }else if(X<0 && Y<0){
            // 90 ~ 180
            angle= 180 - angle;
          }else if(X<0 && Y>0){
            // 180 ~ 270
            angle += 180;
          }else if(X>0 && Y>0){
            // 270 ~ 369
            angle= 360 - angle;
          }
          power= _calcPower(s,c[0],c[1]);
          direction= _calcDir(c[0],c[1]);
          s.m5.inner.position.set(c[0],c[1]);
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
      s.m5.dispose=()=>{
        _.delEvent([["mousemove", Mojo.canvas, onDragMove],
                    ["mousedown", Mojo.canvas, onDragStart],
                    ["mouseup", window, onDragEnd],
                    ["touchend", window, onDragEnd],
                    ["touchcancel", window, onDragEnd],
                    ["touchmove", Mojo.canvas, onDragMove],
                    ["touchstart", Mojo.canvas, onDragStart]]);
      };
      return s;
    }

    const _$={
      assets:["boot/joystick.png","boot/joystick-handle.png"],
      /**Create the joystick.
       * @memberof module:mojoh5/Touch
       * @param {object} options
       * @return {PIXIContainer} the stick
       */
      joystick(options){
        let inner= Mojo.Sprites.sprite("boot/joystick-handle.png");
        let outer= Mojo.Sprites.sprite("boot/joystick.png");
        let mo= _.inject({outerScale:1,
                          innerScale:1,
                          static:false,
                          inner,
                          outer,
                          outerRadius:0,
                          innerRadius:0,
                          innerAlphaDft:1,//0.5,
                          onStart(){},
                          onEnd(){},
                          onChange(dir,angle,power){}}, options);
        let stick=new PIXI.Container();
        stick.m5=mo;
        outer.tint=Mojo.Sprites.color("white");
        outer.alpha = 1;//0.5;
        outer.anchor.set(0.5);
        inner.anchor.set(0.5);
        inner.alpha = mo.innerAlphaDft;
        outer.scale.set(mo.outerScale, mo.outerScale);
        inner.scale.set(mo.innerScale, mo.innerScale);
        stick.addChild(outer);
        stick.addChild(inner);
        mo.outerRadius = stick.width / 2.5;
        mo.innerRadius = inner.width / 2;
        if(!mo.static)
          stick.visible=false;
        return _bindEvents(stick);
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


