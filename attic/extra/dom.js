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
      Mojo.el = Mojo.domById(id);

      if(!Mojo.el) {
        Mojo.el=Mojo.domCtor("div", {id: id}, {width: "320px",height:"480px"});
        Mojo.domConj(Mojo.el);
      }
      if(options.maximize) {
        Mojo.domCss(Mojo.el, {width: (window.innerWidth-1) + "px",
                              height: (window.innerHeight-10) + "px"});
      }

      Mojo.wrapper= Mojo.domWrap(
        Mojo.el,
        Mojo.domCtor("div",
                     {id: id+"_Wrapper"},
                     {margin: "0 auto",
                      width: Mojo.el.style.width,
                      height: Mojo.el.style.height}));

      Mojo.domCss(Mojo.el, {overflow: "hidden",
                            position: "relative"});

      _.inject(Mojo, {width: parseInt(Mojo.el.style.width),
                      height: parseInt(Mojo.el.style.height)});

      Mojo.handleDeviceFlip();
      Mojo.scrollTop();

      return Mojo;
    };

    let prefixNames = [ "", "-webkit-", "-moz-", "-ms-" ];
    let has3d = "WebKitCSSMatrix" in window &&
                "m11" in new window.WebKitCSSMatrix();
    let dummyStyle= Mojo.domCtor("div").style;

    (function() {
      let translateBuilder= (attr) => {
        return (dom,x,y) => {
          Mojo.domCss(dom,attr,
                      "translate(" + _.floor(x) + "px," + _.floor(y) + "px)");
        };
      };
      let translate3DBuilder= (attr) => {
        return (dom,x,y) => {
          Mojo.domCss(dom,attr,
                      "translate3d(" + _.floor(x) + "px," + _.floor(y) + "px,0px)");
        };
      };
      let scaleBuilder= (attr) => {
        return (dom,scale) => {
          Mojo.domCss(dom, attr + "Origin", "0% 0%");
          Mojo.domCss(dom, attr, "scale(" + scale + ")");
        };
      };
      let fallbackTranslate = (dom,x,y) => {
        Mojo.domCss(dom, {left: x + "px", top: y + "px"});
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
      let transitionBuilder= (attr,prefix) => {
        return (dom,property,sec,easing) => {
          easing = easing || "";
          if(property === "transform") {
            property = prefix + property;
          }
          sec = sec || "1s";
          Mojo.domCss(dom, attr, property + " " + sec + " " + easing);
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
        this.rp = {};
        this.dom= Mojo.domCtor("div", {}, {position: "absolute",
                                           zIndex: this.p.z || 0,
                                           width: this.p.w + "px",
                                           height: this.p.h + "px"});
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
          Mojo.domCss(this.dom, "backgroundImage", "url(" + asset.src + ")");
      },

      setTransform: function() {
        let p = this.p;
        let rp = this.rp;
        if(rp.frame !== p.frame) {
          if(p.sheet)
            Mojo.domCss(this.dom,"backgroundPosition",
                                 (-this.sheet().fx(p.frame)) + "px " +
                                 (-this.sheet().fy(p.frame)) + "px");
          else
            Mojo.domCss(this.dom, "backgroundPosition", "0px 0px");
          rp.frame = p.frame;
        }
        if(rp.x !== p.x || rp.y !== p.y) {
          Mojo.positionDOM(this.dom,p.x,p.y);
          rp.x = p.x;
          rp.y = p.y;
        }
      },

      hide: function() {
        Mojo.domCss(this.dom, "display", "none");
      },

      show: function() {
        Mojo.domCss(this.dom, "display", "block");
      },

      render: function(ctx) {
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

    Mojo.defType(["DOMLayer",Mojo.Layer],{
      init: function(scene) {
        this.dom= Mojo.domCtor("div", {}, {top: "0",
                                           position: "relative"});
        Mojo.domConj(this.dom, Mojo.el);

        this.wrapper_dom= Mojo.domWrap(this.dom,
                                       Mojo.domCtor("div",
                                                    {},
                                                    {top:"0",
                                                     left:"0",
                                                     position:"absolute"}));
        this.scale = 1;
        this._super(scene);
      },
      insert: function(itm) {
        itm.dom &&
          Mojo.domConj(itm.dom,this.dom);
        return this._super(itm);
      },
      dispose: function() {
        this.wrapper_dom.remove();
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
      Mojo.Layer = Mojo.DOMLayer;
      Mojo.Sprite = Mojo.DOMSprite;
      Mojo.prologue = Mojo.setupDOM;
      return Mojo;
    };

    Mojo.defType(["DOMTileMap", Mojo.DOMSprite], {
      // Expects a sprite sheet, along with cols and rows properties
      init:function(props) {
        let sheet = Mojo.sheet(props.sheet);
        this._super(_.inject(props,{tileW: sheet.tileW,
                                    tileH: sheet.tileH,
                                    w: props.cols * sheet.tileW,
                                    h: props.rows * sheet.tileH}));
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
            if(hide)
              Mojo.domCss(domTile, "visibility","hidden");
            this.shown.push(hide ? false : true);
            this.domTiles[y].push(domTile);
          }
        }
      },
      _addTile: function(frame) {
        let div = Mojo.domCtor("div",{},{width: this.tileW + "px",
                                         height: this.tileH + "px",
                                         cssFloat: "left",
                                         styleFloat: "left"});
        this._setTile(div,frame);
        Mojo.domConj(div,this.dom);
        return div;
      },
      _setTile: function(dom,frame) {
        let asset = Mojo.asset(this.sheet().asset);
        Mojo.domCss(dom, {backgroundImage: "url(" + asset.src + ")",
                          backgroundPosition: (-this.sheet().fx(frame)) + "px " +
                                              (-this.sheet().fy(frame)) + "px"});
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
        Mojo.domCss(this.getDom(x,y), "visibility", "visible");
        this.shown[y][x] = true;
      },
      hide: function(x,y) {
        if(!this.validTile(x,y)) { return; }
        if(!this.shown[y][x]) { return; }
        Mojo.domCss(this.getDom(x,y), "visibility", "hidden");
        this.shown[y][x] = false;
      }

    });

    return Mojo;
  };

})(this);


