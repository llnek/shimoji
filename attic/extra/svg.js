(function(global,undefined) {

  "use strict";
  let SVG_NS ="http://www.w3.org/2000/svg";
  let window=global,
      document=window.document;

  MojoH5.SVG = function(Mojo) {
    let _=Mojo.u,
        is=Mojo.is;

    Mojo.setupSVG = function(id,options) {
      options = options || {};
      id = id || "mojo";
      Mojo.svg =is.str(id) ? document.getElementById(id) : id;

      if(!Mojo.svg) {
        Mojo.svg = document.createElementNS(SVG_NS,"svg");
        Mojo.svg.setAttribute("width",320);
        Mojo.svg.setAttribute("height",420);
        document.body.appendChild(Mojo.svg);
      }

      if(options.maximize) {
        let h = window.innerHeight-10;
        let w = window.innerWidth-1;
        Mojo.svg.setAttribute("width",w);
        Mojo.svg.setAttribute("height",h);
      }

      Mojo.height = Mojo.svg.getAttribute("height");
      Mojo.width = Mojo.svg.getAttribute("width");

      let parent=Mojo.svg.parentNode;
      let container=document.createElement("div");
      container.setAttribute("id",id+"_container");
      container.style.height=Mojo.height;
      container.style.width=Mojo.width;
      container.style.margin="0 auto";
      container.appendChild(Mojo.svg);
      parent.appendChild(container);
      Mojo.wrapper=container;

      _.timer(() => { window.scrollTo(0,1); }, 0);
      window.addEventListener('orientationchange',() => {
        _.timer(() => { window.scrollTo(0,1); }, 0);
      });

      return Mojo;
    };

    Mojo.defType(["SVGSprite",Mojo.Sprite],{
      init: function(props) {
        this._super(_.patch(props,{shape: 'block',
          color: 'black',
          angle: 0,
          active: true,
          cx: 0,
          cy: 0
        }));
        this.createShape();
        this.svg.sprite = this;
        this.rp = {};
        this.setTransform();
      },

      set: function(attr) {
        _.doseq(attr,function(value,key) {
          this.svg.setAttribute(key,value);
        },this);
      },

      createShape: function() {
        let p = this.p;
        switch(p.shape) {
          case 'block':
            this.svg = document.createElementNS(SVG_NS,'rect');
            _.inject(p,{ cx: p.w/2, cy: p.h/2 });
            this.set({ width: p.w, height: p.h });
            break;
          case 'circle':
            this.svg = document.createElementNS(SVG_NS,'circle');
            this.set({ r: p.r, cx: 0, cy: 0 });
            break;
          case 'polygon':
            this.svg = document.createElementNS(SVG_NS,'polygon');
            let pts = _.map(p.points,
                            function(pt) {
                              return pt[0] + "," + pt[1];
                            }).join(" ");
            this.set({ points: pts });
            break;
        }
        this.set({ fill: p.color });
        if(p.outline) {
          this.set({
            stroke: p.outline,
            "stroke-width": p.outlineWidth || 1
          });
        }
      },

      setTransform: function() {
        let p = this.p;
        let rp = this.rp;
        if(rp.x !== p.x ||
           rp.y !== p.y ||
           rp.angle !== p.angle ) {
          let transform = "translate(" + (p.x - p.cx) + "," +
                                         (p.y - p.cy) + ") " +
                          "rotate(" + p.angle +
                                  "," + p.cx +
                                  "," + p.cy +
                                  ")";
          this.svg.setAttribute('transform',transform);
          rp.angle = p.angle;
          rp.x = p.x;
          rp.y = p.y;
        }
      },
      render: function(ctx) {

        Mojo.EventBus.pub('predraw',this,ctx);
        Mojo.EventBus.pub('beforedraw',this,ctx);
        this.draw(ctx);
        Mojo.EventBus.pub('beforedraw',this,ctx);
      },
      draw: function(ctx) {
      },

      step: function(dt) {
        Mojo.EventBus.pub('step',this,dt);
        this.setTransform();
      }
    });

    Mojo.defType(["SVGScene",Mojo.Scene],{
      init: function(scene) {
        this.svg = document.createElementNS(SVG_NS,'svg');
        this.svg.setAttribute('width',Mojo.width);
        this.svg.setAttribute('height',Mojo.height);
        Mojo.svg.appendChild(this.svg);

        this.viewBox = { x: 0, y: 0, w: Mojo.width, h: Mojo.height };
        this._super(scene);
      },
      //addRelation: function() { return this; },
      //delRelation: function() { return this; },
      remove:function(itm){
        if(itm.svg) { this.svg.removeChild(itm.svg); }
        return this._super(itm);
      },
      insert: function(itm) {
        if(itm.svg) { this.svg.appendChild(itm.svg); }
        return this._super(itm);
      },
      dispose: function() {
        Mojo.svg.removeChild(this.svg);
        this._super();
      },
      viewport: function(w,h) {
        this.viewBox.w = w;
        this.viewBox.h = h;
        if(this.viewBox.cx || this.viewBox.cy) {
          this.centerOn(this.viewBox.cx,
                        this.viewBox.cy);
        } else {
          this.setViewBox();
        }
      },

      centerOn: function(x,y) {
        this.viewBox.cx = x;
        this.viewBox.cy = y;
        this.viewBox.x = x - this.viewBox.w/2;
        this.viewBox.y = y - this.viewBox.h/2;
        this.setViewBox();
      },

      setViewBox: function() {
        this.svg.setAttribute('viewBox',
                              this.viewBox.x + " " + this.viewBox.y + " " +
                              this.viewBox.w + " " + this.viewBox.h);
      },

      browserToWorld: function(x,y) {
        var m = this.svg.getScreenCTM();
        var p = this.svg.createSVGPoint();
        p.x = x; p.y = y;
        return p.matrixTransform(m.inverse());
      }
    });

    Mojo.svgOnly=function() {
      Mojo.Scene = Mojo.SVGScene;
      Mojo.prologue = Mojo.setupSVG;
      Mojo.Sprite = Mojo.SVGSprite;
      return Mojo;
    };

    return Mojo;
  };


})(this);
