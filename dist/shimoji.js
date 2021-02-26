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
        handle.perc.m5.content(`${Math.round(p)}%`);
        handle.fg.width = handle.width*(p/100);
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
      Mojo.start(); // starting the game loop
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
      const {EventBus}= Mojo,
            S= new Mojo.PXContainer();
      let maxed=false,
          box= cmdArg.arena;
      Mojo.stage=S;
      S.m5={stage:true};
      if(cmdArg.scaleToWindow=="max"){
        maxed=true;
        box= {width: _width(),
              height: _height()};
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
      EventBus.sub(["canvas.resize"],
                   old=> S.children.forEach(s=> s.onCanvasResize(old)));
      _configCSS();
      Mojo.scale= cmdArg.scaleToWindow===true?_scaleCanvas(Mojo.canvas):1;
      Mojo.pointer= Mojo["Input"].pointer(Mojo.canvas, Mojo.scale);
      Mojo.frame=1/cmdArg.fps;
      _.addEvent("resize", gscope, _.debounce(()=>{
        //save the current size and tell others
        const [w,h]=[Mojo.width, Mojo.height];
        Mojo.ctx.resize(_width(),_height());
        EventBus.pub(["canvas.resize"],[w,h]);
      },cmdArg.debounceRate||150));
      _loadFiles(Mojo);
      return Mojo;
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
      u:_,
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
       * @return {number}
       */
      getIndex(x, y, cellW, cellH, widthInCols){
        if(x<0 || y<0)
          throw `Error: ${x},${y}, values must be positive`;
        return MFL(x/cellW) + MFL(y/cellH) * widthInCols
      },
      /**Create a Texture from this image.
       * @memberof module:mojoh5/Mojo
       * @param {any} x
       * @return {Texture}
       */
      textureFromImage(x){ return Mojo.PXTexture.fromImage(x) },
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
        //internet seems to suggest not to use PIXI.utils.TextureCache.
        if(_.inst(this.PXTexture,x)){return x}
        if(is.str(x)){
          let o=this.PXLoader.resources[x] ||
                this.PXLoader.resources[this.assetPath(x)];
          return o && o.texture;
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

  /**Extend Mojo with game loop capabilities.
   */
  function _module(Mojo,_bgTasks){

    const {u:_, is}=gscope["io/czlab/mcfud/core"]();
    const _M=gscope["io/czlab/mcfud/math"]();

    let _paused = false,
        _startTime = Date.now();

    //------------------------------------------------------------------------
    /**Code to run per tick.
     */
    function _update(dt){
      //process any backgorund tasks
      _bgTasks.forEach(m=> m.update && m.update(dt));
      //update all scenes
      if(!_paused)
        Mojo.stageCS(s=> s.update && s.update(dt));
      //render drawings
      Mojo.ctx.render(Mojo.stage);
    }

    //------------------------------------------------------------------------
    //register these background tasks
    _.conj(_bgTasks, Mojo.FX, Mojo.Sprites, Mojo.Input);

    /**1 sec div 60
     * @private
     * @var {number}
     */
    const _DT60=1/60;

    /**1 sec div 15
     * @private
     * @var {number}
     */
    const _DT15=1/15;

    /** @ignore */
    function _raf(cb){
      gscope.requestAnimationFrame(cb) }

    //------------------------------------------------------------------------
    //extensions
    _.inject(Mojo,{
      delBgTask(t){ t && _.disj(_bgTasks,t) },
      addBgTask(t){ _.conj(_bgTasks,t) },
      resume(){ _paused = false },
      pause(){ _paused = true },
      start(){
        let diff=Mojo.frame;
        let last= _.now();
        let acc=0;
        let F=function(){
          let cur= _.now();
          let dt= (cur-last)/1000;
          //limit the time gap between calls
          if(dt>_DT15) dt= _DT15;
          for(acc += dt;
              acc >= diff;
              acc -= diff){ _update(dt); }
          last = cur;
          _raf(F);
        };
        _raf(F);
      }
    });

    return Mojo;
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  let _ModuleInited;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only."
  }else{
    gscope["io/czlab/mojoh5/GameLoop"]=function(M){
      if(!_ModuleInited){
        _ModuleInited=true;
        _module(M,[]);
      }
      return M;
    }
  }

})(this);



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

  const SomeColors={
    aqua: "#00FFFF",
    black:  "#000000",
    blue: "#0000FF",
    brown: "#A52A2A",
    crimson: "#DC143C",
    cyan: "#00FFFF",
    fuchsia:  "#FF00FF",
    gray: "#808080",
    green:  "#008000",
    grey: "#808080",
    lavender: "#E6E6FA",
    lime: "#00FF00",
    magenta:  "#FF00FF",
    maroon: "#800000",
    navy: "#000080",
    olive:  "#808000",
    orange: "#FFA500",
    purple: "#800080",
    red:  "#FF0000",
    silver: "#C0C0C0",
    teal: "#008080",
    turquoise: "#40E0D0",
    wheat: "#F5DEB3",
    white:  "#FFFFFF",
    yellow: "#FFFF00"};

  /**Create the module.
   */
  function _module(Mojo, Shaker){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {u:_, is, dom, EventBus} =Mojo;
    const ABC=Math.abs,
          MFL=Math.floor;

    /**
     * @module mojoh5/Sprites
     */

    //------------------------------------------------------------------------
    //create aliases for various PIXI objects
    _.inject(Mojo, {PXMatrix:PIXI.Matrix.TEMP_MATRIX,
                    PXRTexture:PIXI.RenderTexture,
                    PXRect:PIXI.Rectangle,
                    PXBText:PIXI.BitmapText,
                    PXSprite:PIXI.Sprite,
                    PXGraphics:PIXI.Graphics,
                    PXText:PIXI.Text,
                    PXTSprite:PIXI.TilingSprite,
                    PXASprite:PIXI.AnimatedSprite,
                    PXPContainer:PIXI.ParticleContainer});

    /** @ignore */
    function _sa(a){ return `${a.x},${a.y}` }

    /** @ignore */
    function _corners(a,w,h){
      let r,
          v=_V.vec,
          w2=MFL(w/2),
          h2=MFL(h/2);
      switch(a){
      case "0,0":
        r=[v(0,h), v(w,h), v(w,0), v()];
      break;
      case "0.5,0":
        r=[ v(-w2,h), v(w2,h), v(w2,0), v(-w2,0)];
      break;
      case "1,0":
        r=[ v(-w,h), v(0,h), v(), v(-w,0)];
      break;
      case "0,0.5":
        r=[ v(0,h2), v(w,h2), v(w,-h2), v(0,-h2)];
      break;
      case "0.5,0.5":
        r=[ v(-w2,h2), v(w2,h2), v(w2,-h2), v(-w2,-h2)];
      break;
      case "1,0.5":
        r=[ v(-w,h2), v(0,h2), v(0,-h2), v(-w,-h2)];
      break;
      case "0,1":
        r=[ v(), v(w,0), v(w,-h), v(0,-h)];
      break;
      case "0.5,1":
        r=[ v(-w2,0), v(w2,0), v(w2,-h), v(-w2,-h)];
      break;
      case "1,1":
        r=[ v(-w,0), v(), v(0,-h), v(-w,-h)];
      break;
      default:
        _.assert(false,"Error: bad anchor values: "+a);
      }
      return r
    }

    /**Mixin registry.
    */
    const _mixins= _.jsMap();

    /** @ignore */
    class Mixin{
      constructor(){}
    }

    /** @ignore */
    function _mixinAdd(s,name,f){
      _.assert(!_.has(s,name),`Error: ${name} not available.`);
      //call f to create the mixin object
      const o= f(s);
      s[name]=o;
      o.name=name;
      o.mixinName= "."+name;
      return s;
    }

    /**Add more to an AnimatedSprite.
     * @ignore
     */
    function _exASprite(s){
      let tmID,
          //[start,end,cnt,total]
          //[0,    1,  2,  3]
          _state=[0,0,0,0];
      function _reset(){
        if(s.m5.animating){
          tmID = _.clear(tmID);
          _.setVec(_state,0,0,0,0); }
        s.m5.animating = false;
      }
      function _adv(){
        if(_state[2] < _state[3]+1){
          s.gotoAndStop(s.currentFrame+1);
          _state[2] += 1;
        }else if(s.loop){
          s.gotoAndStop(start);
          _state[2]=1;
        }
      }
      _.inject(s.m5,{
        showFrame(f){
          _reset();
          s.gotoAndStop(f)
        },
        playFrames(seq){
          _reset();
          _state[0]=0;
          _state[1]= s.totalFrames-1;
          if(is.vec(seq) && seq.length>1){
            _state[0]=seq[0];
            _state[1]=seq[1]; }
          _state[3]=_state[1]-_state[0];
          s.gotoAndStop(_state[0]);
          _state[2]=1;
          if(!s.m5.animating){
            s.m5.animating = true;
            tmID = _.timer(_adv, 1000/12, true);
          }
        },
        stopFrames(){
          s.m5.showFrame(s.currentFrame)
        }
      });
      return s;
    }

    /**Low level sprite creation. */
    function _sprite(source,ctor){
      let s,obj;
      if(_.inst(Mojo.PXTexture,source)){
        obj=source
      }else if(is.vec(source)){
        s=Mojo.animFromVec(source)
      }else if(is.str(source)){
        obj= Mojo.tcached(source) ||
             Mojo.textureFromImage(source)
      }
      if(obj){s=ctor(obj)}
      if(!s)
        throw `Error: ${source} not found`;
      return _.assertNot(_.has(s,"m5")||_.has(s,"g"),"found m5,g properties") && s;
    }

    /** @ignore */
    function _mkgrid(sx,sy,rows,cols,cellW,cellH){
      const out=[];
      let y1=sy,
          x1=sx;
      for(let x2,y2,v,r=0; r<rows; ++r){
        v=[];
        for(let c=0; c<cols; ++c){
          y2 = y1 + cellH;
          x2 = x1 + cellW;
          v.push({x1,x2,y1,y2});
          x1 = x2;
        }
        y1 = y2;
        x1 = sx;
        out.push(v);
      }
      return out;
    }

    /** @ignore */
    function _pininfo(X,o){
      let box=o.m5.stage ? {x1:0,y1:0,x2:Mojo.width,y2:Mojo.height} : X.getBBox(o);
      return [box, MFL((box.x2-box.x1)/2),//half width
                   MFL((box.y2-box.y1)/2),//half height
                   MFL((box.x1+box.x2)/2),//center x
                   MFL((box.y1+box.y2)/2)]//centery
    }

    const _$={
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       */
      assertCenter(s){
        return _.assert(s.anchor.x>0.3 && s.anchor.x<0.7 &&
                        s.anchor.y>0.3 && s.anchor.y<0.7, "not center'ed")
      },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){ return s.children.length === 0 },
      /**Reposition the sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      setXY(s,x,y){ s.x=x; s.y= _.or(y,x); return s },
      /**Change size of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} w
       * @param {number} h
       * @return {Sprite} s
       */
      setSize(s,w,h){ s.width=w; s.height= _.or(h,w); return s },
      /**Change scale factor of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      setScale(s, sx, sy){ s.scale.set(sx,_.or(sy,sx)); return s },
      /**Change sprite's anchor position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      setAnchor(s,x,y){ s.anchor.set(x,_.or(y,x)); return s },
      /**Get the size of sprite, but halved.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {width,height}
       */
      halfSize(s){ return {width:MFL(s.width/2), height:MFL(s.height/2)} },
      /**Set sprite's anchor to be at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      centerAnchor(s){ s.anchor.set(0.5,0.5); return s },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){ s.anchor.set(0,0); return s },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return _V.vec(-MFL(s.width*s.anchor.x),
                      -MFL(s.height*s.anchor.y))
      },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return _V.vec(MFL(s.width/2) - MFL(s.anchor.x*s.width),
                      MFL(s.height/2) - MFL(s.anchor.y*s.height))
      },
      /**Extend a sprite with extra methods.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      extend(s){
        //m5 holds all mojoh5 extensions
        //g placeholder for user stuff
        if(!s.m5) s.m5={};
        if(!s.g) s.g={};
        let self=this;
        _.inject(s.m5, {uuid: _.nextId(),
                        static: false,
                        mass: 1,
                        invMass: 1,
                        gravity: _V.vec(),
                        friction: _V.vec(),
                        vel: _V.vec(),
                        acc: _V.vec(),
                        angVel: 0,
                        stage: false,
                        dead: false,
                        circular: false,
                        drag: false,
                        get csize() {return [s.width,s.height]},
                        resize(px,py,pw,ph){self.resize(s,px,py,pw,ph)},
                        addMixin(n,o){
                          _.assert(!_.has(s,n),`Error: ${n} not available.`);
                          let b= s[n]= _.inject({},o);
                          b.added(s);
                        },
                        getContactPoints(){ return _corners(_sa(s.anchor),s.width,s.height) }});
        return s;
      },
      /**Define a mixin.
       * @memberof module:mojoh5/Sprites
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
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {...string} fs names of mixins
       * @return {Sprite} s
       */
      addMixin(s,...fs){
        fs.forEach(n=> _mixinAdd(s,n, _mixins.get(n)))
        return s;
      },
      /**Convert sprite to a polygonal shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Polygon}
       */
      toPolygon(s){
        let ps=s.m5.getContactPoints();
        return new Geo.Polygon(s.x,s.y).setOrient(s.rotation).set(ps);
      },
      /**Convert sprite to a circular shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle}
       */
      toCircle(s){
        this.assertCenter(s);
        let r=MFL(s.width/2),
            p= new Geo.Circle(r).setPos(s.x,s.y).setOrient(s.rotation);
        return p;
      },
      /**Get the PIXI global position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      gposXY(s){
        const p= s.getGlobalPosition();
        return _V.vec(p.x,p.y)
      },
      /**Check if sprite has anchor at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isTopLeft(s){
        return s.anchor.x < 0.3 && s.anchor.y < 0.3
      },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor.x > 0.3 && s.anchor.x < 0.7 &&
               s.anchor.y > 0.3 && s.anchor.y < 0.7;
      },
      /**Get the center position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      centerXY(s){
        let r,
            x=s.x,
            y=s.y;
        if(this.isCenter()){
          r=_V.vec(x,y)
        }else{
          let a= this.centerOffsetXY(s);
          r= _V.vec(x+a[0], y+a[1]);
          _V.reclaim(a);
        }
        return r;
      },
      /**PIXI operation, setting type of scaling to be used.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {boolean} b
       * @return {Sprite} s
       */
      setScaleModeNearest(s,b){
        s.texture.baseTexture.scaleMode = b ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR;
        return s;
      },
      /**Find the angle in radians between two sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      angle(s1, s2){
        let v2=this.centerXY(s2),
            v1=this.centerXY(s1),
            r= Math.atan2(v2[1] - v1[1], v2[0] - v1[0]);
        _V.reclaim(v2,v1);
        return r;
      },
      /**Move a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} dt
       * @return {Sprite} s
       */
      move(s,dt){
        dt=_.or(dt,1);
        s.x += s.m5.vel[0] * dt;
        s.y += s.m5.vel[1] * dt;
        return s;
      },
      /**Get the left side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      leftSide(s){
        const x=s.x,
              w= s.width,
              ax= s.anchor.x;
        if(ax>0.7) x -= w;
        else if(ax>0) x -= MFL(w/2);
        return x;
      },
      /**Get the right side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      rightSide(s){ return this.leftSide(s)+s.width },
      /**Get the top side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      topSide(s){
        let y= s.y,
            h= s.height,
            ay= s.anchor.y;
        if(ay>0.7) y -= h;
        else if(ay>0) y -= MFL(h/2);
        return y;
      },
      /**Get the bottom side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      bottomSide(s){ return this.topSide(s)+s.height },
      /**Get the sprite's bounding box, *ignoring* rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      getBBox(s){
        let r= {x1: this.leftSide(s),
                x2: this.rightSide(s),
                y1: this.topSide(s),
                y2: this.bottomSide(s)};
        _.assert(r.y1 <= r.y2);
        return r;
      },
      /**Create a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} left
       * @param {number} right
       * @param {number} top
       * @param {number} bottom
       * @return {object} {x1,x2,y1,y2}
       */
      bbox4(left,right,top,bottom){
        _.assert(top <= bottom);
        return {x1: left, x2: right, y1: top, y2: bottom}
      },
      /**Find the center of a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxCenter(b4){
        if(is.num(b4.x1))
          return _V.vec(MFL((b4.x1+b4.x2)/2), MFL((b4.y1+b4.y2)/2))
      },
      /**Find the size of the bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxSize(b4){
        return _V.vec(b4.x2-b4.x1, b4.y2-b4.y1)
      },
      /**Check if point is inside this bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} x
       * @param {number} y
       * @param {object} {x1,x2,y1,y2}
       * @return {boolean}
       */
      pointInBBox(x,y,box){
        return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
      },
      /**Find the bounding box of a sprite, taking account of it's
       * current rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      boundingBox(s){
        let c,z,
            x1,x2,
            y1,y2,
            x=[],y=[],
            hw=MFL(s.width/2),
            hh=MFL(s.height/2),
            theta=Math.tanh(hh/hw),
            H=Math.sqrt(hw*hw+hh*hh);
        //x2,y1
        z=Math.PI*2-theta + s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x2,y2
        z=theta+s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x1,y2
        z=Math.PI-theta + s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x1,y1
        z=Math.PI+theta+s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //find min & max on x and y axis
        c=this.centerXY(s);
        y.sort((a, b) => a - b);
        x.sort((a, b) => a - b);
        x1=MFL(x[0]+c[0]);
        x2=MFL(x[3]+c[0]);
        y1=MFL(y[0]+c[1]);
        y2=MFL(y[3]+c[1]);
        _V.reclaim(c);
        return {x1,x2,y1,y2};
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Vec2} point
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(point, s){
        return s.m5.circular ? Geo.hitTestPointCircle(point, this.toCircle(s))
                             : Geo.hitTestPointPolygon(point, this.toPolygon(s))
      },
      /**Check if there’s clear line of sight between two sprites.
       * memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} obstacles
       * @param {number} segment
       * @return {boolean}
       */
      lineOfSight(s1, s2, obstacles, segment=32){
        let s1c=this.centerXY(s1),
            s2c=this.centerXY(s2),
            v= _V.vecAB(s1c,s2c),
            dist= _V.len(v),
            u= _V.div(v,dist),
            pt= _V.vec(),
            bad=false;
        for(let mag,z= dist/segment,i=1; i<=z && !bad; ++i){
          mag = segment*i;
          pt[0]= s1c[0] + u[0] * mag;
          pt[1]= s1c[1] + u[1] * mag;
          bad= obstacles.some(o=> this.hitTestPoint(pt, o));
        }
        _V.reclaim(u,v,pt,s1c,s2c);
        return !bad;
      },
      /**Find distance between these 2 sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      distance(s1, s2){
        let c2=this.centerXY(s2),
            c1=this.centerXY(s1),
            r= _V.dist(c1,c2);
        _V.reclaim(c1,c2);
        return r;
      },
      /** @ignore */
      update(dt){
        _.rseq(Shaker, s=> s.m5.updateShake && s.m5.updateShake(dt))
      },
      /**Create a Texture object from this source.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @return {Texture}
       */
      mkTexture(source){ return this.tcached(source) },
      /**Scale all these sprites by the global scale factor.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} args
       */
      scaleContent(...args){
        if(args.length===1&&is.vec(args[0])){ args=args[0] }
        let f=Mojo.contentScaleFactor();
        args.forEach(s=>{
          s.scale.x=f.width;
          s.scale.y=f.height;
        })
      },
      /**Set the uuid of a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {any} id
       * @return {Sprite} s
       */
      uuid(s,id){ s.m5.uuid=id; return s },
      /**Set a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @param {any} v
       * @return {Sprite} s
       */
      pset(s,p,v){ s.g[p]=v; return s },
      /**Get a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @return {any}
       */
      pget(s,p){ return s.g[p] },
      /**Create a new Container object.
       * @memberof module:mojoh5/Sprites
       * @param {callback} cb use to configure the container properties
       * @return {Container}
       */
      container(cb){
        let s= new Mojo.PXContainer();
        _.assertNot(_.has(s,"m5")||_.has(s,"g"),"found m5+g properties");
        s= this.extend(s);
        cb && cb(s);
        return s;
      },
      /**Create a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} x
       * @param {number} y
       * @param {boolean} center
       * @return {Sprite}
       */
      sprite(source, x=0, y=0, center=false){
        let s= _sprite(source, o=> new Mojo.PXSprite(o));
        center && s.anchor.set(0.5,0.5);
        s=this.setXY(this.extend(s),x,y);
        return _.inst(Mojo.PXASprite,s) ? _exASprite(s) : s
      },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      tilingSprite(source, x=0, y=0,center=false){
        let s= _sprite(source,o=> new Mojo.PXTSprite(o));
        center && s.anchor.set(0.5,0.5);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spacing
       * @return {Texture[]}
       */
      animation(source, tileW, tileH, spacing = 0){
        let _frames=(src, w, h, pts)=>{
          return pts.map(p=> new Mojo.PXTexture(src.baseTexture,
                                                new Mojo.PXRect(p[0],p[1],w,h))) };
        let t=Mojo.tcached(source);
        if(!t)
          throw `Error: ${source} not loaded.`;
        let cols = MFL(t.width/tileW),
            rows = MFL(t.height/tileH),
            cells = cols*rows,
            pos= [];
        for(let x,y,i=0; i<cells; ++i){
          x= (i%cols) * tileW;
          y= MFL(i/cols) * tileH;
          if(spacing>0){
            x += spacing + (spacing * i % cols);
            y += spacing + (spacing * MFL(i/cols));
          }
          pos.push(_V.vec(x,y));
        }
        let ret= _frames(t, tileW, tileH,pos);
        _V.reclaim(...pos);
        return ret;
      },
      /**Create a PIXI.Texture from this source.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} width
       * @param {number} height
       * @param {number} x
       * @param {number} y
       * @return {Texture}
       */
      frame(source, width, height,x,y){
        const t= this.tcached(source);
        return new Mojo.PXTexture(t.baseTexture,new Mojo.PXRect(x, y, width,height));
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spaceX
       * @param {number} spaceY
       * @param {number} sx
       * @param {number} sy
       * @return {Texture[]}
       */
      frames(source,tileW,tileH,spaceX=0,spaceY=0,sx=0,sy=0){
        let t= Mojo.tcached(source),
            dx=tileW+spaceX,
            dy=tileH+spaceY,
            out=[],
            rows= MFL(t.height/dy),
            cols= MFL((t.width+spaceX)/dx);
        for(let y,r=0;r<rows;++r){
          y= sy + tileH*r;
          for(let x,c=0;c<cols;++c){
            x= sx + tileW*c;
            out.push(new Mojo.PXTexture(t.baseTexture,
                                        new Mojo.PXRect(x, y, tileW,tileH)));
          }
        }
        return out;
      },
      /**Cross reference these images to their corresponding textures.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {Texture[]}
       */
      frameImages(...pics){
        if(pics.length===1 && is.vec(pics[0])){ pics=pics[0] }
        return pics.map(p=> Mojo.tcached(p))
      },
      /**Create a PIXI AnimatedSprite from these images.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {AnimatedSprite}
       */
      spriteFrom(...pics){ return this.sprite(this.frameImages(pics)) },
      /**Create a PIXI.Text object.
       * @memberof module:mojoh5/Sprites
       * @param {string} content
       * @param {object} fontSpec
       * @param {number} x
       * @param {number} y
       * @return {Text}
       */
      text(content,fontSpec, x=0, y=0){
        let s=new Mojo.PXText(content,fontSpec);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} content
       * @param {object} fontStyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(content, fontStyle, x=0, y=0){
        let s= new Mojo.PXBText(content,fontStyle);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a rectangular sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number|string} fillStyle
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      rectangle(width, height,
                fillStyle = 0xFF3300,
                strokeStyle = 0x0033CC, lineWidth=0, x=0, y=0){
        let g=new Mojo.PXGraphics(),
            gprops={width:width,
                    height:height,
                    lineW:lineWidth,
                    fill: this.color(fillStyle),
                    stroke: this.color(strokeStyle) },
            draw=function(){
              g.clear();
              g.beginFill(gprops.fill);
              if(gprops.lineW>0)
                g.lineStyle(gprops.lineW, gprops.stroke, 1);
              g.drawRect(0, 0, gprops.width, gprops.height);
              g.endFill();
              return g;
            };
        draw();
        let s= new Mojo.PXSprite(this.genTexture(g));
        s=this.setXY(this.extend(s),x,y);
        s.m5.fillStyle=function(v){
          if(v !== undefined){
            gprops.fill= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.fill;
        };
        s.m5.strokeStyle=function(v){
          if(v !== undefined){
            gprops.stroke= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.stroke;
        };
        s.m5.lineWidth=function(v){
          if(v !== undefined){
            gprops.lineW= v;
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.lineW;
        };
        return s;
      },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        let g = new Mojo.PXGraphics();
        cb.apply(this, [g].concat(args));
        return this.extend(new Mojo.PXSprite(this.genTexture(g)))
      },
      /**Create a circular sprite by generating a texture.
       * @memberof module:mojoh5/Sprites
       * @param {number} diameter
       * @param {number|string} fillStyle
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      circle(radius,
             fillStyle=0xFF3300,
             strokeStyle=0x0033CC, lineWidth=0, x=0, y=0){
        let g = new Mojo.PXGraphics(),
            gprops={radius: radius,
                    lineW: lineWidth,
                    fill: this.color(fillStyle),
                    stroke: this.color(strokeStyle) },
            draw=function(){
              g.clear();
              g.beginFill(gprops.fill);
              if(gprops.lineW>0)
                g.lineStyle(grops.lineW, gprops.stroke, 1);
              g.drawCircle(0, 0, gprops.radius);
              g.endFill();
              return g;
            };
        draw();
        let s= new Mojo.PXSprite(this.genTexture(g));
        s=this.setXY(this.extend(s),x,y);
        s.anchor.set(0.5);
        s.m5.circular=true;
        s.m5.fillStyle=function(v){
          if(v !== undefined){
            gprops.fill= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.fill;
        };
        s.m5.strokeStyle=function(v){
          if(v !== undefined){
            gprops.stroke= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.stroke;
        };
        return sprite;
      },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @return {Sprite}
       */
      line(strokeStyle, lineWidth, A,B){
        let g = new Mojo.PXGraphics(),
            gprops={A: _V.clone(A),
                    B: _V.clone(B),
                    lineW: lineWidth,
                    stroke: this.color(strokeStyle) };
            draw=function(){
              g.clear();
              g.lineStyle(gprops.lineW, gprops.stroke, 1);
              g.moveTo(gprops.A[0], gprops.A[1]);
              g.lineTo(gprops.B[0], gprops.B[1]);
            };
        draw();
        let s=this.extend(g);
        s.m5.ptA=function(x,y){
          if(x !== undefined){
            gprops.A[0] = x;
            gprops.A[1] = _.or(y,x);
            draw();
          }
          return gprops.A;
        };
        s.m5.ptB=function(x,y){
          if(x !== undefined){
            gprops.B[0] = x;
            gprops.B[1] = _.or(y,x);
            draw();
          }
          return gprops.B;
        };
        s.m5.lineWidth=function(v){
          if(v !== undefined){
            gprops.lineW= v;
            draw();
          }
          return gprops.lineW;
        };
        s.m5.strokeStyle=function(v){
          if(v !== undefined){
            gprops.stroke= this.color(v);
            draw();
          }
          return gprops.stroke;
        };
        return s;
      },
      /**Check if a sprite is moving.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite}
       * @return {boolean}
       */
      moving(s){
        return !_.feq0(s.m5.vel[0]) || !_.feq0(s.m5.vel[1])
      },
      /**Create a 2d grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} ex
       * @param {number} ey
       * @param {number} cellW
       * @param {number} cellH
       * @return {number[][]}
       */
      makeCells(sx,sy,ex,ey,cellW,cellH){
        let cols=MFL((ex-sx)/cellW),
            rows=MFL((ey-sx)/cellH);
        return _mkgrid(sx,sy,rows,cols,cellW,cellH);
      },
      /**Create a square grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dim
       * @param {number} ration
       */
      gridSQ(dim,ratio=0.6){
        let sz= ratio* (Mojo.height<Mojo.width ?Mojo.height:Mojo.width),
            w=MFL(sz/dim),
            h=w,
            sy=MFL((Mojo.height-sz)/2),
            sx=MFL((Mojo.width-sz)/2);
        return _mkgrid(sx,sy,dim,dim,w,h);
      },
      /**Create a rectangular grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dimX
       * @param {number} dimY
       * @param {number} ratio
       * @return {number[][]}
       */
      gridXY(dimX,dimY,ratio=4/5){
        let szh=MFL(Mojo.height*ratio),
            szw=MFL(Mojo.width*ratio),
            z=MFL(szw>szh ? (szh/dimY) : (szw/dimX)),
            sy= MFL((Mojo.height-(z*dimY))/2),
            sx= MFL((Mojo.width-(z*dimX))/2);
        return _mkgrid(sx,sy,dimY,dimX,z,z);
      },
      /**Draw borders around this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBox(grid,lineWidth,lineColor){
        let ctx= new Mojo.PXGraphics(),
            gf = grid[0][0], //topleft
            n=grid[0].length,
            gl = grid[grid.length-1][n-1]; //btmright
        ctx.lineStyle(lineWidth,this.color(lineColor));
        ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
        return ctx;
      },
      /**Draw grid lines.
       * @memberof module:mojoh5/Sprites
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridLines(grid,lineWidth,lineColor){
        let ctx= new Mojo.PXGraphics(),
            h= grid.length,
            w= grid[0].length;
        ctx.lineStyle(lineWidth,this.color(lineColor));
        for(let r,y=1;y<h;++y){
          r=grid[y];
          ctx.moveTo(r[0].x1,r[0].y1);
          ctx.lineTo(r[w-1].x2,r[w-1].y1);
        }
        for(let r,x=1;x<w;++x){
          r=grid[0];
          ctx.moveTo(r[x].x1,r[x].y1);
          r=grid[h-1];
          ctx.lineTo(r[x].x1,r[x].y2);
        }
        return ctx;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      grid(cols, rows, cellW, cellH,
           centerCell, xOffset, yOffset, spriteCtor, extra){
        let len= cols*rows,
            cw2=MFL(cellW/2),
            ch2=MFL(cellH/2),
            C= this.container();
        for(let s,x,y,i=0; i<len; ++i){
          x = (i%cols) * cellW;
          y = MFL(i/cols) * cellH;
          s= spriteCtor();
          C.addChild(s);
          s.x = x + xOffset;
          s.y = y + yOffset;
          if(centerCell){
            s.x += cw2 - MFL(s.width/2);
            s.y += ch2 - MFL(s.height/2);
          }
          extra && extra(s);
        }
        return C;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      shoot(shooter, angle, container,
            bulletSpeed, bulletArray, bulletCtor,x,y){
        let soff=this.topLeftOffsetXY(shooter);
        let b= this.extend(bulletCtor());
        container.addChild(b);
        b.x= shooter.x+soff[0]+x;
        b.y= shooter.y+soff[1]+y;
        b.m5.vel[0] = Math.cos(angle) * bulletSpeed;
        b.m5.vel[1] = Math.sin(angle) * bulletSpeed;
        bulletArray.push(b);
        _V.reclaim(soff,g);
        return shooter;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      shake(s, magnitude=16, angular=false){
        let numberOfShakes=10,
            self = this,
            counter=1,
            startX = s.x,
            startY = s.y,
            startAngle = s.rotation,
            //Divide the magnitude into 10 units so that you can
            //reduce the amount of shake by 10 percent each frame
            magnitudeUnit = MFL(magnitude / numberOfShakes);
        function _upAndDownShake(){
          if(counter<numberOfShakes){
            s.x = startX;
            s.y = startY;
            magnitude -= magnitudeUnit;
            s.x += _.randInt2(-magnitude, magnitude);
            s.y += _.randInt2(-magnitude, magnitude);
            ++counter;
          }
          if(counter >= numberOfShakes){
            s.x = startX;
            s.y = startY;
            _.disj(Shaker,s);
          }
        }
        let tiltAngle = 1;
        function _angularShake(){
          if(counter<numberOfShakes){
            s.rotation = startAngle;
            magnitude -= magnitudeUnit;
            s.rotation = magnitude * tiltAngle;
            ++counter;
            //yoyo it
            tiltAngle *= -1;
          }
          if(counter >= numberOfShakes){
            s.rotation = startAngle;
            _.disj(Shaker,s);
          }
        }
        if(!_.has(Shaker,s)){
          Shaker.push(s);
          s.updateShake = () => angular ? _angularShake() : _upAndDownShake();
        }
      },
      /**Group a bunch of sprites together.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       * @return {Container}
       */
      group(...cs){
        if(cs.length===1 && is.vec(cs[0])){ cs=cs[0] }
        return this.container(c=> cs.forEach(s=> c.addChild(s)))
      },
      /**Add more children to this container.
       * @memberof module:mojoh5/Sprites
       * @param {Container} parent
       * @param {...any} children
       * @return {Container} parent
       */
      add(parent,...cs){
        cs.forEach(c=> c && parent.addChild(c));
        return parent;
      },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       */
      remove(...cs){
        if(cs.length===1 && is.vec(cs[0])){ cs=cs[0] }
        _.doseqEx(cs,s=>{
          if(s.parent)
            s.parent.removeChild(s);
          s.m5.dispose &&
            s.m5.dispose();
          EventBus.pub(["post.remove",s]);
        });
      },
      colorToRgbA(c){
        if(!c||!is.str(c)||c.length===0){return}
        let lc=c.toLowerCase(),
            code=SomeColors[lc];
        if(code){c=code}
        if(c[0]==="#"){
          if(c.length<7)
            c=`#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}${c.length>4?(c[4]+c[4]):""}`;
          return [parseInt(c.substr(1, 2), 16),
                  parseInt(c.substr(3, 2), 16),
                  parseInt(c.substr(5, 2), 16),
                  c.length>7 ? parseInt(c.substr(7, 2), 16)/255 : 1];
        }
        if(lc == "transparent"){ return [0,0,0,0] }
        if(lc.indexOf("rgb") === 0){
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a });
        }
      },
      /**Turn a number (0-255) into a 2-character hex number (00-ff).
       * @memberof module:mojoh5/Sprites
       * @param {number} n
       * @return {string}
       */
      byteToHex(num){
        //grab last 2 digits
        return ("0"+num.toString(16)).slice(-2)
      },
      /**Convert any CSS color to a hex representation.
       * @memberof module:mojoh5/Sprites
       * @param {string} color
       * @return {string}
       */
      colorToHex(color){
        // Examples:
        // colorToHex('red')            # '#ff0000'
        // colorToHex('rgb(255, 0, 0)') # '#ff0000'
        const rgba = this.colorToRgbA(color);
        return "0x"+ [0,1,2].map(i=> this.byteToHex(rgba[i])).join("");
      },
      /**Get the integer value of this color.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} value
       * @return {number}
       */
      color(value){
        return isNaN(value) ? parseInt(this.colorToHex(value)) : value
      },
      /** @ignore */
      resize(s,px,py,pw,ph){
        s && _.doseqEx(s.children,c=> c.m5&&c.m5.resize&&c.m5.resize(s.x,s.y,s.width,s.height))
      },
      /**Put b on top of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinTop(C,b,padY=10,alignX=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b);
        let y=boxA.y1-padY-(boxB.y2-boxB.y1);
        let x= (alignX<0.3) ? boxA.x1
                            : (alignX<0.7 ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : (b.anchor.y<0.7 ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
      },
      /**Place `b` below `C`.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinBottom(C,b,padY=10,alignX=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b);
        let y=boxA.y2+padY;
        let x=(alignX<0.3) ? boxA.x1 : ((alignX<0.7) ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
      },
      /**Place b at center of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       */
      pinCenter(C,b){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b);
        let x=cxA-w2B;
        let y=cyA-h2B;
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
      },
      /**Place b left of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinLeft(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,a);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b);
        let x= boxA.x1 - padX - (boxB.x2-boxB.x1);
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
      },
      /**Place b right of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinRight(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,a);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b);
        let x= boxA.x2 + padX;
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
      },
      /**Assign some mass to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} m
       */
      setMass(s,m){
        s.m5.mass=m;
        s.m5.invMass= _.feq0(m) ? 0 : 1/m;
      },
      /**Copied from pixi.legacy, why didn't they want to keep this????
       * so useful!
       * @memberof module:mojoh5/Sprites
       * @param {object} displayObject
       * @param {number} scaleMode
       * @param {number} resolution
       * @param {object} region
       * @return {RenderTexture}
       */
      genTexture(displayObject, scaleMode, resolution, region){
        region = region || displayObject.getLocalBounds(null, true);
        //minimum texture size is 1x1, 0x0 will throw an error
        if(region.width === 0){ region.width = 1 }
        if(region.height === 0){ region.height = 1 }
        let renderTexture = Mojo.PXRTexture.create({
          width: region.width | 0,
          height: region.height | 0,
          scaleMode: scaleMode,
          resolution: resolution
        });
        Mojo.PXMatrix.tx = -region.x;
        Mojo.PXMatrix.ty = -region.y;
        Mojo.ctx.render(displayObject, renderTexture,
                        false, Mojo.PXMatrix, !!displayObject.parent);
        return renderTexture;
      }
    };

    return (Mojo.Sprites= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sprites"]=function(M){
      return M.Sprites ? M.Sprites : _module(M,[])
    }
  }

})(this);




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

  /**Create the module.
   */
  function _module(Mojo, ScenesDict){

    const {u:_,is,EventBus}=Mojo;
    const MFL=Math.floor;

    /**
     * @module mojoh5/Scenes
     */

    /** @ignore */
    function _sceneid(id){
      return id.startsWith("scene::") ? id : `scene::${id}`
    }

    /** @ignore */
    function _killScene(s){
      if(s){
        s.dispose && s.dispose();
        s.parent.removeChild(s);
      }
    }

    /**
     * @memberof module:mojoh5/Scenes
     * @class
     * @property {string} name
     * @property {object} m5
     * @property {object} g  scene specific props go here
     */
    class Scene extends Mojo.PXContainer{
      /**
       * @param {string} id
       * @param {object|function} func
       * @param {object} [options]
       */
      constructor(id,func,options){
        super();
        this.name= _sceneid(id);
        this.____sid=id;
        if(is.fun(func)){
          this.____setup= func;
        }else if(is.obj(func)){
          let s= _.dissoc(func,"setup");
          if(s)
            func["____setup"]=s;
          _.inject(this, func);
        }
        this.m5={stage:true};
        this.g={};
        this.____index={};
        this.____queue=[];
        this.____options=_.or(options, {});
      }
      /**Callback to handle window resizing.
       * @param {number[]} old  window size before resize
       */
      onCanvasResize(old){
        Mojo.Sprites.resize({x:0,y:0,width:old[0],height:old[1],children:this.children})
      }
      /**Run this function after a delay in millis or frames.
       * @param {function}
       * @param {number} delay
       * @param {boolean} frames
       */
      future(expr,delay,frames=true){
        frames ? this.____queue.push([expr,delay]) : _.delay(delay,expr)
      }
      /**Get the child with this id.
       * @param {string} id
       * @return {Sprite}
       */
      getChildById(id){
        return id && this.____index[id];
      }
      /**Remove this child
       * @param {string|Sprite} c
       */
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c && _.has(this.children,c)){
          this.removeChild(c);
          _.dissoc(this.____index,c.m5.uuid);
        }
      }
      /**Insert this child sprite at this position.
       * @param {Sprite} c
       * @param {number} pos
       * @return {Sprite} c
       */
      insert(c,pos){
        if(pos !== undefined &&
           pos >= 0 && pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        return (this.____index[c.m5.uuid]=c)
      }
      /**Clean up.
      */
      dispose(){
        function _clean(o){
          o.children.length>0 && o.children.forEach(c=> _clean(c));
          if(o){
            const i=Mojo.Input;
            o.m5.button && i.undoButton(o);
            o.m5.drag && i.undoDrag(o);
          }
        }
        this.m5.dead=true;
        _clean(this);
        this.removeChildren();
      }
      /** @ignore */
      _iterStep(r,dt){
        r.forEach(c=>{
          if(c.m5 && c.m5.step){
            c.m5.step(dt);
            EventBus.pub(["post.step",c],dt);
          }
          c.children.length>0 && this._iterStep(c.children, dt)
        })
      }
      /** @ignore */
      _iterClean(r){
        r.forEach(c=> c.children.length>0 && this._iterClean(c.children))
      }
      /**
       * @param {number} dt
       */
      update(dt){
        if(this.m5.dead){return;}
        //handle queued stuff
        let f,futs= this.____queue.filter(q=>{
          q[1] -= 1;
          return (q[1]<=0);
        });
        //run ones that have expired
        while(futs.length>0){
          _.disj(this.____queue,f);
          f=futs.shift();
          f[0]();
        }
        EventBus.pub(["pre.update",this],dt);
        this._iterStep(this.children, dt);
        //this._iterClean(this.children);
        EventBus.pub(["post.update",this],dt);
      }
      /**Initial bootstrap of this scene.
      */
      runOnce(){
        if(this.____setup){
          this.____setup(this.____options);
          delete this.____setup;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //the module
    const _$={
      Scene,
      /**Lay items out horizontally.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      layoutX(items,options){
        const {Sprites}=Mojo,
              K=Mojo.contentScaleFactor();
        if(items.length===0){return}
        options= _.patch(options,{color:0,
                                  padding:10,
                                  fit:20,
                                  borderWidth:4,
                                  border:0xffffff});
        let borderWidth=options.borderWidth * K.width;
        let C=options.group || Sprites.group();
        let pad=options.padding * K.width;
        let fit= options.fit * K.width;
        let p,fit2= 2*fit;
        //adding left -> right
        items.forEach((s,i)=>{
          if(!options.skipAdd) C.addChild(s);
          _.assert(s.anchor.x<0.3&&s.anchor.y<0.3,"wanted topleft anchor");
          if(i>0)
            Sprites.pinRight(p,s,pad);
          p=s;
        });
        let [w,h]= [C.width, C.height];
        let last=_.tail(items);
        if(options.bg != "transparent"){
          //create a backdrop
          let r= Sprites.rectangle(w+fit2,h+fit2,
                                   options.bg,
                                   options.border, borderWidth);
          r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
          C.addChildAt(r,0); //add to front so zindex is lowest
        }
        //final width,height,center
        h= C.height;
        w= C.width;
        let [w2,h2]=[MFL(w/2), MFL(h/2)];
        //refit the items on y-axis
        items.forEach(s=> s.y=h2-MFL(s.height/2));
        let wd= w-(last.x+last.width);
        wd= MFL(wd/2);
        //refit the items on x-axis
        items.forEach(s=> s.x += wd);
        //may be center the whole thing
        C.x= _.or(options.x, MFL((Mojo.width-w)/2));
        C.y= _.or(options.y, MFL((Mojo.height-h)/2));
        C.m5.resize=function(px,py,pw,ph){
          let cs=C.children.slice();
          let [cx,cy]=[C.x,C.y];
          C.removeChildren();
          C.x=C.y=0;
          options.group=C;
          cs.forEach(c=>{
            c.x=c.y=0;
            c.m5&&c.m5.resize&&c.m5.resize();
          });
          let s=this.layoutX(cs,options);
          _.assert(s===C);
          if(s.parent.m5 && s.parent.m5.stage){
            s.x= cx * MFL(Mojo.width/pw);
            s.y= cy * MFL(Mojo.height/ph);
          }else{
            s.x= cx * MFL(s.parent.width/pw);
            s.y= cy * MFL(s.parent.height/ph);
          }
        };
        return C;
      },
      /**Lay items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      layoutY(items,options){
        const {Sprites}= Mojo,
              K=Mojo.contentScaleFactor();
        if(items.length===0){return}
        options= _.patch(options,{color:0,
                                  fit:20,
                                  padding:10,
                                  borderWidth:4,
                                  border:0xffffff});
        let borderWidth= options.borderWidth * K.width;
        let C=options.group || Sprites.group();
        let pad= options.padding * K.width;
        let fit = options.fit * K.width;
        let p,fit2=fit*2;
        //add items top -> bottom
        items.forEach((s,i)=>{
          if(!options.skipAdd) C.addChild(s);
          if(i>0)
            Sprites.pinBottom(p,s,pad);
          p=s;
        });
        let [w,h]= [C.width, C.height];
        let last=_.tail(items);
        if(options.bg!="transparent"){
          //backdrop
          let r= Sprites.rectangle(w+fit2, h+fit2,
                                   options.bg, options.border, borderWidth);
          r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
          C.addChildAt(r,0);
        }
        w= C.width;
        h= C.height;
        let [w2,h2] =[MFL(w/2), MFL(h/2)];
        //realign on x-axis
        items.forEach(s=> s.x=w2-MFL(s.width/2));
        let hd= h-(last.y+last.height);
        hd= MFL(hd/2);
        //realign on y-axis
        items.forEach(s=> s.y += hd);
        //may be center the whole thing
        C.x= _.or(options.x, MFL((Mojo.width-w)/2));
        C.y= _.or(options.y, MFL((Mojo.height-h)/2));
        C.m5.resize=function(px,py,pw,ph){
          let cs=C.children.slice();
          let [cx,cy]=[C.x,C.y];
          C.removeChildren();
          C.x=C.y=0;
          options.group=C;
          cs.forEach(c=>{
            c.x=c.y=0;
            c.m5&&c.m5.resize&&c.m5.resize();
          });
          let s=this.layoutY(cs,options);
          _.assert(s===C);
          if(s.parent.m5 && s.parent.m5.stage){
            s.x= cx * MFL(Mojo.width/pw);
            s.y= cy * MFL(Mojo.height/ph);
          }else{
            s.x= cx * MFL(s.parent.width/pw);
            s.y= cy * MFL(s.parent.height/ph);
          }
        };
        return C;
      },
      /**Define a scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object|function} func
       * @param {object} [options]
       */
      defScene(name, func, options){
        //add a new scene definition
        ScenesDict[name]=[func, options||{}];
      },
      /**Replace the current scene with this one.
       * @memberof module:mojoh5/Scenes
       * @param {string} cur
       * @param {string} name
       * @param {object} [options]
       */
      replaceScene(cur,name,options){
        //console.log("replacescene: " + cur +", " + _sceneid(cur) + ", name= "+name);
        const c= Mojo.stage.getChildByName(_sceneid(cur));
        if(!c)
          throw `Error: no such scene: ${cur}`;
        return this.runScene(name, Mojo.stage.getChildIndex(c),options);
      },
      /**Remove these scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...Scene} args
       */
      removeScene(...args){
        if(args.length===1 && is.vec(args[0])){ args=args[0] }
        args.forEach(a=>{
          if(is.str(a))
            _killScene(Mojo.stage.getChildByName(_sceneid(a)));
          else if(a)
            _killScene(a);
        })
      },
      /**Remove all the scenes.
       * @memberof module:mojoh5/Scenes
       */
      removeScenes(){
        while(Mojo.stage.children.length>0)
          _killScene(Mojo.stage.children[Mojo.stage.children.length-1])
      },
      /**Find this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @return {Scene}
       */
      findScene(name){
        return Mojo.stage.getChildByName(_sceneid(name))
      },
      /**Run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene}
       */
      runScene(name,num,options){
        let y, _s = ScenesDict[name];
        if(!_s)
          throw `Error: unknown scene: ${name}`;
        if(is.obj(num)){
          options = num;
          num = _.dissoc(options,"slot");
        }
        options = _.inject({},_s[1],options);
        if(is.undef(num))
          num= options["slot"] || -1;
        //before we run a new scene
        Mojo.pointer.reset();
        //create new
        y = new Scene(name, _s[0], options);
        //add to where?
        if(num >= 0 && num < Mojo.stage.children.length){
          let cur= Mojo.stage.getChildAt(num);
          Mojo.stage.addChildAt(y,num);
          _killScene(cur);
        }else{
          Mojo.stage.addChild(y);
        }
        y.runOnce();
        return y;
      }
    };

    return (Mojo.Scenes=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Scenes"]=function(M){
      return M.Scenes ? M.Scenes : _module(M, {})
    }
  }

})(this);



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
  if(!gscope.AudioContext){
    throw "Fatal: no audio."
  }

  const CON=console,
        MFL=Math.floor;

  /**Create the module.
   */
  function _module(Mojo,_sounds){
    /**
     * @module mojoh5/sound
     */
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();

    /** @ignore */
    function _make(_A,name, url){
      const s={
        soundNode: null,
        buffer: null,
        src: url,
        name: name,
        loop: false,
        playing: false,
        panValue: 0,
        volumeValue: 1,
        startTime: 0,
        startOffset: 0,
        playbackRate: 1,
        echo: false,
        delayValue: 0.3,
        feebackValue: 0.3,
        filterValue: 0,
        reverb: false,
        reverbImpulse: null,
        gainNode: _A.ctx.createGain(),
        panNode: _A.ctx.createStereoPanner(),
        delayNode: _A.ctx.createDelay(),
        feedbackNode: _A.ctx.createGain(),
        filterNode: _A.ctx.createBiquadFilter(),
        convolverNode: _A.ctx.createConvolver(),
        play(){
          this.startTime = _A.ctx.currentTime;
          this.soundNode = _A.ctx.createBufferSource();
          this.soundNode.buffer = this.buffer;
          this.soundNode.playbackRate.value = this.playbackRate;
          this.soundNode.connect(this.gainNode);
          if(!this.reverb){
            this.gainNode.connect(this.panNode);
          }else{
            this.gainNode.connect(this.convolverNode);
            this.convolverNode.connect(this.panNode);
            this.convolverNode.buffer = this.reverbImpulse;
          }
          this.panNode.connect(_A.ctx.destination);
          if(this.echo){
            this.feedbackNode.gain.value = this.feebackValue;
            this.delayNode.delayTime.value = this.delayValue;
            this.filterNode.frequency.value = this.filterValue;
            this.delayNode.connect(this.feedbackNode);
            if(this.filterValue > 0){
              this.feedbackNode.connect(this.filterNode);
              this.filterNode.connect(this.delayNode);
            }else{
              this.feedbackNode.connect(this.delayNode);
            }
            this.gainNode.connect(this.delayNode);
            this.delayNode.connect(this.panNode);
          }
          this.soundNode.loop = this.loop;
          this.soundNode.start(0, this.startOffset % this.buffer.duration);
          this.playing = true;
        },
        _stop(){
          if(this.playing)
            this.soundNode.stop(0)
        },
        pause(){
          this._stop();
          if(this.playing){
            this.playing = false;
            this.startOffset += _A.ctx.currentTime - this.startTime;
          }
        },
        playFrom(value){
          this._stop();
          this.startOffset = value;
          this.play();
        },
        restart(){
          this.playFrom(0)
        },
        setEcho(delayValue, feedbackValue, filterValue){
          this.feebackValue = _.or(feedbackValue,0.3);
          this.delayValue = _.or(delayValue,0.3);
          this.filterValue = _.or(filterValue,0);
          this.echo = true;
        },
        setReverb(duration, decay, reverse){
          let r= _A.ctx.sampleRate;
          let len= r * (duration || 2);
          let b= _A.ctx.createBuffer(2, len, r);
          this.reverb = true;
          this.reverbImpulse= b;
          for(let v,d=decay||2,
            cl= b.getChannelData(0),//left
            cr= b.getChannelData(1),//right
            i= reverse?(len-1):0;;){
            if(reverse){
              if(i<0)break;
            }else{
              if(i>=len)break;
            }
            v=Math.pow(1-i/len,d);
            cl[i]= v * (2*_.rand()-1);
            cr[i]= v * (2*_.rand()-1);
            reverse ? --i : ++i;
          }
        },
        fade(endValue, durationSecs){
          if(this.playing){
            this.gainNode.gain.linearRampToValueAtTime(this.gainNode.gain.value, _A.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(endValue, _A.ctx.currentTime + durationSecs)
          }
        },
        fadeIn(durationSecs){
          this.gainNode.gain.value = 0;
          this.fade(1, durationSecs)
        },
        fadeOut(durationSecs){
          this.fade(0, durationSecs)
        },
        get pan() { return this.panNode.pan.value },
        set pan(v) { this.panNode.pan.value = v },
        get volume() { return this.volumeValue },
        set volume(v) { this.gainNode.gain.value = v; this.volumeValue = v }
      };
      return _sounds[name]=s;
    };

    const _$={
      ctx: new gscope.AudioContext(),
      /**Decode these sound bytes.
       * @memberof module:mojoh5/sound
       * @param {string} name
       * @param {any} url
       * @param {any} blob
       * @param {function} onLoad
       * @param {function} [onFail]
       * @return {object}
       */
      decodeContent(name, url,blob, onLoad, onFail){
        let snd= _make(this,name, url);
        _A.ctx.decodeAudioData(blob, b=>{ onLoad(snd.buffer=b);
                                          CON.log(`decoded sound file:${url}`); },
                                     e=> { onFail && onFail(url,e) });
        return snd;
      },
      /**Decode the sound file at this url.
       * @memberof module:mojoh5/sound
       * @param {string} name
       * @param {any} url
       * @param {function} onLoad
       * @param {function} [onFail]
       * @return {object}
       */
      decodeUrl(name, url, onLoad, onFail){
        let xhr= new XMLHttpRequest();
        let snd= _make(this,name, url);
        xhr.open("GET", url, true);
        xhr.responseType="arraybuffer";
        xhr.addEventListener("load", ()=>{
          this.decodeContent(url, xhr.response, onLoad, onFail)
        });
        xhr.send();
        return snd;
      }
    };

    /**Extend Mojo */
    Mojo.sound=function(fname){
      return _sounds[Mojo.assetPath(fname)] || _.assert(false, `${fname} not loaded.`)
    };

    return (Mojo.Sound= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sound"]=function(M){
      return M.Sound ? M.Sound : _module(M, {})
    };
  }

})(this);



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

  /**Creates the module.
   */
  function _module(Mojo,_activeTouches,_buttons,_drags){
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();
    const _keyInputs= _.jsMap();
    const {EventBus}=Mojo;

    /**
     * @module mojoh5/input
     */

    /** @ignore */
    function _uh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,false); }

    /** @ignore */
    function _dh(e){
      e.preventDefault();
      _keyInputs.set(e.keyCode,true); }

    /** @ignore */
    function _updateDrags(ptr){
      if(ptr && ptr.isDown){
        if(!ptr.dragged){
          for(let s,i=_drags.length-1; i>=0; --i){
            s=_drags[i];
            if(s.m5.drag && ptr.hitTest(s)){
              let cs= s.parent.children,
                  g=Mojo.Sprites.gposXY(s);
              ptr.dragOffsetX = ptr.x - g[0];
              ptr.dragOffsetY = ptr.y - g[1];
              ptr.dragged = s;
              //pop it up to top
              _.disj(cs,s);
              _.conj(cs,s);
              _.disj(_drags,s);
              _.conj(_drags,s);
              break;
            }
          }
        }else{
          ptr.dragged.x= ptr.x - ptr.dragOffsetX;
          ptr.dragged.y= ptr.y - ptr.dragOffsetY;
        }
      }
      if(ptr && ptr.isUp){
        ptr.dragged=null;
      }
    }

    const _$={
      keyLEFT: 37, keyRIGHT: 39, keyUP: 38, keyDOWN: 40,
      keyZERO: 48, keyONE: 49, keyTWO: 50,
      keyTHREE: 51, keyFOUR: 52, keyFIVE: 53,
      keySIX: 54, keySEVEN: 55, keyEIGHT: 56, keyNINE: 57,
      keyA: 65, keyB: 66, keyC: 67, keyD: 68, keyE: 69, keyF: 70,
      keyG: 71, keyH: 72, keyI: 73, keyJ: 74, keyK: 75, keyL: 76,
      keyM: 77, keyN: 78, keyO: 79, keyP: 80, keyQ: 81, keyR: 82,
      keyS: 83, keyT: 84, keyU: 85, keyV: 86, keyW: 87, keyX: 88,
      keyY: 89, keyZ: 90,
      keyENTER: 13, keyESC: 27, keyBACKSPACE: 8, keyTAB: 9,
      keySHIFT: 16, keyCTRL: 17, keyALT: 18, keySPACE: 32,
      keyHOME: 36, keyEND: 35,
      keyPGGUP: 33, keyPGDOWN: 34,
      ptr:null,
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/input
       */
      resize(){
        this.ptr && this.ptr.dispose();
        Mojo.pointer= this.pointer(Mojo.canvas, Mojo.scale);
      },
      /**Clear all keyboard states.
       * @memberof module:mojoh5/input
       */
      reset(){ _keyInputs.clear() },
      /**
       * @memberof module:mojoh5/input
       * @param {number} _key
       */
      keyboard(_key){
        //press: undefined, //release: undefined,
        const key={
          isDown: false,
          isUp: true,
          code: _key,
          _down(e){
            e.preventDefault();
            if(e.keyCode === key.code){
              key.isUp &&
                key.press && key.press();
              key.isUp=false;
              key.isDown=true;
            }
          },
          _up(e){
            e.preventDefault();
            if(e.keyCode === key.code){
              key.isDown &&
                key.release && key.release();
              key.isUp=true;
              key.isDown=false;
            }
          }
        };
        _.addEvent([["keyup", window, key._up, false],
                    ["keydown", window, key._down, false]]);
        return key;
      },
      /**This sprite is no longer a button.
       * @memberof module:mojoh5/input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoButton(b){
        b.m5.enabled=false;
        b.m5.button=false;
        _.disj(_buttons,b);
        return b;
      },
      /**This sprite is now a button.
       * @memberof module:mojoh5/input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeButton(b){
        b.m5.enabled = true;
        b.m5.button=true;
        _.conj(_buttons,b);
        return b;
      },
      /** @ignore */
      update(dt){
        _drags.length>0 && _updateDrags(this.ptr)
      },
      /**This sprite is now draggable.
       * @memberof module:mojoh5/input
       * @param {Sprite} s
       * @return {Sprite}
       */
      makeDrag(s){
        _.conj(_drags,s);
        s.m5.drag=true;
        return s;
      },
      /**This sprite is now not draggable.
       * @memberof module:mojoh5/input
       * @param {Sprite} s
       * @return {Sprite}
       */
      undoDrag(s){
        _.disj(_drags,s);
        s.m5.drag=false;
        return s;
      },
      /**Check if this key is currently not pressed.
       * @memberof module:mojoh5/input
       * @param {number} code
       * @return {boolean}
       */
      keyUp(code){ return !this.keyDown(code) },
      /**Check if this key is currently pressed.
       * @memberof module:mojoh5/input
       * @param {number} code
       * @return {boolean}
       */
      keyDown(code){ return _keyInputs.get(code)===true },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/input
       * @return {object}
       */
      pointer(){
        let ptr={
          state: [false,true,false],
          //tapped: false,
          //isDown: false,
          //isUp: true,
          _visible: true,
          _x: 0,
          _y: 0,
          width: 1,
          height: 1,
          downTime: 0,
          elapsedTime: 0,
          dragged: null,
          dragOffsetX: 0,
          dragOffsetY: 0,
          anchor: Mojo.makeAnchor(0.5,0.5),
          get cursor() { return Mojo.canvas.style.cursor },
          set cursor(v) { Mojo.canvas.style.cursor = v },
          get x() { return this._x / Mojo.scale },
          get y() { return this._y / Mojo.scale },
          get visible() { return this._visible },
          set visible(v) {
            this.cursor = v ? "auto" : "none";
            this._visible = v;
          },
          getGlobalPosition(){
            return {x: this.x, y: this.y}
          },
          press(){
            for(let s,i=0,z=_buttons.length;i<z;++i){
              s=_buttons[i];
              if(s.m5.enabled &&
                 s.m5.press &&
                 ptr.hitTest(s)){
                s.m5.press(s);
                break;
              }
            }
          },
          tap(){
            ptr.press();
          },
          mouseDown(e){
            //left click only
            if(e.button===0){
              ptr._x = e.pageX - e.target.offsetLeft;
              ptr._y = e.pageY - e.target.offsetTop;
              ptr.downTime = _.now();
              //down,up,pressed
              _.setVec(ptr.state,true,false,true);
              e.preventDefault();
              EventBus.pub(["mousedown"]);
            }
          },
          mouseMove(e){
            ptr._x = e.pageX - e.target.offsetLeft;
            ptr._y = e.pageY - e.target.offsetTop;
            //e.preventDefault();
            EventBus.pub(["mousemove"]);
          },
          mouseUp(e){
            if(e.button===0){
              ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
              ptr._x = e.pageX - e.target.offsetLeft;
              ptr._y = e.pageY - e.target.offsetTop;
              _.setVec(ptr.state,false,true);
              //ptr.isDown = false;
              //ptr.isUp = true;
              if(ptr.state[2]){//pressed
                ptr.press();
                ptr.state[2]=false;
              }
              e.preventDefault();
              EventBus.pub(["mouseup"]);
            }
          },
          _copyTouch(t,target){
            return{offsetLeft:target.offsetLeft,
                   offsetTop:target.offsetTop,
                   clientX:t.clientX,
                   clientY:t.clientY,
                   pageX:t.pageX,
                   pageY:t.pageY,
                   identifier:t.identifier}
          },
          touchStart(e){
            let ct=e.changedTouches; //multitouch
            //let tt=e.targetTouches;//single touch
            let t = e.target;
            let tid=ct[0].identifier||0;
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            ptr.downTime = _.now();
            _.setVec(ptr.state,true,false,true);
            //ptr.isDown = true; ptr.isUp = false; ptr.tapped = true;
            e.preventDefault();
            _.assoc(_activeTouches,tid,ptr._copyTouch(ct[0],t));
            EventBus.pub(["touchstart"]);
          },
          touchMove(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(_activeTouches,tid);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            e.preventDefault();
            EventBus.pub(["touchmove"]);
          },
          touchEnd(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(_activeTouches,tid);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            _.setVec(ptr.state,false,true);
            //ptr.isDown = false; ptr.isUp = true;
            ptr.elapsedTime = Math.abs(ptr.downTime - _.now());
            if(ptr.state[2]){
              if(active && ptr.elapsedTime <= 200){
                ptr.tap();
              }
              ptr.state[2]=false;
            }
            e.preventDefault();
            EventBus.pub(["touchend"]);
          },
          touchCancel(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t=e.target;
            let t0=ct[0];
            let tid= touch.identifier || 0;
            let active = _.get(_activeTouches,tid);
            e.preventDefault();
            if(active)
              _.dissoc(_activeTouches,tid);
          },
          reset(){
            _.setVec(ptr.state,false,true,false);
            //ptr.pressed=false; ptr.tapped=false; ptr.isDown=false; ptr.isUp=true;
          },
          hitTest(s){
            return Mojo["2d"].hitTestPointXY(ptr.x,ptr.y,s,true)
          },
          dispose(){
            _.delEvent([["mousemove", Mojo.canvas, ptr.mouseMove],
                        ["mousedown", Mojo.canvas,ptr.mouseDown],
                        ["mouseup", window, ptr.mouseUp],
                        ["touchmove", Mojo.canvas, ptr.touchMove],
                        ["touchstart", Mojo.canvas, ptr.touchStart],
                        ["touchend", window, ptr.touchEnd],
                        ["touchcancel", window, ptr.touchCancel]]);
          }
        };
        _.addEvent([["mousemove", Mojo.canvas, ptr.mouseMove],
                    ["mousedown", Mojo.canvas,ptr.mouseDown],
                    ["mouseup", window, ptr.mouseUp],
                    ["touchmove", Mojo.canvas, ptr.touchMove],
                    ["touchstart", Mojo.canvas, ptr.touchStart],
                    ["touchend", window, ptr.touchEnd],
                    ["touchcancel", window, ptr.touchCancel]]);
        //disable the default actions on the canvas
        Mojo.canvas.style.touchAction = "none";
        return this.ptr=ptr;
      }
    };

    //handle resize
    EventBus.sub(["canvas.resize"], "resize",_$);

    //keep tracks of keyboard presses
    _.addEvent([["keyup", window, _uh, false],
                ["keydown", window, _dh, false]]);

    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M,new Map(),[],[])
    }
  }

})(this);


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

  /**Create the module.
   */
  function _module(Mojo){
    const {is,u:_}=Mojo,
          P8=Math.PI/8;

    /**
     * @module mojoh5/touch
     */

    /** @ignore */
    function _calcPower(s,cx,cy){
      const a= +cx;
      const b= +cy;
      return Math.min(1, Math.sqrt(a*a + b*b)/s.m5.outerRadius)
    }

    /** @ignore */
    function _calcDir(cx,cy){
      const rad= Math.atan2(+cy, +cx);
      let ret= Mojo.TOP_RIGHT;
      if((rad >= -P8 && rad<0) || (rad >= 0 && rad<P8)){
        ret= Mojo.RIGHT
      }
      else if(rad >= P8 && rad < 3*P8){
        ret= Mojo.BOTTOM_RIGHT
      }
      else if(rad >= 3*P8 && rad < 5*P8){
        ret= Mojo.BOTTOM
      }
      else if(rad >= 5*P8 && rad < 7*P8){
        ret= Mojo.BOTTOM_LEFT
      }
      else if((rad >= 7*P8 && rad<Math.PI) || (rad >= -Math.PI && rad < -7*P8)){
        ret= Mojo.LEFT
      }
      else if(rad >= -7*P8 && rad < -5*P8){
        ret= Mojo.TOP_LEFT
      }
      else if(rad >= -5*P8 && rad < -3*P8){
        ret= Mojo.TOP
      }
      return ret
    }

    /** @ignore */
    function _bindEvents(s){
      function onDragStart(e){
        let ct=e.changedTouches;
        let t= e.target;
        if(ct){
          s.m5.startX= ct[0].pageX - t.offsetLeft;
          s.m5.startY= ct[0].pageY - t.offsetTop;
          s.m5.touchId=ct[0].identifier;
        }else{
          s.m5.startX= e.pageX - t.offsetLeft;
          s.m5.startY= e.pageY - t.offsetTop;
          s.m5.touchId=0;
        }
        s.m5.drag= true;
        s.m5.inner.alpha = 1;
        s.m5.onStart();
      }
      function onDragEnd(e){
        if(s.m5.drag){
          s.m5.inner.alpha = s.m5.innerAlphaStandby;
          s.m5.inner.position.set(0,0);
          s.m5.drag= false;
          s.m5.onEnd();
        }
      }
      function onDragMove(e){
        if(!s.m5.drag){return}
        let ct=e.changedTouches;
        let t= e.target;
        let cx=null;
        let cy=null;
        if(ct){
          for(let i=0; i< ct.length; ++i){
            if(s.m5.touchId === ct[i].identifier){
              cx= ct[i].pageX-t.offsetLeft;
              cy= ct[i].pageY-t.offsetTop;
              break;
            }
          }
        }else{
          cx= e.pageX - t.offsetLeft;
          cy= e.pageY - t.offsetTop;
        }
        if(cx===null||cy===null){return}
        let sideX = cx - s.m5.startX;
        let sideY = cy - s.m5.startY;
        let calRadius = 0;
        let angle = 0;
        cx=0;
        cy=0;
        if(sideX === 0 && sideY === 0){return}
        if(sideX * sideX + sideY * sideY >= s.m5.outerRadius * s.m5.outerRadius){
          calRadius = s.m5.outerRadius
        }else{
          calRadius = s.m5.outerRadius - s.m5.innerRadius
        }
        /**
         * x:   -1 <-> 1
         * y:   -1 <-> 1
         *          Y
         *          ^
         *          |
         *     180  |  90
         *    ------------> X
         *     270  |  360
         *          |
         *          |
         */
        let direction=Mojo.LEFT;
        let sx=Math.abs(sideX);
        let sy=Math.abs(sideY);
        let power=0;
        if(sideX === 0){
          if(sideY>0){
            cx=0;
            cy=sideY>s.m5.outerRadius ? s.m5.outerRadius : sideY;
            angle=270;
            direction=Mojo.BOTTOM;
          }else{
            cx=0;
            cy= -(sy > s.m5.outerRadius ? s.m5.outerRadius : sy);
            angle = 90;
            direction = Mojo.TOP;
          }
          s.m5.inner.position.set(cx,cy);
          power = _calcPower(s,cx,cy);
          s.m5.onChange(direction,angle,power);
        } else if(sideY === 0){
          if(sideX>0){
            cx=sx > s.m5.outerRadius ? s.m5.outerRadius : sx;
            cy=0;
            angle=0;
            direction = Mojo.LEFT;
          }else{
            cx=-(sx > s.m5.outerRadius ? s.m5.outerRadius : sx);
            cy=0;
            angle = 180;
            direction = Mojo.RIGHT;
          }
          s.m5.inner.position.set(cx,cy);
          power = _calcPower(s,cx,cy);
          s.m5.onChange(direction, angle, power);
        }else{
          let tanVal= Math.abs(sideY/sideX);
          let radian= Math.atan(tanVal);
          angle = radian*180/Math.PI;
          cx=cy=0;
          if(sideX*sideX + sideY*sideY >= s.m5.outerRadius*s.m5.outerRadius){
            cx= s.m5.outerRadius * Math.cos(radian);
            cy= s.m5.outerRadius * Math.sin(radian);
          }else{
            cx= sx > s.m5.outerRadius ? s.m5.outerRadius : sx;
            cy= sy > s.m5.outerRadius ? s.m5.outerRadius : sy;
          }
          if(sideY<0)
            cy= -Math.abs(cy);
          if(sideX<0)
            cx= -Math.abs(cx);
          if(sideX>0 && sideY<0){
            // < 90
          } else if(sideX<0 && sideY<0){
            // 90 ~ 180
            angle= 180 - angle;
          } else if(sideX<0 && sideY>0){
            // 180 ~ 270
            angle= angle + 180;
          } else if(sideX>0 && sideY>0){
            // 270 ~ 369
            angle= 360 - angle;
          }
          power= _calcPower(s,cx,cy);
          direction= _calcDir(cx,cy);
          s.m5.inner.position.set(cx,cy);
          s.m5.onChange(direction, angle, power);
        }
      }
      _.addEvent([["mousemove", Mojo.canvas, onDragMove],
                  ["mousedown", Mojo.canvas, onDragStart],
                  ["mouseup", window, onDragEnd],
                  ["touchend", window, onDragEnd],
                  ["touchcancel", window, onDragEnd],
                  ["touchmove", Mojo.canvas, onDragMove],
                  ["touchstart", Mojo.canvas, onDragStart]]);
    }

    const _$={
      /**Create the joystick.
       * @memberof module:mojoh5/touch
       * @param {object} options
       * @return {PIXIContainer} the stick
       */
      joystick(options){
        let mo= _.inject({outerScaleX:1,
                          outerScaleY:1,
                          outerRadius:0,
                          innerRadius:0,
                          innerScaleX:1,
                          innerScaleY:1,
                          innerAlphaStandby:0.5,
                          onStart(){},
                          onEnd(){},
                          onChange(dir,angle,power){}}, options);
        let outer= mo.outer= Mojo.Sprites.sprite("joystick.png");
        let inner= mo.inner= Mojo.Sprites.sprite("joystick-handle.png");
        let stick=new PIXI.Container();
        stick.m5=mo;
        outer.alpha = 0.5;
        outer.anchor.set(0.5);
        inner.anchor.set(0.5);
        inner.alpha = mo.innerAlphaStandby;
        outer.scale.set(mo.outerScaleX, mo.outerScaleY);
        inner.scale.set(mo.innerScaleX, mo.innerScaleY);
        stick.addChild(outer);
        stick.addChild(inner);
        mo.outerRadius = stick.width / 2.5;
        mo.innerRadius = inner.width / 2;
        _bindEvents(stick);
        return stick;
      }
    };

    return (Mojo.Touch=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Touch"]=function(M){
      return M.Touch ? M.Touch : _module(M)
    }
  }

})(this);



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

  /**Create the module.
   */
  function _module(Mojo){
    const {EventBus, is, u:_}=gscope["io/czlab/mcfud/core"]();
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const ABS=Math.abs,
          MFL=Math.floor;

    /**
     * @module mojoh5/2d
     */

    /** @ignore */
    function _pointInPoly(testx,testy,points){
      let nvert=points.length;
      let c=false;
      for(let p,q, i=0, j=nvert-1; i<nvert;){
        p=points[i];
        q=points[j];
        if(((p[1]>testy) !== (q[1]>testy)) &&
          (testx < (q[0]-p[0]) * (testy-p[1]) / (q[1]-p[1]) + p[0])) c = !c;
        j=i;
        ++i;
      }
      return c;
    }

    /**Define a mixin object.
     */
    Mojo.defMixin("2d",function(e){
      const B=Mojo.EventBus;
      const self={};
      const signals=[[["hit",e],"boom",self],
                     [["post.remove",e],"dispose",self]];
      self.dispose=function(){
        signals.forEach(s=> B.unsub.apply(B,s))
      };
      self.boom=function(col){
        if(false && col.obj.p && col.obj.p.sensor){
          //EventBus.pub("sensor", col.obj, this.entity);
        }else{
          let dx= ABS(e.m5.vel[0]);
          let dy= ABS(e.m5.vel[1]);
          col.impact = null;
          e.x -= col.overlapV[0];
          e.y -= col.overlapV[1];
          if(col.overlapN[1] < -0.3){
            if(!e.m5.skipCollide && e.m5.vel[1] < 0){
              e.m5.vel[1] = 0;
            }
            col.impact = dy;
            EventBus.pub(["bump.top", e],col);
          }
          if(col.overlapN[1] > 0.3){
            if(!e.m5.skipCollide && e.m5.vel[1] > 0){
              e.m5.vel[1] = 0;
            }
            col.impact = dy;
            EventBus.pub(["bump.bottom",e],col);
          }
          if(col.overlapN[0] < -0.3){
            if(!e.m5.skipCollide && e.m5.vel[0] < 0){
              e.m5.vel[0] = 0
            }
            col.impact = dx;
            EventBus.pub(["bump.left",e],col);
          }
          if(col.overlapN[0] > 0.3){
            if(!e.m5.skipCollide && e.m5.vel[0] > 0){
              e.m5.vel[0] = 0
            }
            col.impact = dx;
            EventBus.pub(["bump.right",e],col);
          }
          if(is.num(col.impact)){
            EventBus.pub(["bump",e],col);
          }else{
            col.impact=0;
          }
        }
      };
      self.motion=function(dt){
        for(let delta=dt;delta>0;){
          dt = _.min(1/30,delta);
          e.m5.vel[0] += e.m5.acc[0] * dt + e.m5.gravity[0] * dt;
          e.m5.vel[1] += e.m5.acc[1] * dt + e.m5.gravity[1] * dt;
          e.x += e.m5.vel[0] * dt;
          e.y += e.m5.vel[1] * dt;
          e.m5.collide && e.m5.collide();
          delta -= dt;
        }
      };
      signals.forEach(s=> B.sub.apply(B,s));
      return self;
    });

    /**Define a mixin to handle platform games
     */
    Mojo.defMixin("platformer", function(e){
      const self={jumpSpeed: -300, jumping: false, landed: 0};
      const signals=[[["bump.bottom",e],"onLanded",self],
                     [["post.remove",e],"dispose",self]];
      self.dispose=function(){
        signals.forEach(s=> EventBus.unsub.apply(B,s))
      };
      self.onLanded=function(){ self.landed=0.2 };
      self.motion=function(dt){
        const _I=Mojo.Input;
        let col;
        let j3= self.jumping/3;
        let pR= _I.keyDown(_I.keyRIGHT);
        let pU= _I.keyDown(_I.keyUP);
        let pL= _I.keyDown(_I.keyLEFT);
        // follow along the current slope, if possible.
        if(false && e.m5.collisions.length > 0 &&
           (pL || pR || self.landed > 0)){
          col= e.m5.collisions[0];
          // Don't climb up walls.
          if(col !== null &&
             (col.overlapN[1] > 0.85 || col.overlapN[1] < -0.85)){
            col= null;
          }
        }
        if(pL && !pR){
          e.m5.direction = Mojo.LEFT;
          if(col && self.landed > 0){
            e.m5.vel[0] = e.m5.speed * col.overlapN[1];
            e.m5.vel[1] = -1 * e.m5.speed * col.overlapN[0];
          }else{
            e.m5.vel[0] = -1 * e.m5.speed;
          }
        }else if(pR && !pL){
          e.m5.direction = Mojo.RIGHT;
          if(col && self.landed > 0){
            e.m5.vel[0] = -1 * e.m5.speed * col.overlapN[1];
            e.m5.vel[1] = e.m5.speed * col.overlapN[0];
          }else{
            e.m5.vel[0] = e.m5.speed;
          }
        }else {
          e.m5.vel[0] = 0;
          if(col && self.landed > 0)
            e.m5.vel[1] = 0;
        }
        if(self.landed > 0 && pU && !self.jumping){
          e.m5.vel[1] = self.jumpSpeed;
          self.landed = -dt;
          self.jumping = true;
        }else if(pU){
          EventBus.pub(["jump",e]);
          self.jumping = true;
        }
        if(self.jumping && !pU){
          self.jumping = false;
          EventBus.pub(["jumped", e]);
          if(e.m5.vel[1] < self.jumpSpeed/3){
            e.m5.vel[1] = j3;
          }
        }
        self.landed -= dt;
      };
      signals.forEach(s=> EventBus.sub.apply(B,s));
      return self;
    });

    /**Define mixin `aiBounceX`.
     */
    Mojo.defMixin("aiBounceX", function(e){
      let self= {
        dispose(){
          EventBus.unsub(["post.remove",e],"dispose",self);
          EventBus.unsub(["bump.right",e],"goLeft",self);
          EventBus.unsub(["bump.left",e],"goRight",self);
        },
        goLeft(col){
          e.m5.vel[0] = - e.m5.speed; //-col.overlapV[0];
          if(self.defaultDirection === Mojo.RIGHT)
            e.m5.flip="x";
          else
            e.m5.flip=false;
        },
        goRight(col){
          e.m5.vel[0] = e.m5.speed; //col.overlapV[0];
          if(self.defaultDirection === Mojo.LEFT)
            e.m5.flip = "x";
          else
            e.m5.flip=false;
        }
      };
      EventBus.sub(["post.remove",e],"dispose",self);
      EventBus.sub(["bump.right",e],"goLeft",self);
      EventBus.sub(["bump.left",e],"goRight",self);
      return self;
    });

    /**Define mixin `aiBounceY`.
     */
    Mojo.defMixin("aiBounceY", function(e){
      let self= {
        dispose(){
          EventBus.unsub(["post.remove",e],"dispose",self);
          EventBus.unsub(["bump.top",e],"goDown",self);
          EventBus.unsub(["bump.bottom",e],"goUp",self);
        },
        goUp(col){
          e.m5.vel[0] = -col.overlapV[0];
          if(self.defaultDirection === Mojo.DOWN)
            e.m5.flip="y";
          else
            e.m5.flip=false;
        },
        goDown(col){
          e.m5.vel[0] = col.overlapV[0];
          if(self.defaultDirection === Mojo.UP)
            e.m5.flip = "y";
          else
            e.m5.flip=false;
        }
      };
      EventBus.sub(["post.remove",e],"dispose",self);
      EventBus.sub(["bump.top",e],"goDown",self);
      EventBus.sub(["bump.bottom",e],"goUp",self);
      return self;
    });

    /** @ignore */
    function _hitAB(a,b,global){
      let a_,b_,m,S=Mojo.Sprites;
      if(S.circular(a)){
        a_= S.toCircle(a,global);
        b_= S.circular(b) ? S.toCircle(b,global) :S.toPolygon(b,global);
        m= S.circular(b) ? Geo.hitCircleCircle(a_, _b) : Geo.hitCirclePolygon(a_, _b)
      }else{
        a_= S.toPolygon(a,global);
        b_= S.circular(b) ? S.toCircle(b,global) : S.toPolygon(b,global);
        m= S.circular(b) ? Geo.hitPolygonCircle(a_, b_) : Geo.hitPolygonPolygon(a_, b_)
      }
      if(m){
        m.A=a;
        m.B=b;
        a.m5.collisions.push(m);
        b.m5.collisions.push(m);
      }
      return m;
    }

    /** @ignore */
    function _collideAB(a,b, bounce=true, global=false){
      let ret,m=_hitAB(a,b,global);
      if(m){
        if(b.m5.static){
          a.x -= m.overlapV[0];
          a.y -= m.overlapV[1];
        }else{
          let dx2=m.overlapV[0]/2;
          let dy2=m.overlapV[1]/2;
          a.x -= dx2; a.y -= dy2;
          b.x += dx2; b.y += dy2;
        }
        if(bounce)
          _bounceOff(a,b,m);
      }
      return m;
    }

    /** @ignore */
    function _bounceOff(o1,o2,m) {
      if(o2.m5.static){
        //full bounce
        //v=v - (1+c)(v.n_)n_
        let p= _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN));
        _V.sub$(o1.m5.vel,p);
      }else{
        let k = -2 * ((o2.m5.vel[0] - o1.m5.vel[0]) * m.overlapN[0] +
                      (o2.m5.vel[1] - o1.m5.vel[1]) * m.overlapN[1]) /  (o1.m5.invMass + o2.m5.invMass);
        o1.m5.vel[0] -= k * m.overlapN[0] / o1.m5.mass;
        o1.m5.vel[1] -= k * m.overlapN[1] / o1.m5.mass;
        o2.m5.vel[0] += k * m.overlapN[0] / o2.m5.mass;
        o2.m5.vel[1] += k * m.overlapN[1] / o2.m5.mass;
      }
    }

    /** @ignore */
    function _collideDir(col){
      let collision=new Set();
      if(col.overlapN[1] < -0.3){
        collision.add(Mojo.TOP);
      }
      if(col.overlapN[1] > 0.3){
        collision.add(Mojo.BOTTOM);
      }
      if(col.overlapN[0] < -0.3){
        collision.add(Mojo.LEFT);
      }
      if(col.overlapN[0] > 0.3){
        collision.add(Mojo.RIGHT);
      }
      /*
      if(m.overlapN[0] > 0) //left->right
        collision.add(Mojo.RIGHT);
      if(m.overlapN[0] < 0) //right->left
        collision.add(Mojo.LEFT);
      if(m.overlapN[1] > 0) //bot->top
        collision.add(Mojo.BOTTOM);
      if(m.overlapN[0] < 0) //top->bot
        collision.add(Mojo.TOP);
        */
      return collision;
    }

    /** @ignore */
    function _hitTestAB(a,b,global,react,extra){
      let c,m=_hitAB(a,b,global);
      if(m){
        if(react){
          a.x -= m.overlapV[0];
          a.y -= m.overlapV[1];
        }
        c= _collideDir(m);
        extra && extra(c,b);
      }
      return c;
    }

    const _PT=_V.vec();
    const _$={
      /**Find out if a point is touching a circlular or rectangular sprite.
       * @memberof module:mojoh5/2d
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @param {boolean} [global]
       * @return {boolean}
       */
      hitTestPointXY(px,py,s,global){
        _PT[0]=px;
        _PT[1]=py;
        return this.hitTestPoint(_PT,s,global)
      },
      /**Find out if a point is touching a circlular or rectangular sprite.
       * @memberof module:mojoh5/2d
       * @param {Vec2} point
       * @param {Sprite} s
       * @param {boolean} [global]
       * @return {boolean}
       */
      hitTestPoint(point, s,global){
        let hit;
        if(s.m5.circular){
          let c= Mojo.Sprites.centerXY(s,global);
          let d= _V.vecAB(c,point);
          let r= MFL(s.width/2);
          hit= _V.len2(d) < r*r;
        }else{
          let p= Mojo.Sprites.toPolygon(s,global);
          let ps= _V.translate(p.pos,p.calcPoints);
          hit= _pointInPoly(point[0],point[1],ps);
          _V.reclaim(...ps);
        }
        return hit;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} [global]
       * @return {Manifold}
       */
      hit(a,b,global){
        let m= _hitAB(a,b,global);
        if(m){
          EventBus.pub(["hit",a],m);
          EventBus.pub(["hit",b],m);
        }
        return m;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} bounce
       * @param {boolean} [global]
       * @return {boolean}
       */
      collide(a,b, bounce=true, global=false){
        let m,hit;
        if(is.vec(b)){
          for(let i=b.length-1;i>=0;--i)
            _collideAB(a,b[i],bounce,global);
        }else{
          m= _collideAB(a,b,bounce,global);
          hit= m && _collideDir(m);
        }
        if(m){
          //EventBus.pub(["hit",a],m);
          //EventBus.pub(["hit",b],m);
        }
        return hit;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} [global]
       * @pqram {boolean} [react]
       * @param {function} extra
       * @return {boolean}
       */
      hitTest(a,b,global,react,extra){
        let hit;
        if(is.vec(b)){
          for(let i=b.length-1;i>=0;--i)
            _hitTestAB(a,b[i],global,react,extra);
        }else{
          hit= _hitTestAB(a,b,global,react,extra);
        }
        return hit;
      },
      /**Use to contain a sprite with `x` and
       * `y` properties inside a rectangular area.
       * @memberof module:mojoh5/2d
       * @param {Sprite} s
       * @param {PXContainer} container
       * @param {boolean} [bounce]
       * @param {function} [extra]
       * @return {number[]} a list of collision points
       */
      contain(s, container, bounce,extra){
        let c;
        if(container instanceof Mojo.Scenes.Scene){
          c=Mojo.mockStage();
        }else if(container.m5 && container.m5.stage){
          c=container;
        }else{
          if(container.isSprite)
            _.assert(sprite.parent===container);
          else
            _.assert(false,"Error: contain() using bad container");
          _.assert(container.rotation===0,"Error: contain() container can't rotate");
          _.assert(container.anchor.x===0,"Error: contain() container anchor.x !==0");
          _.assert(container.anchor.y===0,"Error: contain() container anchor.y !==0");
          c=container;
        }
        let coff= Mojo.Sprites.anchorOffsetXY(c);
        let collision = new Set();
        let CX=false,CY=false;
        let R= Geo.getAABB(Mojo.Sprites.circular(sprite) ? Mojo.Sprites.toCircle(sprite,false)
                                               : Mojo.Sprites.toPolygon(sprite,false));
        let cl= c.x-coff[0], cb=c.y-coff[1], cr=cl+c.width, ct=cb+c.height;
        //left
        if(R.pos[0]+cl < cl){
          sprite.x += (cl-R.pos[0]-cl);
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //bottom
        if(R.pos[1]+cb < cb){
          sprite.y += (cb-R.pos[1]-cb);
          CY=true;
          collision.add(Mojo.TOP);
        }
        //right
        if(R.pos[0]+R.width+cl > cr){
          sprite.x -= R.pos[0]+R.width+cl - cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(R.pos[1]+R.height+cb > ct){
          sprite.y -= R.pos[1]+R.height+cb - ct;
          CY=true;
          collision.add(Mojo.BOTTOM);
        }
        if(collision.size > 0){
          if(CX){
            sprite.m5.vel[0] /= sprite.m5.mass;
            if(bounce) sprite.m5.vel[0] *= -1;
          }
          if(CY){
            sprite.m5.vel[1] /= sprite.m5.mass;
            if(bounce) sprite.m5.vel[1] *= -1;
          }
          extra && extra(collision)
        }else{
          collision=null;
        }
        return collision;
      },
      /**The `worldCamera` method returns a `camera` object
       * with `x` and `y` properties. It has
       * two useful methods: `centerOver`, to center the camera over
       * a sprite, and `follow` to make it follow a sprite.
       * `worldCamera` arguments: worldObject, theCanvas
       * The worldObject needs to have a `width` and `height` property.
       * @memberof module:mojoh5/2d
       * @param {object} world
       * @param {number} worldWidth
       * @param {number} worldHeight
       * @param {object} canvas
       * @return {object}
       *
       */
      worldCamera(world, worldWidth, worldHeight, canvas){
        const camera={
          width: canvas.width,
          height: canvas.height,
          _x: 0,
          _y: 0,
          //`x` and `y` getters/setters
          //When you change the camera's position,
          //they shift the position of the world in the opposite direction
          get x() { return this._x; },
          set x(value) { this._x = value; world.x = -this._x; },
          get y() { return this._y; },
          set y(value) { this._y = value; world.y = -this._y; },
          get centerX() { return this.x + (this.width / 2); },
          get centerY() { return this.y + (this.height / 2); },
          //Boundary properties that define a rectangular area, half the size
          //of the game screen. If the sprite that the camera is following
          //is inide this area, the camera won't scroll. If the sprite
          //crosses this boundary, the `follow` function ahead will change
          //the camera's x and y position to scroll the game world
          get rightInnerBoundary() {
            return this.x + (this.width/2) + (this.width/4);
          },
          get leftInnerBoundary() {
            return this.x + (this.width/2) - (this.width/4);
          },
          get topInnerBoundary() {
            return this.y + (this.height/2) - (this.height/4);
          },
          get bottomInnerBoundary() {
            return this.y + (this.height/2) + (this.height/4);
          },
          //Use the `follow` method to make the camera follow a sprite
          follow(sprite){
            //Check the sprites position in relation to the inner
            //boundary. Move the camera to follow the sprite if the sprite
            //strays outside the boundary
            if(sprite.x < this.leftInnerBoundary){
              this.x = sprite.x - (this.width/4);
            }
            if(sprite.y < this.topInnerBoundary){
              this.y = sprite.y - (this.height/4);
            }
            if(sprite.x + sprite.width > this.rightInnerBoundary){
              this.x = sprite.x + sprite.width - (this.width / 4 * 3);
            }
            if(sprite.y + sprite.height > this.bottomInnerBoundary){
              this.y = sprite.y + sprite.height - (this.height / 4 * 3);
            }
            //If the camera reaches the edge of the map, stop it from moving
            if(this.x < 0) { this.x = 0; }
            if(this.y < 0) { this.y = 0; }
            if(this.x + this.width > worldWidth){
              this.x = worldWidth - this.width;
            }
            if(this.y + this.height > worldHeight){
              this.y = worldHeight - this.height;
            }
          },
          centerOver(sprite,y){
            let w2=this.width/2;
            let h2=this.height/2;
            if(arguments.length===2){
              if(is.num(sprite))
                this.x=sprite - w2;
              if(is.num(y))
                this.y=y - h2;
            }else{
              let sz= Mojo.Sprites.halfSize(sprite);
              //Center the camera over a sprite
              this.x = sprite.x + sz.width - w2;
              this.y = sprite.y + sz.height - h2;
            }
          }
        };
        return camera;
      }
    };

    return (Mojo["2d"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/2d"]=function(M){
      return M["2d"] ? M["2d"] : _module(M)
    }
  }

})(this);



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

  /**Create the module.
   */
  function _module(Mojo, TweensQueue, DustBin){
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const TWO_PI= Math.PI*2;
    const PI_2= Math.PI/2;
    const P5=Math.PI*5;

    /**
     * @module mojoh5/fx
     */

    /**
     * @memberof module:mojoh5/fx
     * @class
     */
    class Particles{
      constructor(ps){ this.bits=ps }
    }

    /**
     * @memberof module:mojoh5/fx
     * @class
     */
    class Tween{
      constructor(s,t){
        this.sprite=s;
        this.easing=t;
      }
      onEnd(){}
      onFrame(end,alpha){}
      _stop(){ this.on=false }
      _s(frames){
        _.assert(is.num(frames));
        this.step=function(){
          if(this.on){
            if(this.curf<frames){
              let perc=this.curf/frames;
              let alpha=this.easing(perc);
              this.onFrame(false,alpha);
              this.curf += 1;
            }else{
              this.onFrame(true);
              this._e();
              this.onEnd();
            }
          }
        };
        this.on = true;
        this.curf = 0;
        _.conj(TweensQueue,this);
      }
      _e(){
        _T.remove(this);
        if(this.cb) this.cb();
      }
      onComplete(cb){ this.cb=cb }
    }

    /**
     * @memberof module:mojoh5/fx
     * @class
     */
    class BatchTweens{
      constructor(...ts){
        this.cnt=0;
        let CF= ()=>{
          if(++this.cnt === this.size()){
            this.cnt=0;
            if(this.cb) this.cb();
          }
        };
        this.children= ts.map(t=>{
          let x=t._e;
          t._e=function(){
            x.call(t);
            CF();
          };
          return t;
        });
      }
      onComplete(cb){ this.cb=cb }
      size(){ return this.children.length }
      dispose(){
        this.children.forEach(c=> Mojo.FX.remove(c))
        this.children.length=0;
      }
      _stop(){ this.children.forEach(c=> c._stop()) }
    }

    const _$={
      /**Easing function: exponential-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  EXPO_IN(x){ return x===0 ? 0 : Math.pow(1024, x-1) },
      /**Easing function: exponential-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  EXPO_OUT(x){ return x===1 ? 1 : 1-Math.pow(2, -10*x) },
      /**Easing function: exponential-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  EXPO_INOUT(x){
			  return x===0 ? 0
                     : (x===1) ? 1
                     : ((x*=2)<1) ? (0.5 * Math.pow(1024, x-1))
                     : (0.5 * (2 -Math.pow(2, -10 * (x-1))))
      },
      /**Easing function: linear.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
	    LINEAR(x){ return x },
      /**Easing function: smooth.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      SMOOTH(x){ return 3*x*x - 2*x*x*x },
      /**Easing function: quadratic-smooth.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      SMOOTH_QUAD(x){let n= this.SMOOTH(x); return n*n},
      /**Easing function: cubic-smooth.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      SMOOTH_CUBIC(x){let n= this.SMOOTH(x); return n*n*n},
      /**Easing function: cubic-ease-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_IN_CUBIC(x){ return x*x*x },
      /**Easing function: cubic-ease-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_CUBIC(x){ let n=1-x; return 1 - n*n*n },
      /**Easing function: cubic-ease-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_CUBIC(x){
        if(x < 0.5){ return 4*x*x*x }else{
          let n= -2*x+2; return 1- n*n*n/2
        }
      },
      /**Easing function: quadratic-ease-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_IN_QUAD(x){ return x*x },
      /**Easing function: quadratic-ease-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_QUAD(x){ return 1 - (1-x) * (1-x) },
      /**Easing function: quadratic-ease-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_QUAD(x){
        if(x < 0.5){ return 2*x*x }else{
          let n= -2*x+2; return 1 - n*n/2
        }
      },
      /**Easing function: sinusoidal-ease-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_IN_SINE(x){ return 1 - Math.cos(x * PI_2) },
      /**Easing function: sinusoidal-ease-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_SINE(x){ return Math.sin(x * PI_2) },
      /**Easing function: sinusoidal-ease-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_SINE(x){ return 0.5 - Math.cos(x * Math.PI)/2 },
      /**Easing function: spline.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      SPLINE(t, a, b, c, d){
        return (2*b + (c-a)*t +
               (2*a - 5*b + 4*c - d)*t*t +
               (-a + 3*b - 3*c + d)*t*t*t) / 2
      },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        return a*t*t*t +
               3*b*t*t*(1-t) +
               3*c*t*(1-t)*(1-t) +
               d*(1-t)*(1-t)*(1-t)
      },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_IN(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5)
		  },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_OUT(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : 1+ Math.pow(2, -10*x) * Math.sin((x-0.1)*P5)
		  },
      /**Easing function: elastic-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_INOUT(x){
        switch(x){
          case 0: return 0;
          case 1: return 1;
          default:
            x *= 2;
			      return x<1 ? -0.5*Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5)
                       : 1+ 0.5*Math.pow(2, -10*(x-1)) * Math.sin((x-1.1)*P5);
        }
      },
      /**Easing function: bounce-in.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
      BOUNCE_IN(x){ return 1 - this.BOUNCE_OUT(1 - x) },
      /**Easing function: bounce-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  BOUNCE_OUT(x){
        if(x < 1/2.75){
          return 7.5625 * x * x
        }else if(x < 2/2.75){
          return 7.5625 * (x -= 1.5/2.75) * x + 0.75
        }else if(x < 2.5/2.75){
          return 7.5625 * (x -= 2.25/2.75) * x + 0.9375
        }else{
          return 7.5625 * (x -= 2.625/2.75) * x + 0.984375
        }
		  },
      /**Easing function: bounce-in-out.
       * @memberof module:mojoh5/fx
       * @param {number} x
       * @return {number}
       */
		  BOUNCE_INOUT(x){
			  return x < 0.5 ? this.BOUNCE_IN(x*2) * 0.5
                       : this.BOUNCE_OUT(x*2 - 1) * 0.5 + 0.5
		  },
      /**Create a tween operating on sprite's alpha value.
       * @memberof module:mojoh5/fx
       * @param {Sprite} sprite
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenAlpha(sprite,type,endA,frames=60,loop=false){
        const t= _.inject(new Tween(sprite,type),{
          start(sa,ea){
            this._s(frames);
            this._a= [sa,ea];
            return this;
          },
          onFrame(end,alpha){
            this.sprite.alpha= end ? this._a[1]
                                   : _M.lerp(this._a[0], this._a[1], alpha)
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._a[1],this._a[0]))
          }
        });
        let sa=sprite.alpha;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0];ea=endA[1]}
        return t.start(sa,ea);
      },
      /**Create a tween operating on sprite's scale value.
       * @memberof module:mojoh5/fx
       * @param {Sprite} sprite
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenScale(sprite,type,endX,endY,frames=60,loop=false){
        const t= _.inject(new Tween(sprite,type),{
          start(sx,ex,sy,ey){
            this._s(frames);
            this._x=[sx,ex];
            this._y=[sy,ey];
            return this;
          },
          onFrame(end,dt){
            if(is.num(this._x[1],this._x[0]))
              this.sprite.scale.x= end ? this._x[1]
                                       : _M.lerp(this._x[0], this._x[1], dt);
            if(is.num(this._y[1],this._y[0]))
              this.sprite.scale.y= end ? this._y[1]
                                       : _M.lerp(this._y[0], this._y[1], dt);
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._x[1],this._x[0],this._y[1],this._y[0]))
          }
        });
        let sx=sprite.scale.x;
        let sy=sprite.scale.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0];ex=endX[1]}
        if(is.vec(endY)){
          sy=endY[0];ey=endY[1]}
        return t.start(sx,ex,sy,ey);
      },
      /**Create a tween operating on sprite's position.
       * @memberof module:mojoh5/fx
       * @param {Sprite} sprite
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       */
      tweenXY(sprite,type,endX,endY,frames=60,loop=false){
        const t= _.inject(new Tween(sprite,type), {
          start(sx,ex,sy,ey){
            this._s(frames);
            this._x=[sx,ex];
            this._y=[sy,ey];
            return this;
          },
          onFrame(end,dt){
            if(is.num(this._x[0],this._x[1]))
              this.sprite.x= end ? this._x[1]
                                 : _M.lerp(this._x[0], this._x[1], dt);
            if(is.num(this._y[0],this._y[1]))
              this.sprite.y= end ? this._y[1]
                                 : _M.lerp(this._y[0], this._y[1], dt);
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this.ex,this.sx,this.ey,this.sy));
          }
        });
        let sx=sprite.x;
        let sy=sprite.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0]; ex=endX[1]}
        if(is.vec(endY)){
          sy=endY[0]; ey=endY[1]}
        return t.start(sx,ex,sy,ey);
      },
      /**Slowly fade out this object.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeOut(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,0,frames)
      },
      /**Slowly fade in this object.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeIn(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,1,frames)
      },
      /**Fades the sprite in and out at a steady rate.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number} min
       * @param {number} frames
       * @return {}
       */
      pulse(s, min=0,frames=60){
        return this.tweenAlpha(s,this.SMOOTH,min,frames)
      },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      slide(s, type, endX, endY, frames=60, loop=false){
        return this.tweenXY(s,type,endX,endY,frames,loop)
      },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      breathe(s, endX=0.8, endY=0.8, frames=60, loop=true){
        return this.tweenScale(s, this.SMOOTH_QUAD,endX,endY,frames,loop)
      },
      /**Scale this sprite.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @return {}
       */
      scale(s, endX=0.5, endY=0.5, frames=60){
        return this.tweenScale(s,this.SMOOTH,endX,endY,frames)
      },
      /**Flashes this sprite.
       * @memberof module:mojoh5/affects
       * @param {Sprite} s
       * @param {number|number[]} scale
       * @param {number} start
       * @param {number} end
       * @param {number} frames
       * @param {boolean} loop
       * @return {}
       */
      strobe(s, scale=1.3, start=10, end=20, frames=10, loop=true){
        return this.tweenScale(s,
                               (v)=> this.SPLINE(v,start,0,1,end), scale,scale,frames,loop)
      },
      /**
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @param {number} frames
       * @param {number} friction
       * @param {object} bounds {x1,x2,y1,y2}
       * @param {boolean}
       * @return {}
       */
      wobble(s, sx=1.2, sy=1.2, frames=10, friction=0.98, bounds,loop=true){
        let {x1,x2,y1,y2}= bounds;
        let tx=this.tweenScale(s,v=>_T.SPLINE(v,_.or(x1,10),0,1,_.or(x2,10)),
                               sx, null, frames,loop);
        let ty= this.tweenScale(s,v=>_T.SPLINE(v,_.or(y1,-10),0,1,_.or(y2,-10)),
                                null,sy, frames,loop);
        let oldX=tx.onFrame;
        let oldY=ty.onFrame;
        tx.onFrame=function(end,dt){
          if(end && this._x[1] > 1){
            this._x[1] *= friction;
            if(this._x[1] <= 1){ this._x[1]=1 }
          }
          oldX.call(tx,end,dt);
        };
        ty.onFrame=function(end,dt){
          if(end && this._y[1] > 1){
            this._y[1] *= friction;
            if(this._y[1] <= 1){ this._y[1]=1 }
          }
          oldY.call(ty,end,dt);
        };
        return new MutiTweens(tx,ty)
      },
      /**
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      followCurve(s, type, points, frames=60, loop=false){
        let t= _.inject(new Tween(s,this.SMOOTH), {
          start(points){
            this._s(frames);
            this._p = points;
            return this;
          },
          onFrame(end,alpha){
            let p = this._p;
            if(!end)
              Sprites.setXY(s, this.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                               this.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1]))
          },
          onEnd(){
            if(loop)
              _.delay(0,()=> this.start(this._p.reverse()))
          }
        });
        return t.start(points)
      },
      /**Make object walk in a path.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      walkPath(s, type, points, frames=300, loop=false){
        function _calcPath(cur,frames){
          let t= this.tweenXY(s,type,[points[cur][0], points[cur+1][0]],
                                     [points[cur][1], points[cur+1][1]],frames);
          t.onEnd=function(){
            if(++cur < points.length-1){
              _.delay(0,()=> _calcPath(cur,frames))
            }else if(loop){
              points.reverse();
              _.delay(0,()=>{
                Sprites.setXY(s, points[0][0], points[0][1]);
                _calcPath(0,frames);
              });
            }
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length))
      },
      /**Make object appear to walk in a curved path.
       * @memberof module:mojoh5/fx
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {}
       */
      walkCurve(s, type, points, frames=300, loop=false){
        let _calcPath=(cur,frames)=>{
          let t=this.followCurve(s, type, points[cur], frames);
          t.onEnd=function(){
            if(++cur < points.length){
              _.delay(0,()=> _calcPath(cur,frames));
            }else if(loop){
              points.reverse().forEach(c=> c.reverse());
              _.delay(0,()=>{
                Sprites.setXY(sprite, points[0][0], points[0][1]);
                _calcPath(0,frames);
              });
            }
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length))
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/fx
       * @param {Tween} t
       */
      remove(t){
        t._stop();
        t instanceof BatchTweens ? t.dispose() : _.disj(TweensQueue,t)
      },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.step(dt))
        _.rseq(DustBin, p=>{
          if(p.bits.length>0)
            _.rseq(p.bits, k=> k.m5.step())
          else
            _.disj(DustBin,p);
        });
      },
      /**Create particles.
       * @memberof module:mojoh5/fx
       * @return {}
       */
      createParticles(x, y, spriteCtor, container, gravity, mins, maxs, random=true, count= 20){
        mins= _.patch(mins,{angle:0, size:4, speed:0.3,
                            scale:0.01, alpha:0.02, rotate:0.01});
        maxs=_.patch(maxs,{angle:6.28, size:16, speed:3,
                           scale:0.05, alpha:0.02, rotate:0.03 });
        _.assert(count>1);
        let pBag=[];
        function _make(angle){
          let size = _.randInt2(mins.size, maxs.size);
          let p= spriteCtor();
          pBag.push(p);
          container.addChild(p);
          if(p.totalFrames>0)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          Sprites.setSize(p, size);
          Sprites.setXY(p,x,y);
          Sprites.centerAnchor(p);
          p.m5.scaleSpeed = _.randFloat(mins.scale, maxs.scale);
          p.m5.alphaSpeed = _.randFloat(mins.alpha, maxs.alpha);
          p.m5.angVel = _.randFloat(mins.rotate, maxs.rotate);
          let speed = _.randFloat(mins.speed, maxs.speed);
          p.m5.vel[0] = speed * Math.cos(angle);
          p.m5.vel[1] = speed * Math.sin(angle);
          //the worker
          p.m5.step=function(){
            p.m5.vel[1] += gravity[1];
            p.x += p.m5.vel[0];
            p.y += p.m5.vel[1];
            if(p.scale.x - p.m5.scaleSpeed > 0){
              p.scale.x -= p.m5.scaleSpeed;
            }
            if(p.scale.y - p.m5.scaleSpeed > 0){
              p.scale.y -= p.m5.scaleSpeed;
            }
            p.rotation += p.m5.angVel;
            p.alpha -= p.m5.alphaSpeed;
            if(p.alpha <= 0){
              _.disj(pBag,p);
              Sprites.remove(p);
            }
          };
        }
        for(let gap= (maxs.angle-mins.angle)/(count-1),
            a=mins.angle,i=0; i<count; ++i){
          _make(random ? _.randFloat(mins.angle, maxs.angle) : a);
          a += gap;
        }
        let o=new Particles(pBag);
        _.conj(DustBin,o);
        return o;
      }
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/FX"]=function(M){
      return M.FX ? M.FX : _module(M, [], [])
    }
  }

})(this);



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


  /**Create the module.
   */
  function _module(Mojo){

    const _POSSIBLES = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const ABS=Math.abs,
          MFL=Math.floor;

    /** dummy empty array
     * @private
     * @var {array}
     */
    const _DA=[];

    /**
     * @module mojoh5/tiles
     */

    /** @ignore */
    function _parseProps(el){
      return (el.properties||_DA).reduce((acc,p)=> {
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    /** @ignore */
    function _getIndex3(x, y, world){
      return Mojo.getIndex(x,y,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX)
    }

    /** @ignore */
    function _getVector(s1,s2,global){
      return _V.vecAB(Mojo.Sprites.centerXY(s1,global),
                      Mojo.Sprites.centerXY(s2,global))
    }

    /** @ignore */
    function _getContactPoints(s){
      //internal rectangle defining the collision area of this sprite
      let c,a= Mojo.Sprites.getBBox(s);
      if(c=s.collisionArea){
        a={x1: a.x1+c.x1, x2: a.x1+c.x2,
           y1: a.y1+c.y1, y2: a.y1+c.y2 };
      }
      a.x2 -= 1;
      a.y2 -= 1;
      return [_V.vec(a.x1,a.y1),_V.vec(a.x2,a.y1),
              _V.vec(a.x2,a.y2),_V.vec(a.x1,a.y2)]
    }

    /** @ignore */
    function _getImage(obj){
      const s= obj.image;
      const p= s && s.split("/");
      return p && p.length && p[p.length-1];
    }

    /** @ignore */
    function _parsePoint(pt){
      const pts = pt.split(",");
      return [parseFloat(pts[0]), parseFloat(pts[1])];
    }

    /** @ignore */
    function _lookupGid(gid,gidMap){
      let idx = 0;
      while(gidMap[idx+1] &&
            gid >= gidMap[idx+1][0]) ++idx;
      return gidMap[idx];
    }

    /**Scans all tilesets and record all custom properties into
     * one giant map.
     * @private
     * @function
     */
    function _scanTilesets(tilesets, gprops){
      let gidList = [];
      tilesets.forEach(ts=>{
        ts.image=_getImage(ts);
        gidList.push([ts.firstgid, ts]);
        ts.tiles.forEach(t=>{
          //grab all custom props for this GID
          gprops[ts.firstgid + t.id] = _.inject(_parseProps(t), {id:t.id})
        });
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0));
    }

    class Grid2D{
      constructor(g){
        this._grid=g;
        let dimX = g[0].length;
        let dimY = g.length;
        let dx1=dimX-1;
        let dy1=dimY-1;
        let s=g[0];
        let s2=g[1];
        let e=g[dy1];
        let gapX=s[1].x1-s[0].x2;
        let gapY=s2[0].y1-s[0].y2;
        _.assert(gapX===gapY);
        this._gap=gapX;
      }
      drawBox(color="white"){
        return Mojo.Sprites.drawBody(ctx => this._draw(ctx,color,true))
      }
      draw(color="white"){
        return Mojo.Sprites.drawBody(ctx => this._draw(ctx,color))
      }
      _draw(ctx,color="white",boxOnly=false){
        let dimX = this._grid[0].length;
        let dimY = this._grid.length;
        let dx1=dimX-1;
        let dy1=dimY-1;
        let s=this._grid[0];
        let e=this._grid[dy1];
        let gf = s[0];
        let gl = e[dx1];
        ctx.lineStyle(this.gap,_S.color(color));
        for(let r,i=0;i<dimY;++i){
          r=this._grid[i];
          if(i===0){
            //draw the top horz line
            ctx.moveTo(r[i].x1,r[i].y1);
            ctx.lineTo(s[dx1].x2,s[dx1].y1);
          }
          if(i===dy1){
            ctx.moveTo(r[0].x1,r[0].y2);
            ctx.lineTo(r[dx1].x2,r[dx1].y2);
          }else if(!boxOnly){
            ctx.moveTo(r[0].x1,r[0].y2);
            ctx.lineTo(r[dx1].x2,r[dx1].y2);
          }
        }
        for(let i=0;i<dimX;++i){
          if(i===0){
            //draw the left vert line
            ctx.moveTo(s[i].x1,s[i].y1);
            ctx.lineTo(e[i].x1,e[i].y2);
          }
          if(i===dx1){
            ctx.moveTo(s[i].x2,s[i].y1);
            ctx.lineTo(e[i].x2,e[i].y2);
          }else if(!boxOnly){
            ctx.moveTo(s[i].x2,s[i].y1);
            ctx.lineTo(e[i].x2,e[i].y2);
          }
        }
      }
      cell(row,col){ return this._grid[row][col] }
      get gap() { return this._gap}
      get data() { return this._grid}
    }

    class AStarAlgos{
      constructor(straightCost,diagonalCost){
        this.straightCost= straightCost;
        this.diagonalCost= diagonalCost;
      }
      manhattan(test, dest){
        return ABS(test.row - dest.row) * this.straightCost +
               ABS(test.col - dest.col) * this.straightCost
      }
      euclidean(test, dest){
        let vx = dest.col - test.col;
        let vy = dest.row - test.row;
        return MFL(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let vx = ABS(dest.col - test.col);
        let vy = ABS(dest.row - test.row);
        return (vx > vy) ? MFL(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : MFL(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }

    const _$={
      /**Cross reference a point's position to a tile index.
       * @memberof module:mojoh5/tiles
       * @param {number} x
       * @param {number} y
       * @param {object} world
       * @return {number} the tile position
       */
      getTileIndex(x,y,world){
        return _getIndex3(x,y,world)
      },
      /**Calculate position of each individual cells in the grid,
       * so that we can detect when a user clicks on the cell.
       * @memberof module:mojoh5/tiles
       * @param {number|number[]} dim
       * @param {number} glwidth
       * @param {number} ratio
       * @param {string} align
       * @return {}
       */
      mapGridPos(dim,glwidth,ratio=0.8,align="center"){
        let cx,cy,x0,y0,x1,y1,x2,y2,out=[];
        let gapX,gapY,dimX,dimY,cz,szX,szY;
        if(is.vec(dim)){
          [dimX,dimY]=dim;
        }else{
          dimX=dimY=dim;
        }
        if(glwidth<0){glwidth=0}
        gapX=glwidth*(dimX+1);
        gapY=glwidth*(dimY+1);
        if(Mojo.portrait()){
          cz=MFL((ratio*Mojo.width-gapX)/dimX);
        }else{
          cz=MFL((ratio*(Mojo.height-gapY))/dimY);
        }
        szX=cz*dimX+gapX;
        szY=cz*dimY+gapY;
        //top,left
        y0=MFL((Mojo.height-szY)/2);
        switch(align){
          case "right": x0=Mojo.width-szX; break;
          case "left": x0=0;break;
          default: x0=MFL((Mojo.width-szX)/2); break;
        }
        x0 +=glwidth;
        x1=x0;
        y0 += glwidth;
        y1=y0;
        for(let arr,r=0; r<dimY; ++r){
          arr=[];
          for(let c= 0; c<dimX; ++c){
            y2 = y1 + cz;
            x2 = x1 + cz;
            arr.push({x1,x2,y1,y2});
            x1 = x2+glwidth;
          }
          out.push(arr);
          y1 = y2+glwidth;
          x1 = x0;
        }
        return new Grid2D(out);
      },
      /**Converts a tile's index number into x/y screen
       * coordinates, and capture's the tile's grid index (`gid`) number.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {number[]} gidList
       * @param {object} world
       * @return {Sprite} a tile object
       */
      getTile(index, gidList, world){
        const t=world.tiled;
        return Mojo.Sprites.extend({gid: gidList[index],
                                    width: t.tileW,
                                    height: t.tileH,
                                    anchor: Mojo.makeAnchor(0,0),
                                    x:((index%t.tilesInX)*t.tileW)+world.x,
                                    y:((MFL(index/t.tilesInX))*t.tileH)+world.y,
                                    getGlobalPosition(){ return {x: this.x, y: this.y } } })
      },
      /**Get the indices of the neighbor cells.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {object} world
       * @param {boolean} ignoreSelf
       * @return {number[]} cells around a tile x x x
       *                                        x c x
       *                                        x x x
       */
      neighborCells(index, world, ignoreSelf){
        let w=world.tiled.tilesInX;
        let a= [index - w - 1, index - w, index - w + 1, index - 1];
        let b= [index + 1, index + w - 1, index + w, index + w + 1];
        if(!ignoreSelf) a.push(index);
        return a.concat(b);
      },
      /**Checks for a collision between a sprite and a tile.
       * @memberof module:mojoh5/tiles
       * @param {Sprite} s
       * @param {number[]} gidList
       * @param {number} gidToCheck
       * @param {object} world
       * @param {number} checkHow
       * @return {object} a `collision` object
       */
      hitTestTile(s, gidList, gidToCheck, world, checkHow=Mojo.SOME){
        let col={};
        function _checker(pt){
          col.index = _getIndex3(pt[0], pt[1], world);
          col.gid = gidList[col.index];
          return col.gid === gidToCheck;
        }
        let colPts= checkHow !== Mojo.CENTER ? _getContactPoints(s)
                                             : [Mojo.Sprites.centerXY(s)];
        let op= checkHow===Mojo.EVERY ? "every" : "some";
        col.hit = colPts[op](_checker);
        _V.reclaim(...colPts);
        return col;
      },
      /**Takes a map array and adds a sprite's grid index number (`gid`) to it.
       * @memberof module:mojoh5/tiles
       * @param {number[]} gidList
       * @param {Sprite[]} sprites
       * @param {object} world
       * @return {number[]}
       */
      updateMap(gidList, sprites, world){
        let ret = _.fill(gidList.length,0);
        let _mapper=(s)=>{
          let pos= this.getTileIndex(Mojo.Sprites.centerXY(s),world);
          _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
          s.tiled.____index = pos;
          ret[pos] = s.tiled.____gid;
        };
        !is.vec(sprites) ? _mapper(sprites)
                         : sprites.forEach(_mapper);
        return ret;
      },
      /**Load in a Tiled map.
       * @memberof module:mojoh5/tiles
       * @param {object} json
       * @return {}
       */
      tiledWorld(json){
        function _c(ps){
          return Mojo.Sprites.container(c=>{
            _.assertNot(_.has(c,"tiled"));
            c.tiled=_.inject({},ps);
          })
        }
        function _ver(tmap){
          if(!tmap) throw `Error: ${json} not cached`;
          let tver= tmap["tiledversion"] || tmap["version"];
          if(tver && _.cmpVerStrs(tver,"1.4.2") < 0)
            throw `Error: ${json}-${tver} needs an update`;
          return _parseProps(tmap);
        }
        let tmx = Mojo.resource(json,true).data;
        let W = _c(_ver(tmx));
        let gtileProps={};
        _.patch(W.tiled, {tileLayers: {tilelayer:[],imagelayer:[],objectgroup:[]},
                          tileProps: gtileProps,
                          tileH: tmx.tileheight,
                          tileW: tmx.tilewidth,
                          tilesInX:tmx.width,
                          tilesInY: tmx.height,
                          tiledWidth: tmx.width * tmx.tilewidth,
                          tiledHeight: tmx.height * tmx.tileheight,
                          tileGidList: _scanTilesets(tmx.tilesets,gtileProps)});
        W.tiled.getTSInfo=function(gid){
          return _lookupGid(gid,W.tiled.tileGidList)[1];
        };
        W.tiled.getTileLayer=function(name,panic){
          let found= _.some(W.tiled.tileLayers["tilelayer"], o=>{
            if(o.name===name) return o;
          });
          if(!found && panic)
            throw `There is no layer with name: ${name}`;
          return found;
        };
        W.tiled.getScaleFactor=function(){
          let r=1,n;
          if(Mojo.u.scaleToWindow === "max"){
            if(Mojo.width>Mojo.height){
              n=tmx.height*tmx.tileheight;
              r=Mojo.height/n;
            }else{
              n=tmx.width*tmx.tilewidth;
              r=Mojo.width/n;
            }
          }
          return r;
        };
        W.tiled.getObjectGroup=function(name,panic){
          let found= _.some(W.tiled.tileLayers["objectgroup"], o=>{
            if(o.name===name) return o;
          });
          if(!found && panic)
            throw `There is no layer with name: ${name}`;
          return found;
        };
        let F={
          tilelayer(tl){
            let data=is.vec(tl.data[0])?tl.data.flat():tl.data;
            let gp=_c(tl);
            for(let gid,i=0;i<data.length;++i){
              gid=data[i];
              if(gid===0){
                continue;
              }
              let tsi=_lookupGid(gid,W.tiled.tileGidList)[1];
              let cols=tsi.columns;
              let _id=gid - tsi.firstgid;
              _.assertNot(_id<0, `Bad tile id: ${_id}`);
              if(!is.num(cols))
                cols=MFL(tsi.imagewidth / (tsi.tilewidth+tsi.spacing));
              let mapcol = i % tl.width;
              let maprow = MFL(i/tl.width);
              let tscol = _id % cols;
              let tsrow = MFL(_id/cols);
              let tsX = tscol * tsi.tilewidth;
              let tsY = tsrow * tsi.tileheight;
              if(tsi.spacing>0){
                tsX += tsi.spacing * tscol;
                tsY += tsi.spacing * tsrow;
              }
              let s = Mojo.Sprites.sprite(Mojo.Sprites.frame(tsi.image,
                                         tsi.tilewidth,
                                         tsi.tileheight,tsX,tsY));
              let K=W.tiled.getScaleFactor();
              let ps=gtileProps[gid];
              //if(ps && _.has(ps,"anchor")){ s.anchor.set(ps["anchor"]); }
              _.assertNot(_.has(s,"tiled"));
              s.tiled={____gid: gid, ____index: i, id: _id, ts: tsi, props: ps};
              s.scale.x=K;
              s.scale.y=K;
              s.x= mapcol * s.width;
              s.y= maprow * s.height;
              s.m5.resize=function(px,py,pw,ph){
                let K=W.tiled.getScaleFactor();
                s.scale.x=K;
                s.scale.y=K;
                s.x= mapcol * s.width;
                s.y= maprow * s.height;
              };
              gp.addChild(s);
            }
            return gp;
          },
          objectgroup(tl){
            let gp=_c(tl);
            tl.objects.forEach(o=>{
              let ps= _parseProps(o);
              _.dissoc(o,"properties");
              _.inject(o,ps);
            });
            return gp;
          },
          imagelayer(tl){
            tl.image=_getImage(tl);
            return _c(tl);
          }
        };
        for(let gp,y,i=0;i<tmx.layers.length;++i){
          y=tmx.layers[i];
          gp=F[y.type] && F[y.type](y);
          if(gp){
            _.inject(gp.tiled,_parseProps(y));
            _.dissoc(gp.tiled,"properties");
            gp.tiled.name=y.name;
            gp.name=y.name;
            gp.visible= !!y.visible;
            gp.alpha = y.opacity;
            W.addChild(gp);
            W.tiled.tileLayers[y.type].push(gp);
          }
        }
        return W;
      },
      /**A-Star search.
       * @memberof module:mojoh5/tiles
       * @param {number} startTile
       * @param {number} targetTile
       * @param {object[]} tiles
       * @param {object} world
       * @param {number[]} obstacles
       * @param {string} heuristic
       * @param {boolean} useDiagonal
       * @return {any[]}
       */
      shortestPath(startTile, targetTile, tiles, world,
                   obstacles=[],
                   heuristic="manhattan", useDiagonal=true){
        let W=world.tiled.tilesInX;
        let nodes=tiles.map((gid,i)=> ({f:0, g:0, h:0,
                                        parent:null, index:i,
                                        col:i%W, row:MFL(i/W)}));
        let targetNode = nodes[targetTile];
        let startNode = nodes[startTile];
        let centerNode = startNode;
        let openList = [centerNode];
        let closedList = [];
        let theShortestPath = [];
        let straightCost=10;
        let diagonalCost=14;
        function _testNodes(i){
          let c= !useDiagonal ? this.crossCells(i,world)
                              : this.neighborCells(i, world, true);
          return c.map(p=>nodes[p]).filter(n=>{
            if(n){
              let indexOnLeft= (i% W) === 0;
              let indexOnRight= ((i+1) % W) === 0;
              let nodeBeyondLeft= (n.col % (W-1)) === 0 && n.col !== 0;
              let nodeBeyondRight= (n.col % W) === 0;
              let nodeIsObstacle = obstacles.some(o => tiles[n.index] === o);
              return indexOnLeft ? !nodeBeyondLeft
                                 : (indexOnRight ? !nodeBeyondRight : !nodeIsObstacle);
            }
          });
        }
        while(centerNode !== targetNode){
          let testNodes = _testNodes(centerNode.index);
          for(let f,g,h,cost,tn,i=0; i < testNodes.length; ++i){
            tn = testNodes[i];
            //Find out whether the node is on a straight axis or
            //a diagonal axis, and assign the appropriate cost
            //A. Declare the cost variable
            cost = diagonalCost;
            //B. Do they occupy the same row or column?
            if(centerNode.row === tn.row ||
               centerNode.col === tn.col){
              cost = straightCost;
            }
            //C. Calculate the costs (g, h and f)
            //The node's current cost
            g = centerNode.g + cost;
            //The cost of travelling from this node to the
            //destination node (the heuristic)
            f = g + new AStarAlgos(straightCost,diagonalCost)[heuristic](tn,targetNode);
            let isOnOpenList = openList.some(n => tn === n);
            let isOnClosedList = closedList.some(n => tn === n);
            //If it's on either of these lists, we can check
            //whether this route is a lower-cost alternative
            //to the previous cost calculation. The new G cost
            //will make the difference to the final F cost
            if(isOnOpenList || isOnClosedList){
              if(tn.f > f){
                tn.f = f;
                tn.g = g;
                tn.h = h;
                //Only change the parent if the new cost is lower
                tn.parent = centerNode;
              }
            }else{
              //Otherwise, add the testNode to the open list
              tn.f = f;
              tn.g = g;
              tn.h = h;
              tn.parent = centerNode;
              openList.push(tn);
            }
          }
          closedList.push(centerNode);
          //Quit the loop if there's nothing on the open list.
          //This means that there is no path to the destination or the
          //destination is invalid, like a wall tile
          if(openList.length === 0){
            return theShortestPath;
          }
          //Sort the open list according to final cost
          openList = openList.sort((a, b) => a.f - b.f);
          //Set the node with the lowest final cost as the new centerNode
          centerNode = openList.shift();
        }
        //Now that we have all the candidates, let's find the shortest path!
        if(openList.length !== 0){
          //Start with the destination node
          let tn = targetNode;
          theShortestPath.push(tn);
          //Work backwards through the node parents
          //until the start node is found
          while(tn !== startNode){
            tn = tn.parent;
            theShortestPath.unshift(tn);
          }
        }
        return theShortestPath;
      },
      /**Check if sprites are visible to each other.
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} tiles
       * @param {object} world
       * @param {number} segment
       * @param {number[]} angles
       * @return {boolean}
       */
      lineOfSight(s1, s2, tiles, world,
                  emptyGid = 0,
                  segment = 32, //distance between collision points
                  angles = []) { //angles to restrict the line of sight
        let v= _getVector(s1,s2);
        let len = _V.len(v);
        let numPts = MFL(len/segment);
        let len2,x,y,ux,uy,points = [];
        for(let c,i = 1; i <= numPts; ++i){
          c= Mojo.Sprites.centerXY(s1);
          len2 = segment * i;
          ux = v[0]/len;
          uy = v[1]/len;
          //Use the unit vector and newMagnitude to figure out the x/y
          //position of the next point in this loop iteration
          x = MFL(c[0] + ux * len2);
          y = MFL(c[1] + uy * len2);
          points.push({x,y, index: _getIndex3(x,y,world)});
        }
        //Restrict line of sight to right angles (don't want to use diagonals)
        //Find the angle of the vector between the two sprites
        let angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
        //The tile-based collision test.
        //The `noObstacles` function will return `true` if all the tile
        //index numbers along the vector are `0`, which means they contain
        //no walls. If any of them aren't 0, then the function returns
        //`false` which means there's a wall in the way
        return points.every(p=> tiles[p.index] === emptyGid) &&
               (angles.length === 0 || angles.some(x=> x === angle))
      },
      /**Get indices of orthognoal cells.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      crossCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w, index - 1, index + 1, index + w]
      },
      /**Get orthognoal cells.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getCrossTiles(index, tiles, world){
        return this.crossCells(index,world).map(c => tiles[c])
      },
      /**Get the indices of corner cells.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      getDiagonalCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w - 1, index - w + 1, index + w - 1, index + w + 1]
      },
      /**Get the corner cells.
       * @memberof module:mojoh5/tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getDiagonalTiles(index, tiles, world){
        return this.getDiagonalCells(index,world).map(c => tiles[c])
      },
      /**Get all the valid directions to move for this sprite.
       * @memberof module:mojoh5/tiles
       * @param {Sprite} sprite
       * @param {any[]} tiles
       * @param {number} validGid
       * @param {object} world
       * @return {any[]}
       */
      validDirections(sprite, tiles, validGid, world){
        const pos = this.getTileIndex(sprite, world);
        return this.getCrossTiles(pos, tiles, world).map((gid, i)=>{
          return gid === validGid ? _POSSIBLES[i] : Mojo.NONE
        }).filter(d => d !== Mojo.NONE)
      },
      /**Check if these directions are valid.
       * @memberof module:mojoh5/tiles
       * @param {number[]} directions
       * @return {boolean}
       */
      canChangeDirection(dirs=[]){
        let up = dirs.find(x => x === Mojo.UP);
        let down = dirs.find(x => x === Mojo.DOWN);
        let left = dirs.find(x => x === Mojo.LEFT);
        let right = dirs.find(x => x === Mojo.RIGHT);
        return dirs.length===0 ||
               dirs.length===1 || ((up||down) && (left||right));
      },
      /**Randomly choose the next direction.
       * @memberof module:mojoh5/tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length===0 ? Mojo.TRAPPED
                               : (dirs.length===1 ? dirs[0]
                                                  : dirs[_.randInt2(0, dirs.length-1)])
      },
      /**Find the best direction from s1 to s2.
       * @memberof module:mojoh5/tiles
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      closestDirection(s1, s2){
        const v= _getVector(s1,s2);
        return ABS(v[0]) < ABS(v[1]) ? ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN)
                                     : ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT)
      }
    };

    return (Mojo.Tiles=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Tiles"]=function(M){
      return M.Tiles ? M.Tiles : _module(M)
    }
  }

})(this);


