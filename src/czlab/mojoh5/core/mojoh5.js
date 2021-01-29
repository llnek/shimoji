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
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  if(typeof module === "object" && module.exports){
    throw "Fatal: no browser"
  }
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /** Supported file extensions. */
  const FONT_EXTS = ["ttf", "otf", "ttc", "woff"];
  const AUDIO_EXTS= ["mp3", "wav", "ogg"];
  const IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"];

  /**
   * @private
   * @function
   */
  //return window.document.documentElement.clientWidth
  function _width(){ return gscope.innerWidth }
  //return window.document.documentElement.clientHeight
  function _height(){ return gscope.innerHeight }
  /**
   * @private
   * @function
   */
  function _MojoH5(cmdArg, _fonts, _spans){
    const {EventBus,dom,is,u:_} = gscope["io/czlab/mcfud/core"]();
    const CON=console;
    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      fps: 60
    });
    /**Built-in progress bar, shown during the loading of asset files
     * if no user-defined load function is provided in the config options.
     * @private
     * @function
     */
    function _PBar(Mojo,f,p,handle){
      const {Sprites}=Mojo;
      if(!handle){//first time call
        const cy= Mojo.height/2|0;
        const cx= Mojo.width/2|0;
        const w4=Mojo.width/4|0;
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
          perc:Sprites.text("0%", {fontSize:RH/2|0,
                                   fill:"black",
                                   fontFamily:"sans-serif"})
        };
        Sprites.add(Mojo.stage,handle.bg,handle.fg,handle.perc);
        Sprites.setXY(handle.bg, cx-w4, Y);
        Sprites.setXY(handle.fg, cx-w4, Y);
        Sprites.setXY(handle.perc, cx-w4+10,  cy-handle.perc.height/2|0);
      }else{
        handle.perc.m5.content(`${Math.round(p)}%`);
        handle.fg.width = handle.width*(p/100);
        CON.log(`file= ${f}, progr= ${p}`);
      }
      return handle;
    }
    /**Scale canvas to max via css.
     * @private
     * @function
     */
    function _cssScaleCanvas(canvas){
      const CH=canvas.offsetHeight;
      const CW=canvas.offsetWidth;
      const WH=_height();
      const WW=_width();
      const K = Math.min(WW/CW, WH/CH);
      const scaledH=CH*K;
      const scaledW=CW*K;
      dom.css(canvas, {transformOrigin:"0 0",
                       transform:`scale(${K})`});
      if(!Mojo.maxed){
        //lay flat?
        if(CW>CH ? scaledW<WW : !(scaledH>WH)){
          const margin = (WW-scaledW)/2|0;
          dom.css(canvas, {marginTop:"0px",
                           marginBottom:"0px",
                           marginLeft:`${margin}px`,
                           marginRight:`${margin}px`});
        }else{
          const margin = (WH-scaledH)/2|0;
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
    /** Once all the files are loaded, do some post processing.
     * @private
     * @function
     */
    function _onAssetLoaded(Mojo,ldrObj,handle){
      Mojo.PSLR=PIXI.Loader.shared.resources;
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
        Mojo.o.start(Mojo);
      }
      let s, ext, files=0;
      function _dec(){ --files===0 && _finz() }
      //audio files need decoding
      _.doseq(Mojo.PSLR, (r,k)=>{
        ext= _.fileExt(k);
        if(_.has(AUDIO_EXTS,ext)){
          files += 1;
          Sound.decodeContent(r.name, r.url, r.xhr.response, _dec);
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
      let filesToLoad= _.map(Mojo.o.assetFiles || [], f=> Mojo.assetPath(f));
      let ffiles= _.findFiles(filesToLoad, FONT_EXTS);
      let {PXLR,PXLoader}= Mojo;
      //common hack to trick browser to load in font files.
      let family, face, span, style;
      ffiles.forEach(s=>{
        style= dom.newElm("style");
        family= s.split("/").pop().split(".")[0];
        face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        span= dom.newElm("span");
        CON.log(`fontface = ${face}`);
        _.conj(_fonts,family);
        dom.conj(style,dom.newTxt(face));
        dom.conj(document.head,style);
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
        _.conj(_spans,span);
      });
      AUDIO_EXTS.forEach(e=>{
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
      Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
    const _CT="* {padding: 0; margin: 0}";
    const _ScrSize={width:0,height:0};
    const _Size11={width:1,height:1};
    /**
     * @private
     * @function
     */
    function _configCSS(){
      const style= dom.newElm("style");
      dom.conj(style,dom.newTxt(_CT));
      dom.conj(document.head,style);
    }
    /**
     * @private
     * @function
     */
    function _runM(m){
      CON.log(`installing module ${m}...`);
      gscope[`io/czlab/mojoh5/${m}`](Mojo)
    }
    /**
     * @private
     * @function
     */
    function _prologue(Mojo){
      _.assert(cmdArg.arena,"Missing design resolution.");
      let S= new Mojo.PXContainer();
      const {EventBus}= Mojo;
      let box= cmdArg.arena;
      let maxed=false;
      //remember the design size
      Mojo.designSize= box;
      Mojo.cmdArg=cmdArg;
      Mojo.stage=S;
      S.m5={stage:true};
      if(cmdArg.scaleToWindow==="max"){
        maxed=true;
        box= {width: _width(),
              height: _height()};
      }
      Mojo.ctx= PIXI.autoDetectRenderer(box);
      Mojo.ctx.bgColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.maxed=maxed;
      //instantiate modules
      _.seq("Sprites,Input,Touch,Scenes,Sound").forEach(_runM);
      _.seq("FX,2d,Tiles,GameLoop").forEach(_runM);
      if(cmdArg.border !== undefined)
        dom.css(Mojo.canvas, "border", cmdArg.border);
      if(cmdArg.bgColor !== undefined)
        Mojo.ctx.bgColor = Mojo["Sprites"].color(cmdArg.bgColor);
      dom.conj(document.body, Mojo.canvas);
      Mojo.scaledBgColor= cmdArg.scaledBgColor || "#323232";
      Mojo.touchDevice= !!("ontouchstart" in document);
      EventBus.sub(["canvas.resize"],
                   old=> S.children.forEach(s=> s.onCanvasResize(old)));
      _configCSS();
      Mojo.scale= cmdArg.scaleToWindow===true?_cssScaleCanvas(Mojo.canvas):1;
      Mojo.pointer= Mojo["Input"].pointer(Mojo.canvas, Mojo.scale);
      Mojo.frame=1/cmdArg.fps;
      _.addEvent("resize", gscope, _.debounce(()=>{
        //save the current size and tell others
        let h=Mojo.height;
        let w=Mojo.width;
        Mojo.ctx.resize(_width(),_height());
        EventBus.pub(["canvas.resize"],[w,h]);
      },cmdArg.debounceRate||150));
      _loadFiles(Mojo);
      return Mojo;
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
      u:_,
      is:is,
      dom:dom,
      o:cmdArg,
      Game:{},
      CON:console,
      noop: ()=>{},
      EventBus:EventBus(),
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PSLR:{},
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
      get assets(){ return this.PSLR },
      get width(){ return this.canvas.width },
      get height(){ return this.canvas.height },
      /** Run a function across all children of the stage object. */
      stageCS(cb){ Mojo.stage.children.forEach(cb) },
      portrait(){ return Mojo.height>Mojo.width },
      screenCenter(){ return _.v2(Mojo.width/2|0,Mojo.height/2|0) },
      scaleXY(src,des){ return [des[0]/src[0],des[1]/src[1]] },
      makeAnchor(x,y){ return new Mojo.PXObservablePoint(Mojo.noop,this,x,y) },
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
      adjustForStage(o){ return o.m5.stage ? Mojo.mockStage() : o },
      getIndex(x, y, cellW, cellH, widthInCols){
        if(x<0 || y<0)
          throw `Error: ${x},${y}, values must be positive`;
        return (x/cellW|0) + (y/cellH|0) * widthInCols
      },
      textureFromImage(x){ return Mojo.PXTexture.fromImage(x) },
      animFromFrames(x){ return Mojo.PXASprite.fromFrames(x) },
      animFromImages(x){ return Mojo.PXASprite.fromImages(x.map(s=>Mojo.assetPath(s))) },
      tcached(x){ if(x) return (Mojo.PXTCache[x] || Mojo.PXTCache[Mojo.assetPath(x)]) },
      /**Converts the position into a [col, row] for grid oriented processing. */
      splitXY(pos,width){ return [pos%width, pos/width|0] },
      rect(x,y,w,h){ return new Mojo.PXRectangle(x,y,w,h) },
      scaleSZ(src,des){ return { width: des.width/src.width, height: des.height/src.height } },
      id(frame){ return Mojo.image(frame) },
      image(n){ return Mojo.PXTCache[n] || _.assert(false, `${n} not loaded.`) },
      xml(n){ return (Mojo.PSLR[n] || _.assert(false, `${n} not loaded.`)).data },
      json(n){ return (Mojo.PSLR[n] || _.assert(false, `${n} not loaded.`)).data },
      assetPath(fname){
        if(fname.includes("/")) {return fname}
        let ext= _.fileExt(fname);
        let pfx="data";
        if(ext) ext=ext.substring(1);
        if(_.has(IMAGE_EXTS,ext)){
          pfx="images";
        }else if(_.has(FONT_EXTS,ext)){
          pfx="fonts";
        }else if(_.has(AUDIO_EXTS,ext)){
          pfx="audio";
        }
        return `${pfx}/${fname}`;
      },
      contentScaleFactor(){
        _ScrSize.height=Mojo.height;
        _ScrSize.width=Mojo.width;
        return cmdArg.scaleToWindow!=="max" ? _Size11 : Mojo.scaleSZ(Mojo.designSize,_ScrSize)
      },
      resource(x,panic=0){
        let t= x ? (Mojo.PSLR[x] || Mojo.PSLR[Mojo.assetPath(x)]) : null;
        return t || (panic ? _.assert(false, `Error: no such resource ${x}.`) : undefined)
      }
    };

    return _prologue(Mojo);
  }
  //window.addEventListener("load", ()=> console.log("MojoH5 loaded!"));
  return gscope.MojoH5=function(arg){ _MojoH5(arg, [], []) }

})(this);


