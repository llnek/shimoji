/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

(function(global, undefined){
  "use strict";
  let Inf= Infinity,
      MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not found.";

  /**
   * @module
   */
  MojoH5.Sprites = function(Mojo) {
    let _= Mojo.u,
        is= Mojo.is,
        _pool= [],
        EBus=Mojo.EventBus;

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
     * @see https://www.w3resource.com/html5-canvas/html5-canvas-matrix-transforms.php
     * @private
     * @class
     */
    let Xform2D = (function(A,C,E,B,D,F,Z) {
      return Mojo.deftype("Xfrom2D", {
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
    let txMatrix = () => {
      return _pool.length > 0 ? _pool.pop() : new Xform2D();
    };

    /**
     * @private
     * @property {map}
     */
    Mojo._sheets = _.jsMap();

    /**Represents an individual element within a sprite-sheet.
     * @public
     * @class
     */
    Mojo.deftype("SpriteSheet",{
      /**
       * @constructs
       */
      init: function(name, asset,options) {
        //name=Player, asset = sprites.png,
        //options= {file position,size,frames info}
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
        ctx.drawImage(Mojo.asset(this.asset),
                      this.fx(frame), this.fy(frame),
                      this.tileW, this.tileH,
                      _.floor(x), _.floor(y),
                      this.tileW, this.tileH);
      }
    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo.sheet = (name,asset,options) => {
      if(asset)
        _.assoc(Mojo._sheets,name,
                new Mojo.SpriteSheet(name,asset,options));
      return _.get(Mojo._sheets,name);
    };

    /**Extracts & split individual elements from a sprite sheet.
     * @public
     * @function
     */
    Mojo.parseSheet = (imageAsset,spriteData) => {
      let data = Mojo.asset(spriteData,true);
      _.doseq(data, (info,name) => {
        Mojo.sheet(name,imageAsset,info);
      });
    };

    /**Logical bounding box of an object.
     * @public
     * @function
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
     * @private
     * @var {object}
     */
    let _nullContainer=
    {matrix: txMatrix(),
     c: {x: 0, y: 0, angle: 0, scale: 1}};

    /**
     * @public
     * @function
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
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity,
            parent = obj.container || _nullContainer;

        c.x = parent.matrix.transformX(p.x,p.y);
        c.y = parent.matrix.transformY(p.x,p.y);
        c.angle = p.angle + parent.c.angle;
        c.scale = (parent.c.scale || 1) * (p.scale || 1);

        for(let x,y,i=0;i<pps.length;++i) {
          cps[i]= obj.matrix.transformArr(pps[i], cps[i]);
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
     * @private
     * @var {object}
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
    Mojo.deftype(["Sprite", Mojo.Entity], {
      /**
       * @constructs
       */
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

        this.matrix = txMatrix();
        this.children = [];
        this.size();
        this.refreshMatrix();
      },
      motion: function(dt) {
        let p = this.p;
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      },
      add: function(child) {
        _.conj(this.children,child);
        _.assoc(child,"container",this);
        return this;
      },
      del: function(child) {
        let n= this.children.indexOf(child);
        if(n > -1) {
          this.children.splice(n,1);
          _.dissoc(child,"container");
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

        EBus.pub("predraw",this,ctx);
        ctx.save();

        if(this.p.opacity !== undefined &&
           this.p.opacity !== 1) {
          ctx.globalAlpha = this.p.opacity;
        }

        this.matrix.setContextTransform(ctx);

        if(this.p.flip)
          ctx.scale.apply(ctx, _flipArgs[this.p.flip]);

        EBus.pub("beforedraw",this,ctx);
        this.draw(ctx);
        EBus.pub("draw",this,ctx);
        ctx.restore();

        if(this.p.sort)
          this.children.sort(this._sortChild);
        _.invoke(this.children,"render",ctx);
        EBus.pub("postdraw",this,ctx);
        this.debugRender(ctx);
        return this;
      },
      center: function() {
        if(this.container) {
          this.p.x = 0;
          this.p.y = 0;
        } else {
          this.p.x = Mojo.width_div2;
          this.p.y = Mojo.height_div2;
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

        if(!this.p.points)
          Mojo.genPts(this);

        let p0,pps= this.p.points;
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
        EBus.pub("prestep",this,dt);
        if(this.step)
          this.step(dt);
        EBus.pub("step",this,dt);
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

    //---------- ui stuff, for now, lives in here  ---------------------------
    Mojo.UI = {};
    /**
     * @public
     * @function
     */
    Mojo.UI.drawRoundRect = (ctx, rect) => {
      ctx.beginPath();
      ctx.moveTo(-rect.cx + rect.radius, -rect.cy);
      ctx.lineTo(-rect.cx + rect.w - rect.radius, -rect.cy);
      ctx.quadraticCurveTo(-rect.cx + rect.w, -rect.cy, -rect.cx + rect.w, -rect.cy + rect.radius);
      ctx.lineTo(-rect.cx + rect.w, -rect.cy + rect.h - rect.radius);
      ctx.quadraticCurveTo(-rect.cx + rect.w,
                           -rect.cy + rect.h,
                           -rect.cx + rect.w - rect.radius,
                           -rect.cy + rect.h);
      ctx.lineTo(-rect.cx + rect.radius, -rect.cy + rect.h);
      ctx.quadraticCurveTo(-rect.cx, -rect.cy + rect.h, -rect.cx, -rect.cy + rect.h - rect.radius);
      ctx.lineTo(-rect.cx, -rect.cy + rect.radius);
      ctx.quadraticCurveTo(-rect.cx, -rect.cy, -rect.cx + rect.radius, -rect.cy);
      ctx.closePath();
    };

    /**
     * @public
     * @class
     */
    Mojo.deftype(["Container", Mojo.Sprite], {
      /**
       * @constructs
       */
      init: function(p,defaults) {
        let props= _.inject({},p);

        if(_.isPerc(props.w)) {
          props.w = parseInt(props.w) * Mojo.width/100;
          props.x = Mojo.width_div2 - props.w/2;
        }

        if(_.isPerc(props.h)) {
          props.h = parseInt(p.h) * Mojo.height/100;
          props.y = Mojo.height_div2 - props.h/2;
        }

        this._super(props, _.inject({opacity: 1,
                                     hidden: false,
                                     fill: null, // Set to color to add background
                                     highlight:   null, // Set to color to for button
                                     radius: 5, // Border radius
                                     stroke: "#000",
                                     border: false, // Set to a width to show a border
                                     shadow: false, // Set to true or a shadow offest
                                     shadowColor: false, // Set to a rgba value for the shadow
                                     outlineWidth: false, // Set to a width to outline text
                                     outlineColor: "#000",
                                     type: Mojo.E_NONE}, defaults));
      },
      insert: function(obj) {
        return this.scene.insert(obj,this);
      },
      fit: function(padY,padX) {
        let minObjX, minObjY, maxObjX, maxObjY,
            maxX = -Inf, maxY=maxX, minX = Inf, minY=minX;

        if(this.children.length > 0) {
          //sort out min max bounding box
          this.children.forEach(obj => {
            minObjX = obj.p.x - obj.p.cx,
            minObjY = obj.p.y - obj.p.cy,
            maxObjX = obj.p.x - obj.p.cx + obj.p.w,
            maxObjY = obj.p.y - obj.p.cy + obj.p.h;
            if(minObjX < minX) minX = minObjX;
            if(minObjY < minY) minY = minObjY;
            if(maxObjX > maxX) maxX = maxObjX;
            if(maxObjY > maxY) maxY = maxObjY;
          });

          if(padY===undefined) padY=0;
          if(padX===undefined) padX=padY;
          this.p.cx = -minX + padX;
          this.p.cy = -minY + padY;
          this.p.w = maxX - minX + padX*2;
          this.p.h = maxY - minY + padY*2;

          //resync all points
          Mojo.genPts(this, true);
          Mojo.genContactPts(this, true);
        }
        return this;
      },
      addShadow: function(ctx) {
        if(this.p.shadow) {
          let s= is.num(this.p.shadow) ? this.p.shadow : 5;
          ctx.shadowOffsetX=s;
          ctx.shadowOffsetY=s;
          ctx.shadowColor = this.p.shadowColor || "rgba(0,0,50,0.1)";
        }
        return this;
      },
      clearShadow: (ctx) => {
        ctx.shadowColor = "transparent";
        return this;
      },
      drawRadius: function(ctx) {
        Mojo.UI.drawRoundRect(ctx,this.p);
        this.addShadow(ctx);
        ctx.fill();
        if(this.p.border) {
          this.clearShadow(ctx);
          ctx.lineWidth = this.p.border;
          ctx.stroke();
        }
        return this;
      },
      drawSquare: function(ctx) {
        this.addShadow(ctx);
        if(this.p.fill) {
          ctx.fillRect(-this.p.cx,-this.p.cy,
                        this.p.w,this.p.h);
        }
        if(this.p.border) {
          this.clearShadow(ctx);
          ctx.lineWidth = this.p.border;
          ctx.strokeRect(-this.p.cx,-this.p.cy,
                          this.p.w,this.p.h);
        }
        return this;
      },
      draw: function(ctx) {
        if(this.p.hidden ||
           (!this.p.border && !this.p.fill)) {
        } else {
          ctx.globalAlpha = this.p.opacity;
          ctx.strokeStyle = this.p.stroke;
          ctx.fillStyle = this.p.fill;
          if(this.p.highlight &&
             this.p.frame === 1)
            ctx.fillStyle = this.p.highlight;
          this[this.p.radius>0?"drawRadius":"drawSquare"](ctx);
        }
        return this;
      }
    }, Mojo.UI);

    /**
     * @public
     * @class
     */
    Mojo.deftype(["Text", Mojo.Sprite], {
      /**
       * @constructs
       */
      init: function(p,defaults) {
        this._super(p, _.inject({size: 24,
                                 lineHeight: 1.2,
                                 align: "center",
                                 type: Mojo.E_UI}, defaults));
        if(this.p.label)
          this.calcSize();
      },
      calcSize: function() {
        let p=this.p,
            metrics,
            maxLabel = "";
        p.w = 0;
        this.splitLabel = p.label.split("\n");
        this.setFont(Mojo.ctx);
        this.splitLabel.forEach(obj => {
          metrics = Mojo.ctx.measureText(obj);
          if(metrics.width> p.w)
            p.w = metrics.width;
        });
        p.lineHeightPx = p.size * p.lineHeight;
        p.h = p.lineHeightPx * this.splitLabel.length;
        p.halfLeading = 0.5 * p.size * _.max(0, p.lineHeight-1);
        p.cy = 0;
        if(p.align === "center"){
          p.cx = p.w/2;
          p.points = [ [ -p.cx, 0],
                       [ p.cx, 0],
                       [ p.cx, p.h ],
                       [ -p.cx, p.h ] ];
        } else if(p.align === "right"){
           p.cx = p.w;
           p.points = [ [ -p.w, 0],
                        [ 0, 0],
                        [ 0, p.h ],
                        [ -p.w, p.h ] ];
        } else {
           p.cx = 0;
           p.points = [ [ 0, 0],
                        [ p.w, 0],
                        [ p.w, p.h ],
                        [ 0, p.h ] ];
        }
        return this;
      },
      prerender: function() {
        if(this.p.oldLabel !== this.p.label) {
          this.p.oldLabel = this.p.label;
          this.calcSize();
          this.el.width = this.p.w;
          this.el.height = this.p.h * 4;
          this.ctx.clearRect(0,0,this.p.w,this.p.h);
          this.ctx.fillStyle = "#FF0";
          this.ctx.fillRect(0,0,this.p.w,this.p.h/2);
          this.setFont(this.ctx);
          this.ctx.fillText(this.p.label,0,0);
        }
        return this;
      },
      draw: function(ctx) {
        let p = this.p;
        if(p.opacity !== 0) {
          if(p.oldLabel !== p.label) this.calcSize();
          this.setFont(ctx);
          if(p.opacity !== undefined) ctx.globalAlpha = p.opacity;
          for(let obj,i=0,z=this.splitLabel.length;i<z;++i) {
            obj=this.splitLabel[i];
            if(p.outlineWidth)
              ctx.strokeText(obj,0, p.halfLeading + i * p.lineHeightPx);
            ctx.fillText(obj,0, p.halfLeading + i * p.lineHeightPx);
          };
        }
        return this;
      },
      asset: function() {
        return this.el;
      },
      setFont: function(ctx) {
        ctx.textBaseline = "top";
        ctx.font= this.font();
        ctx.fillStyle = this.p.color || "black";
        ctx.textAlign = this.p.align || "left";
        ctx.lineWidth = this.p.outlineWidth || 0;
        ctx.strokeStyle = this.p.outlineColor || "black";
        return this;
      },
      font: function() {
        if(!this.fontString)
          this.fontString = (this.p.weight || "800") + " " +
                            (this.p.size || 24) + "px " +
                            (this.p.family || "Arial");
        return this.fontString;
      }
    }, Mojo.UI);

    /**
     * @public
     * @class
     */
    Mojo.deftype(["Button", Mojo.UI.Container], {
      /**
       * @constructs
       */
      init: function(p, callback, defaults) {
        this._super(p, _.inject({keyActionName: null,
                                 type: Mojo.E_UI | Mojo.E_DEFAULT},defaults));
        if(this.p.label &&
           (!this.p.w || !this.p.h)) {
          Mojo.ctx.save();
          this.setFont(Mojo.ctx);
          let metrics = Mojo.ctx.measureText(this.p.label);
          Mojo.ctx.restore();
          if(!this.p.h) this.p.h = 24 + 20;
          if(!this.p.w) this.p.w = metrics.width + 20;
        }
        if(isNaN(this.p.cx)) this.p.cx = this.p.w/2;
        if(isNaN(this.p.cy)) this.p.cy = this.p.h/2;
        this.callback = callback;
        EBus.sub("touchEnd",this,"push");
        EBus.sub("touch",this,"highlight");
        if(this.p.keyActionName)
          EBus.sub(this.p.keyActionName,Mojo.input,"push",this);
      },
      highlight: function() {
        if(this.sheet() !== undefined &&
           this.sheet().frames > 1) { this.p.frame = 1; }
        return this;
      },
      push: function() {
        this.p.frame = 0;
        this.callback && this.callback();
        EBus.pub("click",this);
        return this;
      },
      draw: function(ctx) {
        this._super(ctx);
        if(this.p.asset || this.p.sheet)
          Mojo.Sprite.prototype.draw.call(this,ctx);
        if(this.p.label) {
          ctx.save();
          this.setFont(ctx);
          ctx.fillText(this.p.label,0,0);
          ctx.restore();
        }
        return this;
      },
      setFont: function(ctx) {
        ctx.textBaseline = "middle";
        ctx.font = this.p.font || "400 24px arial";
        ctx.fillStyle = this.p.fontColor || "black";
        ctx.textAlign = "center";
        return this;
      }
    }, Mojo.UI);

    /**
     * @public
     * @class
     */
    Mojo.deftype(["IFrame", Mojo.Sprite], {
      init: function(p) {
        this._super(p, {opacity: 1,
                        type: Mojo.E_UI | Mojo.E_DEFAULT });
        Mojo.domCss(Mojo.wrapper, "overflow", "hidden");
        this.iframe = Mojo.domCtor("IFRAME", {src: this.p.url,
                                              width: this.p.w,
                                              height: this.p.h,
                                              frameborder:0},
                                             {position: "absolute", zIndex: 500});
        if(this.p.background)
          Mojo.domCss(this.iframe, "backgroundColor", this.p.background);
        Mojo.domConj(iframe,Mojo.wrapper);
        EBus.sub("inserted",this, function(parent) {
          this.positionIFrame();
          EBus.sub("disposed",parent,"remove",this);
        });
      },
      positionIFrame: function() {
        let x = this.p.x,
            y = this.p.y;
        if(this.scene.camera) {
          x -= this.scene.camera.x;
          y -= this.scene.camera.y;
        }
        if(this.oldX !== x ||
           this.oldY !== y ||
           this.oldOpacity !== this.p.opacity) {
          Mojo.domCss(this.iframe, {opacity: this.p.opacity,
                                    top: (y - this.p.cy) + "px",
                                    left: (x - this.p.cx) + "px"});
          this.oldX = x;
          this.oldY = y;
          this.oldOpacity = this.p.opacity;
        }
        return this;
      },
      step: function(dt) {
        this._super(dt);
        return this.positionIFrame();
      },
      remove: function() {
        if(this.iframe) {
          Mojo.wrapper.removeChild(this.iframe);
          this.iframe = null;
        }
        return this;
      }
    }, Mojo.UI);

    /**
     * @public
     * @class
     */
    Mojo.deftype(["HTMLElement", Mojo.Sprite], {
      init: function(p) {
        this._super(p, {opacity: 1, type: Mojo.E_UI});
        Mojo.domCss(Mojo.wrapper, "overflow", "hidden");
        this.el = Mojo.domCtor("div");
        this.el.innerHTML = this.p.html;
        Mojo.domConj(this.el, Mojo.wrapper);
        EBus.sub("inserted",this, function(parent) {
          this.position();
          EBus.sub("disposed", parent,"remove",this);
          EBus.sub("clear", parent,"remove",this);
        });
      },
      position: function() { return this; },
      step: function(dt) {
        this._super(dt);
        return this.position();
      },
      remove: function() {
        if(this.el) {
          Mojo.wrapper.removeChild(this.el);
          this.el= null;
        }
        return this;
      }
    },Mojo.UI);

    /**
     * @public
     * @class
     */
    Mojo.deftype(["VerticalLayout", Mojo.Sprite], {
      init: function(p) {
        this.children = [];
        this._super(p, { type: Mojo.E_NONE});
      },
      insert: function(sprite) {
        this.scene.insert(sprite,this);
        this.relayout();
        return sprite;
      },
      relayout: function() {
        let totalHeight = 0;
        this.children.forEach(c => {
          totalHeight += c.p.h || 0;
        });
        // Center?
        let totalSeparation = this.p.h - totalHeight;
        // Make sure all elements have the same space between them
      }
    },Mojo.UI);



    return Mojo;
  };

})(this);

