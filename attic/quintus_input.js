/*global Quintus:false, module:false */
var quintusInput = function(Quintus) {
  "use strict";
  Quintus.Input = function(Q) {
    let _ = Q._;
    let KEY_NAMES = Q.KEY_NAMES = {
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

    Q.inputs = {};
    Q.joypad = {};

    let hasTouch =  !!('ontouchstart' in window);

    Q.canvasToStageX = (x,stage) => {
      x = x / Q.cssWidth * Q.width;
      if(stage.viewport) {
        x /= stage.viewport.scale;
        x += stage.viewport.x;
      }
      return x;
    };

    Q.canvasToStageY = (y,stage) => {
      y = y / Q.cssWidth * Q.width;
      if(stage.viewport) {
        y /= stage.viewport.scale;
        y += stage.viewport.y;
      }
      return y;
    };

    Q.InputSystem = Q.Evented.extend({
      keys: {},
      keypad: {},
      keyboardEnabled: false,
      touchEnabled: false,
      joypadEnabled: false,

      bindKey: function(key,name) {
        Q.input.keys[KEY_NAMES[key] || key] = name;
      },

      enableKeyboard: function() {
        if(this.keyboardEnabled) { return false; }

        // Make selectable and remove an :focus outline
        Q.el.tabIndex = 0;
        Q.el.style.outline = 0;

        Q.el.addEventListener("keydown",function(e) {
          if(Q.input.keys[e.keyCode]) {
            let actionName = Q.input.keys[e.keyCode];
            Q.inputs[actionName] = true;
            Q.input.trigger(actionName);
            Q.input.trigger('keydown',e.keyCode);
          }
          if(!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
        },false);

        Q.el.addEventListener("keyup",function(e) {
          if(Q.input.keys[e.keyCode]) {
            let actionName = Q.input.keys[e.keyCode];
            Q.inputs[actionName] = false;
            Q.input.trigger(actionName + "Up");
            Q.input.trigger('keyup',e.keyCode);
          }
          e.preventDefault();
        },false);

        if(Q.options.autoFocus) {  Q.el.focus(); }
        this.keyboardEnabled = true;
      },

      keyboardControls: function(keys) {
        keys = keys || DEFAULT_KEYS;
        _.doseq(keys,function(name,key) {
         this.bindKey(key,name);
        },Q.input);
        this.enableKeyboard();
      },

      _containerOffset: function() {
        Q.input.offsetX = 0;
        Q.input.offsetY = 0;
        let el = Q.el;
        do {
          Q.input.offsetX += el.offsetLeft;
          Q.input.offsetY += el.offsetTop;
        } while(el = el.offsetParent);
      },

      touchLocation: function(touch) {
        let el = Q.el,
          posX = touch.offsetX,
          posY = touch.offsetY,
          touchX, touchY;

        if(_.isUndefined(posX) ||
           _.isUndefined(posY)) {
          posX = touch.layerX;
          posY = touch.layerY;
        }

        if(_.isUndefined(posX) ||
           _.isUndefined(posY)) {
          if(Q.input.offsetX === void 0) {
            Q.input._containerOffset();
          }
          posX = touch.pageX - Q.input.offsetX;
          posY = touch.pageY - Q.input.offsetY;
        }

        touchX = Q.width * posX / Q.cssWidth;
        touchY = Q.height * posY / Q.cssHeight;

        return { x: touchX, y: touchY };
      },

      touchControls: function(opts) {
        if(this.touchEnabled) { return false; }
        if(!hasTouch) { return false; }
        Q.input.keypad = opts = _.inject({
          left: 0,
          gutter:10,
          controls: DEFAULT_TOUCH_CONTROLS,
          width: Q.width,
          bottom: Q.height,
          fullHeight: false
        },opts);

        opts.unit = (opts.width / opts.controls.length);
        opts.size = opts.unit - (opts.gutter * 2);

        function getKey(touch) {
          let pos = Q.input.touchLocation(touch),
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
            if(Q.inputs[actionName]) { wasOn[actionName] = true; }
            Q.inputs[actionName] = false;
          }

          let touches = event.touches ? event.touches : [ event ];

          for(let i=0,z=touches.length;i<z;++i) {
            tch = touches[i];
            key = getKey(tch);
            if(key) {
              // Mark this input as on
              Q.inputs[key] = true;
              // Either trigger a new action
              // or remove from wasOn list
              if(!wasOn[key])
                Q.input.trigger(key);
              else
                delete wasOn[key];
            }
          }
          // Any remaining were on the last frame
          // and need to trigger an up action
          for(actionName in wasOn) {
            Q.input.trigger(actionName + "Up");
          }
          return null;
        }

        this.touchDispatchHandler = (e) => {
          touchDispatch(e);
          e.preventDefault();
        };

        _.doseq(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
          Q.el.addEventListener(evt,this.touchDispatchHandler);
        },this);

        this.touchEnabled = true;
      },

      disableTouchControls: function() {
        _.doseq(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
          Q.el.removeEventListener(evt,this.touchDispatchHandler);
        },this);

        Q.el.removeEventListener('touchstart',this.joypadStart);
        Q.el.removeEventListener('touchmove',this.joypadMove);
        Q.el.removeEventListener('touchend',this.joypadEnd);
        Q.el.removeEventListener('touchcancel',this.joypadEnd);
        this.touchEnabled = false;

        // clear existing inputs
        for(let input in Q.inputs) {
          Q.inputs[input] = false;
        }
      },

      joypadControls: function(opts) {
        if(this.joypadEnabled) { return false; }
        if(!hasTouch) { return false; }
        let joypad = Q.joypad = _.patch(opts || {},{
          size: 50,
          trigger: 20,
          center: 25,
          color: "#CCC",
          background: "#000",
          alpha: 0.5,
          zone: Q.width / 2,
          joypadTouch: null,
          inputs: DEFAULT_JOYPAD_INPUTS,
          triggers: []
        });

        this.joypadStart = function(evt) {
          if(joypad.joypadTouch === null) {
            let touch = evt.changedTouches[0],
                loc = Q.input.touchLocation(touch);
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
                let loc = Q.input.touchLocation(touch),
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
                    Q.inputs[actionName] = true;
                    if(!joypad.triggers[k])
                      Q.input.trigger(actionName);
                  } else {
                    Q.inputs[actionName] = false;
                    if(joypad.triggers[k])
                      Q.input.trigger(actionName + "Up");
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
                  Q.inputs[actionName] = false;
                  if(joypad.triggers[k])
                    Q.input.trigger(actionName + "Up");
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
        };

        Q.el.addEventListener("touchstart",this.joypadStart);
        Q.el.addEventListener("touchmove",this.joypadMove);
        Q.el.addEventListener("touchend",this.joypadEnd);
        Q.el.addEventListener("touchcancel",this.joypadEnd);

        this.joypadEnabled = true;
      },

      mouseControls: function(options) {
        options = options || {};
        let stageNum = options.stageNum || 0;
        let mouseInputX = options.mouseX || "mouseX";
        let mouseInputY = options.mouseY || "mouseY";
        let cursor = options.cursor || "off";
        let mouseMoveObj = {};
        if(cursor !== "on") {
          if(cursor === "off")
            Q.el.style.cursor = 'none';
          else
            Q.el.style.cursor = cursor;
        }

        Q.inputs[mouseInputX] = 0;
        Q.inputs[mouseInputY] = 0;

        Q._mouseMove = function(e) {
          e.preventDefault();
          let touch = e.touches ? e.touches[0] : e;
          let el = Q.el,
            rect = el.getBoundingClientRect(),
            style = window.getComputedStyle(el),
            posX = touch.clientX - rect.left - parseInt(style.paddingLeft, 10),
            posY = touch.clientY - rect.top  - parseInt(style.paddingTop, 10);

          let stage = Q.stage(stageNum);
          if(_.isUndefined(posX) ||
             _.isUndefined(posY)) {
            posX = touch.offsetX;
            posY = touch.offsetY;
          }
          if(_.isUndefined(posX) ||
             _.isUndefined(posY)) {
            posX = touch.layerX;
            posY = touch.layerY;
          }
          if(_.isUndefined(posX) ||
             _.isUndefined(posY)) {
            if(Q.input.offsetX === void 0) { Q.input._containerOffset(); }
            posX = touch.pageX - Q.input.offsetX;
            posY = touch.pageY - Q.input.offsetY;
          }
          if(stage) {
            mouseMoveObj.x= Q.canvasToStageX(posX,stage);
            mouseMoveObj.y= Q.canvasToStageY(posY,stage);
            Q.inputs[mouseInputX] = mouseMoveObj.x;
            Q.inputs[mouseInputY] = mouseMoveObj.y;
            Q.input.trigger('mouseMove',mouseMoveObj);
          }
        };

        Q._mouseWheel = function(e) {
          // http://www.sitepoint.com/html5-javascript-mouse-wheel/
          // cross-browser wheel delta
          e = window.event || e; // old IE support
          let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          Q.input.trigger('mouseWheel', delta);
        };

        Q.el.addEventListener('mousemove',Q._mouseMove,true);
        Q.el.addEventListener('touchstart',Q._mouseMove,true);
        Q.el.addEventListener('touchmove',Q._mouseMove,true);
        Q.el.addEventListener('mousewheel',Q._mouseWheel,true);
        Q.el.addEventListener('DOMMouseScroll',Q._mouseWheel,true);
      },

      disableMouseControls: function() {
        if(Q._mouseMove) {
          Q.el.removeEventListener("mousemove",Q._mouseMove, true);
          Q.el.removeEventListener("mousewheel",Q._mouseWheel, true);
          Q.el.removeEventListener("DOMMouseScroll",Q._mouseWheel, true);
          Q.el.style.cursor = 'inherit';
          Q._mouseMove = null;
        }
      },

      drawButtons: function() {
        let keypad = Q.input.keypad,
            ctx = Q.ctx;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i=0;i<keypad.controls.length;++i) {
          let control = keypad.controls[i];
          if(control[0]) {
            ctx.font = "bold " + (keypad.size/2) + "px arial";
            let x = keypad.left + i * keypad.unit + keypad.gutter,
                y = keypad.bottom - keypad.unit,
                key = Q.inputs[control[0]];

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
        let ctx = Q.ctx,
            joypad = Q.joypad;

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
        let joypad = Q.joypad;
        if(joypad.joypadTouch !== null) {
          Q.input.drawCircle(joypad.centerX,
                             joypad.centerY,
                             joypad.background,
                             joypad.size);

          if(joypad.x !== null) {
            Q.input.drawCircle(joypad.x,
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

    Q.input = new Q.InputSystem();

    Q.controls = function(joypad) {
      Q.input.keyboardControls();
      if(joypad) {
        Q.input.touchControls({
          controls: [ [],[],[],['action','b'],['fire','a']]
        });
        Q.input.joypadControls();
      } else {
        Q.input.touchControls();
      }
      return Q;
    };

    Q.component("platformerControls", {
      defaults: {
        speed: 200,
        jumpSpeed: -300,
        collisions: []
      },

      added: function() {
        let p = this.entity.p;
        _.patch(p,this.defaults);

        this.entity.on("step","step",this);
        this.entity.on("bump.bottom","landed",this);

        p.landed = 0;
        p.direction ='right';
      },

      landed: function(col) {
        let p = this.entity.p;
        p.landed = 1/5;
      },

      step: function(dt) {
        let p = this.entity.p;

        if(p.ignoreControls === undefined || !p.ignoreControls) {
          let collision = null;
          // Follow along the current slope, if possible.
          if(p.collisions !== undefined &&
             p.collisions.length > 0 &&
             (Q.inputs['left'] || Q.inputs['right'] || p.landed > 0)) {
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

          if(Q.inputs['left']) {
            p.direction = 'left';
            if(collision && p.landed > 0) {
              p.vx = p.speed * collision.normalY;
              p.vy = -p.speed * collision.normalX;
            } else {
              p.vx = -p.speed;
            }
          } else if(Q.inputs['right']) {
            p.direction = 'right';
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
             (Q.inputs['up'] || Q.inputs['action']) && !p.jumping) {
            p.vy = p.jumpSpeed;
            p.landed = -dt;
            p.jumping = true;
          } else if(Q.inputs['up'] || Q.inputs['action']) {
            this.entity.trigger('jump', this.entity);
            p.jumping = true;
          }

          if(p.jumping && !(Q.inputs['up'] || Q.inputs['action'])) {
            p.jumping = false;
            this.entity.trigger('jumped', this.entity);
            if(p.vy < p.jumpSpeed / 3) {
              p.vy = p.jumpSpeed / 3;
            }
          }
        }
        p.landed -= dt;
      }
    });

    Q.component("stepControls", {
      added: function() {
        let p = this.entity.p;
        if(!p.stepDistance) { p.stepDistance = 32; }
        if(!p.stepDelay) { p.stepDelay = 0.2; }
        p.stepWait = 0;
        this.entity.on("step","step",this);
        this.entity.on("hit", "collision",this);
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

        if(Q.inputs['left']) {
          p.diffX = -p.stepDistance;
        } else if(Q.inputs['right']) {
          p.diffX = p.stepDistance;
        }

        if(Q.inputs['up']) {
          p.diffY = -p.stepDistance;
        } else if(Q.inputs['down']) {
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

};

if(typeof Quintus === 'undefined') {
  module.exports = quintusInput;
} else {
  quintusInput(Quintus);
}
