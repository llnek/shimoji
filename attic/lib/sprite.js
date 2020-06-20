(function(global, undefined){
  "use strict";
  let MojoH5 = global.MojoH5;

  MojoH5.Sprites = function(Mojo) {

    let _= Mojo.u,
        is= Mojo.is,
        _pool= _.jsVec();

    let Transform2D = Mojo.defType("",{
      init: function(source) {
        this.m= new Array(6);
        source ? this.clone(source) : this.identity();
      },
      identity: function() {
        let m = this.m;
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        return this;
      },
      clone: function(src) {
        for(let i=0;i<this.m.length;++i)
        this.m[i]=src.m[i];
        return this;
      },
      mult: function(other) {
        let a = this.m,
            b = other.m;
        let m11 = a[0]*b[0] + a[1]*b[3];
        let m12 = a[0]*b[1] + a[1]*b[4];
        let m13 = a[0]*b[2] + a[1]*b[5] + a[2];
        let m21 = a[3]*b[0] + a[4]*b[3];
        let m22 = a[3]*b[1] + a[4]*b[4];
        let m23 = a[3]*b[2] + a[4]*b[5] + a[5];

        a[0]=m11; a[1]=m12; a[2] = m13;
        a[3]=m21; a[4]=m22; a[5] = m23;
        return this;
      },
      rotate: function(rad) {
        if(rad === 0) { return this; }
        let m=this.m,
            cos = Math.cos(rad),
            sin = Math.sin(rad);
        let m11 = m[0]*cos  + m[1]*sin;
        let m12 = m[0]*-sin + m[1]*cos;
        let m21 = m[3]*cos  + m[4]*sin;
        let m22 = m[3]*-sin + m[4]*cos;
        m[0] = m11; m[1] = m12; // m[2] == m[2]
        m[3] = m21; m[4] = m22; // m[5] == m[5]
        return this;
      },
      rot: function(deg) {
        return this.rotate(Math.PI * deg / 180);
      },
      scale: function(sx,sy) {
        if(sy === undefined) { sy = sx; }
        let m = this.m;
        m[0] *= sx;
        m[1] *= sy;
        m[3] *= sx;
        m[4] *= sy;
        return this;
      },
      translate: function(tx,ty) {
        let m = this.m;
        m[2] += m[0]*tx + m[1]*ty;
        m[5] += m[3]*tx + m[4]*ty;
        return this;
      },
      transform: function(x,y) {
        return [x * this.m[0] + y * this.m[1] + this.m[2],
                x * this.m[3] + y * this.m[4] + this.m[5]];
      },
      transformPt: function(obj) {
        let x = obj.x, y = obj.y;
        obj.x = x * this.m[0] + y * this.m[1] + this.m[2];
        obj.y = x * this.m[3] + y * this.m[4] + this.m[5];
        return obj;
      },
      transformArr: function(inPt,outPt) {
        let x = inPt[0], y = inPt[1];
        if (outPt === undefined) outPt= [0,0];
        outPt[0] = x * this.m[0] + y * this.m[1] + this.m[2];
        outPt[1] = x * this.m[3] + y * this.m[4] + this.m[5];
        return outPt;
      },
      transformX: function(x,y) {
        return x * this.m[0] + y * this.m[1] + this.m[2];
      },
      transformY: function(x,y) {
        return x * this.m[3] + y * this.m[4] + this.m[5];
      },
      release: function() {
        _pool.push(this);
        return null;
      },
      setContextTransform: function(ctx) {
        let m=this.m;
        // source:
        //  m[0] m[1] m[2]
        //  m[3] m[4] m[5]
        //  0     0   1
        //
        // destination:
        //  m11  m21  dx
        //  m12  m22  dy
        //  0    0    1
        //  setTransform(m11, m12, m21, m22, dx, dy)
        //a (m11) Horizontal scaling. A value of 1 results in no scaling.
        //b (m12) Vertical skewing.
        //c (m21) Horizontal skewing.
        //d (m22) Vertical scaling. A value of 1 results in no scaling.
        //e (dx) Horizontal translation (moving).
        //f (dy) Vertical translation (moving).
        ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);
      }
    });

    let transformMatrix = () => {
      return _pool.length > 0
             ? _pool.pop().identity() : new Transform2D();
    };

    /**
     * @object sheets
     */
    Mojo.sheets = _.jsObj();

    /**
     * @class SpriteSheet
     */
    Mojo.defType("SpriteSheet",{
      init: function(name, asset,options) {
        //asset = a.png
        let S= Mojo.asset(asset,true);
        _.inject(this,{frameInfo: {},
                       name: name,
                       asset: asset,
                       sx: 0, sy: 0,
                       tileW: 64, tileH: 64,
                       w: S.width, h: S.height,
                       spacingX: 0, spacingY: 0}, options);
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
        (ctx || Mojo.ctx).drawImage(Mojo.asset(this.asset),
                                    this.fx(frame),
                                    this.fy(frame),
                                    this.tileW,
                                    this.tileH,
                                    _.floor(x),
                                    _.floor(y),
                                    this.tileW,
                                    this.tileH);
      }
    });

    /**
     * @method
     */
    Mojo.sheet = (name,asset,options) => {
      if(asset)
        Mojo.sheets[name] = new Mojo.SpriteSheet(name,asset,options);
      return Mojo.sheets[name];
    };

    /**
     * @method
     */
    Mojo.parseSheet = (imageAsset,spriteData) => {
      let data = Mojo.asset(spriteData,true);
      _.doseq(data,(info,name) => {
        Mojo.sheet(name,imageAsset,info);
      });
    };

    /**
     * @method
     */
    Mojo.genPts = (obj,force) => {
      if(force ||
         obj.p.points === undefined) {
        let hw = obj.p.w/2,
            hh = obj.p.h/2;
        obj.p.points = [Mojo.v2(-hw, -hh), Mojo.v2(hw, -hh),
                        Mojo.v2(hw, hh), Mojo.v2(-hw, hh)];
      }
    };

    /**
     * @object
     */
    Mojo._nullContainer=
    {matrix: transformMatrix(),
     c: {x: 0, y: 0, angle: 0, scale: 1}};

    /**
     * @method
     */
    Mojo.genContactPts= (obj) => {

      if(!obj.refreshMatrix) {return;}

      if(!obj.c)
        obj.c = { points: [] };

      let p = obj.p,
          c = obj.c,
          pps= p.points,
          cps= c.points;

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
         p.angle === 0 &&
         (!p.scale || p.scale === 1)) {
        //the actual bounding box points of the object
        for(let i=0;i<pps.length;++i) {
          cps[i] = cps[i] || Mojo.v2();
          cps[i][0] = p.x + pps[i][0];
          cps[i][1] = p.y + pps[i][1];
        }
        c.x = p.x;
        c.y = p.y;
        c.w = p.w;
        c.h = p.h;
        c.cx = p.cx;
        c.cy = p.cy;
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

        for(let x,y,i=0;i<pps.length;++i) {
          if(!cps[i])
            cps[i] = Mojo.v2();
          obj.matrix.transformArr(pps[i], cps[i]);
          x = cps[i][0];
          y = cps[i][1];
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

    /**
     * @object
     */
    let _flipArgs= {
      x: Mojo.v2(-1, 1),
      y: Mojo.v2( 1, -1),
      xy: Mojo.v2(-1, -1)
    };

    /**
     * @class Sprite
     */
    Mojo.defType(["Sprite", Mojo.Entity], {
      init: function(props,defaults) {
        this.p = _.inject({x: 0,
                           y: 0,
                           z: 0,
                           angle: 0,
                           frame: 0,
                           name: "",
                           opacity: 1,
                           type: Mojo.E_DEFAULT |
                                 Mojo.E_ACTIVE},defaults,props);

        if(this.p.id === undefined)
        this.p.id = _.nextID();

        this.matrix = transformMatrix();
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

        // distance from center to left
        if(force || this.p.cx === undefined)
        this.p.cx = this.p.w / 2;

        // distance from center to top
        if(force || this.p.cy === undefined)
        this.p.cy = this.p.h / 2;

        return this;
      },
      asset: function(name,resize) {
        if(name) {
          this.p.asset = name;
          if(resize) {
            this.size(true);
            Mojo.genPts(this,true);
          }
        }
        return Mojo.asset(this.p.asset);
      },
      sheet: function(name,resize) {
        if(name) {
          this.p.sheet = name;
          if(resize) {
            this.size(true);
            Mojo.genPts(this,true);
          }
        }
        return Mojo.sheet(this.p.sheet);
      },
      hide: function() {
        this.p.hidden = true;
        return this;
      },
      show: function() {
        this.p.hidden = false;
        return this;
      },
      set: function(props) {
        _.inject(this.p, props);
        return this;
      },
      _sortChild: (a,b) => {
        return ((a.p && a.p.z) || -1) - ((b.p && b.p.z) || -1);
      },
      render: function(ctx) {
        if(this.p.hidden ||
           this.p.opacity === 0) { return; }

        if(!ctx)
          ctx = Mojo.ctx;

        Mojo.EventBus.pub("predraw",this,ctx);
        ctx.save();

        if(this.p.opacity !== undefined &&
           this.p.opacity !== 1) {
          ctx.globalAlpha = this.p.opacity;
        }

        this.matrix.setContextTransform(ctx);

        if(this.p.flip)
          ctx.scale.apply(ctx, _flipArgs[this.p.flip]);

        Mojo.EventBus.pub("beforedraw",this,ctx);
        this.draw(ctx);
        Mojo.EventBus.pub("draw",this,ctx);
        ctx.restore();

        if(this.p.sort)
          this.children.sort(this._sortChild);
        _.invoke(this.children,"render",ctx);
        Mojo.EventBus.pub("postdraw",this,ctx);
        this.debugRender(ctx);
        return this;
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
        return this;
      },
      debugRender: function(ctx) {

        if(!ctx ||
           !Mojo.options.debug) {return this;}

        !this.p.points &&
          Mojo.genPts(this);

        let pps= this.p.points,
            p0=pps[0];

        ctx.save();
        this.matrix.setContextTransform(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.p.hit ? "blue" : "red";
        ctx.strokeStyle = "#FF0000";
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.moveTo(p0[0],p0[1]);
        pps.forEach(pt => ctx.lineTo(pt[0],pt[1]));
        ctx.lineTo(p0[0],p0[1]);
        ctx.stroke();
        if(Mojo.options.debugFill) { ctx.fill(); }
        ctx.restore();

        if(this.c) {
          let c = this.c;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#FF00FF";
          ctx.beginPath();
          ctx.moveTo(c.x - c.cx, c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx, c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx, c.y - c.cy);
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

    /**
     * @class MovingSprite
     */
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

