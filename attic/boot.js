(function(global, undefined) {
  "use strict";

  if(global.document===undefined ||
      global.document.body===undefined)
    throw "Invalid environment, cannot run Mojo!";

  const ARRAY=Array.prototype,
        OBJECT=Object.prototype,
        slicer= ARRAY.slice,
        tostr=OBJECT.toString,
        window=global,
        document=global.document;

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
      return isMap(obj) ? Array.from(obj.keys()) : (isObject(obj) ? Object.keys(obj) : []);
    },
    assert: (cond) => {
      if(cond)
      {}
      else
        throw new Error(slicer.call(arguments,1).join(""));
    },
    jsMap: () => { return new Map(); },
    jsObj: () => { return {}; },
    floor: (v) => { return Math.floor(v); },
    slice: (a,i) => { return slicer.call(a, i); },
    now: () => { return Date.now(); },
    nextID: () => { return ++seqNum; },
    fileNoExt: (name) => { return name.replace(/\.(\w{3,4})$/,""); },
    fileExt: (name) => {
      let p= name.split(".");
      return p[p.length-1].toLowerCase();
    },
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
          if(OBJECT.hasOwnProperty.call(obj, k))
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
          if(OBJECT.hasOwnProperty.call(obj, k))
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
          if(OBJECT.hasOwnProperty.call(obj, k))
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
          if(OBJECT.hasOwnProperty.call(obj,k))
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
    seq: (arg,sep=",") => {
      if(typeof arg === "string")
        arg = arg.replace(/\s+/g,'').split(sep);
      if(!isArray(arg)) arg = [arg];
      return arg;
    },
    is: {
      str: (obj) => { return typeof obj === "string"; },
      num: (obj) => { return tostr.call(obj) === "[object Number]"; },
      fun: (obj) => { return tostr.call(obj) === "[object Function]"; },
      obj: isObject,
      map: isMap,
      vec: isArray,
      void0: (obj) => { return obj === void 0; },
      undef: (obj) => { return obj === undefined; }
    },
    has: (obj,key) => {
      return isMap(obj) ? obj.has(key) : OBJECT.hasOwnProperty.call(obj, key);
    },
    patch: (des,src) => {
      des=des || {};
      if(src)
        for(let k in src)
          if(OBJECT.hasOwnProperty.call(src,k) &&
             des[k] === void 0)
            des[k] = src[k];
      return des;
    },
    clone: (obj) => { return Object.assign({},obj); },
    inject: function(des) {
      let args=slicer.call(arguments,1);
      des=des || {};
      args.forEach(s => { if(s) Object.assign(des,s); });
      return des;
    }
  }, is=_.is;

  //assets
  let AssetTypes= {tmx: "TMX", png: "Image", xml: "Xml", json: "Json",
                   jpg: "Image", gif: "Image", jpeg: "Image",
                   ogg: "Audio", wav: "Audio", m4a: "Audio", mp3: "Audio"};
  let AudioMimeTypes = {mp3: "audio/mpeg",
                        m4a: "audio/m4a",
                        wav: "audio/wav",
                        ogg: 'audio/ogg; codecs="vorbis"'};
  let _audioDftExt;
  let _preloads= [];
  let _audioExt= (choices) => {
    if(!_audioDftExt)
    { let snd = new Audio();
      _audioDftExt= _.some(choices,
        (ext) => {return snd.canPlayType(AudioMimeTypes[ext]) ? ext: null;}); }
    return _audioDftExt;
  };
  let _assetUrl = (base,url,devMode) => {
    let ts = "";
    if(devMode)
      ts = (/\?/.test(url) ? "&" : "?") + "_t=" + _.now();
    ts= url + ts;
    return (/^https?:\/\//.test(url) || url[0] === "/") ? ts : base + ts;
  };


  let Mo=function(selector) {
    return Mo.pin.apply(this,arguments);
  };

  Mo.pin= function() {};
  Mo.components= {};
  Mo.loaders= {};
  Mo.assets= {};
  Mo.touchDevice= !!("ontouchstart" in document);

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
        container=container || Mo;
        container[className] = TemplateFn;
        //console.log("Adding class " + className + " to Mo.");
        TemplateFn.prototype.className = className;
        TemplateFn.className = className;
      }
      return TemplateFn;
    };
  })();

  Mo.defType = (clazz, props, container) => {
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

  Mo.scheduleFrame = (cb) => { return window.requestAnimationFrame(cb); };
  Mo.cancelFrame = (id) => { window.cancelAnimationFrame(id); };

  Mo.v2 = (x,y) => { return [x||0,y||0]; };
  Mo.p2 = (px,py) => { return {x: px||0,y: py||0}; };

  Mo.hasTouch= () => { return Mo.touchDevice;};

  let _loopFrame = 0;
  let _lastFrame=0;
  Mo.gameLoop = function(action) {
    _lastFrame = _.now();
    _loopFrame = 0;
    Mo.loop = true;
    Mo.gameLoopCallbackWrapper = () => {
      let now = _.now();
      ++_loopFrame;
      Mo.loop = Mo.scheduleFrame(Mo.gameLoopCallbackWrapper);
      let dt = now - _lastFrame;
      /* Prevent fast-forwarding by limiting the length of a single frame. */
      if(dt > Mo.options.frameTimeLimit)
        dt = Mo.options.frameTimeLimit;
      action.call(Mo, dt / 1000);
      _lastFrame = now;
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
      _lastFrame = _.now();
      Mo.loop = Mo.scheduleFrame(Mo.gameLoopCallbackWrapper);
    }
  };

  Mo.EventBus= {
    tree: _.jsMap(),
    sub: function(event,target,cb,ctx) {
      if(is.vec(event)) {
        event.forEach(e => this.sub(e,target,cb,ctx));
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
    },
    pub: function(event,target,data) {
      let m= this.tree.get(target);
      if(m)
        m= m.get(event);
      if(m)
        m.forEach(s => s[0].call(s[1],data));
    },
    unsub: function(event,target,cb,ctx) {
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

  Mo.defType("Component", {
    // Components are created when they are added onto a `Mo.Entity` entity.
    // The entity is directly extended with any methods inside
    // of an `____entity` property and then the
    // component itself is added onto the entity as well.
    init: function(entity) {
      if(this.____entity)
        _.inject(entity,this.____entity);
      entity[this.name] = this;
      entity.features.push(this.componentName);

      entity.layer &&
        entity.layer.addRelation(this.componentName,entity);

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
        this.entity.layer &&
          this.entity.layer.delRelation(this.componentName,this.entity);
      }
      //this.debind();
      this.disposed && this.disposed();
    }
  });

  Mo.defType("Entity", {
    has: function(co) { return _.has(this,co); },
    add: function(components) {
      this.features= this.features || [];
      _.seq(components).forEach(name => {
        let C = Mo.components[name];
        if(C && !_.has(this,name))
          Mo.EventBus.pub("addComponent", this, new C(this));
      });
      return this;
    },
    del: function(components) {
      _.seq(components).forEach(name => {
        if(this[name]) {
          Mo.EventBus.pub("delComponent",this,this[name]);
          this[name].dispose();
        }
      });
      return this;
    },
    dispose: function() {
      if(this.isDead) { return; }
      Mo.EventBus.pub("disposed",this);
      //this.debind();
      this.layer &&
        this.layer.remove(this);
      this.isDead = true;
      this.disposed && this.disposed();
    }
  });

  Mo.component = function(name,methods) {
    if(!methods)
      return Mo.components[name];
    methods.name = name;
    methods.componentName = "." + name;
    let c= Mo.defType(["Co"+name, Mo.Component], methods);
    Mo.components[name] = c;
    return c;
  };

  Mo.defType("GameState", {
    init: function(p) {
      //this.listeners = {};
      this.p = _.clone(p);
    },
    reset: function(p) {
      this.init(p);
      Mo.EventBus.pub("reset",this);
    },
    _triggerProperty: function(value,key) {
      if(this.p[key] !== value) {
        this.p[key] = value;
        Mo.EventBus.pub("change." + key,this,value);
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
      Mo.EventBus.pub("change",this);
    },
    inc: function(prop,amount) {
      this.set(prop,this.get(prop) + amount);
    },
    dec: function(prop,amount) {
      this.set(prop,this.get(prop) - amount);
    }
  });

  Mo.state = new Mo.GameState();

  Mo.prologue = function(id, options) {
    if(is.obj(id)) {
      options = id;
      id = null;
    }
    options = options || {};
    id = id || "mojo";

    Mo.el = is.str(id) ? document.getElementById(id) : id;
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
        elParent = Mo.el.parentNode,
        resampleWidth = options.resampleWidth,
        resampleHeight = options.resampleHeight,
        upsampleWidth = options.upsampleWidth,
        upsampleHeight = options.upsampleHeight,
        maxWidth = options.maxWidth || 5000,
        maxHeight = options.maxHeight || 5000;

    if(options.maximize === true ||
       (Mo.touchDevice && options.maximize === "touch"))  {
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
    else
    if(Mo.touchDevice &&
       ((resampleWidth && w > resampleWidth) ||
        (resampleHeight && h > resampleHeight))) {
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
      Mo.wrapper.id = Mo.el.id + "_container";
      Mo.wrapper.style.width = w + "px";
      Mo.wrapper.style.margin = "0 auto";
      Mo.wrapper.style.position = "relative";
      elParent.insertBefore(Mo.wrapper,Mo.el);
      Mo.wrapper.appendChild(Mo.el);
    }

    Mo.el.style.position = "relative";
    Mo.ctx = Mo.el.getContext("2d");
    Mo.width = parseInt(Mo.el.width);
    Mo.height = parseInt(Mo.el.height);
    Mo.cssWidth = w;
    Mo.cssHeight = h;

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
        Mo.el.style.top = topPos+"px";
      }
    }

    window.addEventListener("orientationchange", () => {
      setTimeout(() => window.scrollTo(0,1), 0);
    });

    return Mo;
  };

  // a 4 pointed box, left right bottom top
  // x2 > x1 , y2 > y1
  Mo.bbox4 = () => {
    return {x1: NaN, x2: NaN, y1: NaN, y2: NaN};
  };

  Mo.clear = () => {
    if(Mo.ctx) {
      if(Mo.clearColor) {
        Mo.ctx.globalAlpha = 1;
        Mo.ctx.fillStyle = Mo.clearColor;
        Mo.ctx.fillRect(0,0,Mo.width,Mo.height);
      } else {
        Mo.ctx.clearRect(0,0,Mo.width,Mo.height);
      }
    }
    return Mo;
  };

  Mo.setImageSmoothing = (ok) => {
    Mo.ctx.mozImageSmoothingEnabled = ok;
    Mo.ctx.webkitImageSmoothingEnabled = ok;
    Mo.ctx.msImageSmoothingEnabled = ok;
    Mo.ctx.imageSmoothingEnabled = ok;
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

  Mo.assetType = (url) => {
    let ext = _.fileExt(url);
    let type = ext ? AssetTypes[ext] : "";
    if(type === "Audio" &&
       Mo.audio &&
       Mo.audio.type === "WebAudio") { type = "WebAudio"; }
    return type || "Other";
  };

  Mo.loaders.Image = (key,path,cb,ecb) => {
    let img = new Image();
    img.onerror = ecb;
    img.onload = () => cb(key,img);
    img.src = _assetUrl(Mo.options.imagePath, path, Mo.options.devMode);
    return Mo;
  };

  Mo.loaders.Audio = function(key,path,cb,ecb) {
    let dev=Mo.options.devMode,
        ext= _audioExt(Mo.options.audioFiles);
    if(!Mo.options.sound ||
       !ext||
       !document.createElement("audio").play) {
      cb(key);
    } else {
      let snd=new Audio();
      snd.addEventListener("error",ecb);
      // don't wait for canplaythrough on mobile
      if(!Mo.touchDevice)
        snd.addEventListener("canplaythrough", () => cb(key,snd));
      snd.src = _assetUrl(Mo.options.audioPath, _.fileNoExt(path)+"."+ ext, dev);
      snd.load();
    }

    return Mo;
  };

  Mo.loaders.WebAudio = function(key,path,cb,ecb) {
    let ajax = new XMLHttpRequest(),
        base= _.fileNoExt(path),
        dev= Mo.options.devMode,
        ext= _audioExt(Mo.options.audioFiles);
    ajax.open("GET", _assetUrl(Mo.options.audioPath,base+"."+ext,dev), true);
    ajax.responseType = "arraybuffer";
    ajax.onload = () => {
      Mo.audioContext.decodeAudioData(ajax.response, (b) => { cb(key,b); }, ecb);
    };
    ajax.send();
    return Mo;
  };

  Mo.ajax = function(key,path,cb,ecb) {
    let dev=Mo.options.devMode,
        ajax = new XMLHttpRequest();
    if(document.location.origin === "null" ||
       document.location.origin === "file://") {
      if(!Mo.fileURLAlert) {
        Mo.fileURLAlert = true;
        alert("Error: Loading assets is not supported from file:// urls!");
      }
      return ecb();
    }
    ajax.onreadystatechange = () => {
      if(ajax.readyState === 4)
        (ajax.status !== 200) ? ecb() : cb(key, ajax.responseText);
    };
    ajax.open("GET", _assetUrl(Mo.options.dataPath,path,dev), true);
    ajax.send(null);
    return Mo;
  };

  Mo.loaders.Other = function(key,path,cb,ecb) {
    Mo.ajax(key,path,cb,ecb);
    return Mo;
  };

  Mo.loaders.Json = function(key,path,cb,ecb) {
    Mo.ajax(key,path,(key,data) => { cb(key,JSON.parse(data)); }, ecb);
    return Mo;
  };

  Mo.loaders.Xml = function(key,path,cb,ecb) {
    Mo.ajax(key,path,(key,data) => {
      cb(key,new DOMParser().parseFromString(data, "application/xml")); },ecb);
    return Mo;
  };

  Mo.asset= (name,panic) => {
    let r=Mo.assets[name];
    if(panic && !r)
      throw "Unknown Asset:" + name;
    return r;
  };

  Mo.load= function(assets,cb,options) {
    let pcb = options && options.progressCb;
    let bad = options && options.errorCb;
    let assetObj = {};
    let errors = 0;
    let ecb = (a) => {
      ++errors;
      (bad || ((a) => {throw "Error Loading: "+a;}))(a); };

    _.doseq(_.seq(assets), (a) => {
      if(is.obj(a))
        _.inject(assetObj,a);
      else if(a.length > 0) assetObj[a] = a;
    });

    let sum = _.keys(assetObj).length;
    let more=sum;
    let loaded = (key,obj,force) => {
      if(errors < 1) {
        if(!Mo.assets[key]||force) {
          Mo.assets[key] = obj;
          --more;
          if(pcb)
            pcb(sum - more, sum);
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
        Mo.loaders[type](key,a,loaded,() => { ecb(a); });
    });

    return Mo;
  };

  Mo.preload = (arg,options) => {
    if(!is.fun(arg))
      _preloads = _preloads.concat(arg);
    else {
      Mo.load(_.uniq(_preloads),arg,options);
      _preloads = [];
    }
    return Mo;
  };

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
        let id = setTimeout(() => cb(cur+delay), delay);
        lastTime = cur+delay;
        return id;
      };
    }
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
                           audioFiles: ["mp3","ogg"]}, opts);

    let aux=["TMX"];

    ["Math", "Sprite", "Scene", "2D",
     "Anim", "Input", "Audio", "Touch", "UI"].forEach(k => Mojo[k](Mo));

    _.seq(Mo.options.modules || []).forEach(m => Mojo[m](Mo));

    return Mo;
  };

  window.Mojo._ = _;

  return window.Mojo;

})(this);


