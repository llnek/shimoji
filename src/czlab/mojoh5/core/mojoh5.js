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

;(function(gscope){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /** Supported file extensions. */
  const FONT_EXTS = ["ttf", "otf", "ttc", "woff"];
  const AUDIO_EXTS= ["mp3", "wav", "ogg"];
  const IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"];

  /**Create the module.
   */
  function _module(cmdArg, _fonts, _spans){

    const {EventBus,dom,is,u:_} = gscope["io/czlab/mcfud/core"]();
    const MFL=Math.floor;
    const CON=console;

    /**
     * @module mojoh5/Mojo
     */

    class PixiStage extends PIXI.Container {
      constructor(){
        super();
        this.m5={ stage:true }
      }
    }

    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      fps: 60
    });

    /** @ignore */
    function _width(){ return gscope.innerWidth }
    //return window.document.documentElement.clientWidth

    /** @ignore */
    function _height(){ return gscope.innerHeight }
    //return window.document.documentElement.clientHeight

    /**Built-in progress bar, shown during the loading of asset files
     * if no user-defined load function is provided in the config options.
     */
    function _PBar(Mojo,f,p,handle){
      const {Sprites}=Mojo;
      if(!handle){
        //first time call
        const cy= MFL(Mojo.height/2);
        const cx= MFL(Mojo.width/2);
        const w4= MFL(Mojo.width/4);
        const RH=24;
        const Y=cy-RH/2;
        const bgColor=0x404040;
        const fgColor=0xff8a00;
        //make a progress bar
        handle={
          dispose(){ Sprites.remove(this.fg,this.bg,this.perc) },
          width:w4*2,
          fg:Sprites.rectangle(cx, RH, fgColor),
          bg:Sprites.rectangle(cx, RH, bgColor),
          perc:Sprites.text("0%", {fontSize:MFL(RH/2),
                                   fill:"black",
                                   fontFamily:"sans-serif"})
        };
        Sprites.add(Mojo.stage,handle.bg,handle.fg,handle.perc);
        Sprites.setXY(handle.bg, cx-w4, Y);
        Sprites.setXY(handle.fg, cx-w4, Y);
        Sprites.setXY(handle.perc, cx-w4+10,  MFL(cy-handle.perc.height/2));
      }else{
        //update the progress
        handle.fg.width = handle.width*(p/100);
        handle.perc.text=`${Math.round(p)}%`;
        CON.log(`file= ${f}, progr= ${p}`);
      }
      return handle;
    }

    /**Scale canvas to max via CSS.
     */
    function _scaleCanvas(canvas){
      const [CH,CW]=[canvas.offsetHeight, canvas.offsetWidth];
      const [WH,WW]=[_height(), _width()];
      const K = Math.min(WW/CW, WH/CH);
      const [scaledH,scaledW]=[CH*K, CW*K];
      dom.css(canvas, {transformOrigin:"0 0",
                       transform:`scale(${K})`});
      if(true){
        //lay flat?
        if(CW>CH ? scaledW<WW : !(scaledH>WH)){
          const margin = MFL((WW-scaledW)/2);
          dom.css(canvas, {marginTop:"0px",
                           marginBottom:"0px",
                           marginLeft:`${margin}px`,
                           marginRight:`${margin}px`});
        }else{
          const margin = MFL((WH-scaledH)/2);
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
        //deal with possible edges, use a different color
        dom.css(document.body, "backgroundColor", Mojo.scaledBgColor);
      }
      return K;
    }

    /**Once all the files are loaded, do some post processing,
     * mainly to deal with sound files.
     */
    function _onAssetLoaded(Mojo,ldrObj,handle){
      const {Sound} = Mojo;
      function _finz(){
        //clean up a whole bunch of stuff used during bootstrap
        _spans.forEach(e=> dom.css(e, "display", "none"));
        //get rid of any loading scene
        Mojo.delBgTask(ldrObj);
        //clean up user handle
        handle &&
          handle.dispose && handle.dispose();
        //finally run the user start function
        Mojo.u.start(Mojo);
      }
      let s, ext, fcnt=0;
      function _minus1(){ --fcnt===0 && _finz() }
      //decode audio files
      _.doseq(Mojo.assets, (r,k)=>{
        ext= _.fileExt(k);
        if(_.has(AUDIO_EXTS,ext)){
          fcnt+=1;
          Sound.decodeContent(r.name, r.url, r.xhr.response, _minus1);
        }
      });
      //if nothing to load, just do it
      fcnt===0 && _finz();
    }

    /** Fetch required files.
     */
    function _loadFiles(Mojo){
      let filesToLoad= _.map(Mojo.u.assetFiles || [], f=> Mojo.assetPath(f));
      let ffiles= _.findFiles(filesToLoad, FONT_EXTS);
      const {PXLR,PXLoader}= Mojo;
      //common hack to trick browser to load in font files.
      let family, face, span, style;
      ffiles.forEach(s=>{
        style= dom.newElm("style");
        span= dom.newElm("span");
        family= s.split("/").pop().split(".")[0];
        face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        CON.log(`fontface = ${face}`);
        _fonts.push(family);
        dom.conj(style,dom.newTxt(face));
        dom.conj(document.head,style);
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
        _spans.push(span);
      });
      AUDIO_EXTS.forEach(e=>{
        PXLR.setExtensionLoadType(e, PXLR.LOAD_TYPE.XHR);
        PXLR.setExtensionXhrType(e, PXLR.XHR_RESPONSE_TYPE.BUFFER);
      });
      PXLoader.reset();
      if(filesToLoad.length>0){
        let handle,
            fs=[],
            pg=[],
            cb= Mojo.u.load || _PBar;
        PXLoader.add(filesToLoad);
        PXLoader.onProgress.add((ld,r)=>{
          fs.unshift(r.url);
          pg.unshift(ld.progress);
        });
        PXLoader.load(()=> CON.log("files loaded!"));
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
      return Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _ScrSize={width:0,height:0},
          _Size11={width:1,height:1},
          _CT="* {padding: 0; margin: 0}";

    /**Set some global CSS.
    */
    function _configCSS(){
      const style= dom.newElm("style");
      dom.conj(style,dom.newTxt(_CT));
      dom.conj(document.head,style);
    }

    /**Install a module.
     */
    function _runM(m){
      CON.log(`installing module ${m}...`);
      gscope[`io/czlab/mojoh5/${m}`](Mojo)
    }

    /** @ignore */
    function _prologue(Mojo){
      _.assert(cmdArg.arena,"design resolution req'd.");
      let maxed=false,
          {EventBus}= Mojo,
          box= cmdArg.arena,
          S= Mojo.stage= new PixiStage();
      if(cmdArg.scaleToWindow=="max"){
        maxed=true;
        box= {width: _width(),
              height: _height()};
        if(cmdArg.arena.width===undefined &&
           cmdArg.arena.height===undefined){
          maxed=false;
          cmdArg.arena=box;
          cmdArg.scaleToWindow="win";
        }
      }
      Mojo.ctx= PIXI.autoDetectRenderer(box);
      Mojo.ctx.bgColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.maxed=maxed;
      //install modules
      _.seq("Sprites,Input,Touch,Scenes,Sound").forEach(_runM);
      _.seq("FX,2d,Tiles,GameLoop").forEach(_runM);
      if(cmdArg.border !== undefined)
        dom.css(Mojo.canvas, "border", cmdArg.border);
      if(cmdArg.bgColor !== undefined)
        Mojo.ctx.bgColor = Mojo["Sprites"].color(cmdArg.bgColor);
      dom.conj(document.body, Mojo.canvas);
      Mojo.scaledBgColor= cmdArg.scaledBgColor || "#323232";
      Mojo.touchDevice= !!("ontouchstart" in document);
      _configCSS();
      Mojo.scale= cmdArg.scaleToWindow===true?_scaleCanvas(Mojo.canvas):1;
      Mojo.mouse= Mojo["Input"].pointer(Mojo.canvas, Mojo.scale);
      Mojo.frame=1/cmdArg.fps;
      if(cmdArg.resize === true){
        _.addEvent("resize", gscope, _.debounce(()=>{
          //save the current size and tell others
          const [w,h]=[Mojo.width, Mojo.height];
          Mojo.ctx.resize(_width(),_height());
          EventBus.pub(["canvas.resize"],[w,h]);
        },cmdArg.debounceRate||150));
        EventBus.sub(["canvas.resize"],
                     old=> S.children.forEach(s=> s.onCanvasResize(old)));
      }
      return _loadFiles(Mojo) && Mojo;
    }

    /**Mixin registry.
    */
    const _mixins= _.jsMap();

    /** @ignore */
    class Mixin{
      constructor(){}
    }

    /** @ignore */
    function _mixinAdd(s,name,f,...args){
      _.assert(!_.has(s,name),`Error: ${name} not available.`);
      //call f to create the mixin object
      const o= f(s,...args);
      s[name]=o;
      o.name=name;
      o.mixinName= "."+name;
      return s;
    }

    const Mojo={
      /**Enum (1)
      * @memberof module:mojoh5/Mojo */
      EVERY:1,
      /**Enum (2)
      * @memberof module:mojoh5/Mojo */
      SOME: 2,
      /**Enum (3)
       * @memberof module:mojoh5/Mojo */
      CENTER:3,
      /**Enum (4)
       * @memberof module:mojoh5/Mojo */
      TOP: 4,
      /**Enum (5)
       * @memberof module:mojoh5/Mojo */
      LEFT: 5,
      /**Enum (6)
       * @memberof module:mojoh5/Mojo */
      RIGHT: 6,
      /**Enum (7)
       * @memberof module:mojoh5/Mojo */
      BOTTOM: 7,
      /**Enum (8)
       * @memberof module:mojoh5/Mojo */
      UP: 8,
      /**Enum (9)
       * @memberof module:mojoh5/Mojo */
      DOWN: 9,
      /**Enum (10)
       * @memberof module:mojoh5/Mojo */
      TOP_LEFT: 10,
      /**Enum (11)
       * @memberof module:mojoh5/Mojo */
      TOP_RIGHT: 11,
      /**Enum (12)
       * @memberof module:mojoh5/Mojo */
      BOTTOM_LEFT: 12,
      /**Enum (13)
       * @memberof module:mojoh5/Mojo */
      BOTTOM_RIGHT: 13,
      /**Enum (100)
       * @memberof module:mojoh5/Mojo */
      NONE: 100,
      ute:_,
      is:is,
      dom:dom,
      /**User configuration.
       * @memberof module:mojoh5/Mojo */
      u:cmdArg,
      /**Storage for all game data.
       * @memberof module:mojoh5/Mojo */
      Game:{},
      CON:console,
      noop: ()=>{},
      /**Event object for pub/sub.
       * @memberof module:mojoh5/Mojo */
      EventBus:EventBus(),
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PXLoader:PIXI.Loader.shared,
      PXObservablePoint: PIXI.ObservablePoint,
      /**Check if `d` is on the right hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideRight(d){ return d===Mojo.RIGHT || d===Mojo.TOP_RIGHT || d===Mojo.BOTTOM_RIGHT },
      /**Check if `d` is on the left hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideLeft(d){ return d===Mojo.LEFT || d===Mojo.TOP_LEFT || d===Mojo.BOTTOM_LEFT },
      /**Check if `d` is on the top hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideTop(d){ return d===Mojo.TOP || d===Mojo.TOP_LEFT || d===Mojo.TOP_RIGHT },
      /**Check if `d` is on the bottom hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideBottom(d){ return d===Mojo.BOTTOM || d===Mojo.BOTTOM_LEFT || d===Mojo.BOTTOM_RIGHT },
      /**Check if 2 bboxes overlap.
       * @memberof module:mojoh5/Mojo
       * @param {object} a
       * @param {object} b
       * @return {boolean}
       */
      overlap(a,b){
        return !(a.x2 < b.x1 ||
                 b.x2 < a.x1 ||
                 a.y2 < b.y1 ||
                 b.y2 < a.y1)
      },
      /**Check if this element contains a class name.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {boolean}
       */
      hasClass(e, c){
        return new RegExp(`(\\s|^)${c}(\\s|$)`).test(e.className)
      },
      /**Add a class name to this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      addClass(e, c){
        if(!_.hasClass(e, c)) e.className += `${c}`
        return e;
      },
      /**Remove a class name from this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      removeClass(e, c){
        if(_.hasClass(e, c))
          e.className= e.className.replace(new RegExp(`(\\s|^)${c}(\\s|$)`), "");
        return e;
      },
      /**Wrap this number around these 2 limits.
       * @memberof module:mojoh5/Mojo
       * @param {number} v
       * @param {number} low
       * @param {number} high
       * @return {number}
       */
      wrapv(v, low, high){
        return v<low ? high : (v>high ? low : v)
      },
      /**Define a mixin.
       * @memberof module:mojoh5/Mojo
       * @param {string} name
       * @param {function} body
       */
      defMixin(name,body){
        if(_.has(_mixins,name))
          throw `Error: mixin: "${name}" already defined.`;
        _.assert(is.fun(body),"mixin must be a function");
        _.assoc(_mixins,name, body);
      },
      /**Add these mixins to the sprite.
       * @memberof module:mojoh5/Mojo
       * @param {Sprite} s
       * @param {...string} fs names of mixins
       * @return {Sprite} s
       */
      addMixin(s,n,...args){
        return _mixinAdd(s,n, _mixins.get(n),...args)
      },
      /**Get the loaded resources.
       * @memberof module:mojoh5/Mojo
       * @name assets
       * @return {object} resouces
       */
      get assets(){ return PIXI.Loader.shared.resources },
      /**Get the game's design resolution.
       * @memberof module:mojoh5/Mojo
       * @name designSize
       * @return {object} {width,height}
       */
      get designSize() { return this.u.arena },
      /**Get the canvas's width.
       * @memberof module:mojoh5/Mojo
       * @name width
       * @return {number}
       */
      get width(){ return this.canvas.width },
      /**Get the canvas's height.
       * @memberof module:mojoh5/Mojo
       * @name height
       * @return {number}
       */
      get height(){ return this.canvas.height },
      /**Run function across all the scenes.
       * @memberof module:mojoh5/Mojo
       * @param {function} cb
       */
      stageCS(cb){ Mojo.stage.children.forEach(cb) },
      /**Check if viewport is in portrait mode.
       * @memberof module:mojoh5/Mojo
       * @return {boolean}
       */
      portrait(){ return Mojo.height>Mojo.width },
      /**Get the center position of the viewport.
       * @memberof module:mojoh5/Mojo
       * @return {Vec2} [x,y]
       */
      screenCenter(){ return _.v2(MFL(Mojo.width/2),MFL(Mojo.height/2)) },
      /**Scale the `src` size against the `des` size.
       * @memberof module:mojoh5/Mojo
       * @param {Vec2} src
       * @param {Vec2} des
       * @return {Vec2}
       */
      scaleXY(src,des){ return [des[0]/src[0],des[1]/src[1]] },
      /**Create a PIXI anchor.
       * @memberof module:mojoh5/Mojo
       * @param {number} x
       * @param {number} y
       * @return {ObservablePoint}
       */
      makeAnchor(x,y){ return new Mojo.PXObservablePoint(Mojo.noop,this,x,y) },
      /**Ducktype a stage object.
       * @memberof module:mojoh5/Mojo
       * @param {number} px
       * @param {number} py
       * @return {object}
       */
      mockStage(px=0,py=0){
        return{
          getGlobalPosition(){ return {x:px,y:py} },
          anchor: Mojo.makeAnchor(0,0),
          m5:{stage:true},
          x:px,
          y:py,
          width: Mojo.width,
          height: Mojo.height
        }
      },
      /**Convert the position into a grid index.
       * @memberof module:mojoh5/Mojo
       * @param {number} x
       * @param {number} y
       * @param {number} cellW
       * @param {number} cellH
       * @param {number} widthInCols
       * @param {number} offsetX
       * @param {number} offsetY
       * @return {number}
       */
      getIndex(x, y, cellW, cellH, widthInCols,offsetX,offsetY){
        if(x<0 || y<0)
          throw `Error: ${x},${y}, values must be positive`;
        return MFL(x/cellW) + MFL(y/cellH) * widthInCols
      },
      /**Create a Texture from this image.
       * @memberof module:mojoh5/Mojo
       * @param {any} x
       * @return {Texture}
       */
      textureFromImage(x){ return Mojo.PXTexture.from(x) },
      /**Create a AnimatedSprite from these frames/images.
       * @memberof module:mojoh5/Mojo
       * @param {any[]} x
       * @return {AnimatedSprite}
       */
      animFromVec(x){
        if(is.vec(x)){
          if(is.str(x[0]))
            return this.tcached(x[0]) ? this.PXASprite.fromFrames(x)
                                      : this.PXASprite.fromImages(x.map(s=>this.assetPath(s)))
          if(_.inst(Mojo.PXTexture,x[0]))
            return new this.PXASprite(x)
        }
      },
      /**Get a cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {any} x
       * @return {Texture}
       */
      tcached(x){
        if(_.inst(this.PXTexture,x)){return x}
        if(is.str(x)){
          return PIXI.utils.TextureCache[x] ||
                 PIXI.utils.TextureCache[this.assetPath(x)];
        }
      },
      /**Converts the position into a [col, row] for grid oriented processing.
       * @memberof module:mojoh5/Mojo
       * @param {number} pos
       * @param {number} width
       * @return {number[]} [col,row]
       */
      splitXY(pos,width){ return [pos%width, MFL(pos/width)] },
      /**Create a PIXI Rectangle.
       * @memberof module:mojoh5/Mojo
       * @param {number} x
       * @param {number} y
       * @param {number} w
       * @param {number} h
       * @return {Rectangle}
       */
      rect(x,y,w,h){ return new Mojo.PXRectangle(x,y,w,h) },
      /**Scale the `src` size against `des` size.
       * @memberof module:mojoh5/Mojo
       * @param {object} src
       * @param {object} des
       * @return {object} {width,height}
       */
      scaleSZ(src,des){ return { width: MFL(des.width/src.width), height: MFL(des.height/src.height)} },
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} frame
       * @return {Texture}
       */
      id(frame){ return Mojo.image(frame) },
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {Texture}
       */
      image(n){ return this.tcached(n) || _.assert(false, `${n} not loaded.`) },
      /**Get the cached XML file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      xml(n){ return (Mojo.assets[n] || _.assert(false, `${n} not loaded.`)).data },
      /**Get the cached JSON file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      json(n){ return (Mojo.assets[n] || _.assert(false, `${n} not loaded.`)).data },
      /**Get the relative path for this file.
       * @memberof module:mojoh5/Mojo
       * @param {string} name
       * @return {string}
       */
      assetPath(fname){
        if(fname.includes("/")) {return fname}
        let pfx="data",
            ext= _.fileExt(fname);
        //if(ext) ext=ext.substring(1);
        if(_.has(IMAGE_EXTS,ext)){
          pfx="images";
        }else if(_.has(FONT_EXTS,ext)){
          pfx="fonts";
        }else if(_.has(AUDIO_EXTS,ext)){
          pfx="audio";
        }
        return `${pfx}/${fname}`;
      },
      /**Get the scale factor for this maximized viewport.
       * @memberof module:mojoh5/Mojo
       * @return {object} {width,height}
       */
      contentScaleFactor(){
        _ScrSize.height=Mojo.height;
        _ScrSize.width=Mojo.width;
        return cmdArg.scaleToWindow!=="max" ? _Size11 : Mojo.scaleSZ(Mojo.designSize,_ScrSize)
      },
      /**Get the named resource from the asset cache.
       * @memberof module:mojoh5/Mojo
       * @param {string} x
       * @param {boolean} [panic] if not found throws exception
       * @return {any}
       */
      resource(x,panic){
        let t= x ? (this.assets[x] || this.assets[Mojo.assetPath(x)]) : null;
        return t || (panic ? _.assert(false, `Error: no such resource ${x}.`) : undefined)
      }
    };

    return _prologue(Mojo);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only!"
  }else{
    //window.addEventListener("load", ()=> console.log("MojoH5 loaded!"));
    return gscope.MojoH5=function(arg){ return _module(arg, [], []) }
  }

})(this);


