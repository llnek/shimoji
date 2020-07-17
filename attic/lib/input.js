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

(function(global,undefined){
  "use strict";
  let window= global,
      MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded.";

  /**
   * @private
   * @var {object}
   */
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

  /**
   * @private
   * @var {object}
   */
  let DEFAULT_KEYS = {
    LEFT: "left", RIGHT: "right",
    UP: "up", DOWN: "down",
    Z: "fire", X: "action", P: "P", S: "S",
    ESC: "esc", SPACE: "fire", ENTER: "confirm"
  };

  /**
   * @private
   * @var {object}
   */
  let TOUCH_CONTROLS = [["left","<" ],
                        ["right",">" ],
                        [],
                        ["action","b"],
                        ["fire", "a" ]],
      JOYPAD_CONTROLS= [[],[],[],
                        ["action","b"], ["fire","a"]];
  /**
   * @private
   * @var {array}
   */
  let TOUCH_EVENTS= ["touchstart","touchend",
                     "touchmove","touchcancel"];

  /**Clockwise from midnight (a la CSS)
   * @private
   * @var {array}
   */
  let JOYPAD_INPUTS =  ["up","right","down","left"];

  /**
   * @module
   */
  MojoH5.Input = function(Mojo) {

    let _= Mojo.u,
        is= Mojo.is,
        EBus=Mojo.EventBus;

    /**
     * @public
     * @property {map}
     */
    Mojo.inputs = _.jsMap();
    /**
     * @public
     * @property {object}
     */
    Mojo.joypad = _.jsObj();


    let _offset;
    let _containerOffset= () => {
      _offset.x = 0;
      _offset.y = 0;
      for(let el=Mojo.el;;)
      { _offset.x += el.offsetLeft;
        _offset.y += el.offsetTop;
        if (el=el.offsetParent) {} else break; }
    };

    /**
     * @public
     * @function
     */
    Mojo.canvasToSceneX = (x,scene) => {
      let cam=Mojo.getf(scene,"camera");
      x = x/Mojo.cssWidth*Mojo.width;
      return cam ? ((x/cam.scale[0])+cam.x) : x;
    };

    /**
     * @public
     * @function
     */
    Mojo.canvasToSceneY = (y,scene) => {
      let cam=Mojo.getf(scene,"camera");
      y = y/Mojo.cssWidth*Mojo.width;
      return cam ? ((y/cam.scale[1])+cam.y) : y;
    };

    /**
     * @public
     * @property {object}
     */
    Mojo.input = {

      keys: _.jsMap(),
      keypad: _.jsObj(),
      touchEnabled: false,
      joypadEnabled: false,
      keyboardEnabled: false,

      /**
       * @public
       * @function
       */
      enableKeyboard: function() {
        if(this.keyboardEnabled) return false;
        //Make selectable and remove an :focus outline
        Mojo.domAttrs(Mojo.el, {tabIndex: 0});
        Mojo.domCss(Mojo.el, {outline: 0});
        let action,self=this;
        _.addEvent("keydown", Mojo.el, (e) => {
          if(action=self.keys.get(e.keyCode)) {
            _.assoc(Mojo.inputs, action, true);
            EBus.pub([[action, self],
                      ["keydown",self,e.keyCode]]);
          }
          if(!e.ctrlKey && !e.metaKey) e.preventDefault();
        },false);
        _.addEvent("keyup",Mojo.el, (e) => {
          if(action=self.keys.get(e.keyCode)) {
            _.assoc(Mojo.inputs,action, false);
            EBus.pub([[action+"Up", self],
                      ["keyup",self,e.keyCode]]);
          }
          e.preventDefault();
        },false);
        if(Mojo.o.autoFocus) Mojo.el.focus();
        this.keyboardEnabled = true;
      },
      keyboardControls: function(keys) {
        _.doseq(keys||DEFAULT_KEYS, (name,key) => {
          _.assoc(this.keys, KEY_NAMES[key] || key, name);
        });
        this.enableKeyboard();
      },
      _tloc: function(touch) {
        let el = Mojo.el,
            px = touch.offsetX,
            py = touch.offsetY;
        if(px===undefined ||
           py===undefined) {
          px = touch.layerX;
          py = touch.layerY;
        }
        if(px===undefined ||
           py===undefined) {
          if(_offset===undefined) {
            _offset= _.p2();
            _containerOffset();
          }
          px = touch.pageX - _offset.x;
          py = touch.pageY - _offset.y;
        }
        return _.p2(Mojo.width * px / Mojo.cssWidth,
                    Mojo.height * py / Mojo.cssHeight);
      },
      touchControls: function(opts,joypad) {
        if(!Mojo.hasTouch() ||
           this.touchEnabled) { return false; }
        opts = opts || {};
        opts=
        _.inject({controls: joypad ? JOYPAD_CONTROLS : TOUCH_CONTROLS}, opts);
        this.keypad=
        opts = _.inject({left: 0,
                         gutter:10,
                         fullHeight: false,
                         width: Mojo.width,
                         bottom: Mojo.height}, opts);
        opts.unit = (opts.width / opts.controls.length);
        opts.size = opts.unit - (opts.gutter * 2);

        let self=this,
            getKey= (touch) => {
              let pos = self._tloc(touch),
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
            };

        Mojo.input.touchDispatchHandler = (event) => {
          let wasOn = {}, tch, key, action,
              touches = event.touches ? event.touches : [event];
          // Reset all the actions bound to controls
          // but keep track of all the actions that were on
          for(let i=0,z=opts.controls.length;i<z;++i) {
            action= opts.controls[i][0];
            if(Mojo.inputs.get(action)) { wasOn[action] = true; }
            _.assoc(Mojo.inputs,action,false);
          }
          for(let i=0,z=touches.length;i<z;++i) {
            tch = touches[i];
            if(key = getKey(tch)) {
              _.assoc(Mojo.inputs,key,true);
              if(wasOn[key])
                _.dissoc(wasOn,key);
              else
                EBus.pub(key, self);
            }
          }
          // Any remaining were on the last frame
          // and need to send an up action
          for(action in wasOn)
            if(_.has(wasOn,action))
              EBus.pub(action+"Up", self);
          event.preventDefault();
        };
        _.doseq(TOUCH_EVENTS, (evt) => {
          _.addEvent(evt, Mojo.el, Mojo.input.touchDispatchHandler);
        });
        this.touchEnabled = true;
      },
      disableTouchControls: function() {
        _.doseq(TOUCH_EVENTS,(evt) => {
          _.delEvent(evt,Mojo.el, Mojo.input.touchDispatchHandler);
        });
        _.delEvent([["touchstart",Mojo.el,this.joypadStart],
                    ["touchmove",Mojo.el,this.joypadMove],
                    ["touchend",Mojo.el,this.joypadEnd],
                    ["touchcancel",Mojo.el,this.joypadEnd]]);
        // clear existing inputs
        _.keys(Mojo.inputs).forEach(k => {
          _.assoc(Mojo.inputs,k,false);
        });
        this.touchEnabled = false;
      },
      joypadControls: function(opts) {
        if(!Mojo.hasTouch() ||
           this.joypadEnabled) { return false; }
        let self=this,
            joypad = _.inject({size: 50,
                               trigger: 20,
                               center: 25,
                               color: "#CCC",
                               background: "#000",
                               alpha: 0.5,
                               joypadTouch: null,
                               triggers: [],
                               zone: Mojo.width_div2,
                               inputs: JOYPAD_INPUTS},opts);
        Mojo.joypad=joypad;
        this.joypadStart = (evt) => {
          if(joypad.joypadTouch === null) {
            let touch = evt.changedTouches[0],
                loc = self._tloc(touch);
            if(loc.x < joypad.zone) {
              joypad.centerX = loc.x;
              joypad.centerY = loc.y;
              joypad.x = null;
              joypad.y = null;
              joypad.joypadTouch = touch.identifier;
            }
          }
        };
        this.joypadMove = (e) => {
          if(joypad.joypadTouch !== null) {
            let evt = e;
            for(let i=0,z=evt.changedTouches.length;i<z;++i) {
              let touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                let loc = self._tloc(touch),
                    dx = loc.x - joypad.centerX,
                    dy = loc.y - joypad.centerY,
                    dist = _.sqrt(dx * dx + dy * dy),
                    overage = _.max(1,dist / joypad.size),
                    ang =  Math.atan2(dx,dy);
                if(overage > 1) {
                  dx /= overage;
                  dy /= overage;
                  dist /= overage;
                }
                let triggers = [dy < -joypad.trigger,
                                dx > joypad.trigger,
                                dy > joypad.trigger,
                                dx < -joypad.trigger];
                for(let k=0;k<triggers.length;++k) {
                  let action= joypad.inputs[k];
                  if(triggers[k]) {
                    _.assoc(Mojo.inputs,action,true);
                    if(!joypad.triggers[k])
                      EBus.pub(action, Mojo.input);
                  } else {
                    _.assoc(Mojo.inputs,action,false);
                    if(joypad.triggers[k])
                      EBus.pub(action+"Up", Mojo.input);
                  }
                }
                _.inject(joypad, {dx: dx,
                                  dy: dy,
                                  dist: dist,
                                  ang: ang,
                                  triggers: triggers,
                                  x: joypad.centerX + dx,
                                  y: joypad.centerY + dy});
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
                  _.assoc(Mojo.inputs,action,false);
                  if(joypad.triggers[k])
                    EBus.pub(action+"Up", Mojo.input);
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
        };

        _.addEvent([["touchstart",Mojo.el,this.joypadStart],
                    ["touchmove",Mojo.el,this.joypadMove],
                    ["touchend",Mojo.el,this.joypadEnd],
                    ["touchcancel",Mojo.el,this.joypadEnd]]);
        this.joypadEnabled = true;
      },
      mouseControls: function(options) {
        options = options || {};
        let slot = options.slot || 0;
        let mouseInputX = options.mouseX || "mouseX";
        let mouseInputY = options.mouseY || "mouseY";
        let cursor = options.cursor || "off";
        let self=this;
        let mouseMoveObj = _.jsObj();

        if(cursor !== "on")
          Mojo.domCss(Mojo.el,{cursor: (cursor === "off") ? "none" : cursor});

        _.assoc(Mojo.inputs,mouseInputX, 0, mouseInputY, 0);

        this._mouseMove = function(e) {
          e.preventDefault();
          let touch = e.touches ? e.touches[0] : e;
          let el = Mojo.el,
            rect = el.getBoundingClientRect(),
            style = window.getComputedStyle(el),
            px = touch.clientX - rect.left - parseInt(style.paddingLeft),
            py = touch.clientY - rect.top  - parseInt(style.paddingTop);
          let scene = Mojo.scene(slot);
          if(px===undefined ||
             py===undefined) {
            px = touch.offsetX;
            py = touch.offsetY;
          }
          if(px===undefined ||
             py===undefined) {
            px = touch.layerX;
            py = touch.layerY;
          }
          if(px===undefined ||
             py===undefined) {
            if(_offset===undefined) {
              _offset= _.p2();
              _containerOffset();
            }
            px = touch.pageX - _offset.x;
            py = touch.pageY - _offset.y;
          }
          if(scene) {
            mouseMoveObj.x= Mojo.canvasToSceneX(px,scene);
            mouseMoveObj.y= Mojo.canvasToSceneY(py,scene);
            _.assoc(Mojo.inputs,
                    mouseInputX, mouseMoveObj.x,
                    mouseInputY, mouseMoveObj.y);
            EBus.pub("mouseMove",self,mouseMoveObj);
          }
        };
        this._mouseWheel = (e) => {
          // http://www.sitepoint.com/html5-javascript-mouse-wheel/
          // cross-browser wheel delta
          e = window.event || e; // old IE support
          let delta = _.max(-1, _.min(1, (e.wheelDelta || -e.detail)));
          EBus.pub("mouseWheel", self,delta);
        };
        _.addEvent([["mousemove",Mojo.el,this._mouseMove,true],
                    ["touchstart",Mojo.el,this._mouseMove,true],
                    ["touchmove",Mojo.el,this._mouseMove,true],
                    ["mousewheel",Mojo.el,this._mouseWheel,true],
                    ["DOMMouseScroll",Mojo.el,this._mouseWheel,true]]);
      },
      disableMouseControls: function() {
        if(this._mouseMove) {
          _.delEvent([["mousemove",Mojo.el,this._mouseMove, true],
                      ["mousewheel",Mojo.el,this._mouseWheel, true],
                      ["DOMMouseScroll",Mojo.el,this._mouseWheel, true]]);
          Mojo.domCss(Mojo.el,{cursor: "inherit"});
          this._mouseMove = null;
        }
      },
      drawButtons: function() {
        let ctx = Mojo.ctx,
            keypad = this.keypad;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i=0;i<keypad.controls.length;++i) {
          let control = keypad.controls[i];
          if(control[0]) {
            ctx.font = "bold " + (keypad.size/2) + "px arial";
            let key = _.get(Mojo.inputs,control[0]),
                y = keypad.bottom - keypad.unit,
                x = keypad.left + i * keypad.unit + keypad.gutter;

            ctx.fillStyle = keypad.color || "#FFFFFF";
            ctx.globalAlpha = key ? 1.0 : 0.5;
            ctx.fillRect(x,y,keypad.size,keypad.size);

            ctx.fillStyle = keypad.text || "#000000";
            ctx.fillText(control[1], x+keypad.size/2, y+keypad.size/2);
          }
        }
        ctx.restore();
      },
      drawCircle: function(x,y,color,size) {
        let ctx = Mojo.ctx;

        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha=Mojo.joypad.alpha;
        ctx.fillStyle = color;
        ctx.arc(x, y, size, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      },
      drawJoypad: function() {
        let pad = Mojo.joypad;
        if(pad.joypadTouch !== null) {
          this.drawCircle(pad.centerX,
                          pad.centerY,
                          pad.background,
                          pad.size);
          if(is.num(pad.x))
            this.drawCircle(pad.x,
                            pad.y,
                            pad.color,
                            pad.center);
        }
      },
      drawCanvas: function() {
        if(this.touchEnabled) this.drawButtons();
        if(this.joypadEnabled) this.drawJoypad();
      }
    };

    /**
     * @public
     * @function
     */
    Mojo.controls = function(options) {

      options= options || {};

      if(options.keys!==false)
        Mojo.input.keyboardControls(options.keys);
      if(options.mouse!==false)
        Mojo.input.mouseControls(options.mouse);
      if(options.touch!==false)
        Mojo.touch(options.touch);

      if(options.touch!==false && Mojo.touchDevice) {
        if(options.touch)
          Mojo.input.touchControls(options.touch,options.joypad);
        if(options.joypad)
          Mojo.input.joypadControls(options.joypad);
      }

      return Mojo;
    };

    return Mojo;
  };

})(this);

