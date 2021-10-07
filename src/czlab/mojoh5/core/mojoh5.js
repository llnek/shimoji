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
    const _M = gscope["io/czlab/mcfud/math"]();
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
          this.fg=Sprites.rect(cx, RH, fgColor);
          this.bg=Sprites.rect(cx, RH, bgColor);
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
          if(!error)
            Mojo.u.start(Mojo);
          else
            _.error("Cannot load game!"); }); }
      function _m1(b){
        --fcnt===0 && _finz() }
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
    const _CT="body, * {padding: 0; margin: 0; height:100%; overflow:hidden}";
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
      //p["image-rendering"]="crisp-edges";
      //p["image-rendering"]="pixelated";
      if(arg.rendering !== false){
        p["image-rendering"]= arg.rendering
      }
      dom.css(Mojo.canvas,p);
      dom.attrs(Mojo.canvas,"tabindex","0");
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
      Mojo.ctx= PIXI.autoDetectRenderer(_.inject(box,{
        antialias: true
      }));
      Mojo.ctx.bgColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.maxed=maxed;
      Mojo.scale=1;
      Mojo.frame=1/cmdArg.fps;
      Mojo.scaledBgColor= "#323232";

      //install modules
      ["Sprites","Input","Scenes",
       "Sound","FX","2d","Tiles","Touch"].forEach(s=>{
         CON.log(`installing module ${s}...`);
         let m=gscope[`io/czlab/mojoh5/${s}`](Mojo);
         if(m.assets)
           m.assets.forEach(a=> Mojo.u.assetFiles.unshift(a))
      });

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

      if(Mojo.touchDevice) {
        Mojo.scroll()
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
      Mojo._curFPS=Mojo.calcFPS(dt);
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @abstract */
    class Mediator{
      constructor(){
        this.players=[];
        this.state=null;
        this.pcur;
        this.end;
        this.pwin;
        this._pcnt=0;
      }
      cur(){
        return this.pcur }
      add(p){
        p.pnum=++this._pcnt;
        p.owner=this;
        this.players.push(p);
        return this;
      }
      winner(){
        return this.pwin }
      isGameOver(){
        return this.end }
      gameState(x){
        if(x)
          this.state=x;
        return this.state;
      }
      gameOver(win){
        Mojo.Input.resume();
        this.pwin=win;
        return this.end=true;
      }
      start(who){
        _.assert(who,"bad player to start with");
        this.end=false;
        this.pcur=who;
        this._turn();
      }
      other(){
        if(this.pcur===this.players[0]) return this.players[1];
        if(this.pcur===this.players[1]) return this.players[0];
      }
      _turn(){
        this.players.forEach(p=>{
          if(p !== this.pcur) p.pokeWait()
        });
        this.pcur.pokeMove();
      }
      redoTurn(){
        this.pcur.pokeMove() }
      postMove(from,move){
        _.assert(false,"implement postMove!") }
      updateState(from,move){
        _.assert(false,"implement updateState!") }
      updateSound(actor){ }
      updateMove(from,move){
        if(!this.end){
          this.updateState(from,move);
          this.updateSound(from);
          _.delay(0,()=>this.postMove(from,move));
        }
      }
      takeTurn(){
        if(!this.end){
          if(this.pcur===this.players[0]) this.pcur=this.players[1];
          else if(this.pcur===this.players[1]) this.pcur=this.players[0];
          this._turn();
        }
      }
    }

    /** @abstract */
    class Player{
      constructor(uid){
        this.uid=uid;
      }
      playSound(){}
      uuid(){ return this.uid }
      pokeMove(){
        //console.log(`player ${this.uid}: poked`);
        this.onPoke();
      }
      pokeWait(){
        //console.log(`player ${this.uid}: wait`);
        this.onWait();
      }
      stateValue(){
        _.assert(false,"implement stateValue!") }
    }

    /** @abstract */
    class Local extends Player{
      constructor(uid="p1"){
        super(uid)
      }
      onPoke(){
        //wait for user click
        Mojo.Input.resume();
      }
      onWait(){
        //stop all ui actions
        Mojo.Input.pause();
      }
    }

    /** @abstract */
    class Bot extends Player{
      constructor(uid="p2"){
        super(uid)
      }
      onPoke(){
        //run ai code
      }
      onWait(){
        //do nothing
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Mojo={
      Bot,
      Local,
      Mediator,
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
      NW: 10,
      /**Enum (11)
       * @memberof module:mojoh5/Mojo */
      NE: 11,
      /**Enum (12)
       * @memberof module:mojoh5/Mojo */
      SW: 12,
      /**Enum (13)
       * @memberof module:mojoh5/Mojo */
      SE: 13,
      /**Enum (100)
       * @memberof module:mojoh5/Mojo */
      NONE: 100,
      PI_90:Math.PI/2,
      PI_180:Math.PI,
      PI_270:Math.PI*1.5,
      PI_360:Math.PI*2,
      v2:_V,
      math:_M,
      ute:_,
      is:is,
      dom:dom,
      /**User configuration.
       * @memberof module:mojoh5/Mojo */
      u:cmdArg,
      /**Storage for all game data.
       * @memberof module:mojoh5/Mojo */
      Game:{mode:1},
      MODE_ONE:1,
      MODE_TWO:2,
      MODE_NET:3,
      CON:console,
      noop: ()=>{},
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PXLoader:PIXI.Loader.shared,
      PXObservablePoint: PIXI.ObservablePoint,
      accel(v,a,dt){ return v+a*dt },
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
        return d===Mojo.RIGHT || d===Mojo.NE || d===Mojo.SE },
      /**Check if `d` is on the left hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideLeft(d){
        return d===Mojo.LEFT || d===Mojo.NW || d===Mojo.SW },
      /**Check if `d` is on the top hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideTop(d){
        return d===Mojo.UP || d===Mojo.TOP || d===Mojo.NW || d===Mojo.NE },
      /**Check if `d` is on the bottom hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideBottom(d){
        return d=== Mojo.DOWN || d===Mojo.BOTTOM || d===Mojo.SW || d===Mojo.SE },
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
      scroll(x,y){
        gscope.scrollTo(x||0, y||1) },
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


