/*global Quintus:false, module:false */

var quintusUI = function(Quintus) {

  "use strict";

  Quintus.UI = function(Q) {
    if(Q._.isUndefined(Quintus.Touch)) {
      throw "Quintus.UI requires Quintus.Touch Module";
    }

    let _ = Q._;
    Q.UI = {};
    Q.UI.roundRect = function(ctx, rect) {
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

    Q.UI.Container = Q.Sprite.extend("UI.Container", {
      init: function(p,defaults) {
        let match, adjustedP = _.clone(p||{});

        if(p && _.isString(p.w) && (match = p.w.match(/^[0-9]+%$/))) {
          adjustedP.w = parseInt(p.w,10) * Q.width / 100;
          adjustedP.x = Q.width/2 - adjustedP.w/2;
        }

        if(p && _.isString(p.h) && (match = p.h.match(/^[0-9]+%$/))) {
          adjustedP.h = parseInt(p.h,10) * Q.height / 100;
          adjustedP.y = Q.height /2 - adjustedP.h/2;
        }

        this._super(_.patch(adjustedP,defaults),{
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
          type: Q.SPRITE_NONE
        });
      },
      insert: function(obj) {
        this.stage.insert(obj,this);
        return obj;
      },
      fit: function(paddingY,paddingX) {
        if(this.children.length === 0) { return; }

        if(paddingY === void 0) { paddingY = 0; }
        if(paddingX === void 0) { paddingX = paddingY; }

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        this.children.forEach(obj => {
          let minObjX = obj.p.x - obj.p.cx,
              minObjY = obj.p.y - obj.p.cy,
              maxObjX = obj.p.x - obj.p.cx + obj.p.w,
              maxObjY = obj.p.y - obj.p.cy + obj.p.h;
          if(minObjX < minX) { minX = minObjX; }
          if(minObjY < minY) { minY = minObjY; }
          if(maxObjX > maxX) { maxX = maxObjX; }
          if(maxObjY > maxY) { maxY = maxObjY; }
        });

        this.p.cx = -minX + paddingX;
        this.p.cy = -minY + paddingY;
        this.p.w = maxX - minX + paddingX * 2;
        this.p.h = maxY - minY + paddingY * 2;

        // Since the original dimensions were changed, update the boundaries so that the collision is calculated correctly
        Q._generatePoints(this, true);
        Q._generateCollisionPoints(this, true);
      },
      addShadow: function(ctx) {
        if(this.p.shadow) {
          let shadowAmount = _.isNumber(this.p.shadow) ? this.p.shadow : 5;
          ctx.shadowOffsetX=shadowAmount;
          ctx.shadowOffsetY=shadowAmount;
          ctx.shadowColor = this.p.shadowColor || "rgba(0,0,50,0.1)";
        }
      },
      clearShadow: function(ctx) {
        ctx.shadowColor = "transparent";
      },
      drawRadius: function(ctx) {
        Q.UI.roundRect(ctx,this.p);
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
        if(this.p.hidden) { return false; }
        if(!this.p.border && !this.p.fill) { return; }

        ctx.globalAlpha = this.p.opacity;
        if(this.p.frame === 1 && this.p.highlight) {
          ctx.fillStyle = this.p.highlight;
        } else {
          ctx.fillStyle = this.p.fill;
        }
        ctx.strokeStyle = this.p.stroke;

        if(this.p.radius > 0) {
          this.drawRadius(ctx);
        } else {
          this.drawSquare(ctx);
        }

      }
    });

    Q.UI.Text = Q.Sprite.extend("UI.Text", {
      init: function(p,defaultProps) {
        this._super(_.patch(p||{},defaultProps),{
          type: Q.SPRITE_UI,
          size: 24,
          lineHeight: 1.2,
          align: 'center'
        });

        //this.el = document.createElement("canvas");
        //this.ctx = this.el.getContext("2d");

        if(this.p.label) {
          this.calcSize();
        }

        //this.prerender();
      },

      calcSize: function() {
        let p = this.p;
        this.setFont(Q.ctx);
        this.splitLabel = p.label.split("\n");
        var maxLabel = "";
        p.w = 0;

        this.splitLabel.forEach(obj => {
          let metrics = Q.ctx.measureText(obj);
          if(metrics.width >  p.w) {
              p.w = metrics.width;
          }
        });

        p.lineHeightPx = p.size * p.lineHeight;
        p.h = p.lineHeightPx * this.splitLabel.length;
        p.halfLeading = 0.5 * p.size * Math.max(0, p.lineHeight - 1);

        p.cy = 0;

        if(p.align === 'center'){
           p.cx = p.w / 2;
           p.points = [
              [ -p.cx, 0],
              [ p.cx, 0],
              [ p.cx, p.h ],
              [ -p.cx, p.h ]
           ];
        } else if (p.align === 'right'){
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
        if(p.opacity !== void 0) { ctx.globalAlpha = p.opacity; }
        for (let i=0,z=this.splitLabel.length;i<z;++i) {
          let obj=this.splitLabel[i];
          if(p.outlineWidth)
            ctx.strokeText(obj,0, p.halfLeading + i * p.lineHeightPx);
          ctx.fillText(obj,0, p.halfLeading + i * p.lineHeightPx);
        };
      },

      asset: function() {
        return this.el;
      },

      setFont: function(ctx) {
        ctx.textBaseline = "top";
        ctx.font= this.font();
        ctx.fillStyle = this.p.color || "black";
        ctx.textAlign = this.p.align || "left";
        ctx.strokeStyle = this.p.outlineColor || "black";
        ctx.lineWidth = this.p.outlineWidth || 0;
      },

      font: function() {
        if(this.fontString) { return this.fontString; }
        this.fontString = (this.p.weight || "800") + " " +
                          (this.p.size || 24) + "px " +
                          (this.p.family || "Arial");
        return this.fontString;
      }

    });

    Q.UI.Button = Q.UI.Container.extend("UI.Button", {
      init: function(p, callback, defaultProps) {
        this._super(_.patch(p||{},defaultProps),{
          type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
          keyActionName: null
        });
        if(this.p.label && (!this.p.w || !this.p.h)) {
          Q.ctx.save();
          this.setFont(Q.ctx);
          let metrics = Q.ctx.measureText(this.p.label);
          Q.ctx.restore();
          if(!this.p.h) {  this.p.h = 24 + 20; }
          if(!this.p.w) { this.p.w = metrics.width + 20; }
        }

        if(isNaN(this.p.cx)) { this.p.cx = this.p.w / 2; }
        if(isNaN(this.p.cy)) { this.p.cy = this.p.h / 2; }
        this.callback = callback;
        this.on('touch',"highlight");
        this.on('touchEnd',"push");
        if(this.p.keyActionName)
          Q.input.on(this.p.keyActionName,"push",this);
      },

      highlight: function() {
        if(typeof this.sheet() !== 'undefined' && this.sheet().frames > 1) {
          this.p.frame = 1;
        }
      },

      push: function() {
        this.p.frame = 0;
        if(this.callback) { this.callback(); }
        this.trigger('click');
      },

      draw: function(ctx) {
        this._super(ctx);

        if(this.p.asset || this.p.sheet) {
          Q.Sprite.prototype.draw.call(this,ctx);
        }

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

    });

    Q.UI.IFrame = Q.Sprite.extend("UI.IFrame", {
      init: function(p) {
        this._super(p, { opacity: 1, type: Q.SPRITE_UI | Q.SPRITE_DEFAULT });

        Q.wrapper.style.overflow = "hidden";

        this.iframe = document.createElement("IFRAME");
        this.iframe.setAttribute("src",this.p.url);
        this.iframe.style.position = "absolute";
        this.iframe.style.zIndex = 500;
        this.iframe.setAttribute("width",this.p.w);
        this.iframe.setAttribute("height",this.p.h);
        this.iframe.setAttribute("frameborder",0);

        if(this.p.background)
          this.iframe.style.backgroundColor = this.p.background;

        Q.wrapper.appendChild(this.iframe);
        this.on("inserted",function(parent) {
          this.positionIFrame();
          parent.on("disposed","remove",this);
        });
      },

      positionIFrame: function() {
        var x = this.p.x;
        var y = this.p.y;
        if(this.stage.viewport) {
          x -= this.stage.viewport.x;
          y -= this.stage.viewport.y;
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
          Q.wrapper.removeChild(this.iframe);
          this.iframe = null;
        }
      }
    });

    Q.UI.HTMLElement = Q.Sprite.extend("UI.HTMLElement", {
      init: function(p) {
        this._super(p, { opacity: 1, type: Q.SPRITE_UI  });

        Q.wrapper.style.overflow = "hidden";

        this.el = document.createElement("div");
        this.el.innerHTML = this.p.html;

        Q.wrapper.appendChild(this.el);
        this.on("inserted",function(parent) {
          this.position();
          parent.on("disposed","remove",this);
          parent.on("clear","remove",this);
        });
      },

      position: function() {},

      step: function(dt) {
        this._super(dt);
        this.position();
      },

      remove: function() {
        if(this.el) {
          Q.wrapper.removeChild(this.el);
          this.el= null;
        }
      }
    });

    Q.UI.VerticalLayout = Q.Sprite.extend("UI.VerticalLayout",{

      init: function(p) {
        this.children = [];
        this._super(p, { type: 0 });
      },

      insert: function(sprite) {
        this.stage.insert(sprite,this);
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
    });

  };

};

if(typeof Quintus === 'undefined') {
  module.exports = quintusUI;
} else {
  quintusUI(Quintus);
}


