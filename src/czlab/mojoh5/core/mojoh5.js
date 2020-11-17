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
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

;(function(global){
  "use strict";
  let window;
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
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
  function _MojoH5(cmdArg, _sounds, _fonts, _spans){
    const Core=global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const is=Core.is;
    const dom=Core.dom;
    const EventBus=Core.EventBus;
    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      Xi:{pos:true,scale:true} //alpha:true, //size:true
    });
    /** Built-in progress bar shown during the loading of asset files, if no user defined load function
     *  is provided in the config options.
     * @private
     * @function
     */
    function _PBar(Mojo,f,p,handle){
      let _S=Mojo.Sprites;
      if(!handle){
        let w2= Mojo.canvas.width/2;
        let h2= Mojo.canvas.height/2;
        let bgColor="0x808080";
        let fgColor="0x00FFFF";
        //make a progress bar
        handle={
          dispose(){ _S.remove(this.fg,this.bg,this.perc) },
          width:w2,
          fg:_S.rectangle(w2, 32, fgColor),
          bg:_S.rectangle(w2, 32, bgColor),
          perc:_S.text("0%", {fontSize:28,
                              fill:"black",
                              fontFamily:"sans-serif"})
        };
        _S.setXY(handle.bg, w2 - (w2 / 2), h2 - 16);
        _S.setXY(handle.fg, w2 - (w2 / 2), h2 - 16);
        _S.setXY(handle.perc, w2 - (w2 / 2) + 12,  h2 - 17);
        _S.add(Mojo.stage,handle.bg,handle.fg,handle.perc);
      }else{
        handle.perc.mojoh5.content(`${Math.round(p)} %`);
        handle.fg.width = handle.width * (p/100);
        console.log(`file= ${f}, progr= ${p}`);
      }
      return handle;
    }
    /**
     * @private
     * @function
     */
    function _scaleCanvas(canvas){
      let CH=canvas.offsetHeight;
      let CW=canvas.offsetWidth;
      let WH=window.innerHeight;
      let WW=window.innerWidth;
      let scale = _.min(WW/CW, WH/CH);
      let scaledH=CH*scale;
      let scaledW=CW*scale;
      let margin;
      dom.css(canvas, {transformOrigin:"0 0",
                       transform:`scale(${scale})`});
      //lay flat
      if(CW>CH ? scaledW<WW : !(scaledH>WH)){
        let margin = _.floor((WW - scaledW)/2);
        dom.css(canvas, {marginTop:"0px",
                         marginBottom:"0px",
                         marginLeft:`${margin}px`,
                         marginRight:`${margin}px`});
      }else{
        let margin = _.floor((WH - scaledH)/2);
        dom.css(canvas, {marginLeft:"0px",
                         marginRight:"0px",
                         marginTop:`${margin}px`,
                         marginBottom:`${margin}px`});
      }
      dom.css(canvas, {paddingLeft:"0px",
                       paddingRight:"0px",
                       paddingTop:"0px",
                       paddingBottom:"0px",
                       display:"block"});
      dom.css(document.body, "backgroundColor", Mojo.scaledBorderColor);
      return scale;
    }
    /** Once all the files are loaded, do some post processing.
     * @private
     * @function
     */
    function _onAssetLoaded(Mojo,ldrObj,handle){
      let files = 0;
      function _finz(){
        //clean up a whole bunch of stuff used during bootstrap
        _.doseq(_spans,e => dom.css(e, "display", "none"));
        //get rid of any loading scene
        if(ldrObj)
          Mojo.delBgTask(ldrObj);
        //clean up user handle
        if(handle)
          handle.dispose && handle.dispose();
        //finally run the user start function
        Mojo.o.start(Mojo);
      };
      function _dec(){
        //one less file
        --files=== 0 && _finz()
      }
      //process audio files
      _.doseq(Mojo.PXLoader.resources, (r,k)=>{
        let ext= _.fileExt(k);
        if(_.has(AUDIO_EXTS,ext)){
          files += 1;
          let s= Mojo.Sound.makeSound(r.url);
          s.name = r.name;
          _sounds[s.name] = s;
          Mojo.Sound.decodeSound(s,r.xhr,_dec);
          console.log(`decoded sound file: ${s.name}`);
        }
      });
      files===0 && _finz()
    }
    /** Fetch required files.
     * @private
     * @function
     */
    function _loadFiles(Mojo){
      let filesToLoad = _.map(Mojo.o.assetFiles || [], f => Mojo.assetPath(f));
      let ffiles = _.findFiles(filesToLoad, FONT_EXTS);
      let L= Mojo.PXLoader;
      //common hack to trick brower to load in font files.
      _.doseq(ffiles,s=>{
        let newStyle = dom.newElm("style");
        let family = s.split("/").pop().split(".")[0];
        let face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        console.log(`fontface = ${face}`);
        _.conj(_fonts,family);
        dom.conj(newStyle,dom.newTxt(face));
        dom.conj(document.head,newStyle);
        let span = dom.newElm("span");
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
        _.conj(_spans,span);
      });
      _.doseq(AUDIO_EXTS, e=>{
        PIXI.LoaderResource.setExtensionLoadType(e, PIXI.LoaderResource.LOAD_TYPE.XHR);
        PIXI.LoaderResource.setExtensionXhrType(e, PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER);
      });
      L.reset();
      if(filesToLoad.length>0){
        let cb= Mojo.o.load || _PBar;
        let handle;
        let fs=[];
        let pg=[];
        L.add(filesToLoad);
        L.onProgress.add((ld,r)=>{
          fs.unshift(r.url);
          pg.unshift(ld.progress);
        });
        L.load(()=> console.log("loaded!"));
        let ldrObj={
          update(){
            let f= fs.pop();
            let n= pg.pop();
            if(f && is.num(n))
              handle=cb(Mojo,f,n,handle);
            if(n===100) _onAssetLoaded(Mojo,this,handle);
          }
        };
        Mojo.addBgTask(ldrObj);
      }else{
        //no assets, call user start function right away
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
      let arena=cmdArg.arena || {};
      let maxed=false;
      function _runM(m){
        global["io.czlab.mojoh5."+m](Mojo)
      }
      Mojo.designResolution=_.inject({},arena);
      if(cmdArg.scaleToWindow === "max"){
        arena = _.inject(arena, {width: window.innerWidth,
                                 height: window.innerHeight});
        maxed=true;
      }else{
        arena = _.patch(arena, {width: window.innerWidth,
                                height: window.innerHeight});
      }
      Mojo.ctx= PIXI.autoDetectRenderer(arena);
      Mojo.ctx.backgroundColor = 0xFFFFFF;
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.scaled = false;
      Mojo.canvas.maxed=maxed;
      Mojo.canvas.id="mojo";
      Mojo.stage= new Mojo.PXContainer();
      _.doseq(_.seq("Sprites,Input,Scenes,Sound"), _runM);
      _.doseq(_.seq("Effects,2d,Tiles,GameLoop"), _runM);
      if(cmdArg.border)
        dom.css(Mojo.canvas, "border", cmdArg.border);
      if(cmdArg.backgroundColor !== undefined){
        Mojo.ctx.backgroundColor = Mojo["Sprites"].color(cmdArg.backgroundColor);
      }
      dom.conj(document.body, Mojo.canvas);
      Mojo.scaledBorderColor= cmdArg.scaleBorderColor || "#2c3539";
      Mojo.touchDevice= !!("ontouchstart" in document);
      Mojo.stage.mojoh5={stage: true};
      Mojo.scale=1;
      Mojo.cmdArg=cmdArg;
      if(cmdArg.scaleToWindow===true){
        _scaleToWindow();
        Mojo.scale= _scaleCanvas(Mojo.canvas);
      }
      Mojo.pointer = Mojo["Input"].pointer(Mojo.canvas, Mojo.scale);
      _.addEvent("resize", window, () => Mojo.resize());
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
      NONE: 100,
      TRAPPED: 200,
      Game:{ state: new GameState() },
      EventBus:EventBus(),
      u:_, is:is, dom:dom,
      o:cmdArg,
      PXContainer:PIXI.Container,
      PXGraphics:PIXI.Graphics,
      PXLoader:PIXI.Loader.shared,
      PXTexture:PIXI.Texture,
      PXFilters:PIXI.filters,
      PXLR:PIXI.LoaderResource,
      PXTCache:PIXI.utils.TextureCache,
      PXObservablePoint: PIXI.ObservablePoint,
      lerpConfig(){ return this.o.i },
      //get fps(){ return this.o.fps },
      //get rps(){ return this.o.rps },
      get assets(){ return this.PXLoader.resources },
      get state(){ return this.Game.state },
      get width(){ return this.canvas.width },
      get height(){ return this.canvas.height },
      set border(v){ dom.css(this.canvas,"border", v) },
      set bgColor(c){ this.ctx.backgroundColor = this.color(c) }
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
    Mojo.portrait=function(){
      return Mojo.canvas.height>Mojo.canvas.width
    };
    /**
     * @public
     * @function
     */
    Mojo.screenCenter=function(){
      return _.v2(Mojo.canvas.width/2,Mojo.canvas.height/2)
    };
    /**
     * @public
     * @function
     */
    Mojo.stageCS=function(cb){
      _.doseq(Mojo.stage.children,cb)
    };
    /**
     * @public
     * @function
     */
    Mojo.makeAnchor=function(x,y){
      return new this.PXObservablePoint(()=>{},this,x,y)
    };
    /**
     * @public
     * @function
     */
    Mojo.resize=function(canvas){
      canvas=canvas || Mojo.canvas;
      if(canvas.maxed){
        Mojo.scale = 1;
      }else{
        Mojo.scale = _scaleCanvas(canvas);
      }
      if(arguments.length===0)
        Mojo.EventBus.pub(["canvas.resize"]);
    };
    /**
     * @public
     * @function
     */
    function _scaleToWindow(){
      let style = "* {padding: 0; margin: 0}";
      let newStyle = dom.newElm("style");
      dom.conj(newStyle,dom.newTxt(style));
      dom.conj(document.head,newStyle);
      Mojo.canvas.scaled = true;
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
        mojoh5:{stage:true},
        x:px,
        y:py,
        width: this.canvas.width,
        height: this.canvas.height
      }
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
      return _.floor(x/cellW) + _.floor(y/cellH) * widthInCols
    };
    /**
     * @public
     * @function
     */
    Mojo.adjustForStage= function(o){
      return o.mojoh5.stage ? this.mockStage() : o
    };
    /**
     * @public
     * @function
     */
    Mojo.image= function(fname){
      let obj=Mojo.PXTCache[fname];
      if(!obj)
        throw `${fname} not loaded`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.id=function(frame){
      let obj=Mojo.PXTCache[frame];
      if(!obj)
        throw `${frame} not loaded`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.json=function(fname){
      let obj=Mojo.PXLoader.resources[fname];
      if(!obj || !obj.data)
        throw `${fname} not loaded`;
      return obj.data;
    };
    /**
     * @public
     * @function
     */
    Mojo.xml=function(fname){
      let obj=Mojo.PXLoader.resources[fname];
      if(!obj || !obj.data)
        throw `${fname} not loaded`;
      return obj.data;
    };
    /**
     * @public
     * @function
     */
    Mojo.assetPath=function(fname){
      if(fname.includes("/")) return fname;
      let pfx="data";
      let ext= _.fileExt(fname);
      if(_.has(IMAGE_EXTS,ext)) pfx="images";
      else if(_.has(FONT_EXTS,ext)) pfx="fonts";
      else if(_.has(AUDIO_EXTS,ext)) pfx="audio";
      return pfx+"/"+fname;
    };
    /**
     * @public
     * @function
     */
    Mojo.sound= function(fname){
      let obj=_sounds[this.assetPath(fname)];
      if(!obj)
        throw `${fname} not loaded`;
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
    Mojo.tcached=function(x){
      let t;
      if(x){
        t= this.PXTCache[x];
        if(!t)
          t= this.PXTCache[this.assetPath(x)];
      }
      return t;
    };
    /**
     * @public
     * @function
     */
    Mojo.resources=function(x){
      let t;
      if(x){
        t= this.PXLoader.resources[x];
        if(!t)
          t= this.PXLoader.resources[this.assetPath(x)];
      }
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


