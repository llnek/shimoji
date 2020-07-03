(function(global,undefined) {
  "use strict";
  let MojoH5 = global.MojoH5,
      document = global.document;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded.";

  /**
   * @public
   * @function
   */
  MojoH5["2d"] = function(Mojo) {

    let _ = Mojo.u,
        is = Mojo.is,
        EBus= Mojo.EventBus;

    //register a feature
    Mojo.feature("camera",{
      _sx: function() { return Mojo.width/2/this.scale; },
      _sy: function() { return Mojo.height/2/this.scale; },
      added: function() {
        EBus.sub([["prerender",this.entity,"prerender",this],
                  ["render",this.entity,"postrender",this]]);
        this.centerX = Mojo.width/2;
        this.centerY = Mojo.height/2;
        this.scale = 1;
        this.x = 0;
        this.y = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      },
      disposed: function() {
        EBus.unsub([["prerender",this.entity,"prerender",this],
                    ["render",this.entity,"postrender",this]]);
      },
      follow: function(sprite,directions,boundingBox) {
        EBus.unsub("poststep",this.entity,"_follow", this);
        this.directions = directions || {x: true, y: true};
        this.following = sprite;
        this.boundingBox = boundingBox;
        if(boundingBox===undefined &&
           this.entity.cache &&
           this.entity.cache.TileLayer !== undefined) {
          this.boundingBox = _.some(this.entity.cache.TileLayer, (itm) => {
            return itm.p.boundingBox ? {minX: 0,
                                        minY: 0,
                                        maxX: itm.p.w,
                                        maxY: itm.p.h } : null;
          });
        }
        EBus.sub("poststep",this.entity,"_follow",this);
        return this._follow(true);
      },
      unfollow: function() {
        EBus.unsub("poststep",this.entity,"_follow",this);
        return this;
      },
      _follow: function(first) {
        let fx = is.fun(this.directions.x)
                      ? this.directions.x(this.following) : this.directions.x;
        let fy = is.fun(this.directions.y)
                      ? this.directions.y(this.following) : this.directions.y;
        return this[first === true ? "centerOn" : "softCenterOn"](
                      fx ? this.following.p.x - this.offsetX : undefined,
                      fy ? this.following.p.y - this.offsetY : undefined);
      },
      offset: function(x,y) {
        this.offsetX = x;
        this.offsetY = y;
        return this;
      },
      softCenterOn: function(x,y) {
        if(x !== undefined) {
          let dx = (x - this._sx() - this.x)/3;
          if(this.boundingBox) {
            let mx= this.boundingBox.minX,
                wx= this.boundingBox.maxX - Mojo.width;
            if(this.x + dx < mx)
              this.x = mx/this.scale;
            else
            if(this.x + dx > wx/this.scale)
              this.x = _.max(wx, mx)/this.scale;
            else
              this.x += dx;
          } else {
            this.x += dx;
          }
        }
        if(y !== undefined) {
          let dy = (y - this._sy() - this.y)/3;
          if(this.boundingBox) {
            let my= this.boundingBox.minY,
                hy= this.boundingBox.maxY - Mojo.height;
            if(this.y + dy < my)
              this.y = my/this.scale;
            else
            if(this.y + dy > hy/this.scale)
              this.y = _.max(hy, my)/this.scale;
            else
              this.y += dy;
          } else {
            this.y += dy;
          }
        }
        return this;
      },
      centerOn: function(x,y) {
        if(x !== undefined)
          this.x = x - this._sx();
        if(y !== undefined)
          this.y = y - this._sy();
        return this;
      },
      moveTo: function(x,y) {
        if(x !== undefined) this.x = x;
        if(y !== undefined) this.y = y;
        return this;
      },
      prerender: function() {
        this.centerX = this.x + this._sx();
        this.centerY = this.y + this._sy();
        Mojo.ctx.save();
        Mojo.ctx.translate(_.floor(Mojo.width/2),_.floor(Mojo.height/2));
        Mojo.ctx.scale(this.scale,this.scale);
        Mojo.ctx.translate(-_.floor(this.centerX), -_.floor(this.centerY));
        return this;
      },
      postrender: function() {
        Mojo.ctx.restore();
        return this;
      }
    });

    /**
     * @public
     * @class
     */
    Mojo.deftype(["TileLayer",Mojo.Sprite], {
      init: function(props) {
        this._super(props,{tileW: 32,
                           tileH: 32,
                           blockTileW: 10,
                           blockTileH: 10,
                           renderAlways: true,
                           type: Mojo.E_DEFAULT});

        this.p.dataAsset &&
          this.load(this.p.dataAsset);

        this.setDimensions();

        this.directions = ["top","left","right","bottom"];
        this.p.blockW = this.p.tileW * this.p.blockTileW;
        this.p.blockH = this.p.tileH * this.p.blockTileH;

        this.contactNormal = { separate: [] };
        this.tileProperties = {};
        this.colBounds = {};
        this.blocks = [];

        this.contactObj = {p: {w: this.p.tileW,
                               h: this.p.tileH,
                               cx: this.p.tileW/2,
                               cy: this.p.tileH/2}};

        this.tileContactObjs = {};
        this._genContactObjs();
      },
      _genContactObjs: function() {
        let props= this.sheet() &&
                   this.sheet().frameInfo,
            cobj,
            self=this,
            rescale= (pt) => {
              return [pt[0] * self.p.tileW - self.p.tileW/2,
                      pt[1] * self.p.tileH - self.p.tileH/2 ];
            };
        if(props)
          for(let k in props)
            if(_.has(props,k)) {
              cobj=
              this.tileContactObjs[k] = {p: _.clone(this.contactObj.p)};
              _.inject(cobj.p, props[k]);
              if(cobj.p.points)
                cobj.p.points= _.map(cobj.p.points, rescale);
              this.tileContactObjs[k] = cobj;
            }
      },
      load: function(dataAsset) {
        if(is.str(dataAsset)) {
          if(_.fileExt(dataAsset) === "json")
            dataAsset = Mojo.asset(dataAsset);
          else
            throw "file type not supported";
        }
        this.p.tiles = dataAsset;
      },
      setDimensions: function() {
        let tiles = this.p.tiles;
        if(tiles) {
          this.p.rows = tiles.length;
          this.p.cols = tiles[0].length;
          this.p.w = this.p.cols * this.p.tileW;
          this.p.h = this.p.rows * this.p.tileH;
        }
      },
      getTile: function(tileX,tileY) {
        return this.p.tiles[tileY] && this.p.tiles[tileY][tileX];
      },
      getTileProperty: function(tile, prop) {
        if(tile &&
           this.tileProperties[tile])
          return this.tileProperties[tile][prop];
      },
      getTileProperties: function(tile) {
        return (tile && this.tileProperties[tile]) ? this.tileProperties[tile] : {};
      },
      getTilePropertyAt: function(tileX, tileY, prop) {
        return this.getTileProperty(this.getTile(tileX, tileY), prop);
      },
      getTilePropertiesAt: function(tileX, tileY) {
        return this.getTileProperties(this.getTile(tileX, tileY));
      },
      tileHasProperty: function(tile, prop) {
        return !!this.getTileProperty(tile, prop);
      },
      setTile: function(x,y,tile) {
        let p = this.p,
            blockX = _.floor(x/p.blockTileW),
            blockY = _.floor(y/p.blockTileH);
        if(x >= 0 && x < this.p.cols &&
           y >= 0 && y < this.p.rows) {
          this.p.tiles[y][x] = tile;
          if(this.blocks[blockY])
            this.blocks[blockY][blockX] = null;
        }
      },
      tilePresent: function(tileX,tileY) {
        return this.p.tiles[tileY] &&
               this.collidableTile(this.p.tiles[tileY][tileX]);
      },
      // Overload this method to draw tiles at frame 0 or not draw
      // tiles at higher number frames
      drawableTile: (tileNum) => { return tileNum > 0; },
      // Overload this method to control which tiles cause a collision
      // (defaults to all tiles > number 0)
      collidableTile: (tileNum) => { return tileNum > 0; },
      getContactObj: function(tileX, tileY) {
        let p = this.p,
            colObj,
            tile = this.getTile(tileX, tileY);

        colObj = (tile && this.tileContactObjs[tile])
                 ? this.tileContactObjs[tile] : this.contactObj;

        colObj.p.x = tileX * p.tileW + p.x + p.tileW/2;
        colObj.p.y = tileY * p.tileH + p.y + p.tileH/2;

        return colObj;
      },
      collide: function(obj) {
        let col, colObj,
            p = this.p,
            objP = obj.c || obj.p,
            normal = this.contactNormal,
            tileStartX = _.floor((objP.x - objP.cx - p.x) / p.tileW),
            tileStartY = _.floor((objP.y - objP.cy - p.y) / p.tileH),
            tileEndX =  _.ceil((objP.x - objP.cx + objP.w - p.x) / p.tileW),
            tileEndY =  _.ceil((objP.y - objP.cy + objP.h - p.y) / p.tileH);

        normal.collided = false;

        for(let tileY = tileStartY; tileY<=tileEndY; ++tileY) {
          for(let tileX = tileStartX; tileX<=tileEndX; ++tileX) {
            if(this.tilePresent(tileX,tileY)) {
              colObj = this.getContactObj(tileX, tileY);
              col = Mojo.collision(obj,colObj);
              if(col && col.magnitude > 0) {
                if(colObj.p.sensor) {
                  colObj.tile = this.getTile(tileX,tileY);
                  EBus.pub("sensor.tile", obj, colObj);
                } else if(!normal.collided ||
                          normal.magnitude < col.magnitude) {
                  normal.collided = true;
                  normal.separate[0] = col.separate[0];
                  normal.separate[1] = col.separate[1];
                  normal.magnitude = col.magnitude;
                  normal.distance = col.distance;
                  normal.normalX = col.normalX;
                  normal.normalY = col.normalY;
                  normal.tileX = tileX;
                  normal.tileY = tileY;
                  normal.tile = this.getTile(tileX,tileY);
                  if(obj.p.collisions)
                    _.conj(obj.p.collisions,normal);
                }
              }
            }
          }
        }
        return normal.collided ? normal : false;
      },
      prerenderBlock: function(blockX,blockY) {
        let p = this.p,
            tiles = p.tiles,
            sheet = this.sheet(),
            blockOffsetX = blockX*p.blockTileW,
            blockOffsetY = blockY*p.blockTileH;

        if(blockOffsetX < 0 ||
           blockOffsetX >= this.p.cols ||
           blockOffsetY < 0 ||
           blockOffsetY >= this.p.rows) { return; }

        let canvas = Mojo.domCtor("canvas"),
            ctx = canvas.getContext("2d");
        canvas.width = p.blockW;
        canvas.height= p.blockH;
        this.blocks[blockY] = this.blocks[blockY] || {};
        this.blocks[blockY][blockX] = canvas;
        for(let y=0;y<p.blockTileH;++y)
          if(tiles[y+blockOffsetY])
            for(let x=0;x<p.blockTileW;++x)
              if(this.drawableTile(tiles[y+blockOffsetY][x+blockOffsetX]))
                sheet.draw(ctx,
                           x*p.tileW,
                           y*p.tileH,
                           tiles[y+blockOffsetY][x+blockOffsetX]);
      },
      drawBlock: function(ctx, blockX, blockY) {
        let p = this.p,
            startX = _.floor(blockX * p.blockW + p.x),
            startY = _.floor(blockY * p.blockH + p.y);

        if(!this.blocks[blockY] ||
           !this.blocks[blockY][blockX])
          this.prerenderBlock(blockX,blockY);

        if(this.blocks[blockY] &&
           this.blocks[blockY][blockX])
          ctx.drawImage(this.blocks[blockY][blockX],startX,startY);
      },
      draw: function(ctx) {
        let p = this.p,
            port = this.scene.camera,
            scale = port ? port.scale : 1,
            x = port ? port.x : 0,
            y = port ? port.y : 0,
            viewW = Mojo.width/scale,
            viewH = Mojo.height/scale,
            startBlockX = _.floor((x - p.x) / p.blockW),
            startBlockY = _.floor((y - p.y) / p.blockH),
            endBlockX = _.floor((x + viewW - p.x) / p.blockW),
            endBlockY = _.floor((y + viewH - p.y) / p.blockH);

        for(let iy=startBlockY;iy<=endBlockY;++iy)
          for(let ix=startBlockX;ix<=endBlockX;++ix) this.drawBlock(ctx,ix,iy);
      }
    }, Mojo);

    Mojo.gravityY = 9.8*100;
    Mojo.gravityX = 0;

    /**
     * @object
     */
    Mojo.feature("2d",{
      added: function() {
        let ent= this.entity;
        _.patch(ent.p,{
          vx: 0,
          vy: 0,
          ax: 0,
          ay: 0,
          gravity: 1,
          collisionMask: Mojo.E_DEFAULT
        });
        EBus.sub([["step",ent,"step",this],
                  ["hit",ent,'collision',this]]);
      },
      disposed: function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["hit",this.entity,'collision',this]]);
      },
      collision: function(col,last) {
        let magnitude = 0,
            p = this.entity.p;

        if(col.obj.p && col.obj.p.sensor) {
          EBus.pub("sensor", col.obj, this.entity);
          return;
        }

        col.impact = 0;
        let impactX = _.abs(p.vx),
            impactY = _.abs(p.vy);

        p.x -= col.separate[0];
        p.y -= col.separate[1];

        // Top collision
        if(col.normalY < -0.3) {
          if(!p.skipCollide && p.vy > 0) { p.vy = 0; }
          col.impact = impactY;
          EBus.pub([["bump.bottom", this.entity,col],
                    ["bump", this.entity,col]]);
        }
        if(col.normalY > 0.3) {
          if(!p.skipCollide && p.vy < 0) { p.vy = 0; }
          col.impact = impactY;
          EBus.pub([["bump.top",this.entity,col],
                    ["bump",this.entity,col]]);
        }
        if(col.normalX < -0.3) {
          if(!p.skipCollide && p.vx > 0) { p.vx = 0;  }
          col.impact = impactX;
          EBus.pub([["bump.right",this.entity,col],
                    ["bump",this.entity,col]]);
        }
        if(col.normalX > 0.3) {
          if(!p.skipCollide && p.vx < 0) { p.vx = 0; }
          col.impact = impactX;
          EBus.pub([["bump.left",this.entity,col],
                    ["bump",this.entity,col]]);
        }
      },
      step: function(dt) {
        let dtStep = dt,
            p = this.entity.p;
        // TODO: check the entity's magnitude of vx and vy,
        // reduce the max dtStep if necessary to prevent
        // skipping through objects.
        while(dtStep > 0) {
          dt = _.min(1/30,dtStep);
          // Updated based on the velocity and acceleration
          p.vx += p.ax * dt + (p.gravityX === undefined ? Mojo.gravityX : p.gravityX) * dt * p.gravity;
          p.vy += p.ay * dt + (p.gravityY === undefined ? Mojo.gravityY : p.gravityY) * dt * p.gravity;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          this.entity.scene.collide(this.entity);
          dtStep -= dt;
        }
      }
    });

    //register feature
    Mojo.feature("aiBounce", {
      added: function() {
        EBus.sub([["bump.right",this.entity,"goLeft",this],
                  ["bump.left",this.entity,"goRight",this]]);
      },
      disposed:function() {
        EBus.unsub([["bump.right",this.entity,"goLeft",this],
                    ["bump.left",this.entity,"goRight",this]]);
      },
      goLeft: function(col) {
        this.entity.p.vx = -col.impact;
        if(this.entity.p.defaultDirection === "right")
          this.entity.p.flip = "x";
        else
          this.entity.p.flip = false;
      },
      goRight: function(col) {
        this.entity.p.vx = col.impact;
        if(this.entity.p.defaultDirection === "left")
          this.entity.p.flip = "x";
        else
          this.entity.p.flip = false;
      }
    });

    let _pctrl_defaults= {speed: 200, jumpSpeed: -300, collisions: []};
    //register feature
    Mojo.feature("platformerControls", {
      added: function() {
        let p = this.entity.p;
        _.patch(p,_pctrl_defaults);

        EBus.sub([["step",this.entity,"step",this],
                  ["bump.bottom",this.entity,"landed",this]]);

        p.landed = 0;
        p.direction ="right";
      },
      disposed:function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["bump.bottom",this.entity,"landed",this]]);
      },
      landed: function(col) {
        this.entity.p.landed= 1/5;
      },
      step: function(dt) {
        let p = this.entity.p;

        if(p.ignoreControls===undefined || !p.ignoreControls) {
          let collision = null;
          // Follow along the current slope, if possible.
          if(p.collisions !== undefined &&
             p.collisions.length > 0 &&
             (_.get(Mojo.inputs,"left") ||
              _.get(Mojo.inputs,"right") || p.landed > 0)) {
            if(p.collisions.length === 1) {
              collision = p.collisions[0];
            } else {
              // If there's more than one possible slope, follow slope with negative Y normal
              collision = null;
              for(let i = 0; i < p.collisions.length; ++i) {
                if(p.collisions[i].normalY < 0)
                collision = p.collisions[i];
              }
            }
            // Don't climb up walls.
            if(collision !== null &&
               collision.normalY > -0.3 &&
               collision.normalY < 0.3) {
              collision = null;
            }
          }

          if(_.get(Mojo.inputs,"left")) {
            p.direction = "left";
            if(collision && p.landed > 0) {
              p.vx = p.speed * collision.normalY;
              p.vy = -p.speed * collision.normalX;
            } else {
              p.vx = -p.speed;
            }
          } else if(_.get(Mojo.inputs,"right")) {
            p.direction = "right";
            if(collision && p.landed > 0) {
              p.vx = -p.speed * collision.normalY;
              p.vy = p.speed * collision.normalX;
            } else {
              p.vx = p.speed;
            }
          } else {
            p.vx = 0;
            if(collision && p.landed > 0)
            p.vy = 0;
          }

          if(p.landed > 0 &&
             (_.get(Mojo.inputs,"up") ||
              _.get(Mojo.inputs,"action")) && !p.jumping) {
            p.vy = p.jumpSpeed;
            p.landed = -dt;
            p.jumping = true;
          } else if(_.get(Mojo.inputs,"up") ||
                    _.get(Mojo.inputs,"action")) {
            EBus.pub("jump", this.entity,this.entity);
            p.jumping = true;
          }

          if(p.jumping && !(_.get(Mojo.inputs,"up") ||
                            _.get(Mojo.inputs,"action"))) {
            p.jumping = false;
            EBus.pub("jumped", this.entity,this.entity);
            if(p.vy < p.jumpSpeed/3) {
              p.vy = p.jumpSpeed/3;
            }
          }
        }
        p.landed -= dt;
      }
    });

    //register feature
    Mojo.feature("stepControls", {
      added: function() {
        let p = this.entity.p;
        if(!p.stepDistance) p.stepDistance = 32;
        if(!p.stepDelay) p.stepDelay = 0.2;
        p.stepWait = 0;
        EBus.sub([["step",this.entity,"step",this],
                  ["hit", this.entity,"collision",this]]);
      },
      disposed:function() {
        EBus.unsub([["step",this.entity,"step",this],
                    ["hit", this.entity,"collision",this]]);
      },
      collision: function(col) {
        let p = this.entity.p;
        if(p.stepping) {
          p.stepping = false;
          p.x = p.origX;
          p.y = p.origY;
        }
      },
      step: function(dt) {
        let p = this.entity.p,
            moved = false;
        p.stepWait -= dt;

        if(p.stepping) {
          p.x += p.diffX * dt / p.stepDelay;
          p.y += p.diffY * dt / p.stepDelay;
        }

        if(p.stepWait > 0) { return; }

        if(p.stepping) {
          p.x = p.destX;
          p.y = p.destY;
        }

        p.stepping = false;
        p.diffX = 0;
        p.diffY = 0;

        if(_.get(Mojo.inputs,"left")) {
          p.diffX = -p.stepDistance;
        } else if(_.get(Mojo.inputs,"right")) {
          p.diffX = p.stepDistance;
        }

        if(_.get(Mojo.inputs,"up")) {
          p.diffY = -p.stepDistance;
        } else if(_.get(Mojo.inputs,"down")) {
          p.diffY = p.stepDistance;
        }

        if(p.diffY || p.diffX ) {
          p.stepping = true;
          p.origX = p.x;
          p.origY = p.y;
          p.destX = p.x + p.diffX;
          p.destY = p.y + p.diffY;
          p.stepWait = p.stepDelay;
        }
      }
    });

    /**
     * @public
     * @function
     */
    Mojo.overlap = (o1,o2) => {
      let c1 = o1.c || o1.p || o1;
      let c2 = o2.c || o2.p || o2;

      let o1x = c1.x - (c1.cx || 0),
          o1y = c1.y - (c1.cy || 0);
      let o2x = c2.x - (c2.cx || 0),
          o2y = c2.y - (c2.cy || 0);

      return !((o1y+c1.h<o2y) || (o1y>o2y+c2.h) ||
               (o1x+c1.w<o2x) || (o1x>o2x+c2.w));
    };

    /**
     * @public
     * @function
     */
    Mojo.collision = (function() {
      let normalX,
          normalY,
          offset = [0,0],
          result1 = { separate: [] },
          result2 = { separate: [] };
      let calculateNormal= (points,idx) => {
        let pt1 = points[idx],
            pt2 = points[idx+1] || points[0];
        normalX = -(pt2[1] - pt1[1]);
        normalY = pt2[0] - pt1[0];
        let dist = _.sqrt(normalX*normalX + normalY*normalY);
        if(dist > 0) {
          normalX /= dist;
          normalY /= dist;
        }
      };
      let dotProductAgainstNormal = (point) => {
        return (normalX * point[0]) + (normalY * point[1]);
      };
      let collide = (o1,o2,flip) => {
        let min1,max1,
            min2,max2,
            d1, d2,
            offsetLength,
            tmp, i, j,
            minDist, minDistAbs,
            p1, p2,
            collided = false,
            shortestDist = _.POS_INF,
            result = flip ? result2 : result1;
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
            if(tmp < min1) min1 = tmp;
            if(tmp > max1) max1 = tmp;
          }
          min2 = dotProductAgainstNormal(p2[0]);
          max2 = min2;
          for(let j = 1;j<p2.length;++j) {
            tmp = dotProductAgainstNormal(p2[j]);
            if(tmp < min2) min2 = tmp;
            if(tmp > max2) max2 = tmp;
          }
          offsetLength = dotProductAgainstNormal(offset);
          min1 += offsetLength;
          max1 += offsetLength;
          d1 = min1 - max2;
          d2 = min2 - max1;
          if(d1 > 0 || d2 > 0) { return null; }
          minDist = (max2 - min1) * -1;
          if(flip) { minDist *= -1; }
          minDistAbs = _.abs(minDist);
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
        return collided ? result : null;
      };
      //satCollision
      return (o1,o2) => {
        let result1, result2, result;
        if(!o1.p.points)
          Mojo.genPts(o1);
        if(!o2.p.points)
          Mojo.genPts(o2);
        result1 = collide(o1,o2);
        if(!result1) { return false; }
        result2 = collide(o2,o1,true);
        if(!result2) { return false; }
        result = (result2.magnitude < result1.magnitude) ? result2 : result1;
        if(result.magnitude === 0) { return false; }
        result.separate[0] = result.distance * result.normalX;
        result.separate[1] = result.distance * result.normalY;
        return result;
      };
    })();

    return Mojo;
  };




})(this);


