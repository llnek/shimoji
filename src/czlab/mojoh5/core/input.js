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

  /**Creates the module.
   */
  function _module(Mojo,ActiveTouches,Buttons,DragDrops){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_,is,EventBus}=Mojo;
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
      if(ptr && ptr.state[0]){
        if(!ptr.dragged){
          for(let s,i=DragDrops.length-1; i>=0; --i){
            s=DragDrops[i];
            if(s.m5.drag && ptr.hitTest(s)){
              let cs= s.parent.children,
                  g=Mojo.Sprites.gposXY(s);
              ptr.dragOffsetX = ptr.x - g[0];
              ptr.dragOffsetY = ptr.y - g[1];
              ptr.dragged = s;
              //pop it up to top
              _.disj(cs,s);
              _.conj(cs,s);
              _.disj(DragDrops,s);
              _.conj(DragDrops,s);
              break;
            }
          }
        }else{
          ptr.dragged.x= ptr.x - ptr.dragOffsetX;
          ptr.dragged.y= ptr.y - ptr.dragOffsetY;
        }
      }
      if(ptr && ptr.state[1]){
        ptr.dragged=null;
      }
    }

    const _$={
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
      ptr:null,
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/Input
       */
      resize(){
        this.ptr && this.ptr.dispose();
        Mojo.mouse= this.pointer(Mojo.canvas, Mojo.scale);
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
        const key={press:press, release:release,
                   isDown:false, isUp:true, code:_key};
        function _down(e){
          e.preventDefault();
          if(e.keyCode === key.code){
            key.isUp && key.press && key.press();
            key.isUp=false; key.isDown=true; }
        }
        function _up(e){
          e.preventDefault();
          if(e.keyCode === key.code){
            key.isDown && key.release && key.release();
            key.isUp=true; key.isDown=false; }
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
        DragDrops.length>0 && _updateDrags(this.ptr)
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
          state: [false,true,false],
          //isDown: false, isUp: true, tapped: false,
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
          get isUp(){return this.state[1]},
          get isDown(){return this.state[0]},
          get isClicked(){return this.state[2]},
          set visible(v) {
            this.cursor = v ? "auto" : "none";
            this._visible = v;
          },
          getGlobalPosition(){
            return {x: this.x, y: this.y}
          },
          press(){
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
              ptr._x = e.pageX - e.target.offsetLeft;
              ptr._y = e.pageY - e.target.offsetTop;
              ptr.downTime = _.now();
              //down,up,pressed
              _.setVec(ptr.state,true,false,true);
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
              _.setVec(ptr.state,false,true);
              //ptr.isDown = false;
              //ptr.isUp = true;
              if(ptr.state[2]){//pressed
                ptr.press();
                ptr.state[2]=false;
              }
              e.preventDefault();
              EventBus.pub(["mouseup"]);
            }
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
            ptr.downTime = _.now();
            _.setVec(ptr.state,true,false,true);
            //ptr.isDown = true; ptr.isUp = false; ptr.tapped = true;
            e.preventDefault();
            _.assoc(ActiveTouches,tid,ptr._copyTouch(ct[0],t));
            EventBus.pub(["touchstart"]);
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
            EventBus.pub(["touchmove"]);
          },
          touchEnd(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(ActiveTouches,tid);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            _.setVec(ptr.state,false,true);
            //ptr.isDown = false; ptr.isUp = true;
            ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
            if(ptr.state[2]){
              if(active && ptr.elapsedTime <= 200){
                ptr.tap();
              }
              ptr.state[2]=false;
            }
            e.preventDefault();
            EventBus.pub(["touchend"]);
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
          },
          reset(){
            _.setVec(ptr.state,false,true,false);
            //ptr.pressed=false; ptr.tapped=false; ptr.isDown=false; ptr.isUp=true;
          },
          hitTest(s){
            let _S=Mojo.Sprites,
                g=_S.gposXY(s),
                p=_S.toPolygon(s),
                ps=_V.translate(g,p.calcPoints);
            return Geo.hitTestPointInPolygon(ptr.x,ptr.y,ps);
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
        return this.ptr=ptr;
      }
    };

    //handle resize
    EventBus.sub(["canvas.resize"], "resize",_$);

    //keep tracks of keyboard presses
    _.addEvent([["keyup", window, _uh, false],
                ["keydown", window, _dh, false]]);

    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M,new Map(),[],[])
    }
  }

})(this);

