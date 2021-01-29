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
  /**
   * @private
   * @function
   */
  function _module(Mojo,_activeTouches,_buttons,_drags){
    const Sprites=gscope["io/czlab/mojoh5/Sprites"](Mojo);
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _keyInputs= _.jsMap();
    const {EventBus}=Mojo;
    let _Ptr=null;
    /**
     * @private
     * @function
     */
    function _updateDrags(){
      if(_Ptr && _Ptr.isDown){
        if(!_Ptr.dragged){
          for(let s,i=_drags.length-1; i>=0; --i){
            s=_drags[i];
            if(s.m5.drag && _Ptr.hitTestSprite(s)){
              let cs = s.parent.children;
              let g=Sprites.gposXY(s);
              _Ptr.dragOffsetX = _Ptr.x - g[0];
              _Ptr.dragOffsetY = _Ptr.y - g[1];
              _Ptr.dragged = s;
              //pop it up to top
              _.disj(cs,s);
              _.conj(cs,s);
              _.disj(_drags,s);
              _.conj(_drags,s);
              break;
            }
          }
        }else{
          _Ptr.dragged.x = _Ptr.x - _Ptr.dragOffsetX;
          _Ptr.dragged.y = _Ptr.y - _Ptr.dragOffsetY;
        }
      }
      if(_Ptr && _Ptr.isUp){
        _Ptr.dragged=null;
      }
    }
    const _I= {
      keyLEFT: 37, keyRIGHT: 39, keyUP: 38, keyDOWN: 40,
      keyZERO: 48, keyONE: 49, keyTWO: 50,
      keyTHREE: 51, keyFOUR: 52, keyFIVE: 53,
      keySIX: 54, keySEVEN: 55, keyEIGHT: 56, keyNINE: 57,
      keyA: 65, keyB: 66, keyC: 67, keyD: 68, keyE: 69, keyF: 70,
      keyG: 71, keyH: 72, keyI: 73, keyJ: 74, keyK: 75, keyL: 76,
      keyM: 77, keyN: 78, keyO: 79, keyP: 80, keyQ: 81, keyR: 82,
      keyS: 83, keyT: 84, keyU: 85, keyV: 86, keyW: 87, keyX: 88,
      keyY: 89, keyZ: 90,
      keyENTER: 13, keyESC: 27, keyBACKSPACE: 8, keyTAB: 9,
      keySHIFT: 16, keyCTRL: 17, keyALT: 18, keySPACE: 32,
      keyHOME: 36, keyEND: 35,
      keyPGGUP: 33, keyPGDOWN: 34,
      resize(){
        _Ptr && _Ptr.dispose();
        Mojo.pointer= _I.pointer(Mojo.canvas, Mojo.scale);
      },
      reset(){
        _keyInputs.clear();
      },
      keyboard(_key){
        //press: undefined, //release: undefined,
        const key={
          isDown: false,
          isUp: true,
          code: _key,
          _down(e){
            e.preventDefault();
            if(e.keyCode === key.code){
              key.isUp &&
                key.press && key.press();
              key.isUp=false;
              key.isDown=true;
            }
          },
          _up(e){
            e.preventDefault();
            if(e.keyCode === key.code){
              key.isDown &&
                key.release && key.release();
              key.isUp=true;
              key.isDown=false;
            }
          }
        };
        _.addEvent([["keyup", window, key._up, false],
                    ["keydown", window, key._down, false]]);
        return key;
      },
      undoButton(b){
        b.m5.enabled=false;
        b.m5.button=false;
        _.disj(_buttons,b);
        return b;
      },
      makeButton(b){
        b.m5.enabled = true;
        b.m5.button=true;
        _.conj(_buttons,b);
        return b;
      },
      update(dt){
        _drags.length>0 && _updateDrags()
      },
      makeDraggable(s){
        _.conj(_drags,s);
        s.m5.drag=true;
      },
      undoDraggable(s){
        _.disj(_drags,s);
        s.m5.drag=false;
      },
      keyUp(code){
        return !this.keyDown(code)
      },
      keyDown(code){
        return _keyInputs.get(code)===true
      }
    };
    /**
     * @public
     * @function
     */
    _I.pointer=function(){
      let ptr={
        tapped: false,
        isDown: false,
        isUp: true,
        _visible: true,
        _x: 0,
        _y: 0,
        width: 1,
        height: 1,
        downTime: 0,
        elapsedTime: 0,
        dragged: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        anchor: Mojo.makeAnchor(0.5,0.5),
        get cursor() { return Mojo.canvas.style.cursor },
        set cursor(v) { Mojo.canvas.style.cursor = v },
        get x() { return this._x / Mojo.scale },
        get y() { return this._y / Mojo.scale },
        get visible() { return this._visible },
        set visible(v) {
          this.cursor = v ? "auto" : "none";
          this._visible = v;
        },
        getGlobalPosition(){
          return {x: this.x, y: this.y}
        },
        press(){
          for(let s,i=0,z=_buttons.length;i<z;++i){
            s=_buttons[i];
            if(s.m5.enabled &&
               s.m5.press &&
               ptr.hitTestSprite(s)){
              s.m5.press(s);
              break;
            }
          }
        },
        tap(){
          ptr.press();
        },
        mouseDown(e){
          //left click only
          if(e.button===0){
            ptr._x = e.pageX - e.target.offsetLeft;
            ptr._y = e.pageY - e.target.offsetTop;
            ptr.downTime = _.now();
            ptr.isDown = true;
            ptr.isUp = false;
            ptr.pressed=true;
            e.preventDefault();
            EventBus.pub(["mousedown"]);
          }
        },
        mouseMove(e){
          ptr._x = e.pageX - e.target.offsetLeft;
          ptr._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          EventBus.pub(["mousemove"]);
        },
        mouseUp(e){
          if(e.button===0){
            ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
            ptr._x = e.pageX - e.target.offsetLeft;
            ptr._y = e.pageY - e.target.offsetTop;
            ptr.isUp = true;
            ptr.isDown = false;
            if(ptr.pressed){
              ptr.press();
              ptr.pressed=false;
            }
            e.preventDefault();
            EventBus.pub(["mouseup"]);
          }
        },
        _copyTouch(t,target){
          return {
            offsetLeft:target.offsetLeft,
            offsetTop:target.offsetTop,
            clientX:t.clientX,
            clientY:t.clientY,
            pageX:t.pageX,
            pageY:t.pageY,
            identifier:t.identifier};
        },
        touchStart(e){
          let ct=e.changedTouches; //multitouch
          let tt=e.targetTouches;//single touch
          let t = e.target;
          let tid=tt[0].identifier || 0;
          ptr._x = tt[0].pageX - t.offsetLeft;
          ptr._y = tt[0].pageY - t.offsetTop;
          ptr.downTime = _.now();
          ptr.isDown = true;
          ptr.isUp = false;
          ptr.tapped = true;
          e.preventDefault();
          _.assoc(_activeTouches,tid,ptr._copyTouch(tt[0],t));
          EventBus.pub(["touchstart"]);
        },
        touchMove(e){
          let ct=e.changedTouches;
          let tt=e.targetTouches;
          let t = e.target;
          let id= tt[0].identifier || 0;
          let active = _.get(_activeTouches,id);
          ptr._x = tt[0].pageX - t.offsetLeft;
          ptr._y = tt[0].pageY - t.offsetTop;
          e.preventDefault();
          EventBus.pub(["touchmove"]);
        },
        touchEnd(e){
          let ct=e.changedTouches;
          let tt=e.targetTouches;
          let t = e.target;
          let id= tt[0].identifier || 0;
          let active = _.get(_activeTouches,id);
          ptr._x = tt[0].pageX - t.offsetLeft;
          ptr._y = tt[0].pageY - t.offsetTop;
          ptr.isUp = true;
          ptr.isDown = false;
          ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
          if(active && ptr.elapsedTime <= 200 && ptr.tapped === true){
            ptr.tap();
            ptr.tapped = false;
          }
          e.preventDefault();
          EventBus.pub(["touchend"]);
        },
        touchCancel(e){
          let ct=e.changedTouches;
          let tt=e.targetTouches;
          let t=e.target;
          let t0=tt[0];
          let touchId= touch.identifier || 0;
          let active = _.get(_activeTouches,touchId);
          e.preventDefault();
          if(active)
            _.dissoc(_activeTouches,touchId);
        },
        reset(){
          ptr.pressed=false;
          ptr.tapped=false;
          ptr.isDown=false;
          ptr.isUp=true;
        },
        hitTestSprite(s){
          return Mojo["2d"].hitTestPointXY(ptr.x,ptr.y,s,true)
        },
        dispose(){
          _.delEvent([["mousemove", Mojo.canvas, ptr.mouseMove],
                      ["mousedown", Mojo.canvas,ptr.mouseDown],
                      ["mouseup", window, ptr.mouseUp],
                      ["touchmove", Mojo.canvas, ptr.touchMove],
                      ["touchstart", Mojo.canvas, ptr.touchStart],
                      ["touchend", window, ptr.touchEnd],
                      ["touchcancel", window, ptr.touchCancel]]);
        }
      };
      _.addEvent([["mousemove", Mojo.canvas, ptr.mouseMove],
                  ["mousedown", Mojo.canvas,ptr.mouseDown],
                  ["mouseup", window, ptr.mouseUp],
                  ["touchmove", Mojo.canvas, ptr.touchMove],
                  ["touchstart", Mojo.canvas, ptr.touchStart],
                  ["touchend", window, ptr.touchEnd],
                  ["touchcancel", window, ptr.touchCancel]]);
      //disable the default actions on the canvas
      Mojo.canvas.style.touchAction = "none";
      return _Ptr=ptr;
    };

    EventBus.sub(["canvas.resize"], "resize",_I);

    function _uh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,false);
    }
    function _dh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,true);
    }
    _.addEvent([["keyup", window, _uh, false],
                ["keydown", window, _dh, false]]);

    return (Mojo.Input= _I);
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
    module.exports={msg:"not supported in node"}
  }else {
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M,new Map(),[],[])
    }
  }

})(this);

