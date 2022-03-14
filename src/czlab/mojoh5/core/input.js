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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module. */
  function _module(Mojo){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_,is}=Mojo;
    const Layers= [];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const cur=()=> Layers[0];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkLayer(L={}){
      function _uh(e){
        L.keyInputs.set(e.keyCode,false);
        L.shiftKey=e.shiftKey;
        L.ctrlKey=e.ctrlKey;
        L.altKey=e.altKey;
        e.preventDefault();
      }
      function _dh(e){
        L.keyInputs.set(e.keyCode,true);
        L.ctrlKey= false;
        L.altKey= false;
        L.shiftKey=false;
        e.preventDefault();
      }
      _.inject(L,{
        keyInputs: _.jsMap(),
        pauseInput:false,
        ctrlKey:false,
        altKey:false,
        shiftKey:false,
        ptr:UNDEF,
        dispose(){
          this.ptr.dispose();
          if(!Mojo.touchDevice)
            _.delEvent([["keyup", window, _uh, false],
                        ["keydown", window, _dh, false]]);
        },
        pointer(){
          if(!this.ptr)
            this.ptr=mkPtr(this);
          return this.ptr;
        },
        update(dt){
          if(!this.pauseInput) this.ptr.update(dt);
        },
        keybd(_key,press,release){
          const self=this;
          const key={press,
                     release,
                     isDown:false, isUp:true,
                     ctrl:false, alt:false, shift:false};
          key.code= is.vec(_key)?_key:[_key];
          function _down(e){
            e.preventDefault();
            if(key.code.includes(e.keyCode)){
              key.ctrl=e.ctrlKey;
              key.alt=e.altKey;
              key.shift=e.shiftKey;
              if(!self.pauseInput && key.isUp)
                key.press && key.press(key.alt,key.ctrl,key.shift);
              key.isUp=false;
              key.isDown=true;
            }
          }
          function _up(e){
            e.preventDefault();
            if(key.code.includes(e.keyCode)){
              if(!self.pauseInput)
                key.isDown && key.release && key.release();
              key.isUp=true; key.isDown=false;
              key.ctrl=false; key.alt=false; key.shift=false;
            }
          }
          if(!Mojo.touchDevice)
            _.addEvent([["keyup", window, _up, false],
                        ["keydown", window, _down, false]]);
          key.dispose=()=>{
            if(!Mojo.touchDevice)
              _.delEvent([["keyup", window, _up, false],
                          ["keydown", window, _down, false]]);
          }
          return key;
        },
        reset(){
          this.pauseInput=false;
          this.ctrlKey=false;
          this.altKey=false;
          this.shiftKey=false;
          this.ptr.reset();
          this.keyInputs.clear();
        },
        resize(){
          Mojo.mouse=this.ptr;
          this.ptr.reset();
        },
        dbg(){
          console.log(`N# of touches= ${this.ptr.ActiveTouches.size}`);
          console.log(`N# of hotspots= ${this.ptr.Hotspots.length}`);
          console.log(`N# of buttons= ${this.ptr.Buttons.length}`);
          console.log(`N# of drags= ${this.ptr.DragDrops.length}`);
          console.log(`Mouse pointer = ${this.ptr}`);
        }
      });

      L.pointer();

      if(!Mojo.touchDevice)
        //keep tracks of keyboard presses
        _.addEvent([["keyup", window, _uh, false],
                    ["keydown", window, _dh, false]]);

      return L;
    }

    /**
     * @module mojoh5/Input
     */

    const HISTORY_SIZE=20,
          TRAIL_SIZE =100;

    /** @ignore */
    function mkPtr(L){
      let P={
        ActiveDragsID: _.jsMap(),
        ActiveDrags: _.jsMap(),
        ActiveTouches: _.jsMap(),
        Hotspots:[],
        Buttons:[],
        DragDrops:[],
        //down,up
        state: [false,true],
        touchZeroID:0,
        _visible: true,
        _x: 0,
        _y: 0,
        width: 1,
        height: 1,
        downTime: 0,
        downAt:[0,0],
        elapsedTime: 0,
        dragged: UNDEF,
        dragOffsetX: 0,
        dragOffsetY: 0,
        anchor: Mojo.makeAnchor(0.5,0.5),
        get cursor(){ return Mojo.canvas.style.cursor },
        set cursor(v){ Mojo.canvas.style.cursor = v },
        get x(){ return this._x / Mojo.scale },
        get y(){ return this._y / Mojo.scale },
        get visible(){ return this._visible },
        get isUp(){return this.state[1]},
        get isDown(){return this.state[0]},
        set visible(v){
          this.cursor = v ? "auto" : "none";
          this._visible = v;
        },
        updateMultiDrags(dt){
          let self=P;
          for(let cs,a,i=0; i < self.ActiveTouches.length; ++i){
            a=self.ActiveTouches[i];
            for(let p,s,i=self.DragDrops.length-1; i>=0; --i){
              s=self.DragDrops[i];
              p=self.ActiveDrags.get(s.m5.uuid);
              if(p){
                _V.set(p.dragged, p.dragStartX+(a.x-p.dragPtrX),
                                  p.dragStartY+(a.y-p.dragPtrY));
                break;
              }
              if(s.m5.drag && self._test(s,a.x,a.y)){
                _.assoc(self.ActiveDrags, s.m5.uuid, p={
                  dragStartX: s.x,
                  dragStartY: s.y,
                  dragPtrX: a.x,
                  dragPtrY: a.y,
                  dragged: s,
                  id: a.id
                });
                _.assoc(self.ActiveDragsID, a.id, p);
                //pop it up to top
                cs= s.parent.children;
                _.disj(cs,s);
                cs.push(s);
                break;
              }
            }
          }
        },
        updateDrags(dt){
          if(this.state[0]){
            if(this.dragged){
              _V.set(this.dragged, this.dragStartX+(this.x-this.dragPtrX),
                                   this.dragStartY+(this.y-this.dragPtrY));
            }else{
              for(let gp,cs,s,i=this.DragDrops.length-1; i>=0; --i){
                s=this.DragDrops[i];
                if(s.m5.drag && this.hitTest(s)){
                  this.dragStartX = s.x;
                  this.dragStartY = s.y;
                  this.dragPtrX= this.x;
                  this.dragPtrY= this.y;
                  this.dragged = s;
                  //pop it up to top
                  cs= s.parent.children;
                  _.disj(cs,s);
                  cs.push(s);
                  break;
                }
              }
            }
          }
          if(this.state[1]){
            //dragged and now dropped
            if(this.dragged &&
               this.dragged.m5.onDragDropped)
              this.dragged.m5.onDragDropped();
            this.dragged=UNDEF;
          }
        },
        getGlobalPosition(){
          return {x: this.x, y: this.y}
        },
        _press(){
          let i, s, found,z=this.Buttons.length;
          for(i=0;i<z;++i){
            s=this.Buttons[i];
            if(s.m5.gui && s.m5.press && this.hitTest(s)){
              s.m5.press(s);
              found=true;
              break;
            }
          }
          if(!found)
            for(i=0;i<z;++i){
              s=this.Buttons[i];
              if(s.m5.press && this.hitTest(s)){
                s.m5.press(s);
                break;
              }
            }
        },
        _doMDown(b){
          let found,self=P;
          for(let s,i=0;i<self.Hotspots.length;++i){
            s=self.Hotspots[i];
            if(s.m5.touch && self.hitTest(s)){
              s.m5.touch(s,b);
              found=true;
              break;
            }
          }
          return found;
        },
        mouseDown(e){
          let self=P, nn=_.now();
          //left click only
          if(e.button==0){
            e.preventDefault();
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            //down,up,pressed
            _.setVec(self.state,true,false);
            self.downTime = nn;
            self.downAt[0]=self._x;
            self.downAt[1]=self._y;
            Mojo.Sound.init();
            if(!L.pauseInput){
              Mojo.emit(["mousedown"]);
              self._doMDown(true);
            }
            //console.log(`mouse x= ${self.x}, y = ${self.y}`);
          }
        },
        mouseMove(e){
          let self=P;
          self._x = e.pageX - e.target.offsetLeft;
          self._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          if(!L.pauseInput)
            Mojo.emit(["mousemove"]);
        },
        mouseUp(e){
          let self=P,nn=_.now();
          if(e.button==0){
            e.preventDefault();
            self.elapsedTime = Math.max(0, nn - self.downTime);
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            _.setVec(self.state,false,true);
            if(!L.pauseInput){
              Mojo.emit(["mouseup"]);
              if(!self._doMDown(false)){
                let v= _V.vecAB(self.downAt,self);
                let z= _V.len2(v);
                //small distance and fast then a click
                if(z<400 && self.elapsedTime<200){
                  Mojo.emit(["single.tap"]);
                  self._press();
                }else{
                  self._swipeMotion(v,z,self.elapsedTime);
                }
              }
            }
          }
        },
        _swipeMotion(v,dd,dt,arg){
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
          if(rc)
            Mojo.emit([rc], arg)
        },
        _doMTouch(ts,flag){
          let self=P,
              found=_.jsMap();
          for(let a,i=0; i<ts.length; ++i){
            a=ts[i];
            for(let s,j=0; j<self.Hotspots.length; ++j){
              s=self.Hotspots[j];
              if(s.m5.touch && self._test(s,a.x,a.y)){
                s.m5.touch(s,flag);
                found.set(a.id,1);
                break;
              }
            }
          }
          return found;
        },
        _doMDrag(ts,found){
          let self=P;
          for(let p,a,i=0; i<ts.length;++i){
            a=ts[i];
            if(found.get(a.id)){continue}
            p=self.ActiveDragsID.get(a.id);
            if(p){
              found.set(a.id,1);
              p.dragged.m5.onDragDropped &&
              p.dragged.m5.onDragDropped();
              self.ActiveDragsID.delete(a.id);
              self.ActiveDrags.delete(p.dragged.m5.uuid);
            }
          }
          return found;
        },
        touchCancel(e){
          console.warn("received touchCancel event!");
          this.freeTouches();
        },
        touchStart(e){
          let self=P,
              t= e.target,
              out=[],
              nn= _.now(),
              T= e.targetTouches,
              A= self.ActiveTouches;
          e.preventDefault();
          for(let a,cx,cy,id,o,i=0;i<T.length;++i){
            o=T[i];
            id=o.identifier;
            cx = o.pageX - t.offsetLeft;
            cy = o.pageY - t.offsetTop;
            _.assoc(A, id, a={
              id, _x:cx, _y:cy,
              downTime: nn, downAt: [cx,cy],
              x:cx/Mojo.scale, y:cy/Mojo.scale
            });
            out.push(a);
            //handle single touch case
            if(i===0){
              self.touchZeroID=id;
              self._x = cx;
              self._y = cy;
              self.downTime= nn;
              self.downAt= [cx,cy];
              _.setVec(self.state,true,false);
            }
          }
          Mojo.Sound.init();
          if(!L.pauseInput){
            Mojo.emit(["touchstart"],out);
            self._doMTouch(out,true);
          }
        },
        touchMove(e){
          let out=[],
              self=P,
              t = e.target,
              T = e.targetTouches;
          e.preventDefault();
          for(let cx,cy,a,o,id,i=0;i<T.length;++i){
            o=T[i];
            id= o.identifier;
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            if(id==self.touchZeroID){
              self._x = cx;
              self._y = cy;
            }
            if(a= self.ActiveTouches.get(id)){
              a.x=cx/Mojo.scale;
              a.y=cy/Mojo.scale;
              a._x = cx;
              a._y = cy;
              out.push(a);
            }
          }
          if(!L.pauseInput)
            Mojo.emit(["touchmove"],out);
        },
        touchEnd(e){
          let self=P,
              out=[],
              T = e.targetTouches,
              C = e.changedTouches,
              cx,cy,i,a,o,id,
              t = e.target, nn=_.now();
          e.preventDefault();
          for(i=0;i<C.length;++i){
            o=C[i];
            id=o.identifier;
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            a=self.ActiveTouches.get(id);
            if(id==self.touchZeroID){
              self.elapsedTime = Math.max(0,nn-self.downTime);
              _.setVec(self.state,false,true);
              self._x= cx;
              self._y= cy;
            }
            if(a){
              a.elapsedTime = Math.max(0,nn-a.downTime);
              self.ActiveTouches.delete(id);
              a._x= cx;
              a._y= cy;
              a.x=cx/Mojo.scale;
              a.y=cy/Mojo.scale;
              out.push(a);
            }
          }
          if(!L.pauseInput){
            Mojo.emit(["touchend"],out);
            let found= self._doMTouch(out,false);
            self._doMDrag(out,found);
            self._onMultiTouches(out,found);
          }
        },
        _onMultiTouches(ts,found){
          let self=P;
          for(let a,v,z,j=0; j<ts.length; ++j){
            a=ts[j];
            if(found.get(a.id)){continue}
            v= _V.vecAB(a.downAt,a);
            z= _V.len2(v);
            if(z<400 && a.elapsedTime<200){
              Mojo.emit(["single.tap"],a);
              for(let s,i=0,n=self.Buttons.length;i<n;++i){
                s=self.Buttons[i];
                if(s.m5.press && self._test(s, a.x, a.y)){
                  s.m5.press(s);
                  break;
                }
              }
            }else{
              self._swipeMotion(v,z,a.elapsedTime,a);
            }
          }
        },
        freeTouches(){
          _.setVec(this.state,false,true);
          this.touchZeroID=0;
          this.ActiveTouches.clear();
          this.ActiveDrags.clear();
          this.ActiveDragsID.clear();
        },
        reset(){
          _.setVec(this.state,false,true);
          this.freeTouches();
          this.DragDrops.length=0;
          this.Buttons.length=0;
          this.Hotspots.length=0;
        },
        _test(s,x,y){
          let _S=Mojo.Sprites,
              g=_S.gposXY(s),
              p=_S.toPolygon(s),
              ps=_V.translate(g,p.calcPoints);
          return Geo.hitTestPointInPolygon(x, y, ps);
        },
        hitTest(s){
          return this._test(s,this.x, this.y)
        },
        update(dt){
          if(this.DragDrops.length>0)
            Mojo.touchDevice? this.updateMultiDrags(dt) : this.updateDrags(dt);
          if(this.tail)
            this.updateTrail();
        },
        updateTrail(){
          this.tailHistX.pop();
          this.tailHistY.pop();
          this.tailHistX.unshift(this.x);
          this.tailHistY.unshift(this.y);
          this.tailPoints.forEach((p,i)=>{
            p.x= this.cubic(this.tailHistX, i/TRAIL_SIZE * HISTORY_SIZE);
            p.y= this.cubic(this.tailHistY, i/TRAIL_SIZE * HISTORY_SIZE);
          });
        },
        cubic(arr, t, tangentFactor=1){
          function clipInput(k, arr){
            if(k < 0) k = 0;
            if(k > arr.length-1) k = arr.length-1;
            return arr[k];
          }
          function getTangent(k, arr){
            return tangentFactor * (clipInput(k+1, arr) - clipInput(k-1, arr))/2;
          }
          const k = Math.floor(t),
                m = [getTangent(k, arr), getTangent(k+1, arr)],
                p = [clipInput(k, arr), clipInput(k+1, arr)];
          t -= k;
          const t2 = t * t;
          const t3 = t * t2;
          return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
        },
        disableTrail(){
          if(this.tail)
            Mojo.stage.removeChild(this.tail);
          this.tail=null;
          this.tailHistX=null;
          this.tailHistY=null;
          this.tailPoints=null;
        },
        enableTrail(){
          const ps= _.fill(TRAIL_SIZE, ()=> new PIXI.Point(0, 0)),
                t= Mojo.tcached("boot/trail.png"),
                rope = new PIXI.SimpleRope(t, ps);
          rope.blendmode = PIXI.BLEND_MODES.ADD;
          this.tail=rope;
          this.tailPoints=ps;
          this.tailHistX=_.fill(HISTORY_SIZE, 0);
          this.tailHistY=_.fill(HISTORY_SIZE, 0);
          Mojo.stage.addChild(rope);
        }
      };

      //////
      const msigs=[["mousemove", Mojo.canvas, P.mouseMove],
                  ["mousedown", Mojo.canvas,P.mouseDown],
                  ["mouseup", window, P.mouseUp]];
      const tsigs=[["touchmove", Mojo.canvas, P.touchMove],
                  ["touchstart", Mojo.canvas, P.touchStart],
                  ["touchend", window, P.touchEnd],
                  ["touchcancel", window, P.touchCancel]];

      Mojo.touchDevice? _.addEvent(tsigs) : _.addEvent(msigs);
      //////
      P.dispose=function(){
        this.reset();
        Mojo.touchDevice? _.delEvent(tsigs) : _.delEvent(msigs);
      };
      //////
      return P;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
      isPaused(){ return cur().pauseInput },
      resume(){ cur().pauseInput=false },
      pause(){ cur().pauseInput=true },
      dbg(){ cur().dbg() },
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/Input
       */
      resize(){
        cur().resize()
      },
      /**Clear all keyboard and mouse events.
       * @memberof module:mojoh5/Input
       */
      reset(){
        cur().reset()
      },
      /**Fake a keypress(down).
       * @memberof module:mojoh5/Input
       */
      setKeyOn(k){
        cur().keyInputs.set(k,true);
      },
      /**Fake a keypress(up).
       * @memberof module:mojoh5/Input
       */
      setKeyOff(k){
        cur().keyInputs.set(k,false);
      },
      /**
       * @memberof module:mojoh5/Input
       * @param {number} _key
       */
      keybd(_key,press,release){
        return cur().keybd(_key,press,release)
      },
      /**This sprite is no longer a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoButton(b){
        _.disj(cur().ptr.Buttons,b);
        b.m5.button=false;
        return b;
      },
      /**This sprite is now a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeButton(b,gui=false){
        _.conj(cur().ptr.Buttons,b);
        b.m5.button=true;
        b.m5.gui=gui;
        return b;
      },
      /**This sprite is no longer a hotspot.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoHotspot(b){
        _.disj(cur().ptr.Hotspots,b);
        b.m5.hotspot=false;
        return b;
      },
      /**This sprite is now a hotspot.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeHotspot(b){
        _.conj(cur().ptr.Hotspots,b);
        b.m5.hotspot=true;
        return b;
      },
      /** @ignore */
      update(dt){
        cur().update(dt)
      },
      /**This sprite is now draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      makeDrag(s){
        _.conj(cur().ptr.DragDrops,s);
        s.m5.drag=true;
        return s;
      },
      /**This sprite is now not draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      undoDrag(s){
        _.disj(cur().ptr.DragDrops,s);
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
      keyDown(code){ return cur().keyInputs.get(code) },
      keyShift(){ return cur().shiftKey },
      keyAlt(){ return cur().altKey },
      keyCtrl(){ return cur().ctrlKey },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        return cur().pointer()
      },
      dispose(){
        Layers.forEach(a => a.dispose());
        Layers.length=0;
      },
      restore(){
        if(Layers.length>1){
          Layers.shift().dispose()
          cur().pauseInput=false;
        }
      },
      save(){
        Layers.unshift(mkLayer());
      }
    };

    //disable the default actions on the canvas
    Mojo.canvas.style.touchAction = "none";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.undoBtn=_$.undoButton;
    _$.mkBtn=_$.makeButton;
    _$.mkDrag=_$.makeDrag;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    Layers.push(mkLayer());

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M)
    }
  }

})(this);

