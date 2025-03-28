!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);
/*
    cycle.js
    2021-05-31

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See https://www.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

// The file uses the WeakMap feature of ES6.

/*jslint eval */

/*property
    $ref, decycle, forEach, get, indexOf, isArray, keys, length, push,
    retrocycle, set, stringify, test
*/

if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

        var objects = new WeakMap();     // object to path mappings

        return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

            var old_path;   // The path of an earlier occurance of value
            var nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

            if (replacer !== undefined) {
                value = replacer(value);
            }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

            if (
                typeof value === "object"
                && value !== null
                && !(value instanceof Boolean)
                && !(value instanceof Date)
                && !(value instanceof Number)
                && !(value instanceof RegExp)
                && !(value instanceof String)
            ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {$ref: old_path};
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    Object.keys(value).forEach(function (name) {
                        nu[name] = derez(
                            value[name],
                            path + "[" + JSON.stringify(name) + "]"
                        );
                    });
                }
                return nu;
            }
            return value;
        }(object, "$"));
    };
}


if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function (element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function (name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        }($));
        return $;
    };
}

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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */


;(function(window,doco,seed_rand,UNDEF){

  "use strict";

  if(typeof module=="object" && module.exports){
    //seed_rand=require("../tpcl/seedrandom.min")
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
      /**Check if input is type `array` and is same or at least the size of `len`.
       * @memberof module:mcfud/core.is
       * @param {any} v anything
       * @param {number} len min size
       * @param {boolean} must true if must match exact size
       * @return {boolean}
       */
      vecN(v,len,must=false){
        return isVec(v) && (must ? v.length==len : v.length >= len)
      },
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
      SORT_DESC: 1,
      SORT_ASC: -1,
      /** error message */
      error(...args){ console.error(...args) },
      /** warn message */
      warn(...args){ console.warn(...args) },
      /** log message */
      log(...args){ console.log(...args) },
      /**
       * @param {Error} e
       * @return stack trace
       */
      prnStk(e){
        let m;
        try{ m=e.stack; }catch(x){}
        return ["", m || (new Error()).stack].join("");
      },
      /**Divide this number as integer.
       * @memberof module:mcfud/core._
       * @param {number} a
       * @param {number} b
       * @return {number} integer result
       */
      ndiv(a,b){
        return Math.floor(a/b)
      },
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
            ret=UNDEF;
            break;
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
      /**If not even, make it even either smaller or bigger.
       * @memberof module:mcfud/core._
       * @param {number} n
       * @param {boolean} dir false smaller, true bigger
       * @return {number}
       */
      evenN(n,dir=false){
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
       * @param {boolean} wrap
       * @return {number}
       */
      percentRemain(amt, total, wrap=false){
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
      /**
       * @param {array|number} arg
       * @return {number[]}
       */
      randSpan(arg){
        let len = is.vec(arg) ? arg.length : arg;
        this.assert(is.num(len) && len > 1, "bad width to randSpan");
        let a= this.randInt(len),
            b= this.randInt(len);
        if(a==b){
          a=0; b=len-1;
        }
        return a<b ? [a,b] : [b,a];
      },
      /**
       * @return {number}
       */
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
       * @deprecated
       * @param {array} a
       * @return {array} a
       */
      cls(a){
        return this.trunc(a)
      },
      /**Clear array.
       * @memberof module:mcfud/core._
       * @param {array} a
       * @return {array} a
       */
      trunc(a){
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
      /**Randomly choose A or B.
       * @memberof module:mcfud/core._
       * @param {any} a
       * @param {any} b
       * @return {any}
       */
      randAorB(a,b){
        return PRNG() > 0.5 ? a : b
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
      /**Remaps a value from one range to another range.
       * e.g. rmap(2, 0, 10, 0, 100) = 20
       * @memberof module:mcfud/core._
       * @param {number} n
       * @param {number} startR1
       * @param {number} endR1
       * @param {number} startR2
       * @param {number} endR2
       * @return {number} new value
       */
      rmap(n, startR1, endR1, startR2, endR2){
        return ((n-startR1)/(endR1-startR1))*(endR2-startR2)+startR2
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
        let xs= _.fill(arr.length, (i)=>i);
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
      },
      /**Create a comparator function for sorting.
       * If no functions are supplied, then integral comparisons are assumed.
       * @memberof module:mcfud/core._
       * @param {number} flag -ve ascending, +ve descending
       * @param {Function} fa
       * @param {Function} fb
       * @return {Function}
       */
      comparator(flag,fa,fb){
        if(arguments.length==1){
          //integral comparisons
          return flag<0 ? function(a,b){ return a<b?-1:(a>b?1:0) }
                        : function(a,b){ return a>b?-1:(a<b?1:0) }
        }else{
          return flag<0 ? function(a,b){ let ra=fa(a), rb=fb(b); return ra<rb?-1:(ra>rb?1:0) }
                        : function(a,b){ let ra=fa(a), rb=fb(b); return ra>rb?-1:(ra<rb?1:0) }
        }
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
    module.exports=_module();
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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

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
// Copyright © 2025, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){
  "use strict";

  console.log(`@czlab/mufud version: 1.5.0`);

})(this);


