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
  let _singleton=null;
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.core"]=function(){
    if(_singleton){ return _singleton }
    const document=global.document;
    const OBJ=Object.prototype;
    const ARR=Array.prototype;
    const slicer=ARR.slice;
    const tostr=OBJ.toString;
    const _C={};

    function isObject(obj){ return tostr.call(obj) === "[object Object]"; }
    function isFun(obj){ return tostr.call(obj) === "[object Function]" }
    function isArray(obj){ return tostr.call(obj) === "[object Array]"; }
    function isMap(obj){ return tostr.call(obj) === "[object Map]"; }
    function isStr(obj){ return typeof obj === "string"; }
    function isNum(obj){ return tostr.call(obj) === "[object Number]"; }
    function _randXYInclusive(min,max){
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    function _fext(name){
      let pos= name.lastIndexOf(".");
      return pos>0 ? name.substring(pos+1).toLowerCase() : "";
    }

    //https://github.com/bryc/code/blob/master/jshash/PRNGs.md
    //xoshiro128+ (128-bit state generator in 32-bit)
    const xoshiro128p = (function(a,b,c,d){
      return function(){
        let t = b << 9, r = a + d;
            c = c ^ a;
            d = d ^ b;
            b = b ^ c;
            a = a ^ d;
            c = c ^ t;
            d = (d << 11) | (d >>> 21);
        return (r >>> 0) / 4294967296;
      };
    })(Date.now(),Date.now(),Date.now(),Date.now()); // simple seeding??
    //const EPSILON= 0.00001;
    const EPSILON= 0.0000000001;
    /**
     * @private
     * @var {number}
      */
    let _seqNum= 0;
    /**
     * @public
     * @var {object}
     */
    const _={
      feq0(a){
        return Math.abs(a) < EPSILON
      },
      feq(a, b){
        // <= instead of < for NaN comparison safety
        return Math.abs(a - b) <= EPSILON;
      },
      fgteq(a,b){
        return a>b || this.feq(a,b);
      },
      flteq(a,b){
        return a<b || this.feq(a,b);
      },
      pack(o){ return JSON.stringify(o) },
      unpack(s){ return JSON.parse(s) },
      v2(x,y){ return [x,y] },
      p2(x,y){ return {x: x, y: y} },
      numOrZero(n){ return isNaN(n) ? 0 : n },
      or(a,b){ return a===undefined?b:a },
      parseNumber(s,dft){
        let n=parseFloat(s);
        return (isNaN(n) && isNum(dft)) ? dft : n;
      },
      splitVerStr(s){
        let arr=(""+(s || "")).split(".").filter(s=> s.length>0);
        let major=this.parseNumber(arr[0],0);
        let minor=this.parseNumber(arr[1],0);
        let patch=this.parseNumber(arr[2],0);
        return [major, minor, patch];
      },
      cmpVerStrs(V1,V2){
        let v1= this.splitVerStr(""+V1);
        let v2= this.splitVerStr(""+V2);
        if(v1[0] > v2[0]) return 1;
        else if(v1[0] < v2[0]) return -1;
        if(v1[1] > v2[1]) return 1;
        else if(v1[1] < v2[1]) return -1;
        if(v1[2] > v2[2]) return 1;
        else if(v1[2] < v2[2]) return -1;
        return 0;
      },
      findFiles(files, exts){
        return files.filter(s=> exts.indexOf(_fext(s)) > -1);
      },
      pdef(obj){
        obj.enumerable=true;
        obj.configurable=true;
        return obj;
      },
      partition(count,arr){
        let out=[];
        for(let row,i=0;;){
          row=[];
          for(let j=0;j<count;++j){
            if(i<arr.length){
              row.push(arr[i]);
              ++i;
            }else{
              if(row.length>0) out.push(row);
              return out;
            }
          }
        }
      },
      range(start,end){
        _.assert(start !== undefined);
        let out=[];
        if(arguments.length===1){ end=start; start=0 }
        for(let i=start;i<end;++i){ out.push(i) }
        return out
      },
      keys(obj){
        return isMap(obj) ? Array.from(obj.keys())
                          : (isObject(obj) ? Object.keys(obj) : []);
      },
      selectKeys(coll,keys){
        let out;
        if(isMap(coll) || isObject(coll)){
          if(isMap(coll)) out=new Map();
          else out={};
          this.seq(keys).forEach(k=>{
            if(isMap(coll)){
              if(coll.has(k))
                out.set(k, coll.get(k));
            }else{
              if(OBJ.hasOwnProperty.call(coll, k))
                out[k]= coll[k];
            }
          });
        }
        return out;
      },
      assert(cond){
        if(!cond)
          throw (arguments.length<2) ? "Assert Failed!" : slicer.call(arguments,1).join("");
        return true
      },
      noSuchKeys(keys,target){
        let r=this.some(this.seq(keys),k => this.has(target,k)?k:null);
        if(r) console.log("keyfound="+r);
        return !r;
      },
      randFloat(min, max){
        return min + Math.random() * (max - min);
      },
      randMinus1To1(){ return (Math.random() - 0.5) * 2 },
      randInt(num){ return _randXYInclusive(0,num) },
      randInt2: _randXYInclusive,
      rand(){ return Math.random() },
      inst(type,obj){ return obj instanceof type },
      isPerc(s){
        return isStr(s) && s.match(/^([0-9])(\.?[0-9]+|[0-9]*)%$/);
      },
      jsMap(){ return new Map() },
      jsObj(){ return {} },
      jsVec(...args){
        return args.length===0 ? [] : args.slice();
      },
      floor(v){ return Math.floor(v) },
      ceil(v){ return Math.ceil(v) },
      abs(v){ return Math.abs(v) },
      sqrt(v){ return Math.sqrt(v) },
      min(a,b){ return Math.min(a,b) },
      max(a,b){ return Math.max(a,b) },
      slice(a,i){ return slicer.call(a, i) },
      every(c,v){
        for(let i=0;i<c.length;++i)
          if(c[i] !== v) return false;
        return c.length>0;
      },
      notAny(c,v){
        for(let i=0;i<c.length;++i)
          if(c[i] === v) return false;
        return c.length>0;
      },
      copy(to,from){
        if(!from) return to;
        if(!to) return from.slice();
        let len= Math.min(to.length,from.length);
        for(let i=0;i<len;++i) to[i]=from[i];
        return to;
      },
      append(to,from){
        if(!from) return to;
        if(!to) return from.slice();
        for(let i=0;i<from.length;++i) to.push(from[i]);
        return to;
      },
      fill(a,v){
        if(a)
          for(let i=0;i<a.length;++i){
            a[i] = isFun(v) ? v() : v;
          }
        return a;
      },
      size(obj){
        let len=0;
        if(isArray(obj)) len= obj.length;
        else if(isMap(obj)) len=obj.size;
        else if(obj) len=_.keys(obj).length;
        return len;
      },
      nextId(){ return ++_seqNum },
      now(){ return Date.now() },
      fileExt: _fext,
      fileNoExt(name){
        let pos= name.lastIndexOf(".");
        return pos>0 ? name.substring(0,pos) : name;
      },
      range(start,stop,step=1){
        if(typeof stop==="undefined"){
          stop=start; start=0; step=1;
        }
        let res=[];
        let len = (stop-start)/step;
        len = Math.ceil(len);
        len = Math.max(0, len);
        res.length=len;
        for(let i=0;i<len;++i){
          res[i] = start;
          start += step;
        }
        return res;
      },
      shuffle(obj){
        let res=slicer.call(obj,0);
        for(let x,j,i= res.length-1; i>0; --i){
          j = Math.floor(Math.random() * (i+1));
          x = res[i];
          res[i] = res[j];
          res[j] = x;
        }
        return res;
      },
      uniq(arr){
        let res= [];
        let prev= null;
        arr = slicer.call(arr).sort();
        arr.forEach(a=>{
          if(a !== undefined &&
             a !== prev) res.push(a);
          prev = a;
        });
        return res;
      },
      map(obj, fn,target){
        let res= [];
        if(isArray(obj))
          res= obj.map(fn,target);
        else if(isMap(obj)){
          obj.forEach((v,k)=>{
            res.push(fn.call(target, v,k,obj));
          });
        }else if(obj){
          for(let k in obj)
            if(OBJ.hasOwnProperty.call(obj, k))
              res.push(fn.call(target, obj[k],k,obj));
        }
        return res;
      },
      find(obj,fn,target){
        let args=slicer.call(arguments,3);
        if(isArray(obj)){
          for(let i=0,z=obj.length;i<z;++i)
            if(fn.apply(target, [obj[i], i].concat(args)))
              return obj[i];
        }else if(isMap(obj)){
          let ks=Array.from(obj.keys());
          for(let k,i=0,z=ks.length;i<z;++i){
            k=ks[i];
            if(fn.apply(target, [obj.get(k), k].concat(args)))
            return [k, obj.get(k)];
          }
        }else if(obj){
          for(let k in obj)
            if(OBJ.hasOwnProperty.call(obj, k) &&
               fn.apply(target, [obj[k], k].concat(args)))
              return [k,obj[k]];
        }
      },
      some(obj,fn,target){
        let res;
        let args=slicer.call(arguments,3);
        if(isArray(obj)){
          for(let i=0,z=obj.length;i<z;++i)
            if(res = fn.apply(target, [obj[i], i].concat(args)))
              return res;
        }else if(isMap(obj)){
          let ks=Array.from(obj.keys());
          for(let k,i=0,z=ks.length;i<z;++i){
            k=ks[i];
            if(res = fn.apply(target, [obj.get(k), k].concat(args)))
              return res;
          }
        }else if(obj){
          for(let k in obj)
            if(OBJ.hasOwnProperty.call(obj, k))
              if(res = fn.apply(target, [obj[k], k].concat(args)))
                return res;
        }
      },
      invoke(arr,key){
        let args=slicer.call(arguments,2);
        if(isArray(arr))
          arr.forEach(x => x[key].apply(x, args));
      },
      delay(wait,f){
        return setTimeout(f,wait);
      },
      timer(f,delay=0,repeat=false){
        return {
          repeat: !!repeat,
          id: repeat ? setInterval(f,delay) : setTimeout(f,delay)
        }
      },
      clear(handle){
        if(handle)
          handle.repeat ? clearInterval(handle.id)
                        : clearTimeout(handle.id)
      },
      rseq(obj,fn,target){
        if(isArray(obj) && obj.length>0)
          for(let i=obj.length-1;i>=0;--i)
            fn.call(target, obj[i],i);
      },
      doseq(obj,fn,target){
        if(isArray(obj))
          obj.forEach(fn,target);
        else if(isMap(obj))
          obj.forEach((v,k)=> fn.call(target,v,k,obj));
        else if(obj)
          for(let k in obj)
            if(OBJ.hasOwnProperty.call(obj,k))
            fn.call(target, obj[k], k, obj);
      },
      dissoc(obj,key){
        if(arguments.length>2){
          let prev,i=1;
          for(;i<arguments.length;++i)
            prev=this.dissoc(obj,arguments[i]);
          return prev;
        }else{
          let val;
          if(isMap(obj)){
            val=obj.get(key);
            obj.delete(key);
          }else if(obj){
            val = obj[key];
            delete obj[key];
          }
          return val;
        }
      },
      get(obj,key){
        if(typeof key !== "undefined"){
          if(isMap(obj)) return obj.get(key);
          else if(obj) return obj[key];
        }
      },
      assoc(obj,key,value){
        if(arguments.length>3){
          if(((arguments.length-1)%2) !== 0)
            throw "ArityError: expecting even count of args.";
          let prev, i=1;
          for(;i < arguments.length;){
            prev= this.assoc(obj,arguments[i],arguments[i+1]);
            i+=2;
          }
          return prev;
        }else{
          let prev;
          if(isMap(obj)){
            prev=obj.get(key);
            obj.set(key,value);
          }else if(obj){
            prev=obj[key];
            obj[key]=value;
          }
          return prev;
        }
      },
      disj(coll,obj){
        let i = coll ? coll.indexOf(obj) : -1;
        if(i > -1) coll.splice(i,1);
        return i > -1;
      },
      conj(coll,...objs){
        if(coll)
          objs.forEach(o => coll.push(o));
        return coll;
      },
      seq(arg,sep=","){
        if(typeof arg === "string")
          arg = arg.split(sep).map(s=>s.trim()).filter(s=>s.length>0);
        if(!isArray(arg)) arg = [arg];
        return arg;
      },
      has(obj,key){
        if(!key)
          return false;
        if(isMap(obj))
          return obj.has(key);
        if(isArray(obj))
          return obj.indexOf(key) !== -1;
        if(obj)
          return OBJ.hasOwnProperty.call(obj, key);
      },
      patch(des,additions){
        des=des || {};
        if(additions)
          Object.keys(additions).forEach(k=>{
            if(des[k]===undefined)
              des[k]=additions[k];
          });
        return des;
      },
      clone(obj){
        if(obj)
          obj=JSON.parse(JSON.stringify(obj));
        return obj;
      },
      inject(des){
        let args=slicer.call(arguments,1);
        des=des || {};
        args.forEach(s=>{
          if(s) Object.assign(des,s);
        });
        return des;
      }
    };
    //browser only--------------------------------------------------------------
    if(document){
      _.addEvent=function(event,target,cb,arg){
        if(isArray(event) && arguments.length===1)
          event.forEach(e => this.addEvent.apply(this, e));
        else
          target.addEventListener(event,cb,arg);
      };
      _.delEvent=function(event,target,cb,arg){
        if(isArray(event) && arguments.length===1)
          event.forEach(e => this.delEvent.apply(this, e));
        else
          target.removeEventListener(event,cb,arg);
      };
    }
    /**
     * @private
     * @function
     */
    function _everyF(F,_1,args){
      let b=F(_1);
      switch(args.length){
      case 0: return b;
      case 1: return b && F(args[0]);
      case 2: return b && F(args[0]) && F(args[1]);
      case 3: return b && F(args[0]) && F(args[1]) && F(args[2]);
      default: return b && args.every(x => F(x));
      }
    }
    /**
     * @public
     * @var {object}
     */
    const is={
      fun(f,...args){ return _everyF(isFun,f,args) },
      str(s,...args){ return _everyF(isStr,s,args) },
      void0(obj){ return obj === void 0 },
      undef(obj){ return obj === undefined },
      obj(o,...args){ return _everyF(isObject,o,args) },
      map(m,...args){ return _everyF(isMap,m,args) },
      num(n,...args){ return _everyF(isNum,n,args) },
      vec(v,...args){ return _everyF(isArray,v,args) },
      some(obj){ return _.size(obj) > 0 },
      none(obj){ return _.size(obj) === 0 }
    };
    /**
     * @public
     * @var {object}
     */
    const dom={
      qSelector(sel){ return document.querySelectorAll(sel) },
      qId(id){ return document.getElementById(id) },
      parent(e){ return e ? e.parentNode : undefined },
      conj(par,child){ return par.appendChild(child) },
      byTag(tag, ns){
        return !is.str(ns) ? document.getElementsByTagName(id)
                           : document.getElementsByTagNameNS(ns,tag) },
      attrs(e, attrs){
        if(!is.obj(attrs) && attrs){
          if(arguments.length > 2)
            e.setAttribute(attrs, arguments[2]);
          return e.getAttribute(attrs);
        }
        if(attrs)
          _.doseq(attrs, (v,k) => e.setAttribute(k,v));
        return e;
      },
      css(e, styles){
        if(!is.obj(styles) && styles){
          if(arguments.length > 2)
            e.style[styles]= arguments[2];
          return e.style[styles];
        }
        if(styles)
          _.doseq(styles, (v,k) => { e.style[k]= v; });
        return e;
      },
      wrap(child,wrapper){
        let p=child.parentNode;
        wrapper.appendChild(child);
        p.appendChild(wrapper);
        return wrapper;
      },
      newElm(tag, attrs, styles){
        let e = document.createElement(tag);
        this.attrs(e,attrs);
        this.css(e,styles);
        return e;
      },
      newTxt(tag, attrs, styles){
        let e = document.createTextNode(tag);
        this.attrs(e,attrs);
        this.css(e,styles);
        return e;
      }
    };
    /**
     * @public
     * @function
     */
    const EventBus= function(){
      let _tree= _.jsMap();
      let NULL={};
      let ZA=[];
      return {
        sub(subject,cb,ctx,extras){
          let event=subject[0], target=subject[1];
          //handle multiple events in one string
          _.seq(event).forEach(e=>{
            if(!cb) cb=e;
            if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
            if(!cb) throw "Error: no callback for sub()";
            if(!_tree.has(e)) _tree.set(e, _.jsMap());
            let m= _tree.get(e);
            target=target||NULL;
            !m.has(target) && m.set(target,[]);
            m.get(target).push([cb,ctx,extras]);
          });
        },
        pub(subject,...args){
          let m,t,event=subject[0], target=subject[1] || NULL;
          _.seq(event).forEach(e=>{
            t=_tree.get(e);
            m= t && t.get(target);
            m && m.forEach(s=>{
              s[0].apply(s[1],args.concat(s[2] || ZA));
            });
          });
        },
        unsub(subject,cb,ctx){
          let event=subject[0], target=subject[1] || NULL;
          let t,m, es=_.seq(event);
          es.forEach(e=>{
            t= _tree.get(e);
            m= t && t.get(target);
            if(m){
              if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
              if(!cb){
                //t.delete(target);
              }
              else
                for(let i= m.length-1;i>=0;--i)
                    if(m[i][0] === cb && m[i][1] === ctx) m.splice(i,1);
            }
          });
        }
      };
    };

    if(document){ _C.dom=dom }
    _C.EventBus= EventBus;
    _C.u= _;
    _C.is= is;
    return (_singleton=_C);
  };

})(this);



// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.

;(function(global){
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  let _singleton=null;
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.math"]=function(){
    if(_singleton) { return _singleton }
    const Core= global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const is=Core.is;
    const EPSILON= 0.0000000001;
    const NEG_DEG_2PI= -360;
    const DEG_2PI= 360;
    const TWO_PI= 2*Math.PI;
    const PI= Math.PI;
    const _M={EPSILON: EPSILON};
    /**
     * Fuzzy match.
     * @private
     * @function
     */
    function _cmp_eq(x,y){
      return Math.abs(x-y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))))
    }
    /**
     * @public
     * @function
     */
    _M.lerp=function(startv, endv, t){
      return (1 - t) * startv + t * endv
    };
    /**
     * Proper modulo.
     * @public
     * @function
     */
    _M.xmod=function(x,N){
      return x < 0 ? x-(-(N + N*Math.floor(-x/N))) : x%N
    };
    /**
     * @public
     * @function
     */
    _M.clamp=function(min,max,v){
      if(v < min) return min;
      if(v > max) return max;
      return v
    };
    /**
     * @function
     * @public
     */
    _M.sqr=function(a){
      return a*a
    };
    /**
     * @public
     * @function
     */
    _M.fuzzyEq=function(a,b){
      return Math.abs(a-b) < EPSILON
    };
    /**
     * @public
     * @function
     */
    _M.fuzzyZero=function(n){
      return this.fuzzyEq(n, 0.0)
    };
    /**
     * @private
     * @function
     */
    function _mod_deg(deg){
      return deg<0 ? -(-deg%DEG_2PI) : deg%DEG_2PI
    }
    /**
     * Radian to degree.
     *
     * @function
     * @public
     */
    _M.radToDeg=function(r){
      return _mod_deg(DEG_2PI * r/TWO_PI)
    };
    /**
     * Degree to radian.
     *
     * @public
     * @function
     */
    _M.degToRad=function(d){
      return TWO_PI * _mod_deg(d)/DEG_2PI
    };
    /**
     * Hypotenuse squared.
     * @public
     * @function
     */
    _M.pythag2=function(x,y){ return x*x + y*y };
    /**
     * Hypotenuse.
     * @public
     * @function
     */
    _M.pythag=function(x,y){ return Math.sqrt(x*x + y*y) };
    /**
     * Modulo of the next increment.
     * @function
     * @public
     */
    _M.wrap=function(i,len){ return (i+1) % len };
    /**
     * Is it more a or b?
     * @public
     * @function
     */
    _M.biasGreater=function(a,b){
      const biasRelative= 0.95;
      const biasAbsolute= 0.01;
      return a >= (b*biasRelative + a*biasAbsolute)
    };

    return (_singleton=_M)
  };

})(this);



// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.

