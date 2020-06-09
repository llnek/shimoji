(function(global,undefined){
  "use strict";
  let Mojo = global.Mojo,
      _ = Mojo._, window = global;

  let KEY_NAMES = {
    LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40,

    ZERO: 48, ONE: 49, TWO: 50,
    THREE: 51, FOUR: 52, FIVE: 53,
    SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,

    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
    G: 71, H: 72, I: 73, J: 74, K: 75, L: 76,
    M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82,
    S: 83, T: 84, U: 85, V: 86, W: 87, X: 88,
    Y: 89, Z: 90,

    ENTER: 13, ESC: 27, BACKSPACE: 8, TAB: 9,
    SHIFT: 16, CTRL: 17, ALT: 18, SPACE: 32,

    HOME: 36, END: 35,
    PGGUP: 33, PGDOWN: 34
  };

  let DEFAULT_KEYS = {
    LEFT: "left", RIGHT: "right",
    UP: "up", DOWN: "down",
    Z: "fire", X: "action", P: "P", S: "S",
    ESC: "esc", SPACE: "fire", ENTER: "confirm"
  };

  let TOUCH_CONTROLS = [["left","<" ],
                        ["right",">" ],
                        [],
                        ["action","b"],
                        ["fire", "a" ]];

  let TOUCH_EVENTS= ["touchstart","touchend",
                     "touchmove","touchcancel"];

  // Clockwise from midnight (a la CSS)
  let JOYPAD_INPUTS =  ["up","right","down","left"];

  Mojo.Input = function(Mo) {

    Mo.inputs = _.jsMap();
    Mo.joypad = _.jsObj();

    let _offset;
    let _containerOffset= () => {
      _offset.x = 0;
      _offset.y = 0;
      for(let el=Mo.el;;)
      { _offset.x += el.offsetLeft;
        _offset.y += el.offsetTop;
        if (el=el.offsetParent) {} else break; }
    };

    let delEvent=function(evt,f) {
      Mo.el.removeEventListener(evt,f);
    };

    let subEvent=function(evt,f,arg) {
      if (arg === void 0)
        Mo.el.addEventListener(evt,f);
      else
        Mo.el.addEventListener(evt,f,arg);
    };

    let _canvasToLayerX = (x,layer) => {
      x = x / Mo.cssWidth * Mo.width;
      return layer.viewport ? ((x/layer.viewport.scale)+layer.viewport.x) : x;
    };

    let _canvasToLayerY = (y,layer) => {
      y = y / Mo.cssWidth * Mo.width;
      return layer.viewport ? ((y/layer.viewport.scale)+layer.viewport.y) : y;
    };

    Mo.input = {
      keys: _.jsMap(),
      keypad: _.jsObj(),
      touchEnabled: false,
      joypadEnabled: false,
      keyboardEnabled: false,

      enableKeyboard: function() {
        if(this.keyboardEnabled) return false;
        // Make selectable and remove an :focus outline
        Mo.el.tabIndex = 0;
        Mo.el.style.outline = 0;
        let self=this;
        subEvent("keydown",(e) => {
          let action;
          if(action=self.keys.get(e.keyCode)) {
            Mo.inputs.set(action, true);
            Mo.EventBus.pub(action, self);
            Mo.EventBus.pub("keydown",self,e.keyCode);
          }
          if(!e.ctrlKey && !e.metaKey) e.preventDefault();
        },false);
        subEvent("keyup",(e) => {
          let action;
          if(action=self.keys.get(e.keyCode)) {
            Mo.inputs.set(action, false);
            Mo.EventBus.pub(action+"Up", self);
            Mo.EventBus.pub("keyup",self,e.keyCode);
          }
          e.preventDefault();
        },false);
        Mo.options.autoFocus && Mo.el.focus();
        this.keyboardEnabled = true;
      },
      keyboardControls: function(keys) {
        let self=this;
        _.doseq(keys||DEFAULT_KEYS, (name,key) => {
          self.keys.set(KEY_NAMES[key] || key, name);
        });
        this.enableKeyboard();
      },
      touchLocation: function(touch) {
        let el = Mo.el,
            px = touch.offsetX,
            py = touch.offsetY;
        if(_.isUndef(px) ||
           _.isUndef(py)) {
          px = touch.layerX;
          py = touch.layerY;
        }
        if(_.isUndef(px) ||
           _.isUndef(py)) {
          if(_.isUndef(_offset)) {
            _offset= _.p2();
            _containerOffset();
          }
          px = touch.pageX - _offset.x;
          py = touch.pageY - _offset.y;
        }
        return _.p2(Mo.width * px / Mo.cssWidth,
                    Mo.height * py / Mo.cssHeight);
      },
      touchControls: function(opts) {
        if(!Mo.hasTouch() ||
           this.touchEnabled) { return false; }
        opts = _.inject({
          left: 0,
          gutter:10,
          width: Mo.width,
          bottom: Mo.height,
          fullHeight: false,
          controls: TOUCH_CONTROLS
        },opts);
        opts.unit = (opts.width / opts.controls.length);
        opts.size = opts.unit - (opts.gutter * 2);
        this.keypad=opts;

        let self=this;
        let getKey= (touch) => {
          let pos = self.touchLocation(touch),
              mx,my = opts.bottom - opts.unit;
          for(let i=0,len=opts.controls.length;i<len;++i) {
            mx = i * opts.unit + opts.gutter;
            if(pos.x >= mx &&
               pos.x <= (mx+opts.size) &&
               (opts.fullHeight ||
                (pos.y >= my+opts.gutter &&
                 pos.y <= (my+opts.unit-opts.gutter)))) {
              return opts.controls[i][0];
            }
          }
        }
        Mo.input.touchDispatchHandler = (event) => {
          let touches = event.touches ? event.touches : [event];
          let wasOn = {}, tch, key, action;
          // Reset all the actions bound to controls
          // but keep track of all the actions that were on
          for(let i=0,z=opts.controls.length;i<z;++i) {
            action= opts.controls[i][0];
            if(Mo.inputs.has(action)) { wasOn[action] = true; }
            Mo.inputs.set(action,false);
          }
          for(let i=0,z=touches.length;i<z;++i) {
            tch = touches[i];
            if(key = getKey(tch)) {
              Mo.inputs.set(key, true);
              if(wasOn[key])
                delete wasOn[key];
              else
                Mo.EventBus.pub(key, self);
            }
          }
          // Any remaining were on the last frame
          // and need to send an up action
          for(action in wasOn)
            Mo.EventBus.pub(action+"Up", self);
          event.preventDefault();
        };
        _.doseq(TOUCH_EVENTS, (evt) => {
          subEvent(evt, Mo.input.touchDispatchHandler);
        });
        this.touchEnabled = true;
      },
      disableTouchControls: function() {
        _.doseq(TOUCH_EVENTS,(evt) => {
          delEvent(evt,Mo.input.touchDispatchHandler);
        });
        delEvent("touchstart",this.joypadStart);
        delEvent("touchmove",this.joypadMove);
        delEvent("touchend",this.joypadEnd);
        delEvent("touchcancel",this.joypadEnd);
        this.touchEnabled = false;
        // clear existing inputs
        Mo.inputs.forEach((v,k) => {
          Mo.inputs.set(k,false);
        });
      },
      joypadControls: function(opts) {
        if(!_.hasTouch() ||
           this.joypadEnabled) { return false; }
        let self=this,
            joypad = _.patch(opts || {},{
          size: 50,
          trigger: 20,
          center: 25,
          color: "#CCC",
          background: "#000",
          alpha: 0.5,
          zone: Mo.width / 2,
          joypadTouch: null,
          triggers: [],
          inputs: JOYPAD_INPUTS
        });

        Mo.joypad=joypad;

        this.joypadStart = (evt) => {
          if(joypad.joypadTouch === null) {
            let touch = evt.changedTouches[0],
                loc = self.touchLocation(touch);
            if(loc.x < joypad.zone) {
              joypad.joypadTouch = touch.identifier;
              joypad.centerX = loc.x;
              joypad.centerY = loc.y;
              joypad.x = null;
              joypad.y = null;
            }
          }
        };
        this.joypadMove = (e) => {
          if(joypad.joypadTouch !== null) {
            let evt = e;
            for(let i=0,z=evt.changedTouches.length;i<z;++i) {
              let touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                let loc = self.touchLocation(touch),
                    dx = loc.x - joypad.centerX,
                    dy = loc.y - joypad.centerY,
                    dist = Math.sqrt(dx * dx + dy * dy),
                    overage = Math.max(1,dist / joypad.size),
                    ang =  Math.atan2(dx,dy);
                if(overage > 1) {
                  dx /= overage;
                  dy /= overage;
                  dist /= overage;
                }
                let triggers = [
                  dy < -joypad.trigger,
                  dx > joypad.trigger,
                  dy > joypad.trigger,
                  dx < -joypad.trigger
                ];
                for(let k=0;k<triggers.length;++k) {
                  let action= joypad.inputs[k];
                  if(triggers[k]) {
                    Mo.inputs.set(action,true);
                    if(!joypad.triggers[k])
                      Mo.EventBus.pub(action, Mo.input);
                  } else {
                    Mo.inputs.set(action,false);
                    if(joypad.triggers[k])
                      Mo.EventBus.pub(action+"Up", Mo.input);
                  }
                }
                _.inject(joypad, {
                  dx: dx, dy: dy,
                  x: joypad.centerX + dx,
                  y: joypad.centerY + dy,
                  dist: dist,
                  ang: ang,
                  triggers: triggers
                });
                break;
              }
            }
          }
          e.preventDefault();
        };

        this.joypadEnd = (e) => {
          let evt = e;
          if(joypad.joypadTouch !== null) {
            for(let i=0,z=evt.changedTouches.length;i<z;++i) {
              let touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                for(let k=0;k<joypad.triggers.length;++k) {
                  let action= joypad.inputs[k];
                  Mo.inputs.set(action,false);
                  if(joypad.triggers[k])
                    Mo.EventBus.pub(action+"Up", Mo.input);
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
        };

        subEvent("touchstart",this.joypadStart);
        subEvent("touchmove",this.joypadMove);
        subEvent("touchend",this.joypadEnd);
        subEvent("touchcancel",this.joypadEnd);

        this.joypadEnabled = true;
      },

      mouseControls: function(options) {
        options = options || {};
        let layerNum = options.layerNum || 0;
        let mouseInputX = options.mouseX || "mouseX";
        let mouseInputY = options.mouseY || "mouseY";
        let cursor = options.cursor || "off";
        let self=this;
        let mouseMoveObj = _.jsObj();
        if(cursor !== "on")
          Mo.el.style.cursor = (cursor === "off") ? "none" : cursor;

        Mo.inputs.set(mouseInputX, 0);
        Mo.inputs.set(mouseInputY, 0);

        this._mouseMove = function(e) {
          e.preventDefault();
          let touch = e.touches ? e.touches[0] : e;
          let el = Mo.el,
            rect = el.getBoundingClientRect(),
            style = window.getComputedStyle(el),
            px = touch.clientX - rect.left - parseInt(style.paddingLeft),
            py = touch.clientY - rect.top  - parseInt(style.paddingTop);
          let layer = Mo.layer(layerNum);
          if(_.isUndef(px) ||
             _.isUndef(py)) {
            px = touch.offsetX;
            py = touch.offsetY;
          }
          if(_.isUndef(px) ||
             _.isUndef(py)) {
            px = touch.layerX;
            py = touch.layerY;
          }
          if(_.isUndef(px) ||
             _.isUndef(py)) {
            if(_.isUndef(_offset)) {
              _offset= _.p2();
              _containerOffset();
            }
            px = touch.pageX - _offset.x;
            py = touch.pageY - _offset.y;
          }
          if(layer) {
            mouseMoveObj.x= _canvasToLayerX(px,layer);
            mouseMoveObj.y= _canvasToLayerY(py,layer);
            Mo.inputs.set(mouseInputX, mouseMoveObj.x);
            Mo.inputs.set(mouseInputY, mouseMoveObj.y);
            Mo.EventBus.pub("mouseMove",self,mouseMoveObj);
          }
        };
        this._mouseWheel = (e) => {
          // http://www.sitepoint.com/html5-javascript-mouse-wheel/
          // cross-browser wheel delta
          e = window.event || e; // old IE support
          let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          Mo.EventBus.pub("mouseWheel", self,delta);
        };
        subEvent("mousemove",this._mouseMove,true);
        subEvent("touchstart",this._mouseMove,true);
        subEvent("touchmove",this._mouseMove,true);
        subEvent("mousewheel",this._mouseWheel,true);
        subEvent("DOMMouseScroll",this._mouseWheel,true);
      },
      disableMouseControls: function() {
        if(this._mouseMove) {
          delEvent("mousemove",this._mouseMove, true);
          delEvent("mousewheel",this._mouseWheel, true);
          delEvent("DOMMouseScroll",this._mouseWheel, true);
          Mo.el.style.cursor = "inherit";
          this._mouseMove = null;
        }
      },
      drawButtons: function() {
        let ctx = Mo.ctx,
            keypad = this.keypad;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i=0;i<keypad.controls.length;++i) {
          let control = keypad.controls[i];
          if(control[0]) {
            ctx.font = "bold " + (keypad.size/2) + "px arial";
            let x = keypad.left + i * keypad.unit + keypad.gutter,
                y = keypad.bottom - keypad.unit,
                key = Mo.inputs.get(control[0]);

            ctx.fillStyle = keypad.color || "#FFFFFF";
            ctx.globalAlpha = key ? 1.0 : 0.5;
            ctx.fillRect(x,y,keypad.size,keypad.size);

            ctx.fillStyle = keypad.text || "#000000";
            ctx.fillText(control[1],
                         x+keypad.size/2,
                         y+keypad.size/2);
          }
        }
        ctx.restore();
      },
      drawCircle: function(x,y,color,size) {
        let ctx = Mo.ctx,
            joypad = Mo.joypad;

        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha=joypad.alpha;
        ctx.fillStyle = color;
        ctx.arc(x, y, size, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      },

      drawJoypad: function() {
        let joypad = Mo.joypad;
        if(joypad.joypadTouch !== null) {
          this.drawCircle(joypad.centerX,
                          joypad.centerY,
                          joypad.background,
                          joypad.size);
          if(joypad.x !== null) {
            this.drawCircle(joypad.x,
                            joypad.y,
                            joypad.color,
                            joypad.center);
          }
        }
      },
      drawCanvas: function() {
        if(this.touchEnabled) this.drawButtons();
        if(this.joypadEnabled) this.drawJoypad();
      }
    };

    Mo.controls = function(joypad) {
      Mo.input.keyboardControls();
      if(joypad) {
        Mo.input.touchControls({
          controls: [ [],[],[],["action","b"],["fire","a"]]
        });
        Mo.input.joypadControls();
      } else {
        Mo.input.touchControls();
      }
      return Mo;
    };

    Mo.component("platformerControls", {
      defaults: {
        speed: 200,
        jumpSpeed: -300,
        collisions: []
      },
      added: function() {
        let p = this.entity.p;
        _.patch(p,this.defaults);

        Mo.EventBus.sub("step",this.entity,"step",this);
        Mo.EventBus.sub("bump.bottom",this.entity,"landed",this);

        p.landed = 0;
        p.direction ='right';
      },

      landed: function(col) {
        let p = this.entity.p;
        p.landed = 1/5;
      },

      step: function(dt) {
        let p = this.entity.p;

        if(p.ignoreControls === void 0 || !p.ignoreControls) {
          let collision = null;
          // Follow along the current slope, if possible.
          if(p.collisions !== void 0 &&
             p.collisions.length > 0 &&
             (Mo.inputs.has("left") ||
              Mo.inputs.has("right") || p.landed > 0)) {
            if(p.collisions.length === 1) {
              collision = p.collisions[0];
            } else {
              // If there's more than one possible slope, follow slope with negative Y normal
              collision = null;
              for(let i = 0; i < p.collisions.length; ++i) {
                if(p.collisions[i].normalY < 0)
                collision = p.collisions[i];
              }
            }
            // Don't climb up walls.
            if(collision !== null &&
               collision.normalY > -0.3 &&
               collision.normalY < 0.3) {
              collision = null;
            }
          }

          if(Mo.inputs.has("left")) {
            p.direction = "left";
            if(collision && p.landed > 0) {
              p.vx = p.speed * collision.normalY;
              p.vy = -p.speed * collision.normalX;
            } else {
              p.vx = -p.speed;
            }
          } else if(Mo.inputs.has("right")) {
            p.direction = "right";
            if(collision && p.landed > 0) {
              p.vx = -p.speed * collision.normalY;
              p.vy = p.speed * collision.normalX;
            } else {
              p.vx = p.speed;
            }
          } else {
            p.vx = 0;
            if(collision && p.landed > 0)
            p.vy = 0;
          }

          if(p.landed > 0 &&
             (Mo.inputs.has("up") ||
              Mo.inputs.has("action")) && !p.jumping) {
            p.vy = p.jumpSpeed;
            p.landed = -dt;
            p.jumping = true;
          } else if(Mo.inputs.has("up") ||
                    Mo.inputs.has("action")) {
            Mo.EventBus.pub("jump", this.entity,this.entity);
            p.jumping = true;
          }

          if(p.jumping && !(Mo.inputs.has("up") ||
                            Mo.inputs.has("action"))) {
            p.jumping = false;
            Mo.EventBus.pub("jumped", this.entity,this.entity);
            if(p.vy < p.jumpSpeed / 3) {
              p.vy = p.jumpSpeed / 3;
            }
          }
        }
        p.landed -= dt;
      }
    });

    Mo.component("stepControls", {
      added: function() {
        let p = this.entity.p;
        if(!p.stepDistance) p.stepDistance = 32;
        if(!p.stepDelay) p.stepDelay = 0.2;
        p.stepWait = 0;
        Mo.EventBus.sub("step",this.entity,"step",this);
        Mo.EventBus.sub("hit", this.entity,"collision",this);
      },
      collision: function(col) {
        let p = this.entity.p;
        if(p.stepping) {
          p.stepping = false;
          p.x = p.origX;
          p.y = p.origY;
        }
      },
      step: function(dt) {
        let p = this.entity.p,
            moved = false;
        p.stepWait -= dt;

        if(p.stepping) {
          p.x += p.diffX * dt / p.stepDelay;
          p.y += p.diffY * dt / p.stepDelay;
        }

        if(p.stepWait > 0) { return; }

        if(p.stepping) {
          p.x = p.destX;
          p.y = p.destY;
        }

        p.stepping = false;
        p.diffX = 0;
        p.diffY = 0;

        if(Mo.inputs.has("left")) {
          p.diffX = -p.stepDistance;
        } else if(Mo.inputs.has("right")) {
          p.diffX = p.stepDistance;
        }

        if(Mo.inputs.has("up")) {
          p.diffY = -p.stepDistance;
        } else if(Mo.inputs.has("down")) {
          p.diffY = p.stepDistance;
        }

        if(p.diffY || p.diffX ) {
          p.stepping = true;
          p.origX = p.x;
          p.origY = p.y;
          p.destX = p.x + p.diffX;
          p.destY = p.y + p.diffY;
          p.stepWait = p.stepDelay;
        }
      }
    });
  };

})(this);

