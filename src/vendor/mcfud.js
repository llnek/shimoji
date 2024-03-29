!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);
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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(window,doco,seed_rand,UNDEF){

  "use strict";

  if(typeof module=="object" && module.exports){
    seed_rand=require("../tpcl/seedrandom.min")
  }else{
    doco=window.document
  }

  /**Create the module.
  */
  function _module(){

    const root=window,
          int=Math.floor,
          Slicer=Array.prototype.slice,
          toStr=Object.prototype.toString;

    function isObj(obj){ return toStr.call(obj) == "[object Object]" }
    function isObject(obj){ return isObj(obj) }
    function isNil(obj){ return toStr.call(obj) == "[object Null]" }
    function isFun(obj){ return toStr.call(obj) == "[object Function]" }
    function isVec(obj){ return toStr.call(obj) == "[object Array]" }
    function isMap(obj){ return toStr.call(obj) == "[object Map]" }
    function isSet(obj){ return toStr.call(obj) == "[object Set]" }
    function isStr(obj){ return toStr.call(obj) == "[object String]" }
    function isNum(obj){ return toStr.call(obj) == "[object Number]" }
    function isBool(obj){ return toStr.call(obj) == "[object Boolean]" }
    function isEven(n){ return (n<0?-n:n)%2 == 0 }
    function isUndef(o){ return o===undefined }
    function isColl(o){ return isVec(o)||isMap(o)||isObj(o) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source from https://developer.mozilla.org
    function completeAssign(target, source){
      let descriptors = Object.keys(source).reduce((acc, key)=>{
        acc[key] = Object.getOwnPropertyDescriptor(source, key);
        return acc;
      }, {});
      // By default, Object.assign copies enumerable Symbols, too
      Object.getOwnPropertySymbols(source).forEach(sym=>{
        let d= Object.getOwnPropertyDescriptor(source, sym);
        if(d.enumerable)
          descriptors[sym] = d;
      });
      return Object.defineProperties(target, descriptors);
    }

    /**
     * @module mcfud/core
     */

    const GOLDEN_RATIO=1.6180339887;
    const PRNG=(function(){
      if(seed_rand)
        return seed_rand();
      if(Math.seedrandom)
        return new Math.seedrandom();
      return function(){ return Math.random() }
    })();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _randXYInclusive(min,max){
      return min + int(PRNG() * (max-min+1))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _preAnd(conds,msg){
      conds.forEach(c=>{
        if(!c[0](c[1]))
          throw new TypeError(`wanted ${msg}`)
      });
      return true
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _preOr(conds,msg){
      for(let c,i=0;i<conds.length;++i){
        c=conds[i];
        if(c[0](c[1])){return true}
      }
      throw new TypeError(`wanted ${msg}`)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _pre(f,arg,msg){
      if(!f(arg))
        throw new TypeError(`wanted ${msg}`);
      return true
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //-- regex handling file names
    const BNAME=/(\/|\\\\)([^(\/|\\\\)]+)$/g;
    //-- regex handling file extensions
    const FEXT=/(\.[^\.\/\?\\]*)(\?.*)?$/;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _fext(path,incdot){
      let t=FEXT.exec(path);
      if(t && t[1]){
        t= t[1].toLowerCase();
        if(!incdot) t=t.substring(1);
      }else{ t="" }
      return t;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _everyF(F,_1,args){
      const b=F(_1);
      switch(args.length){
        case 0: return b;
        case 1: return b && F(args[0]);
        case 2: return b && F(args[0]) && F(args[1]);
        case 3: return b && F(args[0]) && F(args[1]) && F(args[2]);
        default: return b && args.every(x => F(x));
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const EPSILON= 0.0000000001;
    let _seqNum= 0;
    const _$={};

    /** @namespace module:mcfud/core.is */
    const is={
      /**Check if input(s) are type `function`.
       * @memberof module:mcfud/core.is
       * @param {any} f anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      fun(f, ...args){ return _everyF(isFun,f,args) },
      /**Check if input(s) are type `string`.
       * @memberof module:mcfud/core.is
       * @param {any} s anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      str(s, ...args){ return _everyF(isStr,s,args) },
      //void0(obj){ return obj === void 0 },
      /**Check if input(s) are type `undefined`.
       * @memberof module:mcfud/core.is
       * @param {any} obj anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      undef(o, ...args){ return _everyF(isUndef,o,args) },
      /**Check if input(s) are type `Map`.
       * @memberof module:mcfud/core.is
       * @param {any} m anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      map(m, ...args){ return _everyF(isMap,m,args) },
      /**Check if input(s) are type `Set`.
       * @memberof module:mcfud/core.is
       * @param {any} m anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      set(s, ...args){ return _everyF(isSet,s,args) },
      /**Check if input(s) are type `number`.
       * @memberof module:mcfud/core.is
       * @param {any} n anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      num(n, ...args){ return _everyF(isNum,n,args) },
      /**Check if input is a boolean.
       * @memberof module:mcfud/core.is
       * @param {boolean} n
       * @return {boolean}
       */
      bool(n, ...args){ return _everyF(isBool,n,args) },
      /**Check if input is a positive number.
       * @memberof module:mcfud/core.is
       * @param {number} n
       * @return {boolean}
       */
      pos(n){ return isNum(n)&&n>0 },
      /**Check if input is a negative number.
       * @memberof module:mcfud/core.is
       * @param {number} n
       * @return {boolean}
       */
      neg(n){ return isNum(n)&&n<0 },
      /**Check if input(s) are type `array`.
       * @memberof module:mcfud/core.is
       * @param {any} v anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      vec(v, ...args){ return _everyF(isVec,v,args) },
      /**Check if input(s) are type `object`.
       * @memberof module:mcfud/core.is
       * @param {any} o anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      obj(o, ...args){ return _everyF(isObj,o,args) },
      /**Check if this collection is `not empty`.
       * @memberof module:mcfud/core.is
       * @param {object|array|map} o
       * @return {boolean}
       */
      notEmpty(o){ return _.size(o) > 0 },
      /**Check if this collection is `empty`.
       * @memberof module:mcfud/core.is
       * @param {object|array|map} o
       * @return {boolean}
       */
      isEmpty(o){ return _.size(o) == 0 },
      /**Check if this property belongs to this object.
       * @memberof module:mcfud/core.is
       * @param {object} o
       * @param {string} p name of the property
       * @return {boolean}
       */
      own(o,p){ return Object.prototype.hasOwnProperty.call(o,p) }
    };

    /** @namespace module:mcfud/core._ */
    const _={
      /** error message */
      error(...args){ console.error(...args) },
      /** log message */
      log(...args){ console.log(...args) },
      /**Check if this float approximates zero.
       * @memberof module:mcfud/core._
       * @param {number} a
       * @return {boolean}
       */
      feq0(a){
        return a >= -EPSILON && a <= EPSILON;
      },
      /**Check if these 2 floats are equal.
       * @memberof module:mcfud/core._
       * @param {number} a
       * @param {number} b
       * @param {number} diff [EPSILON]
       * @return {boolean}
       */
      feq(a, b, diff=EPSILON){
        //return Math.abs(a-b) < EPSILON
        return a >= b-diff && a <= b+diff;
      },
      /**Convert hex string to binary string.
       * @memberof module:mcfud/core._
       * @param {string} s
       * @return {string} binary str
       */
      hexToBin(s){
        const Table = {
          "0": "0000", "1": "0001", "2": "0010", "3": "0011", "4": "0100",
          "5": "0101", "6": "0110", "7": "0111", "8": "1000", "9": "1001",
          "a": "1010", "b": "1011", "c": "1100", "d": "1101", "e": "1110", "f": "1111",
          "A": "1010", "B": "1011", "C": "1100", "D": "1101", "E": "1110", "F": "1111"
        };
        let ret="";
        for(let n,i=0; i<s.length; ++i){
          if(n=Table[s[i]]){
            ret += n;
          }else{
            i=Infinity;
            ret=UNDEF;
          }
        }
        return ret;
      },
      /**Serialize input to JSON.
       * @memberof module:mcfud/core._
       * @param {any} o anything
       * @return {string} JSON string
       */
      pack(o){ return JSON.stringify(o) },
      /**Deserialize from JSON.
       * @memberof module:mcfud/core._
       * @param {string} input
       * @return {any} valid js data
       */
      unpack(s){ return JSON.parse(s) },
      /**Package x,y as a tuple.
       * @memberof module:mcfud/core._
       * @param {number} x
       * @param {number} y
       * @return {number[]} [x,y]
       */
      v2(x=0,y=0){ return [x,y] },
      /**Package x,y as an object.
       * @memberof module:mcfud/core._
       * @param {number} x
       * @param {number} y
       * @return {object} {x,y}
       */
      p2(x=0,y=0){ return {x, y} },
      /**Unless n is a number, return it else 0.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @return {number} n or 0
       */
      numOrZero(n){ return isNaN(n) ? 0 : n },
      /**Set values to array.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @param {...any} args
       * @return {array} a
       */
      setVec(a, ...args){
        args.forEach((v,i)=> a[i]=v);
        return a;
      },
      /**If not even, make it even.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @return {number}
       */
      evenN(n,dir){
        n=int(n);
        return isEven(n)?n:(dir?n+1:n-1) },
      /**Check if a is null or undefined - `not real`.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @return {boolean}
       */
      nichts(a){return a===undefined||a===null},
      /**Check if a is not null and not undefined.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @return {boolean}
       */
      echt(a){return a!==undefined&&a!==null},
      /**If a is `not-real` return b.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @param {any} b
       * @return {any}
       */
      nor(a,b){ return a===undefined||a===null?b:a },
      /**If a is `undefined` return b.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @param {any} b
       * @return {any}
       */
      or(a,b){ return a===undefined?b:a },
      /**Coerce input into a number, if not return the default.
       * @memberof module:mcfud/core._
       * @param {string} input
       * @param {number} dft
       * @return {number}
       */
      toNum(s,dft){
        const n=parseFloat(s);
        return (isNaN(n) && isNum(dft)) ? dft : n;
      },
      /**How mych left as a ratio.
       * @memberof module:mcfud/core._
       * @param {number} amt
       * @param {number} total
       * @return {number}
       */
      percentRemain(amt, total, wrap){
        if(amt>total){
          amt= wrap ? amt%total : total
        }
        return Math.max(0,total-amt)/total;
      },
      /**Break version string into `Major.Minor.Patch`.
       * @memberof module:mcfud/core._
       * @param {string} s
       * @return {number[]} [major,minor,patch]
       */
      splitVerStr(s){
        const arr=(""+(s || "")).split(".").filter(s=> s.length>0);
        return [this.toNum(arr[0],0),
                this.toNum(arr[1],0),
                this.toNum(arr[2],0)]
      },
      /**Compare 2 version strings, like a standard comparator.
       * @memberof module:mcfud/core._
       * @param {string} v1
       * @param {string} v2
       * @return {number} -1 is less, +1 is greater, 0 is same.
       */
      cmpVerStrs(v1,v2){
        let a1= this.splitVerStr(""+v1);
        let a2= this.splitVerStr(""+v2);
        if(a1[0] > a2[0]) return 1;
        else if(a1[0] < a2[0]) return -1;
        if(a1[1] > a2[1]) return 1;
        else if(a1[1] < a2[1]) return -1;
        if(a1[2] > a2[2]) return 1;
        else if(a1[2] < a2[2]) return -1;
        return 0;
      },
      /**
      * @ignore
      */
      pdef(obj){
        return (obj.configurable=true) && (obj.enumerable=true) && obj
      },
      /**Look for files matching any one of these extensions.
       * @memberof module:mcfud/core._
       * @param {string[]} list of file paths
       * @param {string[]} list of file extensions
       * @return {string[]} matching files
       */
      findFiles(files, exts){
        return files.filter(s=> exts.indexOf(_fext(s,1)) > -1)
      },
      /**Items in a as keys, mapped to items in b as values.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @param {array} b
       * @param {Map} out [undefined]
       * @return {Map}
       */
      zipMap(a,b,out=UNDEF){
        let n=Math.min(a.length,b.length),
            i,m= out || new Map();
        for(i=0;i<n;++i){
          m.set(a[i],b[i])
        }
        return m;
      },
      /**Items in a as keys, mapped to items in b as values.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @param {array} b
       * @param {Map} out [undefined]
       * @return {Map}
       */
      zip(a,b,out=UNDEF){
        return this.zipMap(a,b,out)
      },
      /**Items in a as keys, mapped to items in b as values.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @param {array} b
       * @param {Object} out [undefined]
       * @return {Object}
       */
      zipObj(a,b,out=UNDEF){
        let n=Math.min(a.length,b.length),
            i,m= out || {};
        for(i=0;i<n;++i){
          m[a[i]]= b[i];
        }
        return m;
      },
      /**Chop input into chunks of `count` items.
       * @memberof module:mcfud/core._
       * @param {number} count number of items in each chunk
       * @param {any[]} arr list of items
       * @return {any[][]}
       */
      partition(count,arr){
        const out=[];
        for(let row,j,i=0;;){
          row=[];
          for(j=0;j<count;++j){
            if(i<arr.length){
              row.push(arr[i++]);
            }else{
              j=-1; break; }
          }
          if(row.length>0) out.push(row);
          if(j<0) break;
        }
        return out;
      },
      /**Get keys of object/map.
       * @memberof module:mcfud/core._
       * @param {object|map} o
       * @return {string[]}
       */
      keys(o){
        return isMap(o) ? Array.from(o.keys())
                        : (isObj(o) ? Object.keys(o) : [])
      },
      /**Clone object/map but exclude these keys.
       * @memberof module:mcfud/core._
       * @param {object|map} c
       * @param {string[]} keys to exclude
       * @return {object|map}
       */
      selectNotKeys(c,keys){
        _preOr([[isMap,c],[isObj,c]],"map/object");
        const out= isMap(c) ? new Map() : {};
        keys=this.seq(keys);
        this.doseq(c,(v,k)=> (!keys.includes(k)) && this.assoc(out,k,v));
        return out;
      },
      /**Choose these keys from object/map.
       * @memberof module:mcfud/core._
       * @param {object|map} c
       * @param {string[]} keys to copy
       * @return {object|map}
       */
      selectKeys(c,keys){
        _preOr([[isMap,c],[isObj,c]],"map/object");
        const out= isMap(c) ? new Map() : {};
        this.seq(keys).forEach(k=>{
          if(isMap(c)){
            c.has(k) && out.set(k, c.get(k));
          }else if(is.own(c,k)){ out[k]=c[k] }
        });
        return out;
      },
      /**Copy these keys from object/map.
       * @memberof module:mcfud/core._
       * @param {object|map} des
       * @param {object|map} src
       * @param {string[]} keys to copy
       * @return {object|map} des
       */
      copyKeys(des,src,keys){
        _preOr([[isMap,des],[isObj,des]],"map/object");
        if(src instanceof Map)
          _.assert(des instanceof Map, "expected Map");
        this.seq(keys).forEach(k=>{
          if(isMap(src)){
            src.has(k) && des.set(k, src.get(k));
          }else if(is.own(src,k)){
            des[k]=src[k]
          }else if(src[k] !== undefined){
            des[k]=src[k];
          }
        });
        return des;
      },
      /**Set a value to many keys
       * @memberof module:mcfud/core._
       * @param {object|map} c
       * @param {string[]} keys to be set
       * @param {any} v
       * @return {object|map} c
       */
      setManyKeys(c,keys,v){
        _preOr([[isMap,c],[isObj,c]],"map/object");
        this.seq(keys).forEach(k=>{
          if(isMap(c)){
            c.set(k, v)
          }else{
            c[k]=v
          }
        });
        return c;
      },
      /**Clear out these keys
       * @memberof module:mcfud/core._
       * @param {object|map} c
       * @param {string[]} keys to be removed
       * @return {object|map} c
       */
      clearKeys(c,keys){
        _preOr([[isMap,c],[isObj,c]],"map/object");
        this.seq(keys).forEach(k=>{
          if(isMap(c)){
            c.delete(k)
          }else{
            delete c[k]
          }
        });
        return c;
      },
      /**Assert that the condition is not true.
       * @memberof module:mcfud/core._
       * @param {any} a boolean expression
       * @param {...any} anything
       * @throws Error if condition is true
       * @return {boolean} true
       */
      assertNot(cond, ...args){
        return this.assert(!cond,...args)
      },
      /**Assert that the condition is true.
       * @memberof module:mcfud/core._
       * @param {any} a boolean expression
       * @param {...any} anything
       * @throws Error if condition is false
       * @return {boolean} true
       */
      assert(cond, ...args){
        if(!cond)
          throw args.length==0 ? "Assertion!" : args.join("");
        return true;
      },
      /**Check if target has none of these keys.
       * @memberof module:mcfud/core._
       * @param {string[]} keys to test
       * @param {object|map} target
       * @return {boolean}
       */
      noSuchKeys(keys,target){
        return !this.some(this.seq(keys),k=> this.has(target,k)?k:null)
      },
      /**Get a random int between min and max (inclusive).
       * @memberof module:mcfud/core._
       * @param {number} min
       * @param {number} max
       * @return {number}
       */
      randInt2(min,max){
        return min + int(PRNG() * (max-min+1)) },
      /**Get a random float between min and max (exclude max).
       * @memberof module:mcfud/core._
       * @param {number} min
       * @param {number} max
       * @return {number}
       */
      randFloat2(min, max){
        return min + PRNG() * (max-min)
      },
      /**Get a random float between -1 and 1.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      randMinus1To1(){ return 2*(PRNG()-0.5) },
      /**Get a random int between 0 and num.
       * @memberof module:mcfud/core._
       * @param {number} num
       * @return {number}
       */
      randInt(num){ return int(PRNG()*num) },
      /**Get a random float between 0 and 1.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      rand(js=false){ return js? Math.random(): PRNG() },
      /**Returns a random number fitting a Gaussian, or normal, distribution.
       * @param {number} v number of times rand is summed, should be >= 1
       * @return {number}
       */
      randGaussian(v=6){
        //adding a random value to the last increases the variance of the random numbers.
        //Dividing by the number of times you add normalises the result to a range of 0–1
        let i,r=0;
        for(i=0; i<v; ++i) r += this.rand();
        return r/v;
      },
      randSign(){ return PRNG()>0.5 ? -1 : 1 },
      /**Divide into 2 parts based on golden-ratio.
       * @memberof module:mcfud/core._
       * @param {number} len
       * @return {array} [a,b]
       */
      toGoldenRatio(len){
        let a= len / GOLDEN_RATIO,
            b= a / GOLDEN_RATIO;
        return [this.rounded(a),this.rounded(b)];
      },
      /**Check if obj is a sub-class of this parent-class.
       * @memberof module:mcfud/core._
       * @param {class} type
       * @param {object} obj
       * @return {boolean}
       */
      inst(type,obj){ return obj instanceof type },
      /**Calculate the hashCode of this string, like java's hashCode.
       * @memberof module:mcfud/core._
       * @param {string} s
       * @return {number}
       */
      hashCode(s){
        let i,n=0;
        for(i=0; i<s.length; ++i)
          n= Math.imul(31, n) + s.charCodeAt(i)
        return n;
      },
      /**Clear array.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @return {array} a
       */
      cls(a){
        try{ a.length=0 }catch(e){}
        return a;
      },
      /**Randomly choose n items from this array.
       * @memberof module:mcfud/core._
       * @param {any[]} arr
       * @param {number} howMany
       * @return {array} the samples
       */
      randSample(arr,n=1){
        let a,ret;
        if(n==1){
          ret= [this.randItem(arr)]
        }else if(n==0){
          ret=[]
        }else if(n>0){
          a= this.shuffle(arr,false);
          ret = n>=a.length ? a : a.slice(0,n);
        }
        return ret;
      },
      /**Randomly choose an item from this array.
       * @memberof module:mcfud/core._
       * @param {any[]} arr
       * @param {boolean} wantIndex [false]
       * @return {any}
       */
      randItem(arr,wantIndex=false){
        let rc,i= -1;
        if(arr){
          switch(arr.length){
            case 0:
            case 1:
              rc=arr[i=0];
              break;
            case 2:
              rc= arr[i= this.randSign()>0?1:0];
              break;
            default:
              rc= arr[i= (int(PRNG()*arr.length))];
          }
        }
        return wantIndex ? [rc,i] : rc;
      },
      /**Check if string represents a percentage value.
       * @memberof module:mcfud/core._
       * @param {string} s
       * @return {boolean}
       */
      isPerc(s){
        return isStr(s) && s.match(/^([0-9])(\.?[0-9]+|[0-9]*)%$/)
      },
      /**Check if number is even.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @return {boolean}
       */
      isEven(n){ return isEven(n) },
      /**Creates a javascript Map.
       * @memberof module:mcfud/core._
       * @param {...any} args data to initialize the Map
       * @return {map}
       */
      jsMap(...args){
        _pre(isEven,args.length,"even n# of args");
        let i,out=new Map();
        for(i=0;i<args.length;){
          out.set(args[i],args[i+1]); i+=2; }
        return out;
      },
      /**Creates a javascript object.
       * @memberof module:mcfud/core._
       * @param {...any} args data to initialie the object
       * @return {object}
       */
      jsObj(...args){
        _pre(isEven,args.length,"even n# of args");
        let i,out={};
        for(i=0;i<args.length;){
          out[args[i]]=args[i+1]; i+=2; }
        return out;
      },
      /**Creates a javascript array.
       * @memberof module:mcfud/core._
       * @param {...any} args data to initialize array
       * @return {any[]}
       */
      jsVec(...args){ return args.length==0 ? [] : args.slice() },
      /**Get the last index.
       * memberof module:mcfud/core._
       * @param {any[]} c
       * @return {number} -1 if c is empty or not an array
       */
      lastIndex(c){ return (isVec(c) && c.length>0) ? c.length-1 : -1 },
      /**Get the first element.
       * @memberof module:mcfud/core._
       * @param {any[]} c
       * @return {any} undefined if c is empty or not an array
       */
      first(c){ if(isVec(c) && c.length>0) return c[0] },
      /**Get the last element.
       * @memberof module:mcfud/core._
       * @param {any[]} c
       * @return {any} undefined if c is empty or not an array
       */
      last(c){ if(isVec(c) && c.length>0) return c[c.length-1] },
      /**
       * @memberof module:mcfud/core._
       * @see {@link module:mcfud/core._.first}
       */
      head(c){ return this.first(c) },
      /**
       * @memberof module:mcfud/core._
       * @see {@link module:mcfud/core._.last}
       */
      tail(c){ return this.last(c) },
      /**Get the floor of a number.
       * @memberof module:mcfud/core._
       * @param {number} v
       * @return {number}
       */
      floor(v){ return Math.floor(v) },
      /**Get the ceiling of a number.
       * @memberof module:mcfud/core._
       * @param {number} v
       * @return {number}
       */
      ceil(v){ return Math.ceil(v) },
      /**Get the absolute value of a number.
       * @memberof module:mcfud/core._
       * @param {number} v
       * @return {number}
       */
      abs(v){ return Math.abs(v) },
      /**Get the square root of a number.
       * @memberof module:mcfud/core._
       * @param {number} v
       * @return {number}
       */
      sqrt(v){ return Math.sqrt(v) },
      /**Choose min value from these numbers.
       * @memberof module:mcfud/core._
       * @param {...number} args
       * @return {number}
       */
      min(...args){ return Math.min(...args) },
      /**Choose max value from these numbers.
       * @memberof module:mcfud/core._
       * @param {...number} args
       * @return {number}
       */
      max(...args){ return Math.max(...args) },
      /**Take a slice of an array.
       * @memberof module:mcfud/core._
       * @param {any[]} a source
       * @param {number} i start index
       * @return {any[]}
       */
      slice(a,i){ return Slicer.call(a, i) },
      /**Check if *every* item in the list equals v.
       * @memberof module:mcfud/core._
       * @param {any[]} c
       * @param {any|function} v
       * @return {boolean}
       */
      every(c,v){
        _pre(isVec,c,"array");
        for(let i=0;i<c.length;++i){
          if(isFun(v)){
            if(!v(c[i])) return false;
          }else if(c[i] != v) return false;
        }
        return c.length>0;
      },
      /**Check if *every* item in the list not-equals v.
       * @memberof module:mcfud/core._
       * @param {array} c
       * @param {any|function} v
       * @return {boolean}
       */
      notAny(c,v){
        _pre(isVec,c,"array");
        for(let i=0;i<c.length;++i){
          if(isFun(v)){
            if(v(c[i])) return false;
          }else if(c[i] === v) return false;
        }
        return c.length>0;
      },
      /**Copy all or some items from `src` to `des`.
       * Does not *grow* the `des` array.
       * @memberof module:mcfud/core._
       * @param {any[]} des
       * @param {any[]} src
       * @return {any[]}
       */
      copy(des,src=[]){
        _preAnd([[isVec,des],[isVec,src]],"arrays");
        let i,len= Math.min(des.length,src.length);
        for(i=0;i<len;++i) des[i]=src[i];
        return des;
      },
      /**Append all or some items from `src` to `des`.
       * @memberof module:mcfud/core._
       * @param {any[]} des
       * @param {any[]} src
       * @param {boolean} reset false
       * @return {any[]}
       */
      append(des,src=[],reset=false){
        _preAnd([[isVec,des],[isVec,src]],"arrays");
        if(reset) des.length=0;
        for(let i=0;i<src.length;++i) des.push(src[i]);
        return des;
      },
      /**Fill array with v.
       * @memberof module:mcfud/core._
       * @param {number|any[]} a if number, creates array of `a` size
       * @param {number|function} v
       * @return {any[]}
       */
      fill(a,v, ...args){
        if(isNum(a)){a= new Array(a)}
        if(isVec(a))
          for(let i=0;i<a.length;++i)
            a[i]= isFun(v) ? v(i,...args) : v;
        return a;
      },
      /**Get the size of this input.
       * @memberof module:mcfud/core._
       * @param {object|array|string|map|set} o
       * @return {number}
       */
      size(o){
        return (isVec(o)||isStr(o)) ? o.length
                                    : (isSet(o)||isMap(o)) ? o.size : o ? this.keys(o).length : 0
      },
      /**Get the next sequence number.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      nextId(){ return ++_seqNum },
      /**Get the current time in millis.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      now(){ return Date.now() },
      /**Find the file extension.
       * @memberof module:mcfud/core._
       * @param {string} path
       * @return {string}
       */
      fileExt(path){ return _fext(path) },
      /**Find the file name, no extension.
       * @memberof module:mcfud/core._
       * @param {string} path
       * @return {string}
       */
      fileBase(path){
        let name,res,pos=path.indexOf("?");
        if(pos>0) path=path.substring(0,pos);
        path=path.replace(/(\/|\\\\)$/, "");
        res= BNAME.exec(path);
        name="";
        if(res){
          name=res[2];
          pos=name.lastIndexOf(".");
          if(pos>0) name=name.substring(0,pos);
        }
        return name;
      },
      /**Create a list of numbers from start to end,
       * like a `Range` object.
       * @memberof module:mcfud/core._
       * @param {number} start
       * @param {number} stop
       * @param {number} step
       * @return {number[]}
       */
      range(start,stop,step=1){
        if(arguments.length==1){
          stop=start; start=0; step=1; }
        let len = (stop-start)/step;
        const res=[];
        len= Math.ceil(len);
        len= Math.max(0,len);
        res.length=len;
        for(let i=0;i<len;++i){
          res[i] = start;
          start += step;
        }
        return res;
      },
      /**Shuffle items in this array.
       * @memberof module:mcfud/core._
       * @param {any[]} obj
       * @param {boolean} inplace true by default
       * @return {any[]}
       */
      shuffle(obj,inplace=true){
        _pre(isVec,obj,"array");
        const res=Slicer.call(obj,0);
        switch(res.length){
          case 0:
          case 1:
            break;
          case 2:
            if(this.randSign()>0){
              let a=res[0];
              res[0]=res[1];
              res[1]=a;
            }
            break;
          default:
            for(let x,j,i= res.length-1; i>0; --i){
              j= int(PRNG() * (i+1));
              x= res[i];
              res[i] = res[j];
              res[j] = x;
            }
        }
        return inplace?this.copy(obj,res):res;
      },
      shuffle2(obj,inplace=true){
        _pre(isVec,obj,"array");
        const res=Slicer.call(obj,0);
        switch(res.length){
          case 0:
          case 1:
            break;
          case 2:
            if(this.randSign()>0){
              let a=res[0];
              res[0]=res[1];
              res[1]=a;
            }
            break;
          default:
            for(let s,r,i=0,n=res.length; i<n; ++i){
              // choose index uniformly in [i, n-1]
              r = i + int(PRNG() * (n - i));
              s= res[r];
              res[r] = res[i];
              res[i] = s;
            }
        }
        return inplace?this.copy(obj,res):res;
      },
      shuffle3(obj,inplace=true){
        let a= inplace? obj : Slicer.call(obj,0);
        return a.sort((x,y)=> this.rand()>0.5?-1:(this.rand()>0.5?1:0))
      },
      /**Get the distinct items only.
       * @memberof module:mcfud/core._
       * @param {any[]} arr
       * @return {any[]}
       */
      uniq(arr){
        _pre(isVec,arr,"array");
        if(false){
          let prev,res= [];
          Slicer.call(arr).sort().forEach(a=>{
            if(a !== undefined &&
               a !== prev) res.push(a);
            prev = a;
          });
          return res;
        }
        //faster?
        return Array.from(new Set(arr));
      },
      /**Functional map but return same type as `obj`.
       * @memberof module:mcfud/core._
       * @param {object|map|array} obj
       * @param {callback} fn
       * @param {any} target context for `fn`
       * @return {object|map|array}
       */
      map(obj, fn, target){
        _pre(isColl,obj,"array/map/object");
        if(isVec(obj)){
          return obj.map(fn,target);
        }else{
          const res=isMap(obj)?new Map():{};
          this.doseq(obj,(v,k)=>{
            this.assoc(res,k,fn.call(target,v,k,obj))})
          return res;
        }
      },
      /**`find` with extra arguments.
       * @memberof module:mcfud/core._
       * @param {object|map|array} coll
       * @param {callback} fn
       * @param {any} target
       * @return {array} [key,value] or undefined
       */
      find(coll,fn,target){
        let res,
            cont=true,
            args=Slicer.call(arguments,3);
        this.doseq(coll, (v,k)=>{
          if(cont && fn.apply(target, [v,k].concat(args))){
            res=[k,v];
            cont=false;
          }
        });
        return res;
      },
      /**`some` with extra arguments.
       * @memberof module:mcfud/core._
       * @param {object|map|array} coll
       * @param {callback} fn
       * @param {any} target
       * @return {any} undefined if not found
       */
      some(coll,fn,target){
        let res,
            cont=true,
            args=Slicer.call(arguments,3);
        this.doseq(coll,(v,k)=>{
          if(cont){
            res=fn.apply(target, [v,k].concat(args));
            if(res) cont=false; else res=undefined;
          }
        });
        return res;
      },
      equals(a,b){
        if(isObject(a) && isObject(b)){
          let pa,ka= Object.keys(a);
          let pb,kb= Object.keys(b);
          if(ka.length==kb.length){
            for(let i=0;i<ka.length;++i){
              pa=ka[i];
              pb=kb[i];
              if(this.equals(pa,pb) &&
                 this.equals(a[pa],b[pb])){
                continue
              }
              return false;
            }
            return true;
          }
          return false;
        }
        if(isVec(a) && isVec(b)){
          if(a.length==b.length){
            for(let i=0;i<a.length;++i){
              if(!this.equals(a[i],b[i])) return false
            }
            return true;
          }
          return false;
        }
        if(isNum(a) && isNum(b)) return a==b;
        if(isStr(a) && isStr(b)) return a==b;
        if(isBool(a) && isBool(b)) return a==b;
        if(a===null && b===null) return true;
        if(a===undefined && b===undefined) return true;
        throw Error("cant call equals for these types");
      },
      /**Each item in the array is an object,
      * invoke obj.method with extra args.
      * @memberof module:mcfud/core._
      * @param {object[]} arr
      * @param {string} key method-name
      */
      invoke(arr,key){
        let args=Slicer.call(arguments,2);
        isVec(arr) &&
          //invoke the method on each object
          arr.forEach(o=> o[key].apply(o, args));
      },
      /**Run function after some delay.
       * @memberof module:mcfud/core._
       * @param {number} wait
       * @param {callback} f
       * @return {number} timeout id
       */
      delay(wait,f){ return setTimeout(f,wait) },
      /**Create a once/repeat timer.
       * @memberof module:mcfud/core._
       * @param {callback} f
       * @param {number} delay
       * @param {boolean} repeat default false
       * @return {object} timer handle, use handle.id to cancel
       */
      timer(f,delay=0,repeat=false){
        return {
          repeat: !!repeat,
          id: repeat ? setInterval(f,delay) : setTimeout(f,delay)
        };
      },
      /**Cancel a timer.
       * @memberof module:mcfud/core._
       * @param {object} handle
       */
      clear(handle){
        if(handle && handle.id){
          handle.repeat ? clearInterval(handle.id)
                        : clearTimeout(handle.id)
          handle.id=0;
        }else if(is.pos(handle)){
          clearTimeout(handle);
        }
      },
      /**Iterate n times, calling the provided function.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @param {callback} fn
       * @param {any} target
       * @param {...any} args
       */
      dotimes(n,fn,target, ...args){
        for(let i=0;i<n;++i)
          fn.call(target,i, ...args);
      },
      /**Iterate a collection(array) in reverse.
       * @memberof module:mcfud/core._
       * @param {any[]} coll
       * @param {callback} fn
       * @param {any} target
       */
      rseq(coll,fn,target){
        _pre(isVec,coll,"array");
        if(coll.length>0)
          for(let i=coll.length-1;i>=0;--i)
            fn.call(target, coll[i],i,coll)
      },
      /**Iterate a collection.
       * @memberof module:mcfud/core._
       * @param {object|map|array} coll
       * @param {callback} fn
       * @param {any} target
       */
      doseq(coll,fn,target){
        if(isVec(coll)){
          coll.forEach(fn,target)
        }else if(isMap(coll)){
          coll.forEach((v,k)=> fn.call(target,v,k,coll))
        }else if(isObj(coll)){
          Object.keys(coll).forEach(k=> fn.call(target, coll[k], k, coll))
        }
      },
      /**Iterate but ignore nulls/undefs.
       * @memberof module:mcfud/core._
       * @see {@link module:mcfud/core._.doseq}
       */
      doseqEx(coll,fn,target){
        this.doseq(coll,(v,k)=>
          v!==undefined&&v!==null&&fn.call(target,v,k,coll))
      },
      /**Remove a key from collection.
       * @memberof module:mcfud/core._
       * @param {map|object} coll
       * @param {string} key
       * @return {any} previous value
       */
      dissoc(coll,key){
        if(arguments.length>2){
          let prev,i=1;
          for(;i<arguments.length;++i)
            prev=this.dissoc(coll,arguments[i]);
          return prev;
        }else{
          let prev;
          if(isMap(coll)){
            prev=coll.get(key);
            coll.delete(key);
          }else if(isObj(coll)){
            prev= coll[key];
            delete coll[key];
          }
          return prev;
        }
      },
      /**Get the value of property `key`.
       * @memberof module:mcfud/core._
       * @param {object|map} coll
       * @param {string} key
       * @return {any} undefined if not found
       */
      get(coll,key){
        if(key !== undefined){
          if(isMap(coll)) return coll.get(key);
          else if(coll) return coll[key];
        }
      },
      /**Assign value to property `key`.
       * @memberof module:mcfud/core._
       * @param {map|object} coll
       * @param {string} key
       * @param {any} value
       * @return {any} previous value
       */
      assoc(coll,key,value){
        if(arguments.length>3){
          if(((arguments.length-1)%2) !== 0)
            throw "wanted even count of args";
          let prev, i=1;
          for(;i<arguments.length;){
            prev= this.assoc(coll,arguments[i],arguments[i+1]);
            i+=2;
          }
          return prev;
        }else{
          let prev;
          if(isMap(coll)){
            prev=coll.get(key);
            coll.set(key,value);
          }else if(coll){
            prev=coll[key];
            coll[key]=value;
          }
          return prev;
        }
      },
      /**Remove an item from this array.
       * @memberof module:mcfud/core._
       * @param {any[]} coll
       * @param {any} item
       * @return {boolean} true if removed
       */
      disj(coll,item){
        const i = coll ? coll.indexOf(item) : -1;
        if(i > -1) coll.splice(i,1);
        return i > -1;
      },
      /**Append item to array.
       * @memberof module:mcfud/core._
       * @param {any[]} coll
       * @param {...any} items
       * @return {any[]} coll
       */
      conj(coll, ...items){
        if(coll)
          items.forEach(o=> coll.push(o));
        return coll;
      },
      /**Make input-string into array.
       * @memberof module:mcfud/core._
       * @param {string} arg
       * @param {string|regex} sep
       * @return {any[]}
       */
      seq(arg,sep=/[,; \t\n]+/){
        if(typeof arg == "string")
          arg= arg.split(sep).map(s=>s.trim()).filter(s=>s.length>0);
        if(!isVec(arg)){arg = [arg]}
        return arg;
      },
      /**Check if collection has property `key`.
       * @memberof module:mcfud/core._
       * @param {array|map|object} coll
       * @param {any} key
       * @return {boolean}
       */
      has(coll,key){
        return arguments.length==1 ? false
          : isMap(coll) ? coll.has(key)
          : isVec(coll) ? coll.indexOf(key) != -1
          : isObj(coll) ? is.own(coll, key) : false;
      },
      /**Add keys to `des` only if that key is absent.
       * @memberof module:mcfud/core._
       * @param {map|object} des
       * @param {object} additions
       * @return {map|object}
       */
      patch(des,additions){
        _pre(isObj,(des=des||{}),"object");
        if(additions)
          Object.keys(additions).forEach(k=>{
            if(!this.has(des,k))
              des[k]=additions[k];
          });
        return des;
      },
      /**Deep clone.
       * @memberof module:mcfud/core._
       * @param {any} obj
       * @return {any} obj's clone
       */
      clone(obj){
        return obj ? this.unpack(this.pack(obj)) : obj
      },
      /**Merge other objects into `des`.
       * @memberof module:mcfud/core._
       * @param {object} des
       * @param {...object} args
       * @return {object}
       */
      inject(des, ...args){
        des=des || {};
        args.forEach(s=> s && completeAssign(des,s));
        return des;
      },
      /**Deep copy of array/nested arrays.
       * @memberof module:mcfud/core._
       * @param {any[]} v
       * @return {any[]}
       */
      deepCopyArray(v){
        _pre(isVec,v,"array");
        let i,z,out = [];
        for(i=0,z=v.length; i<z; ++i)
          out[i]= isVec(v[i]) ? this.deepCopyArray(v[i]) : v[i];
        return out;
      },
      /**Deep merge of 2 objects.
       * @memberof module:mcfud/core._
       * @param {object} original
       * @param {object} extended
       * @return {object} a new object
      */
      mergeEx(original, extended){
        return this.merge(this.merge({}, original), extended)
      },
      /**Deep merge of 2 objects in-place.
       * @memberof module:mcfud/core._
       * @param {object} original
       * @param {object} extended
       * @return {object} the modified original object
      */
      merge(original, extended){
        let key,ext;
        Object.keys(extended).forEach(key=>{
          ext= extended[key];
          if(typeof ext != "object" || ext === null || !original[key]){
            original[key] = ext;
          }else{
            if(typeof original[key] != "object"){
              original[key] = ext instanceof Array ? [] : {}
            }
            this.merge(original[key], ext);
          }
        });
        return original;
      },
      /**
       * Creates a throttled function that only invokes `func` at most once per
       * every `wait` milliseconds (or once per browser frame). The throttled function
       * comes with a `cancel` method to cancel delayed `func` invocations and a
       * `flush` method to immediately invoke them. Provide `options` to indicate
       * whether `func` should be invoked on the leading and/or trailing edge of the
       * `wait` timeout. The `func` is invoked with the last arguments provided to the
       * throttled function. Subsequent calls to the throttled function return the
       * result of the last `func` invocation.
       */
      //original source: https://github.com/lodash/lodash/throttle.js
      throttle(func, wait, options){
        let leading = true
        let trailing = true

        if (typeof func !== 'function') {
          throw new TypeError('Expected a function')
        }
        if (isObj(options)) {
          leading = 'leading' in options ? !!options.leading : leading
          trailing = 'trailing' in options ? !!options.trailing : trailing
        }
        return this.debounce(func, wait, {
          leading,
          trailing,
          'maxWait': wait
        })
      },
      /**
       * Creates a debounced function that delays invoking `func` until after `wait`
       * milliseconds have elapsed since the last time the debounced function was
       * invoked, or until the next browser frame is drawn. The debounced function
       * comes with a `cancel` method to cancel delayed `func` invocations and a
       * `flush` method to immediately invoke them. Provide `options` to indicate
       * whether `func` should be invoked on the leading and/or trailing edge of the
       * `wait` timeout. The `func` is invoked with the last arguments provided to the
       * debounced function. Subsequent calls to the debounced function return the
       * result of the last `func` invocation.
      */
      //original source: https://github.com/lodash/lodash/debounce.js
      debounce(func, wait, options){
        let lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime

        let lastInvokeTime = 0
        let leading = false
        let maxing = false
        let trailing = true

        // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
        const useRAF = (!wait && wait !== 0 && typeof root.requestAnimationFrame === 'function')

        if (typeof func !== 'function') {
          throw new TypeError('Expected a function')
        }
        wait = +wait || 0
        if (isObject(options)) {
          leading = !!options.leading
          maxing = 'maxWait' in options
          maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
          trailing = 'trailing' in options ? !!options.trailing : trailing
        }

        function invokeFunc(time) {
          const args = lastArgs
          const thisArg = lastThis

          lastArgs = lastThis = undefined
          lastInvokeTime = time
          result = func.apply(thisArg, args)
          return result
        }

        function startTimer(pendingFunc, wait) {
          if (useRAF) {
            root.cancelAnimationFrame(timerId)
            return root.requestAnimationFrame(pendingFunc)
          }
          return setTimeout(pendingFunc, wait)
        }

        function cancelTimer(id) {
          if (useRAF) {
            return root.cancelAnimationFrame(id)
          }
          clearTimeout(id)
        }

        function leadingEdge(time) {
          // Reset any `maxWait` timer.
          lastInvokeTime = time
          // Start the timer for the trailing edge.
          timerId = startTimer(timerExpired, wait)
          // Invoke the leading edge.
          return leading ? invokeFunc(time) : result
        }

        function remainingWait(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime
          const timeWaiting = wait - timeSinceLastCall

          return maxing
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting
        }

        function shouldInvoke(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime

          // Either this is the first call, activity has stopped and we're at the
          // trailing edge, the system time has gone backwards and we're treating
          // it as the trailing edge, or we've hit the `maxWait` limit.
          return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
            (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
        }

        function timerExpired() {
          const time = Date.now()
          if (shouldInvoke(time)) {
            return trailingEdge(time)
          }
          // Restart the timer.
          timerId = startTimer(timerExpired, remainingWait(time))
        }

        function trailingEdge(time) {
          timerId = undefined

          // Only invoke if we have `lastArgs` which means `func` has been
          // debounced at least once.
          if (trailing && lastArgs) {
            return invokeFunc(time)
          }
          lastArgs = lastThis = undefined
          return result
        }

        function cancel() {
          if (timerId !== undefined) {
            cancelTimer(timerId)
          }
          lastInvokeTime = 0
          lastArgs = lastCallTime = lastThis = timerId = undefined
        }

        function flush() {
          return timerId === undefined ? result : trailingEdge(Date.now())
        }

        function pending() {
          return timerId !== undefined
        }

        function debounced(...args) {
          const time = Date.now()
          const isInvoking = shouldInvoke(time)

          lastArgs = args
          lastThis = this
          lastCallTime = time

          if (isInvoking) {
            if (timerId === undefined) {
              return leadingEdge(lastCallTime)
            }
            if (maxing) {
              // Handle invocations in a tight loop.
              timerId = startTimer(timerExpired, wait)
              return invokeFunc(lastCallTime)
            }
          }
          if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait)
          }
          return result
        }
        debounced.cancel = cancel
        debounced.flush = flush
        debounced.pending = pending
        return debounced
      },
      /**Create a function that will
      * flip the result of original func.
      * @memberof module:mcfud/core._
      * @param {function} func
      * @return {function} a wrapped function
      */
      negate(func){
        _pre(isFun,func,"function");
        return function(...args){
          return !func.apply(this, args)
        }
      },
      /**Maybe pad a string (right side.)
       * @memberof module:mcfud/core._
       * @param {string} str
       * @param {number} len
       * @param {string} s
       * @return {string}
      */
      strPadRight(str, len, s){
        return (len -= str.length)>0 ?
          str+new Array(Math.ceil(len/s.length)+1).join(s).substr(0, len) : str
      },
      /**Maybe pad a string (left side.)
       * @memberof module:mcfud/core._
       * @param {string} str
       * @param {number} len
       * @param {string} s
       * @return {string}
      */
      strPadLeft(str, len, s){
        return (len -= str.length)>0 ?
          new Array(Math.ceil(len/s.length)+1).join(s).substr(0, len) + str : str
      },
      /**Safely split a string, null and empty strings are removed.
       * @memberof module:mcfud/core._
       * @param {string} s
       * @param {string} sep
       * @return {string[]}
      */
      safeSplit(s, sep){
        return (s||"").trim().split(sep).filter(z=> z.length>0)
      },
      /**Capitalize the first char.
       * @memberof module:mcfud/core._
       * @param {string} str
       * @return {string}
       */
      capitalize(str){
        return str.charAt(0).toUpperCase() + str.slice(1)
      },
      /**Maybe pad the number with zeroes.
       * @memberof module:mcfud/core._
       * @param {number} num
       * @param {number} digits
       * @param {string} pad padding character
       * @return {string}
      */
      prettyNumber(num, digits=2, pad="0"){
        return this.strPadLeft(Number(num).toString(), digits, pad)
      },
      /**Pretty print millis in nice
       * hour,minutes,seconds format.
       * @memberof module:mcfud/core._
       * @param {number} ms
       * @return {string}
       */
      prettyMillis(ms){
        let h,m,s= int(ms/1000);
        m=int(s/60);
        ms=ms-s*1000;
        s=s-m*60;
        h= int(m/60);
        m=m-h*60;
        let out=[];
        out.push(`${s}.${ms} secs`);
        if(m>0 || h>0)
          out.push(`${m} mins, `);
        if(h>0)
          out.push(`${h} hrs, `);
        return out.reverse().join("");
      },
      /**Swap 2 elements in the array.
       * @memberof module:mcfud/core._
       * @param {array} arr
       * @param {number} a
       * @param {number} b
       * @return {array} arr
      */
      swap(arr,a,b){
        let t= arr[a];
        arr[a]=arr[b];
        arr[b]=t;
        return arr;
      },
      /**List indexes of this array
       * @memberof module:mcfud/core._
       * @param {array} arr
       * @param {boolean} scramble
       * @return {array} list of indexes
      */
      listIndexesOf(arr, scramble){
        let xs= _.fill(arr.length,(i)=>i);
        return scramble? this.shuffle(xs) : xs;
      },
      /**Remove some arguments from the front.
       * @memberof module:mcfud/core._
       * @param {arguments} args
       * @param {number} num
       * @return {any[]} remaining arguments
      */
      dropArgs(args, num){
        return args.length>num ? Slicer.call(args, num) : []
      },
      /**Check if url is secure.
       * @memberof module:mcfud/core._
       * @return {boolean}
       */
      isSSL(){
        return window && window.location && window.location.protocol.indexOf("https") >= 0
      },
      /**Check if url is mobile.
       * @memberof module:mcfud/core._
       * @param {object} navigator
       * @return {boolean}
       */
      isMobile(navigator){
        return navigator && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      /**Check if browser is safari.
       * @memberof module:mcfud/core._
       * @param {object} navigator
       * @return {boolean}
       */
      isSafari(navigator){
        return navigator && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)
      },
      /**Check if url is cross-origin.
       * @memberof module:mcfud/core._
       * @param {string} url
       * @return {boolean}
       */
      isCrossOrigin(url) {
        let wnd=window;
        if(arguments.length==2 &&
           arguments[1].hack==911){ wnd=arguments[1] }
        if(wnd&&wnd.location&&url){
          const pos= url.indexOf("://");
          if(pos>0){
            let end= url.indexOf("/", pos+3);
            let o = end<0 ? url : url.substring(0, end);
            return o != wnd.location.origin;
          }
        }
      },
      /**Add an event listener to this target.
       * @memberof module:mcfud/core._
       * @param {string} event
       * @param {any} target
       * @param {callback} cb
       * @param {any} arg
       */
      addEvent(event,target,cb,arg){
        if(isVec(event) && arguments.length==1)
          event.forEach(e=> this.addEvent.apply(this, e));
        else
          target.addEventListener(event,cb,arg)
      },
      /**Remove this event listener from this target.
       * @memberof module:mcfud/core._
       * @param {string} event
       * @param {any} target
       * @param {callback} cb
       * @param {any} arg
       */
      delEvent(event,target,cb,arg){
        if(isVec(event) && arguments.length==1)
          event.forEach(e => this.delEvent.apply(this, e));
        else
          target.removeEventListener(event,cb,arg)
      },
      /**Rounds a double up or down depending on its value.
       * @memberof module:mcfud/core._
       * @param {number} val
       * @return {number}
       */
      rounded(val){
        return this.roundUnderOffset(val, 0.5)
      },
      /**Rounds a double up or down depending on
       * whether its mantissa is higher or lower than offset.
       * @memberof module:mcfud/core._
       * @param {number} val
       * @return {number}
       */
      roundUnderOffset(val, offset){
        const integral = int(val);
        return (val - integral) < offset ? integral : (integral + 1);
      }
    };

    /** @namespace module:mcfud/core.dom */
    const dom={
      /**Get a list of the document's elements that
       * match the specified selector(s).
       * @memberof module:mcfud/core.dom
       * @param {string} sel a valid CSS selector
       * @return {NodeList}
       */
      qSelector(sel){ return doco.querySelectorAll(sel) },
      /**Get the element whose id property
       * matches the specified string.
       * @memberof module:mcfud/core.dom
       * @param {string} id
       * @return {Element} undefined if not found
       */
      qId(id){ return doco.getElementById(id) },
      /**Get the parent node.
       * @memberof module:mcfud/core.dom
       * @param {Node}
       * @return {Node} undefined if not found
       */
      parent(e){ if(e) return e.parentNode },
      /**Adds a node to the parent, will be added to the end.
       * @memberof module:mcfud/core.dom
       * @param {Node} par
       * @param {Node}
       * @return {Node} the child
       */
      conj(par,child){ return par.appendChild(child) },
      /**Get a live HTMLCollection of elements with the given tag name.
       * @memberof module:mcfud/core.dom
       * @param {string} tag
       * @param {string} ns namespaceURI
       * @return {HTMLCollection}
       */
      byTag(tag, ns){
        return !isStr(ns) ? doco.getElementsByTagName(id)
                          : doco.getElementsByTagNameNS(ns,tag) },
      /**Get or set attributes on this element.
       * @memberof module:mcfud/core.dom
       * @param {Element} e
       * @param {object|string} attrs
       * @return {Element} e
       */
      attrs(e, attrs){
        if(!isObj(attrs) && attrs){
          if(arguments.length > 2)
            e.setAttribute(attrs, arguments[2]);
          return e.getAttribute(attrs);
        }
        if(attrs)
          _.doseq(attrs, (v,k)=> e.setAttribute(k,v));
        return e;
      },
      /**Get or set CSS styles on this element.
       * @memberof module:mcfud/core.dom
       * @param {Element} e
       * @param {object|string} styles
       * @return {Element} e
       */
      css(e, styles){
        if(!isObj(styles) && styles){
          if(arguments.length > 2)
            e.style[styles]= arguments[2];
          return e.style[styles];
        }
        if(styles)
          _.doseq(styles, (v,k)=> e.style[k]=v);
        return e;
      },
      /**Insert a container node between the child and it's current parent,
       * for example, par <- child will become par <- wrapper <- child.
       * @memberof module:mcfud/core.dom
       * @param {Node} child
       * @param {Node} wrapper
       * @return {Node} wrapper
       */
      wrap(child,wrapper){
        const p=child.parentNode;
        wrapper.appendChild(child);
        p.appendChild(wrapper);
        return wrapper;
      },
      /**Create a new element, and maybe assign attributes/styles.
       * @memberof module:mcfud/core.dom
       * @param {string} tag
       * @param {object} attributes
       * @param {object} styles
       * @return {Element}
       */
      newElm(tag, attrs, styles){
        const e = doco.createElement(tag);
        this.attrs(e,attrs);
        this.css(e,styles);
        return e;
      },
      /**Create a new text node, and maybe assign attributes/styles.
       * @memberof module:mcfud/core.dom
       * @param {string} tag
       * @param {object} attributes
       * @param {object} styles
       * @return {Node}
       */
      newTxt(tag, attrs, styles){
        const e = doco.createTextNode(tag);
        this.attrs(e,attrs);
        this.css(e,styles);
        return e;
      }
    };

    /**
     * @ignore
     */
    const NULL={};
    /**
     * @ignore
     */
    const ZA=[];

    /**Publish-subscribe
     * @class
     */
    class CEventBus{
      constructor(){
        this._tree=new Map();
        this._targets=new Map();
      }
      /**
       * Subscribe to an event.
       * @param {any[]} [event,target]
       * @param {callback} cb
       * @param {any} ctx
       * @param {array} extras
       * @return {CEventBus} self
       */
      sub(subject,cb,ctx,extras){
        let event=subject[0],
            target=subject[1];
        //remember each target
        if(target && !this._targets.has(target)){
          this._targets.set(target,1)
        }
        //handle multiple events in one string
        _.seq(event).forEach(e=>{
          if(!cb) cb=e;
          if(isStr(cb)) { ctx=ctx || target; cb=ctx[cb]; }
          if(!cb) throw "Error: no callback for sub()";
          if(!this._tree.has(e)) this._tree.set(e, _.jsMap());
          let m= this._tree.get(e);
          target=target||NULL;
          !m.has(target) && m.set(target,[]);
          m.get(target).push([cb,ctx,extras]);
        });
        return this;
      }
      /**
       * Trigger an event.
       * @param {any[]} [event,target]
       * @param {...any} args
       * @return {CEventBus} self
       */
      pub(subject, ...args){
        let m,t,
            event=subject[0],
            target=subject[1] || NULL;
        if(target === NULL ||
           this._targets.has(target)){
          _.seq(event).forEach(e=>{
            t=this._tree.get(e);
            m= t && t.get(target);
            m && m.forEach(s=>{
              s[0].apply(s[1],args.concat(s[2] || ZA));
            });
          });
        }
        return this;
      }
      /**
       * Remove all subscribers.
       * @return {CEventBus} self
       */
      reset(){
        this._targets.clear();
        this._tree.clear();
        return this;
      }
      drop(target){
        if(this._targets.has(target)){
          this._targets.delete(target);
          let it=this._tree.values();
          for(let r=it.next(); !r.done;){
            r.value.delete(target);
            r=it.next();
          }
        }
        return this;
      }
      /**
       * Unsubscribe to an event.
       * @param {any[]} [event,target]
       * @param {callback} cb
       * @param {any} ctx
       * @return {CEventBus} self
       */
      unsub(subject,cb,ctx){
        if(arguments.length==1 && !is.vec(subject)){
          this.drop(subject);
        }else{
          let event=subject[0],
              target=subject[1] || NULL;
          if(target === NULL ||
             this._targets.has(target)){
            let t,m, es=_.seq(event);
            es.forEach(e=>{
              t= this._tree.get(e);
              m= t && t.get(target);
              if(m){
                if(isStr(cb)) { ctx=ctx || target; cb=ctx[cb]; }
                if(cb)
                  for(let i= m.length-1;i>=0;--i)
                    if(m[i][0] === cb && m[i][1] === ctx) m.splice(i,1);
              }
            });
          }
        }
        return this;
      }
    }

    /**Create a pub/sub event manager.
     * @memberof module:mcfud/core
     * @return {CEventBus}
     */
    function EventBus(){
      return new CEventBus()
    }

    //browser only--------------------------------------------------------------
    if(doco){ _$.dom=dom }else{
      delete _["addEvent"];
      delete _["delEvent"];
    }

    _$.EventBus=EventBus;
    _$.is=is;
    _$.u=_;

    return _$;
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    module.exports=_module()
  }else{
    window["io/czlab/mcfud/core"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    //const EPSILON= 0.0000000001;
    const NEG_DEG_2PI= -360;
    const DEG_2PI= 360;
    const TWO_PI= 2*Math.PI;
    const PI= Math.PI;
    const int=Math.floor;
    const {is,u:_}= Core;

    /**
     * @module mcfud/math
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const PERLIN_YWRAPB = 4;
    const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
    const PERLIN_ZWRAPB = 8;
    const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
    const PERLIN_SIZE = 4095;
    let _perlinArr,
        perlin_octaves = 4, // default to medium smooth
        perlin_amp_falloff = 0.5; // 50% reduction/octave

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const scaled_cosine=(i)=> 0.5 * (1.0 - Math.cos(i * Math.PI));
    const _mod_deg=(deg)=> deg<0 ? -(-deg%DEG_2PI) : deg%DEG_2PI;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Liner interpolation.
       * @memberof module:mcfud/math
       * @param {number} startv
       * @param {number} endv
       * @param {number} t
       * @return {number}
       */
      lerp(startv, endv, t){
        return (1-t) * startv + t * endv
      },
      /**The modulo operator.
       * @memberof module:mcfud/math
       * @param {number} x
       * @param {number} N
       * @return {number}
       */
      xmod(x,N){
        return x<0 ? x-(-(N + N*int(-x/N))) : x%N
      },
      /**Divide this number as integer.
       * @memberof module:mcfud/math
       * @param {number} a
       * @param {number} b
       * @return {number} integer result
       */
      ndiv(a,b){
        return int(a/b)
      },
      /**Calc the base to the exponent power, as in base^exponent
       * @memberof module:mcfud/math
       * @param {number} a base
       * @param {number} n exponent
       * @return {number}
       */
      pow(a,n){
        if(n==0) return 1;
        if(n==1) return a;
        if(n==2) return a*a;
        if(n==3) return a*a*a;
        return Math.pow(a,n);
      },
      /**Find the closest power of 2 value for this number.
       * e.g. pow2(33)= 64
       * @memberof module:mcfud/math
       * @param {number} n
       * @return {number} power of 2 value
       */
      pow2(x){
        let a=2;
        while (x>a){ a *= 2 } return a;
      },
      /**Limit the value to within these 2 numbers.
       * @memberof module:mcfud/math
       * @param {number} min
       * @param {number} max
       * @param {number} v a value
       * @return {number}
       */
      clamp(min,max,v){
        return v<min ? min : (v>max ? max : v)
      },
      /**Square a number.
       * @memberof module:mcfud/math
       * @param {number} a
       * @return {number} q^2
       */
      sqr(a){ return a*a },
      /**Check if 2 numbers are approximately the same.
       * @memberof module:mcfud/math
       * @param {number} a
       * @param {number} b
       * @return {boolean}
       */
      fuzzyEq(a,b){ return _.feq(a,b) },
      /**Check if the number is approximately zero.
       * @memberof module:mcfud/math
       * @param {number} n
       * @return {boolean}
       */
      fuzzyZero(n){ return _.feq0(n) },
      /**Convert radians to degrees.
       * @memberof module:mcfud/math
       * @param {number} r
       * @return {number} degrees
       */
      radToDeg(r){ return _mod_deg(DEG_2PI * r/TWO_PI) },
      /**Convert degrees to radians.
       * @memberof module:mcfud/math
       * @param {number} d
       * @return {number} radians
       */
      degToRad(d){ return TWO_PI * _mod_deg(d)/DEG_2PI },
      /**Hypotenuse squared.
       * @memberof module:mcfud/math
       * @param {number} x
       * @param {number} y
       * @return {number}
       */
      pythag2(x,y){ return x*x + y*y },
      /**Hypotenuse.
       * @memberof module:mcfud/math
       * @param {number} x
       * @param {number} y
       * @return {number}
       */
      pythag(x,y){ return Math.sqrt(x*x + y*y) },
      /** @ignore */
      wrap(i,len){ return (i+1) % len },
      /**Is it more a or b?
       * @ignore
       */
      biasGreater(a,b){
        const biasRelative= 0.95,
              biasAbsolute= 0.01;
        return a >= (b*biasRelative + a*biasAbsolute)
      },
      /**Re-maps a number from one range to another.
       * @param {number} n  the incoming value to be converted
       * @param {number} start1 lower bound of the value's current range
       * @param {number} stop1  upper bound of the value's current range
       * @param {number} start2 lower bound of the value's target range
       * @param {number} stop2  upper bound of the value's target range
       * @param  {boolean} [withinBounds] constrain the value to the newly mapped range
       * @return {number}
       */
      remap(n, start1, stop1, start2, stop2, withinBounds){
        const v= (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        return !withinBounds ? v : (start2 < stop2? this.clamp(start2, stop2, v) : this.clamp(stop2, start2,v));
      },
      /**Perlin noise in 1D.
       * from https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_PerlinNoise.cpp
       * @param {number} nCount
       * @param {number[]} fSeed
       * @param {number} nOctaves
       * @param {number} fBias
       * @param {number[]} fOutput
       * @return {number[]} fOutput
       */
      perlin1D(nCount, fSeed, nOctaves, fBias, fOutput){
        let fNoise, fScaleAcc, fScale,
            nPitch, nSample1, nSample2, fBlend, fSample;
        for(let x=0; x<nCount; ++x){
          fNoise = 0; fScaleAcc = 0; fScale = 1;
          for(let o=0; o<nOctaves; ++o){
            nPitch = nCount >> o;
            nSample1 = int(x/nPitch) * nPitch;
            nSample2 = (nSample1 + nPitch) % nCount;
            fBlend = (x - nSample1) / nPitch;
            fSample = (1 - fBlend) * fSeed[int(nSample1)] + fBlend * fSeed[int(nSample2)];

            fScaleAcc += fScale;
            fNoise += fSample * fScale;
            fScale = fScale / fBias;
          }
          //scale to seed range
          fOutput[x] = fNoise / fScaleAcc;
        }
      },
      /**Perlin noise in 2D.
       * from https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_PerlinNoise.cpp
       * @param {number} nWidth
       * @param {number} nHeight
       * @param {number[]} fSeed
       * @param {number} nOctaves
       * @param {number} fBias
       * @param {number[]} fOutput
       * @return {number[]} fOutput
       */
      perlin2D(nWidth, nHeight, fSeed, nOctaves, fBias, fOutput){
        let fNoise, fScaleAcc, fScale,
            fBlendX, fBlendY, fSampleT, fSampleB,
            nPitch, nSampleX1, nSampleY1, nSampleX2, nSampleY2;
        for(let x=0; x<nWidth; ++x)
          for(let y=0; y<nHeight; ++y){
            fNoise = 0; fScaleAcc = 0; fScale = 1;
            for(let o=0; o<nOctaves; ++o){
              nPitch = nWidth >> o;
              nSampleX1 = int(x / nPitch) * nPitch;
              nSampleY1 = int(y / nPitch) * nPitch;
              nSampleX2 = (nSampleX1 + nPitch) % nWidth;
              nSampleY2 = (nSampleY1 + nPitch) % nHeight;
              fBlendX = (x - nSampleX1) / nPitch;
              fBlendY = (y - nSampleY1) / nPitch;
              fSampleT = (1 - fBlendX) * fSeed[int(nSampleY1 * nWidth + nSampleX1)] + fBlendX * fSeed[int(nSampleY1 * nWidth + nSampleX2)];
              fSampleB = (1 - fBlendX) * fSeed[int(nSampleY2 * nWidth + nSampleX1)] + fBlendX * fSeed[int(nSampleY2 * nWidth + nSampleX2)];

              fScaleAcc += fScale;
              fNoise += (fBlendY * (fSampleB - fSampleT) + fSampleT) * fScale;
              fScale = fScale / fBias;
            }
            //scale to seed range
            fOutput[y * nWidth + x] = fNoise / fScaleAcc;
          }
      }

    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/math"]=_module
  }

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
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module.
  */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const {u:_, is}= Core;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const assertArgs=(a,b)=> _.assert(!is.num(a) && !is.num(b) && a && b, "wanted 2 vecs");
    const assertArg=(a)=> _.assert(!is.num(a) && a, "wanted vec");
    const _ctor=(b,x=0,y=0)=> b ? [x,y] : {x,y};
    const MVPool={};

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class MV{
      constructor(){
        this.x=0;
        this.y=0;
      }
      unit(out){
        if(is.bool(out)){
          out=_ctor(out)
        }
        if(is.vec(out)){
          out[0]=this.x;
          out[1]=this.y
        }else{
          out.x=this.x;
          out.y=this.y;
        }
        return out;
      }
      bind(v){
        if(is.vec(v)){
          this.x=v[0];
          this.y=v[1]
        }else{
          this.x=v.x;
          this.y=v.y
        }
        return this;
      }
      op(code,b,c){
        let out=MVPool.take();
        out.x=this.x;
        out.y=this.y;
        switch(code){
          case"+":
            if(is.num(b)) out.x += b;
            if(is.num(c)) out.y += c;
            break;
          case"-":
            if(is.num(b)) out.x -= b;
            if(is.num(c)) out.y -= c;
            break;
          case"*":
            if(is.num(b)) out.x *= b;
            if(is.num(c)) out.y *= c;
            break;
          case "/":
            if(is.num(b)) out.x /= b;
            if(is.num(c)) out.y /= c;
            break;
        }
        return out;
      }
      "+"(m){ return this.op("+",m.x,m.y) }
      "-"(m){ return this.op("-",m.x,m.y) }
      "*"(m){ return this.op("*",m.x,m.y) }
      "/"(m){ return this.op("/",m.x,m.y) }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(MVPool,{
      take(){ return this._pool.pop() },
      drop(...args){
        args.forEach(a=>{
          a.x=0;a.y=0;
          this._pool.push(a); })
      },
      _pool:_.fill(16,()=>new MV())
    });

    /** @module mcfud/vec2 */

    /**
     * @typedef {number[]} Vec2
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Rotate a vector around a pivot. */
    function _v2rot(ax,ay,cos,sin,cx,cy,out){
      const x_= ax-cx,
            y_= ay-cy,
            x= cx+(x_*cos - y_*sin),
            y= cy+(x_ * sin + y_ * cos);
      if(is.vec(out)){
        out[0]=x;
        out[1]=y;
      }else{
        out.x=x;
        out.y=y;
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _opXXX(a,b,op,local){
      let out,pr, p1=MVPool.take().bind(a);
      if(is.num(b)){
        pr=p1.op(op,b,b);
      }else{
        let p2=MVPool.take().bind(b);
        pr=p1[op](p2);
        MVPool.drop(p2);
      }
      out=pr.unit(local?a:is.vec(a));
      MVPool.drop(p1,pr);
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Get the x part.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {number} x
       */
      gx(v){
        return is.vec(v)?v[0]:v.x },
      /**Set the x part.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} x
       */
      sx(v,x){
        is.vec[v]? (v[0]=x) : (v.x=x)
      },
      /**Get the y part.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {number} y
       */
      gy(v){
        return is.vec(v)?v[1]:v.y },
      /**Set the y part.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} y
       */
      sy(v,y){
        is.vec[v]? (v[1]=y) : (v.y=y)
      },
      /**Create a free vector.
       * @memberof module:mcfud/vec2
       * @param {number} x
       * @param {number} y
       * @return {Vec2}
       */
      vec(x=0,y=0){ return _ctor(true,x,y) },
      /**Create a free vector.
       * @memberof module:mcfud/vec2
       * @param {number} x
       * @param {number} y
       * @return {object}
       */
      vecXY(x=0,y=0){ return _ctor(false,x,y) },
      /**Vector addition: A+B.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      add(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"+") },
      /**Vector addition: A=A+B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      add$(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"+",true) },
      /**Vector subtraction: A-B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      sub(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"-") },
      /**Vector subtraction: A=A-B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      sub$(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"-",true) },
      /**Vector multiply: A*B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      mul(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"*") },
      /**Vector multiply: A=A*B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      mul$(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"*",true) },
      /**Vector division: A/B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      div(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"/") },
      /**Vector division: A=A/B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      div$(a,b){
        return _.assert(arguments.length==2) && _opXXX(a,b,"/",true) },
      /**Dot product of 2 vectors,
       * cos(t) = a·b / (|a| * |b|)
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      dot(a,b){
        assertArgs(a,b);
        let p1=MVPool.take().bind(a),
            p2=MVPool.take().bind(b),
            out=p1.x*p2.x + p1.y*p2.y;
        MVPool.drop(p1,p2);
        return out;
      },
      /**Check if these 2 points are equal.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {boolean}
       */
      equals(a,b){
        let p1=MVPool.take().bind(a),
            p2=MVPool.take().bind(b),
            ok= p1.x==p2.x && p1.y==p2.y;
        MVPool.drop(p1,p2);
        return ok;
      },
      /**Create a vector A->B, calculated by doing B-A.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      vecAB(a,b){
        assertArgs(a,b);
        let p1=MVPool.take().bind(a),
            p2=MVPool.take().bind(b),
            out,pr=MVPool.take();
        pr.x=p2.x-p1.x;
        pr.y=p2.y-p1.y;
        out=pr.unit(is.vec(a));
        MVPool.drop(p1,p2,pr);
        return out;
      },
      /**Vector length squared.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {number}
       */
      len2(a){ return this.dot(a,a) },
      /**Length of a vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {number}
       */
      len(a){ return Math.sqrt(this.len2(a)) },
      /**Distance between 2 vectors, squared.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      dist2(a,b){
        return this.len2( this.sub(b,a))
      },
      /**Distance between 2 vectors.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      dist(a,b){
        return Math.sqrt(this.dist2(a,b)) },
      /**Normalize this vector: a/|a|
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {Vec2} undefined if zero length
       */
      unit(a){
        let d=this.len(a),
            out, p1=MVPool.take().bind(a);
        if(_.feq0(d)){
          p1.x=0;
          p1.y=0;
        }else{
          p1.x /= d;
          p1.y /= d;
        }
        out= p1.unit(is.vec(a));
        MVPool.drop(p1);
        return out;
      },
      /**Normalize this vector: a=a/|a|
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {Vec2} undefined if zero length
       */
      unit$(a){
        let d=this.len(a),
            out, p1=MVPool.take().bind(a);
        if(_.feq0(d)){
          p1.x=0;
          p1.y=0;
        }else{
          p1.x /= d;
          p1.y /= d;
        }
        out= p1.unit(a);
        MVPool.drop(p1);
        return out;
      },
      /**Copy `src` into `des`.
       * @memberof module:mcfud/vec2
       * @param {Vec2} des
       * @param {Vec2} src
       * @return {Vec2}
       */
      copy(des,src){
        assertArgs(des,src);
        let p1=MVPool.take().bind(des),
            out, p2=MVPool.take().bind(src);
        p1.x=p2.x;
        p1.y=p2.y;
        out= p1.unit(des);
        MVPool.drop(p1,p2);
        return out;
      },
      /**Make a copy of this vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {Vec2}
       */
      clone(v){
        let p1= MVPool.take().bind(v),
            out= p1.unit(is.vec(v));
        MVPool.drop(p1);
        return out;
      },
      /**Copy values(args) into `des`.
       * @memberof module:mcfud/vec2
       * @param {Vec2} des
       * @param {number} x
       * @param {number} y
       * @return {Vec2}
       */
      set(des,x,y){
        let out, p1= MVPool.take().bind(des);
        if(is.num(x)) p1.x=x;
        if(is.num(y)) p1.y=y;
        out= p1.unit(des);
        MVPool.drop(p1);
        return out;
      },
      /**Copy value into `v`.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} x
       * @return {Vec2}
       */
      setX(v,x){
        return this.set(v,x) },
      /**Copy value into `v`.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} y
       * @return {Vec2}
       */
      setY(v,y){
        return this.set(v,null,y) },
      /**Rotate a vector around a pivot.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number} rot
       * @param {Vec2} [pivot]
       * @return {Vec2}
       */
      rot(a,rot,pivot=null){
        let cx=0,cy=0,
            out,p2,p1= MVPool.take().bind(a);
        if(pivot){
          p2=MVPool.take().bind(pivot);
          cx=p2.x;
          cy=p2.y;
          MVPool.drop(p2);
        }
        out= _v2rot(p1.x,p1.y,
                    Math.cos(rot),
                    Math.sin(rot), cx,cy,_ctor(is.vec(a)));
        MVPool.drop(p1);
        return out;
      },
      /**Rotate a vector around a pivot: a=rot(a,...)
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number} rot
       * @param {Vec2} [pivot]
       * @return {Vec2}
       */
      rot$(a,rot,pivot){
        let cx=0,cy=0,
            out,p2,p1= MVPool.take().bind(a);
        if(pivot){
          p2=MVPool.take().bind(pivot);
          cx=p2.x;
          cy=p2.y;
          MVPool.drop(p2);
        }
        out= _v2rot(p1.x,p1.y,
                    Math.cos(rot),
                    Math.sin(rot), cx,cy,a);
        MVPool.drop(p1);
        return out;
      },
      /**2d cross product.
       * The sign of the cross product (AxB) tells you whether the 2nd vector (B)
       * is on the left or right side of the 1st vector (A), +ve implies
       * B is left of A, (rotate ccw to B), -ve means B is right of A (rotate cw to B).
       * The absolute value of the 2D cross product is the sine of the angle
       * in between the two vectors.
       * @memberof module:mcfud/vec2
       * @param {number|Vec2} p1
       * @param {number|Vec2} p2
       * @return {number|Vec2}
       */
      cross(p1,p2){
        let out;
        if(is.num(p1)){
          let r= MVPool.take(),
              b= MVPool.take().bind(p2);
          r.x=-p1 * b.y;
          r.y=p1 * b.x;
          out=r.unit(is.vec(p2));
          MVPool.drop(b,r);
        }
        else if(is.num(p2)){
          let r= MVPool.take(),
              b= MVPool.take().bind(p1);
          r.x=p2 * b.y;
          r.y= -p2 * b.x;
          out=r.unit(is.vec(p1));
          MVPool.drop(b,r);
        }else{
          assertArgs(p1,p2);
          let a= MVPool.take().bind(p1),
              b= MVPool.take().bind(p2);
          out= a.x * b.y - a.y * b.x;
          MVPool.drop(a,b);
        }
        return out;
      },
      /**Angle (in radians) between these 2 vectors.
       * a.b = cos(t)*|a||b|
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      angle(a,b){
        return Math.acos(this.dot(a,b)/(this.len(a)*this.len(b))) },
      /**Change vector to be perpendicular to what it was before, effectively
       * rotates it 90 degrees(normal).
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {boolean} ccw counter-clockwise?
       * @return {Vec2}
       */
      normal(a,ccw=false){
        let pr=MVPool.take(),
            out,p1=MVPool.take().bind(a);
        if(ccw){
          pr.x= -p1.y;
          pr.y= p1.x;
        }else{
          pr.x= p1.y;
          pr.y= -p1.x;
        }
        out= pr.unit(is.vec(a));
        MVPool.drop(p1,pr);
        return out;
      },
      /**Change vector to be perpendicular to what it was before, effectively
       * rotates it 90 degrees(normal), A=normal(A).
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {boolean} ccw counter-clockwise?
       * @return {Vec2}
       */
      normal$(a,ccw=false){
        let pr=MVPool.take(),
            out, p1=MVPool.take().bind(a);
        if(ccw){
          pr.x= -p1.y;
          pr.y= p1.x;
        }else{
          pr.x= p1.y;
          pr.y= -p1.x;
        }
        out= pr.unit(a);
        MVPool.drop(p1,pr);
        return out;
      },
      /**Find scalar projection A onto B.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      proj_scalar(a,b){
        return this.dot(a,b)/this.len(b) },
      /**Find vector A projection onto B.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      proj(a,b){
        const bn = this.unit(b);
        this.mul$(bn, this.dot(a,bn));
        let pr=MVPool.take().bind(bn),
            out=pr.unit(is.vec(a));
        MVPool.drop(pr);
        return out;
      },
      /**Find the perpedicular vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      perp(a,b){
        return this.sub(a, this.proj(a,b)) },
      /**Reflect a ray, normal must be normalized.
       * @memberof module:mcfud/vec2
       * @param {Vec2} ray
       * @param {Vec2} surface_normal
       * @return {Vec2}
       */
      reflect(ray,surface_normal){
        //ray of light hitting a surface, find the reflected ray
        //reflect= ray - 2(ray.surface_normal)surface_normal
        const v= 2*this.dot(ray,surface_normal);
        return this.sub(ray, this.mul(surface_normal, v));
      },
      /**Negate a vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {Vec2}
       */
      flip(v){ return this.mul(v, -1) },
      /**Negate a vector, v=flip(v).
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {Vec2}
       */
      flip$(v){ return this.mul$(v, -1) },
      /**Move a bunch of points.
       * @memberof module:mcfud/vec2
       * @param {Vec2} pos
       * @param {...Vec2} args
       * @return {Vec2[]}
       */
      translate(pos,...args){
        let pr,p2,p1=MVPool.take().bind(pos);
        let ret,out;
        if(args.length==1 && is.vec(args[0]) && !is.num(args[0][0])){
          args=args[0];
        }
        ret=args.map(a=>{
          p2=MVPool.take().bind(a);
          pr=p2["+"](p1);
          out= pr.unit(is.vec(a));
          MVPool.drop(p2,pr);
          return out;
        });
        MVPool.drop(p1);
        return ret;
      },
      /**Clamp a vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} min
       * @param {number} max
       * @return {Vec2}
       */
      clamp$(v, min, max){
        const n = this.len(v),
              _n= Math.max(min, Math.min(max, n));
        return n==_n ? v : this.mul$(this.div$(v, n || 1 ), _n);
      },
      /**Clamp a vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @param {number} min
       * @param {number} max
       * @return {Vec2}
       */
      clamp(v, min, max){
        const n = this.len(v),
              _n= Math.max(min, Math.min(max, n));
        return n==_n?v: this.mul(this.div(v, n || 1 ), _n);
      }

    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/vec2"]=_module
  }

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
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const ATAN2= Math.atan2;
    const COS= Math.cos;
    const SIN= Math.sin;
    const TAN= Math.tan;
    const int=Math.floor;
    const {u:_, is}= Core;

    /**
     * @module mcfud/matrix
     */

    /**
     * @typedef {object} MatrixObject
     * @property {number[]} dim size of the matrix[row,col]
     * @property {number[]} cells internal data
     */

    /**
     * @typedef {number[]} Vec3
     */

    /**
     * @typedef {number[]} VecN
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _arrayEq(a1,a2){
      return a1.length == a2.length &&
             a1.every((a,i)=> a==a2[i] || _.feq(a,a2[i]))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _odd=(n)=> n%2 != 0;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //index where matrix is mapped to 1D array (1-based, so do the minus1)
    const _cell=(rows,cols,r,c)=> (c-1) + ((r-1)*cols);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _matnew=(rows,cols,cells)=> ({cells, dim: [rows,cols]});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _new_mat=(rows,cols)=> _matnew(rows,cols, _.fill(rows*cols,0));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /** @ignore */
      v4(x=0,y=0,z=0,K=0){ return [x,y,z,K] },
      /**Create a 3D vector.
       * @memberof module:mcfud/matrix
       * @param {number} x
       * @param {number} y
       * @param {number} z
       * @return {Vec3}
       */
      v3(x=0,y=0,z=0){ return [x,y,z] },
      /**Dot product of 3D vectors.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {Vec3} b
       * @return {number}
      */
      dot(a,b){
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
      },
      /**Cross product of 2 3D vectors.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {Vec3} b
       * @return {Vec3}
       */
      cross(a,b){
        return this.v3(a[1] * b[2] - a[2] * b[1],
                       a[2] * b[0] - a[0] * b[2],
                       a[0] * b[1] - a[1] * b[0])
      },
      /**The length of this vector, squared.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @return {number}
       */
      len2(a){ return this.dot(a,a) },
      /**The length of this vector.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @return {number}
       */
      len(a){ return Math.sqrt(this.len2(a)) },
      /**Normalize this vector, if possible.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @return {Vec3} undefined if error
       */
      unit(a){
        let d=this.len(a);
        if(!_.feq0(d))
          return [a[0]/d, a[1]/d, a[2]/d];
      },
      /**Vector operation A - B.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {number|Vec3} b
       * @return {Vec3}
       */
      sub(a,b){
        return is.num(b) ? this.v3(a[0]-b, a[1]-b, a[2]-b)
                         : this.v3(a[0]-b[0], a[1]-b[1], a[2]-b[2])
      },
      /**Vector operation A + B.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {number|Vec3} b
       * @return {Vec3}
       */
      add(a,b){
        return is.num(b) ? this.v3(a[0]+b, a[1]+b, a[2]+b)
                         : this.v3(a[0]+b[0], a[1]+b[1], a[2]+b[2])
      },
      /**Vector operation A x B.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {number|Vec3} b
       * @return {Vec3}
       */
      mul(a,b){
        return is.num(b) ? this.v3(a[0]*b, a[1]*b, a[2]*b)
                         : this.v3(a[0]*b[0], a[1]*b[1], a[2]*b[2])
      },
      /**Vector operation A / B.
       * @memberof module:mcfud/matrix
       * @param {Vec3} a
       * @param {number|Vec3} b
       * @return {Vec3}
       */
      div(a,b){
        return is.num(b) ? this.v3(a[0]/b, a[1]/b, a[2]/b)
                         : this.v3(a[0]/b[0], a[1]/b[1], a[2]/b[2])
      },
      /**Create a matrix.
       * @memberof module:mcfud/matrix
       * @param {number[]} [rows,cols]
       * @param {...number} args values for the matrix (row-major)
       * @return {MatrixObject} new matrix
       */
      matrix([rows,cols],...args){
        const sz= rows*cols;
        return args.length==0 ? _new_mat(rows,cols)
                              : _.assert(sz==args.length) && _matnew(rows,cols,args)
      },
      /**Get or set the value at this position.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m
       * @param {number} row
       * @param {number} col
       * @param {number} [value]
       * @return {number|MatrixObject}
       */
      matCell(m,row,col,value){
        const c= _cell(m.dim[0],m.dim[1],row,col);
        if(c>=0 && c<m.cells.length){
          if(is.num(value)){
            m.cells[c]=value; return m }
          return m.cells[c]
        }
      },
      /**Create an `Identity` matrix.
       * @memberof module:mcfud/matrix
       * @param {number} sz  size of the matrix
       * @return {MatrixObject} new matrix
       */
      matIdentity(sz){
        const out=_.assert(sz>0) &&
                  _.fill(sz*sz,0);
        for(let i=0;i<sz;++i)
          out[_cell(sz,sz,i+1,i+1)] = 1;
        return _matnew(sz, sz, out);
      },
      /**Create a matrix of zeroes.
       * @memberof module:mcfud/matrix
       * @param {number} sz  size of the matrix
       * @return {MatrixObject} new matrix
       */
      matZero(sz){
        return _.assert(sz>0) &&
               _matnew(sz,sz,_.fill(sz*sz,0))
      },
      /**Get the rows of this matrix,
       * for example, if the matrix is
       * [1 230
       *  0 1 0
       *  0 0 1] then the rows majors are
       *  [1 2 3], [0 1 0], [0 0 1]
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {number[][]}
       */
      matRowMajors(m){
        const [rows,cols]=m.dim;
        return _.partition(cols,m.cells)
      },
      /**Get the cols of this matrix,
       * for example, if the matrix is
       * [1 2 3
       *  4 5 6
       *  7 8 9] then the column majors are
       *  [1 4 7], [2 5 8], [7 8 9]
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {number[][]}
       */
      matColMajors(m){
        const [rows,cols]=m.dim;
        const out=[];
        for(let a,c=0;c<cols;++c){
          a=[];
          for(let r=0;r<rows;++r){
            a.push(m.cells[r*cols+c])
          }
          out.push(a)
        }
        return out;
      },
      /**Create a 2x2 matrix.
       * @memberof module:mcfud/matrix
       * @param {number} _11
       * @param {number} _12
       * @param {number} _21
       * @param {number} _22
       * @return {MatrixObject} new matrix
       */
      mat2(_11,_12,_21,_22){
        return this.matrix([2,2],_11,_12,_21,_22)
      },
      /**Create a 3x3 matrix.
       * @memberof module:mcfud/matrix
       * @param {number} _11
       * @param {number} _12
       * @param {number} _13
       * @param {number} _21
       * @param {number} _22
       * @param {number} _23
       * @param {number} _31
       * @param {number} _32
       * @param {number} _33
       * @return {MatrixObject} new matrix
       */
      mat3(_11,_12,_13,_21,_22,_23,_31,_32,_33){
        return this.matrix([3,3], _11,_12,_13,_21,_22,_23,_31,_32,_33)
      },
      /**Create a 4x4 matrix.
       * @memberof module:mcfud/matrix
       * @param {number} _11
       * @param {number} _12
       * @param {number} _13
       * @param {number} _14
       * @param {number} _21
       * @param {number} _22
       * @param {number} _23
       * @param {number} _24
       * @param {number} _31
       * @param {number} _32
       * @param {number} _33
       * @param {number} _34
       * @param {number} _41
       * @param {number} _42
       * @param {number} _43
       * @param {number} _44
       * @return {MatrixObject} new matrix
       */
      mat4(_11,_12,_13,_14,_21,_22,_23,_24,
           _31,_32,_33,_34, _41,_42,_43,_44){
        return this.matrix([4,4],
                           _11,_12,_13,_14,_21,_22,_23,_24,
                           _31,_32,_33,_34,_41,_42,_43,_44)
      },
      /**Check if these 2 matrices are equal.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} a matrix A
       * @param {MatrixObject} b matrix B
       * @return {boolean}
       */
      matEq(a,b){
        return a.dim[0]==b.dim[0] &&
               a.dim[1]==b.dim[1] && _arrayEq(a.cells,b.cells)
      },
      /**Transpose this matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {MatrixObject} new matrix
       */
      matXpose(m){
        const [rows,cols]= m.dim;
        const sz=rows*cols;
        const tmp=[];
        for(let i=0;i<sz;++i)
          tmp.push(m.cells[int(i/rows) + cols*(i%rows)]);
        return _matnew(cols,rows,tmp)
      },
      /**Multiply this matrix with a scalar value.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @param {number} n scalar
       * @return {MatrixObject} new matrix
       */
      matScale(m,n){
        return _matnew(m.dim[0],m.dim[1],m.cells.map(x=> x*n))
      },
      /** Multiply these 2 matrices.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} a matrix A
       * @param {MatrixObject} b matrix B
       * @return {MatrixObject} new matrix
       */
      matMult(a,b){
        let [aRows,aCols]=a.dim;
        let [bRows,bCols]=b.dim;
        let aCells=a.cells;
        let bCells=b.cells;
        _.assert(aCols==bRows, "mismatch matrices");
        let out=new Array(aRows*bCols);
        for(let i=0; i<aRows; ++i)
          for(let j=0; j<bCols; ++j){
            out[j+i*bCols]=
              _.range(bRows).reduce((acc,k)=> {
                return acc + aCells[k+i*aCols] * bCells[j+ k*bCols] },0);
          }
        return _matnew(aRows,bCols,out)
      },
      /**Find the `Determinent` this matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {number}
       */
      matDet(m){
        let [rows,cols]=m.dim;
        let tmp=[];
        if(cols==2)
          return this._matDet2x2(m);
        for(let c=0; c< cols;++c)
          _.conj(tmp,this.matDet(this.matCut(m,1,c+1)));
        return _.range(cols).reduce((acc,j)=>{
          let v=tmp[j];
          return acc + m.cells[j] * (_odd(j) ? -v : v)
        },0)
      },
      /** @ignore */
      _matDet2x2(m){
        _.assert(m.cells.length===4);
        return m.cells[0]*m.cells[3] - m.cells[1]*m.cells[2]
      },
      /**Extract a portion of a matrix by
       * getting rid of a row and col.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @param {number} row the row to cut (1-indexed)
       * @param {number} col the col to cut (1-indexed)
       * @return {MatrixObject} new matrix
       */
      matCut(m,row,col){
        const [rows,cols]=m.dim;
        //change to zero indexed
        let _row = row-1;
        let _col= col-1;
        let tmp=[];
        for(let i=0; i<rows; ++i)
          for(let j=0; j<cols; ++j){
            if(!(i == _row || j == _col))
              _.conj(tmp, m.cells[j+i*cols]);
          }
        return _matnew(rows-1,cols-1, tmp)
      },
      /**Find the `Matrix Minor` of this matrix.
       * A "minor" is the determinant of the square matrix
       * formed by deleting one row and one column from
       * some larger square matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {MatrixObject} new matrix
       */
      matMinor(m){
        const [rows,cols]=m.dim;
        let tmp=[];
        _.assert(rows==cols);
        if(cols==2)
          return this._matMinor2x2(m);
        for(let i=0; i< rows;++i)
          for(let j=0; j<cols; ++j){
            //mat-cut is 1-indexed
            _.conj(tmp,this.matDet(this.matCut(m,i+1,j+1)));
          }
        return _matnew(rows,cols,tmp)
      },
      /** @ignore */
      _matMinor2x2(m){
        return _.assert(m.cells.length==4) &&
               this.mat2(m.cells[3],m.cells[2],m.cells[1],m.cells[0])
      },
      /**Find the `Matrix Cofactor` of this matrix.
       * The cofactor is a signed minor.
       * The cofactor of aij is denoted by Aij and is defined as
       * Aij = (-1)^(i+j) Mij
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m
       * @return {MatrixObject} new matrix
       */
      matCofactor(m){
        const minor=this.matMinor(m);
        const [rows,cols]=minor.dim;
        let tmp=minor.cells.slice();
        for(let r=0;r<rows;++r)
          for(let p,c=0;c<cols;++c){
            p=r*cols+c;
            if(_odd(r+c))
              tmp[p]= -tmp[p];
          }
        return _matnew(rows,cols,tmp)
      },
      /**Find the adjugate of a square matrix.
       * An `Adjugate` is the transpose of its cofactor matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {MatrixObject} new matrix
       */
      matAdjugate(m){
        return this.matXpose(this.matCofactor(m))
      },
      /** @ignore */
      _minv2x2(m){
        const [rows,cols]=m.dim;
        _.assert(m.cells.length==4&&rows==2&&cols==2);
        let r,c=m.cells;
        let det= c[0]*c[3] - c[1]*c[2];
        if(_.feq0(det))
          r=this.matIdentity(rows);
        else{
          let _det= 1/det;
          r= this.mat2(c[3]*_det, -c[1] * _det,
                       -c[2] * _det, c[0] * _det);
        }
        return r
      },
      /**Find the `Inverse` of this matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {MatrixObject} new matrix
       */
      matInv(m){
        const [rows,cols]=m.dim;
        if(cols==2)
          return this._minv2x2(m);
        let d= this.matDet(m);
        return _.feq0(d) ? this.matIdentity(rows)
                         : this.matScale(this.matAdjugate(m), 1/d)
      },
      /**Matrix from column majors.
       * @memberof module:mcfud/matrix
       * @param {number[][]} list of column values
       * @return {MatrixObject} new matrix
       */
      matFromColMajor(arr){
        let numCols= arr.length,
            rows=arr[0].length,
            out=_new_mat(rows,numCols);
        for(let C,c=0;c<arr.length;++c){
          C=arr[c];
          for(let r=0;r<C.length;++r){
            out.cells[r*numCols+c]=C[r];
          }
        }
        return out;
      },
      /**Get the list of `Column Major` vectors from this matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {number[][]}
       */
      matToColMajor(m){
        const [rows,cols]=m.dim;
        const ret=[],
              out=m.cells.slice();
        for(let a,i=0,c=0;c<cols;++c){
          a=[];
          for(let r=0;r<rows;++r)
            a.push(m.cells[r*cols+c]);
          ret.push(a);
        }
        return ret;
      },
      /**Create a 3D scale matrix.
       * @memberof module:mcfud/matrix
       * @param {Vec3} v
       * @return {MatrixObject} new matrix
       */
      scale3D(v){
        const out=this.matIdentity(4);
        out.cells[_cell(4,4,1,1)]=v[0];
        out.cells[_cell(4,4,2,2)]=v[1];
        out.cells[_cell(4,4,3,3)]=v[2];
        return out;
      },
      /**Create a 3D translation matrix.
       * @memberof module:mcfud/matrix
       * @param {Vec3} v
       * @return {MatrixObject} new matrix
       */
      translate3D(v){
        const out=this.matIdentity(4);
        out.cells[_cell(4,4,4,1)]=v[0];
        out.cells[_cell(4,4,4,2)]=v[1];
        out.cells[_cell(4,4,4,3)]=v[2];
        return out;
      },
      /**Create a 3D rotation matrix, rotation order *IMPORTANT*
       * @memberof module:mcfud/matrix
       * @param {number} roll x rotation in radians.
       * @param {number} pitch y rotation in radians.
       * @param {number} yaw z rotation in radians.
       * @return {MatrixObject} new matrix
       */
      rot3D(roll,pitch,yaw){
        //x,y,z order is important, matrix not commutative
        return this.matMult(this.zRot3D(yaw),
                            this.matMult(this.yRot3D(pitch),
                                         this.xRot3D(roll)));
      },
      /**Multiply matrix and  vector.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @param {VecN} v the vector
       * @return {VecN} vector
       */
      matVMult(m,v){
        let cols=m.dim[1];
        let rows=v.length;
        _.assert(cols==rows);
        let r= this.matMult(m, _matnew(rows, 1, v));
        let c=r.cells;
        r.cells=null;
        return c
      },
      /**Rotate a 2x2 matrix, counter-clockwise.
       * @memberof module:mcfud/matrix
       * @param {number} rot in radians
       * @return {MatrixObject} new matrix
       */
      rot2D(rot){
        return this.mat2(COS(rot),-SIN(rot),SIN(rot),COS(rot))
      },
      /**Rotate on x-axis.
       * @memberof module:mcfud/matrix
       * @param {number} rad value in radians
       * @return {MatrixObject} new matrix
       */
      xRot3D(rad){
        return this.mat4(1,0,0,0,
                         0,COS(rad),-SIN(rad),0,
                         0,SIN(rad),COS(rad),0,
                         0,0,0,1)
      },
      /**Rotate on y-axis.
       * @memberof module:mcfud/matrix
       * @param {number} rad value in radians
       * @return {MatrixObject} new matrix
       */
      yRot3D(rad){
        return this.mat4(COS(rad),0,SIN(rad),0,
                         0,1, 0, 0,
                         -SIN(rad), 0, COS(rad), 0,
                         0,0,0,1)
      },
      /**Rotate on z-axis.
       * @memberof module:mcfud/matrix
       * @param {number} rad value in radians
       * @return {MatrixObject} new matrix
       */
      zRot3D(rad){
        return this.mat4(COS(rad), -SIN(rad), 0, 0,
                         SIN(rad),COS(rad), 0, 0,
                         0, 0, 1, 0,
                         0, 0, 0, 1)
      },
      /**Check if m is an `identity` matrix.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {boolean}
       */
      isIdentity(m){
        const [rows,cols]=m.dim;
        if(rows==cols){
          for(let v,r=0;r<rows;++r){
            for(let c=0;c<cols;++c){
              v=m.cells[r*cols+c];
              if((r+1)==(c+1)){
                if(v != 1) return false;
              }else if(v != 0) return false;
            }
          }
          return true
        }else{
          return false
        }
      },
      /**Check if matrix is `orthogonal`.
       * @memberof module:mcfud/matrix
       * @param {MatrixObject} m the matrix
       * @return {boolean}
       */
      isOrthogonal(m){
        //Given a square matrixA, to check for its orthogonality steps are:
        //Find the determinant of A. If, it is 1 then,
        //find the inverse matrix of inv(A) and transpose of xpos(A),
        //if xpose(A) X inv(A) === I
        //then A will be orthogonal
        let r,d= this.matDet(m);
        return Math.abs(d)==1 &&
               this.isIdentity(this.matMult(this.matXpose(m), this.matInv(m)));
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/matrix"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  const VISCHS=(" @N/\\Ri2}aP`(xeT4F3mt;8~%r0v:L5$+Z{'V)\"CKIc>z.*"+
                "fJEwSU7juYg<klO&1?[h9=n,yoQGsW]BMHpXb6A|D#q^_d!-").split("");
  const VISCHS_LEN=VISCHS.length;

  /**Create the module.
  */
  function _module(Core){

    if(!Core)
      Core= gscope["io/czlab/mcfud/core"]();
    const {u:_} = Core;

    /**
     * @module mcfud/crypt
     */

    /**Find the offset. */
    const _calcDelta=(shift)=> Math.abs(shift) % VISCHS_LEN;

    /**Get the char at the index. */
    const _charat=(i)=> VISCHS[i];

    /**Index for this char. */
    const _getch=(ch)=> VISCHS.findIndex(c=> c==ch);

    /**Rotate right. */
    function _rotr(delta, cpos){
      let pos= cpos+delta;
      return _charat(pos >= VISCHS_LEN ? (pos-VISCHS_LEN) : pos)
    }

    /**Rotate left. */
    function _rotl(delta, cpos){
      let pos= cpos-delta;
      return _charat(pos< 0 ? (VISCHS_LEN+pos) : pos)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _ef=(shift,delta,cpos)=> shift<0 ? _rotr(delta,cpos) : _rotl(delta,cpos);
    const _df=(shift,delta,cpos)=> shift<0 ? _rotl(delta,cpos) : _rotr(delta,cpos);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Encrypt source by shifts.
       * @memberof module:mcfud/crypt
       * @param {string} src
       * @param {number} shift
       * @return {string} encrypted text
       */
      encrypt(src, shift){
        if(shift!=0){
          let p,d=_calcDelta(shift);
          p= src.split("").map(c=>{
            p=_getch(c);
            return p<0?c:_ef(shift,d,p);
          });
          src=p.join("");
        }
        return src;
      },
      /**Decrypt text by shifts.
       * @memberof module:mcfud/crypt
       * @param {string} cipherText
       * @param {number} shift
       * @return {string} decrypted text
       */
      decrypt(cipherText,shift){
        if(shift!=0){
          let p,d= _calcDelta(shift);
          p=cipherText.split("").map(c=>{
            p= _getch(c);
            return p<0?c:_df(shift,d,p);
          });
          cipherText=p.join("");
        }
        return cipherText;
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/crypt"]=_module;
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
  */
  function _module(Core){

    if(!Core)
      Core=gscope["io/czlab/mcfud/core"]();

    /**
     * @module mcfud/fsm
     */

    /**
     * @typedef {object} FSMStateTransition
     * @property {string} target  switching to this target state
     * @property {function} action() run this code upon the transition
     */

    /**
     * @typedef {object} FSMStateTransitionList
     * @property {FSMStateTransition} transition-1 user defined transition
     * @property {FSMStateTransition} ...          more
     * @property {FSMStateTransition} transition-n  user defined transition
     */

    /**
     * @typedef {object} FSMState
     * @property {function} enter() run this code when the FSM switches to this state
     * @property {function} exit()  run this code when the FSM switches away from this state
     * @property {FSMStateTransitionList} transitions  a list of state transition definitions
     */

    /**
     * @typedef {object} FSMDefn
     * @property {function} initState() return the initial state
     * @property {FSMState} state-1 a user defined state
     * @property {FSMState} ...     more
     * @property {FSMState} state-n a user defined state
     */

    /**
     * @typedef {object} FSMObject
     * @property {function} state() returns the current state
     * @property {function} process() execute any runnable code defined by the current state
     * @property {function} trigger(event) apply this event to the state machine
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Create a FSM instance.
       * @memberof module:mcfud/fsm
       * @param {FSMDefn} defn
       * @return {FSMObject}
       */
      fsm(defn){
        let _state=defn.initState();
        return {
          /** the current state */
          state(){ return _state },
          /** run the current state `code` */
          process(){
            const fromStateObj=defn[_state];
            if(fromStateObj)
              fromStateObj.run && fromStateObj.run();
          },
          /** apply an event */
          trigger(event="change",options){
            const fromStateObj= defn[_state];
            const tx= fromStateObj &&
                      fromStateObj.transitions[event];
            //react to this event
            if(tx){
              const nextState = tx.target;
              const nextStateObj = defn[nextState];
              if(nextStateObj){
                fromStateObj.exit && fromStateObj.exit();
                nextStateObj.enter && nextStateObj.enter();
                if(options && options.action){
                  options.action()
                }else if(tx.action){
                  tx.action(options)
                }
                return (_state = nextState);
              }
            }
          }
        }
      }
    };

    return _$;
  }

  /**Sample definition syntax/format.
   * @ignore
   */
  const sample={
    /** provides the initial state of this FSM */
    initState(){ return "happy"},
    /** follow by a list of state definitions */
    "happy":{
      enter(){ console.log("happy: entering") },
      exit(){ console.log("happy: exiting") },
      transitions:{
        "rain":{
          target: "sad",
          action(){ console.log("from happy to sad") }
        }
      }
    },
    "sad":{
      enter(){ console.log("sad: entering") },
      exit(){ console.log("sad: exiting") },
      transitions:{
        "sun":{
          target: "happy",
          action(){ console.log("from sad to happy") }
        }
      }
    }
  };

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/fsm"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_V, _M, _X){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    if(!_V) _V=gscope["io/czlab/mcfud/vec2"]();
    if(!_M) _M=gscope["io/czlab/mcfud/math"]();
    if(!_X) _X=gscope["io/czlab/mcfud/matrix"]();

    const TWO_PI=Math.PI*2;
    const {u:_}=Core;

    /**
     * @module mcfud/gfx
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      /**Set HTML5 2d-context's transformation matrix.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html2d-context
       * @param {C2DMatrix} m
       * @param {boolean} reset [false]
       * @return {CanvasRenderingContext2D} ctx
       */
      setContextTransform(ctx,m,reset=false){
        // source:
        //  m[0] m[1] m[2]
        //  m[3] m[4] m[5]
        //  0     0   1
        // destination:
        //  m11  m21  dx
        //  m12  m22  dy
        //  0    0    1
        //setTransform(m11, m12, m21, m22, dx, dy)
        ctx[reset?"setTransform":"transform"](m.cells[0],m.cells[3],
                                              m.cells[1],m.cells[4],
                                              m.cells[2],m.cells[5]);
        return ctx;
      },
      /**Html5 Text Style object.
       * @example
       * "14px 'Arial'" "#dddddd" "left" "top"
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx htm5 2d-context
       * @param {string} font
       * @param {string|number} stroke
       * @param {string|number} fill
       * @param {string} align
       * @param {string} base
       * @return {CanvasRenderingContext2D} ctx
       */
      textStyle(ctx,font,stroke,fill,align,base){
        if(font)
          ctx.font=font;
        if(fill)
          ctx.fillStyle=fill;
        if(align)
          ctx.textAlign=align;
        if(base)
          ctx.textBaseline=base;
        if(stroke)
          ctx.strokeStyle=stroke;
        return ctx;
      },
      /**Draw the shape onto the html5 canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {object} s a shape
       * @param {...any} args
       * @return {CanvasRenderingContext2D} ctx
       */
      drawShape(ctx,s, ...args){
        if(s && s.draw) s.draw(ctx, ...args);
        return ctx;
      },
      /**Apply styles to the canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {string|number} stroke
       * @param {string|number} fill
       * @param {number} lineWidth
       * @param {string} lineCap
       * @return {CanvasRenderingContext2D} ctx
       */
      cfgStyle(ctx,stroke,fill,lineWidth,lineCap){
        if(fill)
          ctx.fillStyle=fill;
        if(stroke)
          ctx.strokeStyle=stroke;
        if(lineCap)
          ctx.lineCap=lineCap;
        if(lineWidth)
          ctx.lineWidth = lineWidth;
        return ctx;
      },
      /**Draw and connect this set of points onto the canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {Vec2[]} points
       * @return {CanvasRenderingContext2D} ctx
       */
      drawPoints(ctx,points){
        ctx.beginPath();
        for(let p,q,i2,z=points.length,i=0;i<z;++i){
          i2= (i+1)%z;
          p=points[i];
          q=points[i2];
          ctx.moveTo(_V.gx(p), _V.gy(p));
          ctx.lineTo(_V.gx(q), _V.gy(q));
        }
        ctx.closePath();
        ctx.stroke();
        return ctx;
      },
      /**Fill and connect this set of points onto the canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {Vec2[]} points
       * @return {CanvasRenderingContext2D} ctx
       */
      fillPoints(ctx,points){
        ctx.beginPath();
        for(let p,q,i2,z=points.length,i=0;i<z;++i){
          i2= (i+1)%z;
          p=points[i];
          q=points[i2];
          if(i==0)
            ctx.moveTo(_V.gx(p), _V.gy(p));
          else
            ctx.lineTo(_V.gx(p), _V.gy(p));
          ctx.lineTo(_V.gx(q), _V.gy(q));
        }
        ctx.closePath();
        ctx.fill();
        return ctx;
      },
      /**Draw a circle onto the canvas.  If a starting point
       * is provided, draw a line to the center.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {number} x
       * @param {number} y
       * @param {radius} r
       * @return {CanvasRenderingContext2D} ctx
       */
      drawCircle(ctx,x,y,radius){
        ctx.beginPath();
        ctx.arc(x,y,radius,0,TWO_PI,true);
        ctx.closePath();
        ctx.stroke();
        return ctx;
      },
      /**Fill a circle onto the canvas.  If a starting point
       * is provided, draw a line to the center.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {number} x
       * @param {number} y
       * @param {radius} r
       * @return {CanvasRenderingContext2D} ctx
       */
      fillCircle(ctx,x,y,radius){
        ctx.beginPath();
        ctx.arc(x,y,radius,0,TWO_PI,true);
        ctx.closePath();
        ctx.fill();
        return ctx;
      },
      /**Draw a rectangle.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d=context
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @param {number} rot
       * @param {number} cx [0]
       * @param {number} cy [0]
       * @return {CanvasRenderingContext2D} ctx
       */
      drawRect(ctx,x,y,width,height,rot=0,cx=0,cy=0){
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(rot);
        ctx.translate(-cx,-cy);
        ctx.strokeRect(x,y,width,height);
        ctx.restore();
        return ctx;
      },
      /**Fill a rectangle.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d=context
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @param {number} rot
       * @param {number} cx [0]
       * @param {number} cy [0]
       * @return {CanvasRenderingContext2D} ctx
       */
      fillRect(ctx,x,y,width,height,rot=0,cx=0,cy=0){
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(rot);
        ctx.translate(-cx,-cy);
        ctx.fillRect(x,y,width,height);
        ctx.restore();
        return ctx;
      },
      /**Draw a line.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       * @return {CanvasRenderingContext2D} ctx
       */
      drawLine(ctx,x1,y1,x2,y2){
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
        return ctx;
      },
      /**Write text.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {string} msg
       * @param {number} x
       * @param {number} y
       * @return {CanvasRenderingContext2D} ctx
       */
      drawText(ctx,msg,x,y){
        ctx.strokeText(msg, x,y);
        return ctx;
      },
      /**Fill text.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {string} msg
       * @param {number} x
       * @param {number} y
       * @return {CanvasRenderingContext2D} ctx
       */
      fillText(ctx,msg,x,y){
        ctx.fillText(msg, x,y);
        return ctx;
      },
      /**Clear the canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @return {CanvasRenderingContext2D} ctx
       */
      clearCanvas(ctx){
        return this.clearRect(ctx, 0,0,ctx.canvas.width, ctx.canvas.height);
      },
      /**Fill the canvas.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @return {CanvasRenderingContext2D} ctx
       */
      fillCanvas(ctx){
        return this.fillRect(ctx, 0,0,ctx.canvas.width, ctx.canvas.height);
      },
      /**Clear a rectangular region.
       * @memberof module:mcfud/gfx
       * @param {CanvasRenderingContext2D} ctx html5 2d-context
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @return {CanvasRenderingContext2D} ctx
       */
      clearRect(ctx,x,y,width,height){
        ctx.clearRect(x,y,width,height);
        return ctx;
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"),
                           require("./vec2"),
                           require("./math"),
                           require("./matrix"))
  }else{
    gscope["io/czlab/mcfud/gfx"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /** @ignore */
  const [LEFT_VORONOI, MID_VORONOI, RIGHT_VORONOI]= [1,0,-1];

  /**Create the module.
   * Standard XY cartesian coordinates, Y axis goes UP
   */
  function _module(Core,_M,_V,_X,_B){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    if(!_M) _M=gscope["io/czlab/mcfud/math"]();
    if(!_V) _V=gscope["io/czlab/mcfud/vec2"]();
    if(!_X) _X=gscope["io/czlab/mcfud/matrix"]();
    if(!_B) _B= gscope["io/czlab/mcfud/algo/basic"]();

    const {Stack,StdCompare:CMP}= _B;
    const int=Math.floor;
    const MaxVerts=36;
    const {is,u:_}=Core;

    /**
     * @module mcfud/geo2d
     */

    /**
     * @typedef {number[]} Vec2
     */

    /**Check if point inside a polygon.
     * @see https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
     * @ignore
     */
    function _pointInPoly(testx,testy,points){
      let c=false,
          nvert=points.length;
      for(let p,q, i=0, j=nvert-1; i<nvert;){
        p=points[i];
        q=points[j];
        if(((p[1]>testy) !== (q[1]>testy)) &&
          (testx < (q[0]-p[0]) * (testy-p[1]) / (q[1]-p[1]) + p[0])) c = !c;
        j=i;
        ++i;
      }
      return c
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TheHull=_.fill(MaxVerts,UNDEF);
    /**Original source from Randy Gaul's impulse-engine:
     * https://github.com/RandyGaul/ImpulseEngine#Shape.h
     */
    function _orderPointsCCW(vertices){
      _.assert(vertices.length>2 && vertices.length <= MaxVerts, "too little/many vertices");
      //find the right-most point
      let rightMost=0,
          maxX= vertices[0][0];
      for(let x,i=1; i<vertices.length; ++i){
        x=vertices[i][0];
        if(x>maxX){
          maxX= x;
          rightMost= i;
        }else if(_.feq(x, maxX) &&
                 vertices[i][1]<vertices[rightMost][1]){
          //if same x then choose one with smaller y
          rightMost = i;
        }
      }
      let hpos=0,
          cur=rightMost;
      //examine all the points, sorting them in order of ccw from the rightmost, one by one
      //and eventually wraps back to the rightmost point, at which time exit this inf-loop
      for(;;){
        TheHull[hpos]=cur;
        //search for next index that wraps around the hull
        //by computing cross products to find the most counter-clockwise
        //vertex in the set, given the previos hull index
        let next= 0,
            hp=TheHull[hpos];
        for(let e1,e2,c,i=1; i<vertices.length; ++i){
          if(next==cur){ next= i; continue } //same point, skip
          //cross every set of three unique vertices
          //record each counter clockwise third vertex and add
          //to the output hull
          //see: http://www.oocities.org/pcgpe/math2d.html
          e1= _V.sub(vertices[next], vertices[hp]);
          e2= _V.sub(vertices[i], vertices[hp]);
          c= _V.cross(e1,e2);
          if(c<0){ next=i } //counterclockwise, e2 on left of e1
          //cross product is zero then e vectors are on same line
          //therefore want to record vertex farthest along that line
          if(_.feq0(c) && _V.len2(e2) > _V.len2(e1)){next=i}
        }
        //we found the *next* point *left,ccw* of last hull point
        cur=next;
        ++hpos;
        //conclude algorithm upon wrap-around
        if(next==rightMost){ break }
      }
      const result=[];
      for(let i=0; i<hpos; ++i)
        result.push(_V.clone(vertices[TheHull[i]]));
      return result;
    }

    /**A Rectangle, standard Cartesian: bottom-left corner + width + height.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {Vec2} pos
     * @property {number} width
     * @property {number} height
     */
    class Rect{
      /**
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       */
      constructor(x,y,width,height){
        switch(arguments.length){
          case 2:
            this.pos= _V.vec();
            this.width=x;
            this.height=y;
            break;
          case 4:
            this.pos=_V.vec(x,y);
            this.width=width;
            this.height=height;
            break;
          default:
            throw "Error: bad input to Rect()";
        }
      }
    }

    /**An Area.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {number} width
     * @property {number} height
     */
    class Area{
      /**
       * @param {number} w
       * @param {number} h
       */
      constructor(w,h){
        this.width=w;
        this.height=h;
      }
      /**
       * @return {Area}
       */
      half(){
        return new Area(_M.ndiv(this.width,2),_M.ndiv(this.height,2))
      }
    }

    /**A Line.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {Vec2} p
     * @property {Vec2} q
     */
    class Line{
      /**
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       */
      constructor(x1,y1,x2,y2){
        this.p= _V.vec(x1,y1);
        this.q= _V.vec(x2,y2);
      }
    }

    /**
     * @class
     */
    class Body{
      constructor(s,x=0,y=0){
        this.pos=_V.vec(x,y);
        this.shape=s;
      }
    }

    /**
     * @abstract
     */
    class Shape{
      constructor(){
        this.orient=0;
      }
      setOrient(r){
        throw Error("no implementation")
      }
    }

    /**A Circle.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {number} radius
     * @property {number} orient
     */
    class Circle extends Shape{
      /**
       * @param {number} r
       */
      constructor(r){
        super();
        this.radius=r;
      }
      /**Set the rotation.
       * @param {number} r
       * @return {Circle} self
       */
      setOrient(r){
        this.orient=r;
        return this;
      }
    }

    /**A Polygon, points are specified in COUNTER-CLOCKWISE order.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {Vec2} pos
     * @property {Vec2[]} normals
     * @property {Vec2[]} edges
     * @property {Vec2[]} points
     * @property {number} orient
     * @property {Vec2[]} calcPoints
     */
    class Polygon extends Shape{
      constructor(points){
        super();
        this.calcPoints=[];
        this.normals=[];
        this.edges=[];
        this.set(points||[]);
      }
      /**Set vertices.
       * @param {Vec2[]} points
       * @return {Polygon}
       */
      set(points){
        this.calcPoints.length=0;
        this.normals.length=0;
        this.edges.length=0;
        this.points= _orderPointsCCW(points);
        this.points.forEach(p=>{
          this.calcPoints.push(_V.vec());
          this.edges.push(_V.vec());
          this.normals.push(_V.vec());
        });
        return this._recalc();
      }
      /**Set rotation.
       * @param {number} rot
       * @return {Polygon} self
       */
      setOrient(rot){
        this.orient = rot;
        return this._recalc();
      }
      /**Move the points.
       * @param {number} x
       * @param {number} y
       * @return {Polygon}
       */
      moveBy(x, y){
        this.points.forEach(p=>{
          p[0] += x;
          p[1] += y;
        });
        return this._recalc();
      }
      /** @ignore */
      _recalc(){
        let N=this.points.length;
        this.points.forEach((p,i)=>{
          _V.copy(this.calcPoints[i],p);
          if(!_.feq0(this.orient))
            _V.rot$(this.calcPoints[i],this.orient);
        });
        this.points.forEach((p,i)=>{
          this.edges[i]= _V.sub(this.calcPoints[(i+1)%N],
                                this.calcPoints[i]);
          this.normals[i]= _V.unit(_V.normal(this.edges[i]));
        });
        return this;
      }
    }

    /** @ignore */
    function toPolygon(r){
      return new Polygon([_V.vec(r.width,0),
                          _V.vec(r.width,r.height),
                          _V.vec(0,r.height),_V.vec()]);
    }

    /**A collision manifold.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {Vec2} overlapN  overlap normal
     * @property {Vec2} overlapV  overlap vector
     * @property {number} overlap overlap magnitude
     * @property {object} A
     * @property {object} B
     * @property {boolean} AInB
     * @property {boolean} BInA
     */
    class Manifold{
      /**
       * @param {Vec2} overlapN
       * @param {Vec2} overlapV
       * @param {object} A
       * @param {object} B
       */
      constructor(A,B){
        this.overlapN = _V.vec();
        this.overlapV = _V.vec();
        this.A = A;
        this.B = B;
        this.clear();
      }
      swap(){
        let m=new Manifold();
        let aib=this.AInB;
        let bia=this.BInA;
        let a=this.A;

        m.overlap=this.overlap;
        m.A=this.B;
        m.B=a;
        m.AInB=bia;
        m.BInA=aib;
        m.overlapN=_V.flip(this.overlapN);
        m.overlapV=_V.flip(this.overlapV);
        //m.overlapV[0]=m.overlapN[0]*this.overlap;
        //m.overlapV[1]=m.overlapN[1]*this.overlap;
        return m;
      }
      /**Reset to zero. */
      clear(){
        this.overlap = Infinity;
        this.AInB = true;
        this.BInA = true;
        return this;
      }
    }

    //------------------------------------------------------------------------
    // 2d collision using Separating Axis Theorem.
    // see https://github.com/jriecken/sat-js
    //------------------------------------------------------------------------

    /**Check all shadows onto this axis and
     * find the min and max.
     */
    function _findProjRange(points, axis){
      let min = Infinity,
          max = -Infinity;
      for(let dot,i=0; i<points.length; ++i){
        dot= _V.dot(points[i],axis);
        if(dot<min) min = dot;
        if(dot>max) max = dot;
      }
      return [min,max]
    }

    /** @ignore */
    function _voronoiRegion(line, point){
      let n2 = _V.len2(line),
          dp = _V.dot(point,line);
      //If pt is beyond the start of the line, left voronoi region
      //If pt is beyond the end of the line, right voronoi region
      return dp<0 ? LEFT_VORONOI : (dp>n2 ? RIGHT_VORONOI : MID_VORONOI)
    }

    /** @ignore */
    function _testSAT(aPos,aPoints, bPos,bPoints, axis, resolve){
      let [minA,maxA] =_findProjRange(aPoints, axis);
      let [minB,maxB] =_findProjRange(bPoints, axis);
      //B relative to A; A--->B
      let vAB= _V.vecAB(aPos,bPos);
      let proj= _V.dot(vAB,axis);
      //move B's range to its position relative to A.
      minB += proj;
      maxB += proj;
      if(minA>maxB || minB>maxA){ return true }
      if(resolve){
        let overlap = 0;
        //A starts left of B
        if(minA<minB){
          resolve.AInB = false;
          //A ends before B does, have to pull A out of B
          if(maxA < maxB){
            overlap= maxA - minB;
            resolve.BInA = false;
          }else{
            //B is fully inside A.  Pick the shortest way out.
            let [d1,d2] = [maxA - minB, maxB - minA];
            overlap = d1 < d2 ? d1 : -d2;
          }
        //B starts left than A
        }else{
          resolve.BInA = false;
          //B ends before A ends, have to push A out of B
          if(maxA>maxB){
            overlap = minA - maxB;
            resolve.AInB = false;
          }else{
            //A is fully inside B.  Pick the shortest way out.
            let [d1,d2] = [maxA - minB, maxB - minA];
            overlap = d1 < d2 ? d1 : -d2;
          }
        }
        //if smallest amount of overlap, set it as the minimum overlap.
        let absOverlap= Math.abs(overlap);
        if(absOverlap < resolve.overlap){
          resolve.overlap = absOverlap;
          _V.copy(resolve.overlapN,axis);
          if(overlap<0) _V.flip$(resolve.overlapN);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //const _FAKE_POLY= toPolygon(new Rect(0,0, 1, 1));

    /** @ignore */
    function _circle_circle(a, b, resolve){
      let r_ab = a.shape.radius+b.shape.radius,
          vAB= _V.vecAB(a.pos,b.pos),
          d2 = _V.len2(vAB),
          r2 = r_ab*r_ab,
          dist, status= !(d2 > r2);
      if(status && resolve){
        dist = Math.sqrt(d2);
        resolve.A = a;
        resolve.B = b;
        resolve.overlap = r_ab - dist;
        _V.copy(resolve.overlapN, _V.unit$(vAB));
        _V.copy(resolve.overlapV, _V.mul(vAB,resolve.overlap));
        resolve.AInB = a.shape.radius <= b.shape.radius && dist <= b.shape.radius - a.shape.radius;
        resolve.BInA = b.shape.radius <= a.shape.radius && dist <= a.shape.radius - b.shape.radius;
      }
      return status;
    }

    /** @ignore */
    function _poly_circle(polygon, circle, resolve){
      // get position of the circle relative to the polygon.
      let r2 = circle.shape.radius*circle.shape.radius,
          vPC= _V.vecAB(polygon.pos,circle.pos),
          cps = polygon.shape.calcPoints,
          point, edge = _V.vec();
      // for each edge in the polygon:
      for(let next,prev, overlap,overlapN,len=cps.length,i=0; i<len; ++i){
        next = i == len-1 ? 0 : i+1;
        prev = i == 0 ? len-1 : i-1;
        overlap = 0;
        overlapN = null;
        _V.copy(edge,polygon.shape.edges[i]);
        // calculate the center of the circle relative to the starting point of the edge.
        point=_V.vecAB(cps[i],vPC);
        // if the distance between the center of the circle and the point
        // is bigger than the radius, the polygon is definitely not fully in
        // the circle.
        if(resolve && _V.len2(point) > r2){
          resolve.AInB = false;
        }
        // calculate which Voronoi region the center of the circle is in.
        let region = _voronoiRegion(edge, point);
        if(region === LEFT_VORONOI){
          // need to make sure we're in the RIGHT_VORONOI of the previous edge.
          _V.copy(edge,polygon.shape.edges[prev]);
          // calculate the center of the circle relative the starting point of the previous edge
          let point2= _V.vecAB(cps[prev],vPC);
          region = _voronoiRegion(edge, point2);
          if(region === RIGHT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.len(point);
            if(dist>circle.shape.radius){
              // No intersection
              return false;
            } else if(resolve){
              // intersects, find the overlap.
              resolve.BInA = false;
              overlapN = _V.unit(point);
              overlap = circle.shape.radius - dist;
            }
          }
        } else if(region === RIGHT_VORONOI){
          // need to make sure we're in the left region on the next edge
          _V.copy(edge,polygon.shape.edges[next]);
          // calculate the center of the circle relative to the starting point of the next edge.
          _V.sub$(_V.copy(point,vPC),cps[next]);
          region = _voronoiRegion(edge, point);
          if(region === LEFT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.len(point);
            if(dist>circle.shape.radius){
              return false;
            } else if(resolve){
              resolve.BInA = false;
              overlapN = _V.unit(point);
              overlap = circle.shape.radius - dist;
            }
          }
        }else{
          // check if the circle is intersecting the edge,
          // change the edge into its "edge normal".
          let normal = _V.unit$(_V.normal(edge));
          // find the perpendicular distance between the center of the circle and the edge.
          let dist = _V.dot(point,normal);
          let distAbs = Math.abs(dist);
          // if the circle is on the outside of the edge, there is no intersection.
          if(dist > 0 && distAbs > circle.shape.radius){
            return false;
          } else if(resolve){
            overlapN = normal;
            overlap = circle.shape.radius - dist;
            // if the center of the circle is on the outside of the edge, or part of the
            // circle is on the outside, the circle is not fully inside the polygon.
            if(dist >= 0 || overlap < 2 * circle.shape.radius){
              resolve.BInA = false;
            }
          }
        }
        // if this is the smallest overlap we've seen, keep it.
        // (overlapN may be null if the circle was in the wrong Voronoi region).
        if(overlapN && resolve && Math.abs(overlap) < Math.abs(resolve.overlap)){
          resolve.overlap = overlap;
          _V.copy(resolve.overlapN,overlapN);
        }
      }
      // calculate the final overlap vector - based on the smallest overlap.
      if(resolve){
        resolve.A = polygon;
        resolve.B = circle;
        _V.mul$(_V.copy(resolve.overlapV,resolve.overlapN),resolve.overlap);
      }
      return true;
    }

    /** @ignore */
    function _circle_poly(circle, polygon, resolve){
      let result = _poly_circle(polygon, circle, resolve);
      if(result && resolve){
        // flip A and B
        let a = resolve.A;
        let aInB = resolve.AInB;
        _V.flip$(resolve.overlapN);
        _V.flip$(resolve.overlapV);
        resolve.A = resolve.B;
        resolve.B = a;
        resolve.AInB = resolve.BInA;
        resolve.BInA = aInB;
      }
      return result;
    }

    /** @ignore */
    function _poly_poly(a, b, resolve){
      let pa = a.shape.calcPoints,
          pb = b.shape.calcPoints;
      for(let i=0; i < pa.length; ++i){
        if(_testSAT(a.pos, pa, b.pos, pb, a.shape.normals[i], resolve))
          return false;
      }
      for(let i=0;i < pb.length; ++i){
        if(_testSAT(a.pos, pa, b.pos, pb, b.shape.normals[i], resolve))
          return false;
      }
      if(resolve){
        if(resolve.overlap==0 || _.feq0(resolve.overlap))
          return false;
        resolve.A = a;
        resolve.B = b;
        _V.copy(resolve.overlapV,resolve.overlapN);
        _V.mul$(resolve.overlapV,resolve.overlap);
      }
      return true;
    }

    /**2D transformation matrix.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {object} m internal 3x3 matrix
     */
    class C2DMatrix{
      static create(){ return new C2DMatrix() }
      constructor(){
        this.identity()
      }
      identity(){
        this.m=_X.matIdentity(3);
        return this;
      }
      translate(x, y){
        this.m=_X.matMult(this.m,_X.mat3(1,0,x, 0,1,y,0,0,1));
        return this;
      }
      scale(xScale, yScale){
        this.m=_X.matMult(this.m,_X.mat3(xScale,0,0, 0,yScale,0, 0,0,1));
        return this;
      }
      shear(xDir, yDir){
        this.m=_X.matMult(this.m,_X.mat3(1,xDir,0, yDir,1,0, 0,0,1));
        return this;
      }
      rotateCCW(rot,cx,cy){
        let s = Math.sin(rot),
            c = Math.cos(rot);
        if(cx!==undefined && cy!==undefined){
          this.translate(-cx,-cy);
          this.rotateCCW(rot);
          this.translate(cx,cy);
        }else{
          this.m=_X.matMult(this.m,_X.mat3(c,-s,0, s,c,0, 0,0,1))
        }
        return this;
      }
      rotateCW(rot,cx,cy){
        let s = Math.sin(rot),
            c = Math.cos(rot);
        if(cx!==undefined && cy!==undefined){
          this.translate(-cx,-cy);
          this.rotateCW(rot);
          this.translate(cx,cy);
        }else{
          this.m=_X.matMult(this.m,_X.mat3(c,s,0, -s,c,0, 0,0,1))
        }
        return this;
      }
      transformXY(x,y){
        let v=[x,y,1],
            r=_X.matVMult(this.m,v);
        r.length=2;
        return 2;
      }
      transformPoints(ps){
        let r,v=[0,0,1];
        ps.forEach(p=>{
          if(is.vec(p)){
            v[0]=p[0];v[1]=p[1];
          }else{
            v[0]=p.x;v[1]=p.y;
          }
          r=_X.matVMult(this.m,v);
          if(is.vec(p)){
            p[0]=r[0];p[1]=r[1];
          }else{
            p.x=r[0];p.y=r[1];
          }
        });
      }
    }

    /**
     * @memberof module:mcfud/geo2d
     * @class
     * @property {number} min
     * @property {number} max
     */
    class Interval1D{
      constructor(min, max){
        if(max<min){
          let t=min;
          min=max;
          max=t;
        }
        if(_.feq0(min)) min = 0;
        if(_.feq0(max)) max = 0;
        this.min = min;
        this.max = max;
      }
      min(){ return this.min }
      max(){ return this.max }
      intersects(that){ return (this.max < that.min || that.max < this.min) ? false : true }
      contains(x){ return (this.min <= x) && (x <= this.max) }
      length(){ return this.max - this.min }
      // ascending order of min endpoint
      static MinEndPtCmp(a,b){
        if(a.min < b.min) return -1;
        if(a.min > b.min) return 1;
        if(a.max < b.max) return -1;
        if(a.max > b.max) return 1;
        return  0;
      }
      // ascending order of max endpoint
      static MaxEndPtCmp(a, b){
        if(a.max < b.max) return -1;
        if(a.max > b.max) return 1;
        if(a.min < b.min) return -1;
        if(a.min > b.min) return 1;
        return  0;
      }
      // ascending order of length
      static LenCmp(a, b){
        let alen = a.length(),
            blen = b.length();
        return alen < blen ? -1 : ( alen > blen ? 1 : 0);
      }
      static test(){
        let ps = [new Interval1D(15, 33),
                  new Interval1D(45, 60),
                  new Interval1D(20, 70),
                  new Interval1D(46, 55)];
        console.log("Unsorted");
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by min endpoint");
        ps.sort(Interval1D.MinEndPtCmp);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by max endpoint");
        ps.sort(Interval1D.MaxEndPtCmp);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by length");
        ps.sort(Interval1D.LenCmp);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
      }
    }
    //Interval1D.test();

    /**
     * @memberof module:mcfud/geo2d
     * @class
     * @property {number} x
     * @property {number} y
     */
    class Interval2D{
      constructor(x, y){
        this.x = x;
        this.y = y;
      }
      intersects(that){
        if(!this.x.intersects(that.x)) return false;
        if(!this.y.intersects(that.y)) return false;
        return true;
      }
      contains(p){
        return x.contains(p[0])  && y.contains(p[1]);
      }
      area(){
        return x.length() * y.length();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // stably merge a[lo .. mid] with a[mid+1 ..hi] using aux[lo .. hi]
    // precondition: a[lo .. mid] and a[mid+1 .. hi] are sorted subarrays
    function _merge(a, aux, lo, mid, hi){
      for(let k = lo; k <= hi; ++k) _V.copy(aux[k], a[k]); // copy to aux[]
      // merge back to a[]
      let i = lo, j = mid+1;
      for(let k = lo; k <= hi; ++k){
        if(i > mid) _V.copy(a[k], aux[j++]);
        else if(j > hi) _V.copy(a[k], aux[i++]);
        else if(Point2D.compareTo(aux[j], aux[i])<0) _V.copy(a[k],aux[j++]);
        else _V.copy(a[k], aux[i++]);
      }
    }

    /**
     * @memberof module:mufud/geo2d
     * @class
     */
    class Point2D{
      /** Returns the angle of this point in polar coordinates.
       * @return the angle (in radians) of this point in polar coordiantes (between PI and PI)
       */
      static theta(p){
        return Math.atan2(p[1], p[0]);
      }
      /**Returns the angle between this point and that point.
       * @return the angle in radians (between –PI and PI) between this point and that point (0 if equal)
       */
      static angleBetween(a,b){
        return Math.atan2(b[1] - a[1], b[0] - a[0]);
      }
      /**Returns true if a-> b-> c is a counterclockwise turn.
       * @param a first point
       * @param b second point
       * @param c third point
       * @return {number} -1, 0, 1  if a-> b-> c is a { clockwise, collinear; counterclocwise } turn.
       */
      static ccw(a, b, c){
        let area2 = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
        return area2<0?-1:(area2>0?1:0);
      }
      /**Returns twice the signed area of the triangle a-b-c.
       * @param a first point
       * @param b second point
       * @param c third point
       * @return twice the signed area of the triangle a-b-c
       */
      static area2(a, b, c){
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
      }
      /**Returns the Euclidean distance between this point and that point.
       * @param that the other point
       * @return the Euclidean distance between this point and that point
       */
      static distTo(a,b){
        let dx= a[0] - b[0],
            dy= a[1] - b[1];
        return Math.sqrt(dx*dx + dy*dy);
      }
      /**Returns the square of the Euclidean distance between this point and that point.
       * @param that the other point
       * @return the square of the Euclidean distance between this point and that point
       */
      static distSqTo(a,b){
        let dx= a[0] - b[0],
            dy= a[1] - b[1];
        return dx*dx + dy*dy;
      }
      /**Compares two points by y-coordinate, breaking ties by x-coordinate.
       * Formally, the invoking point (x0, y0) is less than the argument point (x1, y1)
       * if and only if either {@code y0 < y1} or if {@code y0 == y1} and {@code x0 < x1}.
       *
       * @param  that the other point
       * @return the value {@code 0} if this string is equal to the argument
       *         string (precisely when {@code equals()} returns {@code true});
       *         a negative integer if this point is less than the argument
       *         point; and a positive integer if this point is greater than the
       *         argument point
       */
      static compareTo(a,b){
        if(a[1] < b[1]) return -1;
        if(a[1] > b[1]) return 1;
        if(a[0] < b[0]) return -1;
        if(a[0] > b[0]) return 1;
        return 0;
      }
      // compare points according to their x-coordinate
      static XOrderCmp(p, q){
        return p[0] < q[0] ? -1 : (p[0] > q[0] ? 1:0)
      }
      // compare points according to their y-coordinate
      static YOrderCmp(p, q){
        return p[1] < q[1] ? -1 : (p[1] > q[1] ? 1 : 0)
      }
      // compare points according to their polar radius
      static ROrderCmp(p, q){
        let delta = (p[0]*p[0] + p[1]*p[1]) - (q[0]*q[0] + q[1]*q[1]);
        return delta < 0 ? -1 : (delta > 0 ? 1: 0)
      }
      // compare other points relative to polar angle (between 0 and 2PI) they make with this Point
      static PolarOrderCmp(q){
        return (q1,q2)=>{
          let dx1 = q1[0] - q[0];
          let dy1 = q1[1] - q[1];
          let dx2 = q2[0] - q[0];
          let dy2 = q2[1] - q[1];
          if(dy1 >= 0 && dy2 < 0) return -1;    // q1 above; q2 below
          if(dy2 >= 0 && dy1 < 0) return 1;    // q1 below; q2 above
          if(_.feq0(dy1) && _.feq0(dy2)){ // 3-collinear and horizontal
            if(dx1 >= 0 && dx2 < 0) return -1;
            if(dx2 >= 0 && dx1 < 0) return 1;
            return  0;
          }
          return - Point2D.ccw(q, q1, q2);     // both above or below
        }
      }
      // compare points according to their distance to this point
      static DistToOrderCmp(p, q){
        let dist1 = Point2D.distSqTo(p);
        let dist2 = Point2D.distSqTo(q);
        return dist1 < dist2 ? -1 : (dist1 > dist2 ? 1 : 0)
      }
      static equals(a,b){
        if(b === a) return true;
        if(!b) return false;
        return a[0]== b[0] && a[1] == b[1];
      }
      static farthestPair(points){
        let best1=[0,0], best2=[0,0], bestDistance=0,bestDistSQ= -Infinity;
        let m,H = Point2D.calcConvexHull(points);
        // single point
        if(H===false ||
           points.length <= 1) return false;
        // number of points on the hull
        m = H.length;
        // the hull, in counterclockwise order hull[1] to hull[m]
        H.unshift(null);
        // points are collinear
        if(m == 2){
          best1 = H[1];
          best2 = H[2];
          bestDistance= Point2D.distTo(best1,best2);
        }else{
          // k = farthest vertex from edge from hull[1] to hull[m]
          let j,k = 2;
          while(Point2D.area2(H[m], H[1], H[k+1]) > Point2D.area2(H[m], H[1], H[k])){ ++k }
          j = k;
          for(let d2,i = 1; i <= k && j <= m; ++i){
            if(Point2D.distSqTo(H[i],H[j]) > bestDistSQ){
              bestDistSQ= Point2D.distSqTo(H[i],H[j]);
              _V.copy(best1,H[i]);
              _V.copy(best2,H[j]);
            }
            while((j < m) &&
                  Point2D.area2(H[i], H[i+1], H[j+1]) > Point2D.area2(H[i], H[i+1], H[j])){
              ++j;
              d2 = Point2D.distSqTo(H[i], H[j]);
              if(d2 > bestDistSQ){
                bestDistSQ= Point2D.distSqTo(H[i], H[j]);
                _V.copy(best1, H[i]);
                _V.copy(best2, H[j]);
              }
            }
          }
        }
        return {best1,best2,bestDistance: Math.sqrt(bestDistSQ)};
      }
      static closestPair(points){
        // sort by x-coordinate (breaking ties by y-coordinate via stability)
        let best1=[0,0],best2=[0,0],bestDistance=Infinity;
        let pointsByX = points.slice();
        const n=points.length;
        pointsByX.sort(Point2D.YOrderCmp);
        pointsByX.sort(Point2D.XOrderCmp);
        // check for coincident points
        for(let i = 0; i < n-1; ++i){
          if(Point2D.equals(pointsByX[i],pointsByX[i+1])){
            _V.copy(best1, pointsByX[i]);
            _V.copy(best2, pointsByX[i+1]);
            return{ bestDistance:0, best1, best2 }
          }
        }
        // sort by y-coordinate (but not yet sorted)
        let pointsByY = pointsByX.slice();
        let aux = _.fill(n,()=> [0,0]);
        // find closest pair of points in pointsByX[lo..hi]
        // precondition:  pointsByX[lo..hi] and pointsByY[lo..hi] are the same sequence of points
        // precondition:  pointsByX[lo..hi] sorted by x-coordinate
        // postcondition: pointsByY[lo..hi] sorted by y-coordinate
        function _closest(pointsByX, pointsByY, aux, lo, hi){
          if(hi <= lo) return Infinity;
          let mid = lo + _M.ndiv(hi - lo, 2);
          let median = pointsByX[mid];
          // compute closest pair with both endpoints in left subarray or both in right subarray
          let delta1 = _closest(pointsByX, pointsByY, aux, lo, mid);
          let delta2 = _closest(pointsByX, pointsByY, aux, mid+1, hi);
          let delta = Math.min(delta1, delta2);
          // merge back so that pointsByY[lo..hi] are sorted by y-coordinate
          _merge(pointsByY, aux, lo, mid, hi);
          // aux[0..m-1] = sequence of points closer than delta, sorted by y-coordinate
          let m = 0;
          for(let i = lo; i <= hi; ++i)
            if(Math.abs(pointsByY[i][0] - median[0]) < delta) _V.copy(aux[m++],pointsByY[i]);
          // compare each point to its neighbors with y-coordinate closer than delta
          for(let i = 0; i < m; ++i){
            // a geometric packing argument shows that this loop iterates at most 7 times
            for(let d,j = i+1; (j < m) && (aux[j][1] - aux[i][1] < delta); ++j){
              d= Point2D.distTo(aux[i],aux[j]);
              if(d< delta){
                delta = d;
                if(d< bestDistance){
                  bestDistance = delta;
                  _V.copy(best1, aux[i]);
                  _V.copy(best2, aux[j]);
                  //console.log(`better distance = ${delta} from ${best1} to ${best2}`);
                }
              }
            }
          }
          return delta;
        }
        _closest(pointsByX, pointsByY, aux, 0, n-1);
        return {bestDistance,best1,best2};
      }
      /**Computes the convex hull of the specified array of points.
       *  The {@code GrahamScan} data type provides methods for computing the
       *  convex hull of a set of <em>n</em> points in the plane.
       *  <p>
       *  The implementation uses the Graham-Scan convex hull algorithm.
       *  It runs in O(<em>n</em> log <em>n</em>) time in the worst case
       *  and uses O(<em>n</em>) extra memory.
       * @param  points the array of points
       */
      static calcConvexHull(points){
        _.assert(points && points.length>0, "invalid points");
        let a0, n=points.length, a= _.deepCopyArray(points);
        let hull=new Stack();
        // preprocess so that a[0] has lowest y-coordinate; break ties by x-coordinate
        // a[0] is an extreme point of the convex hull
        // (alternatively, could do easily in linear time)
        a.sort(Point2D.compareTo);
        a0=a[0];
        // sort by polar angle with respect to base point a[0],
        // breaking ties by distance to a[0]
        //Arrays.sort(a, 1, n, Point2D.polarOrder(a[0]));
        a.shift();//pop head off
        a.sort(Point2D.PolarOrderCmp(a0));
        //put head back
        a.unshift(a0);

        // a[0] is first extreme point
        hull.push(a[0]);
        // find index k1 of first point not equal to a[0]
        let k1;
        for(k1 = 1; k1 < n; ++k1)
          if(!Point2D.equals(a[0],a[k1])) break;
        if(k1 == n) return false; // all points equal
        // find index k2 of first point not collinear with a[0] and a[k1]
        let k2;
        for(k2 = k1+1; k2 < n; ++k2)
          if(Point2D.ccw(a[0], a[k1], a[k2]) != 0) break;
        // a[k2-1] is second extreme point
        hull.push(a[k2-1]);
        // Graham scan; note that a[n-1] is extreme point different from a[0]
        for(let top,i = k2; i < n; ++i){
          top = hull.pop();
          while(Point2D.ccw(hull.peek(), top, a[i]) <= 0){
            top = hull.pop();
          }
          hull.push(top);
          hull.push(a[i]);
        }
        //Returns the extreme points on the convex hull in counterclockwise order.
        let H = new Stack();
        for(let p,it= hull.iterator();it.hasNext();) H.push(it.next());
        //check if convex
        n = H.size();
        points = [];
        for(let p,it= H.iterator();it.hasNext();){
          points.push(_V.clone(it.next()));
        }
        if(n > 2){
          for(let i = 0; i < n; ++i){
            if(Point2D.ccw(points[i], points[(i+1) % n], points[(i+2) % n]) <= 0)
            return false;
          }
        }
        return points;
      }
      static test_convexHull(){
        let D=`9230 13137 4096 24064 8192 26112 22016  9344 4440  8028 6505 31422 28462 32343 17152 19200 9561 11599
               4096 20992 21538  2430 21903 23677 17152 16128 7168 25088 10162 18638 822 32301 16128 12032 18989  3797
               8192 28160 16128 20224 14080 20224 26112  7296 20367 20436 7486   422 17835  2689 22016  3200 22016  5248
               24650 16886 15104 20224 25866  4204 13056 15104 13662 10301 17152 20224 15104 12032 6144 20992 26112  3200
               6144 29184 13056 12032 8128 20992 5076 19172 17152 17152 823 15895 25216  3200 6071 29161 5120 20992
               10324 22176 29900  9390 27424  7945 4096 23040 12831 27971 29860 12437 28668  2061 1429 12561 29413   596
               17152 18176 8192 27136 5120 29184 22016 11392 1444 10362 32011  3140 15731 32661 26112  4224 13120 20224
               30950  2616 4096 22016 4096 25088 24064  3200 26112  5248 4862 30650 5570  8885 21784 18853 23164 32371
               4160 29184 13056 13056 8192 29184 23040  7296 5120 25088 22016  7296 7168 29184 25216  7296 23040  3200
               4718  4451 14080 16128 7168 20992 19546 17728 13056 16128 17947 17017 26112  6272 20658  1204 23553 13965
               13056 14080 14080 12032 24064  7296 21377 26361 17088
               12032 16128 16128 30875 28560 2542 26201 8192 25088 11444 16973`.split(/\s+/).map(n=>{return +n});
        let p=[];
        for(let i=0;i<D.length;i+=2){
          p.push([D[i],D[i+1]])
        }
        p=[[5,15], [5,-20], [-60,10], [70,-10], [-60,-10], [70,10]];
        //p=[[5,1], [5,-2], [-60,10], [70,-10], [-60,-10], [70,10]];//concave
        let hull=Point2D.calcConvexHull(p);
        if(hull===false || hull.length!=p.length){
          console.log("not convex!");
        }else{
          hull.forEach(v=>{ console.log(`${v[0]}, ${v[1]}`) });
        }
      }
      static test_closestPair(){
        let D=`954 11163 1125 11331 1296 11499 1467 11667 1657 11796 1847 11925 2037 12054 2238 12207 2439 12360
               2640 12513 2878 12523 3116 12533 3354 12543 3518 12493 3682 12443 3846 12393
               8463 7794 8022 7527 7581 7260 7140 6993 6731 6624 6322 6255 5913 5886
               5521 5494 5129 5102 4737 4710 4599 5158`.split(/\s+/).map(n=>{return +n});
        let ps=[];
        for(let i=0;i<D.length;i+=2){
          ps.push([D[i],D[i+1]]);
        }
        let {bestDistance,best1, best2}= Point2D.closestPair(ps)
        console.log(`bestDist=${bestDistance}, p1=${best1}, p2=${best2}`);
      }
      static test_farthestPair(){
        let D=`9230 13137 4096 24064 8192 26112 22016  9344 4440  8028 6505 31422 28462 32343 17152 19200 9561 11599 4096 20992 21538  2430
               21903 23677 17152 16128 7168 25088 10162 18638 822 32301 16128 12032 18989  3797 8192 28160 16128 20224 14080 20224 26112  7296
               20367 20436 7486   422 17835  2689 22016  3200 22016  5248 24650 16886 15104 20224 25866  4204 13056 15104 13662 10301 17152 20224
               15104 12032 6144 20992 26112  3200 6144 29184 13056 12032 8128 20992 5076 19172 17152 17152 823 15895 25216  3200 6071 29161
               5120 20992 10324 22176 29900  9390 27424  7945 4096 23040 12831 27971 29860 12437 28668  2061 1429 12561 29413   596 17152 18176
               8192 27136 5120 29184 22016 11392 1444 10362 32011  3140 15731 32661 26112  4224 13120 20224 30950  2616 4096 22016
               4096 25088 24064  3200 26112  5248 4862 30650 5570  8885 21784 18853 23164 32371 4160 29184 13056 13056 8192 29184 23040  7296
               5120 25088 22016  7296 7168 29184 25216  7296 23040  3200 4718  4451 14080 16128 7168 20992 19546 17728 13056 16128 17947 17017
               26112  6272 20658  1204 23553 13965 13056 14080 14080 12032 24064  7296 21377 26361 17088 12032 16128 16128
               30875 28560 2542 26201 8192 25088 11444 16973`.split(/\s+/).map(n=>{return +n});
        let ps=[];
        for(let i=0;i<D.length;i+=2){
          ps.push([D[i],D[i+1]]);
        }
        let {bestDistance,best1, best2}= Point2D.farthestPair(ps)
        console.log(`bestDist=${bestDistance}, p1=${best1}, p2=${best2}`);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      Rect,
      Area,
      Line,
      Body,
      Circle,
      Polygon,
      Manifold,
      C2DMatrix,
      Point2D,
      Interval1D,
      Interval2D,
      /**Wrap shape in this body
       * @memberof module:mcfud/geo2d
       * @param {Circle|Polygon} s
       * @param {number} x
       * @param {number} y
       * @return {Body}
       */
      bodyWrap(s,x,y){
        return new Body(s, x, y)
      },
      /**Sort vertices in counter clockwise order.
       * @memberof module:mcfud/geo2d
       * @param {Vec2[]} vs
       * @return {Vec2[]}
       */
      orderVertices(vs){ return _orderPointsCCW(vs) },
      /**Calculate the area of this polygon.
       * @memberof module:mcfud/geo2d
       * @param{Vec2[]} points
       * @return {number}
       */
      polyArea(points,sort=false){
        let ps= sort? this.orderVertices(points) : points;
        let area=0;
        for(let p,q,i2,len=ps.length,i=0;i<len;++i){
          i2= (i+1)%len;
          p=ps[i];
          q=ps[i2];
          area += (p[0]*q[1] - q[0]*p[1]);
        }
        return _M.ndiv(Math.abs(area),2)
      },
      /**Find the center point of this polygon.
       * @memberof module:mcfud/geo2d
       * @param {Vec2[]} points
       * @return {Vec2}
       */
      calcPolygonCenter(points,sort=false){
        const ps= sort?this.orderVertices(points):points;
        const A= 6*this.polyArea(ps);
        let cx=0;
        let cy=0;
        for(let p,q,i2,i=0,len=ps.length;i<len;++i){
          i2= (i+1)%len;
          p=ps[i];
          q=ps[i2];
          cx += (p[0]+q[0]) * (p[0]*q[1]-q[0]*p[1]);
          cy += (p[1]+q[1]) * (p[0]*q[1]-q[0]*p[1]);
        }
        return _V.vec(_M.ndiv(cx,A), _M.ndiv(cy,A))
      },
      /**Get the AABB rectangle.
       * @memberof module:mcfud/geo2d
       * @param {Body} obj
       * @return {Rect}
       */
      getAABB(obj){
        _.assert(obj instanceof Body, "wanted a body");
        if(_.has(obj.shape,"radius")){
          return new Rect(obj.pos[0]-obj.shape.radius,
                          obj.pos[1]-obj.shape.radius,
                          obj.shape.radius*2, obj.shape.radius*2)
        }else{
          let cps= _V.translate(obj.pos, obj.shape.calcPoints);
          let xMin= cps[0][0];
          let yMin= cps[0][1];
          let xMax= xMin;
          let yMax= yMin;
          for(let p,i=1; i<cps.length; ++i){
            p= cps[i];
            if(p[0] < xMin) xMin = p[0];
            if(p[0] > xMax) xMax = p[0];
            if(p[1] < yMin) yMin = p[1];
            if(p[1] > yMax) yMax = p[1];
          }
          return new Rect(xMin, yMin, xMax - xMin, yMax - yMin)
        }
      },
      /**Shift a set of points.
       * @memberof module:mcfud/geo2d
       * @param {Vec2[]} points
       * @param {Vec2|number} delta
       * @return {Vec2[]}
       */
      shiftPoints(points,delta){
        return points.map(v=> _V.add(v,delta))
      },
      /**Rotate a set of points.
       * @memberof module:mcfud/geo2d
       * @param {Vec2[]} points
       * @param {number} rot
       * @param {Vec2} [pivot]
       */
      rotPoints(points,rot,pivot){
        return points.map(v=> _V.rot(v,rot,pivot))
      },
      /**Find the vertices of a rectangle, centered at origin.
       * @memberof module:mcfud/geo2d
       * @param {number} w
       * @param {number} h
       * @return {Vec2[]} points in counter-cwise, bottom-right first
       */
      calcRectPoints(w,h){
        const hw=w/2,
              hh=h/2;
        return [_V.vec(hw,-hh), _V.vec(hw,hh),
                _V.vec(-hw,hh), _V.vec(-hw,-hh)]
      },
      /**Create a Line object.
       * @memberof module:mcfud/geo2d
       * @return {Line}
       */
      line(x1,y1,x2,y2){ return new Line(x1,y1,x2,y2) },
      /**Check if 2 rects are equal.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r1
       * @param {Rect} r2
       * @return {boolean}
       */
      rectEqRect(r1,r2){
        return r1.width==r2.width &&
               r1.height==r2.height &&
               r1.pos[0]==r2.pos[0] &&
               r1.pos[1]==r2.pos[1]
      },
      /**Check if `R` contains `r`.
       * @memberof module:mcfud/geo2d
       * @param {Rect} R
       * @param {Rect} r
       * @return {boolean}
       */
      rectContainsRect(R,r){
        return !(R.pos[0] >= r.pos[0] ||
                 R.pos[1] >= r.pos[1] ||
                 (R.pos[0]+R.width) <= (r.pos[0]+r.width) ||
                 (R.pos[1]+R.height) <= (r.pos[1]+r.height))
      },
      /**Get the right side on the x-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMaxX(r){ return r.pos[0] + r.width },
      /**Get the middle on the x-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMidX(r){ return r.pos[0] + r.width/2 },
      /**Get the left on the x-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMinX(r){ return r.pos[0] },
      /**Get the top on the y-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMaxY(r){ return r.pos[1] + r.height },
      /**Get the mid point on the y-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMidY(r){ return r.pos[1] + r.height/2 },
      /**Get the bottom on the y-axis.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r
       * @return {number}
       */
      rectGetMinY(r){ return r.pos[1] },
      /**Check if point lies inside rect.
       * @memberof module:mcfud/geo2d
       * @param {Rect} R
       * @param {number} x
       * @param {number} y
       * @return {boolean}
       */
      rectContainsPoint(R,x,y){
        return x >= this.rectGetMinX(R) &&
               x <= this.rectGetMaxX(R) &&
               y >= this.rectGetMinY(R) &&
               y <= this.rectGetMaxY(R)
      },
      /**Check if 2 rects intersects.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r1
       * @param {Rect} r2
       * @return {boolean}
       */
      rectOverlayRect(r1,r2){
        return !((r1.pos[0]+r1.width) < r2.pos[0] ||
                 (r2.pos[0]+r2.width) < r1.pos[0] ||
                 (r1.pos[1]+r1.height) < r2.pos[1] ||
                 (r2.pos[1]+r2.height) < r1.pos[1])
      },
      /**Find the union of these 2 rects.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r1
       * @param {Rect} r2
       * @return {Rect}
       */
      rectUnion(r1,r2){
        const x= Math.min(r1.pos[0],r2.pos[0]);
        const y= Math.min(r1.pos[1],r2.pos[1]);
        return new Rect(x,y,
                        Math.max(r1.pos[0]+r1.width, r2.pos[0]+r2.width)-x,
                        Math.max(r1.pos[1]+r1.height, r2.pos[1]+r2.height)-y)
      },
      /**Find the intersection of these 2 rects.
       * @memberof module:mcfud/geo2d
       * @param {Rect} r1
       * @param {Rect} r2
       * @return {Rect}
       */
      rectIntersection(r1,r2){
        if(this.rectOverlayRect(r1,r2)){
          const x= Math.max(r1.pos[0],r2.pos[0]);
          const y= Math.max(r1.pos[1],r2.pos[1]);
          return new Rect(x,y,
                          Math.min(r1.pos[0]+r1.width, r2.pos[0]+r2.width)-x,
                          Math.min(r1.pos[1]+r1.height, r2.pos[1]+r2.height)-y)
        }
      },
      /**Check if circle contains this point.
       * @memberof module:mcfud/geo2d
       * @param {number} px
       * @param {number} py
       * @param {Circle} c
       * @return {boolean}
       */
      hitTestPointCircle(px, py, c){
        _.assert(c instanceof Body, "wanted a body");
        let dx=px-c.pos[0];
        let dy=py-c.pos[1];
        return dx*dx+dy*dy <= c.shape.radius*c.shape.radius;
      },
      /**If these 2 circles collide, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Circle} a
       * @param {Circle} b
       * @return {Manifold} if false undefined
       */
      hitCircleCircle(a, b){
        _.assert(a instanceof Body && b instanceof Body, "need bodies");
        let m=new Manifold();
        if(_circle_circle(a,b,m)) return m;
      },
      /**Check if these 2 circles collide.
       * @memberof module:mcfud/geo2d
       * @param {Circle} a
       * @param {Circle} b
       * @return {boolean}
       */
      hitTestCircleCircle(a, b){
        _.assert(a instanceof Body && b instanceof Body, "need bodies");
        return _circle_circle(a,b,new Manifold());
      },
      /**If this polygon collides with the circle, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} p
       * @param {Circle} c
       * @return {Manifold} if false undefined
       */
      hitPolygonCircle(p, c){
        _.assert(p instanceof Body && c instanceof Body, "need bodies");
        let m=new Manifold();
        if(_poly_circle(p,c,m)) return m;
      },
      /**Check if polygon collides with the circle.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} p
       * @param {Circle} c
       * @return {boolean}
       */
      hitTestPolygonCircle(p, c){
        _.assert(p instanceof Body && c instanceof Body, "need bodies");
        return _poly_circle(p,c,new Manifold())
      },
      /**If this circle collides with polygon, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Circle} c
       * @param {Polygon} p
       * @return {Manifold} if false undefined
       */
      hitCirclePolygon(c, p){
        _.assert(p instanceof Body && c instanceof Body, "need bodies");
        let m=new Manifold();
        if(_circle_poly(c,p,m)) return m;
      },
      /**Check if this circle collides with the polygon.
       * @memberof module:mcfud/geo2d
       * @param {Circle} c
       * @param {Polygon} p
       * @return {boolean}
       */
      hitTestCirclePolygon(c, p){
        _.assert(p instanceof Body && c instanceof Body, "need bodies");
        return _circle_poly(c,p,new Manifold())
      },
      /**If these 2 polygons collide, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} a
       * @param {Polygon} b
       * @return {Manifold} if false undefined
       */
      hitPolygonPolygon(a, b){
        _.assert(a instanceof Body && b instanceof Body, "need bodies");
        let m=new Manifold();
        if(_poly_poly(a,b,m)) return m;
      },
      /**Check if these 2 polygons collide.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} a
       * @param {Polygon} b
       * @return {boolean}
       */
      hitTestPolygonPolygon(a, b){
        _.assert(a instanceof Body && b instanceof Body, "need bodies");
        return _poly_poly(a,b,new Manifold())
      },
      /**Check if a point is inside these polygon vertices.
       * @memberof module:mcfud/geo2d
       * @param {number} testx
       * @param {number} testy
       * @param {Vec2[]} ps
       * @return {boolean}
       */
      hitTestPointInPolygon(testx,testy,ps){
        let c;
        for(let p,q,len=ps.length, i=0, j=len-1; i<len;){
          p=ps[i];
          q=ps[j];
          if(((p[1]>testy) !== (q[1]>testy)) &&
             (testx < (q[0]-p[0]) * (testy-p[1]) / (q[1]-p[1]) + p[0])) c = !c;
          j=i;
          ++i;
        }
        return c;
      },
      /**Check if point is inside this polygon.
       * @memberof module:mcfud/geo2d
       * @param {number} testx
       * @param {number} testy
       * @param {Polygon} poly
       * @return {boolean}
       */
      hitTestPointPolygon(testx,testy,poly){
        _.assert(poly instanceof Body, "wanted a body");
        return this.hitTestPointInPolygon(testx,testy,
                                          _V.translate(poly.pos,poly.shape.calcPoints))
      },
      hitTestLineCircle(A,B, x, y, radius){
        let AB=_V.sub(B,A),
            C=[x,y],
            AC=_V.sub(C,A),
            BC=_V.sub(C,B),
            AC_L2=_V.len2(AC);
        //try to get the 90deg proj onto line
        //let proj=_V.proj_scalar(AC,AB);
        //let U=proj/_V.len(AB);
        let dist,u = _V.dot(AC,AB) / _V.dot(AB,AB);
        if(u >= 0 && u <= 1){
          // point is on the line so just get the dist2 to the point
          dist= AC_L2 - u*u*_V.len2(AB);
        }else{
          // find which end is closest and get dist2 to circle
          dist = u < 0 ? AC_L2 : _V.len2(BC);
        }
        return [dist < radius * radius];
      },
      hitTestLinePolygon(p,p2, poly){
        _.assert(poly instanceof Body, "wanted a body");
        let vs=_V.translate(poly.pos, poly.shape.calcPoints);
        for(let i=0,i2=0; i<vs.length; ++i){
          i2= i+1;
          if(i2 == vs.length) i2=0;
          let [hit,t] = this.lineIntersect2D(p,p2, vs[i],vs[i2]);
          if(hit)
            return [hit,t];
        }
        return [false];
      },
      lineIntersect2D(p, p2, q, q2){
        let x1=p[0],y1=p[1];
        let x2=p2[0],y2=p2[1];
        let x3=q[0],y3=q[1];
        let x4=q2[0],y4=q2[1];
        let t;//forL1
        let u;//forL2
        let d= (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        //TODO: handle collinear correctly!?
        if(_.feq0(d))
          return [false];//parallel

        t=(x1-x3)*(y3-y4)-(y1-y3)*(x3-x4);
        t /= d;
        u=(x1-x3)*(y1-y2)-(y1-y3)*(x1-x2);
        u /= d;

        if(0<=t && t<=1 && 0<=u && u<=1){
          return [true, t, [x1+t*(x2-x1), y1+t*(y2-y1)]]
        }else{
          return [false]
        }
      },
      //--------------------2LinesIntersection2D-------------------------
      //  Given 2 lines in 2D space AB, CD this returns true if an
      //  intersection occurs and sets dist to the distance the intersection
      //  occurs along AB
      //-----------------------------------------------------------------
      lineIntersection2D(A, B, C, D){
        //first test against the bounding boxes of the lines
        if( (((A[1] > D[1]) && (B[1] > D[1])) && ((A[1] > C[1]) && (B[1] > C[1]))) ||
             (((B[1] < C[1]) && (A[1] < C[1])) && ((B[1] < D[1]) && (A[1] < D[1]))) ||
             (((A[0] > D[0]) && (B[0] > D[0])) && ((A[0] > C[0]) && (B[0] > C[0]))) ||
             (((B[0] < C[0]) && (A[0] < C[0])) && ((B[0] < D[0]) && (A[0] < D[0])))){
          return [false,0];
        }
        let rTop = (A[1]-C[1])*(D[0]-C[0])-(A[0]-C[0])*(D[1]-C[1]);
        let rBot = (B[0]-A[0])*(D[1]-C[1])-(B[1]-A[1])*(D[0]-C[0]);

        let sTop = (A[1]-C[1])*(B[0]-A[0])-(A[0]-C[0])*(B[1]-A[1]);
        let sBot = (B[0]-A[0])*(D[1]-C[1])-(B[1]-A[1])*(D[0]-C[0]);

        let rTopBot = rTop*rBot;
        let sTopBot = sTop*sBot;

        if((rTopBot>0) && (rTopBot<rBot*rBot) && (sTopBot>0) && (sTopBot<sBot*sBot)){
          return [true, rTop/rBot];
        }else{
          return [false,0];
        }
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"),
                           require("./math"),
                           require("./vec2"),
                           require("./matrix"),
                           require("../algo/basic"))
  }else{
    gscope["io/czlab/mcfud/geo2d"]=_module
  }

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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module.
   */
  function _module(Core,_M){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();
    const int=Math.floor;
    const {u:_,is} = Core;

    /**
      * @module mcfud/spatial
      */

    /**
     * @typedef {object} SpatialGrid
     * @property {function} reset()
     * @property {function} degrid()
     * @property {function} engrid()
     * @property {function} search(node)
     * @property {function} searchAndExec(node,cb)
     */

    /**Creates a 2d spatial grid. */
    function SpatialGrid(cellW,cellH){
      const _grid= new Map();
      return{
        searchAndExec(item,cb){
          let ret,
              g= item.getSpatial();
          for(let X,Y,y = g.y1; y <= g.y2; ++y){
            if(Y=_grid.get(y))
              for(let vs,r,x= g.x1; x <= g.x2; ++x)
                if(X=Y.get(x)){
                  vs=X.values();
                  r= vs.next();
                  while(!r.done){
                    if(item !== r.value){
                      if(ret=cb(item,r.value)){
                        x=y=Infinity;
                        break;
                      }
                    }
                    ret=null;
                    r= vs.next();
                  }
                }
          }
          return ret;
        },
        search(item,incItem=false){
          let X,Y,out=[],
              g= item.getSpatial();
          for(let y = g.y1; y <= g.y2; ++y){
            if(Y=_grid.get(y))
              for(let x= g.x1; x <= g.x2; ++x)
                if(X=Y.get(x))
                  X.forEach(v=>{
                    if(v===item && !incItem){}else{
                      out.push(v)
                    }
                  })
          }
          return out
        },
        engrid(item,skipAdd){
          if(!item){return}
          let r = item.getBBox(),
              g = item.getSpatial(),
              gridX1 = _M.ndiv(r.x1 , cellW),
              gridY1 = _M.ndiv(r.y1 , cellH),
              gridX2 = _M.ndiv(r.x2,cellW),
              gridY2 = _M.ndiv(r.y2, cellH);
          if(g.x1 != gridX1 || g.x2 != gridX2 ||
             g.y1 != gridY1 || g.y2 != gridY2){
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
          _grid.clear() },
        _register(item){
          let g= item.getSpatial();
          if(is.num(g.x1)){
            for(let X,Y,y= g.y1; y <= g.y2; ++y){
              if(!_grid.has(y))
                _grid.set(y, new Map());
              Y=_grid.get(y);
              for(let x= g.x1; x <= g.x2; ++x){
                if(!Y.has(x))
                  Y.set(x, new Map());
                X=Y.get(x);
                _.assoc(X,item.getGuid(), item);
              }
            }
          }
        },
        degrid(item){
          if(item){
            let g= item.getSpatial();
            if(is.num(g.x1)){
              for(let X,Y,y= g.y1; y <= g.y2; ++y){
                if(Y=_grid.get(y))
                  for(let x= g.x1; x<=g.x2; ++x)
                    if(X=Y.get(x))
                      _.dissoc(X,item.getGuid())
              }
            }
            g.x1=UNDEF;
            g.x2=UNDEF;
            g.y1=UNDEF;
            g.y2=UNDEF;
          }
        }
      }
    }

    const _$={
      /**
       * @memberof module:mcfud/spatial
       * @param {number} cellWidth
       * @param {number} cellHeight
       * @return {SpatialGrid}
       */
      spatialGrid(cellWidth=320,cellHeight=320){
        return SpatialGrid(cellWidth,cellHeight)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"),require("./math"));
  }else{
    gscope["io/czlab/mcfud/spatial"]=_module
  }

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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module.
   */
  function _module(Core,_M){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();
    const int=Math.floor;
    const {u:_} = Core;

    /**
      * @module mcfud/quadtree
      */

    /**
     * @typedef {object} QuadTree
     * @property {function} insert(node)
     * @property {function} search(node)
     * @property {function} remove(node)
     * @property {function} reset()
     * @property {function} prune()
     * @property {function} searchAndExec(node,cb)
     */

    /**
     * @typedef {object} QuadTreeNode
     * @property {number} x
     * @property {number} y
     * @property {number} width
     * @property {number} height
     * @property {function} getBBox()
     */

    /**Creates a QuadTree. */
    function QuadTree(X1,X2,Y1,Y2,maxCount,maxDepth,level){
      let boxes=null,
          objects = [];
      let midX= _M.ndiv(X1+X2,2),
          midY= _M.ndiv(Y1+Y2,2);

      //find which quadrants r touches
      function _locate(r){
        function _loc({x1,x2,y1,y2}){
          let out=[],
              left= x1<midX,
              right= x2>midX;
          if(y1<midY){
            if(left) out.push(3);
            if(right) out.push(0);
          }
          if(y2>midY){
            if(left) out.push(2);
            if(right) out.push(1);
          }
          return out;
        }
        /////
        if(r.getBBox){
          return _loc(r.getBBox())
        }else{
          _.assert(r.x1 !== undefined && r.y1 !== undefined &&
                   r.x2 !== undefined && r.y2 !== undefined,"wanted bbox for quadtree");
          return _loc(r)
        }
      }

      //split into 4 quadrants
      function _split(){
        //flipit
        //3|0
        //---
        //2|1
        _.assert(boxes===null);
        boxes=[QuadTree(midX, X2, Y1,midY,     maxCount,maxDepth,level+1),
               QuadTree(midX, X2, midY, Y2, maxCount,maxDepth,level+1),
               QuadTree(X1, midX, midY, Y2, maxCount,maxDepth,level+1),
               QuadTree(X1, midX, Y1, midY,    maxCount,maxDepth,level+1)];
      }

      const bbox={x1:X1,x2:X2,y1:Y1,y2:Y2};
      return{
        boundingBox(){ return bbox },
        subTrees(){return boxes},
        dbg(f){ return f(objects,boxes,maxCount,maxDepth,level) },
        insert(...nodes){
          nodes.forEach(node=>{
            if(boxes){
              _locate(node).forEach(i=> boxes[i].insert(node))
            }else{
              objects.push(node);
              if(objects.length > maxCount && level < maxDepth){
                _split();
                objects.forEach(o=> _locate(o).forEach(i=> boxes[i].insert(o)));
                objects.length=0;
              }
            }
          })
        },
        remove(node){
          if(boxes){
            boxes.forEach(b=>b.remove(node))
          }else{
            _.disj(objects,node)
          }
        },
        isLeaf(){
          return boxes===null ? -1 : objects.length
        },
        prune(){
          if(boxes){
            let sum=0,
                total=0;
            for(let b,i=0;i<boxes.length;++i){
              b=boxes[i];
              b.prune();
              n=b.isLeaf();
              if(n>=0){
                ++sum;
                total+=n;
              }
            }
            if(sum==boxes.length){//4
              //subtrees are leaves and total count is small
              //enough so pull them up into this node
              if(total<maxCount){
                _.assert(objects.length==0, "quadtree wanted zero items");
                boxes.forEach(b=>b._swap(objects));
                boxes=null;
                //now this node is a leaf!
              }
            }
          }
        },
        _swap(out){
          objects.forEach(b=>out.push(b))
          objects.length=0;
        },
        reset(){
          objects.length=0;
          boxes && boxes.forEach(b=> b.reset());
          boxes=null;
        },
        searchAndExec(node,cb,skipSelf){
          let ret;
          if(boxes){
            let ns=_locate(node);
            for(let i=0;i<ns.length;++i){
              ret=boxes[ns[i]].searchAndExec(node,cb,skipSelf);
              if(ret){break;}
            }
          }else{
            for(let o,i=0;i<objects.length;++i){
              o=objects[i];
              if(skipSelf && o===node){continue}
              if(ret=cb(o,node)){ break }
            }
          }
          return ret;
        },
        search(node,skipSelf){
          //handle duplicates
          const bin=new Map();
          const out = [];
          if(skipSelf){bin.set(node,null)}
          if(boxes){
            _locate(node).forEach(i=>{
              boxes[i].search(node).forEach(o=>{
                if(!bin.has(o)){
                  bin.set(o,null);
                  out.push(o);
                }
              })
            })
          }
          objects.forEach(o=>{
            if(!bin.has(o)){
              bin.set(o,null);
              out.push(o);
            }
          });
          //found all objects closeby
          bin.clear();
          return out;
        }
      };
    }

    const _$={
      /**
       * @memberof module:mcfud/quadtree
       * @param {object} region {x1,x2,y1,y2} the bounding region
       * @param {number} maxCount maximum number of objects in each tree
       * @param {number} maxDepth maximum depth of tree
       * @return {QuadTree}
       */
      quadtree(region,maxCount=12,maxDepth=5){
        const {x1,x2,y1,y2}=region;
        return QuadTree(x1,x2,y1,y2,maxCount,maxDepth,0)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"),require("./math"));
  }else{
    gscope["io/czlab/mcfud/qtree"]=_module
  }

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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const {u:_}=Core;

    /**
      * @module mcfud/negamax
      */

    /**
     * @memberof module:mcfud/negamax
     * @class
     * @property {any} lastBestMove
     * @property {any} state
     * @property {any} other
     * @property {any} cur
     */
    class GFrame{
      /**
       * @param {any} cur
       * @param {any} other
       */
      constructor(cur,other){
        this.lastBestMove=UNDEF;
        this.state= UNDEF;
        this.other=other;
        this.cur=cur;
      }
      /**Make a copy of this.
       * @param {function} cp  able to make a copy of state
       * @return {GFrame}
       */
      clone(cp){
        const f= new GFrame();
        f.state=cp(this.state);
        f.lastBestMove=this.lastBestMove;
        f.other=this.other;
        f.cur=this.cur;
        return f;
      }
    }

    /**Represents a game board.
     * @memberof module:mcfud/negamax
     * @class
     */
    class GameBoard{
      constructor(){}
      /**Get the function that copies a game state.
       * @return {function}
       */
      getStateCopier(){}
      /**Get the first move.
       * @param {GFrame} frame
       * @return {any}
       */
      getFirstMove(frame){}
      /**Get the list of next possible moves.
       * @param {GFrame} frame
       * @return {any[]}
       */
      getNextMoves(frame){}
      /**Calculate the score.
       * @param {GFrame} frame
       * @return {number}
       */
      evalScore(frame){}
      /**Check if game is a draw.
       * @param {GFrame} frame
       * @return {boolean}
       */
      isStalemate(frame){}
      /**Check if game is over.
       * @param {GFrame} frame
       * @return {boolean}
       */
      isOver(frame){}
      /**Reverse previous move.
       * @param {GFrame} frame
       * @param {any} move
       */
      unmakeMove(frame, move){
        if(!this.undoMove)
          throw Error("Need Implementation");
        this.switchPlayer(frame);
        this.undoMove(frame, move);
      }
      //undoMove(frame, move){}
      //doMove(frame, move){ }
      /**Make a move.
       * @param {GFrame} frame
       * @param {any} move
       */
      makeMove(frame, move){
        if(!this.doMove)
          throw Error("Need Implementation!");
        this.doMove(frame, move);
        this.switchPlayer(frame);
      }
      /**Switch to the other player.
       * @param {GFrame} frame
       */
      switchPlayer(snap){
        let t = snap.cur;
        snap.cur= snap.other;
        snap.other= t;
      }
      /**Get the other player.
       * @param {any} pv player
       * @return {any}
       */
      getOtherPlayer(pv){
        if(pv === this.actors[1]) return this.actors[2];
        if(pv === this.actors[2]) return this.actors[1];
      }
      /**Get the current player.
       * @return {any}
       */
      getPlayer(){
        return this.actors[0]
      }
      /**Take a snapshot of current game state.
       * @return {GFrame}
       */
      takeGFrame(){}
      run(seed,actor){
        this.getAlgoActor=()=>{ return actor }
        this.syncState(seed,actor);
        let pos= this.getFirstMove();
        if(_.nichts(pos))
          pos= _$.evalNegaMax(this);
        return pos;
      }
    }

    /** @ignore */
    function _calcScore(board,game,depth,maxDepth){
      //if the other player wins, then return a -ve else +ve
      //maxer == 1 , minus == -1
      let score=board.evalScore(game,depth,maxDepth);
      /*
      if(!_.feq0(score))
        score -= 0.01*depth*Math.abs(score)/score;
      return score;
      */
      return score * (1 + 0.001 * depth);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //option2
    function _negaAlphaBeta(board, game, depth, maxDepth, alpha, beta){

      if(depth==0 || board.isOver(game)){
        return { depth, value: _calcScore(board,game,depth,maxDepth) }
      }

      let state=game,
          copier= board.getStateCopier(),
          openMoves= _.shuffle(board.getNextMoves(game));

      for(let rc, move, i=0; i< openMoves.length; ++i){
        move= openMoves[i];
        if(!board.undoMove){
          _.assert(copier, "Missing state copier!");
          game= state.clone(copier);
        }
        board.makeMove(game, move);
        rc = _negaAlphaBeta(board, game, depth-1,
                                         maxDepth,
                                         {value: -beta.value, move: beta.move},
                                         {value: -alpha.value, move: alpha.move});
        //now, roll it back
        if(board.undoMove)
          board.unmakeMove(game, move);
        rc.value = -rc.value;
        rc.move = move;
        if(rc.value>alpha.value){
          alpha = {value: rc.value, move: move, depth: rc.depth};
        }
        if(alpha.value >= beta.value){
          return beta;
        }
      }

      return JSON.parse(JSON.stringify(alpha));
    }

    /**Implements the NegaMax Min-Max algo.
     * @see {@link https://github.com/Zulko/easyAI}
     * @param {GameBoard} board
     * @param {GFrame} game
     * @param {number} depth
     * @param {number} maxDepth
     * @param {number} alpha
     * @param {number} beta
     * @return {number}
     */
    function _negaMax(board, game, depth,maxDepth,alpha, beta){

      if(depth==0 || board.isOver(game)){
        return [_calcScore(board,game,depth,maxDepth),null]
      }

      let openMoves = _.shuffle(board.getNextMoves(game)),
          copier= board.getStateCopier(),
          state=game,
          bestValue = -Infinity,
          bestMove = openMoves[0];

      if(depth==maxDepth)
        state.lastBestMove=bestMove;

      for(let rc, move, i=0; i<openMoves.length; ++i){
        if(!board.undoMove){
          _.assert(copier, "Missing state copier!");
          game=state.clone(copier);
        }
        move = openMoves[i];
        //try a move
        board.makeMove(game, move);
        rc= - _negaMax(board, game, depth-1, maxDepth, -beta, -alpha)[0];
        //now, roll it back
        if(board.undoMove)
          board.unmakeMove(game, move);
        //how did we do ?
        if(bestValue < rc){
          bestValue = rc;
          bestMove = move
        }
        if(alpha < rc){
          alpha=rc;
          if(depth == maxDepth)
            state.lastBestMove = move;
          if(alpha >= beta) break;
        }
      }

      return [bestValue, state.lastBestMove];
    }

    const _$={
      algo:"negamax",
      GFrame,
      GameBoard,
      /**Make a move on the game-board using negamax algo.
       * @memberof module:mcfud/negamax
       * @param {GameBoard} board
       * @return {any} next best move
       */
      XXevalNegaMax(board){
        const f= board.takeGFrame();
        const d= board.depth;
        let [score,move]= _negaMax(board, f, d,d, -Infinity, Infinity);
        if(_.nichts(move))
          console.log(`evalNegaMax: score=${score}, pos= ${move}, lastBestMove=${move}`);
        return move;
      },
      evalNegaMax(board){
        const f= board.takeGFrame();
        const d= board.depth;
        let {value, move} = _negaAlphaBeta(board, f, d, d, {value: -Infinity },
                                                           {value: Infinity  });
        if(_.nichts(move))
          console.log(`evalNegaMax: score= ${value}, pos= ${move}`);
        return move;
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/negamax"]=_module
  }

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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Creates the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const {u:_}=Core;

    /**
      * @module mcfud/minimax
      */

    /**
     * @memberof module:mcfud/minimax
     * @class
     * @property {any} state
     * @property {any} other
     * @property {any} cur
     */
    class GFrame{
      /**
       * @param {any} cur
       * @param {any} other
       */
      constructor(cur,other){
        this.state= UNDEF;
        this.other=other;
        this.cur=cur;
      }
      /**Make a copy of this.
       * @param {function} cp  able to make a copy of state
       * @return {GFrame}
       */
      clone(cp){
        const f= new GFrame();
        f.state=cp(this.state);
        f.other=this.other;
        f.cur=this.cur;
        return f;
      }
    }

    /**Represents a game board.
     * @memberof module:mcfud/minimax
     * @class
     */
    class GameBoard{
      constructor(){
        this.aiActor=UNDEF;
      }
      /**Get the function that copies a game state.
       * @return {function}
       */
      getStateCopier(){}
      /**Get the first move.
       * @param {GFrame} frame
       * @return {any}
       */
      getFirstMove(frame){}
      /**Get the list of next possible moves.
       * @param {GFrame} frame
       * @return {any[]}
       */
      getNextMoves(frame){}
      /**Calculate the score.
       * @param {GFrame} frame
       * @param {number} depth
       * @param {number} maxDepth
       * @return {number}
       */
      evalScore(frame,depth,maxDepth){}
      /**Check if game is a draw.
       * @param {GFrame} frame
       * @return {boolean}
       */
      isStalemate(frame){}
      /**Check if game is over.
       * @param {GFrame} frame
       * @return {boolean}
       */
      isOver(frame,move){}
      /**Reverse previous move.
       * @param {GFrame} frame
       * @param {any} move
       */
      unmakeMove(frame, move){
        if(!this.undoMove)
          throw Error("Need Implementation");
        this.switchPlayer(frame);
        this.undoMove(frame, move);
      }
      //undoMove(frame, move){}
      //doMove(frame, move){ }
      /**Make a move.
       * @param {GFrame} frame
       * @param {any} move
       */
      makeMove(frame, move){
        if(!this.doMove)
          throw Error("Need Implementation!");
        this.doMove(frame, move);
        this.switchPlayer(frame);
      }
      /**Take a snapshot of current game state.
       * @return {GFrame}
       */
      takeGFrame(){}
      /**Switch to the other player.
       * @param {GFrame} snap
       */
      switchPlayer(snap){
        let t = snap.cur;
        snap.cur= snap.other;
        snap.other= t;
      }
      /**Get the other player.
       * @param {any} pv player
       * @return {any}
       */
      getOtherPlayer(pv){
        if(pv === this.actors[1]) return this.actors[2];
        if(pv === this.actors[2]) return this.actors[1];
      }
      /**Get the current player.
       * @return {any}
       */
      getPlayer(){
        return this.actors[0]
      }
      /**Run the algo and get a move.
       * @param {any} seed
       * @param {any} actor
       * @return {any}  the next move
       */
      run(seed,actor){
        this.getAlgoActor=()=>{ return actor }
        this.syncState(seed,actor);
        let pos= this.getFirstMove();
        if(_.nichts(pos))
          pos= _$.evalMiniMax(this);
        return pos;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //+ve if AI wins
    const _calcScore=(board,game,depth,maxDepth)=> board.evalScore(game,depth,maxDepth);

    /**Implements the Min-Max (alpha-beta) algo.
     * @param {GameBoard} board
     * @param {GFrame} game
     * @param {number} depth
     * @param {number} maxDepth
     * @param {number} alpha
     * @param {number} beta
     * @return {number}
     */
    function _miniMax(board, game, depth,maxDepth, alpha, beta, maxing){
      if(depth==0 || board.isOver(game)){
        return [_calcScore(board,game,depth,maxDepth),UNDEF]
      }
      ///////////
      let state=game,
          copier= board.getStateCopier(),
          openMoves= _.shuffle(board.getNextMoves(game));
      if(maxing){
        let rc,pos,move,
            bestMove=openMoves[0], maxValue = -Infinity;
        for(let i=0; i<openMoves.length; ++i){
          if(!board.undoMove){
            _.assert(copier,"Missing state copier!");
            game=state.clone(copier);
          }
          move=openMoves[i];
          board.makeMove(game, move);
					rc= _miniMax(board, game, depth-1, maxDepth, alpha, beta, !maxing)[0];
          if(board.undoMove)
            board.unmakeMove(game,move);
					alpha = Math.max(rc,alpha);
          if(rc > maxValue){
						maxValue = rc;
						bestMove = move;
          }
					if(beta <= alpha){break}
        }
        return [maxValue,bestMove];
      }else{
			  let rc,pos,move,
            bestMove=openMoves[0], minValue = Infinity;
        for(let i=0; i<openMoves.length; ++i){
          if(!board.undoMove){
            _.assert(copier, "Missing state copier!");
            game=state.clone(copier);
          }
          move=openMoves[i];
          board.makeMove(game, move);
					rc = _miniMax(board, game, depth-1, maxDepth, alpha, beta, !maxing)[0];
          if(board.undoMove)
            board.unmakeMove(game, move);
					beta = Math.min(rc,beta);
          if(rc < minValue){
						minValue = rc;
						bestMove = move;
          }
					if(beta <= alpha){break}
        }
        return [minValue,bestMove];
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      algo: "minimax",
      GFrame,
      GameBoard,
      /**Make a move on the game-board using minimax algo.
       * @memberof module:mcfud/minimax
       * @param {GameBoard} board
       * @return {any} next best move
       */
      evalMiniMax(board){
        const f= board.takeGFrame();
        const d= board.depth;
        let [score, move]= _miniMax(board, f, d,d, -Infinity, Infinity, true);
        if(_.nichts(move))
          console.log(`evalMiniMax: score=${score}, pos= ${move}`);
        return move;
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"))
  }else{
    gscope["io/czlab/mcfud/minimax"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();

    const CMP=(a,b)=> a<b?-1:(a>b?1:0);
    const int=Math.floor;
    const {is, u:_}= Core;

    /**
     * @module mcfud/algo_basic
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _checkKey=(key)=> _.assert(is.num(key) || is.str(key), `expected number or string`);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function prnIter(it, sep=" ",out=""){
      for(; it.hasNext();) out += `${it.next()}${sep}`;
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an interable.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class Iterator{
      constructor(c){
        this.current=c;// node to starts with
      }
      hasNext(){ return _.echt(this.current) }
      remove(){ throw Error("Unsupported")  }
      next(){
        if(!this.hasNext())
          throw Error("NoSuchElementException");
        let item = this.current.item;
        this.current = this.current.next;
        return item;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Helper linked list
     * @memberof module:mcfud/algo_basic
     * @param {any} item
     * @param {object} next
     * @return {object}
     */
    function Node(item,next=UNDEF){
      return { item, next }
    }

    /**Represents a bag (or multiset) of generic items.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class Bag{
      constructor(){
        //* @property {first} beginning of bag
        //* @property {n} number of elements in bag
        this.first = UNDEF;
        this.n = 0;
      }
      clone(){
        let b=new Bag(),
            q,p=this.first;
        while(p){
          if(q){
            q.next=Node(p.item);
            q=q.next;
          }else{
            b.first= q =Node(p.item);
          }
          b.n+=1;
          p=p.next;
        }
        return b;
      }
      /**Returns true if this bag is empty.
       * @return {boolean}
       */
      isEmpty(){
        return _.nichts(this.first)
      }
      /**Returns the number of items in this bag.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Adds the item to this bag.
       * @param {any} item the item to add to this bag
       */
      add(item){
        //adds this back to front, first always points to last added
        this.first = Node(item, this.first);
        this.n+=1;
      }
      /**Returns an iterator that iterates over the items in this bag in arbitrary order.
       * @return {Iterator}
       */
      iter(){
        return new Iterator(this.first);
      }
      static test(){
        let obj= new Bag();
        "to be or not to - be - - that - - - is".split(" ").forEach(n=> obj.add(n));
        console.log("size of bag = " + obj.size());
        console.log(prnIter(obj.iter()));
        let c=obj.clone();
        console.log("size of cloned = " + c.size());
        console.log(prnIter(c.iter()));
      }
    }
    //Bag.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a last-in-first-out (LIFO) stack of generic items.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class Stack{
      constructor(){
        //* @property {first} top of stack
        //* @property {n} size of stack
        this.first = UNDEF;
        this.n = 0;
      }
      clone(){
        let b=new Stack(),
            q,p=this.first;
        while(p){
          if(q){
            q.next=Node(p.item);
            q=q.next;
          }else{
            b.first= q =Node(p.item);
          }
          b.n+=1;
          p=p.next;
        }
        return b;
      }
      /**Returns true if this stack is empty.
       * @return {boolean}
       */
      isEmpty(){
        return _.nichts(this.first);
      }
      /**Returns the number of items in this stack.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Adds the item to this stack.
       * @param {any} item
       */
      push(item){
        this.first = Node(item, this.first);
        this.n+=1;
      }
      /**Removes and returns the item most recently added to this stack.
       * @return {any}
       */
      pop(){
        if(this.isEmpty())
          throw Error("Stack underflow");
        let item = this.first.item; // save item to return
        this.first = this.first.next; // delete first node
        this.n -= 1;
        return item;                   // return the saved item
      }
      /**Returns (but does not remove) the item most recently added to this stack.
       * @return {any}
       */
      peek(){
        if(this.isEmpty())
          throw Error("Stack underflow");
        return this.first.item;
      }
      /**Returns a string representation of this stack.
       * @return {string}
       */
      toString(){
        return prnIter(this.iter())
      }
      /**Returns an iterator to this stack that iterates through the items in LIFO order.
       * @return {Iterator}
       */
      iter(){
        return new Iterator(this.first)
      }
      static test(){
        let obj= new Stack();
        "to be or not to - be - - that - - - is".split(" ").forEach(s=>{
          if(s != "-"){
            obj.push(s);
          }else if(!obj.isEmpty()){
            console.log("(-)" + obj.pop() + " ");
          }
        });
        console.log("(" + obj.size() + " left on stack)");
        let c= obj.clone();
        console.log("cloned= " + prnIter(c.iter()));
        console.log("(" + c.size() + " left on stack)");
      }
    }
    //Stack.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a first-in-first-out (FIFO) queue of generic items.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class Queue{
      constructor(){
        //* @property {first} beginning of queue
        //* @property {last} end of queue
        //* @property {n} number of elements on queue
        this.first = UNDEF;
        this.last  = UNDEF;
        this.n = 0;
      }
      clone(){
        let q=new Queue(),
            p=this.first;
        while(p){
          q.enqueue(p.item);
          p=p.next;
        }
        return q;
      }
      /**Returns true if this queue is empty.
       * @return {boolean}
       */
      isEmpty(){
        return _.nichts(this.first)
      }
      /**Returns the number of items in this queue.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Returns the item least recently added to this queue.
       * @return {any}
       */
      peek(){
        if(this.isEmpty()) throw Error("Queue underflow");
        return this.first.item;
      }
      /**Adds the item to this queue.
       * @param {any} item
       */
      enqueue(item){
        let oldlast = this.last;
        this.last = Node(item);
        if(this.isEmpty()) this.first = this.last;
        else oldlast.next = this.last;
        this.n+=1;
      }
      /**Removes and returns the item on this queue that was least recently added.
       * @return {any}
       */
      dequeue(){
        if(this.isEmpty()) throw Error("Queue underflow");
        let item = this.first.item;
        this.first = this.first.next;
        this.n-=1;
        if(this.isEmpty()) this.last = UNDEF;   // to avoid loitering
        return item;
      }
      /**Returns a string representation of this queue.
       * @return {string}
       */
      toString(){
        return prnIter(this.iter())
      }
      /**Returns an iterator that iterates over the items in this queue in FIFO order.
       * @return {Iterator}
       */
      iter(){
        return new Iterator(this.first)
      }
      static test(){
        let queue = new Queue();
        "to be or not to - be - - that - - - is".split(/\s+/).forEach(s=>{
          if(s!="-")
            queue.enqueue(s);
          else if(!queue.isEmpty())
            console.log(queue.dequeue() + " ");
        });
        console.log("(" + queue.size() + " left on queue)");
        let c= queue.clone();
        console.log("cloned= "+ prnIter(c.iter()));
        console.log("(" + c.size() + " left on queue)");
      }
    }
    //Queue.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Original source from https://github.com/awstuff/TreeMap.js
    /**The map is sorted according to the natural ordering of its keys,or via the
     * provided comparator.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class TreeMap{
      /**
       * @param {function} C compare function
       */
      constructor(C){
        //* @property {function} compare comparator function
        //* @property {object} root top of the map
        //* @property {number} n number of elements in map
        this.compare=C || CMP;
        this.root=UNDEF;
        this.n=0;
      }
      /**Number of entries in map.
       * @return {number} size of map
       */
      size(){
        return this.n
      }
      /**Check if key exists in map..
       * @param {any} key
       * @return {boolean}
       */
      contains(key){
        return this.get(key) !== undefined
      }
      /**Get value for this key.
       * @param {any} key
       * @return {any} value if found else undefined
       */
      get(key){
        const _get=(key,node,res)=>{
          if(node){
            let c=this.compare(key,node.key);
            res= c<0 ?_get(key, node.left) : (c>0 ? _get(key, node.right): node.value);
          }
          return res;
        }
        if(_checkKey(key) && this.n>0) return _get(key,this.root);
      }
      /**Associate key with this value
       * @param {any} key
       * @param {any} val cannot be undefined
       */
      set(key, value){
        const _set=(key,value,node)=>{
          if(!node){
            this.n+=1;
            return{key,value};
          }
          let c= this.compare(key,node.key);
          if(c<0){
            node.left = _set(key, value, node.left);
          }else if(c>0){
            node.right = _set(key, value, node.right);
          }else{
            node.value = value;
          }
          return node;
        }
        if(_checkKey(key) &&
           value !== undefined)
          this.root = _set(key, value, this.root);
      }
      _getMaxNode(node){
        while(node && node.right){ node = node.right }
        return node;
      }
      _getMaxKey(){
        let n = this._getMaxNode(this.root);
        if(n)
          return n.key;
      }
      _getMinNode(node){
        while(node && node.left){ node = node.left }
        return node;
      }
      _getMinKey(){
        let n = this._getMinNode(this.root);
        if(n)
          return n.key;
      }
      /**Remove key from map.
       * @param {any} key
       */
      remove(key){
        const _del=(key,node)=>{
          if(node){
            let k,v,m,c= this.compare(key,node.key);
            if(c<0){
              node.left = _del(key, node.left);
            }else if(c>0){
              node.right = _del(key, node.right);
            }else{
              if(node.left && node.right){
                m = this._getMaxNode(node.left);
                k = m.key;
                v = m.value;
                m.value = node.value;
                m.key = node.key;
                node.key = k;
                node.value = v;
                node.left = _del(key, node.left);
              }else if(node.left){
                node=node.left;
                this.n -=1;
              }else if(node.right){
                node= node.right;
                this.n -=1;
              }else{
                node= UNDEF;
                this.n -=1;
              }
            }
          }
          return node;
        }
        if(_checkKey(key))
          this.root = _del(key, this.root);
      }
      /**List keys in this map.
       * @return {Iterator}
       */
      keys(){
        let out=new Queue();
        this.forEach((v,k)=> out.enqueue(k));
        return out.iter();
      }
      /**Get the first key.
       * @return {any}
       */
      firstKey(){
        let ret;
        try{
          this.forEach((v,k)=>{
            ret=k;
            throw Error("????");
          });
        }catch(e){}
        return ret;
      }
      /**Get the last key
       * @return {any} the last key
       */
      lastKey(){
        let ret;
        this.forEach((v,k)=>{ ret=k });
        return ret;
      }
      /**Iterate the map.
       * @param {function} cb callback function
       * @param {object} ctx callback context
       */
      forEach(cb, ctx){
        function _invokeCb(ctx,cb){
          return cb && cb.apply(ctx, Array.prototype.slice.call(arguments, 2)) }
        function _each(node, cb, ctx, func){
          if(!node)
            return _invokeCb(ctx, func);
          _each(node.left, cb, ctx, function(){
            _invokeCb(ctx, cb, node.value, node.key);
            _each(node.right, cb, ctx, function(){ _invokeCb(ctx, func) });
          });
        }
        _each(this.root, cb, ctx);
      }
      static test(){
        let t= new TreeMap();
        t.set(3, "3"); t.set(2,"2"); t.set(7,"7"), t.set(1,"1");
        console.log(`firstKey= ${t.firstKey()}`);
        console.log(`lastKey= ${t.lastKey()}`);
        console.log(prnIter(t.keys()));
        console.log(`k= ${t.get(3)}`);
        console.log(`has 2 = ${t.contains(2)}`);
        console.log(`has size = ${t.size()}`);
        t.remove(1);
        console.log(`has size = ${t.size()}`);
        console.log(prnIter(t.keys()));
        console.log(`k= ${t.get(2)}`);
        //t= new TreeMap();
        //t.set("ghi", "3"); t.set("def","2"); t.set("jkl","7"), t.set("zbc","1");
        //console.log(prnIter(t.keys()));
      }
    }
    //TreeMap.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class ST{
      constructor(){
        this.st = new TreeMap();
      }
      /**Returns the value associated with the given key in this symbol table.
       * @param  key the key
       * @return {any}
       */
      get(key){
        if(_.nichts(key)) throw Error("calls get() with null key");
        return this.st.get(key);
      }
      /**Inserts the specified key-value pair into the symbol table, overwriting the old
       * value with the new value if the symbol table already contains the specified key.
       * Deletes the specified key (and its associated value) from this symbol table
       * if the specified value is {@code null}.
       * @param  {any} key the key
       * @param  {any} val the value, if undefined, key is removed
       */
      put(key, val){
        if(_.nichts(key)) throw Error("calls put() with null key");
        if(val === undefined) this.st.remove(key);
        else this.st.set(key, val);
      }
      /**Removes the specified key and its associated value from this symbol table
       * (if the key is in this symbol table).
       * This is equivalent to {@code remove()}, but we plan to deprecate {@code delete()}.
       * @param  key the key
       */
      remove(key){
        if(_.nichts(key)) throw Error("calls remove() with null key");
        this.st.remove(key);
      }
      /**Returns true if this symbol table contain the given key.
       * @param  {any} key
       * @return {boolean}
       */
      contains(key){
        if(_.nichts(key)) throw Error("calls contains() with null key");
        return this.st.contains(key);
      }
      /**Returns the number of key-value pairs in this symbol table.
       * @return {number}
       */
      size(){
        return this.st.size();
      }
      /**Returns true if this symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.size() == 0;
      }
      /**Returns all keys in this symbol table.
       * To iterate over all of the keys in the symbol table named {@code st},
       * use the foreach notation: {@code for (Key key : st.keys())}.
       * @return {Iterator}
       */
      keys(){
        return this.st.keys();
      }
      /**Returns the smallest key in this symbol table.
       * @return {any}
       */
      min(){
        if(this.isEmpty()) throw Error("calls min() with empty symbol table");
        return this.st.firstKey();
      }
      /**Returns the largest key in this symbol table.
       * @return {any}
       */
      max(){
        if(this.isEmpty()) throw Error("calls max() with empty symbol table");
        return this.st.lastKey();
      }
      /**Returns the smallest key in this symbol table greater than or equal to {@code key}.
       * @param  {any} key
       * @return {any}
       */
      ceiling(key){
        if(_.nichts(key)) throw Error("argument to ceiling() is null");
        let w,k,it= this.st.keys();
        while(it.hasNext()){
          k=it.next();
          if(k == key || k>key){
            w=k;
            break;
          }
        }
        if(w===undefined)
          throw Error("argument to ceiling() is too large");
        return w;
      }
      /**Returns the largest key in this symbol table less than or equal to {@code key}.
       * @param  {any} key the key
       * @return {any}
       */
      floor(key){
        if(_.nichts(key)) throw Error("argument to floor() is null");
        let w,k,it= this.st.keys();
        while(it.hasNext()){
          k=it.next();
          if(k == key || k<key){
            w=k;
          }
        }
        if(w===undefined)
          throw Error("argument to floor() is too small");
        return w;
      }
      static test(){
        let t= new ST();
        t.put("a",1);t.put("g", 9); t.put("c",3); t.put("j",10); t.put("z",26); t.put("x",24);
        console.log(`isEmpty= ${t.isEmpty()}`);
        console.log(`size= ${t.size()}`);
        console.log(`get-c= ${t.get("c")}`);
        console.log(`contains z= ${t.contains("z")}`);
        console.log(`contains m= ${t.contains("m")}`);
        console.log(prnIter(t.keys()));
        console.log(`ceil w= ${t.ceiling("w")}`);
        console.log(`floor k= ${t.floor("k")}`);
        console.log(`min = ${t.min()}`);
        console.log(`max = ${t.max()}`);
        t.remove("x");
        console.log(prnIter(t.keys()));
      }
    }
    //ST.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class BTree{
      // max children per B-tree node = M-1 (must be even and greater than 2)
      static M = 4;
      Node(k){
        return{
          m:k,    // number of children
          children: new Array(BTree.M) // children
        }
      }
      // internal nodes: only use key and next external nodes: only use key and value
      Entry(key,val,next=UNDEF){ return{ key, val, next } }
      constructor(compareFn){
        //* @property {number} height  height of tree
        //* @property {number} n  number of key-value pairs in the B-tree
        //* @property {object} root root of tree
        this.root = this.Node(0);
        this.compare=compareFn;
        this._height=0;
        this.n=0;
      }
      /**Returns true if this symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.size() == 0;
      }
      /**Returns the number of key-value pairs in this symbol table.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Returns the height of this B-tree (for debugging).
       * @return {number}
       */
      height(){
        return this._height;
      }
      /**Returns the value associated with the given key.
       * @param  key the key
       * @return {any}
       */
      get(key){
        if(_.nichts(key)) throw Error("argument to get() is null");
        return this._search(this.root, key, this._height);
      }
      _search(x, key, ht){
        let cs = x.children;
        // external node
        if(ht == 0){
          for(let j = 0; j < x.m; ++j)
            if(this.compare(key, cs[j].key)==0) return cs[j].val;
        }else{ // internal node
          for(let j = 0; j < x.m; ++j)
            if(j+1 == x.m ||
               this.compare(key, cs[j+1].key)<0)
              return this._search(cs[j].next, key, ht-1);
        }
      }
      /**Inserts the key-value pair into the symbol table, overwriting the old value
       * with the new value if the key is already in the symbol table.
       * If the value is {@code undefined}, this effectively deletes the key from the symbol table.
       * @param  {any} key the key
       * @param  {any} val the value
       */
      put(key, val){
        if(_.nichts(key)) throw Error("argument key to put() is null");
        let t,u = this._insert(this.root, key, val, this._height);
        this.n += 1;
        if(!u) return;
        // need to split root
        t = this.Node(2);
        t.children[0] = this.Entry(this.root.children[0].key, null, this.root);
        t.children[1] = this.Entry(u.children[0].key, null, u);
        this.root = t;
        this._height+=1;
      }
      _insert(h, key, val, ht){
        let j,
            t = this.Entry(key, val);
        if(ht == 0){
          for(j = 0; j < h.m; ++j)
            if(this.compare(key, h.children[j].key)<0) break;
        }else{ // internal node
          for(j = 0; j < h.m; ++j){
            if((j+1 == h.m) ||
               this.compare(key, h.children[j+1].key)<0){
              let u = this._insert(h.children[j++].next, key, val, ht-1);
              if(!u) return null;
              t.key = u.children[0].key;
              t.val = null;
              t.next = u;
              break;
            }
          }
        }
        for(let i = h.m; i > j; --i)
          h.children[i] = h.children[i-1];
        h.children[j] = t;
        h.m++;
        if(h.m >= BTree.M) return this._split(h);
      }
      // split node in half
      _split(h){
        let m2=int(BTree.M/2),
            t = this.Node(m2);
        h.m = m2;
        for(let j = 0; j < m2; ++j)
          t.children[j] = h.children[m2+j];
        return t;
      }
      /**Returns a string representation of this B-tree (for debugging).
       * @return {string}
       */
      toString(){
        function _s(h, ht, indent){
          let s= "", cs= h.children;
          if(ht == 0){
            for(let j = 0; j < h.m; ++j)
              s+= `${indent}${cs[j].key} ${cs[j].val}\n`;
          }else{
            for(let j = 0; j < h.m; ++j){
              if(j > 0)
                s+= `${indent}(${cs[j].key})\n`;
              s+= _s(cs[j].next, ht-1, indent+"     ");
            }
          }
          return s;
        }
        return _s(this.root, this._height, "") + "\n";
      }
      static test(){
        let st = new BTree(CMP);
        st.put("www.cs.princeton.edu", "128.112.136.12");
        st.put("www.cs.princeton.edu", "128.112.136.11");
        st.put("www.princeton.edu",    "128.112.128.15");
        st.put("www.yale.edu",         "130.132.143.21");
        st.put("www.simpsons.com",     "209.052.165.60");
        st.put("www.apple.com",        "17.112.152.32");
        st.put("www.amazon.com",       "207.171.182.16");
        st.put("www.ebay.com",         "66.135.192.87");
        st.put("www.cnn.com",          "64.236.16.20");
        st.put("www.google.com",       "216.239.41.99");
        st.put("www.nytimes.com",      "199.239.136.200");
        st.put("www.microsoft.com",    "207.126.99.140");
        st.put("www.dell.com",         "143.166.224.230");
        st.put("www.slashdot.org",     "66.35.250.151");
        st.put("www.espn.com",         "199.181.135.201");
        st.put("www.weather.com",      "63.111.66.11");
        st.put("www.yahoo.com",        "216.109.118.65");
        console.log("cs.princeton.edu:  " + st.get("www.cs.princeton.edu"));
        console.log("hardvardsucks.com: " + st.get("www.harvardsucks.com"));
        console.log("simpsons.com:      " + st.get("www.simpsons.com"));
        console.log("apple.com:         " + st.get("www.apple.com"));
        console.log("ebay.com:          " + st.get("www.ebay.com"));
        console.log("dell.com:          " + st.get("www.dell.com"));
        console.log("");
        console.log("size:    " + st.size());
        console.log("height:  " + st.height());
        console.log(st.toString());
        console.log("");
      }
    }
    //BTree.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a <em>d</em>-dimensional mathematical vector.
     *  Vectors are mutable: their values can be changed after they are created.
     *  It includes methods for addition, subtraction,
     *  dot product, scalar product, unit vector, and Euclidean norm.
     * @memberof module:mcfud/algo_basic
     * @class
     */
    class SparseVector{
      /**Initializes a d-dimensional zero vector.
       * @param {number} d the dimension of the vector
       */
      constructor(d){
        //* @property {number} d  dimension
        //* @property {ST} st the vector, represented by index-value pairs
        this.d  = d;
        this.st = new ST();
      }
     /**Sets the ith coordinate of this vector to the specified value.
       * @param  {number} i the index
       * @param  {number} value the new value
       */
      put(i, value){
        if(i < 0 || i >= this.d) throw Error("Illegal index");
        //by definition, only store nonzero data
        if(_.feq0(value)) this.st.remove(i);
        else this.st.put(i, value);
      }
      /**Returns the ith coordinate of this vector.
       * @param  {number} i the index
       * @return {number} the value of the ith coordinate of this vector
       */
      get(i){
        if(i < 0 || i >= this.d) throw Error("Illegal index");
        return this.st.contains(i)? this.st.get(i): 0;
      }
      /**Returns the number of nonzero entries in this vector.
       * @return {number}
       */
      nnz(){
        return this.st.size();
      }
      /**Returns the dimension of this vector.
       * @return {number}
       */
      dimension(){
        return this.d;
      }
      /**Returns the inner product of this vector with the specified vector.
       * @param  {SparseVector} that the other vector
       * @return {number} the dot product between this vector and that vector
       */
      dot(that){
        _.assert(that instanceof SparseVector, "expected SparseVector data");
        if(this.d != that.d) throw Error("Vector lengths disagree");
        // iterate over the vector with the fewest nonzeros
        let i,sum=0,
            it= (this.st.size() <= that.st.size()? this : that).st.keys();
        while(it.hasNext()){
          i=it.next();
          if(that.st.contains(i)) sum += this.get(i) * that.get(i);
        }
        return sum;
      }
      /**Returns the inner product of this vector with the specified array.
       * @param  {array} vec the array
       * @return {number} the dot product between this vector and that array
       */
      dotWith(vec){
        let sum = 0;
        for(let i,it= this.st.keys();it.hasNext();){
          i=it.next();
          sum += vec[i] * this.get(i);
        }
        return sum;
      }
      /**Returns the magnitude of this vector.
       * This is also known as the L2 norm or the Euclidean norm.
       * @return {number} the magnitude of this vector
       */
      magnitude(){
        return Math.sqrt(this.dot(this));
      }
      /**Returns the scalar-vector product of this vector with the specified scalar.
       * @param  {number} alpha the scalar
       * @return {number} the scalar-vector product of this vector with the specified scalar
       */
      scale(alpha){
        let c = new SparseVector(this.d);
        for(let i,it= this.st.keys();it.hasNext();){
          i=it.next();
          c.put(i, alpha * this.get(i));
        }
        return c;
      }
      /**Returns the sum of this vector and the specified vector.
       * @param  {SparseVector} that the vector to add to this vector
       * @return {number} the sum of this vector and that vector
       */
      plus(that){
        _.assert(that instanceof SparseVector, "expected SparseVector data");
        if(this.d != that.d) throw Error("Vector lengths disagree");
        let c = new SparseVector(this.d);
        for(let i, it=this.st.keys();it.hasNext();){
          i=it.next();
          c.put(i, this.get(i)); // c = this
        }
        for(let i,it= that.st.keys();it.hasNext();){
          i=it.next();
          c.put(i, that.get(i) + c.get(i));     // c = c + that
        }
        return c;
      }
      /**Returns a string representation of this vector.
       * @return {string}
       */
      toString(){
        let s="";
        for(let i,it= this.st.keys();it.hasNext();){
          i=it.next();
          s+= `(${i}, ${this.st.get(i)}) `;
        }
        return s;
      }
      static test(){
        let a = new SparseVector(10),
            b = new SparseVector(10);
        a.put(3, 0.50);
        a.put(9, 0.75);
        a.put(6, 0.11);
        a.put(6, 0.00);
        b.put(3, 0.60);
        b.put(4, 0.90);
        console.log("a = " + a.toString());
        console.log("b = " + b.toString());
        console.log("a dot b = " + a.dot(b));
        console.log("a + b   = " + a.plus(b).toString());
      }
    }
    //SparseVector.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      prnIter,
      StdCompare:CMP,
      BTree,Bag,Stack,Queue,ST,
      TreeMap,SparseVector,Iterator
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //export
    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"))
  }else{
    gscope["io/czlab/mcfud/algo/basic"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_M,Basic){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();
    if(!Basic) Basic= gscope["io/czlab/mcfud/algo/basic"]();
    const {prnIter,Bag,Stack,Iterator,StdCompare:CMP}= Basic;
    const int=Math.floor;
    const {is,u:_}= Core;

    /**
     * @module mcfud/algo_sort
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // resize the underlying array to have the given capacity
    function resize(c,n,lo,hi,a){
      _.assert(c>n,"bad resize capacity");
      let i, temp = new Array(c);
      for(i=lo; i<hi; ++i) temp[i] = a[i];
      return temp;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const less=(v, w, cmp)=> cmp(v,w) < 0;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function exch(a, i, j){
      const swap = a[i];
      a[i] = a[j];
      a[j] = swap;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const isSorted=(a,C)=> isSorted3(a, 0, a.length,C);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isSorted3(a, lo, hi,C){
      for(let i = lo+1; i < hi; ++i)
        if(less(a[i], a[i-1], C)) return false;
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function show(a){
      let i,s="";
      for(i=0; i<a.length; ++i) s += `${a[i]} `;
      console.log(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array using insertion sort.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Insertion{
      /**Rearranges the array in order specified by the compareFn..
       * @param {array} a the array to be sorted
       * @param {function} compareFn
       * @return {array}
       */
      static sort(a,compareFn){
        const n = a.length;
        for(let i=1; i<n; ++i)
          for(let j=i; j>0 && less(a[j], a[j-1],compareFn); --j){
            exch(a, j, j-1);
          }
        return a;
      }
      /**Rearranges the subarray a[lo..hi) according to the compareFn.
       * @param {array} a the array to be sorted
       * @param {number} lo left endpoint (inclusive)
       * @param {number} hi right endpoint (exclusive)
       * @param {function} compareFn
       * @return {array}
       */
      static sortRange(a, lo, hi,compareFn){
        for(let i=lo+1; i<hi; ++i)
          for(let j=i; j>lo && less(a[j], a[j-1],compareFn); --j){
            exch(a, j, j-1);
          }
        return a;
      }
      /**Returns a permutation that gives the elements in the array
       * according to the compareFn.
       * @param a the array
       * @return {array} a permutation {@code p[]} such that {@code a[p[0]]}, {@code a[p[1]]},
       *    ..., {@code a[p[n-1]]} are in ascending order
       */
      static indexSort(a,compareFn){
        //do not change the original array a[]
        const n=a.length,
              ix = _.fill(n,(i)=> i);
        for(let i=1; i<n; ++i)
          for(let j=i; j>0 && less(a[ix[j]], a[ix[j-1]],compareFn); --j){
            exch(ix, j, j-1)
          }
        return ix;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(Insertion.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Insertion.sortRange(obj,0,obj.length,CMP));
        obj="SORTEXAMPLE".split("");
        show(Insertion.indexSort(obj,CMP));
      }
    }
    //Insertion.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides a static method for sorting an array using an optimized
     * binary insertion sort with half exchanges.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class BinaryInsertion{
      /**Rearranges the array according to compareFn.
       * @param {array} a the array to be sorted
       * @param {function} compareFn
       * @return {array}
       */
      static sort(a,compareFn){
        let mid,lo,hi,n=a.length;
        for(let v,i=1; i<n; ++i){
          // binary search to determine index j at which to insert a[i]
          lo = 0; hi = i; v = a[i];
          while(lo<hi){
            mid = lo + _M.ndiv(hi-lo,2);
            if(less(v, a[mid],compareFn)) hi = mid;
            else lo = mid + 1;
          }
          // insetion sort with "half exchanges"
          // (insert a[i] at index j and shift a[j], ..., a[i-1] to right)
          for(let j=i; j>lo; --j) a[j] = a[j-1];
          a[lo] = v;
        }
        return a;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(BinaryInsertion.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(BinaryInsertion.sort(obj,CMP));
      }
    }
    //BinaryInsertion.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array using <em>selection sort</em>.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Selection{
      /**Rearranges the array in ascending order, using a comparator.
       * @param {array} a the array
       * @param {function} compareFn
       */
      static sort(a, compareFn){
        let min,n=a.length;
        for(let i=0; i<n; ++i){
          min = i;
          for(let j=i+1; j<n; ++j)
            if(less(a[j], a[min],compareFn)) min = j;
          exch(a, i, min);
        }
        return a;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(Selection.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Selection.sort(obj,CMP));
      }
    }
    //Selection.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array using <em>Shellsort</em>.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Shell{
      /**Rearranges the array according to compareFn.
       * @param {array} a the array to be sorted
       * @param {function} compareFn
       * @return {array}
       */
      static sort(a, compareFn){
        let n = a.length,
            h=1, n3= _M.ndiv(n,3);
        // 3x+1 increment sequence:  1, 4, 13, 40, 121, 364, 1093, ...
        while(h < n3) h = 3*h + 1;
        while(h >= 1){
          // h-sort the array
          for(let i=h; i<n; ++i){
            for(let j=i; j>=h && less(a[j], a[j-h],compareFn); j -= h)
              exch(a, j, j-h);
          }
          h= _M.ndiv(h,3);
        }
        return a;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(Shell.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Shell.sort(obj,CMP));
      }
    }
    //Shell.test();

    /***************************************************************************
     *  Index mergesort.
     ***************************************************************************/
    // stably merge a[lo .. mid] with a[mid+1 .. hi] using aux[lo .. hi]
    function mergeIndex(a, index, aux, lo, mid, hi,C){
      // copy to aux[]
      for(let k=lo; k<=hi; ++k){ aux[k] = index[k] }
      // merge back to a[]
      let i = lo, j = mid+1;
      for(let k=lo; k<=hi; ++k){
        if(i>mid) index[k] = aux[j++];
        else if(j>hi) index[k] = aux[i++];
        else if(less(a[aux[j]], a[aux[i]],C)) index[k] = aux[j++];
        else index[k] = aux[i++];
      }
      return a;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // stably merge a[lo .. mid] with a[mid+1 ..hi] using aux[lo .. hi]
    function merge(a, aux, lo, mid, hi,C){
      // precondition: a[lo .. mid] and a[mid+1 .. hi] are sorted subarrays
      //assert isSorted(a, lo, mid);
      //assert isSorted(a, mid+1, hi);
      // copy to aux[]
      for(let k=lo; k<=hi; ++k){ aux[k] = a[k] }
      // merge back to a[]
      let i=lo, j=mid+1;
      for(let k=lo; k<=hi; ++k){
        if(i>mid) a[k] = aux[j++];
        else if(j>hi) a[k] = aux[i++];
        else if(less(aux[j], aux[i],C)) a[k] = aux[j++];
        else a[k] = aux[i++];
      }
      // postcondition: a[lo .. hi] is sorted
      //assert isSorted(a, lo, hi);
      return a;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // mergesort a[lo..hi] using auxiliary array aux[lo..hi]
    function sortIndex(a, index, aux, lo, hi,C){
      if(hi<=lo){}else{
        let mid = lo + _M.ndiv(hi-lo,2);
        sortIndex(a, index, aux, lo, mid,C);
        sortIndex(a, index, aux, mid + 1, hi,C);
        mergeIndex(a, index, aux, lo, mid, hi,C);
      }
      return a;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array
     * using a top-down, recursive version of <em>mergesort</em>.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Merge{
      /**Rearranges the array according to compareFn.
       * @param {array} a the array to be sorted
       * @param {function} compareFn
       * @return {array}
       */
      static sort(a,compareFn){
        // mergesort a[lo..hi] using auxiliary array aux[lo..hi]
        function _sort(a, aux, lo, hi,C){
          if(hi<=lo){}else{
            let mid = lo + _M.ndiv(hi-lo,2);
            _sort(a, aux, lo, mid,C);
            _sort(a, aux, mid + 1, hi,C);
            merge(a, aux, lo, mid, hi,C);
          }
          return a;
        }
        let aux = new Array(a.length);
        _sort(a, aux, 0, a.length-1,compareFn);
        return a;
      }
      /**Returns a permutation that gives the elements
       * in the array according to the compareFn.
       * @param {array} a the array
       * @param {function} C compare function
       * @return a permutation {@code p[]} such that {@code a[p[0]]}, {@code a[p[1]]},
       *    ..., {@code a[p[N-1]]} are in ascending order
       */
      static indexSort(a,C){
        let n=a.length,
            ix = _.fill(n,(i)=> i);
        let aux = new Array(n);
        sortIndex(a, ix, aux, 0, n-1,C);
        return ix;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(Merge.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Merge.sort(obj,CMP));
        obj="SORTEXAMPLE".split("");
        show(Merge.indexSort(obj,CMP));
      }
    }
    //Merge.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array using bubble sort.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Bubble{
      /**Rearranges the array in ascending order, using the natural order.
       * @param {array} a the array to be sorted
       */
      static sort(a,C){
        const n=a.length;
        for(let x, i=0; i<n; ++i){
          x=0;
          for(let j=n-1; j>i; --j){
            if(less(a[j], a[j-1],C)){
              exch(a, j, j-1);
              ++x;
            }
          }
          if(x == 0) break;
        }
        return a;
      }
      static test(){
        let obj="bed bug dad yes zoo all bad yet".split(" ");
        Bubble.sort(obj,CMP);
        show(obj);
      }
    }
    //Bubble.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // partition the subarray a[lo..hi] so that a[lo..j-1] <= a[j] <= a[j+1..hi]
    // and return the index j.
    function partition(a, lo, hi,C){
      let i = lo,
          v = a[lo],
          j = hi + 1;
      while(true){
        // find item on lo to swap
        while(less(a[++i], v,C)){
          if(i==hi) break;
        }
        // find item on hi to swap
        while(less(v, a[--j],C)){
          if(j==lo) break;// redundant since a[lo] acts as sentinel
        }
        // check if pointers cross
        if(i>=j) break;
        exch(a, i, j);
      }
      // put partitioning item v at a[j]
      exch(a, lo, j);
      // now, a[lo .. j-1] <= a[j] <= a[j+1 .. hi]
      return j;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides static methods for sorting an array and
     * selecting the ith smallest element in an array using quicksort.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Quick{
      /**Rearranges the array according to the compareFn.
       * @param {array} a the array to be sorted
       * @param {function} compareFn
       */
      static sort(a,compareFn){
        // quicksort the subarray from a[lo] to a[hi]
        function _sort(a, lo, hi,C){
          if(hi<=lo){}else{
            let j = partition(a, lo, hi,C);
            _sort(a, lo, j-1,C);
            _sort(a, j+1, hi,C);
          }
          return a;
        }
        //_.shuffle(a);
        _sort(a, 0, a.length - 1,compareFn);
        return a;
      }
      /**Rearranges the array so that {@code a[k]} contains the kth smallest key;
       * {@code a[0]} through {@code a[k-1]} are less than (or equal to) {@code a[k]}; and
       * {@code a[k+1]} through {@code a[n-1]} are greater than (or equal to) {@code a[k]}.
       *
       * @param  {array} a the array
       * @param  {number} k the rank of the key
       * @param {function} compareFn
       * @return the key of rank {@code k}
       */
      static select(a, k,compareFn){
        if(k < 0 || k >= a.length)
          throw Error(`index is not between 0 and ${a.length}: ${k}`);
        //_.shuffle(a);
        let lo = 0, hi = a.length-1;
        while(hi>lo){
          let i= partition(a, lo, hi, compareFn);
          if(i>k) hi = i-1;
          else if(i<k) lo = i+1;
          else return a[i];
        }
        return a[lo];
      }
      static test(){
        let obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Quick.sort(obj,CMP));
        obj="SORTEXAMPLE".split("");
        show(Quick.sort(obj, CMP));
        _.shuffle(obj)
        obj.forEach((s,i)=> console.log(Quick.select(obj,i,CMP)));
      }
    }
    //Quick.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const less4=(a,i, j,C)=> less(a[i], a[j],C);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // is pq[1..n] a max heap?
    function isMaxHeap(M){
      for(let i=1; i <= M.n; ++i)
        if(_.nichts(M.pq[i])) return false;

      for(let i = M.n+1; i < M.pq.length; ++i)
        if(!_.nichts(M.pq[i])) return false;

      if(!_.nichts(M.pq[0])) return false;
      return isMaxHeapOrdered(1,M);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // is subtree of pq[1..n] rooted at k a max heap?
    function isMaxHeapOrdered(k,M){
      if(k > M.n) return true;
      let left = 2*k,
          right = 2*k + 1;
      if(left  <= M.n &&
         less4(M.pq, k, left,M.comparator))  return false;
      if(right <= M.n &&
         less4(M.pq, k, right,M.comparator)) return false;
      return isMaxHeapOrdered(left,M) && isMaxHeapOrdered(right,M);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a priority queue of generic keys.
     *  It supports the usual insert and delete-the-minimum operations,
     *  along with the merging of two heaps together.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class FibonacciMinPQ{
      Node(key){
        //int order; //Order of the tree rooted by this Node
        return {key, order:0};// prev:null, next:null, child:null
      }
      constructor(compareFn, keys){
        //private Node head;          //Head of the circular root list
        //private Node min;         //Minimum Node of the root list
        //private int size;         //Number of keys in the heap
        //private final Comparator<Key> comp; //Comparator over the keys
        //private HashMap<Integer, Node> table = new HashMap<Integer, Node>(); //Used for the consolidate operation
        this.compare=compareFn;
        this.table=new Map();
        this.head=UNDEF;
        this._min=UNDEF;
        this.n=0;
        if(is.vec(keys))
          keys.forEach(k=> this.insert(k));
      }
      /**Whether the priority queue is empty
      * @return {boolean}
      */
      isEmpty(){
        return this.n == 0;
      }
      /**Number of elements currently on the priority queue
      * @return {number}
      */
      size(){
        return this.n;
      }
      /**Insert a key in the queue
      * @param {any} key a Key
      */
      insert(key){
        let x = this.Node(key);
        this.n+= 1;
        this.head = this._insertNode(x, this.head);
        this._min= !this._min? this.head
                           : (this._greater(this._min.key, key) ? this.head : this._min);
      }
      /**Gets the minimum key currently in the queue
      * @return {any}
      */
      min(){
        if(this.isEmpty())
          throw Error("Priority queue is empty");
        return this._min.key;
      }
      /**Deletes the minimum key
      * @return {any} the minimum key
      */
      delMin(){
        if(this.isEmpty())
          throw Error("Priority queue is empty");
        this.head = this._cut(this._min, this.head);
        let x= this._min.child,
            key = this._min.key;
        this._min.key = UNDEF;
        if(x){
          this.head = this._meld(this.head, x);
          this._min.child = UNDEF;
        }
        this.n -= 1;
        if(!this.isEmpty()) this._consolidate();
        else this._min = UNDEF;
        return key;
      }
      /**Merges two heaps together
      * This operation is destructive
      * @param {FibonacciMinPQ} that a Fibonacci heap
      * @return {FibonacciMinPQ}
      */
      union(that){
        this.head = this._meld(this.head, that.head);
        this._min = this._greater(this._min.key, that._min.key) ? that._min : this._min;
        this.n = this.n + that.n;
        return this;
      }
      _greater(n, m){
        if(_.nichts(n)) return false;
        if(_.nichts(m)) return true;
        return this.compare(n,m) > 0;
      }
      //Assuming root1 holds a greater key than root2, root2 becomes the new root
      _link(root1, root2){
        root2.child = this._insertNode(root1, root2.child);
        root2.order+=1;
      }
      //Coalesce the roots, thus reshapes the tree
      _consolidate(){
        this.table.clear();
        let x = this.head,
            y = UNDEF,
            z = UNDEF,
            maxOrder = 0;
        this._min = this.head;
        do{
          y = x;
          x = x.next;
          z = this.table.get(y.order);
          while(z){
            this.table.delete(y.order);
            if(this._greater(y.key, z.key)){
              this._link(y, z);
              y = z;
            }else{
              this._link(z, y);
            }
            z = this.table.get(y.order);
          }
          this.table.set(y.order, y);
          if(y.order > maxOrder) maxOrder = y.order;
        }while(x !== this.head);
        this.head = null;
        this.table.forEach((v)=>{
          if(v){
            this._min = this._greater(this._min.key, v.key) ? v : this._min;
            this.head = this._insertNode(v, this.head);
          }
        })
      }
      //Inserts a Node in a circular list containing head, returns a new head
      _insertNode(x, head){
        if(!head){
          x.prev = x;
          x.next = x;
        }else{
          head.prev.next = x;
          x.next = head;
          x.prev = head.prev;
          head.prev = x;
        }
        return x;
      }
      //Removes a tree from the list defined by the head pointer
      _cut(x, head){
        if(x.next === x) {
          x.next = UNDEF;
          x.prev = UNDEF;
          return UNDEF;
        }else{
          x.next.prev = x.prev;
          x.prev.next = x.next;
          let res = x.next;
          x.next = UNDEF;
          x.prev = UNDEF;
          return head === x?  res: head;
        }
      }
      //Merges two root lists together
      _meld(x, y){
        if(!x) return y;
        if(!y) return x;
        x.prev.next = y.next;
        y.next.prev = x.prev;
        x.prev = y;
        y.next = x;
        return x;
      }
      /**Gets an Iterator over the Keys in the priority queue in ascending order
      * The Iterator does not implement the remove() method
      * iterator() : Worst case is O(n)
      * next() :  Worst case is O(log(n)) (amortized)
      * hasNext() :   Worst case is O(1)
      * @return {Iterator}
      */
      iter(){
        let copy = new FibonacciMinPQ(this.compare);
        let insertAll=(head)=>{
          if(!head) return;
          let x = head;
          do{
            copy.insert(x.key);
            insertAll(x.child);
            x = x.next;
          }while (x !== head);
        };
        insertAll(this.head);
        return{
          remove(){ throw Error("UnsupportedOperationException") },
          hasNext(){ return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error("NoSuchElementException");
            return copy.delMin();
          }
        }
      }
      static test(){
        let msg="",
            obj= new FibonacciMinPQ(CMP);
        "PQE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        "XAM".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        "PLE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        obj.isEmpty();
        console.log(msg)
        console.log("min= " + obj.min());
        console.log(prnIter(obj.iter()));
        console.log("(" + obj.size() + " left on pq)");
        let obj2 = new FibonacciMinPQ(CMP);
        "ZTAK".split("").forEach(s=> obj2.insert(s));
        obj2= obj2.union(obj);
        console.log(prnIter(obj2.iter()));
      }
    }
    //FibonacciMinPQ.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an indexed priority queue of generic keys.
     *  It supports the usual insert and delete-the-minimum operations,
     *  along with delete and change-the-key methods.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class IndexFibonacciMinPQ{
      Node(key){
        //Node<Key> prev, next;     //siblings of the Node
        ////Node<Key> parent, child;    //parent and child of this Node
        //boolean mark;         //Indicates if this Node already lost a child
        return{key, order:0, index:0};//
        //prev:null, next:null, parent:null, child:null, mark:false
      }
      constructor(maxN,compareFn){
        //private Node<Key>[] nodes;      //Array of Nodes in the heap
        //private Node<Key> head;       //Head of the circular root list
        //private Node<Key> min;        //Minimum Node in the heap
        //private int size;         //Number of keys in the heap
        //private int n;            //Maximum number of elements in the heap
        //private HashMap<Integer, Node<Key>> table = new HashMap<Integer, Node<Key>>(); //Used for the consolidate operation
        if(maxN < 0)
          throw Error("Cannot create a priority queue of negative size");
        this.maxN = maxN;
        this.n=0;
        this.head=UNDEF;
        this._min=UNDEF;
        this.compare = compareFn;
        this.table=new Map();
        this.nodes = new Array(maxN);
      }
      /**Whether the priority queue is empty
      * @return {boolean}
      */
      isEmpty(){
        return this.n== 0;
      }
      /**Does the priority queue contains the index i ?
      * @param {number} i an index
      * @return {boolean}
      */
      contains(i){
        if(i<0 || i >= this.maxN) throw Error("IllegalArgumentException");
        return _.echt(this.nodes[i]);
      }
      /**Number of elements currently on the priority queue
      * @return {number}
      */
      size(){
        return this.n;
      }
      /**Associates a key with an index
      * @param {number} i an index
      * @param {any} key a Key associated with i
      */
      insert(i, key){
        if(i<0 || i>= this.maxN) throw Error("IllegalArgumentException");
        if(this.contains(i)) throw Error("Specified index is already in the queue");
        let x = this.Node(key);
        x.index = i;
        this.nodes[i] = x;
        this.n+=1;
        this.head = this._insertNode(x, this.head);
        this._min= !this._min? this.head
                             : this._greater(this._min.key, key) ? this.head : this._min;
      }
      /**Get the index associated with the minimum key
      * @return {number} the index associated with the minimum key
      */
      minIndex(){
        if(this.isEmpty()) throw Error("Priority queue is empty");
        return this._min.index;
      }
      /**Get the minimum key currently in the queue
      * @return {any} the minimum key currently in the priority queue
      */
      min(){
        if(this.isEmpty()) throw Error("Priority queue is empty");
        return this._min.key;
      }
      /**Delete the minimum key
      * @return {number} the index associated with the minimum key
      */
      delMin(){
        if(this.isEmpty()) throw Error("Priority queue is empty");
        this.head = this._cutNode(this._min, this.head);
        let x = this._min.child,
            index = this._min.index;
        this._min.key = UNDEF;
        if(x){
          do{
            x.parent = UNDEF;
            x = x.next;
          }while(x !== this._min.child);
          this.head = this._meld(this.head, x);
          this._min.child = UNDEF;     //For garbage collection
        }
        this.n-=1;
        if(!this.isEmpty()) this._consolidate();
        else this._min = UNDEF;
        this.nodes[index] = UNDEF;
        return index;
      }
      /**Get the key associated with index i
      * @param {number} i an index
      * @return {any} the key associated with index i
      */
      keyOf(i){
        if(i< 0 || i >= this.maxN) throw Error("IllegalArgumentException");
        if(!this.contains(i)) throw Error("Specified index is not in the queue");
        return this.nodes[i].key;
      }
      /**Changes the key associated with index i to the given key
      * If the given key is greater, Worst case is O(log(n))
      * If the given key is lower, Worst case is O(1) (amortized)
      * @param {number} i an index
      * @param {any} key the key to associate with i
      */
      changeKey(i, key){
        if(i < 0 || i >= this.maxN) throw Error("IllegalArgumentException");
        if(!this.contains(i)) throw Error("Specified index is not in the queue");
        this._greater(key, this.nodes[i].key)? this.increaseKey(i, key) : this.decreaseKey(i, key);
      }
      /**Decreases the key associated with index i to the given key
      * @param {number} i an index
      * @param {any} key the key to associate with i
      */
      decreaseKey(i, key){
        if(i<0 || i >= this.maxN) throw Error("IllegalArgumentException");
        if(!this.contains(i)) throw Error("Specified index is not in the queue");
        if(this._greater(key, this.nodes[i].key))
          throw Error("Calling with this argument would not decrease the key");
        let x = this.nodes[i];
        x.key = key;
        if(this._greater(this._min.key, key)){
          this._min = x;
        }
        if(x.parent && this._greater(x.parent.key, key)){
          this._cut(i)
        }
      }
      /**Increases the key associated with index i to the given key
      * @param {number} i an index
      * @param {any} key the key to associate with i
      */
      increaseKey(i, key){
        if(i<0 || i>= this.maxN) throw Error("IllegalArgumentException");
        if(!this.contains(i)) throw Error("Specified index is not in the queue");
        if(this._greater(this.nodes[i].key, key))
          throw Error("Calling with this argument would not increase the key");
        this.delete(i);
        this.insert(i, key);
      }
      /**Deletes the key associated the given index
      * @param {number} i an index
      */
      delete(i){
        if(i<0 || i >= this.maxN) throw Error("IllegalArgumentException");
        if(!this.contains(i)) throw Error("Specified index is not in the queue");
        let x = this.nodes[i];
        x.key = null;       //For garbage collection
        if(x.parent){ this._cut(i) }
        this.head = this._cutNode(x, this.head);
        if(x.child){
          let child = x.child;
          x.child = UNDEF;     //For garbage collection
          x = child;
          do{
            child.parent = UNDEF;
            child = child.next;
          }while(child !== x);
          this.head = this._meld(this.head, child);
        }
        if(!this.isEmpty()) this._consolidate();
        else this._min = UNDEF;
        this.nodes[i] = UNDEF;
        this.n-=1;
      }
      _greater(n, m){
        if(_.nichts(n)) return false;
        if(_.nichts(m)) return true;
        return this.compare(n, m) > 0;
      }
      _link(root1, root2){
        root1.parent = root2;
        root2.child = this._insertNode(root1, root2.child);
        root2.order+=1;
      }
      //Removes a Node from its parent's child list and insert it in the root list
      //If the parent Node already lost a child, reshapes the heap accordingly
      _cut(i){
        let x = this.nodes[i];
        let parent = x.parent;
        parent.child = this._cutNode(x, parent.child);
        x.parent = UNDEF;
        parent.order-=1;
        this.head = this._insertNode(x, this.head);
        parent.mark = !parent.mark;
        if(!parent.mark && parent.parent){
          this._cut(parent.index);
        }
      }
      //Coalesces the roots, thus reshapes the heap
      //Caching a HashMap improves greatly performances
      _consolidate(){
        let y = UNDEF,
            z = UNDEF,
            maxOrder = 0,
            x = this.head;
        this.table.clear();
        this._min = this.head;
        do{
          y = x;
          x = x.next;
          z = this.table.get(y.order);
          while(z){
            this.table.delete(y.order);
            if(this._greater(y.key, z.key)){
              this._link(y, z);
              y = z;
            }else{
              this._link(z, y);
            }
            z = this.table.get(y.order);
          }
          this.table.set(y.order, y);
          if(y.order > maxOrder) maxOrder = y.order;
        }while(x !== this.head);
        this.head = UNDEF;
        this.table.forEach(n=>{
          this._min = this._greater(this._min.key, n.key) ? n : this._min;
          this.head = this._insertNode(n, this.head);
        })
      }
      //Inserts a Node in a circular list containing head, returns a new head
      _insertNode(x, head){
        if(!head){
          x.prev = x;
          x.next = x;
        }else{
          head.prev.next = x;
          x.next = head;
          x.prev = head.prev;
          head.prev = x;
        }
        return x;
      }
      //Removes a tree from the list defined by the head pointer
      _cutNode(x, head){
        if(x.next === x){
          x.next = UNDEF;
          x.prev = UNDEF;
          return UNDEF;
        }else{
          x.next.prev = x.prev;
          x.prev.next = x.next;
          let res = x.next;
          x.next = UNDEF;
          x.prev = UNDEF;
          return head === x?  res: head;
        }
      }
      _meld(x, y){
        if(!x) return y;
        if(!y) return x;
        x.prev.next = y.next;
        y.next.prev = x.prev;
        x.prev = y;
        y.next = x;
        return x;
      }
      /**Get an Iterator over the indexes in the priority queue in ascending order
      * The Iterator does not implement the remove() method
      * iterator() : Worst case is O(n)
      * next() :  Worst case is O(log(n)) (amortized)
      * hasNext() :   Worst case is O(1)
      * @return {Iterator}
      */
      iter(){
        let copy= new IndexFibonacciMinPQ(this.maxN,this.compare);
        this.nodes.forEach(x=> {
          if(x) copy.insert(x.index, x.key);
        });
        return{
          remove(){ throw Error("UnsupportedOperationException") },
          hasNext(){ return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error("NoSuchElementException");
            return copy.delMin();
          }
        }
      }
      static test(){
        let strings = [ "it", "was", "the", "best", "of", "times", "it", "was", "the", "worst" ];
        let pq = new IndexFibonacciMinPQ(strings.length,CMP);
        for(let i=0; i<strings.length; ++i) pq.insert(i, strings[i]);
        // delete and print each key
        console.log("min= " +pq.min());
        console.log("minindex= "+pq.minIndex());
        console.log("size= "+pq.size());
        console.log("contains(3)="+pq.contains(3));
        console.log("keyOf(3)="+pq.keyOf(3));
        pq.changeKey(3,"bbbb");
        //pq.delete(3);
        while(!pq.isEmpty()){
          let i = pq.minIndex();
          console.log(i + " " + pq.keyOf(i));
          pq.delMin();
        }
        console.log("");
        // reinsert the same strings
        for(let i=0; i<strings.length; ++i) pq.insert(i, strings[i]);
        // print each key using the iterator
        for(let i,it=pq.iter();it.hasNext();){
          i=it.next();
          console.log(i + " " + strings[i]);
        }
        while(!pq.isEmpty()){ pq.delMin() }
      }
    }
    //IndexFibonacciMinPQ.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a priority queue of generic keys.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class MinPQ{
      /**Initializes an empty priority queue with the given initial capacity.
       * @param {function} compareFn
       * @param {number|array} keys capacity or keys
       */
      constructor(compareFn, keys){
        //* @property {function} comparator
        //* @property {number} n // number of items on priority queue
        //* @property {array} pq // store items at indices 1 to n
        this.comparator = compareFn;
        this.n=0;
        if(is.vec(keys)){
          this.pq = new Array(keys.length+1);
          this.n = keys.length;
          for(let i=0; i< this.n; ++i) this.pq[i+1] = keys[i];
          for(let k = int(this.n/2); k>=1; --k) this._sink(k,this);
        }else{
          this.pq= new Array(is.num(keys)? keys: 2);
        }
        _.assert(this._isMinHeap(),"not min heap");
      }
      /**Returns true if this priority queue is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.n == 0;
      }
      /**Returns the number of keys on this priority queue.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Returns a smallest key on this priority queue.
       * @return {any}
       */
      min(){
        if(this.isEmpty()) throw Error("Priority queue underflow");
        return this.pq[1];
      }
      /**Adds a new key to this priority queue.
       * @param  x the key to add to this priority queue
       */
      insert(x){
        // double size of array if necessary
        if(this.n==this.pq.length-1)
          this.pq=resize(2*this.pq.length, this.n, 1, this.n+1, this.pq);
        // add x, and percolate it up to maintain heap invariant
        this.pq[++this.n] = x;
        this._swim(this.n);
        _.assert(this._isMinHeap(),"not min heap-insert");
      }
      /**Removes and returns a smallest key on this priority queue.
       * @return {any}
       */
      delMin(){
        if(this.isEmpty()) throw Error("Priority queue underflow");
        let min=this.pq[1];
        exch(this.pq, 1, this.n--);
        this._sink(1);
        this.pq[this.n+1] = UNDEF;// to avoid loitering and help with garbage collection
        if((this.n>0) &&
           (this.n== _M.ndiv(this.pq.length-1,4)))
          this.pq= resize(_M.ndiv(this.pq.length,2),this.n,1,this.n+1,this.pq);
        return min;
      }
      _swim(k){
        while(k>1 && this._greater(_M.ndiv(k,2), k)){
          exch(this.pq, k, _M.ndiv(k,2));
          k=_M.ndiv(k,2);
        }
      }
      _sink(k){
        while(2*k <= this.n){
          let j = 2*k;
          if(j<this.n && this._greater(j, j+1)) j++;
          if(!this._greater(k, j)) break;
          exch(this.pq, k, j);
          k=j;
        }
      }
      _greater(i, j){
        return this.comparator(this.pq[i], this.pq[j]) > 0;
      }
      // is pq[1..n] a min heap?
      _isMinHeap(){
        for(let i=1; i<=this.n; ++i) if(_.nichts(this.pq[i])) return false;
        for(let i=this.n+1; i<this.pq.length; ++i) if(!_.nichts(this.pq[i])) return false;
        return _.echt(this.pq[0])? false: this._isMinHeapOrdered(1);
      }
      // is subtree of pq[1..n] rooted at k a min heap?
      _isMinHeapOrdered(k){
        if(k>this.n) return true;
        let left = 2*k,
            right = 2*k + 1;
        if(left  <= this.n && this._greater(k, left))  return false;
        if(right <= this.n && this._greater(k, right)) return false;
        return this._isMinHeapOrdered(left) && this._isMinHeapOrdered(right);
      }
      /**Returns an iterator that iterates over the keys.
       * @return {Iterator}
       */
      iter(){
        // add all items to copy of heap takes
        // linear time since already in heap order so no keys move
        let copy = new MinPQ(this.comparator, this.size());
        for(let i=1; i<=this.n; ++i) copy.insert(this.pq[i]);
        return{
          remove(){ throw Error("UnsupportedOperationException") },
          hasNext(){ return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error("NoSuchElementException");
            return copy.delMin();
          }
        }
      }
      static test(){
        let msg="",
            obj= new MinPQ(CMP);
        "PQE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        "XAM".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        "PLE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMin() + " ";
        console.log(msg)
        console.log("(" + obj.size() + " left on pq)");
      }
    }
    //MinPQ.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a priority queue of generic keys.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class MaxPQ{
      /**Initializes an empty priority queue with the given initial capacity,
       * using the given comparator.
       * @param {function} compareFn
       * @param {any} keys
       */
      constructor(compareFn, keys){
        //* @property {function} comparator
        //* @property {number} n // number of items on priority queue
        //* @property {array} pq // store items at indices 1 to n
        this.comparator = compareFn;
        this.n=0;
        if(is.vec(keys)){
          this.pq = new Array(keys.length+1);
          this.n = keys.length;
          for(let i=0; i<this.n; ++i) this.pq[i+1] = keys[i];
          for(let k=int(this.n/2); k>=1; --k) this._sink(k);
        }else{
          this.pq= new Array(is.num(keys)? keys: 2);
        }
        _.assert(this._isMaxHeap(),"not max heap");
      }
      /**Returns true if this priority queue is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.n == 0
      }
      /**Returns the number of keys on this priority queue.
       * @return {number}
       */
      size(){
        return this.n
      }
      /**Returns a largest key on this priority queue.
       * @return {any}
       */
      max(){
        if(this.isEmpty())
          throw Error("Priority queue underflow");
        return this.pq[1];
      }
      /**Adds a new key to this priority queue.
       * @param  {any} x
       */
      insert(x){
        // double size of array if necessary
        if(this.n == this.pq.length-1)
          this.pq=resize(2*this.pq.length, this.n, 1,this.n+1, this.pq);
        // add x, and percolate it up to maintain heap invariant
        this.n+=1;
        this.pq[this.n] = x;
        this._swim(this.n);
        _.assert(this._isMaxHeap(),"not max heap-insert");
      }
      /**Removes and returns a largest key on this priority queue.
       * @return a largest key on this priority queue
       * @throws Error if this priority queue is empty
       */
      delMax(){
        if(this.isEmpty())
          throw Error("Priority queue underflow");
        let max = this.pq[1];
        exch(this.pq, 1, this.n);
        this.n-=1;
        this._sink(1);
        this.pq[this.n+1] = null;     // to avoid loitering and help with garbage collection
        if(this.n > 0 &&
           this.n == _M.ndiv(this.pq.length-1,4))
          this.pq=resize(_M.ndiv(this.pq.length,2), this.n, 1, this.n+1, this.pq);
        return max;
      }
      _isMaxHeap(){
        for(let i=1; i <= this.n; ++i) if(_.nichts(this.pq[i])) return false;
        for(let i = this.n+1; i < this.pq.length; ++i) if(_.echt(this.pq[i])) return false;
        if(_.echt(this.pq[0])) return false;
        return this._isMaxHeapOrdered(1);
      }
      _isMaxHeapOrdered(k){
        if(k > this.n) return true;
        let left = 2*k,
            right = 2*k + 1;
        if(left  <= this.n && less4(this.pq,k, left,this.comparator))  return false;
        if(right <= this.n && less4(this.pq,k, right,this.comparator)) return false;
        return this._isMaxHeapOrdered(left) && this._isMaxHeapOrdered(right);
      }
      _swim(k){
        while(k>1 && less4(this.pq, _M.ndiv(k,2), k, this.comparator)){
          exch(this.pq, k, _M.ndiv(k,2));
          k= _M.ndiv(k,2);
        }
      }
      _sink(k){
        let j;
        while(2*k <= this.n){
          j = 2*k;
          if(j<this.n && less4(this.pq, j, j+1,this.comparator)) ++j;
          if(!less4(this.pq, k, j, this.comparator)) break;
          exch(this.pq, k, j);
          k=j;
        }
      }
      /**Returns an iterator that iterates over the keys.
       * @return {Iterator}
       */
      iter(){
        // add all items to copy of heap takes linear time since already in heap order so no keys move
        const copy = new MaxPQ(this.comparator, this.size());
        for(let i=1; i<=this.n; ++i) copy.insert(this.pq[i]);
        return{
          remove(){ throw Error("UnsupportedOperationException") },
          hasNext(){ return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error("NoSuchElementException");
            return copy.delMax();
          }
        }
      }
      static test(){
        let msg="",
            obj= new MaxPQ(CMP);
        "PQE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMax() + " ";
        "XAM".split("").forEach(s=>obj.insert(s));
        msg += obj.delMax() + " ";
        "PLE".split("").forEach(s=>obj.insert(s));
        msg += obj.delMax() + " ";
        console.log(msg)
        console.log("(" + obj.size() + " left on pq)");
      }
    }
    //MaxPQ.test();

    /***************************************************************************
     * Helper functions for comparisons and swaps.
     * Indices are "off-by-one" to support 1-based indexing.
     ***************************************************************************/
    function lessOneOff(pq, i, j, C){
      return C(pq[i-1], pq[j-1]) < 0
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function exchOneOff(pq, i, j){
      const swap = pq[i-1];
      pq[i-1] = pq[j-1];
      pq[j-1] = swap;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides a static method to sort an array using <em>heapsort</em>.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class Heap{
      /**Rearranges the array according to the compareFn.
       * @param {array} pq the array to be sorted
       * @param {function} compareFn
       */
      static sort(pq,compareFn){
        function _sink4(pq, k, n,C){
          while(2*k <= n){
            let j = 2*k;
            if(j<n && lessOneOff(pq, j, j+1,C)) ++j;
            if(!lessOneOff(pq, k, j,C)) break;
            exchOneOff(pq, k, j);
            k=j;
          }
        }
        let k,n=pq.length;
        // heapify phase
        for(k = _M.ndiv(n,2); k >= 1; --k){
          _sink4(pq, k, n, compareFn)
        }
        // sortdown phase
        k=n;
        while(k > 1){
          exchOneOff(pq, 1, k--);
          _sink4(pq, 1, k,compareFn);
        }
        //////
        return pq;
      }
      static test(){
        let obj="SORTEXAMPLE".split("");
        show(Heap.sort(obj,CMP));
        obj="bed bug dad yes zoo all bad yet".split(" ");
        show(Heap.sort(obj,CMP));
      }
    }
    //Heap.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an indexed priority queue of generic keys.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class IndexMinPQ{
      /**
       * Initializes an empty indexed priority queue with indices between {@code 0}
       * and {@code maxN - 1}.
       * @param {number} maxN the keys on this queue are index from {@code 0} {@code maxN - 1}
       * @param {function} compareFn
       */
      constructor(maxN,compareFn){
        //* @property {number} maxN  maximum number of elements on PQ
        //* @property {number} n number of elements on PQ
        //* @property {array} pq  binary heap using 1-based indexing
        //* @property {array} qp  inverse of pq - qp[pq[i]] = pq[qp[i]] = i
        //* @property {array} mKeys  keys[i] = priority of i
        if(maxN < 0) throw Error(`IllegalArgumentException`);
        this.compare=compareFn;
        this.maxN = maxN;
        this.n = 0;
        this.mKeys = new Array(maxN+1);// make this of length maxN??
        this.pq = new Array(maxN + 1);
        this.qp = new Array(maxN + 1); // make this of length maxN??
        for(let i=0; i<=maxN; ++i) this.qp[i] = -1;
      }
      /**Returns true if this priority queue is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.n == 0;
      }
      /**Is {@code i} an index on this priority queue?
       * @param  {number} i an index
       * @return {boolean}
       */
      contains(i){
        this._validateIndex(i);
        return this.qp[i] != -1;
      }
      /**Returns the number of keys on this priority queue.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Associates key with index {@code i}.
       * @param  {number} i an index
       * @param  {any} key the key to associate with index {@code i}
       */
      insert(i, key){
        this._validateIndex(i);
        if(this.contains(i))
          throw Error("index is already in the priority queue");
        ++this.n;
        this.qp[i] = this.n;
        this.pq[this.n] = i;
        this.mKeys[i] = key;
        this._swim(this.n);
      }
      /**Returns an index associated with a minimum key.
       * @return {any}
       */
      minIndex(){
        if(this.n == 0) throw Error("Priority queue underflow");
        return this.pq[1];
      }
      /**Returns a minimum key.
       * @return {any}
       */
      minKey(){
        if(this.n == 0) throw Error("Priority queue underflow");
        return this.mKeys[this.pq[1]];
      }
      /**Removes a minimum key and returns its associated index.
       * @return {any}
       */
      delMin(){
        if(this.n == 0) throw Error("Priority queue underflow");
        let min = this.pq[1];
        this._exch(1, this.n--);
        this._sink(1);
        _.assert(min == this.pq[this.n+1], "No good");
        this.qp[min] = -1; // delete
        this.mKeys[min] = null;  // to help with garbage collection
        this.pq[this.n+1] = -1; // not needed
        return min;
      }
      /**Returns the key associated with index {@code i}.
       * @param  {number} i the index of the key to return
       * @return {any}
       */
      keyOf(i){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        return this.mKeys[i];
      }
      /**Change the key associated with index {@code i} to the specified value.
       * @param  {number} i the index of the key to change
       * @param  {any} key change the key associated with index {@code i} to this key
       */
      changeKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        this.mKeys[i] = key;
        this._swim(this.qp[i]);
        this._sink(this.qp[i]);
      }
      /**Decrease the key associated with index {@code i} to the specified value.
       * @param  {number} i the index of the key to decrease
       * @param  {any} key decrease the key associated with index {@code i} to this key
       */
      decreaseKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        let c=this.compare(this.mKeys[i],key);
        if(c== 0)
          throw Error("Calling decreaseKey() with a key equal to the key in the priority queue");
        if(c< 0)
          throw Error("Calling decreaseKey() with a key strictly greater than the key in the priority queue");
        this.mKeys[i] = key;
        this._swim(this.qp[i]);
      }
      /**Increase the key associated with index {@code i} to the specified value.
       * @param  {number} i the index of the key to increase
       * @param  {any} key increase the key associated with index {@code i} to this key
       */
      increaseKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        let c= this.compare(this.mKeys[i],key);
        if(c==0)
          throw Error("Calling increaseKey() with a key equal to the key in the priority queue");
        if(c>0)
          throw Error("Calling increaseKey() with a key strictly less than the key in the priority queue");
        this.mKeys[i] = key;
        this._sink(this.qp[i]);
      }
      /**Remove the key associated with index {@code i}.
       * @param  {number} i the index of the key to remove
       */
      delete(i){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        let index = this.qp[i];
        this._exch(index, this.n--);
        this._swim(index);
        this._sink(index);
        this.mKeys[i] = UNDEF;
        this.qp[i] = -1;
      }
      _validateIndex(i){
        if(i<0) throw Error("index is negative: " + i);
        if(i >= this.maxN) throw Error("index >= capacity: " + i);
      }
      _greater(i, j){
        return this.compare(this.mKeys[this.pq[i]],this.mKeys[this.pq[j]]) > 0;
      }
      _exch(i, j){
        let swap = this.pq[i];
        this.pq[i] = this.pq[j];
        this.pq[j] = swap;
        this.qp[this.pq[i]] = i;
        this.qp[this.pq[j]] = j;
      }
      _swim(k){
        while(k>1 && this._greater(_M.ndiv(k,2), k)){
          this._exch(k, _M.ndiv(k,2));
          k = _M.ndiv(k,2);
        }
      }
      _sink(k){
        while(2*k <= this.n){
          let j = 2*k;
          if(j<this.n && this._greater(j, j+1)) ++j;
          if(!this._greater(k, j)) break;
          this._exch(k, j);
          k = j;
        }
      }
      /**Returns an iterator that iterates over the keys on the
       * priority queue in ascending order.
       * @return {Iterator}
       */
      iter(){
        // create a new pq
        let copy= new IndexMinPQ(this.pq.length-1, this.compare);
        // add all elements to copy of heap
        // takes linear time since already in heap order so no keys move
        for(let i=1; i <= this.n; ++i)
          copy.insert(this.pq[i], this.mKeys[this.pq[i]]);
        return{
          remove(){ throw Error(`UnsupportedOperationException`) },
          hasNext(){ return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error(`NoSuchElementException`);
            return copy.delMin();
          }
        }
      }
      static test(){
        // insert a bunch of strings
        let strings = [ "it", "was", "the", "best", "of", "times", "it", "was", "the", "worst" ];
        let pq = new IndexMinPQ(strings.length,CMP);
        for(let i=0; i<strings.length; ++i) pq.insert(i, strings[i]);
        // delete and print each key
        while(!pq.isEmpty()){
          let i = pq.delMin();
          console.log(i + " " + strings[i]);
        }
        console.log("");
        // reinsert the same strings
        for(let i=0; i<strings.length; ++i) pq.insert(i, strings[i]);
        // print each key using the iterator
        for(let i,it=pq.iter();it.hasNext();){
          i=it.next();
          console.log(i + " " + strings[i]);
        }
        while(!pq.isEmpty()){ pq.delMin() }
      }
    }
    //IndexMinPQ.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an indexed priority queue of generic keys.
     * @memberof module:mcfud/algo_sort
     * @class
     */
    class IndexMaxPQ{
      /**Initializes an empty indexed priority queue with indices between {@code 0}
       * and {@code maxN - 1}.
       * @param {number} maxN the keys on this priority queue are index from {@code 0} to {@code maxN - 1}
       * @param {function} compareFn
       */
      constructor(maxN,compareFn){
        //* @property {number} maxN  maximum number of elements on PQ
        //* @property {number} n number of elements on PQ
        //* @property {array} pq  binary heap using 1-based indexing
        //* @property {array} qp  inverse of pq - qp[pq[i]] = pq[qp[i]] = i
        //* @property {array} mKeys  keys[i] = priority of i
        if(maxN < 0) throw Error("IllegalArgumentException");
        this.compare=compareFn;
        this.maxN = maxN;
        this.n = 0;
        this.mKeys = new Array(maxN + 1); // make this of length maxN??
        this.pq   = new Array(maxN + 1);
        this.qp   = new Array(maxN + 1);  // make this of length maxN??
        for(let i=0; i<=maxN; ++i) this.qp[i] = -1;
      }
      /**Returns true if this priority queue is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.n == 0;
      }
      /**Is {@code i} an index on this priority queue?
       * @param  {number} i an index
       * @return {boolean}
       */
      contains(i){
        this._validateIndex(i);
        return this.qp[i] != -1;
      }
      /**Returns the number of keys on this priority queue.
       * @return {number}
       */
      size(){
        return this.n;
      }
     /**Associate key with index i.
       * @param {number} i an index
       * @param {any} key the key to associate with index {@code i}
       */
      insert(i, key){
        this._validateIndex(i);
        if(this.contains(i))
          throw Error("index is already in the priority queue");
        ++this.n;
        this.qp[i] = this.n;
        this.pq[this.n] = i;
        this.mKeys[i] = key;
        this._swim(this.n);
      }
      /**Returns an index associated with a maximum key.
       * @return {any}
       */
      maxIndex(){
        if(this.n == 0) throw Error("Priority queue underflow");
        return this.pq[1];
      }
      /**Returns a maximum key.
       * @return {any}
       */
      maxKey(){
        if(this.n == 0) throw Error("Priority queue underflow");
        return this.mKeys[this.pq[1]];
      }
      /**Removes a maximum key and returns its associated index.
       * @return {any}
       */
      delMax(){
        if(this.n == 0) throw Error("Priority queue underflow");
        let max = this.pq[1];
        this._exch(1, this.n--);
        this._sink(1);
        _.assert(this.pq[this.n+1] == max,"bad delMax");
        this.qp[max] = -1;        // delete
        this.mKeys[max] = UNDEF;    // to help with garbage collection
        this.pq[this.n+1] = -1;        // not needed
        return max;
      }
      /**Returns the key associated with index {@code i}.
       * @param  {number} i the index of the key to return
       * @return {any}
       */
      keyOf(i){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        return this.mKeys[i];
      }
      /**Change the key associated with index {@code i} to the specified value.
       * @param  {number} i the index of the key to change
       * @param  {any} key change the key associated with index {@code i} to this key
       */
      changeKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        this.mKeys[i] = key;
        this._swim(this.qp[i]);
        this._sink(this.qp[i]);
      }
      /**Increase the key associated with index {@code i} to the specified value.
       * @param {number} i the index of the key to increase
       * @param {any} key increase the key associated with index {@code i} to this key
       */
      increaseKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        if(this.compare(this.mKeys[i],key) == 0)
          throw Error("Calling increaseKey() with a key equal to the key in the priority queue");
        if(this.compare(this.mKeys[i],key) > 0)
          throw Error("Calling increaseKey() with a key that is strictly less than the key in the priority queue");
        this.mKeys[i] = key;
        this._swim(this.qp[i]);
      }
      /**Decrease the key associated with index {@code i} to the specified value.
       * @param {number} i the index of the key to decrease
       * @param {any} key decrease the key associated with index {@code i} to this key
       */
      decreaseKey(i, key){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        if(this.compare(this.mKeys[i],key) == 0)
          throw Error("Calling decreaseKey() with a key equal to the key in the priority queue");
        if(this.compare(this.mKeys[i],key) < 0)
          throw Error("Calling decreaseKey() with a key that is strictly greater than the key in the priority queue");
        this.mKeys[i] = key;
        this._sink(this.qp[i]);
      }
      /**Remove the key on the priority queue associated with index {@code i}.
       * @param {number} i the index of the key to remove
       */
      delete(i){
        this._validateIndex(i);
        if(!this.contains(i))
          throw Error("index is not in the priority queue");
        let index = this.qp[i];
        this._exch(index, this.n--);
        this._swim(index);
        this._sink(index);
        this.mKeys[i] = UNDEF;
        this.qp[i] = -1;
      }
      _validateIndex(i){
        if(i<0) throw Error("index is negative: " + i);
        if(i>=this.maxN) throw Error("index >= capacity: " + i);
      }
      _less(i,j){
        return less(this.mKeys[this.pq[i]], this.mKeys[this.pq[j]], this.compare)
      }
      _exch(i, j){
        let swap = this.pq[i];
        this.pq[i] = this.pq[j];
        this.pq[j] = swap;
        this.qp[this.pq[i]] = i;
        this.qp[this.pq[j]] = j;
      }
      _swim(k){
        while(k > 1 && this._less(_M.ndiv(k,2), k)) {
          this._exch(k, _M.ndiv(k,2));
          k = _M.ndiv(k,2);
        }
      }
      _sink(k){
        while(2*k <= this.n){
          let j = 2*k;
          if(j < this.n && this._less(j, j+1)) ++j;
          if(!this._less(k, j)) break;
          this._exch(k, j);
          k = j;
        }
      }
      /**Returns an iterator that iterates over the keys.
       * @return {Iterator}
       */
      iter(){
        // add all elements to copy of heap takes linear time since already in heap order so no keys move
        let copy = new IndexMaxPQ(this.pq.length - 1,this.compare);
        for(let i=1; i<=this.n; ++i) copy.insert(this.pq[i], this.mKeys[this.pq[i]]);
        return{
          remove() { throw Error("UnsupportedOperationException")  },
          hasNext() { return !copy.isEmpty() },
          next(){
            if(!this.hasNext()) throw Error("NoSuchElementException");
            return copy.delMax();
          }
        }
      }
      static test(){
        // insert a bunch of strings
        let strings = [ "it", "was", "the", "best", "of", "times", "it", "was", "the", "worst" ];
        let pq = new IndexMaxPQ(strings.length, CMP);
        for(let i=0; i<strings.length; ++i){
          pq.insert(i, strings[i]);
        }
        for(let i,it=pq.iter(); it.hasNext();){
          i=it.next();
          console.log(i + " " + strings[i]);
        }
        console.log("");
        // increase or decrease the key
        for(let i=0; i<strings.length; ++i){
          if(_.rand()<0.5)
            pq.increaseKey(i, strings[i] + strings[i]);
          else
            pq.decreaseKey(i, strings[i].substring(0, 1));
        }
        // delete and print each key
        while(!pq.isEmpty()){
          let key = pq.maxKey();
          let i = pq.delMax();
          console.log(i + " " + key);
        }
        console.log("");
        // reinsert the same strings
        for(let i=0; i<strings.length; ++i){
          pq.insert(i, strings[i]);
        }
        // delete them in random order
        let perm = new Array(strings.length);
        for(let i=0; i<strings.length; ++i) perm[i] = i;
        _.shuffle(perm);
        for(let i=0; i<perm.length; ++i){
          let key = pq.keyOf(perm[i]);
          pq.delete(perm[i]);
          console.log(perm[i] + " " + key);
        }
      }
    }
    //IndexMaxPQ.test();

    const _$={
      FibonacciMinPQ, IndexFibonacciMinPQ,
      Insertion,BinaryInsertion,Selection,Shell,
      Merge,Bubble,Quick,MinPQ, MaxPQ,Heap,IndexMinPQ,IndexMaxPQ
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"),
                           require("../main/math"), require("./basic"))
  }else{
    gscope["io/czlab/mcfud/algo/sort"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_M,Basic,Sort){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();
    if(!Basic) Basic= gscope["io/czlab/mcfud/algo/basic"]();
    if(!Sort) Sort= gscope["io/czlab/mcfud/algo/sort"]();
    const {Bag,Stack,Queue,StdCompare:CMP,prnIter}= Basic;
    const {MinPQ}= Sort;
    const int=Math.floor;
    const {is,u:_}= Core;

    /**
     * @module mcfud/algo_search
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides a client for reading in a sequence of words and printing a word
     * (exceeding a given length) that occurs most frequently.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class FrequencyCounter{
      /**Compute frequency count.
       * @param {array} input the list of words
       * @param {number} keySize the minimum word length
       * @return {array} [max, maxCount, [distinct,words]]
       */
      static count(input,keySize){
        let m=new Map(),
            words=0, max="", distinct=0;
        for(let s,i=0;i<input.length;++i){
          s=input[i];
          if(s.length<keySize)continue;
          ++words;
          if(m.has(s)){
            m.set(s, m.get(s)+1)
          }else{
            m.set(s, 1);
            ++distinct;
          }
        }
        // find a key with the highest frequency count
        m.set(max, 0);
        Array.from(m.keys()).forEach(k=>{
          if(m.get(k) > m.get(max)) max = k;
        });
        return [max, m.get(max),[distinct,words]];
      }
      static test(){
        let s= `it was the best of times it was the worst of times
        it was the age of wisdom it was the age of foolishness
        it was the epoch of belief it was the epoch of incredulity
        it was the season of light it was the season of darkness
        it was the spring of hope it was the winter of despair`.split(" ");
        let [m,v,extra]= FrequencyCounter.count(s,1);
        console.log("" + m + " " + v);
        console.log("distinct = " + extra[0]);
        console.log("words= " + extra[1]);
      }
    }
    //FrequencyCounter.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const SNode=(key,val,next)=> ({key,val,next});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an (unordered) symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class SequentialSearchST{
      constructor(){
      //* @property {object} first the linked list of key-value pairs
      //* @property {number} n number of key-value pairs
        this.first=UNDEF;
        this.n=0;
      }
      /**Returns the number of key-value pairs in this symbol table.
       * @return {number}
       */
      size(){
        return this.n;
      }
      /**Returns true if this symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.size() == 0;
      }
      /**Returns true if this symbol table contains the specified key.
       * @param  {any} key the key
       * @return {boolean}
       */
      contains(key){
        if(_.nichts(key))
          throw Error(`argument to contains is null`);
        return this.get(key) !== undefined;
      }
      /**Returns the value associated with the given key in this symbol table.
       * @param  {any} key the key
       * @return {any}
       */
      get(key){
        if(_.nichts(key))
          throw Error(`argument to get is null`);
        for(let x=this.first; x; x=x.next){
          if(key==x.key)
            return x.val;
        }
      }
      /**Inserts the specified key-value pair into the symbol table, overwriting the old
       * value with the new value if the symbol table already contains the specified key.
       * Deletes the specified key (and its associated value) from this symbol table
       * if the specified value is {@code null}.
       * @param  {any} key the key
       * @param  {any} val the value
       */
      put(key, val){
        if(_.nichts(key))
          throw Error(`first argument to put is null`);
        if(val === undefined){
          this.delete(key);
        }else{
          let f,x;
          for(x=this.first; x && !f; x=x.next){
            if(key==x.key){
              x.val = val;
              f=true;
            }
          }
          if(!f){//add to head
            this.first = SNode(key, val, this.first);
            this.n +=1;
          }
        }
      }
      /**Removes the specified key and its associated value from this symbol table
       * (if the key is in this symbol table).
       * @param  {any} key the key
       */
      delete(key){
        // delete key in linked list beginning at Node x
        // warning: function call stack too large if table is large
        const _delete=(x,key)=>{
          if(!x) return UNDEF;
          if(key==x.key){
            this.n -= 1;
            return x.next;
          }
          x.next = _delete(x.next, key);
          return x;
        }
        if(_.nichts(key))
          throw Error(`argument to delete is null`);
        this.first = _delete(this.first, key);
      }
      /**Returns all keys in the symbol table as an {@code Iterable}.
       * To iterate over all of the keys in the symbol table named {@code st},
       * use the foreach notation: {@code for (Key key : st.keys())}.
       * @return {Iterator}
       */
      keys(){
        let out=new Queue();
        for(let x=this.first; x; x=x.next) out.enqueue(x.key);
        return out.iter();
      }
      static load(input){
        let obj=new SequentialSearchST();
        input.forEach((s,i)=> obj.put(s,i));
        return obj
      }
      static test(){
        let obj=SequentialSearchST.load("SEARCHEXAMPLE".split(""));
        let fn=(s="",k=0,it=0)=>{
          for(it=obj.keys(); it.hasNext();){
            k=it.next(); s+=`${k}=${obj.get(k)} `; } return s};
        console.log(fn());
        console.log("size= " + obj.size());
        console.log("contains R= " + obj.contains("R"));
        console.log("get R= " + obj.get("R"));
        obj.delete("R");
        obj.isEmpty();
        console.log("contains R= " + obj.contains("R"));
        console.log("get R= " + obj.get("R"));
        console.log("size= " + obj.size());
      }
    }
    //SequentialSearchST.test();

    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class BinarySearchST{
      /**Initializes an empty symbol table with the specified initial capacity.
       * @param {function} compareFn
       * @param {number} capacity
       */
      constructor(compareFn,capacity=2){
        //* @property {array} mKeys
        //* @property {array} vals
        //* @property {number} n
        //* @property {function} compare
        this.mKeys= new Array(capacity);
        this.vals= new Array(capacity);
        this.compare=compareFn;
        this.n=0;
        //resize the underlying arrays
        this._resize=(c)=>{
          let tempk = new Array(c),
              tempv = new Array(c);
          for(let i=0; i<this.n; ++i){
            tempk[i] = this.mKeys[i];
            tempv[i] = this.vals[i];
          }
          this.vals = tempv;
          this.mKeys = tempk;
        };
        this._argOk=(p)=> _.echt(p, "Invalid argument");
        this._check=()=>{
          const isSorted=()=>{
            // are the items in the array in ascending order?
            for(let i=1; i<this.size(); ++i)
              if(this.compare(this.mKeys[i],this.mKeys[i-1])<0) return false;
            return true;
          };
          const rankCheck=()=>{
            // check that rank(select(i)) = i
            for(let i=0; i<this.size(); ++i)
              if(i != this.rank(this.select(i))) return false;
            for(let i=0; i<this.size(); ++i)
              if(this.compare(this.mKeys[i],this.select(this.rank(this.mKeys[i]))) != 0) return false;
            return true;
          };
          return isSorted() && rankCheck();
        };
      }
      /**Returns true if this symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.size() == 0;
      }
      /**Does this symbol table contain the given key?
       * @param  key the key
       * @return {boolean}
       */
      contains(key){
        return this._argOk(key) && this.get(key) !== undefined
      }
      /**Returns the value associated with the given key in this symbol table.
       * @param  {any} key the key
       * @return {any}
       */
      get(key){
        if(this._argOk(key) && !this.isEmpty()){
          let i = this.rank(key);
          if(i<this.n &&
             this.compare(this.mKeys[i],key) == 0) return this.vals[i];
        }
      }
      /**Returns the number of keys in this symbol table strictly less than {@code key}.
       * @param  {any} key the key
       * @return {number}
       */
      rank(key){
        let mid,cmp,
            lo=0, hi=this.n-1;
        this._argOk(key);
        while(lo <= hi){
          mid = lo+ _M.ndiv(hi-lo,2);
          cmp = this.compare(key,this.mKeys[mid]);
          if(cmp < 0) hi = mid-1;
          else if(cmp > 0) lo = mid+1;
          else return mid;
        }
        return lo;
      }
      /**Inserts the specified key-value pair into the symbol table, overwriting the old
       * value with the new value if the symbol table already contains the specified key.
       * Deletes the specified key (and its associated value) from this symbol table
       * if the specified value is {@code null}.
       * @param  {any} key the key
       * @param  {any} val the value
       */
      put(key, val){
        if(this._argOk(key) && val===undefined){
          this.delete(key);
        }else{
          let i=this.rank(key);
          // key is already in table
          if(i<this.n && this.compare(this.mKeys[i],key) == 0){
            this.vals[i] = val;
          }else{
            // insert new key-value pair
            if(this.n == this.mKeys.length)
              this._resize(2*this.mKeys.length);
            for(let j=this.n; j>i; --j){
              this.mKeys[j] = this.mKeys[j-1];
              this.vals[j] = this.vals[j-1];
            }
            this.n+=1;
            this.mKeys[i] = key;
            this.vals[i] = val;
            //this._check();
          }
        }
      }
      /**Removes the specified key and associated value from this symbol table
       * (if the key is in the symbol table).
       * @param  {any} key the key
       */
      delete(key){
        if(this._argOk(key) && this.isEmpty()){
        }else{
          // compute rank
          let i=this.rank(key);
          // key not in table
          if(i==this.n || this.compare(this.mKeys[i],key) != 0){
          }else{
            for(let j=i; j<this.n-1; ++j){
              this.mKeys[j] = this.mKeys[j+1];
              this.vals[j] = this.vals[j+1];
            }
            this.n-=1;
            this.mKeys[this.n] = UNDEF;  // to avoid loitering
            this.vals[this.n] = UNDEF;
            // resize if 1/4 full
            if(this.n>0 &&
               this.n == _M.ndiv(this.mKeys.length,4))
              this._resize(_M.ndiv(this.mKeys.length,2));
            this._check();
          }
        }
      }
      /**Removes the smallest key and associated value from this symbol table.
       */
      deleteMin(){
        if(this.isEmpty())
          throw Error(`Symbol table underflow error`);
        this.delete(this.min());
      }
      /**Removes the largest key and associated value from this symbol table.
       */
      deleteMax(){
        if(this.isEmpty())
          throw Error(`Symbol table underflow error`);
        this.delete(this.max());
      }
      /**Returns the smallest key in this symbol table.
       * @return {any}
       */
      min(){
        if(this.isEmpty())
          throw Error(`called min with empty symbol table`);
        return this.mKeys[0];
      }
      /**Returns the largest key in this symbol table.
       * @return {any}
       */
      max(){
        if(this.isEmpty())
          throw Error(`called max with empty symbol table`);
        return this.mKeys[this.n-1];
      }
      /**Return the kth smallest key in this symbol table.
       * @param  {number} k the order statistic
       * @return {any}
       */
      select(k){
        if(k<0 || k>=this.size())
          throw Error(`called select with invalid argument: ${k}`);
        return this.mKeys[k];
      }
      /**Returns the largest key in this symbol table less than or equal to {@code key}.
       * @param  {any} key the key
       * @return {any}
       */
      floor(key){
        let i = this._argOk(key) && this.rank(key);
        if(i<this.n &&
           this.compare(key,this.mKeys[i]) == 0)
          return this.mKeys[i];
        if(i==0)
          throw Error(`argument to floor is too small`);
        return this.mKeys[i-1];
      }
      /**Returns the smallest key in this symbol table greater than or equal to {@code key}.
       * @param  {any} key the key
       * @return {any}
       */
      ceiling(key){
        let i=this._argOk(key) && this.rank(key);
        if(i==this.n)
          throw Error(`argument to ceiling is too large`);
        return this.mKeys[i];
      }
      /**Returns the number of keys in this symbol table in the specified range.
       * @param {number} lo minimum endpoint
       * @param {number} hi maximum endpoint
       * @return {number} the number of keys in this symbol table between {@code lo}
       *                  (inclusive) and {@code hi} (inclusive)
       */
      size(lo, hi){
        if(arguments.length==0){
          return this.n;
        }
        this._argOk(lo) && this._argOk(hi);
        return this.compare(lo,hi)>0 ?0
                                     :(this.contains(hi)?(this.rank(hi)-this.rank(lo)+1)
                                                        :(this.rank(hi)-this.rank(lo)));
      }
      /**Returns all keys in this symbol table in the given range,
       * as an {@code Iterable}.
       * @param lo minimum endpoint
       * @param hi maximum endpoint
       * @return {Iterator} all keys in this symbol table between {@code lo}
       *                    (inclusive) and {@code hi} (inclusive)
       */
      keys(lo, hi){
        if(arguments.length==0){
          lo=this.min();
          hi=this.max();
        }
        this._argOk(lo) && this._argOk(hi);
        let out=new Queue();
        if(this.compare(lo,hi) > 0){}else{
          for(let i=this.rank(lo); i<this.rank(hi); ++i)
            out.enqueue(this.mKeys[i]);
          if(this.contains(hi))
            out.enqueue(this.mKeys[this.rank(hi)]);
        }
        return out.iter();
      }
      static load(input,compareFn){
        let obj= new BinarySearchST(compareFn);
        input.forEach((s,i)=> obj.put(s,i));
        return obj;
      }
      static test(){
        let b= BinarySearchST.load("SEARCHEXAMPLE".split(""),CMP);
        let fn=(s)=>{s="";
          for(let k,it=b.keys();it.hasNext();){
            k=it.next(); s+=`${k}=${b.get(k)} ` } return s}
        console.log(fn());
        b.deleteMin();
        console.log(fn());
        b.deleteMax();
        b.isEmpty();
        console.log(fn());
        console.log("floor of Q= " + b.floor("Q"));
        console.log("ceil of Q= " + b.ceiling("Q"));
        console.log("size= " + b.size());
        console.log("size= " + b.size("E","P"));
        console.log("keys E->P = " + prnIter(b.keys("E","P")));
      }
    }
    //BinarySearchST.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class BST{
      constructor(compareFn){
        //* @property {object} root
        //* @property {function} compare
        this.compare=compareFn;
        this.root=UNDEF;
        this._argOk=(x)=> _.assert(x, "Invalid argument");
        this._check=()=>{
          if(!this.isBST(this.root,null,null)) console.log("Not in symmetric order");
          if(!this.isSizeConsistent(this.root)) console.log("Subtree counts not consistent");
          if(!this.isRankConsistent()) console.log("Ranks not consistent");
          return this.isBST(this.root,null,null) && this.isSizeConsistent(this.root) && this.isRankConsistent();
        };
        // is the tree rooted at x a BST with all keys strictly between min and max
        // (if min or max is null, treat as empty constraint)
        // Credit: Bob Dondero's elegant solution
        this.isBST=(x, min, max)=>{
          if(_.nichts(x)) return true;
          if(_.echt(min) && this.compare(x.key,min) <= 0) return false;
          if(_.echt(max) && this.compare(x.key,max) >= 0) return false;
          return this.isBST(x.left, min, x.key) && this.isBST(x.right, x.key, max);
        };
        this.isSizeConsistent=(x)=>{
          if(_.nichts(x)) return true;
          if(x.size != (this._sizeNode(x.left) + this._sizeNode(x.right) + 1)) return false;
          return this.isSizeConsistent(x.left) && this.isSizeConsistent(x.right);
        };
        // check that ranks are consistent
        this.isRankConsistent=()=>{
          for(let i=0; i<this.size(); ++i)
            if(i != this.rank(this.select(i))) return false;
          for(let k, it=this.keys(); it.hasNext();){
            k=it.next();
            if(this.compare(k,this.select(this.rank(k))) != 0) return false;
          }
          return true;
        };
      }
      Node(key, val, size){
        return{ key,val,size};// left:null, right:null
      }
      /**Returns true if this symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return this.size() == 0;
      }
      /**Does this symbol table contain the given key?
       * @param  {any} key the key
       * @return {boolean}
       */
      contains(key){
        return this._argOk(key) && this.get(key) !== undefined;
      }
      /**Returns the value associated with the given key.
       * @param  {any} key the key
       * @return {any}
       */
      get(key){
        return this._getNode(this.root, key);
      }
      _getNode(x, key){
        if(this._argOk(key) && _.nichts(x)){}else{
          let cmp = this.compare(key,x.key);
          return cmp < 0? this._getNode(x.left, key) :(cmp > 0? this._getNode(x.right, key) : x.val)
        }
      }
      /**Inserts the specified key-value pair into the symbol table, overwriting the old
       * value with the new value if the symbol table already contains the specified key.
       * Deletes the specified key (and its associated value) from this symbol table
       * if the specified value is {@code null}.
       * @param  {any} key the key
       * @param  {any} val the value
       */
      put(key, val){
        if(this._argOk(key) && _.nichts(val)){
          this.delete(key);
        }else{
          this.root = this._putNode(this.root, key, val);
          this._check();
        }
      }
      _putNode(x, key, val){
        if(_.nichts(x)){ x=this.Node(key, val, 1) }else{
          let cmp = this.compare(key,x.key);
          if(cmp < 0) x.left = this._putNode(x.left,  key, val);
          else if(cmp > 0) x.right = this._putNode(x.right, key, val);
          else x.val = val;
          x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        }
        return x;
      }
      /**Removes the smallest key and associated value from the symbol table.
       */
      deleteMin(){
        if(this.isEmpty()) throw Error("Symbol table underflow");
        this.root = this._deleteMinNode(this.root);
        this._check();
      }
      _deleteMinNode(x){
        if(_.nichts(x.left)){ x= x.right }else{
          x.left = this._deleteMinNode(x.left);
          x.size = this._sizeNode(x.left) + this._sizeNode(x.right) + 1;
        }
        return x;
      }
      /**Removes the largest key and associated value from the symbol table.
       */
      deleteMax(){
        if(this.isEmpty()) throw Error("Symbol table underflow");
        this.root = this._deleteMaxNode(this.root);
        this._check();
      }
      _deleteMaxNode(x){
        if(_.nichts(x.right)){ x= x.left }else{
          x.right = this._deleteMaxNode(x.right);
          x.size = this._sizeNode(x.left) + this._sizeNode(x.right) + 1;
        }
        return x;
      }
      /**Removes the specified key and its associated value from this symbol table
       * (if the key is in this symbol table).
       * @param  {any} key the key
       */
      delete(key){
        this.root= this._argOk(key) && this._deleteNode(this.root, key);
        this._check();
      }
      _deleteNode(x, key){
        if(_.echt(x)){
          let cmp = this.compare(key,x.key);
          if(cmp < 0) x.left = this._deleteNode(x.left,  key);
          else if(cmp > 0) x.right = this._deleteNode(x.right, key);
          else{
            if(_.nichts(x.right)) return x.left;
            if(_.nichts(x.left)) return x.right;
            let t = x;
            x= this._minNode(t.right);
            x.right = this._deleteMinNode(t.right);
            x.left = t.left;
          }
          x.size = this._sizeNode(x.left) + this._sizeNode(x.right) + 1;
        }
        return x;
      }
      /**Returns the smallest key in the symbol table.
       * @return {any}
       */
      min(){
        if(this.isEmpty())
          throw Error(`calls min with empty symbol table`);
        return this._minNode(this.root).key;
      }
      _minNode(x){
        return _.nichts(x.left)? x: this._minNode(x.left);
      }
      /**Returns the largest key in the symbol table.
       * @return {any}
       */
      max(){
        if(this.isEmpty())
          throw Error(`calls max with empty symbol table`);
        return this._maxNode(this.root).key;
      }
      _maxNode(x){
        return _.nichts(x.right)? x: this._maxNode(x.right);
      }
      /**Returns the largest key in the symbol table less than or equal to {@code key}.
       * @param  {any} key the key
       * @return {any}
       */
      floor(key){
        if(this._argOk(key) && this.isEmpty())
          throw Error(`calls floor with empty symbol table`);
        let x= this._floorNode(this.root, key);
        if(_.nichts(x))
          throw Error(`argument to floor is too small`);
        return x.key;
      }
      _floorNode(x, key){
        if(_.nichts(x)){ return null }
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp < 0) return this._floorNode(x.left, key);
        let t = this._floorNode(x.right, key);
        return _.nichts(t)?x: t;
      }
      /**Returns the smallest key in the symbol table greater than or equal to {@code key}.
       * @param  {any} key the key
       * @return {any}
       */
      ceiling(key){
        if(this._argOk(key) && this.isEmpty())
          throw Error(`calls ceiling with empty symbol table`);
        let x = this._ceilingNode(this.root, key);
        if(_.nichts(x))
          throw Error(`argument to floor is too large`);
        return x.key;
      }
      _ceilingNode(x, key){
        if(_.nichts(x)){return UNDEF}
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp < 0){
          let t = this._ceilingNode(x.left, key);
          return t? t: x;
        }
        return this._ceilingNode(x.right, key);
      }
      /**Return the key in the symbol table of a given {@code rank}.
       * This key has the property that there are {@code rank} keys in
       * the symbol table that are smaller. In other words, this key is the
       * ({@code rank}+1)st smallest key in the symbol table.
       * @param  {number} rank the order statistic
       * @return {any}
       */
      select(rank){
        if(rank < 0 || rank >= this.size())
          throw Error(`argument to select is invalid: ${rank}`);
        return this._selectNode(this.root, rank);
      }
      // Return key in BST rooted at x of given rank.
      // Precondition: rank is in legal range.
      _selectNode(x, rank){
        if(_.nichts(x)){return UNDEF}
        let leftSize = this._sizeNode(x.left);
        if(leftSize > rank) return this._selectNode(x.left,  rank);
        if(leftSize < rank) return this._selectNode(x.right, rank - leftSize - 1);
        return x.key;
      }
      /**Return the number of keys in the symbol table strictly less than {@code key}.
       * @param  {any} key the key
       * @return {number}
       */
      rank(key){
        return this._argOk(key) && this._rankNode(key, this.root);
      }
      // Number of keys in the subtree less than key.
      _rankNode(key, x){
        if(_.nichts(x)){return 0}
        let cmp = this.compare(key,x.key);
        return cmp < 0? this._rankNode(key, x.left)
                      : (cmp > 0? (1 + this._sizeNode(x.left) + this._rankNode(key, x.right)) :this._sizeNode(x.left));
      }
      /**Returns all keys in the symbol table in the given range,
       * as an {@code Iterable}.
       * @param  {any} lo minimum endpoint
       * @param  {any} hi maximum endpoint
       * @return {Iterator} all keys in the symbol table between {@code lo}
       *         (inclusive) and {@code hi} (inclusive)
       */
      keys(lo, hi){
        let Q=new Queue();
        if(arguments.length==0){
          if(!this.isEmpty()){
            lo=this.min();
            hi=this.max();
          }
        }
        if(!this.isEmpty() && this._argOk(lo) && this._argOk(hi)){
          this._keysNode(this.root, Q, lo, hi);
        }
        return Q.iter();
      }
      _keysNode(x, queue, lo, hi){
        if(_.nichts(x)){}else{
          let cmplo = this.compare(lo,x.key);
          let cmphi = this.compare(hi,x.key);
          if(cmplo < 0) this._keysNode(x.left, queue, lo, hi);
          if(cmplo <= 0 && cmphi >= 0) queue.enqueue(x.key);
          if(cmphi > 0) this._keysNode(x.right, queue, lo, hi);
        }
        return queue;
      }
      // return number of key-value pairs in BST rooted at x
      _sizeNode(x){
        return _.nichts(x)?0: x.size;
      }
      /**Returns the number of keys in the symbol table in the given range.
       * @param  {any} lo minimum endpoint
       * @param  {any} hi maximum endpoint
       * @return {number} number of keys in the symbol table between {@code lo}
       *         (inclusive) and {@code hi} (inclusive)
       */
      size(lo, hi){
        return arguments.length==0 ? this._sizeNode(this.root)
          : ( (this._argOk(lo) &&
                this._argOk(hi) &&
                this.compare(lo,hi)>0)? 0
                                      : (this.contains(hi)? (this.rank(hi) - this.rank(lo) + 1): (this.rank(hi) - this.rank(lo))));
      }
      /**Returns the height of the BST (for debugging).
       * @return {number} the height of the BST (a 1-node tree has height 0)
       */
      height(){
        return this._heightNode(this.root)
      }
      _heightNode(x){
        return _.nichts(x)? -1 : (1 + Math.max(this._heightNode(x.left), this._heightNode(x.right)))
      }
      /**Returns the keys in the BST in level order (for debugging).
       * @return {Iterator} the keys in the BST in level order traversal
       */
      levelOrder(){
        let x,queue = [],
            keys = new Queue();
        queue.push(this.root);
        while(queue.length>0){
          x = queue.pop();
          if(_.echt(x)){
            keys.enqueue(x.key);
            queue.push(x.left, x.right);
          }
        }
        return keys.iter();
      }
      static load(input,compareFn){
        let b=new BST(compareFn);
        input.forEach((s,i)=> b.put(s,i));
        return b;
      }
      static test(){
        let m,obj= BST.load("SEARCHEXAMPLE".split(""),CMP);
        m="";
        for(let s,it=obj.levelOrder(); it.hasNext();){
          s=it.next(); m+= `${s}=${obj.get(s)} `
        }
        console.log("level-order:\n"+m);
        m="";
        for(let s,it=obj.keys(); it.hasNext();){
          s=it.next(); m+= `${s}=${obj.get(s)} `
        }
        obj.isEmpty();
        console.log("keys=\n"+m);
        console.log("size="+obj.size());
        console.log("size E->Q = ", obj.size("E","Q"));
        m="";
        for(let s,it=obj.keys("E","Q"); it.hasNext();){
          s=it.next(); m+= `${s}=${obj.get(s)} `
        }
        console.log("keys[E->Q]= "+m);
        console.log("min= "+obj.min());
        console.log("max= "+obj.max());
        console.log("rank P= " +obj.rank("P"));
        console.log("contains X= "+obj.contains("X"));
        console.log("contains Z= "+obj.contains("Z"));
        obj.delete("X");
        console.log("get C=" + obj.get("C"));
        console.log("max= "+obj.max());
        obj.deleteMin();
        obj.deleteMax();
        console.log("height= " +obj.height());
        console.log("min= "+obj.min());
        console.log("max= "+obj.max());
        console.log("rank E= "+obj.rank("E"));
        console.log("floor G= " +obj.floor("G"));
        console.log("ceiling G= " +obj.ceiling("G"));
      }
    }
    //BST.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class RedBlackBST{
      static BLACK = false;
      static RED= true;
      constructor(compareFn){
        //* @property {object} root
        //* @property {function} compare
        this.compare=compareFn;
        this.root=UNDEF;
        this._argOk=(x)=>_.assert(x, "Invalid argument");
        this._check=()=>{
          // is the tree rooted at x a BST with all keys strictly between min and max
          // (if min or max is null, treat as empty constraint)
          // Credit: Bob Dondero's elegant solution
          let isBST3=(x, min, max)=>{
            if(_.nichts(x)) return true;
            if(min && this.compare(x.key,min) <= 0) return false;
            if(max && this.compare(x.key,max) >= 0) return false;
            return isBST3(x.left, min, x.key) && isBST3(x.right, x.key, max);
          };
          let isSizeConsistent=(x)=>{
            if(_.nichts(x)) return true;
            if(x.size != this._sizeNode(x.left) + this._sizeNode(x.right) + 1) return false;
            return isSizeConsistent(x.left) && isSizeConsistent(x.right);
          }
          // check that ranks are consistent
          let isRankConsistent=()=>{
            for(let i=0; i<this.size(); ++i)
              if(i != this._rankNode(this.select(i))) return false;
            for(let k,it=this.keys(); it.hasNext();){
              k=it.next();
              if(this.compare(k,this.select(this._rankNode(k))) != 0) return false;
            }
            return true;
          };
          // Does the tree have no red right links, and at most one (left)
          // red links in a row on any path?
          let is23=(x)=>{
            if(_.nichts(x)) return true;
            if(this._isRed(x.right)) return false;
            if (x !== this.root && this._isRed(x) && this._isRed(x.left)) return false;
            return is23(x.left) && is23(x.right);
          }
          // do all paths from root to leaf have same number of black edges?
          let isBalanced=()=>{
            let black = 0,// number of black links on path from root to min
                x = this.root;
            while(x){
              if(!this._isRed(x)) ++black;
              x=x.left;
            }
            return isBalanced2(this.root, black);
          };
          // does every path from the root to a leaf have the given number of black links?
          let isBalanced2=(x, black)=>{
            if(_.nichts(x)) return black == 0;
            if(!this._isRed(x)) --black;
            return isBalanced2(x.left, black) && isBalanced2(x.right, black);
          };
          return isBST3(this.root,null,null) && isSizeConsistent(this.root) && isRankConsistent() && is23(this.root) && isBalanced();
        };
      }
      Node(key, val, color, size){
        //color is parent color
        return {key,val,color,size};//left:null,right:null
      }
      // is node x red; false if x is null ?
      _isRed(x){
        return _.nichts(x)?false:x.color=== RedBlackBST.RED
      }
      //number of node in subtree rooted at x; 0 if x is null
      _sizeNode(x){
        return _.nichts(x)?0:x.size
      }
      /**Is this symbol table empty?
       * @return {boolean}
       */
      isEmpty(){
        return _.nichts(this.root)
      }
      /**Returns the value associated with the given key.
       * @param {any} key the key
       * @return {any}
       */
      get(key){
        return this._argOk(key) && this._getNode(this.root, key);
      }
      // value associated with the given key in subtree rooted at x; null if no such key
      _getNode(x, key){
        while(x){
          let cmp = this.compare(key,x.key);
          if(cmp < 0) x = x.left;
          else if(cmp > 0) x = x.right;
          else return x.val;
        }
      }
      /**Does this symbol table contain the given key?
       * @param {any} key the key
       * @return {boolean}
       */
      contains(key){
        return this.get(key) !== undefined
      }
      /***************************************************************************
       *  Red-black tree insertion.
       ***************************************************************************/
      /**Inserts the specified key-value pair into the symbol table, overwriting the old
       * value with the new value if the symbol table already contains the specified key.
       * Deletes the specified key (and its associated value) from this symbol table
       * if the specified value is {@code null}.
       * @param {any} key the key
       * @param {any} val the value
       */
      put(key, val){
        if(this._argOk(key) && _.nichts(val)){
          this.delete(key);
        }else{
          this.root = this._putNode(this.root, key, val);
          this.root.color = RedBlackBST.BLACK;
        }
      }
      // insert the key-value pair in the subtree rooted at h
      _putNode(h, key, val){
        if(_.nichts(h)) return this.Node(key, val, RedBlackBST.RED, 1);
        let cmp = this.compare(key,h.key);
        if(cmp < 0) h.left  = this._putNode(h.left, key, val);
        else if(cmp > 0) h.right = this._putNode(h.right, key, val);
        else h.val = val;
        // fix-up any right-leaning links
        if(this._isRed(h.right) && !this._isRed(h.left))  h = this._rotateLeft(h);
        if(this._isRed(h.left)  &&  this._isRed(h.left.left)) h = this._rotateRight(h);
        if(this._isRed(h.left)  &&  this._isRed(h.right)) this._flipColors(h);
        h.size = this._sizeNode(h.left) + this._sizeNode(h.right) + 1;
        return h;
      }
      /***************************************************************************
       *  Red-black tree deletion.
       ***************************************************************************/
      /**Removes the smallest key and associated value from the symbol table.
       */
      deleteMin(){
        if(this.isEmpty())
          throw Error("BST underflow");
        // if both children of root are black, set root to red
        if(!this._isRed(this.root.left) &&
           !this._isRed(this.root.right))
          this.root.color = RedBlackBST.RED;
        this.root = this._deleteMinNode(this.root);
        if(!this.isEmpty()) this.root.color = RedBlackBST.BLACK;
      }
      // delete the key-value pair with the minimum key rooted at h
      _deleteMinNode(h){
        if(_.nichts(h.left)) return null;
        if(!this._isRed(h.left) &&
           !this._isRed(h.left.left))
          h = this._moveRedLeft(h);
        h.left = this._deleteMinNode(h.left);
        return this._balance(h);
      }
      /**Removes the largest key and associated value from the symbol table.
       */
      deleteMax(){
        if(this.isEmpty())
          throw Error("BST underflow");
        // if both children of root are black, set root to red
        if(!this._isRed(this.root.left) &&
           !this._isRed(this.root.right))
          this.root.color = RedBlackBST.RED;
        this.root = this._deleteMaxNode(this.root);
        if(!this.isEmpty()) this.root.color = RedBlackBST.BLACK;
      }
      // delete the key-value pair with the maximum key rooted at h
      _deleteMaxNode(h){
        if(this._isRed(h.left)) h = this._rotateRight(h);
        if(_.nichts(h.right)) return null;
        if(!this._isRed(h.right) &&
           !this._isRed(h.right.left))
          h = this._moveRedRight(h);
        h.right = this._deleteMaxNode(h.right);
        return this._balance(h);
      }
      /**Removes the specified key and its associated value from this symbol table
       * (if the key is in this symbol table).
       * @param  {any} key the key
       */
      delete(key){
        if(this._argOk(key) && !this.contains(key)){}else{
          //if both children of root are black, set root to red
          if(!this._isRed(this.root.left) &&
             !this._isRed(this.root.right)) this.root.color = RedBlackBST.RED;
          this.root = this._deleteNode(this.root, key);
          if(!this.isEmpty()) this.root.color = RedBlackBST.BLACK;
        }
        //this._check();
      }
      // delete the key-value pair with the given key rooted at h
      _deleteNode(h, key){
        if(this.compare(key,h.key) < 0){
          if(!this._isRed(h.left) &&
             !this._isRed(h.left.left))
            h = this._moveRedLeft(h);
          h.left = this._deleteNode(h.left, key);
        }else{
          if(this._isRed(h.left))
            h = this._rotateRight(h);
          if(this.compare(key,h.key) == 0 &&
             _.nichts(h.right)) return null;
          if(!this._isRed(h.right) &&
             !this._isRed(h.right.left))
            h = this._moveRedRight(h);
          if(this.compare(key,h.key) == 0){
            let x = this._minNode(h.right);
            h.key = x.key;
            h.val = x.val;
            h.right = this._deleteMinNode(h.right);
          }else{
            h.right = this._deleteNode(h.right, key);
          }
        }
        return this._balance(h);
      }
      /***************************************************************************
       *  Red-black tree helper functions.
       ***************************************************************************/
      // make a left-leaning link lean to the right
      _rotateRight(h){//console.log("_RR");
        if(_.nichts(h) || !this._isRed(h.left))
          throw Error("bad input to rotateRight");
        let x = h.left;
        h.left = x.right;
        x.right = h;
        x.color = x.right.color;
        x.right.color = RedBlackBST.RED;
        x.size = h.size;
        h.size = this._sizeNode(h.left) + this._sizeNode(h.right) + 1;
        return x;
      }
      // make a right-leaning link lean to the left
      _rotateLeft(h){//console.log("RL");
        if(_.nichts(h) || !this._isRed(h.right))
          throw Error("bad input to rotateLeft");
        let x = h.right;
        h.right = x.left;
        x.left = h;
        x.color = x.left.color;
        x.left.color = RedBlackBST.RED;
        x.size = h.size;
        h.size = this._sizeNode(h.left) + this._sizeNode(h.right) + 1;
        return x;
      }
      // flip the colors of a node and its two children
      _flipColors(h){//console.log("FF");
        // h must have opposite color of its two children
        // assert (h != null) && (h.left != null) && (h.right != null);
        // assert (!isRed(h) &&  isRed(h.left) &&  isRed(h.right))
        //    || (isRed(h)  && !isRed(h.left) && !isRed(h.right));
        h.color = !h.color;
        h.left.color = !h.left.color;
        h.right.color = !h.right.color;
      }
      // Assuming that h is red and both h.left and h.left.left
      // are black, make h.left or one of its children red.
      _moveRedLeft(h){//console.log("MoveRL");
        // assert (h != null);
        // assert isRed(h) && !isRed(h.left) && !isRed(h.left.left);
        this._flipColors(h);
        if(this._isRed(h.right.left)){
          h.right = this._rotateRight(h.right);
          h = this._rotateLeft(h);
          this._flipColors(h);
        }
        return h;
      }
      // Assuming that h is red and both h.right and h.right.left
      // are black, make h.right or one of its children red.
      _moveRedRight(h){//console.log("MoveRR");
        // assert (h != null);
        // assert isRed(h) && !isRed(h.right) && !isRed(h.right.left);
        this._flipColors(h);
        if(this._isRed(h.left.left)){
          h = this._rotateRight(h);
          this._flipColors(h);
        }
        return h;
      }
      // restore red-black tree invariant
      _balance(h){//console.log("BAL");
        // assert (h != null);
        if(this._isRed(h.right) && !this._isRed(h.left))    h = this._rotateLeft(h);
        if(this._isRed(h.left) && this._isRed(h.left.left)) h = this._rotateRight(h);
        if(this._isRed(h.left) && this._isRed(h.right))     this._flipColors(h);
        h.size = this._sizeNode(h.left) + this._sizeNode(h.right) + 1;
        return h;
      }
      /**Returns the height of the BST (for debugging).
       * @return {number}
       */
      height(){
        return this._height(this.root);
      }
      _height(x){
        return _.nichts(x)? -1: (1 + Math.max(this._height(x.left), this._height(x.right)));
      }
      /**Returns the smallest key in the symbol table.
       * @return {any}
       */
      min(){
        if(this.isEmpty())
          throw Error(`calls min with empty symbol table`);
        return this._minNode(this.root).key;
      }
      // the smallest key in subtree rooted at x; null if no such key
      _minNode(x){
        return _.nichts(x.left)? x: this._minNode(x.left);
      }
      /**Returns the largest key in the symbol table.
       * @return {any}
       */
      max(){
        if(this.isEmpty())
          throw Error(`calls max with empty symbol table`);
        return this._maxNode(this.root).key;
      }
      // the largest key in the subtree rooted at x; null if no such key
      _maxNode(x){
        return _.nichts(x.right)? x : this._maxNode(x.right);
      }
      /**Returns the largest key in the symbol table less than or equal to {@code key}.
       * @param {any} key the key
       * @return {any}
       */
      floor(key){
        if(this._argOk(key) && this.isEmpty())
          throw Error(`calls floor with empty symbol table`);
        let x = this._floorNode(this.root, key);
        if(_.nichts(x))
          throw Error(`argument to floor is too small`);
        return x.key;
      }
      // the largest key in the subtree rooted at x less than or equal to the given key
      _floorNode(x, key){
        if(_.nichts(x)) return UNDEF;
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp < 0)  return this._floorNode(x.left, key);
        let t = this._floorNode(x.right, key);
        return t? t: x;
      }
      /**Returns the smallest key in the symbol table greater than or equal to {@code key}.
       * @param {any} key the key
       * @return {any}
       */
      ceiling(key){
        if(this._argOk(key) && this.isEmpty())
          throw Error(`calls ceiling with empty symbol table`);
        let x = this._ceilingNode(this.root, key);
        if(_.nichts(x))
          throw Error(`argument to ceiling is too small`);
        return x.key;
      }
      // the smallest key in the subtree rooted at x greater than or equal to the given key
      _ceilingNode(x, key){
        if(_.nichts(x)) return UNDEF;
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp > 0)  return this._ceilingNode(x.right, key);
        let t = this._ceilingNode(x.left, key);
        return t? t: x;
      }
      /**Return the key in the symbol table of a given {@code rank}.
       * This key has the property that there are {@code rank} keys in
       * the symbol table that are smaller. In other words, this key is the
       * ({@code rank}+1)st smallest key in the symbol table.
       * @param  {number} rank the order statistic
       * @return {any}
       */
      select(rank){
        if(rank < 0 || rank >= this.size())
          throw Error(`argument to select is invalid: ${rank}`);
        return this._selectNode(this.root, rank);
      }
      // Return key in BST rooted at x of given rank.
      // Precondition: rank is in legal range.
      _selectNode(x, rank){
        if(_.nichts(x)) return UNDEF;
        let leftSize = this._sizeNode(x.left);
        return leftSize > rank? this._selectNode(x.left,  rank)
                              : (leftSize < rank? this._selectNode(x.right, rank - leftSize - 1): x.key);
      }
      /**Return the number of keys in the symbol table strictly less than {@code key}.
       * @param {any} key the key
       * @return {number}
       */
      rank(key){
        return this._argOk(key) && this._rankNode(key, this.root);
      }
      // number of keys less than key in the subtree rooted at x
      _rankNode(key, x){
        if(_.nichts(x)) return 0;
        let cmp = this.compare(key,x.key);
        return cmp < 0? this._rankNode(key, x.left)
                      :(cmp > 0? (1 + this._sizeNode(x.left) + this._rankNode(key, x.right)) :  this._sizeNode(x.left));
      }
      /**Returns all keys in the symbol table in the given range,
       * as an {@code Iterable}.
       * @param  {any} lo minimum endpoint
       * @param  {any} hi maximum endpoint
       * @return {Iterator} all keys in the symbol table between {@code lo}
       *    (inclusive) and {@code hi} (inclusive) as an {@code Iterable}
       */
      keys(lo, hi){
        let Q=new Queue();
        if(arguments.length==0){
          if(!this.isEmpty()){
            lo=this.min();
            hi=this.max();
          }
        }
        if(!this.isEmpty()&& this._argOk(lo) && this._argOk(hi)){
          this._keysNode(this.root, Q, lo, hi);
        }
        return Q.iter();
      }
      // add the keys between lo and hi in the subtree rooted at x
      // to the queue
      _keysNode(x, queue, lo, hi){
        if(x){
          let cmplo = this.compare(lo,x.key);
          let cmphi = this.compare(hi,x.key);
          if(cmplo < 0) this._keysNode(x.left, queue, lo, hi);
          if(cmplo <= 0 && cmphi >= 0) queue.enqueue(x.key);
          if(cmphi > 0) this._keysNode(x.right, queue, lo, hi);
        }
        return queue;
      }
      /**Returns the number of keys in the symbol table in the given range.
       * @param  {any} lo minimum endpoint
       * @param  {any} hi maximum endpoint
       * @return {number} the number of keys in the symbol table between {@code lo}
       *    (inclusive) and {@code hi} (inclusive)
       */
      size(lo, hi){
        return arguments.length==0? this._sizeNode(this.root)
          : (this._argOk(lo) &&
             this._argOk(hi) &&
             this.compare(lo,hi) > 0? 0
                                    :(this.contains(hi)? (this.rank(hi) - this.rank(lo) + 1)
                                                       : (this.rank(hi) - this.rank(lo))));
      }
      static load(input,compareFn){
        let b= new RedBlackBST(compareFn);
        input.forEach((s,i)=> b.put(s,i));
        return b;
      }
      static test(){
        let m,obj= RedBlackBST.load("SEARCHEXAMPLE".split(""), CMP);
        m="";
        for(let s,it=obj.keys();it.hasNext();){
          s=it.next(); m+=`${s}=${obj.get(s)} `; }
        console.log(m);
        obj.isEmpty();
        console.log("height= "+obj.height()+", size= "+obj.size());
        console.log("get X= "+obj.get("X"));
        console.log("contains X= "+obj.contains("X"));
        console.log("min= "+obj.min()+",max= "+obj.max());
        obj.deleteMin();
        obj.deleteMax();
        console.log("min= "+obj.min()+",max= "+obj.max());
        obj.delete("R");
        console.log("contains R= "+obj.contains("R"));
        console.log("floor J= "+obj.floor("J"));
        console.log("ceiling J= "+obj.ceiling("J"));
        console.log("rank M= "+obj.rank("M"));
        m="";
        for(let s,it=obj.keys("D","Q");it.hasNext();){
          s=it.next(); m+=`${s}=${obj.get(s)} `; }
        console.log("keys[D-Q]= "+m);
        console.log("size[E-P]= "+ obj.size("E","P"));
      }
    }
    //RedBlackBST.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Provides a static method for binary searching for an integer in a sorted array of integers.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class BinarySearch{
      /**Returns the index of the specified key in the specified array.
       * @param  {array} a the array of integers, must be sorted in ascending order
       * @param  {number} key the search key
       * @return {number} index of key in array {@code a} if present; {@code -1} otherwise
       */
      static indexOf(a, key){
        let lo = 0,
            hi = a.length - 1;
        while(lo <= hi){
          // Key is in a[lo..hi] or not present.
          let mid = lo + _M.ndiv(hi-lo,2);
          if(key < a[mid]) hi = mid - 1;
          else if(key > a[mid]) lo = mid + 1;
          else return mid;
        }
        return -1;
      }
      static test(){
        let inp= "84 48 68 10 18 98 12 23 54 57 33 16 77 11 29".split(" ").map(s=>{ return +s }).sort();
        let t="23 50 10 99 18 23 98 84 11 10 48 77 13 54 98 77 77 68".split(" ").map(s=>{return +s});
        t.forEach(n=>{
          if(BinarySearch.indexOf(inp,n)<0)
            console.log(n);
        })
      }
    }
    //BinarySearch.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an ordered symbol table of generic key-value pairs.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class AVLTreeST{
      Node(key, val, height, size){
        // height: height of the subtree
        // size: number of nodes in subtree
        return {key, val, height, size};// left:null, right: null
      }
      /**
       * @param {function} compareFn
       */
      constructor(compareFn){
        this.compare=compareFn;
        this.root=UNDEF;
      }
      /**Checks if the symbol table is empty.
       * @return {boolean}
       */
      isEmpty(){
        return _.nichts(this.root)
      }
      //Returns the number of nodes in the subtree.
      _sizeNode(x){
        return _.nichts(x) ? 0:x.size;
      }
      /**Returns the height of the internal AVL tree. It is assumed that the
       * height of an empty tree is -1 and the height of a tree with just one node
       * is 0.
       * @return {number}
       */
      height(){
        return this._heightNode(this.root);
      }
      //Returns the height of the subtree.
      _heightNode(x){
        return _.nichts(x)? -1: x.height;
      }
      /**Returns the value associated with the given key.
       * @param {any} key the key
       * @return {any} the value associated with the given key if the key is in the
       *         symbol table and {@code null} if the key is not in the
       *         symbol table
       */
      get(key){
        if(_.nichts(key)) throw Error("argument to get() is null");
        let x = this._getNode(this.root, key);
        if(x) return x.val;
      }
      /**Returns value associated with the given key in the subtree or
       * {@code null} if no such key.
       *
       * @param {object} x the subtree
       * @param {any} key the key
       * @return {any} value associated with the given key in the subtree or
       *         {@code null} if no such key
       */
      _getNode(x, key){
        if(!x) return UNDEF;
        let cmp = this.compare(key,x.key);
        if(cmp < 0) return this._getNode(x.left, key);
        if(cmp > 0) return this._getNode(x.right, key);
        return x;
      }
      /**Checks if the symbol table contains the given key.
       * @param {any} key the key
       * @return {boolean}
       */
      contains(key){
        return this.get(key) !== undefined;
      }
      /**Inserts the specified key-value pair into the symbol table, overwriting
       * the old value with the new value if the symbol table already contains the
       * specified key. Deletes the specified key (and its associated value) from
       * this symbol table if the specified value is {@code null}.
       * @param {any} key the key
       * @param {any} val the value
       */
      put(key, val){
        if(_.nichts(key)) throw Error("first argument to put() is null");
        if(val === undefined){
          this.delete(key);
        }else{
          this.root = this._putNode(this.root, key, val);
        }
      }
      /**Inserts the key-value pair in the subtree. It overrides the old value
       * with the new value if the symbol table already contains the specified key
       * and deletes the specified key (and its associated value) from this symbol
       * table if the specified value is {@code null}.
       * @param {object} x the subtree
       * @param {any} key the key
       * @param {any} val the value
       * @return {object} the subtree
       */
      _putNode(x, key, val){
        if(!x) return this.Node(key, val, 0, 1);
        let cmp = this.compare(key,x.key);
        if(cmp < 0){
          x.left = this._putNode(x.left, key, val);
        }else if(cmp > 0){
          x.right = this._putNode(x.right, key, val);
        }else{
          x.val = val;
          return x;
        }
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        return this._balanceNode(x);
      }
      /**Restores the AVL tree property of the subtree.
       * @param {object} x the subtree
       * @return {object} the subtree with restored AVL property
       */
      _balanceNode(x){
        if(this._balanceFactor(x) < -1){
          if(this._balanceFactor(x.right) > 0) x.right = this._rotateRight(x.right);
          x = this._rotateLeft(x);
        }else if(this._balanceFactor(x) > 1){
          if(this._balanceFactor(x.left) < 0) x.left = this._rotateLeft(x.left);
          x = this._rotateRight(x);
        }
        return x;
      }
      /**Returns the balance factor of the subtree. The balance factor is defined
       * as the difference in height of the left subtree and right subtree, in
       * this order. Therefore, a subtree with a balance factor of -1, 0 or 1 has
       * the AVL property since the heights of the two child subtrees differ by at
       * most one.
       * @param {object} x the subtree
       * @return {number} the balance factor of the subtree
       */
      _balanceFactor(x){
        return this._heightNode(x.left) - this._heightNode(x.right);
      }
      /** Rotates the given subtree to the right.
       * @param {object} x the subtree
       * @return {object} the right rotated subtree
       */
      _rotateRight(x){
        let y = x.left;
        x.left = y.right;
        y.right = x;
        y.size = x.size;
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        y.height = 1 + Math.max(this._heightNode(y.left), this._heightNode(y.right));
        return y;
      }
      /**Rotates the given subtree to the left.
       * @param {object} x the subtree
       * @return {oject} the left rotated subtree
       */
      _rotateLeft(x){
        let y = x.right;
        x.right = y.left;
        y.left = x;
        y.size = x.size;
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        y.height = 1 + Math.max(this._heightNode(y.left), this._heightNode(y.right));
        return y;
      }
      /**Removes the specified key and its associated value from the symbol table
       * (if the key is in the symbol table).
       * @param {any} key the key
       */
      delete(key){
        if(_.nichts(key)) throw Error("argument to delete() is null");
        if(this.contains(key))
          this.root = this._deleteNode(this.root, key);
      }
      /**Removes the specified key and its associated value from the given subtree.
       * @param {object} x the subtree
       * @param {any} key the key
       * @return {object} the updated subtree
       */
      _deleteNode(x, key){
        let cmp = this.compare(key,x.key);
        if(cmp < 0){
          x.left = this._deleteNode(x.left, key);
        }else if(cmp > 0){
          x.right = this._deleteNode(x.right, key);
        }else{
          if(!x.left) return x.right;
          if(!x.right) return x.left;
          let y = x;
          x = this.min(y.right);
          x.right = this.deleteMin(y.right);
          x.left = y.left;
        }
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        return this._balance(x);
      }
      /**Removes the smallest key and associated value from the symbol table.
       */
      deleteMin(){
        if(this.isEmpty()) throw Error("called deleteMin() with empty symbol table");
        this.root = this._deleteMinNode(this.root);
      }
      /**Removes the smallest key and associated value from the given subtree.
       * @param {object} x the subtree
       * @return {object} the updated subtree
       */
      _deleteMinNode(x){
        if(!x.left) return x.right;
        x.left = this._deleteMinNode(x.left);
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        return this._balance(x);
      }
      /**Removes the largest key and associated value from the symbol table.
       */
      deleteMax(){
        if(this.isEmpty()) throw Error("called deleteMax() with empty symbol table");
        this.root = this._deleteMaxNode(this.root);
      }
      /**Removes the largest key and associated value from the given subtree.
       * @param {object} x the subtree
       * @return {object} the updated subtree
       */
      _deleteMaxNode(x){
        if(!x.right) return x.left;
        x.right = this._deleteMaxNode(x.right);
        x.size = 1 + this._sizeNode(x.left) + this._sizeNode(x.right);
        x.height = 1 + Math.max(this._heightNode(x.left), this._heightNode(x.right));
        return this._balance(x);
      }
      /**Returns the smallest key in the symbol table.
       * @return {any} the smallest key in the symbol table
       */
      min(){
        if(this.isEmpty()) throw Error("called min() with empty symbol table");
        return this._minNode(this.root).key;
      }
      /**Returns the node with the smallest key in the subtree.
       * @param {object} x the subtree
       * @return {object} the node with the smallest key in the subtree
       */
      _minNode(x){
        return !x.left ? x: this._minNode(x.left);
      }
      /**Returns the largest key in the symbol table.
       * @return the largest key in the symbol table
       */
      max(){
        if(this.isEmpty()) throw Error("called max() with empty symbol table");
        return this._maxNode(this.root).key;
      }
      /**Returns the node with the largest key in the subtree.
       * @param {object} x the subtree
       * @return {object} the node with the largest key in the subtree
       */
      _maxNode(x){
        return !x.right ? x: this._maxNode(x.right);
      }
      /**Returns the largest key in the symbol table less than or equal to
       * {@code key}.
       * @param {any} key the key
       * @return {any} the largest key in the symbol table less than or equal to
       *         {@code key}
       */
      floor(key){
        if(_.nichts(key)) throw Error("argument to floor() is null");
        if(this.isEmpty()) throw Error("called floor() with empty symbol table");
        let x = this._floorNode(this.root, key);
        if(x) return x.key;
      }
      /**Returns the node in the subtree with the largest key less than or equal
       * to the given key.
       * @param {object} x the subtree
       * @param {any} key the key
       * @return {object} the node in the subtree with the largest key less than or equal
       *         to the given key
       */
      _floorNode(x, key){
        if(_.nichts(x)) return UNDEF;
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp < 0) return this._floorNode(x.left, key);
        let y = this._floorNode(x.right, key);
        return y?  y : x;
      }
      /**Returns the smallest key in the symbol table greater than or equal to
       * {@code key}.
       * @param {any} key the key
       * @return {any} the smallest key in the symbol table greater than or equal to
       *         {@code key}
       */
      ceiling(key){
        if(_.nichts(key)) throw Error("argument to ceiling() is null");
        if(this.isEmpty()) throw Error("called ceiling() with empty symbol table");
        let x = this._ceilingNode(this.root, key);
        if(x) return x.key;
      }
      /**Returns the node in the subtree with the smallest key greater than or
       * equal to the given key.
       * @param {object} x the subtree
       * @param {any} key the key
       * @return {object} the node in the subtree with the smallest key greater than or
       *         equal to the given key
       */
      _ceilingNode(x, key){
        if(_.nichts(x)) return UNDEF;
        let cmp = this.compare(key,x.key);
        if(cmp == 0) return x;
        if(cmp > 0) return this._ceilingNode(x.right, key);
        let y = this._ceilingNode(x.left, key);
        return y? y: x;
      }
      /**Returns the kth smallest key in the symbol table.
       * @param {number} k the order statistic
       * @return {any} the kth smallest key in the symbol table
       */
      select(k){
        if(k < 0 || k >= this.size()) throw Error("k is not in range 0-" + (this.size() - 1));
        let n= this._selectNode(this.root, k);
        if(n) return n.key;
      }
      /**Returns the node with key the kth smallest key in the subtree.
       * @param {object} x the subtree
       * @param {any} k the kth smallest key in the subtree
       * @return {object} the node with key the kth smallest key in the subtree
       */
      _selectNode(x, k){
        if(_.nichts(x)) return UNDEF;
        let t = this._sizeNode(x.left);
        if(t > k) return this._selectNode(x.left, k);
        if(t < k) return this._selectNode(x.right, k - t - 1);
        return x;
      }
      /**Returns the number of keys in the symbol table strictly less than
       * {@code key}.
       * @param {any} key the key
       * @return {number} the number of keys in the symbol table strictly less than
       *         {@code key}
       */
      rank(key){
        if(_.nichts(key)) throw Error("argument to rank() is null");
        return this._rankNode(key, this.root);
      }
      /**Returns the number of keys in the subtree less than key.
       * @param {any} key the key
       * @param {object} x the subtree
       * @return {number} the number of keys in the subtree less than key
       */
      _rankNode(key, x){
        if(_.nichts(x)) return 0;
        let cmp = this.compare(key,x.key);
        if(cmp < 0) return this._rankNode(key, x.left);
        if(cmp > 0) return 1 + this._sizeNode(x.left) + this._rankNode(key, x.right);
        return this._sizeNode(x.left);
      }
      /**Returns all keys in the symbol table following an in-order traversal.
       * @return {Iterator} all keys in the symbol table following an in-order traversal
       */
      keysInOrder(){
        let queue = new Queue();
        this._keysInOrderNode(this.root, queue);
        return queue.iter();
      }
      /**Adds the keys in the subtree to queue following an in-order traversal.
       * @param {object} x the subtree
       * @param {Queue} queue the queue
       */
      _keysInOrderNode(x, queue){
        if(!_.nichts(x)){
          this._keysInOrderNode(x.left, queue);
          queue.enqueue(x.key);
          this._keysInOrderNode(x.right, queue);
        }
      }
      /**Returns all keys in the symbol table following a level-order traversal.
       * @return {Iterator} all keys in the symbol table following a level-order traversal.
       */
      keysLevelOrder(){
        let queue = new Queue();
        if(!this.isEmpty()){
          let queue2 = new Queue();
          queue2.enqueue(this.root);
          while(!queue2.isEmpty()){
            let x = queue2.dequeue();
            queue.enqueue(x.key);
            if(!x.left ){
              queue2.enqueue(x.left);
            }
            if(x.right ){
              queue2.enqueue(x.right);
            }
          }
        }
        return queue;
      }
      /**Returns all keys in the symbol table in the given range.
       * @param {any} lo the lowest key
       * @param {any} hi the highest key
       * @return {Iterator} all keys in the symbol table between {@code lo} (inclusive)
       *         and {@code hi} (exclusive)
       */
      keys(lo, hi){
        if(arguments.length==0){ return this.keysInOrder()}
        if(_.nichts(lo)) throw Error("first argument to keys() is null");
        if(_.nichts(hi)) throw Error("second argument to keys() is null");
        let queue = new Queue();
        this._keysNode(this.root, queue, lo, hi);
        return queue.iter();
      }
      /**Adds the keys between {@code lo} and {@code hi} in the subtree
       * to the {@code queue}.
       */
      _keysNode(x, queue, lo, hi){
        if(x){
          let cmplo = this.compare(lo,x.key);
          let cmphi = this.compare(hi,x.key);
          if(cmplo < 0) this._keysNode(x.left, queue, lo, hi);
          if(cmplo <= 0 && cmphi >= 0) queue.enqueue(x.key);
          if(cmphi > 0) this._keysNode(x.right, queue, lo, hi);
        }
      }
      /**Returns the number of keys in the symbol table in the given range.
       * @param lo minimum endpoint
       * @param hi maximum endpoint
       * @return the number of keys in the symbol table between {@code lo}
       *         (inclusive) and {@code hi} (exclusive)
       * @throws Error if either {@code lo} or {@code hi} is {@code null}
       */
      size(lo, hi){
        if(arguments.length==0){ return this._sizeNode(this.root)}
        if(_.nichts(lo)) throw Error("first argument to size() is null");
        if(_.nichts(hi)) throw Error("second argument to size() is null");
        if(this.compare(lo,hi) > 0) return 0;
        if(this.contains(hi)) return this.rank(hi) - this.rank(lo) + 1;
        return this.rank(hi) - this.rank(lo);
      }
      //Checks if the AVL tree invariants are fine.
      _check(){
        let self=this;
        function isAVL(x){
          if(!x) return true;
          let bf = self._balanceFactor(x);
          if(bf > 1 || bf < -1) return false;
          return isAVL(x.left) && isAVL(x.right);
        }
        function isBST(x, min, max){
          if(!x) return true;
          if(!min && self.compare(x.key,min) <= 0) return false;
          if(!max && self.compare(x.key,max) >= 0) return false;
          return isBST(x.left, min, x.key) && isBST(x.right, x.key, max);
        }
        function isSizeConsistent(x){
          if(!x) return true;
          if(x.size != self._sizeNode(x.left) + self._sizeNode(x.right) + 1) return false;
          return isSizeConsistent(x.left) && isSizeConsistent(x.right);
        }
        function isRankConsistent(){
          for(let i = 0; i < self.size(); i++)
            if(i != self.rank(self.select(i))) return false;
          for(let k, it=self.keys().iterator();it.hasNext();){
            k=it.next();
            if(this.compare(k,self.select(self.rank(key))) != 0) return false;
          }
          return true;
        }
        return isBST(this.root,null,null) && isAVL(this.root) && isSizeConsistent(this.root) && isRankConsistent();
      }
      static test(){
        let st = new AVLTreeST(CMP);
        "SEARCHEXAMPLE".split("").forEach((s,i)=> st.put(s,i));
        for(let s,it=st.keys();it.hasNext();){
          s=it.next();
          console.log(s + " " + st.get(s));
        }
      }
    }
    //AVLTreeST.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const SQRT2=Math.sqrt(2);
    function AStarGridNode(loc,par){
      return{
        parent: par, pos: loc, f:0, g:0, h:0,
        pid: `${loc[0]},${loc[1]}`,
        equals(o){
          return this.pos[0]==o.pos[0] &&
                 this.pos[1]==o.pos[1]
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**A* search algo for grid.
     * @memberof module:mcfud/algo_search
     * @class
     */
    class AStarGrid{
      /**Use when movement is limited to 4 directions only.
       * @param {array} test node pos
       * @param {array} goal node pos
       * @param {number} cost
       */
      static manhattan(test, goal,cost=1){
        return cost*Math.abs(test[1] - goal[1]) +
               cost*Math.abs(test[0] - goal[0]);
      }
      /**Use when movements are allowed in all directions.
       * @param {array} test node pos
       * @param {array} goal node pos
       * @param {number} cost
       */
      static euclidean(test, goal,cost=1){
        let vx = goal[0] - test[0],
            vy = goal[1] - test[1];
        return cost * (vx * vx + vy * vy);
      }
      /**Use when movements are allowed in all directions.
       * @param {array} test node pos
       * @param {array} goal node pos
       * @param {number} cost
       */
      static diagonal(test, goal,cost=1,xcost=SQRT2){
        let dx = Math.abs(goal[0] - test[0]),
            dy = Math.abs(goal[1] - test[1]);
        return cost * (dx + dy) + (xcost - 2 * cost) * Math.min(dx, dy);
      }
      constructor(grid){
        this.grid=grid;
      }
      pathTo(start, end, ctx){
        return this._search(this.grid,start,end,ctx)
      }
      _search(grid,start,end,ctx){
        const CMP=ctx.compare,
              ROWS= grid.length,
              COLS= grid[0].length,
              closedSet = new Map(),
              openTM= new Map(),
              openSet = new MinPQ(CMP,10),
              goalNode = AStarGridNode(end),
              startNode = AStarGridNode(start),
              dirs=[[1,0],[-1,0],[0,1],[0,-1]],
              rpath=(cn,out)=>{ for(;cn;cn=cn.parent) out.unshift(cn.pos); return out; };
        //include diagonal neighbors?
        if(ctx.wantDiagonal)
          dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
        openTM.set(startNode.pid,startNode.g);
        openSet.insert(startNode);
        //begin...
        let cur,neighbors=[];
        while(!openSet.isEmpty()){
          cur= openSet.delMin();
          openTM.delete(cur.pid);
          closedSet.set(cur.pid,0);
          //done?
          if(cur.equals(goalNode)){return rpath(cur,[])}
          neighbors.length=0;
          for(let p,i=0;i<dirs.length;++i){
            p = [cur.pos[0] + dirs[i][0], cur.pos[1] + dirs[i][1]];
            if(p[0] > (COLS-1) || p[0] < 0 ||
               p[1] > (ROWS-1) || p[1] < 0 || ctx.blocked(p)){
            }else{
              neighbors.push(AStarGridNode(p,cur));
            }
          }
          neighbors.forEach(co=>{
            if(!closedSet.has(co.pid)){
              co.g = cur.g + ctx.cost();
              co.h = ctx.calcHeuristic(co.pos,goalNode.pos);
              co.f = co.g + co.h;
              //update if lower cost
              if(openTM.has(co.pid) && co.g > openTM.get(co.pid)){}else{
                openSet.insert(co);
                openTM.set(co.pid, co.g);
              }
            }
          });
        }
      }
      static test(){
        let grid = [[0, 1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 1, 0, 1, 0, 0],
                    [0, 1, 0, 0, 1, 0],
                    [0, 0, 0, 0, 1, 0]];
        let ROWS=grid.length,COLS=grid[0].length;
        let ctx={
          wantDiagonal:false,
          compare(a,b){ return a.f-b.f },
          cost(){ return 1 },
          blocked(n){ return grid[n[1]][n[0]] != 0 },
          calcHeuristic(a,g){
            //return AStarGrid.diagonal(a,g,10,14);
            return AStarGrid.euclidean(a,g);
            //return AStarGrid.manhattan(a,g,10)
          }
        }
        let c,r,m,p= new AStarGrid(grid).pathTo([0,0],[5,4],ctx);
        if(p){
          m=""; p.forEach(n=>{ m+= `[${n[0]},${n[1]}] `; }); console.log(m);
          r=_.fill(ROWS, ()=> _.fill(COLS, "#"));
          c=0;
          p.forEach(n=>{
            r[n[1]][n[0]]= ""+c;
            ++c;
          });
          r.forEach(row=>{
            console.log(row.toString())
          });
        }else{
          console.log("no path");
        }
      }
    }
    //AStarGrid.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      AStarGrid,
      AVLTreeST,
      RedBlackBST,
      BST,
      BinarySearch,
      BinarySearchST,
      FrequencyCounter,
      SequentialSearchST
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"),
                           require("../main/math"),
                           require("./basic"),require("./sort"))
  }else{
    gscope["io/czlab/mcfud/algo/search"]=_module
  }

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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_M,Basic,Sort){

    if(!Basic) Basic= gscope["io/czlab/mcfud/algo/basic"]();
    if(!Sort) Sort= gscope["io/czlab/mcfud/algo/sort"]();
    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();

    const {prnIter, TreeMap,Bag,Stack,Queue,ST,StdCompare:CMP}= Basic;
    const {IndexMinPQ,MinPQ}= Sort;
    const int=Math.floor;
    const {is,u:_}= Core;

    /**
     * @module mcfud/algo_graph
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _chkVertex(v,V){
      if(v < 0 || v >= V)
        throw Error(`vertex ${v} is not between 0 and ${V-1}`);
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an undirected graph of vertices named 0 through <em>V</em> – 1.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class Graph{
      /**
       * Initializes an empty graph with {@code V} vertices and 0 edges.
       * param V the number of vertices
       *
       * @param  V number of vertices
       * @throws Error if {@code V < 0}
       */
      constructor(V){
        //* @property {number} V number of vertices
        //* @property {number} E number of edges
        //* @property {array} adjls list of adjacents
        _.assert(V >= 0, "Number of vertices must be non-negative");
        this.verts = V;
        this.edges = 0;
        this.adjls = _.fill(V,()=> new Bag());
      }
      clone(){
        let ret=new Graph(this.V());
        ret.edges= this.E();
        ret.adjls =[];
        for(let v=0,V=this.V(); v<V; ++v)
          ret.adjls.push(this.adjls[v].clone());
        return ret;
      }
      /**Returns the number of vertices in this graph.
       * @return {number}
       */
      V(){
        return this.verts;
      }
      /**Returns the number of edges in this graph.
       * @return {number}
       */
      E(){
        return this.edges;
      }
      /**Adds the undirected edge v-w to this graph.
       * @param  {number} v one vertex in the edge
       * @param  {number} w the other vertex in the edge
       */
      addEdge(v, w){
        _chkVertex(v,this.verts);
        _chkVertex(w,this.verts);
        this.edges+=1;
        this.adjls[v].add(w);
        this.adjls[w].add(v);
      }
      /**Returns the vertices adjacent to vertex {@code v}.
       * @param  {number} v the vertex
       * @return {Bag}
       */
      adj(v){
        return _chkVertex(v, this.verts) && this.adjls[v];
      }
      /**Returns the degree of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      degree(v){
        return _chkVertex(v, this.verts) && this.adjls[v].size();
      }
      /**Returns a string representation of this graph.
       * @return {string}
       */
      toString(){
        let out=`${this.verts} vertices, ${this.edges} edges\n`;
        for(let it,v = 0; v < this.verts; ++v){
          out += `${v}: ` + prnIter(this.adjls[v].iter());
          out += "\n";
        }
        return out;
      }
      static load(V,data){
        let g=new Graph(V);
        _.assert(data.length%2==0,"wanted even n# of data points");
        for(let i=0;i<data.length; i+=2){ g.addEdge(data[i], data[i+1]); }
        return g;
      }
      static test(){
        let obj= Graph.load(13, [0,5,4,3,0,1,9,12,6,4,5,4,0,2,11,12,9,10,0,6,7,8,9,11,5,3]);
        obj.degree(1);
        console.log(obj.toString());
        let c= obj.clone();
        console.log("cloned=\n"+c.toString());
      }
    }
    //Graph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for determining the vertices
     * connected to a given source vertex <em>s</em>
     *  in an undirected graph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DepthFirstSearch{
      /**Computes the vertices in graph {@code G} that are
       * connected to the source vertex {@code s}.
       * @param G the graph
       * @param s the source vertex
       */
      constructor(G, s){
        //* @property {array} bMarked marked[v] = is there an s-v path?
        //* @property {number} count number of vertices connected to s
        this.bMarked = new Array(G.V()); // marked[v] = is there an s-v path?
        this.nCount=0; // number of vertices connected to s
        _chkVertex(s,this.bMarked.length) && this._dfs(G, s);
      }
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      // depth first search from v
      _dfs(G, v){
        this.nCount+=1;
        this.bMarked[v] = true;
        for(let w,it= G.adj(v).iter(); it.hasNext();){
          w=it.next();
          if(!this.bMarked[w]) this._dfs(G, w);
        }
      }
      /**Is there a path between the source vertex {@code s} and vertex {@code v}?
       * @param {number} v the vertex
       * @return {boolean}
       */
      marked(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      /**Returns the number of vertices connected to the source vertex {@code s}.
       * @return {number}
       */
      count(){
        return this.nCount;
      }
      static test(){
        let m,obj,g=Graph.load(13,
          [0,5,4,3,0,1,9,12,6,4,5,4,0,2,11,12,9,10,0,6,7,8,9,11,5,3]);
        [0,9].forEach(s=>{
          obj= new DepthFirstSearch(g, s);
          m="";
          for(let v=0; v<g.V(); ++v) if(obj.marked(v)) m+= `${v} `;
          console.log(m);
          console.log(obj.count() != g.V()? "NOT connected" :"connected");
        });
      }
    }
    //DepthFirstSearch.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for finding the vertices connected to a source vertex <em>s</em> in the undirected graph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class NonrecursiveDFS{
      /**Computes the vertices connected to the source vertex {@code s} in the graph {@code G}.
       * @param {Graph} G the graph
       * @param {number} s the source vertex
       */
      constructor(G, s){
        //* @property {array} bMarked marked[v] = is there an s-v path?
        this.bMarked = new Array(G.V());
        _chkVertex(s,this.bMarked.length);
        // to be able to iterate over each adjacency list, keeping track of which
        // vertex in each adjacency list needs to be explored next
        let adj = _.fill(G.V(),(i)=> G.adj(i).iter());
        // depth-first search using an explicit stack
        let it,v,w,stack = new Stack();
        this.bMarked[s] = true;
        stack.push(s);
        while(!stack.isEmpty()){
          v=stack.peek();
          if(adj[v].hasNext()){
            w = adj[v].next();
            //console.log(`check ${w}`);
            if(!this.bMarked[w]){
              this.bMarked[w] = true;
              stack.push(w);
              //console.log(`dfs(${w})`);
            }
          }else{
            //console.log(`${v} done`);
            stack.pop();
          }
        }
      }
      /**Is vertex {@code v} connected to the source vertex {@code s}?
       * @param {number} v the vertex
       * @return {boolean}
       */
      marked(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      static test(){
        let m,obj,g = Graph.load(13,
          [0,5,4,3,0,1,9,12,6,4,5,4,0,2,11,12,9,10,0,6,7,8,9,11,5,3]);
        [0,9].forEach(s=>{
          obj = new NonrecursiveDFS(g, s);
          m="";
          for(let v=0; v<g.V(); ++v)
            if(obj.marked(v)) m += `${v} `;
          console.log(m);
        })
      }
    }
    //NonrecursiveDFS.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for finding paths from a source vertex <em>s</em>
     * to every other vertex in an undirected graph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DepthFirstPaths{
      /**Computes a path between {@code s} and every other vertex in graph {@code G}.
       * @param {Graph} G the graph
       * @param {number} s the source vertex
       */
      constructor(G, s){
        //* @property {array} bMarked marked[v] = is there an s-v path?
        //* @property {number} s source index
        //* @property {array} edgeTo edgeTo[v] = last edge on s-v path
        this.bMarked = new Array(G.V());
        this.edgeTo = new Array(G.V());
        this.s = s; // source vertex
        _chkVertex(s,this.bMarked.length) && this._dfs(G, s);
      }
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      // depth first search from v
      _dfs(G, v){
        this.bMarked[v] = true;
        for(let w,it=G.adj(v).iter(); it.hasNext();){
          w=it.next();
          if(!this.bMarked[w]){
            this.edgeTo[w] = v;
            this._dfs(G, w);
          }
        }
      }
      /**Is there a path between the source vertex {@code s} and vertex {@code v}?
       * @param {number} v the vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      /**Returns a path between the source vertex {@code s} and vertex {@code v}, or
       * {@code null} if no such path.
       * @param  {number} v the vertex
       * @return the sequence of vertices on a path between the source vertex
       *         {@code s} and vertex {@code v}, as an Iterable
       */
      pathTo(v){
        if(_chkVertex(v,this.bMarked.length) && this.hasPathTo(v)){
          let path = new Stack();
          for(let x=v; x != this.s; x=this.edgeTo[x]) path.push(x);
          path.push(this.s);
          return path.iter();
        }
      }
      static test(){
        let G = Graph.load(6, [0,5,2,4,2,3,1,2,0,1,3,4,3,5,0,2]);
        let s=0,obj = new DepthFirstPaths(G, s);
        for(let m,it,x, v=0; v<G.V(); ++v){
          if(obj.hasPathTo(v)){
            m= `${s} to ${v}:  `;
            for(let it=obj.pathTo(v); it.hasNext();){
              x=it.next();
              m += x==s? x : `-${x}`;
            }
            console.log(m);
          }else{
            console.log(`${s} to ${v}:  not connected\n`);
          }
        }
      }
    }
    //DepthFirstPaths.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // breadth-first search from a single source
    const _bfs=(G, s, M)=> _bfss(G,[s],M);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // breadth-first search from multiple sources
    function _bfss(G, sources, M){
      let it,v,q = [];
      for(v = 0; v < G.V(); ++v)
        M.mDistTo[v] = Infinity;
      sources.forEach(s=>{
        M.bMarked[s] = true;
        M.mDistTo[s] = 0;
        q.push(s);
      });
      while(q.length>0){
        v=q.shift();
        for(let w,it=G.adj(v).iter(); it.hasNext();){
          w=it.next();
          if(!M.bMarked[w]){
            M.edgeTo[w] = v;
            M.mDistTo[w] = M.mDistTo[v] + 1;
            M.bMarked[w] = true;
            q.push(w);
          }
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // check optimality conditions for single source
    function _check(G, s,M){
      if(M.mDistTo[s] != 0)// check s==0
        throw Error(`dist of source ${s} to itself = ${M.mDistTo[s]}`);
      // each edge v-w dist[w] <= dist[v] + 1
      for(let v = 0; v < G.V(); ++v){
        for(let w, it=G.adj(v).iter(); it.hasNext();){
          w=it.next();
          if(M.hasPathTo(v) !== M.hasPathTo(w)){
            throw Error(`edge ${v}-${w}` +
                        `hasPathTo(${v})=${M.hasPathTo(v)}` +
                        `hasPathTo(${w})=${M.hasPathTo(w)}`);
          }
          if(M.hasPathTo(v) && (M.mDistTo[w] > (M.mDistTo[v]+1))){
            throw Error(`edge ${v}-${w}` +
                        `distTo[${v}]=${M.mDistTo[v]}` +
                        `distTo[${w}]=${M.mDistTo[w]}`);
          }
        }
      }
      // check that v = edgeTo[w] satisfies distTo[w] = distTo[v] + 1
      for(let v,w=0; w<G.V(); ++w){
        if(!M.hasPathTo(w) || w==s){}else{
          v=M.edgeTo[w];
          if(M.mDistTo[w] != M.mDistTo[v]+1){
            throw Error(`shortest path edge ${v}-${w} `+
                        `distTo[${v}]= ${M.mDistTo[v]}`+
                        `distTo[${w}]= ${M.mDistTo[w]}`);
          }
        }
      }
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _chkVerts(vs,V){
      if(!vs || vs.length==0)
        throw Error("argument is null or empty");
      vs.forEach(v=> _chkVertex(v,V));
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for finding shortest paths (number of edges)
     * from a source vertex <em>s</em> (or a set of source vertices)
     * to every other vertex in an undirected graph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class BreadthFirstPaths{
      /**Computes the shortest path between the source vertex {@code s}
       * and every other vertex in the graph {@code G}.
       * @param {Graph} G the graph
       * @param s {number} the source vertex
       */
      constructor(G, s){
        //* @property {array} bMarked marked[v] = is there an s-v path?
        //* @property {array} mDistTo  number of edges shortest s-v path
        //* @property {array} edgeTo previous edge on shortest s-v path
        this.bMarked = new Array(G.V());
        this.mDistTo = new Array(G.V());
        this.edgeTo = new Array(G.V());
        if(!is.vec(s)){s=[s]}
        _chkVerts(s,G.V());
        _bfss(G, s,this);
        _check(G, s, this);
      }
      /**Is there a path between the source vertex {@code s} (or sources) and vertex {@code v}?
       * @param {number} v the vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      /**Returns the number of edges in a shortest path between the source vertex {@code s}
       * (or sources) and vertex {@code v}?
       * @param {number} v the vertex
       * @return {number}
       */
      distTo(v){
        return _chkVertex(v,this.bMarked.length) && this.mDistTo[v];
      }
      /**Returns a shortest path between the source vertex {@code s} (or sources)
       * and {@code v}, or {@code null} if no such path.
       * @param  {number} v the vertex
       * @return {Iterator}
       */
      pathTo(v){
        if(_chkVertex(v,this.bMarked.length) && this.hasPathTo(v)){
          let x,path = new Stack();
          for(x=v; this.mDistTo[x] != 0; x=this.edgeTo[x]){
            path.push(x);
          }
          path.push(x);
          return path.iter();
        }
      }
      static test(){
        let G=Graph.load(6, [0,5,2,4,2,3,1,2,0,1,3,4,3,5,0,2]);
        //console.log(G.toString());
        let s=0,obj = new BreadthFirstPaths(G, s);
        for(let m,v=0; v<G.V(); ++v){
          if(obj.hasPathTo(v)){
            m=`${s} to ${v}(${obj.distTo(v)}): `;
            for(let x,it=obj.pathTo(v); it.hasNext();){
              x=it.next();
              m += x==s? `${x}`: `-${x}`;
            }
            console.log(m);
          }else{
            console.log(`${s} to ${v} (-):  not connected\n`);
          }
        }
      }
    }
    //BreadthFirstPaths.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a weighted edge in an {@link EdgeWeightedGraph}.
     * Each edge consists of two integers.
     * (naming the two vertices) and a real-value weight.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class Edge{
      /**Initializes an edge between vertices {@code v} and {@code w} of
       * the given {@code weight}.
       * @param  {number} v one vertex
       * @param  {number} w the other vertex
       * @param  {number} weight the weight of this edge
       */
      constructor(v, w, weight){
        //* @property {number} v
        //* @property {number} w
        //* @property {number} weight
        if(v<0) throw Error("vertex index must be a non-negative integer");
        if(w<0) throw Error("vertex index must be a non-negative integer");
        this.v = v;
        this.w = w;
        this._weight = weight;
      }
      /**Returns the weight of this edge.
       * @return {number}
       */
      weight(){
        return this._weight
      }
      /**Returns either endpoint of this edge.
       * @return {number}
       */
      either(){
        return this.v;
      }
      /**Returns the endpoint of this edge that is different from the given vertex.
       * @param  {number} vertex one endpoint of this edge
       * @return {number}
       */
      other(vertex){
        if(vertex == this.v) return this.w;
        if(vertex == this.w) return this.v;
        throw Error("Illegal endpoint");
      }
      /**Compares two edges by weight.
       * @param  {Edge} that the other edge
       * @return {number}
       */
      static comparator(a,b){
        return a._weight<b._weight?-1:(a._weight>b._weight?1:0)
      }
      //compareTo(that){ return this._weight< that._weight?-1:(this._weight>that._weight?1:0) }
      /**Returns a string representation of this edge.
       * @return {string}
       */
      toString(){
        return `${this.v}-${this.w} ${this._weight}`;
      }
      static test(){
        console.log(new Edge(12, 34, 5.67).toString());
      }
    }
    //Edge.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents an edge-weighted graph of vertices named 0 through <em>V</em> – 1,
     * where each undirected edge is of type {@link Edge} and has a real-valued weight.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class EdgeWeightedGraph{
      /**Initializes an empty edge-weighted graph with {@code V} vertices and 0 edges.
       * @param  {number} V the number of vertices
       */
      constructor(V){
        //* @property {number} _V
        //* @property {number} _E
        //* @property {array} adjls
        if(V<0) throw Error("Number of vertices must be non-negative");
        this._V = V;
        this._E = 0;
        this.adjls = _.fill(V,()=> new Bag());
      }
      /**Initializes a random edge-weighted graph with {@code V} vertices and <em>E</em> edges.
       * @param  {number} V the number of vertices
       * @param  {number} E the number of edges
       * @return {Graph}
       */
      static randGraph(V, E){
        let g= new EdgeWeightedGraph(V);
        if(E<0) throw Error("Number of edges must be non-negative");
        for(let wt,v,w,i=0; i<E; ++i){
          v = _.randInt(V);
          w = _.randInt(V);
          wt = Math.round(100 * _.rand()) / 100.0;
          g.addEdge(new Edge(v, w, wt));
        }
        return g;
      }
      /**Initializes a new edge-weighted graph that is a deep copy of {@code G}.
       * @param  {Graph} G the edge-weighted graph to copy
       */
      clone(){
        let g= new EdgeWeightedGraph(this.V());
        g._E = this.E();
        for(let v=0; v<this.V(); ++v)
          g.adjls[v]= this.adjls[v].clone();
        return g;
      }
      /**Returns the number of vertices in this edge-weighted graph.
       * @return {number}
       */
      V(){
        return this._V;
      }
      /**Returns the number of edges in this edge-weighted graph.
       * @return {number}
       */
      E(){
        return this._E;
      }
      /**Adds the undirected edge {@code e} to this edge-weighted graph.
       * @param  {Edge} e the edge
       */
      addEdge(e){
        let v = e.either(),
            w = e.other(v);
        _chkVertex(v,this._V);
        _chkVertex(w,this._V);
        this.adjls[v].add(e);
        this.adjls[w].add(e);
        this._E +=1;
      }
      /**Returns the edges incident on vertex {@code v}.
       * @param  {number} v the vertex
       * @return {Bag}
       */
      adj(v){
        return _chkVertex(v,this._V) && this.adjls[v]
      }
      /**Returns the degree of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      degree(v){
        return _chkVertex(v,this._V) && this.adjls[v].size()
      }
      /**Returns all edges in this edge-weighted graph.
       * To iterate over the edges in this edge-weighted graph, use foreach notation:
       * {@code for (Edge e : G.edges())}.
       * @return {Bag}
       */
      edges(){
        const list = new Bag();
        for(let it,s,e,v=0; v<this._V; ++v){
          s=0;
          for(it=this.adjls[v].iter(); it.hasNext();){
            e=it.next();
            if(e.other(v)>v){
              list.add(e);
            }else if(e.other(v) == v){
              // add only one copy of each self loop (self loops will be consecutive)
              if(s%2 == 0) list.add(e);
              ++s;
            }
          }
        }
        return list.iter();
      }
      /**Returns a string representation of the edge-weighted graph.
       * This method takes time proportional to <em>E</em> + <em>V</em>.
       * @return {string}
       */
      toString(){
        let s = `${this._V} ${this._E}\n`;
        for(let it,v=0; v<this._V; ++v){
          s+= `${v}: `;
          for(it=this.adjls[v].iter(); it.hasNext();){
            s+= `${it.next()}, `;
          }
          s+="\n";
        }
        return s;
      }
      static load(V,data){
        let g= new EdgeWeightedGraph(V);
        _.assert(data.length%3 ==0, "Invalid data size");
        for(let i=0;i<data.length; i+=3){
          _chkVertex(data[i],V) &&
          _chkVertex(data[i+1],V) &&
          g.addEdge(new Edge(data[i],data[i+1], data[i+2]));
        }
        return g;
      }
      static test(){
        let d=`4 5 0.35 4 7 0.37 5 7 0.28 0 7 0.16 1 5 0.32 0 4 0.38 2 3 0.17 1 7 0.19 0 2 0.26 1 2 0.36 1 3 0.29 2 7 0.34 6 2 0.40 3 6 0.52 6 0 0.58 6 4 0.93`.split(" ").map(s=> {return +s});
        let g= EdgeWeightedGraph.load(8,d);
        console.log(g.toString());
      }
    }
    //EdgeWeightedGraph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for determining the connected components in an undirected graph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class CC{
      /**Computes the connected components of the undirected graph {@code G}.
       * @param {Graph} undirected or edgeweighted graph
       */
      constructor(G){
        //* @property {array} bMarked   marked[v] = has vertex v been marked?
        //* @property {number} id id[v] = id of connected component containing v
        //* @property {number} size size[id] = number of vertices in given component
        //* @property {number} nCount  number of connected components
        this.bMarked = new Array(G.V());
        this._id = new Array(G.V());
        this._size = new Array(G.V());
        this.nCount=0;
        for(let v=0; v<G.V(); ++v){
          if(!this.bMarked[v]){
            this._dfs(G, v);
            ++this.nCount;
          }
        }
      }
      // depth-first search for a Graph
      _dfs(G, v){
        this.bMarked[v] = true;
        this._id[v] = this.nCount;
        this._size[this.nCount] += 1;
        for(let e,w,it= G.adj(v).iter(); it.hasNext();){
          e=it.next();
          if(G instanceof EdgeWeightedGraph){
            w = e.other(v);
            if(!this.bMarked[w]) this._dfs(G, w);
          }else{
            if(!this.bMarked[e]) this._dfs(G, e);
          }
        }
      }
      /**Returns the component id of the connected component containing vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      id(v){
        return _chkVertex(v,this.bMarked.length) && this._id[v]
      }
      /**Returns the number of vertices in the connected component containing vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      size(v){
        return _chkVertex(v, this.bMarked.length) && this._size[this._id[v]]
      }
      /**Returns the number of connected components in the graph {@code G}.
       * @return {number}
       */
      count(){
        return this.nCount;
      }
      /**Returns true if vertices {@code v} and {@code w} are in the same
       * connected component.
       * @param  {number} v one vertex
       * @param  {number} w the other vertex
       * @return {boolean}
       */
      connected(v, w){
        return _chkVertex(v,this.bMarked.length) &&
               _chkVertex(w, this.bMarked.length) && this.id(v) == this.id(w)
      }
      static test(){
        let G=Graph.load(13, [0,5,4,3,0,1,9,12,6,4,5,4,0,2,11,12,9,10,0,6,7,8,9,11,5,3]);
        //console.log(G.toString());
        let cc=new CC(G);
        // number of connected components
        let m=cc.count();
        console.log(m + " components");
        // compute list of vertices in each connected component
        let cs = _.fill(m, ()=> []);
        for(let v=0; v<G.V(); ++v){
          cs[cc.id(v)].push(v)
        }
        // print results
        for(let s,i=0; i<m; ++i){
          s="";
          cs[i].forEach(v=> s+= v.toString()+" ");
          console.log(s);
        }
      }
    }
    //CC.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a directed graph of vertices
     *  named 0 through <em>V</em> - 1.
     *  It supports the following two primary operations: add an edge to the digraph,
     *  iterate over all of the vertices adjacent from a given vertex.
     *  It also provides
     *  methods for returning the indegree or outdegree of a vertex,
     *  the number of vertices <em>V</em> in the digraph,
     *  the number of edges <em>E</em> in the digraph, and the reverse digraph.
     *  Parallel edges and self-loops are permitted.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class Digraph{
      static load(V,data){
        if(V<0)
          throw Error("verts in a Digraph must be non-negative");
        _.assert(data.length%2==0,"expected even n# of data-length");
        let g= new Digraph(V);
        for(let i=0; i<data.length; i+=2){
          g.addEdge(data[i], data[i+1]);
        }
        return g;
      }
      /**Initializes an empty digraph with <em>V</em> vertices.
       * @param  {number} V the number of vertices
       */
      constructor(V){
        //* @property {array} bMarked   marked[v] = has vertex v been marked?
        //* @property {number} id id[v] = id of connected component containing v
        //* @property {number} size size[id] = number of vertices in given component
        //* @property {number} nCount  number of connected components
        if(V<0) throw Error("verts in a Digraph must be non-negative");
        this._V = V;
        this._E = 0;
        this._indegree = _.fill(V,0);
        this.adjls = _.fill(V,()=> new Bag());
      }
      /**Initializes a new digraph that is a deep copy of the specified digraph.
       * @return {object} digraph copy
       */
      clone(){
        let self=this,
            g=new Digraph(this.V());
        g._E = this.E();
        //update indegrees
        g._indegree = _.fill(g.V(), (i)=> self._indegree[i]);
        // update adjacency lists
        for(let v=0; v<g.V(); ++v){
          g.adjls[v]= this.adjls[v].clone();
        }
        return g;
      }
      /**Returns the number of vertices in this digraph.
       * @return {number}
       */
      V(){
        return this._V;
      }
      /**Returns the number of edges in this digraph.
       * @return {number}
       */
      E(){
        return this._E;
      }
      /**Adds the directed edge v→w to this digraph.
       * @param  {number} v the tail vertex
       * @param  {number} w the head vertex
       */
      addEdge(v, w){
        _chkVertex(v,this._V) && _chkVertex(w,this._V);
        this.adjls[v].add(w);
        this._indegree[w] +=1;
        ++this._E;
      }
      /**Returns the vertices adjacent from vertex {@code v} in this digraph.
       * @param  {number} v the vertex
       * @return {Bag}
       */
      adj(v){
        return _chkVertex(v,this._V) && this.adjls[v]
      }
      /**Returns the number of directed edges incident from vertex {@code v}.
       * This is known as the <em>outdegree</em> of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      outdegree(v){
        return _chkVertex(v,this._V) && this.adjls[v].size()
      }
      /**Returns the number of directed edges incident to vertex {@code v}.
       * This is known as the <em>indegree</em> of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      indegree(v){
        return _chkVertex(v,this._V) && this._indegree[v]
      }
      /**Returns the reverse of the digraph.
       * @return {Digraph}
       */
      reverse(){
        let r= new Digraph(this._V);
        for(let it,v=0; v<this._V; ++v)
          for(it=this.adjls[v].iter(); it.hasNext();){
            r.addEdge(it.next(), v);
          }
        return r;
      }
      /**Returns a string representation of the graph.
       * @return {string}
       */
      toString(){
        let s= `${this._V} vertices, ${this._E} edges\n`;
        for(let it,v=0; v<this._V; ++v){
          s+= `${v}: `
          for(it=this.adjls[v].iter(); it.hasNext();){
            s+= `${it.next()} `
          }
          s+="\n";
        }
        return s;
      }
      static test(){
        let s= "4  2 2  3 3  2 6  0 0  1 2  0 11 12 12  9 9 10 9 11 7  9 10 12 11  4 4  3 3  5 6  8 8  6 5  4 0  5 6  4 6  9 7  6";
        let g= Digraph.load(13, s.split(/\s+/).map(n=>{ return +n }));
        let si="",so="";
        for(let v=0;v<g.V();++v){
          si += `${v}=${g.indegree(v)}, `;
          so += `${v}=${g.outdegree(v)},`;
        }
        console.log("indegreee= "+ si);
        console.log("outdegreee= "+so);
        console.log(g.toString());
        let c= g.clone();
        console.log("cloned=\n"+c.toString());
        let r= g.reverse();
        console.log("rev'ed=\n"+r.toString());
      }
    }
    //Digraph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for determining the vertices reachable
     * from a given source vertex <em>s</em> (or set of source vertices) in a digraph.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DirectedDFS{
      /**Computes the vertices in digraph {@code G} that are
       * reachable from the source vertex {@code s}.
       * @param {Graph} G the digraph
       * @param {number} s the source vertex
       */
      constructor(G, s){
        //* @property {array} bMarked  marked[v] = true iff v is reachable from source(s)
        //* @property {number} nCount  number of vertices reachable from source(s)
        this.bMarked = new Array(G.V());
        if(!is.vec(s)) s=[s];
        _chkVerts(s,G.V());
        s.forEach(v=>{
          if(!this.bMarked[v]) this._dfs(G, v);
        });
      }
      _dfs(G, v){
        this.mCount+=1;
        this.bMarked[v] = true;
        for(let w,it=G.adj(v).iter(); it.hasNext();){
          w=it.next();
          if(!this.bMarked[w]) this._dfs(G, w);
        }
      }
      /**Is there a directed path from the source vertex (or any
       * of the source vertices) and vertex {@code v}?
       * @param  {number} v the vertex
       * @return {boolean}
       */
      marked(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v]
      }
      /**Returns the number of vertices reachable from the source vertex
       * (or source vertices).
       * @return {number}
       */
      count(){
        return this.mCount;
      }
      static test(){
        let s= "4  2 2  3 3  2 6  0 0  1 2  0 11 12 12  9 9 10 9 11 7  9 10 12 11  4 4  3 3  5 6  8 8  6 5  4 0  5 6  4 6  9 7  6";
        let G= Digraph.load(13, s.split(/\s+/).map(n=>{ return +n }));
        let m="",dfs = new DirectedDFS(G, [1,2,6]);
        // print out vertices reachable from sources
        for(let v = 0; v < G.V(); ++v){
          if(dfs.marked(v)) m+= `${v} `;
        }
        dfs.count();
        console.log(m);
      }
    }
    //DirectedDFS.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for determining whether a digraph has a directed cycle.
     *  The <em>hasCycle</em> operation determines whether the digraph has
     *  a simple directed cycle and, if so, the <em>cycle</em> operation
     *  returns one.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DirectedCycle{
      /**Determines whether the digraph {@code G} has a directed cycle and, if so,
       * finds such a cycle.
       * @param {Graph} G the digraph
       */
      constructor(G){
        //* @property {array} bMarked  marked[v] = has vertex v been marked?
        //* @property {Stack} cycle  directed cycle (or null if no such cycle)
        //* @property {array} edgeTo edgeTo[v] = previous vertex on path to v
        //* @property {array} onStack onStack[v] = is vertex on the stack?
        this.bMarked  = new Array(G.V());
        this.onStack = new Array(G.V());
        this.edgeTo  = new Array(G.V());
        this.mCycle=UNDEF;
        for(let v=0; v<G.V(); ++v)
          if(!this.bMarked[v] && !this.mCycle) this._dfs(G, v);
      }
      // run DFS and find a directed cycle (if one exists)
      _dfs(G, v){
        this.onStack[v] = true;
        this.bMarked[v] = true;
        for(let w, it=G.adj(v).iter(); it.hasNext();){
          w=it.next();
          // short circuit if directed cycle found
          if(this.mCycle){return}
          // found new vertex, so recur
          if(!this.bMarked[w]){
            this.edgeTo[w] = v;
            this._dfs(G, w);
          }else if(this.onStack[w]){
            // trace back directed cycle
            this.mCycle = new Stack();
            for(let x=v; x != w; x=this.edgeTo[x]){
              this.mCycle.push(x);
            }
            this.mCycle.push(w);
            this.mCycle.push(v);
            this._check();
          }
        }
        this.onStack[v] = false;
      }
      /**Does the digraph have a directed cycle?
       * @return {boolean}
       */
      hasCycle(){
        return !!this.mCycle;
      }
      /**Returns a directed cycle if the digraph has a directed cycle, and {@code null} otherwise.
       * @return {Iterator}
       */
      cycle(){
        return this.mCycle && this.mCycle.iter();
      }
      // certify that digraph has a directed cycle if it reports one
      _check(){
        if(this.hasCycle()){
          let first = -1, last = -1;
          for(let v,it=this.cycle(); it.hasNext();){
            v=it.next();
            if(first == -1) first = v;
            last = v;
          }
          if(first != last)
            throw Error(`cycle begins with ${first} and ends with ${last}\n`);
        }
        return true;
      }
      static test(){
        let T2="2 3 0 6 0 1 2 0 11 12  9 12  9 10  9 11 3 5 8 7 5 4 0 5 6 4 6 9 7 6".split(/\s+/).map(n=>{return +n});
        let D=`4  2 2  3 3  2 6  0 0  1 2  0 11 12 12  9 9
               10 9 11 7  9 10 12 11  4 4  3 3  5 6  8 8
               6 5  4 0  5 6  4 6  9 7  6`.split(/\s+/).map(n=>{return +n});
        let s,finder =[new DirectedCycle(Digraph.load(13,D)),
                       new DirectedCycle(Digraph.load(13,T2))];
        finder.forEach(f=>{
          if(f.hasCycle()){
            console.log("Directed cycle: ");
            console.log(prnIter(f.cycle()));
          }else{
            console.log("No directed cycle");
          }
        });
      }
    }
    //DirectedCycle.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a weighted edge in an
     *  {@link EdgeWeightedDigraph}. Each edge consists of two integers
     *  (naming the two vertices) and a real-value weight. The data type
     *  provides methods for accessing the two endpoints of the directed edge and
     *  the weight.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DirectedEdge{
      /**Initializes a directed edge from vertex {@code v} to vertex {@code w} with
       * the given {@code weight}.
       * @param {number} v the tail vertex
       * @param {number} w the head vertex
       * @param {number} weight the weight of the directed edge
       */
      constructor(v, w, weight){
        //* @property {number} v
        //* @property {number} w
        //* @property {number} weight
        if(v<0) throw Error("Vertex names must be non-negative integers");
        if(w<0) throw Error("Vertex names must be non-negative integers");
        this.v = v;
        this.w = w;
        this._weight = weight;
      }
      /**Returns the tail vertex of the directed edge.
       * @return {number}
       */
      from(){
        return this.v;
      }
      /**Returns the head vertex of the directed edge.
       * @return {number}
       */
      to(){
        return this.w;
      }
      /**Returns the weight of the directed edge.
       * @return {number}
       */
      weight(){
        return this._weight;
      }
      /**Returns a string representation of the directed edge.
       * @return {string}
       */
      toString(){
        return `${this.v}->${this.w} ${Number(this._weight).toFixed(2)}`
      }
      static test(){
        console.log(new DirectedEdge(12, 34, 5.67).toString());
      }
    }
    //DirectedEdge.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a edge-weighted digraph of vertices named 0 through <em>V</em> - 1,
     * where each directed edge is of type {@link DirectedEdge} and has a real-valued weight.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class EdgeWeightedDigraph{
      /**Initializes an empty edge-weighted digraph with {@code V} vertices and 0 edges.
       * @param  {number} V the number of vertices
       */
      constructor(V){
        //* @property {number} _V number of vertices in this digraph
        //* @property {number} _E number of edges in this digraph
        //* @property {array} adjls adj[v] = adjacency list for vertex v
        //* @property {array} _indegree  indegree[v] = indegree of vertex v
        if(V<0) throw Error("Number of vertices in a Digraph must be non-negative");
        this._V = V;
        this._E = 0;
        this._indegree = new Array(V);
        this.adjls = _.fill(V,()=> new Bag());
      }
      static randGraph(V, E){
        if (E<0) throw Error("n# edges in a Digraph must be non-negative");
        let g= new EdgeWeightedDigraph(V);
        for(let i=0; i<E; ++i)
          g.addEdge(new DirectedEdge(_.randInt(V),_.randInt(V), 0.01 * _randInt(100)));
        return g;
      }
      static load(V,data){
        if(V<0) throw Error("n# vertices in a Digraph must be non-negative");
        _.assert(data.length%3 ==0, "bad data length");
        let g= new EdgeWeightedDigraph(V);
        for(let i=0; i<data.length; i+=3){
          _chkVertex(data[i],V) &&
          _chkVertex(data[i+1],V) &&
          g.addEdge(new DirectedEdge(data[i],data[i+1],data[i+2]));
          //console.log(`d1=${data[i]}, d2=${data[i+1]}, d3=${data[i+2]}`);
        }
        return g;
      }
      clone(){
        let g=new EdgeWeightedDigraph(this.V());
        g._E = this.E();
        for(let v = 0; v < this.V(); ++v)
          g._indegree[v] = this._indegree(v);
        for(let r,v=0; v<this.V(); ++v){
          g.adjls[v]= this.adjls[v].clone();
        }
        return g;
      }
      /**Returns the number of vertices in this edge-weighted digraph.
       * @return {number}
       */
      V(){
        return this._V;
      }
      /**Returns the number of edges in this edge-weighted digraph.
       * @return {number}
       */
      E(){
        return this._E;
      }
      /**Adds the directed edge {@code e} to this edge-weighted digraph.
       * @param  {DirectedEdge} e the edge
       */
      addEdge(e){
        _.assert(e instanceof DirectedEdge,"Expected DirectedEdge");
        let w = e.to(),
            v = e.from();
        _chkVertex(v,this._V);
        _chkVertex(w,this._V);
        this.adjls[v].add(e);
        this._indegree[w]+=1;
        this._E++;
      }
      /**Returns the directed edges incident from vertex {@code v}.
       * @param  {number} v the vertex
       * @return {Bag}
       */
      adj(v){
        return _chkVertex(v,this._V) && this.adjls[v]
      }
      /**Returns the number of directed edges incident from vertex {@code v}.
       * This is known as the <em>outdegree</em> of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      outdegree(v){
        return _chkVertex(v,this._V) && this.adjls[v].size()
      }
      /**Returns the number of directed edges incident to vertex {@code v}.
       * This is known as the <em>indegree</em> of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      indegree(v){
        return _chkVertex(v,this._V) && this._indegree[v]
      }
      /**Returns all directed edges in this edge-weighted digraph.
       * To iterate over the edges in this edge-weighted digraph, use foreach notation:
       * {@code for (DirectedEdge e : G.edges())}.
       * @return {Iterator}
       */
      edges(){
        const list = new Bag();
        for(let v=0; v<this._V; ++v)
          for(let it= this.adj(v).iter(); it.hasNext();) list.add(it.next());
        return list.iter();
      }
      /**Returns a string representation of this edge-weighted digraph.
       * @return {string}
       */
      toString(){
        let s= `${this._V} ${this._E}\n`;
        for(let v=0; v<this._V; ++v){
          s+= `${v}: ` + prnIter(this.adjls[v].iter()) + "\n";
        }
        return s;
      }
      static test(){
        let data=
        `4 5 0.35
        5 4 0.35
        4 7 0.37
        5 7 0.28
        7 5 0.28
        5 1 0.32
        0 4 0.38
        0 2 0.26
        7 3 0.39
        1 3 0.29
        2 7 0.34
        6 2 0.40
        3 6 0.52
        6 0 0.58
        6 4 0.93`.split(/\s+/).map(n=>{return +n});
        let G = EdgeWeightedDigraph.load(8,data);
        console.log(G.toString());
      }
    }
    //EdgeWeightedDigraph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for determining depth-first search ordering of the vertices in a digraph
     *  or edge-weighted digraph, including preorder, postorder, and reverse postorder.
     *  <p>
     *  This implementation uses depth-first search.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DepthFirstOrder{
      /**Determines a depth-first order for the digraph {@code G}.
       * @param {Graph} G the digraph
       */
      constructor(G){
        //* @property {array} bMarked marked[v] = has v been marked in dfs?
        //* @property {array} _pre pre[v]    = preorder  number of v
        //* @property {array} _post post[v]   = postorder number of v
        //* @property {array} preorder vertices in preorder
        //* @property {array} postorder vertices in postorder
        //* @property {number} preCounter counter or preorder numbering
        //* @property {number} postCounter counter for postorder numbering
        this._pre= new Array(G.V());
        this._post = new Array(G.V());
        this.preCounter=0;
        this.postCounter=0;
        this.postorder = new Queue();
        this.preorder  = new Queue();
        this.bMarked= new Array(G.V());
        for(let v = 0; v < G.V(); v++)
          if(!this.bMarked[v]) this._dfs(G, v);
        this._check();
      }
      // run DFS in edge-weighted digraph G from vertex v and compute preorder/postorder
      // run DFS in digraph G from vertex v and compute preorder/postorder
      _dfs(G, v){
        this.bMarked[v] = true;
        this._pre[v] = this.preCounter++;
        this.preorder.enqueue(v);
        for(let w, it=G.adj(v).iter(); it.hasNext();){
          w= (G instanceof EdgeWeightedDigraph)? it.next().to() : it.next();
          if(!this.bMarked[w]) this._dfs(G, w);
        }
        this.postorder.enqueue(v);
        this._post[v] = this.postCounter++;
      }
      /**Returns the preorder number of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      pre(v){
        return _chkVertex(v,this.bMarked.length) && this._pre[v]
      }
      /**Returns the postorder number of vertex {@code v}.
       * @param  {number} v the vertex
       * @return {number}
       */
      post(v){
        return _chkVertex(v,this.bMarked.length) && this._post[v]
      }
      /**Returns the vertices in postorder.
       * @return {Iterator}
       */
      postOrder(){
        return this.postorder.iter()
      }
      /**Returns the vertices in preorder.
       * @return {Iterator}
       */
      preOrder(){
        return this.preorder.iter()
      }
      /**Returns the vertices in reverse postorder.
       * @return {Iterator}
       */
      reversePost(){
        let r= new Stack();
        for(let it= this.postorder.iter(); it.hasNext();){
          r.push(it.next())
        }
        return r.iter();
      }
      // check that pre() and post() are consistent with pre(v) and post(v)
      _check(){
        // check that post(v) is consistent with post()
        let it,r = 0;
        for(it= this.postOrder();it.hasNext();){
          if(this.post(it.next()) != r)
            throw Error("post(v) and post() inconsistent");
          ++r;
        }
        // check that pre(v) is consistent with pre()
        r=0;
        for(it=this.preOrder();it.hasNext();){
          if(this.pre(it.next()) != r)
            throw Error("pre(v) and pre() inconsistent");
          ++r;
        }
        return true;
      }
      static test(){
        let G = Digraph.load(13,
                             "2 3 0 6 0 1 2 0 11 12  9 12  9 10  9 11 3 5 8 7 5 4 0 5 6 4 6 9 7 6".split(/\s+/).map(n=>{return +n}));
        console.log(G.toString());
        let s,dfs = new DepthFirstOrder(G);
        console.log("   v  pre  post");
        console.log("--------------");
        for(let v=0; v<G.V(); ++v)
          console.log(`    ${v}  ${dfs.pre(v)}  ${dfs.post(v)}\n`);

        console.log("Preorder:  ");
        console.log(prnIter(dfs.preOrder()));

        console.log("Postorder:  ");
        console.log(prnIter(dfs.postOrder()));
        console.log("");

        console.log("Reverse postorder: ");
        console.log(prnIter(dfs.reversePost()));
      }
    }
    //DepthFirstOrder.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for
     *  determining whether an edge-weighted digraph has a directed cycle.
     *  The <em>hasCycle</em> operation determines whether the edge-weighted
     *  digraph has a directed cycle and, if so, the <em>cycle</em> operation
     *  returns one.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class EdgeWeightedDirectedCycle{
      /**Determines whether the edge-weighted digraph {@code G} has a directed cycle and,
       * if so, finds such a cycle.
       * @param {Graph} G the edge-weighted digraph
       */
      constructor(G){
        //* @property {array} bMarked marked[v] = has v been marked in dfs?
        //* @property {array} edgeTo  edgeTo[v] = previous edge on path to v
        //* @property {array} onStack onStack[v] = is vertex on the stack?
        //* @property {Stack} mCycle directed cycle (or null if no such cycle)
        _.assert(G instanceof EdgeWeightedDigraph,"Expected EdgeWeightedDigraph");
        this.bMarked  = new Array(G.V());
        this.onStack = new Array(G.V());
        this.edgeTo  = new Array(G.V());
        for(let v=0; v<G.V(); ++v)
          if(!this.bMarked[v]) this._dfs(G, v);
        this._check();
      }
      // check that algorithm computes either the topological order or finds a directed cycle
      _dfs(G, v){
        this.onStack[v] = true;
        this.bMarked[v] = true;
        for(let w,e,it=G.adj(v).iter();it.hasNext();){
          e=it.next();
          w= e.to();
          // short circuit if directed cycle found
          if(this.mCycle){return}
          // found new vertex, so recur
          if(!this.bMarked[w]){
            this.edgeTo[w] = e;
            this._dfs(G, w);
          }else if(this.onStack[w]){
            // trace back directed cycle
            this.mCycle = new Stack();
            let f = e;
            while(f.from() != w){
              this.mCycle.push(f);
              f = this.edgeTo[f.from()];
            }
            this.mCycle.push(f);
            return;
          }
        }
        this.onStack[v] = false;
      }
      /**Does the edge-weighted digraph have a directed cycle?
       * @return {boolean}
       */
      hasCycle(){
        return _.echt(this.mCycle)
      }
      /**Returns a directed cycle if the edge-weighted digraph has a directed cycle,
       * and {@code null} otherwise.
       * @return {Iterator}
       */
      cycle(){
        return this.mCycle && this.mCycle.iter()
      }
      // certify that digraph is either acyclic or has a directed cycle
      _check(){
        if(this.hasCycle()){// edge-weighted digraph is cyclic
          let first = UNDEF, last = UNDEF;
          for(let e, it=this.cycle(); it.hasNext();){
            e=it.next();
            if(!first) first = e;
            if(last){
              if(last.to() != e.from())
                throw Error(`cycle edges ${last} and ${e} not incident\n`);
            }
            last = e;
          }
          if(last.to() != first.from())
            throw Error(`cycle edges ${last} and ${first} not incident\n`);
        }
        return true;
      }
      static test(){
        // create random DAG with V vertices and E edges; then add F random edges
        let V = 13,E=8, F=6;
        let G = new EdgeWeightedDigraph(V);
        let vertices = _.shuffle(_.fill(V, (i)=> i));
        for(let wt,v,w,i=0; i<E; ++i){
          do{
            v = _.randInt(V);
            w = _.randInt(V);
          }while(v >= w);
          wt = _.rand();
          G.addEdge(new DirectedEdge(v, w, wt));
        }
        // add F extra edges
        for(let i=0; i<F; ++i){
          G.addEdge(new DirectedEdge(_.randInt(V),_.randInt(V),_.rand()));
        }
        console.log(G.toString());
        // find a directed cycle
        let s,finder = new EdgeWeightedDirectedCycle(G);
        if(finder.hasCycle()){
          console.log("Cycle: " + prnIter(finder.cycle()));
        }else{
          console.log("No directed cycle");
        }
      }
    }
    //EdgeWeightedDirectedCycle.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a digraph, where the
     *  vertex names are arbitrary strings.
     *  By providing mappings between string vertex names and integers,
     *  it serves as a wrapper around the
     *  {@link Digraph} data type, which assumes the vertex names are integers
     *  between 0 and <em>V</em> - 1.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class SymbolGraph{
      /**Initializes a graph from a file using the specified delimiter.
       * Each line in the file contains
       * the name of a vertex, followed by a list of the names
       * of the vertices adjacent to that vertex, separated by the delimiter.
       * @param {array} data 2D array of data
       */
      constructor(data){
        //* @property {ST} st string -> index
        //* @property {array} keys index  -> string
        //* @property {Graph} _graph the underlying digraph
        this.st = new ST();
        // First pass builds the index by reading strings to associate distinct strings with an index
        data.forEach(row=> row.forEach((s,i)=>{
          if(!this.st.contains(s)) this.st.put(s, this.st.size())
        }));
        //inverted index to get string keys in an array
        this.keys = new Array(this.st.size());
        for(let n,it= this.st.keys();it.hasNext();){
          n=it.next();
          this.keys[this.st.get(n)] = n;
        }
        // second pass builds the graph by connecting first vertex on each line to all others
        this._graph = new Graph(this.st.size());
        data.forEach(row=>{
          let v = this.st.get(row[0]);
          for(let w,i=1; i<row.length; ++i){
            w = this.st.get(row[i]);
            this._graph.addEdge(v, w);
          }
        })
      }
      /**Does the graph contain the vertex named {@code s}?
       * @param {number} s the name of a vertex
       * @return {boolean}
       */
      contains(s){
        return this.st.contains(s)
      }
      /**Returns the integer associated with the vertex named {@code s}.
       * @param {number} s the name of a vertex
       * @return {number}
       */
      indexOf(s){
        return this.st.get(s)
      }
      /**Returns the name of the vertex associated with the integer {@code v}.
       * @param  {number} v the integer corresponding to a vertex (between 0 and <em>V</em> - 1)
       * @return {number}
       */
      nameOf(v){
        return _chkVertex(v,this._graph.V()) && this.keys[v]
      }
      /**Returns the graph assoicated with the symbol graph. It is the client's responsibility
       * not to mutate the graph.
       * @return {Graph}
       */
      graph(){
        return this._graph;
      }
      static test(){
        let data=`JFK MCO
                  ORD DEN
                  ORD HOU
                  DFW PHX
                  JFK ATL
                  ORD DFW
                  ORD PHX
                  ATL HOU
                  DEN PHX
                  PHX LAX
                  JFK ORD
                  DEN LAS
                  DFW HOU
                  ORD ATL
                  LAS LAX
                  ATL MCO
                  HOU MCO
                  LAS PHX`.split(/\s+/);
        let sg = new SymbolGraph(_.partition(2,data));
        let graph = sg.graph();
        ["JFK","LAX"].forEach(k=>{
          if(sg.contains(k)){
            let s = sg.indexOf(k);
            console.log(k)
            for(let it= graph.adj(s).iter(); it.hasNext();)
              console.log("   " + sg.nameOf(it.next()));
          }else{
            console.log("input not contain '" + k + "'");
          }
        });
      }
    }
    //SymbolGraph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a digraph, where the
     *  vertex names are arbitrary strings.
     *  By providing mappings between string vertex names and integers,
     *  it serves as a wrapper around the
     *  {@link Digraph} data type, which assumes the vertex names are integers
     *  between 0 and <em>V</em> - 1.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class SymbolDigraph{
      /**Initializes a digraph from a file using the specified delimiter.
       * Each line in the file contains
       * the name of a vertex, followed by a list of the names
       * of the vertices adjacent to that vertex, separated by the delimiter.
       * @param filename the name of the file
       * @param delimiter the delimiter between fields
       */
      constructor(data){
        //* @property {ST} st string -> index
        //* @property {array} keys index  -> string
        //* @property {Digraph} graph the underlying digraph
        this.st = new ST();
        // First pass builds the index by reading strings to associate
        // distinct strings with an index
        data.forEach(row=> row.forEach(s=>{
          if(!this.st.contains(s))
            this.st.put(s, this.st.size())
        }));
        // inverted index to get string keys in an array
        this.keys = new Array(this.st.size());
        for(let n,it=this.st.keys();it.hasNext();){
          n=it.next();
          this.keys[this.st.get(n)] = n;
        }
        // second pass builds the digraph by connecting first vertex on each
        // line to all others
        this.graph = new Digraph(this.st.size());
        data.forEach(row=> {
          let v = this.st.get(row[0]);
          for(let i=1; i<row.length; ++i)
            this.graph.addEdge(v, this.st.get(row[i]));
        });
      }
      /**Does the digraph contain the vertex named {@code s}?
       * @param s the name of a vertex
       * @return {boolean}
       */
      contains(s){
        return this.st.contains(s)
      }
      /**Returns the integer associated with the vertex named {@code s}.
       * @param s {number} the name of a vertex
       * @return {number}
       */
      indexOf(s){
        return this.st.get(s);
      }
      /**Returns the name of the vertex associated with the integer {@code v}.
       * @param  {number} v the integer corresponding to a vertex (between 0 and <em>V</em> - 1)
       * @return {number} the name of the vertex associated with the integer {@code v}
       */
      nameOf(v){
        return _chkVertex(v, this.graph.V()) && this.keys[v]
      }
      /**Returns the digraph assoicated with the symbol graph. It is the client's responsibility
       * not to mutate the digraph.
       * @return {Digraph}
       */
      digraph(){
        return this.graph;
      }
      static test(){
        let s=`JFK MCO
              ORD DEN
              ORD HOU
              DFW PHX
              JFK ATL
              ORD DFW
              ORD PHX
              ATL HOU
              DEN PHX
              PHX LAX
              JFK ORD
              DEN LAS
              DFW HOU
              ORD ATL
              LAS LAX
              ATL MCO
              HOU MCO
              LAS PHX`.split(/\s+/);
        let sg = new SymbolDigraph(_.partition(2,s));
        let G = sg.digraph();
        ["JFK","ATL","LAX"].forEach(x=>{
          console.log(`${x}`);
          let z=G.adj(sg.indexOf(x)), it=z.iter();
          while(it.hasNext()){
            console.log("   " + sg.nameOf(it.next()));
          }
        });
      }
    }
    //SymbolDigraph.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for
     *  determining a topological order of a <em>directed acyclic graph</em> (DAG).
     *  A digraph has a topological order if and only if it is a DAG.
     *  The <em>hasOrder</em> operation determines whether the digraph has
     *  a topological order, and if so, the <em>order</em> operation
     *  returns one.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class Topological{
      /**Determines whether the digraph {@code G} has a topological order and, if so,
       * finds such a topological order.
       * @param {Graph} G the digraph
       */
      constructor(G){
        this._order=UNDEF;
        this.rank=UNDEF;
        let finder;
        if(G instanceof EdgeWeightedDigraph){
          finder = new EdgeWeightedDirectedCycle(G);
        }else if(G instanceof Digraph){
          finder = new DirectedCycle(G);
          if(!finder.hasCycle()) this.rank = new Array(G.V());
        }else{
          _.assert(false,"bad arg for Topological");
        }
        if(finder && !finder.hasCycle()){
          this._order=new Queue();
          for(let i=0,p,it=new DepthFirstOrder(G).reversePost();it.hasNext();){
            p=it.next();
            if(this.rank)
              this.rank[p] = i++;
            this._order.enqueue(p);
          }
        }
      }
      /**Returns a topological order if the digraph has a topologial order,
       * and {@code null} otherwise.
       * @return {Iterator}
       */
      order(){
        return this._order.iter();
      }
      /**Does the digraph have a topological order?
       * @return {boolean}
       */
      hasOrder(){
        return _.echt(this._order)
      }
      /**The the rank of vertex {@code v} in the topological order;
       * -1 if the digraph is not a DAG
       * @param {number} v the vertex
       * @return {number}
       */
      rank(v){
        return this.rank &&
               _chkVertex(v,this.rank.length) &&
               this.hasOrder()? this.rank[v] : -1;
      }
      static test(){
        let sg = new SymbolDigraph(
        [[`Algorithms`,`Theoretical CS`,`Databases`,`Scientific Computing`],
[`Introduction to CS`,`Advanced Programming`,`Algorithms`],
[`Advanced Programming`,`Scientific Computing`],
[`Scientific Computing`,`Computational Biology`],
[`Theoretical CS`,`Computational Biology`,`Artificial Intelligence`],
[`Linear Algebra`,`Theoretical CS`],
[`Calculus`,`Linear Algebra`],
[`Artificial Intelligence`,`Neural Networks`,`Robotics`,`Machine Learning`],
[`Machine Learning`,`Neural Networks`]]);
        let topological = new Topological(sg.digraph());
        for(let v,it=topological.order(); it.hasNext();){
          console.log(sg.nameOf(it.next()));
        }
      }
    }
    //Topological.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for solving the
     *  single-source shortest paths problem in edge-weighted digraphs
     *  where the edge weights are non-negative.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DepthFirstDirectedPaths{
      /**Computes a directed path from {@code s} to every other vertex in digraph {@code G}.
       * @param  {Graph} G the digraph
       * @param  {number} s the source vertex
       */
      constructor(G, s){
        //* @property {array} marked  marked[v] = true iff v is reachable from s
        //* @property {array} edgeTo  edgeTo[v] = last edge on path from s to v
        //* @property {number} s source vertex
        this.bMarked = new Array(G.V());
        this.edgeTo = new Array(G.V());
        this.s = s;
        _chkVertex(s,this.bMarked.length) && this._dfs(G, s);
      }
      _dfs(G, v){
        this.bMarked[v] = true;
        for(let w,it= G.adj(v).iter();it.hasNext();){
          w=it.next();
          if(!this.bMarked[w]){
            this.edgeTo[w] = v;
            this._dfs(G, w);
          }
        }
      }
      /**Is there a directed path from the source vertex {@code s} to vertex {@code v}?
       * @param  {number} v the vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      /**Returns a directed path from the source vertex {@code s} to vertex {@code v}, or
       * {@code null} if no such path.
       * @param  {number} v the vertex
       * @return {Iterator}
       */
      pathTo(v){
        if(_chkVertex(v,this.bMarked.length) && this.hasPathTo(v)){
          let path = new Stack();
          for(let x=v; x != this.s; x=this.edgeTo[x]) path.push(x);
          path.push(this.s);
          return path.iter();
        }
      }
      static test(){
        let D=`4  2 2  3 3  2 6  0 0  1 2  0 11 12 12  9 9 10
              9 11 7  9 10 12 11  4 4  3 3  5 6
              8 8  6 5  4 0  5 6  4 6  9 7  6`.split(/\s+/).map(n=>{return +n});
        let s=3,G = Digraph.load(13,D);
        let msg, dfs = new DepthFirstDirectedPaths(G, s);
        for(let v=0; v<G.V(); ++v){
          if(dfs.hasPathTo(v)){
            msg= `${s} to ${v}:  `;
            for(let x,it= dfs.pathTo(v);it.hasNext();){
              x=it.next();
              if(x==s) msg += `${x}`;
              else msg += `-${x}`;
            }
            console.log(msg);
          }else{
            console.log(`${s} to ${v}:  not connected`);
          }
        }
      }
    }
    //DepthFirstDirectedPaths.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for solving the
     *  single-source shortest paths problem in edge-weighted digraphs
     *  where the edge weights are non-negative.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class BreadthFirstDirectedPaths{
      /**Computes the shortest path from {@code s} and every other vertex in graph {@code G}.
       * @param {Graph} G the digraph
       * @param {number} s the source vertex
       */
      constructor(G, s){
        //* @property {array} marked marked[v] = is there an s->v path?
        //* @property {array} edgeTo edgeTo[v] = last edge on shortest s->v path
        //* @property {array} distTo distTo[v] = length of shortest s->v path
        if(!is.vec(s)) s= [s];
        this.bMarked = new Array(G.V());
        this.mDistTo = new Array(G.V());
        this.edgeTo = new Array(G.V());
        for(let v=0; v<G.V(); ++v)
          this.mDistTo[v] = Infinity;
        _chkVerts(s,G.V()) && this._bfs(G, s);
      }
      _bfs(G, sources){
        let q = new Queue();
        sources.forEach(s=>{
          this.bMarked[s] = true;
          this.mDistTo[s] = 0;
          q.enqueue(s);
        });
        while(!q.isEmpty()){
          let v=q.dequeue();
          for(let w, it= G.adj(v).iter();it.hasNext();){
            w=it.next();
            if(!this.bMarked[w]){
              this.edgeTo[w] = v;
              this.mDistTo[w] = this.mDistTo[v] + 1;
              this.bMarked[w] = true;
              q.enqueue(w);
            }
          }
        }
      }
      /**Is there a directed path from the source {@code s} (or sources) to vertex {@code v}?
       * @param {number} v the vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this.bMarked.length) && this.bMarked[v];
      }
      /**Returns the number of edges in a shortest path from the source {@code s}
       * (or sources) to vertex {@code v}?
       * @param {number} v the vertex
       * @return {number}
       */
      distTo(v){
        return _chkVertex(v,this.bMarked.length) && this.mDistTo[v];
      }
      /**Returns a shortest path from {@code s} (or sources) to {@code v}, or
       * {@code null} if no such path.
       * @param {number} v the vertex
       * @return {Iterator}
       */
      pathTo(v){
        if(_chkVertex(v,this.bMarked.length) && this.hasPathTo(v)){
          let x,path = new Stack();
          for(x = v; this.mDistTo[x] != 0; x = this.edgeTo[x]) path.push(x);
          path.push(x);
          return path.iter();
        }
      }
      static test(){
       let D=`4  2 2  3 3  2 6  0 0  1 2  0 11 12 12  9 9 10
              9 11 7  9 10 12 11  4 4  3 3  5 6
              8 8  6 5  4 0  5 6  4 6  9 7  6`.split(/\s+/).map(n=>{return +n});
        let s=3,G = Digraph.load(13,D);
        //console.log(G.toString());
        let msg,bfs = new BreadthFirstDirectedPaths(G,s);
        for(let v=0; v<G.V(); ++v){
          msg="";
          if(bfs.hasPathTo(v)){
            msg= `${s} to ${v} (${bfs.distTo(v)}):  `;
            for(let x,it= bfs.pathTo(v);it.hasNext();){
              x=it.next();
              if(x == s) msg+= `${x}`;
              else msg += `->${x}`;
            }
            console.log(msg);
          }else{
            console.log(`${s} to ${v} (-):  not connected`);
          }
        }
      }
    }
    //BreadthFirstDirectedPaths.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for solving the
     *  single-source shortest paths problem in edge-weighted digraphs
     *  where the edge weights are non-negative.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DijkstraSP{
      /**Computes a shortest-paths tree from the source vertex {@code s} to every other
       * vertex in the edge-weighted digraph {@code G}.
       * @param {Graph} G the edge-weighted digraph
       * @param {number} s the source vertex
       * @param {function} compareFn
       */
      constructor(G, s,compareFn){
        //* @property {array} distTo   distTo[v] = distance  of shortest s->v path
        //* @property {array} edgeTo   edgeTo[v] = last edge on shortest s->v path
        //* @property {IndexMinPQ} pq priority queue of vertices
        _.assert(G instanceof EdgeWeightedDigraph,"Expected EdgeWeightedDigraph");
        for(let e,it=G.edges();it.hasNext();){
          e=it.next();
          if(e.weight() < 0)
            throw Error(`edge ${e} has negative weight`);
        }
        this._distTo = new Array(G.V());
        this.edgeTo = _.fill(G.V(),null);
        _chkVertex(s, G.V());
        for(let v = 0; v < G.V(); ++v)
          this._distTo[v] = Infinity;
        this._distTo[s] = 0;
        // relax vertices in order of distance from s
        this.pq = new IndexMinPQ(G.V(),compareFn);
        this.pq.insert(s, this._distTo[s]);
        while(!this.pq.isEmpty()){
          let v = this.pq.delMin();
          for(let it=G.adj(v).iter(); it.hasNext();)
            this._relax(it.next());
        }
        // check optimality conditions
        this._check(G, s);
      }
      // relax edge e and update pq if changed
      _relax(e){
        let v = e.from(), w = e.to();
        if(this._distTo[w] > this._distTo[v] + e.weight()){
          this._distTo[w] = this._distTo[v] + e.weight();
          this.edgeTo[w] = e;
          if(this.pq.contains(w)) this.pq.decreaseKey(w, this._distTo[w]);
          else this.pq.insert(w, this._distTo[w]);
        }
      }
      /**Returns the length of a shortest path from the source vertex {@code s} to vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {number}
       */
      distTo(v){
        return _chkVertex(v,this._distTo.length) && this._distTo[v];
      }
      /**Returns true if there is a path from the source vertex {@code s} to vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this._distTo.length) && this._distTo[v] < Infinity;
      }
      /**Returns a shortest path from the source vertex {@code s} to vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {Iterator}
       */
      pathTo(v){
        if(_chkVertex(v,this._distTo.length) && this.hasPathTo(v)){
          let path = new Stack();
          for(let e = this.edgeTo[v]; e; e = this.edgeTo[e.from()])
            path.push(e);
          return path.iter();
        }
      }
      // check optimality conditions:
      // (i) for all edges e:            distTo[e.to()] <= distTo[e.from()] + e.weight()
      // (ii) for all edge e on the SPT: distTo[e.to()] == distTo[e.from()] + e.weight()
      _check(G, s){
        for(let e,it=G.edges();it.hasNext();){
          if(it.next().weight() < 0)
            throw Error("negative edge weight detected");
        }
        // check that distTo[v] and edgeTo[v] are consistent
        if(this._distTo[s] != 0 || this.edgeTo[s])
          throw Error("distTo[s] and edgeTo[s] inconsistent");
        ////
        for(let v=0; v<G.V(); ++v){
          if(v == s) continue;
          if(!this.edgeTo[v] && this._distTo[v] != Infinity)
            throw Error("distTo[] and edgeTo[] inconsistent");
        }
        // check that all edges e = v->w satisfy distTo[w] <= distTo[v] + e.weight()
        for(let v=0; v<G.V(); ++v){
          for(let w,e,it=G.adj(v).iter();it.hasNext();){
            e=it.next();
            w = e.to();
            if(this._distTo[v] + e.weight() < this._distTo[w])
              throw Error(`edge ${e} not relaxed`);
          }
        }
        // check that all edges e = v->w on SPT satisfy distTo[w] == distTo[v] + e.weight()
        for(let v,e,w=0; w<G.V(); ++w){
          if(!this.edgeTo[w]){}else{
            e = this.edgeTo[w];
            v = e.from();
            if(w != e.to()) throw Error("bad edge");
            if(this._distTo[v] + e.weight() != this._distTo[w])
              throw Error(`edge ${e} on shortest path not tight`);
          }
        }
        return true;
      }
      static test(){
        let data= `4 5 0.35
                  5 4 0.35
                  4 7 0.37
                  5 7 0.28
                  7 5 0.28
                  5 1 0.32
                  0 4 0.38
                  0 2 0.26
                  7 3 0.39
                  1 3 0.29
                  2 7 0.34
                  6 2 0.40
                  3 6 0.52
                  6 0 0.58
                  6 4 0.93`.split(/\s+/).map(n=>{return +n});
        let G = EdgeWeightedDigraph.load(8,data);
        //console.log(G.toString());
        let s=0,sp = new DijkstraSP(G, s,CMP);
        // print shortest path
        for(let t=0; t<G.V(); ++t){
          if(sp.hasPathTo(t)){
            console.log(`${s} to ${t} (${Number(sp.distTo(t)).toFixed(2)})  ${prnIter(sp.pathTo(t))}`);
          }else{
            console.log(`${s} to ${t}         no path\n`);
          }
        }
      }
    }
    //DijkstraSP.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function AStarGraphNode(V=0,par=null,g=0,h=0,f=0){
      return{
        parent: par, V, f, g, h,
        equals(o){ return o.V==this.V }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class AStarSP{
      constructor(G){
        _.assert(G instanceof EdgeWeightedGraph,"Expected EdgeWeightedGraph");
        this.G=G;
      }
      pathTo(start, end, ctx){
        return this._search(this.G,start,end,ctx)
      }
      _search(G,start,end,ctx){
        const CMP=ctx.compare,
              closedSet = new Map(),
              openTM= new Map(),
              openSet = new MinPQ(CMP,10),
              goalNode = AStarGraphNode(end),
              startNode = AStarGraphNode(start),
              rpath=(cn,out)=>{ for(;cn;cn=cn.parent) out.unshift(cn.V); return out; };
        openTM.set(startNode.V,startNode.g);
        openSet.insert(startNode);
        //begin...
        let cur,neighbors=[];
        while(!openSet.isEmpty()){
          cur= openSet.delMin();
          openTM.delete(cur.V);
          closedSet.set(cur.V,0);
          //done?
          if(cur.equals(goalNode)){return rpath(cur,[])}
          //check neigbors
          for(let co,f,g,h,w,it=G.adj(cur.V).iter(); it.hasNext();){
            w=it.next().other(cur.V);
            if(!closedSet.has(w)){
              g = cur.g + ctx.calcCost(w,cur.V);
              h = ctx.calcHeuristic(w,goalNode.V);
              f = g + h;
              //update if lower cost
              if(openTM.has(w) && g > openTM.get(w)){}else{
                openSet.insert(AStarGraphNode(w,cur,g,h,f));
                openTM.set(w, g);
              }
            }
          }
        }
      }
      static test(){
        let D=[0, 1, 111, 0, 2, 85, 1, 3, 104, 1, 4, 140, 1, 5, 183, 2, 3, 230, 2, 6, 67,
               6, 7, 191, 6, 4, 64, 3, 5, 171, 3, 8, 170, 3, 9, 220, 4, 5, 107, 7, 10, 91,
               7, 11, 85, 10, 11, 120, 11, 12, 184, 12, 5, 55, 12, 8, 115, 8, 5, 123,
               8, 9, 189, 8, 13, 59, 13, 14, 81, 9, 15, 102, 14, 15, 126];
        let G= EdgeWeightedGraph.load(16,D);
        let H = {};
        H['7'] = 204;
        H['10'] = 247;
        H['0'] = 215;
        H['6'] = 137;
        H['15'] = 318;
        H['2'] = 164;
        H['8'] = 120;
        H['12'] = 47;
        H['3'] = 132;
        H['9'] = 257;
        H['13'] = 168;
        H['4'] = 75;
        H['14'] = 236;
        H['1'] = 153;
        H['11'] = 157;
        H['5'] = 0;
        let ctx={
          compare(a,b){ return a.f-b.f },
          calcCost(test,cur){
            for(let e,it=G.adj(test).iter();it.hasNext();){
              e=it.next();
              if(e.other(test)==cur) return e.weight();
            }
            throw Error("Boom");
          },
          calcHeuristic(w,g){
            return H[w]
          }
        }
        let c,r,m,p= new AStarSP(G).pathTo(0,5,ctx);
        if(p){
          m=""; p.forEach(n=>{ m+= `[${n}] `; }); console.log(m);
        }else{
          console.log("no path");
        }
      }
    }
    //AStarSP.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Represents a data type for solving
     *  the single-source shortest paths problem in edge-weighted graphs
     *  where the edge weights are non-negative.
     * @memberof module:mcfud/algo_graph
     * @class
     */
    class DijkstraUndirectedSP{
      /**Computes a shortest-paths tree from the source vertex {@code s} to every
       * other vertex in the edge-weighted graph {@code G}.
       * @param {Graph} G the edge-weighted digraph
       * @param {number} s the source vertex
       * @param {function} compareFn
       */
      constructor(G, s,compareFn) {
        _.assert(G instanceof EdgeWeightedGraph,"Expected EdgeWeightedGraph");
        //distTo  distTo[v] = distance  of shortest s->v path
        //edgeTo  edgeTo[v] = last edge on shortest s->v path
        //pq     priority queue of vertices
        for(let e,it=G.edges();it.hasNext();){
          e=it.next();
          if(e.weight()<0)
            throw new Error(`edge ${e} has negative weight`);
        }
        this._distTo = _.fill(G.V(),()=> Infinity);
        this._distTo[s] = 0;
        this.compare=compareFn;
        this.edgeTo = _.fill(G.V(), ()=> null);
        _chkVertex(s,G.V());
        // relax vertices in order of distance from s
        this.pq = new IndexMinPQ(G.V(),this.compare);
        this.pq.insert(s, this._distTo[s]);
        while(!this.pq.isEmpty()){
          let v = this.pq.delMin();
          for(let it=G.adj(v).iter(); it.hasNext();) this._relax(it.next(), v);
        }
        // check optimality conditions
        this._check(G, s);
      }
      // relax edge e and update pq if changed
      _relax(e, v){
        let w = e.other(v);
        if(this._distTo[w] > this._distTo[v] + e.weight()) {
          this._distTo[w] = this._distTo[v] + e.weight();
          this.edgeTo[w] = e;
          if(this.pq.contains(w)) this.pq.decreaseKey(w, this._distTo[w]);
          else this.pq.insert(w, this._distTo[w]);
        }
      }
      /**Returns the length of a shortest path between the source vertex {@code s} and
       * vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {number}
       */
      distTo(v){
        return _chkVertex(v,this._distTo.length) && this._distTo[v]
      }
      /**Returns true if there is a path between the source vertex {@code s} and
       * vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {boolean}
       */
      hasPathTo(v){
        return _chkVertex(v,this._distTo.length) && this._distTo[v] < Infinity
      }
      /**Returns a shortest path between the source vertex {@code s} and vertex {@code v}.
       * @param  {number} v the destination vertex
       * @return {Iterator}
       */
      pathTo(v){
        if(_chkVertex(v,this._distTo.length) && this.hasPathTo(v)){
          let x=v,path = new Stack();
          for(let e = this.edgeTo[v]; e; e = this.edgeTo[x]){
            path.push(e);
            x = e.other(x);
          }
          return path.iter();
        }
      }
      // check optimality conditions:
      // (i) for all edges e = v-w:            distTo[w] <= distTo[v] + e.weight()
      // (ii) for all edge e = v-w on the SPT: distTo[w] == distTo[v] + e.weight()
      _check(G, s){
        // check that edge weights are non-negative
        for(let it=G.edges();it.hasNext();){
          if(it.next().weight() < 0)
            throw Error("negative edge weight detected");
        }
        // check that distTo[v] and edgeTo[v] are consistent
        if(this._distTo[s] != 0 || this.edgeTo[s]){
          throw Error("distTo[s] and edgeTo[s] inconsistent");
        }
        for(let v=0; v<G.V(); ++v){
          if(v == s) continue;
          if(!this.edgeTo[v] &&
             this._distTo[v] != Infinity){
            throw Error("distTo[] and edgeTo[] inconsistent");
          }
        }
        // check that all edges e = v-w satisfy distTo[w] <= distTo[v] + e.weight()
        for(let v=0; v<G.V(); ++v){
          for(let w,e,it=G.adj(v).iter();it.hasNext();){
            e=it.next();
            w = e.other(v);
            if(this._distTo[v] + e.weight() < this._distTo[w]){
              throw Error(`edge ${e} not relaxed`);
            }
          }
        }
        // check that all edges e = v-w on SPT satisfy distTo[w] == distTo[v] + e.weight()
        for(let v,e,w=0; w<G.V(); ++w){
          if(!this.edgeTo[w]) continue;
          e = this.edgeTo[w];
          if(w != e.either() && w != e.other(e.either())) return false;
          v = e.other(w);
          if(this._distTo[v] + e.weight() != this._distTo[w]) {
            throw Error(`edge ${e} on shortest path not tight`);
          }
        }
        return true;
      }
      static test(){
        let data=`4 5 0.35 4 7 0.37 5 7 0.28 0 7 0.16 1 5 0.32 0 4 0.38
                  2 3 0.17 1 7 0.19 0 2 0.26 1 2 0.36 1 3 0.29 2 7 0.34
                  6 2 0.40 3 6 0.52 6 0 0.58 6 4 0.93`.split(/\s+/).map(n=>{return +n});
        let s=6,G = EdgeWeightedGraph.load(8,data);
        let sp = new DijkstraUndirectedSP(G, s,CMP);
        for(let m,t=0; t<G.V(); ++t){
          if(sp.hasPathTo(t)){
            m= `${s} to ${t} (${Number(sp.distTo(t)).toFixed(2)})  `;
            for(let it= sp.pathTo(t);it.hasNext();){
              m += `${it.next()}   `;
            }
            console.log(m);
          }else{
            console.log(`${s} to ${t}         no path`);
          }
        }
      }
    }
    //DijkstraUndirectedSP.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      DepthFirstDirectedPaths,
      BreadthFirstDirectedPaths,
      SymbolGraph,
      DijkstraUndirectedSP,
      DijkstraSP,
      Topological,
      SymbolDigraph,
      EdgeWeightedDirectedCycle,
      DepthFirstOrder,
      EdgeWeightedDigraph,
      DirectedEdge,
      DirectedCycle,
      DirectedDFS,
      Digraph,
      CC,
      EdgeWeightedGraph,
      Edge,
      BreadthFirstPaths,
      DepthFirstPaths,
      NonrecursiveDFS,
      DepthFirstSearch,
      Graph
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"),
                           require("../main/math"),
                           require("./basic"), require("./sort"))
  }else{
    gscope["io/czlab/mcfud/algo/graph"]=_module
  }

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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

	"use strict";

	/**Create the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const int=Math.floor;
    const {u:_, is}= Core;

		/**
     * @module mcfud/algo/NNetGA
     */

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const Params={

			mutationRate: 0.1,
			crossOverRate: 0.7,
			probTournament: 0.75,

      NUM_HIDDEN: 1,
      BIAS:-1,
      NUM_ELITE:4,
      TOURNAMENT_SIZE :5,
      MAX_PERTURBATION: 0.3,
      ACTIVATION_RESPONSE: 1,
      NEURONS_PER_HIDDEN: 10

    };

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**Fitness Interface.
		 * @class
		 */
		class Fitness{
			/**
			 */
			constructor(){}
			/**
			 * @param {Fitness} x
			 * @return {boolean}
			 */
			gt(x){}
			/**
			 * @param {Fitness} x
			 * @return {boolean}
			 */
			lt(x){}
			/**
			 * @param {Fitness} x
			 * @return {boolean}
			 */
			eq(x){}
			/**
			 * @return {Fitness}
			 */
			clone(){}
			/**
			 * @return {number}
			 */
			score(){}
			/**
			 * @param {any} n
			 */
			update(n){}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**Numeric fitness.
		 * @class
		 */
		class NumFitness extends Fitness{
			/**
			 * @param {number} v
			 * @param {boolean} flip default false
			 */
			constructor(v,flip){
				super();
				this.value=v;
				this.flip=flip;
			}
			/**
			 * @param {NumFitness} b
			 * @return {boolean}
			 */
			gt(b){
				return this.flip? this.value < b.value: this.value > b.value
			}
			/**
			 * @param {NumFitness} b
			 * @return {boolean}
			 */
			eq(b){
				return this.value==b.value
			}
			/**
			 * @param {NumFitness} b
			 * @return {boolean}
			 */
			lt(b){
				return this.flip? this.value > b.value: this.value < b.value
			}
			/**
			 * @return {number}
			 */
			score(){
				return this.value
			}
			/**
			 * @param {number} n
			 */
			update(n){
				this.value=n
			}
			/**
			 * @return {NumFitness}
			 */
			clone(){
				return new NumFitness(this.value, this.flip);
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**
		 * @property {number} averageScore
		 * @property {number} totalScore
		 * @property {number} bestScore
		 * @property {number} worstScore
		 * @property {object} best
		 */
		class Statistics{
			/**
			 */
			constructor(){
				this.averageScore=0;
				this.totalScore=0;
				this.bestScore=0;
				this.worstScore=0;
				this.best=UNDEF;
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**
		 * @property {number} numInputs
		 * @property {number} activation
		 * @property {number} error
		 * @property {number[]} weights
		 */
		class Neuron{
			/**
			 * @param {number} inputs
			 */
			constructor(inputs){
				//we need an additional weight for the bias hence the +1
				const ws= _.fill(inputs+1, ()=> _.randMinus1To1());
				this.numInputs= ws.length;
				this.activation=0;
				this.weights=ws;
				this.error=0;
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**
		 * @property {number} numNeurons
		 * @property {Neuron[]} neurons
		 */
		class NeuronLayer{
			/**
			 * @param {number} numNeurons
			 * @param {number} numInputsPerNeuron
			 */
			constructor(numNeurons, numInputsPerNeuron){
				this.numNeurons=numNeurons;
				this.neurons= _.fill(numNeurons,()=> new Neuron(numInputsPerNeuron));
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**
		 * @class
		 */
		class NeuralNet{
			/**
			 * @param {number} inputs
			 * @param {number} outputs
			 * @param {number} numHidden
			 * @param {number} neuronsPerHidden
			 */
			constructor(inputs, outputs, numHidden, neuronsPerHidden){
				//create the layers of the network
				this.layers=(function(out){
					if(numHidden>0){
						out.push(new NeuronLayer(neuronsPerHidden, inputs));
						for(let i=0; i<numHidden-1; ++i)
							out.push(new NeuronLayer(neuronsPerHidden,neuronsPerHidden));
					}
					return _.conj(out,new NeuronLayer(outputs, numHidden>0?neuronsPerHidden:inputs));
				})([]);

				this.numOfWeights=this.layers.reduce((sum,y)=>{
					return sum + y.neurons.reduce((acc,u)=>{
						return acc+u.weights.length
					},0)
				},0);

				this.numOutputs=outputs;
				this.numInputs=inputs;
				this.numHidden=numHidden;
				this.neuronsPerHidden=neuronsPerHidden;
			}
			/**
			 * @param {number[]} weights
			 */
			putWeights(weights){
				_.assert(weights.length>=this.numOfWeights,"bad input to putWeights");
				let pos=0;
				this.layers.forEach(y=> y.neurons.forEach(u=> u.weights.forEach((v,i)=> u.weights[i]= weights[pos++])))
			}
			/**
			 * @return {number[]}
			 */
			getWeights(){
				const out=[];
				for(let i=0; i<this.numHidden+1; ++i)
					for(let j=0; j<this.layers[i].numNeurons; ++j)
						for(let k=0; k<this.layers[i].neurons[j].numInputs; ++k){
							out.push(this.layers[i].neurons[j].weights[k])
						}
				return out;
			}
			/**
			 * @return {number}
			 */
			getNumberOfWeights(){
				return this.numOfWeights
			}
			/**Same as update.
			 * @param {number[]}
			 * @return {number[]}
			 */
			feedForward(inputs){
				return this.update(inputs)
			}
			/**
			 * @param {number[]} inputs
			 * @return {number[]}
			 */
			update(inputs){
				_.assert(inputs.length >= this.numInputs,"invalid input size");
				let sum,nodes,idx, out=[];
				this.layers.forEach((y,i)=>{
					if(i>0)
						inputs=out;
					out=[];
					y.neurons.forEach(u=>{
						idx=0;
						sum=0;
						nodes=u.numInputs;
						//skip the bias hence -1
						for(let k=0;k<nodes-1;++k)
							sum += (u.weights[k] * inputs[idx++]);
						sum += (u.weights[nodes-1] * Params.BIAS);
						out.push(u.activation= this.sigmoid(sum, Params.ACTIVATION_RESPONSE));
					});
				});
				return _.assert(out.length== this.numOutputs, "out length incorrect") ? out : [];
			}
			/**
			 * @private
			 */
			sigmoid(input, response){
				return 1 / (1 + Math.exp(-input / response))
			}
			/**
			 * @return {number[]}
			 */
			calcSplitPoints(){
				let pts= [],
						pos = 0;
				this.layers.forEach(y=> y.neurons.forEach(u=>{
					pos += u.numInputs;
					pts.push(pos-1);
				}));
				return pts;
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		/**
		 * @property {number} age
		 * @property {any[]} genes
		 * @property {Fitness} fitness
		 */
		class Chromosome{
			/**
			 * @param {any[]} genes
			 * @param {Fitness} fitness
			 */
			constructor(genes, fitness){
				this.fitness=fitness;
				this.genes=genes;
				this.age=0;
			}
			/**
			 * @return {Chromosome}
			 */
			clone(){
				return new Chromosome(this.genes.slice(),this.fitness.clone())
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function randSpan(genes){
			let a= _.randInt(genes.length),
					b= _.randInt(genes.length);
			return a<b ? [a,b] : [b,a];
		}

		/**Choose two random points and “scramble” the genes located between them.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} genes
		 */
		function mutateSM(genes){
			if(_.rand() < Params.mutationRate){
				let [beg, end] = randSpan(genes);
				let tmp,count= end-beg-1;
				if(count==2){
					tmp=genes[beg+1];
					genes[beg+1]=genes[beg+2];
					genes[beg+2]=tmp;
				}else if(count>2){
					tmp=_.shuffle(genes.slice(beg+1,end));
					for(let k=0,i=beg+1;i<end;++i){
						genes[i]=tmp[k++]
					}
				}
			}
		}

		/**Select two random points, grab the chunk of chromosome
		 * between them and then insert it back into the chromosome
		 * in a random position displaced from the original.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} genes
		 */
		function mutateDM(genes){
			if(_.rand() < Params.mutationRate){
				let [beg, end]= randSpan(genes);
				let p,tmp,rem,
						N=genes.length,count= end-beg-1;
				if(count>0){
					tmp=genes.slice(beg+1,end);
					rem=genes.slice(0,beg+1).concat(genes.slice(end));
					p=_.randInt(rem.length);
					tmp=rem.slice(0,p).concat(tmp).concat(rem.slice(p));
					genes.length=0;
					tmp.forEach(v=> genes.push(v));
					_.assert(genes.length==N,"mutateDM error");
				}
			}
		}

		/**Almost the same as the DM operator, except here only one gene is selected
		 * to be displaced and inserted back into the chromosome.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} genes
		 */
		function mutateIM(genes){
			if(_.rand() < Params.mutationRate){
				//choose a gene to move
				let pos=_.randInt(genes.length),
						left,right,N=genes.length,v = genes[pos];
				//remove from the chromosome
				genes.splice(pos,1);
				//move the iterator to the insertion location
				pos = _.randInt(genes.length);
				left=genes.slice(0,pos);
				right=genes.slice(pos);
				genes.length=0;
				left.forEach(n=> genes.push(n));
				genes.push(v);
				right.forEach(n=> genes.push(n));
				_.assert(N==genes.length,"mutateIM error");
			}
		}

		/**Select two random points and reverse the genes between them.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} genes
		 */
		function mutateIVM(genes){
			if(_.rand()<Params.mutationRate){
				let [beg, end]= randSpan(genes);
				let tmp,N=genes.length,count= end-beg-1;
				if(count>1){
					tmp=genes.slice(beg+1,end).reverse();
					for(let k=0, i=beg+1;i<end;++i){
						genes[i]=tmp[k++];
					}
				}
				_.assert(N==genes.length,"mutateIVM error");
			}
		}

		/**Select two random points, reverse the order between the two points,
		 * and then displace them somewhere along the length of the original chromosome.
		 * This is similar to performing IVM and then DM using the same start and end points.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} genes
		 */
		function mutateDIVM(genes){
			if(_.rand()<Params.mutationRate){
				let [beg, end]= randSpan(genes);
				let N=genes.length,
						p,tmp,rem,count= end-beg-1;
				if(count>0){
					tmp=genes.slice(beg+1,end).reverse();
					rem=genes.slice(0,beg+1).concat(genes.slice(end));
					p=_.randInt(rem.length);
					tmp=rem.slice(0,p).concat(tmp).concat(rem.slice(p));
					genes.length=0;
					tmp.forEach(v=> genes.push(v));
					_.assert(genes.length==N,"mutateDIVM error");
				}
			}
		}

		/**Several genes are chosen at random from one parent and
		 * then the order of those selections is imposed on
		 * the respective genes in the other parent.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} mum
		 * @param {any[]} dad
		 * @return {array}
		 */
		function crossOverOBX(mum,dad){
			let temp, positions,
					b1,b2,cpos, pos = _.randInt2(0, mum.length-2);
			b1 = mum.slice();
			b2 = dad.slice();
			if(_.rand() > Params.crossOverRate || mum === dad){}else{
				positions=_.listIndexesOf(mum,true).slice(0, _.toGoldenRatio(mum.length)[1]).sort();
				temp=positions.map(p=> mum[p]);
				//so now we have n amount of genes from mum in the temp
				//we can impose their order in dad.
				cpos = 0;
				for(let cit=0; cit<b2.length; ++cit){
					for(let i=0; i<temp.length; ++i){
						if(b2[cit]==temp[i]){
						 b2[cit] = temp[cpos++];
						 break;
						}
					}
				}
				//now vice versa
				temp.length=0;
				cpos = 0;
				//first grab from the same positions in dad
				for(let i=0; i<positions.length; ++i){
					temp.push(dad[positions[i]])
				}
				//and impose their order in mum
				for(let cit=0; cit<b1.length; ++cit){
					for(let i=0; i<temp.length; ++i){
						if(b1[cit]==temp[i]){
							b1[cit] = temp[cpos++];
							break;
						}
					}
				}
			}
			return [b1, b2];
		}

		/**Similar to Order-Based CrossOver, but instead of imposing the order of the genes,
		 * this imposes the position.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} mum
		 * @param {array} dad
		 * @return {array}
		 */
		function crossOverPBX(mum, dad){
			let b1,b2;
			if(_.rand() > Params.crossOverRate || mum === dad){
				b1 = mum.slice();
				b2 = dad.slice();
			}else{
				//initialize the babies with null values so we can tell which positions
				//have been filled later in the algorithm
				b1=_.fill(mum.length, null);
				b2=_.fill(mum.length, null);
				let positions=_.listIndexesOf(mum,true).slice(0, _.toGoldenRatio(mum.length)[1]).sort();
				//now we have chosen some cities it's time to copy the selected cities
				//over into the offspring in the same position.
				positions.forEach(i=>{
					b1[i] = mum[i];
					b2[i] = dad[i];
				});
				//fill in the blanks. First create two position markers so we know
				//whereabouts we are in b1 and b2
				let c1=0, c2=0;
				for(let i=0; i<mum.length; ++i){
					//advance position marker until we reach a free position in b2
					while(b2[c2] !==null && c2 < mum.length){ ++c2 }
					//b2 gets the next from mum which is not already present
					if(b2.indexOf(mum[i])<0){
						b2[c2] = mum[i]
					}
					//now do the same for baby1
					while(b1[c1] !==null && c1 < mum.length){ ++c1 }
					//b1 gets the next from dad which is not already present
					if(b1.indexOf(dad[i])<0){
						b1[c1] = dad[i]
					}
				}
				_.assert(!b1.some(x=> x===null), "crossOverPBX null error");
				_.assert(!b2.some(x=> x===null), "crossOverPBX null error");
			}
			return [b1,b2];
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} mum
		 * @param {array} dad
		 * @return {array}
		 */
		function crossOverRND(mum,dad){
			let b1,b2;
			if(_.rand() > Params.crossOverRate || mum===dad){
				b1 = mum.slice();
				b2 = dad.slice();
			}else{
				let cp = _.randInt(mum.length);
				b1=[];
				b2=[];
				for(let i=0; i<cp; ++i){
					b1.push(mum[i]);
					b2.push(dad[i]);
				}
				for(let i=cp; i<mum.length; ++i){
					b1.push(dad[i]);
					b2.push(mum[i]);
				}
			}
			return [b1,b2];
		}

		/**Partially matched crossover.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {any[]} mum
		 * @param {any[]} dad
		 * @return {array}
		 */
		function crossOverPMX(mum, dad){
			let b1 = mum.slice(),
					b2 = dad.slice();
			if(_.rand() > Params.crossOverRate || mum === dad){}else{
				//first we choose a section of the chromosome
				let beg = _.randInt2(0, mum.length-2);
				let end = beg;
				while(end <= beg)
					end = _.randInt2(0, mum.length-1);
				//now we iterate through the matched pairs of genes from beg
				//to end swapping the places in each child
				for(let p1,p2,g1,g2,pos=beg; pos<end+1; ++pos){
					//these are the genes we want to swap
					g1 = mum[pos];
					g2 = dad[pos];
					if(g1 != g2){
						//find and swap them in b1
						p1 = b1.indexOf(g1);
						p2 = b1.indexOf(g2);
						_.swap(b1, p1,p2);
						//and in b2
						p1 = b2.indexOf(g1);
						p2 = b2.indexOf(g2);
						_.swap(b2, p1,p2);
					}
				}
			}
			return [b1,b2];
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} mum
		 * @param {array} dad
		 * @param {array} splitPoints
		 * @return {array}
		 */
		function crossOverAtSplits(mum, dad, splitPoints){
			let b1, b2;
			if(_.rand() > Params.crossOverRate || mum === dad){
				b1=mum.slice();
				b2=dad.slice();
			}else{
				//determine two crossover points
				let cp1 = splitPoints[_.randInt2(0, splitPoints.length-2)],
						cp2 = splitPoints[_.randInt2(cp1, splitPoints.length-1)];
				b1=[];
				b2=[];
				//create the offspring
				for(let i=0; i<mum.length; ++i){
					if(i<cp1 || i>=cp2){
						//keep the same genes if outside of crossover points
						b1.push(mum[i]);
						b2.push(dad[i]);
					}else{
						//switch over the belly block
						b1.push(dad[i]);
						b2.push(mum[i]);
					}
				}
			}
			return [b1,b2];
		}

		/**Roulette selection.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop
		 * @param {number} totalScore
		 * @return {Chromosome}
		 */
		function getChromoRoulette(pop, totalScore){
			let hit, sum = 0, slice = _.rand() * totalScore;
			for(let i=0; i<pop.length; ++i){
				sum += pop[i].fitness.score();
				//if the fitness so far > random number return the chromo at
				//this point
				if(sum >= slice){
					hit = pop[i];
					break;
				}
			}
			return hit;
		}

		/**Roulette selection with probabilities.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop
		 * @param {number} totalScore
		 * @return {Chromosome}
		 */
		function chromoRoulette(pop,totalScore){
			let i,prev=0,R=_.rand();
			let ps=pop.map(p=>{ return prev= (prev+ p.fitness.score()/totalScore) });
			for(i=0;i<ps.length-1;++i)
				if(R >= ps[i] && R <= ps[i+1]) return pop[i]
			return pop[0];
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop
		 * @param {number} N
		 * @return {Chromosome}
		 */
		function tournamentSelectionN(pop,N){
			let chosenOne = 0,
					bestSoFar = NumFitness(-Infinity);
			//Select N members from the population at random testing against
			//the best found so far
			for(let i=0; i<N; ++i){
				let thisTry = _.randInt(pop.length);
				if(pop[thisTry].fitness.gt(bestSoFar)){
					chosenOne = thisTry;
					bestSoFar = pop[thisTry].fitness;
				}
			}
			return pop[chosenOne];
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop current generation
		 * @return {Chromosome}
		 */
		function tournamentSelection(pop){
			let g1 = _.randInt(pop.length),
					g2 = _.randInt(pop.length);
			//make sure they are different
			while(g1 == g2)
				g2 = _.randInt2(0,pop.length-1);
			if(_.rand() < Params.probTournament){
				return pop[g1].fitness.gt(pop[g2].fitness)? pop[g1] : pop[g2]
			}else{
				return pop[g1].fitness.lt(pop[g2].fitness)? pop[g1] : pop[g2]
			}
		}

		/**Calculate statistics on population based on scores.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop current generation
		 * @param {boolean} flip true if smaller score is better
		 * @return {Statistics}
		 */
		function calcStats(pop,flip){
			let best= 0,
					worst= Infinity,
					stats=new Statistics();
			if(flip){ worst=0; best=Infinity; }
			function B(c){
				best = c.fitness.score();
				stats.bestScore = best;
				stats.best= c;
			}
			function W(c){
				worst = c.fitness.score();
				stats.worstScore = worst;
			}
			pop.forEach(c=>{
				if(flip){
					if(c.fitness.score() < best){
						B(c)
					}else if(c.fitness.score() > worst){
						W(c)
					}
				}else{
					if(c.fitness.score() > best){
						B(c)
					}else if(c.fitness.score() < worst){
						W(c)
					}
				}
				stats.totalScore += c.fitness.score();
			});
			stats.averageScore = stats.totalScore / pop.length;
			return stats;
		}

		/**This type of fitness scaling sorts the population into ascending
		 * order of fitness and then simply assigns a fitness score based on
		 * its position in the ladder.
		 * (so if a genome ends up last it gets score of zero,
		 * if best then it gets a score equal to the size of the population.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop current generation
		 * @return {Statistics}
		 */
		function fitnessScaleRank(pop){
			//sort population into ascending order
			pop.sort((a,b)=>{
				return a.fitness.lt(b.fitness)?-1:(
					a.fitness.gt(b.fitness)?1:0
				)
			});
			//now assign fitness according to the genome's position on
			//this new fitness 'ladder'
			pop.forEach((p,i)=> p.fitness.update(i));
			//recalculate values used in selection
			return calcStats(pop);
		}

		/**Scales the fitness using sigma scaling.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop current generation
		 * @param {Statistics} stats
		 * @return {array} [sigma, new_stats]
		 */
		function fitnessScaleSigma(pop, stats){
			let i,total = 0;
			//first iterate through the population to calculate the standard deviation
			for(i=0; i<pop.length; ++i){
				total += (pop[i].fitness.score() - stats.averageScore) *
								 (pop[i].fitness.score() - stats.averageScore);
			}
			let old,variance = total/pop.length;
			//standard deviation is the square root of the variance
			let sigma = Math.sqrt(variance);
			//now iterate through the population to reassign the fitness scores
			pop.forEach(p=>{
				old= p.fitness.score();
				p.fitness.update((old-stats.averageScore)/(2*sigma));
			});
			return [sigma, calcStats(pop)];
		}

		/**Applies Boltzmann scaling to a populations fitness scores
		 * The static value Temp is the boltzmann temperature which is
		 * reduced each generation by a small amount.
		 * As Temp decreases the difference spread between the high and
		 * low fitnesses increases.
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {array} pop current generation
		 * @param {number} boltzmannTemp
		 * @return {array} [boltzmannTemp, new_stats]
		 */
		function fitnessScaleBoltzmann(pop, boltzmannTemp){
			//reduce the temp a little each generation
			boltzmannTemp -= Parmas.BOLTZMANN_DT;
			//make sure it doesn't fall below minimum value
			if(boltzmannTemp< Parmas.MIN_TEMP) boltzmannTemp = Parmas.MIN_TEMP;
			//iterate through the population to find the average e^(fitness/temp)
			//keep a record of e^(fitness/temp) for each individual
			let expBoltz=[],
					i,average = 0;
			pop.forEach((p,i)=>{
				expBoltz.push(Math.exp(p.fitness.score() / boltzmannTemp));
				average += expBoltz[i];
			});
			average /= pop.length;
			//now iterate once more to calculate the new expected values
			pop.forEach((p,i)=> p.fitness.update(expBoltz[i]/average));
			//recalculate values used in selection
			return [boltzmannTemp, calcStats(pop)];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function markStart(extra,fld="cycles"){
			let s= extra.startTime=_.now();
			extra[fld]=0;
			return s;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function markEnd(extra){
			return extra.endTime=_.now();
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function newChild(p1, parents, crossOver, mutate, calcFit){
      let p2= _.randInt(parents.length);
			while(parents.length>1 && p2==p1){
				p2= _.randInt(parents.length)
			}
			let c1=parents[p1].genes,
					c,b1,b2,c2=parents[p2].genes;
			if(crossOver){
				[b1,b2]=crossOver(c1,c2);
			}else{
				b1=c1.slice();
				b2=c2.slice();
			}
      if(mutate){
        mutate(b1);
				mutate(b2);
      }
			let f1= calcFit(b1, parents[p1].fitness),
					f2= calcFit(b2, parents[p2].fitness);
			return f1.gt(f2)? new Chromosome(b1, f1): new Chromosome(b2, f2);
    }

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function bisectLeft(arr,e){
			//ascending array
      let a,i=0;
      for(;i<arr.length;++i){
        a=arr[i];
        if(a.fitness.eq(e.fitness) ||
           e.fitness.lt(a.fitness)) break;
      }
      return i;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function* getNextStar([start,maxMillis],{
			mutate,create,maxAge,
			calcFit,poolSize,crossOver
		})
		{
			let par, bestPar = create();
      yield bestPar;
      let parents = [bestPar],
          history = [bestPar],
          ratio,child,index,pindex,lastParIndex;
			poolSize=poolSize || 1;
			maxAge= maxAge || 50;
      for(let i=0;i<poolSize-1;++i){
        par = create();
        if(par.fitness.gt(bestPar.fitness)){
          yield (bestPar = par);
          history.push(par);
        }
        parents.push(par);
      }
      lastParIndex = poolSize - 1;
      pindex = 1;
      while(true){
				if(_.now()-start > maxMillis) yield bestPar;
        pindex = pindex>0? pindex-1 : lastParIndex;
        par = parents[pindex];
        child = newChild(pindex, parents, crossOver, mutate, calcFit);
        if(par.fitness.gt(child.fitness)){
          if(maxAge===undefined){ continue }
          par.age += 1;
					if(maxAge > par.age){ continue }
          index = bisectLeft(history, child, 0, history.length);
          ratio= index / history.length;
          if(_.rand() < Math.exp(-ratio)){
            parents[pindex] = child;
            continue;
          }
          bestPar.age = 0;
          parents[pindex] = bestPar;
          continue;
        }
        if(!child.fitness.gt(par.fitness)){
          //same fitness
          child.age = par.age + 1;
          parents[pindex] = child;
          continue;
        }
				//child is better, so replace the parent
				child.age = 0;
				parents[pindex] = child;
				//replace best too?
        if(child.fitness.gt(bestPar.fitness)){
          yield (bestPar = child);
          history.push(bestPar);
				}
      }
    }

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {Fitness} optimal
		 * @param {object} extra
		 * @return {array}
		 */
		function runGASearch(optimal,extra){
			let start= markStart(extra),
					maxCycles=(extra.maxCycles|| 100),
					maxMillis= (extra.maxSeconds || 30) * 1000,
					imp, now, gen= getNextStar([start,maxMillis],extra);
			while(true){
				imp= gen.next().value;
				now= markEnd(extra);
				if(now-start > maxMillis){
					now=null;
					break;
				}
				if(!optimal.gt(imp.fitness)){
					break;
				}
				if(extra.cycles >= maxCycles){
					break;
				}
				extra.cycles += 1;
				//console.log(imp.genes.join(","));
			}
			return [now==null, imp]
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {number|array} pop
		 * @param {object} extra
		 * @return {array}
		 */
		function runGACycle(pop,extra){
			let {maxCycles, targetScore, maxSeconds}=extra;
			let s,now, start= markStart(extra),
          maxMillis= (maxSeconds || 30) * 1000;
			maxCycles= maxCycles || 100;
			while(true){
				pop= genPop(pop, extra);
				now= markEnd(extra);
				//time out?
				if(now-start > maxMillis){
					now=null;
					break;
				}
				//pop.forEach(p=> console.log(p.genes.join("")));
				s=calcStats(pop);
				//matched?
				if(_.echt(targetScore) &&
					 s.bestScore >= targetScore){ break }
				//too many?
				if(extra.cycles>= maxCycles){ break }
				extra.cycles += 1;
			}
			extra.gen++;
			return [now == null, pop];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function genPop(pop,{
			calcFit, crossOver, create,mutate
		})
		{
			if(is.num(pop))
				return _.fill(pop, ()=> create());

			let b1,b2,res,mum,dad,vecNewPop = [];
			let stats=calcStats(pop);

			//ascending
			pop.sort((a,b)=> a.fitness.lt(b.fitness)?-1:(a.fitness.gt(b.fitness)?1:0));
			for(let k=Params.NUM_ELITES, i=pop.length-1;i>=0;--i){
				if(k>0){
					vecNewPop.push(pop[i]);
					--k;
				}else{
					break;
				}
			}

			while(vecNewPop.length < pop.length){
				if(Params.TOURNAMENT_SIZE !== undefined){
					mum = tournamentSelection(pop,Params.TOURNAMENT_SIZE);
					dad = tournamentSelection(pop,Params.TOURNAMENT_SIZE);
				}else{
					mum = chromoRoulette(pop,stats);
					dad = chromoRoulette(pop,stats);
				}
				if(crossOver){
					[b1,b2]= crossOver(mum.genes,dad.genes);
				}else{
					b1=mum.genes.slice();
					b2=dad.genes.slice();
				}
				if(mutate){
					mutate(b1);
					mutate(b2);
				}
				vecNewPop.push(new Chromosome(b1, calcFit(b1, mum.fitness)),
											 new Chromosome(b2, calcFit(b2,dad.fitness)));
			}

			while(vecNewPop.length > pop.length){
				vecNewPop.pop();
			}

			return vecNewPop;
		}

		/**
		 * @memberof module:mcfud/algo/NNetGA
		 * @param {function} optimizationFunction
		 * @param {function} isImprovement
		 * @param {function} isOptimal
		 * @param {function} getNextFeatureValue
		 * @param {any} initialFeatureValue
		 * @param {object} extra
		 * @return {object}
		 */
		function hillClimb(optimizationFunction, isImprovement,
											 isOptimal, getNextFeatureValue, initialFeatureValue,extra){
			let start= extra.startTime=_.now();
			let child,best = optimizationFunction(initialFeatureValue);
			while(!isOptimal(best)){
				child = optimizationFunction( getNextFeatureValue(best));
				if(isImprovement(best, child)){
					best = child
				}
			}
			extra.endTime=_.now();
			return best;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function tournament(create, crossOver, compete, sortKey, numParents=10, maxGenerations=100){
			let best,bestScore,parents,pool=[];
			for(let i=0,z=1+numParents*numParents;i<z;++i){
				pool.push([create(),[0,0,0]])
			}
			bestScore = pool[0];
			function getSortKey(x){
				return sortKey(x[0],
											 x[1][CompetitionResult.Win],
											 x[1][CompetitionResult.Tie],
											 x[1][CompetitionResult.Loss]);
			}
			function getSortKeys(a,b){
				let x= getSortKey(a),
						y= getSortKey(b);
				return x<y?-1:(x>y?1:0);
			}
			let generation = 0;
			while(generation < maxGenerations){
				generation += 1;
				for(let i=0;i<pool.length;++i){
					for(let j=0;j<pool.length;++j){
						if(i == j) continue;
						let [playera, scorea] = pool[i];
						let [playerb, scoreb] = pool[j];
						let result = compete(playera, playerb);
						scorea[result] += 1;
						scoreb[2 - result] += 1;
					}
				}
				pool.sort(getSortKeys).reverse();
				if(getSortKey(pool[0]) > getSortKey([best, bestScore])){
					[best, bestScore] = pool[0];
				}
				parents=[];
				for(let i=0;i<numParents.length;++i){
					parents.push(pool[i][0]);
				}
				pool=[];
				for(let i=0;i<parents.length;++i)
					for(let j=0;j<parents.length;++j){
						if(i !== j)
							pool.push([crossOver(parents[i], parents[j]), [0, 0, 0]]);
					}
				parents.forEach(p=> pool.push([p,[0,0,0]]));
				pool.push([create(), [0, 0, 0]]);
			}
			return best;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const _$={

			NeuronLayer,
			Neuron,
			NeuralNet,

			runGASearch,
			runGACycle,

			calcStats,

			NumFitness,
			Fitness,
			Chromosome,

			mutateSM,
			mutateDM,
			mutateIVM,
			mutateDIVM,

			crossOverOBX,
			crossOverPBX,
			crossOverRND,
			crossOverPMX,
			crossOverAtSplits,

			hillClimb,

			//getChromoRoulette,
			//chromoRoulette,
			//tournamentSelectionN,
			//tournamentSelection,

			//fitnessScaleRank,
			//fitnessScaleSigma,
			//fitnessScaleBoltzmann,

			/**
			 * @memberof module:mcfud/algo/NNetGA
			 * @param {object} best
			 * @param {object} extra
			 * @param {boolean} timeOut
			 */
			showBest(best,extra,tout){
        console.log(_.fill(80,"-").join(""));
        console.log("total time: " + _.prettyMillis(extra.endTime-extra.startTime));
				if(tout)
					console.log("time expired");
				console.log("total generations= " + extra.gen);
        console.log("total cycles= " + extra.cycles);
        console.log("fitness= "+ best.fitness.score());
        console.log(_.fill(80,"-").join(""));
      },
			/**
			 * @memberof module:mcfud/algo/NNetGA
			 * @param {object} options
			 */
			config(options){
				return _.inject(Params, options)
			}
		};

		return _$;
	}

	//export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"))
  }else{
    gscope["io/czlab/mcfud/algo/NNetGA"]=_module
  }

})(this)



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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const int=Math.floor;
    const {u:_, is}= Core;

    /**
     * @module mcfud/algo/NEAT
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @typedef {object} NeuronType
     * @property {number} INPUT
     * @property {number} HIDDEN
     * @property {number} OUTPUT
     * @property {number} BIAS
     * @property {number} NONE
     */
    const NeuronType={
      INPUT:0,
      HIDDEN:1,
      OUTPUT:2,
      BIAS:3,
      NONE:4
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @typedef {object} InnovType
     * @property {number} NEURON
     * @property {number} LINK
     */
    const InnovType={
      NEURON:0,
      LINK:1
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Select one of these types when updating the network if snapshot is chosen
     * the network depth is used to completely flush the inputs through the network.
     * active just updates the network each timestep.
     * @typedef {object} RunType
     * @property {number} SNAPSHOT
     * @property {number} ACTIVE
     */
    const RunType={
      SNAPSHOT:0,
      ACTIVE:1
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Params={
      numInputs: 0,
      numOutputs: 0,
      bias: -1,
      //starting value for the sigmoid response
      sigmoidResponse:1,
      //number of times we try to find 2 unlinked nodes when adding a link.
      numAddLinkAttempts:5,
      //number of attempts made to choose a node that is not an input
      //node and that does not already have a recurrently looped connection to itself
      numTrysToFindLoopedLink: 5,
      //the number of attempts made to find an old link to prevent chaining in addNeuron
      numTrysToFindOldLink: 5,
      //the chance, each epoch, that a neuron or link will be added to the genome
      chanceAddLink:0.07,
      chanceAddNode:0.03,
      chanceAddRecurrentLink: -1,//0.05,
      //mutation probabilities for mutating the weights
      mutationRate:0.8,
      maxWeightPerturbation:0.5,
      probabilityWeightReplaced:0.1,
      //probabilities for mutating the activation response
      activationMutationRate:0.1,
      maxActivationPerturbation:0.1,
      //the smaller the number the more species will be created
      compatibilityThreshold:0.26,
      //during fitness adjustment this is how much the fitnesses of
      //young species are boosted (eg 1.2 is a 20% boost)
      youngFitnessBonus:1.3,
      //if the species are below this age their fitnesses are boosted
      youngBonusAgeThreshhold:10,
      //number of population to survive each epoch. (0.2 = 20%)
      survivalRate:0,
      //if the species is above this age their fitness gets penalized
      oldAgeThreshold:50,
      //by this much
      oldAgePenalty:0.7,
      crossOverRate:0.7,
      //how long we allow a species to exist without any improvement
      numGensAllowedNoImprovement:15,
      //maximum number of neurons permitted in the network
      maxPermittedNeurons:100,
      numBestElites:4
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Create a numeric fitness object.
     * @memberof module:mcfud/algo/NEAT
     * @param {number} v
     * @param {boolean} flipped
     * @return {object}
     */
    function NumFitness(v,flip=false){
      return{
        value:v,
        gt(b){
          return flip? this.value < b.value: this.value > b.value
        },
        eq(b){
          return this.value==b.value
        },
        lt(b){
          return flip? this.value > b.value: this.value < b.value
        },
        score(){
          return this.value
        },
        update(n){
          this.value=n;
        },
        clone(){
          return NumFitness(this.value, flip)
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class NeuronGene{
      /**
       * @param {NeuronType} type
       * @param {number[]} pos
       * @param {boolean} r
       */
      constructor(type, pos=null, r=false){
        this.pos= pos?pos.slice():[0,0];
        //sets curvature of sigmoid
        this.activation=1;
        this.recurrent= r;
        if(is.vec(type)){
          this.id=type[0];
          this.neuronType= type[1];
        }else{
          this.id=0;
          this.neuronType= type;
        }
      }
      clone(){
        let c= new NeuronGene(this.neuronType);
        c.id=this.id;
        c.activation=this.activation;
        c.recurrent=this.recurrent;
        c.pos=this.pos.slice();
        return c;
      }
      static from(id, type, pos=null, r=false){
        return new NeuronGene([id,type],pos,r);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class LinkGene{
      /**
       * @param {number} from
       * @param {number} to
       * @param {number} iid
       * @param {boolean} enable
       * @param {number} w
       * @param {boolean} rec
       */
      constructor(from, to, iid, enable=true, w=null, rec = false){
        this.fromNeuron= from; //id
        this.toNeuron= to; //id
        this.innovationID= iid;
        this.recurrent= rec===true;
        this.enabled= enable !== false;
        this.weight= w===null? _.randMinus1To1() : w;
      }
      clone(){
        let c= new LinkGene();
        c.fromNeuron= this.fromNeuron;
        c.toNeuron= this.toNeuron;
        c.innovationID= this.innovationID;
        c.recurrent= this.recurrent;
        c.enabled= this.enabled;
        c.weight= this.weight;
        return c;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class Innov{
      /**
       * @param {number} from
       * @param {number} to
       * @param {InnovType} t
       * @param {number} iid
       * @param {NeuronType} type
       * @param {number[]} pos
       */
      constructor(from, to, t, iid, type=NeuronType.NONE, pos=null){
        this.pos= pos?pos.slice():[0,0];
        this.innovationID= iid;
        this.innovationType=t;
        this.neuronID= 0;
        this.neuronType= type;
        this.neuronIn= from; //id
        this.neuronOut= to; //id
      }
      static from(neuron, innov_id){
        let s= new Innov(-1,-1, null, innov_id,
                         neuron.neuronType, neuron.pos);
        s.neuronID=neuron.id;
        return s;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Given a neuron ID this function returns a clone of that neuron.
    function createNeuronFromID(history,n){
      let temp=NeuronGene.from(0,NeuronType.HIDDEN);
      for(let cur,i=0; i<history.vecInnovs.length; ++i){
        cur=history.vecInnovs[i];
        if(cur.neuronID == n){
          temp.neuronType = cur.neuronType;
          temp.id = cur.neuronID;
          temp.pos= cur.pos.slice();
          return temp;
        }
      }
      _.assert(false, "boom from createNeuronFromID");
      //return temp;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Used to keep track of all innovations created during the populations
     * evolution, adds all the appropriate innovations.
     */
    class InnovHistory{
      /**
       * @param {NeuronGene[]} neurons
       * @param {LinkGene[]} genes
       */
      constructor(neurons,genes){
        this.NEURON_COUNTER= neurons.length-1; // last known neuron id
        this.INNOV_COUNTER=0;
        this.vecInnovs= neurons.map(n=> Innov.from(n, this.nextIID())).concat(
                        genes.map(g=> new Innov(g.fromNeuron, g.toNeuron, InnovType.LINK, this.nextIID())));
      }
      nextIID(){ return this.INNOV_COUNTER++ }
      /**Checks to see if this innovation has already occurred. If it has it
       * returns the innovation ID. If not it returns a negative value.
       * @param {number} from
       * @param {number} out
       * @param {InnovType} type
       * @return {number}
       */
      check(from, out, type){
        let rc= this.vecInnovs.find(cur=> cur.neuronIn == from &&
                                          cur.neuronOut == out &&
                                          cur.innovationType == type);
        return rc===undefined?-1: rc.innovationID;
      }
      /**Creates a new innovation.
       * @param {number} from
       * @param {number} to
       * @param {InnovType} innovType
       * @param {NeuronType} neuronType
       * @param {number[]} pos
       * @return {Innov}
       */
      create(from, to, innovType, neuronType=NeuronType.NONE, pos=null){
        let i= new Innov(from, to, innovType, this.nextIID(), neuronType,  pos);
        if(InnovType.NEURON==innovType){
          i.neuronID= ++this.NEURON_COUNTER;
        }
        this.vecInnovs.push(i);
        return i;
      }
      flush(){this.vecInnovs.length=0}
      getNeuronID(inv){return this.vecInnovs[inv].neuronID}
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class NLink{
      /**
       * @param {number} w
       * @param {NNeuron} from
       * @param {NNeuron} out
       * @param {boolean} rec
       */
      constructor(w, from, out, rec=false){
        this.weight=w;
        this.from=from;
        this.out=out;
        this.recurrent= rec===true;
      }
      clone(){
        let c= new NLink();
        c.weight= this.weight;
        c.from= this.from;
        c.out= this.out;
        c.recurrent= this.recurrent;
        return c;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class NNeuron{
      /**
       * @param {NeuronType} type
       * @param {number} id
       * @param {number[]} pos
       * @param {number} actResponse
       */
      constructor(type, id, pos, actResponse){
        this.neuronType=type;
        this.neuronID=id;
        //sum weights*inputs
        this.sumActivation=0;
        this.output=0;
        this.posX=0;
        this.posY=0;
        this.vecLinksIn=[];
        this.vecLinksOut=[];
        this.activation=actResponse;
        this.pos= pos?pos.slice():[0,0];
      }
      clone(){
        let c= new NNeuron();
        c.neuronType=this.neuronType;
        c.neuronID= this.neuronID;
        c.output=this.output;
        c.posX=this.posX;
        c.posY=this.posY;
        c.pos= this.pos.slice();
        c.activation=this.activation;
        c.sumActivation= this.sumActivation;
        c.vecLinksIn=this.vecLinksIn.map(v=> v.clone());
        c.vecLinksOut=this.vecLinksOut.map(v=> v.clone());
        return c;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function sigmoid(netinput, response){
      return 1 / ( 1 + Math.exp(-netinput / response))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class NeuralNet{
      /**
       * @param {NNeuron[]} neurons
       * @param {number} depth
       */
      constructor(neurons, depth){
        this.vecNeurons= neurons;//own it
        this.depth=depth;
      }
      /**
       * @return {NeuralNet}
       */
      clone(){
        let c=new NeuralNet(null,this.depth);
        c.vecNeurons= this.vecNeurons.map(n=> n.clone());
        return c;
      }
      compute(inputs,type){
        return this.update(inputs, type)
      }
      /**Update network for this clock cycle.
       * @param {number[]} inputs
       * @param {RunType} type
       */
      update(inputs, type=RunType.ACTIVE){
        //if the mode is snapshot then we require all the neurons to be
        //iterated through as many times as the network is deep. If the
        //mode is set to active the method can return an output after just one iteration
        let outputs=[],
            flushCnt= type == RunType.SNAPSHOT ? this.depth:1;
        for(let sum,n,i=0; i<flushCnt; ++i){
          outputs.length=0;
          n = 0;
          //first set the outputs of the 'input' neurons to be equal
          //to the values passed into the function in inputs
          while(this.vecNeurons[n].neuronType == NeuronType.INPUT){
            this.vecNeurons[n].output = inputs[n];
            ++n;
          }
          _.assert(this.vecNeurons[n].neuronType==NeuronType.BIAS,"expecting BIAS node");
          this.vecNeurons[n].output = 1; // set bias
          //hiddens or outputs
          ++n;
          while(n < this.vecNeurons.length){
            sum= this.vecNeurons[n].vecLinksIn.reduce((acc,k)=>{ return acc + k.weight * k.from.output },0);
            //put sum thru the activation func & assign the value to this neuron's output
            this.vecNeurons[n].output = sigmoid(sum, this.vecNeurons[n].activation);
            if(this.vecNeurons[n].neuronType == NeuronType.OUTPUT){
              outputs.push(this.vecNeurons[n].output)
            }
            ++n;
          }
        }
        //the network needs to be flushed if this type of update is performed
        //otherwise it is possible for dependencies to be built on the order
        //the training data is presented
        if(type == RunType.SNAPSHOT)
          this.vecNeurons.forEach(n=> n.output=0);
        /////
        return outputs;
      }
      draw(gfx, cxLeft, cxRight, cyTop, cyBot){ }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class Genome{
      /**A genome basically consists of a vector of link genes,
       * a vector of neuron genes and a fitness score.
       * @param {number} gid
       * @param {number} inputs
       * @param {number} outputs
       * @param {NeuronGene[]} neurons (optional)
       * @param {LinkGene[]} genes (optional)
       */
      constructor(gid, inputs, outputs, neurons=null, genes=null){
        if(gid<0){return}//hack for cloning
        let i,nid=0,
            inputRowSlice = 1/(inputs+2),
            outputRowSlice = 1/(outputs+1);
        if(neurons && genes){
          this.vecNeurons= neurons;//own it
          this.vecLinks= genes;
        }else{
          this.vecNeurons= [];
          this.vecLinks= [];
          for(i=0; i<inputs; ++i)
            this.vecNeurons.push(NeuronGene.from(nid++, NeuronType.INPUT, [(i+2)*inputRowSlice,0]));
          this.vecNeurons.push(NeuronGene.from(nid++, NeuronType.BIAS, [inputRowSlice,0]));
          for(i=0; i<outputs; ++i)
            this.vecNeurons.push(NeuronGene.from(nid++, NeuronType.OUTPUT, [(i+1)*outputRowSlice,1] ));
          //create the link genes, connect each input neuron to each output neuron and
          for(i=0; i<inputs+1; ++i)
            for(let j=0; j<outputs; ++j)
              this.vecLinks.push(new LinkGene(this.vecNeurons[i].id,
                                              this.vecNeurons[inputs+1+j].id, inputs+outputs+1+this.vecLinks.length));
        }
        this.nextNeuronID=nid;
        this.fitness=NumFitness(0);
        this.genomeID= gid;
        //its fitness score after it has been placed into a species and adjusted accordingly
        this.adjustedFitness=0;
        //the number of offspring is required to spawn for the next generation
        this.amountToSpawn=0;
        this.numInputs=inputs;
        this.numOutputs=outputs;
        //keeps a track of which species this genome is in (only used for display purposes)
        this.species=0;
      }
      /**Create a neural network from the genome.
       * @param {number} depth
       * @return {NeuralNet} newly created ANN
       */
      createPhenotype(depth){
        let vs= this.vecNeurons.map(n=> new NNeuron(n.neuronType,
                                                    n.id,
                                                    n.pos,
                                                    n.activation));
        this.vecLinks.forEach(k=>{
          if(k.enabled){
            let t= vs[this.getIndex(k.toNeuron) ],
                f= vs[this.getIndex(k.fromNeuron) ],
                //create a link between those two neurons
                //and assign the weight stored in the gene
                z= new NLink(k.weight, f, t, k.recurrent);
            //add new links to neuron
            f.vecLinksOut.push(z);
            t.vecLinksIn.push(z);
          }
        });
        return new NeuralNet(vs, depth);
      }
      _randAny(){
        return this.vecNeurons[_.randInt2(0, this.vecNeurons.length-1)]
      }
      _randNonInputs(){
        return this.vecNeurons[_.randInt2(this.numInputs+1, this.vecNeurons.length-1)]
      }
      /**Create a new link with the probability of Params.chanceAddLink.
       * @param {number} MutationRate
       * @param {boolean} ChanceOfLooped
       * @param {InnovHistory} history
       * @param {number} numTrysToFindLoop
       * @param {number} numTrysToAddLink
       */
      addLink(MutationRate, ChanceOfLooped, history, numTrysToFindLoop, numTrysToAddLink){
        if(_.rand() > MutationRate)
        return;
        //define holders for the two neurons to be linked. If we have find two
        //valid neurons to link these values will become >= 0.
        let nid1 = -1,
            nid2 = -1,
            recurrent = false; //flag set if a recurrent link is selected (looped or normal)
        //first test to see if an attempt shpould be made to create a
        //link that loops back into the same neuron
        if(_.rand() < ChanceOfLooped){
          while(numTrysToFindLoop--){
            let n=this._randNonInputs();
            if(n.neuronType != NeuronType.BIAS &&
               n.neuronType != NeuronType.INPUT && !n.recurrent){
              nid1 = nid2 = n.id;
              recurrent = n.recurrent = true;
              break;
            }
          }
        }else{
          while(numTrysToAddLink--){
            //choose two neurons, the second must not be an input or a bias
            nid1 = this._randAny().id;
            nid2 = this._randNonInputs().id;
            //if(nid2 == 2){ continue; }//TODO: why2?????
            if(nid1 == nid2 ||
               this.duplicateLink(nid1, nid2)){
              nid1 = nid2 = -1; // bad
            }else{
              break;
            }
          }
        }
        if(nid1 < 0 || nid2 < 0){}else{
          //console.log("addlink!!!!!");
          let id = history.check(nid1, nid2, InnovType.LINK);
          if(this.vecNeurons[this.getIndex(nid1)].pos[1]>
             this.vecNeurons[this.getIndex(nid2)].pos[1]){ recurrent = true }
          if(id<0)
            id= history.create(nid1, nid2, InnovType.LINK).innovationID;
          this.vecLinks.push(new LinkGene(nid1, nid2, id, true, _.randMinus1To1(), recurrent));
        }
      }
      /**Adds a neuron to the genotype by examining the network,
       * splitting one of the links and inserting the new neuron.
       * @param {number} MutationRate
       * @param {InnovHostory} history
       * @param {number} numTrysToFindOldLink
       */
      addNeuron(MutationRate, history, numTrysToFindOldLink){
        if(_.rand() > MutationRate)
        return;
        let chosen=0, done=false,
            fromNeuron, link1, link2, newNeuronID,
            //first a link is chosen to split. If the genome is small the code makes
            //sure one of the older links is split to ensure a chaining effect does
            //not occur. Here, if the genome contains less than 5 hidden neurons it
            //is considered to be too small to select a link at random
            SizeThreshold = this.numInputs + this.numOutputs + 5;
        if(this.vecLinks.length < SizeThreshold){
          while(numTrysToFindOldLink--){
            //choose a link with a bias towards the older links in the genome
            chosen = _.randInt2(0, this.numGenes()-1-int(Math.sqrt(this.numGenes())));
            fromNeuron = this.vecLinks[chosen].fromNeuron;
            if(this.vecLinks[chosen].enabled    &&
               !this.vecLinks[chosen].recurrent &&
               this.vecNeurons[this.getIndex(fromNeuron)].neuronType != NeuronType.BIAS){
              done = true;
              break;
            }
          }
          //failed
          if(!done){ return }
        }else{
          while(!done){
            chosen = _.randInt2(0, this.numGenes()-1);
            fromNeuron = this.vecLinks[chosen].fromNeuron;
            if(this.vecLinks[chosen].enabled &&
               !this.vecLinks[chosen].recurrent &&
               this.vecNeurons[this.getIndex(fromNeuron)].neuronType != NeuronType.BIAS){
              done = true;
            }
          }
        }
        this.vecLinks[chosen].enabled = false;
        //grab the weight from the gene (we want to use this for the weight of
        //one of the new links so that the split does not disturb anything the
        //NN may have already learned...
        let originalWeight = this.vecLinks[chosen].weight,
            from =  this.vecLinks[chosen].fromNeuron,
            to   =  this.vecLinks[chosen].toNeuron,
            //calculate the depth and width of the new neuron. We can use the depth
            //to see if the link feeds backwards or forwards
            newDepth = (this.vecNeurons[this.getIndex(from)].pos[1]+
                        this.vecNeurons[this.getIndex(to)].pos[1]) /2,
            newWidth = (this.vecNeurons[this.getIndex(from)].pos[0]+
                        this.vecNeurons[this.getIndex(to)].pos[0]) /2,
            //now see if this innovation has been created previously
            iid = history.check(from, to, InnovType.NEURON);
        /*it is possible for NEAT to repeatedly do the following:
            1. Find a link. Lets say we choose link 1 to 5
            2. Disable the link,
            3. Add a new neuron and two new links
            4. The link disabled in Step 2 maybe re-enabled when this genome
               is recombined with a genome that has that link enabled.
            5  etc etc
        Therefore, this function must check to see if a neuron ID is already
        being used. If it is then the function creates a new innovation
        for the neuron. */
        if(iid >= 0 && this.hasNeuron(history.getNeuronID(iid))) iid = -1;
        if(iid < 0){
          let new_innov= history.create(from, to,
                                        InnovType.NEURON,
                                        NeuronType.HIDDEN, [newWidth, newDepth]),
              //n= NeuronGene.from(new_innov.neuronID, NeuronType.HIDDEN, [newWidth,newDepth]);
              n= NeuronGene.from(this.nextNeuronID, NeuronType.HIDDEN, [newWidth,newDepth]);
          new_innov.neuronID=n.id;
          newNeuronID=n.id;

          this.nextNeuronID++;
          this.vecNeurons.push(n);

          //Two new link innovations are required, one for each of the
          //new links created when this gene is split.
          link1 = history.create(from, newNeuronID, InnovType.LINK).innovationID;
          this.vecLinks.push(new LinkGene(from, newNeuronID, link1, true, 1));
          link2 = history.create(newNeuronID, to, InnovType.LINK).innovationID;
          this.vecLinks.push(new LinkGene(newNeuronID, to, link2, true, originalWeight));
        }else{
          //console.log("add old neuron");
          //this innovation has already been created so grab the relevant neuron
          //and link info from the innovation database
          newNeuronID = history.getNeuronID(iid);
          link1 = history.check(from, newNeuronID, InnovType.LINK);
          link2 = history.check(newNeuronID, to, InnovType.LINK);
          //this should never happen because the innovations *should* have already occurred
          if(link1 < 0 || link2 < 0)
            _.assert(false, "Error in Genome::AddNeuron");
          //now we need to create 2 new genes to represent the new links
          this.vecLinks.push(new LinkGene(from, newNeuronID, link1, true, 1),
                             new LinkGene(newNeuronID, to, link2, true, originalWeight));
          this.vecNeurons.push(NeuronGene.from(newNeuronID, NeuronType.HIDDEN, [newWidth,newDepth]));
        }
      }
      /**Given a neuron ID, find its position in vecNeurons.
       * @param {number} neuron_id
       * @return {number}
       */
      getIndex(neuron_id){
        for(let i=0; i<this.vecNeurons.length; ++i){
          if(this.vecNeurons[i].id == neuron_id)
          return i
        }
        _.assert(false, "Error in Genome::getIndex");
      }
      /**
       * @param {number} neuronIn
       * @param {number} neuronOut
       * @return {boolean} true if the link is already part of the genome
       */
      duplicateLink(neuronIn, neuronOut){
        return this.vecLinks.some(k=> k.fromNeuron == neuronIn && k.toNeuron == neuronOut)
      }
      /**Tests to see if the parameter is equal to any existing neuron ID's.
       * @param {number} id
       * @return {boolean} true if this is the case.
       */
      hasNeuron(id){
        return this.vecNeurons.some(n=> id== n.id)
      }
      /**
       * @param {number} MutationRate
       * @param {number} ProbNewWeight the chance that a weight may get replaced by a completely new weight.
       * @param {number} maxPertubation the maximum perturbation to be applied
       */
      mutateWeights(MutationRate, ProbNewWeight, maxPertubation){
        for(let i=0; i<this.vecLinks.length; ++i){
          if(_.rand() < MutationRate){
            if(_.rand() < ProbNewWeight){
              this.vecLinks[i].weight = _.randMinus1To1() // new value
            }else{
              this.vecLinks[i].weight += _.randMinus1To1() * maxPertubation
            }
          }
        }
      }
      /**Perturbs the activation responses of the neurons.
       * @param {number} MutationRate
       * @param {number} maxPertubation the maximum perturbation to be applied
       */
      mutateActivation(MutationRate, maxPertubation){
        this.vecNeurons.forEach(n=>{
          if(_.rand() < MutationRate)
            n.activation += _.randMinus1To1() * maxPertubation
        })
      }
      /**Find the compatibility of this genome with the passed genome.
       * @param {Genome} genome
       * @return {number}
       */
      calcCompatibility(genome){
        //travel down the length of each genome counting the number of
        //disjoint genes, the number of excess genes and the number of matched genes
        let g1=0,g2=0,
            numDisjoint= 0,
            numExcess = 0,
            numMatched = 0,
            sumWeightDiff = 0;
        while((g1 < this.vecLinks.length-1) ||
              (g2 < genome.vecLinks.length-1)){
          //genome2 longer so increment the excess score
          if(g1 == this.vecLinks.length-1){ ++g2; ++numExcess; continue; }
          //genome1 longer so increment the excess score
          if(g2 == genome.vecLinks.length-1){ ++g1; ++numExcess; continue; }
          let id1 = this.vecLinks[g1].innovationID,
              id2 = genome.vecLinks[g2].innovationID;
          if(id1 == id2){
            ++g1; ++g2; ++numMatched;
            sumWeightDiff += Math.abs(this.vecLinks[g1].weight - genome.vecLinks[g2].weight);
          }else{
            ++numDisjoint;
            if(id1 < id2){ ++g1 }
            else if(id1 > id2){ ++g2 }
          }
        }
        const Disjoint = 1,
              Excess   = 1,
              Matched  = 0.4,
              longest= Math.max(this.numGenes(), genome.numGenes());
        let xxx= (Excess * numExcess/longest) + (Disjoint * numDisjoint/longest);
        return numMatched>0 ? xxx + (Matched * sumWeightDiff/ numMatched) : xxx;
      }
      sortGenes(){
        this.vecLinks.sort((a,b)=>{
          return a.innovationID < b.innovationID?-1:(a.innovationID > b.innovationID?1:0)
        });
        return this;
      }
      id(){return this.genomeID}
      setID(val){this.genomeID = val}
      numGenes(){return this.vecLinks.length}
      numNeurons(){return this.vecNeurons.length}
      setFitness(num){this.fitness = NumFitness(num)}
      splitY(val){return this.vecNeurons[val].pos[1]}
      genes(){return this.vecLinks}
      neurons(){return this.vecNeurons}
      startOfGenes(){return 0}
      endOfGenes(){return this.vecLinks.length}
      clone(){
        let src=this,
            c=new Genome(-911);
        c.fitness= src.fitness.clone();
        c.genomeID= src.genomeID;
        c.adjustedFitness= src.adjustedFitness;
        c.amountToSpawn= src.amountToSpawn;
        c.numInputs= src.numInputs;
        c.numOutputs= src.numOutputs;
        c.species= src.species;
        c.vecNeurons= src.vecNeurons.map(v=> v.clone());
        c.vecLinks= src.vecLinks.map(v=> v.clone());
        return c;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class Species{
      /**
       * @param {Genome} firstOrg
       */
      constructor(sid, firstOrg){
        this.speciesID= sid;
        //generations since fitness has improved, we can use
        //this info to kill off a species if required
        this._gensNoImprovement=0;
        //age of species
        this._age=0;
        //how many of this species should be spawned for the next population
        this.spawnsRqd=0;
        this.vecMembers= [firstOrg];
        this._leader= firstOrg.clone();
        //best fitness found so far by this species
        this._bestFitness= firstOrg.fitness.score();
      }
      /**Adjusts the fitness of each individual by first
       * examining the species age and penalising if old, boosting if young.
       * Then we perform fitness sharing by dividing the fitness
       * by the number of individuals in the species.
       * This ensures a species does not grow too large.
       */
      adjustFitnesses(){
        let score,total = 0;
        this.vecMembers.forEach(m=>{
          score = m.fitness.score();
          if(this._age < Params.youngBonusAgeThreshhold){
            //boost the fitness scores if the species is young
            score *= Params.youngFitnessBonus
          }
          if(this._age > Params.oldAgeThreshold){
            //punish older species
            score *= Params.oldAgePenalty
          }
          total += score;
          //apply fitness sharing to adjusted fitnesses
          m.adjustedFitness = score/this.vecMembers.length;
        })
      }
      /**Adds a new member to this species and updates the member variables accordingly
       * @param {Genome} newMember
       */
      addMember(newMember){
        if(newMember.fitness.score() > this._bestFitness){
          this._bestFitness = newMember.fitness.score();
          this._gensNoImprovement = 0;
          this._leader = newMember.clone();
        }
        this.vecMembers.push(newMember);
        newMember.species= this.id();
      }
      /**Clears out all the members from the last generation, updates the age and gens no improvement.
       */
      purge(){
        this.vecMembers.length=0;
        ++this._gensNoImprovement;
        this.spawnsRqd = 0;
        ++this._age;
        return this;
      }
      /**Simply adds up the expected spawn amount for each individual
       * in the species to calculate the amount of offspring
       * this species should spawn.
       */
      calculateSpawnAmount(){
        this.vecMembers.forEach(m=>{
          this.spawnsRqd += m.amountToSpawn
        })
      }
      /**Spawns an individual from the species selected at random
       * from the best Params::dSurvivalRate percent.
       * @return {Genome} a random genome selected from the best individuals
       */
      spawn(){
        let n,baby;
        if(this.vecMembers.length == 1){
          baby = this.vecMembers[0]
        }else{
          n = int(Params.survivalRate * this.vecMembers.length)-1;
          if(n<0)n=1;
          baby = this.vecMembers[ _.randInt2(0, n) ];
        }
        return baby.clone();
      }
      id(){return this.speciesID}
      bestFitness(){return this._bestFitness }
      age(){return this._age}
      leader(){return this._leader}
      numToSpawn(){return this.spawnsRqd}
      numMembers(){return this.vecMembers.length}
      gensNoImprovement(){return this._gensNoImprovement}
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function sortSpecies(s){
      return s.sort((lhs,rhs)=>{
        //so we can sort species by best fitness. Largest first
        return lhs._bestFitness > rhs._bestFitness?-1:(
          lhs._bestFitness < rhs._bestFitness?1:0
        )
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**A recursive function used to calculate a lookup table of split depths.
     */
    function split(low, high, depth, out){
      const span = high-low;
      out.push({val: low + span/2, depth: depth+1});
      if(depth > 6){
      }else{
        split(low, low+span/2, depth+1, out);
        split(low+span/2, high, depth+1, out);
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class NeatGA{
      /**Creates a base genome from supplied values and creates a population
       * of 'size' similar (same topology, varying weights) genomes.
       * @param {number} size
       * @param {number} inputs
       * @param {number} outputs
       */
      constructor(size, inputs, outputs){
        let dummy= new Genome(0,inputs, outputs);

        //this holds the precalculated split depths. They are used
        //to calculate a neurons x/y position for rendering and also
        //for calculating the flush depth of the network when a
        //phenotype is working in 'snapshot' mode.
        //create the network depth lookup table
        this.vecSplits = split(0, 1, 0, []);
        this.vecBestGenomes=[];
        this.vecSpecies=[];

        this.SPECIES_COUNTER=0;
        this.GENOME_COUNTER=0;

        this.generation=0;
        this.popSize=size;
        //adjusted fitness scores
        this.totFitAdj=0;
        this.avFitAdj=0;
        //index into the genomes for the fittest genome
        this.fittestGenome=0;
        this._bestEverFitness=0;
        this.vecGenomes= _.fill(size, ()=> new Genome(this.nextGID(), inputs, outputs));
        //create the innovation list. First create a minimal genome
        this.innovHistory= new InnovHistory(dummy.neurons(), dummy.genes());
      }
      /**Resets some values ready for the next epoch, kills off
       * all the phenotypes and any poorly performing species.
       */
      resetAndKill(){
        this.totFitAdj = 0;
        this.avFitAdj  = 0;
        let L,tmp=[];
        this.vecSpecies.forEach(s=>{
          if(s.gensNoImprovement() > Params.numGensAllowedNoImprovement &&
             s.bestFitness() < this._bestEverFitness){
            //kill,delete it
          }else{
            //keep it
            tmp.push(s.purge());
          }
        });
        this.vecSpecies.length=0;
        tmp.forEach(t=> this.vecSpecies.push(t));
      }
      /**Separates each individual into its respective species by calculating
       * a compatibility score with every other member of the population and
       * niching accordingly. The function then adjusts the fitness scores of
       * each individual by species age and by sharing and also determines
       * how many offspring each individual should spawn.
       */
      speciateAndCalculateSpawnLevels(){
        let added = false;
        this.vecGenomes.forEach(g=>{
          for(let s=0; s<this.vecSpecies.length; ++s){
            if(g.calcCompatibility(this.vecSpecies[s].leader()) <= Params.compatibilityThreshold){
              this.vecSpecies[s].addMember(g);
              added = true;
              break;
            }
          }
          if(!added)
            this.vecSpecies.push(new Species(this.nextSID(), g));
          added = false;
        });
        //now all the genomes have been assigned a species the fitness scores
        //need to be adjusted to take into account sharing and species age.
        this.vecSpecies.forEach(s=> s.adjustFitnesses())
        //calculate new adjusted total & average fitness for the population
        this.vecGenomes.forEach(g=> this.totFitAdj += g.adjustedFitness);
        //////
        this.avFitAdj = this.totFitAdj/this.vecGenomes.length;
        //calculate how many offspring each member of the population should spawn
        this.vecGenomes.forEach(g=> g.amountToSpawn=g.adjustedFitness / this.avFitAdj);
        //calculate how many offspring each species should spawn
        this.vecSpecies.forEach(s=> s.calculateSpawnAmount());
      }
      /**
       * @param {Genome} mum
       * @param {Genome} dad
       */
      crossOver(mum, dad){
        const MUM=0, DAD=1;
        //first, calculate the genome we will using the disjoint/excess
        //genes from. This is the fittest genome.
        let best;
        //if they are of equal fitness use the shorter (because we want to keep
        //the networks as small as possible)
        if(mum.fitness.score() == dad.fitness.score()){
          best=mum.numGenes() == dad.numGenes() ? (_.randSign()>0?DAD:MUM)
                                                : (mum.numGenes() < dad.numGenes()?MUM :DAD)
        }else{
          best = mum.fitness.score() > dad.fitness.score() ? MUM : DAD
        }
        function addNeuronID(nid, vec){ if(vec.indexOf(nid)<0) vec.push(nid) }
        //these vectors will hold the offspring's nodes and genes
        let babyNeurons=[],
            babyGenes=[],
            vecNeurons=[],
            //create iterators so we can step through each parents genes and set
            //them to the first gene of each parent
            //this will hold a copy of the gene we wish to add at each step
            curMum=0,curDad=0,selectedGene;
        //step through each parents genes until we reach the end of both
        while(!(curMum == mum.endOfGenes() && curDad == dad.endOfGenes())){
          if(curMum == mum.endOfGenes()&&curDad != dad.endOfGenes()){
            //the end of mum's genes have been reached
            if(best == DAD) selectedGene = dad.vecLinks[curDad];
            ++curDad;
          }else if(curDad == dad.endOfGenes() && curMum != mum.endOfGenes()){
            //the end of dads's genes have been reached
            if(best == MUM) selectedGene = mum.vecLinks[curMum];
            ++curMum;
          }else if(mum.vecLinks[curMum].innovationID < dad.vecLinks[curDad].innovationID){
            if(best == MUM) selectedGene = mum.vecLinks[curMum];
            ++curMum;
          }else if(dad.vecLinks[curDad].innovationID < mum.vecLinks[curMum].innovationID){
            if(best == DAD) selectedGene = dad.vecLinks[curDad];
            ++curDad;
          }else if(dad.vecLinks[curDad].innovationID == mum.vecLinks[curMum].innovationID){
            selectedGene=_.rand() < 0.5 ? mum.vecLinks[curMum] : dad.vecLinks[curDad];
            ++curMum;
            ++curDad;
          }
          //add the selected gene if not already added
          if(babyGenes.length == 0 ||
             _.last(babyGenes).innovationID != selectedGene.innovationID){
            babyGenes.push(selectedGene.clone())
          }
          //Check if we already have the nodes referred to in SelectedGene.
          //If not, they need to be added.
          addNeuronID(selectedGene.fromNeuron, vecNeurons);
          addNeuronID(selectedGene.toNeuron, vecNeurons);
        }
        //now create the required nodes
        vecNeurons.sort().forEach(n=> babyNeurons.push(createNeuronFromID(this.innovHistory,n)));
        /////
        return new Genome(this.nextGID(), mum.numInputs, mum.numOutputs, babyNeurons, babyGenes);
      }
      nextSID(){ return ++this.SPECIES_COUNTER}
      nextGID(){ return ++this.GENOME_COUNTER }
      /**
       * @param {number} numComparisons
       * @return {Genome}
       */
      tournamentSelection(comparisons){
        let chosen = 0,
            bestSoFar = 0;
        //Select NumComparisons members from the population at random testing
        //against the best found so far
        for(let g,i=0, z=this.vecGenomes.length-1; i<comparisons; ++i){
          g = _.randInt2(0, z);
          if(this.vecGenomes[g].fitness.score() > bestSoFar){
            chosen = g;
            bestSoFar = this.vecGenomes[g].fitness.score();
          }
        }
        return this.vecGenomes[chosen];
      }
      /**Searches the lookup table for the splitY value of each node
       * in the genome and returns the depth of the network based on this figure.
       * @param {Genome} gen
       * @return {number}
       */
      calculateNetDepth(gen){
        let maxSoFar = 0;
        for(let nd=0; nd<gen.numNeurons(); ++nd){
          for(let i=0; i<this.vecSplits.length; ++i)
            if(gen.splitY(nd) == this.vecSplits[i].val &&
               this.vecSplits[i].depth > maxSoFar){
              maxSoFar = this.vecSplits[i].depth;
            }
        }
        return maxSoFar + 2;
      }
      /**Sorts the population into descending fitness, keeps a record of the best
       * n genomes and updates any fitness statistics accordingly.
       */
      sortAndRecord(scores){
        this.vecGenomes.forEach((g,i)=> g.setFitness(scores[i]));
        this.vecGenomes.sort((a,b)=>{
          return a.fitness.score()>b.fitness.score()?-1:(a.fitness.score()<b.fitness.score()?1:0)
        });
        this._bestEverFitness = Math.max(this._bestEverFitness,this.vecGenomes[0].fitness.score());
        //save the best
        this.vecBestGenomes.length=0;
        for(let i=0; i<Params.numBestElites; ++i)
          this.vecBestGenomes.push(this.vecGenomes[i]);
      }
      /**Performs one epoch of the genetic algorithm and returns a vector of pointers to the new phenotypes.
       * @param {number[]} fitnessScores
       * @return {}
       */
      epoch(scores){
        _.assert(scores.length == this.vecGenomes.length, "NeatGA::Epoch(scores/ genomes mismatch)!");
        //reset appropriate values and kill off the existing phenotypes and any poorly performing species
        this.resetAndKill();
        //update and sort genomes and keep a record of the best performers
        this.sortAndRecord(scores);
        //separate the population into species of similar topology,
        this.speciateAndCalculateSpawnLevels();
        //this will hold the new population of genomes
        let baby2,baby,newPop=[],numSpawnedSoFar = 0;
        this.vecSpecies.forEach(spc=>{
          if(numSpawnedSoFar<this.popSize){
            let chosenBest= false,
                numToSpawn = _.rounded(spc.numToSpawn());
            while(numToSpawn--){
              if(!chosenBest){
                chosenBest=true;
                baby = spc.leader().clone();
              }else{
                if(spc.numMembers() == 1){
                  baby = spc.spawn()
                }else{
                  let numAttempts = 5,
                      g2,g1 = spc.spawn();
                  if(_.rand() < Params.crossOverRate){
                    g2 = spc.spawn();
                    while(g1.id() == g2.id() && (numAttempts--)){
                      g2 = spc.spawn()
                    }
                    baby= g1.id() != g2.id() ? this.crossOver(g1, g2) : g1;
                  }else{
                    baby = g1
                  }
                }
                baby.setID(this.nextGID());
                //now mutate this baby
                if(baby.numNeurons() < Params.maxPermittedNeurons)
                  baby.addNeuron(Params.chanceAddNode,
                                 this.innovHistory, Params.numTrysToFindOldLink);
                //now there's the chance a link may be added
                baby.addLink(Params.chanceAddLink,
                             Params.chanceAddRecurrentLink,
                             this.innovHistory,
                             Params.numTrysToFindLoopedLink, Params.numAddLinkAttempts);
                //mutate the weights
                baby.mutateWeights(Params.mutationRate,
                                   Params.probabilityWeightReplaced,
                                   Params.maxWeightPerturbation);
                baby.mutateActivation(Params.activationMutationRate,
                                      Params.maxActivationPerturbation);
              }
              newPop.push(baby.sortGenes());
              if(++numSpawnedSoFar == this.popSize){ numToSpawn = 0 }
            }
          }
        });
        //if there is an underflow due to the rounding error and the amount
        //of offspring falls short of the population size additional children
        //need to be created and added to the new population. This is achieved
        //simply, by using tournament selection over the entire population.
        if(numSpawnedSoFar < this.popSize){
          //calculate amount of additional children required
          let rqd = this.popSize - numSpawnedSoFar;
          while(rqd--)
            newPop.push(this.tournamentSelection(int(this.popSize/ 5)).clone());
        }
        //replace the current population with the new one
        this.vecGenomes = newPop;
        ++this.generation;
        return this.createPhenotypes();
      }
      /**Cycles through all the members of the population and creates their phenotypes.
       * @return {NeuralNet[]} the new phenotypes
       */
      createPhenotypes(){
        return this.vecGenomes.map(g=> g.createPhenotype( this.calculateNetDepth(g)))
      }
      //renders the best performing species statistics and a visual aid
      //showing the distribution.
      renderSpeciesInfo(){}
      numSpecies(){return this.vecSpecies.length}
      bestEverFitness(){return this._bestEverFitness}
      /**
       * @return {NeuralNet[]} the n best phenotypes from the previous generation.
       */
      getBestPhenotypesFromLastGeneration(){
        return this.vecBestGenomes.map((g,i)=> {
          g.createPhenotype(this.calculateNetDepth(g))
        })
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      NeatGA, NeuralNet, Genome, NeuronGene, LinkGene, NLink, NNeuron, Species,
      NumFitness, InnovHistory, NeuronType, InnovType, RunType,
      configParams(options){
        return _.inject(Params,options)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"))
  }else{
    gscope["io/czlab/mcfud/algo/NEAT"]=_module
  }

})(this)



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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const int=Math.floor;
    const {u:_, is}= Core;

    /**
     * @module mcfud/algo/NEAT2
     */

    const NeuronType={
      INPUT:0, OUTPUT:1,BIAS:2,HIDDEN:3
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Create a numeric fitness object.
     * @memberof module:mcfud/algo/NEAT2
     * @param {number} v
     * @param {boolean} flipped
     * @return {object}
     */
    function NumFitness(v,flip=false){
      return{
        value:v,
        gt(b){
          return flip? this.value < b.value: this.value > b.value
        },
        eq(b){
          return this.value==b.value
        },
        lt(b){
          return flip? this.value > b.value: this.value < b.value
        },
        score(){
          return this.value
        },
        update(v){
          this.value=v;
        },
        clone(){
          return NumFitness(this.value, flip)
        }
      }
    }

    const NumFIT=NumFitness;
    const Params={
      BIAS:1,
      nextInnovNo: 1,
      superSpeed:1,
      mutationRate:0.8,
      crossOverRate:0.25,
      probAddLink:0.07,
      probAddNode:0.03,
      probCancelLink:0.75,
      probAddRecurrentLink: 0.05,
      probWeightReplaced:0.1,
      maxWeightPerturbation:1/50,
      //how long we allow a species to exist without any improvement
      noImprovementLimit:15,
      excessCoeff: 1,
      weightDiffCoeff: 0.5,
      compatibilityThreshold : 3 //0.26
    };

    /**A connection between 2 nodes
     * @class
     */
    class LinkGene{
      /**
       * @param {Neuron} from
       * @param {Neuron} to
       * @param {number} w
       * @param {number} innovID
       */
      constructor(from, to, w, innovID){
        this.innovNo = innovID;
        this.fromNode = from;
        this.toNode = to;
        this.weight = w;
        this.enabled = true;
      }
      /**
       */
      mutateWeight(){
        if(_.rand()<Params.probWeightReplaced){
          this.weight = _.randMinus1To1();
        }else{
          this.weight += _.randGaussian() * Params.maxWeightPerturbation;
        }
        if(this.weight>1){ this.weight=1 }
        if(this.weight < -1){ this.weight = -1 }
      }
      clone(from, to){
        let c= new LinkGene(from, to, this.weight, this.innovNo);
        c.enabled = this.enabled;
        return c;
      }
    }

    /**Genetic history.
     * @class
     */
    class InnovHistory{
      /**
       * @param {number} from
       * @param {number} to
       * @param {number} inno
       * @param {number[]} innovationNos
       */
      constructor(from, to, inno, innovationNos){
        this.fromNode = from;
        this.toNode = to;
        this.innovNumber = inno;
        //the innovation numbers from the connections of the genome which first had this mutation
        //this represents the genome and allows us to test if another genoeme is the same
        //this is before this connection was added
        this.innovNumbers = innovationNos.slice();
      }
      /**Check if the genome matches the original genome and
       * the connection is between the same neurons.
       * @param {Genome} genome
       * @param {Neuron} from
       * @param {Neuron} to
       * @return {boolean}
       */
      matches(genome, from, to){
        //if the number of connections are different then the genoemes aren't the same
        if(genome.genes.length == this.innovNumbers.length &&
           from.number == this.fromNode && to.number == this.toNode){
          //check if all the innovation numbers match from the genome
          for(let i=0; i<genome.genes.length; ++i){
            if(!this.innovNumbers.includes(genome.genes[i].innovNo)){
              return false
            }
          }
          //if reached this far then the innovationNumbers match the genes
          //and the connection is between the same nodes so it does match
          return true;
        }
        return false;
      }
    }

    /**
     * @class
     */
    class Neuron{
      /**
       * @param {NeuronType} type
       * @param {number} id
       * @param {number} layer
       */
      constructor(type, id, layer=0){
        this.outputConnections = []; //LinkGenes
        this.layer = layer;
        this.neuronType=type;
        this.pos = [0,0];
        this.number = id;
        this.inputSum = 0; //current sum i.e. before activation
        this.outputValue = 0; //after activation function is applied
      }
      /**The neuron sends its output to the inputs
       * of the neurons its connected to.
       * @return {Neuron} this
       */
      engage(){
        //no sigmoid for the inputs and bias
        if(this.layer != 0)
          this.outputValue = this.sigmoid(this.inputSum);
        for(let i=0; i<this.outputConnections.length; ++i){
          //sum += (input[i] * weight[i])
          if(this.outputConnections[i].enabled)
            this.outputConnections[i].toNode.inputSum += this.outputConnections[i].weight * this.outputValue;
        }
        return this;
      }
      /**Activation function.
       * @return {number} 1 or 0
       */
      stepFunction(x){
        return x<0?0:1
      }
      /**Activation function.
       * @return {number}
       */
      sigmoid(x){
        //y=1/(1+e^(-x))
        return 1 / (1 + Math.pow(Math.E, -4.9*x))
      }
      sigmoid2(netinput, response){
        return 1 / ( 1 + Math.exp(-netinput / response))
      }
      /**Whether this neuron is connected to the `node`.
       * @param {Neuron} node
       * @return {boolean}
       */
      isConnectedTo(node){
        let a,b;
        if(node.layer<this.layer){
          a=node;b=this;
        }else if(node.layer>this.layer){
          a=this; b=node;
        }
        if(a && b)
          for(let i=0; i<a.outputConnections.length; ++i){
            if(a.outputConnections[i].toNode === b) return true;
          }
        return false;
      }
      clone(){
        return new Neuron(this.neuronType, this.number,this.layer)
      }
    }

    /**
     * @class
     */
    class Genome{
      /**
       * @param {number} inputs
       * @param {number} outputs
       * @param {boolean} crossOver
       */
      constructor(inputs, outputs, crossOver=false){
        this.outputs = outputs;
        this.fitness=NumFIT(0);
        this.inputs = inputs;
        this.layers = 2;
        this.nextNode = 0;
        //the phenotype
        this.network = [];
        //genes=== connections
        this.genes = [];
        //nodes=== neurons
        this.nodes = crossOver? [] : this.ctor(inputs,outputs,[]);
      }
      ctor(inputs,outputs,nodes){
        //make the inputs nodes
        for(let i=0; i<inputs; ++i){
          nodes.push(new Neuron(NeuronType.INPUT, i));
          ++this.nextNode;
        }
        //and the output nodes
        for(let i=0; i<outputs; ++i){
          nodes.push(new Neuron(NeuronType.OUTPUT, i+inputs, 1));
          ++this.nextNode;
        }
        //lock onto the BIAS node
        this.biasNode = this.nextNode;
        this.nextNode++;
        nodes.push(new Neuron(NeuronType.BIAS, this.biasNode));
        return nodes;
      }
      /**
       * @param {object} x
       * @return {Genome} this
       */
      bindTo(x){
        this.husk=x;
        return (x.brain=this);
      }
      /**Get the neuron with a matching number.
       * @param {number} id
       * @return {Neuron}
       */
      getNeuron(id){
        return this.nodes.find(n=> n.number == id)
      }
      /**Build up the network.
       * @return {Genome} this
       */
      connectNeurons(){
        //clean slate
        this.nodes.forEach(n=> n.outputConnections.length=0);
        //then
        this.genes.forEach(g=> g.fromNode.outputConnections.push(g));
        return this;
      }
      /**Feeding in input values to the NN and returning output array
       * @param {number[]} values
       * @return {number[]}
       */
      update(values){
        _.assert(this.network.length>0,"invalid network");
        _.assert(values.length==this.inputs, "invalid input values");
        for(let n,i=0; i<this.inputs; ++i){
          n=this.nodes[i];
          n.outputValue = values[i];
          _.assert(n.neuronType==NeuronType.INPUT, "invalid input neuron");
        }

        //run it
        this.nodes[this.biasNode].outputValue = Params.BIAS;
        this.network.forEach(n=> n.engage());

        //the outputs are this.nodes[inputs] to this.nodes [inputs+outputs-1]
        const outs=[];
        for(let n,i=0; i<this.outputs; ++i){
          n=this.nodes[this.inputs + i];
          outs[i] = n.outputValue;
          _.assert(n.neuronType==NeuronType.OUTPUT, "invalid output neuron");
        }

        //reset all the this.nodes for the next feed forward
        this.nodes.forEach(n=> n.inputSum = 0);

        return outs;
      }
      compute(values){
        return this.update(values)
      }
      /**Sets up the NN.
       * @return {Genome} this
       */
      generateNetwork(){
        this.connectNeurons();
        _.cls(this.network);
        //for each layer add the node in that layer,
        //since layers cannot connect to themselves
        //there is no need to order nodes within a layer
        for(let y=0; y<this.layers; ++y)
          for(let i=0; i<this.nodes.length; ++i)
            if(this.nodes[i].layer == y) this.network.push(this.nodes[i]);
        return this;
      }
      /**Mutate the NN by adding a new node, it does this by
       * picking a random connection and disabling it then 2
       * new connections are added 1 between the input node of
       * the disabled connection and the new node and the other
       * between the new node and the output of the disabled connection
       * @param {InnovHistory[]} history
       * @return {Genome} this
       */
      addNeuron(history){
        if(this.genes.length == 0)
          return this.addLink(history);
        //////
        let tries=10,rc =0;
        if(this.genes.length>1)
          rc=_.randInt(this.genes.length);
        //don't want BIAS node
        while(this.genes[rc].fromNode.neuronType==NeuronType.BIAS && tries>0){
          rc=_.randInt(this.genes.length);
          tries--;
        }

        if(tries<=0){
          console.warn("failed to add neuron");
          return this;
        }

        this.genes[rc].enabled = false;
        ///
        let cinv, newNode,
            newNodeNo=this.nextNode;
        this.nodes.push(new Neuron(NeuronType.HIDDEN,newNodeNo));
        ++this.nextNode;
        //add a new link to the new node with a weight = 1
        newNode=this.getNeuron(newNodeNo);
        cinv = this.getInnovNo(history, this.genes[rc].fromNode, newNode);
        this.genes.push(new LinkGene(this.genes[rc].fromNode, newNode, 1, cinv));
        cinv = this.getInnovNo(history, newNode, this.genes[rc].toNode);
        //add a new link from the new node with a weight the same as the old connection
        this.genes.push(new LinkGene(newNode, this.genes[rc].toNode, this.genes[rc].weight, cinv));
        newNode.layer = 1+this.genes[rc].fromNode.layer;
        ///
        cinv = this.getInnovNo(history, this.nodes[this.biasNode], newNodeNo);
        //connect the bias to the new node with a weight of 0
        this.genes.push(new LinkGene(this.nodes[this.biasNode], newNode, 0, cinv));
        //if the layer of the new node is equal to the layer of the output node of the old connection then a new layer needs to be created
        //more accurately the layer numbers of all layers equal to or greater than this new node need to be incrimented
        if(newNode.layer == this.genes[rc].toNode.layer){
          //dont include this newest node
          for(let i=0; i<this.nodes.length-1; ++i){
            if(this.nodes[i].layer >= newNode.layer){
              this.nodes[i].layer+=1;
            }
          }
          ++this.layers;
        }
        return this.connectNeurons();
      }
      /**
       * @param {InnovHistory[]} history
       * @return {Genome} this
       */
      addLink(history){
        if(this.fullyConnected()){
          console.warn("addLink failed, too full");
          return this;
        }
        let rn1 = _.randInt(this.nodes.length),
            rn2 = _.randInt(this.nodes.length),
            tries=10, cin,temp,badPair=(r1,r2)=>{
              return this.nodes[r1].layer == this.nodes[r2].layer ||
                     this.nodes[r1].isConnectedTo(this.nodes[r2])
            };
        while(badPair(rn1, rn2) && tries>0){
          rn1 = _.randInt(this.nodes.length);
          rn2 = _.randInt(this.nodes.length);
          --tries;
        }

        if(tries<=0){
          console.log("failed to add-link");
          return this;
        }

        if(this.nodes[rn1].layer > this.nodes[rn2].layer){
          temp = rn2;
          rn2 = rn1;
          rn1 = temp;
        }
        //get the innovation number of the connection
        //this will be a new number if no identical genome has mutated in the same way
        cin = this.getInnovNo(history, this.nodes[rn1], this.nodes[rn2]);
        //add the connection with a random array
        //changed this so if error here
        this.genes.push(new LinkGene(this.nodes[rn1], this.nodes[rn2], _.randMinus1To1(), cin));
        return this.connectNeurons();
      }
      /**Get the innovation number for the new mutation
       * if this mutation has never been seen before then
       * it will be given a new unique innovation number
       * if this mutation matches a previous mutation then
       * it will be given the same innovation number as the previous one
       * @param {InnovHistory[]} history
       * @param {Neuron} from
       * @param {Neuron} to
       * @return {number}
       */
      getInnovNo(history, from, to){
        let isNew = true,
            innovNo = Params.nextInnovNo;
        for(let i=0; i<history.length; ++i){
          if(history[i].matches(this, from, to)){
            isNew = false;
            //set the innovation number as the innovation number of the match
            innovNo = history[i].innovNumber;
            break;
          }
        }
        //if the mutation is new then create an arrayList of varegers representing the current state of the genome
        if(isNew){
          //then add this mutation to the innovationHistory
          history.push(new InnovHistory(from.number, to.number,
                                        innovNo,
                                        this.genes.map(g=> g.innovNo)));
          Params.nextInnovNo+=1;
        }
        return innovNo;
      }
      /**Check whether the network is fully connected or not.
       * @return {boolean}
       */
      fullyConnected(){
        let maxConnections = 0,
            nodesInLayers = _.fill(this.layers, 0);
        this.nodes.forEach(n=> nodesInLayers[n.layer] += 1);
        //for each layer the maximum amount of connections is the number in this layer * the number of this.nodes infront of it
        //so lets add the max for each layer together and then we will get the maximum amount of connections in the network
        for(let before, i=0; i<this.layers-1; ++i){
          before = 0;
          for(let j= i+1; j<this.layers; ++j){
            before += nodesInLayers[j];
          }
          maxConnections += before*nodesInLayers[i];
        }
        //if the number of connections is equal to the max number of connections possible then it is full
        return maxConnections <= this.genes.length;
      }
      /**
       * @param {InnovHistory[]} history
       * @return {Genome} this
       */
      mutate(history){
        if(this.genes.length == 0)
          this.addLink(history);

        if(_.rand() < Params.mutationRate){
          this.genes.forEach(g=> g.mutateWeight())
        }

        if(_.rand() < Params.probAddLink){
          this.addLink(history)
        }

        //1% of the time add a node
        if(_.rand() < Params.probAddNode){
          this.addNeuron(history);
        }

        return this;
      }
      /**Called when this Genome is better that the other parent
       * @param {Genome} parent2
       * @return {Genome} new child
       */
      crossOver(parent2){
        let isEnabled = [],  // bools
            childGenes = [], // LinkGene
            child = new Genome(this.inputs, this.outputs, true);
        //copy of this
        child.nextNode = this.nextNode;
        child.layers = this.layers;
        child.biasNode = this.biasNode;
        //all inherited genes
        let p2,setEnabled;
        for(let i=0; i<this.genes.length; ++i){
          setEnabled = true;
          p2 = this.matchingGene(parent2, this.genes[i].innovNo);
          if(p2 != -1){
            if(!this.genes[i].enabled || !parent2.genes[p2].enabled){
              if(_.rand() < Params.probCancelLink) setEnabled = false;
            }
            childGenes.push(_.rand() < 0.5 ? this.genes[i] : parent2.genes[p2]);
          }else{
            //disjoint or excess gene
            childGenes.push(this.genes[i]);
            setEnabled = this.genes[i].enabled;
          }
          isEnabled.push(setEnabled);
        }
        //since all excess and disjovar genes are inherrited from
        //the more fit parent (this Genome) the childs structure is
        //no different from this parent | with exception of dormant
        //connections being enabled but this wont effect this.nodes
        //so all the this.nodes can be inherrited from this parent
        this.nodes.forEach(n=> child.nodes.push(n.clone()));
        //clone all the connections
        for(let i=0; i< childGenes.length; ++i){
          child.genes.push(childGenes[i].clone(child.getNeuron(childGenes[i].fromNode.number),
                                               child.getNeuron(childGenes[i].toNode.number)));
          child.genes[i].enabled = isEnabled[i];
        }
        return child.connectNeurons();
      }
      /**Check whether or not there is a gene matching
       * the input innovation number  in the input genome.
       * @param {Genome} p
       * @param {number} innov
       * @return {number}
       */
      matchingGene(p, innov){
        for(let i=0; i<p.genes.length; ++i){
          if(p.genes[i].innovNo == innov) return i;
        }
        return -1;
      }
      /**Prints out info about the genome to the console
       * @return {Genome} this
       */
      printGenome(){
        console.log("Prvar genome  layers:" + this.layers);
        console.log("bias node: " + this.biasNode);
        console.log("this.nodes");
        for(let i=0; i<this.nodes.length; ++i){
          console.log(this.nodes[i].number + ",");
        }
        console.log("Genes");
        for(let i=0; i<this.genes.length; ++i){
          console.log("gene " + this.genes[i].innovNo +
                      "From node " + this.genes[i].fromNode.number +
                      "To node " + this.genes[i].toNode.number +
                      "is enabled " + this.genes[i].enabled +
                      "from layer " + this.genes[i].fromNode.layer +
                      "to layer " + this.genes[i].toNode.layer + "weight: " + this.genes[i].weight);
        }
        return this;
      }
      /**Make a copy.
       * @return {Genome}  new guy
       */
      clone(){
        let c= new Genome(this.inputs, this.outputs, true);
        this.nodes.forEach(n=> c.nodes.push(n.clone()));
        //copy all the connections so that they connect the clone new this.nodes
        this.genes.forEach(g=>{
          c.genes.push(g.clone(c.getNeuron(g.fromNode.number),
                               c.getNeuron(g.toNode.number)))
        });
        c.fitness=this.fitness.clone();
        c.layers = this.layers;
        c.nextNode = this.nextNode;
        c.biasNode = this.biasNode;
        return c.connectNeurons();
      }
      /**Draw the genome on the screen
       * @return {Genome} this
       */
      drawGenome(startX, startY, w, h){
        return this;
      }
    }

    /**
     * @class
     */
    class Species{
      /**
       * @param {Genome} p
       */
      constructor(p){
        this.bestFitness = 0;
        this.members = [];
        this.rep;
        this.staleness = 0; //how many generations the species has gone without an improvement
        this.averageFitness = 0;
        if(p){
          //since it is the only one in the species it is by default the best
          this.bestFitness = p.fitness.score();
          this.members.push(p);
          this.rep = p.clone();//champion
        }
      }
      /**Check whether the parameter genome is in this species.
       * @param {Genome} g
       * @return {boolean}
       */
      compatible(g){
        let excessAndDisjoint = this.getExcessDisjoint(g, this.rep),
            averageWeightDiff = this.averageWeightDiff(g, this.rep),
            compatibility, largeGenomeNormaliser = g.genes.length - 20;
        if(largeGenomeNormaliser < 1){
          largeGenomeNormaliser = 1
        }
        //compatibility formula
        compatibility = (Params.excessCoeff * excessAndDisjoint / largeGenomeNormaliser) +
                        (Params.weightDiffCoeff * averageWeightDiff);
        return Params.compatibilityThreshold > compatibility;
      }
      /**
       * @param {Genome} p
       * @return {Species} this
       */
      add(p){
        this.members.push(p);
        return this;
      }
      /**Get the number of excess and disjoint genes between
       * the 2 input genomes i.e. returns the number of genes which dont match.
       * @param {Genome} brain1
       * @param {Genome} brain2
       * @return {number}
       */
      getExcessDisjoint(brain1, brain2){
        let matching = 0;
        for(let i=0; i< brain1.genes.length; ++i){
          for(let j=0; j< brain2.genes.length; ++j){
            if(brain1.genes[i].innovNo == brain2.genes[j].innovNo){
              ++matching;
              break;
            }
          }
        }
        //return no of excess and disjoint genes
        return (brain1.genes.length + brain2.genes.length - 2*matching);
      }
      /**Get the avereage weight difference between matching genes in the input genomes
       * @param {Genome} brain1
       * @param {Genome} brain2
       * @return {number}
       */
      averageWeightDiff(brain1, brain2){
        if(brain1.genes.length == 0 ||
           brain2.genes.length == 0) { return 0 }
        let matching = 0,
            totalDiff = 0;
        for(let i=0; i< brain1.genes.length; ++i){
          for(let j=0; j< brain2.genes.length; ++j){
            if(brain1.genes[i].innovNo == brain2.genes[j].innovNo){
              ++matching;
              totalDiff += Math.abs(brain1.genes[i].weight - brain2.genes[j].weight);
              break;
            }
          }
        }
        return matching == 0? 100: totalDiff / matching;
      }
      /**Sort via fitness.
       */
      sortAsc(){
        this.members.sort((a,b)=>{
          return a.fitness.score()>b.fitness.score()?-1:( a.fitness.score()<b.fitness.score()?1:0)
        });
        if(this.members.length == 0){
          this.staleness = 200
        }else if(this.members[0].fitness.score() > this.bestFitness){
          this.bestFitness = this.members[0].fitness.score();
          this.rep = this.members[0].clone();
          this.staleness = 0;
        }else{
          ++this.staleness
        }
      }
      /**
       */
      setAverage(){
        this.averageFitness = this.members.reduce((acc,p)=>{ return acc + p.fitness.score() },0) / this.members.length;
      }
      /**Gets baby from the this.players in this species
       * @param {InnovHistory[]} history
       * @return {Genome} new guy
       */
      giveMeBaby(history){
        let baby, select=()=>{
          let total = this.members.reduce((acc,p)=>{
            return acc + p.fitness.score()
          },0),
              sum = 0, slice = _.rand() * total;
          for(let i=0; i< this.members.length; ++i){
            sum += this.members[i].fitness.score();
            if(sum > slice)
              return this.members[i];
          }
          return this.members[0];
        }
        if(_.rand() < Params.crossOverRate){
          baby = select().clone();
        }else{
          let par1 = select(),
              par2 = select();
          //the crossover function expects the highest fitness parent
          //to be the object and the lowest as the argument
          baby= par1.fitness.score() < par2.fitness.score() ? par2.crossOver(par1) : par1.crossOver(par2);
        }
        return baby.mutate(history);
      }
      /**Kills off bottom half of the species
       */
      cull(){
        if(this.members.length > 2)
          this.members.length= int(this.members.length / 2);
      }
      /**In order to protect unique this.players,
       * the fitnesses of each player is divided by
       * the number of this.players in the species that that player belongs to
       */
      fitnessSharing(){
        this.members.forEach(p=>{
          p.fitness.update(p.fitness.score()/this.members.length)
        })
      }
    }

    /**
     * @class
     */
    class NeatGA{
      /**
       * @param {number} size
       * @param {number} inputs
       * @param {number} outputs
       */
      constructor(size,inputs,outputs){
        this.history = [];
        this.species = [];
        this.gen = 1;
        this.genomes = _.fill(size, (i,g)=>{
          g=new Genome(inputs, outputs);
          g.mutate(this.history);
          return g.generateNetwork();
        });
      }
      /**Cycles through all the members of the population and creates their phenotypes.
       * @return {Genome[]} the current phenotypes
       */
      createPhenotypes(){
        return this.genomes;
      }
      /**Called when all the players are dead and a new generation needs to be made.
       */
      epoch(scores){
        let prevBest = this.gen==1? null: this.genomes[0];
        this.speciate();
        this.genomes.forEach((g,i)=>{ if(i>=0) g.fitness.update(scores[i]) });
        this.sortSpecies();
        this.resetAndKill();
        let children = [],
            numToSpawn,averageSum = this.getAvgFitnessSum();
        this.species.forEach(s=>{
          //add champion without any mutation
          children.push(s.rep.clone());
          //the number of children species is allowed,
          //note -1 is because the champ is already added
          numToSpawn = int(s.averageFitness/averageSum * this.genomes.length)-1;
          for(let i=0; i< numToSpawn; ++i)
            children.push(s.giveMeBaby(this.history));
        });
        if(!prevBest)
          prevBest=this.species[0].rep;
        if(children.length < this.genomes.length){
          children.push(prevBest.clone())
        }
        //get babies from the best species
        while(children.length < this.genomes.length)
          children.push(this.species[0].giveMeBaby(this.history));
        _.append(this.genomes, children, true);
        this.gen +=1;
        this.genomes.forEach(g=> g.generateNetwork());
        return this.genomes;
      }
      /**Seperate genomes into species based on how similar they are
       * to the leaders of each species in the previous run
       */
      speciate(){
        this.species.forEach(s=> _.cls(s.members));
        for(let f,g,i=0; i< this.genomes.length; ++i){
          g=this.genomes[i];
          f= false;
          for(let s=0;s<this.species.length;++s){
            if(this.species[s].compatible(g)){
              this.species[s].add(g);
              f= true;
              break;
            }
          }
          if(!f)
            this.species.push(new Species(g));
        }
      }
      /**Sorts the players within a specie and the species by their fitnesses
       */
      sortSpecies(){
        //sort each species internally
        this.species.forEach(s=> s.sortAsc());
        //then sort species by the fitness of its best player
        this.species.sort((a,b)=>{
          return a.bestFitness>b.bestFitness?-1:( a.bestFitness<b.bestFitness?1:0)
        });
      }
      /**Get the sum of each this.species average fitness
       * @return {number}
       */
      getAvgFitnessSum(){
        return this.species.reduce((acc,s)=>{
          return acc + s.averageFitness
        },0);
      }
      /**
       */
      resetAndKill(){
        let temp=[];
        this.species.forEach(s=>{
          s.cull(); //kill bottom half
          s.fitnessSharing(); //also while we're at it lets do fitness sharing
          s.setAverage(); //reset averages because they will have changed
        });
        //rid of stale ones
        for(let i=0; i<this.species.length; ++i){
          if(i<2){
            temp.push(this.species[i]);
          }else if(this.species[i].staleness < Params.noImprovementLimit){
            temp.push(this.species[i]); //keep it
          }
        }
        _.append(this.species, temp, true);
        //rid of bad
        let avgSum = this.getAvgFitnessSum();
        temp=[];
        for(let i=0; i<this.species.length; ++i){
          if(i<1){
            temp.push(this.species[i])
          }else if((this.species[i].averageFitness / avgSum * this.species.length)< 1){
            //delete
          }else{
            temp.push(this.species[i]); //keep
          }
        }
        _.append(this.species,temp,true);
      }
      massExtinction(){
        if(this.species.length>5) this.species.slice(0,5);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      NeatGA, Genome, LinkGene, Neuron, Species,
      NumFitness, InnovHistory,
      configParams(options){
        return _.inject(Params,options)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"))
  }else{
    gscope["io/czlab/mcfud/algo/NEAT2"]=_module
  }

})(this)



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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_M){

    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    if(!_M) _M= gscope["io/czlab/mcfud/math"]();

    const {is,u:_}= Core;

    /**
     * @module mcfud/algo_maze
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // Replace a character at index in a string
    function replaceAt(s, i, r){
      return (i> s.length-1)?s :`${s.substr(0,i)}${r}${s.substr(i+1)}`
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function stringVal(s, i){
      // Get the number value at a specific index in a string (0 or 1)
      return +s.charAt(i);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source
    //https://github.com/keesiemeijer/maze-generator
    class Maze1{
      /**
       * @param {number} rows
       * @param {number} cols
       * @param {string} entryType "D"|"H"|"V"
      */
      constructor(rows,cols,entryType="D", options={}){
        let {bias,removeWalls,maxWallsRemove} = options;
        this.bias= bias || "";
        this.removeWalls= removeWalls || 0;
        // Maximum 300 walls can be removed
        this.maxWallsRemove= maxWallsRemove || 300;
        this.ROWS=rows;
        this.COLS=cols;
        this.matrix = [];
        this.entryNodes = this.getEntryNodes(entryType);
      }
      generate(){
        this.getMatrix(this.parseMaze(
          //[visited, nswe]
          _.fill(this.COLS*this.ROWS, ()=> "01111")
        ));
        this.removeMazeWalls();
      }
      toAscii(){
        return ""
      }
      getIO(){
        let X = this.entryNodes.end.gate,
          E= this.entryNodes.start.gate;
        return {start: [E.x, E.y], end: [X.x, X.y]};
      }
      toGrid(){
        let r,out=[];
        this.matrix.forEach((row,y)=> {
          r=[];
          for(let i=0;i<row.length;++i){
            r[i]= row.charAt(i)=="1"?1:0
          }
          out.push(r);
        });
        return out;
      }
      parseMaze(nodes){
        const Position = { n: 1, s: 2, w: 3, e: 4, };
        const Opposite= { n: 2, s: 1, w: 4, e: 3 };
        let max = 0,
          visited = 0,
          moveNodes = [],
          biasCount = 0,
          biasFactor = 3,
          last=nodes.length-1,
          pos= _.randInt(nodes.length);
        if(this.bias){
          if("H" == this.bias){
            biasFactor = (this.COLS/100)>=1 ? _M.ndiv(this.COLS,100) + 2 : 3
          }else if("V" == this.bias){
            biasFactor = (this.ROWS/100)>=1 ? _M.ndiv(this.ROWS,100) + 2 : 3
          }
        }
        // Set start node visited.
        nodes[pos] = replaceAt(nodes[pos], 0, 1);
        let next,dir,dirs;
        while(visited < last){
          ++biasCount;
          ++max;
          next = this.getNeighbours(pos);
          dirs = Object.keys(next).filter(k=>
            -1 != next[k] && !stringVal(nodes[next[k]], 0));
          if(this.bias && (biasCount != biasFactor)){
            dirs = this.biasDirections(dirs);
          }else{
            biasCount = 0;
          }
          if(dirs.length){
            ++visited;
            if(dirs.length>1)
              moveNodes.push(pos);
            dir= dirs[_.randInt(dirs.length)];
            // Update current position
            nodes[pos] = replaceAt(nodes[pos], Position[dir], 0);
            // Set new position
            pos = next[dir];
            // Update next position
            nodes[pos] = replaceAt(nodes[pos], Opposite[dir], 0);
            nodes[pos] = replaceAt(nodes[pos], 0, 1);
          }else{
            if(moveNodes.length==0){ break }
            pos= moveNodes.pop();
          }
        }
        return nodes;
      }
      getMatrix(nodes){
        // Add the complete maze in a matrix where 1 is a wall and 0 is a corridor.
        let row1="",
          row2="",
          N = this.COLS* this.ROWS;
        _.assert(nodes.length == N,"invalid nodes");
        for(let i=0; i<N; ++i){
          row1 += row1.length==0 ? "1" : "";
          row2 += row2.length==0 ? "1" : "";
          if(stringVal(nodes[i], 1)){
            row1 += "11";
            row2 += stringVal(nodes[i], 4)? "01" : "00";
          }else{
            let hasAbove = nodes.hasOwnProperty(i-this.COLS);
            let above = hasAbove && stringVal(nodes[i-this.COLS], 4);
            let hasNext = nodes.hasOwnProperty(i+1);
            let next = hasNext && stringVal(nodes[i+1], 1);
            if(stringVal(nodes[i], 4)){
              row1 += "01";
              row2 += "01";
            }else if(next || above){
              row1 += "01";
              row2 += "00";
            }else{
              row1 += "00";
              row2 += "00";
            }
          }
          if((i+1) % this.COLS == 0){
            this.matrix.push(row1,row2);
            row1 = "";
            row2 = "";
          }
        }
        // Add closing row
        this.matrix.push("1".repeat((this.COLS * 2) + 1));
      }
      getEntryNodes(access){
        let entryNodes = {},
          y = ((this.ROWS * 2) + 1) - 2,
          x = ((this.COLS * 2) + 1) - 2;
        if("D" == access){
          entryNodes.start = { x: 1, y: 1, gate: { x: 0, y: 1 } };
          entryNodes.end = { x, y, gate: { x: x + 1, y } };
        }
        if("H" == access || "V" == access){
          let xy = ("H" == access) ? y : x;
          xy = ((xy - 1) / 2);
          let even = xy % 2 == 0;
          xy = even ? xy + 1 : xy;
          let start_x = ("H" == access) ? 1 : xy;
          let start_y = ("H" == access) ? xy : 1;
          let end_x = ("H" == access) ? x : (even ? start_x : start_x + 2);
          let end_y = ("H" == access) ? (even ? start_y : start_y + 2) : y;
          let startgate = ("H" == access) ? { x: 0, y: start_y } : { x: start_x, y: 0 };
          let endgate = ("H" == access) ? { x: x + 1, y: end_y } : { x: end_x, y: y + 1 };
          entryNodes.start = { x: start_x, y: start_y, gate: startgate };
          entryNodes.end = { x: end_x, y: end_y, gate: endgate };
        }
        return entryNodes;
      }
      biasDirections(dirs){
        let hz = dirs.indexOf("w") != -1 || dirs.indexOf("e") != -1,
          vt = dirs.indexOf("n") != -1 || dirs.indexOf("s") != -1;
        return ("H" == this.bias && hz)?
          dirs.filter(k=> "w" == k || "e" == k)
          : ("V" == this.bias && vt)?
          dirs.filter(k=> "n" == k || "s" == k) : dirs;
      }
      getNeighbours(pos){
        return {
          w: (pos>0 && (pos % this.COLS) != 0) ? pos-1 : -1,
          e: ((pos+1) % this.COLS) != 0 ? pos+1 : -1,
          n: (pos - this.COLS)>=0 ? pos - this.COLS : -1,
          s: ((this.COLS* this.ROWS) > (pos + this.COLS)) ? pos + this.COLS : -1
        }
      }
      removeWall(row, index){
        // Remove wall if possible.
        const evenRow = row % 2 == 0,
          evenIndex = index % 2 == 0,
          wall = stringVal(this.matrix[row], index);
        if(!wall){ return false }
        if(!evenRow && evenIndex){
          // Uneven row and even column
          const hasTop = (row-2 > 0) && (1 == stringVal(this.matrix[row-2], index));
          const hasBottom = (row + 2 < this.matrix.length) && (1 == stringVal(this.matrix[row + 2], index));
          if(hasTop && hasBottom){
            this.matrix[row] = replaceAt(this.matrix[row], index, "0");
            return true;
          }
          if(!hasTop && hasBottom){
            const left = 1 == stringVal(this.matrix[row - 1], index - 1);
            const right = 1 == stringVal(this.matrix[row - 1], index + 1);
            if (left || right) {
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }else if(!hasBottom && hasTop){
            const left = 1 == stringVal(this.matrix[row + 1], index - 1);
            const right = 1 == stringVal(this.matrix[row + 1], index + 1);
            if (left || right) {
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }
        }else if(evenRow && !evenIndex){
          // Even row and uneven column
          const hasLeft = 1 == stringVal(this.matrix[row], index - 2);
          const hasRight = 1 == stringVal(this.matrix[row], index + 2);
          if(hasLeft && hasRight){
            this.matrix[row] = replaceAt(this.matrix[row], index, "0");
            return true;
          }
          if(!hasLeft && hasRight){
            const top = 1 == stringVal(this.matrix[row - 1], index - 1);
            const bottom = 1 == stringVal(this.matrix[row + 1], index - 1);
            if(top || bottom){
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }else if(!hasRight && hasLeft){
            const top = 1 == stringVal(this.matrix[row - 1], index + 1);
            const bottom = 1 == stringVal(this.matrix[row + 1], index + 1);
            if(top || bottom){
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }
        }
      }
      removeMazeWalls(){
        if(this.removeWalls==0 ||
           this.matrix.length==0){ return }
        let min = 1,
          tries = 0,
          max = this.matrix.length - 1,
          row,walls, maxTries = this.maxWallsRemove;
        while(tries < maxTries){
          ++tries;
          // Did we reached the goal
          if(this.wallsRemoved >= this.removeWalls){ break }
          // Get random row from matrix
          let y =_.randInt2(min,max);
          y = (y == max) ? y - 1 : y;
          walls = [];
          row = this.matrix[y];
          // Get walls from random row
          for(let w,i = 0; i < row.length; i++){
            if(i == 0 || i == row.length - 1){ continue }
            if( stringVal(row, i)) walls.push(i);
          }
          // Shuffle walls randomly
          _.shuffle(walls);
          // Try breaking a wall for this row.
          for(let i = 0; i < walls.length; i++){
            if(this.removeWall(y, walls[i])){
              // Wall can be broken
              ++this.wallsRemoved;
              break;
            }
          }
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original
    //https://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking
    class Maze2{
      static DV={n:1,s:2,e:4,w:8};
      static DX = { e: 1, w: -1, n: 0, s: 0 };
      static DY = { e:0, w: 0, n: -1, s: 1 };
      static OPPOSITE= { e: "w", w:"e", n:"s",s:"n" };

      /**
       * @param {number} width
       * @param {number} height
       */
      constructor(width,height){
        this.COLS=width;
        this.ROWS=height;
        this._getEntryNodes();
      }
      _getEntryNodes(){
        let nodes = {},
          y = ((this.ROWS * 2) + 1) - 2,
          x = ((this.COLS * 2) + 1) - 2;
        nodes.start = { x: 1, y: 1, gate: { x: 0, y: 1 } };
        nodes.end = { x, y, gate: { x: x + 1, y } };
        this.entryNodes=nodes;
      }
      getIO(){
        let X = this.entryNodes.end.gate,
          E= this.entryNodes.start.gate;
        return {start: [E.x, E.y], end: [X.x, X.y]};
      }
      generate(){
        this.grid=this._walk(0, 0, _.fill(this.ROWS, ()=> _.fill(this.COLS, 0)))
      }
      canSouth(v){
        return (v & Maze2.DV["s"]) != 0
      }
      canEast(v){
        return (v & Maze2.DV["e"]) != 0
      }
      toAscii(){
        let g=this.grid,
          height= g.length,
          out=[], width= g[0].length;
        for(let s, y=0;y<height;++y){
          s="|";
          for(let x=0;x<width;++x){
            s+= this.canSouth(g[y][x]) ? " " : "_";
            if(this.canEast(g[y][x])){
              s+= this.canSouth(g[y][x] | g[y][x+1]) ? " " : "_";
            }else{
              s+= "|";
            }
          }
          out.push(s);
        }
        out.unshift("_".repeat(out[0].length));
        return out.join("\n");
      }
      _walk(cx, cy, grid){
        let nx,ny,dirs = _.shuffle(["n","s","e","w"]);
        dirs.forEach(d=>{
          nx = cx + Maze2.DX[d];
          ny = cy + Maze2.DY[d];

          if(ny>=0&&ny<grid.length &&
             nx>=0&&nx<grid[ny].length && grid[ny][nx]==0){
            grid[cy][cx] |= Maze2.DV[d];
            grid[ny][nx] |= Maze2.DV[Maze2.OPPOSITE[d]];
            this._walk(nx, ny, grid);
          }
        });
        return grid;
      }
      toGrid(){
        let g=this.grid,
          height=g.length,
          r1,r2,out=[], width=g[0].length;
        for(let k,s, y=0;y<height;++y){
          r1=[];
          r2=[];
          k=0;
          r1[k]=1;
          r2[k]=1;
          for(let x=0;x<width;++x){
            ++k;
            if(this.canSouth(g[y][x])){
              r1[k]=0;
              r2[k]=0;
            }else{
              r1[k]=0;
              r2[k]=1;
            }
            ++k;
            if(this.canEast(g[y][x])){
              r1[k]=0;
              r2[k]=1;
            }else{
              r1[k]=1;
              r2[k]=1;
            }
          }
          out.push(r1,r2);
        }
        out.unshift(_.fill(out[0].length, 1));
        return out;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      Maze1, Maze2
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("../main/core"),
                           require("../main/math"));
  }else{
    gscope["io/czlab/mcfud/algo/maze"]=_module
  }

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
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  "use strict";
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Creates the module.
   */
  function _module(Core,Colors){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    if(!Colors){
      throw "Fatal: No Colors!"
    }
    const {is,u:_}=Core;

    /** @module mcfud/test */

    /**
     * @typedef {object} TestSuiteObject
     * @property {function} ensure(name,func)
     * @property {function} eerror(name,func)
     * @property {function} begin(set-up)
     * @property {function} end(tear-down)
     */

    /**
     * @typedef {object} TestSuiteReport
     * @property {string} title
     * @property {string} date
     * @property {number} total
     * @property {number} duration
     * @property {any[]} passed
     * @property {any[]} skippd
     * @property {any[]} failed
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Checks for non-failure. */
    const _f=(s)=> !s.startsWith("F");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Make a string. */
    function rstr(len,ch){
      let out="";
      while(len>0){
        out += ch; --len }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Check if valid exception was thrown. */
    function ex_thrown(expected,e){
      let out=t_bad;
      if(e){
        if(is.str(expected)){
          out= expected=="any" || expected==e ? t_ok : t_bad
        }else if(expected instanceof e){ out=t_ok }
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Run the given form and check its result. */
    function ensure_eq(env,name,form){
      return new Promise((resolve,reject)=>{
        let out;
        try{
          out=form.call(env);
          if(out instanceof Promise){
            out.then(function(res){
              resolve(`${res?t_ok:t_bad}: ${name}`);
            })
          }else{
            out= out ? (out==709394?t_skip:t_ok) : t_bad;
            resolve(`${out}: ${name}`);
          }
        }catch(e){
          out= t_bad;
          resolve(`${out}: ${name}`);
        }
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** Run the given form and check if exception was thrown. */
    function ensure_ex(env,name,form,error){
      return new Promise((resolve,reject)=>{
        let out;
        try{
          out=form.call(env);
          out=out==709394?t_ok:ex_thrown(error,null);
        }catch(e){
          out=ex_thrown(error,e) }
        resolve(`${out}: ${name}`);
      })
    }

    /**
     * @private
     * @var {string}
     */
    const [t_skip,t_bad,t_ok]=["Skippd", "Failed", "Passed"];

    const _$={
      /**Print report to stdout.
       * @memberof module:mcfud/test
       * @param {TestSuiteReport} r
       */
      prn(r){
        const ok= r.passed.length;
        const sum=r.total;
        const perc=ok/sum*100;
        console.log(Colors.white(rstr(78,"+")));
        console.log(Colors.white.bold(r.title));
        console.log(Colors.white(r.date));
        console.log(Colors.white(rstr(78,"+")));
        if(r.passed.length>0)
          console.log(Colors.green(r.passed.join("\n")));
        if(r.skippd.length>0)
          console.log(Colors.grey(r.skippd.join("\n")));
        if(r.failed.length>0)
          console.log(Colors.magenta(r.failed.join("\n")));
        console.log(Colors.white(rstr(78,"=")));
        console.log(Colors.yellow(["Passed: ",ok,"/",sum," [",perc|0,"%]"].join("")));
        console.log(Colors.magenta(`Failed: ${sum-ok}`));
        console.log(Colors.white(["cpu-time: ",_.prettyMillis(r.duration)].join("")));
        console.log(Colors.white(rstr(78,"=")));
      },
      /**Define a test suite.
       * @memberof module:mcfud/test
       * @param {string} name
       * @return {TestSuiteObject}
       */
      deftest(name){
        let [iniz,finz,arr,env]= [null,null,null,null];
        const x={
          ensure(n,f){
            arr.push([1,n,f]);
            return x;
          },
          eerror(n,f){
            arr.push([911,n,f]);
            return x;
          },
          begin(f){
            env={};
            arr=[];
            iniz=f;
            return x;
          },
          end(f){
            finz=f;
            let F=function(){
              return new Promise((RR,j)=>{
                iniz && iniz(env);
                let _prev,out=[];
                for(let p,a,i=0;i<arr.length;++i){
                  a=arr[i];
                  switch(a[0]){
                    case 1: p=ensure_eq(env,a[1],a[2]); break;
                    case 911: p=ensure_ex(env,a[1],a[2],"any"); break; }
                  if(!_prev){_prev=p}else{
                    _prev= _prev.then(function(msg){
                      out.push(msg);
                      return p;
                    });
                  }
                }
                if(_prev){
                  _prev.then(function(msg){
                    out.push(msg);
                    arr.length=0;
                    finz && finz(env);
                    RR(out);
                  });
                }
              });
            };
            return (F.title=name) && F;
          }
        };
        return x;
      },
      /** @ignore */
      _run(test){
        return new Promise((resolve,reject)=>{
          test().then(function(arr){
            resolve(arr);
          });
        })
      },
      /**Execute this test suite.
       * @memberof module:mcfud/test
       * @param {function} test
       * @param {string} title
       * @return {Promise}
       */
      runtest(test,title){
        const mark= Date.now();
        return this._run(test).then(function(res){
          const mark2= Date.now();
          const out={
            title: title||test.title,
            date: new Date().toString(),
            total: res.length,
            duration: mark2-mark,
            passed: res.filter(s=>s[0]=="P"),
            skippd: res.filter(s=>s[0]=="S"),
            failed: res.filter(s=>s[0]=="F")
          };
          return new Promise((resolve)=>{
            resolve(out);
          })
        })
      }
    };

    return _$;
  }
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("./core"), require("colors/safe"))
  }else{
    gscope["io/czlab/mcfud/test"]= _module
  }

})(this);


