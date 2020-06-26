(function(global, undefined) {
  "use strict";

  if(global.document===undefined ||
     global.document.body===undefined)
    throw "Invalid environment, cannot run MojoH5!";

  const window=global,
        OBJ=Object.prototype,
        tostr=OBJ.toString,
        document=global.document,
        slicer=Array.prototype.slice;

  const isObject= (obj) => {
    return tostr.call(obj) === "[object Object]";
  };
  const isArray= (obj) => {
    return tostr.call(obj) === "[object Array]";
  };
  const isMap= (obj) => {
    return tostr.call(obj) === "[object Map]";
  };

  let seqNum= 0;
  const _ = {
    keys: (obj) => {
      return isMap(obj) ? Array.from(obj.keys())
                        : (isObject(obj) ? Object.keys(obj) : []);
    },
    assert: (cond) => {
      if(!cond)
        throw new Error(slicer.call(arguments,1).join(""));
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
    nextID: () => { return ++seqNum; },
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
      let len = (stop-start)/step;
      let res=[];
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
        for (let i=0,z=obj.length;i<z;++i)
          if(fn.apply(ctx, [obj[i], i].concat(args)))
            return obj[i];
      } else if(isMap(obj)) {
        let ks=Array.from(obj.keys());
        for (let k,i=0,z=ks.length;i<z;++i) {
          k=ks[i];
          if(fn.apply(ctx, [obj.get(k), k].concat(args)))
          return [k, obj.get(k)];
        }
      } else if(obj) {
        for(let k in obj) {
          if(OBJ.hasOwnProperty.call(obj, k))
            if(fn.apply(ctx, [obj[k], k].concat(args)))
              return [k,obj[k]];
        }
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
    dissoc: (obj,key) => {
      let val;
      if(isMap(obj)) {
        val=obj.get(key);
        obj.delete(key);
      } else if (obj) {
        val = obj[key];
        delete obj[key];
      }
      return val;
    },
    get: (obj,key) => {
      if(isMap(obj))
        return obj.get(key);
      else if(obj)
        return obj[key];
    },
    assoc: (obj,key,value) => {
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
    },
    conj: (coll,obj) => {
      return coll.push(obj);
    },
    seq: (arg,sep=",") => {
      if(typeof arg === "string")
        arg = arg.split(sep).map(s => s.trim()).filter(s => s.length>0);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    has: (obj,key) => {
      return isMap(obj) ? obj.has(key) : OBJ.hasOwnProperty.call(obj, key);
    },
    patch: (des,src) => {
      des=des || {};
      if(src)
        for(let k in src)
          if(OBJ.hasOwnProperty.call(src,k) &&
             des[k] === void 0)
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
    subEvent: (event,target,cb,arg) => {
      return target.addEventListener(event,cb,arg);
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
  //assets
  let _audioTypes= {mp3: "audio/mpeg",
                    m4a: "audio/m4a",
                    wav: "audio/wav",
                    ogg: 'audio/ogg; codecs="vorbis"'};
  let _assetTypes= {tmx: "Tile", png: "Image", xml: "Xml", json: "Json",
                    jpg: "Image", gif: "Image", jpeg: "Image",
                    ogg: "Audio", wav: "Audio", m4a: "Audio", mp3: "Audio"};
  let _audioDftExt;
  let _preloads= [];
  let _audioExt= (choices) => {
    if(!_audioDftExt) {
      let snd = new Audio();
      _audioDftExt= _.some(choices, (ext) => {
        return snd.canPlayType(_audioTypes[ext]) ? ext: null;
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

  //sort out game looper
  (function() {
    let pfx = ["ms", "moz", "webkit", "o"];
    for(let x = 0; x < pfx.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[pfx[x]+"RequestAnimationFrame"];
      window.cancelAnimationFrame =
          window[pfx[x]+"CancelAnimationFrame"] ||
          window[pfx[x]+"CancelRequestAnimationFrame"];
    }
    if(!window.requestAnimationFrame) {
      let lastTime = 0;
      window.requestAnimationFrame = (cb, e) => {
        let cur = _.now();
        let delay = Math.max(0, 16 - (cur - lastTime));
        let id = _.timer(() => cb(cur+delay), delay);
        lastTime = cur+delay;
        return id;
      };
    }
    if(!window.cancelAnimationFrame)
      window.cancelAnimationFrame = (id) => { clearTimeout(id); };
  })();

  //https://johnresig.com/blog/simple-javascript-inheritance/
  //The base class implementation (does nothing)
  let Resig = function(){};
  Resig.prototype.isA = function(c) {
    return this.className === c;
  };
  (function(initing){
    let fnTest = /xyz/.test(function(){var xyz;}) ? /\b_super\b/ : /.*/;
    Resig.extend = function(className, props, container) {
      if(!is.str(className)) {
        //shift up
        container = props; props = className; className = null; }
      let _super = this.prototype; // late-bind
      let proto,ThisClass = this;
      initing = true;
      proto = new ThisClass(); // the future parent
      initing = false;
      let _superFactory= function(name,fn) {
        return function() {
          let tmp = this._super;
          /* Add a new ._super() method that is the same method */
          /* but on the super-class */
          this._super = _super[name];
          /* The method only need to be bound temporarily, so we */
          /* remove it when we're done executing */
          let ret = fn.apply(this, arguments);
          this._super = tmp;
          return ret;
        };
      }
      for(let name in props) {
        proto[name] = typeof props[name] === "function" &&
          typeof _super[name] === "function" &&
            fnTest.test(props[name]) ? _superFactory(name,props[name]) : props[name];
      }
      /* The dummy class constructor function*/
      function TemplateFn() {
        if (!initing && this.init)
          this.init.apply(this, arguments); // init => ctor
      }
      /* Populate our constructed prototype object */
      TemplateFn.prototype = proto;
      /* Enforce the constructor to be what we expect */
      TemplateFn.prototype.constructor = TemplateFn;
      /* And make this class extendable */
      TemplateFn.extend = Resig.extend;
      if(className) {
        if(isObject(container))
          container[className] = TemplateFn;
        TemplateFn.className = className;
        TemplateFn.prototype.className = className;
      }
      return TemplateFn;
    };
  })();

  let defType= (clazz, props, container) => {
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

  let EventBus= function () {
    this.tree= _.jsMap();
    this.sub= function(event,target,cb,ctx) {
      if(is.vec(event) &&
         arguments.length===1) {
        event.forEach(e => {
          if(is.vec(e))
            this.sub.apply(this, e);
        });
      } else {
        if (!cb)
          cb=event;
        if(is.str(cb)) {
          ctx=ctx || target;
          cb=ctx[cb];
        }
        if(!cb) {
          //console.log("event = " + event);
          throw "No callback provided for event sub().";
        }
        if(!this.tree.has(target))
          this.tree.set(target,_.jsMap());
        let m= this.tree.get(target);
        !m.has(event)
          && m.set(event,[]);
        m.get(event).push([cb,ctx]);
      }
    };
    this.pub= function(event,target,data) {
      if(is.vec(event) &&
         arguments.length===1) {
        event.forEach(e => {
          if(is.vec(e))
            this.pub.apply(this, e);
        });
      } else {
        let m= this.tree.get(target);
        if(m)
          m= m.get(event);
        if(m)
          m.forEach(s => s[0].call(s[1],data));
      }
    };
    this.unsub= function(event,target,cb,ctx) {
      if(is.vec(event) &&
         arguments.length===1) {
        event.forEach(e => {
          if(is.vec(e))
            this.unsub.apply(this, e);
        });
      } else {
        for(let ss, m= this.tree.get(target);m;m=null) {
          if(!cb)
            m.delete(event);
          else {
            if(is.str(cb)) {
              ctx=ctx || target;
              cb=ctx[cb];
            }
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
    };
  };

  let _aux=["Tiles"];
  window.MojoH5 = function(opts) {
    let Mojo= {o: _.inject({imagePath: "images/",
                            dataPath:  "data/",
                            audioPath: "audio/",
                            sound: true,
                            maxFrameTime: 100,
                            autoFocus: true,
                            audioFiles: ["mp3","ogg"]}, opts)};

    // entity types for collision detections
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
     * @property
     */
    Mojo.touchDevice= !!("ontouchstart" in document);
    /**
     * @function
     */
    Mojo["$"]= function(selector) {};
    /**
     * @property
     */
    Mojo.EventBus=new EventBus();
    /**
     * @property
     */
    Mojo.is=is;
    /**
     * @property
     */
    Mojo.u=_;
    /**
     * @property
     */
    Mojo.features= {};
    /**
     * @property
     */
    Mojo.loaders={};
    /**
     * @property
     */
    Mojo.assets={};

    /**
     * @function
     */
    Mojo.scroll = (x,y) => {
      window.scrollTo(x||0, y||1);
      return Mojo;
    };

    /**
     * @function
     */
    Mojo.scrollTop = (x,y) => {
      x=x||0;
      y=y||1;
      _.timer(() => { Mojo.scroll(x,y); }, 0);
      return Mojo;
    };

    /**
     * @function
     */
    Mojo.handleDeviceFlip = () => {
      _.subEvent("orientationchange", window, () => {
        Mojo.scrollTop();
      });
      return Mojo;
    };

    //------------------------------------------------------------------------
    //DOM stuff
    /**
     * @function
     */
    Mojo.domBySelector= (selector) => { return document.querySelectorAll(selector); };
    /**
     * @function
     */
    Mojo.domById= (id) => { return document.getElementById(id); };
    /**
     * @function
     */
    Mojo.domParent= (e) => { return e ? e.parentNode : undefined; };
    /**
     * @function
     */
    Mojo.domConj = (child, par) => {
      return (par || document.body).appendChild(child);
    };
    /**
     * @function
     */
    Mojo.domByTag= (tag, ns) => {
      return is.str(ns)
             ? document.getElementsByTagNameNS(ns,tag)
             : document.getElementsByTagName(id);
    };
    /**
     * @function
     */
    Mojo.domAttrs= function(e, attrs) {
      if(!is.obj(attrs) && attrs) {
        //attrs=""+attrs;
        if(arguments.length > 2)
          e.setAttribute(attrs, arguments[2]);
        return e.getAttribute(attrs);
      }
      if(attrs)
        _.doseq(attrs, (v,k) => { e.setAttribute(k,v); });
      return e;
    };
    /**
     * @function
     */
    Mojo.domCss= function(e, styles) {
      if(!is.obj(styles) && styles) {
        //styles=""+styles;
        if(arguments.length > 2)
          e.style[styles]= arguments[2];
        return e.style[styles];
      }
      if(styles)
        _.doseq(styles, (v,k) => { e.style[k]= v; });
      return e;
    };
    /**
     * @function
     */
    Mojo.domWrap= (child,wrapper) => {
      let p=child.parentNode;
      wrapper.appendChild(child);
      p.appendChild(wrapper);
      return wrapper;
    };
    /**
     * @function
     */
    Mojo.domCtor = (tag, attrs, styles) => {
      let e = document.createElement(tag);
      Mojo.domAttrs(e,attrs);
      Mojo.domCss(e,styles);
      return e;
    };

    /**
     * @function
     */
    Mojo.scheduleFrame = (cb) => { return window.requestAnimationFrame(cb); };
    /**
     * @function
     */
    Mojo.cancelFrame = (id) => { window.cancelAnimationFrame(id); };
    /**
     * @function
     */
    Mojo.p2 = (px,py) => { return {x: px||0,y: py||0}; };
    /**
     * @function
     */
    Mojo.v2 = (x,y) => { return [x||0, y||0]; };
    /**
     * @function
     */
    Mojo.hasTouch= () => { return Mojo.touchDevice;};

    /**
     * @function
     */
    Mojo.defType= (clazz, props, container) => {
      return defType(clazz,
                     props,
                     (typeof container==="undefined") ? Mojo : container);
    };

    // set up game loop
    let _loopFrame = 0;
    let _lastFrame=0;
    /**
     * @function
     */
    Mojo.gameLoop = function(action) {
      _lastFrame = _.now();
      _loopFrame = 0;
      //Mojo.loop = true;
      Mojo.gameLoopCallbackWrapper = () => {
        let now = _.now();
        ++_loopFrame;
        Mojo.loop = Mojo.scheduleFrame(Mojo.gameLoopCallbackWrapper);
        let dt = now - _lastFrame;
        /* Prevent fast-forwarding by limiting the length of a single frame. */
        if(dt>Mojo.o.maxFrameTime)
          dt = Mojo.o.maxFrameTime;
        action.call(Mojo, dt/1000);
        _lastFrame = now;
      };
      Mojo.loop=Mojo.scheduleFrame(Mojo.gameLoopCallbackWrapper);
      return Mojo;
    };

    /**
     * @function
     */
    Mojo.pauseGame = () => {
      if(Mojo.loop) Mojo.cancelFrame(Mojo.loop);
      Mojo.loop = null;
    };

    /**
     * @function
     */
    Mojo.resumeGame = () => {
      if(!Mojo.loop) {
        _lastFrame = _.now();
        Mojo.loop = Mojo.scheduleFrame(Mojo.gameLoopCallbackWrapper);
      }
    };

    /**
     * @class
     */
    defType("Feature", {
      // created when they are added onto an entity.
      init: function(entity) {
        if(entity[this.name])
          throw "Entity has feature `"+this.name+"` already!";
        entity[this.name] = this;
        _.conj(entity.features,this.featureName);

        if(entity.scene)
          entity.scene.link(this.featureName,entity);

        this.entity = entity;
        this.added && this.added();
      },
      dispose: function() {
        delete this.entity[this.name];
        let i = this.entity.features.indexOf(this.featureName);
        if(i > -1) {
          this.entity.features.splice(i,1);
          if(this.entity.scene)
            this.entity.scene.unlink(this.featureName,this.entity);
        }
        this.disposed && this.disposed();
      }
    }, Mojo);

    /**
     * @abstract
     * @class
     */
    defType("Entity", {
      hasFeature: function(co) { return _.has(this,co); },
      addFeature: function(features) {
        if(!this.features)
          this.features= _.jsVec();
        _.seq(features).forEach(name => {
          if(!_.has(this,name)) {
            let C = Mojo.features[name];
            let z = C ? new C(this) : null;
            if(z)
              Mojo.EventBus.pub("addFeature", this, z);
          }
        });
        return this;
      },
      delFeature: function(features) {
        let f;
        _.seq(features).forEach(name => {
          if(f=this[name]) {
            Mojo.EventBus.pub("delFeature",this,f);
            f.dispose();
          }
        });
        return this;
      },
      add: function(child) {
        throw "Fatal: calling pure virtual method.";
      },
      del: function(child) {
        throw "Fatal: calling pure virtual method.";
      },
      init: function() {
      },
      dispose: function() {
        if(this.isDead) { return; }
        Mojo.EventBus.pub("disposed",this);
        if(this.scene)
          this.scene.remove(this);
        this.isDead = true;
        this.disposed && this.disposed();
      }
    }, Mojo);

    /**
     * @function
     */
    Mojo.feature = (name,body) => {
      if(body) {
        let n="Fe_"+name;
        if(Mojo[n])
          throw "Feature `"+name+"` already exists!";
        body.name = name;
        body.featureName = "."+name;
        Mojo.features[name] = defType([n, Mojo.Feature], body, Mojo);
      }
      return Mojo.features[name];
    };

    /**
     * @class
     */
    defType("GameState", {
      init: function(p) {
        this.p = _.clone(p);
      },
      reset: function(p) {
        this.init(p);
        Mojo.EventBus.pub("reset",this);
      },
      _triggerProperty: function(value,key) {
        if(this.p[key] !== value) {
          this.p[key] = value;
          Mojo.EventBus.pub("change."+key,this,value);
        }
      },
      get: function(prop) {
        return this.p[prop];
      },
      set: function(prop,value) {
        if(!is.obj(prop))
          this._triggerProperty(value,prop);
        else
          _.doseq(prop,this._triggerProperty,this);
        Mojo.EventBus.pub("change",this);
      },
      inc: function(prop,amount) {
        this.set(prop,this.get(prop) + amount);
      },
      dec: function(prop,amount) {
        this.set(prop,this.get(prop) - amount);
      }
    }, Mojo);

    /**
     * @property
     * @public
     */
    Mojo.state = new Mojo.GameState();

    /**A 4 pointed box, left right top bottom
     * x2 > x1 , y2 > y1.
     * @function
     */
    Mojo.bbox4 = () => {
      return {x1: NaN, x2: NaN, y1: NaN, y2: NaN};
    };

    /**
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
     * @function
     */
    Mojo.imageData = (img) => {
      let canvas = Mojo.domCtor("canvas");
      let ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img,0,0);
      return ctx.getImageData(0,0,img.width,img.height);
    };

    /**
     * @function
     */
    Mojo.assetType = (url) => {
      let ext = _.fileExt(url);
      let type = ext ? _assetTypes[ext] : "";
      if(type === "Audio" &&
         Mojo.audio &&
         Mojo.audio.type === "WebAudio") {
        type = "WebAudio";
      }
      return type || "Other";
    };

    /**
     * @function
     */
    Mojo.loaders.Image = (key,path,cb,ecb) => {
      let img = new Image();
      img.onerror = ecb;
      img.onload = () => cb(key,img);
      img.src = _assetUrl(Mojo.o.imagePath, path, Mojo.o.devMode);
      return Mojo;
    };

    /**
     * @function
     */
    Mojo.loaders.Audio = function(key,path,cb,ecb) {
      let dev=Mojo.o.devMode,
          ext= _audioExt(Mojo.o.audioFiles);
      if(!Mojo.o.sound ||
         !ext||
         !Mojo.domCtor("audio").play) {
        cb(key);
      } else {
        let snd=new Audio();
        _.subEvent("error",snd, ecb);
        // don't wait for canplaythrough on mobile
        if(!Mojo.touchDevice)
          _.subEvent("canplaythrough", snd, () => cb(key,snd));
        snd.src = _assetUrl(Mojo.o.audioPath, _.fileNoExt(path)+"."+ ext, dev);
        snd.load();
      }
      return Mojo;
    };

    /**
     * @function
     */
    Mojo.loaders.WebAudio = function(key,path,cb,ecb) {
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
    };

    /**
     * @function
     */
    Mojo.ajax = function(key,path,cb,ecb) {
      let dev=Mojo.o.devMode,
          ajax = new XMLHttpRequest();
      if(document.location.origin === "null" ||
         document.location.origin === "file://") {
        if(!Mojo.fileURLAlert) {
          Mojo.fileURLAlert = true;
          alert("Error: Loading assets is not supported from file:// urls!");
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
     * @function
     */
    Mojo.loaders.Other = function(key,path,cb,ecb) {
      return Mojo.ajax(key,path,cb,ecb);
    };

    /**
     * @function
     */
    Mojo.loaders.Json = function(key,path,cb,ecb) {
      return Mojo.ajax(key,path,(key,data) => {
        cb(key,JSON.parse(data));
      }, ecb);
    };

    /**
     * @function
     */
    Mojo.loaders.Xml = function(key,path,cb,ecb) {
      return Mojo.ajax(key,path,(key,data) => {
        cb(key,new DOMParser().parseFromString(data, "application/xml"));
      },ecb);
    };

    /**
     * @function
     */
    Mojo.asset= (name,panic) => {
      let r=Mojo.assets[name];
      if(panic && !r)
        throw "Unknown Asset:" + name;
      return r;
    };

    /**
     * @function
     */
    Mojo.load= function(assets,cb,options) {
      let pcb = options && options.progressCb;
      let bad = options && options.errorCb;
      let assetObj = {};
      let errors = 0;
      let ecb = (a) => {
        ++errors;
        (bad || ((a) => {throw "Error Loading: "+a;}))(a);
      };

      _.doseq(_.seq(assets), (a) => {
        if(is.obj(a))
          _.inject(assetObj,a);
        else if(a.length > 0) assetObj[a] = a;
      });

      let sum = _.keys(assetObj).length;
      let more=sum;
      let loaded = (key,obj,force) => {
        if(errors < 1) {
          if(!Mojo.assets[key]||force) {
            Mojo.assets[key] = obj;
            --more;
            if(pcb)
              pcb(sum - more, sum);
          }
          if(more === 0 && cb) { cb.apply(Mojo, []); }
        }
      };
      //start to load
      _.doseq(assetObj, (a,key) => {
        let type = Mojo.assetType(a);
        Mojo.assets[key]
          ? loaded(key,Mojo.assets[key],true)
          : Mojo.loaders[type](key,a,loaded,() => { ecb(a); });
      });

      return Mojo;
    };

    /**
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

    //------------------------------------------------------------------------
    //installing all modules
    //core modules
    ["Math", "Sprites", "Scenes"].forEach(k => MojoH5[k](Mojo));
    //optional/other modules
    ["Audio",
     "UI",
     "Anim",
     "2D",
     "Input",
     "Touch"].concat(_.seq(Mojo.o.modules||"")).forEach(k => {
      let f= MojoH5[k];
      if(!f)
        Mojo.log("warn: module `",k,"` missing."); else f(Mojo);
    });

    /**
     * @function
     */
    Mojo.prologue = function(id, options) {

      if(is.obj(id)) {
        options = id;
        id = null;
      }

      options = _.inject(Mojo.o, options || {});
      id = id || "mojo";

      Mojo.el = is.str(id) ? Mojo.domById(id) : id;
      if(!Mojo.el) {
        Mojo.el= Mojo.domCtor("canvas", {id: id,
                                         width: options.width || 320,
                                         height: options.height || 480});
        Mojo.domConj(Mojo.el);
      }

      let w = Mojo.el.width,
          h = Mojo.el.height,
          elParent = Mojo.el.parentNode,
          resampleWidth = options.resampleWidth,
          resampleHeight = options.resampleHeight,
          upsampleWidth = options.upsampleWidth,
          upsampleHeight = options.upsampleHeight,
          maxWidth = options.maxWidth || 5000,
          maxHeight = options.maxHeight || 5000;

      if(options.maximize === true ||
         (Mojo.touchDevice && options.maximize === "touch"))  {

        Mojo.domCss(document.body, {padding: 0, margin: 0});

        w = options.width ||
            _.min(window.innerWidth,maxWidth) - ((options.pageScroll)?17:0);
        h = options.height ||
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
      Mojo.width = Mojo.el.width;
      Mojo.height = Mojo.el.height;
      Mojo.cssWidth = w;
      Mojo.cssHeight = h;

      if(options.scaleToFit) {
        let factor = 1;
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

      Mojo.controls(options.joypad);
      Mojo.touch(options.touch);
      Mojo.handleDeviceFlip();

      if(options.sound !== false)
        Mojo.hasWebAudio ? Mojo.enableWebAudioSound() : Mojo.enableHTML5Sound();

      return Mojo;
    };

    return (window.Mojo=Mojo);
  };

  return window.MojoH5;

})(this);


