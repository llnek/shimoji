(function(global){
  "use strict";
  let Mojo = global.Mojo, _ = Mojo._;

  Mojo.Sprites = function(Mo) {

    Mo.defType("SpriteSheet",{
      init: function(name, asset,options) {
        let S= Mo.asset(asset);
        if (!S)
          throw "Invalid Asset:" + asset;
        _.inject(this,{
          name: name,
          asset: asset,
          w: S.width,
          h: S.height,
          tileW: 64,
          tileH: 64,
          sx: 0,
          sy: 0,
          spacingX: 0,
          spacingY: 0,
          frameProperties: {}
          }, options);
        this.cols = this.cols ||
                    Math.floor((this.w + this.spacingX) / (this.tileW + this.spacingX));
        this.frames = this.cols * (Math.floor(this.h/(this.tileH + this.spacingY)));
      },
      fx: function(frame) {
        return Math.floor((frame % this.cols) * (this.tileW + this.spacingX) + this.sx);
      },
      fy: function(frame) {
        return Math.floor(Math.floor(frame / this.cols) * (this.tileH + this.spacingY) + this.sy);
      },
      draw: function(ctx, x, y, frame) {
        if(!ctx) ctx = Mo.ctx;
        ctx.drawImage(Mo.asset(this.asset),
                      this.fx(frame),
                      this.fy(frame),
                      this.tileW,
                      this.tileH,
                      Math.floor(x),
                      Math.floor(y),
                      this.tileW,
                      this.tileH);
      }
    });

    Mo.sheets = {};
    Mo.sheet = function(name,asset,options) {
      if(asset) {
        Mo.sheets[name] = new Mo.SpriteSheet(name,asset,options);
      } else {
        return Mo.sheets[name];
      }
    };

    Mo.compileSheets = function(imageAsset,spriteDataAsset) {
      var data = Mo.asset(spriteDataAsset);
      _.doseq(data,(spriteData,name) => {
        Mo.sheet(name,imageAsset,spriteData);
      });
    };

    Mo.SPRITE_NONE     = 0;
    Mo.SPRITE_DEFAULT  = 1;
    Mo.SPRITE_PARTICLE = 2;
    Mo.SPRITE_ACTIVE   = 4;
    Mo.SPRITE_FRIENDLY = 8;
    Mo.SPRITE_ENEMY    = 16;
    Mo.SPRITE_POWERUP  = 32;
    Mo.SPRITE_UI       = 64;
    Mo.SPRITE_ALL   = 0xFFFF;

    Mo._generatePoints = function(obj,force) {
      if(obj.p.points && !force)
      return;
      let p = obj.p,
          halfW = p.w/2,
          halfH = p.h/2;
      p.points = [[ -halfW, -halfH ],
                  [  halfW, -halfH ],
                  [  halfW,  halfH ],
                  [ -halfW,  halfH ]];
    };

    Mo._nullContainer = {
      c: {
        x: 0,
        y: 0,
        angle: 0,
        scale: 1
      },
      matrix: Mo.matrix2d()
    };

    Mo._generateCollisionPoints = function(obj) {

      if(!obj.matrix &&
         !obj.refreshMatrix)
      return;

      if(!obj.c)
        obj.c = { points: [] };

      let p = obj.p,
          c = obj.c;

      if(!p.moved &&
         c.origX === p.x &&
         c.origY === p.y &&
         c.origScale === p.scale &&
         c.origAngle === p.angle)
      return;

      c.origX = p.x;
      c.origY = p.y;
      c.origScale = p.scale;
      c.origAngle = p.angle;

      obj.refreshMatrix();

      if(!obj.container &&
         (!p.scale || p.scale === 1) && p.angle === 0) {
        for(let i=0;i<obj.p.points.length;++i) {
          obj.c.points[i] = obj.c.points[i] || [];
          obj.c.points[i][0] = p.x + obj.p.points[i][0];
          obj.c.points[i][1] = p.y + obj.p.points[i][1];
        }
        c.x = p.x; c.y = p.y;
        c.cx = p.cx; c.cy = p.cy;
        c.w = p.w; c.h = p.h;
      } else {
        let container = obj.container || Mo._nullContainer;
        c.x = container.matrix.transformX(p.x,p.y);
        c.y = container.matrix.transformY(p.x,p.y);
        c.angle = p.angle + container.c.angle;
        c.scale = (container.c.scale || 1) * (p.scale || 1);

        let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

        for(let i=0;i<obj.p.points.length;++i) {
          if(!obj.c.points[i]) {
            obj.c.points[i] = [];
          }
          obj.matrix.transformArr(obj.p.points[i],obj.c.points[i]);
          let x = obj.c.points[i][0],
          y = obj.c.points[i][1];

          if(x < minX) { minX = x; }
          if(x > maxX) { maxX = x; }
          if(y < minY) { minY = y; }
          if(y > maxY) { maxY = y; }
        }

        if(minX === maxX) { maxX+=1; }
        if(minY === maxY) { maxY+=1; }

        c.cx = c.x - minX;
        c.cy = c.y - minY;

        c.w = maxX - minX;
        c.h = maxY - minY;
      }

      p.moved = false;

      obj.children &&
        (obj.children.length > 0) &&
          _.invoke(obj.children,"moved");
    };

    Mo.defType(["Sprite",Mo.Entity], {
      init: function(props,defProps) {
        this.p = _.inject({
          x: 0,
          y: 0,
          z: 0,
          opacity: 1,
          angle: 0,
          frame: 0,
          name: "",
          spriteProperties: {},
          type: Mo.SPRITE_DEFAULT | Mo.SPRITE_ACTIVE
        },defProps);

        this.matrix = new Mo.Matrix2D();
        this.children = [];

        _.inject(this.p,props);

        this.size();
        this.p.id = this.p.id || _.nextID();

        this.refreshMatrix();
      },
      size: function(force) {
        if(force || (!this.p.w || !this.p.h)) {
          if(this.asset()) {
            this.p.w = this.asset().width;
            this.p.h = this.asset().height;
          } else if(this.sheet()) {
            this.p.w = this.sheet().tileW;
            this.p.h = this.sheet().tileH;
          }
        }
        this.p.cx = (force || this.p.cx === void 0) ? (this.p.w / 2) : this.p.cx;
        this.p.cy = (force || this.p.cy === void 0) ? (this.p.h / 2) : this.p.cy;
      },
      asset: function(name,resize) {
        if(!name)
          return Mo.asset(this.p.asset);
        this.p.asset = name;
        if(resize) {
          this.size(true);
          Mo._generatePoints(this,true);
        }
      },
      sheet: function(name,resize) {
        if(!name)
          return Mo.sheet(this.p.sheet);
        this.p.sheet = name;
        if(resize) {
          this.size(true);
          Mo._generatePoints(this,true);
        }
      },
      hide: function() {
        this.p.hidden = true;
      },
      show: function() {
        this.p.hidden = false;
      },
      set: function(props) {
        _.inject(this.p, props);
        return this;
      },
      _sortChild: (a,b) => {
        return ((a.p && a.p.z) || -1) - ((b.p && b.p.z) || -1);
      },
      _flipArgs: {
        "x":  [ -1,  1],
        "y":  [  1, -1],
        "xy": [ -1, -1]
      },
      render: function(ctx) {
        if(this.p.hidden ||
           this.p.opacity === 0) { return; }
        if(!ctx) ctx = Mo.ctx;

        Mo.EventBus.pub('predraw',this,ctx);
        ctx.save();

        if(this.p.opacity !== void 0 && this.p.opacity !== 1) {
          ctx.globalAlpha = this.p.opacity;
        }

        this.matrix.setContextTransform(ctx);

        if(this.p.flip)
          ctx.scale.apply(ctx,this._flipArgs[this.p.flip]);

        Mo.EventBus.pub('beforedraw',this,ctx);
        this.draw(ctx);
        Mo.EventBus.pub('draw',this,ctx);
        ctx.restore();

        // Children set up their own complete matrix
        // from the base stage matrix
        if(this.p.sort)
          this.children.sort(this._sortChild);
        _.invoke(this.children,"render",ctx);
        Mo.EventBus.pub('postdraw',this,ctx);
        if(Mo.debug)
          this.debugRender(ctx);
      },
      center: function() {
        if(this.container) {
          this.p.x = 0;
          this.p.y = 0;
        } else {
          this.p.x = Mo.width / 2;
          this.p.y = Mo.height / 2;
        }
      },
      draw: function(ctx) {
        let p = this.p;
        if(p.sheet) {
          this.sheet().draw(ctx,-p.cx,-p.cy,p.frame);
        } else if(p.asset) {
          ctx.drawImage(Mo.asset(p.asset),-p.cx,-p.cy);
        } else if(p.color) {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.cx,-p.cy,p.w,p.h);
        }
      },
      debugRender: function(ctx) {
        if(!this.p.points)
          Mo._generatePoints(this);
        ctx.save();
        this.matrix.setContextTransform(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.p.hit ? "blue" : "red";
        ctx.strokeStyle = "#FF0000";
        ctx.fillStyle = "rgba(0,0,0,0.5)";

        ctx.moveTo(this.p.points[0][0],this.p.points[0][1]);
        this.p.points.forEach(pt => ctx.lineTo(pt[0],pt[1]));
        ctx.lineTo(this.p.points[0][0],this.p.points[0][1]);
        ctx.stroke();

        if(Mo.debugFill) { ctx.fill(); }
        ctx.restore();

        if(this.c) {
          let c = this.c;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#FF00FF";
          ctx.beginPath();
          ctx.moveTo(c.x - c.cx,       c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx      , c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx,       c.y - c.cy);
          ctx.stroke();
          ctx.restore();
        }
      },
      update: function(dt) {
        Mo.EventBus.pub('prestep',this,dt);
        if(this.step)
          this.step(dt);
        Mo.EventBus.pub('step',this,dt);
        Mo._generateCollisionPoints(this);

        this.layer &&
          (this.children.length > 0) &&
            this.layer.update(this.children,dt,true);

        // Reset collisions if we're tracking them
        if(this.p.collisions)
          this.p.collisions = [];
      },
      refreshMatrix: function() {
        let p = this.p;
        this.matrix.identity();

        if(this.container)
          this.matrix.mult(this.container.matrix);

        this.matrix.translate(p.x,p.y);

        if(p.scale)
          this.matrix.scale(p.scale,p.scale);

        this.matrix.rot(p.angle);
      },
      moved: function() {
        this.p.moved = true;
      }
    });

    Mo.defType(["MovingSprite", Mo.Sprite], {
      init: function(props,defProps) {
        this._super(_.inject({
          vx: 0,
          vy: 0,
          ax: 0,
          ay: 0
        },props),defProps);
      },
      step: function(dt) {
        let p = this.p;

        p.vx += p.ax * dt;
        p.vy += p.ay * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    });

    return Mo;
  };

})(this);

