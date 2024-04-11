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


