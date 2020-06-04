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

    let testHit= function(type,id,obj,collisionMask) {
      if(_.isUndef(collisionMask) || (collisionMask & type)) {
        let col, obj2 = this.index[id];
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

    let addCache= (L, arg,obj) => {
      if (_.isArray(arg))
        arg.forEach(x => addCache(L, x,obj));
      else {
        L.cache[arg]= L.cache[arg] || [];
        L.cache[arg].push(obj);
      }
    };
    let delCache= (L, arg, obj) => {
      if (_.isArray(arg))
        arg.forEach(x => delCache(L, x,obj));
      else {
        let i = L.cache[arg].indexOf(obj);
        if(i > -1) L.cache[arg].splice(i,1);
      }
    };
    let delGrid= (L, item) => {
      let g= item.grid;
      for(let y = g.Y1;y <= g.Y2; ++y)
        if(L.grid[y])
          for(let x = g.X1;x <= g.X2;++x)
            if(L.grid[y][x])
              delete L.grid[y][x][item.p.id];
    };
    let addGrid= (L, item) => {
      let g= item.grid;
      for(let y = g.Y1;y <= g.Y2;++y) {
        if(!L.grid[y])
          L.grid[y] = {};
        for(let x = g.X1;x <= g.X2;++x) {
          if(!L.grid[y][x])
            L.grid[y][x] = {};
          L.grid[y][x][item.p.id] = item.p.type;
        }
      }
    };

    Mo.defType(["Layer",Mo.Entity],{
      init: function(action,opts) {
        this.scene = action;
        this.items = [];
        this.cache = {};
        this.index = {};
        this.grid = {};
        this.time = 0;
        this.trash = [];
        this._collisionLayers = [];
        this.options = _.inject(_.clone(_defs), {w: Mo.width,
                                                 h: Mo.height}, opts);
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
        return this.index[id];
      },
      insert: function(itm,container) {
        itm.container = container;
        this.items.push(itm);
        itm.layer = this;
        itm.grid = {};

        if(container)
          container.children.push(itm);

        // Make sure we have a square of collision points
        Mo._generatePoints(itm);
        Mo._generateCollisionPoints(itm);

        if(itm.className)
          addCache(this, itm.className, itm);

        if(itm.features)
          addCache(this, itm.features, itm);

        if(itm.p)
          this.index[itm.p.id] = itm;

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
          if(itm.p.id)
            delete this.index[itm.p.id];
          Mo.EventBus.pub('removed',this, itm);
        }
      },
      pause: function() {
        this.paused = true;
      },
      unpause: function() {
        this.paused = false;
      },
      gridTest: function(obj,collisionMask) {
        let col,
            cells,
            g=obj.grid;
        for(let y = g.Y1;y <= g.Y2;++y)
          if(this.grid[y])
            for(let x = g.X1;x <= g.X2;++x)
              if(cells = this.grid[y][x]) {
                col = _.find(cells,testHit,this,obj,collisionMask);
                if(col)
                  return col;
              }
        return false;
      },
      collisionLayer: function(layer) {
        this._collisionLayers.push(layer);
        layer.collisionLayer = true;
        return this.insert(layer);
      },
      _collideCollisionLayer: function(obj,collisionMask) {
        let layer,col;
        for(let i=0,z=this._collisionLayers.length;i<z;++i) {
          layer=this._collisionLayers[i];
          if(layer.p.type & collisionMask)
            if(col = layer.collide(obj)) {
              col.obj = layer;
              return col;
            }
        }
        return false;
      },
      search: function(obj,collisionMask) {
        if(!obj.grid)
          this.regrid(obj,obj.layer !== this);
        if(_.isUndef(collisionMask))
          collisionMask = obj.p && obj.p.collisionMask;
        return this._collideCollisionLayer(obj,collisionMask) ||
               this.gridTest(obj,collisionMask);
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
        let col= this._collideCollisionLayer(this._locateObj,collisionMask);
        col= col || this.gridTest(this._locateObj,collisionMask);
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
              (col = this._collideCollisionLayer(obj,collisionMask))) {
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
              (col2 = this.gridTest(obj,collisionMask))) {
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
        item.grid = item.grid || {};

        let c = item.c || item.p;
        let gridX1 = Math.floor((c.x - c.cx) / this.options.gridW),
            gridY1 = Math.floor((c.y - c.cy) / this.options.gridH),
            gridX2 = Math.floor((c.x - c.cx + c.w) / this.options.gridW),
            gridY2 = Math.floor((c.y - c.cy + c.h) / this.options.gridH),
            grid = item.grid;

        if(grid.X1 !== gridX1 || grid.X2 !== gridX2 ||
           grid.Y1 !== gridY1 || grid.Y2 !== gridY2) {

           if(grid.X1 !== void 0) { delGrid(this, item); }
           grid.X1 = gridX1;
           grid.X2 = gridX2;
           grid.Y1 = gridY1;
           grid.Y2 = gridY2;

           if(!skipAdd) { addGrid(this,item); }
        }
      },
      markSprites: function(items,time) {
        let viewport = this.viewport,
            scale = viewport ? viewport.scale : 1,
            x = viewport ? viewport.x : 0,
            y = viewport ? viewport.y : 0,
            viewW = Mo.width / scale,
            viewH = Mo.height / scale,
            gridX1 = Math.floor(x / this.options.gridW),
            gridY1 = Math.floor(y / this.options.gridH),
            gridX2 = Math.floor((x + viewW) / this.options.gridW),
            gridY2 = Math.floor((y + viewH) / this.options.gridH),
            gridRow, gridBlock;
        for(let iy=gridY1; iy<=gridY2; ++iy) {
          if((gridRow = this.grid[iy])) {
            for(let ix=gridX1; ix<=gridX2; ++ix) {
              if((gridBlock = gridRow[ix])) {
                for(let id in gridBlock) {
                  if(this.index[id]) {
                    this.index[id].mark = time;
                    if(this.index[id].container)
                      this.index[id].container.mark = time;
                  }
                }
              }
            }
          }
        }
      },
      updateSprites: function(items,dt,isContainer) {
        let item;
        for (let i=0,z=items.length;i<z;++i) {
          item=items[i];
          // If set to visible only, don't step if set to visibleOnly
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
        this.markSprites(this.items,this.time);
        Mo.EventBus.pub("prestep",this,dt);
        this.updateSprites(this.items,dt);
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
        this.items = this.layer.cache[this.selector] || [];
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
      return _.isNumber(selector) ? y.index[selector] : new Mo.Locator(y,selector);
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

