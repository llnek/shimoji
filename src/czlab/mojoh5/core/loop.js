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
  let window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Loop=function(Mojo) {
    const _=Mojo.u, is=Mojo.is, _libsToUpdate= [];
    let _paused = false,
      _startTime = Date.now(),
      _lag = 0,
      _lagOffset = 0,
      _renderStartTime = 0,
      _renderDuration=0,
      _frameDuration = 1000 / (Mojo.o.fps || 60);

    if(Mojo.o.rfps)
      _renderDuration = 1000 / Mojo.o.rfps;

    //------------------------------------------------------------------------
    /**
     * @private
     * @function
     */
    function _update(dt) {
      //run only during preloading of assets
      Mojo.loaderState && Mojo.loaderState();
      //various libs that are required to run every frame
      _libsToUpdate.forEach(m => m.update(dt));
      //game content stuff
      if(!_paused)
        _.doseq(Mojo.stage.children, (scene)=> {
          scene.update && scene.update(dt);
        });
    }
    /**
     * @private
     * @function
     */
    function _savePrevProps() {
      let i=Mojo.interpolateProps();
      let save= (s) => {
        if(i.position) { s._prevX = s.x; s._prevY = s.y; }
        if(i.rotation) { s._prevRotation = s.rotation; }
        if(i.size) { s._prevWidth = s.width; s._prevHeight = s.height; }
        if(i.scale) { s._prevScaleX = s.scale.x; s._prevScaleY = s.scale.y; }
        if(i.alpha) { s._prevAlpha = s.alpha; }
        if(i.tile) {
          if(s.tilePosition) {
            s._prevTilePosX = s.tilePosition.x;
            s._prevTilePosY = s.tilePosition.y;
          }
          if(s.tileScale) {
            s._prevTileScaleX = s.tileScale.x;
            s._prevTileScaleY = s.tileScale.y;
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
    function _restoreProps(s) {
      let i=Mojo.interpolateProps();
      if(i.position) { s.x = s._currentX; s.y = s._currentY; }
      if(i.rotation) { s.rotation = s._currentRotation; }
      if(i.size &&
        (_.inst(Mojo.p.Sprite,s) ||
          _.inst(Mojo.p.ASprite,s))) {
        s.width = s._currentWidth;
        s.height = s._currentHeight;
      }
      if(i.scale) { s.scale.x = s._curScaleX; s.scale.y = s._curScaleY; }
      if(i.alpha) { s.alpha = s._curAlpha; }
      if(i.tile) {
        if(s.tilePosition) {
          s.tilePosition.x = s._curTilePosX;
          s.tilePosition.y = s._curTilePosY;
        }
        if(s.tileScale) {
          s.tileScale.x = s._currentTileScaleX;
          s.tileScale.y = s._currentTileScaleY;
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
    function _interpolate(dt) {
      let current = Date.now(),
          elapsed = current - _startTime;
      if(elapsed > 1000) elapsed = _frameDuration;
      _startTime = current;
      _lag += elapsed;
      while(_lag >= _frameDuration) {
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
    function _gameLoop(ts, dt) {
      if(dt < 0) dt= 1.0/60;
      if(dt > 1.0/15) dt= 1.0/15;
      if(Mojo.o.fps === undefined) {
        //not defined, so update as fast as possible
        _update(dt);
        _render();
      } else if(Mojo.o.rfps === undefined) {
        //rendering time not defined, just run
        _interpolate(dt);
      } else if(ts >= _renderStartTime) {
        _interpolate(dt);
        _renderStartTime = ts + _renderDuration;
      }
    }
    function _runGameLoop() {
      let _limit= Mojo.o.maxFrameTime || 100;
      let _lastFrame = _.now();
      let _loopFrame = 0;
      Mojo.glwrapper = (ptInTime) => {
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
    function _interpolateSprite(lagOffset,s) {
      let i=Mojo.interpolateProps();
      if(i.position) {
        s._currentX = s.x;
        s._currentY = s.y;
        if(s._prevX !== undefined)
          s.x = (s.x - s._prevX) * lagOffset + s._prevX;
        if(s._prevY !== undefined)
          s.y = (s.y - s._prevY) * lagOffset + s._prevY;
      }
      if(i.rotation) {
        s._currentRotation = s.rotation;
        if(s._prevRotation !== undefined)
          s.rotation = (s.rotation - s._prevRotation) * lagOffset + s._prevRotation;
      }
      if(i.size) {
        if(_.inst(Mojo.p.Sprite,s) ||
          _.inst(Mojo.p.ASprite,s)) {
          s._currentWidth = s.width;
          s._currentHeight = s.height;
          if(s._prevWidth !== undefined)
            s.width = (s.width - s._prevWidth) * lagOffset + s._prevWidth;
          if(s._prevHeight !== undefined)
            s.height = (s.height - s._prevHeight) * lagOffset + s._prevHeight;
        }
      }
      if(i.scale) {
        s._curScaleX = s.scale.x;
        s._curScaleY = s.scale.y;
        if(s._prevScaleX !== undefined)
          s.scale.x = (s.scale.x - s._prevScaleX) * lagOffset + s._prevScaleX;
        if(s._prevScaleY !== undefined)
          s.scale.y = (s.scale.y - s._prevScaleY) * lagOffset + s._prevScaleY;
      }
      if(i.alpha) {
        s._curAlpha = s.alpha;
        if(s._prevAlpha !== undefined)
          s.alpha = (s.alpha - s._prevAlpha) * lagOffset + s._prevAlpha;
      }
      if(i.tile) {
        if(s.tilePosition !== undefined) {
          s._curTilePosX = s.tilePosition.x;
          s._curTilePosY = s.tilePosition.y;
          if(s._prevTilePosX !== undefined)
            s.tilePosition.x = (s.tilePosition.x - s._prevTilePosX) * lagOffset + s._prevTilePosX;
          if(s._prevTilePosY !== undefined)
            s.tilePosition.y = (s.tilePosition.y - s._prevTilePosY) * lagOffset + s._prevTilePosY;
        }
        if(s.tileScale !== undefined) {
          s._currentTileScaleX = s.tileScale.x;
          s._currentTileScaleY = s.tileScale.y;
          if(s._prevTileScaleX !== undefined)
            s.tileScale.x = (s.tileScale.x - s._prevTileScaleX) * lagOffset + s._prevTileScaleX;
          if(s._prevTileScaleY !== undefined)
            s.tileScale.y = (s.tileScale.y - s._prevTileScaleY) * lagOffset + s._prevTileScaleY;
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
    function _render(lagOffset=1) {
      if(Mojo.interpolate)
        for(let i=0; i< Mojo.stage.children.length; ++i)
          _interpolateSprite(lagOffset, Mojo.stage.children[i]);
      Mojo.ctx.render(Mojo.stage);
      if(Mojo.interpolate)
        for(let i=0; i<Mojo.stage.children.length; ++i)
          _restoreProps(Mojo.stage.children[i]);
    }

    _.conj(_libsToUpdate, Mojo.Tween, Mojo.Dust, Mojo.Sprites, Mojo.Input);

    //------------------------------------------------------------------------
    //enhancements
    Mojo.start= () => { _runGameLoop(); };
    Mojo.pause= () => { _paused = true; };
    Mojo.resume = () => { _paused = false; };

  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

