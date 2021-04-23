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
  const IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"];
  const FONT_EXTS = ["ttf", "otf", "ttc", "woff"];
  const AUDIO_EXTS= ["mp3", "wav", "ogg"];
  const _DT15=1/15;

  /**Create the module. */
  function _module(cmdArg, _fonts, _spans, _BgTasks){

    //import mcfud's core module
    const {EventBus,dom,is,u:_} = gscope["io/czlab/mcfud/core"]();
    const _V = gscope["io/czlab/mcfud/vec2"]();
    const EBus= EventBus();
    const MFL=Math.floor;
    const CON=console;
    let _paused = false;

    /**
     * @module mojoh5/Mojo
     */

    /**Main Stage class, holds scenes or scene-wrappers. */
    class PixiStage extends PIXI.Container{
      constructor(){
        super();
        this.m5={ stage:true }
      }
      onResize(Mojo, curSize){
        this.children.forEach(s=>{
          if(s instanceof Mojo.Scenes.SceneWrapper){
            s=s.children[0]; //1 child - should be the scene
          }
          s.onCanvasResize(curSize);
        });
        Mojo.Input.resize();
      }
    }

    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      assetFiles: [],
      logos: [],
      fps: 60
    });

    /** @ignore */
    function _width(){ return gscope.innerWidth }
    //return document.documentElement.clientWidth

    /** @ignore */
    function _height(){ return gscope.innerHeight }
    //return document.documentElement.clientHeight

    /**Built-in progress bar, shown during the loading of
     * assets if no user-defined load function is provided.
     */
    function _PBar(Mojo){
      const K=Mojo.getScaleFactor();
      const cy= MFL(Mojo.height/2);
      const cx= MFL(Mojo.width/2);
      const w4= MFL(Mojo.width/4);
      const bgColor=0x404040;
      const fgColor=0xff8a00;
      const {Sprites}=Mojo;
      const WIDTH=w4*2;
      const RH=24*K;
      const Y=cy-RH/2;
      return {
        init(){
          this.fg=Sprites.rectangle(cx, RH, fgColor);
          this.bg=Sprites.rectangle(cx, RH, bgColor);
          this.perc=Sprites.text("0%", {fontSize:MFL(RH/2),
                                        fill:"black",
                                        fontFamily:"sans-serif"});
          _V.set(this.bg, cx-w4, Y);
          _V.set(this.fg, cx-w4, Y);
          _V.set(this.perc, cx-w4+10,
                            MFL(cy-this.perc.height/2));
          this.insert(this.bg);
          this.insert(this.fg);
          this.insert(this.perc);
        },
        update(file,progress){
          this.fg.width = WIDTH*(progress/100);
          this.perc.text=`${Math.round(progress)}%`;
          CON.log(`file= ${file}, progr= ${progress}`);
        }
      };
    }

    /** standard logo */
    function _LogoBar(Mojo){
      const {Sprites}=Mojo;
      return {
        init(){
          let logo=Sprites.sprite("boot/ZotohLab_x1240.png");
          let pbar=Sprites.sprite("boot/preloader_bar.png");
          let [w,h]=Mojo.scaleXY([logo.width,logo.height],
                                 [Mojo.width,Mojo.height]);
          let K=Mojo.getScaleFactor();
          let k= w>h?h:w;
          k *= 0.2;
          _V.set(pbar.scale,k,k);
          _V.set(logo.scale,k,k);
          Sprites.pinCenter(this,logo);
          Sprites.pinBottom(logo,pbar,4*K);
          pbar.visible=false;
          this.g.pbar=pbar;
          this.g.pbar_width=pbar.width;
          this.insert(logo);
          this.insert(pbar);
        },
        update(file,progress){
          if(!this.g.pbar.visible)
            this.g.pbar.visible=true
          this.g.pbar.width = this.g.pbar_width*(progress/100);
        }
      };
    }

    /** @ignore */
    function _loadScene(obj){
      const z= new Mojo.Scenes.Scene("loader",{
        setup(){
          obj.init.call(this)
        }
      },{});
      Mojo.stage.addChild(z);
      z.runOnce();
      return z;
    }

    /**Scale canvas to max via CSS. */
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
    function _postAssetLoad(Mojo,ldrObj,scene,error){
      const {Sound} = Mojo;
      let ext, fcnt=0;
      //clean up stuff used during load
      function _finz(){
        _spans.forEach(e=>
          dom.css(e,"display","none"));
        if(ldrObj)
          Mojo.delBgTask(ldrObj);
        _.delay(0,()=>{
          Mojo.Scenes.removeScene(scene);
          if(!error) Mojo.u.start(Mojo); });
      }
      function _m1(){ --fcnt===0 && _finz() }
      if(!error)
        _.doseq(Mojo.assets, (r,k)=>{
          ext= _.fileExt(k);
          if(_.has(AUDIO_EXTS,ext)){
            fcnt +=1;
            Sound.decodeData(r.name, r.url,
                             r.xhr.response, _m1); } });
      fcnt===0 && _finz();
    }

    /** Fetch required files. */
    function _loadFiles(Mojo, error){
      let filesWanted= _.map(Mojo.u.assetFiles,
                             f=> Mojo.assetPath(f));
      let ffiles= _.findFiles(filesWanted, FONT_EXTS);
      const {PXLR,PXLoader}= Mojo;
      //common hack to trick browser to load in font files.
      let family, face, span, style;
      ffiles.forEach(s=>{
        style= dom.newElm("style");
        span= dom.newElm("span");
        family= s.split("/").pop().split(".")[0];
        face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        //CON.log(`fontface = ${face}`);
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
      if(filesWanted.length>0){
        let cbObj=Mojo.u.load;
        if(!error){
          if(!cbObj)
            cbObj= _LogoBar(Mojo);
        }else if(cbObj){
          cbObj=null;
          CON.log("FatalError: can't proceed.");
        }else{
          cbObj=_PBar(Mojo);
        }
        if(cbObj){
          let ecnt=0,
              fs=[],
              pg=[],
              scene=_loadScene(cbObj);
          PXLoader.add(filesWanted);
          PXLoader.onError.add((e,ld,r)=>{
            ++ecnt;
            CON.log(`${e}`);
          });
          PXLoader.onProgress.add((ld,r)=>{
            fs.unshift(r.url);
            pg.unshift(ld.progress);
          });
          PXLoader.load(()=>{
            if(ecnt===0)
              CON.log(`asset loaded!`)
          });
          Mojo.addBgTask({
            update(){
              let f= fs.pop();
              let n= pg.pop();
              if(f && is.num(n)){
                cbObj.update.call(scene,f,n);
              }
              if(_.feq(n,100) || n > 99.95){
                _postAssetLoad(Mojo,this,scene,ecnt>0);
              }
            }
          });
        }
      }else{
        _postAssetLoad(Mojo);
      }
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      return Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    }

    /** @ignore */
    function _boot(Mojo){
      const {PXLoader}= Mojo;
      if(!Mojo.u.load)
        //use default boot logos
        Mojo.u.logos=["boot/preloader_bar.png",
                      "boot/ZotohLab_x1240.png"];
      let files= Mojo.u.logos;
      let ecnt=0;
      files=files.map(f=> Mojo.assetPath(f));
      if(files.length===0){
        _loadFiles(Mojo)
      }else{
        PXLoader.reset();
        PXLoader.add(files);
        PXLoader.onError.add((e,ld,r)=>{
          ++ecnt;
          CON.log(`${e}`);
        });
        PXLoader.load(()=>{
          _.delay(0,()=>_loadFiles(Mojo, ecnt>0));
          if(ecnt===0)
            CON.log(`logo files loaded!`);
        });
      }
      return Mojo;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _CT="body, * {padding: 0; margin: 0}";
    const _ScrSize={width:0,height:0};
    const _Size11={width:1,height:1};

    /**Set some global CSS. */
    function _configCSS(){
      const style= dom.newElm("style");
      dom.conj(style,dom.newTxt(_CT));
      dom.conj(document.head,style);
    }

    function _configCanvas(arg){
      let p= { "outline":"none" };
      if(arg.rendering !== false){
        p["image-rendering"]= arg.rendering || "pixelated";
        //p["image-rendering"]="crisp-edges";
      }
      dom.css(Mojo.canvas,p);
      dom.attrs(Mojo.canvas,"tabindex","0");
    }

    /**Install a module. */
    function _runM(m){
      CON.log(`installing module ${m}...`);
      gscope[`io/czlab/mojoh5/${m}`](Mojo)
    }

    /** Main */
    function _prologue(Mojo){
      let S= Mojo.stage= new PixiStage();
      let box= cmdArg.arena;
      let maxed=false;

      _.assert(box,"design resolution req'd.");

      //want canvas max screen
      if(cmdArg.scaleToWindow=="max"){
        //scaling ok
        maxed=true;
        box= {width: _width(),
              height: _height()};
        if(_.nichts(cmdArg.arena.width) &&
           _.nichts(cmdArg.arena.height)){
          //no scaling
          maxed=false;
          cmdArg.arena=box;
          cmdArg.scaleToWindow="win";
        }
      }

      if(!cmdArg.logos)
        cmdArg.logos=new Array();

      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo.ctx= PIXI.autoDetectRenderer(box);
      Mojo.ctx.bgColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.maxed=maxed;
      Mojo.scale=1;
      Mojo.frame=1/cmdArg.fps;
      Mojo.scaledBgColor= "#323232";

      //install modules
      _.seq("Sprites,Input,Scenes").forEach(_runM);
      _.seq("Sound,FX,2d,Tiles,Touch").forEach(_runM);

      //register these background tasks
      _BgTasks.push(Mojo.FX, Mojo.Input);

      //css
      dom.conj(document.body, Mojo.canvas);
      _configCSS();
      _configCanvas(cmdArg);

      if(_.has(cmdArg,"border"))
        dom.css(Mojo.canvas, "border", cmdArg.border);

      if(_.has(cmdArg,"bgColor"))
        Mojo.ctx.backgroundColor =
          Mojo.Sprites.color(cmdArg.bgColor);

      if(cmdArg.scaleToWindow===true)
        Mojo.scale=_scaleCanvas(Mojo.canvas);

      Mojo.mouse= Mojo.Input.pointer();

      if(cmdArg.resize === true){
        _.addEvent("resize", gscope, _.debounce(()=>{
          //save the current size and tell others
          const [w,h]=[Mojo.width, Mojo.height];
          Mojo.ctx.resize(_width(),_height());
          Mojo.emit(["canvas.resize"],[w,h]);
        },cmdArg.debounceRate||150));
        Mojo.on(["canvas.resize"], o=> S.onResize(Mojo,o))
      }

      Mojo.canvas.focus();
      return _boot(Mojo);
    }

    /** @ignore */
    class Mixin{ constructor(){} }

    /**Mixin registry. */
    const _mixins= _.jsMap();

    /** @ignore */
    function _mixinAdd(s,name,f,...args){
      _.assert(!_.has(s,name),
               `Fatal: mixin ${name} unavailable.`);
      s[name]=f(s,...args);
      return s;
    }

    //------------------------------------------------------------------------
    /**Code to run per tick. */
    function _update(dt){
      //process any backgorund tasks
      _BgTasks.forEach(m=> m.update && m.update(dt));
      //update all scenes
      if(!_paused)
        Mojo.stageCS(s=> s.update && s.update(dt));
      //render drawings
      Mojo.ctx.render(Mojo.stage);
    }

    //------------------------------------------------------------------------
    /** @ignore */
    function _raf(cb){
      return gscope.requestAnimationFrame(cb) }

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
      PI_90:Math.PI/2,
      PI_180:Math.PI,
      PI_270:Math.PI*1.5,
      PI_360:Math.PI*2,
      v2:_V,
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
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PXLoader:PIXI.Loader.shared,
      PXObservablePoint: PIXI.ObservablePoint,
      on(...args){
        return EBus.sub(...args)
      },
      emit(...args){
        return EBus.pub(...args)
      },
      off(...args){
        return EBus.unsub(...args)
      },
      /**Check if `d` is on the right hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideRight(d){
        return d===Mojo.RIGHT || d===Mojo.TOP_RIGHT || d===Mojo.BOTTOM_RIGHT },
      /**Check if `d` is on the left hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideLeft(d){
        return d===Mojo.LEFT || d===Mojo.TOP_LEFT || d===Mojo.BOTTOM_LEFT },
      /**Check if `d` is on the top hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideTop(d){
        return d===Mojo.TOP || d===Mojo.TOP_LEFT || d===Mojo.TOP_RIGHT },
      /**Check if `d` is on the bottom hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideBottom(d){
        return d===Mojo.BOTTOM || d===Mojo.BOTTOM_LEFT || d===Mojo.BOTTOM_RIGHT },
      /**Check if 2 bboxes overlap.
       * @memberof module:mojoh5/Mojo
       * @param {object} a
       * @param {object} b
       * @return {boolean}
       */
      overlap(a,b){
        return !(a.x2 < b.x1 ||
                 b.x2 < a.x1 ||
                 a.y2 < b.y1 || b.y2 < a.y1)
      },
      /**Check if this element contains a class name.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {boolean}
       */
      hasClass(e,c){
        return new RegExp(`(\\s|^)${c}(\\s|$)`).test(e.className)
      },
      /**Add a class name to this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      addClass(e,c){
        if(!_.hasClass(e,c)) e.className += `${c}`
        return e;
      },
      /**Remove a class name from this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      removeClass(e,c){
        if(_.hasClass(e,c))
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
          throw `MixinError: "${name}" already defined.`;
        _.assert(is.fun(body),"mixin must be a function");
        _.assoc(_mixins, name, body);
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
      stageCS(cb){
        Mojo.stage.children.forEach(s=>{
          if(s instanceof Mojo.Scenes.SceneWrapper){
            s=s.children[0]
          }
          cb(s)
        })
      },
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
       * @param {number} [px]
       * @param {number} [py]
       * @param {number} [width]
       * @param {number} [height]
       * @return {object}
       */
      mockStage(px=0,py=0,width=undefined,height=undefined){
        let self=is.obj(px)?px
                           :{x:px, y:py,
                             width: _.nor(width,Mojo.width),
                             height: _.nor(height,Mojo.height)};
        self.getGlobalPosition=()=>{ return {x: this.x, y: this.y} };
        self.anchor=Mojo.makeAnchor(0,0);
        self.m5={stage:true};
        return self;
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
          throw `IndexError: ${x},${y}, wanted +ve values`;
        return MFL(x/cellW) + MFL(y/cellH) * widthInCols
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
      scaleSZ(src,des){
        return { width: des.width/src.width,
                 height: des.height/src.height} },
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} frame
       * @return {Texture}
       */
      id(frame){ return this.image(frame) },
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {Texture}
       */
      image(n){ return this.tcached(n) ||
                       _.assert(false, `${n} not loaded.`) },
      /**Get the cached XML file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      xml(n){ return (this.assets[n] ||
                      _.assert(false, `${n} not loaded.`)).data },
      /**Get the cached JSON file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      json(n){ return (this.assets[n] ||
                       _.assert(false, `${n} not loaded.`)).data },
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
          pfx="images"
        }else if(ext=="fnt" ||
                 _.has(FONT_EXTS,ext)){
          pfx="fonts"
        }else if(_.has(AUDIO_EXTS,ext)){
          pfx="audio"
        }
        return `${pfx}/${fname}`
      },
      /**Get the scale factor for this maximized viewport.
       * @memberof module:mojoh5/Mojo
       * @return {object} {width,height}
       */
      contentScaleFactor(){
        _ScrSize.height=Mojo.height;
        _ScrSize.width=Mojo.width;
        return cmdArg.scaleToWindow!=="max"?_Size11
                                           :this.scaleSZ(this.designSize,_ScrSize)
      },
      /**Get the minimum scale factor for this maximized viewport.
       * @memberof module:mojoh5/Mojo
       * @return {number}
       */
      getScaleFactor(){
        if(cmdArg.scaleToWindow!="max"){
          return 1
        }else{
          _ScrSize.height=Mojo.height;
          _ScrSize.width=Mojo.width;
          let z=this.scaleSZ(this.designSize,_ScrSize);
          return cmdArg.scaleFit=="x"?z.width
                                      :cmdArg.scaleFit=="y"
                                      ?z.height:Math.min(z.width,z.height); } },
      /**Get the named resource from the asset cache.
       * @memberof module:mojoh5/Mojo
       * @param {string} x
       * @param {boolean} [panic] if not found throws exception
       * @return {any}
       */
      resource(x,panic){
        let t= x ? (this.assets[x] || this.assets[this.assetPath(x)]) : null;
        return t || (panic ? _.assert(false, `no such resource ${x}.`) : undefined) },
      /**Get the current frames_per_second.
       * @memberof module:mojoh5/Mojo
       * @param {number} dt
       * @return {number}
       */
      calcFPS(dt){
        return dt>0 ? MFL(1.0/dt) :0; },
      degToRad(d){
        return d * (Math.PI / 180) },
      radToDeg(r){
        return r * (180 / Math.PI) },
      delBgTask(t){ t && _.disj(_BgTasks,t) },
      addBgTask(t){ _BgTasks.push(t) },
      resume(){ _paused = false },
      pause(){ _paused = true },
      start(){
        let diff=Mojo.frame;
        let last= _.now();
        let acc=0;
        let F=function(){
          let cur= _.now();
          let dt= (cur-last)/1000;
          //console.log(`frames per sec= ${Math.floor(1/dt)}`);
          //limit the time gap between calls
          if(dt>_DT15) dt= _DT15;
          for(acc += dt;
              acc >= diff;
              acc -= diff){ _update(dt); }
          last = cur;
          _raf(F);
        };
        return _raf(F);
      }
    };

    return _prologue(Mojo);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only!"
  }else{
    return gscope.MojoH5=function(arg){ return _module(arg, [], [], []) }
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

  /**Create the module. */
  function _module(Mojo){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is, dom} =Mojo;
    const ABC=Math.abs,
          MFL=Math.floor;

    /** @ignore */
    function _genTexture(displayObject, scaleMode, resolution, region){
      region = region || displayObject.getLocalBounds(null, true);
      //minimum texture size is 1x1, 0x0 will throw an error
      if(region.width === 0){ region.width = 1 }
      if(region.height === 0){ region.height = 1 }
      let mat=PIXI.Matrix.TEMP_MATRIX,
        renderTexture = PIXI.RenderTexture.create({
        width: region.width | 0,
        height: region.height | 0,
        scaleMode: scaleMode,
        resolution: resolution
      });
      mat.tx = -region.x;
      mat.ty = -region.y;
      Mojo.ctx.render(displayObject, renderTexture, false, mat, !!displayObject.parent);
      return renderTexture;
    }

    //ensure PIXI doesn't have special properties
    (function(c,g,s){
      g.clear();
      g.beginFill(0);
      g.drawCircle(0, 0, 4);
      g.endFill();
      s=new PIXI.Sprite(_genTexture(g));
      ["m5","tiled",
       "collideXY",
       "getGuid","getBBox", "getSpatial"].forEach(n=>{
        [[c,"Container"],[g,"Graphics"],[s,"Sprite"]].forEach(x=>{
          _.assertNot(_.has(x[0],n),`PIXI ${x[1]} has ${n} property!`)
        })
      });
    })(new PIXI.Container(),new PIXI.Graphics());

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

    /** default contact points, counter clockwise */
    function _corners(a,w,h){
      let out= [_V.vec(w,h), _V.vec(w,0), _V.vec(0,0), _V.vec(0,h)];
      //adjust for anchor
      out.forEach(r=>{ r[0] -= MFL(w * a.x); r[1] -= MFL(h * a.y); });
      return out;
    }

    /**Add more to an AnimatedSprite. */
    function _exASprite(s){
      let tmID,
          //[start,end,cnt,total]
          //[0,    1,  2,  3]
          _state=[0,0,0,0];
      function _reset(){
        tmID = _.clear(tmID);
        return s;
      }
      function _adv(){
        if(_state[2] < _state[3]+1){
          s.gotoAndStop(s.currentFrame+1);
          _state[2] += 1;
        }else if(s.loop){
          s.gotoAndStop(_state[0]);
          _state[2]=1;
        }
      }
      _.inject(s.m5,{
        stopFrames(){
          _reset() &&
          s.gotoAndStop(s.currentFrame)
        },
        showFrame(f){
          _reset() && s.gotoAndStop(f)
        },
        playFrames(seq){
          _reset();
          _state[0]=0;
          _state[1]= s.totalFrames-1;
          if(is.vec(seq) && seq.length>1){
            _state[0]=seq[0];
            _state[1]=seq[1];
          }
          _state[3]=_state[1]-_state[0];
          s.gotoAndStop(_state[0]);
          _state[2]=1;
          tmID = _.timer(_adv, 1000/12, true);
        }
      });
      return s;
    }

    function _animFromVec(x){
      _.assert(is.vec(x),"bad arg to animFromVec");
      if(is.str(x[0])){
        x=Mojo.tcached(x[0])?x.map(s=> Mojo.tcached(s))
                            :x.map(s=> Mojo.assetPath(s))
      }
      return _.inst(Mojo.PXTexture,x[0])? new Mojo.PXASprite(x)
                                        : Mojo.PXASprite.fromImages(x)
    }

    function _textureFromImage(x){
      return Mojo.PXTexture.from(Mojo.assetPath(x))
    }

    /**Low level sprite creation. */
    function _sprite(src,ctor){
      let s,obj;
      if(_.inst(Mojo.PXTexture,src)){
        obj=src
      }else if(is.vec(src)){
        s=_animFromVec(src)
      }else if(is.str(src)){
        obj= Mojo.tcached(src) ||
             _textureFromImage(src)
      }
      if(obj){s=ctor(obj)}
      return _.assert(s, `SpriteError: ${src} not found`) && s
    }

    /** @ignore */
    function _mkgrid(sx,sy,rows,cols,cellW,cellH){
      const out=[];
      let y1=sy;
      let x1=sx;
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
    function _pininfo(X,o,p=null){
      let par=null,box;
      if(o.m5.stage){
        box={x1:0,y1:0, x2:Mojo.width, y2:Mojo.height};
      }else{
        par=o.parent;
        box=X.getBBox(o);
      }
      if(p && par===p){
        box.x1 += p.x;
        box.x2 += p.x;
        box.y1 += p.y;
        box.y2 += p.y;
      }
      return [box, MFL((box.x2-box.x1)/2),//half width
                   MFL((box.y2-box.y1)/2),//half height
                   MFL((box.x1+box.x2)/2),//center x
                   MFL((box.y1+box.y2)/2)]//center y
    }

    function _bounceOff(o1,o2,m) {
      if(o2.m5.static){
        //full bounce
        //v=v - (1+c)(v.n_)n_
        let p= _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN));
        _V.sub$(o1.m5.vel,p);
      }else{
        let dd=_V.mul$(_V.sub(o2.m5.vel,o1.m5.vel),m.overlapN);
        let k = -2 * (dd[0]+dd[1])/(o1.m5.invMass + o2.m5.invMass);
        _V.sub$(o1.m5.vel, _V.mul$(_V.div(m.overlapN,o1.m5.mass),k));
        _V.add$(o2.m5.vel, _V.mul$(_V.div(m.overlapN,o2.m5.mass),k));
      }
    }

    function _collideDir(col){
      const c=new Set();
      if(col.overlapN[1] < -0.3){ c.add(Mojo.TOP) }
      if(col.overlapN[1] > 0.3){ c.add(Mojo.BOTTOM) }
      if(col.overlapN[0] < -0.3){ c.add(Mojo.LEFT) }
      if(col.overlapN[0] > 0.3){ c.add(Mojo.RIGHT) }
      return c;
    }

    /** @ignore */
    function _hitAB(S,a,b){
      const a_= S.toShape(a);
      const b_= S.toShape(b);
      let m;
      if(a.m5.circle){
        m= b.m5.circle ? Geo.hitCircleCircle(a_, b_)
                       : Geo.hitCirclePolygon(a_, b_)
      }else{
        m= b.m5.circle ? Geo.hitPolygonCircle(a_, b_)
                       : Geo.hitPolygonPolygon(a_, b_)
      }
      if(m){ m.A=a; m.B=b; }
      return m;
    }

    /** @ignore */
    function _collideAB(S,a,b,bounce=true){
      let ret,m=_hitAB(S,a,b);
      if(m){
        if(b.m5.static){
          _V.sub$(a,m.overlapV)
        }else{
          let d= _V.div(m.overlapV,2);
          _V.sub$(a,d);
          _V.add$(b,d);
        }
        if(bounce)
          _bounceOff(a,b,m);
      }
      return m;
    }


    const _PT=_V.vec();
    const _$={
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       */
      assertCenter(s){
        return _.assert(s.anchor.x>0.3 && s.anchor.x<0.7 &&
                        s.anchor.y>0.3 && s.anchor.y<0.7, "not center'ed") },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){
        return s.children.length === 0 },
      /**Reposition the sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      setXY(s,x,y){
        if(is.num(x)) s.x=x;
        if(is.num(y)) s.y=y;
        return s;
      },
      /**Change size of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} w
       * @param {number} h
       * @return {Sprite} s
       */
      sizeXY(s,w,h){
        if(is.num(h)) s.height=h;
        if(is.num(w)) s.width=w;
        return s;
      },
      /**Change scale factor of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      scaleXY(s, sx, sy){
        if(is.num(sx)) s.scale.x=sx;
        if(is.num(sy)) s.scale.y=sy;
        return s;
      },
      /**Change sprite's anchor position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      anchorXY(s,x,y){
        if(is.num(x)) s.anchor.x= x;
        if(is.num(y)) s.anchor.y= y;
        return s;
      },
      /**Change sprite's velocity.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} vx
       * @param {number} vy
       * @return {Sprite} s
       */
      velXY(s,vx,vy){
        if(is.num(vx)) s.m5.vel[0]= vx;
        if(is.num(vy)) s.m5.vel[1]= vy;
        return s;
      },
      /**Check if object is moving in x dir.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isVX(s){
        return !_.feq0(s.m5.vel[0]) },
      /**Check if object is moving in y dir.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isVY(s){
        return !_.feq0(s.m5.vel[1]) },
      /**Change sprite's acceleration.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} ax
       * @param {number} ay
       * @return {Sprite} s
       */
      accXY(s,ax,ay){
        if(is.num(ax)) s.m5.acc[0]= ax;
        if(is.num(ay)) s.m5.acc[1]= ay;
        return s;
      },
      /**Change sprite's gravity.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} gx
       * @param {number} gy
       * @return {Sprite} s
       */
      gravityXY(s,gx,gy){
        if(is.num(gx)) s.m5.gravity[0]= gx;
        if(is.num(gy)) s.m5.gravity[1]= gy;
        return s;
      },
      /**Change sprite's friction.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} fx
       * @param {number} fy
       * @return {Sprite} s
       */
      frictionXY(s,fx,fy){
        if(is.num(fx)) s.m5.friction[0]= fx;
        if(is.num(fy)) s.m5.friction[1]= fy;
        return s;
      },
      /**Get the size of sprite, but halved.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {width,height}
       */
      halfSize(s){
        return {width:MFL(s.width/2), height:MFL(s.height/2)} },
      /**Set sprite's anchor to be at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      centerAnchor(s){
        s.anchor.set(0.5,0.5); return s },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){
        s.anchor.set(0,0); return s },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return this.isTopLeft(s)?_V.vec()
                                :_V.vec(-MFL(s.width*s.anchor.x),
                                        -MFL(s.height*s.anchor.y)) },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return this.isCenter(s)?_V.vec()
                               :_V.vec(MFL(s.width/2) - MFL(s.anchor.x*s.width),
                                       MFL(s.height/2) - MFL(s.anchor.y*s.height))
      },
      /**Extend a sprite with extra methods.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      extend(s){
        if(!s.m5){
          let self=this;
          s.g={};
          s.m5={
            uuid: _.nextId(),
            circle:false,
            stage:false,
            drag:false,
            dead:false,
            angVel:0,
            friction: _V.vec(1,1),
            gravity: _V.vec(),
            vel: _V.vec(),
            acc: _V.vec(),
            static:false,
            sensor:false,
            sgrid: {},
            mass:1,
            type: 0,
            cmask:0,
            speed:0,
            heading:Mojo.RIGHT,
            get invMass() { return _.feq0(s.m5.mass)?0:1/s.m5.mass }
          };
          s.m5.resize=function(px,py,pw,ph){
            self.resize(s,px,py,pw,ph)
          };
          s.m5.getImageOffsets=function(){
            return {x1:0,x2:0,y1:0,y2:0}
          };
          s.m5.getContactPoints=function(){
            return _corners(s.anchor,s.width,s.height)
          };
          //these special functions are for quadtree
          s.getBBox=function(){ return self.boundingBox(s) };
          s.getGuid=function(){ return s.m5.uuid };
          s.getSpatial=function(){ return s.m5.sgrid; }
        }
        return s;
      },
      /**Convert sprite to a polygonal shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Polygon}
       */
      toPolygon(s){
        return new Geo.Polygon(s.x,s.y).setOrient(s.rotation).set(s.m5.getContactPoints()) },
      /**Convert sprite to a circular shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle}
       */
      toCircle(s){
        return this.assertCenter(s) &&
               new Geo.Circle(MFL(s.width/2)).setPos(s.x,s.y).setOrient(s.rotation) },
      /**Convert sprite to a geo shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle|Polygon}
       */
      toShape(s){
        return s.m5.circle?this.toCircle(s):this.toPolygon(s) },
      /**Get the PIXI global position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      gposXY(s){
        const p= s.getGlobalPosition();
        return _V.vec(p.x,p.y);
      },
      /**Check if sprite has anchor at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isTopLeft(s){
        return s.anchor.x < 0.3 && s.anchor.y < 0.3 },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor.x > 0.3 && s.anchor.x < 0.7 &&
               s.anchor.y > 0.3 && s.anchor.y < 0.7; },
      /**Get the center position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      centerXY(s){
        let r;
        if(this.isCenter(s)){
          r=_V.vec(s.x,s.y)
        }else{
          let [cx,cy]= this.centerOffsetXY(s);
          r= _V.vec(s.x+cx, s.y+cy);
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
        return _V.angle(this.centerXY(s1),
                        this.centerXY(s2)) },
      /**Move a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} dt
       * @return {Sprite} s
       */
      move(s,dt){
        dt=_.nor(dt,1);
        return _V.add$(s,_V.mul(s.m5.vel,dt)); },
      /**Get the left side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      leftSide(s){
        let x=s.x,
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
      rightSide(s){
        return this.leftSide(s)+s.width },
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
      bottomSide(s){
        return this.topSide(s)+s.height },
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
        return _.assert(r.y1<=r.y2,"bbox bad y values") && r; },
      /**Create a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} left
       * @param {number} right
       * @param {number} top
       * @param {number} bottom
       * @return {object} {x1,x2,y1,y2}
       */
      bbox4(left,right,top,bottom){
        return _.assert(top <= bottom,"bad bbox") &&
               {x1: left, x2: right, y1: top, y2: bottom} },
      /**Find the center of a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxCenter(b4){
        if(is.num(b4.x1))
          return _V.vec(MFL((b4.x1+b4.x2)/2),
                        MFL((b4.y1+b4.y2)/2)) },
      /**Find the size of the bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxSize(b4){
        return _V.vec(b4.x2-b4.x1, b4.y2-b4.y1) },
      /**Check if point is inside this bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} x
       * @param {number} y
       * @param {object} {x1,x2,y1,y2}
       * @return {boolean}
       */
      pointInBBox(x,y,box){
        return x > box.x1 &&
               x < box.x2 && y > box.y1 && y < box.y2 },
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
        if(!_.feq0(s.rotation))
          _.assert(this.isCenter(s),"wanted center anchor");
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
        y.sort((a,b) => a-b);
        x.sort((a,b) => a-b);
        //apply translation
        x1=MFL(x[0]+c[0]);
        x2=MFL(x[3]+c[0]);
        y1=MFL(y[0]+c[1]);
        y2=MFL(y[3]+c[1]);
        return {x1,x2,y1,y2};
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(px,py, s){
        let z=this.toShape(s);
        return s.m5.circle ? Geo.hitTestPointCircle(px,py,z)
                           : Geo.hitTestPointPolygon(px,py,z) },
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
            pt= _V.vec(),
            bad=false,
            dist= _V.len(v),
            u= _V.div(v,dist);
        for(let mag,z= MFL(dist/segment),i=1; i<=z && !bad; ++i){
          mag = segment*i;
          _V.copy(pt,_V.add(s1c,_V.mul(u,mag)));
          bad= obstacles.some(o=> this.hitTestPoint(pt[0],pt[1], o));
        }
        return !bad;
      },
      /**Find distance between these 2 sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      distance(s1, s2){
        return _V.dist(this.centerXY(s1),
                       this.centerXY(s2)) },
      /**Scale all these sprites by the global scale factor.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} args
       */
      scaleContent(...args){
        if(args.length===1&&is.vec(args[0])){ args=args[0] }
        let f=Mojo.getScaleFactor();
        args.forEach(s=>{ s.scale.x=f; s.scale.y=f })
      },
      /**Scale this object to be as big as canvas.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      scaleToCanvas(s){
        s.height=Mojo.height;
        s.width= Mojo.width;
        return s;
      },
      /**Set the uuid of a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {any} id
       * @return {Sprite} s
       */
      uuid(s,id){
        s.m5.uuid=id; return s; },
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
        s= this.extend(s);
        cb && cb(s);
        return s;
      },
      /**Create a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} x
       * @param {number} y
       * @param {boolean} center
       * @return {Sprite}
       */
      sprite(src, center=false,x=0,y=0){
        let s= _sprite(src, o=> new Mojo.PXSprite(o));
        center && this.centerAnchor(s);
        s=this.setXY(this.extend(s),x,y);
        return _.inst(Mojo.PXASprite,s) ? _exASprite(s) : s; },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      tilingSprite(src, center=false,x=0,y=0){
        let s= _sprite(src,o=> new Mojo.PXTSprite(o));
        center && this.centerAnchor(s);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spacing
       * @return {Sprite}
       */
      animation(src, tileW, tileH, spacing=0){
        let _frames=(src, w, h, pts)=>{
          return pts.map(p=> new Mojo.PXTexture(src.baseTexture,
                                                new Mojo.PXRect(p[0],p[1],w,h))) };
        let t=Mojo.tcached(src);
        if(!t)
          throw `SpriteError: ${src} not loaded.`;
        let cols = MFL(t.width/tileW),
            rows = MFL(t.height/tileH),
            pos= [],
            cells = cols*rows;
        for(let x,y,i=0; i<cells; ++i){
          x= (i%cols) * tileW;
          y= MFL(i/cols) * tileH;
          if(spacing>0){
            x += spacing + (spacing * i % cols);
            y += spacing + (spacing * MFL(i/cols));
          }
          pos.push(_V.vec(x,y));
        }
        return this.sprite(_frames(t, tileW, tileH,pos)) },
      /**Create a PIXI.Texture from this source.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      frame(src, width, height,x,y){
        const t= Mojo.tcached(src);
        return this.sprite(new Mojo.PXTexture(t.baseTexture,new Mojo.PXRect(x, y, width,height))); },
      /**Select a bunch of frames from image.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @param {number[][]} [[x,y]...]
       * @return {Texture[]}
       */
      frameSelect(src,width,height,selectors){
        const t= Mojo.tcached(src);
        return selectors.map(s=> new Mojo.PXTexture(t.baseTexture,
                                                    new Mojo.PXRect(s[0], s[1], width,height))); },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spaceX
       * @param {number} spaceY
       * @param {number} sx
       * @param {number} sy
       * @return {Texture[]}
       */
      frames(src,tileW,tileH,spaceX=0,spaceY=0,sx=0,sy=0){
        let t= Mojo.tcached(src),
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
                                        new Mojo.PXRect(x, y, tileW,tileH))); }
        }
        return out;
      },
      /**Cross reference these images to their corresponding textures.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {Texture[]}
       */
      frameImages(...pics){
        if(pics.length===1 &&
           is.vec(pics[0])){ pics=pics[0] }
        return pics.map(p=> Mojo.tcached(p)) },
      /**Create a PIXI AnimatedSprite from these images.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {AnimatedSprite}
       */
      spriteFrom(...pics){
        return this.sprite(this.frameImages(pics)) },
      /**Create a PIXI.Text object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fspec
       * @param {number} x
       * @param {number} y
       * @return {Text}
       */
      text(msg,fspec, x=0, y=0){
        let s=new Mojo.PXText(msg,fspec);
        return this.setXY(this.extend(s),x,y); },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fstyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(msg, fstyle, x=0, y=0){
        let s= new Mojo.PXBText(msg,fstyle);
        return this.setXY(this.extend(s),x,y); },
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
        let g=this.graphics(),
            stroke= this.color(strokeStyle);
        if(fillStyle !== false)
          g.beginFill(this.color(fillStyle));
        if(lineWidth>0)
          g.lineStyle(lineWidth, stroke, 1);
        g.drawRect(0, 0, width,height);
        if(fillStyle !== false)
          g.endFill();
        let t= this.genTexture(g);
        let s= new Mojo.PXSprite(t);
        return this.setXY(this.extend(s),x,y); },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        let g = this.graphics();
        cb.apply(this, [g].concat(args));
        return this.extend(new Mojo.PXSprite(this.genTexture(g))); },
      /**Create a circular sprite by generating a texture.
       * @memberof module:mojoh5/Sprites
       * @param {number} radius
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
        let s,g = this.graphics(),
            stroke= this.color(strokeStyle);
        if(fillStyle !== false)
          g.beginFill(this.color(fillStyle));
        if(lineWidth>0)
          g.lineStyle(lineWidth, stroke, 1);
        g.drawCircle(0, 0, radius);
        if(fillStyle !== false)
          g.endFill();
        s=new Mojo.PXSprite(this.genTexture(g));
        s=this.setXY(this.extend(s),x,y);
        return (s.m5.circle=true) && this.centerAnchor(s); },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @return {Sprite}
       */
      line(strokeStyle, lineWidth, A,B){
        let s,g = this.graphics(),
            _a= _V.clone(A),
            _b= _V.clone(B),
            stroke= this.color(strokeStyle) ;
        function _draw(){
          g.clear();
          g.lineStyle(lineWidth, stroke, 1);
          g.moveTo(_a[0], _a[1]);
          g.lineTo(_b[0], _b[1]);
        }
        _draw();
        s=this.extend(g);
        s.m5.ptA=function(x,y){
          if(x !== undefined){
            _a[0] = x;
            _a[1] = _.nor(y,x);
            _draw();
          }
          return _a;
        };
        s.m5.ptB=function(x,y){
          if(x !== undefined){
            _b[0] = x;
            _b[1] = _.nor(y,x);
            _draw();
          }
          return _b;
        };
        return s;
      },
      /**Check if a sprite is moving.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite}
       * @return {boolean}
       */
      isMoving(s){
        return !_.feq0(s.m5.vel[0]) || !_.feq0(s.m5.vel[1]) },
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
        return _mkgrid(sx,sy,rows,cols,cellW,cellH); },
      /**Create a rectangular arena.
       * @memberof module:mojoh5/Sprites
       * @param {number} ratioX
       * @param {number} ratioY
       * @param {object} [parent]
       * @return {object}
       */
      gridBox(ratioX=0.9,ratioY=0.9,parent=null){
        let P=_.nor(parent,Mojo);
        let h=MFL(P.height*ratioY);
        let w=MFL(P.width*ratioX);
        let x1=MFL((P.width-w)/2);
        let y1=MFL((P.height-h)/2);
        return {x1,y1,x2:x1+w,y2:y1+h};
      },
      /**Create a square grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dim
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridSQ(dim,ratio=0.6,out=null){
        let sz= ratio* (Mojo.height<Mojo.width?Mojo.height:Mojo.width),
            w=MFL(sz/dim),
            h=w,
            sy=MFL((Mojo.height-sz)/2),
            sx=MFL((Mojo.width-sz)/2),
            _x=sx,_y=sy;
        if(out){
          out.height=sz;
          out.width=sz;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
        }
        return _mkgrid(_x,_y,dim,dim,w,h);
      },
      /**Create a rectangular grid.
       * @memberof module:mojoh5/Sprites
       * @param {number[]} [dimX,dimY]
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=null){
        let szh=MFL(Mojo.height*ratioY),
            szw=MFL(Mojo.width*ratioX),
            cw=MFL(szw/dimX),
            ch=MFL(szh/dimY),
            dim=cw>ch?ch:cw,
            _x,_y,sy,sx;
        szh=dimY*dim;
        szw=dimX*dim;
        sy= MFL((Mojo.height-szh)/2);
        sx= MFL((Mojo.width-szw)/2);
        _x=sx,_y=sy;
        if(out){
          out.height=szh;
          out.width=szw;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
        }
        return _mkgrid(_x,_y,dimY,dimX,dim,dim);
      },
      /**Find the bounding box for this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number[][]} grid
       * @return {object} {x1,x2,y1,y2}
       */
      gridBBox(sx,sy,grid){
        let w=grid[0].length,
            f=grid[0][0],
            e=grid[grid.length-1][w-1];
        return {x1:sx+f.x1,
                x2:sx+e.x2, y1:sy+f.y1, y2:sy+e.y2}; },
      /**Create a PIXI Graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} [id]
       * @return {PIXI.Graphics}
       */
      graphics(id=null){
        let ctx= new Mojo.PXGraphics();
        return (ctx.m5={uuid:`${id?id:_.nextId()}`}) && ctx; },
      /**Draw borders around this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} width
       * @param {number} height
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBox(bbox,lineWidth=1,lineColor="white",ctx=null){
        if(!ctx)
          ctx= this.graphics();
        ctx.lineStyle(lineWidth,this.color(lineColor));
        ctx.drawRect(bbox.x1,bbox.y1,
                     bbox.x2-bbox.x1,bbox.y2-bbox.y1);
        return ctx;
      },
      /**Draw grid lines.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @param {PIXI.Graphics} ctx
       * @return {PIXIGraphics}
       */
      drawGridLines(sx,sy,grid,lineWidth,lineColor,ctx=null){
        let h= grid.length,
            w= grid[0].length;
        if(!ctx)
          ctx= this.graphics();
        ctx.lineStyle(lineWidth,this.color(lineColor));
        for(let r,y=1;y<h;++y){
          r=grid[y];
          ctx.moveTo(sx+r[0].x1,sy+r[0].y1);
          ctx.lineTo(sx+r[w-1].x2,sy+r[w-1].y1); }
        for(let r,x=1;x<w;++x){
          r=grid[0];
          ctx.moveTo(sx+r[x].x1,sy+r[x].y1);
          r=grid[h-1];
          ctx.lineTo(sx+r[x].x1,sy+r[x].y2); }
        return ctx;
      },
      /**Create a bullet shooting out of a shooter.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} angle
       * @param {number} speed
       * @param {function} ctor
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      shoot(src, angle, speed, ctor,x,y){
        let soff=this.topLeftOffsetXY(src);
        let b= ctor();
        _V.add$(soff,[x,y]);
        _V.copy(b,_V.add(src,soff));
        _V.set(b.m5.vel, Math.cos(angle) * speed,
                         Math.sin(angle) * speed);
        return b;
      },
      /**Group a bunch of sprites together.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       * @return {Container}
       */
      group(...cs){
        if(cs.length===1 &&
           is.vec(cs[0])){ cs=cs[0] }
        return this.container(c=> cs.forEach(s=> c.addChild(s))) },
      /**Add more children to this container.
       * @memberof module:mojoh5/Sprites
       * @param {Container} par
       * @param {...any} children
       * @return {Container} parent
       */
      add(par,...cs){
        cs.forEach(c=> c && par.addChild(c)); return par; },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       */
      remove(...cs){
        if(cs.length===1 &&
           is.vec(cs[0])){ cs=cs[0] }
        _.doseqEx(cs,s=>{
          if(s.parent){
            if(_.inst(Mojo.Scenes.Scene,s.parent))
              s.parent.remove(s);
            else
              s.parent.removeChild(s);
          }
          Mojo.off(s);
          if(s.m5.dispose)
            s.m5.dispose();
          Mojo.emit(["post.remove",s]);
        });
      },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {string} c
       * @return {number[]}
       */
      colorToRgbA(c){
        if(!c||!is.str(c)||c.length===0){return}
        let lc=c.toLowerCase(),
            code=SomeColors[lc];
        if(code){c=code}
        if(c[0]=="#"){
          if(c.length<7)
            c=`#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}${c.length>4?(c[4]+c[4]):""}`;
          return [parseInt(c.substr(1, 2), 16),
                  parseInt(c.substr(3, 2), 16),
                  parseInt(c.substr(5, 2), 16),
                  c.length>7 ? parseInt(c.substr(7, 2), 16)/255 : 1]; }

        if(lc == "transparent"){ return [0,0,0,0] }

        if(lc.indexOf("rgb") === 0){
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a });
        }else{
          throw `Error: Bad color: ${c}`
        }
      },
      /**Turn a number (0-255) into a 2-character hex number (00-ff).
       * @memberof module:mojoh5/Sprites
       * @param {number} n
       * @return {string}
       */
      byteToHex(num){
        //grab last 2 digits
        return ("0"+num.toString(16)).slice(-2) },
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
        return "0x"+ [0,1,2].map(i=> this.byteToHex(rgba[i])).join(""); },
      /**Get the integer value of this color.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} value
       * @return {number}
       */
      color(value){
        return isNaN(value) ? parseInt(this.colorToHex(value)) : value },
      rgba(arg){
        _.assert(is.vec(arg),"wanted rgba array");
        return parseInt("0x"+ [0,1,2].map(i=> this.byteToHex(arg[i])).join("")) },
      //copied from https://github.com/less/less.js
      hsla(h, s, l, a){
        function c1(v) { return Math.min(1, Math.max(0, v)) }
        function hue(h){
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if (h * 6 < 1) {
                return m1_1 + (m2_1 - m1_1) * h * 6;
            }
            else if (h * 2 < 1) {
                return m2_1;
            }
            else if (h * 3 < 2) {
                return m1_1 + (m2_1 - m1_1) * (2 / 3 - h) * 6;
            }
            else {
                return m1_1;
            }
        }
        h = h % 360 / 360;
        s = c1(s);
        l = c1(l);
        a = c1(a);
        let m2_1 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        let m1_1 = l * 2 - m2_1;
        return this.rgba([ hue(h + 1/3) * 255, hue(h) * 255, hue(h - 1/3) * 255, a ]);
      },
      /** @ignore */
      resize(s,px,py,pw,ph){
        s && _.doseqEx(s.children,c=>c.m5&&c.m5.resize&&
                                     c.m5.resize(s.x,s.y,s.width,s.height)) },
      /**Put b on top of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinTop(C,b,padY=10,alignX=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let y=boxA.y1-padY-(boxB.y2-boxB.y1);
        let x= (alignX<0.3) ? boxA.x1
                            : (alignX<0.7 ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : (b.anchor.y<0.7 ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : (b.anchor.x<0.7 ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C)}
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
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let y=boxA.y2+padY;
        let x=(alignX<0.3) ? boxA.x1 : ((alignX<0.7) ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b at center of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       */
      pinCenter(C,b){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x=cxA-w2B;
        let y=cyA-h2B;
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(C.m5.stage || b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b left of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinLeft(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x= boxA.x1 - padX - (boxB.x2-boxB.x1);
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b right of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinRight(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x= boxA.x2 + padX;
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Assign some mass to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} m
       */
      setMass(s,m){
        s.m5.mass=m; },
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
        return _genTexture(displayObject, scaleMode, resolution, region) },
      /**Apply bounce to the objects in this manifold.
       * @memberof module:mojoh5/Sprites
       * @param {Manifold} m
       */
      bounceOff(m){
        return _bounceOff(m.A,m.B,m) },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hit(a,b){
        let m= _hitAB(this,a,b);
        if(m){
          Mojo.emit(["hit",a],m);
          Mojo.emit(["hit",b],m.swap()) }
        return m;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} bounce
       * @return {boolean}
       */
      collide(a,b, bounce=true){
        let m= _collideAB(this,a,b,bounce);
        return m && _collideDir(m);
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hitTest(a,b){ return _hitAB(this,a,b) },
      /**Use to contain a sprite with `x` and
       * `y` properties inside a rectangular area.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {Container} container
       * @param {boolean} [bounce]
       * @param {function} [extra]
       * @return {number[]} a list of collision points
       */
      clamp(s, container, bounce=false,extra=null){
        let c;
        if(container instanceof Mojo.Scenes.Scene){
          c=Mojo.mockStage();
        }else if(container.m5 && container.m5.stage){
          c=container;
        }else{
          if(container.isSprite)
            _.assert(s.parent===container);
          else
            _.assert(false,"Error: clamp() using bad container");
          _.assert(_.feq0(container.rotation),"Error: clamp() container can't rotate");
          _.assert(_.feq0(container.anchor.x),"Error: clamp() container anchor.x !==0");
          _.assert(_.feq0(container.anchor.y),"Error: clamp() container anchor.y !==0");
          c=container;
        }
        let coff= this.topLeftOffsetXY(c);
        let collision = new Set();
        let CX=false,CY=false;
        let R= Geo.getAABB(this.toShape(s));
        let cl= c.x+coff[0],
            cr= cl+c.width,
            ct= c.y+coff[1],
            cb= ct+c.height;
        let rx=R.pos[0];
        let ry=R.pos[1];
        //left
        if(rx<cl){
          s.x += cl-rx;
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //right
        if(rx+R.width > cr){
          s.x -= rx+R.width- cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(ry < ct){
          s.y += ct-ry;
          CY=true;
          collision.add(Mojo.TOP);
        }
        //bottom
        if(ry+R.height > cb){
          s.y -= ry+R.height - cb;
          CY=true;
          collision.add(Mojo.BOTTOM);
        }
        if(collision.size > 0){
          if(CX){
            s.m5.vel[0] /= s.m5.mass;
            if(bounce) s.m5.vel[0] *= -1;
          }
          if(CY){
            s.m5.vel[1] /= s.m5.mass;
            if(bounce) s.m5.vel[1] *= -1;
          }
          extra && extra(collision)
        }else{
          collision=null;
        }
        return collision;
      },
      dbgShowCol(col){
        let out=[];
        if(is.set(col))
          for(let i of col.values())
            switch(i){
              case Mojo.TOP:
                out.push("top");
                break;
              case Mojo.LEFT:
                out.push("left");
                break;
              case Mojo.RIGHT:
                out.push("right");
                break;
              case Mojo.BOTTOM:
                out.push("bottom");
                break;
            }
        return out.join(",");
      }
    };

    return (Mojo.Sprites= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sprites"]=function(M){
      return M.Sprites ? M.Sprites : _module(M)
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

  /**Create the module. */
  function _module(Mojo, ScenesDict){

    const {ute:_,is}=Mojo;
    const MFL=Math.floor;

    /**
     * @module mojoh5/Scenes
     */

    /**Creates a 2d spatial grid. */
    function SpatialGrid(cellW=320,cellH=320){
      const _grid= new Map();
      return{
        searchAndExec(item,cb){
          let ret,
              g= item.m5.sgrid;
          for(let X,Y,y = g.y1; y <= g.y2; ++y){
            if(Y=_grid.get(y))
              for(let vs,r,x= g.x1; x <= g.x2; ++x)
                if(X=Y.get(x)){
                  vs=X.values();
                  r= vs.next();
                  while(!r.done){
                    if(item !== r.value){
                      if(ret=cb(item,r.value)){
                        x=y=Infinity;
                        break;
                      }
                    }
                    ret=null;
                    r= vs.next();
                  }
                }
          }
          return ret;
        },
        search(item,incItem=false){
          let X,Y,out=[],
              g= item.m5.sgrid;
          for(let y = g.y1; y <= g.y2; ++y){
            if(Y=_grid.get(y))
              for(let x= g.x1; x <= g.x2; ++x)
                if(X=Y.get(x))
                  X.forEach(v=>{
                    if(v===item && !incItem){}else{
                      out.push(v)
                    }
                  })
          }
          return out
        },
        engrid(item,skipAdd){
          if(!item || !item.anchor){return}
          let r = Mojo.Sprites.boundingBox(item),
              g = item.m5.sgrid,
              gridX1 = MFL(r.x1 / cellW),
              gridY1 = MFL(r.y1 / cellH),
              gridX2 = MFL(r.x2/cellW),
              gridY2 = MFL(r.y2/ cellH);

          if(g.x1 !== gridX1 || g.x2 !== gridX2 ||
             g.y1 !== gridY1 || g.y2 !== gridY2){
            this.degrid(item);
            g.x1= gridX1;
            g.x2= gridX2;
            g.y1= gridY1;
            g.y2= gridY2;
            if(!skipAdd) this._register(item);
          }
          return item;
        },
        reset(){
          _grid.clear()
        },
        _register(item){
          let g= item.m5.sgrid;
          if(is.num(g.x1)){
            for(let X,Y,y= g.y1; y <= g.y2; ++y){
              if(!_grid.has(y))
                _grid.set(y, new Map());
              Y=_grid.get(y);
              for(let x= g.x1; x <= g.x2; ++x){
                if(!Y.has(x))
                  Y.set(x, new Map());
                X=Y.get(x);
                _.assoc(X,item.m5.uuid, item);
              }
            }
          }
        },
        degrid(item){
          if(item && item.anchor){
            let g= item.m5.sgrid;
            if(is.num(g.x1)){
              for(let X,Y,y= g.y1; y <= g.y2; ++y){
                if(Y=_grid.get(y))
                  for(let x= g.x1; x<=g.x2; ++x)
                    if(X=Y.get(x))
                      _.dissoc(X,item.m5.uuid)
              }
            }
          }
        }
      }
    }

    /** @ignore */
    function _sceneid(id){
      return id.startsWith("scene::") ? id : `scene::${id}` }

    /** @ignore */
    function _killScene(s){
      if(s){
        s.dispose && s.dispose();
        s.parent.removeChild(s); } }

    /** internal class */
    class SceneWrapper extends Mojo.PXContainer{
      constructor(s){
        super();
        this.addChild(s);
        this.name=s.name;
        this.m5={stage:true};
      }
      update(dt){
        this.children[0].update(dt)
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
        this.g={};
        this.m5={
          sid:id,
          index:{},
          queue:[],
          garbo:[],
          options,
          stage:true,
          sgrid:SpatialGrid(options.sgridX||320,
                            options.sgridY||320)
        };
        if(is.fun(func)){
          this.m5.setup= func.bind(this)
        }else if(is.obj(func)){
          let s= _.dissoc(func,"setup");
          if(s) this.m5.setup=s.bind(this);
          _.inject(this, func);
        }
      }
      _hitObjects(grid,obj,found,maxCol=3){
        let curCol=maxCol;
        for(let m,b,i=0,z=found.length;i<z;++i){
          b=found[i];
          if(obj !== b &&
             !b.m5.dead &&
             (obj.m5.cmask & b.m5.type)){
            m= Mojo.Sprites.hitTest(obj,b);
            if(m){
              Mojo.emit(["hit",obj],m);
              if(m.B.m5.static){ m=null }else{
                Mojo.emit(["hit",m.B],m.swap())
              }
              grid.engrid(obj);
              if(--curCol ===0){break}
            }
          }
        }
      }
      collideXY(obj){
        this._hitObjects(this.m5.sgrid,obj,
                         this.m5.sgrid.search(obj)) }
      /**Callback to handle window resizing.
       * @param {number[]} old  window size before resize
       */
      onCanvasResize([width,height]){
        Mojo.Sprites.resize({x:0,y:0,
                             width:width,
                             height:height,
                             children:this.children}) }
      /**Run this function after a delay in millis or frames.
       * @param {function}
       * @param {number} delay
       */
      future(expr,delay){
        this.m5.queue.push([expr,delay]) }
      /**Get the child with this id.
       * @param {string} id
       * @return {Sprite}
       */
      getChildById(id){
        return id && this.m5.index[id] }
      /**Remove this child
       * @param {string|Sprite} c
       */
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c){
          this.removeChild(c);
          if(c.m5._engrid)
            this.m5.sgrid.degrid(c);
          if(c.m5.drag)
            Mojo.Input.undoDrag(c);
          if(c.m5.button)
            Mojo.Input.undoButton(c);
          Mojo.off(c);
          _.dissoc(this.m5.index,c.m5.uuid); } }
      /**Insert this child sprite.
       * @param {Sprite} c
       * @param {boolean} [engrid]
       * @return {Sprite} c
       */
      insert(c,engrid=false){
        return this.insertAt(c,null,engrid) }
      /**Insert this child sprite at this position.
       * @param {Sprite} c
       * @param {number} pos
       * @param {boolean} [engrid]
       * @return {Sprite} c
       */
      insertAt(c,pos,engrid=false){
        c=this._addit(c,pos);
        if(engrid){
          if(c instanceof PIXI.TilingSprite){}else{
            c.m5._engrid=true;
            this.m5.sgrid.engrid(c);
          }
        }
        return c;
      }
      /** @ignore */
      _addit(c,pos){
        if(is.num(pos) &&
           pos >= 0 &&
           pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        return (this.m5.index[c.m5.uuid]=c); }
      /**Clean up.
      */
      dispose(){
        function _c(o){
          if(o){
            o.children.length>0 && o.children.forEach(c=> _c(c));
            const i=Mojo.Input;
            o.m5.button && i.undoButton(o);
            o.m5.drag && i.undoDrag(o);
          }
        }
        Mojo.off(this);
        this.m5.dead=true;
        _c(this);
        this.removeChildren();
      }
      /** @ignore */
      _tick(r,dt){
        r.forEach(c=>{
          if(c.visible && c.m5 && c.m5.tick){
            c.m5.tick(dt);
            if(c.m5.flip=="x"){
              c.scale.x *= -1;
            }
            if(c.m5.flip=="y"){
              c.scale.y *= -1;
            }
            c.m5.flip=false;
            Mojo.emit(["post.tick",c],dt);
            if(c.m5._engrid) this.m5.sgrid.engrid(c);
          }
          c.children.length>0 && this._tick(c.children, dt) }) }
      /**Find objects that may collide with this object.
       * @param {object} obj
       * @return {object[]}
       */
      searchSGrid(obj,incObj=false){
        return this.m5.sgrid.search(obj,incObj) }
      queueForRemoval(obj){
        this.m5.garbo.push(obj) }
      /**
       * @param {number} dt
       */
      update(dt){
        if(this.m5.dead){return;}
        //handle queued stuff
        let f,futs= this.m5.queue.filter(q=>{
          q[1] -= 1;
          return (q[1]<=0);
        });
        //run ones that have expired
        while(futs.length>0){
          _.disj(this.m5.queue, f=futs.shift());
          f[0]();
        }
        if(this.preUpdate) this.preUpdate(dt);
        this._tick(this.children, dt);
        if(this.postUpdate) this.postUpdate(dt);
        //clean up
        this.m5.garbo.forEach(o=>this.remove(o));
        this.m5.garbo.length=0;
      }
      /**Initial bootstrap of this scene.
      */
      runOnce(){
        if(this.m5.setup){
          this.m5.setup(this.m5.options);
          delete this.m5["setup"];
        }
      }
    }

    function _layout(items,options,dir){
      const {Sprites}=Mojo,
            K=Mojo.getScaleFactor();
      if(items.length===0){return}
      options= _.patch(options,{color:0,
                                padding:10,
                                fit:20,
                                borderWidth:4,
                                border:0xffffff});
      let borderWidth=options.borderWidth * K;
      let C=options.group || Sprites.group();
      let pad=options.padding * K;
      let fit= options.fit * K;
      let p,fit2= 2*fit;
      items.forEach((s,i)=>{
        if(!options.skipAdd) C.addChild(s);
        _.assert(s.anchor.x<0.3&&s.anchor.y<0.3,"wanted topleft anchor");
        if(i>0)
          Sprites[dir===Mojo.DOWN?"pinBottom":"pinRight"](p,s,pad);
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
      if(dir===Mojo.DOWN){
        //realign on x-axis
        items.forEach(s=> s.x=w2-MFL(s.width/2));
        let hd= h-(last.y+last.height);
        hd= MFL(hd/2);
        //realign on y-axis
        items.forEach(s=> s.y += hd);
      }else{
        //refit the items on y-axis
        items.forEach(s=> s.y=h2-MFL(s.height/2));
        let wd= w-(last.x+last.width);
        wd= MFL(wd/2);
        //refit the items on x-axis
        items.forEach(s=> s.x += wd);
      }
      //may be center the whole thing
      C.x= _.nor(options.x, MFL((Mojo.width-w)/2));
      C.y= _.nor(options.y, MFL((Mojo.height-h)/2));
      return C;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //the module
    const _$={
      Scene,
      SceneWrapper,
      /**Lay items out horizontally.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      layoutX(items,options){
        return _layout(items,options,Mojo.RIGHT) },
      /**Lay items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      layoutY(items,options){
        return _layout(items, options, Mojo.DOWN) },
      /**Define a scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object|function} func
       * @param {object} [options]
       */
      defScene(name, func, options){
        //add a new scene definition
        if(is.fun(func)){
          func={setup:func}
        }
        ScenesDict[name]=[func, options]
      },
      /**Replace the current scene with this one.
       * @memberof module:mojoh5/Scenes
       * @param {string|Scene} cur
       * @param {string} name
       * @param {object} [options]
       */
      replaceScene(cur,name,options){
        const n=_sceneid(is.str(cur)?cur:cur.name);
        const c= Mojo.stage.getChildByName(n);
        if(!c)
          throw `Fatal: no such scene: ${n}`;
        return this.runScene(name, Mojo.stage.getChildIndex(c),options);
      },
      /**Remove these scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...Scene} args
       */
      removeScene(...args){
        if(args.length===1 &&
           is.vec(args[0])){ args=args[0] }
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
        Mojo.mouse.reset();
      },
      /**Find this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @return {Scene}
       */
      findScene(name){
        return Mojo.stage.getChildByName(_sceneid(name)) },
      /**Remove all scenes first then run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene}
       */
      runSceneEx(name,num,options){
        this.removeScenes();
        this.runScene(name,num,options); },
      /**Run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene}
       */
      runScene(name,num,options){
        let py, y, s0,_s = ScenesDict[name];
        if(!_s)
          throw `Fatal: unknown scene: ${name}`;
        if(is.obj(num)){
          options = num;
          num = _.dissoc(options,"slot");
        }
        options = _.inject({},_s[1],options);
        s0=_.inject({},_s[0]);
        if(is.undef(num))
          num= options["slot"] || -1;
        //before we run a new scene
        Mojo.mouse.reset();
        //create new
        if(options.tiled){
          _.assert(options.tiled.name, "no tmx file!");
          y = new Mojo.Tiles.TiledScene(name, s0, options);
        }else{
          y = new Scene(name, s0, options);
        }
        py=y;
        if(options.centerStage){
          py=new SceneWrapper(y);
        }
        //add to where?
        if(num >= 0 && num < Mojo.stage.children.length){
          let cur= Mojo.stage.getChildAt(num);
          Mojo.stage.addChildAt(py,num);
          _killScene(cur);
        }else{
          Mojo.stage.addChild(py);
        }
        y.runOnce();
        return y;
      }
    };

    return (Mojo.Scenes=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
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
  function _module(Mojo,SoundFiles){

    const {ute:_, is}=Mojo;

    /**
     * @module mojoh5/Sound
     */

    /** @ignore */
    function _make(_A,name, url){
      const s={
        soundNode: null,
        buffer: null,
        src: url,
        name: name,
        loop: false,
        playing: false,
        vol: 1,
        start: 0,
        startOffset: 0,
        playbackRate: 1,
        gainNode: _A.ctx.createGain(),
        panNode: _A.ctx.createStereoPanner(),
        play(){
          this.start = _A.ctx.currentTime;
          this.soundNode = _A.ctx.createBufferSource();
          this.soundNode.buffer = this.buffer;
          this.soundNode.playbackRate.value = this.playbackRate;
          this.soundNode.connect(this.gainNode);
          this.gainNode.connect(this.panNode);
          this.panNode.connect(_A.ctx.destination);
          this.soundNode.loop = this.loop;
          this.soundNode.start(0, this.startOffset % this.buffer.duration);
          this.playing = true;
        },
        _stop(){
          if(this.playing)
            this.playing=false;
            this.soundNode.stop(0) },
        pause(){
          if(this.playing){
            this._stop();
            this.startOffset += _A.ctx.currentTime - this.start; } },
        playFrom(value){
          this.startOffset = value;
          this._stop();
          this.play();
        },
        restart(){
          this.playFrom(0) },
        get pan(){
          return this.panNode.pan.value },
        set pan(v){
          //-1(left speaker)
          //1(right speaker)
          this.panNode.pan.value = v },
        get volume(){
          return this.vol },
        set volume(v){
          this.vol=v;
          this.gainNode.gain.value = v; }
      };
      return SoundFiles[name]=s;
    };

    const _$={
      ctx: new gscope.AudioContext(),
      /**Decode these sound bytes.
       * @memberof module:mojoh5/Sound
       * @param {string} name
       * @param {any} url
       * @param {any} blob
       * @param {function} onLoad
       * @param {function} [onFail]
       * @return {object}
       */
      decodeData(name, url,blob, onLoad, onFail){
        let snd= _make(this,name, url);
        this.ctx.decodeAudioData(blob, b=>{ onLoad(snd.buffer=b);
                                            CON.log(`decoded sound file:${url}`); },
                                       e=> { onFail && onFail(url,e) });
        return snd;
      },
      /**Decode the sound file at this url.
       * @memberof module:mojoh5/Sound
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
          this.decodeData(url, xhr.response, onLoad, onFail)
        });
        xhr.send();
        return snd;
      }
    };

    /**Extend Mojo */
    Mojo.sound=function(fname){
      return SoundFiles[Mojo.assetPath(fname)] ||
             _.assert(false, `Sound: ${fname} not loaded.`)
    };

    return (Mojo.Sound= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
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

  /**Creates the module. */
  function _module(Mojo,ActiveTouches,Buttons,DragDrops){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_,is}=Mojo;
    const _keyInputs= _.jsMap();

    /**
     * @module mojoh5/Input
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
      if(ptr && ptr.state[0]){
        if(!ptr.dragged){
          for(let s,i=DragDrops.length-1; i>=0; --i){
            s=DragDrops[i];
            if(s.m5.drag && ptr.hitTest(s)){
              let cs= s.parent.children,
                  g=Mojo.Sprites.gposXY(s);
              ptr.dragged = s;
              ptr.dragOffsetX = ptr.x - g[0];
              ptr.dragOffsetY = ptr.y - g[1];
              //important,force this flag to off so
              //if drag dropped onto a button, button
              //won't get triggered
              ptr.state[2]=false;
              //pop it up to top
              _.disj(cs,s);
              _.conj(cs,s);
              _.disj(DragDrops,s);
              _.conj(DragDrops,s);
              break;
            }
          }
        }else{
          _V.set(ptr.dragged, ptr.x - ptr.dragOffsetX, ptr.y - ptr.dragOffsetY)
        }
      }
      if(ptr && ptr.state[1]){
        //dragged and now dropped
        if(ptr.dragged &&
           ptr.dragged.m5.onDragDropped)
          ptr.dragged.m5.onDragDropped();
        ptr.dragged=null;
      }
    }

    const _$={
      LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40,
      ZERO: 48, ONE: 49, TWO: 50,
      THREE: 51, FOUR: 52, FIVE: 53,
      SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
      A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
      G: 71, H: 72, I: 73, J: 74, K: 75, L: 76,
      M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82,
      S: 83, T: 84, U: 85, V: 86, W: 87, X: 88,
      Y: 89, Z: 90,
      ENTER: 13, ESC: 27, BACKSPACE: 8, TAB: 9,
      SHIFT: 16, CTRL: 17, ALT: 18, SPACE: 32,
      HOME: 36, END: 35,
      PGGUP: 33, PGDOWN: 34,
      ptr:null,
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/Input
       */
      resize(){
        if(this.ptr)
          this.ptr.dispose();
        Mojo.mouse= this.pointer();
      },
      /**Clear all keyboard states.
       * @memberof module:mojoh5/Input
       */
      reset(){ _keyInputs.clear() },
      /**
       * @memberof module:mojoh5/Input
       * @param {number} _key
       */
      keybd(_key,press,release){
        const key={press:press,
                   release:release,
                   isDown:false, isUp:true};
        key.code= is.vec(_key)?_key:[_key];
        function _down(e){
          e.preventDefault();
          if(key.code.includes(e.keyCode)){
            key.isUp && key.press && key.press();
            key.isUp=false; key.isDown=true;
          }
        }
        function _up(e){
          e.preventDefault();
          if(key.code.includes(e.keyCode)){
            key.isDown && key.release && key.release();
            key.isUp=true; key.isDown=false;
          }
        }
        _.addEvent([["keyup", window, _up, false],
                    ["keydown", window, _down, false]]);
        key.dispose=()=>{
          _.delEvent([["keyup", window, _up],
                      ["keydown", window, _down]]);
        }
        return key;
      },
      /**This sprite is no longer a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoButton(b){
        b.m5.enabled=false;
        b.m5.button=false;
        _.disj(Buttons,b);
        return b;
      },
      /**This sprite is now a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeButton(b){
        b.m5.enabled = true;
        b.m5.button=true;
        _.conj(Buttons,b);
        return b;
      },
      /** @ignore */
      update(dt){
        DragDrops.length>0 && _updateDrags(this.ptr)
      },
      /**This sprite is now draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      makeDrag(s){
        _.conj(DragDrops,s);
        s.m5.drag=true;
        return s;
      },
      /**This sprite is now not draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      undoDrag(s){
        _.disj(DragDrops,s);
        s.m5.drag=false;
        return s;
      },
      /**Check if this key is currently not pressed.
       * @memberof module:mojoh5/Input
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
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        let ptr={
          state: [false,true,false],
          //isDown: false, isUp: true, tapped: false,
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
          get isUp(){return this.state[1]},
          get isDown(){return this.state[0]},
          get isClicked(){return this.state[2]},
          set visible(v) {
            this.cursor = v ? "auto" : "none";
            this._visible = v;
          },
          getGlobalPosition(){
            return {x: this.x, y: this.y}
          },
          press(){
            for(let s,i=0,z=Buttons.length;i<z;++i){
              s=Buttons[i];
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
              Mojo.emit(["mousedown"]);
            }
          },
          mouseMove(e){
            ptr._x = e.pageX - e.target.offsetLeft;
            ptr._y = e.pageY - e.target.offsetTop;
            //e.preventDefault();
            Mojo.emit(["mousemove"]);
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
              Mojo.emit(["mouseup"]);
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
            _.assoc(ActiveTouches,tid,ptr._copyTouch(ct[0],t));
            Mojo.emit(["touchstart"]);
          },
          touchMove(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(ActiveTouches,tid);
            ptr._x = ct[0].pageX - t.offsetLeft;
            ptr._y = ct[0].pageY - t.offsetTop;
            e.preventDefault();
            Mojo.emit(["touchmove"]);
          },
          touchEnd(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t = e.target;
            let tid= ct[0].identifier||0;
            let active = _.get(ActiveTouches,tid);
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
            Mojo.emit(["touchend"]);
          },
          touchCancel(e){
            let ct=e.changedTouches;
            //let tt=e.targetTouches;
            let t=e.target;
            let t0=ct[0];
            let tid= touch.identifier || 0;
            let active = _.get(ActiveTouches,tid);
            e.preventDefault();
            if(active)
              _.dissoc(ActiveTouches,tid);
          },
          reset(){
            _.setVec(ptr.state,false,true,false);
            Buttons.length=0;
            DragDrops.length=0;
          },
          hitTest(s){
            let _S=Mojo.Sprites,
                g=_S.gposXY(s),
                p=_S.toPolygon(s),
                ps=_V.translate(g,p.calcPoints);
            return Geo.hitTestPointInPolygon(ptr.x,ptr.y,ps);
          },
          dispose(){
            ptr.reset();
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

    //keep tracks of keyboard presses
    _.addEvent([["keyup", window, _uh, false],
                ["keydown", window, _dh, false]]);

    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
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

  /**Create the module. */
  function _module(Mojo){

    const {is,ute:_}=Mojo,
          P8=Math.PI/8;

    /**
     * @module mojoh5/Touch
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
       * @memberof module:mojoh5/Touch
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
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Touch"]=function(M){
      return M.Touch ? M.Touch : _module(M)
    }
  }

})(this);



/* Licensed under the Apache License, Version 2.0 (the "License");
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

  /**Create the module. */
  function _module(Mojo){
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const WHITE=Mojo.Sprites.color("white");
    const {is, ute:_}=Mojo;
    const ABS=Math.abs,
          MFL=Math.floor;

    /**
     * @module mojoh5/2d
     */

    //https://github.com/dwmkerr/starfield/blob/master/starfield.js
    Mojo.Scenes.defScene("StarfieldBg",{
      setup(options){
        if(!options.minVel) options.minVel=15;
        if(!options.maxVel) options.maxVel=30;
        if(!options.count) options.count=100;
        if(!options.width) options.width=Mojo.width;
        if(!options.height) options.height=Mojo.height;

        let gfx= Mojo.Sprites.graphics();
        let stars=[];

        this.g.fps= 1.0/options.fps;
        this.g.stars=stars;
        this.g.gfx=gfx;
        this.g.lag=0;

        for(let i=0; i<options.count; ++i){
          stars[i] = {x: _.rand()*options.width,
                      y: _.rand()*options.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(options.maxVel- options.minVel))+options.minVel};
        }
        this._draw();
        this.insert(gfx);
      },
      _draw(){
        this.g.gfx.clear();
        this.g.stars.forEach(s=>{
          this.g.gfx.beginFill(WHITE);
          this.g.gfx.drawRect(s.x,s.y,s.size,s.size);
          this.g.gfx.endFill();
        });
      },
      postUpdate(dt){
        this.g.lag +=dt;
        if(this.g.lag<this.g.fps){
          return;
        }else{
          this.g.lag=0;
        }
        for(let s,i=0;i<this.g.stars.length;++i){
          s=this.g.stars[i];
          s.y += dt * s.vel;
          if(s.y > this.m5.options.height){
            _V.set(s, _.rand()*this.m5.options.width,0);
            s.size=_.rand()*3+1;
            s.vel=(_.rand()*(this.m5.options.maxVel- this.m5.options.minVel))+this.m5.options.minVel;
          }
        }
        this._draw();
      }
    },{fps:30, count:100, minVel:15, maxVel:30 });

    class PeriodicDischarge{
      constructor(ctor,intervalSecs,size=16,...args){
        this._interval=intervalSecs;
        this._ctor=ctor;
        this._timer=0;
        this._size=size
        this._pool=_.fill(size,ctor);
      }
      _take(){
        if(this._pool.length>0) return this._pool.pop() }
      reclaim(o){
        if(this._pool.length<this._size) this._pool.push(o); }
      lifeCycle(dt){
        this._timer += dt;
        if(this._timer > this._interval){
          this._timer = 0;
          this.discharge();
        }
      }
      discharge(){
        throw `PeriodicCharge: please implement action()` }
    }

    /** walks around a maze like in Pacman. */
    function MazeRunner(e,frames){
      const {Sprites, Input}=Mojo;
      const self={
        onTick(dt){
          let [vx,vy]=e.m5.vel,
              vs=e.m5.speed,
              x = !_.feq0(vx),
              y = !_.feq0(vy);
          if(!(x&&y) && frames){
            if(y)
              e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP])
            if(x)
              e.m5.showFrame(frames[vx>0?Mojo.RIGHT:Mojo.LEFT])
          }
          const r=Input.keyDown(Input.RIGHT) && Mojo.RIGHT;
          const d=Input.keyDown(Input.DOWN) && Mojo.DOWN;
          const l=Input.keyDown(Input.LEFT) && Mojo.LEFT;
          const u=Input.keyDown(Input.UP) && Mojo.UP;
          if(l||u){vs *= -1}
          if(l&&r){
            _V.setX(e.m5.vel,0);
          }else if(l||r){
            _V.setX(e.m5.vel,vs);
            e.m5.heading= l||r;
          }
          if(u&&d){
            _V.setY(e.m5.vel,0);
          }else if(u||d){
            _V.setY(e.m5.vel,vs);
            e.m5.heading= u||d;
          }
        }
      };
      return (e.m5.heading=Mojo.UP) && self;
    }

    /** platformer like mario. */
    function Platformer(e){
      const {Input, Sprites}=Mojo;
      const sigs=[];
      const self={
        jumpKey: Input.UP,
        jumpSpeed: -300,
        _jumping:0,
        _ground:0,
        dispose(){
          sigs.forEach(s=> Mojo.off(...s)) },
        onGround(){ self._ground=0.2 },
        onTick(dt,colls){
          if(!e.m5.skipHit)
            this._onTick(dt,colls)
          self._ground -=dt;
        },
        _onTick(dt,colls){
          let col=colls[0],
              vs= e.m5.speed,
              j3= self.jumpSpeed/3,
              pR= Input.keyDown(Input.RIGHT),
              pL= Input.keyDown(Input.LEFT),
              pU= Input.keyDown(self.jumpKey);
          if(col && (pL || pR || self._ground>0)){
            //too steep to go up or down
            if(col.overlapN[1] > 0.85 ||
               col.overlapN[1] < -0.85){ col= null }
          }
          if(pL && !pR){
            e.m5.heading = Mojo.LEFT;
            if(col && self._ground>0){
              _V.set(e.m5.vel, vs * col.overlapN[0],
                                -vs * col.overlapN[1])
            }else{
              _V.setX(e.m5.vel,-vs)
            }
          }else if(pR && !pL){
            e.m5.heading = Mojo.RIGHT;
            if(col && self._ground>0){
              _V.set(e.m5.vel, -vs * col.overlapN[0],
                                vs * col.overlapN[1])
            }else{
              _V.setX(e.m5.vel, vs)
            }
          }else{
            _V.setX(e.m5.vel,0);
            if(col && self._ground>0)
              _V.setY(e.m5.vel,0);
          }
          //handle jumpy things
          if(self._ground>0 && !self._jumping && pU){
            _V.setY(e.m5.vel,self.jumpSpeed);
            self._jumping +=1;
            self._ground = -dt;
          }else if(pU){
            //held long enough, tell others it's jumping
            if(self._jumping<2){
              self._jumping +=1;
              Mojo.emit(["jump",e]);
            }
          }

          if(self._jumping && !pU){
            self._jumping = 0;
            Mojo.emit(["jumped",e]);
            if(e.m5.vel[1] < j3){ e.m5.vel[1] = j3 }
          }
        }
      };
      sigs.push([["bump.bottom",e],"onGround",self]);
      sigs.forEach(s=> Mojo.on(...s));
      return self;
    }

    /**Define a mixin object. */
    Mojo.defMixin("2d",function(e,...minors){
      const {Sprites}= Mojo;
      const colls=[];
      const sigs=[];
      const subs=[];
      const self={
        dispose(){
          subs.forEach(s=> s.dispose());
          sigs.forEach(s=> Mojo.off(...s)) },
        boom(col){
          _.assert(col.A===e,"got hit by someone else???");
          if(col.B && col.B.m5.sensor){
            Mojo.emit(["2d.sensor", col.B], col.A);
          }else{
            let [dx,dy]= e.m5.vel;
            col.impact=null;
            _V.sub$(e,col.overlapV);
            if(col.overlapN[1] < -0.3){
              if(!e.m5.skipHit && dy<0){ _V.setY(e.m5.vel,0) }
              col.impact = ABS(dy);
              Mojo.emit(["bump.top", e],col);
            }
            if(col.overlapN[1] > 0.3){
              if(!e.m5.skipHit && dy>0){ _V.setY(e.m5.vel,0) }
              col.impact = ABS(dy);
              Mojo.emit(["bump.bottom",e],col);
            }
            if(col.overlapN[0] < -0.3){
              if(!e.m5.skipHit && dx<0){ _V.setX(e.m5.vel,0) }
              col.impact = ABS(dx);
              Mojo.emit(["bump.left",e],col);
            }
            if(col.overlapN[0] > 0.3){
              if(!e.m5.skipHit && dx>0){ _V.setX(e.m5.vel,0) }
              col.impact = ABS(dx);
              Mojo.emit(["bump.right",e],col);
            }
            if(is.num(col.impact)){
              Mojo.emit(["bump",e],col);
            }else{
              col.impact=0
            }
          }
          colls.shift(col);
        },
        onTick(dt){
          colls.length=0;
          if(is.num(dt)){
            _V.add$(e.m5.vel,_V.mul(e.m5.gravity,dt));
            _V.add$(e.m5.vel,_V.mul(e.m5.acc,dt));
            _V.mul$(e.m5.vel, e.m5.friction);
          }
          e.parent.collideXY(Sprites.move(e,dt));
          subs.forEach(s=> s.onTick(dt,colls));
        }
      };
      sigs.push([["hit",e],"boom",self],
                [["post.remove",e],"dispose",self]);
      sigs.forEach(s=> Mojo.on(...s));
      for(let f,o,m,i=0;i<minors.length;++i){
        m=minors[i];
        f=m[0];
        m[0]=e;
        o=f(...m);
        if(o.onTick)
          subs.push(o);
        _.assert(is.str(f.name)) && (self[f.name]=o);
      }
      return self;
    });

    function Patrol(e,xDir,yDir){
      const sigs=[];
      const self= {
        dispose(){
          sigs.forEach(a=>Mojo.off(...a)) },
        goLeft(col){
          _V.setX(e.m5.vel, -col.impact);
          e.m5.heading=Mojo.LEFT;
          e.m5.flip= "x";
        },
        goRight(col){
          _V.setX(e.m5.vel, col.impact);
          e.m5.heading=Mojo.RIGHT;
          e.m5.flip= "x";
        },
        goUp(col){
          _V.setY(e.m5.vel,-col.impact);
          e.m5.heading=Mojo.UP;
          e.m5.flip= "y";
        },
        goDown(col){
          _V.setY(e.m5.vel, col.impact);
          e.m5.heading=Mojo.DOWN;
          e.m5.flip= "y";
        }
      };
      sigs.push([["post.remove",e],"dispose",self]);
      if(xDir){
        //e.m5.heading=Mojo.LEFT;
        sigs.push([["bump.right",e],"goLeft",self],
                  [["bump.left",e],"goRight",self]);
      }
      if(yDir){
        //e.m5.heading=Mojo.UP;
        sigs.push([["bump.top",e],"goDown",self],
                  [["bump.bottom",e],"goUp",self]);
      }
      return sigs.forEach(a=>Mojo.on(...a)), self;
    }

    /**Define mixin `camera`. */
    Mojo.defMixin("camera2d", function(e,worldWidth,worldHeight,canvas){
      const _height= canvas?canvas.height:worldHeight;
      const _width= canvas?canvas.width:worldWidth;
      const height2=MFL(_height/2);
      const width2=MFL(_width/2);
      const height4=MFL(_height/4);
      const width4=MFL(_width/4);
      const {Sprites}=Mojo;
      const sigs=[];
      const world=e;
      let _x=0;
      let _y=0;
      const self={
        dispose(){ sigs.forEach(s=>Mojo.off(...s)) },
        //changing the camera's xy pos shifts
        //pos of the world in the opposite direction
        set x(v){ _x=v; e.x= -_x },
        set y(v){ _y=v; e.y= -_y },
        get x(){ return _x },
        get y(){ return _y },
        worldWidth: worldWidth,
        worldHeight: worldHeight,
        width: _width,
        height: _height,
        follow(s){
          //Check the sprites position in relation to the viewport.
          //Move the camera to follow the sprite if the sprite
          //strays outside the viewport
          const bx= _.feq0(s.angle)? Sprites.getBBox(s)
                                   : Sprites.boundingBox(s);
          const _right=()=>{
            if(bx.x2> this.x+MFL(width2+width4)){
              this.x = bx.x2-width4*3;
            }},
            _left=()=>{
              if(bx.x1< this.x+MFL(width2-width4)){
              this.x = bx.x1-width4;
            }},
            _top=()=>{
            if(bx.y1< this.y+MFL(height2-height4)){
              this.y = bx.y1-height4;
            }},
            _bottom=()=>{
            if(bx.y2> this.y+MFL(height2+height4)){
              this.y = bx.y2- height4*3;
            }};
          _left();  _right();  _top();  _bottom();
          //clamp the camera
          if(this.x<0){ this.x = 0 }
          if(this.y<0){ this.y = 0 }
          if(this.x+_width > worldWidth){
            this.x= worldWidth - _width
          }
          if(this.y+_height > worldHeight){
            this.y= worldHeight - _height
          }
          //contain the object
          let {x1,x2,y1,y2}=s.m5.getImageOffsets();
          let n= bx.x2 - x2;
          if(n>worldWidth){ s.x -= (n-worldWidth) }
          n=bx.y2 - y2;
          if(n>worldHeight){ s.y -= (n-worldHeight) }
          n=bx.x1 + x1;
          if(n<0) { s.x += -n }
          n=bx.y1  + y1;
          if(n<0) { s.y += -n }
        },
        centerOver:function(s,y){
          if(arguments.length===1 && !is.num(s)){
            let c=Sprites.centerXY(s)
            this.x = c[0]- width2;
            this.y = c[1] - height2;
          }else{
            if(is.num(s)) this.x=s - width2;
            if(is.num(y)) this.y=y - height2;
          }
        }
      };
      sigs.push([["post.remove",e],"dispose",self]);
      return (sigs.forEach(e=>Mojo.on(...e)), self);
    });

    const _$={
      Patrol,
      Platformer,
      MazeRunner,
      PeriodicDischarge
    };

    return (Mojo["2d"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only"
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

  /**Create the module. */
  function _module(Mojo, TweensQueue, DustBin){
    const _M=gscope["io/czlab/mcfud/math"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is}=Mojo;
    const MFL=Math.floor,
          P5=Math.PI*5,
          PI_2= Math.PI/2,
          TWO_PI= Math.PI*2;

    /**
     * @module mojoh5/FX
     */

    function Tween(s,t,frames=60,loop=false,ext={}){
      return _.inject({
        sprite:s,
        easing:t,
        on:false,
        curf:0,
        loop:loop,
        frames:frames,
        onFrame(end,alpha){},
        _run(){
          this.on=true;
          this.curf=0;
          TweensQueue.push(this);
        },
        onTick(){
          if(this.on){
            if(this.curf<this.frames){
              this.onFrame(false,
                           this.easing(this.curf/this.frames));
              this.curf += 1;
            }else{
              this.onFrame(true);
              if(this.loop){
                if(is.num(this.loop)){
                  --this.loop
                }
                this.onLoopReset()
                this.curf=0;
              }else{
                this.on=false;
                this.onComplete &&
                  _.delay(0,()=> this.onComplete());
                this.dispose();
              }
            }
          }
        },
        dispose(){
          _.disj(TweensQueue,this);
          Mojo.emit(["tween.disposed"],this);
        }
      },ext)
    }

    /** scale */
    function TweenScale(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:null;
          this._y=is.num(ey)?[sy,ey]:null;
          this._run();
        },
        onLoopReset(){
          if(this._x){
            let [a,b]=this._x;
            this._x[0]=b;
            this._x[1]=a;
          }
          if(this._y){
            let [a,b]=this._y;
            this._y[0]=b;
            this._y[1]=a;
          }
        },
        onFrame(end,dt){
          if(this._x)
            this.sprite.scale.x= end ? this._x[1]
                                     : _M.lerp(this._x[0], this._x[1], dt);
          if(this._y)
            this.sprite.scale.y= end ? this._y[1]
                                     : _M.lerp(this._y[0], this._y[1], dt);
        }
      })
    }

    /** alpha */
    function TweenAlpha(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          let [a,b]=this._a;
          this._a[0]=b;
          this._a[1]=a;
        },
        onFrame(end,alpha){
          this.sprite.alpha= end ? this._a[1]
                                 : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    /** position */
    function TweenXY(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:null;
          this._y=is.num(ey)?[sy,ey]:null;
          this._run();
        },
        onLoopReset(){
          if(this._x){
            let [a,b]=this._x;
            this._x[0]=b;
            this._x[1]=a;
          }
          if(this._y){
            let [a,b]=this._y;
            this._y[0]=b;
            this._y[1]=a;
          }
        },
        onFrame(end,dt){
          if(this._x)
            this.sprite.x= end ? this._x[1]
                               : _M.lerp(this._x[0], this._x[1], dt);
          if(this._y)
            this.sprite.y= end ? this._y[1]
                               : _M.lerp(this._y[0], this._y[1], dt);
        }
      })
    }

    /** sequence */
    function BatchTweens(...ts){
      const t= {
        children:ts.slice(),
        onTweenEnd(t){
          for(let c,i=0;i<this.children.length;++i){
            c=this.children[i];
            if(c===t){
              this.children.splice(i,1);
              break;
            }
          }
          if(this.children.length===0){
            this.onComplete &&
              _.delay(0,()=>this.onComplete());
            this.dispose();
          }
        },
        size(){
          return this.children.length },
        dispose(){
          Mojo.off(["tween.disposed"],"onTweenEnd",this);
          this.children.forEach(c=>c.dispose());
          this.children.length=0;
        }
      };

      Mojo.on(["tween.disposed"],"onTweenEnd",t);
      return t;
    }

    const _$={
      /**Easing function: exponential-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  EXPO_IN(x){ return x===0 ? 0 : Math.pow(1024, x-1) },
      /**Easing function: exponential-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  EXPO_OUT(x){ return x===1 ? 1 : 1-Math.pow(2, -10*x) },
      /**Easing function: exponential-in-out.
       * @memberof module:mojoh5/FX
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
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
	    LINEAR(x){ return x },
      /**Easing function: smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH(x){ return 3*x*x - 2*x*x*x },
      /**Easing function: quadratic-smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH_QUAD(x){let n= _$.SMOOTH(x); return n*n},
      /**Easing function: cubic-smooth.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SMOOTH_CUBIC(x){let n= _$.SMOOTH(x); return n*n*n},
      /**Easing function: cubic-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_CUBIC(x){ return x*x*x },
      /**Easing function: cubic-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_CUBIC(x){ let n=1-x; return 1 - n*n*n },
      /**Easing function: cubic-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_CUBIC(x){
        if(x < 0.5){ return 4*x*x*x }else{
          let n= -2*x+2; return 1- n*n*n/2
        }
      },
      /**Easing function: quadratic-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_QUAD(x){ return x*x },
      /**Easing function: quadratic-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_QUAD(x){ return 1 - (1-x) * (1-x) },
      /**Easing function: quadratic-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_QUAD(x){
        if(x < 0.5){ return 2*x*x }else{
          let n= -2*x+2; return 1 - n*n/2
        }
      },
      /**Easing function: sinusoidal-ease-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_IN_SINE(x){ return 1 - Math.cos(x * PI_2) },
      /**Easing function: sinusoidal-ease-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_OUT_SINE(x){ return Math.sin(x * PI_2) },
      /**Easing function: sinusoidal-ease-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EASE_INOUT_SINE(x){ return 0.5 - Math.cos(x * Math.PI)/2 },
      /**Easing function: spline.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      SPLINE(t, a, b, c, d){
        return (2*b + (c-a)*t +
               (2*a - 5*b + 4*c - d)*t*t +
               (-a + 3*b - 3*c + d)*t*t*t) / 2
      },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
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
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_IN(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5)
		  },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_OUT(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : 1+ Math.pow(2, -10*x) * Math.sin((x-0.1)*P5)
		  },
      /**Easing function: elastic-in-out.
       * @memberof module:mojoh5/FX
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
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      BOUNCE_IN(x){ return 1 - _$.BOUNCE_OUT(1 - x) },
      /**Easing function: bounce-out.
       * @memberof module:mojoh5/FX
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
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  BOUNCE_INOUT(x){
			  return x < 0.5 ? _$.BOUNCE_IN(x*2) * 0.5
                       : _$.BOUNCE_OUT(x*2 - 1) * 0.5 + 0.5
		  },
      /**Create a tween operating on sprite's alpha value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAlpha}
       */
      tweenAlpha(s,type,endA,frames=60,loop=false){
        const t= TweenAlpha(s,type,frames,loop);
        let sa=s.alpha;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0]; ea=endA[1]}
        t.start(sa,ea);
        return t;
      },
      /**Create a tween operating on sprite's scale value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {null|number|number[]} endX
       * @param {null|number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      tweenScale(s,type,endX,endY,frames=60,loop=false){
        const t= TweenScale(s,type,frames,loop);
        let sx=s.scale.x;
        let sy=s.scale.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0]; ex=endX[1] }
        if(is.vec(endY)){
          sy=endY[0]; ey=endY[1]}
        if(!is.num(ex)){ sx=ex=null }
        if(!is.num(ey)){ sy=ey=null }
        t.start(sx,ex,sy,ey);
        return t;
      },
      /**Create a tween operating on sprite's position.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenXY}
       */
      tweenXY(s,type,endX,endY,frames=60,loop=false){
        const t= TweenXY(s,type,frames,loop);
        let sx=s.x;
        let sy=s.y;
        let ex=endX;
        let ey=endY;
        if(is.vec(endX)){
          sx=endX[0]; ex=endX[1]}
        if(is.vec(endY)){
          sy=endY[0]; ey=endY[1]}
        if(!is.num(ex)){sx=ex=null}
        if(!is.num(ey)){sy=ey=null}
        t.start(sx,ex,sy,ey);
        return t;
      },
      /**Slowly fade out this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeOut(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,0,frames) },
      /**Slowly fade in this object.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} frames
       * @return {}
       */
      fadeIn(s, frames=60){
        return this.tweenAlpha(s,this.EASE_OUT_SINE,1,frames) },
      /**Fades the sprite in and out at a steady rate.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number} min
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAlpha}
       */
      pulse(s, min=0,frames=60,loop=true){
        return this.tweenAlpha(s,this.SMOOTH,min,frames,loop) },
      /**Slide this sprite into view.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} frames
       * @return {TweenXY}
       */
      slide(s, type, endX, endY, frames=60){
        return this.tweenXY(s,type,endX,endY,frames) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      breathe(s, endX=0.8, endY=0.8, frames=60,loop=true){
        return this.tweenScale(s, this.SMOOTH_QUAD,endX,endY,frames,loop) },
      /**Scale this sprite.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {number|number[]} endX
       * @param {number|number[]} endY
       * @param {number} [frames]
       * @return {TweenScale}
       */
      scale(s, endX=0.5, endY=0.5, frames=60){
        return this.tweenScale(s,this.SMOOTH,endX,endY,frames) },
      /**Flashes this sprite.
       * @memberof module:mojoh5/affects
       * @param {Sprite} s
       * @param {number|number[]} scale
       * @param {number} start
       * @param {number} end
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenScale}
       */
      strobe(s, scale=1.3, start=10, end=20, frames=10,loop=true){
        return this.tweenScale(s,
                               (v)=> this.SPLINE(v,start,0,1,end), scale,scale,frames,loop) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {object} bounds {x1,x2,y1,y2}
       * @param {number} ex
       * @param {number} ey
       * @param {number} frames
       * @param {boolean} [loop]
       * @return {BatchTweens}
       */
      wobble(s, bounds, ex=1.2, ey=1.2, frames=10, loop=true){
        let {x1,x2,y1,y2}= bounds;
        let tx=this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,
                                                  _.or(x2,10)), ex, null, frames,loop);
        let ty=this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,
                                                  _.or(y2,-10)), null,ey, frames,loop);
        return BatchTweens(tx,ty);
      },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      followCurve(s, type, points, frames=60){
        let t= TweenXY(s,type,frames);
        let self=this;
        t.start=function(points){
          this._p = points;
          this._run();
        };
        t.onFrame=function(end,alpha){
          let p = this._p;
          if(!end)
            _V.set(s, self.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                      self.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1]))
        };
        t.start(points);
        return t;
      },
      /**Make object walk in a path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      walkPath(s, type, points, frames=300){
        let _calcPath=(cur,frames)=>{
          let t= this.tweenXY(s,type,[points[cur][0], points[cur+1][0]],
                                     [points[cur][1], points[cur+1][1]],frames);
          t.onComplete=()=>{
            if(++cur < points.length-1)
              _.delay(0,()=> _calcPath(cur,frames))
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length));
      },
      /**Make object appear to walk in a curved path.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {Vec2[]} points
       * @param {number} frames
       * @return {TweenXY}
       */
      walkCurve(s, type, points, frames=300){
        let _calcPath=(cur,frames)=>{
          let t=this.followCurve(s, type,
                                 points[cur], frames);
          t.onComplete=()=>{
            if(++cur < points.length)
              _.delay(0,()=> _calcPath(cur,frames))
          };
          return t;
        }
        return _calcPath(0, MFL(frames/points.length));
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/FX
       * @param {Tween} t
       */
      remove(t){
        t && t.dispose() },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.onTick(dt));
        _.rseq(DustBin, p=> p.onTick(dt));
      },
      /**Create particles.
       * @memberof module:mojoh5/FX
       * @return {}
       */
      createParticles(x, y, spriteCtor, container, gravity, mins, maxs, random=true, count= 20){
        mins= _.patch(mins,{angle:0, size:4, speed:0.3,
                            scale:0.01, alpha:0.02, rotate:0.01});
        maxs=_.patch(maxs,{angle:6.28, size:16, speed:3,
                           scale:0.05, alpha:0.02, rotate:0.03 });
        _.assert(count>1);
        gravity[0]=0;
        function _make(angle){
          let size = _.randInt2(mins.size, maxs.size);
          let p= spriteCtor();
          DustBin.push(p);
          container.addChild(p);
          if(p.totalFrames)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          Mojo.Sprites.sizeXY(p, size,size);
          _V.set(p,x,y);
          Mojo.Sprites.centerAnchor(p);
          p.m5.scaleSpeed = _.randFloat(mins.scale, maxs.scale);
          p.m5.alphaSpeed = _.randFloat(mins.alpha, maxs.alpha);
          p.m5.angVel = _.randFloat(mins.rotate, maxs.rotate);
          let speed = _.randFloat(mins.speed, maxs.speed);
          _V.set(p.m5.vel, speed * Math.cos(angle),
                           speed * Math.sin(angle));
          //the worker
          p.onTick=function(){
            _V.add$(p.m5.vel,gravity);
            _V.add$(p,p.m5.vel);
            if(p.scale.x - p.m5.scaleSpeed > 0){
              p.scale.x -= p.m5.scaleSpeed;
            }
            if(p.scale.y - p.m5.scaleSpeed > 0){
              p.scale.y -= p.m5.scaleSpeed;
            }
            p.rotation += p.m5.angVel;
            p.alpha -= p.m5.alphaSpeed;
            if(p.alpha <= 0){
              _.disj(DustBin,p);
              Mojo.Sprites.remove(p);
            }
          };
        }
        for(let gap= (maxs.angle-mins.angle)/(count-1),
            a=mins.angle,i=0; i<count; ++i){
          _make(random ? _.randFloat(mins.angle, maxs.angle) : a);
          a += gap;
        }
      },
      /**Shake this sprite.
       * @memberof module:mojoh5/FX
       * @return {}
       */
      shake(s, magnitude=16, angular=false,loop=true){
        let numberOfShakes=10,
            wrapper={},
            self = this,
            counter=1,
            startX = s.x,
            startY = s.y,
            startAngle = s.rotation,
            startMagnitude= magnitude,
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
          }else{
            if(loop){
              magnitude=startMagnitude;
              counter=1;
            }else{
              _.disj(DustBin,wrapper);
            }
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
          }else{
            if(loop){
              magnitude=startMagnitude;
              counter=1;
            }else{
              _.disj(DustBin,wrapper);
            }
          }
        }
        wrapper.onTick=()=>{
          return angular ? _angularShake(wrapper)
                         : _upAndDownShake(wrapper)
        };
        DustBin.push(wrapper);
      }
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only"
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

  /**Create the module. */
  function _module(Mojo){

    const _DIRS = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is}=Mojo;
    const ABS=Math.abs,
          CEIL=Math.ceil,
          MFL=Math.floor;

    /** dummy empty array
     * @private
     * @var {array}
     */
    const _DA=[];

    /**
     * @module mojoh5/Tiles
     */

    /** @ignore */
    function _getIndex3(x, y, world){
      return Mojo.getIndex(x,y,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX) }

    /** @ignore */
    function _getVector(s1,s2){
      return _V.vecAB(Mojo.Sprites.centerXY(s1),
                      Mojo.Sprites.centerXY(s2)) }

    /** @ignore */
    function _getImage(obj){
      const s= obj.image;
      const p= s && s.split("/");
      return p && p.length && p[p.length-1];
    }

    /** @ignore */
    function _findGid(gid,gidMap){
      let idx = -1;
      if(gid>0){
        idx=0;
        while(gidMap[idx+1] &&
              gid >= gidMap[idx+1][0]) ++idx;
      }
      if(idx>=0)
        return gidMap[idx];
    }

    /**Scans all tilesets and record all custom properties into
     * one giant map.
     * @private
     * @function
     */
    function _scanTilesets(tilesets, tsi, gprops){
      let p, gid, lprops, gidList = [];
      tilesets.forEach(ts=>{
        lprops={};
        ts.image=_getImage(ts);
        if(!is.num(ts.spacing)){
          ts.spacing=0 }
        gidList.push([ts.firstgid, ts]);
        ts.tiles.forEach(t=>{
          p=_.inject(_.selectNotKeys(t,"properties"),
                     _parseProps(t));
          p.gid=ts.firstgid + t.id;
          lprops[t.id]=p;
          gprops[p.gid] = p; });
        tsi[ts.name]=lprops;
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0)); }

    /** @ignore */
    function _checkVer(json){
      let tmap = Mojo.resource(json,true).data;
      let tver= tmap && (tmap["tiledversion"] || tmap["version"]);
      return (tver &&
              _.cmpVerStrs(tver,"1.4.2") >= 0) ? tmap
                                               : _.assert(false,`${json} needs update`)
    }

    /** @ignore */
    function _parseProps(el){
      return (el.properties||_DA).reduce((acc,p)=> {
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    /** @ignore */
    function _loadTMX(scene,arg,objFactory){
      let tmx= is.str(arg)?_checkVer(arg):arg;
      let tsProps={}, gtileProps={};
      _.assert(is.obj(tmx),"bad tiled map");
      _.inject(scene.tiled,{tileW:tmx.tilewidth,
                            tileH:tmx.tileheight,
                            tilesInX:tmx.width,
                            tilesInY:tmx.height,
                            tiledMap:tmx,
                            saved_tileW:tmx.tilewidth,
                            saved_tileH:tmx.tileheight,
                            tiledWidth:tmx.tilewidth*tmx.width,
                            tiledHeight:tmx.tileheight*tmx.height}, _parseProps(tmx));
      let K=scene.getScaleFactor();
      let NW= MFL(K*tmx.tilewidth);
      let NH= MFL(K*tmx.tileheight);
      if(!_.isEven(NW)) {--NW}
      if(!_.isEven(NH)) {--NH}
      scene.tiled.new_tileW=NW;
      scene.tiled.new_tileH=NH;
      function XXX(gid,mapcol,maprow,tw,th,cz){
        let tsi=_findGid(gid,scene.tiled.tileGidList)[1],
            cFunc,
            cols=tsi.columns,
            ps=gtileProps[gid],
            _id=gid - tsi.firstgid;
        cz= _.nor(cz, (ps && ps["Class"]));
        cFunc=cz && objFactory[cz];
        _.assertNot(_id<0, `Bad tile id: ${_id}`);
        if(!is.num(cols))
          cols=MFL(tsi.imagewidth / (tsi.tilewidth+tsi.spacing));
        let tscol = _id % cols,
            tsrow = MFL(_id/cols),
            tsX = tscol * tsi.tilewidth,
            tsY = tsrow * tsi.tileheight;
        if(tsi.spacing>0){
          tsX += tsi.spacing * tscol;
          tsY += tsi.spacing * tsrow;
        }
        let s= cFunc&&cFunc.s() || Mojo.Sprites.frame(tsi.image,
                                                      tw||tsi.tilewidth,
                                                      th||tsi.tileheight,tsX,tsY);
        s.tiled={gid: gid, id: _id};
        if(tw===scene.tiled.saved_tileW){
          s.width=NW;
        }else{
          s.scale.x=K;
          s.width = MFL(s.width);
          if(!_.isEven(s.width))--s.width;
        }
        if(th===scene.tiled.saved_tileH){
          s.height=NH;
        }else{
          s.scale.y=K;
          s.height = MFL(s.height);
          if(!_.isEven(s.height))--s.height;
        }
        s.x=mapcol*NW;
        s.y=maprow*NH;
        return s;
      }
      const F={
        tilelayer(tl){
          if(is.vec(tl.data[0])){
            if(_.nichts(tl.width))
              tl.width=tl.data[0].length;
            if(_.nichts(tl.height))
              tl.height=tl.data.length;
            tl.data=tl.data.flat();
          }
          if(tl.visible === false){ return }
          if(!tl.width) tl.width=scene.tiled.tilesInX;
          if(!tl.height) tl.height=scene.tiled.tilesInY;
          let tlprops=_parseProps(tl);
          for(let s,gid,i=0;i<tl.data.length;++i){
            if((gid=tl.data[i])===0){ continue }
            if(tl.collision===false ||
               tlprops.collision === false){}else{
              tl.collision=true;
              if(gid>0)
                scene.tiled.collision[i]=gid;
            }
            let mapcol = i % tl.width,
                maprow = MFL(i/tl.width),
                tw=tlprops.width,
                th=tlprops.height,
                s=_ctorTile(scene,gid,mapcol,maprow,tw,th);
            let tsi=_findGid(gid,scene.tiled.tileGidList)[1],
                ps=gtileProps[gid],
                cz=ps && ps["Class"],
                cFunc=cz && objFactory[cz];
            s.tiled.index=i;
            s.m5.static=true;
            //special tile
            if(cFunc)
              s=cFunc.c(scene,s,tsi,ps);
            if(s && ps){
              if(ps.sensor) s.m5.sensor=true;
            }
            scene.insert(s,!!cFunc);
          }
          //_.inject(tl,tlprops);
        },
        objectgroup(tl){
          tl.objects.forEach(o=> {
            _.assert(is.num(o.x),"wanted xy position");
            let s,ps,gid=_.or(o.gid,-1);
            let os=_parseProps(o);
            if(gid>0)ps=gtileProps[gid];
            _.inject(o,os);
            let cz= _.nor(ps && ps["Class"],o["Class"]);
            let createFunc= cz && objFactory[cz];
            let w=scene.tiled.saved_tileW;
            let h=scene.tiled.saved_tileH;
            let tx=MFL((o.x+w/2)/w);
            let ty=MFL((o.y-h/2)/h);
            let tsi=_findGid(gid,scene.tiled.tileGidList);
            if(tsi)tsi=tsi[1];
            o.column=tx;
            o.row=ty;
            if(gid>0){
              s= _ctorTile(scene,gid,tx,ty,o.width,o.height,cz)
            }else{
              s={width:NW,height:NH}
            }
            if(createFunc){
              s= createFunc.c(scene,s,tsi,ps,o);
            }
            if(s){
              if(ps && ps.sensor) s.m5.sensor=true;
              scene.insert(s,true);
            }
          });
        },
        imagelayer(tl){ tl.image=_getImage(tl) }
      };
      objFactory=_.or(objFactory,{});
      _.inject(scene.tiled, {tileProps: gtileProps,
                             tileSets: tsProps,
                             objFactory,
                             collision: _.fill(tmx.width*tmx.height,0),
                             imagelayer:[],objectgroup:[],tilelayer:[],
                             tileGidList: _scanTilesets(tmx.tilesets,tsProps,gtileProps)});
      ["imagelayer","tilelayer","objectgroup"].forEach(s=>{
        tmx.layers.filter(y=>y.type==s).forEach(y=>{
          F[s](y);
          scene.tiled[s].push(y);
        });
      });
      //reset due to possible scaling
      scene.tiled.tileW=NW;
      scene.tiled.tileH=NH;
      scene.tiled.tiledWidth=NW * tmx.width;
      scene.tiled.tiledHeight=NH * tmx.height;
      if(scene.parent instanceof Mojo.Scenes.SceneWrapper){
        if(scene.tiled.tiledHeight<Mojo.height){
          scene.parent.y = MFL((Mojo.height-scene.tiled.tiledHeight)/2)
        }
        if(scene.tiled.tiledWidth<Mojo.width){
          scene.parent.x = MFL((Mojo.width-scene.tiled.tiledWidth)/2)
        }
      }
    }

    function _ctorTile(scene,gid,mapcol,maprow,tw,th,cz){
      let tsi=_findGid(gid,scene.tiled.tileGidList)[1],
          K=scene.getScaleFactor(),
          cFunc,
          cols=tsi.columns,
          ps=scene.tiled.tileProps[gid],
          _id=gid - tsi.firstgid;
      cz= _.nor(cz, (ps && ps["Class"]));
      cFunc=cz && scene.tiled.objFactory[cz];
      _.assertNot(_id<0, `Bad tile id: ${_id}`);
      if(!is.num(cols))
        cols=MFL(tsi.imagewidth / (tsi.tilewidth+tsi.spacing));
      let tscol = _id % cols,
          tsrow = MFL(_id/cols),
          tsX = tscol * tsi.tilewidth,
          tsY = tsrow * tsi.tileheight;
      if(tsi.spacing>0){
        tsX += tsi.spacing * tscol;
        tsY += tsi.spacing * tsrow;
      }
      let s= cFunc&&cFunc.s() || Mojo.Sprites.frame(tsi.image,
                                                    tw||tsi.tilewidth,
                                                    th||tsi.tileheight,tsX,tsY);
      s.tiled={gid: gid, id: _id};
      if(tw===scene.tiled.saved_tileW){
        s.width= scene.tiled.new_tileW
      }else{
        s.scale.x=K;
        s.width = MFL(s.width);
        if(!_.isEven(s.width))--s.width;
      }
      if(th===scene.tiled.saved_tileH){
        s.height= scene.tiled.new_tileH
      }else{
        s.scale.y=K;
        s.height = MFL(s.height);
        if(!_.isEven(s.height))--s.height;
      }
      s.x=mapcol* scene.tiled.new_tileW;
      s.y=maprow* scene.tiled.new_tileH;
      return s;
    }

    const _contactObj = {width: 0,
                         height: 0,
                         parent:null,
                         x:0, y:0,
                         rotation:0,
                         tiled:{},
                         anchor: {x:0,y:0},
                         getGlobalPosition(){
                           return{
                             x:this.x+this.parent.x,
                             y:this.y+this.parent.y}
                         }};
    /**
     * @memberof module:mojoh5/Tiles
     * @class
     */
    class TiledScene extends Mojo.Scenes.Scene{
      /**
       * @param {any} id
       * @param {function|object} func
       * @param {object} [options]
       */
      constructor(id,func,options){
        super(id,func,options);
        this.tiled={};
        _contactObj.parent=this;
        Mojo.Sprites.extend(_contactObj);
      }
      reloadMap(options){
        let t= this.m5.options.tiled=options;
        this.tiled={};
        _loadTMX(this, t.name, t.factory);
      }
      runOnce(){
        let t= this.m5.options.tiled;
        _loadTMX(this, t.name, t.factory);
        super.runOnce();
      }
      removeTile(s){
        let x= s.x, y=s.y;
        if(s.anchor.x < 0.3){
          x= s.x+MFL(s.width/2);
          y= s.y+MFL(s.height/2);
        }
        let tx= MFL(x/this.tiled.tileW);
        let ty= MFL(y/this.tiled.tileH);
        let pos= ty*this.tiled.tilesInX + tx;
        let len = this.tiled.collision.length;
        _.assert(pos>=0&&pos<len,"bad index to remove");
        this.tiled.collision[pos]=0;
        Mojo.Sprites.remove(s);
      }
      /**Get a tile layer.
       * @param {object} world
       * @param {string} name
       * @param {boolean} [panic] if none found, throws error
       * @return {Container}
       */
      getTileLayer(name,panic){
        let found= _.some(this.tiled.tilelayer, o=>{
          if(o.name==name) return o;
        });
        if(!found && panic)
          throw `There is no layer with name: ${name}`;
        return found;
      }
      /**Get a object group.
       * @param {object} world
       * @param {string} name
       * @param {boolean} [panic] if none found, throws error
       * @return {Container}
       */
      getObjectGroup(name,panic){
        let found= _.some(this.tiled.objectgroup, o=>{
          if(o.name==name) return o;
        });
        if(!found && panic)
          throw `There is no group with name: ${name}`;
        return found;
      }
      setTile(layer,row,col,gid){
        let i=this.tiled.tilesInX * row + col;
        let y=this.getTileLayer(layer);
        let ts=this.getTSInfo(gid);
        let id= gid-ts.firstgid;
        if(y.collision)
          this.tiled.collision[i]=gid;
        let s=_ctorTile(this,gid,col,row,ts.tilewidth,ts.tileheight);
        return s;
      }
      getTile(s){
        let x=s.x,y=s.y;
        if(s.anchor.x<0.3){
          y += MFL(s.height/2);
          x += MFL(s.width/2);
        }
        return this.getTileXY(x,y);
      }
      getTileXY(x,y){
        let tx= MFL(x/this.tiled.tileW);
        let ty= MFL(y/this.tiled.tileH);
        _.assert(tx>=0 && tx<this.tiled.tilesInX, `bad tile col:${tx}`);
        _.assert(ty>=0 && ty<this.tiled.tilesInY, `bad tile row:${ty}`);
        return [tx,ty];
      }
      /**Get item with this name.
       * @param {string} name
       * @return {any}
       */
      getNamedItem(name){
        let out=[];
        this.tiled.objectgroup.forEach(c=>{
          c.objects.forEach(o=>{
            if(name==_.get(o,"name")) out.push(c)
          });
        });
        return out;
      }
      /**Get scale factor for this world.
       * @return {number}
       */
      getScaleFactor(){
        let x,y,r=1;
        if(Mojo.u.scaleToWindow == "max"){
          if(Mojo.width>Mojo.height){
            y=Mojo.height/(this.tiled.saved_tileH*this.tiled.tilesInY);
            r=y;
          }else{
            x=Mojo.width/(this.tiled.saved_tileW*this.tiled.tilesInX)
            r=x;
          }
        }
        return r;
      }
      /**Cross reference a point's position to a tile index.
       * @param {Sprite} s
       * @return {number} the tile position
       */
      getTileIndex(s){
        let [x,y]= Mojo.Sprites.centerXY(s);
        return _getIndex3(x,y,this);
      }
      /**Get tileset information.
       * @param {number} gid
       * @return {object}
       */
      getTSInfo(gid){
        return _findGid(gid,this.tiled.tileGidList)[1]
      }
      getTileProps(gid){
        return this.tiled.tileProps[gid]
      }
      _getContactObj(gid, tX, tY){
        let c= _contactObj;
        c.height=this.tiled.tileH;
        c.width=this.tiled.tileW;
        c.x = tX * c.width;
        c.y = tY * c.height;
        c.tiled.gid=gid;
        c.tiled.row=tY;
        c.tiled.col=tX;
        c.m5.sensor=false;
        return c;
      }
      collideXY(obj){
        let _S=Mojo.Sprites,
            tw=this.tiled.tileW,
            th=this.tiled.tileH,
            tiles=this.tiled.collision,
            box=_.feq0(obj.rotation)?_S.getBBox(obj):_S.boundingBox(obj);
        let sX = Math.max(0,MFL(box.x1 / tw));
        let sY = Math.max(0,MFL(box.y1 / th));
        let eX =  Math.min(this.tiled.tilesInX-1,CEIL(box.x2 / tw));
        let eY =  Math.min(this.tiled.tilesInY-1,CEIL(box.y2 / th));
        for(let ps,c,gid,pos,B,tY = sY; tY<=eY; ++tY){
          for(let tX = sX; tX<=eX; ++tX){
            pos=tY*this.tiled.tilesInX+tX;
            gid=tiles[pos];
            if(!is.num(gid)){
              _.assert(is.num(gid),"bad gid");
            }
            if(gid===0){continue}
            B=this._getContactObj(gid,tX, tY);
            ps=this.getTileProps(gid);
            if(ps){
              B.m5.sensor= !!ps.sensor;
            }
            if(Mojo["Sprites"].hit(obj,B)){
              if(B.m5.sensor)
                Mojo.emit(["tile.sensor",obj],B);
            }
          }
        }
        return super.collideXY(obj);
      }
    }

    class Grid2D{
      constructor(g){
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
        this._grid=g;
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
      TiledScene,
      /**Calculate position of each individual cells in the grid,
       * so that we can detect when a user clicks on the cell.
       * @memberof module:mojoh5/Tiles
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
      /**Get the indices of the neighbor cells.
       * @memberof module:mojoh5/Tiles
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
      /**Takes a map array and adds a sprite's grid index number (`gid`) to it.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} gidList
       * @param {Sprite[]} sprites
       * @param {object} world
       * @return {number[]}
       */
      updateMap(gidList, sprites, world){
        let ret = _.fill(gidList.length,0);
        let _mapper=(s)=>{
          let pos= this.getTileIndex(s,world);
          _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
          s.tiled.index = pos;
          ret[pos] = s.tiled.gid;
        };
        !is.vec(sprites) ? _mapper(sprites)
                         : sprites.forEach(_mapper);
        return ret;
      },
      /**A-Star search.
       * @memberof module:mojoh5/Tiles
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
        let _testNodes=(i)=>{
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
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      crossCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w, index - 1, index + 1, index + w]
      },
      /**Get orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getCrossTiles(index, tiles, world){
        return this.crossCells(index,world).map(c => tiles[c])
      },
      /**Get the indices of corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {number|object} world
       * @return {number[]}
       */
      getDiagonalCells(index, world){
        const w= is.num(world)?world:world.tiled.tilesInX;
        return [index - w - 1, index - w + 1, index + w - 1, index + w + 1]
      },
      /**Get the corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getDiagonalTiles(index, tiles, world){
        return this.getDiagonalCells(index,world).map(c => tiles[c])
      },
      /**Get all the valid directions to move for this sprite.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} sprite
       * @param {any[]} tiles
       * @param {number} validGid
       * @param {object} world
       * @return {any[]}
       */
      validDirections(sprite, tiles, validGid, world){
        const pos = this.getTileIndex(sprite, world);
        return this.getCrossTiles(pos, tiles, world).map((gid, i)=>{
          return gid === validGid ? _DIRS[i] : Mojo.NONE
        }).filter(d => d !== Mojo.NONE)
      },
      /**Check if these directions are valid.
       * @memberof module:mojoh5/Tiles
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
       * @memberof module:mojoh5/Tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length===0 ? Mojo.TRAPPED
                               : (dirs.length===1 ? dirs[0]
                                                  : dirs[_.randInt2(0, dirs.length-1)])
      },
      /**Find the best direction from s1 to s2.
       * @memberof module:mojoh5/Tiles
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
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Tiles"]=function(M){
      return M.Tiles ? M.Tiles : _module(M)
    }
  }

})(this);


