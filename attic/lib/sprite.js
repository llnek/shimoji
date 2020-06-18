(function(global, undefined){
  "use strict";
  let MojoH5 = global.MojoH5;

  MojoH5.Sprites = function(Mojo) {

    let _= Mojo.u,
        is= Mojo.is;

    Mojo.SPRITE_NONE     = 0;
    Mojo.SPRITE_DEFAULT  = 1;
    Mojo.SPRITE_PARTICLE = 2;
    Mojo.SPRITE_ACTIVE   = 4;
    Mojo.SPRITE_FRIENDLY = 8;
    Mojo.SPRITE_ENEMY    = 16;
    Mojo.SPRITE_POWERUP  = 32;
    Mojo.SPRITE_UI       = 64;
    Mojo.SPRITE_ALL   = 0xFFFF;

    Mojo.sheets = {};

    Mojo.defType("SpriteSheet",{
      init: function(name, asset,options) {
        let S= Mojo.asset(asset,true);
        _.inject(this,{name: name,
                       asset: asset,
                       w: S.width,
                       h: S.height,
                       tileW: 64,
                       tileH: 64,
                       sx: 0,
                       sy: 0,
                       spacingX: 0,
                       spacingY: 0,
                       frameInfo: {}}, options);
        if(!this.cols)
          this.cols= _.floor((this.w+this.spacingX) / (this.tileW+this.spacingX));
        this.frames = this.cols * (_.floor(this.h/(this.tileH + this.spacingY)));
      },
      fx: function(frame) {
        return _.floor((frame % this.cols) * (this.tileW + this.spacingX) + this.sx);
      },
      fy: function(frame) {
        return _.floor(_.floor(frame / this.cols) * (this.tileH + this.spacingY) + this.sy);
      },
      draw: function(ctx, x, y, frame) {
        (ctx || Mojo.ctx).drawImage(Mojo.asset(this.asset,true),
                                  this.fx(frame), this.fy(frame),
                                  this.tileW, this.tileH,
                                  Math.floor(x), Math.floor(y),
                                  this.tileW, this.tileH);
      }
    }, Mojo);

    Mojo.sheet = function(name,asset,options) {
      if(asset)
        Mojo.sheets[name] = new Mojo.SpriteSheet(name,asset,options);
      return Mojo.sheets[name];
    };

    Mojo.parseSheet = function(imageAsset,spriteData) {
      var data = Mojo.asset(spriteData,true);
      _.doseq(data,(info,name) => {
        Mojo.sheet(name,imageAsset,info);
      });
    };

    Mojo.genPts = function(obj,force) {
      if(force ||
         !obj.p.points) {
        let p = obj.p,
            hw = p.w/2,
            hh = p.h/2;
        p.points = [Mojo.v2(-hw, -hh), Mojo.v2(hw, -hh),
                    Mojo.v2(hw, hh), Mojo.v2(-hw, hh)];
      }
    };

    Mojo._nullContainer=
    {matrix: Mojo.matrix2d(),
     c: {x: 0, y: 0, angle: 0, scale: 1}};

    Mojo.genContactPts= function(obj) {

      if(!obj.matrix &&
         !obj.refreshMatrix) {return;}

      if(!obj.c)
        obj.c = { points: [] };

      let p = obj.p,
          c = obj.c;

      if(!p.moved &&
         c.origX === p.x &&
         c.origY === p.y &&
         c.origScale === p.scale &&
         c.origAngle === p.angle) {return;}

      c.origX = p.x;
      c.origY = p.y;
      c.origScale = p.scale;
      c.origAngle = p.angle;
      obj.refreshMatrix();

      if(!obj.container &&
         (!p.scale || p.scale === 1) && p.angle === 0) {
        //this just gives the actual bounding box points
        //of the object
        for(let i=0;i<obj.p.points.length;++i) {
          obj.c.points[i] = obj.c.points[i] || Mojo.v2();
          obj.c.points[i][0] = p.x + obj.p.points[i][0];
          obj.c.points[i][1] = p.y + obj.p.points[i][1];
        }
        c.x = p.x; c.y = p.y;
        c.w = p.w; c.h = p.h;
        c.cx = p.cx; c.cy = p.cy;
      } else {
        let parent = obj.container || Mojo._nullContainer;
        c.x = parent.matrix.transformX(p.x,p.y);
        c.y = parent.matrix.transformY(p.x,p.y);
        c.angle = p.angle + parent.c.angle;
        c.scale = (parent.c.scale || 1) * (p.scale || 1);

        let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

        for(let x,y,i=0;i<obj.p.points.length;++i) {
          if(!obj.c.points[i])
            obj.c.points[i] = Mojo.v2();

          obj.matrix.transformArr(obj.p.points[i], obj.c.points[i]);
          x = obj.c.points[i][0];
          y = obj.c.points[i][1];

          if(x < minX) minX = x;
          if(x > maxX) maxX = x;
          if(y < minY) minY = y;
          if(y > maxY) maxY = y;
        }

        if(minX === maxX) maxX+=1;
        if(minY === maxY) maxY+=1;

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

    Mojo.defType(["Sprite",Mojo.Entity], {
      init: function(props,defaults) {
        this.p = _.inject({x: 0,
                           y: 0,
                           z: 0,
                           angle: 0,
                           frame: 0,
                           name: "",
                           opacity: 1,
                           spriteInfo: {},
                           type: Mojo.SPRITE_DEFAULT |
                                 Mojo.SPRITE_ACTIVE},defaults,props);

        if(this.p.id === undefined)
        this.p.id = _.nextID();

        this.matrix = Mojo.matrix2d();
        this.children = [];
        this.size();
        this.refreshMatrix();
      },
      size: function(force) {
        if(force ||
           (this.p.w===undefined ||
            this.p.h===undefined)) {
          if(this.asset()) {
            this.p.w = this.asset().width;
            this.p.h = this.asset().height;
          } else if(this.sheet()) {
            this.p.w = this.sheet().tileW;
            this.p.h = this.sheet().tileH;
          }
        }

        if(force || this.p.cx === undefined)
        this.p.cx = this.p.w / 2;

        if(force || this.p.cy === undefined)
        this.p.cy = this.p.h / 2;
      },
      asset: function(name,resize) {
        if(!name)
          return Mojo.asset(this.p.asset);
        //else
        this.p.asset = name;
        if(resize) {
          this.size(true);
          Mojo.genPts(this,true);
        }
      },
      sheet: function(name,resize) {
        if(!name)
          return Mojo.sheet(this.p.sheet);
        this.p.sheet = name;
        if(resize) {
          this.size(true);
          Mojo.genPts(this,true);
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
        x: Mojo.v2(-1, 1),
        y: Mojo.v2( 1, -1),
        xy: Mojo.v2(-1, -1)
      },
      render: function(ctx) {
        if(this.p.hidden ||
           this.p.opacity === 0) { return; }

        if(!ctx)
          ctx = Mojo.ctx;

        Mojo.EventBus.pub('predraw',this,ctx);
        ctx.save();

        if(this.p.opacity !== undefined &&
           this.p.opacity !== 1) {
          ctx.globalAlpha = this.p.opacity;
        }

        this.matrix.setContextTransform(ctx);

        if(this.p.flip)
          ctx.scale.apply(ctx,this._flipArgs[this.p.flip]);

        Mojo.EventBus.pub("beforedraw",this,ctx);
        this.draw(ctx);
        Mojo.EventBus.pub("draw",this,ctx);
        ctx.restore();

        if(this.p.sort)
          this.children.sort(this._sortChild);
        _.invoke(this.children,"render",ctx);
        Mojo.EventBus.pub("postdraw",this,ctx);
        if(Mojo.debug)
          this.debugRender(ctx);
      },
      center: function() {
        if(this.container) {
          this.p.x = 0;
          this.p.y = 0;
        } else {
          this.p.x = Mojo.width / 2;
          this.p.y = Mojo.height / 2;
        }
      },
      draw: function(ctx) {
        let p = this.p;
        if(p.sheet) {
          this.sheet().draw(ctx,-p.cx,-p.cy,p.frame);
        } else if(p.asset) {
          ctx.drawImage(Mojo.asset(p.asset),-p.cx,-p.cy);
        } else if(p.color) {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.cx,-p.cy,p.w,p.h);
        }
      },
      debugRender: function(ctx) {
        if(!this.p.points) Mojo.genPts(this);
        _.assert(ctx,"canvas-context ","is null");
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

        if(Mojo.debugFill) { ctx.fill(); }
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
        Mojo.EventBus.pub("prestep",this,dt);
        if(this.step)
          this.step(dt);
        Mojo.EventBus.pub("step",this,dt);
        Mojo.genContactPts(this);

        this.stage &&
          (this.children.length > 0) &&
            this.stage.update(this.children,dt,true);

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

    Mojo.defType(["MovingSprite", Mojo.Sprite], {
      init: function(props,defaults) {
        this._super(_.inject({vx: 0,
                              vy: 0,
                              ax: 0,
                              ay: 0},props),defaults);
      },
      step: function(dt) {
        let p = this.p;

        p.vx += p.ax * dt;
        p.vy += p.ay * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    });

    return Mojo;
  };

})(this);

