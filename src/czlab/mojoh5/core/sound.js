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
  //export--------------------------------------------------------------------
  let window;
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }else{
    window=global;
  }

  if(!window ||
    !window.AudioContext)
    throw `Fatal: audio requires browser env and AudioContext.`;

  /**
   * @private
   * @function
   */
  function _module(Mojo){
    const AUDIO_EXTS= ["mp3", "ogg", "wav", "webm"];
    const _A={ ctx: new window.AudioContext() };
    const Core=global["io.czlab.mcfud.core"]();
    const _=Core.u;
    const is=Core.is;
    const actx=_A.ctx;
    /**
     * @private
     * @function
     */
    function _initNoise(duration, decay, reverse){
      let len= actx.sampleRate * duration;
      let buf= actx.createBuffer(2, len, actx.sampleRate);
      let cl= buf.getChannelData(0);//left
      let cr= buf.getChannelData(1);//right
      function _noise(i){
        let a=Math.pow(1-i/len,decay);
        cl[i] = a * (2*_.rand() - 1);
        cr[i] = a * (2*_.rand() - 1);
      }
      if(reverse){
        for(let i=len-1;i>=0;--i) _noise(i)
      }else{
        for(let i=0;i<len;++i) _noise(i)
      }
      return buf;
    }
    /**
     * @public
     * @function
     */
    _A.makeSound=function(source){
      return {
        gainNode: actx.createGain(),
        panNode: actx.createStereoPanner(),
        delayNode: actx.createDelay(),
        feedbackNode: actx.createGain(),
        filterNode: actx.createBiquadFilter(),
        convolverNode: actx.createConvolver(),
        soundNode: null,
        buffer: null,
        source: source,
        loop: false,
        playing: false,
        loadHandler: undefined,
        panValue: 0,
        volumeValue: 1,
        startTime: 0,
        startOffset: 0,
        playbackRate: 1,
        echo: false,
        delayValue: 0.3,
        feebackValue: 0.3,
        filterValue: 0,
        reverb: false,
        reverbImpulse: null,
        play(){
          this.startTime = actx.currentTime;
          this.soundNode = actx.createBufferSource();
          this.soundNode.buffer = this.buffer;
          this.soundNode.playbackRate.value = this.playbackRate;
          this.soundNode.connect(this.gainNode);
          if(!this.reverb){
            this.gainNode.connect(this.panNode);
          }else{
            this.gainNode.connect(this.convolverNode);
            this.convolverNode.connect(this.panNode);
            this.convolverNode.buffer = this.reverbImpulse;
          }
          this.panNode.connect(actx.destination);
          if(this.echo){
            this.feedbackNode.gain.value = this.feebackValue;
            this.delayNode.delayTime.value = this.delayValue;
            this.filterNode.frequency.value = this.filterValue;
            this.delayNode.connect(this.feedbackNode);
            if(this.filterValue > 0){
              this.feedbackNode.connect(this.filterNode);
              this.filterNode.connect(this.delayNode);
            }else{
              this.feedbackNode.connect(this.delayNode);
            }
            this.gainNode.connect(this.delayNode);
            this.delayNode.connect(this.panNode);
          }
          this.soundNode.loop = this.loop;
          this.soundNode.start(0, this.startOffset % this.buffer.duration);
          this.playing = true;
        },
        pause(){
          if(this.playing){
            this.soundNode.stop(0);
            this.startOffset += actx.currentTime - this.startTime;
            this.playing = false;
          }
        },
        restart(){
          if(this.playing)
            this.soundNode.stop(0);
          this.startOffset = 0;
          this.play();
        },
        playFrom(value){
          if(this.playing)
            this.soundNode.stop(0);
          this.startOffset = value;
          this.play();
        },
        setEcho(delayValue, feedbackValue, filterValue){
          this.feebackValue = _.or(feedbackValue,0.3);
          this.delayValue = _.or(delayValue,0.3);
          this.filterValue = _.or(filterValue,0);
          this.echo = true;
        },
        setReverb(duration, decay, reverse){
          this.reverbImpulse = _initNoise(_.or(duration,2), _.or(decay,2), reverse, actx);
          this.reverb = true;
        },
        fade(endValue, durationSecs){
          if(this.playing){
            this.gainNode.gain.linearRampToValueAtTime(this.gainNode.gain.value, actx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(endValue, actx.currentTime + durationSecs);
          }
        },
        fadeIn(durationSecs){
          this.gainNode.gain.value = 0;
          this.fade(1, durationSecs);
        },
        fadeOut(durationSecs){
          this.fade(0, durationSecs);
        },
        get pan() { return this.panNode.pan.value },
        set pan(v) { this.panNode.pan.value = v; },
        get volume() { return this.volumeValue },
        set volume(v) { this.gainNode.gain.value = v; this.volumeValue = v }
      }
    };
    /**
     * @public
     * @function
     */
    _A.decodeSound=function(snd, xhr, onLoad, onFail){
      actx.decodeAudioData(xhr.response,
                           buf => onLoad(snd.source, snd.buffer=buf),
                           err=> onFail && onFail(snd.source, err));
      return snd;
    };
    /**
     * @public
     * @function
     */
    _A.loadSound=function(snd, onLoad, onFail){
      let xhr = new XMLHttpRequest();
      xhr.open("GET", snd.source, true);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", () => this.decodeSound(snd, xhr, onLoad, onFail));
      xhr.send();
      return snd;
    };

    return (Mojo.Sound= _A)
  };
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Sound"]=function(Mojo){
    return Mojo.Sound ? Mojo.Sound : _module(Mojo)
  };

}(this));


