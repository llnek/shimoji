(function(global){
  "use strict";
  let Mojo = global.Mojo, _ = Mojo._, window = global;
  Mojo.Input = function(Mo) {

    let KEY_NAMES = Mo.KEY_NAMES = {
      LEFT: 37, RIGHT: 39,
      UP: 38, DOWN: 40,

      ZERO : 48, ONE : 49, TWO : 50,
      THREE : 51, FOUR : 52, FIVE : 53,
      SIX : 54, SEVEN : 55, EIGHT : 56,
      NINE : 57,

      A : 65, B : 66, C : 67,
      D : 68, E : 69, F : 70,
      G : 71, H : 72, I : 73,
      J : 74, K : 75, L : 76,
      M : 77, N : 78, O : 79,
      P : 80, Q : 81, R : 82,
      S : 83, T : 84, U : 85,
      V : 86, W : 87, X : 88,
      Y : 89, Z : 90,

      ENTER: 13,
      ESC: 27,
      BACKSPACE : 8,
      TAB : 9,
      SHIFT : 16,
      CTRL : 17,
      ALT : 18,
      SPACE: 32,

      HOME : 36, END : 35,
      PGGUP : 33, PGDOWN : 34
    };

    let DEFAULT_KEYS = {
      LEFT: 'left', RIGHT: 'right',
      UP: 'up',     DOWN: 'down',
      SPACE: 'fire',
      Z: 'fire',
      X: 'action',
      ENTER: 'confirm',
      ESC: 'esc',
      P: 'P',
      S: 'S'
    };

    let DEFAULT_TOUCH_CONTROLS  = [ ['left','<' ],
                              ['right','>' ],
                              [],
                              ['action','b'],
                              ['fire', 'a' ]];

    // Clockwise from midnight (a la CSS)
    let DEFAULT_JOYPAD_INPUTS =  [ 'up','right','down','left'];

    Mo.inputs = {};
    Mo.joypad = {};

    let hasTouch =  !!("ontouchstart" in window);

    Mo.canvasToStageX = (x,stage) => {
      x = x / Mo.cssWidth * Mo.width;
      if(stage.viewport) {
        x /= stage.viewport.scale;
        x += stage.viewport.x;
      }
      return x;
    };

    Mo.canvasToStageY = (y,stage) => {
      y = y / Mo.cssWidth * Mo.width;
      if(stage.viewport) {
        y /= stage.viewport.scale;
        y += stage.viewport.y;
      }
      return y;
    };

    Mo.defType("InputSystem", {
      keys: {},
      keypad: {},
      keyboardEnabled: false,
      touchEnabled: false,
      joypadEnabled: false,

      bindKey: (key,name) => { Mo.input.keys[KEY_NAMES[key] || key] = name; },

      enableKeyboard: function() {
        if(this.keyboardEnabled) return false;

        // Make selectable and remove an :focus outline
        Mo.el.tabIndex = 0;
        Mo.el.style.outline = 0;

        Mo.el.addEventListener("keydown",function(e) {
          if(Mo.input.keys[e.keyCode]) {
            let actionName = Mo.input.keys[e.keyCode];
            Mo.inputs[actionName] = true;
            Mo.EventBus.pub(actionName, Mo.input);
            Mo.EventBus.pub("keydown",Mo.input,e.keyCode);
          }
          if(!e.ctrlKey &&
             !e.metaKey)
            e.preventDefault();
        },false);

        Mo.el.addEventListener("keyup",function(e) {
          if(Mo.input.keys[e.keyCode]) {
            let actionName = Mo.input.keys[e.keyCode];
            Mo.inputs[actionName] = false;
            Mo.EventBus.pub(actionName + "Up", Mo.input);
            Mo.EventBus.pub("keyup",Mo.input,e.keyCode);
          }
          e.preventDefault();
        },false);

        if(Mo.options.autoFocus) {  Mo.el.focus(); }
        this.keyboardEnabled = true;
      },

      keyboardControls: function(keys) {
        keys = keys || DEFAULT_KEYS;
        _.doseq(keys,function(name,key) {
         this.bindKey(key,name);
        },Mo.input);
        this.enableKeyboard();
      },

      _containerOffset: function() {
        Mo.input.offsetX = 0;
        Mo.input.offsetY = 0;
        let el = Mo.el;
        do {
          Mo.input.offsetX += el.offsetLeft;
          Mo.input.offsetY += el.offsetTop;
        } while(el = el.offsetParent);
      },

      touchLocation: function(touch) {
        let el = Mo.el,
          posX = touch.offsetX,
          posY = touch.offsetY,
          touchX, touchY;

        if(_.isUndef(posX) ||
           _.isUndef(posY)) {
          posX = touch.layerX;
          posY = touch.layerY;
        }

        if(_.isUndef(posX) ||
           _.isUndef(posY)) {
          if(Mo.input.offsetX === void 0) {
            Mo.input._containerOffset();
          }
          posX = touch.pageX - Mo.input.offsetX;
          posY = touch.pageY - Mo.input.offsetY;
        }

        touchX = Mo.width * posX / Mo.cssWidth;
        touchY = Mo.height * posY / Mo.cssHeight;

        return { x: touchX, y: touchY };
      },

      touchControls: function(opts) {
        if(this.touchEnabled) { return false; }
        if(!hasTouch) { return false; }
        Mo.input.keypad = opts = _.inject({
          left: 0,
          gutter:10,
          controls: DEFAULT_TOUCH_CONTROLS,
          width: Mo.width,
          bottom: Mo.height,
          fullHeight: false
        },opts);

        opts.unit = (opts.width / opts.controls.length);
        opts.size = opts.unit - (opts.gutter * 2);

        function getKey(touch) {
          let pos = Mo.input.touchLocation(touch),
              minY = opts.bottom - opts.unit;
          for(let i=0,len=opts.controls.length;i<len;++i) {
            let minX = i * opts.unit + opts.gutter;
            if(pos.x >= minX &&
               pos.x <= (minX+opts.size) &&
               (opts.fullHeight ||
                (pos.y >= minY+opts.gutter &&
                 pos.y <= (minY+opts.unit-opts.gutter)))) {
              return opts.controls[i][0];
            }
          }
        }

        function touchDispatch(event) {
          let wasOn = {}, tch, key, actionName;
          // Reset all the actions bound to controls
          // but keep track of all the actions that were on
          for(let i=0,z=opts.controls.length;i<z;++i) {
            actionName = opts.controls[i][0];
            if(Mo.inputs[actionName]) { wasOn[actionName] = true; }
            Mo.inputs[actionName] = false;
          }

          let touches = event.touches ? event.touches : [ event ];

          for(let i=0,z=touches.length;i<z;++i) {
            tch = touches[i];
            key = getKey(tch);
            if(key) {
              // Mark this input as on
              Mo.inputs[key] = true;
              // Either send a new action
              // or remove from wasOn list
              if(!wasOn[key])
                Mo.EventBus.pub(key, Mo.input);
              else
                delete wasOn[key];
            }
          }
          // Any remaining were on the last frame
          // and need to send an up action
          for(actionName in wasOn) {
            Mo.EventBus.pub(actionName + "Up", Mo.input);
          }
          return null;
        }

        this.touchDispatchHandler = (e) => {
          touchDispatch(e);
          e.preventDefault();
        };

        _.doseq(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
          Mo.el.addEventListener(evt,this.touchDispatchHandler);
        },this);

        this.touchEnabled = true;
      },

      disableTouchControls: function() {
        _.doseq(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
          Mo.el.removeEventListener(evt,this.touchDispatchHandler);
        },this);

        Mo.el.removeEventListener("touchstart",this.joypadStart);
        Mo.el.removeEventListener("touchmove",this.joypadMove);
        Mo.el.removeEventListener("touchend",this.joypadEnd);
        Mo.el.removeEventListener("touchcancel",this.joypadEnd);
        this.touchEnabled = false;

        // clear existing inputs
        for(let input in Mo.inputs) {
          Mo.inputs[input] = false;
        }
      },

      joypadControls: function(opts) {
        if(this.joypadEnabled) { return false; }
        if(!hasTouch) { return false; }
        let joypad = Mo.joypad = _.patch(opts || {},{
          size: 50,
          trigger: 20,
          center: 25,
          color: "#CCC",
          background: "#000",
          alpha: 0.5,
          zone: Mo.width / 2,
          joypadTouch: null,
          inputs: DEFAULT_JOYPAD_INPUTS,
          triggers: []
        });

        this.joypadStart = function(evt) {
          if(joypad.joypadTouch === null) {
            let touch = evt.changedTouches[0],
                loc = Mo.input.touchLocation(touch);
            if(loc.x < joypad.zone) {
              joypad.joypadTouch = touch.identifier;
              joypad.centerX = loc.x;
              joypad.centerY = loc.y;
              joypad.x = null;
              joypad.y = null;
            }
          }
        };

        this.joypadMove = function(e) {
          if(joypad.joypadTouch !== null) {
            let evt = e;
            for(let i=0,z=evt.changedTouches.length;i<z;++i) {
              let touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                let loc = Mo.input.touchLocation(touch),
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
                  let actionName = joypad.inputs[k];
                  if(triggers[k]) {
                    Mo.inputs[actionName] = true;
                    if(!joypad.triggers[k])
                      Mo.EventBus.pub(actionName, Mo.input);
                  } else {
                    Mo.inputs[actionName] = false;
                    if(joypad.triggers[k])
                      Mo.EventBus.pub(actionName + "Up", Mo.input);
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

        this.joypadEnd = function(e) {
          let evt = e;
          if(joypad.joypadTouch !== null) {
            for(let i=0,z=evt.changedTouches.length;i<z;++i) {
              let touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                for(let k=0;k<joypad.triggers.length;++k) {
                  let actionName = joypad.inputs[k];
                  Mo.inputs[actionName] = false;
                  if(joypad.triggers[k])
                    Mo.EventBus.pub(actionName + "Up", Mo.input);
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
        };

        Mo.el.addEventListener("touchstart",this.joypadStart);
        Mo.el.addEventListener("touchmove",this.joypadMove);
        Mo.el.addEventListener("touchend",this.joypadEnd);
        Mo.el.addEventListener("touchcancel",this.joypadEnd);

        this.joypadEnabled = true;
      },

      mouseControls: function(options) {
        options = options || {};
        let stageNum = options.stageNum || 0;
        let mouseInputX = options.mouseX || "mouseX";
        let mouseInputY = options.mouseY || "mouseY";
        let cursor = options.cursor || "off";
        let mouseMoveObj = {};
        if(cursor !== "on")
          Mo.el.style.cursor = (cursor === "off") ? "none" : cursor;

        Mo.inputs[mouseInputX] = 0;
        Mo.inputs[mouseInputY] = 0;

        Mo._mouseMove = function(e) {
          e.preventDefault();
          let touch = e.touches ? e.touches[0] : e;
          let el = Mo.el,
            rect = el.getBoundingClientRect(),
            style = window.getComputedStyle(el),
            posX = touch.clientX - rect.left - parseInt(style.paddingLeft),
            posY = touch.clientY - rect.top  - parseInt(style.paddingTop);

          let stage = Mo.layer(stageNum);
          if(_.isUndef(posX) ||
             _.isUndef(posY)) {
            posX = touch.offsetX;
            posY = touch.offsetY;
          }
          if(_.isUndef(posX) ||
             _.isUndef(posY)) {
            posX = touch.layerX;
            posY = touch.layerY;
          }
          if(_.isUndef(posX) ||
             _.isUndef(posY)) {
            if(Mo.input.offsetX === void 0) { Mo.input._containerOffset(); }
            posX = touch.pageX - Mo.input.offsetX;
            posY = touch.pageY - Mo.input.offsetY;
          }
          if(stage) {
            mouseMoveObj.x= Mo.canvasToStageX(posX,stage);
            mouseMoveObj.y= Mo.canvasToStageY(posY,stage);
            Mo.inputs[mouseInputX] = mouseMoveObj.x;
            Mo.inputs[mouseInputY] = mouseMoveObj.y;
            Mo.EventBus.pub("mouseMove",Mo.input,mouseMoveObj);
          }
        };

        Mo._mouseWheel = function(e) {
          // http://www.sitepoint.com/html5-javascript-mouse-wheel/
          // cross-browser wheel delta
          e = window.event || e; // old IE support
          let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          Mo.EventBus.pub("mouseWheel", Mo.input,delta);
        };

        Mo.el.addEventListener("mousemove",Mo._mouseMove,true);
        Mo.el.addEventListener("touchstart",Mo._mouseMove,true);
        Mo.el.addEventListener("touchmove",Mo._mouseMove,true);
        Mo.el.addEventListener("mousewheel",Mo._mouseWheel,true);
        Mo.el.addEventListener("DOMMouseScroll",Mo._mouseWheel,true);
      },

      disableMouseControls: function() {
        if(Mo._mouseMove) {
          Mo.el.removeEventListener("mousemove",Mo._mouseMove, true);
          Mo.el.removeEventListener("mousewheel",Mo._mouseWheel, true);
          Mo.el.removeEventListener("DOMMouseScroll",Mo._mouseWheel, true);
          Mo.el.style.cursor = "inherit";
          Mo._mouseMove = null;
        }
      },

      drawButtons: function() {
        let keypad = Mo.input.keypad,
            ctx = Mo.ctx;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i=0;i<keypad.controls.length;++i) {
          let control = keypad.controls[i];
          if(control[0]) {
            ctx.font = "bold " + (keypad.size/2) + "px arial";
            let x = keypad.left + i * keypad.unit + keypad.gutter,
                y = keypad.bottom - keypad.unit,
                key = Mo.inputs[control[0]];

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
          Mo.input.drawCircle(joypad.centerX,
                             joypad.centerY,
                             joypad.background,
                             joypad.size);

          if(joypad.x !== null) {
            Mo.input.drawCircle(joypad.x,
                             joypad.y,
                             joypad.color,
                             joypad.center);
          }
        }
      },

      drawCanvas: function() {
        if(this.touchEnabled) {
          this.drawButtons();
        }

        if(this.joypadEnabled) {
          this.drawJoypad();
        }
      }

    });

    Mo.input = new Mo.InputSystem();

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
             (Mo.inputs["left"] || Mo.inputs["right"] || p.landed > 0)) {
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

          if(Mo.inputs["left"]) {
            p.direction = "left";
            if(collision && p.landed > 0) {
              p.vx = p.speed * collision.normalY;
              p.vy = -p.speed * collision.normalX;
            } else {
              p.vx = -p.speed;
            }
          } else if(Mo.inputs["right"]) {
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
             (Mo.inputs["up"] || Mo.inputs["action"]) && !p.jumping) {
            p.vy = p.jumpSpeed;
            p.landed = -dt;
            p.jumping = true;
          } else if(Mo.inputs["up"] || Mo.inputs["action"]) {
            Mo.EventBus.pub("jump", this.entity,this.entity);
            p.jumping = true;
          }

          if(p.jumping && !(Mo.inputs["up"] || Mo.inputs["action"])) {
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
        if(!p.stepDistance) { p.stepDistance = 32; }
        if(!p.stepDelay) { p.stepDelay = 0.2; }
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

        if(Mo.inputs["left"]) {
          p.diffX = -p.stepDistance;
        } else if(Mo.inputs["right"]) {
          p.diffX = p.stepDistance;
        }

        if(Mo.inputs["up"]) {
          p.diffY = -p.stepDistance;
        } else if(Mo.inputs["down"]) {
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

