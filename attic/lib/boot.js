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

(function(global, undefined) {
  "use strict";

  if(global.document===undefined ||
     global.document.body===undefined)
    throw "Fatal: invalid environment, cannot run MojoH5.";

  //local vars
  const window=global,
        OBJ=Object.prototype,
        tostr=OBJ.toString,
        document=global.document,
        slicer=Array.prototype.slice;

  //local functions
  const isStr= (obj) => { return typeof obj === "string"; };
  const isMap= (obj) => { return tostr.call(obj) === "[object Map]"; };
  const isArray= (obj) => { return tostr.call(obj) === "[object Array]"; };
  const isObject= (obj) => { return tostr.call(obj) === "[object Object]"; };

  /**
   * @private
   * @var {number}
   */
  let _seqNum= 0;

  /**
   * @private
   * @var {object}
   */
  const _= {
    POS_INF: Number.POSITIVE_INFINITY,
    NEG_INF: Number.NEGATIVE_INFINITY,
    keys: (obj) => {
      return isMap(obj) ? Array.from(obj.keys())
                        : (isObject(obj) ? Object.keys(obj) : []);
    },
    assert: function(cond) {
      if(!cond) {
        if(arguments.length < 2)
          throw "Assertion error.";
        else
          throw slicer.call(arguments,1).join("");
      }
    },
    inst: (type,obj) => {
      return obj instanceof type;
    },
    isPerc: (s) => {
      return isStr(s) && s.match(/^([0-9])(\.?[0-9]+|[0-9]*)%$/);
    },
    jsMap: () => { return new Map(); },
    jsObj: () => { return {}; },
    jsVec: () => { return []; },
    floor: (v) => { return Math.floor(v); },
    ceil: (v) => { return Math.ceil(v); },
    abs: (v) => { return Math.abs(v); },
    sqrt: (v) => { return Math.sqrt(v); },
    min: (a,b) => { return Math.min(a,b); },
    max: (a,b) => { return Math.max(a,b); },
    slice: (a,i) => { return slicer.call(a, i); },
    now: () => { return Date.now(); },
    nextId: () => { return ++_seqNum; },
    fileNoExt: (name) => {
      let pos= name.lastIndexOf(".");
      return pos > 0 ? name.substring(0,pos) : name;
    },
    fileExt: (name) => {
      let pos= name.lastIndexOf(".");
      return pos > 0 ? name.substring(pos+1).toLowerCase() : "";
    },
    range: (start,stop,step=1) => {
      if(typeof stop==="undefined") {
        stop=start;
        start=0;
        step=1;
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
    map: (obj, fn,ctx) => {
      let res= [];
      if(isArray(obj))
        res= obj.map(fn,ctx);
      else if(isMap(obj)) {
        obj.forEach((v,k)=> {
          res.push(fn.call(ctx, v,k,obj));
        });
      }
      else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k))
          res.push(fn.call(ctx, obj[k],k,obj));
      }
      return res;
    },
    find: function(obj,fn,ctx) {
      let args=slicer.call(arguments,3);
      if(isArray(obj)) {
        for(let i=0,z=obj.length;i<z;++i)
          if(fn.apply(ctx, [obj[i], i].concat(args)))
            return obj[i];
      } else if(isMap(obj)) {
        let ks=Array.from(obj.keys());
        for(let k,i=0,z=ks.length;i<z;++i) {
          k=ks[i];
          if(fn.apply(ctx, [obj.get(k), k].concat(args)))
          return [k, obj.get(k)];
        }
      } else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k) &&
             fn.apply(ctx, [obj[k], k].concat(args)))
            return [k,obj[k]];
      }
    },
    some: function(obj,fn,ctx) {
      let res,
          args=slicer.call(arguments,3);
      if(isArray(obj)) {
        for (let i=0,z=obj.length;i<z;++i)
          if(res = fn.apply(ctx, [obj[i], i].concat(args)))
            return res;
      } else if(isMap(obj)) {
        let ks=Array.from(obj.keys());
        for (let k,i=0,z=ks.length;i<z;++i) {
          k=ks[i];
          if(res = fn.apply(ctx, [obj.get(k), k].concat(args)))
            return res;
        }
      } else if(obj) {
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj, k))
            if(res = fn.apply(ctx, [obj[k], k].concat(args)))
              return res;
      }
    },
    invoke: function(arr,key) {
      let args=slicer.call(arguments,2);
      if(isArray(arr))
        arr.forEach(x => x[key].apply(x, args));
    },
    timer: function(f,delay) {
      return setTimeout(f,delay);
    },
    doseq: (obj,fn,ctx) => {
      if(isArray(obj))
        obj.forEach(fn,ctx);
      else if(isMap(obj))
        obj.forEach((v,k)=> fn.call(ctx,v,k,obj));
      else if(obj)
        for(let k in obj)
          if(OBJ.hasOwnProperty.call(obj,k))
          fn.call(ctx, obj[k], k, obj);
    },
    dissoc: function(obj,key) {
      if(arguments.length > 2) {
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
        if(isMap(obj))
          return obj.get(key);
        else if(obj)
          return obj[key];
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
    conj: (coll,obj) => {
      return coll && coll.push(obj);
    },
    seq: (arg,sep=",") => {
      if(typeof arg === "string")
        arg = arg.split(sep).map(s => s.trim()).filter(s => s.length>0);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    has: (obj,key) => {
      return isMap(obj) ? obj.has(key) : (obj ? OBJ.hasOwnProperty.call(obj, key) : undefined);
    },
    patch: (des,src) => {
      des=des || {};
      if(src)
        for(let k in src)
          if(OBJ.hasOwnProperty.call(src,k) && des[k] === undefined)
            des[k] = src[k];
      return des;
    },
    clone: (obj) => {
      return Object.assign({},obj);
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
  },
  is= {
    str: (obj) => { return typeof obj === "string"; },
    num: (obj) => { return tostr.call(obj) === "[object Number]"; },
    fun: (obj) => { return tostr.call(obj) === "[object Function]"; },
    obj: isObject,
    map: isMap,
    vec: isArray,
    void0: (obj) => { return obj === void 0; },
    undef: (obj) => { return obj === undefined; }
  };

  //local vars
  let _preloads= [];
  let _audioDftExt;
  let _audioTypes= {mp3: "audio/mpeg",
                    m4a: "audio/m4a",
                    wav: "audio/wav",
                    ogg: 'audio/ogg; codecs="vorbis"'};
  let _assetTypes= {tmx: "Tile", png: "Image", xml: "Xml", json: "Json",
                    jpg: "Image", gif: "Image", jpeg: "Image",
                    ogg: "Audio", wav: "Audio", m4a: "Audio", mp3: "Audio"};

  //local functions
  let _audioExt= (choices) => {
    if(!_audioDftExt) {
      let snd = new Audio();
      _audioDftExt= _.find(choices, (ext) => {
        return snd.canPlayType(_audioTypes[ext]);
      });
    }
    return _audioDftExt;
  };
  let _assetUrl = (base,url,devMode) => {
    let ts = "";
    if(devMode)
      ts = (/\?/.test(url) ? "&" : "?") + "_t=" + _.now();
    ts= url + ts;
    return (/^https?:\/\//.test(url) || url[0] === "/") ? ts : base + ts;
  };

  //https://johnresig.com/blog/simple-javascript-inheritance/
  //base class implementation (does nothing)
  let Resig = function(){};
  Resig.prototype.isA = function(c) {
    return this.className === c;
  };
  (function(initing) {
    let qfn= /xyz/.test(function(){var xyz;}) ? /\b_super\b/ : /.*/;
    Resig.extend = function(clazz, props, container) {
      if(!is.str(clazz)) {
        container = props; props = clazz; clazz = null; }
      let parent = this.prototype; // late-bind
      let proto,ThisClass = this;
      initing = true;
      proto = new ThisClass(); // the future parent
      initing = false;
      let _sfac= (name,fn) => {
        return function() {
          let rc,tmp = this._super;
          this._super = parent[name];
          rc = fn.apply(this, arguments);
          this._super = tmp;
          return rc;
        };
      };
      _.doseq(props, (v,k) => {
        if(_.has(props,k))
          proto[k] = is.fun(v) &&
                     is.fun(parent[k]) && qfn.test(v) ? _sfac(k,v) : v; });
      //dummy class constructor function
      function Klass() {
        if(!initing && this.init) this.init.apply(this, arguments); }
      Klass.extend= Resig.extend;
      Klass.prototype = proto;
      Klass.prototype.constructor = Klass;
      if(clazz) {
        Klass.className = clazz;
        Klass.prototype.className = clazz;
        if(isObject(container)) container[clazz] = Klass;
      }
      return Klass;
    };
  })();

  /**
   * @private
   * @function
   */
  let _eventBus= () => {
    let _tree= _.jsMap();
    return {
      sub: function(event,target,cb,ctx) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.sub.apply(this, e); });
        } else {
          if (!cb) cb=event;
          if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
          if(!cb) throw "Error: no callback for sub()";
          if(!_tree.has(target)) _tree.set(target, _.jsMap());
          let m= _tree.get(target);
          !m.has(event) && m.set(event,[]);
          m.get(event).push([cb,ctx]);
        }
      },
      pub: function(event,target,data) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.pub.apply(this, e); });
        } else {
          let m= _tree.get(target);
          if(m) m= m.get(event);
          if(m) m.forEach(s => s[0].call(s[1],data));
        }
      },
      unsub: function(event,target,cb,ctx) {
        if(is.vec(event) && arguments.length===1) {
          event.forEach(e => { if(is.vec(e)) this.unsub.apply(this, e); });
        } else {
          for(let ss, m= _tree.get(target);m;m=null) {
            if(!cb)
              m.delete(event);
            else {
              if(is.str(cb)) { ctx=ctx || target; cb=ctx[cb]; }
              if(!cb)
                m.delete(event);
              else if(ss= m.get(event)) {
                for(let i= ss.length-1;i>=0;--i)
                  if(ss[i][0] === cb &&
                     ss[i][1] === ctx) ss.splice(i,1);
              }
            }
          }
        }
      }
    };
  };

  //Let's go
  //let _aux=["Tiles"];
  /**
   * @public
   * @function
   */
  let MojoH5 = function(cmdArg) {

    //the OBJECT!
    let Mojo={};

    /**types and collision masks
     * @public
     * @property {number}
     */
    Mojo.E_NONE     = 0;
    Mojo.E_DEFAULT  = 1;
    Mojo.E_PARTICLE = 2;
    Mojo.E_ACTIVE   = 4;
    Mojo.E_FRIENDLY = 8;
    Mojo.E_ENEMY    = 16;
    Mojo.E_POWERUP  = 32;
    Mojo.E_UI       = 64;
    Mojo.E_PASSIVE  = 128;
    Mojo.E_ALL   = 0xFFFF;

    /**
     * @private
     * @function
     */
    let sort_out_game_looper= () => {
      let c= "cancelAnimationFrame",
          r= "requestAnimationFrame",
          pfx = ["ms", "moz", "webkit", "o"];
      for(let i=0; i<pfx.length && !window[r]; ++i) {
        window[r]= window[pfx[i]+"RequestAnimationFrame"];
        window[c]= window[pfx[i]+"CancelAnimationFrame"] ||
                   window[pfx[i]+"CancelRequestAnimationFrame"];
      }
      if(!window[c]) window[c]= (id) => { clearTimeout(id); };
      if(window[r]) {
        Mojo.log("Using native requestAnimationFrame()");
      } else {
        Mojo.log("Using non-native requestAnimationFrame()");
        let last= 0;
        window[r]= (cb) => {
          let cur = _.now(),
              delay = Math.max(0, 16 - (cur-last)),
              id = _.timer(() => cb(cur+delay), delay);
          last= cur+delay;
          return id;
        };
      }
    };

    /**
     * @private
     * @var {map}
     */
    let _db = _.jsMap();

    /**
     * @public
     * @function
     */
    Mojo.link= (arg,obj) => {
      if(is.vec(arg))
        arg.forEach(x => Mojo.link(x,obj));
      else {
        if(!_.has(_db,arg)) _.assoc(_db,arg, []);
        _.conj(_.get(_db,arg),obj);
        Mojo.log("linked `"+arg+"` to "+obj);
      }
    };
    Mojo.unlink= (arg, obj) => {
      if(is.vec(arg))
        arg.forEach(x => Mojo.unlink(x,obj));
      else {
        _.disj(_.get(_db,arg), obj);
        Mojo.log("unlinked `"+arg+"` to "+obj);
      }
    };
    /**
     * @public
     * @function
     */
    Mojo.dbReset = () => {
      _db = _.jsMap();
    };

    /**
     * @public
     * @function
     */
    Mojo.dbFind = (selector) => {
      return _.get(_db,selector);
    };

    /**
     * @public
     * @function
     */
    Mojo.log= function() {
      let msg="";
      if(Mojo.o.debug)
        for(let i=0;i<arguments.length;++i)
        msg += arguments[i];
      if(msg)
        console.log(msg);
    };

    /**
     * @public
     * @property
     */
    Mojo.touchDevice= !!("ontouchstart" in document);

    /**
     * @public
     * @function
     */
    Mojo["$"]= (selector) => {};

    /**
     * @public
     * @property {object}
     */
    Mojo.EventBus= _eventBus();

    /**
     * @public
     * @property {object}
     */
    Mojo.is=is;

    /**
     * @public
     * @property {object}
     */
    Mojo.u=_;

    /**
     * @public
     * @property {object}
     */
    Mojo.assets={};

    /**
     * @public
     * @property {object}
     */
    Mojo.loaders={};

    /**Holds entity <-> features.
     * @private
     * @var {map}
     */
    let _feCache= _.jsMap();

    /**Holds feature types.
     * @private
     * @var {map}
     */
    let _features= _.jsMap();

    /**
     * @public
     * @function
     */
    Mojo.scroll = (x,y) => {
      window.scrollTo(x||0, y||1);
      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.scrollTop = (x,y) => {
      x=x||0;
      y=y||1;
      _.timer(() => { Mojo.scroll(x,y); }, 0);
      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.handleDeviceFlip = () => {
      _.addEvent("orientationchange", window, () => {
        Mojo.scrollTop();
      });
      return Mojo;
    };

    /**
     * @public
     * @function
      */
    Mojo.cancelFrame = (id) => {
      window.cancelAnimationFrame(id);
    };

    /**
     * @public
     * @function
      */
    Mojo.scheduleFrame = (cb) => {
      return window.requestAnimationFrame(cb);
    };

    //------------------------------------------------------------------------
    //DOM stuff
    /**
     * @public
     * @function
     */
    Mojo.domBySelector= (sel) => { return document.querySelectorAll(sel); };
    /**
     * @public
     * @function
     */
    Mojo.domById= (id) => { return document.getElementById(id); };
    /**
     * @public
     * @function
     */
    Mojo.domParent= (e) => { return e ? e.parentNode : undefined; };
    /**
     * @public
     * @function
     */
    Mojo.domConj = (child, par) => {
      return (par || document.body).appendChild(child);
    };
    /**
     * @public
     * @function
     */
    Mojo.domByTag= (tag, ns) => {
      return is.str(ns)
             ? document.getElementsByTagNameNS(ns,tag)
             : document.getElementsByTagName(id);
    };
    /**
     * @public
     * @function
     */
    Mojo.domAttrs= function(e, attrs) {
      if(!is.obj(attrs) && attrs) {
        if(arguments.length > 2)
          e.setAttribute(attrs, arguments[2]);
        return e.getAttribute(attrs);
      }
      if(attrs)
        _.doseq(attrs, (v,k) => { e.setAttribute(k,v); });
      return e;
    };
    /**
     * @public
     * @function
     */
    Mojo.domCss= function(e, styles) {
      if(!is.obj(styles) && styles) {
        if(arguments.length > 2)
          e.style[styles]= arguments[2];
        return e.style[styles];
      }
      if(styles)
        _.doseq(styles, (v,k) => { e.style[k]= v; });
      return e;
    };
    /**
     * @public
     * @function
     */
    Mojo.domWrap= (child,wrapper) => {
      let p=child.parentNode;
      wrapper.appendChild(child);
      p.appendChild(wrapper);
      return wrapper;
    };
    /**
     * @public
     * @function
     */
    Mojo.domCtor = (tag, attrs, styles) => {
      let e = document.createElement(tag);
      Mojo.domAttrs(e,attrs);
      Mojo.domCss(e,styles);
      return e;
    };

    /**
     * @public
     * @function
     */
    Mojo.p2 = (px,py) => { return {x: px||0, y: py||0}; };

    /**
     * @public
     * @function
     */
    Mojo.v2 = (x,y) => { return [x||0, y||0]; };

    /**
     * @public
     * @property {object}
     */
    Mojo.gravity= Mojo.p2();

    /**
     * @public
     * @function
     */
    Mojo.hasTouch= () => { return Mojo.touchDevice;};

    /**
     * @public
     * @function
     */
    Mojo.defType= (clazz, props, container) => {
      let child,parent;
      if(is.str(clazz)) {
        parent=Resig;
        child=clazz;
      }
      else
      if(is.vec(clazz)) {
        child=clazz[0];
        parent=clazz[1];
      }
      return parent.extend(child,props,container);
    };

    //------------------------------------------------------------------------
    // set up game loop
    let _lastFrame=0,
        _loopFrame = 0;
    /**
     * @public
     * @function
     */
    Mojo.gameLoop = (action) => {
      _lastFrame = _.now();
      _loopFrame = 0;
      Mojo.glwrapper = (ptInTime) => {
        //console.log("pint in time = " + ptInTime);
        let now = _.now();
        ++_loopFrame;
        Mojo.loop = Mojo.scheduleFrame(Mojo.glwrapper);
        let dt = now - _lastFrame;
        //some upperbound to stop frame fast forwarding
        if(dt>Mojo.o.maxFrameTime)
          dt = Mojo.o.maxFrameTime;
        action.call(Mojo, dt/1000);
        _lastFrame = now;
      };
      Mojo.loop=Mojo.scheduleFrame(Mojo.glwrapper);
      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.pauseGame = () => {
      if(Mojo.loop) Mojo.cancelFrame(Mojo.loop);
      Mojo.loop = null;
    };

    /**
     * @public
     * @function
     */
    Mojo.resumeGame = () => {
      if(!Mojo.loop) {
        _lastFrame = _.now();
        Mojo.loop = Mojo.scheduleFrame(Mojo.glwrapper);
      }
    };

    /**
     * @public
     * @function
     */
    Mojo.resetGame = () => {
      Mojo.dbReset();
    };

    /**
     * @public
     * @class
     */
    Mojo.defType("Feature", {
      /**
       * @constructs
       */
      init: function() {
        Mojo.log("created instanceof feature `"+this.name+"`");
      },
      _addTo: function(entity) {
        let m=_.get(_feCache,this.name);
        if(!m)
          _.assoc(_feCache,this.name, m=_.jsMap());
        if(_.get(m,entity.p.id))
          throw "Error: feature `"+this.name+"` already exists in entity#"+entity.p.id;
        _.assoc(m,entity.p.id,this);
        this.entity=entity;
        this.added && this.added();
      },
      dispose: function() {
        this.disposed && this.disposed();
        this.entity=null;
      }
    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo.hasf= (ent,co) => {
      return _.has(_.get(_feCache,co), ent.p.id);
    };

    /**
     * @public
     * @function
     */
    Mojo.getf= (ent,co) => {
      return _.get(_.get(_feCache,co), ent.p.id);
    };

    /**
     * @public
     * @function
     */
    Mojo.addf= (ent,features) => {
      _.seq(features).forEach(name => {
        if(!Mojo.hasf(ent,name)) {
          let c,C= _.get(_features,name);
          if(!C)
            throw "Error: unknown feature: `"+name+"`";
          if(!C._pool) C._pool=[];
          c= C._pool.length>0 ? C._pool.pop() : new C();
          c._addTo(ent);
          Mojo.link(c.featureName,ent);
          Mojo.EventBus.pub("addFeature", ent, c);
        }
      });
      return ent;
    };

    /**
     * @public
     * @function
     */
    Mojo.delf= (ent,features) => {
      _.seq(features).forEach(name => {
        let m= _.get(_feCache,name),
            c= _.dissoc(m,ent.p.id);
        if(c) {
          Mojo.log("removed feature `"+name+"` from e#"+ ent.p.id);
          Mojo.EventBus.pub("delFeature",ent,c);
          c.dispose();
          Mojo.unlink(c.featureName, ent);
          _.conj(_.get(_features,name)._pool,c);
        }
      });
      return ent;
    };

    /**
     * @abstract
     * @class
     */
    Mojo.defType("Entity", {
      /**
       * @constructs
       */
      init: function(p) {
        this.p= p || {};
        if(!this.p.id)
          this.p.id= _.nextId();
      },
      add: function(child) {
        throw "Fatal: calling pure virtual method.";
      },
      del: function(child) {
        throw "Fatal: calling pure virtual method.";
      },
      dispose: function() {
        if(!this.isDead) {
          this.isDead = true;
          this.disposed && this.disposed();
          Mojo.delf(this, _.keys(_features));
        }
      }
    }, Mojo);

    /**
     * @public
     * @function
     */
    Mojo.defFeature = (name,body) => {
      if(body) {
        if(_.has(_features,name))
          throw "Error: feature `"+name+"` already defined.";
        //_.assert(is.fun(body.added),
        //"Invalid feature, require method `added`.");
        body.name = name;
        body.featureName = "."+name;
        _.assoc(_features,name,
                Mojo.defType(["Fe_"+name, Mojo.Feature], body));
      }
      return _.get(_features,name);
    };

    /**
     * @public
     * @class
     */
    Mojo.defType("GameState", {
      /**
       * @constructs
       */
      init: function(p) {
        this.p = _.clone(p);
      },
      reset: function(p) {
        this.init(p);
      },
      get: function(prop) {
        return _.get(this.p,prop);
      },
      _chgp: function(value,key) {
        if(this.p[key] !== value) {
          _.assoc(this.p, key, value);
          Mojo.EventBus.pub("change."+key,this,value);
        }
      },
      set: function(prop,value) {
        if(!is.obj(prop))
          this._chgp(value,prop);
        else
          _.doseq(prop,this._chgp,this);
        Mojo.EventBus.pub("change",this);
      },
      inc: function(prop,amount) {
        let v= this.get(prop);
        if(is.num(v))
          this.set(prop,v + amount);
      },
      dec: function(prop,amount) {
        let v=this.get(prop);
        if(is.num(v))
          this.set(prop,v - amount);
      }
    }, Mojo);

    /**
     * @public
     * @property
     */
    Mojo.state = new Mojo.GameState();

    /**A 4 pointed box, left right top bottom
     * x2 > x1 , y2 > y1.
     * @public
     * @function
     */
    Mojo.bbox4 = function(/* x1,x2,y1,y2 */) {
      return arguments.length===4
        ? {x1: arguments[0],
           x2: arguments[1],
           y1: arguments[2],
           y2: arguments[3]}
        : {x1: NaN, x2: NaN, y1: NaN, y2: NaN};
    };

    /**
     * @public
     * @function
     */
    Mojo.clear = () => {
      if(Mojo.ctx) {
        let op="clearRect";
        if(Mojo.clearColor) {
          Mojo.ctx.globalAlpha = 1;
          Mojo.ctx.fillStyle = Mojo.clearColor;
          op="fillRect";
        }
        Mojo.ctx[op](0,0,Mojo.width,Mojo.height);
      }
      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.setImageSmoothing = (ok) => {
      if(Mojo.ctx) {
        Mojo.ctx.msImageSmoothingEnabled = ok;
        Mojo.ctx.imageSmoothingEnabled = ok;
        Mojo.ctx.mozImageSmoothingEnabled = ok;
        Mojo.ctx.webkitImageSmoothingEnabled = ok;
      }
      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.imageData = (img) => {
      let cv = Mojo.domCtor("canvas"),
          ctx = cv.getContext("2d");
      cv.width = img.width;
      cv.height = img.height;
      ctx.drawImage(img,0,0);
      return ctx.getImageData(0,0,img.width,img.height);
    };

    /**
     * @public
     * @function
     */
    Mojo.assetType = (url) => {
      let ext = _.fileExt(url),
          type = ext ? _assetTypes[ext] : "";
      if(type === "Audio" &&
         Mojo.audio &&
         Mojo.audio.type === "WebAudio") {
        type = "WebAudio";
      }
      return type || "Other";
    };

    /**
     * @public
     * @function
     */
    Mojo.ajax= (key,path,cb,ecb) => {
      Mojo.log("ajax loading: "+path);
      let dev=Mojo.o.devMode,
          ajax = new XMLHttpRequest();
      if(document.location.origin === "null" ||
         document.location.origin === "file://") {
        if(!Mojo.fileURLAlert) {
          Mojo.fileURLAlert = true;
          throw "Error: file:// loading is not supported";
        }
        return ecb();
      }
      ajax.onreadystatechange = () => {
        if(ajax.readyState === 4)
          (ajax.status !== 200) ? ecb() : cb(key, ajax.responseText);
      };
      ajax.open("GET", _assetUrl(Mojo.o.dataPath,path,dev), true);
      ajax.send(null);
      return Mojo;
    };

    /**
     * @private
     * @var {DOMParser}
     */
    let _domp= new DOMParser();

    /**
     * @public
     * @property {object}
     */
    Mojo.loaders = {
      Image: (key,path,cb,ecb) => {
        Mojo.log("loading image: "+path);
        let img = new Image();
        img.onerror = ecb;
        img.onload = () => cb(key,img);
        img.src = _assetUrl(Mojo.o.imagePath, path, Mojo.o.devMode);
        return Mojo;
      },
      Audio: (key,path,cb,ecb) => {
        Mojo.log("loading audio: "+path);
        let dev=Mojo.o.devMode,
            ext= _audioExt(Mojo.o.audioFiles);
        if(!Mojo.o.sound || !ext|| !Mojo.domCtor("audio").play) {
          cb(key);
        } else {
          let snd=new Audio();
          _.addEvent("error",snd, ecb);
          if(!Mojo.touchDevice)
            _.addEvent("canplaythrough", snd, () => cb(key,snd));
          snd.src = _assetUrl(Mojo.o.audioPath, _.fileNoExt(path)+"."+ ext, dev);
          snd.load();
        }
        return Mojo;
      },
      WebAudio: (key,path,cb,ecb) => {
        Mojo.log("loading web-audio: "+path);
        let dev= Mojo.o.devMode,
            base= _.fileNoExt(path),
            ajax = new XMLHttpRequest(),
            ext= _audioExt(Mojo.o.audioFiles);
        ajax.open("GET", _assetUrl(Mojo.o.audioPath,base+"."+ext,dev), true);
        ajax.responseType = "arraybuffer";
        ajax.onload = () => {
          Mojo.audioContext.decodeAudioData(ajax.response, (b) => { cb(key,b); }, ecb);
        };
        ajax.send();
        return Mojo;
      },
      Other: (key,path,cb,ecb) => {
        return Mojo.ajax(key,path,cb,ecb);
      },
      Json: (key,path,cb,ecb) => {
        return Mojo.ajax(key,path,(key,data) => {
          cb(key,JSON.parse(data));
        }, ecb);
      },
      Xml: (key,path,cb,ecb) => {
        return Mojo.ajax(key,path,(key,data) => {
          cb(key, _domp.parseFromString(data, "application/xml"));
        },ecb);
      }
    };

    /**
     * @public
     * @function
     */
    Mojo.asset= (name,panic) => {
      let r= _.get(Mojo.assets, name);
      if(panic && !r)
        throw "Error: unknown asset `"+name+"`";
      return r;
    };

    /**
     * @public
     * @function
     */
    Mojo.load= function(assets,cb,options) {
      options= options || {};
      let assetObj = {},
          errors = 0,
          bad = options.errorCb,
          pcb = options.progressCb,
          err= (a) => {throw "Error: can't load: "+a;},
          ecb = (a) => { ++errors; (bad || err)(a); };
      _.doseq(_.seq(assets), (a) => {
        if(is.obj(a))
          _.inject(assetObj, a);
        else if(a.length > 0) assetObj[a] = a;
      });
      let sum = _.keys(assetObj).length,
          type,
          more=sum,
          loaded = (key,obj,force) => {
            if(errors < 1) {
              if(!Mojo.assets[key]||force) {
                _.assoc(Mojo.assets,key, obj);
                --more;
                if(pcb)
                  pcb(sum-more, sum);
              }
              if(more===0 && cb) { cb.apply(Mojo, []); }
            }
          };
      //start to load
      _.doseq(assetObj, (a,key) => {
        type = Mojo.assetType(a);
        Mojo.assets[key]
          ? loaded(key, _.get(Mojo.assets,key), true)
          : Mojo.loaders[type](key,a,loaded,() => { ecb(a); });
      });

      return Mojo;
    };

    /**
     * @public
     * @function
     */
    Mojo.preload = (arg,options) => {
      if(!is.fun(arg))
        _preloads = _preloads.concat(arg);
      else {
        Mojo.load(_.uniq(_preloads),arg,options);
        _preloads = [];
      }
      return Mojo;
    };

    /**
     * @public
     * @property {object}
     */
    Mojo.o = _.inject({imagePath: "images/",
                       dataPath:  "data/",
                       audioPath: "audio/",
                       sound: true,
                       id: "mojo",
                       maxFrameTime: 100,
                       autoFocus: true,
                       audioFiles: ["wav", "mp3","ogg"]}, cmdArg);

    //------------------------------------------------------------------------
    //prologue
    let domQ, svgQ,
        id = Mojo.o.id,
        libs = _.seq(Mojo.o.modules || "");

    sort_out_game_looper();

    //installing all modules
    //core modules
    ["Sprites", "Scenes"].forEach(k => {
      Mojo.log("installing module: "+k);
      MojoH5[k](Mojo);
    });

    //optional/other modules
    ["Audio",
     "Anim",
     "2d",
     "Input",
     "Touch"].concat(libs).forEach(k => {
       let f= MojoH5[k];
       if(f) {
         Mojo.log("installing module: "+k);
         f(Mojo);
         if(k==="DOM") domQ=true;
         if(k==="SVG") svgQ=true;
       } else {
         Mojo.log("warn: module `",k,"` missing");
       }
    });

    let _prologue=function() {
      Mojo.el = is.str(id) ? Mojo.domById(id) : id;
      if(!Mojo.el) {
        Mojo.el= Mojo.domCtor("canvas", {id: id,
                                         width: Mojo.o.width || 320,
                                         height: Mojo.o.height || 480});
        Mojo.domConj(Mojo.el);
      }

      let w = Mojo.el.width,
          h = Mojo.el.height,
          elParent = Mojo.el.parentNode,
          maxWidth = Mojo.o.maxWidth || 5000,
          maxHeight = Mojo.o.maxHeight || 5000,
          resampleWidth = Mojo.o.resampleWidth,
          resampleHeight = Mojo.o.resampleHeight,
          upsampleWidth = Mojo.o.upsampleWidth,
          upsampleHeight = Mojo.o.upsampleHeight;

      if(Mojo.o.maximize === true ||
         (Mojo.touchDevice && Mojo.o.maximize === "touch"))  {

        Mojo.domCss(document.body, {padding: 0, margin: 0});
        w = Mojo.o.width ||
            _.min(window.innerWidth,maxWidth) - ((Mojo.o.pageScroll)?17:0);
        h = Mojo.o.height ||
            _.min(window.innerHeight - 5,maxHeight);
        if(Mojo.touchDevice) {
          Mojo.domCss(Mojo.el, "height", (h*2) + "px");
          Mojo.scroll();
          w = _.min(window.innerWidth,maxWidth);
          h = _.min(window.innerHeight,maxHeight);
        }

      } else if(Mojo.touchDevice) {
        Mojo.scroll();
      }

      if((upsampleWidth && w <= upsampleWidth) ||
         (upsampleHeight && h <= upsampleHeight)) {
        Mojo.el.width = w * 2;
        Mojo.el.height = h * 2;
      }
      else if(Mojo.touchDevice &&
              ((resampleWidth && w > resampleWidth) ||
               (resampleHeight && h > resampleHeight))) {
        Mojo.el.width = w / 2;
        Mojo.el.height = h / 2;
      } else {
        Mojo.el.width= w;
        Mojo.el.height= h;
      }

      Mojo.domCss(Mojo.el, {height: h+"px", width: w+"px"});

      if(elParent && !Mojo.wrapper) {
        Mojo.wrapper=Mojo.domWrap(Mojo.el,
                                  Mojo.domCtor("div",
                                               {id: Mojo.el.id+"_Wrapper"},
                                               {width: w + "px",
                                                margin: "0 auto",
                                                position: "relative"}));
      }

      Mojo.domCss(Mojo.el, "position", "relative");
      Mojo.ctx = Mojo.el.getContext("2d");
      Mojo.cssWidth = w;
      Mojo.cssHeight = h;
      Mojo.width = Mojo.el.width;
      Mojo.height = Mojo.el.height;
      Mojo.width_div2=Mojo.width/2;
      Mojo.height_div2=Mojo.height/2;

      if(Mojo.o.scaleToFit) {
        let factor = 1,
            winW = window.innerWidth*factor,
            winH = window.innerHeight*factor,
            winRatio = winW/winH,
            scaleRatio = winW/Mojo.el.width,
            gameRatio = Mojo.el.width/Mojo.el.height;
        if(gameRatio < winRatio)
          scaleRatio= winH/Mojo.el.height;
        let scaledW = Mojo.el.width * scaleRatio,
            scaledH = Mojo.el.height * scaleRatio;

        Mojo.domCss(Mojo.el, {width: scaledW + "px",
                              height: scaledH + "px"});

        if(Mojo.el.parentNode)
          Mojo.domCss(Mojo.el.parentNode, {width: scaledW+"px",
                                           height: scaledH+"px"});

        Mojo.cssHeight = scaledH;
        Mojo.cssWidth = scaledW;

        //center vertically when adjusting to width
        if(gameRatio > winRatio) {
          let topPos = (winH - scaledH)/2;
          Mojo.domCss(Mojo.el, "top", topPos+"px");
        }
      }
    };

    domQ ? Mojo.DOM.prologue(Mojo) : (svgQ ? Mojo.SVG.prologue(Mojo) : _prologue(Mojo));

    //e.g. options= {touch: {}, joyad: {}}
    Mojo.handleDeviceFlip();
    Mojo.controls(Mojo.o);

    if(Mojo.o.sound !== false)
      Mojo.hasWebAudio ? Mojo.enableWebAudioSound() : Mojo.enableHTML5Sound();

    return (window.Mojo=Mojo);
  };

  /**
   * @public
   * @function
   */
  window.MojoH5=MojoH5;

  //starts here
  window.addEventListener("load", function(_) {
    MojoH5.Config.start(MojoH5(MojoH5.Config));
  });

})(this);


