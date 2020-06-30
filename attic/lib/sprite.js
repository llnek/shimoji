(function(global, undefined){
  "use strict";
  let MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not found.";

  /**
   * @module
   */
  MojoH5.Sprites = function(Mojo) {
    let _= Mojo.u,
        is= Mojo.is,
        _pool= _.jsVec();

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
     * @see https://www.w3resource.com/html5-canvas/html5-canvas-matrix-transforms.php
     * @private
     * @class
     */
    let Xform2D = (function(A,C,E,B,D,F,Z) {
      return Mojo.defType("Xfrom2D", {
        init: function(source) {
          this.m= new Array(Z);
          source ? this.clone(source) : this.identity();
        },
        identity: function() {
          //a,b,c,d,e,f = [a c e] = [1 0 0]
          //              [b d f] = [0 1 0]
          //              [0 0 1] = [0 0 1]
          //a = horz scaling //c = vert skewing //e = horz moving (dx)
          //b = horz skewing //d = vert scaling //f = vert moving (dy)
          let m = this.m;
          m[A] = 1; m[C] = 0; m[E] = 0;
          m[B] = 0; m[D] = 1; m[F] = 0;
          return this;
        },
        clone: function(src) {
          for(let i=0;i<this.m.length;++i)
          this.m[i]=src.m[i];
          return this;
        },
        mult: function(other) {
          //basic Matrix3x3 X Matrix3x3 stuff
          let m = this.m,
              n = other.m;
          let a = m[A]*n[A] + m[C]*n[B],
              c = m[A]*n[C] + m[C]*n[D],
              e = m[A]*n[E] + m[C]*n[F] + m[E],
              b = m[B]*n[A] + m[4]*n[B],
              d = m[B]*n[C] + m[4]*n[D],
              f = m[B]*n[E] + m[4]*n[F] + m[F];

          m[A]=a; m[C]=c; m[E] = e;
          m[B]=b; m[D]=d; m[F] = f;
          return this;
        },
        rot: function(deg) {
          return this.rotate(Math.PI * deg / 180);
        },
        rotate: function(rad) {
          if(rad === 0) { return this; }
          let m=this.m,
              cos = Math.cos(rad),
              sin = Math.sin(rad);
          let a = m[A]*cos  + m[C]*sin;
          let c = m[A]*-sin + m[C]*cos;
          let b = m[B]*cos  + m[D]*sin;
          let d = m[B]*-sin + m[D]*cos;
          m[A] = a; m[C] = c;
          m[B] = b; m[D] = d;
          return this;
        },
        scale: function(sx,sy) {
          if(sy === undefined) { sy = sx; }
          let m = this.m;
          m[A] *= sx;
          m[C] *= sy;
          m[B] *= sx;
          m[D] *= sy;
          return this;
        },
        translate: function(tx,ty) {
          let m = this.m;
          m[E] += m[A]*tx + m[C]*ty;
          m[F] += m[B]*tx + m[D]*ty;
          return this;
        },
        transformX: function(x,y) {
          return x * this.m[A] + y * this.m[C] + this.m[E];
        },
        transformY: function(x,y) {
          return x * this.m[B] + y * this.m[D] + this.m[F];
        },
        transform: function(x,y) {
          // x' = ax + cy + e
          // y' = bx + dy + f
          return [this.transformX(x,y), this.transformY(x,y)];
        },
        transformPt: function(obj) {
          let rc= this.transform(obj.x, obj.y);
          obj.x = rc[0];
          obj.y = rc[1];
          return obj;
        },
        transformArr: function(inPt,outPt) {
          let rc= this.transform(inPt[0], inPt[1]);
          if(outPt===undefined)
            outPt=rc;
          else {
            outPt[0] = rc[0];
            outPt[1] = rc[1];
          }
          return outPt;
        },
        release: function() {
          _pool.push(this.identity());
        },
        setContextTransform: function(ctx) {
          let m=this.m;
          ctx.transform(m[A],m[B],m[C],m[D],m[E],m[F]);
        }
      }, 0);
    })(0,1,2,3,4,5,6);

    /**
     * @private
     * @function
     */
    let transformMatrix = () => {
      return _pool.length > 0 ? _pool.pop() : new Xform2D();
    };

    /**
     * @public
     * @property {Map}
     */
    Mojo.sheets = _.jsObj();

    /**
     * @public
     * @class
     */
    Mojo.defType("SpriteSheet",{
      /**
       * @constructs
       */
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
    }, Mojo);

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
     * @public
     * @class Sprite
     */
    Mojo.defType(["Sprite", Mojo.Entity], {
      init: function(props,defaults) {
        this._super(_.inject({x: 0,
                              y: 0,
                              z: 0,
                              angle: 0,
                              frame: 0,
                              name: "",
                              opacity: 1,
                              type: Mojo.E_DEFAULT |
                              Mojo.E_ACTIVE},defaults,props));

        if(this.p.id === undefined)
        this.p.id = _.nextID();

        this.matrix = transformMatrix();
        this.children = [];
        this.size();
        this.refreshMatrix();
      },
      add: function(child) {
        _.conj(this.children,child);
        child.container=this;
        return this;
      },
      del: function(child) {
        let n= this.children.indexOf(child);
        if(n > -1) {
          this.children.splice(n,1);
          child.container=null;
        }
        return this;
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
           !Mojo.o.debug) {return this;}

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
        if(Mojo.o.debugFill) { ctx.fill(); }
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

        this.scene &&
          (this.children.length > 0) &&
            this.scene.update(this.children,dt,true);

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
    }, Mojo);

    /**
     * @public
     * @class
     */
    Mojo.defType(["MovableSprite", Mojo.Sprite], {
      init: function(props,defaults) {
        this._super(props, _.inject({vx: 0,
                                     vy: 0,
                                     ax: 0,
                                     ay: 0},defaults));
      },
      motion: function(dt) {
        let p = this.p;
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }, Mojo);

    return Mojo;
  };

})(this);

