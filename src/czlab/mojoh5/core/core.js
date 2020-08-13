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

(function(global,undefined){
  "use strict";
  const OBJ=Object.prototype,
    ARR=Array.prototype,
    slicer=ARR.slice,
    tostr=OBJ.toString,
    window=global,
    document=window.document;

  function isObject(obj) { return tostr.call(obj) === "[object Object]"; }
  function isArray(obj) { return tostr.call(obj) === "[object Array]"; }
  function isMap(obj) { return tostr.call(obj) === "[object Map]"; }
  function isStr(obj) { return typeof obj === "string"; }
  function _randXYInclusive(min,max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function _fext(name) {
    let pos= name.lastIndexOf(".");
    return pos>0 ? name.substring(pos+1).toLowerCase() : "";
  }
  //https://github.com/bryc/code/blob/master/jshash/PRNGs.md
  //xoshiro128+ (128-bit state generator in 32-bit)
  const xoshiro128p = (function (a,b,c,d) {
    return function() {
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

  /**
   * @private
   * @var {number}
    */
  let _seqNum= 0;

  /**
   * @public
   * @var {object}
   */
  const _= {
    get POS_INF() { return Infinity; },
    get NEG_INF() { return -Infinity; },
    pack: (o) => { return JSON.stringify(o); },
    unpack: (s) => { return JSON.parse(s); },
    findFiles: (files, exts) => {
      return files.filter(s => { return exts.indexOf(_fext(s)) > -1; });
    },
    pdef: (obj) => {
      obj.enumerable=true;
      obj.configurable=true;
      return obj;
    },
    keys: (obj) => {
      return isMap(obj) ? Array.from(obj.keys())
                        : (isObject(obj) ? Object.keys(obj) : []);
    },
    assert: function(cond) {
      if(!cond)
        throw (arguments.length<2) ? "Assert Failed!" : slicer.call(arguments,1).join("");
    },
    randFloat: (min, max) => {
      return min + Math.random() * (max - min);
    },
    randMinus1To1: () => { return (Math.random() - 0.5) * 2; },
    randInt: (num) => { return _randXYInclusive(1,num); },
    randInt2: _randXYInclusive,
    rand: () => { return Math.random(); },
    inst: (type,obj) => { return obj instanceof type; },
    isPerc: (s) => {
      return isStr(s) && s.match(/^([0-9])(\.?[0-9]+|[0-9]*)%$/);
    },
    jsMap: () => { return new Map(); },
    jsObj: () => { return {}; },
    jsVec: function(...args) {
      return args.length===0 ? [] : args.slice();
    },
    floor: (v) => { return Math.floor(v); },
    ceil: (v) => { return Math.ceil(v); },
    abs: (v) => { return Math.abs(v); },
    sqrt: (v) => { return Math.sqrt(v); },
    min: (a,b) => { return Math.min(a,b); },
    max: (a,b) => { return Math.max(a,b); },
    slice: (a,i) => { return slicer.call(a, i); },
    every: (c,v) => {
      for(let i=0;i<c.length;++i)
        if(c[i] !== v) return false;
      return c.length>0;
    },
    notAny: (c,v) => {
      for(let i=0;i<c.length;++i)
        if(c[i] === v) return false;
      return c.length>0;
    },
    copy: (to,from) => {
      if(!from) return to;
      if(!to) return from.slice();
      let len= Math.min(to.length,from.length);
      for(let i=0;i<len;++i) to[i]=from[i];
      return to;
    },
    append: (to,from) => {
      if(!from) return to;
      if(!to) return from.slice();
      for(let i=0;i<from.length;++i) to.push(from[i]);
      return to;
    },
    fill: (a,v) => {
      if(a)
        for(let i=0;i<a.length;++i) a[i]=v;
      return a;
    },
    size: (obj) => {
      let len=0;
      if(isArray(obj)) len= obj.length;
      else if(isMap(obj)) len=obj.size;
      else if(obj) len=_.keys(obj).length;
      return len;
    },
    nextId: () => { return ++_seqNum; },
    now: () => { return Date.now(); },
    fileExt: _fext,
    fileNoExt: (name) => {
      let pos= name.lastIndexOf(".");
      return pos>0 ? name.substring(0,pos) : name;
    },
    range: (start,stop,step=1) => {
      if(typeof stop==="undefined") {
        stop=start; start=0; step=1;
      }
      let res=[],
          len = (stop-start)/step;
      len = Math.ceil(len);
      len = Math.max(0, len);
      res.length=len;
      for(let i=0;i<len;++i) {
        res[i] = start;
        start += step;
      }
      return res;
    },
    shuffle: (obj) => {
      let res=slicer.call(obj,0);
      for(let x,j,i= res.length-1; i>0; --i) {
        j = Math.floor(Math.random() * (i+1));
        x = res[i];
        res[i] = res[j];
        res[j] = x;
      }
      return res;
    },
    uniq: (arr) => {
      let res= [],
          prev= null;
      arr = slicer.call(arr).sort();
      arr.forEach(a => {
        if(a !== undefined &&
           a !== prev) res.push(a);
        prev = a;
      });
      return res;
    },
    map: (obj, fn,target) => {
      let res= [];
      if(isArray(obj))
        res= obj.map(fn,target);
      else if(isMap(obj)) {
        obj.forEach((v,k)=> {
          res.push(fn.call(target, v,k,obj));
        });
      } else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k))
            res.push(fn.call(target, obj[k],k,obj));
      }
      return res;
    },
    find: function(obj,fn,target) {
      let args=slicer.call(arguments,3);
      if(isArray(obj)) {
        for(let i=0,z=obj.length;i<z;++i)
          if(fn.apply(target, [obj[i], i].concat(args)))
            return obj[i];
      } else if(isMap(obj)) {
        let ks=Array.from(obj.keys());
        for(let k,i=0,z=ks.length;i<z;++i) {
          k=ks[i];
          if(fn.apply(target, [obj.get(k), k].concat(args)))
          return [k, obj.get(k)];
        }
      } else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k) &&
             fn.apply(target, [obj[k], k].concat(args)))
            return [k,obj[k]];
      }
    },
    some: function(obj,fn,target) {
      let res,
          args=slicer.call(arguments,3);
      if(isArray(obj)) {
        for (let i=0,z=obj.length;i<z;++i)
          if(res = fn.apply(target, [obj[i], i].concat(args)))
            return res;
      } else if(isMap(obj)) {
        let ks=Array.from(obj.keys());
        for (let k,i=0,z=ks.length;i<z;++i) {
          k=ks[i];
          if(res = fn.apply(target, [obj.get(k), k].concat(args)))
            return res;
        }
      } else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k))
            if(res = fn.apply(target, [obj[k], k].concat(args)))
              return res;
      }
    },
    invoke: function(arr,key) {
      let args=slicer.call(arguments,2);
      if(isArray(arr))
        arr.forEach(x => x[key].apply(x, args));
    },
    timer: function(f,delay=0) {
      return setTimeout(f,delay);
    },
    clear: function(id) {
      clearTimeout(id);
    },
    rseq: (obj,fn, target) => {
      if(isArray(obj))
        for(let i=obj.length-1;i>=0;--i)
          fn.call(target, obj[i],i);
    },
    doseq: (obj,fn,target) => {
      if(isArray(obj))
        obj.forEach(fn,target);
      else if(isMap(obj))
        obj.forEach((v,k)=> fn.call(target,v,k,obj));
      else if(obj)
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj,k))
          fn.call(target, obj[k], k, obj);
    },
    dissoc: function(obj,key) {
      if(arguments.length>2) {
        let prev,i=1;
        for(;i<arguments.length;++i)
          prev=this.dissoc(obj,arguments[i]);
        return prev;
      } else {
        let val;
        if(isMap(obj)) {
          val=obj.get(key);
          obj.delete(key);
        } else if (obj) {
          val = obj[key];
          delete obj[key];
        }
        return val;
      }
    },
    get: (obj,key) => {
      if(typeof key !== "undefined") {
        if(isMap(obj)) return obj.get(key);
        else if(obj) return obj[key];
      }
    },
    assoc: function(obj,key,value) {
      if(arguments.length>3) {
        if(((arguments.length-1)%2) !== 0)
          throw "ArityError: expecting even count of args.";
        let prev, i=1;
        for(;i < arguments.length;) {
          prev= this.assoc(obj,arguments[i],arguments[i+1]);
          i+=2;
        }
        return prev;
      } else {
        let prev;
        if(isMap(obj)) {
          prev=obj.get(key);
          obj.set(key,value);
        }
        else if(obj) {
          prev=obj[key];
          obj[key]=value;
        }
        return prev;
      }
    },
    disj: (coll,obj) => {
      let i = coll ? coll.indexOf(obj) : -1;
      if(i > -1) coll.splice(i,1);
      return i > -1;
    },
    conj: (coll,...objs) => {
      if(coll)
        objs.forEach(o => coll.push(o));
      return coll;
    },
    seq: (arg,sep=",") => {
      if(typeof arg === "string")
        arg = arg.split(sep).map(s => s.trim()).filter(s => s.length>0);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    has: (obj,key) => {
      if(isMap(obj))
        return obj.has(key);
      if(isArray(obj))
        return obj.indexOf(key) !== -1;
      if(obj)
        return OBJ.hasOwnProperty.call(obj, key);
    },
    patch: (des,additions) => {
      des=des || {};
      if(additions)
        Object.keys(additions).forEach(k => {
          if(des[k]===undefined)
            des[k]=additions[k];
        });
      return des;
    },
    clone: (obj) => {
      if(obj)
        obj=JSON.parse(JSON.stringify(obj));
      return obj;
    },
    inject: function(des) {
      let args=slicer.call(arguments,1);
      des=des || {};
      args.forEach(s => {
        if(s) Object.assign(des,s);
      });
      return des;
    },
    addEvent: function(event,target,cb,arg) {
      if(isArray(event) && arguments.length===1)
        event.forEach(e => this.addEvent.apply(this, e));
      else
        target.addEventListener(event,cb,arg);
    },
    delEvent: function(event,target,cb,arg) {
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
  const is= {
    fun: (obj) => { return tostr.call(obj) === "[object Function]"; },
    num: (obj) => { return tostr.call(obj) === "[object Number]"; },
    str: (obj) => { return typeof obj === "string"; },
    void0: (obj) => { return obj === void 0; },
    undef: (obj) => { return obj === undefined; },
    obj: isObject,
    map: isMap,
    vec: isArray,
    some: (obj) => { return _.size(obj) > 0; },
    none: (obj) => { return _.size(obj) == 0; }
  };

  /**
   * @public
   * @var {object}
   */
  const dom= {
    qSelector: (sel) => { return document.querySelectorAll(sel); },
    qId: (id) => { return document.getElementById(id); },
    parent: (e) => { return e ? e.parentNode : undefined; },
    conj: (par,child) => { return par.appendChild(child); },
    byTag: (tag, ns) => {
      return !is.str(ns) ? document.getElementsByTagName(id)
                         : document.getElementsByTagNameNS(ns,tag); },
    attrs: function(e, attrs) {
      if(!is.obj(attrs) && attrs) {
        if(arguments.length > 2)
          e.setAttribute(attrs, arguments[2]);
        return e.getAttribute(attrs);
      }
      if(attrs)
        _.doseq(attrs, (v,k) => { e.setAttribute(k,v); });
      return e;
    },
    css: function(e, styles) {
      if(!is.obj(styles) && styles) {
        if(arguments.length > 2)
          e.style[styles]= arguments[2];
        return e.style[styles];
      }
      if(styles)
        _.doseq(styles, (v,k) => { e.style[k]= v; });
      return e;
    },
    wrap: function(child,wrapper) {
      let p=child.parentNode;
      wrapper.appendChild(child);
      p.appendChild(wrapper);
      return wrapper;
    },
    newElm: function(tag, attrs, styles) {
      let e = document.createElement(tag);
      this.attrs(e,attrs);
      this.css(e,styles);
      return e;
    },
    newTxt: function(tag, attrs, styles) {
      let e = document.createTextNode(tag);
      this.attrs(e,attrs);
      this.css(e,styles);
      return e;
    }
  };

  const EventBus= () => {
    let _tree= _.jsMap();
    return {
      sub: function(event,target,cb,ctx) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.sub.apply(this, e); });
        } else {
          //handle multiple events in one string
          _.seq(event).forEach(e => {
            if (!cb) cb=e;
            if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
            if(!cb) throw "Error: no callback for sub()";
            if(!_tree.has(target)) _tree.set(target, _.jsMap());
            let m= _tree.get(target);
            !m.has(e) && m.set(e,[]);
            m.get(e).push([cb,ctx]);
          });
        }
      },
      pub: function(event,target,data) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.pub.apply(this, e); });
        } else {
          let m,t= _tree.get(target);
          if(t)
            _.seq(event).forEach(e => {
              if(m= t.get(e))
                m.forEach(s => s[0].call(s[1],data));
            });
        }
      },
      unsub: function(event,target,cb,ctx) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.unsub.apply(this, e); });
        } else {
          let ss,
            es=_.seq(event),
            t= _tree.get(target);
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
        }
      }
    };
  };

  //exports---------------------------------------------------------------------
  MojoH5.Core=function(self) {
    self.EventBus= EventBus;
    self.u= _;
    self.is=is;
    self.dom=dom;
    return self;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

