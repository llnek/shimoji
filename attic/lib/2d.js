(function(global,undefined) {

  "use strict";
  let MojoH5 = global.MojoH5,
      document = global.document;

  MojoH5["2D"] = function(Mojo) {
    let _ = Mojo.u,
        is = Mojo.is;
    Mojo.feature("viewport",{
      added: function() {
        Mojo.EventBus.sub("prerender",this.entity,"prerender",this);
        Mojo.EventBus.sub("render",this.entity,"postrender",this);
        this.centerX = Mojo.width/2;
        this.centerY = Mojo.height/2;
        this.x = 0;
        this.y = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
      },
      follow: function(sprite,directions,boundingBox) {
        Mojo.EventBus.unsub("poststep",this.entity,"_follow", this);
        this.directions = directions || { x: true, y: true };
        this.following = sprite;
        if(is.undef(boundingBox) &&
           this.entity.cache.TileLayer !== void 0) {
          this.boundingBox = _.some(this.entity.cache.TileLayer, function(layer) {
            return layer.p.boundingBox ? { minX: 0, maxX: layer.p.w, minY: 0, maxY: layer.p.h } : null;
          });
        } else {
          this.boundingBox = boundingBox;
        }
        Mojo.EventBus.sub("poststep",this.entity,"_follow",this);
        this._follow(true);
      },
      unfollow: function() {
        Mojo.EventBus.unsub("poststep",this.entity,"_follow",this);
      },
      _follow: function(first) {
        let fx = is.fun(this.directions.x)
                      ? this.directions.x(this.following) : this.directions.x;
        let fy = is.fun(this.directions.y)
                      ? this.directions.y(this.following) : this.directions.y;

        this[first === true ? "centerOn" : "softCenterOn"](
                      fx ? this.following.p.x - this.offsetX : undefined,
                      fy ? this.following.p.y - this.offsetY : undefined);
      },
      offset: function(x,y) {
        this.offsetX = x;
        this.offsetY = y;
      },
      softCenterOn: function(x,y) {
        if(x !== void 0) {
          let dx = (x - Mojo.width / 2 / this.scale - this.x)/3;
          if(this.boundingBox) {
            if(this.x + dx < this.boundingBox.minX) {
              this.x = this.boundingBox.minX / this.scale;
            }
            else if(this.x + dx > (this.boundingBox.maxX - Mojo.width) / this.scale) {
              this.x = Math.max(this.boundingBox.maxX - Mojo.width, this.boundingBox.minX) / this.scale;
            }
            else {
              this.x += dx;
            }
          }
          else {
            this.x += dx;
          }
        }
        if(y !== void 0) {
          let dy = (y - Mojo.height / 2 / this.scale - this.y)/3;
          if(this.boundingBox) {
            if(this.y + dy < this.boundingBox.minY) {
              this.y = this.boundingBox.minY / this.scale;
            }
            else if(this.y + dy > (this.boundingBox.maxY - Mojo.height) / this.scale) {
              this.y = Math.max(this.boundingBox.maxY - Mojo.height, this.boundingBox.minY) / this.scale;
            }
            else {
              this.y += dy;
            }
          }
          else {
            this.y += dy;
          }
        }
      },
      centerOn: function(x,y) {
        if(x !== void 0) {
          this.x = x - Mojo.width / 2 / this.scale;
        }
        if(y !== void 0) {
          this.y = y - Mojo.height / 2 / this.scale;
        }
      },
      moveTo: function(x,y) {
        if(x !== void 0) {
          this.x = x;
        }
        if(y !== void 0) {
          this.y = y;
        }
        return this.entity;
      },
      prerender: function() {
        this.centerX = this.x + Mojo.width / 2 /this.scale;
        this.centerY = this.y + Mojo.height / 2 /this.scale;
        Mojo.ctx.save();
        Mojo.ctx.translate(Math.floor(Mojo.width/2),Math.floor(Mojo.height/2));
        Mojo.ctx.scale(this.scale,this.scale);
        Mojo.ctx.translate(-Math.floor(this.centerX), -Math.floor(this.centerY));
      },
      postrender: function() {
        Mojo.ctx.restore();
      }
    });

    Mojo.defType(["TileLayer",Mojo.Sprite], {
      init: function(props) {
        this._super(props,{
          tileW: 32,
          tileH: 32,
          blockTileW: 10,
          blockTileH: 10,
          type: 1,
          renderAlways: true
        });

        this.p.dataAsset &&
          this.load(this.p.dataAsset);

        this.setDimensions();

        this.directions = ["top","left","right","bottom"];
        this.p.blockW = this.p.tileW * this.p.blockTileW;
        this.p.blockH = this.p.tileH * this.p.blockTileH;

        this.contactNormal = { separate: []};
        this.tileProperties = {};
        this.colBounds = {};
        this.blocks = [];

        this.contactObj = { p: {
            w: this.p.tileW,
            h: this.p.tileH,
            cx: this.p.tileW/2,
            cy: this.p.tileH/2
          }
        };

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
              this.tileContactObjs[k] =
              { p: _.clone(this.contactObj.p) };
              _.inject(cobj.p, props[k]);
              if(cobj.p.points)
                cobj.p.points= _.map(cobj.p.points, rescale);
              this.tileContactObjs[k] = cobj;
            }
      },
      load: function(dataAsset) {
        /*
        let data, ext= _.fileExt(dataAsset);
        if (ext === "json")
          data = is.str(dataAsset) ?  Mojo.asset(dataAsset) : dataAsset;
        else
          throw "file type not supported";
          */
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
        return (this.tileProperties[tile] !== void 0) ? this.tileProperties[tile][prop] : void 0;
      },

      getTileProperties: function(tile) {
        return (this.tileProperties[tile] !== void 0) ? this.tileProperties[tile] : {};
      },

      getTilePropertyAt: function(tileX, tileY, prop) {
        return this.getTileProperty(this.getTile(tileX, tileY), prop);
      },

      getTilePropertiesAt: function(tileX, tileY) {
        return this.getTileProperties(this.getTile(tileX, tileY));
      },

      tileHasProperty: function(tile, prop) {
        return this.getTileProperty(tile, prop) !== void 0;
      },

      setTile: function(x,y,tile) {
        let p = this.p,
            blockX = Math.floor(x/p.blockTileW),
            blockY = Math.floor(y/p.blockTileH);

        if(x >= 0 && x < this.p.cols &&
           y >= 0 && y < this.p.rows) {

          this.p.tiles[y][x] = tile;

          if(this.blocks[blockY]) {
            this.blocks[blockY][blockX] = null;
          }
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

        colObj = (this.tileContactObjs[tile] !== void 0) ?
          this.tileContactObjs[tile] : this.contactObj;

        colObj.p.x = tileX * p.tileW + p.x + p.tileW/2;
        colObj.p.y = tileY * p.tileH + p.y + p.tileH/2;

        return colObj;
      },

      collide: function(obj) {
        let p = this.p,
            objP = obj.c || obj.p,
            tileStartX = Math.floor((objP.x - objP.cx - p.x) / p.tileW),
            tileStartY = Math.floor((objP.y - objP.cy - p.y) / p.tileH),
            tileEndX =  Math.ceil((objP.x - objP.cx + objP.w - p.x) / p.tileW),
            tileEndY =  Math.ceil((objP.y - objP.cy + objP.h - p.y) / p.tileH),
            normal = this.contactNormal,
            col, colObj;

        normal.collided = false;

        for(let tileY = tileStartY; tileY<=tileEndY; ++tileY) {
          for(let tileX = tileStartX; tileX<=tileEndX; ++tileX) {
            if(this.tilePresent(tileX,tileY)) {
              colObj = this.getContactObj(tileX, tileY);
              col = Mojo.collision(obj,colObj);
              if(col && col.magnitude > 0) {
                if(colObj.p.sensor) {
                  colObj.tile = this.getTile(tileX,tileY);
                  Mojo.EventBus.pub('sensor.tile', obj, colObj);
                } else if(!normal.collided ||
                          normal.magnitude < col.magnitude ) {
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
                   if(obj.p.collisions !== void 0) obj.p.collisions.push(normal);
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

        let canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
        canvas.width = p.blockW;
        canvas.height= p.blockH;
        this.blocks[blockY] = this.blocks[blockY] || {};
        this.blocks[blockY][blockX] = canvas;

        for(let y=0;y<p.blockTileH;++y) {
          if(tiles[y+blockOffsetY]) {
            for(let x=0;x<p.blockTileW;++x) {
              if(this.drawableTile(tiles[y+blockOffsetY][x+blockOffsetX])) {
                sheet.draw(ctx,
                           x*p.tileW,
                           y*p.tileH,
                           tiles[y+blockOffsetY][x+blockOffsetX]);
              }
            }
          }
        }
      },

      drawBlock: function(ctx, blockX, blockY) {
        let p = this.p,
            startX = Math.floor(blockX * p.blockW + p.x),
            startY = Math.floor(blockY * p.blockH + p.y);

        if(!this.blocks[blockY] ||
           !this.blocks[blockY][blockX]) {
          this.prerenderBlock(blockX,blockY);
        }

        if(this.blocks[blockY] &&
           this.blocks[blockY][blockX]) {
          ctx.drawImage(this.blocks[blockY][blockX],startX,startY);
        }
      },

      draw: function(ctx) {
        let p = this.p,
            viewport = this.layer.viewport,
            scale = viewport ? viewport.scale : 1,
            x = viewport ? viewport.x : 0,
            y = viewport ? viewport.y : 0,
            viewW = Mojo.width / scale,
            viewH = Mojo.height / scale,
            startBlockX = Math.floor((x - p.x) / p.blockW),
            startBlockY = Math.floor((y - p.y) / p.blockH),
            endBlockX = Math.floor((x + viewW - p.x) / p.blockW),
            endBlockY = Math.floor((y + viewH - p.y) / p.blockH);

        for(let iy=startBlockY;iy<=endBlockY;++iy) {
          for(var ix=startBlockX;ix<=endBlockX;++ix) {
            this.drawBlock(ctx,ix,iy);
          }
        }
      }
    });

    Mojo.gravityY = 9.8*100;
    Mojo.gravityX = 0;

    Mojo.feature("2d",{
      added: function() {
        let entity = this.entity;
        _.patch(entity.p,{
          vx: 0,
          vy: 0,
          ax: 0,
          ay: 0,
          gravity: 1,
          collisionMask: Mojo.SPRITE_DEFAULT
        });
        Mojo.EventBus.sub('step',entity,"step",this);
        Mojo.EventBus.sub('hit',entity,'collision',this);
      },
      collision: function(col,last) {
        let entity = this.entity,
            p = entity.p,
            magnitude = 0;

        if(col.obj.p && col.obj.p.sensor) {
          Mojo.EventBus.pub("sensor", col.obj, entity);
          return;
        }

        col.impact = 0;
        let impactX = Math.abs(p.vx);
        let impactY = Math.abs(p.vy);

        p.x -= col.separate[0];
        p.y -= col.separate[1];

        // Top collision
        if(col.normalY < -0.3) {
          if(!p.skipCollide && p.vy > 0) { p.vy = 0; }
          col.impact = impactY;
          Mojo.EventBus.pub("bump.bottom", entity,col);
          Mojo.EventBus.pub("bump", entity,col);
        }
        if(col.normalY > 0.3) {
          if(!p.skipCollide && p.vy < 0) { p.vy = 0; }
          col.impact = impactY;
          Mojo.EventBus.pub("bump.top",entity,col);
          Mojo.EventBus.pub("bump",entity,col);
        }
        if(col.normalX < -0.3) {
          if(!p.skipCollide && p.vx > 0) { p.vx = 0;  }
          col.impact = impactX;
          Mojo.EventBus.pub("bump.right",entity,col);
          Mojo.EventBus.pub("bump",entity,col);
        }
        if(col.normalX > 0.3) {
          if(!p.skipCollide && p.vx < 0) { p.vx = 0; }
          col.impact = impactX;
          Mojo.EventBus.pub("bump.left",entity,col);
          Mojo.EventBus.pub("bump",entity,col);
        }
      },

      step: function(dt) {
        let p = this.entity.p,
            dtStep = dt;
        // TODO: check the entity's magnitude of vx and vy,
        // reduce the max dtStep if necessary to prevent
        // skipping through objects.
        while(dtStep > 0) {
          dt = Math.min(1/30,dtStep);
          // Updated based on the velocity and acceleration
          p.vx += p.ax * dt + (p.gravityX === void 0 ? Mojo.gravityX : p.gravityX) * dt * p.gravity;
          p.vy += p.ay * dt + (p.gravityY === void 0 ? Mojo.gravityY : p.gravityY) * dt * p.gravity;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          this.entity.layer.collide(this.entity);
          dtStep -= dt;
        }
      }
    });

    Mojo.feature("aiBounce", {
      added: function() {
        Mojo.EventBus.sub("bump.right",this.entity,"goLeft",this);
        Mojo.EventBus.sub("bump.left",this.entity,"goRight",this);
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

    Mojo.collision = (function() {
      let normalX,
          normalY,
          offset = [0,0],
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
        return collided ? result : null;
      }
      function satCollision(o1,o2) {
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
      }
      return satCollision;
    })();


    return Mojo;
  };




})(this);


