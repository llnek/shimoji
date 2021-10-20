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
        if(cmdArg.arena.scale===1){
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
      getScaleFactor(force){
        if(!force && cmdArg.scaleToWindow!="max"){
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

  const BtnColors={
    blue:"#319bd5",
    green:"#78c03f",
    yellow:"#f9ef50",
    red:"#eb2224",
    orange:"#f48917",
    grey:"#848685",
    purple:"#a6499a"
  };
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
      //from pixijs
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
      //fake anchor if none provided
      if(!a)a={x:0,y:0};
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
        }else{
          _reset();
          s.onComplete && s.onComplete();
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

    /** @ignore */
    function _animFromVec(x){
      _.assert(is.vec(x),"bad arg to animFromVec");
      if(is.str(x[0])){
        x=Mojo.tcached(x[0])?x.map(s=> Mojo.tcached(s))
                            :x.map(s=> Mojo.assetPath(s))
      }
      return _.inst(Mojo.PXTexture,x[0])? new Mojo.PXASprite(x)
                                        : Mojo.PXASprite.fromImages(x) }

    /** @ignore */
    function _textureFromImage(x){
      return Mojo.PXTexture.from(Mojo.assetPath(x)) }

    /**Low level sprite creation. */
    function _sprite(src,ctor){
      let s,obj;
      if(_.inst(Mojo.PXGraphics,src)){
        src=_genTexture(src);
      }
      if(_.inst(Mojo.PXTexture,src)){
        obj=src
      }else if(is.vec(src)){
        s=_animFromVec(src)
      }else if(is.str(src)){
        obj= Mojo.tcached(src) ||
             _textureFromImage(src)
      }
      if(obj){s=ctor(obj)}
      return _.assert(s, `SpriteError: ${src} not found`) && s }

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

    /** @ignore */
    function _bounceOff(o1,o2,m){
      if(o2.m5.static){
        //full bounce v=v - (1+c)(v.n_)n_
        _V.sub$(o1.m5.vel,
                _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN)))
      }else{
        let dd=_V.mul$(_V.sub(o2.m5.vel,o1.m5.vel),m.overlapN),
            k= -2 * (dd[0]+dd[1])/(o1.m5.invMass + o2.m5.invMass);
        _V.sub$(o1.m5.vel, _V.mul$(_V.div(m.overlapN,o1.m5.mass),k));
        _V.add$(o2.m5.vel, _V.mul$(_V.div(m.overlapN,o2.m5.mass),k));
      }
    }

    /** @ignore */
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
      SomeColors, BtnColors,
      assets: ["boot/tap-touch.png","boot/unscii.fnt",
               "boot/doki.fnt", "boot/riffic.fnt",
        "boot/kenney_high.fnt",
               "boot/NineteenOhFive.fnt","boot/BIG_SHOUT_BOB.fnt"],
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       */
      assertCenter(s){
        return _.assert(s.anchor && s.anchor.x>0.3 && s.anchor.x<0.7 &&
                                    s.anchor.y>0.3 && s.anchor.y<0.7, "not center'ed") },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){
        return s.children.length === 0 },
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
      /**Change scale factor of sprite by a factor.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      scaleBy(s, sx, sy){
        if(is.num(sx)) s.scale.x *= sx;
        if(is.num(sy)) s.scale.y *= sy;
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
        if(s.anchor) s.anchor.set(0.5,0.5);
        return s;
      },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){
        if(s.anchor) s.anchor.set(0,0);
        return s;
      },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return this.isTopLeft(s)?_V.vec()
                                :_V.vec(-MFL(s.width* (s.anchor?s.anchor.x:0)),
                                        -MFL(s.height*(s.anchor?s.anchor.y:0))) },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return this.isCenter(s)?_V.vec()
                               :_V.vec(MFL(s.width/2) - MFL((s.anchor?s.anchor.x:0)*s.width),
                                       MFL(s.height/2) - MFL((s.anchor?s.anchor.y:0)*s.height)) },
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
            get invMass(){ return _.feq0(s.m5.mass)?0:1/s.m5.mass }
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
          s.getGuid=function(){ return s.m5.uuid };
          s.getSpatial=function(){ return s.m5.sgrid; };
          s.getBBox=function(){
            return _.feq0(s.angle)?self.getBBox(s):self.boundingBox(s) };
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
        const {x,y}= s.getGlobalPosition();
        return _V.vec(x,y);
      },
      /**Check if sprite has anchor at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isTopLeft(s){
        return s.anchor ? (s.anchor.x < 0.3 && s.anchor.y < 0.3): true;
      },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor? (s.anchor.x > 0.3 && s.anchor.x < 0.7 &&
                          s.anchor.y > 0.3 && s.anchor.y < 0.7) : false; },
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
        return _V.angle(this.centerXY(s1), this.centerXY(s2)) },
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
            ax= s.anchor?s.anchor.x:0;
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
            ay= s.anchor?s.anchor.y:0;
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
        return _.assert(r.y1<=r.y2,"bbox bad y values") && r },
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
      /**Frame this box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Sprite}
       */
      bboxFrame(g,width=16,color="#dedede"){
        let ctx= this.graphics();
        let {x1,x2,y1,y2}=g;
        let w=x2-x1;
        let h=y2-y1;
        ctx.lineStyle(width,this.color(color));
        ctx.drawRoundedRect(0,0,w+width,h+width,MFL(width/4));
        let s=this.sprite(ctx);
        s.x=x1-width;
        s.y=y1-width;
        return s;
      },
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
        return {x1:MFL(x[0]+c[0]),
                x2:MFL(x[3]+c[0]),
                y1:MFL(y[0]+c[1]),
                y2:MFL(y[3]+c[1])}
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(px,py,s){
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
        return _V.dist(this.centerXY(s1), this.centerXY(s2)) },
      /**Scale all these sprites by the global scale factor.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} args
       */
      scaleContent(...args){
        if(args.length===1&&is.vec(args[0])){ args=args[0] }
        let f=Mojo.getScaleFactor();
        args.forEach(s=>{ s.scale.x=f; s.scale.y=f; })
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
        s.m5.uuid=id;
        return s;
      },
      /**Set the transparency of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} v
       * @return {Sprite} s
       */
      opacity(s,v){ s.alpha=v; return s },
      /**Set a sprite's color(tint).
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number|string} color
       * @return {Sprite} s
       */
      tint(s,color){ s.tint=color; return s },
      /**Set a sprite's visibility.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {boolean} t
       * @return {Sprite} s
       */
      manifest(s,t=true){ s.visible=t; return s },
      /**Set a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @param {any} v
       * @return {Sprite} s
       */
      pset(s,p,v){
        s.g[p]=v;
        return s;
      },
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
        s=this.extend(s);
        _V.set(s,x,y);
        if(center)
          this.centerAnchor(s);
        return _.inst(Mojo.PXASprite,s) ? _exASprite(s) : s; },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      tilingSprite(src, center=false,x=0,y=0){
        let s= _sprite(src,o=> new Mojo.PXTSprite(o,o.width,o.height));
        s=this.extend(s);
        if(center)
          this.centerAnchor(s);
        return _V.set(s,x,y);
      },
      /**Tile sprite repeatingly in x and/or y axis.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {boolean} rx
       * @param {boolean} ry
       * @param {number} width
       * @param {number} height
       * @return {Sprite}
       */
      repeatSprite(src,rx=true,ry=true,width,height){
        let xx= ()=>{
          let s= this.extend(_sprite(src, o=> new Mojo.PXSprite(o)));
          let K=Mojo.getScaleFactor();K=1;
          s.width *= K;
          s.height *= K;
          return s;
        };
        let x=0,y=0,w=0,h=0;
        let s,out=[];
        if(rx){
          while(w<width){
            out.push(s=xx());
            s.x=x;
            s.y=y;
            w += s.width;
            x += s.width;
            if(w>=width && h<height && ry){
              h += s.height;
              y += s.height;
              x=0;
              w=0;
            }
          }
          ry=false;
        }
        if(ry){
          while(h<height){
            out.push(s=xx());
            s.x=x;
            s.y=y;
            h += s.height;
            y += s.height;
            if(h>=height&& w< width && rx){
              w += s.width;
              x += s.width;
              x=y;
              w=h;
            }
          }
          rx=false;
        }
        return out;
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
        return this.sprite(new Mojo.PXTexture(t.baseTexture,new Mojo.PXRect(x, y, width,height)))
      },
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
                                                    new Mojo.PXRect(s[0], s[1], width,height))) },
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
                                        new Mojo.PXRect(x, y, tileW,tileH))) }
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
        return this.sprite(this.frameImages(...pics)) },
      /**Create a PIXI.Text object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fspec
       * @param {number} x
       * @param {number} y
       * @return {Text}
       */
      text(msg,fspec, x=0, y=0){
        return _V.set(this.extend(new Mojo.PXText(msg,fspec)),x,y) },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fstyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(msg,fstyle,x=0,y=0){
        //in pixi, no fontSize, defaults to 26, left-align
        if(fstyle.fill) fstyle.tint=this.color(fstyle.fill);
        if(!fstyle.fontName) fstyle.fontName="unscii";
        if(!fstyle.align) fstyle.align="center";
        return _V.set(this.extend(new Mojo.PXBText(msg,fstyle)),x,y) },
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
      rect(width, height,
           fillStyle = 0xFF3300,
           strokeStyle = 0x0033CC, lineWidth=0, x=0, y=0){
        let a,g=this.graphics(),
            stroke=this.color(strokeStyle);
        if(fillStyle !== false){
          if(is.vec(fillStyle)){
            a=fillStyle[1];
            fillStyle=fillStyle[0];
          }else{
            a=1;
          }
          g.beginFill(this.color(fillStyle),a);
        }
        if(lineWidth>0)
          g.lineStyle(lineWidth, stroke, 1);
        g.drawRect(0, 0, width,height);
        if(fillStyle !== false){
          g.endFill()
        }
        let s= new Mojo.PXSprite(this.genTexture(g));
        s=this.extend(s);
        return _V.set(s,x,y);
      },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        let g = this.graphics();
        cb.apply(this, [g].concat(args));
        return this.extend(new Mojo.PXSprite(this.genTexture(g))) },
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
        let g = this.graphics(),
            stroke= this.color(strokeStyle);
        if(fillStyle !== false)
          g.beginFill(this.color(fillStyle));
        if(lineWidth>0)
          g.lineStyle(lineWidth, stroke, 1);
        g.drawCircle(0, 0, radius);
        if(fillStyle !== false)
          g.endFill();
        let s=new Mojo.PXSprite(this.genTexture(g));
        s=this.extend(s);
        _V.set(s,x,y);
        return (s.m5.circle=true) && this.centerAnchor(s) },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @return {Sprite}
       */
      line(strokeStyle, lineWidth, A,B){
        let g = this.graphics(),
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
        let s=this.extend(g);
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
        return _mkgrid(sx,sy,rows,cols,cellW,cellH) },
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
            h=w;
        if(!_.isEven(w)){--w}
        h=w;
        sz=dim*w;
        let sy=MFL((Mojo.height-sz)/2),
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
      /**Divide a rectangular area.
       * @memberof module:mojoh5/Sprites
       * @param {number[]} [dimX,dimY]
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      divXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=null){
        let szh=MFL(Mojo.height*ratioY),
            szw=MFL(Mojo.width*ratioX),
            cw=MFL(szw/dimX),
            ch=MFL(szh/dimY),
            _x,_y,sy,sx;
        szh=dimY*ch;
        szw=dimX*cw;
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
        return _mkgrid(_x,_y,dimY,dimX,cw,ch);
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
        if(!_.isEven(dim)){dim--}
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
          //shove more info into out :)
          out.x1=sx; out.y1=sy;
          out.x2=sx+szw; out.y2=sy+szh;
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
                x2:sx+e.x2, y1:sy+f.y1, y2:sy+e.y2} },
      /**Create a PIXI Graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} [id]
       * @return {PIXI.Graphics}
       */
      graphics(id=null){
        let ctx= new Mojo.PXGraphics();
        return (ctx.m5={uuid:`${id?id:_.nextId()}`}) && ctx },
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
      drawGridBoxEx(bbox,lineWidth=1,lineColor="white",radius=1,ctx=null){
        if(!ctx)
          ctx= this.graphics();
        ctx.lineStyle(lineWidth,this.color(lineColor));
        ctx.drawRoundedRect(bbox.x1,bbox.y1,
                            bbox.x2-bbox.x1,bbox.y2-bbox.y1,radius);
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
        cs.forEach(c=> c && par.addChild(c));
        return par;
      },
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
      /**Center this object on the screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      centerObj(obj){
        obj.x= Mojo.width/2;
        obj.y=Mojo.height/2;
        if(obj.anchor.x<0.3){
          obj.x -= obj.width/2;
          obj.y -= obj.height/2;
        }else if (obj.anchor<0.7){
        }else{
          _.assert(false, "bad anchor to center");
        }
        return obj;
      },
      /**Expand object to fill entire screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      fillMax(obj){
        if(obj.anchor)
          _.assert(obj.anchor.x<0.3,"wanted top left anchor");
        obj.height=Mojo.height;
        obj.width=Mojo.width;
        obj.x=0;
        obj.y=0;
        return obj;
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
                  c.length>7 ? parseInt(c.substr(7, 2), 16)/255 : 1] }

        if(lc == "transparent"){ return [0,0,0,0] }

        if(lc.indexOf("rgb") === 0){
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a })
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
        return "0x"+ [0,1,2].map(i=> this.byteToHex(rgba[i])).join("") },
      color3(r,g,b){
        return parseInt(["0x",this.byteToHex(r),this.byteToHex(g),this.byteToHex(b)].join("")) },
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
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : (b.anchor.y<0.7 ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : (b.anchor.x<0.7 ? x+w2B : x+(boxB.x2-boxB.x1));
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
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
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
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
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
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
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
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Assign some mass to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} m
       */
      setMass(s,m){ s.m5.mass=m },
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
        let left,right,top,bottom;
        let box,C;
        if(is.vec(container)){
          left=container[1].left;
          right=container[1].right;
          top=container[1].top;
          bottom=container[1].bottom;
          container=container[0];
        }
        right= right!==false;
        left= left!==false;
        top= top!==false;
        bottom= bottom!==false;
        if(container instanceof Mojo.Scenes.Scene){
          C=Mojo.mockStage();
        }else if(container.m5 && container.m5.stage){
          C=container;
        }else if(container.x2 !== undefined &&
                 container.y2 !== undefined){
          C=container;
          box=true;
        }else{
          if(container.isSprite)
            _.assert(s.parent===container);
          else
            _.assert(false,"Error: clamp() using bad container");
          _.assert(_.feq0(container.rotation),"Error: clamp() container can't rotate");
          _.assert(_.feq0(container.anchor.x),"Error: clamp() container anchor.x !==0");
          _.assert(_.feq0(container.anchor.y),"Error: clamp() container anchor.y !==0");
          C=container;
        }
        let coff= box ? [0,0] : this.topLeftOffsetXY(C);
        let collision = new Set();
        let CX=false,CY=false;
        let R= Geo.getAABB(this.toShape(s));
        let cl= box ? C.x1 : C.x+coff[0],
            cr= cl+ (box? C.x2-C.x1 : C.width),
            ct= box ? C.y1 : C.y+coff[1],
            cb= ct+ (box? C.y2-C.y1 : C.height);
        let [rx,ry]=R.pos;
        //left
        if(left && rx<cl){
          s.x += cl-rx;
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //right
        if(right && (rx+R.width > cr)){
          s.x -= rx+R.width- cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(top && ry < ct){
          s.y += ct-ry;
          CY=true;
          collision.add(Mojo.TOP);
        }
        //bottom
        if(bottom && (ry+R.height > cb)){
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
      dbgShowDir(dir){
        let s="?";
        switch(dir){
          case Mojo.NE:
            s="top-right";
            break;
          case Mojo.NW:
            s="top-left";
            break;
          case Mojo.TOP:
          case Mojo.UP:
            s="top";
            break;
          case Mojo.LEFT:
            s="left";
            break;
          case Mojo.RIGHT:
            s="right";
            break;
          case Mojo.BOTTOM:
          case Mojo.DOWN:
            s="bottom";
            break;
          case Mojo.SE:
            s="bottom-right";
            break;
          case Mojo.SW:
            s="bottom-left";
            break;
        }
        return s;
      },
      dbgShowCol(col){
        let out=[];
        if(is.set(col))
          for(let i of col.values())
            out.push(this.dbgShowDir(i));
        return out.join(",");
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.bmpText=_$.bitmapText;

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

    const SG=gscope["io/czlab/mcfud/spatial"]();
    const {ute:_,is}=Mojo;
    const int=Math.floor;

    /**
     * @module mojoh5/Scenes
     */

    /** @ignore */
    function _sceneid(id){
      return id.startsWith("scene::") ? id : `scene::${id}` }

    /** @ignore */
    function _killScene(s){
      if(s){
        s.dispose && s.dispose();
        s.parent.removeChild(s); } }

    /** internal class, wraps a scene */
    class SceneWrapper extends Mojo.PXContainer{
      constructor(s){
        super();
        this.addChild(s);
        this.name=s.name;
        this.m5={stage:true};
      }
      dispose(){
        _killScene(this.children[0]);
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
          sgrid:SG.spatialGrid(options.sgridX||320,
                               options.sgridY||320) };
        if(is.fun(func)){
          this.m5.setup= func.bind(this)
        }else if(is.obj(func)){
          let s= _.dissoc(func,"setup");
          _.inject(this, func);
          if(s)this.m5.setup=s.bind(this); }
      }
      _hitObjects(grid,obj,found,maxCol=3){
        let curCol=maxCol;
        for(let m,b,
            i=0,z=found.length;i<z;++i){
          b=found[i];
          if(obj !== b &&
             !b.m5.dead &&
             (obj.m5.cmask & b.m5.type)){
            m= Mojo.Sprites.hitTest(obj,b);
            if(m){
              Mojo.emit(["hit",obj],m);
              if(!m.B.m5.static)
                Mojo.emit(["hit",m.B],m.swap());
              grid.engrid(obj);
              if(--curCol===0){break} } }
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
       * @param {number} delayFrames
       */
      future(expr,delayMillis){
        this.m5.queue.push([expr, int(Mojo._curFPS*delayMillis/1000)])
      }
      XXfuture(expr,delayFrames){
        this.m5.queue.push([expr,delayFrames])
      }
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
      /**Remove item from spatial grid temporarily.
       * @param {Sprite} c
       * @return {Sprite} c
       */
      degrid(c){
        if(c)
          this.m5.sgrid.degrid(c);
        return c;
      }
      /**Force item to update spatial grid.
       * @param {Sprite} c
       * @return {Sprite} c
       */
      engrid(c){
        if(c && c.m5._engrid)
          this.m5.sgrid.engrid(c);
        return c;
      }
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
            if(o.m5){
              o.m5.drag && i.undoDrag(o);
              o.m5.button && i.undoButton(o); } } }
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
          c.children.length>0 && this._tick(c.children, dt)
        })
      }
      /**Find objects that may collide with this object.
       * @param {object} obj
       * @return {object[]}
       */
      searchSGrid(obj,incObj=false){
        return this.m5.sgrid.search(obj,incObj) }
      /**Stage this object for removal.
       * @param {object} obj
       */
      queueForRemoval(obj){
        this.m5.garbo.push(obj);
        return obj;
      }
      /**
       * @param {number} dt
       */
      update(dt){
        if(this.m5.dead){return}
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

    function _layItems(C,items,pad,dir,skip){
      let p,P=0,m=-1;
      items.forEach((s,i)=>{
        if(dir===Mojo.DOWN){
          if(s.width>m){ P=i; m=s.width; }
        }else{
          if(s.height>m){ P=i; m=s.height; }
        }
        if(!skip) C.addChild(s);
        _.assert(s.anchor.x<0.3&&s.anchor.y<0.3,"wanted topleft anchor");
      });
      //P is the fatest or tallest
      p=items[P];
      for(let s,i=P-1;i>=0;--i){
        s=items[i];
        Mojo.Sprites[dir===Mojo.DOWN?"pinTop":"pinLeft"](p,s,pad);
        p=s;
      }
      p=items[P];
      for(let s,i=P+1;i<items.length; ++i){
        s=items[i];
        Mojo.Sprites[dir===Mojo.DOWN?"pinBottom":"pinRight"](p,s,pad);
        p=s;
      }
    }

    /** @ignore */
    function _layout(items,options,dir){
      const {Sprites}=Mojo,
            K=Mojo.getScaleFactor();
      if(items.length===0){return}
      options= _.patch(options,{bg:0,
                                padding:10,
                                fit:20,
                                borderWidth:4,
                                border:0xffffff});
      let borderWidth=options.borderWidth * K;
      let C=options.group || Sprites.group();
      let pad=options.padding * K;
      let fit= options.fit * K;
      let last,w,h,p,fit2= 2*fit;

      _layItems(C,items,pad,dir,options.skipAdd);
      w= C.width;
      h= C.height;
      last=_.tail(items);

      //create a backdrop
      if(true){
        let r= Sprites.rect(w+fit2,h+fit2,
                            options.bg,
                            options.border, borderWidth);
        C.addChildAt(r,0); //add to front so zindex is lowest
        if(!is.vec(options.bg)){
          r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
          if(options.bg == "transparent")r.alpha=0;
        }
      }

      h= C.height;
      w= C.width;

      let [w2,h2]=[int(w/2), int(h/2)];
      if(dir===Mojo.DOWN){
        //realign on x-axis
        items.forEach(s=> s.x=w2-int(s.width/2));
        let hd= h-(last.y+last.height);
        hd= int(hd/2);
        //realign on y-axis
        items.forEach(s=> s.y += hd);
      }else{
        //refit the items on y-axis
        items.forEach(s=> s.y=h2-int(s.height/2));
        let wd= w-(last.x+last.width);
        wd= int(wd/2);
        //refit the items on x-axis
        items.forEach(s=> s.x += wd);
      }

      h= C.height;
      w= C.width;

      //may be center the whole thing
      C.x= _.nor(options.x, int((Mojo.width-w)/2));
      C.y= _.nor(options.y, int((Mojo.height-h)/2));

      return C;
    }

    /** @ignore */
    function _choiceBox(items,options,dir){
      const selectedColor=Mojo.Sprites.color(options.selectedColor);
      const disabledColor=Mojo.Sprites.color(options.disabledColor);
      let cur;
      items.forEach(o=>{
        if(o.m5.uuid==options.defaultChoice){
          cur=o;
          o.tint=selectedColor;
        }else{
          o.tint=disabledColor;
        }
        Mojo.Input.mkBtn(o);
        o.m5.press=(b)=>{
          if(b!==cur){
            cur.tint=disabledColor;
            b.tint=selectedColor;
            cur=b;
            options.onClick && options.onClick(b);
          }
        };
      });
      if(!cur){
        cur=items[0];
        cur.tint= selectedColor;
      }
      let c= _layout(items,options,dir);
      c.getSelectedChoice=function(){
        return cur.m5.uuid
      };
      return c;
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
      /**Lay selectable items out horizontally.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      choiceMenuX(items,options){
        return _choiceBox(items, options, Mojo.RIGHT) },
      /**Lay selectable items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      choiceMenuY(items,options){
        return _choiceBox(items, options, Mojo.DOWN) },
      /**Define a scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object|function} func
       * @param {object} [options]
       */
      defScene(name, func, options){
        //add a new scene definition
        if(is.fun(func))
          func={setup:func};
        ScenesDict[name]=[func, options]; },
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
        return this.runScene(name, Mojo.stage.getChildIndex(c),options); },
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
        Mojo["Input"].reset();
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
        this.runScene(name,num,options);
      },
      /**Run a sequence of scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...any} args
       * @return {Scene}
       */
      runSceneSeq(...args){
        args.forEach(a=>{
          _.assert(is.vec(a),"Expecting array");
          this.runScene(a[0],a[1],a[2]);
        });
      },
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
          num = _.dissoc(options,"slot"); }
        options = _.inject({},_s[1],options);
        s0=_.inject({},_s[0]);
        if(is.undef(num))
          num= options["slot"] || -1;
        //before we run a new scene
        //Mojo.mouse.reset();
        //create new
        if(!options.tiled){
          y = new Scene(name, s0, options);
        }else{
          _.assert(options.tiled.name, "no tmx file!");
          y = new Mojo.Tiles.TiledScene(name, s0, options); }
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

    const _actives=new Map();
    let _sndCnt=1;

    /** debounce */
    function _debounce(s,now,interval){
      let rc;
      if(_actives.has(s) &&
         _actives.get(s) > now){
        rc=true
      }else{
        if(!interval)
          _actives.delete(s)
        else
          _actives.set(s, now+interval)
      }
      return rc;
    }

    /** @ignore */
    function _make(_A,name, url){
      let _pan=0;
      let _vol=1;
      const s={
        sids:new Map(),
        buffer:null,
        loop:false,
        src: url,
        name: name,
        //-1(left speaker)
        //1(right speaker)
        get pan(){ return _pan },
        set pan(v){ _pan= v },
        get volume(){ return _vol },
        set volume(v){ _vol=v },
        play(){
          if(!Mojo.Sound.sfx()){return}
          const now = _.now();
          const s= this.name;
          if(!_debounce(s,now)){
            let sid = _sndCnt++,
                w=this.buffer.duration*1000,
                g=_A.ctx.createGain(),
                p=_A.ctx.createStereoPanner(),
                src = _A.ctx.createBufferSource();
            src.buffer = this.buffer;
            src.connect(g);
            g.connect(p);
            p.connect(_A.ctx.destination);
            if(this.loop){
              src.loop = true;
            }else{
              _.delay(w,()=> this.sids.delete(sid))
            }
            p.pan.value = _pan;
            g.gain.value = _vol;
            src.start(0);
            this.sids.set(sid,src);
          }
        },
        stop(){
          this.sids.forEach(s=> s.stop(0));
          this.sids.length=0;
        }
      };
      return SoundFiles[name]=s;
    };

    const _$={
      ctx: new gscope.AudioContext(),
      _mute:0,
      init(){
        _.delay(0,()=>{
          if(this.ctx.state == "suspended"){
            this.ctx.resume()
          }
        })
      },
      /**Check if sound is on or off.
       * @memberof module:mojoh5/Sound
       * @return {boolean}
       */
      sfx(){
        return this._mute===0
      },
      /**Turn sound off.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      mute(){
        this._mute=1;
        return this;
      },
      /**Turn sound on.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      unmute(){
        this._mute=0;
        return this;
      },
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
  function _module(Mojo){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_,is}=Mojo;
    const Layers= [];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function cur(){ return Layers[0] }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkLayer(L={}){
      function _uh(e){
        L.keyInputs.set(e.keyCode,false);
        L.shiftKey=e.shiftKey;
        L.ctrlKey=e.ctrlKey;
        L.altKey=e.altKey;
        e.preventDefault();
      }
      function _dh(e){
        L.keyInputs.set(e.keyCode,true);
        L.ctrlKey= false;
        L.altKey= false;
        L.shiftKey=false;
        e.preventDefault();
      }
      _.inject(L,{
        keyInputs: _.jsMap(),
        pauseInput:false,
        ctrlKey:false,
        altKey:false,
        shiftKey:false,
        ptr:null,
        dispose(){
          this.ptr.dispose();
          if(!Mojo.touchDevice)
            _.delEvent([["keyup", window, _uh, false],
                        ["keydown", window, _dh, false]]);
        },
        pointer(){
          if(!this.ptr)
            this.ptr=mkPtr(this);
          return this.ptr;
        },
        update(dt){
          if(!this.pauseInput)
            this.ptr.DragDrops.length>0 && this.ptr.update(dt)
        },
        keybd(_key,press,release){
          const self=this;
          const key={press,
                     release,
                     isDown:false, isUp:true,
                     ctrl:false, alt:false, shift:false};
          key.code= is.vec(_key)?_key:[_key];
          function _down(e){
            e.preventDefault();
            if(key.code.includes(e.keyCode)){
              key.ctrl=e.ctrlKey;
              key.alt=e.altKey;
              key.shift=e.shiftKey;
              if(!self.pauseInput && key.isUp)
                key.press && key.press(key.alt,key.ctrl,key.shift);
              key.isUp=false;
              key.isDown=true;
            }
          }
          function _up(e){
            e.preventDefault();
            if(key.code.includes(e.keyCode)){
              if(!self.pauseInput)
                key.isDown && key.release && key.release();
              key.isUp=true; key.isDown=false;
              key.ctrl=false; key.alt=false; key.shift=false;
            }
          }
          if(!Mojo.touchDevice)
            _.addEvent([["keyup", window, _up, false],
                        ["keydown", window, _down, false]]);
          key.dispose=()=>{
            if(!Mojo.touchDevice)
              _.delEvent([["keyup", window, _up, false],
                          ["keydown", window, _down, false]]);
          }
          return key;
        },
        reset(){
          this.pauseInput=false;
          this.ctrlKey=false;
          this.altKey=false;
          this.shiftKey=false;
          this.ptr.reset();
          this.keyInputs.clear();
        },
        resize(){
          Mojo.mouse=this.ptr;
          this.ptr.reset();
        },
        dbg(){
          console.log(`N# of touches= ${this.ptr.ActiveTouches.size}`);
          console.log(`N# of hotspots= ${this.ptr.Hotspots.length}`);
          console.log(`N# of buttons= ${this.ptr.Buttons.length}`);
          console.log(`N# of drags= ${this.ptr.DragDrops.length}`);
          console.log(`Mouse pointer = ${this.ptr}`);
        }
      });

      if(!Mojo.touchDevice)
        //keep tracks of keyboard presses
        _.addEvent([["keyup", window, _uh, false],
                    ["keydown", window, _dh, false]]);

      return L;
    }

    /**
     * @module mojoh5/Input
     */

    /** @ignore */
    function mkPtr(L){
      let P={
        ActiveDragsID: _.jsMap(),
        ActiveDrags: _.jsMap(),
        ActiveTouches: _.jsMap(),
        Hotspots:[],
        Buttons:[],
        DragDrops:[],
        //down,up
        state: [false,true],
        touchZeroID:0,
        _visible: true,
        _x: 0,
        _y: 0,
        width: 1,
        height: 1,
        downTime: 0,
        downAt:[0,0],
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
        set visible(v) {
          this.cursor = v ? "auto" : "none";
          this._visible = v;
        },
        update(dt){
          Mojo.touchDevice? this.updateMultiDrags(dt) : this.updateDrags(dt)
        },
        updateMultiDrags(dt){
          let self=P;
          for(let cs,a,i=0; i < self.ActiveTouches.length; ++i){
            a=self.ActiveTouches[i];
            for(let p,s,i=self.DragDrops.length-1; i>=0; --i){
              s=self.DragDrops[i];
              p=self.ActiveDrags.get(s.m5.uuid);
              if(p){
                _V.set(p.dragged, p.dragStartX+(a.x-p.dragPtrX),
                                  p.dragStartY+(a.y-p.dragPtrY));
                break;
              }
              if(s.m5.drag && self._test(s,a.x,a.y)){
                _.assoc(self.ActiveDrags, s.m5.uuid, p={
                  dragStartX: s.x,
                  dragStartY: s.y,
                  dragPtrX: a.x,
                  dragPtrY: a.y,
                  dragged: s,
                  id: a.id
                });
                _.assoc(self.ActiveDragsID, a.id, p);
                //pop it up to top
                cs= s.parent.children;
                _.disj(cs,s);
                cs.push(s);
                break;
              }
            }
          }
        },
        updateDrags(dt){
          if(this.state[0]){
            if(this.dragged){
              _V.set(this.dragged, this.dragStartX+(this.x-this.dragPtrX),
                                   this.dragStartY+(this.y-this.dragPtrY));
            }else{
              for(let cs,s,i=this.DragDrops.length-1; i>=0; --i){
                s=this.DragDrops[i];
                if(s.m5.drag && this.hitTest(s)){
                  this.dragStartX = s.x;
                  this.dragStartY = s.y;
                  this.dragPtrX= this.x;
                  this.dragPtrY= this.y;
                  this.dragged = s;
                  //pop it up to top
                  cs= s.parent.children;
                  _.disj(cs,s);
                  cs.push(s);
                  break;
                }
              }
            }
          }
          if(this.state[1]){
            //dragged and now dropped
            if(this.dragged &&
               this.dragged.m5.onDragDropped)
              this.dragged.m5.onDragDropped();
            this.dragged=null;
          }
        },
        getGlobalPosition(){
          return {x: this.x, y: this.y}
        },
        //tap(){ this.press() },
        _press(){
          if(!L.pauseInput)
            for(let s,i=0,z=this.Buttons.length;i<z;++i){
              s=this.Buttons[i];
              if(s.m5.press && this.hitTest(s)){
                s.m5.press(s);
                break;
              }
            }
        },
        _doMDown(b){
          let found,self=P;
          for(let s,i=0;i<self.Hotspots.length;++i){
            s=self.Hotspots[i];
            if(s.m5.touch && self.hitTest(s)){
              s.m5.touch(s,b);
              found=true;
              break;
            }
          }
          return found;
        },
        mouseDown(e){
          let self=P, nn=_.now();
          //left click only
          if(e.button===0){
            e.preventDefault();
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            //down,up,pressed
            _.setVec(self.state,true,false);
            self.downTime = nn;
            self.downAt[0]=self._x;
            self.downAt[1]=self._y;
            Mojo.Sound.init();
            if(!L.pauseInput){
              Mojo.emit(["mousedown"]);
              self._doMDown(true);
            }
          }
        },
        mouseMove(e){
          let self=P;
          self._x = e.pageX - e.target.offsetLeft;
          self._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          if(!L.pauseInput)
            Mojo.emit(["mousemove"]);
        },
        mouseUp(e){
          let self=P,nn=_.now();
          if(e.button===0){
            e.preventDefault();
            self.elapsedTime = Math.max(0, nn - self.downTime);
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            _.setVec(self.state,false,true);
            if(!L.pauseInput){
              Mojo.emit(["mouseup"]);
              if(!self._doMDown(false)){
                let v= _V.vecAB(self.downAt,self);
                let z= _V.len2(v);
                //small distance and fast then a click
                if(z<400 && self.elapsedTime<200){
                  Mojo.emit(["single.tap"]);
                  self._press();
                }else{
                  self._swipeMotion(v,z,self.elapsedTime);
                }
              }
            }
          }
        },
        _swipeMotion(v,dd,dt,arg){
          let n= _V.unit$(_V.normal(v));
          let rc;
          //up->down n(1,0)
          //bottom->up n(-1,0)
          //right->left n(0,1)
          //left->right n(0,-1)
          if(dd>400 && dt<1000 &&
             (Math.abs(n[0]) > 0.8 || Math.abs(n[1]) > 0.8)){
            if(n[0] > 0.8){
              rc="swipe.down";
            }
            if(n[0] < -0.8){
              rc="swipe.up";
            }
            if(n[1] > 0.8){
              rc="swipe.left";
            }
            if(n[1] < -0.8){
              rc="swipe.right";
            }
          }
          if(rc)
            Mojo.emit([rc], arg)
        },
        _doMTouch(ts,flag){
          let self=P,
              found=_.jsMap();
          for(let a,i=0; i<ts.length; ++i){
            a=ts[i];
            for(let s,j=0; j<self.Hotspots.length; ++j){
              s=self.Hotspots[j];
              if(s.m5.touch && self._test(s,a.x,a.y)){
                s.m5.touch(s,flag);
                found.set(a.id,1);
                break;
              }
            }
          }
          return found;
        },
        _doMDrag(ts,found){
          let self=P;
          for(let p,a,i=0; i<ts.length;++i){
            a=ts[i];
            if(found.get(a.id)){continue}
            p=self.ActiveDragsID.get(a.id);
            if(p){
              found.set(a.id,1);
              p.dragged.m5.onDragDropped &&
              p.dragged.m5.onDragDropped();
              self.ActiveDragsID.delete(a.id);
              self.ActiveDrags.delete(p.dragged.m5.uuid);
            }
          }
          return found;
        },
        touchCancel(e){
          console.warn("received touchCancel event!");
          this.freeTouches();
        },
        touchStart(e){
          let self=P,
              t= e.target,
              out=[],
              nn= _.now(),
              T= e.targetTouches,
              A= self.ActiveTouches;
          e.preventDefault();
          for(let a,cx,cy,id,o,i=0;i<T.length;++i){
            o=T[i];
            id=o.identifier;
            cx = o.pageX - t.offsetLeft;
            cy = o.pageY - t.offsetTop;
            _.assoc(A, id, a={
              id, _x:cx, _y:cy,
              downTime: nn, downAt: [cx,cy],
              x:cx/Mojo.scale, y:cy/Mojo.scale
            });
            out.push(a);
            //handle single touch case
            if(i===0){
              self.touchZeroID=id;
              self._x = cx;
              self._y = cy;
              self.downTime= nn;
              self.downAt= [cx,cy];
              _.setVec(self.state,true,false);
            }
          }
          Mojo.Sound.init();
          if(!L.pauseInput){
            Mojo.emit(["touchstart"],out);
            self._doMTouch(out,true);
          }
        },
        touchMove(e){
          let out=[],
              self=P,
              t = e.target,
              T = e.targetTouches;
          e.preventDefault();
          for(let cx,cy,a,o,id,i=0;i<T.length;++i){
            o=T[i];
            id= o.identifier;
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            if(id==self.touchZeroID){
              self._x = cx;
              self._y = cy;
            }
            if(a= self.ActiveTouches.get(id)){
              a.x=cx/Mojo.scale;
              a.y=cy/Mojo.scale;
              a._x = cx;
              a._y = cy;
              out.push(a);
            }
          }
          if(!L.pauseInput)
            Mojo.emit(["touchmove"],out);
        },
        touchEnd(e){
          let self=P,
              out=[],
              T = e.targetTouches,
              C = e.changedTouches,
              cx,cy,i,a,o,id,
              t = e.target, nn=_.now();
          e.preventDefault();
          for(i=0;i<C.length;++i){
            o=C[i];
            id=o.identifier;
            cx= o.pageX - t.offsetLeft;
            cy= o.pageY - t.offsetTop;
            a=self.ActiveTouches.get(id);
            if(id==self.touchZeroID){
              self.elapsedTime = Math.max(0,nn-self.downTime);
              _.setVec(self.state,false,true);
              self._x= cx;
              self._y= cy;
            }
            if(a){
              a.elapsedTime = Math.max(0,nn-a.downTime);
              self.ActiveTouches.delete(id);
              a._x= cx;
              a._y= cy;
              a.x=cx/Mojo.scale;
              a.y=cy/Mojo.scale;
              out.push(a);
            }
          }
          if(!L.pauseInput){
            Mojo.emit(["touchend"],out);
            let found= self._doMTouch(out,false);
            self._doMDrag(out,found);
            self._onMultiTouches(out,found);
          }
        },
        _onMultiTouches(ts,found){
          let self=P;
          for(let a,v,z,j=0; j<ts.length; ++j){
            a=ts[j];
            if(found.get(a.id)){continue}
            v= _V.vecAB(a.downAt,a);
            z= _V.len2(v);
            if(z<400 && a.elapsedTime<200){
              Mojo.emit(["single.tap"],a);
              for(let s,i=0,n=self.Buttons.length;i<n;++i){
                s=self.Buttons[i];
                if(s.m5.press && self._test(s, a.x, a.y)){
                  s.m5.press(s);
                  break;
                }
              }
            }else{
              self._swipeMotion(v,z,a.elapsedTime,a);
            }
          }
        },
        freeTouches(){
          _.setVec(this.state,false,true);
          this.touchZeroID=0;
          this.ActiveTouches.clear();
          this.ActiveDrags.clear();
          this.ActiveDragsID.clear();
        },
        reset(){
          _.setVec(this.state,false,true);
          this.freeTouches();
          this.DragDrops.length=0;
          this.Buttons.length=0;
          this.Hotspots.length=0;
        },
        _test(s,x,y){
          let _S=Mojo.Sprites,
              g=_S.gposXY(s),
              p=_S.toPolygon(s),
              ps=_V.translate(g,p.calcPoints);
          return Geo.hitTestPointInPolygon(x, y, ps);
        },
        hitTest(s){
          return this._test(s,this.x, this.y)
        }
      };

      //////
      const sigs=[["mousemove", Mojo.canvas, P.mouseMove],
                  ["mousedown", Mojo.canvas,P.mouseDown],
                  ["mouseup", window, P.mouseUp],
                  ["touchmove", Mojo.canvas, P.touchMove],
                  ["touchstart", Mojo.canvas, P.touchStart],
                  ["touchend", window, P.touchEnd],
                  ["touchcancel", window, P.touchCancel]];
      _.addEvent(sigs);
      //////
      P.dispose=function(){
        this.reset();
        _.delEvent(sigs);
      };
      //////
      return P;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
      isPaused(){ return cur().pauseInput },
      resume(){ cur().pauseInput=false },
      pause(){ cur().pauseInput=true },
      dbg(){ cur().dbg() },
      /**Resize the mouse pointer.
       * @memberof module:mojoh5/Input
       */
      resize(){
        cur().resize()
      },
      /**Clear all keyboard and mouse events.
       * @memberof module:mojoh5/Input
       */
      reset(){
        cur().reset()
      },
      /**Fake a keypress(down).
       * @memberof module:mojoh5/Input
       */
      setKeyOn(k){
        cur().keyInputs.set(k,true);
      },
      /**Fake a keypress(up).
       * @memberof module:mojoh5/Input
       */
      setKeyOff(k){
        cur().keyInputs.set(k,false);
      },
      /**
       * @memberof module:mojoh5/Input
       * @param {number} _key
       */
      keybd(_key,press,release){
        return cur().keybd(_key,press,release)
      },
      /**This sprite is no longer a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoButton(b){
        _.disj(cur().ptr.Buttons,b);
        b.m5.button=false;
        return b;
      },
      /**This sprite is now a button.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeButton(b){
        _.conj(cur().ptr.Buttons,b);
        b.m5.button=true;
        return b;
      },
      /**This sprite is no longer a hotspot.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      undoHotspot(b){
        _.disj(cur().ptr.Hotspots,b);
        b.m5.hotspot=false;
        return b;
      },
      /**This sprite is now a hotspot.
       * @memberof module:mojoh5/Input
       * @param {Sprite} b
       * @return {Sprite}
       */
      makeHotspot(b){
        _.conj(cur().ptr.Hotspots,b);
        b.m5.hotspot=true;
        return b;
      },
      /** @ignore */
      update(dt){
        cur().update(dt)
      },
      /**This sprite is now draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      makeDrag(s){
        _.conj(cur().ptr.DragDrops,s);
        s.m5.drag=true;
        return s;
      },
      /**This sprite is now not draggable.
       * @memberof module:mojoh5/Input
       * @param {Sprite} s
       * @return {Sprite}
       */
      undoDrag(s){
        _.disj(cur().ptr.DragDrops,s);
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
      keyDown(code){ return cur().keyInputs.get(code) },
      keyShift(){ return cur().shiftKey },
      keyAlt(){ return cur().altKey },
      keyCtrl(){ return cur().ctrlKey },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        return cur().pointer()
      },
      dispose(){
        Layers.forEach(a => a.dispose())
      },
      pop(){
        if(Layers.length>1){
          Layers.shift().dispose()
          cur().pauseInput=false;
        }
      },
      push(){
        Layers[0].pauseInput=true;
        Layers.unshift(mkLayer());
      }
    };

    //disable the default actions on the canvas
    Mojo.canvas.style.touchAction = "none";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.undoBtn=_$.undoButton;
    _$.mkBtn=_$.makeButton;
    _$.mkDrag=_$.makeDrag;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    Layers.push(mkLayer());

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    return (Mojo.Input= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Input"]=function(M){
      return M.Input ? M.Input : _module(M)
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const P8=Math.PI/8,
          P8_3=P8*3,
          P8_5=P8*5,
          P8_7= P8*7,
          {Sprites:_S, Input:_I, is,ute:_}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const sin=Math.sin,cos=Math.cos,abs=Math.abs;
    const RTA=180/Math.PI;

    /**
     * @module mojoh5/Touch
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _calcDir(cx,cy){
      const rad= Math.atan2(+cy, +cx);

      if(rad > -P8_5 && rad < -P8_3){
        console.log("calcDir=UP");
        return Mojo.UP;
      }
      if(rad > P8_3 && rad < P8_5){
        console.log("calcDir=DOWN");
        return Mojo.DOWN;
      }
      if((rad > -P8 && rad<0) ||
         (rad > 0 && rad<P8)){
        console.log("calcDir=RIGHT");
        return Mojo.RIGHT;
      }
      if((rad > P8_7 && rad<Math.PI) ||
         (rad > -Math.PI && rad < -P8_7)){
        console.log("calcDir=LEFT");
        return Mojo.LEFT;
      }

      if(rad > P8 && rad < P8_3){
        console.log("calcDir= SE ");
        return Mojo.SE;
      }
      if(rad > P8_5 && rad < P8_7){
        console.log("calcDir= SW ");
        return Mojo.SW;
      }
      if(rad> -P8_3 && rad < -P8){
        console.log("calcDir= NE ");
        return Mojo.NE;
      }
      if(rad > -P8_7 && rad < -P8_5){
        console.log("calcDir= NW ");
        return Mojo.NW;
      }

      _.assert(false,"Failed Joystick calcDir");
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _bindEvents(s){
      function onDragStart(e){
        let ct=e.changedTouches;
        let t= e.target;
        if(ct){
          e=ct[0];
          s.m5.touchId=ct[0].identifier;
        }else{//for mouse
          s.m5.touchId=0;
        }
        s.m5.startX= e.pageX - t.offsetLeft;
        s.m5.startY= e.pageY - t.offsetTop;
        s.m5.drag= true;
        if(!s.m5.static){
          s.visible=true;
          s.x=s.m5.startX;
          s.y=s.m5.startY;
        }
        if(!_I.isPaused()) s.m5.onStart();
      }
      function onDragEnd(e){
        if(s.m5.drag){
          s.m5.inner.position.set(0,0);
          s.m5.drag= false;
          if(!s.m5.static){
            s.visible=false;
          }
          if(!_I.isPaused()) s.m5.onEnd();
        }
      }
      function onDragMove(e){
        if(_I.isPaused() || !s.visible || !s.m5.drag){return}
        let c,t= e.target;
        if(e.changedTouches){
          for(let i=0,
                  ct=e.changedTouches; i< ct.length; ++i){
            if(s.m5.touchId == ct[i].identifier){
              c= [ct[i].pageX-t.offsetLeft,
                  ct[i].pageY-t.offsetTop];
              break;
            }
          }
        }else{//for mouse
          c= [e.pageX - t.offsetLeft,
              e.pageY - t.offsetTop]
        }
        let X = c? (c[0] - s.m5.startX) :0;
        let Y = c? (c[1] - s.m5.startY) :0;
        let limit=s.m5.range;
        let angle = 0;
        c[0]=0;
        c[1]=0;
        if(_.feq0(X) && _.feq0(Y)){return}
        /**x:   -1 <-> 1
         * y:   -1 <-> 1
         *          Y
         *          ^
         *     180  |  90
         *    ------------> X
         *     270  |  360
         */
        let dir, sx=abs(X), sy=abs(Y);
        if(_.feq0(X)){
          c[0]=0;
          if(Y>0){
            c[1]=Y>limit ? limit : Y;
            angle=270;
            dir=Mojo.DOWN;
          }else{
            c[1]= -(sy > limit ? limit : sy);
            angle = 90;
            dir= Mojo.UP;
          }
        }else if(_.feq0(Y)){
          c[1]=0;
          if(X>0){
            c[0]=sx > limit ? limit : sx;
            angle=0;
            dir= Mojo.RIGHT;
          }else{
            c[0]=-(sx > limit ? limit : sx);
            angle = 180;
            dir= Mojo.LEFT;
          }
        }else{
          let rad= Math.atan(abs(Y/X));
          angle = rad*RTA;
          c[0]=c[1]=0;
          if(X*X + Y*Y >= limit*limit){
            c[0]= limit * cos(rad);
            c[1]= limit * sin(rad);
          }else{
            c[0]= sx > limit ? limit : sx;
            c[1]= sy > limit ? limit : sy;
          }
          if(Y<0)
            c[1]= -abs(c[1]);
          if(X<0)
            c[0]= -abs(c[0]);
          if(X>0 && Y<0){
            //console.log(`angle < 90`);
            // < 90
          }else if(X<0 && Y<0){
            // 90 ~ 180
            //console.log(`angle 90 ~ 180`);
            angle= 180 - angle;
          }else if(X<0 && Y>0){
            // 180 ~ 270
            //console.log(`angle 180 ~ 270`);
            angle += 180;
          }else if(X>0 && Y>0){
            // 270 ~ 360
            //console.log(`angle 270 ~ 360`);
            angle= 360 - angle;
          }
          dir= _calcDir(c[0],c[1]);
        }
        s.m5.inner.position.set(c[0],c[1]);
        s.m5.onChange(dir,angle);
      }

      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      const sigs= [["mousemove", Mojo.canvas, onDragMove],
                   ["mousedown", Mojo.canvas, onDragStart],
                   ["mouseup", window, onDragEnd],
                   ["touchend", window, onDragEnd],
                   ["touchcancel", window, onDragEnd],
                   ["touchmove", Mojo.canvas, onDragMove],
                   ["touchstart", Mojo.canvas, onDragStart]];
      _.addEvent(sigs);
      s.m5.dispose=()=>{ _.delEvent(sigs) };
      return s;
    }

    const _$={
      assets:["boot/joystick.png","boot/joystick-handle.png"],
      /**Create the joystick.
       * @memberof module:mojoh5/Touch
       * @param {object} options
       * @return {PIXIContainer} the stick
       */
      joystick(options){
        let inner= _S.sprite("boot/joystick-handle.png");
        let outer= _S.sprite("boot/joystick.png");
        let stick=new PIXI.Container();
        let mo= _.inject({oscale:0.7,
                          iscale:1,
                          inner,
                          outer,
                          onEnd(){},
                          onStart(){},
                          prevDir:0,
                          static:false,
                          onChange(dir,angle){}}, options);
        _S.scaleXY(outer,mo.oscale, mo.oscale);
        _S.scaleXY(inner,mo.iscale, mo.iscale);
        outer.anchor.set(0.5);
        inner.anchor.set(0.5);
        stick.addChild(outer);
        stick.addChild(inner);
        mo.range = stick.width/2.5;
        if(!mo.static)
          stick.visible=false;
        stick.m5=mo;
        return _bindEvents(stick);
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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           is, ute:_}=Mojo;
    const abs=Math.abs,
          cos=Math.cos,
          sin=Math.sin,
          int=Math.floor;

    /**
     * @module mojoh5/2d
     */

    /**
     * @typedef {object} HealthBarConfig
     * @property {number} scale scaling factor for drawing
     * @property {number} width width of the widget
     * @property {number} height height of the widget
     * @property {number} lives  default is 3
     * @property {number} borderWidth width of the border
     * @property {number} lineColor color used for line
     * @property {number} fillColor color used to fill
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Create a health(lives) bar */
    function healthBar(arg){
      let {scale:K,width,height,
           lives,border,line,fill}=arg;
      let c,padding=4*K,fit=4*K,out=[];
      border = (border||4)*K;
      lives= lives||3;
      fill=_S.color(fill);
      line=_S.color(line);
      for(let r,w=int(width/lives), i=0;i<lives;++i){
        out.push(_S.rect(w,height-2*border,fill))
      }
      return{
        dec(){
          if(this.lives>0){
            this.lives -= 1;
            out[this.lives].visible=false;
          }
          return this.lives>0;
        },
        lives: out.length,
        sprite: _Z.layoutX(out,{bg:["#cccccc",0],
                                borderWidth:border,
                                border:line,padding,fit})
      };
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const R=Math.PI/180,
          CIRCLE=Math.PI*2;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //modified from original source: codepen.io/johan-tirholm/pen/PGYExJ
    //arg={cx,cy,radius,fill,line,alpha}
    /**Create a gauge like speedometer */
    function gaugeUI(arg){
      let {minDeg,maxDeg,
           line,gfx,scale:K,
           radius, fill, needle }= _.patch(arg,{minDeg:90,maxDeg:360});
      needle=_S.color(needle);
      line=_S.color(line);
      fill=_S.color(fill);
      radius *= K;
      return {
        segs: [0, R*45, R*90, R*135, R*180, R*225, R*270, R*315],
        gfx,
        getPt(x, y, radius, rad){
          return[x + radius * cos(rad),
                 y + radius * sin(rad) ]
        },
        draw(){
          gfx.clear();
          gfx.lineStyle({width: radius/8,color:line});
          gfx.beginFill(fill, arg.alpha);
          gfx.drawCircle(arg.cx, arg.cy, radius);
          gfx.endFill();
          this.segs.forEach(s=>{
            this.drawTig(gfx, arg.cx, arg.cy, radius, s, 7*K);
          });
          this.drawPtr(gfx, arg.cx,arg.cy,
                       64*K, fill, R* _M.lerp(minDeg, maxDeg, arg.update()));
        },
        drawTig(gfx, x, y, radius, rad, size){
          let [sx,sy] = this.getPt(x, y, radius - 4*K, rad),
              [ex,ey] = this.getPt(x, y, radius - 12*K, rad);
          gfx.lineStyle({color: line, width:size, cap:PIXI.LINE_CAP.ROUND});
          gfx.moveTo(sx, sy);
          gfx.lineTo(ex, ey);
          gfx.closePath();
        },
        drawPtr(gfx, cx,cy, radius, color, rad){
          let [px,py]= this.getPt(cx, cy, radius - 20*K, rad),
              [p2x,p2y] = this.getPt(cx, cy, 2*K, rad+R*90),
              [p3x,p3y] = this.getPt(cx, cy, 2*K, rad-R*90);
          gfx.lineStyle({cap:PIXI.LINE_CAP.ROUND, width:4*K, color: needle});
          gfx.moveTo(p2x, p2y);
          gfx.lineTo(px, py);
          gfx.lineTo(p3x, p3y);
          gfx.closePath();
          gfx.lineStyle({color:line});
          gfx.beginFill(line);
          gfx.drawCircle(cx,cy,9*K);
          gfx.endFill();
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PhotoMat",{
      setup(arg){
        if(arg.cb){ arg.cb(this) }else{
          this.g.gfx=_S.graphics();
          this.g.gfx.beginFill(_S.color(arg.color));
          //top,bottom
          this.g.gfx.drawRect(0,0,Mojo.width,arg.y1);
          this.g.gfx.drawRect(0,arg.y2,Mojo.width,Mojo.height-arg.y2);
          //left,right
          this.g.gfx.drawRect(0,0,arg.x1,Mojo.height);
          this.g.gfx.drawRect(arg.x2,0,Mojo.width-arg.x2,Mojo.height);
          this.g.gfx.endFill();
          this.insert(this.g.gfx);
        }
      }
    });

    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    _Z.defScene("StarfieldBg",{
      setup(o){
        if(!o.minVel) o.minVel=15;
        if(!o.maxVel) o.maxVel=30;
        if(!o.count) o.count=100;
        if(!o.width) o.width=Mojo.width;
        if(!o.height) o.height=Mojo.height;

        let gfx= _S.graphics();
        let stars=[];

        this.g.fps= 1.0/o.fps;
        this.g.stars=stars;
        this.g.gfx=gfx;
        this.g.lag=0;
        this.g.dynamic=true;

        if(o.static)
          this.g.dynamic=false;

        for(let i=0; i<o.count; ++i)
          stars[i] = {x: _.rand()*o.width,
                      y: _.rand()*o.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(o.maxVel- o.minVel))+o.minVel};
        this._draw();
        this.insert(gfx);
      },
      _draw(){
        const w=0xffffff;
        this.g.gfx.clear();
        this.g.stars.forEach(s=>{
          this.g.gfx.beginFill(w);
          this.g.gfx.drawRect(s.x,
                              s.y,
                              s.size,
                              s.size);
          this.g.gfx.endFill();
        });
      },
      moveStars(dt){
        this.g.lag +=dt;
        if(this.g.lag<this.g.fps){}else{
          this.g.lag=0;
          for(let s,i=0,
                  o=this.m5.options;
                  i<this.g.stars.length;++i){
            s=this.g.stars[i];
            s.y += dt * s.vel;
            if(s.y > o.height){
              _V.set(s, _.randInt(o.width), 0);
            s.size=_.randInt(4);
            s.vel=(_.rand()*(o.maxVel- o.minVel))+o.minVel; } }
          this._draw();
        }
      },
      postUpdate(dt){
        this.g.dynamic ? this.moveStars(dt) : 0
      }
    },{fps:90, count:100, minVel:15, maxVel:30 });

    /** emit something every so often... */
    class PeriodicDischarge{
      constructor(ctor,intervalSecs,size=16,...args){
        this._interval=intervalSecs;
        this._ctor=ctor;
        this._timer=0;
        this._size=size
        this._pool=_.fill(size,ctor);
      }
      lifeCycle(dt){
        this._timer += dt;
        if(this._timer > this._interval){
          this._timer = 0;
          this.discharge();
        }
      }
      discharge(){
        throw `PeriodicCharge: please implement action()` }
      _take(){
        if(this._pool.length>0) return this._pool.pop() }
      reclaim(o){
        if(this._pool.length<this._size) this._pool.push(o); } }

    /** walks around a maze like in Pacman. */
    function MazeRunner(e,frames){
      const {Sprites, Input}=Mojo;
      const self={
        dispose(){
          Mojo.off(self)
        },
        onTick(dt){
          let [vx,vy]=e.m5.vel,
              vs=e.m5.speed,
              x = !_.feq0(vx),
              y = !_.feq0(vy);
          if(!(x&&y) && frames){
            if(y){
              if(is.obj(frames))
                e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP]);
              else if (frames){
                e.angle=vy>0?180:0;
              }
            }
            if(x){
              if(is.obj(frames))
                e.m5.showFrame(frames[vx>0?Mojo.RIGHT:Mojo.LEFT]);
              else if(frames){
                e.angle=vx>0?90:-90;
              }
            }
          }
          let r,d,l,u;
          if(Mojo.u.touchOnly){
            r=e.m5.heading===Mojo.RIGHT;
            l=e.m5.heading===Mojo.LEFT;
            u=e.m5.heading===Mojo.UP;
            d=e.m5.heading===Mojo.DOWN;
          }else{
            r=Input.keyDown(Input.RIGHT) && Mojo.RIGHT;
            d=Input.keyDown(Input.DOWN) && Mojo.DOWN;
            l=Input.keyDown(Input.LEFT) && Mojo.LEFT;
            u=Input.keyDown(Input.UP) && Mojo.UP;
          }
          if(l||u){vs *= -1}
          if(l&&r){
            _V.setX(e.m5.vel,0);
          }else if(l||r){
            e.m5.heading= l||r;
            _V.setX(e.m5.vel,vs); }
          if(u&&d){
            _V.setY(e.m5.vel,0);
          }else if(u||d){
            e.m5.heading= u||d;
            _V.setY(e.m5.vel,vs); } } };
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
               col.overlapN[1] < -0.85){ col= null } }
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
            Mojo.emit(["2d.sensor", col.B], col.A)
          }else{
            let [dx,dy]= e.m5.vel;
            col.impact=null;
            _V.sub$(e,col.overlapV);
            if(col.overlapN[1] < -0.3){
              if(!e.m5.skipHit && dy<0){ _V.setY(e.m5.vel,0) }
              col.impact = abs(dy);
              Mojo.emit(["bump.top", e],col);
            }
            if(col.overlapN[1] > 0.3){
              if(!e.m5.skipHit && dy>0){ _V.setY(e.m5.vel,0) }
              col.impact = abs(dy);
              Mojo.emit(["bump.bottom",e],col);
            }
            if(col.overlapN[0] < -0.3){
              if(!e.m5.skipHit && dx<0){ _V.setX(e.m5.vel,0) }
              col.impact = abs(dx);
              Mojo.emit(["bump.left",e],col);
            }
            if(col.overlapN[0] > 0.3){
              if(!e.m5.skipHit && dx>0){ _V.setX(e.m5.vel,0) }
              col.impact = abs(dx);
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

    /** bounce back and forth... */
    function Patrol(e,xDir,yDir){
      const sigs=[];
      const self= {
        dispose(){
          sigs.forEach(a=>Mojo.off(...a)) },
        goLeft(col){
          e.m5.heading=Mojo.LEFT;
          e.m5.flip= "x";
          _V.setX(e.m5.vel, -col.impact);
        },
        goRight(col){
          e.m5.heading=Mojo.RIGHT;
          e.m5.flip= "x";
          _V.setX(e.m5.vel, col.impact);
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
      const height2=int(_height/2);
      const width2=int(_width/2);
      const height4=int(_height/4);
      const width4=int(_width/4);
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
            if(bx.x2> this.x+int(width2+width4)){
              this.x = bx.x2-width4*3;
            }},
            _left=()=>{
              if(bx.x1< this.x+int(width2-width4)){
              this.x = bx.x1-width4;
            }},
            _top=()=>{
            if(bx.y1< this.y+int(height2-height4)){
              this.y = bx.y1-height4;
            }},
            _bottom=()=>{
            if(bx.y2> this.y+int(height2+height4)){
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      healthBar,
      gaugeUI,
      Patrol,
      Platformer,
      MazeRunner,
      PeriodicDischarge
    };

    return (Mojo["2d"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/2d"]=(M)=>{
      return M["2d"] ? M["2d"] : _module(M) } }

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
        loop,
        frames,
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
          //flip values
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

    /** rotation */
    function TweenAngle(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          //flip values
          let [a,b]=this._a;
          this._a[0]=b;
          this._a[1]=a;
        },
        onFrame(end,alpha){
          this.sprite.rotation= end ? this._a[1]
                                 : _M.lerp(this._a[0], this._a[1], alpha)
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
          //flip values
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
          //flip values
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
                     : (0.5 * (2 -Math.pow(2, -10 * (x-1)))) },
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
        if(x < 0.5){
          return 4*x*x*x
        }else{
          let n= -2*x+2;
          return 1- n*n*n/2 } },
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
        if(x < 0.5){
          return 2*x*x
        }else{
          let n= -2*x+2;
          return 1 - n*n/2 } },
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
               (-a + 3*b - 3*c + d)*t*t*t) / 2 },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        return a*t*t*t +
               3*b*t*t*(1-t) +
               3*c*t*(1-t)*(1-t) +
               d*(1-t)*(1-t)*(1-t) },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_IN(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5) },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  ELASTIC_OUT(x){
        return x===0 ? 0
                     : x===1 ? 1
                     : 1+ Math.pow(2, -10*x) * Math.sin((x-0.1)*P5) },
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
                       : 1+ 0.5*Math.pow(2, -10*(x-1)) * Math.sin((x-1.1)*P5); } },
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
          return 7.5625 * (x -= 2.625/2.75) * x + 0.984375 } },
      /**Easing function: bounce-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
		  BOUNCE_INOUT(x){
			  return x < 0.5 ? _$.BOUNCE_IN(x*2) * 0.5
                       : _$.BOUNCE_OUT(x*2 - 1) * 0.5 + 0.5 },
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
          sa=endA[0];
          ea=endA[1]
        }
        return t.start(sa,ea), t;
      },
      /**Create a tween operating on sprite's rotation value.
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {function} type
       * @param {number|number[]} endA
       * @param {number} [frames]
       * @param {boolean} [loop]
       * @return {TweenAngle}
       */
      tweenAngle(s,type,endA,frames=60,loop=false){
        const t= TweenAngle(s,type,frames,loop);
        let sa=s.rotation;
        let ea=endA;
        if(is.vec(endA)){
          sa=endA[0];
          ea=endA[1]
        }
        return t.start(sa,ea), t;
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
          sx=endX[0];
          ex=endX[1]
        }
        if(is.vec(endY)){
          sy=endY[0];
          ey=endY[1]
        }
        if(!is.num(ex)){ sx=ex=null }
        if(!is.num(ey)){ sy=ey=null }
        return t.start(sx,ex,sy,ey), t;
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
          sx=endX[0];
          ex=endX[1]
        }
        if(is.vec(endY)){
          sy=endY[0];
          ey=endY[1]
        }
        if(!is.num(ex)){sx=ex=null}
        if(!is.num(ey)){sy=ey=null}
        return t.start(sx,ex,sy,ey), t;
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
      throb(s, endX=0.9, endY=0.9, frames=60,loop=true){
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
        return BatchTweens(this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,
                                                              _.or(x2,10)), ex, null, frames,loop),
                           this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,
                                                              _.or(y2,-10)), null,ey, frames,loop)) },
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
        t.start=function(ps){
          this._p = ps;
          this._run();
        };
        t.onFrame=function(end,alpha){
          let p = this._p;
          if(!end)
            _V.set(s, self.CUBIC_BEZIER(alpha, p[0][0], p[1][0], p[2][0], p[3][0]),
                      self.CUBIC_BEZIER(alpha, p[0][1], p[1][1], p[2][1], p[3][1])) };
        return t.start(points), t;
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
              _.delay(0,()=> _calcPath(cur,frames)) };
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
              _.delay(0,()=> _calcPath(cur,frames)) };
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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _DIRS = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is}=Mojo;
    const abs=Math.abs,
          ceil=Math.ceil,
          int = Math.floor;

    /**
     * @module mojoh5/Tiles
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** from xy position to array index */
    function _getIndex3(px, py, world){
      return Mojo.getIndex(px,py,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get vector from s1->s2 */
    function _getVector(s1,s2){
      return _V.vecAB(Mojo.Sprites.centerXY(s1),
                      Mojo.Sprites.centerXY(s2)) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get image file name */
    function _image(obj){
      const s= obj.image;
      const p= s && s.split("/");
      obj.image= p && p.length && p[p.length-1] }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get attributes for this gid */
    function _findGid(gid,gidMap){
      let idx = -1;
      if(gid>0){
        idx=0;
        while(gidMap[idx+1] &&
              gid >= gidMap[idx+1][0]) ++idx }

      return idx>=0?gidMap[idx]:[];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Scans all tilesets and record all custom properties into one giant map */
    function _tilesets(tsets, tsi, gprops){
      let gidList = [];
      tsets.forEach(ts=>{
        gidList.push([ts.firstgid, ts]);
        if(!ts.spacing) ts.spacing=0;
        _image(ts);
        let lprops={};
        (ts.tiles||[]).forEach(t=>{
          let p=_.selectNotKeys(t,"properties");
          p=_.inject(p, _parseProps(t));
          p.gid=ts.firstgid + t.id;
          lprops[t.id]=p;
          gprops[p.gid]= p;
        });
        tsi[ts.name]=lprops;
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** make sure we support this map */
    function _checkVer(json){
      let tmap = Mojo.resource(json,true).data;
      let tver= tmap && (tmap["tiledversion"] || tmap["version"]);
      return (tver &&
              _.cmpVerStrs(tver,"1.4.2") >= 0) ? tmap
                                               : _.assert(false,`${json} needs update`)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process properties group */
    function _parseProps(el){
      return (el.properties||[]).reduce((acc,p)=>{
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process the tiled map */
    function _loadTMX(scene,arg,objFactory,scale){
      let tmx= is.str(arg)?_checkVer(arg):arg;
      let tsProps={}, gtileProps={};
      _.assert(is.obj(tmx),"bad tiled map");
      //important to clone it
      tmx=JSON.parse(JSON.stringify(tmx));
      _.inject(scene.tiled,{tileW:tmx.tilewidth,
                            tileH:tmx.tileheight,
                            tilesInX:tmx.width,
                            tilesInY:tmx.height,
                            tiledMap:tmx,
                            saved_tileW:tmx.tilewidth,
                            saved_tileH:tmx.tileheight,
                            tiledWidth:tmx.tilewidth*tmx.width,
                            tiledHeight:tmx.tileheight*tmx.height}, _parseProps(tmx));
      let K= scale? scale: scene.getScaleFactor();
      let NH= _.evenN(K*tmx.tileheight);
      let NW= _.evenN(K*tmx.tilewidth);
      scene.tiled.new_tileW=NW;
      scene.tiled.new_tileH=NH;
      if(scale)
        scene.tiled.scale = scale;
      //workers
      const F={
        imagelayer(tl){ _image(tl) },
        tilelayer(tl){
          if(is.vec(tl.data[0])){
            //from hand-crafted map creation
            tl.width=tl.data[0].length;
            tl.height=tl.data.length;
            tl.data=tl.data.flat();
          }
          if(!tl.width)
            tl.width=scene.tiled.tilesInX;
          if(!tl.height)
            tl.height=scene.tiled.tilesInY;
          //maybe get layer's properties
          let cz,tps=_parseProps(tl);
          if(tl.visible === false){
            //the layer is invisible but maybe user wants to handle it
            if(cz=tps["Class"])
              objFactory[cz](scene,tl);
            return;
          }
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //process the tiles
          for(let s,gid,i=0;i<tl.data.length;++i){
            if((gid=tl.data[i])==0){ continue }
            if(tl.collision===false || tps.collision === false){
            }else if(tl.collision===true || tps.collision===true){
              if(gid>0) scene.tiled.collision[i]=gid;
              tl.collision=true;
            }
            let mapX = i % tl.width,
                mapY = int(i/tl.width),
                ps=gtileProps[gid],
                cz=ps && ps["Class"],
                cFunc=cz && objFactory[cz],
                tsi=_findGid(gid,scene.tiled.tileGidList)[1],
                s=_ctorTile(scene,gid,mapX,mapY,tps.width,tps.height);
            //assume all these are static (collision) tiles
            if(s){
              s.tiled.layer=tl;
              s.tiled.index=i;
              s.m5.static=true;
            }
            if(cFunc)
              s=cFunc.c(scene,s,tsi,ps);
            if(s){
              if(ps && ps.sensor)
                s.m5.sensor=true
              scene.insert(s,!!cFunc);
            }
          }
        },
        objectgroup(tl){
          tl.sprites=[];
          tl.objects.forEach(o=>{
            _.assert(is.num(o.x),"wanted xy position");
            let s,ps,
                os=_parseProps(o),
                gid=_.nor(o.gid, -1);
            _.inject(o,os);
            if(gid>0)
              ps=gtileProps[gid];
            let cz= _.nor(ps && ps["Class"], o["Class"]);
            let createFunc= cz && objFactory[cz];
            let w=scene.tiled.saved_tileW;
            let h=scene.tiled.saved_tileH;
            let tx=int((o.x+w/2)/w);
            let ty=int((o.y-h/2)/h);
            let tsi=_findGid(gid,scene.tiled.tileGidList)[1];
            o.column=tx;
            o.row=ty;
            s=gid<=0?{width:NW,height:NH}
                    :_ctorTile(scene,gid,tx,ty,o.width,o.height,cz);
            if(createFunc)
              s= createFunc.c(scene,s,tsi,ps,o);
            if(s){
              tl.sprites.push(s);
              scene.insert(s,true);
              if(ps && ps.sensor){s.m5.sensor=true}
            }
          });
        }
      };
      objFactory=_.nor(objFactory,{});
      _.inject(scene.tiled, {objFactory,
                             tileSets: tsProps,
                             tileProps: gtileProps,
                             collision: _.fill(tmx.width*tmx.height,0),
                             imagelayer:[], objectgroup:[], tilelayer:[],
                             tileGidList: _tilesets(tmx.tilesets,tsProps,gtileProps)});
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
      //
      if(scene.parent instanceof Mojo.Scenes.SceneWrapper){
        if(scene.tiled.tiledHeight<Mojo.height){
          scene.parent.y = int((Mojo.height-scene.tiled.tiledHeight)/2) }
        if(scene.tiled.tiledWidth<Mojo.width){
          scene.parent.x = int((Mojo.width-scene.tiled.tiledWidth)/2) }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** create a sprite */
    function _ctorTile(scene,gid,mapX,mapY,tw,th,cz){
      let tsi=_findGid(gid,scene.tiled.tileGidList)[1],
          XXX=_.assert(tsi,"Bad GID, no tileset"),
          cols=tsi.columns,
          id=gid - tsi.firstgid,
          ps=scene.tiled.tileProps[gid],
          cFunc, K=scene.tiled.scale || scene.getScaleFactor();
      cz= _.nor(cz, (ps && ps["Class"]));
      cFunc=cz && scene.tiled.objFactory[cz];
      _.assertNot(id<0, `Bad tile id: ${id}`);
      if(!is.num(cols))
        cols=int(tsi.imagewidth /
                 (tsi.tilewidth+tsi.spacing));
      let tscol = id % cols,
          tsrow = int(id/cols),
          tsX = tscol * tsi.tilewidth,
          tsY = tsrow * tsi.tileheight;
      if(tsi.spacing>0){
        tsX += tsi.spacing * tscol;
        tsY += tsi.spacing * tsrow;
      }
      //call user func to create sprite or not
      let s= cFunc&&cFunc.s(scene) ||
             Mojo.Sprites.frame(tsi.image,
                                tw||tsi.tilewidth,
                                th||tsi.tileheight,tsX,tsY);
      if(s){
        s.tiled={id, gid};
        if(tw==scene.tiled.saved_tileW){
          s.width= scene.tiled.new_tileW
        }else{
          s.scale.x=K;
          s.width = _.evenN(s.width);
        }
        if(th==scene.tiled.saved_tileH){
          s.height= scene.tiled.new_tileH
        }else{
          s.scale.y=K;
          s.height = _.evenN(s.height);
        }
        s.x=mapX* scene.tiled.new_tileW;
        s.y=mapY* scene.tiled.new_tileH;
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** use it for collision */
    const _contactObj = Mojo.Sprites.extend({width: 0,
                                             height: 0,
                                             parent:null,
                                             x:0, y:0,
                                             rotation:0,
                                             tiled:{},
                                             anchor: {x:0,y:0},
                                             getGlobalPosition(){
                                               return{
                                                 x:this.x+this.parent.x,
                                                 y:this.y+this.parent.y} }});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
      }
      /**
      */
      reloadMap(o){
        this.tiled={};
        this.m5.options.tiled = o;
        _loadTMX(this, o.name, o.factory, o.scale);
      }
      /**
      */
      runOnce(){
        const t= this.m5.options.tiled;
        _loadTMX(this, t.name, t.factory, t.scale);
        super.runOnce();
      }
      /**
      */
      removeTile(layer, s){
        let {x,y}= s;
        if(s.anchor.x < 0.3){
          y= s.y+int(s.height/2);
          x= s.x+int(s.width/2);
        }
        let tx= int(x/this.tiled.tileW),
            ty= int(y/this.tiled.tileH),
            yy= this.getTileLayer(layer),
            pos= tx + ty*this.tiled.tilesInX;
        yy.data[pos]=0;
        if(yy.collision)
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
      /**Set a tile to this position.
       * @param {string} layer
       * @param {number} row
       * @param {number} col
       * @param {number} gid
       * @return {Sprite}
       */
      setTile(layer,row,col,gid){
        let ts=this.getTSInfo(gid),
            id= gid-ts.firstgid,
            yy=this.getTileLayer(layer),
            pos=col + this.tiled.tilesInX * row;
        if(yy.collision)
          this.tiled.collision[pos]=gid;
        let s=_ctorTile(this,gid,col,row,ts.tilewidth,ts.tileheight);
        if(s){
          s.tiled.layer=yy;
          s.tiled.index=i;
        }
        return s;
      }
      /**Get the tile position for this sprite.
       * @param {Sprite} s
       * @return {array}
       */
      getTile(s){
        let {x,y}=s;
        if(s.anchor.x<0.3){
          y += int(s.height/2);
          x += int(s.width/2);
        }
        return this.getTileXY(x,y);
      }
      /**Get the tile position for this xy position
       * @param {number} px
       * @param {number} py
       * @return {array}
       */
      getTileXY(px,py){
        let tx= int(px/this.tiled.tileW),
            ty= int(py/this.tiled.tileH);
        _.assert(tx>=0 && tx<this.tiled.tilesInX, `bad tile col:${tx}`);
        _.assert(ty>=0 && ty<this.tiled.tilesInY, `bad tile row:${ty}`);
        return [tx,ty];
      }
      /**Get item with this name.
       * @param {string} name
       * @return {array}
       */
      getNamedItem(name){
        let out=[];
        this.tiled.objectgroup.forEach(c=>{
          c.objects.forEach(o=>{
            if(name==_.get(o,"name")) out.push(o)
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
        return _findGid(gid,this.tiled.tileGidList)[1] }
      /**Get tile information.
       * @param {number} gid
       * @return {object}
       */
      getTileProps(gid){
        return this.tiled.tileProps[gid] }
      /** @ignore */
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
      /**Check tile collision.
       * @param {Sprite} obj
       * @return {boolean}
       */
      collideXY(obj){
        let _S=Mojo.Sprites,
            tw=this.tiled.tileW,
            th=this.tiled.tileH,
            tiles=this.tiled.collision,
            box=_.feq0(obj.angle)?_S.getBBox(obj):_S.boundingBox(obj);
        let sX = Math.max(0,int(box.x1 / tw));
        let sY = Math.max(0,int(box.y1 / th));
        let eX =  Math.min(this.tiled.tilesInX-1,ceil(box.x2 / tw));
        let eY =  Math.min(this.tiled.tilesInY-1,ceil(box.y2 / th));
        for(let ps,c,gid,pos,B,tY = sY; tY<=eY; ++tY){
          for(let tX = sX; tX<=eX; ++tX){
            pos=tY*this.tiled.tilesInX+tX;
            gid=tiles[pos];
            if(!is.num(gid))
              _.assert(is.num(gid),"bad gid");
            if(gid===0){continue}
            B=this._getContactObj(gid,tX, tY);
            ps=this.getTileProps(gid);
            if(ps)
              B.m5.sensor= !!ps.sensor;
            B.parent=this;
            if(_S.hit(obj,B)){
              if(B.m5.sensor){
                Mojo.emit(["2d.sensor",obj],B); } }
          }
        }
        return super.collideXY(obj);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class AStarAlgos{
      constructor(straightCost,diagonalCost){
        this.straightCost= straightCost;
        this.diagonalCost= diagonalCost;
      }
      manhattan(test, dest){
        return abs(test.row - dest.row) * this.straightCost +
               abs(test.col - dest.col) * this.straightCost
      }
      euclidean(test, dest){
        let vx = dest.col - test.col;
        let vy = dest.row - test.row;
        return int(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let vx = abs(dest.col - test.col);
        let vy = abs(dest.row - test.row);
        return (vx > vy) ? int(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : int(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      TiledScene,
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
        let a= [index-w-1, index-w, index-w+1, index-1];
        let b= [index+1, index+w-1, index+w, index+w+1];
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
        !is.vec(sprites) ? _mapper(sprites) : sprites.forEach(_mapper);
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
                                        col:i%W, row:int(i/W)}));
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
            theShortestPath.unshift(tn); } }
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
        let numPts = int(len/segment);
        let len2,x,y,ux,uy,points = [];
        for(let c,i = 1; i <= numPts; ++i){
          c= Mojo.Sprites.centerXY(s1);
          len2 = segment * i;
          ux = v[0]/len;
          uy = v[1]/len;
          //Use the unit vector and newMagnitude to figure out the x/y
          //position of the next point in this loop iteration
          x = int(c[0] + ux * len2);
          y = int(c[1] + uy * len2);
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
               (angles.length === 0 || angles.some(x=> x === angle)) },
      /**Get indices of orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      crossCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w, index - 1, index + 1, index + w] },
      /**Get orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getCrossTiles(index, tiles, world){
        return this.crossCells(index,world).map(c=> tiles[c]) },
      /**Get the indices of corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {number|object} world
       * @return {number[]}
       */
      getDiagonalCells(index, world){
        const w= is.num(world)?world:world.tiled.tilesInX;
        return [index-w-1, index-w+1, index+w-1, index+w+1] },
      /**Get the corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getDiagonalTiles(index, tiles, world){
        return this.getDiagonalCells(index,world).map(c=> tiles[c]) },
      /**Get all the valid directions to move for this sprite.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} sprite
       * @param {any[]} tiles
       * @param {number} validGid
       * @param {object} world
       * @return {any[]}
       */
      validDirections(sprite, tiles, validGid, world){
        const pos= this.getTileIndex(sprite, world);
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
               dirs.length===1 || ((up||down) && (left||right)); },
      /**Randomly choose the next direction.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length===0 ? Mojo.NONE
                               : (dirs.length===1 ? dirs[0]
                                                  : dirs[_.randInt2(0, dirs.length-1)]) },
      /**Find the best direction from s1 to s2.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      closestDirection(s1, s2){
        const v= _getVector(s1,s2);
        return abs(v[0]) < abs(v[1]) ? ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN)
                                     : ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT) }
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


