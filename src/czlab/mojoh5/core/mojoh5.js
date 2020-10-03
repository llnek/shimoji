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
    throw `Fatal: MojoH5 module requires browser env.`;

  /**
   * @public
   * @module
   */
  function MojoH5(cmdArg){
    const FONT_EXTS = ["ttf", "otf", "ttc", "woff"];
    const AUDIO_EXTS= ["mp3", "wav", "ogg", "webm"];
    const IMAGE_EXTS= ["jpg", "png", "jpeg", "gif"];
    const Core=global["io.czlab.mcfud.core"]();
    const _soundObjects = {};
    const _fontFamilies= [];
    const _spanElements = [];
    let _loadingProgress = 0;
    let _loadingFile = "";
    let _progressBar;
    const _=Core.u;
    const is=Core.is;
    const dom=Core.dom;
    const EventBus=Core.EventBus;
    //////////////////////////////////////////////////////////////////////////
    //add optional defaults
    _.patch(cmdArg,{
      fps:60,
      i:{ position:true, scale:true, tile:true }
    });
    /**
     * @private
     * @function
     */
    function _mkProgressBar(Mojo){
      let _S=Mojo.Sprites;
      let x={
        maxWidth:0,
        height:0,
        back:null,
        front:null,
        perc:null,
        //assets: null,
        //initialized: false,
        bgColor:"0x808080",
        fgColor:"0x00FFFF",
        create: function(){
          let w2= Mojo.canvas.width/2;
          let h2= Mojo.canvas.height/2;
          this.maxWidth = w2;
          //progress bar using two rectangle sprites and a text sprite
          this.front = _S.rectangle(this.maxWidth, 32, this.fgColor);
          Mojo.stage.addChild(this.front);
          this.back = _S.rectangle(this.maxWidth, 32, this.bgColor);
          Mojo.stage.addChild(this.back);
          this.back.x = w2 - (this.maxWidth / 2);
          this.back.y = h2 - 16;
          this.front.x = w2 - (this.maxWidth / 2);
          this.front.y = h2 - 16;
          //text sprite to show percentage
          this.perc= _S.text("0%", "28px sans-serif", "black");
          Mojo.stage.addChild(this.perc);
          this.perc.x = w2 - (this.maxWidth / 2) + 12;
          this.perc.y = h2 - 17;
          return this;
        },
        update: function(){
          this.perc.mojoh5.content(`${Math.round(_loadingProgress)} %`);
          this.front.width = this.maxWidth * (_loadingProgress / 100);
          console.log("file= " + _loadingFile);
          console.log("progr= " + _loadingProgress);
          return this;
        },
        remove: function(){
          this.front.parent.removeChild(this.front);
          this.back.parent.removeChild(this.back);
          this.perc.parent.removeChild(this.perc);
        }
      };
      return x.create();
    }
    /**
     * @private
     * @function
     */
    function _scaleCanvas(canvas, bgcolor){
      let scaleX = window.innerWidth / canvas.offsetWidth;
      let scaleY = window.innerHeight / canvas.offsetHeight;
      let scale = Math.min(scaleX, scaleY);
      let center, margin;
      dom.css(canvas, {transformOrigin:"0 0",
                       transform:"scale("+scale+")"});
      if(canvas.offsetWidth > canvas.offsetHeight){
        center= (canvas.offsetWidth*scale < window.innerWidth) ? "horz" : "vert";
      }else{
        center= (canvas.offsetHeight*scale < window.innerHeight) ? "vert" : "horz";
      }
      //center horizontally (for square or tall canvases)
      if(center === "horz"){
        margin = (window.innerWidth - canvas.offsetWidth * scale) / 2;
        dom.css(canvas, {marginTop:"0px",
                         marginBottom:"0px",
                         marginLeft:margin+"px",
                         marginRight:margin+"px"});
      }
      //center vertically (for wide canvases)
      if(center === "vert"){
        margin = (window.innerHeight - canvas.offsetHeight * scale) / 2;
        dom.css(canvas, {marginTop:margin+"px",
                         marginBottom:margin+"px",
                         marginLeft:"0px",
                         marginRight:"0px"});
      }
      dom.css(canvas, {paddingLeft:"0px",
                       paddingRight:"0px",
                       paddingTop:"0px",
                       paddingBottom:"0px",
                       display:"block"});
      dom.css(document.body, "backgroundColor",  bgcolor);
      return scale;
    }
    /**
     * @private
     * @function
     */
    function _validateAssets(ldr,resources){
      let Mojo=this;
      function finz(){
        _progressBar && _progressBar.remove();
        _progressBar=null;
        _.doseq(_spanElements,e => dom.css(e, "display", "none"));
        Mojo.loaderState = null;
        Mojo.o.start(Mojo);
      };
      let files = 0, done = 0;
      function decoder(){
        done += 1;
        if(files === done) finz();
      }
      _.doseq(Mojo.p.loader.resources, (r,k)=>{
        let ext= _.fileExt(k);
        if(_.has(AUDIO_EXTS,ext)){
          files += 1;
          let xhr = r.xhr, url = r.url, name=r.name;
          let s= Mojo.Sound.makeSound(url, decoder, false, xhr);
          s.name = r.name;
          _soundObjects[s.name] = s;
        }
      });
      if(files === 0) { finz() }
    }
    /**
     * @private
     * @function
     */
    function _dftLoadState(ld,r){
      Mojo.loadingBar();
      _loadingFile = r.url;
      _loadingProgress = ld.progress;
      Mojo.loadingBar();
    }
    /**
     * @private
     * @function
     */
    function _loadFiles(Mojo){
      let filesToLoad = _.map(Mojo.o.assetFiles || [], f => Mojo.assetPath(f));
      let ffiles = _.findFiles(filesToLoad, FONT_EXTS);
      ffiles.forEach(s=>{
        let span;
        let newStyle = dom.newElm("style");
        let family = s.split("/").pop().split(".")[0];
        let face= `@font-face {font-family: '${family}'; src: url('${s}');}`;
        console.log("fontface = "+face);
        _.conj(_fontFamilies,family);
        dom.conj(newStyle,dom.newTxt(face));
        dom.conj(document.head,newStyle);
        span = dom.newElm("span");
        span.innerHTML = "?";
        dom.css(span,"fontFamily", family);
        dom.conj(document.body,span);
        dom.css(span,{display: "block", opacity: "0"});
        _.conj(_spanElements,span);
      });
      _.doseq(AUDIO_EXTS, e=>{
        PIXI.LoaderResource.setExtensionLoadType(e, PIXI.LoaderResource.LOAD_TYPE.XHR);
        PIXI.LoaderResource.setExtensionXhrType(e, PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER);
      });
      Mojo.p.loader.reset();
      _loadingProgress = 0;
      _loadingFile = "";
      _progressBar=null;
      if(filesToLoad.length>0){
        Mojo.p.loader.add(filesToLoad);
        if(Mojo.o.load){
          let files=[], progress=[];
          Mojo.loaderState=function(){
            let f= files.pop();
            let p= progress.pop();
            if(f !== undefined && is.num(p))
            Mojo.o.load(Mojo,f,p);
            if(p===100)
              _validateAssets.call(Mojo);
          };
          Mojo.p.loader.onProgress.add((ld,r)=>{
            files.unshift(r.url);
            progress.unshift(ld.progress);
          });
          Mojo.p.loader.load(()=> console.log("loaded!"));
        } else {
          Mojo.p.loader.onProgress.add(_dftLoadState);
          Mojo.p.loader.load(_validateAssets.bind(Mojo));
        }
      }else{
        Mojo.o.start(Mojo);
      }
      Mojo.start();
    }
    /**
     * @private
     * @function
     */
    function _flowSprites(op,args,sprites){
      for(let i=0; i<sprites.length-1; ++i){
        args[0]=sprites[i+1];
        sprites[i][op].apply(this,args);
      }
    }
    /**
     * @private
     * @function
     */
    function _prologue(Mojo,arena){
      let _S;
      arena = _.patch(arena, {width: window.innerWidth,
                              height: window.innerHeight});
      Mojo.ctx= PIXI.autoDetectRenderer(arena);
      Mojo.canvas = Mojo.ctx.view;
      Mojo.canvas.id="mojo";
      Mojo.canvas.scaled = false;
      Mojo.stage= new Mojo.p.Container();
      _.doseq(_.seq("Sprites,Input,Scenes,Tiles,Effects,Sound,GameLoop,2d"), m => {
        global["io.czlab.mojoh5."+m](Mojo);
      });
      _S=Mojo.Sprites;
      _.assert(_.noSuchKeys("halfWidth,halfHeight",Mojo.canvas));
      Object.defineProperties(Mojo.canvas,{
        "halfWidth":_.pdef({ get(){ return Mojo.canvas.width / 2 }}),
        "halfHeight":_.pdef({ get() { return Mojo.canvas.height / 2 }})});
      Mojo.ctx.backgroundColor = 0xFFFFFF;
      if(cmdArg.border)
        dom.css(Mojo.canvas, "border", cmdArg.border);
      if(cmdArg.backgroundColor)
        Mojo.ctx.backgroundColor = _S.color(cmdArg.backgroundColor);
      dom.conj(document.body, Mojo.canvas);
      _S.extend(Mojo.stage);
      Mojo.stage.mojoh5.stage = true;
      Mojo.scale = 1;
      if(cmdArg.scaleToWindow)
        Mojo.scaleToWindow(cmdArg.scaleBorderColor);
      Mojo.pointer = Mojo.Input.makePointer(Mojo.canvas, Mojo.scale);
      _loadFiles(Mojo);
    }
    /**
     * @private
     * @class
     */
    class GameState{
      constructor(p) {
        this.reset(p);
      }
      reset(p){
        this.p=_.inject({},p);
      }
      get(prop){
        return _.get(this.p,prop);
      }
      _chgp(value,key){
        if(this.p[key] !== value){
          _.assoc(this.p, key, value);
          Mojo.EventBus.pub(["change."+key,this],value);
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
          this.set(prop,v + amount);
      }
      dec(prop,amount=1){
        let v=this.get(prop);
        if(is.num(v))
          this.set(prop,v - amount);
      }
    };
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
      p:{
        Container:PIXI.Container,
        Graphics:PIXI.Graphics,
        loader:PIXI.Loader.shared,
        Texture:PIXI.Texture,
        Filters:PIXI.filters,
        LR:PIXI.LoaderResource,
        TCache:PIXI.utils.TextureCache,
        ObservablePoint: PIXI.ObservablePoint},
      interpolateProps: function(){ return this.o.i },
      get assets(){ return this.p.loader.resources },
      get fps(){ return this.o.fps },
      get rfps(){ return this.o.rfps },
      get interpolate(){ return is.obj(this.o.i) },
      set border(v){ dom.css(this.canvas,"border", v) },
      set bgColor(c){ this.ctx.backgroundColor = this.color(c) }
    };
    /**
     * @public
     * @function
     */
    Mojo.layout= function(dir, padding, ...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      if(dir===Mojo.RIGHT)
        _flowSprites("putRight", [null,+padding],sprites);
      if(dir===Mojo.DOWN)
        _flowSprites("putBottom", [null, 0, +padding],sprites);
      if(dir===Mojo.LEFT)
        _flowSprites("putLeft", [null, -padding], sprites);
      if(dir===Mojo.TOP)
        _flowSprites("putTop", [null, 0, -padding]);
    };
    /**
     * @public
     * @function
     */
    Mojo.resize= function(canvas, color){
      this.scale = _scaleCanvas(canvas, color);
      this.pointer = Mojo.Input.makePointer(canvas, this.scale);
      Mojo.Input.scale= this.scale;
    };
    /**
     * @public
     * @function
     */
    Mojo.scaleToWindow= function(borderColor = "#2C3539"){
      let style = "* {padding: 0; margin: 0}";
      let newStyle = dom.newElm("style");
      let target=this.canvas;
      dom.conj(newStyle,dom.newTxt(style));
      dom.conj(document.head,newStyle);
      this.resize(target,borderColor);
      _.addEvent("resize", window, () => this.resize(target,borderColor));
      target.scaled = true;
    };
    /**
     * @public
     * @function
     */
    Mojo.loadingBar= function(){
      if(!_progressBar){
        _progressBar= _mkProgressBar(this);
      }else{
        _progressBar.update();
      }
    };
    /**
     * @public
     * @function
     * @returns read-only object.
     */
    Mojo.mockStage=function(){
      return{
        getGlobalPosition(){ return {x:0,y:0} },
        mojoh5:{},
        x:0,
        y:0,
        width: this.canvas.width,
        height: this.canvas.height,
        anchor: new Mojo.p.ObservablePoint(()=>{},this)
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
      let obj=Mojo.p.TCache[fname];
      if(!obj)
        throw `${fname} not loaded`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.id=function(frame){
      let obj=Mojo.p.TCache[frame];
      if(!obj)
        throw `${frame} not loaded`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.json=function(fname){
      let obj=Mojo.p.loader.resources[fname];
      if(!obj || !obj.data)
        throw `${fname} not loaded`;
      return obj.data;
    };
    /**
     * @public
     * @function
     */
    Mojo.xml=function(fname){
      let obj=Mojo.p.loader.resources[fname];
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
      let obj=_soundObjects[this.assetPath(fname)];
      if(!obj)
        throw `${fname} not loaded`;
      return obj;
    };
    /**
     * @public
     * @function
     */
    Mojo.rect=function(x,y,w,h){ return new Mojo.p.Rectangle(x,y,w,h) };
    /**
     * @public
     * @function
     */
    Mojo.tcached=function(x){
      let t;
      if(x){
        t= this.p.TCache[x];
        if(!t)
          t= this.p.TCache[this.assetPath(x)];
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
        t= this.p.loader.resources[x];
        if(!t)
          t= this.p.loader.resources[this.assetPath(x)];
      }
      return t;
    };
    /**
     * @public
     * @function
     */
    Mojo.textureFromImage=function(x){ return this.p.Texture.fromImage(x) };
    /**
     * @public
     * @function
     */
    Mojo.animFromFrames=function(x){
      //return this.p.ASprite.fromFrames( x.map(s => Mojo.assetPath(s)));
      return this.p.ASprite.fromFrames(x)
    };
    /**
     * @public
     * @function
     */
    Mojo.animFromImages=function(x){
      return this.p.ASprite.fromImages(x.map(s => Mojo.assetPath(s)));
    };
    /**
     * @public
     * @property {class}
     */
    Mojo.Game.state= new GameState();

    //ready!
    _prologue(Mojo,cmdArg.arena);

    return Mojo;
  }

  window.addEventListener("load", function(){
    window.Mojo=MojoH5(window["io.czlab.mojoh5.AppConfig"]);
  });

  return (window.MojoH5= global["io.czlab.mojoh5.MojoH5"]=MojoH5)

})(this);