;(function(global){
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.vec2"]=function(UseOBJ){
    class V2Obj{ constructor(){ this.x=0; this.y=0; } }
    const Core= global["io.czlab.mcfud.core"]();
    const _M= global["io.czlab.mcfud.math"]();
    if(_M.Vec2){return _M.Vec2}
    const EPSILON= 0.0000000001;
    const _=Core.u;
    const is=Core.is;
    const _V={};
    function _cobj() { return new V2Obj() }
    function _carr() { return [0,0] }
    const _CTOR= UseOBJ ? _cobj : _carr;
    const _POOL= _.fill(new Array(128), _CTOR);
    /**
     * @private
     * @function
     */
    function _drop(...args){
      args.forEach(a => {
        if(a){
          if(UseOBJ){
            if(a instanceof V2Obj) _POOL.push(a)
          }else{
            if(a.length===2) _POOL.push(a)
          }
        }
      })
    }
    /**
     * @private
     * @function
     */
    function _take(x,y){
      let out= _POOL.length>0 ? _POOL.pop() : _CTOR();
      if(UseOBJ){
        out.x=x||0;
        out.y=y||0;
      }else{
        out[0]=x||0;
        out[1]=y||0;
      }
      return out;
    }
    /**
     * @public
     * @function
     */
    _V.V2=function(x,y){ return _take(x,y) };
    _V.takeV2=_take;
    _V.dropV2=_drop;
    /**
     * @private
     * @var {object}
     */
    const _4ops={ "+": (a,b)=>a+b, "-": (a,b)=>a-b,
                  "*": (a,b)=>a*b, "/": (a,b)=>a/b };
    /**
     * @private
     * @function
     */
    function _assertArgs(a,b){
      if(is.num(b)) b=a;
      UseOBJ ? _.assert(a instanceof V2Obj && b instanceof V2Obj)
             : _.assert(a.length===2&&a.length===b.length);
      return true;
    }
    /**
     * @private
     * @function
     */
    function _vecXXX(op,a,b,local){
      let out= _assertArgs(a,b) ? (local ? a : _CTOR()) : null;
      let n= is.num(b);
      if(UseOBJ){
        out.x=op(a.x, n?b:b.x);
        out.y=op(a.y, n?b:b.y);
      }else{
        out[0]=op(a[0], n?b:b[0]);
        out[1]=op(a[1], n?b:b[1]);
      }
      return out;
    }
    /**
     * @public
     * @function
     */
    _V.vecAdd=function(a,b){ return _vecXXX(_4ops["+"],a,b) };
    /**
     * @public
     * @function
     */
    _V.vecAddSelf=function(a,b){ return _vecXXX(_4ops["+"],a,b,1) };
    /**
     * @function
     * @public
     */
    _V.vecSub=function(a,b){ return _vecXXX(_4ops["-"],a,b) };
    /**
     * @public
     * @function
     */
    _V.vecSubSelf=function(a,b){ return _vecXXX(_4ops["-"],a,b,1) };
    /**
     * @public
     * @function
     */
    _V.vecMul=function(a,b){ return _vecXXX(_4ops["*"],a,b) };
    /**
     * @public
     * @function
     */
    _V.vecMulSelf=function(a,b){ return _vecXXX(_4ops["*"],a,b,1) };
    /**
     * @public
     * @function
     */
    _V.vecDiv=function(a,b){ return _vecXXX(_4ops["/"],a,b) };
    /**
     * @public
     * @function
     */
    _V.vecDivSelf=function(a,b){ return _vecXXX(_4ops["/"],a,b,1) };
    /**
     * Dot product of vectors, cosα = a·b / (|a| * |b|).
     *
     * @public
     * @function
     * @returns {number}
     */
    _V.vecDot=function(a,b){
      return _assertArgs(a,b) ? (UseOBJ ? (a.x * b.x + a.y * b.y)
                                        : (a[0]*b[0] + a[1]*b[1])) : undefined
    }
    /**
     * @public
     * @function
     */
    _V.makeVecAB=function(a,b){
      return _take(b[0]-a[0],b[1]-a[1])
    };
    /**
     * @public
     * @function
     */
    _V.vecLen2=function(a){ return this.vecDot(a,a) }
    /**
     * @public
     * @function
     */
    _V.vecLen=function(a){ return Math.sqrt(this.vecLen2(a)) }
    /**
     * @public
     * @function
     */
    _V.vecDist2=function(a,b){
      let v= this.vecSub(b,a);
      let d= this.vecLen2(v);
      _drop(v);
      return d;
    }
    /**
     * @public
     * @function
     */
    _V.vecDist=function(a,b){ return Math.sqrt(this.vecDist2(a,b)) }
    /**
     * Unit-vector.
     * @public
     * @function
     */
    _V.vecUnit=function(a){
      let d=this.vecLen(a);
      let out= _CTOR();
      if(d>EPSILON){
        if(UseOBJ){
          out.x = a.x/d;
          out.y = a.y/d;
        }else{
          out[0] = a[0]/d;
          out[1] = a[1]/d;
        }
      }
      return out;
    };
    /**
     * @public
     * @function
     */
    _V.vecUnitSelf=function(a){
      let d=this.vecLen(a);
      if(d>EPSILON){
        if(UseOBJ){
          a.x /= d;
          a.y /= d;
        }else{
          a[0] /= d;
          a[1] /= d;
        }
      }
      return a;
    };
    /**
     * @public
     * @function
     */
    _V.vecSet=function(des,src){
      _assertArgs(des,src);
      if(UseOBJ){
        des.x=src.x;
        des.y=src.y;
      }else{
        des[0]=src[0];
        des[1]=src[1];
      }
      return des
    }
    /**
     * @public
     * @function
     */
    _V.vecClone=function(v){
      return this.vecSet(_CTOR(),v)
    };
    /**
     * @public
     * @function
     */;
    _V.vecCopy=function(des,...args){
      _.assert(args.length===2) && _assertArgs(des,des);
      if(UseOBJ){
        des.x=args[0];
        des.y=args[1];
      }else{
        des[0]=args[0];
        des[1]=args[1];
      }
      return des
    };
    /**
     * @private
     * @function
     */
    function _v2rot_arr(a,cos,sin,center,local){
      let cx=center ? center[0] : 0;
      let cy=center ? center[1] : 0;
      let x_= a[0] - cx;
      let y_= a[1] - cy;
      let x= cx + (x_*cos - y_*sin);
      let y= cy + (x_ * sin + y_ * cos);
      if(local){
        a[0] = x;
        a[1] = y;
      }else{
        a= _take(x,y);
      }
      return a;
    }
    /**
     * @private
     * @function
     */
    function _v2rot_obj(a,cos,sin,center,local){
      let cx=center ? center.x : 0;
      let cy=center ? center.y : 0;
      let x_= a.x - cx;
      let y_= a.y - cy;
      let x= cx + (x_*cos - y_*sin);
      let y= cy + (x_ * sin + y_ * cos);
      if(local){
        a.x = x;
        a.y = y;
      }else{
        a= _take(x,y);
      }
      return a;
    }
    /**
     * @public
     * @function
     */
    _V.vec2Rot=function(a,rot,center){
      _assertArgs(a, center || a);
      let c= Math.cos(rot);
      let s= Math.sin(rot);
      return UseOBJ ? _v2rot_obj(a,c,s,center) : _v2rot_arr(a,c,s,center);
    };
    /**
     * @public
     * @function
     */
    _V.vec2RotSelf=function(a,rot,center){
      _assertArgs(a, center || a);
      let c= Math.cos(rot);
      let s= Math.sin(rot);
      return UseOBJ ? _v2rot_obj(a,c,s,center,1) : _v2rot_arr(a,c,s,center,1);
    };
    /**
     * @private
     * @function
     */
    function _vecXSS_arr(p1,p2){
      if(is.vec(p1) && is.vec(p2)){
        _assertArgs(p1,p2);
        return p1[0] * p2[1] - p1[1] * p2[0]
      }
      if(is.vec(p1) && is.num(a)){
        _assertArgs(p1,p1);
        return _take(p2 * p1[1], -p2 * p1[0])
      }
      if(is.num(p1) && is.vec(p2)){
        _assertArgs(p2,p2);
        return _take( -p1 * p2[1], p1 * p2[0])
      }
    }
    /**
     * @private
     * @function
     */
    function _vecXSS_obj(p1,p2){
      if(p1 instanceof V2Obj && p2 instanceof V2Obj){
        return p1.x * p2.y - p1.y * p2.x
      }
      if(p1 instanceof V2Obj && is.num(a)){
        return _take(p2 * p1.y, -p2 * p1.x)
      }
      if(is.num(p1) && p2 instanceof V2Obj){
        return _take( -p1 * p2.y, p1 * p2.x)
      }
    }
    /**
     * @public
     * @function
     */
    _V.vec2Cross=function(p1,p2){
      return UseOBJ ? _vecXSS_obj(p1,p2) : _vecXSS_arr(p1,p2)
    };
    /**
     * Angle between these 2 vectors.
     * a.b = cos(t)*|a||b|
     * @public
     * @function
     */
    _V.vecAngle=function(a,b){
      return Math.acos(this.vecDot(a,b) / (this.vecLen(a) * this.vecLen(b)))
    };
    /**
     * Change vector to be perpendicular to what it was before, effectively
     * rotates it 90 degrees in a clockwise direction.
     * @public
     * @function
     */
    _V.perpSelf=function(a,ccw){
      _assertArgs(a,a);
      let x = UseOBJ ? a.x : a[0];
      if(UseOBJ){
        if(ccw){
          a.x=-a.y;
          a.y= x;
        }else{
          a.x=a.y;
          a.y= -x;
        }
      }else{
        if(ccw){
          a[0]=-a[1];
          a[1]= x;
        }else{
          a[0]=a[1];
          a[1]= -x;
        }
      }
      return a;
    };
    /**
     * Change vector to be perpendicular to what it was before, effectively
     * rotates it 90 degrees in a clockwise direction.
     * @public
     * @function
     */
    _V.perp=function(a,ccw){
      _assertArgs(a,a);
      if(UseOBJ){
        return ccw ? _take(-a.y,a.x) : _take(a.y,-a.x)
      }else{
        return ccw ? _take(-a[1],a[0]) : _take(a[1],-a[0])
      }
    };
    /**
     * Find scalar projection.
     * @public
     * @function
     * @returns {number}
     */
    _V.proj=function(a,b){
      return this.vecDot(a,b)/this.vecLen(b)
    };
    /**Find vector projection.
     * @public
     * @function
     */
    _V.vecProj=function(a,b){
      // (a.b')b'
      let bn = this.vecUnit(b);
      return this.vecMulSelf(bn, this.vecDot(a,bn));
      //return this.vecMul(b, this.vecDot(a,b)/this.vecLen2(b))
    };
    /**
     * Find the perpedicular vector.
     * @public
     * @function
     */
    _V.vecPerp=function(a,b){ return this.vecSub(a, this.vecProj(a,b)) };
    /**
     * Reflect a normal.
     * @public
     * @function
     */
    _V.vecReflect=function(src,normal){
      return this.vecSub(src, this.vecMul(normal, 2*this.vecDot(src,normal)))
    };
    /**
     * Negate a vector.
     * @public
     * @function
     */
    _V.vecFlip=function(v){ return this.vecMul(v, -1) };
    /**
     * @public
     * @function
     */
    _V.vecFlipSelf=function(v){ return this.vecMulSelf(v, -1) };
    /**
     * Normal of a vector.
     *
     * if v is ------------------> then
     *         |
     *         |
     *         v
     * if s=true, then
     *         ^
     *         |
     *         |
     *         -------------------->
     * @public
     * @function
     */
    _V.vecNormal=function(v,s){
      _assertArgs(v,v);
      //origin = (0,0) => x1=0,y1=0, x2= vx, y2=vy
      let x1=0;
      let y1=0;
      let dy;
      let dx;
      if(UseOBJ){
        dy= v.y - y1;
        dx= v.x - x1;
      }else{
        dy= v[1] - y1;
        dx= v[0] - x1;
      }
      return s ? _take(-dy, dx) : _take(dy, -dx)
    };
    /**
     * @public
     * @function
     */
    _V.translate=function(pos,...args){
      let a=false;
      if(args.length===1 && is.vec(args[0])){
        args=args[0];
        a=true;
      }
      return args.length===1 && !a ? this.V2(pos[0]+args[0][0],pos[1]+args[0][1])
                                   : args.map(p => this.V2(pos[0]+p[0],pos[1]+p[1]))
    };

    return (_M.Vec2=_V)
  };

})(this);



// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.

