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
      get scale() { return _scale },
      set scale(v) { _scale=v; _.doseq(_pointers, p=> p.scale=v) }
    };
    /**
     * @public
     * @function
     */
    _I.makeDraggable=function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites,s=>{
        _.conj(_draggables,s);
        s.mojoh5.draggable = true;
      });
    };
    /**
     * @public
     * @function
     */
    _I.makeUndraggable=function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites,s=>{
        _.disj(_draggables,s);
        s.mojoh5.draggable = false;
      });
    };
    /**
     * @public
     * @function
     */
    _I.makePointer=function(el, skale){
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
        }
      };
      ptr.getGlobalPosition=function(){
        return {x: ptr.x, y: ptr.y}
      };
      ptr.moveHandler= function(event){
        let t = event.target;
        this._x = (event.pageX - t.offsetLeft);
        this._y = (event.pageY - t.offsetTop);
        event.preventDefault();
      };
      ptr.touchmoveHandler= function(event){
        let t = event.target;
        this._x = (event.targetTouches[0].pageX - t.offsetLeft);
        this._y = (event.targetTouches[0].pageY - t.offsetTop);
        event.preventDefault();
      };
      ptr.downHandler= function(event){
        this.isDown = true;
        this.isUp = false;
        this.tapped = false;
        this.downTime = _.now();
        this.press && this.press();
        event.preventDefault();
      };
      ptr.touchstartHandler= function(event){
        let t = event.target;
        this._x = event.targetTouches[0].pageX - t.offsetLeft;
        this._y = event.targetTouches[0].pageY - t.offsetTop;
        this.downTime = _.now();
        this.isDown = true;
        this.isUp = false;
        this.tapped = false;
        this.press && this.press();
        event.preventDefault();
      };
      ptr.upHandler= function(event){
        this.elapsedTime = Math.abs(this.downTime - _.now());
        if(this.elapsedTime <= 200 && this.tapped === false){
          this.tapped = true;
          this.tap && this.tap();
        }
        this.isUp = true;
        this.isDown = false;
        this.release && this.release();
        //`event.preventDefault();` needs to be disabled to prevent <input> range sliders
        //from getting trapped in Firefox (and possibly Safari)
        //event.preventDefault();
      };
      ptr.touchendHandler= function(event){
        this.elapsedTime = Math.abs(this.downTime - _.now());
        if(this.elapsedTime <= 200 && this.tapped === false){
          this.tapped = true;
          this.tap && this.tap();
        }
        this.isUp = true;
        this.isDown = false;
        this.release && this.release();
        //event.preventDefault();
      };
      ptr.hitTestSprite= function(sprite){
        return Mojo["2d"].hitTestPointXY(this.x,this.y,sprite,true)
      };
      _.addEvent("mousemove", el, ptr.moveHandler.bind(ptr), false);
      _.addEvent("mousedown", el,ptr.downHandler.bind(ptr), false);
      //Add the `mouseup` event to the `window` to
      //catch a mouse button release outside of the canvas area
      _.addEvent("mouseup", window, ptr.upHandler.bind(ptr), false);
      _.addEvent("touchmove", el, ptr.touchmoveHandler.bind(ptr), false);
      _.addEvent("touchstart", el, ptr.touchstartHandler.bind(ptr), false);
      //Add the `touchend` event to the `window` object to
      //catch a mouse button release outside of the canvas area
      _.addEvent("touchend", window, ptr.touchendHandler.bind(ptr), false);
      //Disable the default pan and zoom actions on the `canvas`
      el.style.touchAction = "none";
      _.conj(_pointers,ptr);
      return ptr;
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
      _pointers.length>0 && _F(_pointers[0]);
      //for(let i=1;i<_pointers.length;++i) F(_pointers[i]);
    };
    /**
     * @public
     * @function
     */
    _I.makeButton=function(o){
      o.mojoh5.state = "up";
      o.mojoh5.action = "";
      o.mojoh5.pressed = false;
      o.mojoh5.hoverOver = false;
      o.mojoh5.button=true;
      o.mojoh5.enabled = true;
      _.conj(_buttons,o);
    };
    /**
     * @public
     * @function
     */
    _I.removeButton=function(b){
      b.mojoh5.enabled=false;
      _.disj(_buttons,b);
    };
    /**
     * @public
     * @function
     */
    _I.updateButtons=function(){
      function _F(ptr){
        ptr.shouldBeHand = false;
        _buttons.forEach(o=>{
          if(o.mojoh5.enabled){
            let hit = ptr.hitTestSprite(o);
            if(ptr.isUp){
              o.mojoh5.state = "up";
              if(o.mojoh5.button) o.gotoAndStop(0);
            }
            if(hit){
              o.mojoh5.state = "over";
              if(o.totalFrames && o.totalFrames === 3 && o.mojoh5.button){
                o.gotoAndStop(1);
              }
              if(ptr.isDown){
                o.mojoh5.state = "down";
                if(o.mojoh5.button)
                  (o.totalFrames === 3) ? o.gotoAndStop(2) : o.gotoAndStop(1);
              }
              ptr.shouldBeHand = true;
              if(ptr.visible) ptr.cursor = "pointer";
            }else{
              if(ptr.visible) ptr.cursor = "auto";
            }
            if(o.mojoh5.state === "down"){
              if(!o.mojoh5.pressed){
                o.mojoh5.press && o.mojoh5.press();
                o.mojoh5.pressed = true;
                o.mojoh5.action = "pressed";
              }
            }
            if(o.mojoh5.state === "over"){
              if(o.mojoh5.pressed){
                o.mojoh5.release && o.mojoh5.release();
                o.mojoh5.pressed = false;
                o.mojoh5.action = "released";
                if(ptr.tapped && o.mojoh5.tap) o.tap();
              }
              if(!o.mojoh5.hoverOver){
                o.mojoh5.hover && o.mojoh5.hover();
                o.mojoh5.hoverOver = true;
              }
            }
            if(o.mojoh5.state === "up"){
              if(o.mojoh5.pressed){
                o.mojoh5.release && o.mojoh5.release();
                o.mojoh5.pressed = false;
                o.mojoh5.action = "released";
              }
              if(o.mojoh5.hoverOver){
                o.mojoh5.blur && o.mojoh5.blur();
                o.mojoh5.hoverOver = false;
              }
            }
          }
        });
        ptr.cursor = ptr.shouldBeHand ? "pointer" : "auto";
      }
      _pointers.length>0 && _F(_pointers[0]);
      //for(let i=1;i<_pointers.length;++i)_F(_pointers[i]);
    };
    /**
     * @public
     * @function
     */
    _I.button=function(source, x = 0, y = 0){
      let o, s0=source[0];
      if(is.str(s0)){
        o = Mojo.tcached(s0) ? Mojo.animFromFrames(source)
                             : Mojo.animFromImages(source);
      } else if(_.inst(Mojo.p.Texture,s0)){
        o = new Mojo.p.ASprite(source);
      }
      this.makeButton(_S.extend(o));
      o.x = x;
      o.y = y;
      return o;
    };
    /**
     * @public
     * @function
     */
    _I.update= function(dt){
      if(_draggables.length > 0) this.updateDragAndDrop(_draggables);
      if(_buttons.length > 0) this.updateButtons(dt);
    };
    /**
     * @public
     * @function
     */
    _I.keyboard=function(keyCode){
      let key = {
        code: keyCode,
        isDown: false,
        isUp: true,
        press: undefined,
        release: undefined};
      key.downHandler= function(event){
        if(event.keyCode === key.code){
          if(key.isUp && key.press) key.press();
          key.isDown = true;
          key.isUp = false;
        }
        event.preventDefault();
      };
      key.upHandler = function(event){
        if(event.keyCode === key.code) {
          if(key.isDown && key.release) key.release();
          key.isDown = false;
          key.isUp = true;
        }
        event.preventDefault();
      };

      _.addEvent("keydown", window, key.downHandler.bind(key), false);
      _.addEvent("keyup", window, key.upHandler.bind(key), false);

      return key;
    };
    /**
     * @public
     * @function
     */
    _I.arrowControl=function(sprite, speed){
      if(speed === undefined)
        throw `arrowControl requires speed`;
      let upArrow = this.keyboard(38);
      let rightArrow = this.keyboard(39);
      let downArrow = this.keyboard(40);
      let leftArrow = this.keyboard(37);

      leftArrow.press = function(){
        sprite.mojoh5.vel[0] = -speed;
        sprite.mojoh5.vel[1] = 0;
      };

      leftArrow.release = function(){
        //If the left arrow has been released, and the right arrow isn't down,
        //and the sprite isn't moving vertically:
        //Stop the sprite
        if(!rightArrow.isDown && sprite.mojoh5.vel[1] === 0)
          sprite.mojoh5.vel[0] = 0;
      };

      upArrow.press = function(){
        sprite.mojoh5.vel[1] = -speed;
        sprite.mojoh5.vel[0] = 0;
      };

      upArrow.release = function(){
        if(!downArrow.isDown && sprite.mojoh5.vel[0] === 0)
          sprite.mojoh5.vel[1] = 0;
      };

      rightArrow.press = function(){
        sprite.mojoh5.vel[0] = speed;
        sprite.mojoh5.vel[1] = 0;
      };

      rightArrow.release = function(){
        if(!leftArrow.isDown && sprite.mojoh5.vel[1] === 0)
          sprite.mojoh5.vel[0] = 0;
      };

      downArrow.press = function(){
        sprite.mojoh5.vel[1] = speed;
        sprite.mojoh5.vel[0] = 0;
      };

      downArrow.release = function(){
        if(!upArrow.isDown && sprite.mojoh5.vel[0] === 0)
          sprite.mojoh5.vel[1] = 0;
      };
    };

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

