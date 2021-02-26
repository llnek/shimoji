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
        this.____sid=id;
        if(is.fun(func)){
          this.____setup= func;
        }else if(is.obj(func)){
          let s= _.dissoc(func,"setup");
          if(s)
            func["____setup"]=s;
          _.inject(this, func);
        }
        this.m5={stage:true};
        this.g={};
        this.____index={};
        this.____queue=[];
        this.____options=_.or(options, {});
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
        frames ? this.____queue.push([expr,delay]) : _.delay(delay,expr)
      }
      /**Get the child with this id.
       * @param {string} id
       * @return {Sprite}
       */
      getChildById(id){
        return id && this.____index[id];
      }
      /**Remove this child
       * @param {string|Sprite} c
       */
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c && _.has(this.children,c)){
          this.removeChild(c);
          _.dissoc(this.____index,c.m5.uuid);
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
        return (this.____index[c.m5.uuid]=c)
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
            EventBus.pub(["post.step",c],dt);
          }
          c.children.length>0 && this._iterStep(c.children, dt)
        })
      }
      /** @ignore */
      _iterClean(r){
        r.forEach(c=> {
          if(c.m5) if(c.m5.collisions) c.m5.collisions.length=0;
          c.children.length>0 && this._iterClean(c.children);
        });
      }
      /**
       * @param {number} dt
       */
      update(dt){
        if(this.m5.dead){return;}
        //handle queued stuff
        let f,futs= this.____queue.filter(q=>{
          q[1] -= 1;
          return (q[1]<=0);
        });
        //run ones that have expired
        while(futs.length>0){
          _.disj(this.____queue,
                 f=futs.shift());
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
        if(this.____setup){
          this.____setup(this.____options);
          delete this.____setup;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //the module
    const _$={
      Scene,
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
        ScenesDict[name]=[func, options||{}];
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
        let y, _s = ScenesDict[name];
        if(!_s)
          throw `Error: unknown scene: ${name}`;
        if(is.obj(num)){
          options = num;
          num = _.dissoc(options,"slot");
        }
        options = _.inject({},_s[1],options);
        if(is.undef(num))
          num= options["slot"] || -1;
        //before we run a new scene
        Mojo.mouse.reset();
        //create new
        y = new Scene(name, _s[0], options);
        //add to where?
        if(num >= 0 && num < Mojo.stage.children.length){
          let cur= Mojo.stage.getChildAt(num);
          Mojo.stage.addChildAt(y,num);
          _killScene(cur);
        }else{
          Mojo.stage.addChild(y);
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


