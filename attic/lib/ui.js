(function(global,undefined) {

  "use strict";
  let MojoH5 = global.MojoH5,
      document= global.document;

  MojoH5.UI = function(Mojo) {

    let _=Mojo.u,
        is=Mojo.is;

    Mojo.UI = _.jsObj();
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

    Mojo.defType(["Container", Mojo.Sprite], {
      init: function(p,defaults) {
        let match, props= _.inject({},p);
        if(p &&
           is.str(p.w) &&
           (match = p.w.match(/^[0-9]+%$/))) {
          props.w = parseInt(p.w) * Mojo.width/100;
          props.x = Mojo.width/2 - props.w/2;
        }
        if(p &&
           is.str(p.h) &&
           (match = p.h.match(/^[0-9]+%$/))) {
          props.h = parseInt(p.h) * Mojo.height/100;
          props.y = Mojo.height/2 - props.h/2;
        }
        this._super(_.patch(props,defaults),{
          opacity: 1,
          hidden: false, // Set to true to not show the container
          fill:   null, // Set to color to add background
          highlight:   null, // Set to color to for button
          radius: 5, // Border radius
          stroke: "#000",
          border: false, // Set to a width to show a border
          shadow: false, // Set to true or a shadow offest
          shadowColor: false, // Set to a rgba value for the shadow
          outlineWidth: false, // Set to a width to outline text
          outlineColor: "#000",
          type: Mojo.E_NONE
        });
      },
      insert: function(obj) {
        return this.scene.insert(obj,this);
      },
      fit: function(padY,padX) {
        let minObjX, minObjY, maxObjX, maxObjY;
        let maxX = -Infinity,maxY=maxX;
        let minX = Infinity,minY=minX;
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
        if(this.children.length > 0) {
          if(padY === undefined) padY=0;
          if(padX === undefined) padX=padY;
          this.p.cx = -minX + padX;
          this.p.cy = -minY + padY;
          this.p.w = maxX - minX + padX * 2;
          this.p.h = maxY - minY + padY * 2;
          // Since the original dimensions were changed,
          // update the boundaries so that
          // the collision is calculated correctly
          Mojo.genPts(this, true);
          Mojo.genContactPts(this, true);
        }
      },
      addShadow: function(ctx) {
        if(this.p.shadow) {
          let s= is.num(this.p.shadow) ? this.p.shadow : 5;
          ctx.shadowOffsetX=s;
          ctx.shadowOffsetY=s;
          ctx.shadowColor = this.p.shadowColor || "rgba(0,0,50,0.1)";
        }
      },
      clearShadow: (ctx) => { ctx.shadowColor = "transparent"; },
      drawRadius: function(ctx) {
        Mojo.UI.drawRoundRect(ctx,this.p);
        this.addShadow(ctx);
        ctx.fill();
        if(this.p.border) {
          this.clearShadow(ctx);
          ctx.lineWidth = this.p.border;
          ctx.stroke();
        }
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
      },
      draw: function(ctx) {
        if(this.p.hidden) return false;
        if(!this.p.border && !this.p.fill) { return; }

        ctx.globalAlpha = this.p.opacity;
        if(this.p.frame === 1 &&
           this.p.highlight)
          ctx.fillStyle = this.p.highlight;
        else
          ctx.fillStyle = this.p.fill;
        ctx.strokeStyle = this.p.stroke;
        (this.p.radius > 0) ? this.drawRadius(ctx) : this.drawSquare(ctx);
      }
    }, Mojo.UI);

    Mojo.defType(["Text", Mojo.Sprite], {
      init: function(p,defaults) {
        this._super(_.patch(_.inject({},p),defaults),{
          size: 24,
          lineHeight: 1.2,
          align: "center",
          type: Mojo.E_UI
        });
        //this.el = document.createElement("canvas");
        //this.ctx = this.el.getContext("2d");
        if(this.p.label)
          this.calcSize();
        //this.prerender();
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
          if(metrics.width >  p.w) {
            p.w = metrics.width;
          }
        });
        p.lineHeightPx = p.size * p.lineHeight;
        p.h = p.lineHeightPx * this.splitLabel.length;
        p.halfLeading = 0.5 * p.size * Math.max(0, p.lineHeight - 1);
        p.cy = 0;
        if(p.align === "center"){
           p.cx = p.w / 2;
           p.points = [
              [ -p.cx, 0],
              [ p.cx, 0],
              [ p.cx, p.h ],
              [ -p.cx, p.h ]
           ];
        } else if (p.align === "right"){
           p.cx = p.w;
           p.points = [
              [ -p.w, 0],
              [ 0, 0],
              [ 0, p.h ],
              [ -p.w, p.h ]
           ];
        } else {
           p.cx = 0;
           p.points = [
              [ 0, 0],
              [ p.w, 0],
              [ p.w, p.h ],
              [ 0, p.h ]
           ];
        }
      },
      prerender: function() {
        if(this.p.oldLabel === this.p.label) { return; }
        this.p.oldLabel = this.p.label;
        this.calcSize();
        this.el.width = this.p.w;
        this.el.height = this.p.h * 4;
        this.ctx.clearRect(0,0,this.p.w,this.p.h);
        this.ctx.fillStyle = "#FF0";
        this.ctx.fillRect(0,0,this.p.w,this.p.h/2);
        this.setFont(this.ctx);
        this.ctx.fillText(this.p.label,0,0);
      },
      draw: function(ctx) {
        let p = this.p;
         //this.prerender();
        if(p.opacity === 0) { return; }
        if(p.oldLabel !== p.label) { this.calcSize(); }
        this.setFont(ctx);
        if(p.opacity !== undefined) ctx.globalAlpha = p.opacity;
        for(let i=0,z=this.splitLabel.length;i<z;++i) {
          let obj=this.splitLabel[i];
          if(p.outlineWidth)
            ctx.strokeText(obj,0, p.halfLeading + i * p.lineHeightPx);
          ctx.fillText(obj,0, p.halfLeading + i * p.lineHeightPx);
        };
      },
      asset: function() { return this.el; },
      setFont: function(ctx) {
        ctx.textBaseline = "top";
        ctx.font= this.font();
        ctx.fillStyle = this.p.color || "black";
        ctx.textAlign = this.p.align || "left";
        ctx.lineWidth = this.p.outlineWidth || 0;
        ctx.strokeStyle = this.p.outlineColor || "black";
      },
      font: function() {
        if(!this.fontString)
          this.fontString = (this.p.weight || "800") + " " +
                            (this.p.size || 24) + "px " +
                            (this.p.family || "Arial");
        return this.fontString;
      }
    }, Mojo.UI);

    Mojo.defType(["Button", Mojo.UI.Container], {
      init: function(p, callback, defaults) {
        this._super(_.patch(_.inject({},p),defaults),{
          keyActionName: null,
          type: Mojo.E_UI | Mojo.E_DEFAULT
        });
        if(this.p.label &&
           (!this.p.w || !this.p.h)) {
          Mojo.ctx.save();
          this.setFont(Mojo.ctx);
          let metrics = Mojo.ctx.measureText(this.p.label);
          Mojo.ctx.restore();
          if(!this.p.h) this.p.h = 24 + 20;
          if(!this.p.w) this.p.w = metrics.width + 20;
        }
        if(isNaN(this.p.cx)) this.p.cx = this.p.w / 2;
        if(isNaN(this.p.cy)) this.p.cy = this.p.h / 2;
        this.callback = callback;
        Mojo.EventBus.sub("touchEnd",this,"push");
        Mojo.EventBus.sub("touch",this,"highlight");
        if(this.p.keyActionName)
          Mojo.EventBus.sub(this.p.keyActionName,Mojo.input,"push",this);
      },
      highlight: function() {
        if(this.sheet() !== undefined &&
           this.sheet().frames > 1) { this.p.frame = 1; }
      },
      push: function() {
        this.p.frame = 0;
        this.callback && this.callback();
        Mojo.EventBus.pub("click",this);
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
      },
      setFont: function(ctx) {
        ctx.textBaseline = "middle";
        ctx.font = this.p.font || "400 24px arial";
        ctx.fillStyle = this.p.fontColor || "black";
        ctx.textAlign = "center";
      }
    }, Mojo.UI);

    Mojo.defType(["IFrame", Mojo.Sprite], {
      init: function(p) {
        this._super(p, { opacity: 1,
                         type: Mojo.E_UI | Mojo.E_DEFAULT });
        Mojo.wrapper.style.overflow = "hidden";
        this.iframe = document.createElement("IFRAME");
        this.iframe.setAttribute("src",this.p.url);
        this.iframe.style.position = "absolute";
        this.iframe.style.zIndex = 500;
        this.iframe.setAttribute("width",this.p.w);
        this.iframe.setAttribute("height",this.p.h);
        this.iframe.setAttribute("frameborder",0);

        if(this.p.background)
          this.iframe.style.backgroundColor = this.p.background;

        Mojo.wrapper.appendChild(this.iframe);
        Mojo.EventBus.sub("inserted",this, function(parent) {
          this.positionIFrame();
          Mojo.EventBus.sub("disposed",parent,"remove",this);
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

          this.iframe.style.top = (y - this.p.cy) + "px";
          this.iframe.style.left = (x - this.p.cx) + "px";
          this.iframe.style.opacity = this.p.opacity;

          this.oldX = x;
          this.oldY = y;
          this.oldOpacity = this.p.opacity;
        }
      },
      step: function(dt) {
        this._super(dt);
        this.positionIFrame();
      },
      remove: function() {
        if(this.iframe) {
          Mojo.wrapper.removeChild(this.iframe);
          this.iframe = null;
        }
      }
    }, Mojo.UI);

    Mojo.defType(["HTMLElement", Mojo.Sprite], {
      init: function(p) {
        this._super(p, { opacity: 1, type: Mojo.E_UI  });

        Mojo.wrapper.style.overflow = "hidden";

        this.el = document.createElement("div");
        this.el.innerHTML = this.p.html;

        Mojo.wrapper.appendChild(this.el);
        Mojo.EventBus.sub("inserted",this, function(parent) {
          this.position();
          Mojo.EventBus.sub("disposed", parent,"remove",this);
          Mojo.EventBus.sub("clear", parent,"remove",this);
        });
      },

      position: function() {},
      step: function(dt) {
        this._super(dt);
        this.position();
      },
      remove: function() {
        if(this.el) {
          Mojo.wrapper.removeChild(this.el);
          this.el= null;
        }
      }
    },Mojo.UI);

    Mojo.defType(["VerticalLayout", Mojo.Sprite], {
      init: function(p) {
        this.children = [];
        this._super(p, { type: Mojo.E_NONE});
      },
      insert: function(sprite) {
        this.scene.insert(sprite,this);
        this.relayout();
        // Bind to dispose
        return sprite;
      },
      relayout: function() {
        let totalHeight = 0;
        this.children.forEach(c => {
          totalHeight += c.p.h || 0;
        });
        // Center?
        let totalSepartion = this.p.h - totalHeight;
        // Make sure all elements have the same space between them
      }
    },Mojo.UI);


    return Mojo;
  };

})(this);


