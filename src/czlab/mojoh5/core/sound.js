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
    /**
     * @module mojoh5/Sound
     */
    const {u:_, is}=gscope["io/czlab/mcfud/core"]();

    /** @ignore */
    function _make(_A,name, url){
      const s={
        soundNode: null,
        buffer: null,
        src: url,
        name: name,
        loop: false,
        playing: false,
        panValue: 0, //-1(left speaker) <--> 0 <----> 1(right speaker)
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
        gainNode: _A.ctx.createGain(),
        panNode: _A.ctx.createStereoPanner(),
        delayNode: _A.ctx.createDelay(),
        feedbackNode: _A.ctx.createGain(),
        filterNode: _A.ctx.createBiquadFilter(),
        convolverNode: _A.ctx.createConvolver(),
        play(){
          this.startTime = _A.ctx.currentTime;
          this.soundNode = _A.ctx.createBufferSource();
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
          this.panNode.connect(_A.ctx.destination);
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
        _stop(){
          if(this.playing)
            this.soundNode.stop(0)
        },
        pause(){
          this._stop();
          if(this.playing){
            this.playing = false;
            this.startOffset += _A.ctx.currentTime - this.startTime;
          }
        },
        playFrom(value){
          this._stop();
          this.startOffset = value;
          this.play();
        },
        restart(){
          this.playFrom(0)
        },
        setEcho(delayValue, feedbackValue, filterValue){
          this.feebackValue = _.or(feedbackValue,0.3);
          this.delayValue = _.or(delayValue,0.3);
          this.filterValue = _.or(filterValue,0);
          this.echo = true;
        },
        setReverb(duration, decay, reverse){
          let r= _A.ctx.sampleRate;
          let len= r * (duration || 2);
          let b= _A.ctx.createBuffer(2, len, r);
          this.reverb = true;
          this.reverbImpulse= b;
          for(let v,d=decay||2,
            cl= b.getChannelData(0),//left
            cr= b.getChannelData(1),//right
            i= reverse?(len-1):0;;){
            if(reverse){
              if(i<0)break;
            }else{
              if(i>=len)break;
            }
            v=Math.pow(1-i/len,d);
            cl[i]= v * (2*_.rand()-1);
            cr[i]= v * (2*_.rand()-1);
            reverse ? --i : ++i;
          }
        },
        fade(endValue, durationSecs){
          if(this.playing){
            this.gainNode.gain.linearRampToValueAtTime(this.gainNode.gain.value, _A.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(endValue, _A.ctx.currentTime + durationSecs)
          }
        },
        fadeIn(durationSecs){
          this.gainNode.gain.value = 0;
          this.fade(1, durationSecs)
        },
        fadeOut(durationSecs){
          this.fade(0, durationSecs)
        },
        get pan() { return this.panNode.pan.value },
        set pan(v) { this.panNode.pan.value = v },
        get volume() { return this.volumeValue },
        set volume(v) { this.gainNode.gain.value = v; this.volumeValue = v }
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
      decodeContent(name, url,blob, onLoad, onFail){
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
          this.decodeContent(url, xhr.response, onLoad, onFail)
        });
        xhr.send();
        return snd;
      }
    };

    /**Extend Mojo */
    Mojo.sound=function(fname){
      return SoundFiles[Mojo.assetPath(fname)] || _.assert(false, `${fname} not loaded.`)
    };

    return (Mojo.Sound= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sound"]=function(M){
      return M.Sound ? M.Sound : _module(M, {})
    };
  }

})(this);


