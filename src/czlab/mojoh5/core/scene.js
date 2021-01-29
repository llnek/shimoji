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
  /**
   * @private
   * @function
   */
  function _module(Mojo, WIPScenes){
    const {u:_,is,EventBus}=Mojo;
    const _S = {};
    /**
     * @private
     * @function
     */
    function _sceneid(id){
      return id.startsWith("scene::") ? id : `scene::${id}`
    }
    /**
     * @public
     * @class
     */
    class Scene extends Mojo.PXContainer{
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
        this.____options=options || {};
      }
      onCanvasResize(old){
        Mojo["Sprites"].resize({x:0,y:0,width:old[0],height:old[1],children:this.children})
      }
      future(expr,delay,frames=true){
        frames ? _.conj(this.____queue, [expr,delay]) : _.delay(delay,expr)
      }
      getChildById(id){
        return id && this.____index[id];
      }
      remove(c){
        if(is.str(c))
          c=this.getChildById(c);
        if(c && _.has(this.children,c)){
          this.removeChild(c);
          _.dissoc(this.____index,c.m5.uuid);
        }
      }
      insert(c,pos){
        if(pos !== undefined &&
           pos >= 0 && pos < this.children.length){
          this.addChildAt(c,pos);
        }else{
          this.addChild(c);
        }
        return (this.____index[c.m5.uuid]=c)
      }
      dispose(){
        function _clean(o){
          o.children.length>0 && o.children.forEach(c=> _clean(c));
          o && o.m5.button && Mojo["Input"].undoButton(o);
        }
        this.m5.dead=true;
        _clean(this);
        this.removeChildren();
      }
      _iterStep(r,dt){
        r.forEach(c=>{
          if(c.m5 && c.m5.step){
            c.m5.step(dt);
            EventBus.pub(["post.step",c],dt);
          }
          c.children.length>0 && this._iterStep(c.children, dt)
        })
      }
      _iterClean(r){
        r.forEach(c=> c.children.length>0 && this._iterClean(c.children))
      }
      update(dt){
        if(this.m5.dead) {return;}
        //handle queued stuff
        let f,futs= this.____queue.filter(q=>{
          q[1] -= 1;
          return (q[1]<=0);
        });
        while(futs.length>0){
          f=futs.shift();
          f[0]();
          _.disj(this.____queue,f);
        }
        EventBus.pub(["pre.update",this],dt);
        this._iterStep(this.children, dt);
        this._iterClean(this.children);
        EventBus.pub(["post.update",this],dt);
      }
      runOnce(){
        if(this.____setup){
          this.____setup(this.____options);
          this.____setup=undefined;
        }
      }
    }
    /**
     * @public
     * @function
     */
    _S.layoutX=function(items,options){
      const {Sprites}=Mojo;
      _.patch(options,{
        color:0,
        padding:10,
        fit:20,
        borderWidth:4,
        border:0xffffff});
      let C=options.group || Sprites.group();
      let K=Mojo.contentScaleFactor();
      let borderWidth=options.borderWidth * K.width;
      let pad=options.padding * K.width;
      let fit= options.fit * K.width;
      let fit2= 2*fit;
      for(let p,s,i=0;i<items.length;++i){
        s=items[i];
        if(!options.skipAdd) C.addChild(s);
        if(i>0)
          Sprites.pinRight(p,s,pad);
        p=s;
      }
      let last=_.tail(items);
      let w= C.width;
      let h= C.height;
      if(options.bg!=="transparent"){
        let r= Sprites.rectangle(w+fit2,h+fit2,
                                 options.bg,
                                 options.border, borderWidth);
        r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
        C.addChildAt(r,0);
      }
      //final width,height,center
      w= C.width;
      h= C.height;
      let w2=w/2|0;
      let h2=h/2|0;
      items.forEach(s=> s.y=h2-s.height/2|0);
      let wd= w-(last.x+last.width);
      wd= wd/2|0;
      items.forEach(s=> s.x += wd);
      C.x= options.x !== undefined ? options.x : (Mojo.width-w)/2|0;
      C.y= options.y !== undefined ? options.y : (Mojo.height-h)/2|0;
      C.m5.resize=function(px,py,pw,ph){
        let cs=C.children.slice();
        let cx=C.x;
        let cy=C.y;
        C.removeChildren();
        C.x=C.y=0;
        options.group=C;
        cs.forEach(c=>{
          c.x=c.y=0;
          c.m5&&c.m5.resize&&c.m5.resize();
        });
        let s=_S.layoutX(cs,options);
        if(s.parent.m5 && s.parent.m5.stage){
          s.x= cx * Mojo.width/pw|0;
          s.y= cy * Mojo.height/ph|0;
        }else{
          s.x= cx * s.parent.width/pw|0;
          s.y= cy * s.parent.height/ph|0;
        }
      };
      return C;
    };
    /**
     * @public
     * @function
     */
    _S.layoutY=function(items,options){
      _.patch(options,{
        color:0,
        fit:20,
        padding:10,
        borderWidth:4,
        border:0xffffff
      });
      const {Sprites}= Mojo;
      let C=options.group || Sprites.group();
      let K=Mojo.contentScaleFactor();
      let borderWidth= options.borderWidth * K.width;
      let pad= options.padding * K.width;
      let fit = options.fit * K.width;
      let fit2=fit*2;
      for(let p,s,i=0;i<items.length;++i){
        s=items[i];
        if(!options.skipAdd) C.addChild(s);
        if(i>0)
          P.pinBottom(p,s,pad);
        p=s;
      }
      let last=_.tail(items);
      let w= C.width;
      let h= C.height;
      if(options.bg!=="transparent"){
        let r= Sprites.rectangle(w+fit2, h+fit2,
                                 options.bg, options.border, borderWidth);
        r.alpha= options.opacity===0 ? 0 : (options.opacity || 0.5);
        C.addChildAt(r,0);
      }
      w= C.width;
      h= C.height;
      let w2=w/2|0;
      let h2=h/2|0;
      items.forEach(s=> s.x=w2-s.width/2|0);
      let hd= h-(last.y+last.height);
      hd= hd/2|0;
      items.forEach(s=> s.y += hd);
      C.x= options.x !== undefined ? options.x : (Mojo.width-w)/2|0;
      C.y= options.y !== undefined ? options.y : (Mojo.height-h)/2|0;
      C.m5.resize=function(px,py,pw,ph){
        let cs=C.children.slice();
        let cx=C.x;
        let cy=C.y;
        C.removeChildren();
        C.x=C.y=0;
        options.group=C;
        cs.forEach(c=>{
          c.x=c.y=0;
          c.m5&&c.m5.resize&&c.m5.resize();
        });
        let s=_S.layoutY(cs,options);
        if(s.parent.m5 && s.parent.m5.stage){
          s.x= cx * Mojo.width/pw|0;
          s.y= cy * Mojo.height/ph|0;
        }else{
          s.x= cx * s.parent.width/pw|0;
          s.y= cy * s.parent.height/ph|0;
        }
      };
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
      return this.runScene(name, Mojo.stage.getChildIndex(c),options);
    }
    /**
     * @public
     * @function
     */
    _S.removeScene=function(...args){
      if(args.length===1 && is.vec(args[0])){ args=args[0] }
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
      Mojo.stageCS(c => c.dispose && c.dispose());
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
    _S.runScene=function(name,num,options){
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
      //before we run a new scene
      Mojo.pointer.reset();
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


  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
    module.exports={msg:"not supported in node"}
  }else {
    gscope["io/czlab/mojoh5/Scenes"]=function(M){
      return M.Scenes ? M.Scenes : _module(M, {})
    }
  }

})(this);


