(function(global, undefined){

  let MOjoH5=global.MojoH5,
      window=global,
      document=window.document;

  MojoH5.DOM = function(Mojo) {
    let _=Mojo.u,
        is=Mojo.is;

    Mojo.setupDOM = function(id,options) {
      options = options || {};
      id = id || "mojo";
      Mojo.el = document.getElementById(id);
      if(!Mojo.el) {
        Mojo.el=document.createElement("div");
        Mojo.el.setAttribute("id",id);
        Mojo.el.style.width= "320px";
        Mojo.el.style.height= "480px";
        document.body.appendChild(Mojo.el);
      }
      if(options.maximize) {
        let h = window.innerHeight-10;
        let w = window.innerWidth-1;
        Mojo.el.style.width= "" + w + "px";
        Mojo.el.style.height= "" + h + "px";
      }

      let parent=Mojo.el.parentNode;
      let container=document.createElement("div");
      container.setAttribute("id",id+"_container");
      container.style.height= Mojo.el.style.height;
      container.style.width= Mojo.el.style.width;
      container.style.margin="0 auto";
      container.appendChild(Mojo.el);
      parent.appendChild(container);
      Mojo.wrapper=container;

      Mojo.el.style.position= "relative";
      Mojo.el.style.overflow= "hidden";
      Mojo.width = parseInt(Mojo.el.style.width);
      Mojo.height = parseInt(Mojo.el.style.height);

      _.timer(() => { window.scrollTo(0,1); }, 0);

      window.addEventListener('orientationchange',() => {
        _.timer(() => { window.scrollTo(0,1); }, 0);
      });

      return Mojo;
    };

    let prefixNames = [ "", "-webkit-", "-moz-", "-ms-" ];
    let has3d = "WebKitCSSMatrix" in window &&
                "m11" in new window.WebKitCSSMatrix();
    let dummyStyle= document.createElement("div").style;

    (function() {
      let translateBuilder= (attribute) => {
        return (dom,x,y) => {
          dom.style[attribute] = "translate(" + _.floor(x) + "px," + _.floor(y) + "px)";
        };
      };
      let translate3DBuilder= (attribute) => {
        return (dom,x,y) => {
          dom.style[attribute] = "translate3d(" + _.floor(x) + "px," + _.floor(y) + "px,0px)";
        };
      };
      let scaleBuilder= (attribute) => {
        return (dom,scale) => {
          dom.style[attribute + "Origin"] = "0% 0%";
          dom.style[attribute] = "scale(" + scale + ")";
        };
      };
      let fallbackTranslate = (dom,x,y) => {
        dom.style.left = x + "px";
        dom.style.top = y + "px";
      };

      let transformMtds = ["transform",
                            "webkitTransform",
                            "MozTransform",
                            "msTransform"];
      for(let tn, i=0;i<transformMtds.length;++i) {
        tn = transformMtds[i];
        if(!is.undef(dummyStyle[tn])) {
          if(has3d)
            Mojo.positionDOM = translate3DBuilder(tn);
          else
            Mojo.positionDOM = translateBuilder(tn);
          Mojo.scaleDOM = scaleBuilder(tn);
          break;
        }
      }

      Mojo.positionDOM = Mojo.positionDOM || fallbackTranslate;
      Mojo.scaleDOM = Mojo.scaleDOM || function(scale) {};

    })();

    (function() {
      let transitionBuilder= (attribute,prefix) => {
        return (dom,property,sec,easing) => {
          easing = easing || "";
          if(property === "transform") {
            property = prefix + property;
          }
          sec = sec || "1s";
          dom.style[attribute] = property + " " + sec + " " + easing;
        };
      };

      let transitionMtds = ["transition", "webkitTransition", "MozTransition", "msTransition"];
      let fallbackTransition = () => { };
      for(let tn,pn,i=0;i<transitionMtds.length;++i) {
        tn = transitionMtds[i];
        pn = prefixNames[i];
        if(!is.undef(dummyStyle[tn])) {
          Mojo.transitionDOM = transitionBuilder(tn,pn);
          break;
        }
      }

      if(!Mojo.transitionDOM)
        Mojo.transitionDOM = fallbackTransition;

    })();

    Mojo.defType(["DOMSprite", Mojo.Sprite], {
      init: function(props) {
        this._super(props);
        this.dom= document.createElement("div");
        this.dom.style.width= "" + this.p.w + "px";
        this.dom.style.height= "" + this.p.h + "px";
        this.dom.style.zIndex= this.p.z || 0;
        this.dom.style.position= "absolute";
        this.rp = {};
        this.setImage();
        this.setTransform();
      },

      setImage: function() {
        let asset;
        if(this.sheet())
          asset = Mojo.asset(this.sheet().asset);
        else
          asset = this.asset();
        if(asset)
          this.dom.style.backgroundImage = "url(" + asset.src + ")";
      },

      setTransform: function() {
        let p = this.p;
        let rp = this.rp;
        if(rp.frame !== p.frame) {
          if(p.sheet)
            this.dom.style.backgroundPosition =
                (-this.sheet().fx(p.frame)) + "px " +
                (-this.sheet().fy(p.frame)) + "px";
          else
            this.dom.style.backgroundPosition = "0px 0px";
          rp.frame = p.frame;
        }
        if(rp.x !== p.x || rp.y !== p.y) {
          Mojo.positionDOM(this.dom,p.x,p.y);
          rp.x = p.x;
          rp.y = p.y;
        }
      },

      hide: function() {
        this.dom.style.display = "none";
      },

      show: function() {
        this.dom.style.display = "block";
      },

      render:function(ctx) {

      },

      draw: function(ctx) {
        Mojo.EventBus.pub("draw",this);
      },

      step: function(dt) {
        Mojo.EventBus.pub("step",this,dt);
        this.setTransform();
      },

      dispose: function() {
        if(this.isDead) { return false; }
        this._super();
        this.dom.remove();
      }

    });

    Mojo.defType(["DOMStage",Mojo.Layer],{
      init: function(scene) {
        this.el=document.createElement("div");
        this.el.style.top= "0";
        this.el.style.position="relative";
        Mojo.el.appendChild(this.el);
        this.dom = this.el;

        let parent=this.el.parentNode;
        let container=document.createElement("div");
        container.style.left= "0";
        container.style.top= "0";
        container.style.position="absolute";
        container.appendChild(this.el);
        parent.appendChild(container);
        this.wrapper=container;
        this.scale = 1;
        this.wrapper_dom = this.wrapper;
        this._super(scene);
      },

      insert: function(itm) {
        itm.dom &&
          this.dom.appendChild(itm.dom);
        return this._super(itm);
      },

      dispose: function() {
        this.wrapper.remove();
        this._super();
      },

      rescale: function(scale) {
        this.scale = scale;
        Mojo.scaleDOM(this.wrapper_dom,scale);
      },

      centerOn: function(x,y) {
        this.x = Mojo.width/2/this.scale -  x;
        this.y = Mojo.height/2/this.scale - y;
        Mojo.positionDOM(this.dom,this.x,this.y);
      }
    });

    Mojo.domOnly = function() {
      Mojo.Layer = Mojo.DOMStage;
      Mojo.prologue = Mojo.setupDOM;
      Mojo.Sprite = Mojo.DOMSprite;
      return Mojo;
    };

    Mojo.defType(["DOMTileMap", Mojo.DOMSprite], {
      // Expects a sprite sheet, along with cols and rows properties
      init:function(props) {
        let sheet = Mojo.sheet(props.sheet);
        this._super(_.inject(props,{
          w: props.cols * sheet.tileW,
          h: props.rows * sheet.tileH,
          tileW: sheet.tileW,
          tileH: sheet.tileH
        }));
        this.shown = [];
        this.domTiles = [];
      },

      setImage: function() { },

      setup: function(tiles,hide) {
        this.tiles = tiles;
        for(let y=0,height=tiles.length;y<height;++y) {
          this.domTiles.push([]);
          this.shown.push([]);
          for(let x=0,width=tiles[0].length;x<width;++x) {
            let domTile = this._addTile(tiles[y][x]);
            if(hide) { domTile.style.visibility = "hidden"; }
            this.shown.push(hide ? false : true);
            this.domTiles[y].push(domTile);
          }
        }
      },

      _addTile: function(frame) {
        let p = this.p;
        let div = document.createElement("div");
        div.style.width = "" + p.tileW + "px";
        div.style.height = "" + p.tileH + "px";
        div.style.styleFloat = div.style.cssFloat = "left";
        this._setTile(div,frame);
        this.dom.appendChild(div);
        return div;
      },

      _setTile: function(dom,frame) {
        let asset = Mojo.asset(this.sheet().asset);
        dom.style.backgroundImage = "url(" + asset.src + ")";
        dom.style.backgroundPosition = (-this.sheet().fx(frame)) +"px " + (-this.sheet().fy(frame)) + "px";
      },

      validTile: function(x,y) {
        return (y >= 0 && y < this.p.rows) &&
               (x >= 0 && x < this.p.cols);
      },

      get: function(x,y) { return this.validTile(x,y) ?
                                  this.tiles[y][x] : null; },

      getDom: function(x,y) { return this.validTile(x,y) ?
                                     this.domTiles[y][x] : null; },

      set: function(x,y,frame) {
        if(!this.validTile(x,y)) { return; }
        this.tiles[y][x] = frame;
        let domTile = this.getDom(x,y);
        this._setFile(domTile,frame);
      },

      show: function(x,y) {
        if(!this.validTile(x,y)) { return; }
        if(this.shown[y][x]) { return; }
        this.getDom(x,y).style.visibility = "visible";
        this.shown[y][x] = true;
      },

      hide: function(x,y) {
        if(!this.validTile(x,y)) { return; }
        if(!this.shown[y][x]) { return; }
        this.getDom(x,y).style.visibility = "hidden";
        this.shown[y][x] = false;
      }
    });


    return Mojo;
  };

})(this);


