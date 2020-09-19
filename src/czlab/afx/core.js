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

;(function(global,undefined){
  "use strict";
  const OBJ=Object.prototype;
  const ARR=Array.prototype;
  const slicer=ARR.slice;
  const tostr=OBJ.toString;
  const window=global;
  const document=window.document;

  function isObject(obj){ return tostr.call(obj) === "[object Object]"; }
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
  const EPSILON= 0.00001;
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
    //get POS_INF(){ return Infinity; },
    //get NEG_INF(){ return -Infinity; },
    feq:function(a, b){
      // <= instead of < for NaN comparison safety
      return Math.abs(a - b) <= EPSILON;
    },
    fgteq:function(a,b){
      return a>b || this.feq(a,b);
    },
    flteq:function(a,b){
      return a<b || this.feq(a,b);
    },
    pack: function(o){ return JSON.stringify(o) },
    unpack: function(s){ return JSON.parse(s) },
    v2: function(x,y){ return [x,y] },
    p2: function(x,y){ return {x: x, y: y} },
    numOrZero: function(n){ return isNaN(n) ? 0 : n },
    parseNumber: function(s,dft){
      let n=parseFloat(s);
      return (isNaN(n) && isNum(dft)) ? dft : n;
    },
    splitVerStr: function(s){
      let arr=(""+(s || "")).split(".").filter(s=> s.length>0);
      let major=this.parseNumber(arr[0],0);
      let minor=this.parseNumber(arr[1],0);
      let patch=this.parseNumber(arr[2],0);
      return [major, minor, patch];
    },
    cmpVerStrs: function(V1,V2){
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
    findFiles: function(files, exts){
      return files.filter(s=> exts.indexOf(_fext(s)) > -1);
    },
    pdef: function(obj){
      obj.enumerable=true;
      obj.configurable=true;
      return obj;
    },
    partition: function(count,arr){
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
    range:function(start,end){
      _.assert(start !== undefined);
      let out=[];
      if(arguments.length===1){ end=start; start=0 }
      for(let i=start;i<end;++i){ out.push(i) }
      return out
    },
    keys: function(obj){
      return isMap(obj) ? Array.from(obj.keys())
                        : (isObject(obj) ? Object.keys(obj) : []);
    },
    selectKeys: function(coll,keys){
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
    assert: function(cond){
      if(!cond)
        throw (arguments.length<2) ? "Assert Failed!" : slicer.call(arguments,1).join("");
      return true
    },
    noSuchKeys: function(keys,target){
      let r=this.some(this.seq(keys),k => this.has(target,k)?k:null);
      if(r) console.log("keyfound="+r);
      return !r;
    },
    randFloat: function(min, max){
      return min + Math.random() * (max - min);
    },
    randMinus1To1: function(){ return (Math.random() - 0.5) * 2 },
    randInt: function(num){ return _randXYInclusive(0,num) },
    randInt2: _randXYInclusive,
    rand: function(){ return Math.random() },
    inst: function(type,obj){ return obj instanceof type },
    isPerc: function(s){
      return isStr(s) && s.match(/^([0-9])(\.?[0-9]+|[0-9]*)%$/);
    },
    jsMap: function(){ return new Map() },
    jsObj: function(){ return {} },
    jsVec: function(...args){
      return args.length===0 ? [] : args.slice();
    },
    floor: function(v){ return Math.floor(v) },
    ceil: function(v){ return Math.ceil(v) },
    abs: function(v){ return Math.abs(v) },
    sqrt: function(v){ return Math.sqrt(v) },
    min: function(a,b){ return Math.min(a,b) },
    max: function(a,b){ return Math.max(a,b) },
    slice: function(a,i){ return slicer.call(a, i) },
    every: function(c,v){
      for(let i=0;i<c.length;++i)
        if(c[i] !== v) return false;
      return c.length>0;
    },
    notAny: function(c,v){
      for(let i=0;i<c.length;++i)
        if(c[i] === v) return false;
      return c.length>0;
    },
    copy: function(to,from){
      if(!from) return to;
      if(!to) return from.slice();
      let len= Math.min(to.length,from.length);
      for(let i=0;i<len;++i) to[i]=from[i];
      return to;
    },
    append: function(to,from){
      if(!from) return to;
      if(!to) return from.slice();
      for(let i=0;i<from.length;++i) to.push(from[i]);
      return to;
    },
    fill: function(a,v){
      if(a)
        for(let i=0;i<a.length;++i) a[i]=v;
      return a;
    },
    size: function(obj){
      let len=0;
      if(isArray(obj)) len= obj.length;
      else if(isMap(obj)) len=obj.size;
      else if(obj) len=_.keys(obj).length;
      return len;
    },
    nextId: function(){ return ++_seqNum },
    now: function(){ return Date.now() },
    fileExt: _fext,
    fileNoExt: function(name){
      let pos= name.lastIndexOf(".");
      return pos>0 ? name.substring(0,pos) : name;
    },
    range: function(start,stop,step=1){
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
    shuffle: function(obj){
      let res=slicer.call(obj,0);
      for(let x,j,i= res.length-1; i>0; --i){
        j = Math.floor(Math.random() * (i+1));
        x = res[i];
        res[i] = res[j];
        res[j] = x;
      }
      return res;
    },
    uniq: function(arr){
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
    map: function(obj, fn,target){
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
    find: function(obj,fn,target){
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
    some: function(obj,fn,target){
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
    invoke: function(arr,key){
      let args=slicer.call(arguments,2);
      if(isArray(arr))
        arr.forEach(x => x[key].apply(x, args));
    },
    timer: function(f,delay=0){
      return setTimeout(f,delay);
    },
    clear: function(id){
      clearTimeout(id);
    },
    rseq: function(obj,fn,target){
      if(isArray(obj))
        for(let i=obj.length-1;i>=0;--i)
          fn.call(target, obj[i],i);
    },
    doseq: function(obj,fn,target){
      if(isArray(obj))
        obj.forEach(fn,target);
      else if(isMap(obj))
        obj.forEach((v,k)=> fn.call(target,v,k,obj));
      else if(obj)
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj,k))
          fn.call(target, obj[k], k, obj);
    },
    dissoc: function(obj,key){
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
    get: function(obj,key){
      if(typeof key !== "undefined"){
        if(isMap(obj)) return obj.get(key);
        else if(obj) return obj[key];
      }
    },
    assoc: function(obj,key,value){
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
    disj: function(coll,obj){
      let i = coll ? coll.indexOf(obj) : -1;
      if(i > -1) coll.splice(i,1);
      return i > -1;
    },
    conj: function(coll,...objs){
      if(coll)
        objs.forEach(o => coll.push(o));
      return coll;
    },
    seq: function(arg,sep=","){
      if(typeof arg === "string")
        arg = arg.split(sep).map(s=>s.trim()).filter(s=>s.length>0);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    has: function(obj,key){
      if(!key)
        return false;
      if(isMap(obj))
        return obj.has(key);
      if(isArray(obj))
        return obj.indexOf(key) !== -1;
      if(obj)
        return OBJ.hasOwnProperty.call(obj, key);
    },
    patch: function(des,additions){
      des=des || {};
      if(additions)
        Object.keys(additions).forEach(k=>{
          if(des[k]===undefined)
            des[k]=additions[k];
        });
      return des;
    },
    clone: function(obj){
      if(obj)
        obj=JSON.parse(JSON.stringify(obj));
      return obj;
    },
    inject: function(des){
      let args=slicer.call(arguments,1);
      des=des || {};
      args.forEach(s=>{
        if(s) Object.assign(des,s);
      });
      return des;
    },
    addEvent: function(event,target,cb,arg){
      if(isArray(event) && arguments.length===1)
        event.forEach(e => this.addEvent.apply(this, e));
      else
        target.addEventListener(event,cb,arg);
    },
    delEvent: function(event,target,cb,arg){
      if(isArray(event) && arguments.length===1)
        event.forEach(e => this.delEvent.apply(this, e));
      else
        target.removeEventListener(event,cb,arg);
    }
  };
  /**
   * @public
   * @var {object}
   */
  const is={
    fun: function(obj){ return tostr.call(obj) === "[object Function]" },
    str: function(obj){ return typeof obj === "string" },
    void0: function(obj){ return obj === void 0 },
    undef: function(obj){ return obj === undefined },
    obj: isObject,
    map: isMap,
    num: isNum,
    vec: isArray,
    some: function(obj){ return _.size(obj) > 0 },
    none: function(obj){ return _.size(obj) === 0 }
  };
  /**
   * @public
   * @var {object}
   */
  const dom={
    qSelector: function(sel){ return document.querySelectorAll(sel) },
    qId: function(id){ return document.getElementById(id) },
    parent: function(e){ return e ? e.parentNode : undefined },
    conj: function(par,child){ return par.appendChild(child) },
    byTag: function(tag, ns){
      return !is.str(ns) ? document.getElementsByTagName(id)
                         : document.getElementsByTagNameNS(ns,tag) },
    attrs: function(e, attrs){
      if(!is.obj(attrs) && attrs){
        if(arguments.length > 2)
          e.setAttribute(attrs, arguments[2]);
        return e.getAttribute(attrs);
      }
      if(attrs)
        _.doseq(attrs, (v,k) => e.setAttribute(k,v));
      return e;
    },
    css: function(e, styles){
      if(!is.obj(styles) && styles){
        if(arguments.length > 2)
          e.style[styles]= arguments[2];
        return e.style[styles];
      }
      if(styles)
        _.doseq(styles, (v,k) => { e.style[k]= v; });
      return e;
    },
    wrap: function(child,wrapper){
      let p=child.parentNode;
      wrapper.appendChild(child);
      p.appendChild(wrapper);
      return wrapper;
    },
    newElm: function(tag, attrs, styles){
      let e = document.createElement(tag);
      this.attrs(e,attrs);
      this.css(e,styles);
      return e;
    },
    newTxt: function(tag, attrs, styles){
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
    return {
      sub: function(subject,cb,ctx){
        if(is.vec(subject) && arguments.length===1 && is.vec[subject[0]]){
          subject.forEach(e => { if(is.vec(e)) this.sub.apply(this, e); });
        }else{
          let event=subject[0], target=subject[1];
          //handle multiple events in one string
          _.seq(event).forEach(e => {
            if(!cb) cb=e;
            if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
            if(!cb) throw "Error: no callback for sub()";
            if(!_tree.has(e)) _tree.set(e, _.jsMap());
            let m= _tree.get(e);
            !m.has(target) && m.set(target,[]);
            m.get(target).push([cb,ctx]);
            //if(!_tree.has(target)) _tree.set(target, _.jsMap());
            //let m= _tree.get(target);
            //!m.has(e) && m.set(e,[]);
            //m.get(e).push([cb,ctx]);
          });
        }
      },
      pub: function(subject,data){
        if(is.vec(subject) && arguments.length===1 && is.vec[subject[0]]){
          subject.forEach(e => { if(is.vec(e)) this.pub.apply(this, e); });
        }else{
          let m,t,event=subject[0], target=subject[1];
          _.seq(event).forEach(e=>{
            t=_tree.get(e);
            m= t && t.get(target);
            m && m.forEach(s => s[0].call(s[1],data));
          });
          /*
          let m,t= _tree.get(target);
          if(t)
            _.seq(event).forEach(e => {
              if(m= t.get(e))
                m.forEach(s => s[0].call(s[1],data));
            });
            */
        }
      },
      unsub: function(subject,cb,ctx){
        if(is.vec(subject) && arguments.length===1 && is.vec[subject[0]]){
          subject.forEach(e => { if(is.vec(e)) this.unsub.apply(this, e); });
        }else{
          let event=subject[0], target=subject[1];
          let t,m, es=_.seq(event);
          es.forEach(e => {
            t= _tree.get(e);
            m= t && t.get(target);
            if(m){
              if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
              if(!cb)
                t.delete(target);
              else
                for(let i= m.length-1;i>=0;--i)
                    if(m[i][0] === cb && m[i][1] === ctx) m.splice(i,1);
            }
          });
/*
          let t= _tree.get(target);
          if(t) {
            if(!cb)
              es.forEach(e => t.delete(e));
            else {
              if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
              es.forEach(e => {
                if(!cb)
                  t.delete(e);
                else if(ss= t.get(e))
                  for(let i= ss.length-1;i>=0;--i)
                    if(ss[i][0] === cb && ss[i][1] === ctx) ss.splice(i,1);
              });
            }
          }
          */
        }
      }
    };
  };
  /**
   * @public
   * @class
   */
  class Vec2{
    constructor(p1,p2){
      if(p1 instanceof Vec2){
        this.x=p1.x;
        this.y=p1.y;
      }else{
        this.x=p1||0;
        this.y=p2||0;
      }
    }
    copy(other){
      this.x=other.x;
      this.y=other.y;
      return this;
    }
    clone(){
      return new Vec2(this);
    }
    // Change this vector to be perpendicular to what it was before. (Effectively
    // roatates it 90 degrees in a clockwise direction)
    perp(){
      let x = this.x;
      this.x=this.y;
      this.y= -x;
      return this;
    }
    normal(){
      this.perp().normalize();
      return this;
    }
    // Rotate this vector (counter-clockwise) by the specified angle (in radians).
    rotate(angle){
      let x = this.x;
      let y = this.y;
      this.x = x * Math.cos(angle) - y * Math.sin(angle);
      this.y = x * Math.sin(angle) + y * Math.cos(angle);
      return this;
    }
    reverse(){
      this.x = -this.x;
      this.y = -this.y;
      return this;
    }
    negate(){
      return this.reverse();
    }
    normalize(){
      let d = this.len();
      return d > 0 ? new Vec2(this.x / d, this.y / d) : new Vec2();
    }
    add(other){
      this.x += other.x;
      this.y += other.y;
      return this;
    }
    sub(other){
      this.x -= other.x;
      this.y -= other.y;
      return this;
    }
    scale(sx,sy){
      this.x *= sx;
      this.y *= (sy===undefined ? sx : sy);
      return this;
    }
    project(other){
      return this.dot(other.normalize());
    }
    dot(other){
      return this.x * other.x + this.y * other.y;
    }
    len2(){
      return this.dot(this);
    }
    len(){
      return Math.sqrt(this.len2());
    }
  };

  const V2={
    add:function(va,vb){
      return _.p2(va.x+vb.x,va.y+vb.y);
    },
    //vector vAB -> vB -vA
    sub:function(vb,va){
      return _.p2(vb.x-va.x,vb.y-va.y);
    },
    scale:function(v,s){
      return _.p2(v.x*s,v.y*s);
    },
    len2:function(v){
      return v.x*v.x + v.y*v.y;
    },
    len:function(v){
      return Math.sqrt(v.x*v.x + v.y*v.y);
    },
    dot:function(a,b){
      return a.x * b.x + a.y * b.y;
    },
    normalize:function(a){
      let mag=this.len(a);
      return _.p2(a.x/mag, b.y/mag);
    },
    perpLine:function(x1,x2,y1,y2,rhs){
      let dx=x2-x1, dy=y2-y1;
      return rhs ? _.p2(dy,-dx) : _.p2(-dy,dx);
    },
    perp:function(a,s){
      return this.perpLine(0,0,a.x,a.y,s);
    },
    project:function(a,b){
      return this.dot(a,this.normalize(b));
    }
  };

  /**
   * @public
   * @class
   */
  class TxMatrix{
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
  };

  //exports---------------------------------------------------------------------
  MojoH5.Core=function(self){
    self.EventBus= EventBus;
    self.TxMatrix=TxMatrix;
    self.Vec2=Vec2;
    self.u= _;
    self.is=is;
    self.V2=V2;
    self.dom=dom;
    return self;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

