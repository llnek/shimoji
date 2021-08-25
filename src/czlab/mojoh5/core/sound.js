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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  if(!gscope.AudioContext){
    throw "Fatal: no audio."
  }

  const CON=console,
        MFL=Math.floor;

  /**Create the module.
   */
  function _module(Mojo,SoundFiles){

    const {ute:_, is}=Mojo;

    /**
     * @module mojoh5/Sound
     */

    const _actives=new Map();
    let _sndCnt=1;

    /** debounce */
    function _debounce(s,now,interval){
      let rc;
      if(_actives.has(s) &&
         _actives.get(s) > now){
        rc=true
      }else{
        if(!interval)
          _actives.delete(s)
        else
          _actives.set(s, now+interval)
      }
      return rc;
    }

    /** @ignore */
    function _make(_A,name, url){
      let _pan=0;
      let _vol=1;
      const s={
        sids:new Map(),
        buffer:null,
        loop:false,
        src: url,
        name: name,
        //-1(left speaker)
        //1(right speaker)
        get pan(){ return _pan },
        set pan(v){ _pan= v },
        get volume(){ return _vol },
        set volume(v){ _vol=v },
        play(){
          if(!Mojo.Sound.sfx()){return}
          const now = _.now();
          const s= this.name;
          if(!_debounce(s,now)){
            let sid = _sndCnt++,
                w=this.buffer.duration*1000,
                g=_A.ctx.createGain(),
                p=_A.ctx.createStereoPanner(),
                src = _A.ctx.createBufferSource();
            src.buffer = this.buffer;
            src.connect(g);
            g.connect(p);
            p.connect(_A.ctx.destination);
            if(this.loop){
              src.loop = true;
            }else{
              _.delay(w,()=> this.sids.delete(sid))
            }
            p.pan.value = _pan;
            g.gain.value = _vol;
            src.start(0);
            this.sids.set(sid,src);
          }
        },
        stop(){
          this.sids.forEach(s=> s.stop(0));
          this.sids.length=0;
        }
      };
      return SoundFiles[name]=s;
    };

    const _$={
      ctx: new gscope.AudioContext(),
      _mute:0,
      init(){
        _.delay(0,()=>{
          if(this.ctx.state == "suspended"){
            this.ctx.resume()
          }
        })
      },
      /**Check if sound is on or off.
       * @memberof module:mojoh5/Sound
       * @return {boolean}
       */
      sfx(){
        return this._mute===0
      },
      /**Turn sound off.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      mute(){
        this._mute=1;
        return this;
      },
      /**Turn sound on.
       * @memberof module:mojoh5/Sound
       * @return {object}
       */
      unmute(){
        this._mute=0;
        return this;
      },
      /**Decode these sound bytes.
       * @memberof module:mojoh5/Sound
       * @param {string} name
       * @param {any} url
       * @param {any} blob
       * @param {function} onLoad
       * @param {function} [onFail]
       * @return {object}
       */
      decodeData(name, url,blob, onLoad, onFail){
        let snd= _make(this,name, url);
        this.ctx.decodeAudioData(blob, b=>{ onLoad(snd.buffer=b);
                                            CON.log(`decoded sound file:${url}`); },
                                       e=> { onFail && onFail(url,e) });
        return snd;
      },
      /**Decode the sound file at this url.
       * @memberof module:mojoh5/Sound
       * @param {string} name
       * @param {any} url
       * @param {function} onLoad
       * @param {function} [onFail]
       * @return {object}
       */
      decodeUrl(name, url, onLoad, onFail){
        let xhr= new XMLHttpRequest();
        let snd= _make(this,name, url);
        xhr.open("GET", url, true);
        xhr.responseType="arraybuffer";
        xhr.addEventListener("load", ()=>{
          this.decodeData(url, xhr.response, onLoad, onFail)
        });
        xhr.send();
        return snd;
      }
    };

    /**Extend Mojo */
    Mojo.sound=function(fname){
      return SoundFiles[Mojo.assetPath(fname)] ||
             _.assert(false, `Sound: ${fname} not loaded.`)
    };

    return (Mojo.Sound= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sound"]=function(M){
      return M.Sound ? M.Sound : _module(M, {})
    };
  }

})(this);


