(function(____root) {
  "use strict";
  const ARRAY=Array.prototype, OBJECT=Object.prototype;
  const tostr=OBJECT.toString, slicer= ARRAY.slice;
  const isObject= (obj) => { return tostr.call(obj) === "[object Object]"; };
  const isArray= (obj) => { return tostr.call(obj) === "[object Array]"; };
  const _ = {
    now: () => { return new Date().getTime(); },
    keys: (obj) => { return isObject(obj) ? Object.keys(obj) : []; },
    range: (start,stop,step=1) => {
      let len = Math.max(0, Math.ceil((stop-start)/step));
      let res = new Array(len);
      for(let i=0;i<len;++i) { res[i] = start; start += step; }
      return res;
    },
    shuffle: (obj) => {
      let rx, res = new Array[obj.length];
      obj.forEach((x,i) => {
        rx = Math.floor(Math.random() * (i+1));
        res[i] = res[rx];
        res[rx] = x;
      });
      return res;
    },
    uniq: (arr) => {
      let res= [], prev= null;
      arr = slicer.call(arr).sort();
      arr.forEach(a => {
        if(a !== void 0 &&
           a !== prev) res.push(a);
        prev = a;
      });
      return res;
    },
    map: (obj, fn,ctx) => {
      let res;
      if(isArray(obj))
        res= obj.map(fn,ctx);
      else if(obj) {
        res=[];
        for(let k in obj)
          res.push(fn.call(ctx, obj[k],k,obj));
      }
      return res;
    },
    find: function(obj,fn,ctx,...args) {
      let res;
      if(isArray(obj)) {
        obj.forEach((x,i,c) => {
          res = fn.apply(ctx, [x, i].concat(args));
          if(res)
            return res;
        });
      } else if(obj) {
        for(let k in obj) {
          res = fn.apply(ctx, [obj[k], k].concat(args));
          if(res)
            return res;
        }
      }
      return res;
    },
    invoke: function(arr,key,...args) {
      if(isArray(arr))
        arr.forEach(x => { x[key].apply(x, args); });
    },
    doseq: (obj,fn,ctx) => {
      if(isArray(obj)) {
        obj.forEach(fn,ctx);
      } else if(obj) {
        for(let k in obj)
          fn.call(ctx, obj[k], k, obj);
      }
    },
    dissoc: (obj,key) => {
      let val = obj[key];
      delete obj[key];
      return val;
    },
    seq: (arg,sep=",") => {
      if(typeof arg === "string") arg = arg.replace(/\s+/g,'').split(sep);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    isString: (obj) => { return typeof obj === "string"; },
    isNumber: (obj) => { return tostr.call(obj) === "[object Number]"; },
    isFunction: (obj) => { return tostr.call(obj) === "[object Function]"; },
    isObject: isObject,
    isArray: isArray,
    isUndef: (obj) => { return obj === void 0; },
    isUndefined: (obj) => { return obj === void 0; },
    has: (obj,key) => { return OBJECT.hasOwnProperty.call(obj, key); },
    patch: (des,src) => {
      if (src)
        for (let k in src)
          if(des[k] === void 0) des[k] = src[k];
      return des;
    },
    clone: (obj) => { return Object.assign({},obj); },
    inject: (des,src) => { return src ? Object.assign(des,src) : des; }
  };

  let Q = function(selector,scope,options) {
    return Q.select && Q.select(selector,scope,options);
  };

  Q["_"]= _;

  // The base class implementation (does nothing)
  let ____john_resig = function(){};
  ____john_resig.prototype.isA = function(c) {
    return this.className === c;
  };
  (function(){
    let initializing = false,
        fnTest = /xyz/.test(function(){ var xyz;}) ? /\b_super\b/ : /.*/;
    ____john_resig.extend = function(className, props, classMethods) {
      if(!_.isString(className)) {
        classMethods = props;
        props = className;
        className = null;
      }
      let _super = this.prototype;
      let ThisClass = this;
      initializing = true;
      let prototype = new ThisClass();
      initializing = false;
      function _superFactory(name,fn) {
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
        /* Check if we're overwriting an existing function */
        prototype[name] = typeof props[name] === "function" &&
          typeof _super[name] === "function" &&
            fnTest.test(props[name]) ? _superFactory(name,props[name]) : props[name];
      }
      /* The dummy class constructor function*/
      function Base() {
        if (!initializing && this.init)
          this.init.apply(this, arguments); // init => ctor
      }
      /* Populate our constructed prototype object */
      Base.prototype = prototype;
      /* Enforce the constructor to be what we expect */
      Base.prototype.constructor = Base;
      /* And make this class extendable */
      Base.extend = ____john_resig.extend;
      if(classMethods)
        Object.assign(Class,classMethods);
      if(className) {
        Q[className] = Base;
        Base.prototype.className = className;
        Base.className = className;
      }
      return Base;
    };
  })();

  Q._normalizeArg = function(arg) {
    if(Q._isString(arg)) {
      arg = arg.replace(/\s+/g,'').split(",");
    }
    if(!Q._isArray(arg)) {
      arg = [ arg ];
    }
    return arg;
  };

  Q.defType = function(clazz, props, classProps) {
    let child,parent;
    if(_.isString(clazz)) {
      parent=____john_resig;
      child=clazz;
    } else if(_.isArray(clazz)) {
      child=clazz[0];
      parent=clazz[1];
    }
    return parent.extend(child,props,classProps);
  }

  Q.include = function(arg) {
    _.doseq(Q._normalizeArg(arg),(m) => {
      let f = Quintus[m] || m;
      if(!_.isFunction(f))
        throw "Invalid Module:" + m;
      f(Q);
    });
    return Q;
  };

  Q._extend = _.inject;
  Q._clone = function(obj) { return Q._extend({},obj); };
  Q._defaults = _.patch;
  Q._has = function(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };
  Q._isString = function(obj) { return typeof obj === "string"; };
  Q._isNumber = function(obj) { return Object.prototype.toString.call(obj) === '[object Number]'; };
  Q._isFunction = function(obj) { return Object.prototype.toString.call(obj) === '[object Function]'; };
  Q._isObject = function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; };
  Q._isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };
  Q._isUndefined = function(obj) { return obj === void 0; };
  Q._popProperty = _.dissoc;
  Q._each = _.doseq;
  Q._invoke = _.invoke;
  Q._detect = _.find;
  Q._map = _.map;
  Q._uniq = _.uniq;
  Q._shuffle = _.shuffle;
  Q._keys = _.keys;
  Q._range = _.range;

  let idIndex = 0;
  Q._uniqueId = () => { return ++idIndex; };

  Q.scheduleFrame = (cb) => { return window.requestAnimationFrame(cb); };
  Q.cancelFrame = (id) => { window.cancelAnimationFrame(id); };
  Q.gameLoop = function(action) {
    Q.lastGameLoopFrame = _.now();
    Q.loop = true;
    Q._loopFrame = 0;
    Q.gameLoopCallbackWrapper = () => {
      let now = _.now();
      ++Q._loopFrame;
      Q.loop = Q.scheduleFrame(Q.gameLoopCallbackWrapper);
      let dt = now - Q.lastGameLoopFrame;
      /* Prevent fast-forwarding by limiting the length of a single frame. */
      if(dt > Q.options.frameTimeLimit)
        dt = Q.options.frameTimeLimit;
      action.call(Q, dt / 1000);
      Q.lastGameLoopFrame = now;
    };
    Q.scheduleFrame(Q.gameLoopCallbackWrapper);
    return Q;
  };

  Q.pauseGame = () => {
    if(Q.loop) Q.cancelFrame(Q.loop);
    Q.loop = null;
  };

  Q.resumeGame = () => {
    if(!Q.loop) {
      Q.lastGameLoopFrame = _.now();
      Q.loop = Q.scheduleFrame(Q.gameLoopCallbackWrapper);
    }
  };

  Q.defType("Evented", {
    on: function(event,cb,ctx) {
      if(_.isArray(event) || event.indexOf(",") > -1) {
        _.seq(event).forEach(e => this.on(e,cb,ctx));
      } else {
        ctx= ctx || this;
        if(!cb) cb = event;
        if(_.isString(cb)) { cb = ctx[cb]; }
        this.subs = this.subs || {};
        this.subs[event] = this.subs[event] || [];
        this.subs[event].push([ctx, cb]);
        ctx.binds= ctx.binds || [];
        ctx.binds.push([this,event,cb]);
      }
    },
    trigger: function(event,data) {
      let ss= this.subs && this.subs[event];
      if (ss)
        ss.forEach(s => s[1].call(s[0],data));
    },
    off: function(event,cb,ctx) {
      let ss= this.subs && this.subs[event];
      ctx=ctx || this;
      if(!cb) {
        if(ss) ss.length=0; // remove all
      } else {
        if(_.isString(cb) && ctx[cb]) { cb = ctx[cb]; }
        if(ss)
          // reverse remove without having to affect the loop.
          for(let i = ss.length-1;i>=0;--i) {
            if(ss[i][0] === ctx)
              if(!cb || cb === ss[i][1]) ss.splice(i,1);
          }
      }
    },
    debind: function() {
      if(this.binds)
        this.binds.forEach(b => b[0].off(b[1],this));
    }
   });

  Q.components = {};

  Q.defType(["Component", Q.Evented], {
    // Components are created when they are added onto a `Q.GameObject` entity. The entity
    // is directly extended with any methods inside of an `extend` property and then the
    // component itself is added onto the entity as well.
    init: function(entity) {
      if(this.____entity)
        Object.assign(entity,this.____entity);
      entity[this.name] = this;
      entity.activeComponents.push(this.componentName);

      if(entity.stage && entity.stage.addToList) {
        entity.stage.addToList(this.componentName,entity);
      }

      this.entity = entity;
      if(this.added) { this.added(); }
    },
    dispose: function() {
      let me=this;
      if(this.____entity)
        _.keys(this.____entity).forEach(k => delete me.entity[k]);
      delete this.entity[this.name];
      let idx = this.entity.activeComponents.indexOf(this.componentName);
      if(idx !== -1) {
        this.entity.activeComponents.splice(idx,1);
        if(this.entity.stage && this.entity.stage.addToList) {
          this.entity.stage.addToLists(this.componentName,this.entity);
        }
      }
      this.debind();
      this.disposed && this.disposed();
    }
  });

  Q.defType(["GameObject",Q.Evented], {
    has: function(component) {
      return this[component] ? true : false;
    },
    add: function(components) {
      let me=this;
      components = Q._normalizeArg(components);
      if(!this.activeComponents) { this.activeComponents = []; }
      components.forEach(name => {
        let C = Q.components[name];
        if(!me.has(name) && C)
          me.trigger('addComponent', new C(me));
      });
      return this;
    },
    del: function(components) {
      let me=this;
      components = Q._normalizeArg(components);
      components.forEach(name => {
        if(name && me.has(name)) {
          me.trigger('delComponent',me[name]);
          me[name].dispose();
        }
      });
      return this;
    },
    dispose: function() {
      if(this.isDestroyed) { return; }
      this.trigger('disposed');
      this.debind();
      this.stage && this.stage.remove && this.stage.remove(this);
      this.isDestroyed = true;
      this.disposed && this.disposed();
    }
  });

  Q.component = function(name,methods) {
    if(!methods)
      return Q.components[name];
    methods.name = name;
    methods.componentName = "." + name;
    return (Q.components[name] = Q.Component.extend(name + "Component",methods));
  };

  Q.GameObject.extend("GameState",{
    init: function(p) {
      this.p = Object.assign({},p);
      this.listeners = {};
    },
    reset: function(p) { this.init(p); this.trigger("reset"); },
    _triggerProperty: function(value,key) {
      if(this.p[key] !== value) {
        this.p[key] = value;
        this.trigger("change." + key,value);
      }
    },
    set: function(properties,value) {
      if(_.isObject(properties)) {
        _.doseq(properties,this._triggerProperty,this);
      } else {
        this._triggerProperty(value,properties);
      }
      this.trigger("change");
    },
    inc: function(property,amount) {
      this.set(property,this.get(property) + amount);
    },
    dec: function(property,amount) {
      this.set(property,this.get(property) - amount);
    },
    get: function(property) {
      return this.p[property];
    }
  });

  Q.state = new Q.GameState();

  Q.reset = function() { Q.state.reset(); };

  Q.touchDevice = (typeof exports === 'undefined') &&
                  ('ontouchstart' in document);

  Q.setup = function(id, options) {
    if(_.isObject(id)) {
      options = id;
      id = null;
    }
    options = options || {};
    id = id || "quintus";

    if(_.isString(id)) {
      Q.el = document.getElementById(id);
    } else {
      Q.el = id;
    }

    if(!Q.el) {
      Q.el = document.createElement("canvas");
      Q.el.width = options.width || 320;
      Q.el.height = options.height || 420;
      Q.el.id = id;
      document.body.appendChild(Q.el);
    }

    let w = parseInt(Q.el.width,10),
        h = parseInt(Q.el.height,10);

    let maxWidth = options.maxWidth || 5000,
        maxHeight = options.maxHeight || 5000,
        resampleWidth = options.resampleWidth,
        resampleHeight = options.resampleHeight,
        upsampleWidth = options.upsampleWidth,
        upsampleHeight = options.upsampleHeight;

    if(options.maximize === true ||
       (Q.touchDevice && options.maximize === 'touch'))  {
      document.body.style.padding = 0;
      document.body.style.margin = 0;

      w = options.width ||
          Math.min(window.innerWidth,maxWidth) - ((options.pagescroll)?17:0);
      h = options.height ||
          Math.min(window.innerHeight - 5,maxHeight);

      if(Q.touchDevice) {
        Q.el.style.height = (h*2) + "px";
        window.scrollTo(0,1);
        w = Math.min(window.innerWidth,maxWidth);
        h = Math.min(window.innerHeight,maxHeight);
      }
    } else if(Q.touchDevice) {
      window.scrollTo(0,1);
    }

    if((upsampleWidth && w <= upsampleWidth) ||
       (upsampleHeight && h <= upsampleHeight)) {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w * 2;
      Q.el.height = h * 2;
    }
    else if(((resampleWidth && w > resampleWidth) ||
        (resampleHeight && h > resampleHeight)) &&
       Q.touchDevice) {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w / 2;
      Q.el.height = h / 2;
    } else {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w;
      Q.el.height = h;
    }

    let elParent = Q.el.parentNode;

    if(elParent && !Q.wrapper) {
      Q.wrapper = document.createElement("div");
      Q.wrapper.id = Q.el.id + '_container';
      Q.wrapper.style.width = w + "px";
      Q.wrapper.style.margin = "0 auto";
      Q.wrapper.style.position = "relative";

      elParent.insertBefore(Q.wrapper,Q.el);
      Q.wrapper.appendChild(Q.el);
    }

    Q.el.style.position = 'relative';

    Q.ctx = Q.el.getContext &&
            Q.el.getContext("2d");

    Q.width = parseInt(Q.el.width,10);
    Q.height = parseInt(Q.el.height,10);
    Q.cssWidth = w;
    Q.cssHeight = h;

    //scale to fit
    if(options.scaleToFit) {
      let factor = 1;
      let winW = window.innerWidth*factor;
      let winH = window.innerHeight*factor;
      let winRatio = winW/winH;
      let gameRatio = Q.el.width/Q.el.height;
      let scaleRatio = gameRatio < winRatio ? winH/Q.el.height : winW/Q.el.width;
      let scaledW = Q.el.width * scaleRatio;
      let scaledH = Q.el.height * scaleRatio;

      Q.el.style.width = scaledW + "px";
      Q.el.style.height = scaledH + "px";

      if(Q.el.parentNode) {
        Q.el.parentNode.style.width = scaledW + "px";
        Q.el.parentNode.style.height = scaledH + "px";
      }

      Q.cssWidth = parseInt(scaledW,10);
      Q.cssHeight = parseInt(scaledH,10);

      //center vertically when adjusting to width
      if(gameRatio > winRatio) {
        let topPos = (winH - scaledH)/2;
        Q.el.style.top = topPos+'px';
      }
    }

    window.addEventListener('orientationchange',function() {
      setTimeout(() => window.scrollTo(0,1), 0);
    });

    return Q;
  };

  Q.clear = function() {
    if(Q.clearColor) {
      Q.ctx.globalAlpha = 1;
      Q.ctx.fillStyle = Q.clearColor;
      Q.ctx.fillRect(0,0,Q.width,Q.height);
    } else {
      Q.ctx.clearRect(0,0,Q.width,Q.height);
    }
  };

  Q.setImageSmoothing = function(enabled) {
    Q.ctx.mozImageSmoothingEnabled = enabled;
    Q.ctx.webkitImageSmoothingEnabled = enabled;
    Q.ctx.msImageSmoothingEnabled = enabled;
    Q.ctx.imageSmoothingEnabled = enabled;
  };

  Q.imageData = function(img) {
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    return ctx.getImageData(0,0,img.width,img.height);
  };

  Q.assetTypes = {
    png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
    ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio'
  };

  Q._fileExtension = function(filename) {
    let fileParts = filename.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();
    return fileExt;
  };

  Q.assetType = function(asset) {
    let fileExt = Q._fileExtension(asset);
    // Use the web audio loader instead of the regular loader
    // if it's supported.
    let fileType = Q.assetTypes[fileExt];
    if(fileType === 'Audio' &&
       Q.audio &&
       Q.audio.type === "WebAudio") {
      fileType = 'WebAudio';
    }

    return fileType || 'Other';
  };

  Q.assetUrl = function(base,url) {
    let timestamp = "";
    if(Q.options.development) {
      timestamp = (/\?/.test(url) ? "&" : "?") + "_t=" + _now();
    }
    if(/^https?:\/\//.test(url) || url[0] === "/") {
      return url + timestamp;
    } else {
      return base + url + timestamp;
    }
  };

  Q.loadAssetImage = function(key,src,callback,errorCallback) {
    let img = new Image();
    img.onload = () => callback(key,img);
    img.onerror = errorCallback;
    img.src = Q.assetUrl(Q.options.imagePath,src);
  };

  Q.audioMimeTypes = { mp3: 'audio/mpeg',
                       ogg: 'audio/ogg; codecs="vorbis"',
                       m4a: 'audio/m4a',
                       wav: 'audio/wav' };

  Q._audioAssetExtension = function() {
    if(Q._audioAssetPreferredExtension)
      return Q._audioAssetPreferredExtension;

    let snd = new Audio();
    return Q._audioAssetPreferredExtension =
      _.find(Q.options.audioSupported,
         function(ext) {
          return snd.canPlayType(Q.audioMimeTypes[ext]) ? ext: null;
         });
  };

  Q.loadAssetAudio = function(key,src,callback,errorCallback) {
    if(!document.createElement("audio").play || !Q.options.sound) {
      callback(key,null);
      return;
    }

    let baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension(),
        filename = null,
        snd = new Audio();

    /* No supported audio = trigger ok callback anyway */
    if(!extension) {
      callback(key,null);
      return;
    }

    snd.addEventListener("error",errorCallback);

    // Don't wait for canplaythrough on mobile
    if(!Q.touchDevice)
      snd.addEventListener('canplaythrough',() => callback(key,snd));

    snd.src =  Q.assetUrl(Q.options.audioPath,baseName + "." + extension);
    snd.load();

    if(Q.touchDevice)
      callback(key,snd);
  };

  Q.loadAssetWebAudio = function(key,src,callback,errorCallback) {
    var request = new XMLHttpRequest(),
        baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension();

    request.open("GET", Q.assetUrl(Q.options.audioPath,baseName + "." + extension), true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      let audioData = request.response;
      Q.audioContext.decodeAudioData(request.response, (buffer) => {
        callback(key,buffer);
      }, errorCallback);
    };
    request.send();
  };

  Q.loadAssetOther = function(key,src,callback,errorCallback) {
    let request = new XMLHttpRequest();
    let fileParts = src.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();

    if(document.location.origin === "file://" ||
       document.location.origin === "null") {
      if(!Q.fileURLAlert) {
        Q.fileURLAlert = true;
        alert("Quintus Error: Loading assets is not supported from file:// urls - please run from a local web-server and try again");
      }
      return errorCallback();
    }

    request.onreadystatechange = function() {
      if(request.readyState === 4) {
        if(request.status === 200) {
          if(fileExt === 'json') {
            callback(key,JSON.parse(request.responseText));
          } else {
            callback(key,request.responseText);
          }
        } else {
          errorCallback();
        }
      }
    };

    request.open("GET", Q.assetUrl(Q.options.dataPath,src), true);
    request.send(null);
  };

  Q._removeExtension = function(file) {
    return file.replace(/\.(\w{3,4})$/,"");
  };

  Q.assets = {};
  Q.asset = function(name) { return Q.assets[name]; };
  Q.load = function(assets,callback,options) {
    let assetObj = {};
    if(!options) { options = {}; }
    /* Get our progressCallback if we have one */
    let progressCallback = options.progressCallback;
    let errors = false,
        errorCallback = function(itm) {
          errors = true;
          (options.errorCallback  ||
           function(itm) { throw("Error Loading: " + itm ); })(itm);
        };

    if(_.isString(assets))
      assets = Q._normalizeArg(assets);

    if(!_.isArray(assets)) {
      assetObj = assets;
    } else {
      _.doseq(assets,function(itm) {
        if(!_.isObject(itm))
          assetObj[itm] = itm;
        else
          Object.assign(assetObj,itm);
      });
    }

    let assetsTotal = _.keys(assetObj).length,
        assetsRemaining = assetsTotal;
    let loadedCallback = function(key,obj,force) {
      if(errors) { return; }

      if(!Q.assets[key]||force) {
        Q.assets[key] = obj;
        --assetsRemaining;
        if(progressCallback)
           progressCallback(assetsTotal - assetsRemaining,assetsTotal);
      }
      if(assetsRemaining === 0 && callback) {
        callback.apply(Q);
      }
    };

    /* Now actually load each asset */
    _.doseq(assetObj,function(itm,key) {
      let assetType = Q.assetType(itm);
      if(Q.assets[key]) {
        loadedCallback(key,Q.assets[key],true);
      } else {
        Q["loadAsset" + assetType](key,itm,
                                   loadedCallback,
                                   function() { errorCallback(itm); });
      }
    });
  };

  Q.preloads = [];
  Q.preload = function(arg,options) {
    if(!_.isFunction(arg)) {
      Q.preloads = Q.preloads.concat(arg);
    } else {
      Q.load(_.uniq(Q.preloads),arg,options);
      Q.preloads = [];
    }
  };

  (function() {
    if(typeof window === 'undefined') { return; }
    let lastTime = 0;
    let vendors = ['ms', 'moz', 'webkit', 'o'];
    for(let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        let cur = _.now();
        let delay = Math.max(0, 16 - (cur - lastTime));
        let id = setTimeout(() => callback(cur+delay), delay);
        lastTime = cur+delay;
        return id;
      };
    }
    if(!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = (id) => { clearTimeout(id); };
    }
  })();

  ____root["Quintus"] = function (opts) {
    Q.options = Object.assign({
    imagePath: "images/",
    audioPath: "audio/",
    dataPath:  "data/",
    audioSupported: [ 'mp3','ogg' ],
    sound: true,
    frameTimeLimit: 100,
    autoFocus: true
    }, opts || {});
    return Q;
  }

  return ____root["Quintus"];

})((typeof exports === "undefined") ? this : exports);