;(function(global){
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.matrix"]=function(){
    const Core= global["io.czlab.mcfud.core"]();
    const _M= global["io.czlab.mcfud.math"]();
    if(_M.Matrix){return _M.Matrix}
    const _=Core.u;
    const is=Core.is;
    const ATAN2= Math.atan2;
    const COS= Math.cos;
    const SIN= Math.sin;
    const TAN= Math.tan;
    const _X={
      V3:function(x,y,z){
        return [x||0,y||0,z||0]
      },
      vecDot:function(a,b){
        return a[0]*b[0] + a[1]*b[1] + a[2]+b[2]
      },
      vecCross:function(a,b){
        return this.V3(a.y * b.z - a.z * b.y,
                       a.z * b.x - a.x * b.z,
                       a.x * b.y - a.y * b.x)
      },
      vecLen2:function(a){
        return this.vecDot(a,a)
      },
      vecLen:function(a){
        return Math.sqrt(this.vecLen2(a))
      },
      vecUnit:function(a){
        let d=this.vecLen(a);
        let out=this.V3();
        if(d>EPSILON){
          out[0]=a[0]/d;
          out[1]=a[1]/d;
          out[2]=a[2]/d;
        }
        return out;
      },
      vecSub:function(a,b){
        return is.num(b) ? this.V3(a[0]-b, a[1]-b, a[2]-b)
                         : this.V3(a[0]-b[0], a[1]-b[1], a[2]-b[2])
      },
      vecAdd:function(a,b){
        return is.num(b) ? this.V3(a[0]+b, a[1]+b, a[2]+b)
                         : this.V3(a[0]+b[0], a[1]+b[1], a[2]+b[2])
      },
      vecMul:function(a,b){
        return is.num(b) ? this.V3(a[0]*b, a[1]*b, a[2]*b)
                         : this.V3(a[0]*b[0], a[1]*b[1], a[2]*b[2])
      },
      vecDiv:function(a,b){
        return is.num(b) ? this.V3(a[0]/b, a[1]/b, a[2]/b)
                         : this.V3(a[0]/b[0], a[1]/b[1], a[2]/b[2])
      }
    };
    /**
     * @private
     * @function
     */
    function _arrayEq(a1,a2){
      //2 numeric arrays are equal?
      for(let i=0;i<a1.length;++i){
        if(!_M.fuzzyEq(a1[i],a2[i]))
          return false;
      }
      return true
    }
    /**
     * @private
     * @function
     */
    function _odd(n){ return n%2 !== 0 }
    /**
     * Index where matrix is mapped to 1D array.
     * @private
     * @function
     */
    function _cell(rows,cols,r,c){
      return (c-1) + ((r-1)*cols)
    }
    /**
     * @private
     * @function
     */
    function _matnew(rows,cols,cells){
      return {dim: [rows,cols], cells: cells}
    }
    /**
     * @private
     * @function
     */
    function _new_mat(rows,cols){
      return _matnew(rows,cols, _.fill(new Array(rows*cols),0))
    }
    /**
     * @public
     * @function
     */
    _X.matrix=function([rows,cols],...args){
      let sz= rows*cols;
      return args.length===0 ? _new_mat(rows,cols)
                             : _.assert(sz===args.length) && _matnew(rows,cols,args)
    };
    /**
     * @public
     * @function
     */
    _X.matIdentity=function(sz){
      let out=_.fill(new Array(sz*sz),0);
      for(let i=0;i<sz;++i)
        out[_cell(sz,sz,i+1,i+1)] = 1;
      return _matnew(sz, sz, out)
    };
    /**
     * Matrix with zeroes.
     * @public
     * @function
     */
    _X.matZero=function(sz){
      return _.assert(sz>0) &&
             _matnew(sz,sz,_.fill(new Array(sz*sz),0))
    };
    /**
     * A 2x2 matrix.
     * @public
     * @function
     */
    _X.mat2=function(_11,_12,_21,_22){
      return this.matrix([2,2], _11,_12,_21,_22)
    };
    /**
     * A 3x3 matrix.
     * @public
     * @function
     */
    _X.mat3=function(_11,_12,_13,_21,_22,_23,_31,_32,_33){
      return this.matrix([3,3], _11,_12,_13,_21,_22,_23,_31,_32,_33)
    };
    /**
     * A 4x4 matrix.
     * @public
     * @function
     */
    _X.mat4=function(_11,_12,_13,_14,_21,_22,_23,_24,
                     _31,_32,_33,_34, _41,_42,_43,_44){
      return this.matrix([4,4],
                         _11,_12,_13,_14,_21,_22,_23,_24,
                         _31,_32,_33,_34,_41,_42,_43,_44)
    };
    /**
     * Matrices are equals.
     * @public
     * @function
     */
    _X.matEq=function(a,b){
      return a.dim[0]===b.dim[0] &&
             a.dim[1]===b.dim[1] ? _arrayEq(a.cells,b.cells) : false
    };
    /**
     * Matrices are different.
     * @public
     * @function
     */
    _X.matNeq=function(a,b){ return !this.matEq(a,b) };
    /**
     * Transpose a matrix.
     * @function
     * @public
     */
    _X.matXpose=function(m){
      let [rows,cols]= m.dim;
      let sz=rows*cols;
      let tmp=[];
      for(let i=0;i<sz;++i)
        tmp.push(m.cells[(i/rows) + cols*(i%rows)]);
      return _matnew(cols,rows,tmp)
    };
    /**
     * Inverse a 3x3 matrix - fast.
     * @public
     * @function
     */
    _X.mat3FastInverse=function(m){
      return _.assert(m.dim[0]===3 && m.dim[1]===3) && this.matXpose(m)
    };
    /**
     * Inverse a 4x4 matrx - fast.
     * @public
     * @function
     */
    _X.mat4FastInverse=function(m){
      _assert(m.dim[0]===4&&m.dim[1]===4);
      let out=this.matXpose(m);
      let [rows,cols] =m.dim;
      let p=_.partition(cols,m.cells);
      let m1=p[0],m2=p[1],m3=p[2],m4=p[3];
      let right=m1.slice(0,3);
      let up=m2.slice(0,3);
      let forward=m3.slice(0,3);
      let position=m4.slice(0,3);
      m.cells[_cell(4,4,1,4)]= 0;
      m.cells[_cell(4,4,2,4)]= 0;
      m.cells[_cell(4,4,3,4)]=0;
      m.cells[_cell(4,4,4,1)]= - this.vecDot(right,position);
      m.cells[_cell(4,4,4,2)]= - this.vecDot(up,position);
      m.cells[_cell(4,4,4,3)]= - this.vecDot(forward,position);
      return out;
    };
    /**
     * Scalar multiply a matrix.
     * @public
     * @function
     */
    _X.matScale=function(m,n){
      return _matnew(m.dim[0],m.dim[1],m.cells.map(x => x*n))
    };
    /**
     * Multiply 2 matrices.
     * @public
     * @function
     */
    _X.matMult=function(a,b){
      let [aRows,aCols]=a.dim;
      let [bRows,bCols]=b.dim;
      let aCells=a.cells;
      let bCells=b.cells;
      _.assert(aCols===bRows, "mismatch matrices");
      let out=new Array(aRows*bCols);
      for(let i=0; i<aRows; ++i)
        for(let j=0; j<bCols; ++j){
          out[j+i*bCols]=
            _.range(bRows).reduce((acc,k) => {
              return acc + aCells[k+i*aCols] * bCells[j+ k*bCols] },0);
        }
      return _matnew(aRows,bCols,out)
    };
    /** Determinent.
     *
     * @public
     * @function
     */
    _X.matDet=function(m){
      let [rows,cols]=m.dim;
      let tmp=[];
      for(let c=0; c< cols;++c)
        _.conj(tmp,this.matDet(this.matCut(m,1,c+1)));
      return _.range(cols).reduce((acc,j) => {
        let v=tmp[j];
        return acc + m.cells[j] * (_odd(j) ? -v : v)
      },0)
    };
    /**
     * Matrix determinent.
     * @public
     * @function
     */
    _X.matDet2x2=function(m){
      _.assert(m.cells.length===4);
      return m.cells[0]*m.cells[3] - m.cells[1] * m.cells[2]
    };
    /**
     * Extract a portion of a matrix.
     * Get rid of a row and col.
     * @public
     * @function
     */
    _X.matCut=function(m,row,col){
      let [rows,cols]=m.dim;
      //change to zero indexed
      let _row = row-1;
      let _col= col-1;
      let tmp=[];
      for(let i=0; i<rows; ++i)
        for(let j=0; j<cols; ++j){
          if(!(i === _row || j === _col))
            _.conj(tmp, m.cells[j+i*cols]);
        }
      return _matnew(rows-1,cols-1, tmp)
    };
    /**
     * Matrix minor.
     * @public
     * @function
     */
    _X.matMinor=function(m){
      let [rows,cols]=m.dim;
      let tmp=[];
      for(let i=0; i< rows;++i)
        for(let j=0; j<cols; ++j){
          //mat-cut is 1-indexed
          _.conj(tmp,this.matDet(this.matCut(m,i+1,j+1)));
        }
      return _matnew(rows,cols,tmp)
    };
    /**
     * @public
     * @function
     */
    _X.matMinor2x2=function(m){
      return _.assert(m.cells.length===4) &&
             this.mat2(m.cells[3],m.cells[2],m.cells[1],m.cells[0])
    };
    /**
     * Matrix co-factor.
     * @public
     * @function
     */
    _X.matCofactor=function(m){
      let minor=this.matMinor(m);
      let [rows,cols]=minor.dim;
      let tmp=m.cells.slice();
      for(let len=rows*cols,i=0; i< len; ++i){
        if(_odd(i))
          tmp[i]= -tmp[i];
      }
      return _matnew(rows,cols,tmp)
    };
    /**
     * Matrix adjugate.
     * @public
     * @function
     */
    _X.matAdjugate=function(m){
      return this.matXpose(this.matCofactor(m))
    };
    /**
     * Inverse matrix.
     * @public
     * @function
     */
    _X.matInverse2x2=function(m){
      let [rows,cols]=m.dim;
      _.assert(m.cells.length===4&&rows===2&&cols===2);
      let r,c=m.cells;
      let det= c[0]*c[3] - c[1]*c[2];
      if(_M.fuzzyZero(det))
        r=this.matIdentity(rows);
      else{
        let _det= 1/det;
        r= this.mat2(c[3]*_det, -c[1] * _det,
                     -c[2] * _det, c[0] * _det);
      }
      return r
    };
    /**
     * @function
     * @public
     */
    _X.matInverse=function(m){
      let [rows,cols]=m.dim;
      let d= this.matDet(m);
      return _M.fuzzyZero(d) ? this.matIdentity(rows)
                             : this.matScale(this.matAdjugate(m), 1/d)
    };
    /**
     * Matrix from column major.
     * @function
     * @public
     */
    _X.matFromColMajor=function(m){
      return this.matXpose(m)
    };
    /**
     * Matrix to column major.
     * @public
     * @function
     */
    _X.matToColMajor=function(m){
      return this.matXpose(m)
    };
    /**
     * Translate a 3x3 matrix.
     * @public
     * @function
     */
    _X.mat4Txlate=function(v3){
      let out= _.assert(v3.length===3) && this.matIdentity(4);
      out.cells[_cell(4,4,4,1)]= v3[0];
      out.cells[_cell(4,4,4,2)]= v3[1];
      out.cells[_cell(4,4,4,3)]= v3[2];
      return out
    };
    /**
     * Matrix from matrix-translation.
     *
     * @public
     * @function
     * @param m a 3x3 matrix
     * @returns 4x4 matrix
     */
    _X.matFromMX_3x3=function(m){
      _.assert(m.cells.length===9);
      let [rows,cols]=m.dim;
      let p=_.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2];
      return _matnew(rows+1,cols+1, r1.concat(0, r2, 0, r3, 0, [0,0,0,1]))
    };
    /**
     * Get the translation of a matrix.
     * @public
     * @function
     * @param m 4x4 matrix
     * @returns 3d vector
     */
    _X.getTranslation4x4=function(m){
      _.assert(m.cells.length===16);
      let c=m.cells;
      return this.V3(c[_cell(4,4,4,1)], c[_cell(4,4,4,2)], c[_cell(4,4,4,3)])
    };
    /**
     * Matrix from vector-translation.
     * @public
     * @function
     * @param v3 3d vector
     * @returns 4x4 matrix
     */
    _X.matFromVX_V3=function(v3){
      _.assert(v3.length===3);
      let out=this.matIdentity(4);
      let c=out.cells;
      c[_cell(4,4,1,1)]= v3[0];
      c[_cell(4,4,2,2)]= v3[1];
      c[_cell(4,4,3,3)]= v3[2];
      return out
    };
    /**
     * Get scale from matrix-translation.
     * @public
     * @function
     * @param m4 4x4 matrix
     * @returns 3d vector
     */
    _X.getScaleFromMX_4x4=function(m4){
      _.assert(m4.cells.length===16);
      let [rows,cols]=m4.dim;
      let p= _.partition(cols,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2];
      return this.V3(r1[0], r2[1], r3[2])
    };
    /**
     * Multiply matrix and  vector.
     * @public
     * @function
     * @returns vector
     */
    _X.matVMult=function(m,v){
      let cols=m.dim[1];
      let rows=v.length;
      _.assert(cols===rows);
      let r= this.matMult(m, _matnew(rows, 1, v));
      let c=r.cells;
      r.cells=null;
      return c
    };
    /**
     * Rotate a 2x2 matrix, counter-clockwise
     * @function
     * @public
     */
    _X.rotation2x2=function(rot){
      return this.mat2(COS(rot),-SIN(rot),SIN(rot),COS(rot))
    };
    /**
     * 3D rotation.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.yawPitchRoll=function(yaw,pitch,roll){
      return this.mat4(COS(roll) * COS(yaw) +
                       SIN(roll)*SIN(pitch)*SIN(yaw),
                       SIN(roll)*COS(pitch),
                       COS(roll)* -SIN(yaw) +
                       SIN(roll)*SIN(pitch)*COS(yaw),
                       0,
                       -SIN(roll)*COS(yaw) +
                       COS(roll)*SIN(pitch)*SIN(yaw),
                       COS(roll)*COS(pitch),
                       SIN(roll)*SIN(yaw) +
                       COS(roll)*SIN(pitch)*COS(yaw),
                       0,
                       COS(pitch)*SIN(yaw),
                       -SIN(pitch),
                       COS(pitch)*COS(yaw),
                       0,
                       0,0,0,1)
    };
    /**
     * Rotate on x-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.xRotation=function(rad){
      return this.mat4(1,0,0,0,
                       0,COS(rad),SIN(rad),0,
                       0,-SIN(rad),COS(rad),0,
                       0,0,0,1)
    };
    /**
     * Rotate on x-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _X.xRotation3x3=function(rad){
      return this.mat3(1,0,0,
                       0, COS(rad), SIN(rad),
                       0, -SIN(rad), COS(rad))
    };
    /**
     * Rotate on y-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.yRotation=function(rad){
      return this.mat4(COS(rad),0,-SIN(rad),0,
                       0,1, 0, 0,
                       SIN(rad), 0, COS(rad), 0,
                       0,0,0,1)
    };
    /**
     * Rotate on y-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _X.yRotation3x3=function(rad){
      return this.mat3(COS(rad), 0, -SIN(rad),
                       0, 1, 0,
                       SIN(rad), 0, COS(rad))
    };
    /**
     * Rotate in z-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.zRotation=function(rad){
      return this.mat4(COS(rad), SIN(rad), 0, 0,
                       -SIN(rad),COS(rad), 0, 0,
                       0, 0, 1, 0,
                       0, 0, 0, 1)
    };
    /**
     * Rotate in z-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _X.zRotation3x3=function(rad){
      return this.mat3(COS(rad),SIN(rad), 0,
                       -SIN(rad),COS(rad), 0,
                       0, 0, 1)
    };
    /**
     * Rotation in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.mat4Rotation=function(pitch,yaw,roll){
      return this.matMult(
               this.matMult(this.zRotation(roll),
                            this.xRotation(pitch)), this.yRotation(yaw))
    };
    /**
     * Rotation in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _X.mat3Rotation=function(pitch,yaw,roll){
      return this.matMult(
               this.matMult(this.zRotation3x3(roll),
                            this.xRotation3x3(pitch)),this.yRotation3x3(yaw))
    };
    /**
     * Orthogonal of matrix.
     * @public
     * @function
     * @param m 4x4 matrix
     * @returns 4x4 matrix
     */
    _X.matOrthogonal4x4=function(m){
      _.assert(m.cells.length===16);
      let [rows,cols]=m.dim;
      let p= _.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2], r4=p[3];
      let xAxis=r1.slice(0,3);
      let yAxis=r2.slice(0,3);
      let zAxis= this.vecCross(xAxis,yAxis);
      let _x= this.vecCross(yAxis,zAxis);
      let _y= this.vecCross(zAxis,xAxis);
      let _z= this.vecCross(xAxis,yAxis);
      return this.mat4(_x[0],_x[1],_x[2],r1[3],
                       _y[0],_y[1],_y[2],r2[3],
                       _z[0],_z[1],_z[2],r3[3],
                       r4[0],r4[1],r4[2],r4[3])
    };
    /**
     * @public
     * @function
     * @param m 3x3 matrix
     * @returns 3x3 matrix
     */
    _X.matOrthogonal3x3=function(m){
      _.assert(m.cells.length===9);
      let [rows,cols]=m.dim;
      let p= _.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2];
      let xAxis=r1;//this.V3(r1[0],r1[1],r1[2]);
      let yAxis=r2;//this.V3(r2[0],r2[1],r2[2]);
      let zAxis= this.vecCross(xAxis,yAxis);
      let _x= this.vecCross(yAxis,zAxis);
      let _y= this.vecCross(zAxis,xAxis);
      let _z= this.vecCross(xAxis,yAxis);
      return this.mat3(_x[0],_x[1],_x[2],
                       _y[0],_y[1],_y[2],
                       _z[0],_z[1],_z[2])
    };
    /**
     * Rotate on this axis by this angle in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.mat4AxisAngle=function(axis ,rad){
      _.assert(axis.length===3);
      let x=axis[0],y=axis[1],z=axis[2];
      let d= this.vecLen(axis);
      let c=COS(rad);
      let s=SIN(rad);
      let t= 1-c;
      if(!_M.fuzzyEq(d,1)){
        let ilen= 1/d;
        x *= ilen;
        y *= ilen;
        z *= ilen;
      }
      return this.mat4(c+t*x*x,
                       t*x*y+s*z,
                       t*x*z-s*y,
                       0,
                       t*x*y-s*z,
                       c + t*y*y,
                       t*y*z+s*x,
                       0,
                       t*x*z+s*y,
                       t*y*z-s*x,
                       c + t*z*z,
                       0,
                       0,0,0,1)
    };
    /**
     * Rotate on this axis by this angle in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _X.axisAngle3x3=function(axis,rad){
      _.assert(axis.length===3);
      let x=axis[0],y=axis[1],z=axis[2];
      let c=COS(rad);
      let s=SIN(rad);
      let t= 1-c;
      let d= this.vecLen(axis);
      if(!_M.fuzzyEq(d,1)){
        let ilen=1/d;
        x *= ilen;
        y *= ilen;
        z *= ilen;
      }
      return this.mat3(c + t*x*x,
                       t*x*y + s*z,
                       t*x*z - s*y,
                       t*x*y - s*z,
                       c + t*y*y,
                       t*y*z + s*x,
                       t*x*z + s*y,
                       t*y*z - s*x,
                       c + t*z*z)
    };
    /**
     * Multiply vector and 4x4 matrix.
     * @function
     * @public
     * @returns 3d vector
     */
    _X.matMultV3M4=function(v3,m4){
      _.assert(v3.length===3&&m4.cells.length===16);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(4,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2],r4=p[3];
      return this.V3(x*r1[0] + y*r2[0] + z*r3[0] + 1*r4[0],
                     x*r1[1] + y*r2[1] + z*r3[1] + 1*r4[1],
                     x*r1[2] + y*r2[2] + z*r3[2] + 1*r4[2])
    };
    /**
     * Multiply vector and 4x4 matrix.
     * @public
     * @function
     * @returns 3d vector
     */
    _X.mat3MultVX_4x4=function(v3,m4){
      _.assert(v3.length===3&&m4.cells.length===16);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(4,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2],r4=p[3];
      return [x*r1[0] + y*r2[0] + z*r3[0] + 0*r4[0],
              x*r1[1] + y*r2[1] + z*r3[1] + 0*r4[1],
              x*r1[2] + y*r2[2] + z*r3[2] + 0*r4[2]]
    };
    /**
     * Multiply vector and 3x3 matrix.
     * * @public
     * @function
     * @returns 3d vector
     */
    _X.mat3MultVX_3x3=function(v3,m3){
      _.assert(v3.length===3&&m3.cells.length===9);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(3,m3.cells);
      let r1=p[0],r2=p[1],r3=p[2];
      return [this.vecDot(v3, this.V3(r1[0],r2[0],r3[0])),
              this.vecDot(v3, this.V3(r1[1],r2[1],r3[1])),
              this.vecDot(v3, this.V3(r1[2],r2[2],r3[2]))]
    };
    /**
     * Transform a 4x4 matrix.
     * @public
     * @function
     * @param eulerRotation 3d vector
     * @returns 4x4 matrix
     */
    _X.mat4TxformViaRotation=function(scale,eulerRotation,translate){
      _.assert(eulerRotation.length===3);
      let x=eulerRotation[0];
      let y=eulerRotation[1];
      let z=eulerRotation[2];
      return this.matMult(
        this.matMult(this.matFromVX(scale),
                     this.mat4Rotation(x,y,z)),
        this.mat4Txlate(translate))
    };
    /**
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.mat4TxformViaAxisAngle=function(scale,rotationAxis, rotationAngle,translate){
      return this.matMult(
        this.matMult(this.matFromVX(scale),
                     this.mat4AxisAngle(rotationAxis,
                                        rotationAngle)),
        this.mat4Txlate(translate))
    };
    /**
     * View of a 4D matrix.
     * @public
     * @function
     */
    _X.mat4LookAt=function(pos,target,up){
      let fwd= this.vecUnit(this.vecSub(target,pos));
      let right= this.vecUnit(this.vecCross(up,fwd));
      let newUp= this.vecCross(fwd,right);
      return this.mat4(right[0],newUp[0],fwd[0],0,
                       right[1],newUp[1],fwd[1],0,
                       right[2],newUp[2],fwd[2],0,
                       - this.vecDot(right,pos),
                       - this.vecDot(newUp,pos),
                       - this.vecDot(fwd,pos), 1)
    };
    /**
     * 4D projection.
     * https://msdn.microsoft.com/en-us/library/windows/desktop/bb147302(v=vs.85).aspx
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.mat4Proj=function(fov,aspect,zNear,zFar){
      let tanHalfFov= TAN(fov*0.5);
      let fovY=1/tanHalfFov;//cot(fov/2)
      let fovX=fovY/aspect; //cot(fov/2) / aspect
      let r33= zFar / (zFar - zNear);// far/range
      let ret= this.matIdentity(4);
      ret.cells[_cell(4,4,1,1)]= fovX;
      ret.cells[_cell(4,4,2,2)]=fovY;
      ret.cells[_cell(4,4,3,3)]= r33;
      ret.cells[_cell(4,4,3,4)]= 1;
      ret.cells[_cell(4,4,4,3)]= -zNear*r33; //-near * (far / range)
      ret.cells[_cell(4,4,4,4)]=0;
      return ret
    };
    /**
     * Orthogonal to this 4x4 matrix.
     * Derived following: http://www.songho.ca/opengl/gl_projectionmatrix.html
     * Above was wrong, it was OpenGL style, our matrices are DX style
     * Correct impl:
     * https://msdn.microsoft.com/en-us/library/windows/desktop/bb205347(v=vs.85).aspx
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _X.mat4Ortho=function(left,right,bottom,top,zNear,zFar){
      let _11= (right-left)/2;
      let _22= (top-bottom)/2;
      let _33= (zFar-zNear)/1;
      let _41= (left+right)/(left-right);
      let _42= (top+bottom)/(bottom-top);
      let _43= zNear/(zNear-zFar);
      return this.mat4(_11,0,0,0,
                       0,_22,0, 0,
                       0, 0, _33, 0,
                       _41, _42, _43, 1)
    };
    /**
     * Decompose matrix.
     * @public
     * @function
     * @param rot1 3x3 matrix
     * @returns 3d vector
     */
    _X.matDecompose3x3=function(rot1){
      let rot= this.matXpose(rot1);
      let p= _.partition(3, rot);
      let r1=p[0],r2=p[1],r3=p[2];
      let sy= Math.sqrt(r1[0]*r1[0] + r2[0]*r2[0]);
      let singular= sy< 1e-6;
      return !singular ? this.V3(ATAN2(r3[1],r3[2]),
                                 ATAN2(-r3[0],sy),
                                 ATAN2(r2[0],r1[0]))
                       : this.V3(ATAN2(-r2[2],r2[1]), ATAN2(-r3[0],sy), 0)
    };

    return (_M.Matrix=_X)
  };

})(this);



// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2013-2020, Kenneth Leung. All rights reserved.

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
  let _singleton=null;
  const VISCHS=" @N/\\Ri2}aP`(xeT4F3mt;8~%r0v:L5$+Z{'V)\"CKIc>z.*"+
               "fJEwSU7juYg<klO&1?[h9=n,yoQGsW]BMHpXb6A|D#q^_d!-";
  const VISCHS_LEN=VISCHS.length;
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.crypt"]=function(){
    const Core=global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const _C={};
    /**
     * Find the offset.
     * @private
     * @function
     */
    function _calcDelta(shift){
      return Math.abs(shift) % VISCHS_LEN
    }
    /**
     * Get the char at the index.
     * @private
     * @function
     */
    function _charat(pos,string_){
      return (string_ || VISCHS).charAt(pos)
    }
    /**
     * Index for this char.
     * @private
     * @function
     */
    function _getch(ch){
      for(let i=0;i<VISCHS_LEN;++i){
        if(charat(i)===ch)
          return i;
      }
      return -1
    }
    /**
     * Rotate right.
     * @private
     * @function
     */
    function _rotr(delta, cpos){
      let pos= cpos+delta;
      return _charat(pos >= VISCHS_LEN ? (pos-VISCHS_LEN) : pos)
    }
    /**
     * Rotate left.
     * @private
     * @function
     */
    function _rotl(delta, cpos){
      let pos= cpos-delta;
      return _charat(pos< 0 ? (VISCHS_LEN+pos) : pos)
    }
    /**
     * Encrypt source by shifts.
     * @public
     * @function
     */
    _C.encrypt=function(src, shift){
      if(shift===0){ return src }
      function _f(shift,delta,cpos){
        return shift<0 ? _rotr(delta,cpos) : _rotl(delta,cpos)
      }
      let out=[];
      let d=_calcDelta(shift);
      src.split().forEach(c => {
        let p=_getch(c);
        out.push(p<0 ? c : _f(shift,d,p));
      })
      return out.join("")
    };
    /**
     * Decrypt text by shifts.
     * @public
     * @function
     */
    _C.decrypt=function(cipherText,shift){
      if(shift===0){ return cipherText }
      function _f(shift,delta,cpos) {
        return shift< 0 ? _rotl(delta,cpos) : _rotr(delta,cpos)
      }
      let p,out=[];
      let d= _calcDelta(shift);
      cipherText.split("").forEach(c => {
        p= _getch(c);
        out.push(p<0 ? c : _f(shift,d,p));
      });
      return out.join("")
    };

    return _singleton= _C;
  };

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.

