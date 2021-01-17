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
  function _module(Mojo,_activeTouches,_buttons,_draggables){
    const _S=global["io.czlab.mojoh5.Sprites"](Mojo);
    const Core=global["io.czlab.mcfud.core"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    let _element=Mojo.canvas;
    let _scale=Mojo.scale;
    let _pointer=null;
    const _=Core.u;
    const is=Core.is;
    const _keyInputs= _.jsMap();
    const _I= {
      arrowControl(s, speed){
        _.assert(is.num(speed), "arrowControl requires speed");
        let left= this.keyboard(37);
        let up= this.keyboard(38);
        let down= this.keyboard(40);
        let right= this.keyboard(39);
        _.inject(left,{
          press(){
            s.mojoh5.vel[0] = -speed;
            s.mojoh5.vel[1] = 0;
          },
          release(){
            if(!right.isDown && s.mojoh5.vel[1] === 0){
              s.mojoh5.vel[0] = 0;
            }
          }
        });
        _.inject(up,{
          press(){
            s.mojoh5.vel[1] = -speed;
            s.mojoh5.vel[0] = 0;
          },
          release(){
            if(!down.isDown && s.mojoh5.vel[0] === 0){
              s.mojoh5.vel[1] = 0;
            }
          }
        });
        _.inject(right,{
          press(){
            s.mojoh5.vel[0] = speed;
            s.mojoh5.vel[1] = 0;
          },
          release(){
            if(!left.isDown && s.mojoh5.vel[1] === 0){
              s.mojoh5.vel[0] = 0;
            }
          }
        });
        _.inject(down,{
          press(){
          s.mojoh5.vel[1] = speed;
          s.mojoh5.vel[0] = 0;
          },
          release(){
            if(!up.isDown && s.mojoh5.vel[0] === 0){
              s.mojoh5.vel[1] = 0;
            }
          }
        });
      },
      onResize(){
        if(_pointer)
          _pointer.dispose();
        Mojo.pointer = _I.pointer(Mojo.canvas, Mojo.scale);
      },
      resetInputs(){
        _keyInputs.clear();
      },
      keyboard(keyCode){
        //press: undefined, //release: undefined,
        let key = {
          code: keyCode,
          isDown: false,
          isUp: true,
          downHandler(e){
            if(e.keyCode === key.code){
              key.isUp && key.press && key.press();
              key.isUp = !(key.isDown = true);
            }
            e.preventDefault();
          },
          upHandler(e){
            if(e.keyCode === key.code) {
              key.isDown && key.release && key.release();
              key.isDown = !(key.isUp = true);
            }
            e.preventDefault();
          }
        };
        _.addEvent([["keyup", window, key.upHandler, false],
                    ["keydown", window, key.downHandler, false]]);
        return key;
      },
      get scale() { return _scale },
      set scale(v) { _scale=v; if(_pointer) _pointer.scale=v },
      removeButton(b){
        b.mojoh5.enabled=false;
        _.disj(_buttons,b);
      },
      makeButton(s){
        s.mojoh5.state = "up";
        s.mojoh5.action = "";
        s.mojoh5.pressed = false;
        s.mojoh5.hoverOver = false;
        s.mojoh5.button=true;
        s.mojoh5.enabled = true;
        return _.conj(_buttons,s) && s;
      },

      button(source, x = 0, y = 0){
        let s, s0=source[0];
        if(is.str(s0)){
          s = Mojo.tcached(s0) ? Mojo.animFromFrames(source)
                               : Mojo.animFromImages(source)
        } else if(_.inst(Mojo.PXTexture,s0)){
          s = new Mojo.PXASprite(source)
        }
        s.x = x;
        s.y = y;
        return this.makeButton(_S.extend(s))
      },
      update(dt){
        if(_draggables.length > 0) this.updateDragAndDrop(_draggables);
        //if(_buttons.length > 0) this.updateButtons(dt);
      },
      makeDraggable(...sprites){
        if(sprites.length===1 && is.vec(sprites[0])){
          sprites=sprites[0];
        }
        _.doseq(sprites,s=>{
          _.conj(_draggables,s);
          s.mojoh5.draggable = true;
        });
      },
      makeUndraggable(...sprites){
        if(sprites.length===1 && is.vec(sprites[0])){
          sprites=sprites[0];
        }
        _.doseq(sprites,s=>{
          _.disj(_draggables,s);
          s.mojoh5.draggable = false;
        });
      },
      keyUp(code){
        return ! this.keyDown(code)
      },
      keyDown(code){
        return _keyInputs.get(code)===true
      }
    };
    _.inject(_I, {
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
      keyPGGUP: 33, keyPGDOWN: 34
    });
    /**
     * @public
     * @function
     */
    _I.pointer=function(el, skale){
      let ptr={
        element: el || _element,
        _scale: skale || _scale,
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
        dragSprite: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        anchor: Mojo.makeAnchor(0.5,0.5),
        get cursor() { return this.element.style.cursor },
        set cursor(v) { this.element.style.cursor = v },
        get x() { return this._x / this.scale },
        get y() { return this._y / this.scale },
        get scale() { return this._scale },
        set scale(v) { this._scale = v },
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
            if(s.mojoh5.enabled &&
               s.mojoh5.press &&
               ptr.hitTestSprite(s)){
              s.mojoh5.press(s);
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
            Mojo.EventBus.pub(["mousedown"]);
          }
        },
        mouseMove(e){
          ptr._x = e.pageX - e.target.offsetLeft;
          ptr._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          Mojo.EventBus.pub(["mousemove"]);
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
            Mojo.EventBus.pub(["mouseup"]);
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
          Mojo.EventBus.pub(["touchstart"]);
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
          Mojo.EventBus.pub(["touchmove"]);
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
          Mojo.EventBus.pub(["touchend"]);
        },
        touchCancel(e){
          let ct=e.changedTouches;
          let tt=e.targetTouches;
          let t=e.target;
          let t0=tt[0];
          let touchId= touch.identifier || 0;
          let active = _.get(_activeTouches,touchId);
          //EBus.pub("touchEnd", active.obj, active);
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
          _.delEvent([["mousemove", el, ptr.mouseMove],
                      ["mousedown", el,ptr.mouseDown],
                      ["mouseup", window, ptr.mouseUp],
                      ["touchmove", el, ptr.touchMove],
                      ["touchstart", el, ptr.touchStart],
                      ["touchend", window, ptr.touchEnd],
                      ["touchcancel", window, ptr.touchCancel]]);
        }
      };
      _.addEvent([["mousemove", el, ptr.mouseMove],
                  ["mousedown", el,ptr.mouseDown],
                  ["mouseup", window, ptr.mouseUp],
                  ["touchmove", el, ptr.touchMove],
                  ["touchstart", el, ptr.touchStart],
                  ["touchend", window, ptr.touchEnd],
                  ["touchcancel", window, ptr.touchCancel]]);
      //disable the default actions on the canvas
      el.style.touchAction = "none";
      return _pointer=ptr;
    };
    /**
     * @public
     * @function
     */
    _I.updateDragAndDrop=function(sprites){
      if(_pointer){
        let ptr=_pointer;
        if(ptr.isDown){
          if(!ptr.dragSprite){
            for(let s,i=sprites.length-1; i>=0; --i){
              s= sprites[i];
              if(s.mojoh5.draggable && ptr.hitTestSprite(s)){
                let g= _S.gposXY(s);
                ptr.dragOffsetX = ptr.x - g[0];
                ptr.dragOffsetY = ptr.y - g[1];
                ptr.dragSprite = s;
                //push it to top of zindex
                let cs = s.parent.children;
                _.disj(cs,s);
                _.conj(cs,s);
                _.disj(sprites,s);
                _.conj(sprites,s);
                break;
              }
            }
          }else{
            ptr.dragSprite.x = ptr.x - ptr.dragOffsetX;
            ptr.dragSprite.y = ptr.y - ptr.dragOffsetY;
          }
        }
        if(ptr.isUp)
          ptr.dragSprite = null;
        sprites.some(s=>{
          if(s.mojoh5.draggable && ptr.hitTestSprite(s)){
            if(ptr.visible) ptr.cursor = "pointer";
            return true;
          }else{
            if(ptr.visible) ptr.cursor = "auto";
            return false;
          }
        });
      }
    };
    /**
     * @public
     * @function
     */
    _I.updateButtons=function(){
      if(_pointer){
        ptr.shouldBeHand = false;
        ptr.cursor = ptr.shouldBeHand ? "pointer" : "auto"
      }
    };
    /**
     * @public
     * @function
     */

    Mojo.EventBus.sub(["canvas.resize"], "onResize",_I);

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
    return (Mojo.Input= _I)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Input"]=function(Mojo){
    return Mojo.Input ? Mojo.Input : _module(Mojo,new Map(),[],[])
  };

})(this);

