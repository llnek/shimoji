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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const _M=window["io/czlab/mcfud/math"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            _G.offsetX = -Mojo.width / 2;
            _G.offsetY = -Mojo.height / 2;
            _G.scaleX=1;
            _G.scaleY=1;
            _G.selectedCellX=0;
            _G.selectedCellY=0;
            _G.startPanX = 0;
            _G.startPanY = 0;

            Mojo.on(["mousedown"],"onMouseDown",self);
            Mojo.on(["mouseup"],"onMouseUp",self);
            Mojo.on(["mousemove"],"onMouseMove",self);
            Mojo.on(["single.tap"],"onLeftClick",self);
            this.gfx=self.insert(_S.graphics());
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      dispose(){
        Mojo.off(["mousedown"],"onMouseDown",this);
        Mojo.off(["mouseup"],"onMouseUp",this);
        Mojo.off(["mousemove"],"onMouseMove",this);
        Mojo.off(["single.tap"],"onLeftClick",this);
      },
      onLeftClick(){
        // Draw selected cell
        // We can easily determine where the mouse is in world space. In fact we already
        // have this frame so just reuse the values
        _G.selectedCellX = int(_G.mouseWorldXAfterZoom);
        _G.selectedCellY = int(_G.mouseWorldYAfterZoom);
      },
      onMouseMove(){
        if(_G.mdown){
          // ...as the mouse moves, the screen location changes. Convert this screen
          // coordinate change into world coordinates to implement the pan. Simples.
          _G.offsetX -= (Mojo.mouse.x- _G.startPanX) / _G.scaleX;
          _G.offsetY -= (Mojo.mouse.y- _G.startPanY) / _G.scaleY;

          // Start "new" pan for next epoch
          _G.startPanX = Mojo.mouse.x;
          _G.startPanY = Mojo.mouse.y;
        }
      },
      onMouseUp(){
        _G.mdown=false;
      },
      onMouseDown(){
        // need to capture the screen pos when the user starts to pan...
        _G.startPanX = Mojo.mouse.x;
        _G.startPanY = Mojo.mouse.y;
        _G.mdown=true;
      },
      worldToScreen(fWorldX, fWorldY){
        return [int((fWorldX - _G.offsetX) * _G.scaleX),
                int((fWorldY - _G.offsetY) * _G.scaleY)]
      },
      screenToWorld(nScreenX, nScreenY){
        return [nScreenX / _G.scaleX + _G.offsetX,
                nScreenY / _G.scaleY + _G.offsetY]
      },
      doDrawLine(x1,y1,x2,y2,c){
        this.g.gfx.lineStyle(1, _S.color(c));
        this.g.gfx.moveTo(x1,y1);
        this.g.gfx.lineTo(x2,y2);
      },
      postUpdate(dt){
        this.g.gfx.clear();

        let fMouseX = Mojo.mouse.x,
            fMouseY = Mojo.mouse.y;

        // For zoom, we need to extract the location of the cursor before and after the
        // scale is changed. Here we get the cursor and translate into world space...
        let [fMouseWorldX_BeforeZoom, fMouseWorldY_BeforeZoom]= this.screenToWorld(fMouseX, fMouseY);
        if(_I.keyDown(_I.Q)){
          _G.scaleX *= 1.1;//1.001;
          _G.scaleY *= 1.1;//1.001;
        }
        if(_I.keyDown(_I.A)){
          _G.scaleX *=0.9;// 0.999;
          _G.scaleY *= 0.9;//0.999;
        }
        // ...now get the location of the cursor in world space again - It will have changed
        // because the scale has changed, but we can offset our world now to fix the zoom
        // location in screen space, because we know how much it changed laterally between
        // the two spatial scales. Neat huh? ;-)
        let [fMouseWorldX_AfterZoom, fMouseWorldY_AfterZoom]= this.screenToWorld(fMouseX, fMouseY);
        _G.offsetX += (fMouseWorldX_BeforeZoom - fMouseWorldX_AfterZoom);
        _G.offsetY += (fMouseWorldY_BeforeZoom - fMouseWorldY_AfterZoom);

        _G.mouseWorldXAfterZoom= fMouseWorldX_AfterZoom;
        _G.mouseWorldYAfterZoom= fMouseWorldY_AfterZoom;

        // Clip
        let [fWorldLeft, fWorldTop]=this.screenToWorld(0, 0);
        let [fWorldRight, fWorldBottom]=this.screenToWorld(Mojo.width,Mojo.height);
        function sine(x){ return Math.sin(x) }
        // Draw Main Axes a 10x10 Unit Grid
        // Draw 10 horizontal lines
        let nLinesDrawn = 0;
        for(let y = 0; y <= 10; ++y){
          if(y >= fWorldTop && y <= fWorldBottom){
            let sx = 0, sy = y;
            let ex = 10, ey = y;
            let [pixel_sx, pixel_sy]=this.worldToScreen(sx, sy);
            let [pixel_ex, pixel_ey]=this.worldToScreen(ex, ey);
            this.doDrawLine(pixel_sx, pixel_sy, pixel_ex, pixel_ey, "white");
            ++nLinesDrawn;
          }
        }
        // Draw 10 vertical lines
        for(let x = 0; x <= 10; ++x){
          if(x >= fWorldLeft && x <= fWorldRight){
            let sx = x, sy = 0;
            let ex = x, ey = 10;
            let [pixel_sx, pixel_sy]=this.worldToScreen(sx, sy);
            let [pixel_ex, pixel_ey]=this.worldToScreen(ex, ey);
            this.doDrawLine(pixel_sx, pixel_sy, pixel_ex, pixel_ey, "white");
            ++nLinesDrawn;
          }
        }
        // Draw selected cell by filling with red circle. Convert cell coords
        // into screen space, also scale the radius
        let [cx,cy]= this.worldToScreen(_G.selectedCellX + 0.5, _G.selectedCellY + 0.5);
        let cr = 0.3 * _G.scaleX;
        this.g.gfx.beginFill(_S.color("red"));
        this.g.gfx.drawCircle(cx, cy, cr);
        //DrawString(2, 2, L"Lines Drawn: " + to_wstring(nLinesDrawn));

        // Draw Chart
        let fWorldPerScreenWidthPixel = (fWorldRight - fWorldLeft) / Mojo.width;
        let fWorldPerScreenHeightPixel = (fWorldBottom - fWorldTop) / Mojo.height;
        let [opx, opy]=this.worldToScreen(fWorldLeft-fWorldPerScreenWidthPixel,
          -sine((fWorldLeft - fWorldPerScreenWidthPixel) - 5) + 5);
        for(let x = fWorldLeft; x < fWorldRight; x+=fWorldPerScreenWidthPixel){
          let y = -sine(x - 5) + 5;
          let [px,py]= this.worldToScreen(x, y);
          this.doDrawLine(opx, opy, px, py, "green");
          opx = px;
          opy = py;
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roomba.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


/*
 * A main loop useful for games and other animated applications.
 */
(function(root) {

    // The amount of time (in milliseconds) to simulate each time update()
    // runs. See `MainLoop.setSimulationTimestep()` for details.
    let simulationTimestep = 1000 / 60,
        // The cumulative amount of in-app time that hasn't been simulated yet.
        // See the comments inside animate() for details.
        frameDelta = 0,
        // The timestamp in milliseconds of the last time the main loop was run.
        // Used to compute the time elapsed between frames.
        lastFrameTimeMs = 0,
        fps = 60,
        // A factor that affects how heavily to weight more recent seconds'
        // performance when calculating the average frames per second. Valid values
        // range from zero to one inclusive. Higher values result in weighting more
        // recent seconds more heavily.
        fpsAlpha = 0.9,
        // The minimum duration between updates to the frames-per-second estimate.
        // Higher values increase accuracy, but result in slower updates.
        fpsUpdateInterval = 1000,
        // The timestamp (in milliseconds) of the last time the `fps` moving average was updated.
        lastFpsUpdate = 0,
        // The number of frames delivered since the last time the `fps` moving
        // average was updated (i.e. since `lastFpsUpdate`).
        framesSinceLastFpsUpdate = 0,
        // The number of times update() is called in a given frame. This is only
        // relevant inside of animate(), but a reference is held externally so that
        // this variable is not marked for garbage collection every time the main
        // loop runs.
        numUpdateSteps = 0,
        // The minimum amount of time in milliseconds that must pass since the last
        // frame was executed before another frame can be executed. The
        // multiplicative inverse caps the FPS (the default of zero means there is no cap).
        minFrameDelay = 0,
        // Whether the main loop is running.
        running = false,
        // `true` if `MainLoop.start()` has been called and the most recent time it
        // was called has not been followed by a call to `MainLoop.stop()`. This is
        // different than `running` because there is a delay of a few milliseconds
        // after `MainLoop.start()` is called before the application is considered
        // "running." This delay is due to waiting for the next frame.
        started = false,
        // Whether the simulation has fallen too far behind real time.
        // Specifically, `panic` will be set to `true` if too many updates occur in
        // one frame. This is only relevant inside of animate(), but a reference is
        // held externally so that this variable is not marked for garbage
        // collection every time the main loop runs.
        panic = false,
        // The object most likely to have `requestAnimationFrame` attached is
        // `window`, if it's available in this environment. Otherwise, fall back to
        // the root context.
        windowOrRoot = typeof window === 'object' ? window : root,
        // The function that runs the main loop. The unprefixed version of
        // `window.requestAnimationFrame()` is available in all modern browsers
        // now, but node.js doesn't have it, so fall back to timers. The polyfill
        // is adapted from the MIT-licensed
        // https://github.com/underscorediscovery/realtime-multiplayer-in-html5
        requestAnimationFrame = windowOrRoot.requestAnimationFrame || (function(){
          let lastTimestamp = Date.now(), now, timeout;
          return function(callback){
            now = Date.now();
            // The next frame should run no sooner than the simulation allows,
            // but as soon as possible if the current frame has already taken
            // more time to run than is simulated in one timestep.
            timeout = Math.max(0, simulationTimestep - (now - lastTimestamp));
            lastTimestamp = now + timeout;
            return setTimeout(function() {
                callback(now + timeout);
            }, timeout);
          }
        })(),
        // The function that stops the main loop. The unprefixed version of
        // `window.cancelAnimationFrame()` is available in all modern browsers now,
        // but node.js doesn't have it, so fall back to timers.
        cancelAnimationFrame = windowOrRoot.cancelAnimationFrame || clearTimeout,
        // In all major browsers, replacing non-specified functions with NOOPs
        // seems to be as fast or slightly faster than using conditions to only
        // call the functions if they are specified. This is probably due to empty
        // functions being optimized away. http://jsperf.com/noop-vs-condition
        NOOP = function() {},
        // A function that runs at the beginning of the main loop.
        // See `MainLoop.setBegin()` for details.
        begin = NOOP,
        // A function that runs updates (i.e. AI and physics).
        // See `MainLoop.setUpdate()` for details.
        update = NOOP,
        // A function that draws things on the screen.
        // See `MainLoop.setDraw()` for details.
        draw = NOOP,
        // A function that runs at the end of the main loop.
        // See `MainLoop.setEnd()` for details.
        end = NOOP,
        // The ID of the currently executing frame. Used to cancel frames when stopping the loop.
        rafHandle;

  root.MainLoop={
    getSimulationTimestep(){
      return simulationTimestep
    },
    setSimulationTimestep(t){
      simulationTimestep = t;
      return this;
    },
    getFPS(){
      return fps
    },
    getMaxAllowedFPS(){
      return 1000 / minFrameDelay
    },
    setMaxAllowedFPS(fps){
      if(fps === undefined){
        fps = Infinity;
      }
      if (fps == 0){
        this.stop();
      }else{
        // Dividing by Infinity returns zero.
        minFrameDelay = 1000 / fps;
      }
      return this;
    },
    resetFrameDelta(){
      let oldFrameDelta = frameDelta;
      frameDelta = 0;
      return oldFrameDelta;
    },
    setBegin(fun){
      begin = fun || begin;
      return this;
    },
    setUpdate(fun){
      update = fun || update;
      return this;
    },
    setDraw(fun){
      draw = fun || draw;
      return this;
    },
    setEnd(fun){
      end = fun || end;
      return this;
    },
    start(){
      if(!started){
        started = true;
        // In the main loop, draw() is called after update(), so if we
        // entered the main loop immediately, we would never render the
        // initial state before any updates occur. Instead, we run one
        // frame where all we do is draw, and then start the main loop with
        // the next frame.
        rafHandle = requestAnimationFrame(function(timestamp){
          // Render the initial state before any updates occur.
          draw(1);
          // The application isn't considered "running" until the
          // application starts drawing.
          running = true;
          // Reset variables that are used for tracking time so that we
          // don't simulate time passed while the application was paused.
          lastFrameTimeMs = timestamp;
          lastFpsUpdate = timestamp;
          framesSinceLastFpsUpdate = 0;
          // Start the main loop.
          rafHandle = requestAnimationFrame(animate);
        });
      }
      return this;
    },
    stop(){
      running = false;
      started = false;
      cancelAnimationFrame(rafHandle);
      return this;
    },
    isRunning(){
      return running
    },
  };

  function animate(dt){
    // Run the loop again the next time the browser is ready to render.
    // We set rafHandle immediately so that the next frame can be canceled
    // during the current frame.
    rafHandle = requestAnimationFrame(animate);
    // Throttle the frame rate (if minFrameDelay is set to a non-zero value by
    // `MainLoop.setMaxAllowedFPS()`).
    if(dt < lastFrameTimeMs + minFrameDelay){
      return
    }
    // frameDelta is the cumulative amount of in-app time that hasn't been
    // simulated yet. Add the time since the last frame. We need to track total
    // not-yet-simulated time (as opposed to just the time elapsed since the
    // last frame) because not all actually elapsed time is guaranteed to be
    // simulated each frame. See the comments below for details.
    frameDelta += dt - lastFrameTimeMs;
    lastFrameTimeMs = dt;

    // Run any updates that are not dependent on time in the simulation. See
    // `MainLoop.setBegin()` for additional details on how to use this.
    begin(dt, frameDelta);
    // Update the estimate of the frame rate, `fps`. Approximately every
    // second, the number of frames that occurred in that second are included
    // in an exponential moving average of all frames per second. This means
    // that more recent seconds affect the estimated frame rate more than older
    // seconds.
    if(dt > lastFpsUpdate + fpsUpdateInterval){
      // Compute the new exponential moving average.
      fps =// Divide the number of frames since the last FPS update by the
           // amount of time that has passed to get the mean frames per second
           // over that period. This is necessary because slightly more than a
           // second has likely passed since the last update.
           fpsAlpha * framesSinceLastFpsUpdate * 1000 / (dt - lastFpsUpdate) + (1 - fpsAlpha) * fps;
      // Reset the frame counter and last-updated timestamp since their
      // latest values have now been incorporated into the FPS estimate.
      lastFpsUpdate = dt;
      framesSinceLastFpsUpdate = 0;
    }
    // Count the current frame in the next frames-per-second update. This
    // happens after the previous section because the previous section
    // calculates the frames that occur up until `timestamp`, and `timestamp`
    // refers to a time just before the current frame was delivered.
    framesSinceLastFpsUpdate++;

    /*
     * A naive way to move an object along its X-axis might be to write a main
     * loop containing the statement `obj.x += 10;` which would move the object
     * 10 units per frame. This approach suffers from the issue that it is
     * dependent on the frame rate. In other words, if your application is
     * running slowly (that is, fewer frames per second), your object will also
     * appear to move slowly, whereas if your application is running quickly
     * (that is, more frames per second), your object will appear to move
     * quickly. This is undesirable, especially in multiplayer/multi-user
     * applications.
     *
     * One solution is to multiply the speed by the amount of time that has
     * passed between rendering frames. For example, if you want your object to
     * move 600 units per second, you might write `obj.x += 600 * delta`, where
     * `delta` is the time passed since the last frame. (For convenience, let's
     * move this statement to an update() function that takes `delta` as a
     * parameter.) This way, your object will move a constant distance over
     * time. However, at low frame rates and high speeds, your object will move
     * large distances every frame, which can cause it to do strange things
     * such as move through walls. Additionally, we would like our program to
     * be deterministic. That is, every time we run the application with the
     * same input, we would like exactly the same output. If the time between
     * frames (the `delta`) varies, our output will diverge the longer the
     * program runs due to accumulated rounding errors, even at normal frame
     * rates.
     *
     * A better solution is to separate the amount of time simulated in each
     * update() from the amount of time between frames. Our update() function
     * doesn't need to change; we just need to change the delta we pass to it
     * so that each update() simulates a fixed amount of time (that is, `delta`
     * should have the same value each time update() is called). The update()
     * function can be run multiple times per frame if needed to simulate the
     * total amount of time passed since the last frame. (If the time that has
     * passed since the last frame is less than the fixed simulation time, we
     * just won't run an update() until the the next frame. If there is
     * unsimulated time left over that is less than our timestep, we'll just
     * leave it to be simulated during the next frame.) This approach avoids
     * inconsistent rounding errors and ensures that there are no giant leaps
     * through walls between frames.
     *
     * That is what is done below. It introduces a new problem, but it is a
     * manageable one: if the amount of time spent simulating is consistently
     * longer than the amount of time between frames, the application could
     * freeze and crash in a spiral of death. This won't happen as long as the
     * fixed simulation time is set to a value that is high enough that
     * update() calls usually take less time than the amount of time they're
     * simulating. If it does start to happen anyway, see `MainLoop.setEnd()`
     * for a discussion of ways to stop it.
     *
     * Additionally, see `MainLoop.setUpdate()` for a discussion of performance
     * considerations.
     *
     * Further reading for those interested:
     *
     * - http://gameprogrammingpatterns.com/game-loop.html
     * - http://gafferongames.com/game-physics/fix-your-timestep/
     * - https://gamealchemist.wordpress.com/2013/03/16/thoughts-on-the-javascript-game-loop/
     * - https://developer.mozilla.org/en-US/docs/Games/Anatomy
     */
    numUpdateSteps = 0;
    while(frameDelta >= simulationTimestep){
      update(simulationTimestep);
      frameDelta -= simulationTimestep;
      if(++numUpdateSteps >= 240){
        panic = true;
        break;
      }
    }
    /*
     * Render the screen. We do this regardless of whether update() has run
     * during this frame because it is possible to interpolate between updates
     * to make the frame rate appear faster than updates are actually
     * happening. See `MainLoop.setDraw()` for an explanation of how to do
     * that.
     *
     * We draw after updating because we want the screen to reflect a state of
     * the application that is as up-to-date as possible. (`MainLoop.start()`
     * draws the very first frame in the application's initial state, before
     * any updates have occurred.) Some sources speculate that rendering
     * earlier in the requestAnimationFrame callback can get the screen painted
     * faster; this is mostly not true, and even when it is, it's usually just
     * a trade-off between rendering the current frame sooner and rendering the
     * next frame later.
     *
     * See `MainLoop.setDraw()` for details about draw() itself.
     */
    draw(frameDelta / simulationTimestep);
    // Run any updates that are not dependent on time in the simulation. See
    // `MainLoop.setEnd()` for additional details on how to use this.
    end(fps, panic);
    panic = false;
  }

})(this);
