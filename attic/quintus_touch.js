/*global Quintus:false, module:false, window: false */
var quintusTouch = function(Quintus) {
  "use strict";

  Quintus.Touch = function(Q) {
    let _ = Q._;

    if(_.isUndefined(Quintus.Sprites))
      throw "Quintus.Touch requires Quintus.Sprites Module";

    let touchStage = [0];
    let touchType = 0;

    Q.Evented.extend("TouchSystem",{
      init: function() {
        let touchSystem = this;

        this.boundTouch = (e) => { touchSystem.touch(e); };
        this.boundDrag = (e) => { touchSystem.drag(e); };
        this.boundEnd = (e) => { touchSystem.touchEnd(e); };

        Q.el.addEventListener('touchstart',this.boundTouch);
        Q.el.addEventListener('mousedown',this.boundTouch);

        Q.el.addEventListener('touchmove',this.boundDrag);
        Q.el.addEventListener('mousemove',this.boundDrag);

        Q.el.addEventListener('touchend',this.boundEnd);
        Q.el.addEventListener('mouseup',this.boundEnd);
        Q.el.addEventListener('touchcancel',this.boundEnd);

        this.touchPos = new Q.Evented();
        this.touchPos.grid = {};
        this.touchPos.p = { w:1, h:1, cx: 0, cy: 0 };
        this.activeTouches = {};
        this.touchedObjects = {};
      },

      dispose: function() {
        Q.el.removeEventListener('touchstart',this.boundTouch);
        Q.el.removeEventListener('mousedown',this.boundTouch);

        Q.el.removeEventListener('touchmove',this.boundDrag);
        Q.el.removeEventListener('mousemove',this.boundDrag);

        Q.el.removeEventListener('touchend',this.boundEnd);
        Q.el.removeEventListener('mouseup',this.boundEnd);
        Q.el.removeEventListener('touchcancel',this.boundEnd);
      },

      normalizeTouch: function(touch,stage) {
        let el = Q.el,
          rect = el.getBoundingClientRect(),
          style = window.getComputedStyle(el),
          posX = touch.clientX - rect.left - parseInt(style.paddingLeft, 10),
          posY = touch.clientY - rect.top  - parseInt(style.paddingTop, 10);

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
          if(Q.touch.offsetX === void 0) {
            Q.touch.offsetX = 0;
            Q.touch.offsetY = 0;
            el = Q.el;
            do {
              Q.touch.offsetX += el.offsetLeft;
              Q.touch.offsetY += el.offsetTop;
            } while(el = el.offsetParent);
          }
          posX = touch.pageX - Q.touch.offsetX;
          posY = touch.pageY - Q.touch.offsetY;
        }

        this.touchPos.p.ox = this.touchPos.p.px = posX / Q.cssWidth * Q.width;
        this.touchPos.p.oy = this.touchPos.p.py = posY / Q.cssHeight * Q.height;

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
                stage = Q.stage(touchStage[stageIdx]);

            if(!stage) { continue; }

            let touchIdentifier = touch.identifier || 0;
            let pos = this.normalizeTouch(touch,stage);

            stage.regrid(pos,true);
            let col = stage.search(pos,touchType), obj;

            if(col || stageIdx === touchStage.length - 1) {
              obj = col && col.obj;
              pos.obj = obj;
              this.trigger("touch",pos);
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
              obj.trigger('touch', this.activeTouches[touchIdentifier]);
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
              stage = active && active.stage;

          if(active) {
            let pos = this.normalizeTouch(touch,stage);
            active.x = pos.p.px;
            active.y = pos.p.py;
            active.dx = pos.p.ox - active.sx;
            active.dy = pos.p.oy - active.sy;

            active.obj.trigger('drag', active);
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
            active.obj.trigger('touchEnd', active);
            delete this.touchedObjects[active.obj.p.id];
            this.activeTouches[touchIdentifier] = null;
          }
        }
        e.preventDefault();
      }

    });

    Q.touch = function(type,stage) {
      Q.untouch();
      touchType = type || Q.SPRITE_UI;
      touchStage = stage || [2,1,0];
      if(!_.isArray(touchStage)) {
        touchStage = [touchStage];
      }

      if(!Q._touch)
        Q.touchInput = new Q.TouchSystem();

      return Q;
    };

    Q.untouch = function() {
      if(Q.touchInput) {
        Q.touchInput.dispose();
        delete Q['touchInput'];
      }
      return Q;
    };

  };


};


if(typeof Quintus === 'undefined') {
  module.exports = quintusTouch;
} else {
  quintusTouch(Quintus);
}

