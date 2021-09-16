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
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */

;(function(window,doco,seed_rand){

  "use strict";

  if(typeof module==="object" && module.exports){
    seed_rand=require("../tpcl/seedrandom.min")
  }else{
    doco=window.document
  }

  /**Create the module.
  */
  function _module(){
    const root=window,
          MFL=Math.floor,
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
    function isEven(n){ return n>0 ? (n%2 === 0) : ((-n)%2 === 0) }
    function isUndef(o){ return o===undefined }
    function isColl(o){ return isVec(o)||isMap(o)||isObj(o) }

    //original source from https://developer.mozilla.org
    function completeAssign(target, source){
      let descriptors = Object.keys(source).reduce((descriptors, key) => {
        descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
        return descriptors;
      }, {});
      // By default, Object.assign copies enumerable Symbols, too
      Object.getOwnPropertySymbols(source).forEach(sym => {
        let descriptor = Object.getOwnPropertyDescriptor(source, sym);
        if (descriptor.enumerable) {
          descriptors[sym] = descriptor;
        }
      });
      Object.defineProperties(target, descriptors);
      return target;
    }

    /**
     * @module mcfud/core
     */

    /**
     * @private
     * @var {function}
     */
    let PRNG= seed_rand?seed_rand():new Math.seedrandom();

    /** @ignore */
    function _randXYInclusive(min,max){
      return MFL(PRNG() * (max-min+1) + min) }

    /** @ignore */
    function _preAnd(conds,msg){
      for(let c,i=0;i<conds.length;++i){
        c=conds[i];
        if(!c[0](c[1]))
          throw new TypeError(`wanted ${msg}`) }
      return true;
    }

    /** @ignore */
    function _preOr(conds,msg){
      for(let c,i=0;i<conds.length;++i){
        c=conds[i];
        if(c[0](c[1])){return true}
      }
      throw new TypeError(`wanted ${msg}`); }

    /** @ignore */
    function _pre(f,arg,msg){
      if(!f(arg)){
        throw new TypeError(`wanted ${msg}`) } else {return true} }

    //-- regex handling file names
    const BNAME=/(\/|\\\\)([^(\/|\\\\)]+)$/g;
    //-- regex handling file extensions
    const FEXT=/(\.[^\.\/\?\\]*)(\?.*)?$/;

    /** @ignore */
    function _fext(path,incdot){
      let t=FEXT.exec(path);
      if(t && t[1]){
        t= t[1].toLowerCase();
        if(!incdot) t=t.substring(1);
      }else{ t="" }
      return t;
    }

    /**
     * private
     * @var {number}
     */
    const EPSILON= 0.0000000001;

    /**
     * @private
     * @var {number}
     */
    let _seqNum= 0;

    /** @ignore */
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

    const _$={};

    /** @namespace module:mcfud/core.is */
    const is={
      /**Check if input(s) are type `function`.
       * @memberof module:mcfud/core.is
       * @param {any} f anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      fun(f,...args){ return _everyF(isFun,f,args) },
      /**Check if input(s) are type `string`.
       * @memberof module:mcfud/core.is
       * @param {any} s anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      str(s,...args){ return _everyF(isStr,s,args) },
      //void0(obj){ return obj === void 0 },
      /**Check if input(s) are type `undefined`.
       * @memberof module:mcfud/core.is
       * @param {any} obj anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      undef(o,...args){ return _everyF(isUndef,o,args) },
      /**Check if input(s) are type `Map`.
       * @memberof module:mcfud/core.is
       * @param {any} m anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      map(m,...args){ return _everyF(isMap,m,args) },
      /**Check if input(s) are type `Set`.
       * @memberof module:mcfud/core.is
       * @param {any} m anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      set(s,...args){ return _everyF(isSet,s,args) },
      /**Check if input(s) are type `number`.
       * @memberof module:mcfud/core.is
       * @param {any} n anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      num(n,...args){ return _everyF(isNum,n,args) },
      /**Check if input is a boolean.
       * @memberof module:mcfud/core.is
       * @param {boolean} n
       * @return {boolean}
       */
      bool(n,...args){ return _everyF(isBool,n,args) },
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
      vec(v,...args){ return _everyF(isVec,v,args) },
      /**Check if input(s) are type `object`.
       * @memberof module:mcfud/core.is
       * @param {any} o anything
       * @param {...any} args more of anything
       * @return {boolean}
       */
      obj(o,...args){ return _everyF(isObj,o,args) },
      /**Check if this collection is `not empty`.
       * @memberof module:mcfud/core.is
       * @param {object|array|map} o
       * @return {boolean}
       */
      some(o){ return _.size(o) > 0 },
      /**Check if this collection is `empty`.
       * @memberof module:mcfud/core.is
       * @param {object|array|map} o
       * @return {boolean}
       */
      none(o){ return _.size(o) === 0 },
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
      error(...args){
        console.error(...args) },
      /** log message */
      log(...args){
        console.log(...args) },
      /**Re-seed the internal prng object.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      srand(){ PRNG= seed_rand?seed_rand():new Math.seedrandom() },
      /**Check if this float approximates zero.
       * @memberof module:mcfud/core._
       * @param {number} a
       * @return {boolean}
       */
      feq0(a){ return Math.abs(a) < EPSILON },
      /**Check if these 2 floats are equal.
       * @memberof module:mcfud/core._
       * @param {number} a
       * @param {number} b
       * @return {boolean}
       */
      feq(a, b){ return Math.abs(a-b) < EPSILON },
      /** Fuzzy greater_equals */
      //fgteq(a,b){ return a>b || this.feq(a,b) },
      /** Fuzzy less_equals */
      //flteq(a,b){ return a<b || this.feq(a,b) },
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
      p2(x=0,y=0){ return {x: x, y: y} },
      /**Unless n is a number, return it else 0.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @return {number} n or 0
       */
      numOrZero(n){ return isNaN(n) ? 0 : n },
      /**Unless a is defined, return it else b.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @param {any} b
       * @return {any} a or b
       */
      setVec(a,...args){
        args.forEach((v,i)=> a[i]=v)
      },
      /**If not even, make it even.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @return {number}
       */
      evenN(n,dir){
        n=Math.floor(n);
        return isEven(n)?n:(dir?n+1:n-1) },
      /**Check if a is null or undefined - `not real`.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @return {boolean}
       */
      nichts(a){return a===undefined||a===null},
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
      percentRemain(amt, total){ return (amt%total)/total },
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
      /**Assert that the condition is not true.
       * @memberof module:mcfud/core._
       * @param {any} a boolean expression
       * @param {...any} anything
       * @throws Error if condition is true
       * @return {boolean} true
       */
      assertNot(cond,...args){
        return this.assert(!cond,...args)
      },
      /**Assert that the condition is true.
       * @memberof module:mcfud/core._
       * @param {any} a boolean expression
       * @param {...any} anything
       * @throws Error if condition is false
       * @return {boolean} true
       */
      assert(cond,...args){
        if(!cond)
          throw args.length===0 ? "Assertion!" : args.join("");
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
        //if(r) console.log("keyfound="+r);
        //return !r;
      },
      /**Get a random int between min and max (inclusive).
       * @memberof module:mcfud/core._
       * @param {number} min
       * @param {number} max
       * @return {number}
       */
      randInt2(min,max){ return _randXYInclusive(min,max) },
      /**Get a random float between min and max.
       * @memberof module:mcfud/core._
       * @param {number} min
       * @param {number} max
       * @return {number}
       */
      randFloat(min, max){
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
      randInt(num){ return MFL(PRNG()*num) },
      /**Get a random float between 0 and 1.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      rand(js=false){ return js? Math.random(): PRNG() },
      /**Randomly choose -1 or 1.
       * @memberof module:mcfud/core._
       * @return {number}
       */
      randSign(){ return PRNG()>0.5 ? -1 : 1 },
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
        let n=0;
        for(let i=0; i<s.length; ++i)
          n= Math.imul(31, n) + s.charCodeAt(i)
        return n;
      },
      /**Randomly choose an item from this array.
       * @memberof module:mcfud/core._
       * @param {any[]} arr
       * @return {any}
       */
      randItem(arr){
        let rc;
        if(arr){
          switch(arr.length){
            case 0:
            case 1:
              rc=arr[0];
              break;
            case 2:
              rc= this.randSign()>0? arr[1]:arr[0];
              break;
            default:
              rc= arr[MFL(PRNG()*arr.length)];
          }
        }
        return rc;
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
        let out=new Map();
        for(let i=0;i<args.length;){
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
        let out={};
        for(let i=0;i<args.length;){
          out[args[i]]=args[i+1]; i+=2; }
        return out;
      },
      /**Creates a javascript array.
       * @memberof module:mcfud/core._
       * @param {...any} args data to initialize array
       * @return {any[]}
       */
      jsVec(...args){ return args.length===0 ? [] : args.slice() },
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
        const len= Math.min(des.length,src.length);
        for(let i=0;i<len;++i) des[i]=src[i];
        return des;
      },
      /**Append all or some items from `src` to `des`.
       * @memberof module:mcfud/core._
       * @param {any[]} des
       * @param {any[]} src
       * @return {any[]}
       */
      append(des,src=[]){
        _preAnd([[isVec,des],[isVec,src]],"arrays");
        for(let i=0;i<src.length;++i) des.push(src[i]);
        return des;
      },
      /**Fill array with v.
       * @memberof module:mcfud/core._
       * @param {number|any[]} a if number, creates array of `a` size
       * @param {number|function} v
       * @return {any[]}
       */
      fill(a,v,...args){
        if(isNum(a)){a= new Array(a)}
        if(isVec(a))
          for(let i=0;i<a.length;++i)
            a[i]= isFun(v) ? v(...args) : v;
        return a;
      },
      /**Get the size of this input.
       * @memberof module:mcfud/core._
       * @param {object|array|string|map|set} o
       * @return {number}
       */
      size(o){
        return (isVec(o)||isStr(o)) ? o.length
                                    : (isSet(o)||isMap(o)) ? o.size
                                       : o ? this.keys(o).length : 0
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
        if(arguments.length===1){
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
              j= MFL(PRNG() * (i+1));
              x= res[i];
              res[i] = res[j];
              res[j] = x;
            }
        }
        return inplace?this.copy(obj,res):res;
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
       * @param {any} args
       */
      dotimes(n,fn,target,...args){
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
      conj(coll,...items){
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
        if(typeof arg === "string")
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
        return arguments.length===1 ? false
          : isMap(coll) ? coll.has(key)
          : isVec(coll) ? coll.indexOf(key) !== -1
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
      inject(des,...args){
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
        const out = [];
        for(let i=0,z=v.length; i<z; ++i)
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
          if(typeof ext !== "object" || ext === null || !original[key]){
            original[key] = ext;
          }else{
            if(typeof original[key] !== "object"){
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
       * @return {string}
      */
      prettyNumber(num, digits=2){
        return this.strPadLeft(Number(num).toString(), digits, "0")
      },
      /**Pretty print millis in nice
       * hour,minutes,seconds format.
       * @memberof module:mcfud/core._
       * @param {number} ms
       * @return {string}
       */
      prettyMillis(ms){
        let h,m,s= MFL(ms/1000);
        m=MFL(s/60);
        ms=ms-s*1000;
        s=s-m*60;
        h= MFL(m/60);
        m=m-h*60;
        let out=[];
        out.push(`${s}.${ms} secs`);
        if(m>0 || h>0)
          out.push(`${m} mins, `);
        if(h>0)
          out.push(`${h} hrs, `);
        return out.reverse().join("");
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
        if(arguments.length===2 &&
           arguments[1].hack===911){ wnd=arguments[1] }
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
        if(isVec(event) && arguments.length===1)
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
        if(isVec(event) && arguments.length===1)
          event.forEach(e => this.delEvent.apply(this, e));
        else
          target.removeEventListener(event,cb,arg)
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
      pub(subject,...args){
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
        if(arguments.length===1 && !is.vec(subject)){
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
  if(typeof module==="object" && module.exports){
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
// Copyright © 2013-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

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
    const {is,u:_}= Core;

    /**
     * @module mcfud/math
     */

    /** @ignore */
    function _mod_deg(deg){
      return deg<0 ? -(-deg%DEG_2PI) : deg%DEG_2PI }

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
        return x<0 ? x-(-(N + N*Math.floor(-x/N))) : x%N
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
        const biasRelative= 0.95;
        const biasAbsolute= 0.01;
        return a >= (b*biasRelative + a*biasAbsolute)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
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
// Copyright © 2020-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

  "use strict";

  /**Creates the module.
  */
  function _module(Core=null){
    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const {u:_, is}= Core;

    function assertArgs(a,b){
      _.assert(!is.num(a) && !is.num(b) && a && b, "wanted 2 vecs");
    }

    function assertArg(a){
      _.assert(!is.num(a) && a, "wanted vec");
    }

    function _ctor(b,x=0,y=0){ return b ? [x,y] : {x:x,y:y} }

    const MVPool={};

    class MV{
      constructor(){
        this.x=0;
        this.y=0;
      }
      unit(out){
        if(is.bool(out)){ out=_ctor(out) }
        if(is.vec(out)){out[0]=this.x;out[1]=this.y}else{
          out.x=this.x;out.y=this.y;
        }
        return out;
      }
      bind(v){
        if(is.vec(v)){this.x=v[0];this.y=v[1]}else{
          this.x=v.x;this.y=v.y
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

    /**Rotate a vector around a pivot. */
    function _v2rot(ax,ay,cos,sin,cx,cy,out){
      const x_= ax-cx;
      const y_= ay-cy;
      const x= cx+(x_*cos - y_*sin);
      const y= cy+(x_ * sin + y_ * cos);
      if(is.vec(out)){
        out[0]=x;out[1]=y;
      }else{
        out.x=x;out.y=y;
      }
      return out;
    }

    function _opXXX(a,b,op,local){
      let p1=MVPool.take().bind(a);
      let out,pr;
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

    const _$={
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
        return _.assert(arguments.length===2) && _opXXX(a,b,"+") },
      /**Vector addition: A=A+B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      add$(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"+",true) },
      /**Vector subtraction: A-B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      sub(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"-") },
      /**Vector subtraction: A=A-B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      sub$(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"-",true) },
      /**Vector multiply: A*B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      mul(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"*") },
      /**Vector multiply: A=A*B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      mul$(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"*",true) },
      /**Vector division: A/B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      div(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"/") },
      /**Vector division: A=A/B
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {number|Vec2} b
       * @return {Vec2}
       */
      div$(a,b){
        return _.assert(arguments.length===2) && _opXXX(a,b,"/",true) },
      /**Dot product of 2 vectors,
       * cos(t) = a·b / (|a| * |b|)
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      dot(a,b){
        assertArgs(a,b);
        let p1=MVPool.take().bind(a);
        let p2=MVPool.take().bind(b);
        let out=p1.x*p2.x + p1.y*p2.y;
        MVPool.drop(p1,p2);
        return out;
      },
      /**Create a vector A->B, calculated by doing B-A.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      vecAB(a,b){
        assertArgs(a,b);
        let p1=MVPool.take().bind(a);
        let p2=MVPool.take().bind(b);
        let pr=MVPool.take();
        pr.x=p2.x-p1.x;
        pr.y=p2.y-p1.y;
        let out=pr.unit(is.vec(a));
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
      dist(a,b){ return Math.sqrt(this.dist2(a,b)) },
      /**Normalize this vector: a/|a|
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {Vec2} undefined if zero length
       */
      unit(a){
        let p1=MVPool.take().bind(a);
        let d=this.len(a);
        if(_.feq0(d)){
          p1.x=0;
          p1.y=0;
        }else{
          p1.x /= d;
          p1.y /= d;
        }
        let out= p1.unit(is.vec(a));
        MVPool.drop(p1);
        return out;
      },
      /**Normalize this vector: a=a/|a|
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @return {Vec2} undefined if zero length
       */
      unit$(a){
        let p1=MVPool.take().bind(a);
        let d=this.len(a);
        if(_.feq0(d)){
          p1.x=0;
          p1.y=0;
        }else{
          p1.x /= d;
          p1.y /= d;
        }
        let out= p1.unit(a);
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
        let p1=MVPool.take().bind(des);
        let p2=MVPool.take().bind(src);
        p1.x=p2.x;
        p1.y=p2.y;
        let out= p1.unit(des);
        MVPool.drop(p1,p2);
        return out;
      },
      /**Make a copy of this vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} v
       * @return {Vec2}
       */
      clone(v){
        let p1= MVPool.take().bind(v);
        let out= p1.unit(is.vec(v));
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
        let p1= MVPool.take().bind(des);
        if(is.num(x)) p1.x=x;
        if(is.num(y)) p1.y=y;
        let out= p1.unit(des);
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
        let p1= MVPool.take().bind(a);
        let cx=0,cy=0;
        if(pivot){
          let p2=MVPool.take().bind(pivot);
          cx=p2.x;
          cy=p2.y;
          MVPool.drop(p2);
        }
        let out= _v2rot(p1.x,p1.y,
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
        let p1= MVPool.take().bind(a);
        let cx=0,cy=0;
        if(pivot){
          let p2=MVPool.take().bind(pivot);
          cx=p2.x;
          cy=p2.y;
          MVPool.drop(p2);
        }
        let out= _v2rot(p1.x,p1.y,
                        Math.cos(rot),
                        Math.sin(rot), cx,cy,a);
        MVPool.drop(p1);
        return out;
      },
      /**2d cross product.
       * The sign of the cross product (AxB) tells you whether the 2nd vector (B)
       * is on the left or right side of the 1st vector (A), +ve implies
       * B is left of B, (rotate ccw to B), -ve means B is right of A (rotate cw to B).
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
          let b= MVPool.take().bind(p2);
          let r= MVPool.take();
          r.x=-p1 * b.y;
          r.y=p1 * b.x;
          out=r.unit(is.vec(p2));
          MVPool.drop(b,r);
        }
        else if(is.num(p2)){
          let b= MVPool.take().bind(p1);
          let r= MVPool.take();
          r.x=p2 * b.y;
          r.y= -p2 * b.x;
          out=r.unit(is.vec(p1));
          MVPool.drop(b,r);
        }else{
          assertArgs(p1,p2);
          let a= MVPool.take().bind(p1);
          let b= MVPool.take().bind(p2);
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
      angle(a,b){ return Math.acos(this.dot(a,b)/(this.len(a)*this.len(b))) },
      /**Change vector to be perpendicular to what it was before, effectively
       * rotates it 90 degrees(normal).
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {boolean} ccw counter-clockwise?
       * @return {Vec2}
       */
      normal(a,ccw=false){
        let p1=MVPool.take().bind(a);
        let pr=MVPool.take();
        if(ccw){
          pr.x= -p1.y;
          pr.y= p1.x;
        }else{
          pr.x= p1.y;
          pr.y= -p1.x;
        }
        let out= pr.unit(is.vec(a));
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
        let p1=MVPool.take().bind(a);
        let pr=MVPool.take();
        if(ccw){
          pr.x= -p1.y;
          pr.y= p1.x;
        }else{
          pr.x= p1.y;
          pr.y= -p1.x;
        }
        let out= pr.unit(a);
        MVPool.drop(p1,pr);
        return out;
      },
      /**Find scalar projection A onto B.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {number}
       */
      proj_scalar(a,b){ return this.dot(a,b)/this.len(b) },
      /**Find vector A projection onto B.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      proj(a,b){
        const bn = this.unit(b);
        this.mul$(bn, this.dot(a,bn));
        let pr=MVPool.take().bind(bn);
        let out=pr.unit(is.vec(a));
        MVPool.drop(pr);
        return out;
      },
      /**Find the perpedicular vector.
       * @memberof module:mcfud/vec2
       * @param {Vec2} a
       * @param {Vec2} b
       * @return {Vec2}
       */
      perp(a,b){ return this.sub(a, this.proj(a,b)) },
      /**Reflect a ray, normal must be normalized.
       * @memberof module:mcfud/vec2
       * @param {Vec2} ray
       * @param {Vec2} surface_normal
       * @return {Vec2}
       */
      reflect(ray,surface_normal){
        //ray of light hitting a surface, find the reflected ray
        //reflect= ray - 2(ray.surface_normal)surface_normal
        let v= 2*this.dot(ray,surface_normal);
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
        if(args.length===1 && is.vec(args[0]) && !is.num(args[0][0])){
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
      }
    };
    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
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
// Copyright © 2020-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

  "use strict";

  /**Create the module.
   */
  function _module(Core){
    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    const ATAN2= Math.atan2;
    const COS= Math.cos;
    const SIN= Math.sin;
    const TAN= Math.tan;
    const MFL=Math.floor;
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

    /** @ignore */
    function _arrayEq(a1,a2){
      //2 numeric arrays are equal?
      for(let i=0;i<a1.length;++i){
        if(!_.feq(a1[i],a2[i])) return false }
      return true
    }

    /** @ignore */
    function _odd(n){ return n%2 !== 0 }

    /** @ignore */
    function _cell(rows,cols,r,c){
      //index where matrix is mapped to 1D array.
      return (c-1) + ((r-1)*cols)
    }

    /** @ignore */
    function _matnew(rows,cols,cells){
      return {dim: [rows,cols], cells: cells}
    }

    /** @ignore */
    function _new_mat(rows,cols){
      return _matnew(rows,cols, _.fill(rows*cols,0))
    }

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
        return args.length===0 ? _new_mat(rows,cols)
                               : _.assert(sz===args.length) && _matnew(rows,cols,args)
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
        return a.dim[0]===b.dim[0] &&
               a.dim[1]===b.dim[1] && _arrayEq(a.cells,b.cells)
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
          tmp.push(m.cells[MFL(i/rows) + cols*(i%rows)]);
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
        _.assert(aCols===bRows, "mismatch matrices");
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
        if(cols===2)
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
            if(!(i === _row || j === _col))
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
        _.assert(rows===cols);
        if(cols===2)
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
        return _.assert(m.cells.length===4) &&
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
        _.assert(m.cells.length===4&&rows===2&&cols===2);
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
        if(cols===2)
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
        _.assert(cols===rows);
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
        if(rows===cols){
          for(let v,r=0;r<rows;++r){
            for(let c=0;c<cols;++c){
              v=m.cells[r*cols+c];
              if((r+1)===(c+1)){
                if(v !== 1) return false;
              }else if(v !== 0) return false;
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
        return Math.abs(d)===1 &&
               this.isIdentity(this.matMult(this.matXpose(m), this.matInv(m)));
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
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
// Copyright © 2013-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

  "use strict";

  const VISCHS=" @N/\\Ri2}aP`(xeT4F3mt;8~%r0v:L5$+Z{'V)\"CKIc>z.*"+
               "fJEwSU7juYg<klO&1?[h9=n,yoQGsW]BMHpXb6A|D#q^_d!-";
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
    function _calcDelta(shift){
      return Math.abs(shift) % VISCHS_LEN
    }

    /**Get the char at the index. */
    function _charat(pos,string_){
      return (string_ || VISCHS).charAt(pos)
    }

    /**Index for this char. */
    function _getch(ch){
      for(let i=0;i<VISCHS_LEN;++i){
        if(_charat(i)===ch)
          return i;
      }
      return -1
    }

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

    const _$={
      /**Encrypt source by shifts.
       * @memberof module:mcfud/crypt
       * @param {string} src
       * @param {number} shift
       * @return {string} encrypted text
       */
      encrypt(src, shift){
        if(shift===0){ return src }
        function _f(shift,delta,cpos){
          return shift<0 ? _rotr(delta,cpos) : _rotl(delta,cpos) }
        let out=[];
        let p,d=_calcDelta(shift);
        src.split("").forEach(c=>{
          p=_getch(c);
          out.push(p<0 ? c : _f(shift,d,p));
        });
        return out.join("");
      },
      /**Decrypt text by shifts.
       * @memberof module:mcfud/crypt
       * @param {string} cipherText
       * @param {number} shift
       * @return {string} decrypted text
       */
      decrypt(cipherText,shift){
        if(shift===0){ return cipherText }
        function _f(shift,delta,cpos) {
          return shift< 0 ? _rotl(delta,cpos) : _rotr(delta,cpos) }
        let p,out=[];
        let d= _calcDelta(shift);
        cipherText.split("").forEach(c=>{
          p= _getch(c);
          out.push(p<0 ? c : _f(shift,d,p));
        });
        return out.join("");
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
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
// Copyright © 2013-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

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
          state(){
            return _state },
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
                  options.action();
                }else if(tx.action){
                  options ? tx.action(options) : tx.action();
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
  if(typeof module === "object" && module.exports){
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
// Copyright © 2013-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

  "use strict";

  /**Create the module.
   */
  function _module(Core,_M){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    if(!_M) _M=gscope["io/czlab/mcfud/math"]();

    const TWO_PI=Math.PI*2;
    const {u:_}=Core;

    /**
     * @module mcfud/gfx
     */

    /**
     * @typedef {number[]} Vec2
     */

    /**
     * @memberof module:mcfud/gfx
     * @class
     * @property {number[]} m
     */
    class TXMatrix2D{
      /**
       * @param {Vec2[]} source
       */
      constructor(source){
        if(source){
          this.m = [];
          this.clone(source);
        }else{
          this.m = [1,0,0,0,1,0];
        }
      }
      /**Toggle this into an `Identity` matrix
       * @return {TXMatrix2D} self
       */
      identity(){
        const m = this.m;
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        return this;
      }
      /**Deep clone a matrix.
       * @param {TXMatrix2D}
       * @return {TXMatrix2D} self
       */
      clone(matrix){
        let d = this.m,
            s = matrix.m;
        d[0]=s[0]; d[1]=s[1]; d[2] = s[2];
        d[3]=s[3]; d[4]=s[4]; d[5] = s[5];
        return this;
      }
      /**Multiply by this matrix
       * @param {TXMatrix2D} matrix
       * @return {TXMatrix2D} self
       */
      multiply(matrix){
        let a = this.m,
            b = matrix.m;
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
      /**Apply rotation.
       * @param {number} radians
       * @return {TXMatrix2D} self
       */
      rotate(radians){
        if(!_.feq0(radians)){
          let m=this.m,
              cos = Math.cos(radians),
              sin = Math.sin(radians);
          let m11 = m[0]*cos  + m[1]*sin;
          let m12 = -m[0]*sin + m[1]*cos;
          let m21 = m[3]*cos  + m[4]*sin;
          let m22 = -m[3]*sin + m[4]*cos;
          m[0] = m11; m[1] = m12;
          m[3] = m21; m[4] = m22;
        }
        return this;
      }
      /**Apply rotation (in degrees).
       * @param {number} degrees
       * @return {TXMatrix2D} self
       */
      rotateDeg(degrees){
        return _.feq0(degrees)? this: this.rotate(Math.PI * degrees / 180)
      }
      /**Apply scaling.
       * @param {number} sx
       * @param {number} sy
       * @return {TXMatrix2D} self
       */
      scale(sx,sy){
        let m = this.m;
        if(sy===undefined){ sy=sx }
        m[0] *= sx;
        m[1] *= sy;
        m[3] *= sx;
        m[4] *= sy;
        return this;
      }
      /**Apply translation.
       * @param {number} tx
       * @param {number} ty
       * @return {TXMatrix2D} self
       */
      translate(tx,ty){
        let m = this.m;
        m[2] += m[0]*tx + m[1]*ty;
        m[5] += m[3]*tx + m[4]*ty;
        return this;
      }
      /**Transform this point.
       * @param {number} x
       * @param {number} y
       * @return {Vec2}
       */
      transform(x,y){
        return [ x * this.m[0] + y * this.m[1] + this.m[2],
                 x * this.m[3] + y * this.m[4] + this.m[5] ];
      }
      /**@see {@link module:mcfud/gfx.TXMatrix2D#transform}
       * @param {object} obj
       * @return {object} obj
       */
      transformPoint(obj){
        const [x,y]= this.transform(obj.x,obj.y);
        obj.x = x;
        obj.y = y;
        return obj;
      }
      /**@see {@link module:mcfud/gfx.TXMatrix2D#transform}
       * @param {Vec2} inArr
       * @return {Vec2}
       */
      transformArray(inArr){
        return this.transform(inArr[0],inArr[1])
      }
      /**Set HTML5 2d-context's transformation matrix.
       * @param {object} html5 2d-context
       */
      setContextTransform(ctx){
        const m = this.m;
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

    const _$={
      TXMatrix2D,
      /**Html5 Text Style object.
       * @example
       * "14px 'Arial'" "#dddddd" "left" "top"
       * @memberof module:mcfud/gfx
       * @param {string} font
       * @param {string|number} fill
       * @param {string} [align]
       * @param {string} [base]
       * @return {object} style object
       */
      textStyle(font,fill,align,base){
        const x={font: font, fill: fill};
        if(align) x.align=align;
        if(base) x.base=base;
        return x;
      },
      /**Draw the shape onto the html5 canvas.
       * @memberof module:mcfud/gfx
       * @param {object} ctx html5 2d-context
       * @param {object} s a shape
       * @param (...any) args
       */
      drawShape(ctx,s,...args){
        if(s && s.draw)
          s.draw(ctx,...args)
      },
      /**Apply styles to the canvas.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {object} style object
       */
      cfgStyle(ctx,styleObj){
        const {line,stroke} =styleObj;
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
      },
      /**Draw and connect this set of points onto the canvas.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {Vec2[]} points
       * @param {number} [size] n# of points to draw
       */
      drawPoints(ctx,points,size){
        if(size === undefined) size=points.length;
        _.assert(size<=points.length);
        ctx.beginPath();
        for(let p,q,i2,i=0;i<size;++i){
          i2= (i+1)%size;
          p=points[i];
          q=points[i2];
          ctx.moveTo(p[0],p[1]);
          ctx.lineTo(q[0],q[1]);
        }
        ctx.stroke();
      },
      /**Draw a polygonal shape.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {Polygon} poly
       */
      drawShapePoly(ctx,poly){
        return this.drawPoints(ctx,poly.points);
      },
      /**Draw a circle onto the canvas.  If a starting point
       * is provided, draw a line to the center.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {number} x
       * @param {number} y
       * @param {radius} r
       */
      drawCircle(ctx,x,y,radius){
        ctx.beginPath();
        ctx.arc(x,y,radius,0,TWO_PI,true);
        ctx.closePath();
        ctx.stroke();
      },
      /**Draw a circular shape.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {Circle} circle
       */
      drawShapeCircle(ctx,circle){
        return this.drawCircle(ctx,circle.pos[0],circle.pos[1],circle.radius)
      },
      /**Draw a rectangle.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d=context
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @param {number} rot
       */
      drawRect(ctx,x,y,width,height,rot){
        let left=x;
        let top= y - height;
        ctx.save();
        ctx.translate(left,top);
        ctx.rotate(rot);
        ctx.strokeRect(0,0,width,height);
        ctx.restore();
      },
      /**Draw a rectangular shape.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {Rect} rect
       */
      drawShapeRect(ctx,rect){
        return this.drawRect(ctx,rect.pos[0],rect.pos[1],
                             rect.width,rect.height,rect.rotation)
      },
      /**Draw a line.
       * @memberof module:mcfud/gfx
       * @param {object} html5 2d-context
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       */
      drawLine(ctx,x1,y1,x2,y2){
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
        //ctx.closePath();
      },
      /**Draw a 2d line.
       * @memberof module:mcfud/gfx
       * @param {ctx} html5 2d-context
       * @param {Line} line
       */
      drawShapeLine(ctx,line){
        return this.drawLine(ctx,line.p[0],line.p[1],line.q[0],line.q[1])
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
    module.exports=_module(require("./core"),
                           require("./math"))
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
// Copyright © 2013-2021, Kenneth Leung. All rights reserved.

;(function(gscope){

  "use strict";

  /** @ignore */
  const [LEFT_VORONOI, MID_VORONOI, RIGHT_VORONOI]= [1,0,-1];

  /**Create the module.
   */
  function _module(Core,_M,_V){

    if(!Core) Core=gscope["io/czlab/mcfud/core"]();
    if(!_M) _M=gscope["io/czlab/mcfud/math"]();
    if(!_V) _V=gscope["io/czlab/mcfud/vec2"]();

    const MFL=Math.floor;
    const ABS=Math.abs;
    const MaxVerts=36;
    const {u:_}=Core;

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

    /**Original source from Randy Gaul's impulse-engine:
     * https://github.com/RandyGaul/ImpulseEngine#Shape.h
     */
    function _orderPoints(vertices){
      const count=vertices.length;
      const hull= _.assert(count <= MaxVerts) && _.fill(MaxVerts);
      //find the right-most point
      let rightMost=0,
          maxX= vertices[0][0];
      for(let x,i=1; i<count; ++i){
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
        hull[hpos]=cur;
        //search for next index that wraps around the hull
        //by computing cross products to find the most counter-clockwise
        //vertex in the set, given the previos hull index
        let next= 0,
            hp=hull[hpos];
        for(let e1,e2,c,i=1; i<count; ++i){
          if(next===cur){
            next= i; continue } //same point, skip
          //cross every set of three unique vertices
          //record each counter clockwise third vertex and add
          //to the output hull
          //see: http://www.oocities.org/pcgpe/math2d.html
          e1= _V.sub(vertices[next], vertices[hp]);
          e2= _V.sub(vertices[i], vertices[hp]);
          c= _V.cross(e1,e2);
          if(c<0){
            //counterclockwise, e2 on left of e1
            next=i}
          //cross product is zero then e vectors are on same line
          //therefore want to record vertex farthest along that line
          if(_.feq0(c) && _V.len2(e2) > _V.len2(e1)){next=i}
        }
        //we found the *next* point *left,ccw* of last hull point
        cur=next;
        ++hpos;
        //conclude algorithm upon wrap-around
        if(next===rightMost){ break }
      }
      const result=[];
      for(let i=0; i<hpos; ++i)
        result.push(_V.clone(vertices[hull[i]]));
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
        return new Area(MFL(this.width/2),MFL(this.height/2))
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

    /**A Circle.
     * @memberof module:mcfud/geo2d
     * @class
     * @property {Vec2} pos
     * @property {number} radius
     * @property {number} orient
     */
    class Circle{
      /**
       * @param {number} r
       */
      constructor(r){
        this.radius=r;
        this.orient=0;
        this.pos=_V.vec();
      }
      /**Set the rotation.
       * @param {number} r
       * @return {Circle} self
       */
      setOrient(r){
        this.orient=r;
        return this;
      }
      /**Set origin.
       * @param {number} x
       * @param {number} y
       * @return {Circle} self
       */
      setPos(x,y){
        _V.set(this.pos,x,y);
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
    class Polygon{
      /**
       * @param {number} x
       * @param {number} y
       */
      constructor(x,y){
        this.calcPoints=null;
        this.normals=null;
        this.edges=null;
        this.points=null;
        this.orient = 0;
        this.pos=_V.vec();
        this.setPos(x,y);
      }
      /**Set origin.
       * @param {number} x
       * @param {number} y
       * @return {Polygon} self
       */
      setPos(x=0,y=0){
        _V.set(this.pos,x,y);
        return this;
      }
      /**Set vertices.
       * @param {Vec2[]} points
       * @return {Polygon} self
       */
      set(points){
        this.calcPoints= this.calcPoints || [];
        this.normals= this.normals || [];
        this.edges= this.edges || [];
        this.calcPoints.length=0;
        this.normals.length=0;
        this.edges.length=0;
        this.points= _.assert(points.length>2) &&
                     _orderPoints(points);
        _.doseq(this.points, p=>{
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
       * @return {Polygon} self
       */
      translate(x, y){
        _.doseq(this.points,p=>{
          p[0] += x; p[1] += y;
        });
        return this._recalc();
      }
      /** @ignore */
      _recalc(){
        if(this.points){
          _.doseq(this.points,(p,i)=>{
            _V.copy(this.calcPoints[i],p);
            if(!_.feq0(this.orient))
              _V.rot$(this.calcPoints[i],this.orient);
          });
          let i2,p1,p2;
          _.doseq(this.points,(p,i)=>{
            i2= (i+1) % this.calcPoints.length;
            p1=this.calcPoints[i];
            p2=this.calcPoints[i2];
            this.edges[i]= _V.sub(p2,p1);
            this.normals[i]= _V.unit(_V.normal(this.edges[i]));
          });
        }
        return this;
      }
    }

    /** @ignore */
    function toPolygon(r){
      return new Polygon(r.pos[0],
                         r.pos[1]).set([_V.vec(r.width,0),
                                        _V.vec(r.width,r.height),
                                        _V.vec(0,r.height),_V.vec()])
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
          if(overlap<0)
            _V.flip$(resolve.overlapN);
        }
      }
    }

    /**
     * @private
     * @var {Manifold}
     */
    const _RES= new Manifold();

    /**
     * @private
     * @var {Polygon}
     */
    const _FAKE_POLY= toPolygon(new Rect(0,0, 1, 1));

    /** @ignore */
    function _circle_circle(a, b, resolve){
      let vAB= _V.vecAB(a.pos,b.pos);
      let r_ab = a.radius+b.radius;
      let r2 = r_ab*r_ab;
      let d2 = _V.len2(vAB);
      let status= !(d2 > r2);
      if(status && resolve){
        let dist = Math.sqrt(d2);
        resolve.A = a;
        resolve.B = b;
        resolve.overlap = r_ab - dist;
        _V.copy(resolve.overlapN, _V.unit$(vAB));
        _V.copy(resolve.overlapV, _V.mul(vAB,resolve.overlap));
        resolve.AInB = a.radius <= b.radius && dist <= b.radius - a.radius;
        resolve.BInA = b.radius <= a.radius && dist <= a.radius - b.radius;
      }
      return status;
    }

    /** @ignore */
    function _poly_circle(polygon, circle, resolve){
      // get position of the circle relative to the polygon.
      let vPC= _V.vecAB(polygon.pos,circle.pos);
      let r2 = circle.radius*circle.radius;
      let cps = polygon.calcPoints;
      let edge = _V.vec();
      let point;
      // for each edge in the polygon:
      for(let next,prev, overlap,overlapN,len=cps.length,i=0; i<len; ++i){
        next = i === len-1 ? 0 : i+1;
        prev = i === 0 ? len-1 : i-1;
        overlap = 0;
        overlapN = null;
        _V.copy(edge,polygon.edges[i]);
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
          _V.copy(edge,polygon.edges[prev]);
          // calculate the center of the circle relative the starting point of the previous edge
          let point2= _V.vecAB(cps[prev],vPC);
          region = _voronoiRegion(edge, point2);
          if(region === RIGHT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.len(point);
            if(dist>circle.radius){
              // No intersection
              return false;
            } else if(resolve){
              // intersects, find the overlap.
              resolve.BInA = false;
              overlapN = _V.unit(point);
              overlap = circle.radius - dist;
            }
          }
        } else if(region === RIGHT_VORONOI){
          // need to make sure we're in the left region on the next edge
          _V.copy(edge,polygon.edges[next]);
          // calculate the center of the circle relative to the starting point of the next edge.
          _V.sub$(_V.copy(point,vPC),cps[next]);
          region = _voronoiRegion(edge, point);
          if(region === LEFT_VORONOI){
            // it's in the region we want.  Check if the circle intersects the point.
            let dist = _V.len(point);
            if(dist>circle.radius){
              return false;
            } else if(resolve){
              resolve.BInA = false;
              overlapN = _V.unit(point);
              overlap = circle.radius - dist;
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
          if(dist > 0 && distAbs > circle.radius){
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
        if(resolve.overlap===0 || _.feq0(resolve.overlap))
          return false;
        resolve.A = a;
        resolve.B = b;
        _V.copy(resolve.overlapV,resolve.overlapN);
        _V.mul$(resolve.overlapV,resolve.overlap);
      }
      return true;
    }

    const _$={
      Rect,
      Area,
      Line,
      Circle,
      Polygon,
      Manifold,
      /**Sort vertices in counter clockwise order.
       * @memberof module:mcfud/geo2d
       * @param {Vec2[]} vs
       * @return {Vec2[]}
       */
      orderVertices(vs){ return _orderPoints(vs) },
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
        return MFL(ABS(area)/2)
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
        return _V.vec(MFL(cx/A), MFL(cy/A))
      },
      /**Get the AABB rectangle.
       * @memberof module:mcfud/geo2d
       * @param {Circle|Polygon} obj
       * @param {Vec} [pos]
       * @return {Rect}
       */
      getAABB(obj,pos=null){
        if(!pos){
          pos=obj.pos;
        }
        if(_.has(obj,"radius")){
          return new Rect(pos[0]-obj.radius,
                          pos[1]-obj.radius,
                          obj.radius*2, obj.radius*2)
        }else{
          let cps= _V.translate(pos, obj.calcPoints);
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
        const hw=MFL(w/2);
        const hh=MFL(h/2);
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
        return r1.width===r2.width &&
               r1.height===r2.height &&
               r1.pos[0]===r2.pos[0] &&
               r1.pos[1]===r2.pos[1]
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
      rectGetMidX(r){ return r.pos[0] + MFL(r.width/2) },
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
      rectGetMidY(r){ return r.pos[1] + MFL(r.height/2) },
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
        let dx=px-c.pos[0];
        let dy=py-c.pos[1];
        return dx*dx+dy*dy <= c.radius*c.radius;
      },
      /**If these 2 circles collide, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Circle} a
       * @param {Circle} b
       * @return {Manifold} if false undefined
       */
      hitCircleCircle(a, b){
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
        return _circle_circle(a,b,new Manifold());
      },
      /**If this polygon collides with the circle, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} p
       * @param {Circle} c
       * @return {Manifold} if false undefined
       */
      hitPolygonCircle(p, c){
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
        return _poly_circle(p,c,new Manifold())
      },
      /**If this circle collides with polygon, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Circle} c
       * @param {Polygon} p
       * @return {Manifold} if false undefined
       */
      hitCirclePolygon(c, p){
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
        return _circle_poly(c,p,new Manifold())
      },
      /**If these 2 polygons collide, return the manifold.
       * @memberof module:mcfud/geo2d
       * @param {Polygon} a
       * @param {Polygon} b
       * @return {Manifold} if false undefined
       */
      hitPolygonPolygon(a, b){
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
        return this.hitTestPointInPolygon(testx,testy,
                                          _V.translate(poly.pos,poly.calcPoints))
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
    module.exports=_module(require("./core"),
                           require("./math"),
                           require("./vec2"))
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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

  "use strict";

  /**Creates the module.
   */
  function _module(Core){
    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    const MFL=Math.floor;
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
  if(typeof module === "object" && module.exports){
    module.exports=_module(require("./core"));
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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

  "use strict";

  /**Creates the module.
   */
  function _module(Core){
    if(!Core) Core= gscope["io/czlab/mcfud/core"]();
    const MFL=Math.floor;
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
    function QuadTree(left,right,top,bottom,maxCount,maxDepth,level){
      let boxes=null,
          objects = [];
      //if flipped the co-ord system is LHS (like a browser, y grows down, objects are top-left+width_height)
      //else RHS (standard, y grows up, objects are left-bottom+width_height)
      let flipped=(top<bottom),
          midX= MFL((left+right)/2),
          midY= MFL((top+bottom)/2);
      //find which quadrants r touches
      function _locate(r){
        let x,y,width,height;
        if(r.getBBox){
          let {x1,x2,y1,y2}=r.getBBox();
          x=x1;y=y1;width=x2-x1;height=flipped? y2-y1:y1-y2;
        }else if(r.x !== undefined && r.y !== undefined && r.width !== undefined && r.height !== undefined){
          x=r.x; y=r.y; width=r.width; height=r.height;
        }
        let out=[],
            left= x<midX,
            right= x+width>midX,
            up= flipped? (y<midY) : (y+height>midY),
            down= flipped? (y+height>midY): (y<midY);
        if(up){
          if(left) out.push(3);
          if(right) out.push(0); }
        if(down){
          if(left) out.push(2);
          if(right) out.push(1); }
        return out;
      }

      //split into 4 quadrants
      function _split(){
        //3|0
        //---
        //2|1
        _.assert(boxes===null);
        boxes=[QuadTree(midX, right,top,midY,maxCount,maxDepth,level+1),
               QuadTree(midX, right, midY, bottom,maxCount,maxDepth,level+1),
               QuadTree(left, midX, midY, bottom,maxCount,maxDepth,level+1),
               QuadTree(left, midX, top, midY,maxCount,maxDepth,level+1)];
      }

      const bbox={x1:left,x2:right,y1:top,y2:bottom};
      return{
        boundingBox(){ return bbox },
        subTrees(){return boxes},
        dbg(f){ return f(objects,boxes,maxCount,maxDepth,level) },
        insert:function(node){
          for(let n=0;n<arguments.length;++n){
            node=arguments[n];
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
          }
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
            if(sum===boxes.length){//4
              //subtrees are leaves and total count is small
              //enough so pull them up into this node
              if(total<maxCount){
                _.assert(objects.length===0,
                         "quadtree wanted zero items");
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
       * @param {object} region {left,right,top,bottom} the bounding region
       * @param {number} maxCount maximum number of objects in each tree
       * @param {number} maxDepth maximum depth of tree
       * @return {QuadTree}
       */
      quadtree(region,maxCount=12,maxDepth=5){
        const {left,right,top,bottom}=region;
        return QuadTree(left,right,top,bottom,maxCount,maxDepth,0)
      }
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module === "object" && module.exports){
    module.exports=_module(require("./core"));
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
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

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
        this.lastBestMove=null;
        this.state= null;
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

    //option2
    //
    function _negaAlphaBeta(board, game, depth, maxDepth, alpha, beta){

      if(depth===0 || board.isOver(game)){
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
    //
    //

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

      if(depth===0 || board.isOver(game)){
        return [_calcScore(board,game,depth,maxDepth),null]
      }

      let openMoves = _.shuffle(board.getNextMoves(game)),
          copier= board.getStateCopier(),
          state=game,
          bestValue = -Infinity,
          bestMove = openMoves[0];

      if(depth===maxDepth)
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
          if(depth === maxDepth)
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
        let score,move;
        [score,move]= _negaMax(board, f, d,d, -Infinity, Infinity);
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
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

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
        this.cur=cur;
        this.state= null;
        this.other=other;
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
        this.aiActor=null;
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

    /** @ignore */
    function _calcScore(board,game,depth,maxDepth){
      //+ve if AI wins
      return board.evalScore(game,depth,maxDepth)
    }

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
      if(depth===0 || board.isOver(game)){
        return [_calcScore(board,game,depth,maxDepth),null]
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
        let score,move;
        [score, move]= _miniMax(board, f, d,d, -Infinity, Infinity, true);
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
// Copyright © 2020-2021, Kenneth Leung. All rights reserved.

;(function(gscope){
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

    /**Checks for non-failure. */
    function _f(s){ return !s.startsWith("F") }

    /**Make a string. */
    function rstr(len,ch){
      let out="";
      while(len>0){
        out += ch; --len }
      return out;
    }

    /**Check if valid exception was thrown. */
    function ex_thrown(expected,e){
      let out=t_bad;
      if(e){
        if(is.str(expected)){
          out= expected==="any" || expected===e ? t_ok : t_bad
        }else if(expected instanceof e){ out=t_ok }
      }
      return out;
    }

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
            out= out ? (out===709394?t_skip:t_ok) : t_bad;
            resolve(`${out}: ${name}`);
          }
        }catch(e){
          out= t_bad;
          resolve(`${out}: ${name}`);
        }
      })
    }

    /** Run the given form and check if exception was thrown. */
    function ensure_ex(env,name,form,error){
      return new Promise((resolve,reject)=>{
        let out;
        try{
          out=form.call(env);
          out=out===709394?t_ok:ex_thrown(error,null);
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
            passed: res.filter(s=>s[0]==="P"),
            skippd: res.filter(s=>s[0]==="S"),
            failed: res.filter(s=>s[0]==="F")
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
  if(typeof module === "object" && module.exports){
    module.exports=_module(require("./core"), require("colors/safe"))
  }else{
    gscope["io/czlab/mcfud/test"]= _module
  }

})(this);


