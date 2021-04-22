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

    /** @ignore */
    function _make(_A,name, url){
      const s={
        soundNode: null,
        buffer: null,
        src: url,
        name: name,
        loop: false,
        playing: false,
        vol: 1,
        start: 0,
        startOffset: 0,
        playbackRate: 1,
        gainNode: _A.ctx.createGain(),
        panNode: _A.ctx.createStereoPanner(),
        play(){
          this.start = _A.ctx.currentTime;
          this.soundNode = _A.ctx.createBufferSource();
          this.soundNode.buffer = this.buffer;
          this.soundNode.playbackRate.value = this.playbackRate;
          this.soundNode.connect(this.gainNode);
          this.gainNode.connect(this.panNode);
          this.panNode.connect(_A.ctx.destination);
          this.soundNode.loop = this.loop;
          this.soundNode.start(0, this.startOffset % this.buffer.duration);
          this.playing = true;
        },
        _stop(){
          if(this.playing)
            this.playing=false;
            this.soundNode.stop(0) },
        pause(){
          if(this.playing){
            this._stop();
            this.startOffset += _A.ctx.currentTime - this.start; } },
        playFrom(value){
          this.startOffset = value;
          this._stop();
          this.play();
        },
        restart(){
          this.playFrom(0) },
        get pan(){
          return this.panNode.pan.value },
        set pan(v){
          //-1(left speaker)
          //1(right speaker)
          this.panNode.pan.value = v },
        get volume(){
          return this.vol },
        set volume(v){
          this.vol=v;
          this.gainNode.gain.value = v; }
      };
      return SoundFiles[name]=s;
    };

    const _$={
      ctx: new gscope.AudioContext(),
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