;(function(global){
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  let _singleton=null;
  global["io.czlab.mcfud.gfx"]=function(){
    if(_singleton){ return _singleton }
    const Core=global["io.czlab.mcfud.core"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _=Core.u;
    const _G={};
    const TWO_PI=Math.PI*2;
    /**
     * Html5 Text Style object.
     * @public
     * @function
     */
    _G.textStyle=function(font,fill,align,base){
      //"14px 'Arial'" "#dddddd" "left" "top"
      return {font: font, fill: fill, align: align, base: base}
    };
    /**
     * Draw the shape onto the html5 canvas.
     * @public
     * @function
     */
    _G.drawShape=function(ctx,s,...args){
      if(s.draw)
        s.draw(ctx,...args)
    };
    /**
     * Apply styles to the canvas.
     * @public
     * @function
     */
    _G.cfgStyle=function(ctx,styleObj){
      if(styleObj){
        let line=styleObj.line;
        let stroke=styleObj.stroke;
        if(line){
          if(line.cap)
            ctx.lineCap=line.cap;
          if(line.width)
            ctx.lineWidth=line.width;
        }
        if(stroke){
          if(stroke.style)
            ctx.strokeStyle=stroke.style;
        }
      }
    };
    /**
     * Draw and connect this set of points onto the canvas.
     * @public
     * @function
     */
    _G.drawPoints=function(ctx,points,size){
      if(size === undefined) size=points.length;
      ctx.beginPath();
      for(let i=0;i<size;++i){
        let i2= (i+1)%size;
        let p=points[i];
        let q=points[i2];
        ctx.moveTo(p[0],p[1]);
        ctx.lineTo(q[0],q[1]);
      }
      ctx.stroke();
    };
    /**
     * @public
     * @function
     */
    _G.drawShapePoly=function(ctx,poly){
      return this.drawPoints(ctx,poly.points);
    };
    /**
     * Draw a circle onto the canvas.  If a starting point
     * is provided, draw a line to the center.
     * @public
     * @function
     */
    _G.drawCircle=function(ctx,x,y,radius){
      ctx.beginPath();
      ctx.arc(x,y,radius,0,TWO_PI,true);
      ctx.closePath();
      ctx.stroke();
    };
    /**
     * @public
     * @function
     */
    _G.drawShapeCircle=function(ctx,circle){
      this.drawCircle(ctx,circle.pos[0],circle.pos[1],circle.radius);
    };
    /**
     * @public
     * @function
     */
    _G.drawRect=function(ctx,x,y,width,height,rot){
      let left=x;
      let top= y - height;
      ctx.save();
      ctx.translate(left,top);
      ctx.rotate(rot);
      ctx.strokeRect(0,0,width,height);
      ctx.restore();
    };
    /**
     * @public
     * @function
     */
    _G.drawShapeRect=function(ctx,rect){
      return this.drawRet(ctx,rect.pos[0],rect.pos[1],
                          rect.width,rect.height,rect.rotation);
    };
    /**
     * @public
     * @function
     */
    _G.drawLine=function(ctx,x1,y1,x2,y2){
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.stroke();
      //ctx.closePath();
    };
    /**
     * @public
     * @function
     */
    _G.drawShapeLine=function(ctx,line){
      return this.drawLine(ctx,line.p[0],line.p[1],line.q[0],line.q[1]);
    };
    /**
     * @public
     * @class
     */
    class TXMatrix2d{
      constructor(source){
        if(source){
          this.m = [];
          this.clone(source);
        }else{
          this.m = [1,0,0,0,1,0];
        }
      }
      identity(){
        let m = this.m;
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        return this;
      }
      clone(matrix){
        let d = this.m, s = matrix.m;
        d[0]=s[0]; d[1]=s[1]; d[2] = s[2];
        d[3]=s[3]; d[4]=s[4]; d[5] = s[5];
        return this;
      }
      multiply(matrix){
        let a = this.m, b = matrix.m;
        let m11 = a[0]*b[0] + a[1]*b[3];
        let m12 = a[0]*b[1] + a[1]*b[4];
        let m13 = a[0]*b[2] + a[1]*b[5] + a[2];
        let m21 = a[3]*b[0] + a[4]*b[3];
        let m22 = a[3]*b[1] + a[4]*b[4];
        let m23 = a[3]*b[2] + a[4]*b[5] + a[5];

        a[0]=m11; a[1]=m12; a[2] = m13;
        a[3]=m21; a[4]=m22; a[5] = m23;
        return this;
      }
      rotate(radians){
        if(radians === 0){ return this; }
        let cos = Math.cos(radians),
            sin = Math.sin(radians),
            m = this.m;

        let m11 = m[0]*cos  + m[1]*sin;
        let m12 = m[0]*-sin + m[1]*cos;
        let m21 = m[3]*cos  + m[4]*sin;
        let m22 = m[3]*-sin + m[4]*cos;

        m[0] = m11; m[1] = m12; // m[2] == m[2]
        m[3] = m21; m[4] = m22; // m[5] == m[5]
        return this;
      }
      rotateDeg(degrees){
        if(degrees === 0){ return this }
        return this.rotate(Math.PI * degrees / 180);
      }
      scale(sx,sy){
        let m = this.m;
        if(sy === undefined){ sy = sx; }
        m[0] *= sx;
        m[1] *= sy;
        m[3] *= sx;
        m[4] *= sy;
        return this;
      }
      translate(tx,ty){
        let m = this.m;
        m[2] += m[0]*tx + m[1]*ty;
        m[5] += m[3]*tx + m[4]*ty;
        return this;
      }
      transform(x,y){
        return [ x * this.m[0] + y * this.m[1] + this.m[2],
                 x * this.m[3] + y * this.m[4] + this.m[5] ];
      }
      transformPoint(obj){
        let x = obj.x, y = obj.y;
        obj.x = x * this.m[0] + y * this.m[1] + this.m[2];
        obj.y = x * this.m[3] + y * this.m[4] + this.m[5];
        return obj;
      }
      transformArray(inArr,outArr){
        let x = inArr[0], y = inArr[1];
        outArr[0] = x * this.m[0] + y * this.m[1] + this.m[2];
        outArr[1] = x * this.m[3] + y * this.m[4] + this.m[5];
        return outArr;
      }
      transformX(x,y){
        return x * this.m[0] + y * this.m[1] + this.m[2];
      }
      transformY(x,y){
        return x * this.m[3] + y * this.m[4] + this.m[5];
      }
      setContextTransform(ctx){
        let m = this.m;
        // source:
        //  m[0] m[1] m[2]
        //  m[3] m[4] m[5]
        //  0     0   1
        //
        // destination:
        //  m11  m21  dx
        //  m12  m22  dy
        //  0    0    1
        //  setTransform(m11, m12, m21, m22, dx, dy)
        ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);
      }
    }

    return (_singleton= _.inject(_G, {TXMatrix2d: TXMatrix2d}))
  };

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.
;
(function(global){
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  let _singleton=null;
  global["io.czlab.mcfud.geo2d"]=function(){
    if(_singleton) { return _singleton }
    const Core=global["io.czlab.mcfud.core"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    const _=Core.u;
    const _G={};
    const MaxPolyVertexCount=64;
    const LEFT_VORONOI= -1;
    const MID_VORONOI= 0;
    const RIGHT_VORONOI= 1;
    /**
     * @public
     * @class
     */
    class Box4{
      constructor(left,bottom,right,top){
        this.left=left;
        this.right=right;
        this.top=top;
        this.bottom=bottom;
      }
    }
    /**
     * @public
     * @class
     */
    class Rect{
      constructor(x,y,width,height){
        if(arguments.length===2){
          this.width=x;
          this.height=y;
          this.pos= _V.V2();
        }else{
          this.pos=_V.V2(x,y);
          this.width=width;
          this.height=height;
        }
      }
    }
    /**
     * @public
     * @class
     */
    class Area{
      constructor(w,h){
        this.width=w;
        this.height=h;
      }
      half(){
        return new Area(this.width/2,this.height/2)
      }
    }
    /**
     * Calculate the area of this polygon.
     * @private
     * @function
     */
    _G.polyArea=function(points){
      let area=0;
      for(let p,q,i2,len=points.length,i=0;i<len;++i){
        i2= (i+1)%len;
        p=poly.points[i];
        q=poly.points[i2];
        area += (p[0]*q[1] - q[0]*p[1]);
      }
      return Math.abs(area)/2
    }
    /**
     * Find the center point of this polygon.
     * @public
     * @function
     */
    _G.calcPolyCenter=function(points){
      let A= 6*this.polyArea(points);
      let cx=0;
      let cy=0;
      for(let p,q,i2,i=0,len=points.length;i<len;++i){
        i2= (i+1)%len;
        p=points[i];
        q=points[i2];
        cx += (p[0]+q[0]) * (p[0]*q[1]-q[0]*p[1]);
        cy += (p[1]+q[1]) * (p[0]*q[1]-q[0]*p[1]);
      }
      return _V.V2(cx/A, cy/A)
    };
    /**
     * Lifted from Randy Gaul's impulse-engine:
     * https://github.com/RandyGaul/ImpulseEngine#Shape.h
     * @private
     * @function
     */
    function _orderPoints(vertices){
      let count=vertices.length;
      _.assert(count > 2 && count <= MaxPolyVertexCount); // at least 3
      //find the right most point
      let rightMost=0;
      let highestX= vertices[0][0];
      for(let x,i=1; i<count; ++i){
        x=vertices[i][0];
        if(x > highestX){
          highestX= x;
          rightMost= i;
        }
        // if same x then take farthest negative y
        else if(_M.fuzzyEq(x, highestX)){
          if(vertices[i][1] < vertices[rightMost][1]) rightMost = i;
        }
      }
      let hull=new Array(MaxPolyVertexCount);
      let outCount = 0;
      let indexHull = rightMost;
      for(;;){
        hull[outCount] = indexHull;
        // search for next index that wraps around the hull
        // by computing cross products to find the most counter-clockwise
        // vertex in the set, given the previos hull index
        let nextHullIndex = 0;
        for(let i=1; i<count; ++i){
          // skip if same coordinate as we need three unique
          // points in the set to perform a cross product
          if(nextHullIndex === indexHull){
            nextHullIndex = i;
            continue;
          }
          // cross every set of three unique vertices
          // record each counter clockwise third vertex and add
          // to the output hull
          // see : http://www.oocities.org/pcgpe/math2d.html
          let e1 = _V.vecSub(vertices[nextHullIndex], vertices[hull[outCount]]);
          let e2 = _V.vecSub(vertices[i], vertices[hull[outCount]]);
          let c = _V.vec2Cross(e1,e2);
          if(c < 0.0)
            nextHullIndex = i;
          // cross product is zero then e vectors are on same line
          // therefor want to record vertex farthest along that line
          if(_M.fuzzyZero(c) && _V.vecLen2(e2) > _V.vecLen2(e1))
            nextHullIndex = i;
        }
        ++outCount;
        indexHull = nextHullIndex;
        // conclude algorithm upon wrap-around
        if(nextHullIndex === rightMost){
          break;
        }
      }
      const result=[];
      for(let i=0; i<outCount; ++i)
        result.push(_V.vecClone(vertices[hull[i]]));
      return result;
    }
    /**
     * @public
     * @class
     */
    class Line{
      constructor(x1,y1,x2,y2){
        this.p= _V.V2(x1,y1);
        this.q= _V.V2(x2,y2);
      }
    }
    /**
     * @public
     * @class
     */
    class Circle{
      constructor(r){
        this.radius=r;
        this.orient=0;
        this.pos=_V.V2();
      }
      setOrient(r){
        this.orient=r;
        return this;
      }
      setPos(x,y){
        _V.vecCopy(this.pos,x,y);
        return this;
      }
    }
    /**
     * Points are specified in COUNTER-CLOCKWISE order
     * @public
     * @class
     */
    class Polygon{
      constructor(x,y){
        this.orient = 0;
        this.pos=_V.V2();
        this.setPos(x,y);
      }
      setPos(x,y){
        _V.vecCopy(this.pos,x||0,y||0);
        return this;
      }
      set(points){
        points= _orderPoints(points);
        if(this.calcPoints) this.calcPoints.length=0; else this.calcPoints = [];
        if(this.normals) this.normals.length=0; else this.normals = [];
        if(this.edges) this.edges.length=0; else this.edges = [];
        for(let i=0; i < points.length; ++i){
          this.calcPoints.push(_V.V2());
          this.edges.push(_V.V2());
          this.normals.push(_V.V2());
        }
        this.points = points;
        this._recalc();
        return this;
      }
      setOrient(rot){
        this.orient = rot;
        this._recalc();
        return this;
      }
      translate(x, y){
        if(this.points){
          for(let i=0; i < this.points.length; ++i){
            this.points[i][0] += x;
            this.points[i][1] += y;
          }
          this._recalc();
        }
        return this;
      }
      _recalc(){
        if(this.points){
          for(let i=0; i < this.points.length; ++i){
            _V.vecSet(this.calcPoints[i],this.points[i]);
            if(!_M.fuzzyZero(this.orient))
              _V.vec2RotSelf(this.calcPoints[i],this.orient);
          }
          for(let i2,p1,p2,e,i = 0; i < this.points.length; ++i){
            p1 = this.calcPoints[i];
            i2= (i+1) % this.calcPoints.length;
            p2=this.calcPoints[i2];
            this.edges[i]= _V.vecSub(p2,p1);
            this.normals[i]= _V.vecUnit(_V.perp(this.edges[i]));
          }
        }
        return this;
      }
    }
    /**
     * @public
     * @class
     */
    class Box extends Rect{
      constructor(x,y, w, h){
        super(x,y,w,h);
      }
      toPolygon(){
        return new Polygon(this.pos[0],
                           this.pos[1]).set([_V.V2(this.width,0),
                                             _V.V2(this.width,this.height),
                                             _V.V2(0,this.height),_V.V2()]);
      }
    }
    /**
     * @public
     * @class
     */
    class Manifold{
      constructor(A,B){
        this.A = A;
        this.B = B;
        this.overlapN = _V.V2();
        this.overlapV = _V.V2();
        this.clear();
      }
      clear(){
        this.overlap = Infinity;
        this.AInB = true;
        this.BInA = true;
        return this;
      }
    }

    /**
     * @public
     * @function
     */
    _G.getAABB=function(obj){
      if(_.has(obj,"radius")){
        return new _G.Rect(obj.pos[0]-obj.radius,
                           obj.pos[1]-obj.radius,
                           obj.radius*2, obj.radius*2)
      } else{
        let cps= _V.translate(obj.pos, obj.calcPoints);
        let xMin = cps[0][0];
        let yMin = cps[0][1];
        let xMax = xMin;
        let yMax = yMin;
        for(let p,i=1; i<cps.length; ++i){
          p= cps[i];
          if(p[0] < xMin) xMin = p[0];
          if(p[0] > xMax) xMax = p[0];
          if(p[1] < yMin) yMin = p[1];
          if(p[1] > yMax) yMax = p[1];
        }
        return new _G.Rect(xMin,
                           yMin,
                           xMax - xMin, yMax - yMin)
      }
    };
    /**
     * Shift a set of points.
     * @public
     * @function
     */
    _G.shiftPoints=function(ps,delta){
      return ps.map(v => _V.vecAdd(v,delta))
    };
    /**
     * Rotate a set of points.
     * @public
     * @function
     */
    _G.rotPoints=function(ps,rot,pivot){
      return ps.map(v => _V.vec2Rot(v,rot,pivot))
    };
    /**
     * Find the vertices of a rectangle.
     * @public
     * @function
     * @returns points in counter-cwise, bottom-right first.
     */
    _G.calcRectPoints=function(w,h){
      let w2=w/2;
      let h2=h/2;
      return [_V.V2(hw,-hh),
              _V.V2(hw,hh),
              _V.V2(-hw,hh),
              _V.V2(-hw,-hh)];
    };
    /**
     * @public
     * @function
     */
    _G.line=function(x1,y1,x2,y2){
      return new Line(x1,y1,x2,y2)
    };
    /**
     * @public
     * @function
     */
    _G.rectEqRect=function(r1,r2){
      return r1.width===r2.width &&
             r1.height===r2.height &&
             r1.pos[0]===r2.pos[0] &&
             r1.pos[1]===r2.pos[1]
    };
    /**
     * @public
     * @function
     */
    _G.rectContainsRect=function(R,r){
      return !(R.pos[0] >= r.pos[0] ||
               R.pos[1] >= r.pos[1] ||
               (R.pos[0]+R.width) <= (r.pos[0]+r.width) ||
               (R.pos[1]+R.height) <= (r.pos[1]+r.height))
    };
    /**
     * Right side on the x-axis.
     * @public
     * @function
     */
    _G.rectGetMaxX=function(r){
      return r.pos[0] + r.width
    }
    /**
     * Middle on the x-axis.
     * @public
     * @function
     */
    _G.rectGetMidX=function(r){
      return r.pos[0] + r.width/2
    };
    /**
     * @public
     * @function
     */
    _G.rectGetMinX=function(r){
      return r.pos[0]
    };
    /**
     * @public
     * @function
     */
    _G.rectGetMaxY=function(r){
      return r.pos[1] + r.height
    };
    /**
     * Mid point on the y-axis.
     * @public
     * @function
     */
    _G.rectGetMidY=function(r){
      return r.pos[1] + r.height/2
    };
    /**
     * @public
     * @function
     */
    _G.rectGetMinY=function(r){
      return r.pos[1]
    }
    /**
     * If point lies inside rect.
     * @public
     * @function
     */
    _G.containsPoint=function(r,x,y){
      return x >= this.rectGetMinX(r) &&
             x <= this.rectGetMaxX(r) &&
             y >= this.rectGetMinY(r) &&
             y <= this.rectGetMaxY(r)
    };
    /**
     * @public
     * @function
     */
    _G.rectIntersectsRect=function(r1,r2){
      return !((r1.pos[0]+r1.width) < r2.pos[0] ||
               (r2.pos[0]+r2.width) < r1.pos[0] ||
               (r1.pos[1]+r1.height) < r2.pos[1] ||
               (r2.pos[1]+r2.height) < r1.pos[1])
    };
    /**
     * Find the union of two rects.
     * @public
     * @function
     */
    _G.rectUnionsRect=function(r1,r2){
      let x= Math.min(r1.pos[0],r2.pos[0]);
      let y= Math.min(r1.pos[1],r2.pos[1]);
      return new Rect(x,y,
                      Math.max(r1.pos[0]+r1.width, r2.pos[0]+r2.width)-x,
                      Math.max(r1.pos[1]+r1.height, r2.pos[1]+r2.height)-y)
    };
    /**
     * @public
     * @function
     */
    _G.rectIntersectsRect=function(r1,r2){
      let x= Math.max(r1.pos[0],r2.pos[0]);
      let y= Math.max(r1.pos[1],r2.pos[1]);
      return new Rect(x,y,
                      Math.min(r1.pos[0]+r1.width, r2.pos[0]+r2.width)-x,
                      Math.min(r1.pos[1]+r1.height, r2.pos[1]+r2.height)-y)
    };

    //------------------------------------------------------------------------
    // 2d collision using Separating Axis Theorem.
    // see https://github.com/jriecken/sat-js
    //------------------------------------------------------------------------
    /**
     * @private
     * @function
     */
    function _findProjRange(points, axis){
      let min = Infinity;
      let max = -Infinity;
      for(let dot,i=0; i < points.length; ++i){
        dot = _V.vecDot(points[i],axis);
        if(dot < min) min = dot;
        if(dot > max) max = dot;
      }
      return _V.takeV2(min,max)
    }
    /**
     * @private
     * @function
     */
    function _voronoiRegion(line, point){
      let dp = _V.vecDot(point,line);
      let len2 = _V.vecLen2(line);
      // If pt is beyond the start of the line, left voronoi region
      // If pt is beyond the end of the line, right voronoi region
      return dp < 0 ? LEFT_VORONOI : (dp > len2 ? RIGHT_VORONOI : MID_VORONOI)
    }
    /**
     * @private
     * @function
     */
    function _testSAT(aPos,aPoints, bPos,bPoints, axis, resolve){
      let vAB= _V.vecSub(bPos,aPos); // B relative to A
      let projectedOffset = _V.vecDot(vAB,axis);
      let [minA,maxA] =_findProjRange(aPoints, axis);
      let [minB,maxB] =_findProjRange(bPoints, axis);
      // move B's range to its position relative to A.
      minB += projectedOffset;
      maxB += projectedOffset;
      let gap;
      if(minA > maxB || minB > maxA){
        gap=true;
      } else if(resolve){
        let overlap = 0;
        // A starts left of B
        if(minA < minB){
          resolve.AInB = false;
          // A ends before B does. We have to pull A out of B
          if(maxA < maxB){
            overlap = maxA - minB;
            resolve.BInA = false;
          }else{
            // B is fully inside A.  Pick the shortest way out.
            let [d1,d2] = [maxA - minB, maxB - minA];
            overlap = d1 < d2 ? d1 : -d2;
          }
        // B starts left than A
        }else{
          resolve.BInA = false;
          // B ends before A ends. We have to push A out of B
          if(maxA > maxB){
            overlap = minA - maxB;
            resolve.AInB = false;
          }else{
            // A is fully inside B.  Pick the shortest way out.
            let [d1,d2] = [maxA - minB, maxB - minA];
            overlap = d1 < d2 ? d1 : -d2;
          }
        }
        // If smallest amount of overlap, set it as the minimum overlap.
        let absOverlap = Math.abs(overlap);
        if(absOverlap < resolve.overlap){
          resolve.overlap = absOverlap;
          _V.vecSet(resolve.overlapN,axis);
          if(overlap < 0)
            _V.vecFlipSelf(resolve.overlapN);
        }
      }
      _V.dropV2(vAB);
      return gap;
    }
    /**
     * @public
     * @function
     */
    _G.hitTestPointCircle=function(p, c){
      let d2 = _V.vecLen2(_V.vecSub(p,c.pos));
      return d2 <= c.radius * c.radius;
    };
    const _RES= new Manifold();
    const _FAKE_POLY= new Box(0,0, 1, 1).toPolygon();
    /**
     * @public
     * @function
     */
    _G.hitTestPointPolygon=function(p, poly){
      _V.vecSet(_FAKE_POLY.pos,p);
      let res= this.hitTestPolygonPolygon(_FAKE_POLY, poly, _RES.clear());
      return res ? _RES.AInB : false;
    };
    /**
     * @private
     * @function
     */
    function _circle_circle(a, b, resolve){
      let r_ab = a.radius + b.radius;
      let vAB= _V.vecSub(b.pos,a.pos);
      let r2 = r_ab * r_ab;
      let d2 = _V.vecLen2(vAB);
      let status= !(d2 > r2);
      if(status && resolve){
        let dist = Math.sqrt(d2);
        resolve.A = a;
        resolve.B = b;
        resolve.overlap = r_ab - dist;
        _V.vecSet(resolve.overlapN, _V.vecUnitSelf(vAB));
        _V.vecSet(resolve.overlapV, _V.vecMul(vAB,resolve.overlap));
        resolve.AInB = a.radius <= b.radius && dist <= b.radius - a.radius;
        resolve.BInA = b.radius <= a.radius && dist <= a.radius - b.radius;
      }
      _V.dropV2(vAB);
      return status;
    }
    /**
     * @public
     * @function
     */
    _G.hitCircleCircle=function(a, b){
      let m=new Manifold();
      return _circle_circle(a,b,m) ? m : null
    };
    /**
     * @public
     * @function
     */
    _G.hitTestCircleCircle=function(a, b){
      return _circle_circle(a,b)
    };
    /**
     * @private
     * @function
     */
    function _poly_circle(polygon, circle, resolve){
      // get position of the circle relative to the polygon.
      let vPC= _V.vecSub(circle.pos,polygon.pos);
      let r2 = circle.radius * circle.radius;
      let cps = polygon.calcPoints;
      let edge = _V.takeV2();
      let point;// = _V.takeV2();
      // for each edge in the polygon:
      for(let len=cps.length,i=0; i < len; ++i){
        let next = i === len-1 ? 0 : i+1;
        let prev = i === 0 ? len-1 : i-1;
        let overlap = 0;
        let overlapN = null;
        _V.vecSet(edge,polygon.edges[i]);
        // calculate the center of the circle relative to the starting point of the edge.
        point=_V.vecSub(vPC,cps[i]);
        // if the distance between the center of the circle and the point
        // is bigger than the radius, the polygon is definitely not fully in
        // the circle.
        if(resolve && _V.vecLen2(point) > r2){
          resolve.AInB = false;
        }
        // calculate which Voronoi region the center of the circle is in.
        let region = _voronoiRegion(edge, point);
        if(region === LEFT_VORONOI){
          // need to make sure we're in the RIGHT_VORONOI of the previous edge.
          _V.vecSet(edge,polygon.edges[prev]);
          // calculate the center of the circle relative the starting point of the previous edge
          let point2= _V.vecSub(vPC,cps[prev]);
          region = _voronoiRegion(edge, point2);
          if(region === RIGHT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.vecLen(point);
            if(dist > circle.radius){
              // No intersection
              _V.dropV2(vPC,edge,point,point2);
              return false;
            } else if(resolve){
              // intersects, find the overlap.
              resolve.BInA = false;
              overlapN = _V.vecUnit(point);
              overlap = circle.radius - dist;
            }
          }
          _V.dropV2(point2);
        } else if(region === RIGHT_VORONOI){
          // need to make sure we're in the left region on the next edge
          _V.vecSet(edge,polygon.edges[next]);
          // calculate the center of the circle relative to the starting point of the next edge.
          _V.vecSubSelf(_V.vecSet(point,vPC),cps[next]);
          region = _voronoiRegion(edge, point);
          if(region === LEFT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.vecLen(point);
            if(dist > circle.radius){
              _V.dropV2(vPC,edge,point);
              return false;
            } else if(resolve){
              resolve.BInA = false;
              overlapN = _V.vecUnit(point);
              overlap = circle.radius - dist;
            }
          }
        }else{
          // check if the circle is intersecting the edge,
          // change the edge into its "edge normal".
          let normal = _V.vecUnitSelf(_V.perp(edge));
          // find the perpendicular distance between the center of the circle and the edge.
          let dist = _V.vecDot(point,normal);
          let distAbs = Math.abs(dist);
          // if the circle is on the outside of the edge, there is no intersection.
          if(dist > 0 && distAbs > circle.radius){
            _V.dropV2(vPC,normal,point);
            return false;
          } else if(resolve){
            overlapN = normal;
            overlap = circle.radius - dist;
            // if the center of the circle is on the outside of the edge, or part of the
            // circle is on the outside, the circle is not fully inside the polygon.
            if(dist >= 0 || overlap < 2 * circle.radius){
              resolve.BInA = false;
            }
          }
        }
        // if this is the smallest overlap we've seen, keep it.
        // (overlapN may be null if the circle was in the wrong Voronoi region).
        if(overlapN && resolve && Math.abs(overlap) < Math.abs(resolve.overlap)){
          resolve.overlap = overlap;
          _V.vecSet(resolve.overlapN,overlapN);
        }
      }
      // calculate the final overlap vector - based on the smallest overlap.
      if(resolve){
        resolve.A = polygon;
        resolve.B = circle;
        _V.vecMulSelf(_V.vecSet(resolve.overlapV,resolve.overlapN),resolve.overlap);
      }
      _V.dropV2(vPC,edge,point);
      return true;
    }
    /**
     * @public
     * @function
     */
    _G.hitPolygonCircle=function(polygon, circle){
      let m=new Manifold();
      return _poly_circle(polygon,circle,m) ? m : null
    };
    /**
     * @public
     * @function
     */
    _G.hitTestPolygonCircle=function(polygon, circle){
      return _poly_circle(polygon,circle)
    };
    /**
     * @private
     * @function
     */
    function _circle_poly(circle, polygon, resolve){
      let result = _poly_circle(polygon, circle, resolve);
      if(result && resolve){
        // flip A and B
        let a = resolve.A;
        let aInB = resolve.AInB;
        _V.vecFlipSelf(resolve.overlapN);
        _V.vecFlipSelf(resolve.overlapV);
        resolve.A = resolve.B;
        resolve.B = a;
        resolve.AInB = resolve.BInA;
        resolve.BInA = aInB;
      }
      return result;
    }
    /**
     * @public
     * @function
     */
    _G.hitCirclePolygon=function(circle, polygon){
      let m=new Manifold();
      return _circle_poly(circle,polygon,m) ? m : null
    };
    /**
     * @public
     * @function
     */
    _G.hitTestCirclePolygon=function(circle, polygon){
      return _circle_poly(circle,polygon)
    };
    /**
     * @private
     * @function
     */
    function _poly_poly(a, b, resolve){
      let pa = a.calcPoints;
      let pb = b.calcPoints;
      for(let i=0; i < pa.length; ++i){
        if(_testSAT(a.pos, pa, b.pos, pb, a.normals[i], resolve))
          return false;
      }
      for(let i=0;i < pb.length; ++i){
        if(_testSAT(a.pos, pa, b.pos, pb, b.normals[i], resolve))
          return false;
      }
      if(resolve){
        resolve.A = a;
        resolve.B = b;
        _V.vecMulSelf(_V.vecSet(resolve.overlapV,resolve.overlapN),resolve.overlap);
      }
      return true;
    }
    /**
     * @public
     * @function
     */
    _G.hitPolygonPolygon=function(a, b){
      let m=new Manifold();
      return _poly_poly(a,b,m) ? m : null
    };
    /**
     * @public
     * @function
     */
    _G.hitTestPolygonPolygon=function(a, b){
      return _poly_poly(a,b)
    };

    return _singleton= _.inject(_G, {Circle: Circle,
                                     Line: Line,
                                     Box: Box,
                                     Manifold: Manifold,
                                     Polygon: Polygon, Rect: Rect, Area: Area});

  };


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
 * Copyright © 2013-2020, Kenneth Leung. All rights reserved. */

;(function(global) {
  "use strict";
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  let _singleton=null;
  /**
   * @public
   * @function
   */
  global["io.czlab.mcfud.negamax"]= function(){
    if(_singleton){ return _singleton }
    const Core=global["io.czlab.mcfud.core"]();
    const _= Core.u;
    const _N={};
    const PINF = 1000000;
    /**
     * @public
     * @class
     */
    class FFrame{
      constructor(sz){
        this.state= _.fill(new Array(sz*sz),0);
        this.lastBestMove=0;
        this.other=0;
        this.cur=0;
      }
    }
    /**
     * @public
     * @class
     */
    class GameBoard{
      constructor(){
      }
      getNextMoves(frame){}
      evalScore(frame){}
      isStalemate(frame){}
      isOver(f){}
      undoMove(frame, move){}
      makeMove(f, move){}
      switchPlayer(frame){}
      takeFFrame(){}
    }
    /**Nega Min-Max algo.
     * @private
     * @function
     */
    function _negaMax(board, game, maxDepth, depth, alpha, beta){
      if(depth === 0 ||
         board.isOver(game)) return board.evalScore(game);

      let openMoves = board.getNextMoves(game),
          bestValue = -PINF,
          bestMove = openMoves[0];

      if(depth === maxDepth)
        game.lastBestMove = openMoves[0];

      for(let rc, move, i=0; i<openMoves.length; ++i){
        move = openMoves[i];
        //try a move
        board.makeMove(game, move);
        board.switchPlayer(game);
        rc= - _negaMax(board, game, maxDepth, depth-1, -beta, -alpha);
        //now, roll it back
        board.switchPlayer(game);
        board.undoMove(game, move);
        //how did we do ?
        bestValue = _.max(bestValue, rc);
        if(alpha < rc){
          alpha = rc;
          bestMove = move;
          if(depth === maxDepth)
            game.lastBestMove = move;
          if(alpha >= beta) break;
        }
      }
      return bestValue;
    }
    /**
     * Main method for nega-max algo.
     * @public
     * @function
     */
    _N.evalNegaMax=function(board){
      let f= board.takeFFrame();
      _negaMax(board, f, 10, 10, -PINF, PINF);
      return f.lastBestMove;
    };

    return _singleton= _.inject(_N,{ FFrame: FFrame, GameBoard: GameBoard });
  };

})(this);

