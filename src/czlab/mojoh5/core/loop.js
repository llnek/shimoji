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

;(function(gscope){

  "use strict";

  /**Extend Mojo with game loop capabilities.
   */
  function _module(Mojo,_bgTasks){

    const {ute:_, is}=Mojo;

    let _paused = false,
        _startTime = Date.now();

    //------------------------------------------------------------------------
    /**Code to run per tick.
     */
    function _update(dt){
      //process any backgorund tasks
      _bgTasks.forEach(m=> m.update && m.update(dt));
      //update all scenes
      if(!_paused)
        Mojo.stageCS(s=> s.update && s.update(dt));
      //render drawings
      Mojo.ctx.render(Mojo.stage);
    }

    //------------------------------------------------------------------------
    //register these background tasks
    _.conj(_bgTasks, Mojo.FX, Mojo.Sprites, Mojo.Input);

    /**1 sec div 60
     * @private
     * @var {number}
     */
    const _DT60=1/60;

    /**1 sec div 15
     * @private
     * @var {number}
     */
    const _DT15=1/15;

    /** @ignore */
    function _raf(cb){
      return gscope.requestAnimationFrame(cb) }

    //------------------------------------------------------------------------
    //extensions
    _.inject(Mojo,{
      delBgTask(t){ t && _.disj(_bgTasks,t) },
      addBgTask(t){ _.conj(_bgTasks,t) },
      resume(){ _paused = false },
      pause(){ _paused = true },
      start(){
        let diff=Mojo.frame;
        let last= _.now();
        let acc=0;
        let F=function(){
          let cur= _.now();
          let dt= (cur-last)/1000;
          //console.log(`frames per sec= ${Math.floor(1/dt)}`);
          //limit the time gap between calls
          if(dt>_DT15) dt= _DT15;
          for(acc += dt;
              acc >= diff;
              acc -= diff){ _update(dt); }
          last = cur;
          _raf(F);
        };
        return _raf(F);
      }
    });

    return Mojo;
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  let _ModuleInited;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only."
  }else{
    gscope["io/czlab/mojoh5/GameLoop"]=function(M){
      if(!_ModuleInited){
        _ModuleInited=true;
        _module(M,[]);
      }
      return M;
    }
  }

})(this);


