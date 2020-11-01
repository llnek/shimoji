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
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @private
   * @function
   */
  function _module(Mojo, WIPScenes){
    const _I= global["io.czlab.mojoh5.Input"](Mojo);
    const Core=global["io.czlab.mcfud.core"]();
    const _S = {};
    const _=Core.u;
    const is=Core.is;
    /**
     * @private
     * @function
     */
    function _sceneid(id){
      return id.startsWith("scene::") ? id : "scene::"+id
    }
    /**
     * @public
     * @class
     */
    class Scene extends Mojo.PXContainer{
      constructor(id,func,options){
        super();
        this.name= _sceneid(id);
        if(is.fun(func)){
          this.setup= func;
        }else if(is.obj(func)){
          _.inject(this, func);
        }
        this.mojoh5={stage:true};
        this.____index={};
        this.____queue=[];
        this.____options=options || {};
      }
      future(expr,delayFrames){
        delayFrames = delayFrames || 60;
        _.conj(this.____queue, [expr,delayFrames]);
      }
      getChildById(id){
        return this.____index[id];
      }
      remove(c){
        if(c && _.has(this.children,c)){
          this.removeChild(c);
          _.dissoc(this.____index,c.mojoh5.uuid);
        }
      }
      insert(c,pos){
        if(pos !== undefined &&
          pos >= 0 && pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        this.____index[c.mojoh5.uuid]=c;
        return c;
      }
      dispose(){
        this.mojoh5.dead=true;
        this.children.forEach(c=> c.mojoh5.button && _I.removeButton(c));
        this.removeChildren();
      }
      _iterStep(r,dt){
        _.doseq(r, c=>{
          if(c.mojoh5 && c.mojoh5.step){
            c.mojoh5.step(dt);
            Mojo.EventBus.pub(["post.step",c],dt);
          }
          c.children.length>0 && this._iterStep(c.children, dt)
        });
      }
      _iterClean(r){
        _.doseq(r, c=>{
          if(c.mojoh5)
            c.mojoh5.collisions.length=0;
          c.children.length>0 && this._iterClean(c.children);
        });
      }
      update(dt){
        if(this.mojoh5.dead) {return;}
        //handle queued stuff
        let f,futs= this.____queue.filter(q =>{
          q[1] -= 1;
          return (q[1]<=0);
        });
        while(futs.length>0){
          f=futs.shift();
          f[0]();
          _.disj(this.____queue,f);
        }
        Mojo.EventBus.pub(["pre.update",this],dt);
        this._iterStep(this.children, dt);
        this._iterClean(this.children);
        Mojo.EventBus.pub(["post.update",this],dt);
      }
      runOnce(){
        if(this.setup){
          this.setup(this.____options);
          this.setup=undefined;
        }
      }
    };
    /**
     * @public
     * @function
     */
    _S.layoutX=function(items,options={}){
      let borderWidth=options.borderWidth || 4;
      let border=options.border || 0xffffff;
      let bg= options.color || 0x000000;
      let padX= options.padding || 10;
      let fit= options.fit || 20;
      let fit2=fit*2;
      let P=Mojo.Sprites;
      let C=P.group();

      for(let p,s,i=0;i<items.length;++i){
        s=C.addChild(items[i]);
        if(i>0)
          P.pinRight(p,s,padX,0);
        p=s;
      }

      let last=items[items.length-1];
      let w= C.width;
      let h= C.height;
      let r= P.rectangle(w+fit2,h+fit2,bg,border,borderWidth);
      r.alpha=0.5;
      C.addChildAt(r,0);
      w= C.width;
      h= C.height;
      let w2=w/2;
      let h2=h/2;
      items.forEach(s=> s.y=h2-s.height/2);
      let wd= w-(last.x+last.width);
      wd= wd/2;
      items.forEach(s=> s.x += wd);
      C.x= options.x !== undefined ? options.x : (Mojo.canvas.width-w)/2;
      C.y= options.y !== undefined ? options.y : (Mojo.canvas.height-h)/2;
      return C;
    };
    /**
     * @public
     * @function
     */
    _S.layoutY=function(items,options={}){
      let borderWidth=options.borderWidth || 4;
      let border=options.border || 0xffffff;
      let bg= options.color || 0x000000;
      let padY= options.padding || 10;
      let fit= options.fit || 20;
      let fit2=fit*2;
      let P=Mojo.Sprites;
      let C=P.group();

      for(let p,s,i=0;i<items.length;++i){
        s=C.addChild(items[i]);
        if(i>0)
          P.pinBottom(p,s,0,padY);
        p=s;
      }

      let last=items[items.length-1];
      let w= C.width;
      let h= C.height;
      let r= P.rectangle(w+fit2,h+fit2,bg,border,borderWidth);
      r.alpha=0.5;
      C.addChildAt(r,0);
      w= C.width;
      h= C.height;
      let w2=w/2;
      let h2=h/2;
      items.forEach(s=> s.x=w2-s.width/2);
      let hd= h-(last.y+last.height);
      hd= hd/2;
      items.forEach(s=> s.y += hd);
      C.x= options.x !== undefined ? options.x : (Mojo.canvas.width-w)/2;
      C.y= options.y !== undefined ? options.y : (Mojo.canvas.height-h)/2;
      return C;
    };
    /**
     * @public
     * @function
     */
    _S.defScene=function(name, func, options){
      //add a new scene definition
      WIPScenes[name]=[func, options||{}];
    };
    function _killScene(s){
      if(s) {
        s.dispose && s.dispose();
        s.parent.removeChild(s);
      }
    }
    /**
     * @public
     * @function
     */
    _S.replaceScene=function(cur,name,options){
      //console.log("replacescene: " + cur +", " + _sceneid(cur) + ", name= "+name);
      let c= Mojo.stage.getChildByName(_sceneid(cur));
      if(!c)
        throw `Error: no such scene: ${cur}`;
      let pos= Mojo.stage.getChildIndex(c);
      return this.runScene(name,pos,options);
    }
    /**
     * @public
     * @function
     */
    _S.removeScene=function(...args){
      if(args.length===1 && is.vec(args[0])){
        args=args[0];
      }
      args.forEach(a=>{
        if(is.str(a))
          _killScene(Mojo.stage.getChildByName(_sceneid(a)));
        else if(a)
          _killScene(a);
      })
    };
    /**
     * @public
     * @function
     */
    _S.removeScenes=function(){
      _.doseq(Mojo.stage.children,c => c.dispose && c.dispose());
      Mojo.stage.removeChildren();
    };
    /**
     * @public
     * @function
     */
    _S.findScene=function(name){
      return Mojo.stage.getChildByName(_sceneid(name))
    };
    /**
     * @public
     * @function
     */
    _S.runScene = function(name,num,options){
      let y, _s = WIPScenes[name];
      if(!_s)
        throw `Error: unknown scene: ${name}`;
      if(is.obj(num)){
        options = num;
        num = _.dissoc(options,"slot");
      }
      options = _.inject({},_s[1],options);
      if(is.undef(num))
        num= options["slot"] || -1;
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
    };

    _S.Scene=Scene;
    return (Mojo.Scenes=_S)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Scenes"]=function(Mojo){
    return Mojo.Scenes ? Mojo.Scenes : _module(Mojo, {})
  };

})(this);


