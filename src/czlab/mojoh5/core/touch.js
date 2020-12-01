;(function(window){
  "use strict";

  window["io.czlab.mojoh5.Touch"]=function(Mojo){
    const _S=Mojo.Sprites;
    const P8=Math.PI/8;
    const _=Mojo.u;
    function _getPower(s,cx,cy){
      const a = cx - 0;
      const b = cy - 0;
      return Math.min(1, Math.sqrt(a * a + b * b) / s.mojoh5.outerRadius)
    }
    function _getDirection(cx,cy){
      let rad = Math.atan2(cy, cx);// [-PI, PI]
      if((rad >= -P8 && rad < 0) || (rad >= 0 && rad < P8)){
        return Mojo.RIGHT
      }
      if(rad >= P8 && rad < 3 * P8){
        return Mojo.BOTTOM_RIGHT
      }
      if(rad >= 3 * P8 && rad < 5 * P8){
        return Mojo.BOTTOM
      }
      if(rad >= 5 * P8 && rad < 7 * P8){
        return Mojo.BOTTOM_LEFT
      }
      if((rad >= 7 * P8 && rad < Math.PI) || (rad >= -Math.PI && rad < -7 * P8)){
        return Mojo.LEFT
      }
      if(rad >= -7 * P8 && rad < -5 * P8){
        return Mojo.TOP_LEFT
      }
      if(rad >= -5 * P8 && rad < -3 * P8){
        return Mojo.TOP
      }

      return Mojo.TOP_RIGHT
    }
    //class JoystickChangeEvent{ angle: number; direction: Direction; power: number; }
    //export enum Direction { LEFT = 'left', TOP = 'top', BOTTOM = 'bottom', RIGHT = 'right', TOP_LEFT = 'top_left', TOP_RIGHT = 'top_right', BOTTOM_LEFT = 'bottom_left', BOTTOM_RIGHT = 'bottom_right', }
    function _bindEvents(s){
      function onDragStart(e){
        let ct=e.changedTouches;
        let t = e.target;
        if(ct){
          s.mojoh5.startX= ct[0].pageX - t.offsetLeft;
          s.mojoh5.startY= ct[0].pageY - t.offsetTop;
          s.mojoh5.touchId=ct[0].identifier;
        }else{
          s.mojoh5.startX= e.pageX - t.offsetLeft;
          s.mojoh5.startY= e.pageY - t.offsetTop;
          s.mojoh5.touchId=0;
        }
        s.mojoh5.dragging = true;
        s.mojoh5.inner.alpha = 1;
        s.mojoh5.onStart();
      }
      function onDragEnd(e){
        if(s.mojoh5.dragging){
          s.mojoh5.inner.alpha = s.mojoh5.innerAlphaStandby;
          s.mojoh5.inner.position.set(0,0);
          s.mojoh5.dragging = false;
          s.mojoh5.onEnd();
        }
      }
      function onDragMove(e){
        if(!s.mojoh5.dragging){return}
        let ct=e.changedTouches;
        let t= e.target;
        let cx=null;
        let cy=null;
        if(ct){
          for(let i=0; i< ct.length; ++i){
            if(s.mojoh5.touchId === ct[i].identifier){
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
        let sideX = cx - s.mojoh5.startX;
        let sideY = cy - s.mojoh5.startY;
        let calRadius = 0;
        let angle = 0;
        cx=0;
        cy=0;
        if(sideX === 0 && sideY === 0){return}
        if(sideX * sideX + sideY * sideY >= s.mojoh5.outerRadius * s.mojoh5.outerRadius){
          calRadius = s.mojoh5.outerRadius
        }else{
          calRadius = s.mojoh5.outerRadius - s.mojoh5.innerRadius
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
        let direction = Mojo.LEFT;
        let power=0;
        if(sideX === 0){
          if(sideY > 0){
            cx=0;
            cy=sideY > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : sideY;
            angle = 270;
            direction = Mojo.BOTTOM;
          }else{
            cx=0;
            cy= -(Math.abs(sideY) > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : Math.abs(sideY));
            angle = 90;
            direction = Mojo.TOP;
          }
          s.mojoh5.inner.position.set(cx,cy);
          power = _getPower(s,cx,cy);
          s.mojoh5.onChange(direction,angle,power);
          return;
        }
        if(sideY === 0){
          if(sideX > 0){
            cx=Math.abs(sideX) > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : Math.abs(sideX);
            cy=0;
            angle = 0;
            direction = Mojo.LEFT;
          }else{
            cx=-(Math.abs(sideX) > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : Math.abs(sideX));
            cy=0;
            angle = 180;
            direction = Mojo.RIGHT;
          }
          s.mojoh5.inner.position.set(cx,cy);
          power = _getPower(s,cx,cy);
          s.mojoh5.onChange(direction, angle, power);
          return;
        }
        let tanVal = Math.abs(sideY / sideX);
        let radian = Math.atan(tanVal);
        angle = radian * 180 / Math.PI;
        cx=0;
        cy=0;
        if(sideX * sideX + sideY * sideY >= s.mojoh5.outerRadius * s.mojoh5.outerRadius){
          cx = s.mojoh5.outerRadius * Math.cos(radian);
          cy = s.mojoh5.outerRadius * Math.sin(radian);
        }else{
          cx = Math.abs(sideX) > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : Math.abs(sideX);
          cy = Math.abs(sideY) > s.mojoh5.outerRadius ? s.mojoh5.outerRadius : Math.abs(sideY);
        }
        if(sideY < 0)
          cy = -Math.abs(cy);
        if(sideX < 0)
          cx = -Math.abs(cx);
        if(sideX > 0 && sideY < 0){
          // < 90
        } else if(sideX < 0 && sideY < 0){
          // 90 ~ 180
          angle = 180 - angle;
        } else if(sideX < 0 && sideY > 0){
          // 180 ~ 270
          angle = angle + 180;
        } else if(sideX > 0 && sideY > 0){
          // 270 ~ 369
          angle = 360 - angle;
        }
        power = _getPower(s,cx,cy);
        direction = _getDirection(cx,cy);
        s.mojoh5.inner.position.set(cx,cy);
        s.mojoh5.onChange(direction, angle, power);
      }

      let el=Mojo.canvas;
      _.addEvent([["mousemove", el, onDragMove],
                  ["mousedown", el, onDragStart],
                  ["mouseup", window, onDragEnd],
                  ["touchmove", el, onDragMove],
                  ["touchstart", el, onDragStart],
                  ["touchend", window, onDragEnd],
                  ["touchcancel", window, onDragEnd]]);
    }

    const _T={
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
                          onChange(dir,angle,power){} }, options);
        let outer= mo.outer= _S.sprite("joystick.png");
        let inner= mo.inner= _S.sprite("joystick-handle.png");
        let stick=new PIXI.Container();
        stick.mojoh5=mo;
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

    return Mojo.Touch=_T;
  };

})(this);


