(function(global) {
  "use strict";

  if (typeof global.document==="undefined" ||
      typeof global.document.body==="undefined")
    throw "Invalid environment, cannot run Mojo!";

  const ARRAY=Array.prototype,
        OBJECT=Object.prototype;
  const slicer= ARRAY.slice,
        tostr=OBJECT.toString,
        window=global,
        document=global.document;

  const isObject= (obj) => { return tostr.call(obj) === "[object Object]"; };
  const isArray= (obj) => { return tostr.call(obj) === "[object Array]"; };

  const _ = {
    keys: (obj) => { return isObject(obj) ? Object.keys(obj) : []; },
    slice: (a,i) => { return slicer.call(a, i); },
    now: () => { return new Date().getTime(); },
    basename: (file) => { return file.replace(/\.(\w{3,4})$/,""); },
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
    find: function(obj,fn,ctx) {
      let res;
      let args=slicer.call(arguments,3);
      if(isArray(obj)) {
        for (let i=0,z=obj.length;i<z;++i) {
          res = fn.apply(ctx, [obj[i], i].concat(args));
          if (res)
            return res;
        }
      } else if(obj) {
        for(let k in obj) {
          res = fn.apply(ctx, [obj[k], k].concat(args));
          if(res)
            return res;
        }
      }
      return res;
    },
    invoke: function(arr,key) {
      let args=slicer.call(arguments,2);
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
      if(typeof arg === "string")
        arg = arg.replace(/\s+/g,'').split(sep);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    isString: (obj) => { return typeof obj === "string"; },
    isNumber: (obj) => { return tostr.call(obj) === "[object Number]"; },
    isFunction: (obj) => { return tostr.call(obj) === "[object Function]"; },
    isObject: isObject,
    isArray: isArray,
    isUndef: (obj) => { return obj === void 0; },
    has: (obj,key) => {
      return OBJECT.hasOwnProperty.call(obj, key);
    },
    patch: (des,src) => {
      if (src)
        for (let k in src)
          if(des[k] === void 0) des[k] = src[k];
      return des;
    },
    clone: (obj) => { return Object.assign({},obj); },
    inject: function(des) {
      let args=slicer.call(arguments,1);
      args.forEach(s => Object.assign(des,s));
      return des;
    }
  };

  /*
  let Mo = function(selector,scope) {
    return Mo.select && Mo.select(selector,scope,options);
  };
  */
  let Mo={};

  // The base class implementation (does nothing)
  let ____john_resig = function(){};
  ____john_resig.prototype.isA = function(c) {
    return this.className === c;
  };
  (function(){
    let initializing = false,
        fnTest = /xyz/.test(function(){ var xyz;}) ? /\b_super\b/ : /.*/;
    ____john_resig.extend = function(className, props, container) {
      if(!_.isString(className)) {
        container = props;
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
      //if(classMethods) Object.assign(Base,classMethods);
      if(className) {
        container=container|| Mo;
        container[className] = Base;
        //console.log("Adding class " + className + " to Mo.");
        Base.prototype.className = className;
        Base.className = className;
      }
      return Base;
    };
  })();

  Mo.defType = function(clazz, props, classProps) {
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

  Mo.uses = (arg) => {
    _.doseq(arg, (m) => {
      let f = Mojo[m] || m;
      if (_.isFunction(f)) f(Mo); else throw "Invalid Module:" + m; });
    return Mo;
  };

  let idIndex = 0;
  Mo._uniqueId = () => { return ++idIndex; };

  Mo.scheduleFrame = (cb) => { return window.requestAnimationFrame(cb); };
  Mo.cancelFrame = (id) => { window.cancelAnimationFrame(id); };
  Mo.gameLoop = function(action) {
    Mo.lastGameLoopFrame = _.now();
    Mo.loop = true;
    Mo._loopFrame = 0;
    Mo.gameLoopCallbackWrapper = () => {
      let now = _.now();
      ++Mo._loopFrame;
      Mo.loop = Mo.scheduleFrame(Mo.gameLoopCallbackWrapper);
      let dt = now - Mo.lastGameLoopFrame;
      /* Prevent fast-forwarding by limiting the length of a single frame. */
      if(dt > Mo.options.frameTimeLimit)
        dt = Mo.options.frameTimeLimit;
      action.call(Mo, dt / 1000);
      Mo.lastGameLoopFrame = now;
    };
    Mo.scheduleFrame(Mo.gameLoopCallbackWrapper);
    return Mo;
  };

  Mo.pauseGame = () => {
    if(Mo.loop) Mo.cancelFrame(Mo.loop);
    Mo.loop = null;
  };

  Mo.resumeGame = () => {
    if(!Mo.loop) {
      Mo.lastGameLoopFrame = _.now();
      Mo.loop = Mo.scheduleFrame(Mo.gameLoopCallbackWrapper);
    }
  };

  Mo.EventBus=  {
    tree: new Map(),
    sub: function(event,target,cb,ctx) {
      if(_.isArray(event)) {
        event.forEach(e => this.sub(e,target,cb,ctx));
      } else {
        if(_.isString(cb)) {
          ctx=ctx || target;
          cb=ctx[cb];
        }
        if (!cb)
          throw "No callback provided for event sub().";
        if (!this.tree.has(target))
          this.tree.set(target,new Map());
        let m= this.tree.get(target);
        !m.has(event)
          && m.set(event,[]);
        m.get(event).push([cb,ctx]);
      }
    },
    pub: function(event,target,data) {
      let m= this.tree.get(target);
      if (m)
        m= m.get(event);
      if (m)
        m.forEach(s => s[0].call(s[1],data));
    },
    unsub: function(event,target,cb,ctx) {
      for(let ss, m= this.tree.get(target);m;m=null) {
        if(!cb)
          m.delete(event);
        else {
          if(_.isString(cb)) {
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

  Mo.defType("Evented", {
    on: function(event,cb,ctx) {
      if(_.isArray(event)) {
        event.forEach(e => this.on(e,cb,ctx));
      } else {
        if(!cb) cb = event;
        ctx= ctx || this;
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
        this.binds.forEach(b => b[0].off(b[1],null,this));
    }
   });

  Mo.components = {};

  Mo.defType(["Component", Mo.Evented], {
    // Components are created when they are added onto a `Mo.Entity` entity. The entity
    // is directly extended with any methods inside of an `extend` property and then the
    // component itself is added onto the entity as well.
    init: function(entity) {
      if(this.____entity)
        _.inject(entity,this.____entity);
      entity[this.name] = this;
      entity.features.push(this.componentName);

      entity.layer &&
        entity.layer.addToList &&
          entity.layer.addToList(this.componentName,entity);

      this.entity = entity;
      this.added && this.added();
    },
    dispose: function() {
      if(this.____entity)
        _.keys(this.____entity).forEach(k => delete this.entity[k]);
      delete this.entity[this.name];
      let idx = this.entity.features.indexOf(this.componentName);
      if(idx > -1) {
        this.entity.features.splice(idx,1);
        //WTF, should be remove?
        this.entity.layer &&
          this.entity.layer.addToList &&
            this.entity.layer.addToList(this.componentName,this.entity);
      }
      this.debind();
      this.disposed && this.disposed();
    }
  });

  Mo.defType(["Entity",Mo.Evented], {
    has: function(co) {
      return _.has(this,co);
    },
    add: function(components) {
      this.features= this.features || [];
      _.seq(components).forEach(name => {
        let C = Mo.components[name];
        if(C && !_.has(this,name))
          this.trigger('addComponent', new C(this));
      });
      return this;
    },
    del: function(components) {
      _.seq(components).forEach(name => {
        if(this[name]) {
          this.trigger('delComponent',this[name]);
          this[name].dispose();
        }
      });
      return this;
    },
    dispose: function() {
      if(this.isDead) { return; }
      this.trigger('disposed');
      this.debind();
      this.layer && this.layer.remove && this.layer.remove(this);
      this.isDead = true;
      this.disposed && this.disposed();
    }
  });

  Mo.component = function(name,methods) {
    if(!methods)
      return Mo.components[name];
    methods.name = name;
    methods.componentName = "." + name;
    return (Mo.components[name] = Mo.defType(["Comp_"+name,Mo.Component], methods));
  };

  Mo.defType(["GameState",Mo.Entity],{
    init: function(p) {
      this.p = _.inject({},p);
      this.listeners = {};
    },
    reset: function(p) {
      this.init(p);
      this.trigger("reset");
    },
    _triggerProperty: function(value,key) {
      if(this.p[key] !== value) {
        this.p[key] = value;
        this.trigger("change." + key,value);
      }
    },
    set: function(prop,value) {
      if(_.isObject(prop)) {
        _.doseq(prop,this._triggerProperty,this);
      } else {
        this._triggerProperty(value,prop);
      }
      this.trigger("change");
    },
    inc: function(prop,amount) {
      this.set(prop,this.get(prop) + amount);
    },
    dec: function(prop,amount) {
      this.set(prop,this.get(prop) - amount);
    },
    get: function(prop) {
      return this.p[prop];
    }
  });

  Mo.state = new Mo.GameState();
  Mo.reset = function() { Mo.state.reset(); };
  Mo.touchDevice = ("ontouchstart" in document);

  Mo.setup = function(id, options) {
    if(_.isObject(id)) {
      options = id;
      id = null;
    }
    options = options || {};
    id = id || "mojo";

    Mo.el = _.isString(id) ? document.getElementById(id) : id;
    if(!Mo.el) {
      let e= document.createElement("canvas");
      e.setAttribute("id",id);
      e.setAttribute("height", options.height || 420);
      e.setAttribute("width", options.width || 320);
      document.body.appendChild(e);
      Mo.el=e;
    }

    let w = parseInt(Mo.el.width),
        h = parseInt(Mo.el.height),
        elParent = Mo.el.parentNode;

    let maxWidth = options.maxWidth || 5000,
        maxHeight = options.maxHeight || 5000,
        resampleWidth = options.resampleWidth,
        resampleHeight = options.resampleHeight,
        upsampleWidth = options.upsampleWidth,
        upsampleHeight = options.upsampleHeight;

    if(options.maximize === true ||
       (Mo.touchDevice && options.maximize === 'touch'))  {
      document.body.style.padding = 0;
      document.body.style.margin = 0;

      w = options.width ||
          Math.min(window.innerWidth,maxWidth) - ((options.pageScroll)?17:0);
      h = options.height ||
          Math.min(window.innerHeight - 5,maxHeight);

      if(Mo.touchDevice) {
        Mo.el.style.height = (h*2) + "px";
        window.scrollTo(0,1);
        w = Math.min(window.innerWidth,maxWidth);
        h = Math.min(window.innerHeight,maxHeight);
      }
    } else if(Mo.touchDevice) {
      window.scrollTo(0,1);
    }

    if((upsampleWidth && w <= upsampleWidth) ||
       (upsampleHeight && h <= upsampleHeight)) {
      Mo.el.style.height = h + "px";
      Mo.el.style.width = w + "px";
      Mo.el.width = w * 2;
      Mo.el.height = h * 2;
    }
    else if(((resampleWidth && w > resampleWidth) ||
             (resampleHeight && h > resampleHeight)) && Mo.touchDevice) {
      Mo.el.style.height = h + "px";
      Mo.el.style.width = w + "px";
      Mo.el.width = w / 2;
      Mo.el.height = h / 2;
    } else {
      Mo.el.style.height = h + "px";
      Mo.el.style.width = w + "px";
      Mo.el.width = w;
      Mo.el.height = h;
    }

    if(elParent && !Mo.wrapper) {
      Mo.wrapper = document.createElement("div");
      Mo.wrapper.id = Mo.el.id + '_container';
      Mo.wrapper.style.width = w + "px";
      Mo.wrapper.style.margin = "0 auto";
      Mo.wrapper.style.position = "relative";
      elParent.insertBefore(Mo.wrapper,Mo.el);
      Mo.wrapper.appendChild(Mo.el);
    }

    Mo.el.style.position = 'relative';

    Mo.ctx = Mo.el.getContext &&
             Mo.el.getContext("2d");

    Mo.width = parseInt(Mo.el.width);
    Mo.height = parseInt(Mo.el.height);
    Mo.cssWidth = w;
    Mo.cssHeight = h;

    //scale to fit
    if(options.scaleToFit) {
      let factor = 1;
      let winW = window.innerWidth*factor;
      let winH = window.innerHeight*factor;
      let winRatio = winW/winH;
      let gameRatio = Mo.el.width/Mo.el.height;
      let scaleRatio = gameRatio < winRatio ? winH/Mo.el.height : winW/Mo.el.width;
      let scaledW = Mo.el.width * scaleRatio;
      let scaledH = Mo.el.height * scaleRatio;

      Mo.el.style.width = scaledW + "px";
      Mo.el.style.height = scaledH + "px";

      if(Mo.el.parentNode) {
        Mo.el.parentNode.style.width = scaledW + "px";
        Mo.el.parentNode.style.height = scaledH + "px";
      }

      Mo.cssWidth = parseInt(scaledW);
      Mo.cssHeight = parseInt(scaledH);

      //center vertically when adjusting to width
      if(gameRatio > winRatio) {
        let topPos = (winH - scaledH)/2;
        Mo.el.style.top = topPos+'px';
      }
    }

    window.addEventListener('orientationchange',function() {
      setTimeout(() => window.scrollTo(0,1), 0);
    });

    return Mo;
  };

  Mo.clear = () => {
    if(Mo.clearColor) {
      Mo.ctx.globalAlpha = 1;
      Mo.ctx.fillStyle = Mo.clearColor;
      Mo.ctx.fillRect(0,0,Mo.width,Mo.height);
    } else {
      Mo.ctx.clearRect(0,0,Mo.width,Mo.height);
    }
    return Mo;
  };

  Mo.setImageSmoothing = (enabled) => {
    Mo.ctx.mozImageSmoothingEnabled = enabled;
    Mo.ctx.webkitImageSmoothingEnabled = enabled;
    Mo.ctx.msImageSmoothingEnabled = enabled;
    Mo.ctx.imageSmoothingEnabled = enabled;
    return Mo;
  };

  Mo.imageData = (img) => {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    return ctx.getImageData(0,0,img.width,img.height);
  };

  Mo.assetTypes = {
    png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
    ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio'
  };

  Mo._fileExtension = (name) => {
    let parts = name.split(".");
    return parts[parts.length-1].toLowerCase();
  };

  Mo.assetType = (asset) => {
    let ext = Mo._fileExtension(asset);
    let type = Mo.assetTypes[ext];
    if(type === "Audio" &&
       Mo.audio &&
       Mo.audio.type === "WebAudio") { type = 'WebAudio'; }
    return type || "Other";
  };

  Mo.assetUrl = (base,url) => {
    let ts = "";
    if(Mo.options.devMode)
      ts = (/\?/.test(url) ? "&" : "?") + "_t=" + _.now();
    ts= url + ts;
    return (/^https?:\/\//.test(url) || url[0] === "/") ? ts : base + ts;
  };

  Mo.loadAssetImage = (key,src,cb,ecb) => {
    let img = new Image();
    img.onerror = ecb;
    img.onload = () => cb(key,img);
    img.src = Mo.assetUrl(Mo.options.imagePath,src);
    return Mo;
  };

  Mo.audioMimeTypes = {mp3: "audio/mpeg",
                       m4a: "audio/m4a",
                       wav: "audio/wav",
                       ogg: 'audio/ogg; codecs="vorbis"'};

  Mo._audioAssetExtension = () => {
    if(!Mo._audioAssetPreferredExtension) {
      let snd = new Audio();
      Mo._audioAssetPreferredExtension = _.find(Mo.options.audioSupported,
        (ext) => { return snd.canPlayType(Mo.audioMimeTypes[ext]) ? ext: null; });
    }
    return Mo._audioAssetPreferredExtension;
  };

  Mo.loadAssetAudio = function(key,src,cb,ecb) {
    let ext= Mo._audioAssetExtension();
    if(!Mo.options.sound ||
       !ext||
       !document.createElement("audio").play) { cb(key); }
    else {
      let snd=new Audio();
      snd.addEventListener("error",ecb);
      // don't wait for canplaythrough on mobile
      if(!Mo.touchDevice)
        snd.addEventListener('canplaythrough', () => cb(key,snd));
      snd.src =  Mo.assetUrl(Mo.options.audioPath, _.basename(src)+"."+ ext);
      snd.load();
    }

    return Mo;
  };

  Mo.loadAssetWebAudio = function(key,src,cb,ecb) {
    let ajax = new XMLHttpRequest(),
        base= _.basename(src),
        ext= Mo._audioAssetExtension();
    ajax.open("GET", Mo.assetUrl(Mo.options.audioPath,base+"."+ext), true);
    ajax.responseType = "arraybuffer";
    ajax.onload = () => { Mo.audioContext.decodeAudioData(ajax.response, (b) => { cb(key,b); }, ecb); };
    ajax.send();
    return Mo;
  };

  Mo.loadAssetOther = function(key,src,cb,ecb) {
    let parts = src.split("."),
        ext = parts[parts.length-1].toLowerCase();
    let ajax = new XMLHttpRequest();
    if(document.location.origin === "null" ||
       document.location.origin === "file://") {
      if(!Mo.fileURLAlert) {
        Mo.fileURLAlert = true;
        alert("Error: Loading assets is not supported from file:// urls!");
      }
      return ecb();
    }
    ajax.onreadystatechange = function() {
      if(ajax.readyState === 4)
        (ajax.status !== 200) ? ecb() : cb(key, (ext !== "json") ? ajax.responseText : JSON.parse(ajax.responseText));
    };
    ajax.open("GET", Mo.assetUrl(Mo.options.dataPath,src), true);
    ajax.send(null);
    return Mo;
  };

  Mo.assets = {};
  Mo.asset = (name) => { return Mo.assets[name]; };
  Mo.load = function(assets,cb,options) {
    let pcb = options && options.progressCb;
    let bad = options && options.errorCb;
    let assetObj = {};
    let errors = 0;
    let ecb = (a) => {
      ++errors;
      (bad || ((a) => {throw "Error Loading: "+a;}))(a); };

    _.doseq(_.seq(assets), (a) => {
      _.isObject(a) ? _.inject(assetObj,a) : (assetObj[a] = a);
    });

    let sum = _.keys(assetObj).length;
    let more=sum;
    let loaded = (key,obj,force) => {
      if(errors < 1) {
        if(!Mo.assets[key]||force) {
          Mo.assets[key] = obj;
          --more;
          if(pcb) pcb(sum - more, sum);
        }
        if(more === 0 && cb) { cb.apply(Mo); }
      }
    };
    //start to load
    _.doseq(assetObj, (a,key) => {
      let type = Mo.assetType(a);
      Mo.assets[key] ?
        loaded(key,Mo.assets[key],true)
        :
        Mo["loadAsset" + type](key,a,loaded,() => { ecb(a); });
    });

    return Mo;
  };

  Mo.preloads = [];
  Mo.preload = (arg,options) => {
    if(!_.isFunction(arg)) {
      Mo.preloads = Mo.preloads.concat(arg);
    } else {
      Mo.load(_.uniq(Mo.preloads),arg,options);
      Mo.preloads = [];
    }
    return Mo;
  };

  (function() {
    let lastTime = 0;
    let pfx = ["ms", "moz", "webkit", "o"];
    for(let x = 0; x < pfx.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[pfx[x]+"RequestAnimationFrame"];
      window.cancelAnimationFrame =
          window[pfx[x]+"CancelAnimationFrame"] ||
          window[pfx[x]+"CancelRequestAnimationFrame"];
    }
    if(!window.requestAnimationFrame)
      window.requestAnimationFrame = (cb, e) => {
        let cur = _.now();
        let delay = Math.max(0, 16 - (cur - lastTime));
        let id = setTimeout(() => cb(cur+delay), delay);
        lastTime = cur+delay;
        return id;
      };
    if(!window.cancelAnimationFrame)
      window.cancelAnimationFrame = (id) => { clearTimeout(id); };
  })();

  window.Mojo = function(opts) {
    Mo.options = _.inject({imagePath: "images/",
                           dataPath:  "data/",
                           audioPath: "audio/",
                           sound: true,
                           frameTimeLimit: 100,
                           autoFocus: true,
                           audioSupported: ["mp3","ogg"]}, opts || {});
    let ms= [],
        mods= ["Math", "Sprites", "Scenes",
               "Input", "Anim", "2D", "Audio", "Touch", "UI"];
    if (_.isArray(Mo.options.modules) && Mo.options.modules.length > 0) {
      Mo.options.modules.forEach(m => {
        if (_.find(mods, (x) => {return x==m;}))
          ms.push(m);
        else
          throw "Unknown module: `" + m + "`";
      });
    } else {
      ms=mods.slice(0);
    }

    //console.log("Modules: " + ms);
    ms.forEach(k => Mojo[k](Mo));
    Mo.options.modules= ms;

    return Mo;
  };

  window.Mojo._ = _;

  return window.Mojo;

})(this);

