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
    AUDIO_EXTS= ["mp3", "wav", "ogg"],
    FONT_EXTS = ["ttf", "otf", "ttc", "woff"],
    IMAGE_EXTS= ["jpg", "png", "jpeg", "gif","webp"];

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  function _module(cmdArg, _BgTasks){

    ////////////////////////////////////////////////////////////////////////////
    //import mcfud's core module
    const
      {EventBus,dom,is,u:_} = gscope["io/czlab/mcfud/core"](),
      _V = gscope["io/czlab/mcfud/vec2"](),
      _M = gscope["io/czlab/mcfud/math"](),
      EBus= EventBus(),
      int=Math.floor,
      CON=console,
      _DT15=1/15;

    let _paused = false;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Mojo
     */

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

    //const _height=()=> document.documentElement.clientHeight;
    //const _width=()=> document.documentElement.clientWidth;
    const
      _width=()=> gscope.innerWidth,
      _height=()=> gscope.innerHeight;

    ////////////////////////////////////////////////////////////////////////////
    /**Built-in progress bar, shown during the loading of
     * assets if no user-defined load function is provided.
     */
    function _PBar(Mojo){
      const
        cy= int(Mojo.height/2),
        cx= int(Mojo.width/2),
        w4= int(Mojo.width/4),
        K=Mojo.getScaleFactor(),
        bgColor=0x404040,
        fgColor=0xff8a00,
        {Sprites}=Mojo,
        WIDTH=w4*2,
        RH=48*K,
        Y=cy-RH/2;
      return{
        init(){
          this.perc=Sprites.text("0%", {fontSize: int(RH/2),
                                        fill:"black",
                                        fontFamily:"sans-serif"});
          this.fg=Sprites.rect(cx, RH, fgColor);
          this.bg=Sprites.rect(cx, RH, bgColor);
          _V.set(this.bg, cx-w4, Y);
          _V.set(this.fg, cx-w4+1, Y);
          _V.set(this.perc, cx-w4+10, int(cy-this.perc.height/2));
          this.insert(this.bg);
          this.insert(this.fg);
          this.insert(this.perc);
        },
        update(progress){
          CON.log(`progr= ${progress*100}`);
          this.fg.width = WIDTH*progress;
          this.perc.text=`${Math.round(progress*100)}%`;
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** standard logo */
    function _LogoBar(Mojo){
      const {Sprites}=Mojo;
      return {
        init(){
          let
            logo=Sprites.sprite("boot/ZotohLab_x1240.png"),
            pbar=Sprites.sprite("boot/preloader_bar.png"),
            [w,h]=Mojo.scaleXY([logo.width,logo.height],
                               [Mojo.width,Mojo.height]),
            K=Mojo.getScaleFactor(),
            k= w>h?h:w;
          k *= 0.2;
          Sprites.scaleXY(pbar,k,k);
          Sprites.scaleXY(logo,k,k);
          Sprites.pinCenter(this,logo);
          Sprites.pinBelow(logo,pbar,4*K);
          Sprites.hide(pbar);
          Sprites.opacity(pbar,0.3);
          this.insertEx([logo,pbar]);
          this.g.pbar=pbar;
          this.g.pbar_width=pbar.width;
        },
        update(progress){
          CON.log(`progr= ${progress*100}`);
          this.g.pbar.visible?0:Sprites.show(this.g.pbar);
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
    function _maybeHandleAtlas(Mojo){
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Once all the files are loaded, do some post processing.
     */
    function _postAssetLoad(Mojo,ldrObj,scene,error){

      if(ldrObj)
        Mojo.delBgTask(ldrObj);

      error?0:_maybeHandleAtlas(Mojo);

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
    function _preloadSounds(sfiles){
      let fcnt=sfiles.length;
      function _m1(b){ --fcnt }
      sfiles.forEach(f=>{
        _getSnd(f).then(r=>{
          Mojo.Sound.decodeData(r.name, r.url, r.buffer, _m1)
        });
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** Fetch required files. */
    function _loadFiles(Mojo){
      let wanted=[], sfiles=[],ffiles=[];
      let family, face, span, style;

      //group various file types
      Mojo.u.assetFiles.forEach((f,ext)=>{
        if(is.obj(f)){
          _.has(FONT_EXTS, _.fileExt(f.url))?ffiles.push(f):0
        }else{
          f=Mojo.assetPath(f);
          ext=_.fileExt(f);
          _.has(AUDIO_EXTS,ext)? sfiles.push(f): wanted.push(f)
        }
      });

      //trick browser to load in font files.
      ffiles.forEach(f=>{
        style= dom.newElm("style");
        span= dom.newElm("span");
        face= `@font-face {font-family: '${f.family}'; src: url('${f.url}');}`;
        CON.log(`loading fontface = ${face}`);
        dom.conj(style,dom.newTxt(face));
        dom.conj(document.head,style);
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
      });

      let rc,scene,pg=[], ecnt=0, cbObj=Mojo.u.load;

      if(!cbObj)
        cbObj= 1 ? _LogoBar(Mojo) : _PBar(Mojo);
      scene=_loadScene(cbObj);

      PIXI.Assets.loader.load(wanted, (p)=>{
        CON.log(`percentage ${p}`);
        pg.unshift(p);
      }).then(r=>{
        let cnt=0,w=wanted.length;
        for(const [k, v] of Object.entries(r)){
          if(_.inst(PIXI.Texture, v)) v.source.scaleMode = 'linear';
          Mojo._cache[k]=v;
          ++cnt;
          CON.log(`loaded ${k}`);
        }
        CON.log(`loaded ${cnt} files, wanted ${w}... ${cnt==w?"Yippy":"Hmmmm"}...!`);
        pg.unshift("$");
      }).catch(err=>{
        ++ecnt;
        CON.error(`Failed to load all assets: ${err}`)
      });
      Mojo.addBgTask({
        update(){
          if(pg.length==0){
          }else{
            let n= pg.pop();
            if(is.num(n)){
              if(n){
                cbObj.update.call(scene,n);
              }
            }else if(n=="$"){
              if(ecnt==0 && sfiles.length>0){
                _preloadSounds(sfiles)
              }
              _.delay(800,()=> _postAssetLoad(Mojo,this,scene,ecnt>0))
            }else{
              CON.error("fatal error while loading assets");
            }
          }
        }
      });


      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      return Mojo.start(); // starting the game loop
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    }

    ////////////////////////////////////////////////////////////////////////////
    /** @ignore */
    function _boot(Mojo){
      if(!Mojo.u.load)
        //use default boot logos
        Mojo.u.logos=["boot/preloader_bar.png",
                      "boot/ZotohLab_x1240.png"];
      let
        ecnt=0,
        bFiles=Mojo.u.logos.map(f=> Mojo.assetPath(f));

      PIXI.Assets.init();

      (async()=>{
        let rc=UNDEF;
        try{
          rc=await PIXI.Assets.load(bFiles);
        }catch(e){
          CON.error(e);
        }
        if(rc && bFiles.length == Object.keys(rc).length){
          _.delay(50,()=>_loadFiles(Mojo));
          CON.log(`logo files loaded.`);
        }else{
          CON.log(`logo files not loaded!`)
        }
      })();

      return Mojo;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      _ScrSize={width:0,height:0},
      _Size11={width:1,height:1},
      _CT="body, * {padding: 0; margin: 0; height:100%; overflow:hidden}";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
    /** Main
    */
    function _prologue(Mojo){
      let
        maxed=false,
        box= cmdArg.arena;

      if(0 && PIXI.isMobile.phone){
        const msg="Mobile Phone not supported, please use a tablet.";
        alert(msg);
        _.assert(false, msg);
      }
      _.assert(box,"design resolution req'd.");

      //want canvas max screen
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
      (async()=>{
        Mojo.ctx= await PIXI.autoDetectRenderer(_.inject(box,{
          webgpu:{ antialias: true},
          webgl:{ antialias: true}
        }))
        _begin(Mojo,cmdArg);
      })();
    }

    ////////////////////////////////////////////////////////////////////////////
    /** Main Helper
    */
    function _begin(Mojo,cmdArg){

      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo._canvasObj = Mojo.ctx.canvas;
      Mojo._canvasObj.id="mojoh5";
      Mojo.scale=1;
      Mojo.scaledBgColor= "#5A0101";
      Mojo.stage= new PixiStage();

      //install modules
      ["Sprites","Input","Scenes", "Sound","FX","Ute2D","Tiles","Touch"].forEach(s=>{
         CON.log(`installing module ${s}...`);
         let m=gscope[`io/czlab/mojoh5/${s}`](Mojo);
         if(m.assets) m.assets.forEach(a=> Mojo.u.assetFiles.unshift(a))
      });

      //register built-in tasks
      _BgTasks.push(Mojo.FX, Mojo.Input);
      _configCanvas(cmdArg);

      if(_.has(cmdArg,"border"))
        dom.css(Mojo.canvas, "border", cmdArg.border);

      if(_.has(cmdArg,"bgColor"))
        Mojo.ctx.backgroundColor = Mojo.Sprites.color(cmdArg.bgColor);

      //not thoroughly supported nor tested :)
      //keep track of current size, for resize purpose
      Mojo.prevHeight=Mojo.height;
      Mojo.prevWidth=Mojo.width;
      CON.log(`canvas size= w:${Mojo.prevHeight},h=${Mojo.height}`);
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

      if(Mojo.touchDevice){
        Mojo.scroll()
      }

      Mojo._canvasObj.focus();

      return _boot(Mojo);
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Code to run per tick
    */
    function _update(dt){
      Mojo._curFPS=Mojo.calcFPS(dt);
      //process any backgorund tasks
      _BgTasks.forEach(m=> m.update?.(dt));
      //update all scenes
      _paused ? 0 : Mojo.stageCS(s=> s.update?.(dt));
    }

    ////////////////////////////////////////////////////////////////////////////
    function _draw(dt){
      Mojo.ctx.render(Mojo.stage)
    }

    ////////////////////////////////////////////////////////////////////////////
    const _raf=(cb)=> gscope.requestAnimationFrame(cb);
    //------------------------------------------------------------------------


    ////////////////////////////////////////////////////////////////////////////
    /** @abstract */
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
      on(...args){
        return EBus.sub(...args)
      },
      emit(...args){
        return EBus.pub(...args)
      },
      off(...args){
        return EBus.unsub(...args)
      },
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
      makeAnchor(x,y){ return new PIXI.ObservablePoint(this,x,y) },
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
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} s
       * @return {Texture}
       */
      KENLXXid(s){ return this.image(s) },
      /**Get the cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {Texture}
       */
      /**Get a frame in a spritesheet.
       * @memberof module:mojoh5/Mojo
       * @param {string} name
       * @return {Texture}
       */
      sheet(name,frame){
        const ssObj=this.resource(name);
        _.assert(ssObj, `unknown sheet: ${name}.`);
        _.assert(is.obj(ssObj.data) && is.obj(ssObj.textures), `bad sheet: ${name}`);
        return ssObj.textures[frame];
      },
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
            }else if(ext=="fnt" ||
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
          n=_M.ndiv(1,dt);
          if(!this._fpsList){
            this._fpsList=_.fill(size, n);
            this._fpsSum= size*n;
          }
          this._fpsSum -= this._fpsList.pop();
          this._fpsList.unshift(n);
          this._fpsSum += n;
          rc= _M.ndiv(this._fpsSum ,size);
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

    return _prologue(Mojo);
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
  const BtnColors={
    blue:"#319bd5",
    green:"#78c03f",
    yellow:"#f9ef50",
    red:"#eb2224",
    orange:"#f48917",
    grey:"#848685",
    cyan:"#1ee5e6",
    lime:"#e5e61e",
    magenta:"#e61ee5",
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
  ////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  ////////////////////////////////////////////////////////////////////////////
  function _module(Mojo){

    const {v2:_V, math:_M, ute:_, is, dom} =Mojo;
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const PI2=Math.PI*2,
          int=Math.floor;

    /*PIXI code
      export type SCALE_MODE = | 'nearest' | 'linear';
      export type ALPHA_MODES = 'no-premultiply-alpha' | 'premultiply-alpha-on-upload' | 'premultiplied-alpha';
     export type LineCap = 'butt' | 'round' | 'square';
     export type LineJoin = 'round' | 'bevel' | 'miter';
    StrokeStyle extends FillStyle {
      //The color to use for the fill.
      color?: ColorSource;
      //The alpha value to use for the fill
      alpha?: number;
      //The texture to use for the fill.
      texture?: Texture | null;
      //The matrix to apply.
      matrix?: Matrix | null;
      //The fill pattern to use.
      fill?: FillPattern | FillGradient | null;
      //The width of the stroke.
      width?: number;
      //The alignment of the stroke.
      alignment?: number;
      // native?: boolean;
      //The line cap style to use.
      cap?: LineCap;
      //The line join style to use
      join?: LineJoin;
      //The miter limit to use.
      miterLimit?: number;
    }
    */

    ////////////////////////////////////////////////////////////////////////////
    /*Generate an actual Texture object */
    ////////////////////////////////////////////////////////////////////////////
    function _genTexture(dispObj, scaleMode, resolution, region){
      return new PIXI.GenerateTextureSystem(Mojo.ctx).generateTexture(dispObj)
    }

    ////////////////////////////////////////////////////////////////////////////
    //NOTE: ENSURE PIXI DOESN'T HAVE these SPECIAL PROPERTIES
    ////////////////////////////////////////////////////////////////////////////
    (function(c,g,s){
      g.circle(0, 0, 4); g.fill({color:0});
      s=new PIXI.Sprite(_genTexture(g));
      ["m5","tiled", "remove","collideXY","setup","preTMX","postTMX",
        "dispose","preDispose",
       "onTick","getGuid","getBBox", "getSpatial"].forEach(n=>{
        [[c,"Container"],[g,"Graphics"],[s,"Sprite"]].forEach(x=>{
          _.assertNot(_.has(x[0],n),`Uh Oh, PIXI ${x[1]} has our ${n} property!`)
        })
      })
    })(new PIXI.Container(),new PIXI.Graphics());

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Sprites
     */
    ////////////////////////////////////////////////////////////////////////////

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** yaxis down, default contact points, counter clockwise */
    ////////////////////////////////////////////////////////////////////////////
    function _corners(a,w,h){
      //starting with bottom right
      let out= [_V.vec(w,h), _V.vec(w,0), _V.vec(0,0), _V.vec(0,h)];
      //adjust for anchor?
      a ? out.forEach(r=>{ r[0] -= int(w * a.x); r[1] -= int(h * a.y); }) : 0;
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Override the control of animation */
    ////////////////////////////////////////////////////////////////////////////
    function _exASprite(s){
      let tid=0,_s={};
      function _reset(){
        if(tid)
          tid=clearInterval(tid)
      }
      function _adv(){
        if(_s.cnt < _s.total){
          s.gotoAndStop(s.currentFrame+1);
          _s.cnt += 1;
        }else if(s.loop){
          s.gotoAndStop(_s.start);
          _s.cnt=1;
        }else{
          _reset();
          s.onComplete?.();
        }
      }
      _.inject(s.m5,{
        stopFrames(){ _reset(); s.gotoAndStop(s.currentFrame) },
        showFrame(f){ _reset(); s.gotoAndStop(f) },
        playFrames(seq){
          _reset();
          _s.start=0;
          _s.end= s.totalFrames-1;
          if(is.vec(seq) && seq.length>1){
            _s.start=seq[0];
            _s.end=seq[1];
          }
          _s.total=_s.end-_s.start+1;
          s.gotoAndStop(_s.start);
          _s.cnt=1;
          tid= setInterval(_adv, 1000/Mojo.aniFps);
        }
      });
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Low level sprite creation. */
    ////////////////////////////////////////////////////////////////////////////
    function _sprite(src,ctor){
      let s,obj;
      if(_.inst(PIXI.Graphics,src)){
        src=_genTexture(src);
      }
      if(_.inst(PIXI.Texture,src)){
        obj=src
      }else if(is.vec(src)){
        if(is.str(src[0]))
          src=src.map(s=> Mojo.resource(s));
        s=_.inst(PIXI.Texture,src[0])? new PIXI.AnimatedSprite(src, false) : UNDEF;
      }else if(is.str(src)){
        obj= Mojo.resource(src);
      }
      if(obj)
        s=ctor(obj);
      return _.assert(s, `SpriteError: ${src} not found`) && s
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*core function to make 2D grids */
    ////////////////////////////////////////////////////////////////////////////
    function _mkgrid(sx,sy,rows,cols,cellW,cellH){
      let y1=sy, x1=sx, out=[];
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function _pininfo(ThisModule,o,p=UNDEF){
      let par,box;
      if(o && o.m5 && o.m5.stage){
        box={x1:0,y1:0, x2:Mojo.width, y2:Mojo.height};
      }else{
        if(o.angle !== undefined)
          _.assert(_.feq0(o.angle), "expected non rotated object!");
        par=o.parent;
        box=ThisModule.getAABB(o);
      }
      if(p && par===p){
        //account for the parent's position...
        box.x1 += p.x;
        box.x2 += p.x;
        box.y1 += p.y;
        box.y2 += p.y;
      }
      //give extra info back...
      return [box, _M.ndiv(box.x2-box.x1,2),//half width
                   _M.ndiv(box.y2-box.y1,2),//half height
                   _M.ndiv(box.x1+box.x2,2),//center x
                   _M.ndiv(box.y1+box.y2,2)]//center y
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //basic 2 body collision physics, assuming o1 hits o2
    ////////////////////////////////////////////////////////////////////////////
    function _bounceOff(o1,o2,m){
      if(o2.m5.static){
        //full bounce v=v - (1+c)(v.n_)n_
        _V.sub$(o1.m5.vel,
                _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN)))
      }else{
        let
          dd=_V.mul$(_V.sub(o2.m5.vel,o1.m5.vel),m.overlapN),
          k= -2 * (dd[0]+dd[1])/(o1.m5.invMass + o2.m5.invMass);
        _V.sub$(o1.m5.vel, _V.mul$(_V.div(m.overlapN,o1.m5.mass),k));
        _V.add$(o2.m5.vel, _V.mul$(_V.div(m.overlapN,o2.m5.mass),k));
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*Detect where the collision occurred */
    ////////////////////////////////////////////////////////////////////////////
    function _collideDir(col){
      const c=new Set();
      (col.overlapN[1] < -0.3) ? c.add(Mojo.TOP) :0;
      (col.overlapN[1] > 0.3) ? c.add(Mojo.BOTTOM) :0;
      (col.overlapN[0] < -0.3) ? c.add(Mojo.LEFT) :0;
      (col.overlapN[0] > 0.3) ? c.add(Mojo.RIGHT) : 0;
      c.add(col);
      return c;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //convert to std geometry for A hit B collision detection
    ////////////////////////////////////////////////////////////////////////////
    function _hitAB(S,a,b){
      let
        a_= S.toBody(a),
        m, b_= S.toBody(b);
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*A collides with B, elastic collision. */
    ////////////////////////////////////////////////////////////////////////////
    function _collideAB(S,a,b,bounce=true){
      let ret,d,m=_hitAB(S,a,b);
      if(m){
        if(b.m5.static){
          _V.sub$(a,m.overlapV)
        }else{
          d= _V.div(m.overlapV,2);
          _V.sub$(a,d);
          _V.add$(b,d);
        }
        bounce ? _bounceOff(a,b,m) : 0;
      }
      return m;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*For common movement */
    ////////////////////////////////////////////////////////////////////////////
    function SteeringInfo(){
      return{
        wanderAngle: _.rand()*Math.PI*2,
        arrivalThreshold: 400,
        wanderDistance: 10,
        wanderRadius: 5,
        wanderRange: 1,
        avoidDistance: 400,
        inSightDistance: 200,
        tooCloseDistance: 60,
        maxForce: 5,
        pathIndex:  0
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      SomeColors:{},
      BtnColors:{},
      Geo,
      assets: ["boot/unscii.fnt", "boot/doki.fnt",
               "boot/BIG_SHOUT_BOB.fnt", "boot/splash.jpg", "boot/star.png" ],
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      assertCenter(s){
        return _.assert(s?.anchor && _.feq(s.anchor.x,0.5) &&
                                     _.feq(s.anchor.y,0.5), "not center'ed") },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){
        return s && s.children.length == 0 },
      /**Emulate a button press
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} b
       * @param {number|string} clickedColor
       * @param {number|string} oldColor
       * @param {string} snd
       * @param {function} cb
       * @param {number} delayMillis
       * @return {function}
       */
      btnPress(b,c1,c0,snd,cb,delayMillis=343){
        const self=this;
        return function(arg){
          arg.tint=self.color(c1);
          snd ? Mojo.sound(snd).play() : 0;
          _.delay(delayMillis,()=>{ arg.tint=self.color(c0); cb(arg); })
        }
      },
      /**React to a one off click on canvas.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {string} snd
       * @return {function}
       */
      oneOffClick(cb,snd){
        const sub= function(){
          Mojo.Input.off(["single.tap"],sub);
          snd ? Mojo.sound(snd).play() : 0;
          cb();
        };
        Mojo.Input.on(["single.tap"],sub);
        return sub;
      },
      /**Cancel the a one off click.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @return {any} undefined
       */
      cancelOneOffClick(sub){
        sub ? Mojo.Input.off(["single.tap"],sub) : 0;
        return UNDEF;
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
      /**Set this as circular.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      asCircle(s){
        return (s.m5.circle=true) && s },
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
        return {width: int(s.width/2), height: int(s.height/2)} },
      /**Set the anchor.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      anchorXY(s,x,y){
        _.assert(s.anchor,"sprite has no anchor object");
        s.anchor.y=  y ?? x;
        s.anchor.x=x;
        return s;
      },
      /**Set sprite's anchor to be at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      centerAnchor(s){
        return this.anchorXY(s,0.5,0.5) },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){
        return this.anchorXY(s,0,0) },
      /**Calc the offset required to find the position of corners
       * in the object.  e.g. anchor is centered, but you want to
       * find the bottome right.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} tx target x
       * @param {number} ty target y
       * @return {number[]} [x,y]
       */
      offsetXY(s,tx,ty){
        _.assert(s.anchor&&tx>=0&&tx<=1&&ty>=0&&ty<=1,
                 "no anchor or bad target offset points");
        return [s.width * (tx-s.anchor.x), s.height * (ty-s.anchor.y)]
      },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return this.offsetXY(s, 0,0) },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return this.offsetXY(s, 0.5,0.5) },
      /**Calc the offset required to make the object appear to be
       * at this target anchor.  e.g. say the object's anchor is
       * (1,1) and is positioned at (0,0), so the bottom right
       * corner is sitting at the origin.  But if you wanted the
       * top left to sit at origin, how much do you need to move
       * the object?
       * @param {Sprite} s
       * @param {number} tx target x
       * @param {number} ty target y
       * @return {number[]} [x,y]
       */
      adjOffsetXY(s,tx,ty){
        _.assert(s.anchor&&tx>=0&&tx<=1&&ty>=0&&ty<=1,
                 "no anchor or bad target offset points");
        return [s.width * (s.anchor.x - tx), s.height * (s.anchor.y - ty) ]
      },
      /**Make this sprite steerable.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      makeSteerable(s){
        if(s.width != s.height)
          Mojo.CON.warn(`object ${s.m5?.uuid} is not a square, radius will be off....`);
        let {width,height}= this.halfSize(s);
        s.m5.steer=[0,0];
        s.m5.steerInfo=SteeringInfo();
        s.m5.radius=Math.sqrt(width*width+height*height);
        return s;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      updateSteer(s,reset=true){
        if(s.m5?.steer){
          _V.clamp$(s.m5.steer, 0, s.m5.steerInfo.maxForce);
          _V.div$(s.m5.steer,s.m5.mass);
          _V.add$(s.m5.vel, s.m5.steer);
          reset ? _V.mul$(s.m5.steer,0) : 0;
        }
        return s;
      },
      /**Clear spatial data.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      clrSpatial(s){
        if(s.m5?.sgrid){
          s.m5.sgrid.x1=UNDEF;
          s.m5.sgrid.x2=UNDEF;
          s.m5.sgrid.y1=UNDEF;
          s.m5.sgrid.y2=UNDEF;
        }
        return s;
      },
      /**Give some *mojo* to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      lift(s){
        if(!s.m5){
          const self=this;
          s.g={};
          s.m5={
            uuid: `s${_.nextId()}`,
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
            //maxSpeed:0,
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
          s.getBBox=function(){ return _.feq0(s.angle)?self.getAABB(s):self.boundingBox(s) };
        }
        return s;
      },
      /**Keep rotation in the range 0 - 2pi
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite}
       */
      clamp2Pi(s){
        while(s.rotation > PI2){ s.rotation -= PI2 }
        while(s.rotation < 0) { s.rotation += PI2 }
        return s;
      },
      /**Convert polar to cartesian
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {array} [cos,sin]
       */
      getHeading(s){
        return [Math.cos(s.rotation),Math.sin(s.rotation)]
      },
      /**Set the rotation value
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} v
       * @param {boolean} deg [false]
       * @return {Sprite} s
       */
      setOrient(s,v,deg=false){
        deg ? (s.angle=v) : (s.rotation=v);
        return s;
      },
      /**Convert sprite to a polygonal shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Polygon}
       */
      toPolygon(s){
        return new Geo.Polygon(s.m5.getContactPoints()).setOrient(s.rotation) },
      /**Convert sprite to a circular shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle}
       */
      toCircle(s){
        return this.assertCenter(s) &&
               new Geo.Circle(_M.ndiv(s.width,2)).setOrient(s.rotation) },
      /**For 2D physics, create a body.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Body}
       */
      toBody(s){
        let
          px=s.x,
          py=s.y,
          b=s.m5.circle? this.toCircle(s) : this.toPolygon(s);
        return Geo.bodyWrap(b,px,py);
      },
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
        return s.anchor ? _.feq0(s.anchor.x) && _.feq0(s.anchor.y) : true },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor? _.feq(s.anchor.x,0.5) && _.feq(s.anchor.y,0.5) : false },
      /**Get the center position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      centerXY(s){
        return this.isCenter(s)? _V.vec(s.x,s.y) : _V.add(this.centerOffsetXY(s),s) },
      /**PIXI operation, setting type of scaling to be used.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {boolean} b
       * @return {Sprite} s
       */
      setScaleModeNearest(s,b=true){
        s.texture.source.scaleMode = b ? "nearest" : "linear";
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
      /**Mark it as dead.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      die(s){
        s.m5.dead=true; return s; },
      /**Come back to life, from dead.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      undie(s){
        s.m5.dead=false; return s; },
      /**Move a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} dt
       * @return {Sprite} s
       */
      move(s,dt){
        if(dt){
          _V.add$(s.m5.vel,_V.mul(s.m5.gravity,dt));//deal with gravity
          _V.add$(s.m5.vel,_V.mul(s.m5.acc,dt));//deal with acceleration
          _V.mul$(s.m5.vel, s.m5.friction);//deal with friction
        }else{
          dt=1;
        }
        if(s.m5.maxSpeed !== undefined)
          _V.clamp$(s.m5.vel,0, s.m5.maxSpeed);
        //finally, update the sprite's x & y position
        return _V.add$(s,_V.mul(s.m5.vel,dt));
      },
      /**Get the left side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      leftSide(s){
        let
          x=s.x,
          w= s.width,
          ax= s.anchor?s.anchor.x:0;
        if(ax>0.7) x -= w;
        else if(ax>0) x -= _M.ndiv(w,2);
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
        let
          y= s.y,
          h= s.height,
          ay= s.anchor?s.anchor.y:0;
        if(ay>0.7) y -= h;
        else if(ay>0) y -= _M.ndiv(h,2);
        return y;
      },
      /**Get the bottom side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      bottomSide(s){
        // y-axis goes down, so bottom > top :)
        return this.topSide(s)+s.height },
      /**Get the sprite's bounding box, *ignoring* rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      getAABB(s){
        if(s.x1 !== undefined && s.y2 !== undefined){ return s }
        _.assert(s.m5, "bad sprite for getAABB");
        let
          {x1,y1,x2,y2}=s.m5.getImageOffsets(),
          l= this.leftSide(s),
          t= this.topSide(s),
          r=l+s.width,
          b=t+s.height;
        return { x1: l+x1 , y1: t+y1, x2: r-x2, y2: b-y2 }
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
        return _.assert(top <= bottom,"bad bbox") &&
               {x1: left, x2: right, y1: top, y2: bottom} },
      /**Find the center of a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxCenter(b4){
        if(is.num(b4.x1))
          return _V.vec(_M.ndiv(b4.x1+b4.x2,2),
                        _M.ndiv(b4.y1+b4.y2,2)) },
      /**Frame this box.
       * @memberof module:mojoh5/Sprites
       * @param {object} g
       * @param {number} width
       * @param {string|number} color
       * @return {Sprite}
       */
      bboxFrame(g,width=16,color="#dedede"){
        _.assert(g.x1 !== undefined,"bad bounding box");
        let {x1,x2,y1,y2}= g,
          w=x2-x1,
          h=y2-y1,
          s,gfx= this.graphics();
        gfx.roundRect(0,0,w+width,h+width,int(width/4));
        gfx.stroke({width,color:this.color(color)});
        s=this.sprite(gfx);
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
        return b4.x1 !== undefined ? _V.vec(b4.x2-b4.x1, b4.y2-b4.y1) : _.assert(false, "bad bounding box") },
      /**Check if point is inside this bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} x
       * @param {number} y
       * @param {object} {x1,x2,y1,y2}
       * @return {boolean}
       */
      pointInBBox(x,y,box){
        return box.x1 !== undefined && x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2 },
      /**Find the bounding box of a sprite, taking account of it's
       * current rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      boundingBox(s){
        if(!_.feq0(s.rotation))
          _.assert(this.isCenter(s),
                   "expected rotated obj with center-anchor");
        let c,z, x1,x2, y1,y2, x=[],y=[],
          hw=int(s.width/2),
          hh=int(s.height/2),
          theta=Math.tanh(hh/hw),
          H=Math.sqrt(hw*hw+hh*hh);
        //x2,y1
        z=PI2-theta + s.rotation;
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
        return {x1:int(x[0]+c[0]),
                x2:int(x[3]+c[0]),
                y1:int(y[0]+c[1]),
                y2:int(y[3]+c[1])}
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(px,py,s){
        const z=this.toBody(s);
        return s.m5.circle ? Geo.hitTestPointCircle(px,py,z)
                           : Geo.hitTestPointPolygon(px,py,z) },
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
       * @return {any} undefined
       */
      scaleContent(...args){
        if(args.length==1&&is.vec(args[0])){ args=args[0] }
        const K=Mojo.getScaleFactor();
        args.forEach(s=>{ s.scale.x *=K; s.scale.y *=K; })
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
        s.m5.uuid=id; return s },
      /**Set the transparency of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} v
       * @return {Sprite} s
       */
      opacity(s,v){
        s.alpha=v; return s },
      /**Set a sprite's color(tint).
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number|string} color
       * @return {Sprite} s
       */
      tint(s,color){
        s.tint= this.color(color); return s },
      /**Unset a sprite's visibility.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      hide(s){
        s.visible=false;return s},
      /**Set a sprite's visibility.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      show(s){
        s.visible=true;return s},
      /**Set a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @param {any} v
       * @return {Sprite} s
       */
      pset(s,p,v){
        s.g[p]=v; return s },
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
        const s= this.lift(new PIXI.Container());
        cb ? cb(s) : 0;
        return s;
      },
      /**Create a new Container object with these children.
       * @memberof module:mojoh5/Sprites
       * @param {...any} cs child objects
       * @return {Container}
       */
      group(...cs){
        const C= this.container();
        cs.forEach(c=> C.addChild(c));
        return C;
      },
      /**Create a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {boolean} center
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      sprite(src, center=false,x=0,y=0){
        const s= this.lift(_sprite(src, o=> new PIXI.Sprite(o)));
        s.x=x;
        s.y=y;
        center ? this.centerAnchor(s) : 0;
        return _.inst(PIXI.AnimatedSprite,s) ? _exASprite(s) : s;
      },
      /**Create a sprite from a spritesheet frame.
       * @memberof module:mojoh5/Sprites
       * @param {string} sheet
       * @param {string} frame
       * @param {boolean} center
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      spriteFrame(sheet,frame,center=false,x=0,y=0){
        return this.sprite(Mojo.sheet(sheet,frame),center,x,y)
      },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @return {Sprite}
       */
      tilingSprite(src, width,height){
        return this.lift(_sprite(src, o=> new PIXI.TilingSprite({
          texture:o,width:width||o.width, height:height||o.height
        })))
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
      repeatSprite(src,rx=true,ry=true,width=UNDEF,height=UNDEF){
        let self=this, s, out=[],x=0,y=0,w=0,h=0;
        function xx(){
          const s= self.lift(_sprite(src, o=> new PIXI.Sprite(o)));
          let K=Mojo.getScaleFactor();K=1;
          s.width *= K;
          s.height *= K;
          return s;
        }
        if(rx){
          while(w<width){
            out.push(s=xx());
            _V.set(s,x,y);
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
            _V.set(s,x,y);
            h += s.height;
            y += s.height;
            if(h>=height&& w< width && rx){
              w += s.width;
              x += s.width;
              y=0;
              h=0;
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
       * @return {AnimatedSprite}
       */
      animation(src, tileW, tileH, spacing=0){
        let t=Mojo.resource(src);
        if(!t)
          throw `SpriteError: ${src} not loaded.`;
        let
          cols = int(t.width/tileW),
          rows = int(t.height/tileH),
          pos= [], cells = cols*rows;
        for(let x,y,i=0; i<cells; ++i){
          x= (i%cols) * tileW;
          y= int(i/cols) * tileH;
          if(spacing>0){
            x += spacing + (spacing * i % cols);
            y += spacing + (spacing * int(i/cols));
          }
          pos.push(_V.vec(x,y));
        }
        return this.sprite(
          pos.map(p=> new PIXI.Texture({source: t.source,
                                        frame: new PIXI.Rectangle(p[0],p[1],tileW,tileH) })));
      },
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
        return this.sprite(new PIXI.Texture({source: Mojo.resource(src).source,
                                             frame: new PIXI.Rectangle(x, y, width,height)})) },
      /**Select a bunch of frames from image.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @param {number[][]} [[x,y]...]
       * @return {Texture[]}
       */
      frameSelect(src,width,height,selectors){
        return selectors.map(s=> new PIXI.Texture({source: Mojo.resource(src).source,
                                                   frame: new PIXI.Rectangle(s[0], s[1], width,height)})) },
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
        let dx=tileW+spaceX, dy=tileH+spaceY, out=[],
          t= Mojo.resource(src),
          rows= int(t.height/dy),
          cols= _M.ndiv(t.width+spaceX,dx);
        for(let y,r=0;r<rows;++r){
          y= sy + tileH*r;
          for(let x,c=0;c<cols;++c){
            x= sx + tileW*c;
            out.push(new PIXI.Texture({source:t.source,
                                       frame:new PIXI.Rectangle(x, y, tileW,tileH)})) }
        }
        return out;
      },
      /**Cross reference these images to their corresponding textures.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {Texture[]}
       */
      frameImages(...pics){
        if(pics.length==1
          && is.vec(pics[0])){ pics=pics[0] }
        return pics.map(p=> Mojo.resource(p));
      },
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
        return _V.set(this.lift(new PIXI.Text(msg,fspec)),x,y) },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fstyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(msg,name,size){
        //in pixi, no fontSize, defaults to 26, left-align
        let fstyle;
        msg = msg || "";
        if(is.str(name)){
          fstyle={fontFamily:name};
          if(is.num(size)) fstyle.fontSize=size;
        }else{
          fstyle=name;
        }
        if(!fstyle.fontFamily)
          fstyle.fontFamily= fstyle.fontName? fstyle.fontName : "unscii";
        if(!fstyle.align) fstyle.align="center";
        return this.lift(new PIXI.BitmapText({text:msg,style:fstyle}));
      },
      /**Create a triangle sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number} peak
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      triangle(width, height, peak,
               fillColor = 0xffffff,
               strokeColor = 0xffffff, lineWidth=0,x=0,y=0){
        let
          g=this.graphics(),
          a=1,w2=int(width/2),
          stroke=this.color(strokeColor),
          X= peak<0.5?0:(peak>0.5?width:w2);
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }
        }
        g.poly([0,0,X,-height,width,0]);
        if(fillColor !== false)
          g.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          g.stroke({width:lineWidth, color:stroke, alpha:1});
        let s= this.sprite(g);
        if(1){
          s.m5.getContactPoints= height<0 ?
            ()=>{ return [[X,-height],[width,0],[0,0]] }
            :
            ()=>{ return [[width,height],[X,0],[0,height]] }
        }
        return _V.set(s,x,y);
      },
      /**Create a rectangular sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {Sprite}
       */
      rect(width, height,
           fillColor = 0xffffff,
           strokeColor = 0xffffff, lineWidth=0){
        return this.sprite(this.rectTexture(width,height,fillColor,strokeColor,lineWidth)) },
      /**Draw a rectangle.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @return {PIXI.Graphics}
       */
      grect(gfx, x,y,width,height){
        gfx.rect(x,y,width,height); return gfx },
      /**Draw a circle.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {number} cx
       * @param {number} cy
       * @param {number} radius
       * @return {PIXI.Graphics}
       */
      gcircle(gfx, cx, cy, radius){
        gfx.circle(cx,cy,radius); return gfx },
      /**Fill graphics with texture.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {PIXI.Texture} t
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gfillEx(gfx, t, style){
        if(!style) style={};
        style.texture=t;
        gfx.texture(style);
        return gfx;
      },
      /**Clear graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @return {PIXI.Graphics}
       */
      gclear(gfx){
        return gfx.clear() },
      /**Draw a sequence of paths in graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {array} actions
       * @return {PIXI.Graphics}
       */
      gpath(gfx,actions){
        _.assert(is.vec(actions),"expected path actions!");
        actions.forEach(a=>{
          if(is.vec(a)){
            gfx[a.shift()].apply(gfx,a);
          }else if(is.str(a)){
            gfx[a]();
          }
        });
        return gfx;
      },
      /**Fill graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gfill(gfx, style){
        _.assert(is.obj(style),`expected fill style object`);
        gfx.fill(style);
        return gfx;
      },
      /**Stroke graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gstroke(gfx,style){
        _.assert(is.obj(style),`expected stroke style object`);
        gfx.stroke(style);
        return gfx;
      },
      /**Create a rectangular texture.
       * @param {number} width
       * @param {number} height
       * @param {string|number} fillColor
       * @param {string|number} strokeColor
       * @param {number} lineWidth [0]
       * @return {PIXI.Texture}
       */
      rectTexture(width, height,
                  fillColor = 0xffffff, strokeColor = 0xffffff, lineWidth=0){
        let a,gfx=this.graphics();
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }else{
            a=1;
          }
        }
        gfx.rect(0, 0, width,height);
        if(fillColor !== false)
          gfx.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          gfx.stroke({width:lineWidth, color:this.color(strokeColor)});
        return this.genTexture(gfx)
      },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        const gfx = this.graphics();
        cb.apply(this, [gfx].concat(args));
        return this.lift(new PIXI.Sprite(this.genTexture(gfx))) },
      /**Create a circular sprite by generating a texture.
       * @memberof module:mojoh5/Sprites
       * @param {number} radius
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {Sprite}
       */
      circle(radius, fillColor=0xffffff, strokeColor=0xffffff, lineWidth=0){
        return this.circleEx(this.circleTexture(radius,fillColor, strokeColor,lineWidth))
      },
      /**Create a circular texture.
       * @param {number} radius
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {PIXI.Texture}
       */
      circleTexture(radius, fillColor=0xffffff, strokeColor=0xffffff, lineWidth=0){
        let a,gfx = this.graphics();
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }else{
            a=1;
          }
        }
        gfx.circle(0, 0, radius);
        if(fillColor !== false)
          gfx.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          gfx.stroke({width:lineWidth, color:this.color(strokeColor)});
        return this.genTexture(gfx)
      },
      /**Create a sprite from this texture.
       * @param {PIXI.Texture} t
       * @return {PIXI.Sprite}
       */
      circleEx(t){
        const s= this.lift(new PIXI.Sprite(t));
        return (s.m5.circle=true) && this.centerAnchor(s) },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @param {number} alpha
       * @return {PIXI.Sprite}
       */
      line(strokeColor, lineWidth, A,B, alpha=1){
        let
          _a= _V.clone(A),
          _b= _V.clone(B),
          gfx = this.graphics(),
          s,stroke= this.color(strokeColor);
        function _draw(){
          gfx.clear();
          gfx.moveTo(_a[0], _a[1]);
          gfx.lineTo(_b[0], _b[1]);
          gfx.stroke({width:lineWidth, color:stroke, alpha});
        }
        _draw();
        s=this.lift(gfx);
        s.m5.ptA=function(x,y){
          if(x !== undefined){
            _a[0] = x; _a[1] = _.nor(y,x); _draw(); } return _a; };
        s.m5.ptB=function(x,y){
          if(x !== undefined){
            _b[0] = x; _b[1] = _.nor(y,x); _draw(); } return _b; };
        return s;
      },
      /**Check if a sprite is moving.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Sprite}
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
        let cols=_M.ndiv(ex-sx,cellW),
            rows=_M.ndiv(ey-sx,cellH);
        return _mkgrid(sx,sy,rows,cols,cellW,cellH) },
      /**Create a rectangular arena.
       * @memberof module:mojoh5/Sprites
       * @param {number} ratioX
       * @param {number} ratioY
       * @param {object} [parent]
       * @return {object}
       */
      gridBox(ratioX=0.9,ratioY=0.9,parent=UNDEF){
        let
          P= parent ?? Mojo,
          h=int(P.height*ratioY),
          w=int(P.width*ratioX),
          x1=_M.ndiv(P.width-w,2),
          y1=_M.ndiv(P.height-h,2);
        return {x1,y1,x2:x1+w,y2:y1+h};
      },
      /**Create a square grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dim
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridSQ(dim,ratio=0.9,out=UNDEF){
        let
          sz= ratio* (Mojo.height<Mojo.width?Mojo.height:Mojo.width),
          w=int(sz/dim), h=w;

        if(!_.isEven(w)){--w}
        h=w;
        sz=dim*w;

        let
          sy=_M.ndiv(Mojo.height-sz,2),
          sx=_M.ndiv(Mojo.width-sz,2),
          _x=sx,_y=sy;

        if(out){
          out.height=sz;
          out.width=sz;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
          //shove more info into out :)
          out.x1=sx; out.y1=sy;
          out.x2=sx+sz; out.y2=sy+sz;
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
      divXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=UNDEF){
        let
          szh=int(Mojo.height*ratioY),
          szw=int(Mojo.width*ratioX),
          cw=int(szw/dimX),
          ch=int(szh/dimY),
          _x,_y,sy,sx;
        szh=dimY*ch;
        szw=dimX*cw;
        sy= _M.ndiv(Mojo.height-szh,2);
        sx= _M.ndiv(Mojo.width-szw,2);
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
        return _mkgrid(_x,_y,dimY,dimX,cw,ch);
      },
      /**Create a rectangular grid.
       * @memberof module:mojoh5/Sprites
       * @param {number[]} [dimX,dimY]
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=UNDEF){
        let
          szh=int(Mojo.height*ratioY),
          szw=int(Mojo.width*ratioX),
          cw=int(szw/dimX),
          ch=int(szh/dimY),
          dim=cw>ch?ch:cw,
          _x,_y,sy,sx;

        if(!_.isEven(dim)){--dim}
        szh=dimY*dim;
        szw=dimX*dim;
        sy= _M.ndiv(Mojo.height-szh,2);
        sx= _M.ndiv(Mojo.width-szw,2);
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
        let
          w=grid[0].length,
          f=grid[0][0],
          e=grid[grid.length-1][w-1];
        return {x1:sx+f.x1,
                x2:sx+e.x2, y1:sy+f.y1, y2:sy+e.y2} },
      /**Create a PIXI Graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} [id]
       * @return {PIXI.Graphics}
       */
      graphics(id=UNDEF){
        const ctx= new PIXI.Graphics();
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
      drawGridBox(bbox,lineWidth=1,lineColor="white",ctx=UNDEF){
        if(!ctx)
          ctx= this.graphics();
        ctx.rect(bbox.x1,bbox.y1, bbox.x2-bbox.x1,bbox.y2-bbox.y1);
        ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        return ctx;
      },
      /**Draw borders around this grid, rounded corners.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} width
       * @param {number} height
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBoxEx(bbox,lineWidth=1,lineColor="white",radius=1,ctx=UNDEF){
        if(!ctx)
          ctx= this.graphics();
        ctx.roundRect(bbox.x1,bbox.y1, bbox.x2-bbox.x1,bbox.y2-bbox.y1,radius);
        ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        return ctx;
      },
      /**Draw grid lines.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string|object} lineColor
       * @param {PIXI.Graphics} ctx
       * @return {PIXIGraphics}
       */
      drawGridLines(sx,sy,grid,lineWidth,lineColor,ctx=UNDEF){
        let
          h= grid.length,
          w= grid[0].length;
        if(!ctx)
          ctx= this.graphics();

        for(let r,y=1;y<h;++y){
          r=grid[y];
          ctx.moveTo(sx+r[0].x1,sy+r[0].y1);
          ctx.lineTo(sx+r[w-1].x2,sy+r[w-1].y1); }
        for(let r,x=1;x<w;++x){
          r=grid[0];
          ctx.moveTo(sx+r[x].x1,sy+r[x].y1);
          r=grid[h-1];
          ctx.lineTo(sx+r[x].x1,sy+r[x].y2); }

        if(is.obj(lineColor)){
          lineColor.color= this.color(lineColor.color||"white");
          lineColor.width=lineWidth;
          ctx.stroke(lineColor);
        }else{
          ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        }
        return ctx;
      },
      /**Add more children to this container.
       * @memberof module:mojoh5/Sprites
       * @param {Container} par
       * @param {...any} children
       * @return {Container} parent
       */
      add(par, ...cs){
        cs.forEach(c=> c && par.addChild(c)); return par },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       */
      remove(...cs){
        if(cs.length==1 && is.vec(cs[0])){ cs=cs[0] }
        _.doseqEx(cs,s=>{
          if(s.parent)
            _.inst(Mojo.Scenes.Scene,s.parent)? s.parent.remove(s) : s.parent.removeChild(s);
          Mojo.emit(["post.remove",s]);
          Mojo.off(s);
          s.m5.dispose?.();
        });
        return cs[0];
      },
      /**Center this object on the screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      centerObj(obj){
        let a=obj.anchor, cx= Mojo.width/2, cy=Mojo.height/2;
        let w2=obj.width/2, h2=obj.height/2;
        obj.x=cx;
        obj.y=cy;
        //handle containers, fake an anchor
        if(!a)
          a= {x:0,y:0};
        if(a.x<0.3) obj.x=cx-w2;
        if(a.x>0.7) obj.x=cx+w2;
        if(a.y<0.3) obj.y=cy-h2;
        if(a.y>0.7) obj.y=cy+h2;
        return obj;
      },
      /**Expand object to fill entire screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      fillMax(obj){
        if(is.str(obj) || _.inst(PIXI.Texture,obj)){ obj=this.sprite(obj) }
        _.assert(_.inst(PIXI.Container,obj), "expected sprite");
        obj.height=Mojo.height;
        obj.width=Mojo.width;
        return this.centerObj(obj)
      },
      /**Convert color value to RGB(A) values.
       * @memberof module:mojoh5/Sprites
       * @param {string} c
       * @return {number[]}
       */
      colorToRgbA(c){//"#319bd5",
        _.assert(is.str(c) && c.length>0, "bad color string value");
        let r,lc=c.toLowerCase(), code=SomeColors[lc];
        if(lc == "transparent"){ return [0,0,0,0] }
        if(code){c=code}
        if(c[0]=="#"){
          //#RGB or #RGBA or #RRGGBB or #RRGGBBAA
          (r=c.split("")).shift();
          if(r.length==3) r.push("F");
          if(r.length==4){ r= r.flatMap(n=> [n,n]) }
          if(r.length==6){ r.push("F","F") }
          if(r.length==8){
            return [parseInt(r[0]+r[1],16), parseInt(r[2]+r[3],16),
                    parseInt(r[4]+r[5],16), parseInt(r[6]+r[7],16)/255]
          }
        }
        else if(lc.indexOf("rgb") == 0){
          //e.g. rgba(0,0,255,0.3)
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a })
        }
        //
        throw `Error: Bad color string: ${c}`
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
      /**Convert RGB color to a decimal.
       * @memberof module:mojoh5/Sprites
       * @param {number} r
       * @param {number} g
       * @param {number} b
       * @return {number}
       */
      color3(r,g,b){
        return parseInt(["0x",this.byteToHex(r),this.byteToHex(g),this.byteToHex(b)].join("")) },
      /**Get the integer value of this color.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} value
       * @return {number} decimal value
       */
      color(value){
        return isNaN(value) ? parseInt(this.colorToHex(value)) : value },
      /**Get the integer value of this RGBA color.
       * @memberof module:mojoh5/Sprites
       * @param {array} arg
       * @return {number} decimal value
       */
      rgba(arg){
        _.assert(is.vec(arg),"wanted rgba array");
        return parseInt("0x"+ [0,1,2].map(i=> this.byteToHex(arg[i])).join("")) },
      /**
       * copied from https://github.com/less/less.js
      */
      hsla(h, s, l, a){
        function c1(v) { return Math.min(1, Math.max(0, v)) }
        function hue(h){
          h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
          if(h * 6 < 1){
            return m1_1 + (m2_1 - m1_1) * h * 6;
          }else if(h * 2 < 1){
            return m2_1;
          }else if(h * 3 < 2){
            return m1_1 + (m2_1 - m1_1) * (2 / 3 - h) * 6;
          }else{
            return m1_1;
          }
        }
        h = h % 360 / 360;
        s = c1(s);
        l = c1(l);
        a = c1(a);
        let m2_1 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
            m1_1 = l * 2 - m2_1;
        return this.rgba([ hue(h + 1/3) * 255, hue(h) * 255, hue(h - 1/3) * 255, a ]);
      },
      /** @ignore */
      resize(s,px,py,pw,ph){
        //not sure this works :P
        s && _.doseqEx(s.children,c=>c.m5 && c.m5.resize?.(s.x,s.y,s.width,s.height)) },
      /**Put b on top of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinAbove(C,b,padY=10,alignX=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          y=boxA.y1-padY-(boxB.y2-boxB.y1),
          x= (alignX<0.3) ? boxA.x1
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
      pinBelow(C,b,padY=10,alignX=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          y=boxA.y2+padY,
          x=(alignX<0.3) ? boxA.x1 : ((alignX<0.7) ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
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
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x=cxA-w2B,
          y=cyA-h2B;
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
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x= boxA.x1 - padX - (boxB.x2-boxB.x1),
          y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
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
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x= boxA.x2 + padX,
          y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
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
      /**Create a Texture from a graphics object.
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
       * @return {any} undefined
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
        const m= _hitAB(this,a,b);
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
        const m= _collideAB(this,a,b,bounce);
        return m && _collideDir(m);
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hitTest(a,b){
        return _hitAB(this,a,b) },
      /**Use to contain a sprite with `x` and
       * `y` properties inside a rectangular area.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {Container} container
       * @param {boolean} [bounce]
       * @param {function} [extra]
       * @return {number[]} a list of collision points
       */
      clamp(s, container, bounce=false,extra=UNDEF){
        let
          box,C,
          left,right,top,bottom;
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
        let
          coff= box ? [0,0] : this.topLeftOffsetXY(C),
          collision = new Set(),
          CX=false,CY=false,
          R= this.getAABB(s),
          cl= box ? C.x1 : C.x+coff[0],
          cr= cl+ (box? C.x2-C.x1 : C.width),
          ct= box ? C.y1 : C.y+coff[1],
          cb= ct+ (box? C.y2-C.y1 : C.height);
        //left
        if(left && R.x1<cl){
          s.x += cl-R.x1;
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //right
        if(right && (R.x2 > cr)){
          s.x -= R.x2- cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(top && R.y1 < ct){
          s.y += ct-R.y1;
          CY=true;
          collision.add(Mojo.TOP);
        }
        //bottom
        if(bottom && (R.y2 > cb)){
          s.y -= R.y2 - cb;
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
          collision=UNDEF
        }
        return collision;
      },
      /**
      */
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
      /**
      */
      dbgShowCol(col){
        const out=[];
        if(is.set(col))
          for(let i of col.values())
            out.push(this.dbgShowDir(i));
        return out.join(",");
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.bmpText=_$.bitmapText;
    _.doseq(SomeColors,(v,k)=>{ _$.SomeColors[k]= _$.color(v) });
    _.doseq(BtnColors,(v,k)=>{ _$.BtnColors[k]= _$.color(v) });
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module
  */
  function _module(Mojo, ScenesDict){

    const SG=gscope["io/czlab/mcfud/spatial"]();
    const {v2:_V, math:_M, ute:_,is}=Mojo;
    const int=Math.floor;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Scenes
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _sceneid=(id)=> id.startsWith("scene::") ? id : `scene::${id}` ;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal */
    ////////////////////////////////////////////////////////////////////////////
    function _killScene(s){
      if(s){
        s.dispose?.();
        s.parent.removeChild(s);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal class, wraps a scene.  Use this to center a scene in the game window */
    ////////////////////////////////////////////////////////////////////////////
    class SceneWrapper extends PIXI.Container{
      constructor(s){
        super();
        this.addChild(s);
        this.label=s.label;
        this.m5={stage:true};
      }
      dispose(){
        _killScene(this.children[0]);
      }
      update(dt){
        this.children[0].update(dt)
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @memberof module:mojoh5/Scenes
     * @class
     * @property {string} name
     * @property {object} m5
     * @property {object} g  scene specific props go here
     */
    class Scene extends PIXI.Container{
      /**
       * @param {string} sid
       * @param {object|function} func
       * @param {object} [options]
       */
      constructor(sid,func,options){
        super();
        this.label= _sceneid(sid);
        this.g={};
        this.m5={
          index:{},
          queue:[],
          garbo:[],
          sid,
          options,
          stage:true,
          sgrid:SG.spatialGrid(options.sgridX||320,
                               options.sgridY||320) };
        if(is.fun(func)){
          this["setup"]=func;
        }else if(is.obj(func)){
          _.inject(this, func);
        }
      }
      ////////////////////////////////////////////////////////////////////////////
      /*check all potential hits */
      ////////////////////////////////////////////////////////////////////////////
      #hitObjects(grid,obj,found){
        let m,b,i,rc=false;
        for(i=0; !rc && i<found.length;++i){
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
              rc=true;
            }
          }
        }
        return rc;
      }
      /**Check for collision of this object.
       * @param {object} obj
       * @return {Scene} this
       */
      collideXY(obj){
        return this.#hitObjects(this.m5.sgrid,obj, this.m5.sgrid.search(obj)) }
      /**Callback to handle window resizing.
       * @param {number} width  canvas width before resize
       * @param {number} height  canvas height before resize
       * @return {Scene} this
       */
      onCanvasResize(width,height){
        //NOTE: not tested thoroughly yet :)
        Mojo.Sprites.resize({x:0,y:0,
                             width,
                             height,
                             children:this.children})
        return this;
      }
      /**Run this function after a delay in millis.
       * @param {function} expr
       * @param {number} delayMillis
       * @return {Scene} this
       */
      future(expr,delayMillis){
        this.m5.queue.push([expr, _M.ndiv(Mojo._curFPS*delayMillis,1000) || 1]);
        return this;
      }
      /**Run this function after a delay in frames.
       * @param {function} expr
       * @param {number} delayFrames
       * @return {Scene} this
       */
      futureX(expr,delayFrames){
        this.m5.queue.push([expr,delayFrames || 1]);
        return this;
      }
      /**Get the child with this id.
       * @param {string} id
       * @return {Sprite}
       */
      getChildById(id){
        return id && this.m5.index[id] }
      /**Remove this child
       * @param {string|Sprite} c
       * @return {Scene} this
       */
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c){
          this.removeChild(c);
          Mojo.off(c);
          if(c.m5._engrid)
            this.m5.sgrid.degrid(c);
          Mojo.Input.undoXXX(c);
          _.dissoc(this.m5.index,c.m5.uuid); }
        return this;
      }
      /**Remove item from spatial grid temporarily.
       * @param {Sprite} c
       * @return {Sprite} the removed item
       */
      degrid(c){
        if(c && c.m5._engrid)
          this.m5.sgrid.degrid(c);
        return c;
      }
      /**Force item to update spatial grid.
       * @param {Sprite} c
       * @return {Sprite} the item
       */
      engrid(c){
        if(c && c.m5._engrid)
          this.m5.sgrid.engrid(c);
        return c;
      }
      /**Insert a bunch of child sprites
       * @param {array} cs
       * @param {boolean} [engrid]
       * @return {Sprite} the last child added
       */
      insertEx(cs,engrid=false){
        _.assert(is.vec(cs),"wanted array of child sprites to be inserted!");
        let out;
        cs.forEach(c=>{ this.insertAt(c,null,engrid); out=c; });
        return out;
      }
      /**Insert this child sprite.
       * @param {Sprite} c
       * @param {boolean} [engrid]
       * @return {Sprite} the child
       */
      insert(c,engrid=false){
        return this.insertAt(c,null,engrid) }
      /**Insert this child sprite at this position.
       * @param {Sprite} c
       * @param {number} pos
       * @param {boolean} [engrid]
       * @return {Sprite} the child
       */
      insertAt(c,pos,engrid=false){
        c=this.#addit(c,pos);
        if(engrid){
          if(c instanceof PIXI.TilingSprite){}else{
            c.m5._engrid=true;
            this.m5.sgrid.engrid(c);
          }
        }
        return c;
      }
      ////////////////////////////////////////////////////////////////////////////
      /*add this child */
      ////////////////////////////////////////////////////////////////////////////
      #addit(c,pos){
        if(is.num(pos) &&
           pos >= 0 &&
           pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        return (this.m5.index[c.m5.uuid]=c);
      }
      /**Subclass can override this to do more during dispose
       * @return {Scene} this
       */
      preDispose(){ return this }
      /**Clean up.
       * @return {Scene} this
       */
      dispose(){
        this.preDispose();
        function _c(o){
          if(o){
            Mojo.Input.undoXXX(o);
            o.children.forEach(c=> _c(c)) } }
        this.m5.dead=true;
        Mojo.off(this);
        _c(this);
        this.removeChildren();
        if(Mojo.modalScene===this){
          Mojo.modalScene=UNDEF;
          Mojo.Input.restore();
          Mojo.CON.log(`removed the current modal scene`);
        }
        return this;
      }
      ////////////////////////////////////////////////////////////////////////////
      /*work horse runned every frame  */
      ////////////////////////////////////////////////////////////////////////////
      #tick(r,dt){
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
            //might have moved, so regrid
            c.m5._engrid && this.m5.sgrid.engrid(c);
          }
          c.children.length>0 && this.#tick(c.children, dt)
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
       * @return {object} the same object
       */
      queueForRemoval(obj){
        return this.m5.garbo.push(obj) && obj
      }
      /**Update the scene, called every frame.
       * @param {number} dt
       * @return {Scene} this
       */
      update(dt){
        if(!this.m5.dead){
          //look for expired futures
          this.m5.queue.filter(q=>{
            q[1] -= 1;
            return (q[1]<=0);
          }).reverse().forEach(f=>{
            _.disj(this.m5.queue, f);
            f[0]();
          });
          //run the scene
          this.preUpdate?.(dt);
          this.#tick(this.children, dt);
          this.postUpdate?.(dt);
          //clean up
          this.m5.garbo.forEach(o=>this.remove(o));
          this.m5.garbo.length=0;
        }
        return this;
      }
      /**Initial bootstrap of this scene.
       * @return {Scnene} this
       */
      runOnce(){
        this.setup?.(this.m5.options);
        return this;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*Smart layout for menus, both vertical or horizontal. */
    ////////////////////////////////////////////////////////////////////////////
    function _layout(items,options,dir){
      let {Sprites:_S}=Mojo, K=Mojo.getScaleFactor();
      if(items.length==0){return}
      options= _.patch(options,{bg:0,
                                padding:10,
                                fit:20,
                                borderWidth:4,
                                border:_S.SomeColors.white});
      let
        borderWidth=options.borderWidth * K,
        C=options.group || _S.container(),
        pad=options.padding * K,
        last,w,h,p, T=0, Z=-1,
        fit= options.fit * K,
        fit2= fit * 2,
        guessWidth= (s)=>{
          T+=s.height;
          if(s.width>Z) Z=s.width;
        },
        guessHeight= (s)=>{
          T+=s.width;
          if(s.height>Z) Z=s.height
        };

      items.forEach(s=>{
        _.assert(_.feq0(s.anchor.x)&&_.feq0(s.anchor.y),"wanted topleft anchor");
        (dir==Mojo.DOWN?guessWidth:guessHeight)(s);
        if(!options.skipAdd) C.addChild(s);
      });

      Z += fit2;
      T += pad*(items.length-1)+fit2;

      if(dir==Mojo.DOWN){ w=Z; h=T; }else{ h=Z; w=T; }
      //create a backdrop
      if(1){
        let r= _S.rect(w,h,
                       options.bg,
                       options.border, borderWidth);
        C.addChildAt(r,0); //add to front so zindex is lowest
        if(!is.vec(options.bg)){
          r.alpha= options.opacity==0 ? 0 : (options.opacity || 0.5);
          if(options.bg == "transparent")r.alpha=0;
        }
      }
      let
        prev,
        [w2,h2]=[int(w/2), int(h/2)],
        op=dir==Mojo.DOWN?"pinBelow":"pinRight";
      items.forEach((s,i)=>{
        if(dir==Mojo.DOWN){
          if(i==0){
            s.x=w2-s.width/2;
            s.y= fit;
          }
        }else{
          if(i==0){
            s.y=h2-s.height/2;
            s.x= fit;
          }
        }
        if(prev)
          Mojo.Sprites[op](prev,s,pad);
        prev=s;
      });
      //may be center the whole thing
      C.x= _.nor(options.x, _M.ndiv(Mojo.width-w,2));
      C.y= _.nor(options.y, _M.ndiv(Mojo.height-h,2));
      return C;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*Create a selectable menu. */
    ////////////////////////////////////////////////////////////////////////////
    function _choiceBox(items,options,dir){
      let
        {Sprites:_S,Input:_I}=Mojo,
        selectedColor=_S.color(_.nor(options.selectedColor,"green")),
        c,cur, disabledColor=_S.color(_.nor(options.disabledColor,"grey"));
      items.forEach(o=>{
        if(o.m5.uuid==options.defaultChoice){
          cur=o;
          o.tint=selectedColor;
        }else{
          o.tint=disabledColor;
        }
        if(o.m5.button)
          o.m5.press=(b)=>{
            if(b!==cur){
              cur.tint=disabledColor;
              b.tint=selectedColor;
              cur=b;
              options.onClick?.(b);
            }
          };
      });
      if(!cur){
        cur=items[0];
        cur.tint= selectedColor;
      }
      c= _layout(items,options,dir);
      c.getSelectedChoice=()=> cur.m5.uuid;
      return c;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //the module
    ////////////////////////////////////////////////////////////////////////////
    const _$={
      Scene,
      SceneWrapper,
      /**Lay items out horizontally.
       * @memberof module:mojoh5/Scenes
       * @param {PIXI.Sprite[]} items
       * @param {object} [options]
       * @return {PIXI.Container}
       */
      layoutX(items,options){
        return _layout(items,options,Mojo.RIGHT) },
      /**Lay items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {PIXI.Sprite[]} items
       * @param {object} [options]
       * @return {PIXI.Container}
       */
      layoutY(items,options){
        return _layout(items, options, Mojo.DOWN) },
      /**Lay selectable items out horizontally.
       * @memberof module:mojoh5/Scenes
       * @param {PIXI.Sprite[]} items
       * @param {object} [options]
       * @return {PIXI.Container}
       */
      choiceMenuX(items,options){
        return _choiceBox(items, options, Mojo.RIGHT) },
      /**Lay selectable items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {PIXI.Sprite[]} items
       * @param {object} [options]
       * @return {PIXI.Container}
       */
      choiceMenuY(items,options){
        return _choiceBox(items, options, Mojo.DOWN) },
      /**Define a scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object|function} func
       * @param {object} [options]
       * @return {any} undefined
       */
      scene(name, func, options){
        //add a new scene definition
        if(is.fun(func))
          func={setup:func};
        ScenesDict[name]=[func, options];
      },
      /**Replace the current scene with this one.
       * @memberof module:mojoh5/Scenes
       * @param {string|Scene} cur
       * @param {string} name
       * @param {object} [options]
       * @return {Scene} new scene
       */
      replace(cur,name,options){
        const
          n=_sceneid(is.str(cur)?cur:cur.label),
          c= Mojo.stage.getChildByName(n);
        if(!c)
          throw `Fatal: no such scene: ${n}`;
        return this.run(name, Mojo.stage.getChildIndex(c),options);
      },
      /**Remove these scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...Scene} args
       * @return {any} undefined
       */
      remove(...args){
        if(args.length==1 &&
           is.vec(args[0])){ args=args[0] }
        args.forEach(a=>_killScene(is.str(a)?Mojo.stage.getChildByName(_sceneid(a)):a))
      },
      /**Remove all the scenes.
       * @memberof module:mojoh5/Scenes
       * @return {any} undefined
       */
      removeAll(){
        while(Mojo.stage.children.length>0)
          _killScene(Mojo.stage.children[Mojo.stage.children.length-1])
        Mojo.mouse.reset();
        Mojo["Input"].reset();
      },
      /**Find this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @return {Scene} the named scene
       */
      find(name){
        return Mojo.stage.getChildByName(_sceneid(name)) },
      /**Remove all scenes first then run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene} the named scene
       */
      runEx(name,num,options){
        this.removeAll();
        return this.run(name,num,options);
      },
      /**Run a sequence of scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...any} args
       * @return {any} undefined
       */
      runSeq(...args){
        args.forEach(a=>{
          _.assert(is.vec(a),"Expecting array");
          this.run(a[0],a[1],a[2]);
        });
      },
      /**Run as a modal dialog.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object} [options]
       * @return {Scene} the modal scene
       */
      modal(name,options){
        _.assert(!Mojo.modalScene,`Another modal is already running!`);
        Mojo.Input.save();
        return Mojo.modalScene= this.run(name,null,options);
      },
      /**Run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene} the new scene
       */
      run(name,num,options){
        let py, y, s0,_s = ScenesDict[name];
        if(Mojo.modalScene)
          throw `Fatal: modal scene is running`;
        if(!_s)
          throw `Fatal: unknown scene: ${name}`;
        if(is.obj(num)){
          options = num;
          num = _.dissoc(options,"slot");
        }
        options = _.inject({},_s[1],options);
        s0=_.inject({},_s[0]);
        if(_.nichts(num))
          num= options["slot"] || -1;
        //before we run a new scene
        //Mojo.mouse.reset();
        //create new
        if(!options.tiled){
          y = new Scene(name, s0, options);
        }else{
          _.assert(options.tiled.name, "no tmx file!");
          y = new Mojo.Tiles.TiledScene(name, s0, options);
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
      },
      /**Get the topmost scene.
       * @memberof module:mojoh5/Scenes
       * @return {Scene} the top scene
       */
      topMost(){
        let c= _.last(Mojo.stage.children);
        if(c instanceof SceneWrapper){
          c=c.children[0];
        }
        _.assert(c instanceof Scene, "top is not a scene!");
        return c;
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  function _module(Mojo, TweensQueue, DustBin){

    const {
      v2:_V,
      math:_M,
      ute:_,
      is,
      Sprites:_S
    }=Mojo;

    const
      int=Math.floor,
      P5=Math.PI*5,
      PI_2= Math.PI/2,
      TWO_PI= Math.PI*2;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/FX
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function StarWarp(C, options){
      options= options || {};
      let
        STAR_SIZE= 0.05,
        STAR_RANGE = 6,
        SPEED = 0.025,
        CYCLE=5000,
        DEPTH=2000,
        FOV = 20,
        RADIUS=50,
        camZ = 0,
        speed = 0,
        warp= 0,
        mark=_.now(),
        color = options.color ?? "yellow",
        items= options.items ?? 1000,
        img = Mojo.resource("boot/star.png");
      const
        stars = _.fill(items, i=>{
          i= _S.sprite(img);
          i.g.d3=[0,0,0];
          if(_.rand()<0.3)
            i.tint= _S.color(color);
          _S.anchorXY(i, 0.5,0.69);
          C.addChild(i);
          return cfgStar(i, _.rand()*DEPTH);
        });
      function cfgStar(s, zpos){
        let
          twist = _.rand() * TWO_PI,
          dist= _.rand() * RADIUS + 1;
        //calc star positions with radial random
        //coordinate so no star hits the camera.
        s.g.d3[0] = Math.cos(twist) * dist;
        s.g.d3[1] = Math.sin(twist) * dist;
        s.g.d3[2]= !isNaN(zpos)?zpos
                               :camZ + DEPTH*(1+_.rand()*0.5);
        //console.log(`star pos= ${s.g.d3}`);
        return s;
      }
      return{
        dispose(){
          stars.forEach(o=> _S.remove(o));
        },
        update(dt){
          let
            w2=Mojo.width/2,
            now,z, h2=Mojo.height/2;
          speed += (warp- speed) / 20;
          camZ += dt * 10 * (speed + SPEED);
          //console.log(`camz=${camZ}, speed=== ${speed}`);
          stars.forEach((o,i)=>{
            if(o.g.d3[2] < camZ) cfgStar(o);
            // project to fake 3D
            i= Mojo.width*FOV/z;
            z = o.g.d3[2] - camZ;
            o.x = o.g.d3[0] * i + w2;
            o.y = o.g.d3[1] * i + h2;
            //calculate star scale & rotation.
            let
              dx= o.x - w2,
              dy= o.y - h2,
              d= Math.sqrt(dx* dx+ dy* dy),
              ds= Math.max(0, 1 - z/DEPTH);
            o.rotation = Math.atan2(dy, dx) + PI_2;
            _S.scaleXY(o, ds * STAR_SIZE,
                          // Star is looking towards center so that y axis is towards center.
                          // Scale the star depending on how fast we are moving,
                          // what the stretchfactor is and depending on how far away it is from the center.
                          ds * (STAR_SIZE + speed * STAR_RANGE * d / Mojo.width));
          });
          now=_.now();
          if(now-mark>CYCLE){
            mark=now;
            warp= warp> 0 ? 0 : 1;
          }
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function Tween(sprite,easing,duration=60,loop=false,ext={}){
      return _.inject({
        duration,
        sprite,
        easing,
        loop,
        cur:0,
        on:0,
        dead:0,
        onFrame(end,alpha){},
        _run(){
          this.cur=0;
          this.on=1;
          this.dead=0;
          TweensQueue.push(this);
        },
        onTick(){
          if(this.on){
            if(this.cur<this.duration){
              this.onFrame(false,
                           this.easing(this.cur/this.duration));
              this.cur += 1;
            }else{
              this.onFrame(true);
              if(this.loop){
                if(is.num(this.loop)){
                  --this.loop
                }
                this.onLoopReset()
                this.cur=0;
              }else{
                this.on=0;
                this.dispose();
                this.onComplete && _.delay(0,()=> this.onComplete());
              }
            }
          }
        },
        dispose(){
          this.dead=1;
          Mojo.emit(["tween.disposed"],this);
        }
      },ext)
    }

    ////////////////////////////////////////////////////////////////////////////
    /** scale */
    ////////////////////////////////////////////////////////////////////////////
    function TweenScale(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:UNDEF;
          this._y=is.num(ey)?[sy,ey]:UNDEF;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x)
            _.swap(this._x,0,1);
          if(this._y)
            _.swap(this._y,0,1);
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

    ////////////////////////////////////////////////////////////////////////////
    /** rotation */
    ////////////////////////////////////////////////////////////////////////////
    function TweenAngle(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          _.swap(this._a,0,1)
        },
        onFrame(end,alpha){
          this.sprite.rotation= end ? this._a[1]
                                    : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** alpha */
    ////////////////////////////////////////////////////////////////////////////
    function TweenAlpha(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sa,ea){
          this._a= [sa,ea];
          this._run();
        },
        onLoopReset(){
          _.swap(this._a,0,1)
        },
        onFrame(end,alpha){
          this.sprite.alpha= end ? this._a[1]
                                 : _M.lerp(this._a[0], this._a[1], alpha)
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    /** position */
    ////////////////////////////////////////////////////////////////////////////
    function TweenXY(s,type,frames,loop){
      return Tween(s,type,frames,loop,{
        start(sx,ex,sy,ey){
          this._x=is.num(ex)?[sx,ex]:UNDEF;
          this._y=is.num(ey)?[sy,ey]:UNDEF;
          this._run();
        },
        onLoopReset(){
          //flip values
          if(this._x)
            _.swap(this._x,0,1);
          if(this._y)
            _.swap(this._y,0,1);
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

    ////////////////////////////////////////////////////////////////////////////
    /** group */
    ////////////////////////////////////////////////////////////////////////////
    function BatchTweens(...ts){
      const cs=ts.slice(0);
      const tObj={
        onTweenEnd(t){
          for(let c,i=0;i<cs.length;++i){
            c=cs[i];
            if(c===t){
              cs.splice(i,1);
              break;
            }
          }
          if(cs.length==0){
            this.dispose();
            this.onComplete && _.delay(0,()=>this.onComplete());
          }
        },
        dispose(){
          Mojo.off(["tween.disposed"],"onTweenEnd",tObj);
          cs.length=0;
        }
      };
      Mojo.on(["tween.disposed"],"onTweenEnd",tObj);
      return tObj;
    }

    ////////////////////////////////////////////////////////////////////////////
    /** seq */
    ////////////////////////////////////////////////////////////////////////////
    function SeqTweens(...ts){
      let c,cs=[];
      ts.forEach(o=>{
        cs.push(o);
        _.disj(TweensQueue,o);
      });
      const t={
        onDone(){
          this.dispose();
          this.onComplete &&
            _.delay(0,()=>this.onComplete());
        },
        dispose(){
          cs.length=0;
        }
      };
      function iter(o){
        if(o){
          TweensQueue.push(o);
          o.onComplete=()=> iter(cs.shift());
        }else{
          t.onDone();
        }
      }
      iter(cs.shift());
      return t;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Easing function: exponential-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_IN(x){ return x==0 ? 0 : Math.pow(1024, x-1) },
      /**Easing function: exponential-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_OUT(x){ return x==1 ? 1 : 1-Math.pow(2, -10*x) },
      /**Easing function: exponential-in-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      EXPO_INOUT(x){
        return x==0 ? 0
                    : (x==1) ? 1
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
        let
          tt = t * t,
          ttt = tt * t,
          q1 = -ttt + 2*tt - t,
          q2 = 3*ttt - 5*tt + 2,
          q3 = -3*ttt + 4*tt + t,
          q4 = ttt - tt;
        return 0.5 * (a * q1 + b * q2 + c * q3 + d * q4);
      },
      /**Easing function: cubic-bezier.
       * @memberof module:mojoh5/FX
       * @param {number} t
       * @param {number} a
       * @param {number} b
       * @param {number} c
       * @param {number} d
       * @return {number}
       */
      CUBIC_BEZIER(t, a, b, c, d){
        let
          t2=t*t,
          t3=t2*t,
          tm1= 1-t,
          tm2=tm1*tm1,
          tm3=tm2*tm1;
        return tm3*a + 3*tm2*t*b + 3*tm1*t2*c + t3*d;
      },
      /**Easing function: elastic-in.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      ELASTIC_IN(x){
        return x==0 ? 0
                    : x==1 ? 1
                           : -Math.pow(2, 10*(x-1)) * Math.sin((x-1.1)*P5) },
      /**Easing function: elastic-out.
       * @memberof module:mojoh5/FX
       * @param {number} x
       * @return {number}
       */
      ELASTIC_OUT(x){
        return x==0 ? 0
                    : x==1 ? 1
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
        if(!is.num(ex)){ sx=ex=UNDEF }
        if(!is.num(ey)){ sy=ey=UNDEF }
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
        if(!is.num(ex)){sx=ex=UNDEF}
        if(!is.num(ey)){sy=ey=UNDEF}
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
      jiggle(s, bounds, ex=1.4, ey=1.2, frames=10, loop=true){
        let {x1,x2,y1,y2}= bounds;
        return BatchTweens(this.tweenScale(s,v=>this.SPLINE(v,_.or(x1,10),0,1,
                                                              _.or(x2,10)), ex, UNDEF, frames,loop),
                           this.tweenScale(s,v=>this.SPLINE(v,_.or(y1,-10),0,1,
                                                              _.or(y2,-10)), UNDEF,ey, frames,loop)) },
      /**
       * @memberof module:mojoh5/FX
       * @param {Sprite} s
       * @param {Vec2} c1
       * @param {Vec2} c2
       * @param {Vec2} c3
       * @param {number} frames
       * @return {TweenXY}
       */
      bezier(s,c1,c2,c3,frames=60){
        let t= TweenXY(s,this.SMOOTH,frames);
        t.start=function(){ this._run() };
        t.onFrame=function(end,alpha){
          if(!end)
            _V.set(s, _$.CUBIC_BEZIER(alpha, s.x, c1[0],c2[0],c3[0]),
                      _$.CUBIC_BEZIER(alpha, s.y, c1[1], c2[1], c3[1]));
        };
        return t.start(), t;
      },
      /**Remove this tween object.
       * @memberof module:mojoh5/FX
       * @param {Tween} t
       */
      remove(t){ t?.dispose() },
      /** @ignore */
      update(dt){
        _.rseq(TweensQueue, t=> t.onTick(dt));
        _.rseq(DustBin, p=> p.onTick(dt));
        for(let i=TweensQueue.length-1;i>=0;--i) TweensQueue[i].dead? TweensQueue.splice(i,1):0;
        for(let i=DustBin.length-1;i>=0;--i) DustBin[i].m5.dead? _S.remove(DustBin[i]) && DustBin.splice(i,1):0;
      },
      /**Create particles.
       * @memberof module:mojoh5/FX
       * @return {any} undefined
       */
      particles(C,x, y, spriteCtor, count=24, mins={}, maxs={}, gravity=[0,0.3], random=true){
        mins= _.patch(mins,{angle:0, size:4, speed:0.3,
                            scale:0.01, alpha:0.02, rotate:0.01});
        maxs=_.patch(maxs,{angle:6.28, size:16, speed:3,
                           scale:0.05, alpha:0.02, rotate:0.03 });
        function _make(angle){
          let
            p= spriteCtor(),
            v,size = _.randInt2(mins.size, maxs.size);
          DustBin.push(p);
          C.addChild(p);
          if(p.totalFrames)
            p.gotoAndStop(_.randInt2(0, p.totalFrames-1));
          _S.sizeXY(_S.centerAnchor(p), size, size);
          _V.set(p,x,y);
          p.g.scaleSpeed = _.randFloat2(mins.scale, maxs.scale);
          p.g.alphaSpeed = _.randFloat2(mins.alpha, maxs.alpha);
          p.g.angVel = _.randFloat2(mins.rotate, maxs.rotate);
          v= _.randFloat2(mins.speed, maxs.speed);
          _V.set(p.m5.vel, v * Math.cos(angle),
                           v * Math.sin(angle));
          //the worker
          p.onTick=function(){
            if(!this.m5.dead){
              _V.add$(this.m5.vel,gravity);
              _V.add$(this,this.m5.vel);
              if(this.scale.x - this.g.scaleSpeed > 0){ this.scale.x -= this.g.scaleSpeed }
              if(this.scale.y - this.g.scaleSpeed > 0){ this.scale.y -= this.g.scaleSpeed }
              this.rotation += this.m5.angVel;
              this.alpha -= this.g.alphaSpeed;
              if(this.alpha <= 0){ this.m5.dead=true; }
            }
          };
        }
        for(let diff= maxs.angle-mins.angle,
                gap= diff/(count-1), a=mins.angle, i=0; i<count; ++i){
          _make(random ? _.randFloat2(mins.angle, maxs.angle) : a);
          a += gap;
        }
      },
      /**Shake this sprite.
       * @memberof module:mojoh5/FX
       * @return {Sprite}
       */
      shake(s, magnitude=16, angular=false,loop=true){
        const CHUNK=8;
        let
          wrapper={},
          self=this,
          counter=1,
          startX = s.x,
          startY = s.y,
          tiltAngle = 1,
          startAngle = s.rotation,
          startMagnitude= magnitude,
          chunk = int(magnitude / CHUNK);
        function _upAndDownShake(){
          if(counter<CHUNK){
            s.x = startX;
            s.y = startY;
            magnitude -= chunk;
            s.x += _.randInt2(-magnitude, magnitude);
            s.y += _.randInt2(-magnitude, magnitude);
            ++counter;
          }else if(loop){
            magnitude=startMagnitude;
            counter=1;
          }else{
            _.disj(DustBin,wrapper);
          }
        }
        function _angularShake(){
          if(counter<CHUNK){
            s.rotation = startAngle;
            magnitude -= chunk;
            s.rotation = magnitude * tiltAngle;
            ++counter;
            //yoyo it
            tiltAngle *= -1;
          }else if(loop){
            magnitude=startMagnitude;
            counter=1;
          }else{
            _.disj(DustBin,wrapper);
          }
        }
        wrapper.onTick=()=>{
          return angular ? _angularShake(wrapper)
                         : _upAndDownShake(wrapper)
        };
        return DustBin.push(wrapper) && s;
      },
      StarWarp,
      SeqTweens,
      BatchTweens
    };

    return (Mojo.FX= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/FX"]=function(M){
      return M.FX ? M.FX : _module(M, [], [])
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
    {Scenes:_Z,
      Sprites:_S,
      FX:_F,
      Input:_I,
      v2:_V,
      math:_M,
      is, ute:_}=Mojo;

    const
      abs=Math.abs,
      cos=Math.cos,
      sin=Math.sin,
      int=Math.floor,
      {Geo}=_S,
      R=Math.PI/180,
      CIRCLE=Math.PI*2;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Ute2D
     */
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @typedef {object} HealthBarConfig
     * @property {number} scale scaling factor for drawing
     * @property {number} width width of the widget
     * @property {number} height height of the widget
     * @property {number} lives  default is 3
     * @property {number} borderWidth default is 4
     * @property {number|string} line color used for line
     * @property {number|string} fill color used for fill
     */

    /**
     * @typedef {object} HealthBarObj
     * @property {function} dec decrement live count
     * @property {number} lives lives remaining
     * @property {PIXI/Sprite} sprite the visual widget
     */

    /**
     * @typedef {object} GaugeUIConfig
     * @property {number} cx
     * @property {number} cy
     * @property {number} scale
     * @property {number} radius
     * @property {number} alpha
     * @property {PIXI/Graphics} gfx
     * @property {number|string} fill fill color
     * @property {number|string} line line color
     * @property {number|string} needle color of the needle
     * @property {function} update return next value (e.g. speed)
     */

    /**
     * @typedef {object} GaugeUIObj
     * @property {PIXI/Graphics} gfx
     * @property {function} draw draw the widget
     */

    /**
     * @typedef {object} PatrolObj
     * @property {function} goLeft
     * @property {function} goRight
     * @property {function} goUp
     * @property {function} goDown
     * @property {function} dispose
     */

    /**
     * @typedef {object} PlatformerObj
     * @property {function} dispose
     * @property {function} onTick
     * @property {number} jumpSpeed
     * @property {number} jumpKey  default is UP key
     */

    /**
     * @typedef {object} MazeRunnerObj
     * @property {function} dispose
     * @property {function} onTick
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //internal use only
    //////////////////////////////////////////////////////////////////////////////
		_Z.scene("Splash",{
      setup(options){
        let C,s, self=this, K=Mojo.getScaleFactor();
        let
          {title,titleFont,titleColor,titleSize}= options,
          {footerMsgSize,action,clickSnd}=options,
          {bg, playMsg,playMsgFont,playMsgColor,playMsgSize,playMsgColor2}= options;

        //ffc901 yellow fd5898 pink e04455 red

        playMsgFont= playMsgFont || Mojo.DOKI_LOWER;
        titleFont= titleFont || Mojo.BIGSHOUTBOB;
        footerMsgSize= footerMsgSize || 18*K;
        playMsg=playMsg || Mojo.clickPlayMsg();
        playMsgColor= playMsgColor ?? _S.color("white");
        playMsgColor2= playMsgColor2 ?? _S.color("#ffc901");
        titleColor= titleColor ?? _S.color("#ffc901");
        titleSize= titleSize ?? 96*K;
        playMsgSize= playMsgSize ?? 64*K;

        self.insert(_S.fillMax(bg?bg:"boot/splash.jpg"));
        C= self.insert(_S.container());
        ////////////////////////////////////////////////////////////////////////////
        //the title
        if(1){
          s=_S.bmpText(title, titleFont,titleSize);
          _.echt(titleColor) ? _S.tint(s,titleColor) : 0;
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          C.addChild(_S.centerAnchor(s));
        }

        ////////////////////////////////////////////////////////////////////////////
        //play message
        if(1){
          s=_S.bmpText(playMsg,playMsgFont,playMsgSize);
          let t2,t=_F.throb(s, 0.747, 0.747);
          const cf=()=>{
            _S.tint(s,playMsgColor2);
            _F.remove(t);
            t2=_F.tweenAlpha(C,_F.EASE_OUT_SINE,0,90);
            t2.onComplete=()=>_Z.runEx(action.name,action.cfg);
          };
          let sub= _S.oneOffClick(cf,clickSnd);
          _V.set(s,Mojo.width/2,Mojo.height*0.65);
          C.addChild(_S.centerAnchor(s));
          if(!Mojo.touchDevice){
            this.g.space= _I.keybd(_I.SPACE,()=>{
              _S.cancelOneOffClick(sub);
              cf();
              Mojo.sound(clickSnd).play();
            });
          }
        }

        ////////////////////////////////////////////////////////////////////////////
        //footer
        if(1){
          const s2= _S.bmpText("Powered by MojoH5 2d game engine.",Mojo.UNSCII,footerMsgSize);
          const s1= _S.bmpText(Mojo.COPYRIGHT, Mojo.UNSCII, footerMsgSize);
          _S.pinBelow(this,s1,-s1.height*1.5,0);
          _S.pinBelow(this,s2,-s2.height*1.5,1);
          this.insert(s1);
          this.insert(s2);
        }
      },
      preDispose(){
        this.g.space?.dispose();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("EndGame",{
      setup(options){
        let
          {winner,snd}=options,
          {fontName,fontSize,msg,replay,quit}= options;
        if(!snd) snd= winner ? "game_win.mp3" : "game_over.mp3";
        _.assert(fontSize, "expected fontSize");
        fontName=fontName || Mojo.DOKI_LOWER;
        let
          os={fontName, fontSize},
          space=()=>_S.opacity(_S.bmpText("#",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(msg, os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=>_Z.runEx(replay.name,replay.cfg);
        s6.m5.press=()=>_Z.runEx(quit.name,quit.cfg);
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("PhotoMat",{
      setup(arg){
        let s= arg.image? Mojo.resource(arg.image): UNDEF;
        this.g.gfx=_S.graphics();
        //top,bottom
        _S.grect(this.g.gfx, 0,0,Mojo.width,arg.y1);
        _S.grect(this.g.gfx, 0,arg.y2,Mojo.width,Mojo.height-arg.y2);
        //left,right
        _S.grect(this.g.gfx, 0,0,arg.x1,Mojo.height);
        _S.grect(this.g.gfx, arg.x2,0,Mojo.width-arg.x2,Mojo.height);
        s ? _S.gfillEx(this.g.gfx, s,{})
          : _S.gfill(this.g.gfx, {color:_S.color(arg.color)});
        this.insert(this.g.gfx);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("HotKeys",{
      setup(options){
        let
          m, bs, opstr= options.buttons?"makeButton":"makeHotspot",
          {fontName,fontSize,cb,radius,alpha,color}=options,
          {char_fire,char_down,char_up,char_left,char_right}=options;
        _.assert(is.num(fontSize),"expected fontsize");
        _.assert(is.num(radius),"expected radius");
        _.assert(is.fun(cb),"expected callback");
        fontName=fontName||Mojo.DOKI_LOWER;
        alpha=alpha ?? 0.2;
        color=color ?? "grey";
        m= [["left",char_left || "<"],
            ["right",char_right || ">"],
            ["up",char_up || "+"],
            ["down",char_down || "-"], ["fire",char_fire || "^"]].reduce((acc,v,i)=>{
              if(v[0]=="fire" && !options.fire){}else{
                acc[v[0]]= _S.opacity(_S.circle(radius,color),alpha);
                acc[v[0]].addChild(_S.centerAnchor(_S.bmpText(v[1],fontName,fontSize)));
              }
              return acc;
            },{});
        bs=cb(m);
        if(bs.right){
          this.insert(_I[opstr](bs.right));
          if(bs.right.m5.hotspot)
            bs.right.m5.touch=(o,t)=> t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT); }
        if(bs.left){
          this.insert(_I[opstr](bs.left));
          if(bs.left.m5.hotspot)
            bs.left.m5.touch=(o,t)=> t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT); }
        if(bs.up){
          this.insert(_I[opstr](bs.up));
          if(bs.up.m5.hotspot)
            bs.up.m5.touch=(o,t)=> t?_I.setKeyOn(_I.UP):_I.setKeyOff(_I.UP); }
        if(bs.down){
          this.insert(_I[opstr](bs.down));
          if(bs.down.m5.hotspot)
            bs.down.m5.touch=(o,t)=> t?_I.setKeyOn(_I.DOWN):_I.setKeyOff(_I.DOWN); }
        if(bs.fire){
          this.insert(_I[opstr](bs.fire));
          if(bs.fire.m5.hotspot)
            bs.fire.m5.touch= (o,t)=> t?_I.setKeyOn(_I.SPACE):_I.setKeyOff(_I.SPACE); }
        //run any extra code...
        options.extra?.(this);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("AudioIcon",{
      setup(arg){
        let
          {cb,iconOn,iconOff}= arg,
          {xOffset,yOffset,xScale,yScale}=arg,
          {Sound}=Mojo, K=Mojo.getScaleFactor(),
          s=_I.mkBtn(_S.spriteFrom(iconOn||"audioOn.png",iconOff||"audioOff.png"));

        xScale= xScale ?? K*2;
        yScale= yScale ?? K*2;
        yOffset= yOffset ?? 0;
        xOffset= xOffset ?? -10*K;
        _S.scaleXY(_S.opacity(s,0.343),xScale,yScale);
        _V.set(s,Mojo.width-s.width+xOffset, 0+yOffset);

        s.m5.showFrame(Sound.sfx()?0:1);
        s.m5.press=()=>{
          if(Sound.sfx()){
            Sound.mute(); s.m5.showFrame(1);
          }else{
            Sound.unmute(); s.m5.showFrame(0);
          }
        };
        this.insert(s);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("StarfieldBg",{
      setup(o){
        const
          self=this,
          stars=[],
          gfx=_S.graphics();

        _.patch(o,{
          height:Mojo.height,
          width:Mojo.width,
          count:100,
          minVel:15,
          maxVel:30
        });
        _.inject(this.g,{
          gfx,
          stars,
          lag:0,
          dynamic:true,
          fps: 1/o.fps,
          draw(){
            _S.gclear(gfx);
            stars.forEach(s=>{
              _S.grect(gfx,s.x, s.y, s.size, s.size);
              _S.gfill(gfx,{color:_.rand()<0.3?_S.SomeColors.yellow:_S.SomeColors.white});
            });
            return this;
          },
          moveStars(dt){
            this.lag +=dt;
            if(this.lag>=this.fps){
              this.lag=0;
              stars.forEach(s=>{
                s.y += dt * s.vel;
                if(s.y > o.height){
                  _V.set(s, _.randInt(o.width), 0);
                  s.size=_.randInt(4);
                  s.vel=(_.rand()*(o.maxVel- o.minVel))+o.minVel;
                }
              });
              this.draw();
            }
          }
        });
        if(o.static)
          this.g.dynamic=false;
        for(let i=0; i<o.count; ++i)
          stars[i] = {x: _.rand()*o.width,
                      y: _.rand()*o.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(o.maxVel- o.minVel))+o.minVel};
        this.g.draw() && this.insert(gfx);
      },
      postUpdate(dt){
        this.g.dynamic && this.g.moveStars(dt)
      }
    },{fps:90, count:100, minVel:15, maxVel:30 });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Emit something every so often...
     * @class
     */
    class Periodic {
      #interval;
      #ctor;
      #timer;
      #size;
      #pool;
      constructor(ctor,intervalSecs,size=16){
        this.#interval=intervalSecs;
        this.#ctor=ctor;
        this.#timer=0;
        this.#size=size
        this.#pool=_.fill(size,ctor);
      }
      lifeCycle(dt){
        this.#timer += dt;
        if(this.#timer > this.#interval){
          this.#timer = 0;
          this.discharge();
        }
      }
      discharge(){
        throw `Periodic: please implement action()` }
      reclaim(o){
        if(this.#pool.length<this.#size) this.#pool.push(o)
      }
      take(){
        return this.#pool.length>0? this.#pool.pop(): this.#ctor()
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function Camera(e,worldWidth,worldHeight,canvas){
      const
        _height= canvas?.height ?? worldHeight,
        _width= canvas?.width ?? worldWidth,
        sigs=[],
        world=e,
        h2=int(_height/2),
        w2=int(_width/2),
        h4=int(_height/4),
        w4=int(_width/4);
      let
        _x=0,
        _y=0,
        self={
          dispose(){ Mojo.off(self) },
          //changing the camera's xy pos shifts pos of the world in the opposite direction
          //e.g. panning camera right means pulling world to left
          set x(v){ _x=v; e.x= -_x },
          set y(v){ _y=v; e.y= -_y },
          get x(){ return _x },
          get y(){ return _y },
          worldHeight,
          worldWidth,
          width: _width,
          height: _height,
          follow(s){
            //Check the sprites position in relation to the viewport.
            //Move the camera to follow the sprite if the sprite
            //strays outside the viewport
            const bx= _.feq0(s.angle)? _S.getAABB(s) : _S.boundingBox(s);
            { if(bx.x1< this.x+int(w2-w4)){ this.x = bx.x1-w4 }}//left
            { if(bx.x2> this.x+int(w2+w4)){ this.x = bx.x2-w4*3 }}//right
            { if(bx.y1< this.y+int(h2-h4)){ this.y = bx.y1-h4 }}//top
            { if(bx.y2> this.y+int(h2+h4)){ this.y = bx.y2- h4*3 }}//bottom
            //clamp the camera
            if(this.x<0){ this.x = 0 }
            if(this.y<0){ this.y = 0 }
            if(this.x+_width > worldWidth){ this.x= worldWidth - _width }
            if(this.y+_height > worldHeight){ this.y= worldHeight - _height }
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
            return s;
          },
          //NOTE: old fashion funcdef when `arguments` is used
          centerOver:function(s,y){
            if(arguments.length==1 && !is.num(s)){
              const c=_S.centerXY(s);
              this.x = c[0]- w2;
              this.y = c[1] - h2;
            }else{
              if(is.num(s)) this.x=s - w2;
              if(is.num(y)) this.y=y - h2;
            }
            return s;
          }
        };
      Mojo.on(["post.remove",e],"dispose",self);
      return self;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function Meander(e){
      function boomFn(e,col,dv,signal){
        //Mojo.CON.log(`boomFn dv=${dv}, signal=${signal}`);
        col.impact=abs(dv);
        Mojo.emit([signal, e],col);
      }
      const colls=[];
      const self={
        dispose(){ Mojo.off(self) },
        boom(col){
          _.assert(col.A===e,"got hit by someone else???");
          if(col.B && col.B.m5.sensor){
            //tell sensor it got hit by A
            Mojo.emit(["bump.sensor", col.B], col.A)
          }else{
            let b=0,[dx,dy]= e.m5.vel;
            col.impact=UNDEF;
            //update position
            _V.sub$(e,col.overlapV);
            if(col.overlapN[1] < -0.3){
              dy<0?(e.m5.skipHit?0: _V.setY(e.m5.vel,0)):0;
              boomFn(e,col,dy,"bump.top");
            }else if(col.overlapN[1] > 0.3){
              dy>0?(e.m5.skipHit?0: _V.setY(e.m5.vel,0)):0;
              boomFn(e,col,dy,"bump.bottom");
            }
            if(col.overlapN[0] < -0.3){
              dx<0?(e.m5.skipHit?0: _V.setX(e.m5.vel,0)):0;
              boomFn(e,col,dx,"bump.left");
            }else if(col.overlapN[0] > 0.3){
              dx>0?(e.m5.skipHit?0: _V.setX(e.m5.vel,0)):0;
              boomFn(e,col,dx,"bump.right");
            }
            if(col.impact===UNDEF){ col.impact=0 }else{
              Mojo.emit(["bump.*",e],col);
            }
          }
          colls.push(col);
        }
      };
      Mojo.on(["hit",e],"boom", self);
      Mojo.on(["post.remove",e],"dispose",self);
      return function(dt){
        colls.length=0;
        _S.move(e,dt) && e.parent.collideXY(e);
        return colls.length>0?colls[0]:UNDEF;
      };
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function Jitter(e,jumpSpeed,jumpKey){
      jumpSpeed= jumpSpeed ?? -300;
      jumpKey= jumpKey ?? _I.UP;
      //give some time to ease into or outof that ground state
      //instead of just on or off ground,
      let jumpCnt=0, ground=0, j3= jumpSpeed/3;
      const _DT15=1/15;
      const self={
        onGround(){ ground=_DT15 },
        dispose(){ Mojo.off(self) } };
      Mojo.on(["bump.bottom",e],"onGround",self);
      return function(dt,col){
        if(!e.m5.skipHit){
          let
            vs= e.m5.speed,
            pR= _I.keyDown(_I.RIGHT),
            pL= _I.keyDown(_I.LEFT),
            pU= _I.keyDown(jumpKey);
          if(col && (pL || pR || ground>0)){
            //too steep to go up or down
            if(col.overlapN[1] > 0.85 ||
               col.overlapN[1] < -0.85){ col= UNDEF }
          }
          if(pL && !pR){
            e.m5.heading = Mojo.LEFT;
            if(col && ground>0){
              _V.set(e.m5.vel, vs * col.overlapN[1], -vs * col.overlapN[0])
            }else{
              _V.setX(e.m5.vel,-vs)
            }
          }else if(pR && !pL){
            e.m5.heading = Mojo.RIGHT;
            if(col && ground>0){
              _V.set(e.m5.vel, -vs * col.overlapN[1], vs * col.overlapN[0])
            }else{
              _V.setX(e.m5.vel, vs)
            }
          }else{
            _V.setX(e.m5.vel,0);
          }
          if(ground>0 && jumpCnt==0 && pU){
            //handle jumpy things, very first jump
            _V.setY(e.m5.vel, jumpSpeed);
            jumpCnt +=1;
            ground = -dt;
          }else if(pU){
            //held long enough, tell others it's jumping
            if(jumpCnt<2){
              jumpCnt +=1;
              Mojo.emit(["jump",e]);
            }
          }
          if(jumpCnt && !pU){
            jumpCnt = 0;
            Mojo.emit(["jumped",e]);
            if(e.m5.vel[1] < j3){ e.m5.vel[1] = j3 }
          }
          if(ground>0) e.m5.vel[1]=0;
        }
        ground -=dt;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function MazeRunner(e,frames){
      const self={ dispose(){ Mojo.off(self) } };
      return function(dt,col){
        let
          [vx,vy]=e.m5.vel,
          vs=e.m5.speed,
          mx = !_.feq0(vx),
          my = !_.feq0(vy);
        if(!(mx&&my) && frames){
          if(my){
            if(is.obj(frames)){
              e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP]);
            }else if(frames){
              e.angle=vy>0?180:0;
            }
          }
          if(mx){
            if(is.obj(frames)){
              e.m5.showFrame(frames[vx>0?Mojo.RIGHT:Mojo.LEFT]);
            }else if(frames){
              e.angle=vx>0?90:-90;
            }
          }
        }

        let
          bt=Mojo.u.touchOnly,
          r=bt ? (e.m5.heading==Mojo.RIGHT) : (_I.keyDown(_I.RIGHT) && Mojo.RIGHT),
          l=bt ? (e.m5.heading==Mojo.LEFT) : (_I.keyDown(_I.LEFT) && Mojo.LEFT),
          u=bt ? (e.m5.heading==Mojo.UP) : (_I.keyDown(_I.UP) && Mojo.UP),
          d=bt ? (e.m5.heading==Mojo.DOWN) : (_I.keyDown(_I.DOWN) && Mojo.DOWN);

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
          _V.setY(e.m5.vel,vs);
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Sprite walks back and forth, like a patrol.
     * @memberof module:mojoh5/Ute2D
     * @param {PIXI/Sprite} e
     * @param {boolean} xDir walk left and right
     * @param {boolean} yDir walk up and down
     * @return {PatrolObj}
     */
    function Patrol(e,xDir,yDir){
      const sigs=[];
      const self={
        dispose(){ Mojo.off(self) },
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

      if(xDir){
        Mojo.on(["bump.right",e],"goLeft",self);
        Mojo.on(["bump.left",e],"goRight",self); }
      if(yDir){
        Mojo.on(["bump.top",e],"goDown",self);
        Mojo.on(["bump.bottom",e],"goUp",self); }

      Mojo.on(["post.remove",e],"dispose",self);
      return self;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      Periodic,
      Meander,
      Camera,
      Patrol,
      Jitter,
      MazeRunner,
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //steering stuff
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @return {Sprite}
       */
      seek(s, pos){
        const dv = _V.unit$(_V.sub(pos,s));
        if(dv){
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer,dv); }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       * @return {Sprite}
       */
      flee(s, pos,range){
        //only flee if the target is within 'panic distance'
        let dv=_V.sub(s,pos), n=_V.len2(dv);
        if(range === undefined)
          range= s.m5.steerInfo.tooCloseDistance;
        if(n>range*range){}else{
          if(!_V.unit$(dv)) dv=[0.1,0.1];
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer, dv);
        }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       * @return {Sprite}
       */
      arrive(s, pos,range){
        let r=1, n= _V.dist(s,pos);
        let dv = _V.unit$(_V.sub(pos,s));
        if(range === undefined)
          range= s.m5.steerInfo.arrivalThreshold;
        if(n>range){}else{ r=n/range }
        _V.mul$(dv,s.m5.maxSpeed * r);
        _V.sub$(dv,s.m5.vel);
        _V.add$(s.m5.steer,dv);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} target
       * @return {Sprite}
       */
      pursue(s,target){
        return this.seek(s,
                         //predicted pos
                         _V.add(target,
                                _V.mul(target.m5.vel,
                                       // lookahead time
                                       _V.dist(s,target) / s.m5.maxSpeed)))
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} target
       * @return {Sprite}
       */
      evade(s,target){
        return this.flee(s,
                         //predicted pos
                         _V.sub(target,
                                _V.mul(target.m5.vel,
                                       //lookahead time
                                       _V.dist(s,target) / s.m5.maxSpeed)))

      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @return {Sprite}
       */
      idle(s){
        _V.mul$(s.m5.vel,0);
        _V.mul$(s.m5.steer,0);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @return {Sprite}
       */
      wander(s){
        let
          offset = _V.mul$([1,1], s.m5.steerInfo.wanderRadius),
          n=_V.len(offset),
          center= _V.mul$(_V.unit(s.m5.vel), s.m5.steerInfo.wanderDistance);
        offset[0] = Math.cos(s.m5.steerInfo.wanderAngle) * n;
        offset[1] = Math.sin(s.m5.steerInfo.wanderAngle) * n;
        s.m5.steerInfo.wanderAngle += _.rand() * s.m5.steerInfo.wanderRange - s.m5.steerInfo.wanderRange * 0.5;
        _V.add$(s.m5.steer, _V.add$(center,offset));
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} targetA
       * @param {Sprite} targetB
       * @return {Sprite}
       */
      interpose(s,targetA, targetB){
        let
          mid= _V.div$(_V.add(targetA,targetB),2),
          dt= _V.dist(s,mid) / s.m5.maxSpeed,
          pA = _V.add(targetA, _V.mul(targetA.m5.vel,dt)),
          pB = _V.add(targetB,_V.mul(targetB.m5.vel,dt));
        return this.seek(s, _V.div$(_V.add$(pA,pB),2));
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} separationRadius
       * @param {number} maxSeparation
       * @return {Sprite}
       */
      separation(s, ents, separationRadius=300, maxSeparation=100){
        let force = [0,0], neighborCount = 0;
        ents.forEach(e=>{
          if(e !== s && _V.dist(e,s) < separationRadius){
            _V.add$(force,_V.sub(e,s));
            ++neighborCount;
          }
        });
        if(neighborCount > 0)
          _V.flip$(_V.div$(force,neighborCount));
        _V.add$(s.m5.steer, _V.mul$(_V.unit$(force), maxSeparation));
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} leader
       * @param {array} ents
       * @param {number} distance
       * @param {number} separationRadius
       * @param {number} maxSeparation
       * @param {number} leaderSightRadius
       * @param {number} arrivalThreshold
       * @return {Sprite}
       */
      followLeader(s,leader, ents, distance=400, separationRadius=300,
                   maxSeparation = 100, leaderSightRadius = 1600, arrivalThreshold=200){
        function isOnLeaderSight(s,leader, ahead, leaderSightRadius){
          return _V.dist(ahead,s) < leaderSightRadius ||
                 _V.dist(leader,s) < leaderSightRadius
        }
        let tv = _V.mul$(_V.unit(leader.m5.vel),distance);
        let behind, ahead = _V.add(leader,tv);
        _V.flip$(tv);
        behind = _V.add(leader,tv);
        if(isOnLeaderSight(s,leader, ahead, leaderSightRadius)){
          this.evade(s,leader);
        }
        this.arrive(s,behind,arrivalThreshold);
        return this.separation(s,ents, separationRadius, maxSeparation);
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} maxQueueAhead
       * @param {number} maxQueueRadius
       * @return {Sprite}
       */
      queue(s,ents, maxQueueAhead=500, maxQueueRadius = 500){
        function getNeighborAhead(){
          let qa=_V.mul$(_V.unit(s.m5.vel),maxQueueAhead);
          let res, ahead = _V.add(s, qa);
          for(let d,i=0; i<ents.length; ++i){
            if(ents[i] !== s &&
               _V.dist(ahead,ents[i]) < maxQueueRadius){
              res = ents[i];
              break;
            }
          }
          return res;
        }
        let neighbor = getNeighborAhead();
        let brake = [0,0], v = _V.mul(s.m5.vel,1);
        if(neighbor){
          brake = _V.mul$(_V.flip(s.m5.steer),0.8);
          _V.unit$(_V.flip$(v));
          _V.add$(brake,v);
          if(_V.dist(s,neighbor) < maxQueueRadius){
            _V.mul$(s.m5.vel,0.3)
          }
        }
        _V.add$(s.m5.steer,brake);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @return {Sprite}
       */
      flock(s, ents){
        function inSight(e){
          return _V.dist(s,e) > s.m5.steerInfo.inSightDistance ? false
                                        : (_V.dot(_V.sub(e, s), _V.unit(s.m5.vel)) < 0 ? false : true);
        }
        let
          inSightCount = 0,
          averagePosition = [0,0],
          averageVelocity = _V.mul(s.m5.vel,1);
        ents.forEach(e=>{
          if(e !== this && inSight(e)){
            _V.add$(averageVelocity,e.m5.vel);
            _V.add$(averagePosition,e);
            if(_V.dist(s,e) < s.m5.steerInfo.tooCloseDistance){
              this.flee(s, e)
            }
            ++inSightCount;
          }
        });
        if(inSightCount>0){
          _V.div$(averageVelocity, inSightCount);
          _V.div$(averagePosition,inSightCount);
          this.seek(s,averagePosition);
          _V.add$(s.m5.steer, _V.sub$(averageVelocity, s.m5.vel));
        }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} path
       * @param {boolean} loop
       * @param {number} thresholdRadius
       * @return {Sprite}
       */
      followPath(s, path, loop, thresholdRadius=1){
        let wayPoint = path[s.m5.pathIndex];
        if(!wayPoint){return}
        if(_V.dist(s, wayPoint) < thresholdRadius){
          if(s.m5.pathIndex >= path.length-1){
            if(loop)
              s.m5.pathIndex = 0;
          }else{
            s.m5.pathIndex += 1;
          }
        }
        (s.m5.pathIndex >= path.length-1 && !loop) ? this.arrive(s,wayPoint)
                                                   : this.seek(s,wayPoint);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} obstacles
       * @return {Sprite}
       */
      avoid(s,obstacles){
        let
          avoidance, mostThreatening = null,
          dlen= _V.len(s.m5.vel) / s.m5.maxSpeed,
          ahead = _V.add(s, _V.mul$(_V.unit(s.m5.vel),dlen)),
          ahead2 = _V.add(s, _V.mul$(_V.unit(s.m5.vel),s.m5.steerInfo.avoidDistance*0.5));
        for(let c,i=0; i<obstacles.length; ++i){
          if(obstacles[i] === this) continue;
          c = _V.dist(obstacles[i],ahead) <= obstacles[i].m5.radius ||
              _V.dist(obstacles[i],ahead2) <= obstacles[i].m5.radius;
          if(c)
            if(mostThreatening === null ||
               _V.dist(s,obstacles[i]) < _V.dist(s, mostThreatening)){
              mostThreatening = obstacles[i]
            }
        }
        if(mostThreatening){
          avoidance = _V.mul$(_V.unit$(_V.sub(ahead,mostThreatening)),100);
          _V.add$(s.m5.steer,avoidance);
        }
        return s;
      },
      /**Check if there’s clear line of sight between two sprites.
       * memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} obstacles
       * @return {boolean}
       */
      lineOfSight(s1, s2, obstacles){
        let c1=_S.centerXY(s1), c2=_S.centerXY(s2);
        for(let b,rc,s,o,i=0;i<obstacles.length;++i){
          o=obstacles[i];
          rc=o.m5.circle? Geo.hitTestLineCircle(c1,c2, o.x, o.y, o.width/2)
                        : Geo.hitTestLinePolygon(c1,c2, Geo.bodyWrap(_S.toPolygon(o),o.x,o.y));
          if(rc[0]) return false;
        }
        return true;
      },
      /**Create a projectile being fired out of a shooter.
       * @memberof module:mojoh5/Ute2D
       * @param {any} src
       * @param {number} angle
       * @param {number} speed
       * @param {function} ctor
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      shoot(src, angle, speed, ctor,x,y){
        const b=ctor(), soff=_S.topLeftOffsetXY(src);
        _V.add$(soff,[x,y]);
        _V.copy(b,_V.add(src,soff));
        _V.set(b.m5.vel, Math.cos(angle) * speed,
                         Math.sin(angle) * speed);
        return b;
      },
      /**Create a HealthBar widget.
       * @memberof module:mojoh5/Ute2D
       * @param {HealthBarConfig} cfg
       * @return {HealthBarObj}
       */
      healthBar(arg){
        let {scale:K,width,height, lives, borderWidth,line,fill}=arg;
        let c, padding=4*K, fit=4*K, out=[];
        borderWidth = (borderWidth||4)*K;
        lives= lives||3;
        fill=_S.color(fill);
        line=_S.color(line);
        for(let r,w=int(width/lives), i=0;i<lives;++i){
          out.push(_S.rect(w,height-2*borderWidth,fill))
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
                                  borderWidth,
                                  border:line,padding,fit})
        }
      },
      //modified from original source: codepen.io/johan-tirholm/pen/PGYExJ
      /**Create a gauge like speedometer.
       * @memberof module:mojoh5/Ute2D
       * @param {GaugeUIConfig} cfg
       * @return {GaugeUIObj}
       */
      gaugeUI(arg){
        let
          {minDeg,maxDeg,line,gfx,scale:K,
           cx,cy,radius,alpha,fill,needle }= _.patch(arg,{minDeg:90,maxDeg:360});
        const segs= [0, R*45, R*90, R*135, R*180, R*225, R*270, R*315];
        function getPt(x, y, r,rad){ return [x + r * cos(rad), y + r * sin(rad) ] }
        function drawTig(x, y, rad, size){
          let
            [sx,sy] = getPt(x, y, radius - 4*K, rad),
            [ex,ey] = getPt(x, y, radius - 12*K, rad);
          _S.gpath(gfx, [["moveTo",sx, sy],
                        ["lineTo",ex, ey], ["closePath"]]);
          _S.gstroke(gfx,{color: line, width:size, cap:"round"});
        }
        function drawPtr(r,color, rad){
          let
            [px,py]= getPt(cx, cy, r - 20*K, rad),
            [p2x,p2y] = getPt(cx, cy, 2*K, rad+R*90),
            [p3x,p3y] = getPt(cx, cy, 2*K, rad-R*90);
          _S.gpath(gfx, [["moveTo",p2x, p2y],
                         ["lineTo",px, py], ["lineTo",p3x, p3y], ["closePath"]]);
          _S.gstroke(gfx,{cap:"round", width:4*K, color: needle});
          _S.gcircle(gfx,cx,cy,9*K);
          _S.gfill(gfx,{color:line});
          _S.gstroke(gfx,{color:line});
        }
        needle=_S.color(needle);
        line=_S.color(line);
        fill=_S.color(fill);
        radius *= K;
        return {
          gfx,
          draw(){
            _S.gclear(gfx);
            _S.gcircle(gfx,cx, cy, radius);
            _S.gfill(gfx,{color:fill, alpha});
            _S.gstroke(gfx,{width: radius/8,color:line});
            segs.forEach(s=> drawTig(cx, cy, s, 7*K));
            drawPtr(radius*K, fill, R* _M.lerp(minDeg, maxDeg, arg.update()));
          }
        }
      }
    };

    return (Mojo["Ute2D"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Ute2D"]=(M)=>{
      return M["Ute2D"] ? M["Ute2D"] : _module(M) } }

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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  if(!gscope.AudioContext){
    throw "Fatal: no audio."
  }

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module.
   */
  function _module(Mojo,SoundFiles){

    const {ute:_, is}=Mojo;
    const int=Math.floor;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Sound
     */
    ////////////////////////////////////////////////////////////////////////////
    const _actives=new Map();
    let _sndCnt=1;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _make(_A,name, url){
      let
        _pan=0,
        _vol=1;
      const s={
        sids: new Map(),
        buffer:UNDEF,
        loop:false,
        src: url,
        name,
        //-1(left speaker)
        //1(right speaker)
        get pan(){ return _pan },
        set pan(v){ _pan= v },
        get vol(){ return _vol },
        set vol(v){ _vol=v },
        play(){
          const now = _.now();
          const s= this.name;
          if(Mojo.Sound.sfx()&&
             !_debounce(s,now)){
            let
              sid = _sndCnt++,
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
          return this;
        },
        stop(){
          this.sids.forEach(s=> s.stop(0));
          this.sids.length=0;
          return this;
        }
      };
      return SoundFiles[name]=s;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
        return this._mute==0
      },
      /**Turn sound off.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      mute(){
        return (this._mute=1) && this
      },
      /**Turn sound on.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      unmute(){
        return (this._mute=0) || this
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
                                            Mojo.CON.log(`decoded sound file:${url}`); },
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
        let
          xhr= new XMLHttpRequest(),
          snd= _make(this,name, url);
        xhr.open("GET", url, true);
        xhr.responseType="arraybuffer";
        xhr.addEventListener("load", ()=>{
          this.decodeData(url, xhr.response, onLoad, onFail)
        });
        xhr.send();
        return snd;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Extend Mojo */
    Mojo.sound=function(fname,panic=true){
      return SoundFiles[fname || Mojo.assetPath(fname)] || (panic?_.assert(false, `Sound: ${fname} not loaded.`):UNDEF)
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Creates the module. */
  function _module(Mojo){

    const {
      math:_M,
      v2:_V,
      ute:_,
      is,
      Sprites
    }=Mojo;

    const {Geo}=Sprites;
    const Layers= [];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const SKEYS= ["ctrlKey","altKey","shiftKey"];
    const cur=()=> Layers[0];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function mkLayer(L={}){
      function _u(e){
        if(L===cur()){
          let o= L.keyInputs.get(e.keyCode);
          if(!o){
            o={};
            L.keyInputs.set(e.keyCode,o);
          }
          o.state=false;
          _.copyKeys(o,e,SKEYS);
          e.preventDefault();
        }
      }
      function _d(e){
        if(L===cur()){
          let o= L.keyInputs.get(e.keyCode);
          if(!o){
            o={};
            L.keyInputs.set(e.keyCode,o);
          }
          o.state=true;
          _.copyKeys(o,e,SKEYS);
          e.preventDefault();
        }
      }
      _.inject(L,{
        yid: `yid#${_.nextId()}`,
        keyInputs: _.jsMap(),
        pauseInput:false,
        ptr:UNDEF,
        /**
        */
        dispose(){
          this.ptr.dispose();
          if(!Mojo.touchDevice)
            _.delEvent([["keyup", globalThis, _u, false],
                        ["keydown", globalThis, _d, false]]);
        },
        /**
        */
        pointer(){
          if(!this.ptr)
            this.ptr=mkPtr(this); return this.ptr; },
        /**
        */
        update(dt){
          if(!this.pauseInput) this.ptr.update(dt);
        },
        /**
        */
        keybd(_key,pressCB,releaseCB){
          let ret={
              press:pressCB,
              release:releaseCB
            },
            self=this, isUp=true, isDown=false, codes= is.vec(_key)?_key:[_key];

          function _down(e){
            if(L===cur()){
              if(codes.includes(e.keyCode)){
                if(!self.pauseInput && isUp)
                  ret.press?.(e.altKey,e.ctrlKey,e.shiftKey);
                isUp=false;
                isDown=true;
              }
              e.preventDefault();
            }
          }
          function _up(e){
            if(L===cur()){
              if(codes.includes(e.keyCode)){
                if(!self.pauseInput && isDown)
                  ret.release?.(e.altKey,e.ctrlKey,e.shiftKey);
                isUp=true;
                isDown=false;
              }
              e.preventDefault();
            }
          }
          if(!Mojo.touchDevice)
            _.addEvent([["keyup", globalThis, _up, false],
                        ["keydown", globalThis, _down, false]]);
          ret.dispose=()=>{
            if(!Mojo.touchDevice)
              _.delEvent([["keyup", globalThis, _up, false],
                          ["keydown", globalThis, _down, false]]);
          };
          return ret;
        },
        /**
        */
        reset(){
          this.pauseInput=false;
          this.keyInputs.clear();
          this.ptr.reset();
        },
        /**
        */
        resize(){
          Mojo.mouse=this.ptr;
          this.ptr.reset();
        },
        /**
        */
        dbg(){
          console.log(`N# of touches= ${this.ptr.ActiveTouches.size}`);
          console.log(`N# of hotspots= ${this.ptr.Hotspots.length}`);
          console.log(`N# of buttons= ${this.ptr.Buttons.length}`);
          console.log(`N# of drags= ${this.ptr.DragDrops.length}`);
          console.log(`Mouse pointer = ${this.ptr}`);
        }
      });

      L.pointer();

      if(!Mojo.touchDevice)
        //keep tracks of keyboard presses
        _.addEvent([["keyup", globalThis, _u, false],
                    ["keydown", globalThis, _d, false]]);

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
        dragged: UNDEF,
        dragOffsetX: 0,
        dragOffsetY: 0,
        anchor: Mojo.makeAnchor(0.5,0.5),
        get cursor(){ return Mojo.canvas.style.cursor },
        set cursor(v){ Mojo.canvas.style.cursor = v },
        get x(){ return this._x / Mojo.scale },
        get y(){ return this._y / Mojo.scale },
        get visible(){ return this._visible },
        get isUp(){return this.state[1]},
        get isDown(){return this.state[0]},
        set visible(v){
          this.cursor = v ? "auto" : "none";
          this._visible = v;
        },
        updateMultiDrags(dt){
          let cs, self=P;
          self.ActiveTouches.forEach((a,k)=>{
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
          });
        },
        /**
        */
        updateDrags(dt){
          if(this.state[0]){
            if(this.dragged){
              _V.set(this.dragged, this.dragStartX+(this.x-this.dragPtrX),
                                   this.dragStartY+(this.y-this.dragPtrY));
            }else{
              for(let gp,cs,s,i=this.DragDrops.length-1; i>=0; --i){
                s=this.DragDrops[i];
                if(s.m5.drag && this.hitTest(s)){
                  this.dragStartX = s.x;
                  this.dragStartY = s.y;
                  this.dragPtrX= this.x;
                  this.dragPtrY= this.y;
                  this.dragged = s;
                  //pop it up to top
                  //cs= s.parent.children;
                  //_.disj(cs,s);
                  //cs.push(s);
                  gp=s.parent;
                  gp.removeChild(s);
                  gp.addChild(s);
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
            this.dragged=UNDEF;
          }
        },
        /**
        */
        getGlobalPosition(){
          return {x: this.x, y: this.y}
        },
        /**
        */
        _press(){
          if(L!==cur()){return}
          let
            i, s, found,
            z=this.Buttons.length;
          for(i=0;i<z;++i){
            s=this.Buttons[i];
            if(s.m5.gui && s.m5.press && this.hitTest(s)){
              s.m5.press(s);
              found=true;
              break;
            }
          }
          if(!found)
            for(i=0;i<z;++i){
              s=this.Buttons[i];
              if(s.m5.press && this.hitTest(s)){
                s.m5.press(s);
                break;
              }
            }
        },
        /**
        */
        _doMDown(b){
          if(L!==cur()){return}
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
        /**
        */
        mouseDown(e){
          if(L!==cur()){return}
          let self=P, nn=_.now();
          //left click only
          if(e.button==0){
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
              Mojo.emit([`${L.yid}/mousedown`]);
              self._doMDown(true);
            }
            //console.log(`mouse x= ${self.x}, y = ${self.y}`);
          }
        },
        /**
        */
        mouseMove(e){
          if(L!==cur()){return}
          let self=P;
          self._x = e.pageX - e.target.offsetLeft;
          self._y = e.pageY - e.target.offsetTop;
          //e.preventDefault();
          if(!L.pauseInput)
            Mojo.emit([`${L.yid}/mousemove`]);
        },
        /**
        */
        mouseUp(e){
          if(L!==cur()){return}
          let self=P,nn=_.now();
          if(e.button==0){
            e.preventDefault();
            self.elapsedTime = Math.max(0, nn - self.downTime);
            self._x = e.pageX - e.target.offsetLeft;
            self._y = e.pageY - e.target.offsetTop;
            _.setVec(self.state,false,true);
            if(!L.pauseInput){
              Mojo.emit([`${L.yid}/mouseup`]);
              if(!self._doMDown(false)){
                let v= _V.vecAB(self.downAt,self);
                let z= _V.len2(v);
                //small distance and fast then a click
                if(z<400 && self.elapsedTime<200){
                  Mojo.emit([`${L.yid}/single.tap`]);
                  self._press();
                }else{
                  self._swipeMotion(v,z,self.elapsedTime);
                }
              }
            }
          }
        },
        /**
        */
        _swipeMotion(v,dd,dt,arg){
          if(L!==cur()){return}
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
            Mojo.emit([`${L.yid}/${rc}`], arg)
        },
        /**
        */
        _doMTouch(ts,flag){
          if(L!==cur()){return}
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
        /**
        */
        _doMDrag(ts,found){
          if(L!==cur()){return}
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
        /**
        */
        touchCancel(e){
          if(L!==cur()){return}
          console.warn("received touchCancel event!");
          this.freeTouches();
        },
        /**
        */
        touchStart(e){
          if(L!==cur()){return}
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
            if(i==0){
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
            Mojo.emit([`${L.yid}/touchstart`],out);
            self._doMTouch(out,true);
          }
        },
        /**
        */
        touchMove(e){
          if(L!==cur()){return}
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
            Mojo.emit([`${L.yid}/touchmove`],out);
        },
        /**
        */
        touchEnd(e){
          if(L!==cur()){return}
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
            Mojo.emit([`${L.yid}/touchend`],out);
            let found= self._doMTouch(out,false);
            self._doMDrag(out,found);
            self._onMultiTouches(out,found);
          }
        },
        /**
        */
        _onMultiTouches(ts,found){
          if(L!==cur()){return}
          let self=P;
          for(let a,v,z,j=0; j<ts.length; ++j){
            a=ts[j];
            if(found.get(a.id)){continue}
            v= _V.vecAB(a.downAt,a);
            z= _V.len2(v);
            if(z<400 && a.elapsedTime<200){
              Mojo.emit([`${L.yid}/single.tap`],a);
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
        /**
        */
        freeTouches(){
          _.setVec(this.state,false,true);
          this.touchZeroID=0;
          this.ActiveTouches.clear();
          this.ActiveDrags.clear();
          this.ActiveDragsID.clear();
        },
        /**
        */
        reset(){
          _.setVec(this.state,false,true);
          this.freeTouches();
          this.DragDrops.length=0;
          this.Buttons.length=0;
          this.Hotspots.length=0;
        },
        /**
        */
        _test(s,x,y){
          let _S=Mojo.Sprites,
              g=_S.gposXY(s),
              p=_S.toPolygon(s),
              ps=_V.translate(g,p.calcPoints);
          return Geo.hitTestPointInPolygon(x, y, ps);
        },
        /**
        */
        hitTest(s){
          return this._test(s,this.x, this.y)
        },
        /**
        */
        update(dt){
          if(this.DragDrops.length>0)
            Mojo.touchDevice? this.updateMultiDrags(dt) : this.updateDrags(dt);
        }
      };

      //////
      const msigs=[["mousemove", Mojo.canvas, P.mouseMove],
                  ["mousedown", Mojo.canvas,P.mouseDown],
                  ["mouseup", globalThis, P.mouseUp]];
      const tsigs=[["touchmove", Mojo.canvas, P.touchMove],
                  ["touchstart", Mojo.canvas, P.touchStart],
                  ["touchend", globalThis, P.touchEnd],
                  ["touchcancel", globalThis, P.touchCancel]];

      Mojo.touchDevice? _.addEvent(tsigs) : _.addEvent(msigs);

      P.dispose=function(){
        this.reset();
        Mojo.touchDevice? _.delEvent(tsigs) : _.delEvent(msigs);
      };

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
      _cur(){ return cur() },
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
        let o=cur().keyInputs.get(k);
        if(!o){
          o={};
          cur().keyInputs.set(k,o);
        }
        o.state=true;
      },
      /**Fake a keypress(up).
       * @memberof module:mojoh5/Input
       */
      setKeyOff(k){
        let o=cur().keyInputs.get(k);
        if(!o){
          o={};
          cur().keyInputs.set(k,o);
        }
        o.state=false;
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
      makeButton(b,gui=false){
        _.conj(cur().ptr.Buttons,b);
        b.m5.button=true;
        b.m5.gui=gui;
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
      undoXXX(o){
        if(o && o.m5){
          o.m5.drag && this.undoDrag(o);
          o.m5.button && this.undoButton(o);
          o.m5.hotspot && this.undoHotspot(o);
        }
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
      keyDown(code){
        let o= cur().keyInputs.get(code);
        return (o && o.state) ? o : UNDEF;
      },
      /**Create the default mouse pointer.
       * @memberof module:mojoh5/Input
       * @return {object}
       */
      pointer(){
        return cur().pointer()
      },
      dispose(){
        Layers.forEach(a => a.dispose());
        Layers.length=0;
      },
      restore(){
        if(Layers.length>1){
          Layers.shift().dispose()
          cur().pauseInput=false;
        }
      },
      save(){
        Layers.unshift(mkLayer());
      },
      on(...args){
        _.assert(is.vec(args[0])&&is.str(args[0][0]),"bad arg for Input.on()");
        args[0][0]=`${cur().yid}/${args[0][0]}`;
        return Mojo.on(...args);
      },
      off(...args){
        _.assert(is.vec(args[0])&&is.str(args[0][0]),"bad arg for Input.off()");
        args[0][0]=`${cur().yid}/${args[0][0]}`;
        return Mojo.off(...args);
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      P8=Math.PI/8,
      P8_3=P8*3,
      P8_5=P8*5,
      P8_7= P8*7,
      {Sprites:_S, Input:_I, is,ute:_}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      sin=Math.sin,
      cos=Math.cos,
      abs=Math.abs,
      RTA=180/Math.PI;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Touch
     */
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function _calcDir(cx,cy){
      const rad= Math.atan2(+cy, +cx);

      if(rad > -P8_5 && rad < -P8_3){
        //Mojo.CON.log("calcDir=UP");
        return Mojo.UP;
      }
      if(rad > P8_3 && rad < P8_5){
        //Mojo.CON.log("calcDir=DOWN");
        return Mojo.DOWN;
      }
      if((rad > -P8 && rad<0) || (rad > 0 && rad<P8)){
        //Mojo.CON.log("calcDir=RIGHT");
        return Mojo.RIGHT;
      }
      if((rad > P8_7 && rad<Math.PI) || (rad > -Math.PI && rad < -P8_7)){
        //Mojo.CON.log("calcDir=LEFT");
        return Mojo.LEFT;
      }

      if(rad > P8 && rad < P8_3){
        //Mojo.CON.log("calcDir= SE ");
        return Mojo.SE;
      }
      if(rad > P8_5 && rad < P8_7){
        //Mojo.CON.log("calcDir= SW ");
        return Mojo.SW;
      }
      if(rad> -P8_3 && rad < -P8){
        //Mojo.CON.log("calcDir= NE ");
        return Mojo.NE;
      }
      if(rad > -P8_7 && rad < -P8_5){
        //Mojo.CON.log("calcDir= NW ");
        return Mojo.NW;
      }
      _.assert(false,"Failed Joystick calcDir");
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function _bindEvents(s){
      function onDragStart(e){
        let
          t= e.target,
          ct=e.changedTouches;

        if(ct){
          e=ct[0];
          s.m5.touchId=ct[0].identifier;
        }else{
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
          s.m5.hdle.position.set(0,0);
          s.m5.drag= false;
          if(!s.m5.static){ s.visible=false }
          if(!_I.isPaused()) s.m5.onEnd();
        }
      }
      function onDragMove(e){
        if(_I.isPaused() || !s.visible || !s.m5.drag){return}
        let c,t= e.target;
        if(e.changedTouches){
          for(let i=0, ct=e.changedTouches; i< ct.length; ++i){
            if(s.m5.touchId == ct[i].identifier){
              c= [ct[i].pageX-t.offsetLeft,
                  ct[i].pageY-t.offsetTop];
              break;
            }
          }
        }else{
          c= [e.pageX - t.offsetLeft,
              e.pageY - t.offsetTop]
        }
        let
          angle = 0,
          X = c? (c[0]-s.m5.startX):0,
          Y = c? (c[1]-s.m5.startY):0,
          dir, sx, sy, limit=s.m5.range;
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
        sx=abs(X);
        sy=abs(Y);
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
            //Mojo.CON.log(`angle < 90`);
            // < 90
          }else if(X<0 && Y<0){
            // 90 ~ 180
            //Mojo.CON.log(`angle 90 ~ 180`);
            angle= 180 - angle;
          }else if(X<0 && Y>0){
            // 180 ~ 270
            //Mojo.CON.log(`angle 180 ~ 270`);
            angle += 180;
          }else if(X>0 && Y>0){
            // 270 ~ 360
            //Mojo.CON.log(`angle 270 ~ 360`);
            angle= 360 - angle;
          }
          dir= _calcDir(c[0],c[1]);
        }
        s.m5.hdle.position.set(c[0],c[1]);
        s.m5.onChange(dir,angle);
      }

      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      const sigs= [["mousemove", Mojo.canvas, onDragMove],
                   ["mousedown", Mojo.canvas, onDragStart],
                   ["mouseup", globalThis, onDragEnd],
                   ["touchend", globalThis, onDragEnd],
                   ["touchcancel", globalThis, onDragEnd],
                   ["touchmove", Mojo.canvas, onDragMove],
                   ["touchstart", Mojo.canvas, onDragStart]];
      _.addEvent(sigs);
      s.m5.dispose=()=>{ _.delEvent(sigs) };
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      assets:["boot/joystick.png","boot/joystick-handle.png"],
      /**Create the joystick.
       * @memberof module:mojoh5/Touch
       * @param {object} options
       * @return {PIXIContainer} the stick
       */
      joystick(options){
        let
          hdle= _S.sprite("boot/joystick-handle.png"),
          schtick= _S.sprite("boot/joystick.png"),
          C=_S.container(),
          K=Mojo.getScaleFactor(),
          mo= _.inject({oscale:0.7 * K,
                        iscale:1*K,
                        hdle,
                        schtick,
                        onEnd(){},
                        onStart(){},
                        prevDir:0,
                        static:false,
                        onChange(dir,angle){}}, options);
        C.addChild(_S.centerAnchor(_S.scaleXY(schtick,mo.oscale, mo.oscale)));
        C.addChild(_S.centerAnchor(_S.scaleXY(hdle,mo.iscale, mo.iscale)));
        mo.range = C.width/2.5;
        if(!mo.static)
          C.visible=false;
        _.inject(C.m5,mo);
        return _bindEvents(C);
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
  /**Create the module
  */
  function _module(Mojo){

    ////////////////////////////////////////////////////////////////////////////
    const _DIRS = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const {ute:_, is, v2:_V, math:_M}=Mojo;
    const abs=Math.abs, ceil=Math.ceil, int = Math.floor;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Tiles
     */
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    /**Convert the position into a grid index.
     * @param {number} x
     * @param {number} y
     * @param {number} cellW
     * @param {number} cellH
     * @param {number} widthInCols
     * @return {number}
     */
    function getIndex(x, y, cellW, cellH, widthInCols){
      return (x>=0 && y>= 0) ? int(x/cellW) + int(y/cellH) * widthInCols
                             : _.assert(false,`IndexError: ${x},${y}, wanted +ve values`) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** from xy position to array index */
    function _getIndex3(px, py, world){
      return getIndex(px,py,
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
      const p= obj.image?.split("/");
      obj.image= p && p.length && p[p.length-1] }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get attributes for this gid */
    ////////////////////////////////////////////////////////////////////////////
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
    ////////////////////////////////////////////////////////////////////////////
    function _tilesets(tsets, tsi, gprops){
      const gidList = [];
      tsets.forEach(ts=>{
        gidList.push([ts.firstgid, ts]);
        if(!ts.spacing) ts.spacing=0;
        _image(ts);
        const lprops ={};
        (ts.tiles || []).forEach(t=>{
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
      let
        tmap = Mojo.resource(json,true),
        tver= tmap && (tmap["tiledversion"] || tmap["version"]);
      return (tver &&
              _.cmpVerStrs(tver,"1.4.2") >= 0) ? tmap
                                               : _.assert(false,`${json} needs update`) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process properties group */
    ////////////////////////////////////////////////////////////////////////////
    function _parseProps(el){
      return (el.properties||[]).reduce((acc,p)=>{
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process the tiled map */
    ////////////////////////////////////////////////////////////////////////////
    function _loadTMX(scene,arg,objFactory){
      let
        tsProps={}, gtileProps={},
        tmx= is.str(arg)?_checkVer(arg):arg;
      _.assert(is.obj(tmx),"bad tiled map");
      //NOTE: important to clone it
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
      let
        K= scene.getScaleFactor(),
        NH= _.evenN(K*tmx.tileheight),
        NW= _.evenN(K*tmx.tilewidth);
      scene.tiled.new_tileW=NW;
      scene.tiled.new_tileH=NH;
      //workers
      const F={
        imagelayer(yy){ _image(yy) },
        tilelayer(yy){
          if(is.vec(yy.data[0])){
            //if 2D array, it's from hand-crafted map creation
            yy.width=yy.data[0].length;
            yy.height=yy.data.length;
            yy.data=yy.data.flat();
          }
          if(!yy.width) yy.width=scene.tiled.tilesInX;
          if(!yy.height) yy.height=scene.tiled.tilesInY;
          //maybe get layer's properties
          let cz,tps=_parseProps(yy);
          if(yy.visible === false){
            //the layer is invisible but maybe user wants to handle it
            if(cz=tps["Class"])
              objFactory[cz](scene,yy);
            return;
          }
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //process the tiles
          for(let s,gid,i=0;i<yy.data.length;++i){
            if((gid=yy.data[i])==0){ continue }
            if(yy.collision===false || tps.collision === false){
            }else if(yy.collision===true || tps.collision===true){
              if(gid>0) scene.tiled.collision[i]=gid;
              yy.collision=true;
            }
            let
              mapX = i % yy.width,
              mapY = int(i/yy.width),
              ps=gtileProps[gid],
              cz=ps && ps["Class"],
              cFunc=cz && objFactory[cz],
              tsi=scene.getTSInfo(gid),
              s=_ctorTile(scene,gid,mapX,mapY,tps.width,tps.height);
            //assume all these are static (collision) tiles
            if(s){
              s.tiled.layer=yy;
              s.tiled.index=i;
              s.m5.static=true;
            }
            if(cFunc)
              s=cFunc.c(scene,s,tsi,ps);
            if(s){
              scene.insert(s,!!cFunc);
              if(ps && ps.sensor) s.m5.sensor= true;
            }
          }
        },
        objectgroup(yy){
          yy.sprites=[];
          yy.objects.forEach(o=>{
            _.assert(is.num(o.x),"wanted xy position");
            let s,ps, os=_parseProps(o), gid=o.gid ?? -1;
            _.inject(o,os);
            if(gid>0) ps=gtileProps[gid];
            let
              cz= _.nor(ps && ps["Class"], o["Class"]),
              createFunc= cz && objFactory[cz],
              w=scene.tiled.saved_tileW,
              h=scene.tiled.saved_tileH,
              tx=_M.ndiv(o.x+w/2,w),
              ty=_M.ndiv(o.y-h/2,h),
              tsi=scene.getTSInfo(gid);
            o.column=tx;
            o.row=ty;
            s=gid<=0?{width:NW,height:NH}
                    :_ctorTile(scene,gid,tx,ty,o.width,o.height,cz);
            if(createFunc)
              s= createFunc.c(scene,s,tsi,ps,o);
            if(s){
              if(o.visible===false) s.visible=false;
              o.uuid=s.m5.uuid;
              yy.sprites.push(s);
              scene.insert(s,true);
              if(ps && ps.sensor) s.m5.sensor= true;
            }
          });
        }
      };
      objFactory= objFactory ?? {};
      _.inject(scene.tiled, {objFactory,
                             tileSets: tsProps,
                             tileProps: gtileProps,
                             collision: _.fill(tmx.width*tmx.height,0),
                             imagelayer:[], objectgroup:[], tilelayer:[],
                             tileGidList: _tilesets(tmx.tilesets,tsProps,gtileProps)});
      ["imagelayer","tilelayer","objectgroup"].forEach(s=>{
        tmx.layers.filter(yy=>yy.type==s).forEach(yy=>{
          F[s](yy);
          scene.tiled[s].push(yy);
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
          scene.parent.y = _M.ndiv(Mojo.height-scene.tiled.tiledHeight,2) }
        if(scene.tiled.tiledWidth<Mojo.width){
          scene.parent.x = _M.ndiv(Mojo.width-scene.tiled.tiledWidth,2) }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** create a sprite */
    ////////////////////////////////////////////////////////////////////////////
    function _ctorTile(scene,gid,mapX,mapY,tw,th,cz){
      let
        tsi=scene.getTSInfo(gid,true),
        cols=tsi.columns,
        id=gid - tsi.firstgid,
        ps=scene.tiled.tileProps[gid], cFunc, K= scene.getScaleFactor();

      cz= cz ?? (ps && ps["Class"]);
      cFunc=cz && scene.tiled.objFactory[cz];
      _.assertNot(id<0, `Bad tile id: ${id}`);
      if(!is.num(cols))
        cols=_M.ndiv(tsi.imagewidth , tsi.tilewidth+tsi.spacing);

      let
        tscol = id % cols,
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
    ////////////////////////////////////////////////////////////////////////////
    const _contactObj = Mojo.Sprites.lift({width: 0,
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
        _loadTMX(this, o.name, o.factory);
      }
      /**
      */
      runOnce(){
        const t= this.m5.options.tiled;
        this.preTMX?.(t);
        _loadTMX(this, t.name, t.factory);
        this.postTMX?.(t);
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
        let
          tx= int(x/this.tiled.tileW),
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
        const found= _.some(this.tiled.tilelayer, o=>{
          if(o.name==name) return o
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
        const found= _.some(this.tiled.objectgroup, o=>{
          if(o.name==name) return o
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
        let
          ts=this.getTSInfo(gid, true),
          id= gid-ts.firstgid,
          yy=this.getTileLayer(layer),
          s, pos=col + this.tiled.tilesInX * row;
        if(yy.collision)
          this.tiled.collision[pos]=gid;
        s=_ctorTile(this,gid,col,row,ts.tilewidth,ts.tileheight);
        if(s){
          s.tiled.index=pos;
          s.tiled.layer=yy;
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
        let
          tx= int(px/this.tiled.tileW),
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
        const out=[];
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
        let y=Mojo.height/(this.tiled.saved_tileH*this.tiled.tilesInY);
        let x=Mojo.width/(this.tiled.saved_tileW*this.tiled.tilesInX);
        let r=1;
        if(Mojo.u.scaleToWindow == "max"){
          r= (x<y)?x:y;
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
      getTSInfo(gid,panic){
        const r= _findGid(gid,this.tiled.tileGidList)[1];
        return (!r && panic) ? _.assert(false,`Bad GID ${gid}, no tileset`) : r }
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
        let
          _S=Mojo.Sprites,
          tw=this.tiled.tileW,
          th=this.tiled.tileH,
          tiles=this.tiled.collision,
          box=_.feq0(obj.angle)?_S.getAABB(obj):_S.boundingBox(obj),
          sX = Math.max(0,int(box.x1 / tw)),
          sY = Math.max(0,int(box.y1 / th)),
          eX =  Math.min(this.tiled.tilesInX-1,ceil(box.x2 / tw)),
          eY =  Math.min(this.tiled.tilesInY-1,ceil(box.y2 / th));
        for(let ps,c,gid,pos,B,tY = sY; tY<=eY; ++tY){
          for(let tX = sX; tX<=eX; ++tX){
            pos=tY*this.tiled.tilesInX+tX;
            gid=tiles[pos];
            _.assert(is.num(gid),"bad gid");
            if(gid==0){continue}
            B=this._getContactObj(gid,tX, tY);
            ps=this.getTileProps(gid);
            if(ps)
              B.m5.sensor= !!ps.sensor;
            B.parent=this;
            if(_S.hit(obj,B)){
              if(B.m5.sensor){
                Mojo.emit(["bump.sensor",obj],B); } }
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
        let
          vx = dest.col - test.col,
          vy = dest.row - test.row;
        return int(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let
          vx = abs(dest.col - test.col),
          vy = abs(dest.row - test.row);
        return (vx > vy) ? int(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : int(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
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
        let
          w=world.tiled.tilesInX,
          a= [index-w-1, index-w, index-w+1, index-1],
          b= [index+1, index+w-1, index+w, index+w+1];
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
        let ret = _.fill(gidList.length,0),
          _mapper=(s)=>{
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
        let W=world.tiled.tilesInX,
          nodes=tiles.map((gid,i)=> ({f:0, g:0, h:0,
                                      parent:null, index:i,
                                      col:i%W, row:int(i/W)})),
          targetNode = nodes[targetTile],
          startNode = nodes[startTile],
          centerNode = startNode,
          openList = [centerNode],
          closedList = [],
          theShortestPath = [],
          straightCost=10,
          diagonalCost=14,
          _testNodes=(i)=>{
            let c= !useDiagonal ? this.crossCells(i,world)
                                : this.neighborCells(i, world, true);
            return c.map(p=>nodes[p]).filter(n=>{
              if(n){
                let indexOnLeft= (i% W) == 0;
                let indexOnRight= ((i+1) % W) == 0;
                let nodeBeyondLeft= (n.col % (W-1)) == 0 && n.col != 0;
                let nodeBeyondRight= (n.col % W) == 0;
                let nodeIsObstacle = obstacles.some(o => tiles[n.index] == o);
                return indexOnLeft ? !nodeBeyondLeft
                                   : (indexOnRight ? !nodeBeyondRight : !nodeIsObstacle);
              }
            });
          };
        while(centerNode !== targetNode){
          let testNodes = _testNodes(centerNode.index);
          for(let f,g,h,cost,tn,i=0; i < testNodes.length; ++i){
            tn = testNodes[i];
            //Find out whether the node is on a straight axis or
            //a diagonal axis, and assign the appropriate cost
            //A. Declare the cost variable
            cost = diagonalCost;
            //B. Do they occupy the same row or column?
            if(centerNode.row == tn.row ||
               centerNode.col == tn.col){
              cost = straightCost
            }
            //C. Calculate the costs (g, h and f)
            //The node's current cost
            g = centerNode.g + cost;
            //The cost of travelling from this node to the
            //destination node (the heuristic)
            f = g + new AStarAlgos(straightCost,diagonalCost)[heuristic](tn,targetNode);
            let
              isOnOpenList = openList.some(n => tn === n),
              isOnClosedList = closedList.some(n => tn === n);
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
          if(openList.length == 0){
            return theShortestPath;
          }
          //Sort the open list according to final cost
          openList = openList.sort((a, b) => a.f - b.f);
          //Set the node with the lowest final cost as the new centerNode
          centerNode = openList.shift();
        }
        //Now that we have all the candidates, let's find the shortest path!
        if(openList.length != 0){
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
        let
          v= _getVector(s1,s2),
          len = _V.len(v),
          numPts = int(len/segment),
          angle, len2,x,y,ux,uy,points = [];
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
        angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
        //The tile-based collision test.
        //The `noObstacles` function will return `true` if all the tile
        //index numbers along the vector are `0`, which means they contain
        //no walls. If any of them aren't 0, then the function returns
        //`false` which means there's a wall in the way
        return points.every(p=> tiles[p.index] == emptyGid) &&
               (angles.length == 0 || angles.some(x=> x == angle))
      },
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
          return gid == validGid ? _DIRS[i] : Mojo.NONE
        }).filter(d => d !== Mojo.NONE)
      },
      /**Check if these directions are valid.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} directions
       * @return {boolean}
       */
      canChangeDirection(dirs=[]){
        let
          up = dirs.find(x => x === Mojo.UP),
          down = dirs.find(x => x === Mojo.DOWN),
          left = dirs.find(x => x === Mojo.LEFT),
          right = dirs.find(x => x === Mojo.RIGHT);
        return dirs.length==0 ||
               dirs.length==1 || ((up||down) && (left||right)); },
      /**Randomly choose the next direction.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length==0 ? Mojo.NONE
                               : (dirs.length==1 ? dirs[0]
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


