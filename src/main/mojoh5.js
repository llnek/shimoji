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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /** Supported file extensions. */
  const
    BMFNT_EXTS= ["fnt"],
    AUDIO_EXTS= ["mp3", "wav", "ogg"],
    FONT_EXTS = ["ttf", "otf", "ttc", "woff"],
    IMAGE_EXTS= ["jpg", "png", "jpeg", "gif","webp"];

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  ////////////////////////////////////////////////////////////////////////////
  function _module(cmdArg, _BgTasks){

    ////////////////////////////////////////////////////////////////////////////
    //import mcfud's core module
    ////////////////////////////////////////////////////////////////////////////
    const
      {EventBus,dom,is,u:_} = gscope["io/czlab/mcfud/core"](),
      _V = gscope["io/czlab/mcfud/vec2"](),
      _M = gscope["io/czlab/mcfud/math"](),
      EBus= EventBus(),
      int=Math.floor,
      _DT15=1/15;

    ////////////////////////////////////////////////////////////////////////////
    //to control game processing
    let _paused = false;
    ////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Mojo
     */
    ////////////////////////////////////////////////////////////////////////////
    class SSheetFrame{
      #sheet;
      #frame;
      constructor(s,f){
        this.#sheet=s;
        this.#frame=f;
      }
      get frame(){ return this.#frame }
      get sheet(){ return this.#sheet }
      toString(){ return `${this.#sheet}::${this.#frame}` }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Main Stage class, holds scenes or scene-wrappers. */
    ////////////////////////////////////////////////////////////////////////////
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
          s.onCanvasResize(curSize[0], curSize[1]);
        });
        Mojo.Input.resize();
      }
    }

    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      assetFiles: [],
      logos: [],
      aniFps: 12,
      fps: 60
    });
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    /**Provide the size of the browser window */
    ////////////////////////////////////////////////////////////////////////////
    function _width(){
      return window.innerWidth ||
      document.documentElement.clientWidth || document.body.clientWidth;
    }
    function _height(){
      return window.innerHeight ||
      document.documentElement.clientHeight || document.body.clientHeight;
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Built-in progress bar, shown during the loading of
     * assets if no user-defined load function is provided.
     */
    ////////////////////////////////////////////////////////////////////////////
    function _PBar(Mojo){
      const
        cy= int(Mojo.height/2),
        cx= int(Mojo.width/2),
        w4= int(Mojo.width/4),
        K=Mojo.getScaleFactor(),
        bgColor=0x404040,
        fgColor=0xff8a00,
        WIDTH=w4*2,
        RH=48*K,
        Y=cy-RH/2;

      return{
        init(){
          this.perc=Mojo.Sprites.text("0%", {fontSize: int(RH/2),
                                      fill:"black", fontFamily:"sans-serif"});
          this.fg=Mojo.Sprites.rect(cx, RH, fgColor);
          this.bg=Mojo.Sprites.rect(cx, RH, bgColor);
          _V.set(this.bg, cx-w4, Y);
          _V.set(this.fg, cx-w4+1, Y);
          _V.set(this.perc, cx-w4+10, int(cy-this.perc.height/2));
          this.insert(this.bg);
          this.insert(this.fg);
          this.insert(this.perc);
        },
        update(progress){
          _.log(`progr= ${progress*100}`);
          this.fg.width = WIDTH*progress;
          this.perc.text=`${Math.round(progress*100)}%`;
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** standard logo */
    ////////////////////////////////////////////////////////////////////////////
    function _LogoBar(Mojo){
      return {
        init(){
          let
            logo=Mojo.Sprites.sprite("boot/ZotohLab_x1240.png"),
            pbar=Mojo.Sprites.sprite("boot/preloader_bar.png"),
            pbar2=Mojo.Sprites.sprite("boot/preloader_bar.png"),
            [w,h]=Mojo.scaleXY([logo.width,logo.height],
                               [Mojo.width,Mojo.height]),
            K=Mojo.getScaleFactor(),
            k= w>h?h:w;
          k *= 0.2;
          Mojo.Sprites.scaleXY(pbar2,k,k);
          Mojo.Sprites.scaleXY(pbar,k,k);
          Mojo.Sprites.scaleXY(logo,k,k);
          Mojo.Sprites.pinCenter(this,logo);
          Mojo.Sprites.pinBelow(logo,pbar,4*K);
          Mojo.Sprites.pinBelow(logo,pbar2,4*K);
          Mojo.Sprites.opacity(pbar2,0.3);
          this.insertEx([logo,pbar2,pbar]);
          this.g.pbar=pbar;
          this.g.pbar_width=pbar.width;
        },
        update(progress){
          //_.log(`progr= ${progress}`);
          this.g.pbar.width = this.g.pbar_width*progress;
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** @ignore */
    function _loadScene(obj){
      const z= new Mojo.Scenes.Scene("loader",{
        setup(){
          obj.init.call(this)
        }
      },{});
      return Mojo.stage.addChild(z).runOnce();
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Once all the files are loaded, do some post processing.
     */
    function _postAssetLoad(Mojo,ldrObj,scene,error){
      if(ldrObj)
        Mojo.delBgTask(ldrObj);
      _.delay(50,()=>{
        Mojo.Scenes.remove(scene);
        error? _.error("Cannot load game!"): Mojo._runAppStart()
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** Fetch sound files
    */
    async function _getSnd(url){
      const res = await PIXI.DOMAdapter.get().fetch(url);
      const b=await res.arrayBuffer();
      const i=url.lastIndexOf("/");
      const name= i>0 ? url.substring(i+1) : url;
      return {name, url, buffer:b}
    }

    ////////////////////////////////////////////////////////////////////////////
    /** Decode the loaded sound files
    */
    function _preloadSounds(sfiles,cb){
      let fcnt=sfiles.length;
      function onDone(){ _.delay(0, ()=> cb()) }
      function _m1(b){ --fcnt; if(fcnt==0) onDone(); }
      sfiles.forEach(f=>{
        _getSnd(f).then(r=>{
          Mojo.Sound.decodeData(r.name, r.url, r.buffer, _m1)
        });
      })
      if(fcnt==0){ onDone() }
      return fcnt;
    }

    ////////////////////////////////////////////////////////////////////////////
    /* */
    ////////////////////////////////////////////////////////////////////////////
    async function _grabBMapFonts(bfiles, cb){
      let err=0, p=[];
      bfiles.forEach(b=>{ p.push(PIXI.Assets.load(b)); })
      Promise.allSettled(p).then(a=>{
        a.forEach(r => r.status=="rejected" ? err++ : 0);
        if(err>0)
          _.error("Failed to load bitmap fonts");
        else
          _.delay(0, ()=> cb());
      });
    }

    ////////////////////////////////////////////////////////////////////////////
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function _trickBrowserToLoadFonts(ffiles){
      let family, face, span, style;
      ffiles.forEach(f=>{
        style= dom.newElm("style");
        span= dom.newElm("span");
        face= `@font-face {font-family: '${f.family}'; src: url('${f.url}');}`;
        _.log(`loading fontface = ${face}`);
        dom.conj(style,dom.newTxt(face));
        dom.conj(document.head,style);
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
      });
    }

    ////////////////////////////////////////////////////////////////////////////
    /** Fetch required files. */
    function _loadFiles(Mojo){
      let rc,scene,pg=[], ecnt=0, cbObj=Mojo.u.load;
      let sfiles=[], ffiles=[], wanted=[];

      ////////////////////////////////////////////////////////////////////////////
      //deal with web fonts?
      Mojo.u.assetFiles.forEach(f=>{
        if(is.obj(f)){
          _.has(FONT_EXTS, _.fileExt(f.url)) ? ffiles.push(f) : 0
        }else if(is.str(f)){
          f=Mojo.assetPath(f);
          _.has(AUDIO_EXTS, _.fileExt(f)) ? sfiles.push(f) : wanted.push(f)
        }
      });
      _trickBrowserToLoadFonts(ffiles);

      ////////////////////////////////////////////////////////////////////////////
      //select the loader scene
      if(!cbObj)
        cbObj= 1 ? _LogoBar(Mojo) : _PBar(Mojo);

      ////////////////////////////////////////////////////////////////////////////
      //run the loader scene
      if(1){
        const z= new Mojo.Scenes.Scene("loader",{
          setup(){ cbObj.init.call(this) }
        },{});
        scene=Mojo.stage.addChild(z).runOnce();
      }

      ////////////////////////////////////////////////////////////////////////////
      function loadOthers(r1){
        function fz(s){ _.log(`loaded ${s}`) }
        _preloadSounds(sfiles,()=>{
          let cnt=0;
          for(const [k, v] of Object.entries(r1)){
            ++cnt; fz(k); Mojo._cache[k]=v;
          }
          sfiles.forEach(fz);
          _.log(`completed loading of ${cnt+sfiles.length} files.`);
          //indicate end of load
          pg.unshift("$");
        });
      }

      ////////////////////////////////////////////////////////////////////////////
      //load images, json...etc first
      PIXI.Assets.load(wanted, (p)=>{
        pg.unshift(p)
      }).then(r=>{
        _.delay(0,()=> loadOthers(r))
      }).catch(err=>{
        ++ecnt;
        _.error(`Failed to load all assets: ${err}`)
      });

      ////////////////////////////////////////////////////////////////////////////
      //for the loading scene...
      Mojo.addBgTask({
        update(){
          if(pg.length==0){
          }else{
            let n= pg.pop();
            if(is.num(n)){
              n && cbObj.update.call(scene,n);
            }
            else if(n=="$"){
              _.delay(800,()=> _postAssetLoad(Mojo,this,scene,ecnt>0))
            }else{
              _.error("Fatal error while loading assets");
            }
          }
        }
      });

      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      return Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Bootup MojoH5 */
    ////////////////////////////////////////////////////////////////////////////
    function _boot(Mojo){

      //enforce canvas size
      Mojo._canvasObj.height= _height();
      Mojo._canvasObj.width= _width();
      Mojo._canvasObj.focus();
      Mojo.scroll();
      _.log(`canvas size= w:${Mojo.canvas.width},h=${Mojo.canvas.height}`);

      //sync to new size
      Mojo.prevHeight=_height();
      Mojo.prevWidth=_width();

      if(!Mojo.u.load)
        //use default boot logos
        Mojo.u.logos=["boot/preloader_bar.png",
                      "boot/ZotohLab_x1240.png"];
      let
        ecnt=0,
        bFiles=Mojo.u.logos.map(f=> Mojo.assetPath(f));

      PIXI.Assets.init();

      (async (rc,ks)=>{
        try{
          rc=await PIXI.Assets.load(bFiles);
          ks=Object.keys(rc);
        }catch(e){
          _.error(e);
        }
        if(ks && bFiles.length == ks.length){
          ks.forEach(k=> _.log(`loaded logo file "${k}"`));
          _.delay(50,()=>_loadFiles(Mojo));
        }else{
          _.log(`logo files not loaded!`)
        }
      })();

      return Mojo;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      _ScrSize={width:0,height:0},
      _Size11={width:1,height:1},
      _CT="body, * {padding: 0; margin: 0; height:100%; overflow:hidden}";

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function _configCanvas(arg){
      let
        p= { "outline":"none" },
        style= dom.newElm("style");

      dom.conj(document.body, Mojo._canvasObj);
      dom.conj(style, dom.newTxt(_CT));
      dom.conj(document.head,style);
      //p["image-rendering"]= arg.rendering || "pixelated";
      //p["image-rendering"]= arg.rendering || "crisp-edges";
      dom.css(Mojo._canvasObj,p);
      dom.attrs(Mojo._canvasObj,"tabindex","0");
      dom.css(document.body,{"background":"black"});
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Main */
    ////////////////////////////////////////////////////////////////////////////
    function _prologue(Mojo){

      let
        maxed=false,
        box= cmdArg.arena;

      _.assert(box,"design resolution req'd.");

      ////////////////////////////////////////////////////////////////////////////
      //want canvas max screen?
      if(cmdArg.scaleToWindow=="max"||
         cmdArg.scaleToWindow===true){
        maxed=true;
        box={width: _width(),
             height: _height()};
        if(cmdArg.arena.scale==1){
          //max but no scaling
          maxed=false;
          cmdArg.arena=box;
          cmdArg.scaleToWindow="win";
        }
      }

      Mojo.maxed=maxed;

      if(!cmdArg.logos)
        cmdArg.logos=new Array();

      //realize the renderer
      (async ()=>{
        Mojo.ctx= await PIXI.autoDetectRenderer(_.inject(box,{
          webgpu:{ antialias: true},
          webgl:{ antialias: true}
        }))
        _begin(Mojo,cmdArg);
      })();
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Main's Helper */
    ////////////////////////////////////////////////////////////////////////////
    function _begin(Mojo,cmdArg){

      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo._canvasObj = Mojo.ctx.canvas;
      Mojo._canvasObj.id="mojoh5";
      Mojo.scale=1;
      Mojo.scaledBgColor= "#5A0101";
      Mojo.stage= new PixiStage();

      ////////////////////////////////////////////////////////////////////////////
      //install these modules, order is important!
      ["Sprites","Input","Scenes",
       "Sound","FX","Ute2D","Tiles","Touch"].forEach(s=>{
         _.log(`installing module ${s}...`);
         let m=gscope[`io/czlab/mojoh5/${s}`](Mojo);
         m.assets?.forEach(a=> Mojo.u.assetFiles.unshift(a))
      });

      //register built-in tasks
      _BgTasks.push(Mojo.FX);
      _configCanvas(cmdArg);

      if(_.has(cmdArg,"border"))
        dom.css(Mojo.canvas, "border", cmdArg.border);

      if(_.has(cmdArg,"bgColor"))
        Mojo.ctx.backgroundColor = Mojo.Sprites.color(cmdArg.bgColor);

      ////////////////////////////////////////////////////////////////////////////
      //not thoroughly supported nor tested :)
      //keep track of current size, for resize purpose
      Mojo.prevHeight=0;
      Mojo.prevWidth=0;
      if(cmdArg.resize === true){
        _.addEvent("resize", gscope, _.debounce(e=>{
          //save the current size and tell others
          const [w,h]=[Mojo.prevWidth, Mojo.prevHeight];
          Mojo.ctx.resize(_width(),_height());
          Mojo.emit(["canvas.resize"],[w,h]);
          //sync to new size
          Mojo.prevWidth=_width();
          Mojo.prevHeight=_height();
        },cmdArg.debounceRate||150));
        Mojo.on(["canvas.resize"], o=> S.onResize(Mojo,o))
      }

      if(1 || Mojo.touchDevice){
        //deal with mobile browser not opening to full screen size correctly
        //finally boot up Mojo
        gscope.setTimeout(function(){ _boot(Mojo ) },1000);
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Code to run per tick */
    ////////////////////////////////////////////////////////////////////////////
    function _update(dt){
      Mojo._curFPS=Mojo.calcFPS(dt);
      //process any backgorund tasks
      _BgTasks.forEach(m=> m.update?.(dt));
      //update all scenes
      _paused ? 0 : Mojo.stageCS(s=> s.update?.(dt));
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function _draw(dt){ Mojo.ctx.render(Mojo.stage) }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    const _raf=(cb)=> gscope.requestAnimationFrame(cb);
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    /** @abstract */
    ////////////////////////////////////////////////////////////////////////////
    class Mediator{
      constructor(){
        this.players=[];
        this._pcnt=0;
        this.state;
        this.pcur;
        this.end;
        this.pwin;
      }
      cur(){
        return this.pcur }
      add(p){
        p.pnum= ++this._pcnt;
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
      updateSound(actor){}
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

    ////////////////////////////////////////////////////////////////////////////
    /** @abstract */
    ////////////////////////////////////////////////////////////////////////////
    class Player{
      constructor(uid){
        this.uid=uid;
      }
      playSound(){}
      pokeMove(){
        //console.log(`player ${this.uid}: poked`);
        this.onPoke();
      }
      pokeWait(){
        //console.log(`player ${this.uid}: wait`);
        this.onWait();
      }
      uuid(){ return this.uid }
      stateValue(){ _.assert(false,"implement stateValue!") }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** @abstract */
    ////////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////////
    /** @abstract */
    ////////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    const Mojo={
      //for world/screen conversions
      _offsetX:0,
      _offsetY:0,
      _scaleX:1,
      _scaleY:1,
      //panning and zooming
      _selectedCellX:0,
      _selectedCellY:0,
      _startPanX:0,
      _startPanY:0,
      //default fps
      _curFPS:60,
      Bot,
      Local,
      Mediator,
      SSheetFrame,
      UNSCII: "unscii",
      DOKI_LOWER:"Doki Lowercase",
      BIGSHOUTBOB: "Big Shout Bob",
      COPYRIGHT: "(c) www.zotohlab.com 2022-2024.",
      //secs per frame
      _frame:1/cmdArg.fps,
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
      PI_45:Math.PI/4,
      PI_90:Math.PI/2,
      PI_180:Math.PI,
      PI_270:Math.PI*1.5,
      PI_360:Math.PI*2,
      v2:_V,
      math:_M,
      ute:_,
      is,
      dom,
      /**User configuration.
       * @memberof module:mojoh5/Mojo */
      u:cmdArg,
      /**Storage for all game data.
       * @memberof module:mojoh5/Mojo */
      Game:{mode:1},
      _cache:{},
      MODE_ONE:1,
      MODE_TWO:2,
      MODE_NET:3,
      CON:console,
      noop: ()=>{},
      warn(...args){ console.warn(...args) },
      get mouse(){ return Mojo.Input.pointer() },
      /**Play a sound effect.
       * @memberof module:mojoh5/Mojo
       * @param {string} snd
       * @return {object}
       */
      playSfx(snd){ return this.sound(snd).play() },
      /**Linear acceleration.
       * @memberof module:mojoh5/Mojo
       * @param {number} vel
       * @param {number} acc
       * @param {number} dt
       * @return {number} new velocity
       */
      accel(vel,acc,dt){ return vel+acc*dt },
      /**
      */
      on(...args){
        return EBus.sub(...args)
      },
      /**
      */
      emit(...args){
        return EBus.pub(...args)
      },
      /**
      */
      off(...args){
        return EBus.unsub(...args)
      },
      /**
      */
      ssf(s,f){
        return new this.SSheetFrame(s,f);
      },
      /**Get the seconds per frame.
       * @memberof module:mojoh5/Mojo
       * @return {number}
       */
      frameRate(){
        return this._frame;
      },
      /**Check if enum `d` is on the right hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideRight(d){
        return d==Mojo.RIGHT || d==Mojo.NE || d==Mojo.SE },
      /**Check if enum `d` is on the left hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideLeft(d){
        return d==Mojo.LEFT || d==Mojo.NW || d==Mojo.SW },
      /**Check if enum `d` is on the top hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideTop(d){
        return d==Mojo.UP || d==Mojo.TOP || d==Mojo.NW || d==Mojo.NE },
      /**Check if enum `d` is on the bottom hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideBottom(d){
        return d== Mojo.DOWN || d==Mojo.BOTTOM || d==Mojo.SW || d==Mojo.SE },
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
      /**Check if 2 bboxes overlaps on the X axis.
       * @memberof module:mojoh5/Mojo
       * @param {object} a
       * @param {object} b
       * @return {boolean}
       */
      overlapX(a,b){
        return a.x2>b.x1 && b.x2>a.x1
      },
      /**Check if 2 bboxes overlaps on the Y axis.
       * @memberof module:mojoh5/Mojo
       * @param {object} a
       * @param {object} b
       * @return {boolean}
       */
      overlapY(a,b){
        return a.y2>b.y1 && b.y2>a.y1
      },
      /**Check if this element contains a class name.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {boolean}
       */
      hasClass(e,c){
        if(c)
          return e.classList.contains(c)
        //return new RegExp(`(\\s|^)${c}(\\s|$)`).test(e.className)
      },
      /**Toggle a class name in this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      toggleClass(e,c){
        if(c) e.classList.toggle(c);
        return e;
      },
      /**Add a class name to this element.
       * @memberof module:mojoh5/Mojo
       * @param {Element} e
       * @param {string} c
       * @return {Element} e
       */
      addClass(e,c){
        if(!_.hasClass(e,c)) e.classList.add(c);
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
          e.classList.remove(c);
          //e.className= e.className.replace(new RegExp(`(\\s|^)${c}(\\s|$)`), "");
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
      /**Get the 2d htnml5 canvas object.
       * @memberof module:mojoh5/Mojo
       * @name canvas
       * @return {object}
       */
      get canvas(){ return this._canvasObj },
      /**Get the loaded resources.
       * @memberof module:mojoh5/Mojo
       * @name assets
       * @return {object} resouces
       */
      get assets(){ return PIXI.Assets.cache._cache },
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
        if(this.inModal){
          cb( _.last(this.stage.children))
        }else{
          this.stage.children.forEach(s=>{
            if(s instanceof Mojo.Scenes.SceneWrapper){ s=s.children[0] }
            if(s) cb(s)
          })
        }
      },
      /**Move this item to become the topmost child.
       * @memberof module:mojoh5/Mojo
       * @param {Container} s
       * @return {Container} s
       */
      moveToTop(s){
        let gp=s.parent;
        if(gp){
          gp.removeChild(s);
          gp.addChild(s);
        }
        return s;
      },
      /**
      */
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
      screenCenter(){ return _.v2(int(Mojo.width/2), int(Mojo.height/2)) },
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
      makeAnchor(x,y){ return new PIXI.ObservablePoint(this,x, y ?? x) },
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
                             width: width ?? Mojo.width,
                             height: height ?? Mojo.height};
        self.getGlobalPosition=()=>{ return {x: this.x, y: this.y} };
        self.anchor=Mojo.makeAnchor(0,0);
        self.m5={stage:true};
        return self;
      },
      /**Get a cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {any} x
       * @return {Texture}
       */
      tcached(x){
        return _.inst(PIXI.Texture,x)?x
          : is.str(x)? (this._cache[x] || PIXI.Assets.cache._cache.get(x)) : UNDEF;
      },
      /**Click to play message.
       * @memberof module:mojoh5/Mojo
       * @return {string}
       */
      clickPlayMsg(){
        return `${this.touchDevice?"Tap":"Click"} to Play!`
      },
      /**Converts the position into a [col, row] for grid oriented processing.
       * @memberof module:mojoh5/Mojo
       * @param {number} pos
       * @param {number} width
       * @return {number[]} [col,row]
       */
      splitXY(pos,width){ return [pos%width, int(pos/width)] },
      /**Create a PIXI Rectangle.
       * @memberof module:mojoh5/Mojo
       * @param {number} x
       * @param {number} y
       * @param {number} w
       * @param {number} h
       * @return {Rectangle}
       */
      rect(x,y,w,h){ return new PIXI.Rectangle(x,y,w,h) },
      /**Scale the `src` size against `des` size.
       * @memberof module:mojoh5/Mojo
       * @param {object} src
       * @param {object} des
       * @return {object} {width,height}
       */
      scaleSZ(src,des){
        return { width: des.width/src.width,
                 height: des.height/src.height} },
      /**Get a frame in a spritesheet.
       * @memberof module:mojoh5/Mojo
       * @param {string} name
       * @return {PIXI.Texture}
       */
      sheet(name,frame){
        const ssObj=this.resource(name);
        _.assert(ssObj, `unknown sheet: ${name}.`);
        _.assert(is.obj(ssObj.data) && is.obj(ssObj.textures), `bad sheet: ${name}`);
        return ssObj.textures[frame];
      },
      /**Get the cached image.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {PIXI.Texture}
       */
      image(n){ return this.resource(n) },
      /**Get the cached XML file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      xml(n){ return this.resource(n) },
      /**Get the cached JSON file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      json(n){ return this.resource(n) },
      /**Get the relative path for this file.
       * @memberof module:mojoh5/Mojo
       * @param {string} name
       * @return {string}
       */
      assetPath(fname,out){
        if(is.str(fname)){
          if(fname.includes("/")){out= fname}else{
            let pfx="data",
                ext= _.fileExt(fname);
            //if(ext) ext=ext.substring(1);
            if(_.has(IMAGE_EXTS,ext)){
              pfx="images"
            }else if(_.has(BMFNT_EXTS,ext) ||
                     _.has(FONT_EXTS,ext)){
              pfx="fonts"
            }else if(_.has(AUDIO_EXTS,ext)){
              pfx="audio"
            }
            out= `${pfx}/${fname}`;
          }
        }
        return out || "";
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
          return (cmdArg.scaleFit=="x"||cmdArg.scaleFit=="X") ?z.width
                                      :((cmdArg.scaleFit=="y"||cmdArg.scaleFit=="Y") ?z.height:Math.min(z.width,z.height)); } },
      /**Get the named resource from the asset cache.
       * @memberof module:mojoh5/Mojo
       * @param {string} x
       * @param {boolean} [panic] if not found throws exception
       * @return {any}
       */
      resource(x,panic){
        let p,t;
        if(_.inst(this.SSheetFrame,x)){
          t=this.sheet(x.sheet,x.frame);
        }else if (x){
          p=this.assetPath(x)
          t= this.tcached(x) || this.tcached(p) || PIXI.Texture.from(p);
        }
        return t || (panic ? _.assert(false, `no such resource ${x}.`) : UNDEF)
      },
      /**Add one or more children to container.
       * @memberof module:mojoh5/Mojo
       * @param {PIXI.Container} p
       * @param {...PIXI.Container} cs
       * @return {PIXI.Container} first child
       */
      addChild(p,c1,...cs){
        p.addChild(c1);
        cs.forEach(c=>p.addChild(c));
        return c1;
      },
      _fpsList:UNDEF,
      _fpsSum:0,
      /**Get the current frames_per_second (averaged).
       * @memberof module:mojoh5/Mojo
       * @param {number} dt
       * @return {number}
       */
      calcFPS(dt){
        let n,rc=0,size=60;
        if(dt>0){
          n=int(1/dt);
          if(!this._fpsList){
            this._fpsList=_.fill(size, n);
            this._fpsSum= size*n;
          }
          this._fpsSum -= this._fpsList.pop();
          this._fpsList.unshift(n);
          this._fpsSum += n;
          rc= int(this._fpsSum /size);
        }
        //console.log("rc===="+rc);
        return rc;
      },
      degToRad(d){
        return d * (Math.PI / 180) },
      radToDeg(r){
        return r * (180 / Math.PI) },
      addBgTask(t){ _BgTasks.push(t) },
      delBgTask(t){
        if(t){
          _.disj(_BgTasks,t);
          t.dispose && t.dispose();
        }
      },
      resume(){ _paused = false },
      pause(){ _paused = true },
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //THE FRAME LOOP
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      start(){
        let
          acc=0,
          last= _.now(),
          F=function(){
            let
              cur= _.now(),
              dts= (cur-last)/1000,
              diff=Mojo.frameRate();
            //console.log(`frames per sec= ${Math.floor(1/dts)}`);
            //limit the time gap between calls
            if(dts>_DT15) dts= _DT15;
            for(acc += dts; acc >= diff; acc -= diff){ _update(dts); }
            _draw(acc/diff);
            last = cur;
            _raf(F);
          };
        return _raf(F);
      },
      _runAppStart(){
        if(1){
          Mojo.Input.keybd(Mojo.Input.Q,()=>{ this.takeScreenShot() })
        }
        return Mojo.u.start(this)
      },
      takeScreenShot(){
        Mojo.ctx.extract.canvas(Mojo.stage).toBlob(b=>{
          const a = document.createElement("a");
          document.body.append(a);
          a.download = "screenshot";
          a.href = URL.createObjectURL(b);
          a.click();
          a.remove();
        }, "image/png");
      },
      worldToScreen(wx, wy){
        return [int((wx - this._offsetX) * this._scaleX),
                int((wy - this._offsetY) * this._scaleY)]
      },
      screenToWorld(sx, sy){
        return [sx / this._scaleX + this._offsetX,
                sy / this._scaleY + this._offsetY]
      }

    };

    if(1){
      let
        plat,
        tab=PIXI.isMobile.tablet,
        pho=PIXI.isMobile.phone;
      if(PIXI.isMobile.windows.device){
        plat=tab?"tablet":(pho?"phone":"windows")
      }else if(PIXI.isMobile.apple.device){
        plat=tab?"ipad":(pho?"iphone":"apple")
      }else if(PIXI.isMobile.android.device){
        plat="android"
      }else{
        plat=(tab||pho)?"mobile":"desktop"
      }
      _.log(`we are running on a ${plat} device`);
      _prologue(Mojo);
    }
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only!"
  }else{
    gscope.MojoH5=function(arg){ return _module(arg, []) }
    gscope.MojoH5Ldr=function(arg){ window.addEventListener("load",()=> gscope.MojoH5(arg)) }
  }

})(this);


