(function(global) {
  "use strict";

  let Mojo=global.Mojo, _ = Mojo._;
  let _defs= {
    sort: false,
    gridW: 400,
    gridH: 400,
    x: 0,
    y: 0
  };

  Mojo.Scenes = function(Mo) {

    Mo.activeLayer = 0;
    Mo.scenes = {};
    Mo.layers = [];

    let hitLayer= function(L,obj,collisionMask) {
      for(let y,c,i=0,z=L.collisionLayers.length;i<z;++i) {
        y=L.collisionLayers[i];
        if(y.p.type & collisionMask)
          if(c= y.collide(obj)) { c.obj = y; return c; }
      }
      return false;
    };
    let markAll= function(L) {
      let time=L.time,
          items= L.items,
          view= L.viewport,
          x = view ? view.x : 0,
          y = view ? view.y : 0,
          scale = view ? view.scale : 1,
          viewW = Mo.width / scale,
          viewH = Mo.height / scale,
          gridX1 = Math.floor(x / L.options.gridW),
          gridY1 = Math.floor(y / L.options.gridH),
          gridX2 = Math.floor((x + viewW) / L.options.gridW),
          gridY2 = Math.floor((y + viewH) / L.options.gridH),
          tmp,gridRow, gridBlock;
      for(let iy=gridY1; iy<=gridY2; ++iy)
        if(L.grid.has(iy)) {
          gridRow = L.grid.get(iy);
          for(let ix=gridX1; ix<=gridX2; ++ix)
            if(gridRow.has(ix)) {
              gridBlock = gridRow.get(ix);
              if (!gridBlock instanceof Map) {
                alert("poo");
              }
              gridBlock.forEach((v,k) => {
                if(tmp=L.index.get(k))
                { tmp.mark = time;
                  if(tmp.container)
                    tmp.container.mark = time; }
              });
            }
        }
    };
    let testHit= function(type,id,obj,collisionMask) {
      if(_.isUndef(collisionMask) || (collisionMask & type)) {
        let col, obj2 = this.index.get(id);
        if(obj2 &&
           obj2 !== obj &&
           Mo.overlap(obj,obj2)) {
          if(col= Mo.collision(obj,obj2)) {
            col.obj = obj2;
            return col;
          } else {
            return false;
          }
        }
      }
    };
    let hitTest= function(L,obj,collisionMask) {
      let X,Y,col, g=obj.grid;
      for(let y = g.get("Y1"),yz=g.get("Y2");y <= yz;++y)
        if(L.grid.has(y)) {
          Y=L.grid.get(y);
          for(let x = g.get("X1"),xz=g.get("X2");x <= xz;++x)
            if(Y.has(x)) {
              X=Y.get(x);
              col = _.find(X,testHit,L,obj,collisionMask);
              if(col)
                return col;
            }
        }
      return false;
    };
    let addCache= (L, arg,obj) => {
      if (_.isArray(arg))
        arg.forEach(x => addCache(L, x,obj));
      else {
        if (!L.cache.has(arg)) L.cache.set(arg, []);
        L.cache.get(arg).push(obj);
      }
    };
    let delCache= (L, arg, obj) => {
      if (_.isArray(arg))
        arg.forEach(x => delCache(L, x,obj));
      else {
        let i = L.cache.get(arg).indexOf(obj);
        if(i > -1) L.cache.get(arg).splice(i,1);
      }
    };
    let delGrid= (L, item) => {
      let X,Y,g= item.grid;
      for(let y = g.get("Y1"),yz= g.get("Y2");y <= yz; ++y)
        if(L.grid.has(y)) {
          Y=L.grid.get(y);
          for(let x = g.get("X1"),xz=g.get("X2");x<=xz;++x)
            if(Y.has(x)) {
              X=Y.get(x);
              X.delete(item.p.id);
            }
        }
    };
    let addGrid= (L, item) => {
      let X,Y,g= item.grid;
      for(let y = g.get("Y1"),yz=g.get("Y2");y <= yz;++y) {
        if(!L.grid.has(y))
          L.grid.set(y, new Map());
        Y=L.grid.get(y);
        for(let x = g.get("X1"),xz=g.get("X2");x <= xz;++x) {
          if(!Y.has(x))
            Y.set(x, new Map());
          X=Y.get(x);
          X.set(item.p.id, item.p.type);
        }
      }
    };

    Mo.defType(["Layer", Mo.Entity], {
      init: function(action,options) {
        this.scene = action;
        this.items = [];
        this.cache = new Map();
        this.grid = new Map();
        this.time = 0;
        this.trash = [];
        this.index = new Map();
        this.collisionLayers = [];
        this.options = _.inject(_.clone(_defs), {w: Mo.width,
                                                 h: Mo.height}, options);
      },
      disposed: function() {
        //this.invoke("debind");
        Mo.EventBus.pub("disposed", this);
      },
      run: function() {
        this.scene(this);
      },
      // Load an array of assets of the form:
      // [ [ "Player", { x: 15, y: 54 } ],
      //   [ "Enemy",  { x: 54, y: 42 } ] ]
      // Either pass in the array or a string of asset name
      loadAssets: function(asset) {
        let arr = _.isArray(asset) ? asset : Mo.asset(asset);
        arr.forEach(a => {
          let spriteClass = a[0];
          let spriteProps = a[1];
          this.insert(new Mo[spriteClass](spriteProps)); });
      },
      each: function(cb) {
        let args= _.slice(arguments,1);
        this.items.forEach(x => cb.apply(x,args));
      },
      invoke: function(funcName) {
        let args= _.slice(arguments,1);
        this.items.forEach(x => x[funcName].apply(x,args));
      },
      detect: function(func) {
        let args=_.slice(arguments,1);
        for(let i = this.items.length-1;i>= 0; --i) {
          if(func.apply(this.items[i],args))
          return this.items[i];
        }
        return false;
      },
      identify: function(func) {
        let res, args=_.slice(arguments,1);
        for(let i = this.items.length-1;i>= 0; --i) {
          res= func.apply(this.items[i],args);
          if (res)
            return res;
        }
        return false;
      },
      find: function(id) {
        return this.index.get(id);
      },
      insert: function(itm,container) {
        itm.container = container;
        this.items.push(itm);
        itm.layer = this;
        itm.grid = new Map();

        if(container)
          container.children.push(itm);

        // Make sure we have a square of collision points
        Mo._generatePoints(itm);
        Mo._generateCollisionPoints(itm);

        if(itm.className)
          addCache(this, itm.className, itm);

        if(itm.features)
          addCache(this, itm.features, itm);

        if(itm.p && itm.p.id)
          this.index.set(itm.p.id, itm);

        Mo.EventBus.pub("inserted",this, itm);
        Mo.EventBus.pub("inserted",itm,this);

        this.regrid(itm);
        return itm;
      },
      remove: function(itm) {
        delGrid(this, itm);
        this.trash.push(itm);
      },
      forceRemove: function(itm) {
        let idx =  this.items.indexOf(itm);
        if(idx > -1) {
          this.items.splice(idx,1);
          if(itm.className)
            delCache(this, itm.className,itm);
          if(itm.features)
            delCache(this, itm.features,itm);
          if(itm.container) {
            let i = itm.container.children.indexOf(itm);
            if(i > -1)
              itm.container.children.splice(i,1);
          }
          itm.dispose && itm.dispose();
          if(itm.p.id===0 || itm.p.id)
            this.index.delete(itm.p.id);
          Mo.EventBus.pub('removed',this, itm);
        }
      },
      pause: function() {
        this.paused = true;
      },
      unpause: function() {
        this.paused = false;
      },
      collisionLayer: function(layer) {
        this.collisionLayers.push(layer);
        layer.collisionLayer = true;
        return this.insert(layer);
      },
      search: function(obj,collisionMask) {
        if(!obj.grid)
          this.regrid(obj,obj.layer !== this);
        if(_.isUndef(collisionMask))
          collisionMask = obj.p && obj.p.collisionMask;
        return hitLayer(this,obj,collisionMask) ||
               hitTest(this, obj,collisionMask);
      },
      _locateObj: {
        p: {
          x: 0,
          y: 0,
          cx: 0,
          cy: 0,
          w: 1,
          h: 1
        }, grid: {}
      },
      locate: function(x,y,collisionMask) {
        this._locateObj.p.x = x;
        this._locateObj.p.y = y;
        this.regrid(this._locateObj,true);
        let col= hitLayer(this,this._locateObj,collisionMask) ||
                 hitTest(this,this._locateObj,collisionMask);
        return (col && col.obj) ? col.obj : false;
      },
      collide: function(obj,options) {
        let col, col2, collisionMask,
            maxCol, curCol, skipEvents;

        if(!_.isObject(options)) {
          collisionMask = options;
        } else {
          maxCol = options.maxCol;
          skipEvents = options.skipEvents;
          collisionMask = options.collisionMask;
        }

        if(_.isUndef(collisionMask))
          collisionMask= obj.p && obj.p.collisionMask;
        maxCol = maxCol || 3;

        Mo._generateCollisionPoints(obj);
        this.regrid(obj);

        curCol = maxCol;
        while(curCol > 0 &&
              (col = hitLayer(this,obj,collisionMask))) {
          if(!skipEvents) {
            Mo.EventBus.pub('hit',obj, col);
            Mo.EventBus.pub('hit.collision',obj,col);
          }
          Mo._generateCollisionPoints(obj);
          this.regrid(obj);
          --curCol;
        }

        curCol = maxCol;
        while(curCol > 0 &&
              (col2 = hitTest(this,obj,collisionMask))) {
          Mo.EventBus.pub('hit',obj,col2);
          Mo.EventBus.pub('hit.sprite',obj,col2);
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
            Mo.EventBus.pub('hit',obj2,col2);
            Mo.EventBus.pub('hit.sprite',obj2,col2);
          }
          Mo._generateCollisionPoints(obj);
          this.regrid(obj);
          --curCol;
        }
        return col2 || col;
      },
      regrid: function(item,skipAdd) {
        if(item.collisionLayer) { return; }
        if (!item.grid)
          item.grid= new Map();

        let c = item.c || item.p;
        let gridX1 = Math.floor((c.x - c.cx) / this.options.gridW),
            gridY1 = Math.floor((c.y - c.cy) / this.options.gridH),
            gridX2 = Math.floor((c.x - c.cx + c.w) / this.options.gridW),
            gridY2 = Math.floor((c.y - c.cy + c.h) / this.options.gridH),
            g = item.grid;

        if(g.get("X1") !== gridX1 || g.get("X2") !== gridX2 ||
           g.get("Y1") !== gridY1 || g.get("Y2") !== gridY2) {

          //if(g.has("X1") !== void 0) { delGrid(this, item); }
          if(g.has("X1"))
            delGrid(this, item);
           g.set("X1", gridX1);
           g.set("X2", gridX2);
           g.set("Y1", gridY1);
           g.set("Y2", gridY2);

          if(!skipAdd)
            addGrid(this,item);
        }
      },
      update: function(items,dt,isContainer) {
        for (let item,i=0,z=items.length;i<z;++i) {
          item=items[i];
          if(!isContainer &&
             (item.p.visibleOnly &&
              (!item.mark || item.mark < this.time))) continue;
          if(isContainer || !item.container) {
            item.update(dt);
            Mo._generateCollisionPoints(item);
            this.regrid(item);
          }
        }
      },
      step: function(dt) {
        if(this.paused) { return false; }
        this.time += dt;
        markAll(this);
        Mo.EventBus.pub("prestep",this,dt);
        this.update(this.items,dt);
        Mo.EventBus.pub("step",this,dt);
        if(this.trash.length > 0) {
          this.trash.forEach(x => this.forceRemove(x));
          this.trash.length = 0;
        }
        Mo.EventBus.pub('poststep',this,dt);
      },
      hide: function() {
        this.hidden = true;
      },
      show: function() {
        this.hidden = false;
      },
      stop: function() {
        this.hide();
        this.pause();
      },
      start: function() {
        this.show();
        this.unpause();
      },
      render: function(ctx) {
        if(this.hidden) { return false; }
        this.options.sort &&
          this.items.sort(this.options.sort);
        Mo.EventBus.pub("prerender",this,ctx);
        Mo.EventBus.pub("beforerender",this,ctx);

        this.items.forEach( item => {
          // Don't render sprites with containers (sprites do that themselves)
          // Also don't render if not onscreen
          if(!item.container &&
             (item.p.renderAlways ||
              item.mark >= this.time)) { item.render(ctx); } });

        Mo.EventBus.pub("render",this,ctx);
        Mo.EventBus.pub("postrender",this,ctx);
      }
    });

    Mo.defType("Locator",{

      init: function(layer,selector) {
        this.layer = layer;
        this.selector = selector;
        this.items = this.layer.cache.get(this.selector) || [];
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
        this.items.forEach(x => Mo.EventBus.pub(name, x, param));
        return this;
      },
      dispose: function() {
        this.invoke("dispose");
      },
      detect: function(func) {
        let x,args=_.slice(arguments,1);
        for(let i=0,z=this.items.length;i<z;++i){
          x=this.items[i];
          if(func.apply(x, args)) return x;
        }
        return false;
      },
      identify: function(func) {
        let x,res, args=_.slice(arguments,1);
        for(let i=0,z=this.items.length;i<z;++i) {
          x=this.items[i];
          if(res= func.apply(x, args)) return res;
        }
        return false;
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
        (v === void 0) ? this.each(this._pObject,k) : this.each(this._pSingle,k,v);
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
    Mo.pin = function(selector,where) {
      let y= Mo.layer((where === void 0) ? Mo.activeLayer : where);
      return _.isNumber(selector) ? y.index.get(selector) : new Mo.Locator(y,selector);
    };

    Mo.layer = (num) => {
      return Mo.layers[(num === void 0) ? Mo.activeLayer : num ];
    };

    Mo.runScene = function(scene,num,options) {
      let _s = _.isString(scene) ? Mo.scenes[scene] : null;
      if (!_s)
        throw "Unknown scene id: " + scene;

      if(_.isObject(num)) {
        options = num;
        num = _.dissoc(options,"layer");
      }

      options = _.inject(_.clone(_s.options), options);
      if (_.isUndef(num))
        num= options["layer"] || 0;

      Mo.layers[num] && Mo.layers[num].dispose();
      Mo.activeLayer = num;
      let y = Mo.layers[num] = new Mo.Layer(_s.scene,options);

      y.options.asset &&
        y.loadAssets(y.options.asset);

      y.run();

      Mo.activeLayer = 0;

      if(!Mo.loop)
        Mo.gameLoop(Mo.runGameLoop);

      return y;
    };

    Mo.runGameLoop = (dt) => {
      let i, z, y;

      if(dt < 0) dt = 1.0/60;
      if(dt > 1.0/15) dt  = 1.0/15;

      for(i=0,z=Mo.layers.length;i<z;++i) {
        Mo.activeLayer = i;
        y = Mo.layer();
        y && y.step(dt);
      }

      Mo.activeLayer = 0;
      Mo.ctx && Mo.clear();

      for(i =0,z=Mo.layers.length;i<z;++i) {
        Mo.activeLayer = i;
        y = Mo.layer();
        y && y.render(Mo.ctx);
      }
      Mo.input &&
        Mo.ctx &&
          Mo.input.drawCanvas(Mo.ctx);
      Mo.activeLayer = 0;
    };

    Mo.deleteLayer = (num) => {
      if(Mo.layers[num]) {
        Mo.layers[num].dispose();
        Mo.layers[num] = null;
      }
    };

    Mo.deleteLayers = function() {
      for(let i=0,z=Mo.layers.length;i<z;++i)
      Mo.deleteLayer(i);
      Mo.layers.length = 0;
    };

    Mo.scene = (name,action,opts) => {
      if(action) {
        if(!_.isFunction(action))
          throw "Expecting scene action function!";
        Mo.scenes[name] = {name: name,
                           scene: action,
                           options: opts || {} };
      }
      return Mo.scenes[name];
    };

  };

})(this);

