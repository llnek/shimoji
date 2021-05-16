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

  /**Creates the module. */
  function _module(Mojo,ActiveTouches,Buttons,DragDrops){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_,is}=Mojo;
    const _keyInputs= _.jsMap();

    /**
     * @module mojoh5/Input
     */

    /** @ignore */
    function _uh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,false); }

    /** @ignore */
    function _dh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,true); }

    /** @ignore */
    function _updateDrags(ptr){
      if(ptr.state[0]){
        if(ptr.dragged){
          let px=ptr.dragged.x;
          let py=ptr.dragged.y;
          _V.set(ptr.dragged, ptr.dragStartX+(ptr.x-ptr.dragPtrX),
                              ptr.dragStartY+(ptr.y-ptr.dragPtrY));
        }else{
          for(let g,cs,s,i=DragDrops.length-1; i>=0; --i){
            s=DragDrops[i];
            if(s.m5.drag && ptr.hitTest(s)){
              cs= s.parent.children;
              ptr.dragged = s;
              ptr.dragStartX = s.x;
              ptr.dragStartY = s.y;
              ptr.dragPtrX= ptr.x;
              ptr.dragPtrY= ptr.y;
              //pop it up to top
              _.disj(DragDrops,s);
              _.disj(cs,s);
              DragDrops.push(s);
              cs.push(s);
              break;
            }
          }
        }
      }
      if(ptr.state[1]){
        //dragged and now dropped
        if(ptr.dragged &&
           ptr.dragged.m5.onDragDropped)
          ptr.dragged.m5.onDragDropped();
        ptr.dragged=null;
      }
    }

    let _pauseInput=false;
    const _$={
      LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40,
      ZERO: 48, ONE: 49, TWO: 50,
      THREE: 51, FOUR: 52, FIVE: 53,
      SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
      A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
      G: 71, H: 72, I: 73, J: 74, K: 75, L: 76,
      M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82,
      S: 83, T: 84, U: 85, V: 86, W: 87, X: 88,
      Y: 89, Z: 90,
      ENTER: 13, ESC: 27, BACKSPACE: 8, TAB: 9,
      SHIFT: 16, CTRL: 17, ALT: 18, SPACE: 32,
      HOME: 36, END: 35,
      PGGUP: 33, PGDOWN: 34,
      ptr:null,
      resume(){ _pauseInput=false },
      pause(){ _pauseInput=true },
      isPaused(){ return _pauseInput },
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/Input
       */
      resize(){
        this.ptr.dispose();
        Mojo.mouse= this.pointer();
      },
      /**Clear all keyboard states.
       * @memberof module:mojoh5/Input
       */
      reset(){ _keyInputs.clear() },
      /**
       * @memberof module:mojoh5/Input
       * @param {number} _key
       */
      keybd(_key,press,release){
        const key={press:press,
                   release:release,
                   isDown:false, isUp:true};
        key.code= is.vec(_key)?_key:[_key];
        function _down(e){
          e.preventDefault();
          if(key.code.includes(e.keyCode)){
            !_pauseInput && key.isUp && key.press && key.press();
            key.isUp=false; key.isDown=true;
          }
        }
        function _up(e){
          e.preventDefault();
          if(key.code.includes(e.keyCode)){
            !_pauseInput && key.isDown && key.release && key.release();
            key.isUp=true; key.isDown=false;
          }
        }
        _.addEvent([["keyup", window, _up, false],
                    ["keydown", window, _down, false]]);
        key.dispose=()=>{
          _.delEvent([["keyup", window, _up],
                      ["keydown", window, _down]]);
        }
        return key;
      },
      /**This sprite is no longer a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoButton(b){
        b.m5.enabled=false;
        b.m5.button=false;
        _.disj(Buttons,b);
        return b;
      },
      /**This sprite is now a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeButton(b){
        b.m5.enabled = true;
        b.m5.button=true;
        _.conj(Buttons,b);
        return b;
      },
      /** @ignore */
      update(dt){
        !_pauseInput && DragDrops.length>0 && _updateDrags(this.ptr)
      },
      /**This sprite is now draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      makeDrag(s){
        _.conj(DragDrops,s);
        s.m5.drag=true;
        return s;
      },
      /**This sprite is now not draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      undoDrag(s){
        _.disj(DragDrops,s);
        s.m5.drag=false;
        return s;
      },
      /**Check if this key is currently not pressed.
       * @memberof module:mojoh5/Input
       * @param {number} code
       * @return {boolean}
       */
      keyUp(code){ return !this.keyDown(code) },
      /**Check if this key is currently pressed.
       * @memberof module:mojoh5/input
       * @param {number} code
       * @return {boolean}
       */
      keyDown(code){ return _keyInputs.get(code)===true },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        let ptr={
          state: [false,true],
          //isDown: false, isUp: true, tapped: false,
          _visible: true,
          _x: 0,
          _y: 0,
          width: 1,
          height: 1,
          downTime: 0,
          downAt:[0,0],
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
          get isUp(){return this.state[1]},
          get isDown(){return this.state[0]},
          set visible(v) {
            this.cursor = v ? "auto" : "none";
            this._visible = v;
          },
          getGlobalPosition(){
            return {x: this.x, y: this.y}
          },
          press(){
            if(!_pauseInput)
              for(let s,i=0,z=Buttons.length;i<z;++i){
                s=Buttons[i];
                if(s.m5.enabled &&
                   s.m5.press &&
                   ptr.hitTest(s)){
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
              e.preventDefault();
              ptr._x = e.pageX - e.target.offsetLeft;
              ptr._y = e.pageY - e.target.offsetTop;
              //down,up,pressed
              _.setVec(ptr.state,true,false);
              ptr.downAt[0]=ptr._x;
              ptr.downAt[1]=ptr._y;
              ptr.downTime = _.now();
              Mojo.Sound.init();
              !_pauseInput && Mojo.emit(["mousedown"]);
            }
          },
          mouseMove(e){
            ptr._x = e.pageX - e.target.offsetLeft;
            ptr._y = e.pageY - e.target.offsetTop;
            //e.preventDefault();
            !_pauseInput && Mojo.emit(["mousemove"]);
          },
          mouseUp(e){
            if(e.button===0){
              e.preventDefault();
              ptr.elapsedTime = Math.max(0,_.now()-ptr.downTime);
              ptr._x = e.pageX - e.target.offsetLeft;
              ptr._y = e.pageY - e.target.offsetTop;
              _.setVec(ptr.state,false,true);
              !_pauseInput && Mojo.emit(["mouseup"]);
              let v= _V.vecAB(ptr.downAt,ptr);
              let z= _V.len2(v);
              if(!ptr.dragged){
                //small distance and fast then a click
                if(z<400 && ptr.elapsedTime<200){
                  !_pauseInput && Mojo.emit(["single.tap"]);
                  ptr.press();
                }else{
                  //maybe a swipe
                  ptr._swipeMotion(v,z,ptr.elapsedTime);
                }
              }
            }
          },
          _swipeMotion(v,dd,dt){
            let n= _V.unit$(_V.normal(v));
            let rc;
            //up->down n(1,0)
            //bottom->up n(-1,0)
            //right->left n(0,1)
            //left->right n(0,-1)
            if(dd>400 && dt<1000 &&
               (Math.abs(n[0]) > 0.8 || Math.abs(n[1]) > 0.8)){
              if(n[0] > 0.8){
                rc="swipe.down";
              }
              if(n[0] < -0.8){
                rc="swipe.up";
              }
              if(n[1] > 0.8){
                rc="swipe.left";
              }
              if(n[1] < -0.8){
                rc="swipe.right";
              }
            }
            if(!_pauseInput)
              if(rc)
                Mojo.emit([rc])
          },
          _copyTouch(t,target){
            return{offsetLeft:target.offsetLeft,
                   offsetTop:target.offsetTop,
                   clientX:t.clientX,
                   clientY:t.clientY,
                   pageX:t.pageX,
                   pageY:t.pageY,
                   identifier:t.identifier}
          },
          touchStart(e){
            let ct=e.changedTouches; //multitouch
            //let tt=e.targetTouches;//single touch
            let t = e.target;
            let tid=ct[0].identifier||0;
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            _.setVec(ptr.state,true,false);
            ptr.downAt[0]=ptr._x;
            ptr.downAt[1]=ptr._y;
            ptr.downTime = _.now();
            _.assoc(ActiveTouches,tid,ptr._copyTouch(ct[0],t));
            Mojo.Sound.init();
            e.preventDefault();
            !_pauseInput && Mojo.emit(["touchstart"]);
          },
          touchMove(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(ActiveTouches,tid);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            e.preventDefault();
            !_pauseInput && Mojo.emit(["touchmove"]);
          },
          touchEnd(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let nn=_.now();
            let tid= ct[0].identifier||0;
            let active = _.get(ActiveTouches,tid);
            ptr.elapsedTime = Math.max(0,nn-ptr.downTime);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            _.setVec(ptr.state,false,true);
            e.preventDefault();
            !_pauseInput && Mojo.emit(["touchend"]);
            if(!ptr.dragged){
              let v= _V.vecAB(ptr.downAt,ptr);
              let z= _V.len2(v);
              if(active && z<400 && ptr.elapsedTime<200){
                !_pauseInput && Mojo.emit(["single.tap"]);
                ptr.press();
              }else{
                ptr._swipeMotion(v,z,ptr.elapsedTime);
              }
            }
          },
          touchCancel(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t=e.target;
            let t0=ct[0];
            let tid= touch.identifier || 0;
            let active = _.get(ActiveTouches,tid);
            e.preventDefault();
            if(active)
              _.dissoc(ActiveTouches,tid);
            _.setVec(ptr.state,false,true);
          },
          reset(){
            _.setVec(ptr.state,false,true);
            Buttons.length=0;
            DragDrops.length=0;
          },
          hitTest(s){
            let _S=Mojo.Sprites,
                g=_S.gposXY(s),
                p=_S.toPolygon(s),
                ps=_V.translate(g,p.calcPoints);
            return Geo.hitTestPointInPolygon(ptr.x,ptr.y,ps);
          }
        };

        const sigs=[["mousemove", Mojo.canvas, ptr.mouseMove],
                    ["mousedown", Mojo.canvas,ptr.mouseDown],
                    ["mouseup", window, ptr.mouseUp],
                    ["touchmove", Mojo.canvas, ptr.touchMove],
                    ["touchstart", Mojo.canvas, ptr.touchStart],
                    ["touchend", window, ptr.touchEnd],
                    ["touchcancel", window, ptr.touchCancel]];
        _.addEvent(sigs);
        ptr.dispose=function(){
          ptr.reset();
          _.delEvent(sigs);
        };
        //disable the default actions on the canvas
        Mojo.canvas.style.touchAction = "none";
        return this.ptr=ptr;
      },
      dispose(){
        _.delEvent([["keyup", window, _uh, false],
                    ["keydown", window, _dh, false]]);
      }
    };

    //keep tracks of keyboard presses
    _.addEvent([["keyup", window, _uh, false],
                ["keydown", window, _dh, false]]);

    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M,new Map(),[],[])
    }
  }

})(this);

