(function(global, undefined) {
  "use strict";
  let MojoH5=global.MojoH5;

  /**
   * @method
   */
  MojoH5.Scenes = function(Mojo) {

    let _=Mojo.u,
        is=Mojo.is,
        _defs= {gridW: 400, gridH: 400, x:0, y:0, sort: false};

    /**
     */
    Mojo.scenes = _.jsMap();

    /**
     */
    Mojo.activeStage = 0;

    /**
     */
    Mojo.stages = [];

    /**
     * @function
     */
    let _hitLayer= function(stage,obj,collisionMask) {
      for(let y,c,i=0,z=stage.contactLayers.length;i<z;++i) {
        y=stage.contactLayers[i];
        if(y.p.type & collisionMask)
          if(c= y.collide(obj)) { c.obj = y; return c; }
      }
    };

    /**
     * @function
     */
    let _markAll= function(stage) {
      let time=stage.tick,
          items= stage.items,
          view= stage.camera,
          x = view ? view.x : 0,
          y = view ? view.y : 0,
          scale = view ? view.scale : 1,
          viewW = Mojo.width / scale,
          viewH = Mojo.height / scale,
          gridX1 = _.floor(x / stage.options.gridW),
          gridY1 = _.floor(y / stage.options.gridH),
          gridX2 = _.floor((x + viewW) / stage.options.gridW),
          gridY2 = _.floor((y + viewH) / stage.options.gridH),
          tmp,X,B;
      for(let iy=gridY1; iy<=gridY2; ++iy)
        if(X=_.get(stage.grid,iy))
          for(let ix=gridX1; ix<=gridX2; ++ix)
            if(B=_.get(X,ix))
              B.forEach((v,k) => {
                if(tmp=_.get(stage.index,k))
                { tmp.mark = time;
                  if(tmp.container)
                    tmp.container.mark = time; }
              });
    };

    /**
     * @function
     */
    let _testHit= function(type,id,obj,collisionMask) {
      if(is.undef(collisionMask) || (collisionMask & type)) {
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
     * @function
     */
    let _hitTest= function(stage,obj,collisionMask) {
      let X,Y,col, g=obj.bbox4;
      for(let y = g.y1;y <= g.y2;++y)
        if(Y=stage.grid.get(y))
          for(let x = g.x1;x <= g.x2;++x)
            if(X=Y.get(x))
              if(col= _.some(X,_testHit,stage,obj,collisionMask))
                return col;
    };

    /**
     * @function
     */
    let _delFromGrid= (stage, item) => {
      let X,Y,g= item.bbox4;
      for(let y = g.y1;y <= g.y2; ++y)
        if(Y=stage.grid.get(y))
          for(let x = g.x1;x<=g.x2;++x)
            if(X=Y.get(x))
              _.dissoc(X,item.p.id);
    };

    /**
     * @function
     */
    let _addToGrid= (stage, item) => {
      let X,Y,g= item.bbox4;
      for(let y = g.y1;y <= g.y2;++y) {
        if(!stage.grid.has(y))
          stage.grid.set(y, _.jsMap());
        Y=stage.grid.get(y);
        for(let x = g.x1;x <= g.x2;++x) {
          if(!Y.has(x))
            Y.set(x, _.jsMap());
          X=Y.get(x);
          _.assoc(X,item.p.id, item.p.type);
        }
      }
    };

    /**
     * @object
     */
    let _locateOb= {
      //x,y => center
      //cx,cy => x-cx = left,y-cy=top
      p: {x: 0, y: 0, cx: 0, cy: 0, w: 1, h: 1 }
    };

    /**
     * @class Stage
     */
    Mojo.defType(["Stage", Mojo.Entity], {
      init: function(func,options) {
        this.scene = func;
        this.items = [];
        // stores relations for fast select like jQuery
        this.cache = _.jsMap();
        // pin object's location for fast search
        this.grid = _.jsMap();
        this.tick = 0;
        this.trash = [];
        // fast lookup to get entities
        this.index = _.jsMap();
        // for tiles
        this.contactLayers = [];
        this.options = _.inject({},_defs, {w: Mojo.width,
                                           h: Mojo.height}, options);
      },
      addRelation: function(arg,obj) {
        if(is.vec(arg))
          arg.forEach(x => this.addRelation(x,obj));
        else {
          if(!_.has(this.cache,arg)) _.assoc(this.cache,arg, []);
          _.conj(_.get(this.cache,arg),obj);
        }
        return this;
      },
      delRelation: function(arg, obj) {
        if(is.vec(arg))
          arg.forEach(x => this.delRelation(x,obj));
        else {
          let a = _.get(this.cache,arg);
          let i = a ? a.indexOf(obj) : -1;
          if(i > -1) a.splice(i,1);
        }
        return this;
      },
      disposed: function() {
        Mojo.EventBus.pub("disposed", this);
        return this;
      },
      run: function() {
        return this.scene(this);
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
        itm.stage = this;
        itm.bbox4 = _.jsMap();

        if(container)
          _.conj(container.children,itm);
        itm.container = container;

        Mojo.genPts(itm);
        Mojo.genContactPts(itm);

        if(itm.className)
          this.addRelation(itm.className, itm);

        if(itm.features)
          this.addRelation(itm.features, itm);

        if(itm.p && itm.p.id)
          _.assoc(this.index, itm.p.id, itm);

        Mojo.EventBus.pub([["inserted",this, itm],
                           ["inserted",itm,this]]);

        this.regrid(itm);
        return itm;
      },
      remove: function(itm) {
        _delFromGrid(this, itm);
        this.trash.push(itm);
        return this;
      },
      forceRemove: function(itm) {
        let idx = this.items.indexOf(itm);
        if(idx > -1) {
          this.items.splice(idx,1);
          if(itm.className)
            this.delRelation(itm.className,itm);
          if(itm.features)
            this.delRelation(itm.features,itm);
          if(itm.container) {
            let i = itm.container.children.indexOf(itm);
            if(i > -1)
              itm.container.children.splice(i,1);
          }
          itm.dispose && itm.dispose();
          if(itm.p.id)
            _.dissoc(this.index,itm.p.id);
          Mojo.EventBus.pub("removed",this, itm);
        }
        return this;
      },
      pause: function() {
        this.paused = true;
        return this;
      },
      unpause: function() {
        this.paused = false;
        return this;
      },
      contactLayer: function(obj) {
        _.conj(this.contactLayers,obj);
        obj.contactLayer = true;
        return this.insert(obj);
      },
      search: function(obj,collisionMask) {
        if(!obj.bbox4)
          this.regrid(obj, obj.stage !== this);
        if(is.undef(collisionMask))
          collisionMask = obj.p && obj.p.collisionMask;
        return _hitLayer(this,obj,collisionMask) ||
               _hitTest(this, obj,collisionMask);
      },
      locate: function(x,y,collisionMask) {
        let tmp= _locateObj;
        tmp.p.x = x;
        tmp.p.y = y;
        tmp.bbox4=null;
        this.regrid(tmp,true);
        let col= _hitLayer(this,tmp,collisionMask) ||
                 _hitTest(this,tmp,collisionMask);
        return (col && col.obj) ? col.obj : undefined;
      },
      collide: function(obj,options) {
        let col, col2,
            collisionMask,
            maxCol, curCol, skipEvents;

        if(!is.obj(options)) {
          collisionMask = options;
        } else {
          maxCol = options.maxCol;
          skipEvents = options.skipEvents;
          collisionMask = options.collisionMask;
        }

        if(is.undef(collisionMask))
          collisionMask= obj.p && obj.p.collisionMask;
        maxCol = maxCol || 3;

        Mojo.genContactPts(obj);
        this.regrid(obj);

        curCol = maxCol;
        while(curCol > 0 &&
              (col = _hitLayer(this,obj,collisionMask))) {
          if(!skipEvents)
            Mojo.EventBus.pub([["hit",obj, col],
                               ["hit.collision",obj,col]]);
          Mojo.genContactPts(obj);
          this.regrid(obj);
          --curCol;
        }

        curCol = maxCol;
        while(curCol > 0 &&
              (col2 = _hitTest(this,obj,collisionMask))) {
          Mojo.EventBus.pub([["hit",obj,col2],
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
            Mojo.EventBus.pub([["hit",obj2,col2],
                               ["hit.sprite",obj2,col2]]);
          }
          Mojo.genContactPts(obj);
          this.regrid(obj);
          --curCol;
        }
        return col2 || col;
      },
      regrid: function(item,skipAdd) {
        if(item.contactLayer)
        return;

        if(!item.bbox4)
          item.bbox4= Mojo.bbox4();

        let c = item.c || item.p;
        let gridX1 = _.floor((c.x - c.cx) / this.options.gridW),
            gridY1 = _.floor((c.y - c.cy) / this.options.gridH),
            gridX2 = _.floor((c.x - c.cx + c.w) / this.options.gridW),
            gridY2 = _.floor((c.y - c.cy + c.h) / this.options.gridH),
            g = item.bbox4;

        if(g.x1 !== gridX1 || g.x2 !== gridX2 ||
           g.y1 !== gridY1 || g.y2 !== gridY2) {

          if(g.x1 !== NaN)
            _delFromGrid(this, item);

          g.x1= gridX1;
          g.x2= gridX2;
          g.y1= gridY1;
          g.y2= gridY2;

          if(!skipAdd)
            _addToGrid(this,item);
        }
      },
      update: function(items,dt,isContainer) {
        for (let item,i=0,z=items.length;i<z;++i) {
          item=items[i];
          if(!isContainer &&
             (item.p.visibleOnly &&
              (!item.mark || item.mark < this.tick))) continue;
          if(isContainer || !item.container) {
            item.update(dt);
            Mojo.genContactPts(item);
            this.regrid(item);
          }
        }
        return this;
      },
      step: function(dt) {
        if(this.paused) { return false; }
        this.tick += dt;
        _markAll(this);
        Mojo.EventBus.pub("prestep",this,dt);
        this.update(this.items,dt);
        Mojo.EventBus.pub("step",this,dt);
        if(this.trash.length > 0) {
          this.trash.forEach(x => this.forceRemove(x));
          this.trash.length = 0;
        }
        Mojo.EventBus.pub("poststep",this,dt);
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
        this.unpause();
        return this;
      },
      render: function(ctx) {
        if(this.hidden) { return false; }
        this.options.sort &&
          this.items.sort(this.options.sort);
        Mojo.EventBus.pub([["prerender",this,ctx],
                           ["beforerender",this,ctx]]);
        this.items.forEach( item => {
          // Don't render sprites with containers (sprites do that themselves)
          // Also don't render if not onscreen
          if(!item.container &&
             (item.p.renderAlways ||
              item.mark >= this.tick)) { item.render(ctx); }
        });
        Mojo.EventBus.pub([["render",this,ctx],
                           ["postrender",this,ctx]]);
        return this;
      }
    });

    /**
     * @class Locator
     */
    Mojo.defType("Locator",{

      init: function(stage,selector) {
        this.stage = stage;
        this.selector = selector;
        this.items = _.get(this.stage.cache, this.selector) || [];
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
        this.items.forEach(x => Mojo.EventBus.pub(name, x, param));
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
        (v === undefined)
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
    });

    // Maybe add support for different types
    // entity - active collision detection
    //  particle - no collision detection, no adding components to lists / etc
    //
    // Q("Player").invoke("shimmer); - needs to return a selector
    // Q(".happy").invoke("sasdfa",'fdsafas',"fasdfas");
    // Q("Enemy").p({ a: "asdfasf"  });
    Mojo["$"]= function(selector) {
      let args= _.slice(arguments,1),
          y= Mojo.stage(args.length>0 ? args[0] : Mojo.activeStage);
      return is.num(selector) ? _.get(y.index,selector) : new Mojo.Locator(y,selector);
    };

    /**
     * @method
     */
    Mojo.stage = (num) => {
      return Mojo.stages[(num === undefined) ? Mojo.activeStage : num ];
    };

    /**
     * @method
     */
    Mojo.runScene = function(scene,num,options) {
      let _s = _.get(Mojo.scenes,scene);
      if(!_s)
        throw "Unknown scene id: " + scene;

      if(is.obj(num)) {
        options = num;
        num = _.dissoc(options,"stage");
      }

      options = _.inject({},_s.options,options);
      if(is.undef(num))
        num= options["stage"] || 0;

      let y= Mojo.stages[num];
      y && y.dispose();

      Mojo.activeStage = num;
      y = new Mojo.Stage(_s.scene,options);
      Mojo.stages[num] = y;

      y.run();

      Mojo.activeStage = 0;

      if(!Mojo.loop)
        Mojo.gameLoop(Mojo.runGameLoop);

      return y;
    };

    /**
     * @method
     */
    Mojo.runGameLoop = (dt) => {
      let i, z, y;

      if(dt < 0) dt= 1.0/60;
      if(dt > 1.0/15) dt= 1.0/15;

      for(i=0,z=Mojo.stages.length;i<z;++i) {
        Mojo.activeStage = i;
        y = Mojo.stage();
        y && y.step(dt);
      }

      Mojo.activeStage = 0;
      Mojo.clear();

      for(i =0,z=Mojo.stages.length;i<z;++i) {
        Mojo.activeStage = i;
        y = Mojo.stage();
        y && y.render(Mojo.ctx);
      }

      Mojo.input &&
        Mojo.ctx &&
          Mojo.input.drawCanvas(Mojo.ctx);
      Mojo.activeStage = 0;
    };

    /**
     * @method
     */
    Mojo.deleteStage = (num) => {
      if(Mojo.stages[num]) {
        Mojo.stages[num].dispose();
        Mojo.stages[num] = null;
      }
    };

    /**
     * @method
     */
    Mojo.deleteStages = () => {
      for(let i=0,z=Mojo.stages.length;i<z;++i)
      Mojo.deleteStage(i);
      Mojo.stages.length = 0;
    };

    /**
     * @method
     */
    Mojo.scene = (name,action,opts) => {
      if(action) {
        if(!is.fun(action))
          throw "Expecting scene action function!";
        _.assoc(Mojo.scenes,name, {name: name,
                                   scene: action,
                                   options: opts || {} });
      }
      return _.get(Mojo.scenes,name);
    };


    return Mojo;
  };

})(this);


