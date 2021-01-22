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

;(function(global){
  "use strict";
  let window;
  let _ModuleInited;
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }else if(typeof exports === "object" && exports){
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
    const {u:_, is}=global["io/czlab/mcfud/core"]();
    const _M=global["io/czlab/mcfud/math"]();
    let _startTime = Date.now();
    let _paused = false;
    //------------------------------------------------------------------------
    /**
     * @private
     * @function
     */
    function _update(dt){
      //process any backgorund tasks
      _bgTasks.forEach(m => m.update(dt));
      //game content stuff
      if(!_paused)
        Mojo.stageCS(s=> s.update && s.update(dt));
    }
    /** Save current values of selected attributes.
     * @private
     * @function
     */
    function _capture(){
      let i=Mojo.lerpConfig();
      function _clone(s){
        if(!s.m5.stage){
          function cap(e,ek,pk){
            pk=pk || ek;
            s.m5._prv[pk] = e[ek]
          }
          if(i.alpha) cap(s,"alpha");
          if(i.size)
            [[s,"width"], [s,"height"]].forEach(e=> cap(...e));
          if(i.scale)
            [[s.scale,"x","sx"],[s.scale,"y","sy"]].forEach(e=> cap(...e));
          if(i.pos)
            [[s,"x"], [s,"y"], [s,"rotation"]].concat(
              s.m5.tiling? [[s.tileScale,"x","tilingSX"],
                            [s.tileScale,"y","tilingSY"],
                            [s.tilePosition,"x","tilingX"],
                            [s.tilePosition,"y","tilingY"]] : []).forEach(e=>cap(...e));
        }
        s.children.forEach(_clone);
      }
      is.obj(i) && Mojo.stageCS(_clone);
    }
    /**
     * @private
     * @function
     */
    function _restore(s){
      let i=Mojo.lerpConfig();
      function _res(s){
        if(!s.m5.stage){
          function res(e,ek,ck){
            ck= ck || ek;
            e[ek]= s.m5._cur[ck]
          }
          if(i.alpha) res(s,"alpha");
          if(i.size &&
            (_.inst(Mojo.PXSprite,s) ||
             _.inst(Mojo.PXASprite,s)))
            [[s,"width"],[s,"height"]].forEach(e=>res(...e));
          if(i.scale)
            [[s.scale,"x","sx"],[s.scale,"y","sy"]].forEach(e=>res(...e));
          if(i.pos)
            [[s,"x"], [s,"y"], [s,"rotation"]].concat(
              s.m5.tiling? [[s.tileScale,"x","tilingSX"],
                            [s.tileScale,"y","tilingSY"],
                            [s.tilePosition,"x","tilingX"],
                            [s.tilePosition,"y","tilingY"]] : []).forEach(e=>res(...e));
        }
        _.doseq(s.children,_res);
      }
      is.obj(i) && _res(s);
    }
    /**
     * @private
     * @function
     */
    //~16.67ms
    const _frameTime = 1000/(Mojo.o.fps || 60);
    let _lag = 0;
    function _process(dt){
      let now=Date.now();
      let elapsed=now - _startTime;
      if(elapsed>1000) {elapsed = _frameTime}
      _startTime=now;
      _lag += elapsed;
      //frame by frame
      while(_lag >= _frameTime){
        _capture();
        _update(dt);
        _lag -= _frameTime;
      }
      _render(_lag/_frameTime);
    };
    /**
     * @private
     * @function
     */
    function _lerp(s,lag){
      let i=Mojo.lerpConfig();
      function _l(s){
        if(!s.m5.stage){
          function ip(lag,e,ek,sk){
            sk= sk || ek;
            s.m5._cur[sk] = e[ek];
            if(s.m5._prv[sk] !== undefined)
              e[ek] = _M.lerp(s.m5._prv[sk],e[ek],lag);
          }
          if(i.alpha) ip(lag,s,"alpha");
          if(i.scale)
            [[lag,s.scale,"x","sx"],
             [lag,s.scale,"y","sy"]].forEach(e=>ip(...e));
          if(i.size && (_.inst(Mojo.PXSprite,s) ||
                        _.inst(Mojo.PXASprite,s)))
            [[lag,s,"width"], [lag,s,"height"]].forEach(e=> ip(...e));
          if(i.pos)
            [[lag,s,"x"], [lag,s,"y"], [lag,s,"rotation"]].concat(
              s.m5.tiling? [[lag,s.tileScale,"x","tilingSX"],
                            [lag,s.tileScale,"y","tilingSY"],
                            [lag,s.tilePosition,"x","tilingX"],
                            [lag,s.tilePosition,"y","tilingY"]] : []).forEach(e=>ip(...e));
        }
        s.children.forEach(s=> _lerp(s,lag));
      }
      is.obj(i) && _l(s);
    }
    /**
     * @private
     * @function
     */
    function _render(lag=1.0){
      let i=Mojo.lerpConfig();
      is.obj(i) &&
        Mojo.stageCS(s=> _lerp(s,lag));
      Mojo.ctx.render(Mojo.stage);
      is.obj(i) &&
        Mojo.stageCS(_restore);
    }

    //------------------------------------------------------------------------
    //register these background tasks
    _.conj(_bgTasks, Mojo.FX, Mojo.Sprites, Mojo.Input);
    /**
     * @private
     * @var {number}
     */
    const _DT60=1/60;
    /**
     * @private
     * @var {number}
     */
    const _DT15=1/15;
    //------------------------------------------------------------------------
    //extensions
    _.inject(Mojo,{
      addBgTask(t){ _.conj(_bgTasks,t) },
      delBgTask(t){ _.disj(_bgTasks,t) },
      resume(){ _paused = false },
      pause(){ _paused = true },
      start(){
        let renderTime= this.o.rps ? 1000/this.o.rps|0 : 0;
        let limit= (this.o.maxFrameTime || 100)/1000;
        let lastFrame= _.now();
        let loopFrame=0;
        let renderStartTime = 0;
        let glwrapper=function(timeNow){
          let now= _.now();
          let dt= (now-lastFrame)/1000;
          ++loopFrame;
          window.requestAnimationFrame(glwrapper);
          //some upperbound to stop frame fast forwarding
          if(dt<0) dt= _DT60;
          if(dt>_DT15) dt= _DT15;
          //no fps so run as fast as possible
          if(!is.num(Mojo.o.fps)){
            _update(dt);
            _render();
          }else if(!is.num(Mojo.o.rps) ||
                   timeNow >= renderStartTime){
            _process(dt);
          }
          renderStartTime = timeNow + renderTime;
          lastFrame = now;
        };
        window.requestAnimationFrame(glwrapper);
      }
    });

    return (_ModuleInited=true) && Mojo;
  }
  /**
   * @public
   * @module
   */
  global["io/czlab/mojoh5/GameLoop"]=function(Mojo){
    return _ModuleInited ? Mojo : _module(Mojo,[])
  };
})(this);


