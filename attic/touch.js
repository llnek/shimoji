(function(global, undefined) {
  "use strict";
  let Mojo= global.Mojo,
      _ = Mojo._, is=_.is, window = global;

  Mojo.Touch = function(Mo) {

    let touchStage = [0];
    let touchType = 0;

    Mo.defType("TouchSystem", {
      init: function() {
        let touchSystem = this;

        this.boundTouch = (e) => { touchSystem.touch(e); };
        this.boundDrag = (e) => { touchSystem.drag(e); };
        this.boundEnd = (e) => { touchSystem.touchEnd(e); };

        Mo.el.addEventListener('touchstart',this.boundTouch);
        Mo.el.addEventListener('mousedown',this.boundTouch);

        Mo.el.addEventListener('touchmove',this.boundDrag);
        Mo.el.addEventListener('mousemove',this.boundDrag);

        Mo.el.addEventListener('touchend',this.boundEnd);
        Mo.el.addEventListener('mouseup',this.boundEnd);
        Mo.el.addEventListener('touchcancel',this.boundEnd);

        this.touchPos = {bbox4: new Map()};
        this.touchPos.p = { id: _.nextID(), w:1, h:1, cx: 0, cy: 0 };
        this.activeTouches = {};
        this.touchedObjects = {};
      },
      dispose: function() {
        Mo.el.removeEventListener('touchstart',this.boundTouch);
        Mo.el.removeEventListener('mousedown',this.boundTouch);

        Mo.el.removeEventListener('touchmove',this.boundDrag);
        Mo.el.removeEventListener('mousemove',this.boundDrag);

        Mo.el.removeEventListener('touchend',this.boundEnd);
        Mo.el.removeEventListener('mouseup',this.boundEnd);
        Mo.el.removeEventListener('touchcancel',this.boundEnd);
      },
      normalizeTouch: function(touch,stage) {
        let el = Mo.el,
          rect = el.getBoundingClientRect(),
          style = window.getComputedStyle(el),
          posX = touch.clientX - rect.left - parseInt(style.paddingLeft),
          posY = touch.clientY - rect.top  - parseInt(style.paddingTop);

        if(is.undef(posX) ||
           is.undef(posY)) {
           posX = touch.offsetX;
           posY = touch.offsetY;
        }

        if(is.undef(posX) ||
           is.undef(posY)) {
          posX = touch.layerX;
          posY = touch.layerY;
        }

        if(is.undef(posX) ||
           is.undef(posY)) {
          if(Mo.touch.offsetX === void 0) {
            Mo.touch.offsetX = 0;
            Mo.touch.offsetY = 0;
            el = Mo.el;
            do {
              Mo.touch.offsetX += el.offsetLeft;
              Mo.touch.offsetY += el.offsetTop;
            } while(el = el.offsetParent);
          }
          posX = touch.pageX - Mo.touch.offsetX;
          posY = touch.pageY - Mo.touch.offsetY;
        }

        this.touchPos.p.ox = this.touchPos.p.px = posX / Mo.cssWidth * Mo.width;
        this.touchPos.p.oy = this.touchPos.p.py = posY / Mo.cssHeight * Mo.height;

        if(stage.viewport) {
          this.touchPos.p.px /= stage.viewport.scale;
          this.touchPos.p.py /= stage.viewport.scale;
          this.touchPos.p.px += stage.viewport.x;
          this.touchPos.p.py += stage.viewport.y;
        }

        this.touchPos.p.x = this.touchPos.p.px;
        this.touchPos.p.y = this.touchPos.p.py;

        this.touchPos.obj = null;
        return this.touchPos;
      },

      touch: function(e) {
        let touches = e.changedTouches || [ e ];
        for(let i=0;i<touches.length;++i) {
          for(let stageIdx=0;stageIdx < touchStage.length;++stageIdx) {
            let touch = touches[i],
                stage = Mo.layer(touchStage[stageIdx]);

            if(!stage) { continue; }

            let touchIdentifier = touch.identifier || 0;
            let pos = this.normalizeTouch(touch,stage);

            stage.regrid(pos,true);
            let col = stage.search(pos,touchType), obj;

            if(col || stageIdx === touchStage.length - 1) {
              obj = col && col.obj;
              pos.obj = obj;
              Mo.EventBus.pub("touch", this, pos);
            }

            if(obj && !this.touchedObjects[obj]) {
              this.activeTouches[touchIdentifier] = {
                x: pos.p.px,
                y: pos.p.py,
                origX: obj.p.x,
                origY: obj.p.y,
                sx: pos.p.ox,
                sy: pos.p.oy,
                identifier: touchIdentifier,
                obj: obj,
                stage: stage
              };
              this.touchedObjects[obj.p.id] = true;
              Mo.EventBus.pub("touch", obj, this.activeTouches[touchIdentifier]);
              break;
            }

          }

        }
        //e.preventDefault();
      },

      drag: function(e) {
        let touches = e.changedTouches || [ e ];

        for(let i=0;i<touches.length;++i) {
          let touch = touches[i],
              touchIdentifier = touch.identifier || 0;

          let active = this.activeTouches[touchIdentifier],
              stage = active && active.layer;

          if(active) {
            let pos = this.normalizeTouch(touch,stage);
            active.x = pos.p.px;
            active.y = pos.p.py;
            active.dx = pos.p.ox - active.sx;
            active.dy = pos.p.oy - active.sy;

            Mo.EventBus.pub('drag', active.obj, active);
          }
        }
        e.preventDefault();
      },

      touchEnd: function(e) {
        let touches = e.changedTouches || [ e ];

        for(let i=0;i<touches.length;++i) {
          let touch = touches[i],
              touchIdentifier = touch.identifier || 0;

          let active = this.activeTouches[touchIdentifier];

          if(active) {
            Mo.EventBus.pub('touchEnd', active.obj, active);
            delete this.touchedObjects[active.obj.p.id];
            this.activeTouches[touchIdentifier] = null;
          }
        }
        e.preventDefault();
      }

    });

    Mo.touch = function(type,stage) {
      Mo.untouch();
      touchType = type || Mo.SPRITE_UI;
      touchStage = stage || [2,1,0];
      if(!is.vec(touchStage)) {
        touchStage = [touchStage];
      }

      if(!Mo._touch)
        Mo.touchInput = new Mo.TouchSystem();

      return Mo;
    };

    Mo.untouch = function() {
      if(Mo.touchInput) {
        Mo.touchInput.dispose();
        delete Mo['touchInput'];
      }
      return Mo;
    };

  };




})(this);

