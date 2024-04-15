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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Creates the module. */
  function _module(Mojo){

    ////////////////////////////////////////////////////////////////////////////
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const { math:_M, v2:_V, ute:_, is }=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const SKEYS= ["ctrlKey","altKey","shiftKey"];
    const Layers= [];
    const cur=()=> Layers[0];

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Input
     */
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    /**Create a new Input Layer */
    ////////////////////////////////////////////////////////////////////////////
    function _mkLayer(LObj){
      function xxxou(e,o,flag){
        if(LObj===cur()){
          if(o= LObj.keyInputs.get(e.keyCode)){}else{
            LObj.keyInputs.set(e.keyCode,o={});
          }
          o.state=flag;
          _.copyKeys(o,e,SKEYS);
          e.preventDefault();
        }
      }
      function _u(e,o){ xxxou(e,o,false) }
      function _d(e,o){ xxxou(e,o,true)  }
      const _gup=["keyup", globalThis, _u, false];
      const _gdn=["keydown", globalThis, _d, false];
      ////////////////////////////////////////////////////////////////////////////
      /* keep tracks of keyboard presses */
      if(!Mojo.touchDevice) _.addEvent([_gup, _gdn]);
      ////////////////////////////////////////////////////////////////////////////
      _.inject(LObj,{
        yid: `yid#${_.nextId()}`,
        keyInputs: _.jsMap(),
        pauseInput:false,
        ptr:UNDEF,
        ////////////////////////////////////////////////////////////////////////////
        dispose(){
          this.ptr.dispose();
          if(!Mojo.touchDevice) _.delEvent([_gup,_gdn]);
        },
        ////////////////////////////////////////////////////////////////////////////
        pointer(){
          return this.ptr || (this.ptr=_mkPtr(this));
        },
        ////////////////////////////////////////////////////////////////////////////
        update(dt){
          this.pauseInput ? 0 : this.ptr.update(dt);
        },
        ////////////////////////////////////////////////////////////////////////////
        keybd(_key, pressCB, releaseCB){
          const ret={ press:pressCB, release:releaseCB };
          let
            isUp=true, isDown=false,
            self=this, codes= is.vec(_key) ? _key : [_key];
          function _down(e){
            if(LObj===cur()){
              if(codes.includes(e.keyCode)){
                if(!self.pauseInput && isUp)
                  ret.press?.(e.altKey,e.ctrlKey,e.shiftKey);
                isUp=false;
                isDown=true;
              }
              e.preventDefault();
            }
          }
          function _up(e){
            if(LObj===cur()){
              if(codes.includes(e.keyCode)){
                if(!self.pauseInput && isDown)
                  ret.release?.(e.altKey,e.ctrlKey,e.shiftKey);
                isUp=true;
                isDown=false;
              }
              e.preventDefault();
            }
          }
          const ev1=["keyup", globalThis, _up, false];
          const ev2=["keydown", globalThis, _down, false];
          if(!Mojo.touchDevice) _.addEvent([ev1,ev2]);
          ret.dispose=()=>{ if(!Mojo.touchDevice) _.delEvent([ev1, ev2]) };
          return ret;
        },
        ////////////////////////////////////////////////////////////////////////////
        reset(){
          this.pauseInput=false;
          this.ptr.reset();
          this.keyInputs.clear();
        },
        ////////////////////////////////////////////////////////////////////////////
        resize(){
          (Mojo.mouse=this.ptr).reset();
        },
        ////////////////////////////////////////////////////////////////////////////
        dbg(){
          _.log(`N# of hotspots= ${this.ptr.Hotspots.length}`);
          _.log(`N# of buttons= ${this.ptr.Buttons.length}`);
          _.log(`N# of drags= ${this.ptr.DragDrops.length}`);
          _.log(`Mouse pointer = ${this.ptr}`);
        }
      });
      //make a default pointer
      return LObj.pointer() && LObj;
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Create a mouse and touch handler */
    ////////////////////////////////////////////////////////////////////////////
    function _mkPtr(LObj){
      let PObj={
        Actives: {
          DragsID: _.jsMap(),
          Touches: _.jsMap(),
          reset(){
            this.DragsID.clear();
            this.Touches.clear()}
        },
        Hotspots:[],
        Buttons:[],
        DragDrops:[],
        //down,up
        state: [false,true],
        touchZeroID:UNDEF,
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
        ////////////////////////////////////////////////////////////////////////////
        _testTouchDragStart(ts,found){
          for(let p, o, j=0; j<ts.length; ++j){
            o=ts[j];
            if(found.get(o.id) ||
               this.Actives.DragsID.get(o.id)){
              found.set(o.id,1);
              continue;
            }
            for(let gp,s,i=this.DragDrops.length-1; i>=0; --i){
              if((s=this.DragDrops[i]) &&
                 s.m5.drag && this._test(s,o.x,o.y)){
                p={dragged: s, id: o.id,
                   dragPtrX: o.x, dragPtrY: o.y,
                   dragStartX: s.x, dragStartY: s.y};
                this.Actives.DragsID.set(o.id, p);
                if(this.touchZeroID == o.id){
                  //this is actually a dragdrop, so not a tap
                  this._resetClickTap()
                }
                Mojo.moveToTop(s);
                found.set(o.id,1);
                break;
              }
            }
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        _testMouseDragStart(){
          for(let gp,cs,s,i=this.DragDrops.length-1; i>=0; --i){
            if((s=this.DragDrops[i]) &&
               s.m5.drag && this.hitTest(s)){
              this.dragStartX = s.x;
              this.dragStartY = s.y;
              this.dragPtrX= this.x;
              this.dragPtrY= this.y;
              this.dragged = s;
              Mojo.moveToTop(s);
              break;
            }
          }
          return this.dragged;
        },
        ////////////////////////////////////////////////////////////////////////////
        _maybeUpdateMouseDrag(){
          if(this.state[0] && this.dragged){
            _V.set(this.dragged,
                   this.dragStartX+(this.x-this.dragPtrX),
                   this.dragStartY+(this.y-this.dragPtrY))
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        _maybeEndMouseDrag(rc=0){
          if(this.state[1] && this.dragged){
            //dragged and now dropped
            this.dragged.m5.onDragDropped?.();
            this.dragged=UNDEF;
            rc=true;
          }
          return rc;
        },
        ////////////////////////////////////////////////////////////////////////////
        getGlobalPosition(){
          return {x: this.x, y: this.y}
        },
        ////////////////////////////////////////////////////////////////////////////
        _press(){

          if(LObj!==cur()){
            return
          }

          let
            i, s, found,
            z=this.Buttons.length;

          for(i=0; i<z; ++i){
            s=this.Buttons[i];
            if(s.m5.gui &&
               s.m5.press && this.hitTest(s)){
              s.m5.press(s);
              found=true;
              break;
            }
          }

          if(!found) for(i=0; i<z; ++i){
            s=this.Buttons[i];
            if(s.m5.press && this.hitTest(s)){
              s.m5.press(s);
              break;
            }
          }

        },
        ////////////////////////////////////////////////////////////////////////////
        _doMDown(b){

          if(LObj!==cur()){
            return
          }

          let found, self=PObj;

          for(let s,i=0; i<self.Hotspots.length; ++i){
            if((s=self.Hotspots[i]) &&
               s.m5.touch && self.hitTest(s)){
              s.m5.touch(s,b);
              found=true;
              break;
            }
          }

          return found;
        },
        ////////////////////////////////////////////////////////////////////////////
        mouseDown(e){

          if(LObj!==cur()){
            return
          }

          let self=PObj, nn=_.now();

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
            if(!LObj.pauseInput){
              self._testMouseDragStart() ? 0 : self._doMDown(true);
              Mojo.emit([`${LObj.yid}/mousedown`]);
            }
            //_.log(`mouse x= ${self.x}, y = ${self.y}`);
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        mouseMove(e){

          if(LObj!==cur()){
            return
          }

          let self=PObj;

          self._x = e.pageX - e.target.offsetLeft;
          self._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          if(!LObj.pauseInput){
            self._maybeUpdateMouseDrag();
            Mojo.emit([`${LObj.yid}/mousemove`]);
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        mouseUp(e){

          if(LObj!==cur()){
            return
          }

          let self=PObj,nn=_.now();

          if(e.button==0){
            e.preventDefault();
            self.elapsedTime = Math.max(0, nn - self.downTime);
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            _.setVec(self.state,false,true);
            if(!LObj.pauseInput){
              if(self._maybeEndMouseDrag()){
              }else if(!self._doMDown(false)){
                let v= _V.vecAB(self.downAt,self);
                let z= _V.len2(v);
                //small distance and fast then a click
                if(z<400 && self.elapsedTime<200){
                  self._press();
                  Mojo.emit([`${LObj.yid}/single.tap`]);
                }else{
                  self._swipeMotion(v,z,self.elapsedTime);
                }
              }
              Mojo.emit([`${LObj.yid}/mouseup`]);
            }
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        _swipeMotion(v,dd,dt,arg){

          if(LObj!==cur()){
            return
          }

          let rc, n= _V.unit$(_V.normal(v));
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
          rc ? Mojo.emit([`${LObj.yid}/${rc}`], arg) : 0;
        },
        ////////////////////////////////////////////////////////////////////////////
        _doMTouch(ts,found,flag){

          if(LObj!==cur()){
            return
          }

          for(let a,i=0; i<ts.length; ++i){
            a=ts[i];
            if(found.get(a.id)){continue}
            for(let s,j=0; j<this.Hotspots.length; ++j){
              if((s=this.Hotspots[j]) &&
                 s.m5.touch && this._test(s,a.x,a.y)){
                s.m5.touch(s,flag);
                found.set(a.id,1);
                break;
              }
            }
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        touchCancel(e){

          _.log("received touchCancel event!");
          if(LObj!==cur()){
            return
          }

          let o,i,self=PObj,
              ts=e.changedTouches;

          for(i=0; i< ts.length; ++i){
            o=ts[i];
            self.Actives.Touches.delete(o.id);
            self.Actives.DragsID.delete(o.id);
          }

          if(self.Actives.Touches.size==0){
            self.Actives.DragsID.clear();
            self._freeTouches();
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        touchStart(e){

          if(LObj!==cur()){
            return
          }

          let
            t= e.target, out=[],
            self=PObj, nn= _.now(),
            found=_.jsMap(), ts = e.changedTouches;

          e.preventDefault();
          for(let a,c,cx,cy,id,o,i=0; i<ts.length; ++i){
            o=ts[i];
            id=o.identifier;
            cx = o.pageX - t.offsetLeft;
            cy = o.pageY - t.offsetTop;
            a={ id, _x:cx, _y:cy, downTime: nn,
                downAt: [cx,cy], x:cx/Mojo.scale, y:cy/Mojo.scale };
            c={ id, _x:cx, _y:cy, downTime: nn, downAt: [cx,cy], x: a.x, y: a.y };
            self.Actives.Touches.set(id,c);
            out.push(a);
            //handle single touch case
            if(self.touchZeroID===UNDEF && i==0){
              self.touchZeroID=id;
              self._x = cx;
              self._y = cy;
              self.downTime= nn;
              self.downAt= [cx,cy];
              _.setVec(self.state,true,false);
            }
          }
          Mojo.Sound.init();
          if(!LObj.pauseInput){
            self._testTouchDragStart(out,found);
            self._doMTouch(out,found,true);
            Mojo.emit([`${LObj.yid}/touchstart`],out);
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        touchMove(e){

          if(LObj!==cur()){
            return
          }

          let self=PObj, out=[],
              t = e.target, ts = e.changedTouches;

          e.preventDefault();
          for(let p,s,x,y,cx,cy,o,id,i=0; i<ts.length; ++i){
            o=ts[i];
            id= o.identifier;
            if(p=self.Actives.Touches.get(id)){}else{
              Mojo.warn(`move-no activetouch with id=${id}`);
              continue;
            }
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            x=cx/Mojo.scale;
            y=cy/Mojo.scale;
            if(id==self.touchZeroID){
              self._x = cx;
              self._y = cy;
            }
            p.x=x; p.y=y;
            p._x = cx; p._y = cy;
            if(p= self.Actives.DragsID.get(id)){
              p.x=x; p.y=y;
              p._x = cx; p._y = cy;
              s=p.dragged;
              _V.set(s, p.dragStartX+(x-p.dragPtrX),
                        p.dragStartY+(y-p.dragPtrY));
            }
            out.push({ id, x, y, _x:cx, _y:cy });
          }
          LObj.pauseInput ? 0 : Mojo.emit([`${LObj.yid}/touchmove`],out);
        },
        ////////////////////////////////////////////////////////////////////////////
        touchEnd(e){

          if(LObj!==cur()){
            return
          }

          let
            self=PObj, out=[],
            found=_.jsMap(),
            cx,cy,i,a,d,p,o,id,
            ts= e.changedTouches, t = e.target, nn=_.now();

          e.preventDefault();
          for(i=0; i<ts.length; ++i){
            o=ts[i];
            id=o.identifier;
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            if(id==self.touchZeroID){
              self.elapsedTime = Math.max(0,nn-self.downTime);
              _.setVec(self.state,false,true);
              self._x= cx;
              self._y= cy;
            }
            if(p=self.Actives.Touches.get(id)){}else{
              Mojo.warn(`end-no activetouch with id=${id}`);
              continue;
            }
            p.elapsedTime = Math.max(0,nn-p.downTime);
            p.x=cx/Mojo.scale;
            p.y=cy/Mojo.scale;
            p._x = cx;
            p._y = cy;
            out.push(_.clone(p));
          }
          if(!LObj.pauseInput){
            self._maybeEndTouchDrag(out,found);
            self._doMTouch(out,found,false);
            self._onEndMultiTouches(out,found);
            Mojo.emit([`${LObj.yid}/touchend`],out);
          }
          for(i=0;i<ts.length;++i){
            self.Actives.Touches.delete(ts[i].id);
          }
          if(self.Actives.Touches.size==0){
            self.freeTouches();
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        _maybeEndTouchDrag(ts,found){
          let prevX= this._x, prevY= this._y;
          for(let s,p,o,i=0; i<ts.length; ++i){
            o=ts[i];
            if(p=this.Actives.DragsID.get(o.id)){
              this.Actives.DragsID.delete(o.id);
              s=p.dragged;
              found.set(o.id,1);
              this._x=o._x;
              this._y=o._y;
              _V.set(s, p.dragStartX+(o.x-p.dragPtrX),
                        p.dragStartY+(o.y-p.dragPtrY));
              s.m5.onDragDropped?.();
            }
          }
          this._x=prevX;
          this._y=prevY;
        },
        ////////////////////////////////////////////////////////////////////////////
        _onEndMultiTouches(ts,found){

          if(LObj!==cur()){
            return
          }

          for(let a,v,z,j=0; j<ts.length; ++j){
            a=ts[j];
            if(found.get(a.id))
            {continue}
            v= _V.vecAB(a.downAt,a);
            z= _V.len2(v);
            if(z<400 && a.elapsedTime<200){
              for(let s,i=0,n=this.Buttons.length;i<n;++i){
                if((s=this.Buttons[i]) &&
                   s.m5.press && this._test(s, a.x, a.y)){
                  s.m5.press(s);
                  break;
                }
              }
              Mojo.emit([`${LObj.yid}/single.tap`],a);
            }else{
              this._swipeMotion(v,z,a.elapsedTime,a);
            }
          }
        },
        ////////////////////////////////////////////////////////////////////////////
        _resetClickTap(){
          _.setVec(this.state,false,true);
          this.touchZeroID=UNDEF;
        },
        ////////////////////////////////////////////////////////////////////////////
        _freeTouches(){
          this._resetClickTap();
          this.Actives.reset();
        },
        ////////////////////////////////////////////////////////////////////////////
        reset(){
          this._freeTouches();
          this.DragDrops.length=0;
          this.Buttons.length=0;
          this.Hotspots.length=0;
        },
        ////////////////////////////////////////////////////////////////////////////
        _test(s,x,y){
          let _S=Mojo.Sprites,
              g=_S.gposXY(s),
              p=_S.toPolygon(s),
              ps=_V.translate(g,p.calcPoints);
          return Geo.hitTestPointInPolygon(x, y, ps);
        },
        ////////////////////////////////////////////////////////////////////////////
        hitTest(s){
          return this._test(s,this.x, this.y)
        },
        ////////////////////////////////////////////////////////////////////////////
        update(dt){
        }
      };

      //////
      const msigs=[["mousemove", Mojo.canvas, PObj.mouseMove],
                  ["mousedown", Mojo.canvas,PObj.mouseDown],
                  ["mouseup", globalThis, PObj.mouseUp]];
      const tsigs=[["touchmove", Mojo.canvas, PObj.touchMove],
                  ["touchstart", Mojo.canvas, PObj.touchStart],
                  ["touchend", globalThis, PObj.touchEnd],
                  ["touchcancel", globalThis, PObj.touchCancel]];

      Mojo.touchDevice? _.addEvent(tsigs) : _.addEvent(msigs);

      PObj.dispose=function(){
        this.reset();
        Mojo.touchDevice? _.delEvent(tsigs) : _.delEvent(msigs);
      };

      return PObj;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    let _multiTouch=true;
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
      _cur(){ return cur() },
      setMultiTouch(b){
        _multiTouch=b
      },
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
        let o=cur().keyInputs.get(k);
        if(!o)
          cur().keyInputs.set(k,o={});
        o.state=true;
      },
      /**Fake a keypress(up).
       * @memberof module:mojoh5/Input
       */
      setKeyOff(k){
        let o=cur().keyInputs.get(k);
        if(!o)
          cur().keyInputs.set(k,o={});
        o.state=false;
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
      undoXXX(o){
        if(o && o.m5){
          o.m5.drag && this.undoDrag(o);
          o.m5.button && this.undoButton(o);
          o.m5.hotspot && this.undoHotspot(o);
        }
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
      keyDown(code){
        let o= cur().keyInputs.get(code);
        return (o && o.state) ? o : UNDEF;
      },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        return cur().pointer()
      },
      /**Clear all input layers.
       * @memberof module:mojoh5/Input
       * @return {any} undefined
       */
      dispose(){
        Layers.forEach(a => a.dispose());
        Layers.length=0;
      },
      /**Pop off the top input layer.
       * @memberof module:mojoh5/Input
       * @return {any} undefined
       */
      restore(){
        if(Layers.length>1){
          Layers.shift().dispose()
          cur().pauseInput=false;
        }
      },
      /**Push new input layer to top.
       * @memberof module:mojoh5/Input
       * @return {any} undefined
       */
      save(){
        Layers.unshift(_mkLayer({}));
      },
      /**
      */
      on(...args){
        _.assert(is.vec(args[0])&&is.str(args[0][0]),"bad arg for Input.on()");
        args[0][0]=`${cur().yid}/${args[0][0]}`;
        return Mojo.on(...args);
      },
      /**
      */
      off(...args){
        _.assert(is.vec(args[0])&&is.str(args[0][0]),"bad arg for Input.off()");
        args[0][0]=`${cur().yid}/${args[0][0]}`;
        return Mojo.off(...args);
      }
    };

    ////////////////////////////////////////////////////////////////////////////
    //disable the default actions on the canvas
    Mojo.canvas.style.touchAction = "none";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.undoBtn=_$.undoButton;
    _$.mkBtn=_$.makeButton;
    _$.mkDrag=_$.makeDrag;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    Layers.push(_mkLayer({}));

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

