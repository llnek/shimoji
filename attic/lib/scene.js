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
  let MojoH5=global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.Scenes = function(Mojo) {

    let _=Mojo.u,
      is=Mojo.is,
      EBus=Mojo.EventBus,
      /**
       * @private
      */
      _curSlot = 0,
      /**
       * @private
       */
      _sceneQueue = _.jsVec(),
      /**
       * @private
       */
      _sceneFuncs = _.jsMap(),
      /**
       * @private
       */
      _defs= {gridW: 400, gridH: 400, x:0, y:0, sort: false};

    /**
     * @private
     * @function
     */
    let _markAll= function(scene) {
      let tmp,X,B,
          scale=[1,1],
          time=scene.tick,
          items= scene.items,
          view= Mojo.getf(scene,"camera"),
          x = view ? view.x : 0,
          y = view ? view.y : 0;

      scale[0] = view ? view.scale[0] : 1;
      scale[1] = view ? view.scale[1] : 1;

      let viewW = Mojo.width/scale[0],
          viewH = Mojo.height/scale[1],
          gridX1 = _.floor(x/scene.o.gridW),
          gridY1 = _.floor(y/scene.o.gridH),
          gridX2 = _.floor((x+viewW)/scene.o.gridW),
          gridY2 = _.floor((y+viewH)/scene.o.gridH);
      for(let iy=gridY1; iy<=gridY2; ++iy)
        if(X=_.get(scene.grid,iy))
          for(let ix=gridX1; ix<=gridX2; ++ix)
            if(B=_.get(X,ix))
              B.forEach((v,k) => {
                if(tmp=_.get(scene.index,k))
                { tmp.mark = time;
                  if(tmp.container)
                    tmp.container.mark = time; }
              });
    };

    /**
     * @private
     * @function
     */
    let _hitTest= function(type,id,obj,colMask) {
      if(colMask===undefined || (colMask & type)) {
        let col, obj2=_.get(this.index,id);
        if(obj2 &&
           obj2 !== obj &&
           Mojo.overlap(obj,obj2))
          if(col= Mojo.collision(obj,obj2)) {
            col.obj = obj2;
            return col;
          }
      }
    };

    /**
     * @private
     * @function
     */
    let _hitObject= function(scene,obj,colMask) {
      let X,Y,col, g=obj.bbox4;
      for(let y = g.y1;y <= g.y2;++y)
        if(Y=scene.grid.get(y))
          for(let x = g.x1;x <= g.x2;++x)
            if(X=Y.get(x))
              if(col= _.some(X,_hitTest,scene,obj,colMask))
                return col;
    };

    /**
     * @private
     * @function
     */
    let _hitLayer= function(scene,obj,colMask) {
      for(let y,c,i=0,z=scene.overlays.length;i<z;++i) {
        y=scene.overlays[i];
        if(y.p.type & colMask)
          if(c= y.collide(obj)) { c.obj = y; return c; }
      }
    };

    /**
     * @private
     * @function
     */
    let _hitAny = function(scene,obj,colMask) {
      return _hitLayer(scene, obj,colMask) ||
             _hitObject(scene, obj,colMask);
    };

    /**
     * @function
     */
    let _degrid= (scene, item) => {
      let X,Y,g= item.bbox4;
      if(g)
        for(let y = g.y1;y <= g.y2; ++y)
          if(Y=scene.grid.get(y))
            for(let x = g.x1;x<=g.x2;++x)
              if(X=Y.get(x))
                _.dissoc(X,item.p.id);
    };

    /**
     * @function
     */
    let _engrid= (scene, item) => {
      let X,Y,g= item.bbox4;
      for(let y = g.y1;y <= g.y2;++y) {
        if(!scene.grid.has(y))
          scene.grid.set(y, _.jsMap());
        Y=scene.grid.get(y);
        for(let x = g.x1;x <= g.x2;++x) {
          if(!Y.has(x))
            Y.set(x, _.jsMap());
          X=Y.get(x);
          _.assoc(X,item.p.id, item.p.type);
        }
      }
    };

    /**
     * @private
     * @var
     */
    let _locateObj= {
      //x,y => center
      //cx,cy => x-cx = left,y-cy=top
      p: {x: 0, y: 0, cx: 0, cy: 0, w: 1, h: 1 }
    };

    /**
     * @class Scene
     */
    Mojo.defType(["Scene", Mojo.Entity], {
      /**
       * @constructs
       */
      init: function(funcObj,options) {
        this._super();
        this.items = [];
        //pin object's location for fast search
        this.grid = _.jsMap();
        this.tick = 0;
        this.trash = [];
        this.overlays = [];
        //fast lookup to get entities
        this.index = _.jsMap();
        _.inject(this,funcObj);
        this.o = _.inject({},_defs, {w: Mojo.width,
                                     h: Mojo.height}, options);
      },
      addOverlay: function(obj) {
        _.conj(this.overlays,obj);
        obj.movable= false;
        return this.insert(obj);
      },
      search: function(obj,colMask) {
        if(colMask===undefined)
          colMask = obj.p && obj.p.collisionMask;
        if(!obj.bbox4)
          this.regrid(obj, obj.scene !== this);
        return _hitAny(this, obj,colMask);
      },
      locate: function(x,y,colMask) {
        let tmp= _locateObj;
        tmp.p.x = x;
        tmp.p.y = y;
        tmp.bbox4=null;
        this.regrid(tmp, true);
        let col= _hitAny(this,tmp,colMask);
        if(col && col.obj) return col.obj;
      },
      run: function() {
        //you can(should) only call this once
        let rc= this.setup && this.setup();
        this.setup= null;
        return rc;
      },
      each: function(cb) {
        let args= _.slice(arguments,1);
        this.items.forEach(x => cb.apply(x,args));
        return this;
      },
      invoke: function(funcName) {
        let args= _.slice(arguments,1);
        this.items.forEach(x => x[funcName].apply(x,args));
        return this;
      },
      find: function(id) {
        return _.get(this.index,id);
      },
      insert: function(itm,container) {
        this.items.push(itm);
        itm.scene = this;
        itm.bbox4 = Mojo.bbox4();

        if(container)
          container.add(itm);

        if(itm.className)
          Mojo.link(itm.className, itm);

        if(itm.p && itm.p.id)
          _.assoc(this.index, itm.p.id, itm);

        Mojo.genPts(itm);
        this.regrid(itm);

        EBus.pub([["inserted",this, itm],
                  ["inserted",itm,this]]);

        return itm;
      },
      remove: function(itm) {
        _degrid(this, itm);
        this.trash.push(itm);
        return this;
      },
      _purge: function(itm) {
        let n = this.items.indexOf(itm);
        if(n > -1) {
          this.items.splice(n,1);
          if(itm.className)
            Mojo.unlink(itm.className,itm);
          if(itm.container)
            itm.container.del(itm);
          itm.dispose && itm.dispose();
          if(itm.p.id)
            _.dissoc(this.index,itm.p.id);
          EBus.pub("removed",this, itm);
        }
        return this;
      },
      pause: function() {
        this.paused = true;
        return this;
      },
      resume: function() {
        this.paused = false;
        return this;
      },
      regrid: function(item,skipAdd) {
        if(item.movable===false) { return item; }

        Mojo.genContactPts(item);

        if(!item.bbox4)
          item.bbox4= Mojo.bbox4();

        let c = item.c || item.p;
        let gridX1 = _.floor((c.x - c.cx) / this.o.gridW),
            gridY1 = _.floor((c.y - c.cy) / this.o.gridH),
            gridX2 = _.floor((c.x - c.cx + c.w) / this.o.gridW),
            gridY2 = _.floor((c.y - c.cy + c.h) / this.o.gridH),
            g = item.bbox4;

        if(g.x1 !== gridX1 || g.x2 !== gridX2 ||
           g.y1 !== gridY1 || g.y2 !== gridY2) {

          if(g.x1 !== NaN)
            _degrid(this, item);

          g.x1= gridX1;
          g.x2= gridX2;
          g.y1= gridY1;
          g.y2= gridY2;

          if(!skipAdd)
            _engrid(this,item);
        }

        return item;
      },
      update: function(items,dt,isContainer) {
        for (let item,i=0,z=items.length;i<z;++i) {
          item=items[i];
          if(!isContainer &&
             (item.p.visibleOnly &&
              (!item.mark || item.mark < this.tick))) {
            continue;
          }
          if(isContainer || !item.container) {
            item.update(dt);
            this.regrid(item);
          }
        }
        return this;
      },
      step: function(dt) {
        if(this.paused) { return false; }
        this.prestep && this.prestep(dt);
        this.tick += dt;
        _markAll(this);
        EBus.pub("prestep",this,dt);
        this.update(this.items,dt);
        EBus.pub("step",this,dt);
        if(this.trash.length > 0) {
          this.trash.forEach(x => this._purge(x));
          this.trash.length = 0;
        }
        this.poststep && this.poststep(dt);
        EBus.pub("poststep",this,dt);
        return this;
      },
      hide: function() {
        this.hidden = true;
        return this;
      },
      show: function() {
        this.hidden = false;
        return this;
      },
      stop: function() {
        this.hide();
        this.pause();
        return this;
      },
      start: function() {
        this.show();
        this.resume();
        return this;
      },
      render: function(ctx) {
        if(this.hidden) { return false; }
        if(this.prerender) {
          ctx.save();
          this.prerender(ctx);
          ctx.restore();
        }
        this.o.sort &&
          this.items.sort(this.o.sort);
        EBus.pub([["prerender",this,ctx],
                  ["beforerender",this,ctx]]);
        this.items.forEach( item => {
          // Don't render sprites with containers (sprites do that themselves)
          // Also don't render if not onscreen
          if(!item.container &&
             (item.p.renderAlways ||
              item.mark >= this.tick)) { item.render(ctx); }
        });
        if(this.postrender) {
          ctx.save();
          this.postrender(ctx);
          ctx.restore();
        }
        EBus.pub([["render",this,ctx],
                  ["postrender",this,ctx]]);
        return this;
      },
      collide: function(obj,options) {
        let col, col2, colMask,
            maxCol, curCol, skipEvents;

        if(!is.obj(options)) {
          colMask = options;
        } else {
          maxCol = options.maxCol;
          skipEvents = options.skipEvents;
          colMask = options.collisionMask;
        }

        if(colMask===undefined)
          colMask= obj.p && obj.p.collisionMask;
        maxCol = maxCol || 3;

        this.regrid(obj);

        curCol = maxCol;
        while(curCol > 0 &&
              (col = _hitLayer(this,obj,colMask))) {
          if(!skipEvents)
            EBus.pub([["hit",obj, col],
                      ["hit.collision",obj,col]]);
          this.regrid(obj);
          --curCol;
        }

        curCol = maxCol;
        while(curCol > 0 &&
              (col2 = _hitObject(this,obj,colMask))) {
          EBus.pub([["hit",obj,col2],
                    ["hit.sprite",obj,col2]]);
          // Do the recipricol collision
          // TODO: extract
          if(!skipEvents) {
            let obj2 = col2.obj;
            col2.obj = obj;
            col2.normalX *= -1;
            col2.normalY *= -1;
            col2.distance = 0;
            col2.magnitude = 0;
            col2.separate[0] = 0;
            col2.separate[1] = 0;
            EBus.pub([["hit",obj2,col2],
                      ["hit.sprite",obj2,col2]]);
          }
          this.regrid(obj);
          --curCol;
        }
        return col2 || col;
      }
    }, Mojo);

    /**
     * @public
     * @class
     */
    Mojo.defType("Locator",{
      /**
       * @constructs
       */
      init: function(scene,selector) {
        this.scene = scene;
        this.selector = selector;
        this.items = Mojo.dbFind(this.selector) || [];
      },
      count: function() { return this.items.length; },
      each: function(cb) {
        let args=_.slice(arguments,1);
        this.items.forEach(x => cb.apply(x, args));
        return this;
      },
      invoke: function(funcName) {
        let args=_.slice(arguments,1);
        this.items.forEach(x => x[funcName].apply(x, args));
        return this;
      },
      trigger: function(name,param) {
        this.items.forEach(x => EBus.pub(name, x, param));
        return this;
      },
      dispose: function() {
        return this.invoke("dispose");
      },
      // This hidden utility method extends
      // and object's properties with a source object.
      // Used by the p method to set properties.
      _pObject: function(source) {
        _.inject(this.p,source);
      },
      _pSingle: function(property,value) {
        this.p[property] = value;
      },
      set: function(k, v) {
        (v===undefined)
          ? this.each(this._pObject,k) : this.each(this._pSingle,k,v);
        return this;
      },
      at: function(idx) {
        return this.items[idx];
      },
      first: function() {
        return this.items[0];
      },
      last: function() {
        return this.items[this.items.length-1];
      }
    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo["$"]= function(selector) {
      let args= _.slice(arguments,1),
          y= Mojo.scene(args.length>0 ? args[0] : _curSlot);
      return is.num(selector)
             ? _.get(y.index,selector)
             : new Mojo.Locator(y,selector);
    };

    /**
     * @public
     * @function
     */
    Mojo.scene = (num) => {
      return _sceneQueue[(num===undefined) ? _curSlot : num ];
    };

    /**
     * @public
     * @function
     */
    Mojo.runScene = function(name,num,options) {
      let _s = _.get(_sceneFuncs,name);
      if(!_s)
        throw "Error: unknown scene id: "+name;

      if(is.obj(num)) {
        options = num;
        num = _.dissoc(options,"slot");
      }

      options = _.inject({},_s[1],options);
      if(is.undef(num))
        num= options["slot"] || 0;

      let y= _sceneQueue[num];
      let F= Mojo.Scene;

      y && y.dispose();

      _curSlot = num;
      y = new F(_s[0],_.inject(options,{slot: num}));
      _sceneQueue[num] = y;

      y.run();

      _curSlot = 0;
      if(!Mojo.loop)
        Mojo.gameLoop(Mojo.runGameLoop);

      return y;
    };

    /**
     * @public
     * @function
     */
    Mojo.runGameLoop = (dt) => {
      let i, z, y;

      if(dt < 0) dt= 1.0/60;
      if(dt > 1.0/15) dt= 1.0/15;

      for(i=0,z=_sceneQueue.length;i<z;++i) {
        _curSlot = i;
        y = Mojo.scene();
        y && y.step(dt);
      }

      _curSlot = 0;
      Mojo.clear();

      for(i=0,z=_sceneQueue.length;i<z;++i) {
        _curSlot = i;
        y = Mojo.scene();
        y && y.render(Mojo.ctx);
      }

      //render the input *pads* last
      Mojo.input &&
        Mojo.ctx &&
          Mojo.input.drawCanvas(Mojo.ctx);
      _curSlot = 0;
    };

    /**
     * @public
     * @function
     */
    Mojo.removeScene = (num) => {
      if(_sceneQueue[num]) {
        _sceneQueue[num].dispose();
        _sceneQueue[num] = null;
      }
    };

    /**
     * @public
     * @function
     */
    Mojo.removeScenes = () => {
      _.doseq(_sceneQueue,(s) => {
        s && s.dispose();
      });
      _sceneQueue.length = 0;
    };

    /**
     * @public
     * @function
     */
    Mojo.defScene = (name,action,opts) => {
      if(is.fun(action))
        action= {setup: action};

      if(!is.obj(action) ||
         !is.fun(action.setup))
        throw "Error: expecting scene setup function";

      _.assoc(_sceneFuncs,name,[action, opts||{}]);
    };


    return Mojo;
  };

})(this);


