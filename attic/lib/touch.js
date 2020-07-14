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

(function(global, undefined) {
  "use strict";
  let window=global,
      MojoH5= global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.Touch = function(Mojo) {

    let _= Mojo.u,
        is= Mojo.is,
        _touchLayer = [0],
        EBus = Mojo.EventBus,
        _touchType= Mojo.E_NONE,
        _activeTouches = _.jsMap(),
        _touchedObjects = _.jsMap();

    /**
     * @public
     * @class
     */
    Mojo.defType("TouchSystem", {
      /**
       * @constructs
       */
      init: function() {
        let self = this;

        this.boundTouch = (e) => { self.touch(e); };
        this.boundDrag = (e) => { self.drag(e); };
        this.boundEnd = (e) => { self.touchEnd(e); };

        _.addEvent([["mouseup",Mojo.el,this.boundEnd],
                    ["mousemove",Mojo.el,this.boundDrag],
                    ["mousedown",Mojo.el,this.boundTouch],
                    ["touchstart",Mojo.el,this.boundTouch],
                    ["touchmove",Mojo.el,this.boundDrag],
                    ["touchend",Mojo.el,this.boundEnd],
                    ["touchcancel",Mojo.el,this.boundEnd]]);

        //ducktype it for collision detection
        this.touchPos = {bbox4: Mojo.bbox4(),
                         p: { id: _.nextId(), w:1, h:1, cx: 0, cy: 0}};
      },
      dispose: function() {
        _.delEvent([["mouseup",Mojo.el,this.boundEnd],
                    ["mousemove",Mojo.el,this.boundDrag],
                    ["mousedown",Mojo.el,this.boundTouch],
                    ["touchstart",Mojo.el,this.boundTouch],
                    ["touchmove",Mojo.el,this.boundDrag],
                    ["touchend",Mojo.el,this.boundEnd],
                    ["touchcancel",Mojo.el,this.boundEnd]]);
      },
      _repos: function(touch,L) {
        let el = Mojo.el,
            rect = el.getBoundingClientRect(),
            style = window.getComputedStyle(el),
            posY = touch.clientY - rect.top  - parseInt(style.paddingTop),
            posX = touch.clientX - rect.left - parseInt(style.paddingLeft);
        if(posX===undefined || posY===undefined) {
           posX = touch.offsetX;
           posY = touch.offsetY;
        }
        if(posX===undefined || posY===undefined) {
          posX = touch.layerX;
          posY = touch.layerY;
        }
        if(posX===undefined || posY===undefined) {
          if(Mojo.touch.offsetX === undefined) {
            Mojo.touch.offsetX = 0;
            Mojo.touch.offsetY = 0;
            el = Mojo.el;
            do {
              Mojo.touch.offsetX += el.offsetLeft;
              Mojo.touch.offsetY += el.offsetTop;
            } while(el = el.offsetParent);
          }
          posX = touch.pageX - Mojo.touch.offsetX;
          posY = touch.pageY - Mojo.touch.offsetY;
        }

        this.touchPos.p.ox =
        this.touchPos.p.px = posX / Mojo.cssWidth * Mojo.width;
        this.touchPos.p.oy =
        this.touchPos.p.py = posY / Mojo.cssHeight * Mojo.height;

        let cam= Mojo.getf(L,"camera");
        if(cam) {
          this.touchPos.p.px /= cam.scale[0];
          this.touchPos.p.py /= cam.scale[1];
          this.touchPos.p.px += cam.x;
          this.touchPos.p.py += cam.y;
        }

        this.touchPos.obj = null;
        this.touchPos.p.x = this.touchPos.p.px;
        this.touchPos.p.y = this.touchPos.p.py;

        return this.touchPos;
      },
      touch: function(e) {
        let touches = e.changedTouches || [ e ];
        for(let i=0;i<touches.length;++i) {
          for(let idx=0;idx < _touchLayer.length;++idx) {
            let touch = touches[i],
                L = Mojo.scene(_touchLayer[idx]);
            if(!L) { continue; }
            let touchId= touch.identifier || 0,
                obj,col,pos = this._repos(touch,L);
            L.regrid(pos,true);
            col = L.search(pos,_touchType);
            if(col || idx === _touchLayer.length-1) {
              obj = col && col.obj;
              pos.obj = obj;
              EBus.pub("touch", this, pos);
            }

            if(obj && obj.p && !_.has(_touchedObjects,obj.p.id)) {
              _.assoc(_activeTouches,touchId, {
                x: pos.p.px,
                y: pos.p.py,
                sx: pos.p.ox,
                sy: pos.p.oy,
                obj: obj,
                scene: L,
                origX: obj.p.x,
                origY: obj.p.y,
                identifier: touchId
              });
              _.assoc(_touchedObjects,obj.p.id, true);
              EBus.pub("touch", obj, _.get(_activeTouches,touchId));
              break;
            }
          }
        }
        //e.preventDefault();
        return this;
      },
      drag: function(e) {
        let touches = e.changedTouches || [ e ];
        for(let i=0;i<touches.length;++i) {
          let pos, touch = touches[i],
              touchId= touch.identifier || 0,
              active = _.get(_activeTouches,touchId),
              L = active && active.scene;
          if(active) {
            pos = this._repos(touch,L);
            active.x = pos.p.px;
            active.y = pos.p.py;
            active.dx = pos.p.ox - active.sx;
            active.dy = pos.p.oy - active.sy;
            EBus.pub("drag", active.obj, active);
          }
        }
        e.preventDefault();
        return this;
      },
      touchEnd: function(e) {
        let touches = e.changedTouches || [ e ];
        for(let i=0;i<touches.length;++i) {
          let touch = touches[i],
              touchId= touch.identifier || 0,
              active = _.get(_activeTouches,touchId);
          if(active) {
            EBus.pub("touchEnd", active.obj, active);
            _.assoc(_activeTouches,touchId,null);
            _.dissoc(_touchedObjects,active.obj.p.id);
          }
        }
        e.preventDefault();
        return this;
      }

    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo.touch = function(arg) {
      arg= arg || {};
      if(!is.num(arg.scene))
        _touchLayer = [5,4,3,2,1,0];
      else
        _touchLayer = [arg.scene];
      _touchType = arg.type || Mojo.E_ALL; //Mojo.E_UI;

      Mojo.untouch();
      if(!Mojo.touchInput)
        Mojo.touchInput = new Mojo.TouchSystem();

      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.untouch = function() {
      if(Mojo.touchInput)
        _.dissoc(Mojo, "touchInput").dispose();
      return Mojo;
    };


    return Mojo;
  };


})(this);

