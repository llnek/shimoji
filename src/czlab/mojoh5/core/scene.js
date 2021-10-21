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
            if(c.visible)
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


