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
  function _module(Mojo,_pointers,_buttons,_draggables){
    const _S=global["io.czlab.mojoh5.Sprites"](Mojo);
    const Core=global["io.czlab.mcfud.core"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    let _element=Mojo.canvas;
    let _scale=Mojo.scale;
    const _=Core.u;
    const is=Core.is;
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
        Mojo.pointer = _I.pointer(Mojo.canvas, Mojo.scale);
        _I.scale= Mojo.scale;
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
      set scale(v) { _scale=v; _.doseq(_pointers, p=> p.scale=v) },
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
        if(_buttons.length > 0) this.updateButtons(dt);
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
      }
    };
    /**
     * @public
     * @function
     */
    _I.pointer=function(el, skale){
      let ptr= {
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
        //press: undefined,
        //release: undefined,
        //hover: undefined,
        //blur: undefined,
        //tap: undefined,
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
        moveHandler(e){
          let t = e.target;
          ptr._x = (e.pageX - t.offsetLeft);
          ptr._y = (e.pageY - t.offsetTop);
          e.preventDefault();
        },
        touchmoveHandler(e){
          let t = e.target;
          ptr._x = (e.targetTouches[0].pageX - t.offsetLeft);
          ptr._y = (e.targetTouches[0].pageY - t.offsetTop);
          e.preventDefault();
        },
        downHandler(e){
          ptr.isDown = true;
          ptr.isUp = false;
          ptr.tapped = false;
          ptr.downTime = _.now();
          ptr.press && ptr.press();
          e.preventDefault();
        },
        touchstartHandler(e){
          let t = e.target;
          ptr._x = e.targetTouches[0].pageX - t.offsetLeft;
          ptr._y = e.targetTouches[0].pageY - t.offsetTop;
          ptr.downTime = _.now();
          ptr.isDown = true;
          ptr.isUp = false;
          ptr.tapped = false;
          ptr.press && ptr.press();
          e.preventDefault();
        },
        upHandler(e){
          ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
          if(ptr.elapsedTime <= 200 && ptr.tapped === false){
            ptr.tapped = true;
            ptr.tap && ptr.tap();
          }
          ptr.isUp = true;
          ptr.isDown = false;
          ptr.release && ptr.release();
          //e.preventDefault();
        },
        touchendHandler(e){
          ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
          if(ptr.elapsedTime <= 200 && ptr.tapped === false){
            ptr.tapped = true;
            ptr.tap && ptr.tap();
          }
          ptr.isUp = true;
          ptr.isDown = false;
          ptr.release && ptr.release();
          //e.preventDefault();
        },
        hitTestSprite(s){
          return Mojo["2d"].hitTestPointXY(ptr.x,ptr.y,s,true)
        }
      };
      _.addEvent([["mousemove", el, ptr.moveHandler, false],
                  ["mousedown", el,ptr.downHandler, false],
                  //catch mouse button releases outside of the canvas area
                  ["mouseup", window, ptr.upHandler, false],
                  ["touchmove", el, ptr.touchmoveHandler, false],
                  ["touchstart", el, ptr.touchstartHandler, false],
                  //catch a mouse button release outside of the canvas area
                  ["touchend", window, ptr.touchendHandler, false]]);
      //disable the default actions on the canvas
      el.style.touchAction = "none";
      return (_pointers[0]=ptr);
      //return _.conj(_pointers,ptr) && ptr;
    };
    /**
     * @public
     * @function
     */
    _I.updateDragAndDrop=function(sprites){
      function _F(ptr){
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
      //deal with single pointer for now
      _pointers.length>0 && _F(_pointers[0]);
    };
    /**
     * @public
     * @function
     */
    _I.updateButtons=function(){
      function _F(ptr){
        ptr.shouldBeHand = false;
        _buttons.forEach(s=>{
          if(s.mojoh5.enabled){
            let hit = ptr.hitTestSprite(s);
            if(ptr.isUp){
              s.mojoh5.state = "up";
              if(s.mojoh5.button) s.gotoAndStop(0);
            }
            if(hit){
              s.mojoh5.state = "over";
              if(s.totalFrames && s.totalFrames === 3 && s.mojoh5.button){
                s.gotoAndStop(1);
              }
              if(ptr.isDown){
                s.mojoh5.state = "down";
                if(s.mojoh5.button)
                  (s.totalFrames === 3) ? s.gotoAndStop(2) : s.gotoAndStop(1);
              }
              ptr.shouldBeHand = true;
              if(ptr.visible) ptr.cursor = "pointer";
            }else{
              if(ptr.visible) ptr.cursor = "auto";
            }
            if(s.mojoh5.state === "down"){
              if(!s.mojoh5.pressed){
                s.mojoh5.press && s.mojoh5.press();
                s.mojoh5.pressed = true;
                s.mojoh5.action = "pressed";
              }
            }
            if(s.mojoh5.state === "over"){
              if(s.mojoh5.pressed){
                s.mojoh5.release && s.mojoh5.release();
                s.mojoh5.pressed = false;
                s.mojoh5.action = "released";
                if(ptr.tapped && s.mojoh5.tap) s.tap();
              }
              if(!s.mojoh5.hoverOver){
                s.mojoh5.hover && s.mojoh5.hover();
                s.mojoh5.hoverOver = true;
              }
            }
            if(s.mojoh5.state === "up"){
              if(s.mojoh5.pressed){
                s.mojoh5.release && s.mojoh5.release();
                s.mojoh5.pressed = false;
                s.mojoh5.action = "released";
              }
              if(s.mojoh5.hoverOver){
                s.mojoh5.blur && s.mojoh5.blur();
                s.mojoh5.hoverOver = false;
              }
            }
          }
        });
        ptr.cursor = ptr.shouldBeHand ? "pointer" : "auto"
      }
      //single pointer for now
      _pointers.length>0 && _F(_pointers[0]);
    };
    /**
     * @public
     * @function
     */

    Mojo.EventBus.sub(["canvas.resize"], "onResize",_I);
    _I.onResize();

    return (Mojo.Input= _I)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Input"]=function(Mojo){
    return Mojo.Input ? Mojo.Input : _module(Mojo,[],[],[])
  };

})(this);

