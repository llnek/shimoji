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

  /**Create the module.
   */
  function _module(Mojo, ScenesDict){

    const {ute:_,is,EventBus}=Mojo;
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
                    if(ret=cb(item,r.value)){
                      x=y=Infinity;
                      break;
                    }
                    ret=null;
                    r= vs.next();
                  }
                }
          }
          return ret;
        },
        search(item){
          let X,Y,out=[],
              g= item.m5.sgrid;
          for(let y = g.y1; y <= g.y2; ++y){
            if(Y=_grid.get(y))
              for(let x= g.x1; x <= g.x2; ++x)
                if(X=Y.get(x))
                  X.forEach(v=>out.push(v))
          }
          return out;
        },
        engrid(item,skipAdd){
          if(!item || !item.anchor){return}
          let g = item.m5.sgrid,
              r = Mojo.Sprites.boundingBox(item),
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
      return id.startsWith("scene::") ? id : `scene::${id}`
    }

    /** @ignore */
    function _killScene(s){
      if(s){
        s.dispose && s.dispose();
        s.parent.removeChild(s);
      }
    }

    class SceneWrapper extends Mojo.PXContainer{
      constructor(s){
        super();
        this.addChild(s);
        this.m5={stage:true};
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
          stage:true,
          options,
          sgrid:SpatialGrid(options.sgridX||320,options.sgridY||320)
        };
        if(is.fun(func)){
          this.m5.setup= func.bind(this);
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
            m= Mojo["2d"].hitTest(obj,b);
            if(m){
              EventBus.pub(["hit",obj],m);
              if(m.B.m5.static){ m=null }else{
                EventBus.pub(["hit",m.B],m.swap())
              }
              grid.engrid(obj);
              if(--curCol ===0){break}
            }
          }
        }
      }
      collideAB(obj){
        this._hitObjects(this.m5.sgrid,obj,this.m5.sgrid.search(obj),3)
      }
      /**Callback to handle window resizing.
       * @param {number[]} old  window size before resize
       */
      onCanvasResize(old){
        Mojo.Sprites.resize({x:0,y:0,width:old[0],height:old[1],children:this.children})
      }
      /**Run this function after a delay in millis or frames.
       * @param {function}
       * @param {number} delay
       * @param {boolean} frames
       */
      future(expr,delay,frames=true){
        frames ? this.m5.queue.push([expr,delay]) : _.delay(delay,expr)
      }
      /**Get the child with this id.
       * @param {string} id
       * @return {Sprite}
       */
      getChildById(id){
        return id && this.m5.index[id]
      }
      /**Remove this child
       * @param {string|Sprite} c
       */
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c && _.has(this.children,c)){
          this.removeChild(c);
          if(c instanceof PIXI.TilingSprite){}else{
            this.m5.sgrid.degrid(c);
          }
          _.dissoc(this.m5.index,c.m5.uuid);
        }
      }
      /**Insert this child sprite at this position.
       * @param {Sprite} c
       * @param {number} pos
       * @return {Sprite} c
       */
      insert(c,pos){
        if(pos !== undefined &&
           pos >= 0 && pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        if(c instanceof PIXI.TilingSprite){}else{
          this.m5.sgrid.engrid(c);
        }
        return (this.m5.index[c.m5.uuid]=c)
      }
      /**Clean up.
      */
      dispose(){
        function _clean(o){
          o.children.length>0 && o.children.forEach(c=> _clean(c));
          if(o){
            const i=Mojo.Input;
            o.m5.button && i.undoButton(o);
            o.m5.drag && i.undoDrag(o);
          }
        }
        this.m5.dead=true;
        _clean(this);
        this.removeChildren();
      }
      /** @ignore */
      _iterStep(r,dt){
        r.forEach(c=>{
          if(c.m5 && c.m5.step){
            c.m5.step(dt);
            if(c.m5.flip=="x"){
              c.scale.x *= -1;
            }
            if (c.m5.flip=="y"){
              c.scale.y *= -1;
            }
            EventBus.pub(["post.step",c],dt);
            this.m5.sgrid.engrid(c);
          }
          c.children.length>0 && this._iterStep(c.children, dt)
        })
      }
      /** @ignore */
      _iterClean(r){
        r.forEach(c=> {
          if(c.m5 &&
             c.m5.contacts &&
             c.m5.contacts.length>0) c.m5.contacts[0]=null;
          c.children.length>0 && this._iterClean(c.children);
        });
      }
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
        EventBus.pub(["pre.update",this],dt);
        this._iterStep(this.children, dt);
        this._iterClean(this.children);
        EventBus.pub(["post.update",this],dt);
      }
      /**Initial bootstrap of this scene.
      */
      runOnce(){
        if(this.m5.setup){
          this.m5.setup(this.m5.options);
          delete this.m5.setup;
        }
      }
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
        const {Sprites}=Mojo,
              K=Mojo.contentScaleFactor();
        if(items.length===0){return}
        options= _.patch(options,{color:0,
                                  padding:10,
                                  fit:20,
                                  borderWidth:4,
                                  border:0xffffff});
        let borderWidth=options.borderWidth * K.width;
        let C=options.group || Sprites.group();
        let pad=options.padding * K.width;
        let fit= options.fit * K.width;
        let p,fit2= 2*fit;
        //adding left -> right
        items.forEach((s,i)=>{
          if(!options.skipAdd) C.addChild(s);
          _.assert(s.anchor.x<0.3&&s.anchor.y<0.3,"wanted topleft anchor");
          if(i>0)
            Sprites.pinRight(p,s,pad);
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
        //refit the items on y-axis
        items.forEach(s=> s.y=h2-MFL(s.height/2));
        let wd= w-(last.x+last.width);
        wd= MFL(wd/2);
        //refit the items on x-axis
        items.forEach(s=> s.x += wd);
        //may be center the whole thing
        C.x= _.or(options.x, MFL((Mojo.width-w)/2));
        C.y= _.or(options.y, MFL((Mojo.height-h)/2));
        C.m5.resize=function(px,py,pw,ph){
          let cs=C.children.slice();
          let [cx,cy]=[C.x,C.y];
          C.removeChildren();
          C.x=C.y=0;
          options.group=C;
          cs.forEach(c=>{
            c.x=c.y=0;
            c.m5&&c.m5.resize&&c.m5.resize();
          });
          let s=this.layoutX(cs,options);
          _.assert(s===C);
          if(s.parent.m5 && s.parent.m5.stage){
            s.x= cx * MFL(Mojo.width/pw);
            s.y= cy * MFL(Mojo.height/ph);
          }else{
            s.x= cx * MFL(s.parent.width/pw);
            s.y= cy * MFL(s.parent.height/ph);
          }
        };
        return C;
      },
      /**Lay items out vertically.
       * @memberof module:mojoh5/Scenes
       * @param {Sprite[]} items
       * @param {object} [options]
       * @return {Container}
       */
      layoutY(items,options){
        const {Sprites}= Mojo,
              K=Mojo.contentScaleFactor();
        if(items.length===0){return}
        options= _.patch(options,{color:0,
                                  fit:20,
                                  padding:10,
                                  borderWidth:4,
                                  border:0xffffff});
        let borderWidth= options.borderWidth * K.width;
        let C=options.group || Sprites.group();
        let pad= options.padding * K.width;
        let fit = options.fit * K.width;
        let p,fit2=fit*2;
        //add items top -> bottom
        items.forEach((s,i)=>{
          if(!options.skipAdd) C.addChild(s);
          if(i>0)
            Sprites.pinBottom(p,s,pad);
          p=s;
        });
        let [w,h]= [C.width, C.height];
        let last=_.tail(items);
        if(options.bg!="transparent"){
          //backdrop
          let r= Sprites.rectangle(w+fit2, h+fit2,
                                   options.bg, options.border, borderWidth);
          r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
          C.addChildAt(r,0);
        }
        w= C.width;
        h= C.height;
        let [w2,h2] =[MFL(w/2), MFL(h/2)];
        //realign on x-axis
        items.forEach(s=> s.x=w2-MFL(s.width/2));
        let hd= h-(last.y+last.height);
        hd= MFL(hd/2);
        //realign on y-axis
        items.forEach(s=> s.y += hd);
        //may be center the whole thing
        C.x= _.or(options.x, MFL((Mojo.width-w)/2));
        C.y= _.or(options.y, MFL((Mojo.height-h)/2));
        C.m5.resize=function(px,py,pw,ph){
          let cs=C.children.slice();
          let [cx,cy]=[C.x,C.y];
          C.removeChildren();
          C.x=C.y=0;
          options.group=C;
          cs.forEach(c=>{
            c.x=c.y=0;
            c.m5&&c.m5.resize&&c.m5.resize();
          });
          let s=this.layoutY(cs,options);
          _.assert(s===C);
          if(s.parent.m5 && s.parent.m5.stage){
            s.x= cx * MFL(Mojo.width/pw);
            s.y= cy * MFL(Mojo.height/ph);
          }else{
            s.x= cx * MFL(s.parent.width/pw);
            s.y= cy * MFL(s.parent.height/ph);
          }
        };
        return C;
      },
      /**Define a scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {object|function} func
       * @param {object} [options]
       */
      defScene(name, func, options){
        //add a new scene definition
        ScenesDict[name]=[func, options]
      },
      /**Replace the current scene with this one.
       * @memberof module:mojoh5/Scenes
       * @param {string} cur
       * @param {string} name
       * @param {object} [options]
       */
      replaceScene(cur,name,options){
        //console.log("replacescene: " + cur +", " + _sceneid(cur) + ", name= "+name);
        const c= Mojo.stage.getChildByName(_sceneid(cur));
        if(!c)
          throw `Error: no such scene: ${cur}`;
        return this.runScene(name, Mojo.stage.getChildIndex(c),options);
      },
      /**Remove these scenes.
       * @memberof module:mojoh5/Scenes
       * @param {...Scene} args
       */
      removeScene(...args){
        if(args.length===1 && is.vec(args[0])){ args=args[0] }
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
      },
      /**Find this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @return {Scene}
       */
      findScene(name){
        return Mojo.stage.getChildByName(_sceneid(name))
      },
      /**Run this scene.
       * @memberof module:mojoh5/Scenes
       * @param {string} name
       * @param {number} num
       * @param {object} [options]
       * @return {Scene}
       */
      runScene(name,num,options){
        let tmx, py, y, s0,_s = ScenesDict[name];
        if(!_s)
          throw `Error: unknown scene: ${name}`;
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
          tmx=options.tiled.name;
          _.assert(tmx, "no tmx file!");
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
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Scenes"]=function(M){
      return M.Scenes ? M.Scenes : _module(M, {})
    }
  }

})(this);


