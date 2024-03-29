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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /** Supported file extensions. */
  const
    AUDIO_EXTS= ["mp3", "wav", "ogg"],
    IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"],
    FONT_EXTS = ["ttf", "otf", "ttc", "woff"];

  /**Create the module. */
  function _module(cmdArg, _fonts, _spans, _BgTasks){

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

    /**
     * @module mojoh5/Mojo
     */

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
      aniFps: 12,
      fps: 60
    });

    //const _height=()=> document.documentElement.clientHeight;
    //const _width=()=> document.documentElement.clientWidth;
    const
      _width=()=> gscope.innerWidth,
      _height=()=> gscope.innerHeight;

    /**Built-in progress bar, shown during the loading of
     * assets if no user-defined load function is provided.
     */
    function _PBar(Mojo){
      const
        cy= _M.ndiv(Mojo.height,2),
        cx= _M.ndiv(Mojo.width,2),
        w4= _M.ndiv(Mojo.width,4),
        K=Mojo.getScaleFactor(),
        bgColor=0x404040,
        fgColor=0xff8a00,
        {Sprites}=Mojo,
        WIDTH=w4*2,
        RH=48*K,
        Y=cy-RH/2;
      return{
        init(){
          this.perc=Sprites.text("0%", {fontSize:_M.ndiv(RH,2),
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
          this.fg.width = WIDTH*progress;
          this.perc.text=`${Math.round(progress*100)}%`;
          CON.log(`progr= ${progress*100}`);
        }
      }
    }

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
          this.g.pbar=pbar;
          this.g.pbar_width=pbar.width;
          this.insert(logo);
          this.insert(pbar);
        },
        update(progress){
          this.g.pbar.visible?0:Sprites.show(this.g.pbar);
          this.g.pbar.width = this.g.pbar_width*progress;
        }
      }
    }

    /** @ignore */
    function _loadScene(obj){
      const z= new Mojo.Scenes.Scene("loader",{
        setup(){
          obj.init.call(this)
        }
      },{});
      return Mojo.stage.addChild(z).runOnce();
    }

    /**Once all the files are loaded, do some post processing.
     */
    function _postAssetLoad(Mojo,ldrObj,scene,error){
      //clean up stuff used during load
      _spans.forEach(e=> dom.css(e,"display","none"));
      if(ldrObj)
        Mojo.delBgTask(ldrObj);
      _.delay(50,()=>{
        Mojo.Scenes.remove(scene);
        error? _.error("Cannot load game!"): Mojo._runAppStart() })
    }

    async function _loadSnd(url){
      const res = await PIXI.settings.ADAPTER.fetch(url);
      const b=await res.arrayBuffer();
      const i=url.lastIndexOf("/");
      let name="";
      if(i>0){
        name= url.substring(i+1);
      }else{
        name=url;
      }
      return {name, url, buffer:b}
    }

    function _preloadSounds(sfiles){
      let fcnt=sfiles.length;
      function _m1(b){ --fcnt }
      sfiles.forEach(f=>{
        _loadSnd(f).then(r=>{
          Mojo.Sound.decodeData(r.name, r.url, r.buffer, _m1)
        });
      })
    }

    /** Fetch required files. */
    function _loadFiles(Mojo){
      //trick browser to load in font files.
      const {PXLoader}= Mojo;
      let family, face, span, style;
      let wanted=[], sfiles=[],ffiles=[];

      Mojo.u.assetFiles.forEach((f,ext)=>{
        f=Mojo.assetPath(f);
        ext=_.fileExt(f);
        if(_.has(AUDIO_EXTS,ext)){
          sfiles.push(f)
        }else if (_.has(FONT_EXTS, f)){
          ffiles.push(f)
        }else{
          wanted.push(f)
        }
      });
      ///
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
      PXLoader.init();
      if(wanted.length>0){
        let cbObj=Mojo.u.load;
        if(!cbObj)
          cbObj= 1 ? _LogoBar(Mojo) : _PBar(Mojo);
        let
          pg=[],
          ecnt=0,
          scene=_loadScene(cbObj),
          rc= PXLoader.load(wanted, (p)=>{
            CON.log(`percentage ${p}`);
            pg.unshift(p);
          });
        rc.then((r)=>{
          if(wanted.length != Object.keys(r).length){
            CON.error(`failed to load all assets!`);
            ++ecnt;
          }
          pg.unshift("$");
        });
        Mojo.addBgTask({
          update(){
            let n= pg.pop();
            if(is.num(n)){
              if(n)
                cbObj.update.call(scene,n);
            }
            else if(n=="$"){
              if(ecnt==0 && sfiles.length>0){
                _preloadSounds(sfiles)
              }
              _.delay(800,()=>
                              _postAssetLoad(Mojo,this,scene,ecnt>0));
            }
            else{
              //CON.error("fatal error while loading assets");
            }
          }
        });
      }else{
        if(sfiles.length>0) _preloadSounds(sfiles);
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
      let
        ecnt=0,
        files=Mojo.u.logos.map(f=> Mojo.assetPath(f));
      if(files.length==0){
        _loadFiles(Mojo)
      }else{
        PXLoader.init();
        PXLoader.load(files, (p)=>{
          CON.log(`boot load percentage= ${p}`);
        }).then((r)=>{
          if(files.length != Object.keys(r).length){
            CON.log(`logo files not loaded!`)
          }else{
            _.delay(50,()=>_loadFiles(Mojo));
            CON.log(`logo files loaded.`);
          }
        });
      }
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

      dom.conj(document.body, Mojo.canvas);
      dom.conj(style, dom.newTxt(_CT));
      dom.conj(document.head,style);
      //p["image-rendering"]= arg.rendering || "pixelated";
      //p["image-rendering"]= arg.rendering || "crisp-edges";
      dom.css(Mojo.canvas,p);
      dom.attrs(Mojo.canvas,"tabindex","0");
      dom.css(document.body,{"background":"black"});
    }

    /** Main */
    function _prologue(Mojo){
      let
        maxed=false,
        box= cmdArg.arena,
        S= Mojo.stage= new PixiStage();
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

      if(!cmdArg.logos)
        cmdArg.logos=new Array();

      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo.ctx= PIXI.autoDetectRenderer(_.inject(box,{
        antialias: true
      }));
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojoh5";
      Mojo.maxed=maxed;
      Mojo.scale=1;
      Mojo.scaledBgColor= "#5A0101";

      //install modules
      ["Sprites","Input","Scenes",
       "Sound","FX","Ute2D","Tiles","Touch"].forEach(s=>{
         CON.log(`installing module ${s}...`);
         let m=gscope[`io/czlab/mojoh5/${s}`](Mojo);
         if(m.assets)
           m.assets.forEach(a=> Mojo.u.assetFiles.unshift(a))
      });

      //register built-in tasks
      _BgTasks.push(Mojo.FX, Mojo.Input);
      _configCanvas(cmdArg);

      if(_.has(cmdArg,"border"))
        dom.css(Mojo.canvas, "border", cmdArg.border);

      if(_.has(cmdArg,"bgColor"))
        Mojo.ctx.backgroundColor =
          Mojo.Sprites.color(cmdArg.bgColor);

      //not thoroughly supported nor tested :)
      if(cmdArg.resize === true){
        _.addEvent("resize", gscope, _.debounce(()=>{
          //save the current size and tell others
          const [w,h]=[Mojo.width, Mojo.height];
          Mojo.ctx.resize(_width(),_height());
          Mojo.emit(["canvas.resize"],[w,h]);
        },cmdArg.debounceRate||150));
        Mojo.on(["canvas.resize"], o=> S.onResize(Mojo,o))
      }

      if(Mojo.touchDevice){
        Mojo.scroll()
      }

      Mojo.canvas.focus();

      return _boot(Mojo);
    }

    //------------------------------------------------------------------------
    /**Code to run per tick. */
    function _update(dt){
      Mojo._curFPS=Mojo.calcFPS(dt);
      //process any backgorund tasks
      _BgTasks.forEach(m=> m.update && m.update(dt));
      //update all scenes
      if(!_paused) Mojo.stageCS(s=> s.update && s.update(dt));
    }

    //------------------------------------------------------------------------
    function _draw(dt){
      Mojo.ctx.render(Mojo.stage)
    }

    //------------------------------------------------------------------------
    const _raf=(cb)=> gscope.requestAnimationFrame(cb);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
      MODE_ONE:1,
      MODE_TWO:2,
      MODE_NET:3,
      CON:console,
      noop: ()=>{},
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLoader:PIXI.Assets,
      PXObservablePoint: PIXI.ObservablePoint,
      get mouse(){ return Mojo.Input.pointer() },
      /**Play a sound effect.
       * @memberof module:mojoh5/Mojo
       * @param {string} snd
       * @return {object}
       */
      playSfx(snd){ return this.sound(snd).play() },
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
      frameRate(){
        return this._frame;
      },
      /**Check if `d` is on the right hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideRight(d){
        return d==Mojo.RIGHT || d==Mojo.NE || d==Mojo.SE },
      /**Check if `d` is on the left hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideLeft(d){
        return d==Mojo.LEFT || d==Mojo.NW || d==Mojo.SW },
      /**Check if `d` is on the top hand side.
       * @memberof module:mojoh5/Mojo
       * @param {number} d
       * @return {boolean}
       */
      sideTop(d){
        return d==Mojo.UP || d==Mojo.TOP || d==Mojo.NW || d==Mojo.NE },
      /**Check if `d` is on the bottom hand side.
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
            if(s instanceof PIXI.SimpleRope){}else{ cb(s) }
          })
        }
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
      screenCenter(){ return _.v2(_M.ndiv(Mojo.width,2),_M.ndiv(Mojo.height,2)) },
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
      /**Get a cached Texture.
       * @memberof module:mojoh5/Mojo
       * @param {any} x
       * @return {Texture}
       */
      tcached(x){
        return _.inst(this.PXTexture,x)?x
          :(is.str(x)? PIXI.utils.TextureCache[x] || PIXI.utils.TextureCache[this.assetPath(x)] : UNDEF)
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
      splitXY(pos,width){ return [pos%width, _M.ndiv(pos,width)] },
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
      xml(n){ return (this.assets.get(n) ||
                      _.assert(false, `${n} not loaded.`)) },
      /**Get the cached JSON file.
       * @memberof module:mojoh5/Mojo
       * @param {string} n
       * @return {object}
       */
      json(n){ return (this.assets.get(n) ||
                       _.assert(false, `${n} not loaded.`)) },
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
          return (cmdArg.scaleFit=="x"||cmdArg.scaleFit=="X") ?z.width
                                      :((cmdArg.scaleFit=="y"||cmdArg.scaleFit=="Y") ?z.height:Math.min(z.width,z.height)); } },
      /**Get the named resource from the asset cache.
       * @memberof module:mojoh5/Mojo
       * @param {string} x
       * @param {boolean} [panic] if not found throws exception
       * @return {any}
       */
      resource(x,panic){
        let t= x ? (this.assets.get(x) || this.assets.get(this.assetPath(x))) : 0;
        return t || (panic ? _.assert(false, `no such resource ${x}.`) : UNDEF)
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
            //console.log(`frames per sec= ${Math.floor(1/dt)}`);
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
          Mojo.Input.keybd(Mojo.Input.Q,()=>{
            this.takeScreenShot()
          })
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
    return gscope.MojoH5=function(arg){ return _module(arg, [], [], []) }
  }

})(this);


