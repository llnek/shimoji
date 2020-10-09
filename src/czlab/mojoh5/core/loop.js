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

;(function(global){
  "use strict";
  let window;
  let _ModuleInited;
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }else{
    window=global;
  }

  if(!window)
    throw "Fatal: requires browser.";

  /**
   * @private
   * @function
   */
  function _module(Mojo,_bgTasks){
    const Core=global["io.czlab.mcfud.core"]();
    let _startTime = Date.now();
    const _=Core.u;
    const is=Core.is;
    let _paused = false;
    let _lag = 0;
    let _lagOffset = 0;
    let _renderStartTime = 0;
    let _renderDuration=0;
    let _frameDuration = 1000 / (Mojo.o.fps || 60);

    if(Mojo.o.rfps)
      _renderDuration = 1000 / Mojo.o.rfps;

    //------------------------------------------------------------------------
    /**
     * @private
     * @function
     */
    function _update(dt){
      //process any backgorund tasks
      _.doseq(_bgTasks,m => m.update(dt));
      //game content stuff
      if(!_paused){
        Mojo.preloadAssets && Mojo.preloadAssets();
        _.doseq(Mojo.stage.children, s=> s.update && s.update(dt));
      }
    }
    /**
     * @private
     * @function
     */
    function _checkPoint(){
      let i=Mojo.interpolateConfig();
      function _save(s){
        if(!s.mojoh5.stage){
          if(i.rotation){
            s.mojoh5._prev.rotation = s.rotation }
          if(i.pos){
            s.mojoh5._prev.x = s.x;
            s.mojoh5._prev.y = s.y;
            if(s.mojoh5.tiling){
              s.mojoh5._prev.tilingX= s.mojoh5.tiling.x;
              s.mojoh5._prev.tilingY= s.mojoh5.tiling.y;
              s.mojoh5._prev.tilingSX = s.mojoh5.tiling.sx;
              s.mojoh5._prev.tilingSY = s.mojoh5.tiling.sy;
            }
          }
          if(i.size){
            s.mojoh5._prev.width = s.width;
            s.mojoh5._prev.height = s.height }
          if(i.scale){
            s.mojoh5._prev.sx = s.scale.x;
            s.mojoh5._prev.sy = s.scale.y }
          if(i.alpha){
            s.mojoh5._prev.alpha = s.alpha }
        }
        _.doseq(s.children,_save)
      }
      is.obj(i) &&
        _.doseq(Mojo.stage.children,_save);
    }
    /**
     * @private
     * @function
     */
    function _restore(s){
      let i=Mojo.interpolateConfig();
      if(!is.obj(i))
        return;
      if(!s.mojoh5.stage){
        if(i.pos){
          s.x = s.mojoh5._cur.x;
          s.y = s.mojoh5._cur.y;
          if(s.mojoh5.tiling){
            s.mojoh5.tiling.x = s.mojoh5._cur.tilingX;
            s.mojoh5.tiling.y = s.mojoh5._cur.tilingY;
            s.mojoh5.tiling.sx = s.mojoh5._cur.tilingSX;
            s.mojoh5.tiling.sy = s.mojoh5._cur.tilingSY;
          }
        }
        if(i.rotation){
          s.rotation = s.mojoh5._cur.rotation }
        if(i.size &&
          (_.inst(Mojo.p.Sprite,s) ||
            _.inst(Mojo.p.ASprite,s))){
          s.width = s.mojoh5._cur.width;
          s.height = s.mojoh5._cur.height;
        }
        if(i.scale){
          s.scale.x = s.mojoh5._cur.sx;
          s.scale.y = s.mojoh5._cur.sy }
        if(i.alpha){
          s.alpha = s.mojoh5._cur.alpha }
      }
      _.doseq(s.children,_restore);
    }
    /**
     * @private
     * @function
     */
    function _interpolate(dt){
      let current = Date.now();
      let elapsed = current - _startTime;
      if(elapsed > 1000) elapsed = _frameDuration;
      _startTime = current;
      _lag += elapsed;
      while(_lag >= _frameDuration){
        _checkPoint();
        _update(dt);
        _lag -= _frameDuration;
      }
      _lagOffset = _lag / _frameDuration;
      _render(_lagOffset);
    };
    /**
     * @private
     * @function
     */
    function _gameLoop(ts, dt){
      if(dt < 0) dt= 1.0/60;
      if(dt > 1.0/15) dt= 1.0/15;
      if(!is.num(Mojo.o.fps)){
        //not defined, so update as fast as possible
        _update(dt);
        _render();
      }else if(!is.num(Mojo.o.rfps)){
        //rendering time not defined, just run
        _interpolate(dt);
      }else if(ts >= _renderStartTime){
        _interpolate(dt);
        _renderStartTime = ts + _renderDuration;
      }
    }
    function _runGameLoop(){
      let _limit= Mojo.o.maxFrameTime || 100;
      let _lastFrame = _.now();
      let _loopFrame = 0;
      Mojo.glwrapper = function(ptInTime){
        let now = _.now();
        ++_loopFrame;
        //call again please
        window.requestAnimationFrame(Mojo.glwrapper);
        let dt = now - _lastFrame;
        //some upperbound to stop frame fast forwarding
        if(dt>_limit) dt=_limit;
        _gameLoop(ptInTime, dt/1000);
        _lastFrame = now;
      };
      //kick start loop
      window.requestAnimationFrame(Mojo.glwrapper);
    };
    /**
     * @private
     * @function
     */
    function _interpolateSprite(lagOffset,s){
      let i=Mojo.interpolateConfig();
      if(!is.obj(i))
        return;
      if(!s.mojoh5.stage){
        if(i.pos){
          s.mojoh5._cur.x= s.x;
          s.mojoh5._cur.y= s.y;
          if(s.mojoh5._prev.x !== undefined)
            s.x = (s.x - s.mojoh5._prev.x) * lagOffset + s.mojoh5._prev.x;
          if(s.mojoh5._prev.y !== undefined)
            s.y = (s.y - s.mojoh5._prev.y) * lagOffset + s.mojoh5._prev.y;
          if(s.mojoh5.tiling){
            s.mojoh5._cur.tilingX = s.mojoh5.tiling.x;
            s.mojoh5._cur.tilingY = s.mojoh5.tiling.y;
            if(s.mojoh5._prev.tilingX !== undefined)
              s.mojoh5.tiling.x = (s.mojoh5.tiling.x - s.mojoh5._prev.tilingX) * lagOffset + s.mojoh5._prev.tilingX;
            if(s.mojoh5._prev.tilingY !== undefined)
              s.mojoh5.tiling.y = (s.mojoh5.tiling.y - s.mojoh5._prev.tilingY) * lagOffset + s.mojoh5._prev.tilingY;
            s.mojoh5._cur.tilingSX = s.mojoh5.tiling.sx;
            s.mojoh5._cur.tilingSY = s.mojoh5.tiling.sy;
            if(s.mojoh5._prev.tilingSX !== undefined)
              s.mojoh5.tiling.sx = (s.mojoh5.tiling.sx - s.mojoh5._prev.tilingSX) * lagOffset + s.mojoh5._prev.tilingSX;
            if(s.mojoh5._prev.tilingSY !== undefined)
              s.mojoh5.tiling.sy = (s.mojoh5.tiling.sy - s.mojoh5._prev.tilingSY) * lagOffset + s.mojoh5._prev.tilingSY;
          }
        }
        if(i.rotation){
          s.mojoh5._cur.rotation = s.rotation;
          if(s.mojoh5._prev.rotation !== undefined)
            s.rotation = (s.rotation - s.mojoh5._prev.rotation) * lagOffset + s.mojoh5._prev.rotation;
        }
        if(i.size && (_.inst(Mojo.p.Sprite,s) ||
                      _.inst(Mojo.p.ASprite,s))){
          s.mojoh5._cur.width = s.width;
          s.mojoh5._cur.height = s.height;
          if(s.mojoh5._prev.width !== undefined)
            s.width = (s.width - s.mojoh5._prev.width) * lagOffset + s.mojoh5._prev.width;
          if(s.mojoh5._prev.height !== undefined)
            s.height = (s.height - s.mojoh5._prev.height) * lagOffset + s.mojoh5._prev.height;
        }
        if(i.scale){
          s.mojoh5._cur.sx = s.scale.x;
          s.mojoh5._cur.sy = s.scale.y;
          if(s.mojoh5._prev.sx !== undefined)
            s.scale.x = (s.scale.x - s.mojoh5._prev.sx) * lagOffset + s.mojoh5._prev.sx;
          if(s.mojoh5._prev.sy !== undefined)
            s.scale.y = (s.scale.y - s.mojoh5._prev.sy) * lagOffset + s.mojoh5._prev.sy;
        }
        if(i.alpha){
          s.mojoh5._cur.alpha = s.alpha;
          if(s.mojoh5._prev.alpha !== undefined)
            s.alpha = (s.alpha - s.mojoh5._prev.alpha) * lagOffset + s.mojoh5._prev.alpha;
        }
      }
      _.doseq(s.children, s=> _interpolateSprite(lagOffset,s));
    }
    /**
     * @private
     * @function
     */
    function _render(lagOffset=1){
      let i=Mojo.interpolateConfig();
      if(is.obj(i))
        _.doseq(Mojo.stage.children, s=> _interpolateSprite(lagOffset, s));
      Mojo.ctx.render(Mojo.stage);
      if(is.obj(i))
        _.doseq(Mojo.stage.children, _restore);
    }

    _.conj(_bgTasks, Mojo.Effects, Mojo.Sprites, Mojo.Input);

    //------------------------------------------------------------------------
    //enhancements
    Mojo.start= () => { _runGameLoop(); };
    Mojo.pause= () => { _paused = true; };
    Mojo.resume = () => { _paused = false; };

    return (_ModuleInited=true) && Mojo;
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.GameLoop"]=function(Mojo){
    return _ModuleInited ? Mojo : _module(Mojo,[])
  }
  ;
})(this);


