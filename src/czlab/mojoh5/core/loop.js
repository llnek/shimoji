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
    throw `Fatal: gameloop module requires browser env.`;

  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.GameLoop"]=function(Mojo){
    if(_ModuleInited){return Mojo}
    const Core=global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const is=Core.is;
    const _libsToUpdate= [];
    let _paused = false;
    let _startTime = Date.now();
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
      //run only during preloading of assets
      Mojo.loaderState && Mojo.loaderState();
      //various libs that are required to run every frame
      _libsToUpdate.forEach(m => m.update(dt));
      //game content stuff
      if(!_paused)
        _.doseq(Mojo.stage.children, scene=>{
          scene.update && scene.update(dt);
        });
    }
    /**
     * @private
     * @function
     */
    function _savePrevProps(){
      let i=Mojo.interpolateProps();
      function save(s){
        if(i.position){ s.mojoh5._prevX = s.x; s.mojoh5._prevY = s.y }
        if(i.rotation){ s.mojoh5._prevRotation = s.rotation }
        if(i.size){ s.mojoh5._prevWidth = s.width; s.mojoh5._prevHeight = s.height }
        if(i.scale){ s.mojoh5._prevScaleX = s.scale.x; s.mojoh5._prevScaleY = s.scale.y }
        if(i.alpha){ s.mojoh5._prevAlpha = s.alpha }
        if(i.tile){
          if(s.mojoh5.tilePos){
            s.mojoh5._prevTilePosX = s.mojoh5.tilePos[0];
            s.mojoh5._prevTilePosY = s.mojoh5.tilePos[1];
          }
          if(s.mojoh5.tileScale){
            s.mojoh5._prevTileScaleX = s.mojoh5.tileScale[0];
            s.mojoh5._prevTileScaleY = s.mojoh5.tileScale[1];
          }
        }
        if(s.children)
          for(let i=0; i<s.children.length; ++i)
            save(s.children[i]);
      };
      for(let i=0; i<Mojo.stage.children.length; ++i)
        save(Mojo.stage.children[i]);
    }
    /**
     * @private
     * @function
     */
    function _restoreProps(s){
      let i=Mojo.interpolateProps();
      if(i.position){ s.x = s.mojoh5._currentX; s.y = s.mojoh5._currentY }
      if(i.rotation){ s.rotation = s.mojoh5._currentRotation }
      if(i.size &&
        (_.inst(Mojo.p.Sprite,s) ||
          _.inst(Mojo.p.ASprite,s))){
        s.width = s.mojoh5._currentWidth;
        s.height = s.mojoh5._currentHeight;
      }
      if(i.scale){ s.scale.x = s.mojoh5._curScaleX; s.scale.y = s.mojoh5._curScaleY }
      if(i.alpha){ s.alpha = s.mojoh5._curAlpha }
      if(i.tile){
        if(s.mojoh5.tilePos){
          s.mojoh5.tilePos[0] = s.mojoh5._curTilePosX;
          s.mojoh5.tilePos[1] = s.mojoh5._curTilePosY;
        }
        if(s.mojoh5.tileScale){
          s.mojoh5.tileScale[0] = s.mojoh5._currentTileScaleX;
          s.mojoh5.tileScale[1] = s.mojoh5._currentTileScaleY;
        }
      }
      if(s.children)
        for(let i=0; i<s.children.length; ++i)
          _restoreProps(s.children[i]);
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
        _savePrevProps();
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
      if(Mojo.o.fps === undefined){
        //not defined, so update as fast as possible
        _update(dt);
        _render();
      }else if(Mojo.o.rfps === undefined){
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
      let i=Mojo.interpolateProps();
      if(i.position){
        s.mojoh5._currentX = s.x;
        s.mojoh5._currentY = s.y;
        if(s.mojoh5._prevX !== undefined)
          s.x = (s.x - s.mojoh5._prevX) * lagOffset + s.mojoh5._prevX;
        if(s.mojoh5._prevY !== undefined)
          s.y = (s.y - s.mojoh5._prevY) * lagOffset + s.mojoh5._prevY;
      }
      if(i.rotation){
        s.mojoh5._currentRotation = s.rotation;
        if(s.mojoh5._prevRotation !== undefined)
          s.rotation = (s.rotation - s.mojoh5._prevRotation) * lagOffset + s.mojoh5._prevRotation;
      }
      if(i.size){
        if(_.inst(Mojo.p.Sprite,s) ||
          _.inst(Mojo.p.ASprite,s)){
          s.mojoh5._currentWidth = s.width;
          s.mojoh5._currentHeight = s.height;
          if(s.mojoh5._prevWidth !== undefined)
            s.width = (s.width - s.mojoh5._prevWidth) * lagOffset + s.mojoh5._prevWidth;
          if(s.mojoh5._prevHeight !== undefined)
            s.height = (s.height - s.mojoh5._prevHeight) * lagOffset + s.mojoh5._prevHeight;
        }
      }
      if(i.scale){
        s.mojoh5._curScaleX = s.scale.x;
        s.mojoh5._curScaleY = s.scale.y;
        if(s.mojoh5._prevScaleX !== undefined)
          s.scale.x = (s.scale.x - s.mojoh5._prevScaleX) * lagOffset + s.mojoh5._prevScaleX;
        if(s.mojoh5._prevScaleY !== undefined)
          s.scale.y = (s.scale.y - s.mojoh5._prevScaleY) * lagOffset + s.mojoh5._prevScaleY;
      }
      if(i.alpha){
        s.mojoh5._curAlpha = s.alpha;
        if(s.mojoh5._prevAlpha !== undefined)
          s.alpha = (s.alpha - s.mojoh5._prevAlpha) * lagOffset + s.mojoh5._prevAlpha;
      }
      if(i.tile){
        if(s.mojoh5.tilePos){
          s.mojoh5._curTilePosX = s.mojoh5.tilePos[0];
          s.mojoh5._curTilePosY = s.mojoh5.tilePos[1];
          if(s.mojoh5._prevTilePosX !== undefined)
            s.mojoh5.tilePos[0] = (s.mojoh5.tilePos[0] - s.mojoh5._prevTilePosX) * lagOffset + s.mojoh5._prevTilePosX;
          if(s.mojoh5._prevTilePosY !== undefined)
            s.mojoh5.tilePos[1] = (s.mojoh5.tilePos[1] - s.mojoh5._prevTilePosY) * lagOffset + s.mojoh5._prevTilePosY;
        }
        if(s.mojoh5.tileScale){
          s.mojoh5._currentTileScaleX = s.mojoh5.tileScale[0];
          s.mojoh5._currentTileScaleY = s.mojoh5.tileScale[1];
          if(s.mojoh5._prevTileScaleX !== undefined)
            s.mojoh5.tileScale[0] = (s.mojoh5.tileScale[0] - s.mojoh5._prevTileScaleX) * lagOffset + s.mojoh5._prevTileScaleX;
          if(s.mojoh5._prevTileScaleY !== undefined)
            s.mojoh5.tileScale[1] = (s.mojoh5.tileScale[1] - s.mojoh5._prevTileScaleY) * lagOffset + s.mojoh5._prevTileScaleY;
        }
      }
      if(s.children)
        for(let j=0; j< s.children.length; ++j)
          _interpolateSprite(lagOffset,s.children[j]);
    }
    /**
     * @private
     * @function
     */
    function _render(lagOffset=1){
      if(Mojo.interpolate)
        for(let i=0; i< Mojo.stage.children.length; ++i)
          _interpolateSprite(lagOffset, Mojo.stage.children[i]);
      Mojo.ctx.render(Mojo.stage);
      if(Mojo.interpolate)
        for(let i=0; i<Mojo.stage.children.length; ++i)
          _restoreProps(Mojo.stage.children[i]);
    }

    _.conj(_libsToUpdate, Mojo.Tweens, Mojo.Dust, Mojo.Sprites, Mojo.Input);

    //------------------------------------------------------------------------
    //enhancements
    Mojo.start= () => { _runGameLoop(); };
    Mojo.pause= () => { _paused = true; };
    Mojo.resume = () => { _paused = false; };

    return (_ModuleInited=true) && Mojo;
  };

})(this);


