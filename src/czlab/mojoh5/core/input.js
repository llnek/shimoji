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
  let window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Input=function(Mojo){
    let _element=Mojo.canvas;
    let _scale=Mojo.scale;
    const _=Mojo.u;
    const is=Mojo.is;
    const _pointers = [];
    const _buttons = [];
    const _draggableSprites = [];
    const _S=Mojo.Sprites;
    const _I= {
      get scale() { return _scale },
      set scale(v) { _scale = v; _.doseq(_pointers, p=> {p.scale=v}) }
    };
    /**
     * @public
     * @function
     */
    _I.makeDraggable= function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      sprites.forEach(s=>{
        _.conj(_draggableSprites,s);
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
      sprites.forEach(s=>{
        _.disj(_draggableSprites,s);
        s.mojoh5.draggable = false;
      });
    };
    /**
     * @public
     * @function
     */
    _I.makePointer=function(element, scale){
      let ptr= {
        element: element || _element,
        _scale: scale || _scale,
        _x: 0,
        _y: 0,
        width: 1,
        height: 1,
        isDown: false,
        isUp: true,
        tapped: false,
        downTime: 0,
        elapsedTime: 0,

        press: undefined,
        release: undefined,
        hover: undefined,
        blur: undefined,
        tap: undefined,

        dragSprite: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        _visible: true,
        get x() { return this._x / this.scale },
        get y() { return this._y / this.scale },
        get centerX() { return this.x },
        get centerY() { return this.y },
        get position() { return { x: this.x, y: this.y } },
        get scale() { return this._scale },
        set scale(v) { this._scale = v },
        get cursor() { return this.element.style.cursor },
        set cursor(v) { this.element.style.cursor = v },
        get visible() { return this._visible },
        set visible(v) {
          this.cursor = v ? "auto" : "none";
          this._visible = v;
        }
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
        let soff= _S.anchorOffsetXY(sprite);
        let g=_S.gposXY(sprite);
        let sz=_S.halfSize(sprite);
        //let h2=sprite.height/2;
        //let w2=sprite.width/2;
        let hit = false;
        if(!sprite.mojoh5.circular){
          let left = g.x - soff.x;
          let top = g.y - soff.y;
          let right = g.x + sprite.width - soff.x;
          let bottom = g.y + sprite.height - soff.y;
          hit = this.x > left && this.x < right && this.y > top && this.y < bottom;
        }else{
          //circle h=w
          let vx = this.x - (g.x + sz.x - soff.x);
          let vy = this.y - (g.y + sz.y - soff.y);
          let d2= vx * vx + vy * vy;
          hit = d2 < (sz.x*sz.x);
        }
        return hit;
      };
      _.addEvent("mousemove", element, ptr.moveHandler.bind(ptr), false);
      _.addEvent("mousedown", element,ptr.downHandler.bind(ptr), false);
      //Add the `mouseup` event to the `window` to
      //catch a mouse button release outside of the canvas area
      _.addEvent("mouseup", window, ptr.upHandler.bind(ptr), false);
      _.addEvent("touchmove", element, ptr.touchmoveHandler.bind(ptr), false);
      _.addEvent("touchstart", element, ptr.touchstartHandler.bind(ptr), false);
      //Add the `touchend` event to the `window` object to
      //catch a mouse button release outside of the canvas area
      _.addEvent("touchend", window, ptr.touchendHandler.bind(ptr), false);
      //Disable the default pan and zoom actions on the `canvas`
      element.style.touchAction = "none";
      _.conj(_pointers,ptr);
      return ptr;
    };
    /**
     * @public
     * @function
     */
    _I.updateDragAndDrop=function(draggableSprites){
      _pointers.forEach(ptr=>{
        if(ptr.isDown){
          if(!ptr.dragSprite){
            for(let s,i=draggableSprites.length-1; i>=0; --i){
              s= draggableSprites[i];
              if(s.mojoh5.draggable && ptr.hitTestSprite(s)){
                let g= _S.gposXY(s);
                ptr.dragOffsetX = ptr.x - g.x;
                ptr.dragOffsetY = ptr.y - g.y;
                ptr.dragSprite = s;
                //The next two lines re-order the `sprites` array so that the
                //selected sprite is displayed above all the others.
                //First, splice the sprite out of its current position in
                //its parent's `children` array
                let cs = s.parent.children;
                _.disj(cs,s);
                //Next, push the `dragSprite` to the end of its `children` array so that it's
                //displayed last, above all the other sprites
                _.conj(cs,s);
                //Reorganize the `draggableSpites` array in the same way
                _.disj(draggableSprites,s);
                _conj(draggableSprites,s);
                break;
              }
            }
          }else{
            //If the pointer is down and it has a `dragSprite`, make the sprite follow the pointer's
            //position, with the calculated offset
            ptr.dragSprite.x = ptr.x - ptr.dragOffsetX;
            ptr.dragSprite.y = ptr.y - ptr.dragOffsetY;
          }
        }
        if(ptr.isUp)
          ptr.dragSprite = null;
        //Change the mouse arrow pointer to a hand if it's over a
        //draggable sprite
        draggableSprites.some(s=>{
          if(s.mojoh5.draggable && ptr.hitTestSprite(s)){
            if(ptr.visible) ptr.cursor = "pointer";
            return true;
          } else {
            if(ptr.visible) ptr.cursor = "auto";
            return false;
          }
        });
      });
    };
    /**
     * @public
     * @function
     */
    _I.makeInteractive=function(o){
      //The `state` property tells you the button's
      //current state. Set its initial state to "up"
      o.mojoh5.state = "up";
      //The `action` property tells you whether its being pressed or
      //released
      o.mojoh5.action = "";
      //The `pressed` and `hoverOver` Booleans are mainly for internal
      //use in this code to help figure out the correct state.
      //`pressed` is a Boolean that helps track whether or not
      //the sprite has been pressed down
      o.mojoh5.pressed = false;
      //`hoverOver` is a Boolean which checks whether the pointer
      //has hovered over the sprite
      o.mojoh5.hoverOver = false;
      //tinkType is a string that will be set to "button" if the
      //user creates an object using the `button` function
      o.mojoh5.tinkType = "";
      //Set `enabled` to true to allow for interactivity
      //Set `enabled` to false to disable interactivity
      o.mojoh5.enabled = true;
      //Add the sprite to the global `buttons` array so that it can
      //be updated each frame in the `updateButtons method
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
    _I.updateButtons=function() {
      _pointers.forEach(ptr=>{
        ptr.shouldBeHand = false;
        _buttons.forEach(o=>{
          if(o.mojoh5.enabled){
            let hit = ptr.hitTestSprite(o);
            if(ptr.isUp){
              o.mojoh5.state = "up";
              if(o.mojoh5.tinkType === "button") o.gotoAndStop(0);
            }
            if(hit){
              o.mojoh5.state = "over";
              if(o.totalFrames && o.totalFrames === 3 && o.mojoh5.tinkType === "button"){
                o.gotoAndStop(1);
              }
              if(ptr.isDown){
                o.mojoh5.state = "down";
                if(o.mojoh5.tinkType === "button")
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
      });
    };
    /**
     * @public
     * @function
     */
    _I.button= function(source, x = 0, y = 0){
      let o, s0=source[0];
      if(is.str(s0)){
        o = Mojo.tcached(s0) ? Mojo.animFromFrames(source) : Mojo.animFromImages(source);
      } else if(_.inst(Mojo.p.Texture,s0)){
        o = new Mojo.p.ASprite(source);
      }
      this.makeInteractive(_S.extend(o));
      o.mojoh5.tinkType = "button";
      o.x = x;
      o.y = y;
      return o;
    };
    /**
     * @public
     * @function
     */
    _I.update= function(dt){
      if(_draggableSprites.length !== 0) this.updateDragAndDrop(_draggableSprites);
      if(_buttons.length !== 0) this.updateButtons();
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
      let upArrow = this.keyboard(38),
        rightArrow = this.keyboard(39),
        downArrow = this.keyboard(40),
        leftArrow = this.keyboard(37);

      leftArrow.press = function(){
        sprite.mojoh5.vx = -speed;
        sprite.mojoh5.vy = 0;
      };

      leftArrow.release = function(){
        //If the left arrow has been released, and the right arrow isn't down,
        //and the sprite isn't moving vertically:
        //Stop the sprite
        if(!rightArrow.isDown && sprite.mojoh5.vy === 0)
          sprite.mojoh5.vx = 0;
      };

      upArrow.press = function(){
        sprite.mojoh5.vy = -speed;
        sprite.mojoh5.vx = 0;
      };

      upArrow.release = function(){
        if(!downArrow.isDown && sprite.mojoh5.vx === 0)
          sprite.mojoh5.vy = 0;
      };

      rightArrow.press = function(){
        sprite.mojoh5.vx = speed;
        sprite.mojoh5.vy = 0;
      };

      rightArrow.release = function(){
        if(!leftArrow.isDown && sprite.mojoh5.vy === 0)
          sprite.mojoh5.vx = 0;
      };

      downArrow.press = function(){
        sprite.mojoh5.vy = speed;
        sprite.mojoh5.vx = 0;
      };

      downArrow.release = function(){
        if(!upArrow.isDown && sprite.mojoh5.vx === 0)
          sprite.mojoh5.vy = 0;
      };
    };

    return Mojo.Input= _I;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

