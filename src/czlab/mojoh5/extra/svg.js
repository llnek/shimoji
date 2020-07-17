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

(function(global,undefined) {
  "use strict";
  let SVG_NS ="http://www.w3.org/2000/svg",
      MojoH5=global.MojoH5,
      window=global,
      document=window.document;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.SVG = function(Mojo) {
    let _=Mojo.u,
        is=Mojo.is, EBus=Mojo.EventBus;

    Mojo.SVG={};
    Mojo.SVG.prologue = function(Mojo) {
      //overrides
      Mojo.Scene = Mojo.SVGScene;
      Mojo.Sprite = Mojo.SVGSprite;
      Mojo.MovableSprite = Mojo.SVGSprite;

      Mojo.svg =is.str(Mojo.o.id) ? Mojo.domById(Mojo.o.id) : Mojo.o.id;
      if(!Mojo.svg) {
        Mojo.svg = document.createElementNS(SVG_NS,"svg");
        Mojo.domAttrs(Mojo.svg, {width: 320, height: 420});
        Mojo.domConj(Mojo.svg,document.body);
      }

      if(Mojo.o.maximize) {
        let h = window.innerHeight-10;
        let w = window.innerWidth-1;
        Mojo.domAttrs(Mojo.svg, {width: w, height: h});
      }

      Mojo.height = Mojo.svg.getAttribute("height");
      Mojo.width = Mojo.svg.getAttribute("width");

      let parent=Mojo.svg.parentNode;
      let container=Mojo.domCtor("div");
      Mojo.domAttrs(container, "id", Mojo.o.id+"_container");
      Mojo.domCss(container, {height: Mojo.height+"px",
                              width: Mojo.width+"px",
                              margin: "0 auto"});
      Mojo.domConj(Mojo.svg,container);
      Mojo.domConj(container,parent);
      Mojo.wrapper=container;
      Mojo.scrollTop();
      return Mojo;
    };

    /**
     * @public
     * @class
     */
    Mojo.defType(["SVGSprite",Mojo.MovableSprite],{
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
          this.svg &&
            this.svg.setAttribute('transform',transform);
          rp.angle = p.angle;
          rp.x = p.x;
          rp.y = p.y;
        }
      },
      render: function(ctx) {
        EBus.pub([["predraw",this,ctx]
                  ["beforedraw",this,ctx]]);
        this.draw(ctx);
        EBus.pub("beforedraw",this,ctx);
      },
      draw: function(ctx) {
      },
      step: function(dt) {
        EBus.pub("step",this,dt);
        this.setTransform();
      }
    },Mojo);

    /**
     * @public
     * @class
     */
    Mojo.defType(["SVGScene",Mojo.Scene],{
      init: function(scene) {
        this.svg = document.createElementNS(SVG_NS,"svg");
        this.svg.setAttribute("width",Mojo.width);
        this.svg.setAttribute("height",Mojo.height);
        Mojo.svg.appendChild(this.svg);
        this.viewBox = { x: 0, y: 0, w: Mojo.width, h: Mojo.height };
        this._super(scene);
      },
      //addRelation: function() { return this; },
      //delRelation: function() { return this; },
      remove:function(itm) {
        if(itm.svg) { this.svg.removeChild(itm.svg); }
        itm.svg=null;
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
        this.svg.setAttribute("viewBox",
                              this.viewBox.x + " " + this.viewBox.y + " " +
                              this.viewBox.w + " " + this.viewBox.h);
      },
      browserToWorld: function(x,y) {
        var m = this.svg.getScreenCTM();
        var p = this.svg.createSVGPoint();
        p.x = x; p.y = y;
        return p.matrixTransform(m.inverse());
      }
    },Mojo);

    return Mojo;
  };


})(this);
