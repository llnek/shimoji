/*global Quintus:false, module:false */
var quintusScenes = function(Quintus) {
  "use strict";

  Quintus.Scenes = function(Q) {
    let _ = Q._;
    Q.scenes = {};
    Q.stages = [];

    Q.Class.extend('Scene',{
      init: function(sceneFunc,opts) {
        this.opts = opts || {};
        this.sceneFunc = sceneFunc;
      }
    });

    Q.scene = function(name,sceneFunc,opts) {
      if(sceneFunc === void 0) {
        return Q.scenes[name];
      } else {
        if(_.isFunction(sceneFunc)) {
          sceneFunc = new Q.Scene(sceneFunc,opts);
          sceneFunc.name = name;
        }
        Q.scenes[name] = sceneFunc;
        return sceneFunc;
      }
    };

    Q._nullContainer = {
      c: {
        x: 0,
        y: 0,
        angle: 0,
        scale: 1
      },
      matrix: Q.matrix2d()
    };

    Q.collision = (function() {
      let normalX, normalY,
          offset = [ 0,0 ],
          result1 = { separate: [] },
          result2 = { separate: [] };

      function calculateNormal(points,idx) {
        let pt1 = points[idx],
            pt2 = points[idx+1] || points[0];

        normalX = -(pt2[1] - pt1[1]);
        normalY = pt2[0] - pt1[0];

        let dist = Math.sqrt(normalX*normalX + normalY*normalY);
        if(dist > 0) {
          normalX /= dist;
          normalY /= dist;
        }
      }

      function dotProductAgainstNormal(point) {
        return (normalX * point[0]) + (normalY * point[1]);

      }

      function collide(o1,o2,flip) {
        let min1,max1,
            min2,max2,
            d1, d2,
            offsetLength,
            tmp, i, j,
            minDist, minDistAbs,
            shortestDist = Number.POSITIVE_INFINITY,
            collided = false,
            p1, p2;

        let result = flip ? result2 : result1;

        offset[0] = 0; //o1.x + o1.cx - o2.x - o2.cx;
        offset[1] = 0; //o1.y + o1.cy - o2.y - o2.cy;

        // If we have a position matrix, just use those points,
        if(o1.c) {
          p1 = o1.c.points;
        } else {
          p1 = o1.p.points;
          offset[0] += o1.p.x;
          offset[1] += o1.p.y;
        }

        if(o2.c) {
          p2 = o2.c.points;
        } else {
          p2 = o2.p.points;
          offset[0] += -o2.p.x;
          offset[1] += -o2.p.y;
        }

        o1 = o1.p;
        o2 = o2.p;

        for(let i = 0;i<p1.length;++i) {
          calculateNormal(p1,i);
          min1 = dotProductAgainstNormal(p1[0]);
          max1 = min1;
          for(let j = 1; j<p1.length;++j) {
            tmp = dotProductAgainstNormal(p1[j]);
            if(tmp < min1) { min1 = tmp; }
            if(tmp > max1) { max1 = tmp; }
          }

          min2 = dotProductAgainstNormal(p2[0]);
          max2 = min2;

          for(let j = 1;j<p2.length;++j) {
            tmp = dotProductAgainstNormal(p2[j]);
            if(tmp < min2) { min2 = tmp; }
            if(tmp > max2) { max2 = tmp; }
          }

          offsetLength = dotProductAgainstNormal(offset);
          min1 += offsetLength;
          max1 += offsetLength;

          d1 = min1 - max2;
          d2 = min2 - max1;

          if(d1 > 0 || d2 > 0) { return null; }

          minDist = (max2 - min1) * -1;
          if(flip) { minDist *= -1; }

          minDistAbs = Math.abs(minDist);

          if(minDistAbs < shortestDist) {
            result.distance = minDist;
            result.magnitude = minDistAbs;
            result.normalX = normalX;
            result.normalY = normalY;

            if(result.distance > 0) {
              result.distance *= -1;
              result.normalX *= -1;
              result.normalY *= -1;
            }

            collided = true;
            shortestDist = minDistAbs;
          }
        }

        // Do return the actual collision
        return collided ? result : null;
      }

      function satCollision(o1,o2) {
        let result1, result2, result;

        if(!o1.p.points)
          Q._generatePoints(o1);

        if(!o2.p.points)
          Q._generatePoints(o2);

        result1 = collide(o1,o2);
        if(!result1) { return false; }

        result2 = collide(o2,o1,true);
        if(!result2) { return false; }

        result = (result2.magnitude < result1.magnitude) ? result2 : result1;

        if(result.magnitude === 0) { return false; }
        result.separate[0] = result.distance * result.normalX;
        result.separate[1] = result.distance * result.normalY;

        return result;
      }

      return satCollision;
    }());

    Q.overlap = function(o1,o2) {
      let c1 = o1.c || o1.p || o1;
      let c2 = o2.c || o2.p || o2;

      let o1x = c1.x - (c1.cx || 0),
          o1y = c1.y - (c1.cy || 0);
      let o2x = c2.x - (c2.cx || 0),
          o2y = c2.y - (c2.cy || 0);

      return !((o1y+c1.h<o2y) || (o1y>o2y+c2.h) ||
               (o1x+c1.w<o2x) || (o1x>o2x+c2.w));
    };

    Q.Stage = Q.GameObject.extend({
      // Should know whether or not the stage is paused
      defaults: {
        sort: false,
        gridW: 400,
        gridH: 400,
        x: 0,
        y: 0
      },

      init: function(scene,opts) {
        this.scene = scene;
        this.items = [];
        this.lists = {};
        this.index = {};
        this.removeList = [];
        this.grid = {};
        this._collisionLayers = [];

        this.time = 0;

        this.defaults['w'] = Q.width;
        this.defaults['h'] = Q.height;

        this.options = _.inject({},this.defaults);
        if(this.scene)
          _.inject(this.options,scene.opts);

        _.inject(this.options,opts);

        if(this.options.sort &&
           !_.isFunction(this.options.sort)) {
          this.options.sort = function(a,b) {
            return ((a.p && a.p.z) || -1) - ((b.p && b.p.z) || -1);
          };
        }
      },

      disposed: function() {
        this.invoke("debind");
        this.trigger("disposed");
      },

      // Needs to be separated out so the current stage can be set
      loadScene: function() {
        if(this.scene)
          this.scene.sceneFunc(this);
      },

      // Load an array of assets of the form:
      // [ [ "Player", { x: 15, y: 54 } ],
      //   [ "Enemy",  { x: 54, y: 42 } ] ]
      // Either pass in the array or a string of asset name
      loadAssets: function(asset) {
        let assetArray = _.isArray(asset) ? asset : Q.asset(asset);
        for(let i=0;i<assetArray.length;++i) {
          let spriteClass = assetArray[i][0];
          let spriteProps = assetArray[i][1];
          this.insert(new Q[spriteClass](spriteProps));
        }
      },

      each: function(callback) {
        for(let i=0,z=this.items.length;i<z;++i)
          callback.call(this.items[i],arguments[1],arguments[2]);
      },

      invoke: function(funcName) {
        for(let i=0,z=this.items.length;i<z;++i) {
          this.items[i][funcName].call(
            this.items[i],arguments[1],arguments[2]
          );
        }
      },

      detect: function(func) {
        for(let i = this.items.length-1;i >= 0; --i) {
          if(func.call(this.items[i],arguments[1],arguments[2],arguments[3])) {
            return this.items[i];
          }
        }
        return false;
      },

      identify: function(func) {
        let res;
        for(let i = this.items.length-1;i >= 0; --i) {
          if(res= func.call(this.items[i],arguments[1],arguments[2],arguments[3])) {
            return res;
          }
        }
        return false;
      },

      find: function(id) {
        return this.index[id];
      },

      addToLists: function(lists,object) {
        for(let i=0;i<lists.length;++i) {
          this.addToList(lists[i],object);
        }
      },

      addToList: function(list, itm) {
        if(!this.lists[list]) { this.lists[list] = []; }
        this.lists[list].push(itm);
      },

      removeFromLists: function(lists, itm) {
        for(let i=0;i<lists.length;++i) {
          this.removeFromList(lists[i],itm);
        }
      },

      removeFromList: function(list, itm) {
        let listIndex = this.lists[list].indexOf(itm);
        if(listIndex !== -1) {
          this.lists[list].splice(listIndex,1);
        }
      },

      insert: function(itm,container) {
        this.items.push(itm);
        itm.stage = this;
        itm.container = container;
        if(container)
          container.children.push(itm);

        itm.grid = {};

        // Make sure we have a square of collision points
        Q._generatePoints(itm);
        Q._generateCollisionPoints(itm);

        if(itm.className)
          this.addToList(itm.className, itm);

        if(itm.activeComponents)
          this.addToLists(itm.activeComponents, itm);

        if(itm.p)
          this.index[itm.p.id] = itm;

        this.trigger('inserted',itm);
        itm.trigger('inserted',this);

        this.regrid(itm);
        return itm;
      },

      remove: function(itm) {
        this.delGrid(itm);
        this.removeList.push(itm);
      },

      forceRemove: function(itm) {
        let idx =  this.items.indexOf(itm);
        if(idx !== -1) {
          this.items.splice(idx,1);
          if(itm.className)
            this.removeFromList(itm.className,itm);
          if(itm.activeComponents)
            this.removeFromLists(itm.activeComponents,itm);
          if(itm.container) {
            let containerIdx = itm.container.children.indexOf(itm);
            if(containerIdx !== -1)
              itm.container.children.splice(containerIdx,1);
          }

          if(itm.dispose) { itm.dispose(); }
          if(itm.p.id)
            delete this.index[itm.p.id];

          this.trigger('removed',itm);
        }
      },

      pause: function() {
        this.paused = true;
      },

      unpause: function() {
        this.paused = false;
      },

      _gridCellCheck: function(type,id,obj,collisionMask) {
        if(_.isUndefined(collisionMask) ||
           collisionMask & type) {
          let obj2 = this.index[id];
          if(obj2 &&
             obj2 !== obj &&
             Q.overlap(obj,obj2)) {
            let col= Q.collision(obj,obj2);
            if(col) {
              col.obj = obj2;
              return col;
            } else {
              return false;
            }
          }
        }
      },

      gridTest: function(obj,collisionMask) {
        let grid = obj.grid, gridCell, col;

        for(let y = grid.Y1;y <= grid.Y2;++y) {
          if(this.grid[y]) {
            for(let x = grid.X1;x <= grid.X2;++x) {
              gridCell = this.grid[y][x];
              if(gridCell) {
                col = _.find(gridCell,this._gridCellCheck,this,obj,collisionMask);
                if(col)
                  return col;
              }
            }
          }
        }
        return false;
      },

      collisionLayer: function(layer) {
        this._collisionLayers.push(layer);
        layer.collisionLayer = true;
        return this.insert(layer);
      },

      _collideCollisionLayer: function(obj,collisionMask) {
        let col;
        for(let i = 0,z = this._collisionLayers.length;i<z;++i) {
          let layer = this._collisionLayers[i];
          if(layer.p.type & collisionMask) {
            col = layer.collide(obj);
            if(col) {
              col.obj = layer;
              return col;
            }
          }
        }
        return false;
      },

      search: function(obj,collisionMask) {
        let col;
        // If the object doesn't have a grid, regrid it
        // so we know where to search
        // and skip adding it to the grid only if it's not on this stage
        if(!obj.grid)
          this.regrid(obj,obj.stage !== this);

        collisionMask = _.isUndefined(collisionMask) ? (obj.p && obj.p.collisionMask) : collisionMask;

        col = this._collideCollisionLayer(obj,collisionMask);
        col =  col || this.gridTest(obj,collisionMask);
        return col;
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
        let col = null;

        this._locateObj.p.x = x;
        this._locateObj.p.y = y;

        this.regrid(this._locateObj,true);

        col = this._collideCollisionLayer(this._locateObj,collisionMask);
        col =  col || this.gridTest(this._locateObj,collisionMask);

        if(col && col.obj) {
          return col.obj;
        } else {
          return false;
        }

      },

      collide: function(obj,options) {
        let col, col2, collisionMask,
            maxCol, curCol, skipEvents;
        if(_.isObject(options)) {
          collisionMask = options.collisionMask;
          maxCol = options.maxCol;
          skipEvents = options.skipEvents;
        } else {
          collisionMask = options;
        }
        collisionMask = _.isUndefined(collisionMask) ? (obj.p && obj.p.collisionMask) : collisionMask;
        maxCol = maxCol || 3;

        Q._generateCollisionPoints(obj);
        this.regrid(obj);

        curCol = maxCol;
        while(curCol > 0 && (col = this._collideCollisionLayer(obj,collisionMask))) {
          if(!skipEvents) {
            obj.trigger('hit',col);
            obj.trigger('hit.collision',col);
          }
          Q._generateCollisionPoints(obj);
          this.regrid(obj);
          --curCol;
        }

        curCol = maxCol;
        while(curCol > 0 && (col2 = this.gridTest(obj,collisionMask))) {
          obj.trigger('hit',col2);
          obj.trigger('hit.sprite',col2);

          // Do the recipricol collision
          // TODO: extract
          if(!skipEvents) {
            var obj2 = col2.obj;
            col2.obj = obj;
            col2.normalX *= -1;
            col2.normalY *= -1;
            col2.distance = 0;
            col2.magnitude = 0;
            col2.separate[0] = 0;
            col2.separate[1] = 0;
            obj2.trigger('hit',col2);
            obj2.trigger('hit.sprite',col2);
          }

          Q._generateCollisionPoints(obj);
          this.regrid(obj);
          --curCol;
        }

        return col2 || col;
      },

      delGrid: function(item) {
        let grid = item.grid;

        for(let y = grid.Y1;y <= grid.Y2;++y) {
          if(this.grid[y]) {
            for(let x = grid.X1;x <= grid.X2;++x) {
              if(this.grid[y][x])
                delete this.grid[y][x][item.p.id];
            }
          }
        }
      },

      addGrid: function(item) {
        let grid = item.grid;

        for(let y = grid.Y1;y <= grid.Y2;++y) {
          if(!this.grid[y]) { this.grid[y] = {}; }
          for(let x = grid.X1;x <= grid.X2;++x) {
            if(!this.grid[y][x]) { this.grid[y][x] = {}; }
            this.grid[y][x][item.p.id] = item.p.type;
          }
        }

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

           if(grid.X1 !== void 0) { this.delGrid(item); }
           grid.X1 = gridX1;
           grid.X2 = gridX2;
           grid.Y1 = gridY1;
           grid.Y2 = gridY2;

           if(!skipAdd) { this.addGrid(item); }
        }
      },

      markSprites: function(items,time) {
        let viewport = this.viewport,
            scale = viewport ? viewport.scale : 1,
            x = viewport ? viewport.x : 0,
            y = viewport ? viewport.y : 0,
            viewW = Q.width / scale,
            viewH = Q.height / scale,
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
        for(let i=0,z=items.length;i<z;++i) {
          item = items[i];
          // If set to visible only, don't step if set to visibleOnly
          if(!isContainer &&
             (item.p.visibleOnly &&
              (!item.mark ||
               item.mark < this.time))) { continue; }

          if(isContainer || !item.container) {
            item.update(dt);
            Q._generateCollisionPoints(item);
            this.regrid(item);
          }
        }
      },
      step:function(dt) {
        if(this.paused) { return false; }

        this.time += dt;
        this.markSprites(this.items,this.time);

        this.trigger("prestep",dt);
        this.updateSprites(this.items,dt);
        this.trigger("step",dt);

        if(this.removeList.length > 0) {
          for(let i=0,z=this.removeList.length;i<z;++i) {
            this.forceRemove(this.removeList[i]);
          }
          this.removeList.length = 0;
        }
        this.trigger('poststep',dt);
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
        if(this.options.sort)
          this.items.sort(this.options.sort);
        this.trigger("prerender",ctx);
        this.trigger("beforerender",ctx);

        for(let i=0,z=this.items.length;i<z;++i) {
          let item = this.items[i];
          // Don't render sprites with containers (sprites do that themselves)
          // Also don't render if not onscreen
          if(!item.container &&
             (item.p.renderAlways ||
              item.mark >= this.time)) {
            item.render(ctx);
          }
        }
        this.trigger("render",ctx);
        this.trigger("postrender",ctx);
      }
    });

    Q.activeStage = 0;

    Q.StageSelector = Q.Class.extend({
      emptyList: [],

      init: function(stage,selector) {
        this.stage = stage;
        this.selector = selector;
        // Generate an object list from the selector
        // TODO: handle array selectors
        this.items = this.stage.lists[this.selector] || this.emptyList;
        this.length = this.items.length;
      },

      each: function(callback) {
        for(let i=0,z=this.items.length;i<z;++i)
          callback.call(this.items[i],arguments[1],arguments[2]);
        return this;
      },

      invoke: function(funcName) {
        for(let i=0,z=this.items.length;i<z;++i) {
          this.items[i][funcName].call(
            this.items[i],arguments[1],arguments[2]
          );
        }
        return this;
      },

      trigger: function(name,params) {
        this.invoke("trigger",name,params);
      },

      dispose: function() {
        this.invoke("dispose");
      },

      detect: function(func) {
        for(let i = 0,val=null, z=this.items.length; i<z; ++i) {
          if(func.call(this.items[i],arguments[1],arguments[2])) {
            return this.items[i];
          }
        }
        return false;
      },

      identify: function(func) {
        let res= null;
        for(let i = 0,val=null, z=this.items.length; i<z;++i) {
          if(res= func.call(this.items[i],arguments[1],arguments[2])) {
            return res;
          }
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

      set: function(property, value) {
        // Is value undefined
        if(value === void 0)
          this.each(this._pObject,property);
        else
          this.each(this._pSingle,property,value);

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

    Q.select = function(selector,scope) {
      scope = (scope === void 0) ? Q.activeStage : scope;
      scope = Q.stage(scope);
      if(_.isNumber(selector)) {
        return scope.index[selector];
      } else {
        return new Q.StageSelector(scope,selector);
        // check if is array
        // check is has any commas
           // split into arrays
        // find each of the classes
        // find all the instances of a specific class
      }
    };

    Q.stage = function(num) {
      // Use activeStage is num is undefined
      num = (num === void 0) ? Q.activeStage : num;
      return Q.stages[num];
    };

    Q.stageScene = function(scene,num,options) {

      if(_.isString(scene)) {
        scene = Q.scene(scene);
      }

      // If the user skipped the num arg and went straight to options,
      // swap the two and grab a default for num
      if(_.isObject(num)) {
        options = num;
        num = _.dissoc(options,"stage") ||
              (scene && scene.opts.stage) || 0;
      }

      // Clone the options arg to prevent modification
      options = _.clone(options);

      // Grab the stage class, pulling from options, the scene default, or use
      // the default stage
      let StageClass = (_.dissoc(options,"stageClass")) ||
                       (scene && scene.opts.stageClass) || Q.Stage;

      // Figure out which stage to use
      num = _.isUndefined(num) ? ((scene && scene.opts.stage) || 0) : num;

      // Clean up an existing stage if necessary
      if(Q.stages[num])
        Q.stages[num].dispose();

      // Make this this the active stage and initialize the stage,
      // calling loadScene to popuplate the stage if we have a scene.
      Q.activeStage = num;
      let stage = Q.stages[num] = new StageClass(scene,options);

      // Load an assets object array
      if(stage.options.asset)
        stage.loadAssets(stage.options.asset);

      if(scene)
        stage.loadScene();

      Q.activeStage = 0;

      // If there's no loop active, run the default stageGameLoop
      if(!Q.loop)
        Q.gameLoop(Q.stageGameLoop);


      // Finally return the stage to the user for use if needed
      return stage;
    };

    Q.stageStepLoop = function(dt) {
      let stage;

      if(dt < 0) { dt = 1.0/60; }
      if(dt > 1/15) { dt  = 1.0/15; }

      for(let i =0,z=Q.stages.length;i<z;++i) {
        Q.activeStage = i;
        stage = Q.stage();
        if(stage)
          stage.step(dt);
      }

      Q.activeStage = 0;
    };

    Q.stageRenderLoop = function() {
      let stage;

      if(Q.ctx) { Q.clear(); }

      for(let i =0,z=Q.stages.length;i<z;++i) {
        Q.activeStage = i;
        stage = Q.stage();
        if(stage)
          stage.render(Q.ctx);
      }

      if(Q.input && Q.ctx)
        Q.input.drawCanvas(Q.ctx);

      Q.activeStage = 0;
    };

    Q.stageGameLoop = function(dt) {
      Q.stageStepLoop(dt);
      Q.stageRenderLoop();
    };

    Q.clearStage = function(num) {
      if(Q.stages[num]) {
        Q.stages[num].dispose();
        Q.stages[num] = null;
      }
    };

    Q.clearStages = function() {
      for(let i=0,z=Q.stages.length;i<z;++i) {
        if(Q.stages[i])
          Q.stages[i].dispose();
      }
      Q.stages.length = 0;
    };

  };


};

if(typeof Quintus === 'undefined') {
  module.exports = quintusScenes;
} else {
  quintusScenes(Quintus);
}


