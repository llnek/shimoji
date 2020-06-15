(function(global, undefined) {
  "use strict";
  let window=global,
      MojoH5= global.MojoH5;

  MojoH5.Touch = function(Mojo) {
    let _= Mojo.u,
        is= Mojo.is,
        _touchType= 0,
        _touchStage = [0];

    Mojo.defType("TouchSystem", {
      init: function() {
        let touchSystem = this;

        this.boundTouch = (e) => { touchSystem.touch(e); };
        this.boundDrag = (e) => { touchSystem.drag(e); };
        this.boundEnd = (e) => { touchSystem.touchEnd(e); };

        Mojo.el.addEventListener('touchstart',this.boundTouch);
        Mojo.el.addEventListener('mousedown',this.boundTouch);

        Mojo.el.addEventListener('touchmove',this.boundDrag);
        Mojo.el.addEventListener('mousemove',this.boundDrag);

        Mojo.el.addEventListener('touchend',this.boundEnd);
        Mojo.el.addEventListener('mouseup',this.boundEnd);
        Mojo.el.addEventListener('touchcancel',this.boundEnd);

        this.touchPos = {bbox4: new Map()};
        this.touchPos.p = { id: _.nextID(), w:1, h:1, cx: 0, cy: 0 };
        this.activeTouches = {};
        this.touchedObjects = {};
      },
      dispose: function() {
        Mojo.el.removeEventListener('touchstart',this.boundTouch);
        Mojo.el.removeEventListener('mousedown',this.boundTouch);

        Mojo.el.removeEventListener('touchmove',this.boundDrag);
        Mojo.el.removeEventListener('mousemove',this.boundDrag);

        Mojo.el.removeEventListener('touchend',this.boundEnd);
        Mojo.el.removeEventListener('mouseup',this.boundEnd);
        Mojo.el.removeEventListener('touchcancel',this.boundEnd);
      },
      normalizeTouch: function(touch,stage) {
        let el = Mojo.el,
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
          if(Mojo.touch.offsetX === void 0) {
            Mojo.touch.offsetX = 0;
            Mojo.touch.offsetY = 0;
            el = Mojo.el;
            do {
              Mojo.touch.offsetX += el.offsetLeft;
              Mojo.touch.offsetY += el.offsetTop;
            } while(el = el.offsetParent);
          }
          posX = touch.pageX - Mojo.touch.offsetX;
          posY = touch.pageY - Mojo.touch.offsetY;
        }

        this.touchPos.p.ox = this.touchPos.p.px = posX / Mojo.cssWidth * Mojo.width;
        this.touchPos.p.oy = this.touchPos.p.py = posY / Mojo.cssHeight * Mojo.height;

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
          for(let stageIdx=0;stageIdx < _touchStage.length;++stageIdx) {
            let touch = touches[i],
                stage = Mojo.layer(_touchStage[stageIdx]);

            if(!stage) { continue; }

            let touchIdentifier = touch.identifier || 0;
            let pos = this.normalizeTouch(touch,stage);

            stage.regrid(pos,true);
            let col = stage.search(pos,_touchType), obj;

            if(col || stageIdx === _touchStage.length - 1) {
              obj = col && col.obj;
              pos.obj = obj;
              Mojo.EventBus.pub("touch", this, pos);
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
              Mojo.EventBus.pub("touch", obj, this.activeTouches[touchIdentifier]);
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

            Mojo.EventBus.pub('drag', active.obj, active);
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
            Mojo.EventBus.pub('touchEnd', active.obj, active);
            delete this.touchedObjects[active.obj.p.id];
            this.activeTouches[touchIdentifier] = null;
          }
        }
        e.preventDefault();
      }

    });

    Mojo.touch = function(options) {
      options= options || {};
      _touchType = options.type || Mojo.SPRITE_UI;
      _touchStage = options.stage || [2,1,0];
      Mojo.untouch();
      if(!is.vec(_touchStage)) {
        _touchStage = [_touchStage];
      }

      if(!Mojo._touch)
        Mojo.touchInput = new Mojo.TouchSystem();

      return Mojo;
    };

    Mojo.untouch = function() {
      if(Mojo.touchInput) {
        Mojo.touchInput.dispose();
        delete Mojo['touchInput'];
      }
      return Mojo;
    };


    return Mojo;
  };


})(this);

