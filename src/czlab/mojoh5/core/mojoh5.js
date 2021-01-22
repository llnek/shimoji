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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(global){
  "use strict";
  let window;
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }else if(typeof exports === "object" && exports){
    global=exports;
  }else{
    window=global;
  }

  if(!window)
    throw "Fatal: no browser.";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /** Supported file extensions. */
  const FONT_EXTS = ["ttf", "otf", "ttc", "woff"];
  const AUDIO_EXTS= ["mp3", "wav", "ogg", "webm"];
  const IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"];

  /**
   * @private
   * @function
   */
  function _winWidth(){
    return window.innerWidth
    //return window.document.documentElement.clientWidth
  }
  function _winHeight(){
    return window.innerHeight
    //return window.document.documentElement.clientHeight
  }
  /**
   * @private
   * @function
   */
  function _MojoH5(cmdArg, _sounds, _fonts, _spans){
    const {EventBus,dom,is,u:_} = global["io/czlab/mcfud/core"]();
    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      //i:{pos:true,scale:true} //alpha:true, //size:true
    });
    /**Built-in progress bar, shown during the loading of asset files
     * if no user-defined load function is provided in the config options.
     * @private
     * @function
     */
    function _PBar(Mojo,f,p,handle){
      const {Sprites}=Mojo;
      if(!handle){
        let h2= Mojo.height/2|0;
        let w2= Mojo.width/2|0;
        let bgColor=0x808080;
        let fgColor=0x00FFFF;
        //make a progress bar
        handle={
          dispose(){ Sprites.remove(this.fg,this.bg,this.perc) },
          width:w2,
          fg:Sprites.rectangle(w2, 32, fgColor),
          bg:Sprites.rectangle(w2, 32, bgColor),
          perc:Sprites.text("0%", {fontSize:28,
                                   fill:"black",
                                   fontFamily:"sans-serif"})
        };
        Sprites.setXY(handle.bg, w2 - (w2/2|0), h2-16);
        Sprites.setXY(handle.fg, w2 - (w2/2|0), h2-16);
        Sprites.setXY(handle.perc, w2 - (w2/2|0) + 12,  h2-17);
        Sprites.add(Mojo.stage,handle.bg,handle.fg,handle.perc);
      }else{
        handle.perc.m5.content(`${Math.round(p)}%`);
        handle.fg.width = handle.width * (p/100|0);
        console.log(`file= ${f}, progr= ${p}`);
      }
      return handle;
    }
    /**Scale canvas to max via css.
     * @private
     * @function
     */
    function _scaleCanvas(canvas){
      let CH=canvas.offsetHeight;
      let CW=canvas.offsetWidth;
      let WH=_winHeight();
      let WW=_winWidth();
      let K = _.min(WW/CW, WH/CH);
      let scaledH=CH*K;
      let scaledW=CW*K;
      dom.css(canvas, {transformOrigin:"0 0",
                       transform:`scale(${K})`});
      if(!Mojo.maxed){
        //lay flat
        if(CW>CH ? scaledW<WW : !(scaledH>WH)){
          let margin = (WW-scaledW)/2 |0;
          dom.css(canvas, {marginTop:"0px",
                           marginBottom:"0px",
                           marginLeft:`${margin}px`,
                           marginRight:`${margin}px`});
        }else{
          let margin = (WH-scaledH)/2 |0;
          dom.css(canvas, {marginLeft:"0px",
                           marginRight:"0px",
                           marginTop:`${margin}px`,
                           marginBottom:`${margin}px`});
        }
        dom.css(canvas, {display:"block",
                         paddingLeft:"0px",
                         paddingRight:"0px",
                         paddingTop:"0px",
                         paddingBottom:"0px"});
        dom.css(document.body, "backgroundColor", Mojo.scaledBorderColor);
      }
      return K;
    }
    /** Once all the files are loaded, do some post processing.
     * @private
     * @function
     */
    function _onAssetLoaded(Mojo,ldrObj,handle){
      const {Sound} = Mojo;
      let files = 0;
      function _finz(){
        //clean up a whole bunch of stuff used during bootstrap
        _spans.forEach(e=> dom.css(e, "display", "none"));
        //get rid of any loading scene
        ldrObj && Mojo.delBgTask(ldrObj);
        //clean up user handle
        handle && handle.dispose && handle.dispose();
        //finally run the user start function
        Mojo.o.start(Mojo);
      }
      function _dec(){ --files=== 0 && _finz() }
      //process audio files
      _.doseq(Mojo.PXLoader.resources, (r,k)=>{
        let s,ext= _.fileExt(k);
        if(_.has(AUDIO_EXTS,ext)){
          files += 1;
          s=_sounds[r.name]= Sound.decodeContent(r.url, r.xhr.response, _dec);
          s.name=r.name;
          console.log(`decoded sound file: ${r.name}`);
        }
      });
      //nothing to load, just do it
      files===0 && _finz();
    }
    /** Fetch required files.
     * @private
     * @function
     */
    function _loadFiles(Mojo){
      let filesToLoad = _.map(Mojo.o.assetFiles || [], f=> Mojo.assetPath(f));
      let ffiles = _.findFiles(filesToLoad, FONT_EXTS);
      let {PXLR,PXLoader}= Mojo;
      //common hack to trick brower to load in font files.
      _.doseq(ffiles,s=>{
        let newStyle = dom.newElm("style");
        let family = s.split("/").pop().split(".")[0];
        let face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        let span = dom.newElm("span");
        console.log(`fontface = ${face}`);
        _.conj(_fonts,family);
        dom.conj(newStyle,dom.newTxt(face));
        dom.conj(document.head,newStyle);
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
        _.conj(_spans,span);
      });
      _.doseq(AUDIO_EXTS, e=>{
        PXLR.setExtensionLoadType(e, PXLR.LOAD_TYPE.XHR);
        PXLR.setExtensionXhrType(e, PXLR.XHR_RESPONSE_TYPE.BUFFER);
      });
      PXLoader.reset();
      if(filesToLoad.length>0){
        let cb= Mojo.o.load || _PBar;
        let handle;
        let fs=[];
        let pg=[];
        PXLoader.add(filesToLoad);
        PXLoader.onProgress.add((ld,r)=>{
          fs.unshift(r.url);
          pg.unshift(ld.progress);
        });
        PXLoader.load(()=> console.log("loaded!"));
        Mojo.addBgTask({
          update(){
            let f= fs.pop();
            let n= pg.pop();
            if(f && is.num(n))
              handle=cb(Mojo,f,n,handle);
            n===100 && _onAssetLoaded(Mojo,this,handle);
          }
        });
      }else{
        //no asset, call user start function right away
        _onAssetLoaded(Mojo);
      }
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    }
    /**
     * @private
     * @function
     */
    function _prologue(Mojo,cmdArg){
      _.assert(cmdArg.arena,"Missing design resolution.");
      function _runM(m){
        console.log(`installing module ${m}...`);
        global[`io/czlab/mojoh5/${m}`](Mojo)
      }
      let maxed=false;
      let box= cmdArg.arena;
      let S= new Mojo.PXContainer();
      Mojo.designSize= cmdArg.arena;
      if(cmdArg.scaleToWindow==="max"){
        maxed=true;
        box= {width: _winWidth(),
              height: _winHeight()};
      }
      Mojo.ctx= PIXI.autoDetectRenderer(box);
      Mojo.ctx.bgColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.maxed=maxed;
      _.doseq(_.seq("Sprites,Input,Touch,Scenes,Sound"), _runM);
      _.doseq(_.seq("FX,2d,Tiles,GameLoop"), _runM);
      if(cmdArg.border)
        dom.css(Mojo.canvas, "border", cmdArg.border);
      if(cmdArg.bgColor !== undefined){
        Mojo.ctx.bgColor = Mojo["Sprites"].color(cmdArg.bgColor);
      }
      dom.conj(document.body, Mojo.canvas);
      Mojo.scaledBorderColor= cmdArg.scaleBorderColor || "#2c3539";
      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo.cmdArg=cmdArg;
      Mojo.stage=S;
      S.m5={stage:true};
      Mojo.EventBus.sub(["canvas.resize"],old=> _.doseq(S.children,s=>s.onCanvasResize(old)));
      _configCSS();
      Mojo.scale=cmdArg.scaleToWindow===true?_scaleCanvas(Mojo.canvas):1;
      Mojo.pointer= Mojo["Input"].pointer(Mojo.canvas, Mojo.scale);
      _.addEvent("resize", window, _.debounce(()=>{
        //save the current size
        let h=Mojo.height;
        let w=Mojo.width;
        Mojo.ctx.resize(_winWidth(),_winHeight());
        //tell others the previous size
        Mojo.EventBus.pub(["canvas.resize"],[w,h]);
      },150));
      _loadFiles(Mojo);
      return Mojo;
    }
    /**
     * @private
     * @class
     */
    class GameState{
      constructor(s) {
        this.reset(s);
      }
      reset(s){
        this.o=_.inject({},s);
      }
      get(prop){
        return _.get(this.o,prop);
      }
      _chgp(value,key){
        if(this.o[key] !== value){
          _.assoc(this.o, key, value);
          Mojo.EventBus.pub([`change.${key}`,this],value);
        }
      }
      set(prop,value){
        if(!is.obj(prop))
          this._chgp(value,prop);
        else
          _.doseq(prop,this._chgp,this);
        Mojo.EventBus.pub(["change",this]);
      }
      inc(prop,amount=1){
        let v= this.get(prop);
        if(is.num(v))
          this.set(prop, v + amount);
      }
      dec(prop,amount=1){
        let v=this.get(prop);
        if(is.num(v))
          this.set(prop,v - amount);
      }
    }
    /**
     * @public
     * @var {object}
     */
    let Mojo={
      EVERY:1,
      SOME: 2,
      CENTER:3,
      TOP: 4,
      LEFT: 5,
      RIGHT: 6,
      BOTTOM: 7,
      UP: 8,
      DOWN: 9,
      TOP_LEFT: 10,
      TOP_RIGHT: 11,
      BOTTOM_LEFT: 12,
      BOTTOM_RIGHT: 13,
      NONE: 100,
      TRAPPED: 200,
      Game:{},//{ state: new GameState() },
      EventBus:EventBus(),
      noop: ()=>{},
      u:_, is:is, dom:dom,
      o:cmdArg,
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PXLoader:PIXI.Loader.shared,
      PXTCache:PIXI.utils.TextureCache,
      PXObservablePoint: PIXI.ObservablePoint,
      sideRight(d){ return d===Mojo.RIGHT || d===Mojo.TOP_RIGHT || d===Mojo.BOTTOM_RIGHT },
      sideLeft(d){ return d===Mojo.LEFT || d===Mojo.TOP_LEFT || d===Mojo.BOTTOM_LEFT },
      sideTop(d){ return d===Mojo.TOP || d===Mojo.TOP_LEFT || d===Mojo.TOP_RIGHT },
      sideBottom(d){ return d===Mojo.BOTTOM || d===Mojo.BOTTOM_LEFT || d===Mojo.BOTTOM_RIGHT },
      lerpConfig(){ return this.o.i },
      //does element contains a class name?
      hasClass(e, cls){
        return new RegExp(`(\\s|^)${cls}(\\s|$)`).test(e.className)
      },
      addClass(e, cls){
        if(!_.hasClass(e, cls)) e.className += "" + cls;
        return e;
      },
      removeClass(e, cls){
        if(_.hasClass(e, cls))
          e.className= e.className.replace(new RegExp(`(\\s|^)${cls}(\\s|$)`), "");
        return e;
      },
      wrapv(v, low, high){
        return v<low ? high : (v>high ? low : v)
      },
      get assets(){ return this.PXLoader.resources },
      get width(){ return this.canvas.width },
      get height(){ return this.canvas.height }
    };
    /**
     * @public
     * @function
     */
    Mojo.scaleXY=function(src,des){
      return [ des[0]/src[0], des[1]/src[1] ]
    };
    /**
     * @public
     * @function
     */
    Mojo.scaleSZ=function(src,des){
      return { width: des.width/src.width, height: des.height/src.height }
    };
    /**
     * @public
     * @function
     */
    Mojo.portrait=function(){ return Mojo.height>Mojo.width };
    /**
     * @public
     * @function
     */
    Mojo.screenCenter=function(){
      return _.v2(Mojo.width/2|0,Mojo.height/2|0)
    };
    /**Run a function across all children of the stage object.
     * @public
     * @function
     */
    Mojo.stageCS=function(cb){
      _.doseq(Mojo.stage.children,cb)
    };
    /**Make a new anchor object.
     * @public
     * @function
     */
    Mojo.makeAnchor=function(x,y){
      return new this.PXObservablePoint(Mojo.noop,this,x,y)
    };
    /**
     * @public
     * @function
     */
    function _configCSS(){
      let style = "* {padding: 0; margin: 0}";
      let newStyle = dom.newElm("style");
      dom.conj(newStyle,dom.newTxt(style));
      dom.conj(document.head,newStyle);
    }
    /**
     * @public
     * @function
     * @returns read-only object.
     */
    Mojo.mockStage=function(px=0,py=0){
      return{
        getGlobalPosition(){ return {x:px,y:py} },
        anchor: Mojo.makeAnchor(0,0),
        m5:{stage:true},
        x:px,
        y:py,
        width: Mojo.width,
        height: Mojo.height
      }
    };
    /**Converts the position into a [col, row] for grid oriented processing.
     * @public
     * @function
     */
    Mojo.splitXY=function(pos,width){
      return [pos%width, pos/width|0]
    };
    /**
     * Converts a position to a cell index.
     *
     * @public
     * @function
     * @returns the cell position
     */
    Mojo.getIndex=function(x, y, cellW, cellH, widthInCols){
      if(x<0 || y<0)
        throw `Error: ${x},${y}, values must be positive`;
      return (x/cellW|0) + (y/cellH|0) * widthInCols
    };
    /**
     * @public
     * @function
     */
    Mojo.adjustForStage=function(o){
      return o.m5.stage ? this.mockStage() : o
    };
    /**
     * @public
     * @function
     */
    Mojo.image=function(fname){
      let obj=Mojo.PXTCache[fname];
      if(!obj)
        throw `${fname} not loaded.`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.id=function(frame){
      let obj=Mojo.PXTCache[frame];
      if(!obj)
        throw `${frame} not loaded.`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.json=function(fname){
      let obj=Mojo.PXLoader.resources[fname];
      if(!obj || !obj.data)
        throw `${fname} not loaded.`;
      return obj.data;
    };
    /**
     * @public
     * @function
     */
    Mojo.xml=function(fname){
      let obj=Mojo.PXLoader.resources[fname];
      if(!obj || !obj.data)
        throw `${fname} not loaded.`;
      return obj.data;
    };
    /**
     * @public
     * @function
     */
    Mojo.assetPath=function(fname){
      if(fname.includes("/")) {return fname}
      let ext= _.fileExt(fname);
      let pfx="data";
      if(_.has(IMAGE_EXTS,ext)){
        pfx="images";
      }else if(_.has(FONT_EXTS,ext)){
        pfx="fonts";
      }else if(_.has(AUDIO_EXTS,ext)){
        pfx="audio";
      }
      return `${pfx}/${fname}`;
    };
    /**
     * @public
     * @function
     */
    Mojo.sound=function(fname){
      let obj=_sounds[this.assetPath(fname)];
      if(!obj)
        throw `${fname} not loaded.`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.rect=function(x,y,w,h){
      return new Mojo.PXRectangle(x,y,w,h)
    };
    /**
     * @public
     * @function
     */
    const ScrSize={width:0,height:0};
    const Size11={width:1,height:1};
    Mojo.contentScaleFactor=function(){
      if(Mojo.cmdArg.scaleToWindow!=="max"){
        return Size11;
      }else{
        ScrSize.height=Mojo.height;
        ScrSize.width=Mojo.width;
        return Mojo.scaleSZ(Mojo.designSize,ScrSize);
      }
    };
    /**
     * @public
     * @function
     */
    Mojo.tcached=function(x){
      let t;
      if(x){
        t=this.PXTCache[x];
        if(!t)
          t= this.PXTCache[this.assetPath(x)];
      }
      return t;
    };
    /**
     * @public
     * @function
     */
    Mojo.resources=function(x,panic=0){
      let t;
      if(x){
        t= this.PXLoader.resources[x];
        if(!t)
          t= this.PXLoader.resources[this.assetPath(x)];
      }
      if(!t && panic)
        throw `Error: no such resource ${x}.`;
      return t;
    };
    /**
     * @public
     * @function
     */
    Mojo.textureFromImage=function(x){
      return this.PXTexture.fromImage(x)
    };
    /**
     * @public
     * @function
     */
    Mojo.animFromFrames=function(x){
      return this.PXASprite.fromFrames(x)
    };
    /**
     * @public
     * @function
     */
    Mojo.animFromImages=function(x){
      return this.PXASprite.fromImages(x.map(s => Mojo.assetPath(s)));
    };

    return _prologue(Mojo,cmdArg);
  }

  //window.addEventListener("load", ()=> console.log("MojoH5 loaded!"));
  return window.MojoH5=function(config){
    _MojoH5(config, {}, [], [])
  }

})(this);


