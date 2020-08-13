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
   * @private
   * @function
   */
  function _fixSetTarget(param) {
    if(param && !param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime;
  }
  /**
   * @public
   * @module
   */
  MojoH5.Sound=function(Mojo) {
    const _=Mojo.u,
      is=Mojo.is;
    //some crazy polyfill
    if(window.hasOwnProperty("webkitAudioContext") &&
      !window.hasOwnProperty('AudioContext')) {
      let AudioContext = webkitAudioContext,
        ACP=AudioContext.prototype;
      window.AudioContext=AudioContext;
      if(!ACP.hasOwnProperty("createGain"))
        ACP.createGain=ACP.createGainNode;
      if(!ACP.hasOwnProperty("createDelay"))
        ACP.createDelay=ACP.createDelayNode;
      if(!ACP.hasOwnProperty("createScriptProcessor"))
        ACP.createScriptProcessor = ACP.createJavaScriptNode;
      if(!ACP.hasOwnProperty("createPeriodicWave"))
        ACP.createPeriodicWave = ACP.createWaveTable;
      ACP.__createGain=ACP.createGain;
      ACP.createGain=function(){
        let node = this.__createGain();
        _fixSetTarget(node.gain);
        return node;
      };
      ACP.__createDelay = ACP.createDelay;
      ACP.createDelay = function(maxDelay) {
        let node = maxDelay ? this.__createDelay(maxDelay) : this.__createDelay();
        _fixSetTarget(node.delayTime);
        return node;
      };
      ACP.__createBufferSource = ACP.createBufferSource;
      ACP.createBufferSource = function() {
        let node=this.__createBufferSource();
        if(!node.start) {
          node.start=function(when, offset, duration) {
            if(offset || duration)
              this.noteGrainOn(when || 0, offset, duration);
            else
              this.noteOn(when || 0);
          };
        } else {
          node.__start = node.start;
          node.start = function(when, offset, duration) {
            if(typeof duration !== "undefined")
              node.__start(when || 0, offset, duration);
            else
              node.__start(when || 0, offset || 0);
          };
        }
        if(!node.stop) {
          node.stop = function (when) {
            this.noteOff(when || 0);
          };
        } else {
          node.__stop = node.stop;
          node.stop = function (when) {
            node.__stop(when || 0);
          };
        }
        _fixSetTarget(node.playbackRate);
        return node;
      };
      ACP.__createDynamicsCompressor = ACP.createDynamicsCompressor;
      ACP.createDynamicsCompressor = function() {
        let node = this.__createDynamicsCompressor();
        _fixSetTarget(node.threshold);
        _fixSetTarget(node.knee);
        _fixSetTarget(node.ratio);
        _fixSetTarget(node.reduction);
        _fixSetTarget(node.attack);
        _fixSetTarget(node.release);
        return node;
      };
      ACP.__createBiquadFilter = ACP.createBiquadFilter;
      ACP.createBiquadFilter = function() {
        let node = this.__createBiquadFilter();
        _fixSetTarget(node.frequency);
        _fixSetTarget(node.detune);
        _fixSetTarget(node.Q);
        _fixSetTarget(node.gain);
        return node;
      };
      if(ACP.hasOwnProperty("createOscillator")) {
        ACP.__createOscillator = ACP.createOscillator;
        ACP.createOscillator = function() {
          let node = this.__createOscillator();
          if(!node.start) {
            node.start = function(when) {
              this.noteOn(when || 0);
            };
          } else {
            node.__start = node.start;
            node.start = function (when) {
              node.__start(when || 0);
            };
          }
          if(!node.stop) {
            node.stop = function(when) {
              this.noteOff(when || 0);
            };
          } else {
            node.__stop = node.stop;
            node.stop = function (when) {
              node.__stop(when || 0);
            };
          }
          if(!node.setPeriodicWave)
            node.setPeriodicWave = node.setWaveTable;
          _fixSetTarget(node.frequency);
          _fixSetTarget(node.detune);
          return node;
        };
      }
    }
    if(window.hasOwnProperty("webkitOfflineAudioContext") &&
      !window.hasOwnProperty("OfflineAudioContext")) {
      window.OfflineAudioContext = webkitOfflineAudioContext;
    }

    const AUDIO_EXTS= ["mp3", "ogg", "wav", "webm"];
    const _A= {
      ctx: new window.AudioContext()
    },
      actx=_A.ctx;
    /**
     * @private
     * @function
     */
    function _decodeAudio(o, xhr, loadHandler, failHandler) {
      actx.decodeAudioData(
        xhr.response,
        (buf) => {
          o.buffer = buf;
          o.hasLoaded = true;
          loadHandler && loadHandler(o.source);
        },
        (err) => {
          failHandler && failHandler(o.source, err);
        }
      );
    }
    /**
     *The `makeSound` and `soundEffect` functions uses `impulseResponse`  to help create an optional reverb effect.
     *It simulates a model of sound reverberation in an acoustic space which
     *a convolver node can blend with the source sound. Make sure to include this function along with `makeSound`
     *and `soundEffect` if you need to use the reverb feature.
     *
     * @private
     * @function
     */
    function _impulseResponse(duration, decay, reverse, actx) {
      let length = actx.sampleRate * duration,
        //Create an audio buffer (an empty sound container) to store the reverb effect.
        impulse = actx.createBuffer(2, length, actx.sampleRate),
        //Use `getChannelData` to initialize empty arrays to store sound data for
        //the left and right channels.
        left = impulse.getChannelData(0),
        right = impulse.getChannelData(1);
        //Loop through each sample-frame and fill the channel
        //data with random noise.
      for(let n,i=0; i<length; ++i) {
        n= reverse ? length - i : i;
        //Fill the left and right channels with random white noise which
        //decays exponentially.
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      }
      return impulse;
    }
    /**
     * @public
     * @function
     */
    _A.makeSound=function(source, loadHandler, shouldLoadSound, xhr, failHandler) {
      let o = {
        volumeNode: actx.createGain()
      };
      o.panNode= actx.createStereoPanner ? actx.createStereoPanner()
                                         : actx.createPanner();
      o.delayNode = actx.createDelay();
      o.feedbackNode = actx.createGain();
      o.filterNode = actx.createBiquadFilter();
      o.convolverNode = actx.createConvolver();
      o.soundNode = null;
      o.buffer = null;
      o.source = source;
      o.loop = false;
      o.playing = false;
      //The function that should run when the sound is loaded.
      o.loadHandler = undefined;
      //Values for the `pan` and `volume` getters/setters.
      o.panValue = 0;
      o.volumeValue = 1;
      //Values to help track and set the start and pause times.
      o.startTime = 0;
      o.startOffset = 0;
      //Set the playback rate.
      o.playbackRate = 1;
      //Echo properties.
      o.echo = false;
      o.delayValue = 0.3;
      o.feebackValue = 0.3;
      o.filterValue = 0;
      //Reverb properties
      o.reverb = false;
      o.reverbImpulse = null;
      //The sound object's methods.
      o.play=function() {
        o.startTime = actx.currentTime;
        o.soundNode = actx.createBufferSource();
        o.soundNode.buffer = o.buffer;
        o.soundNode.playbackRate.value = this.playbackRate;
        //Connect the sound to the pan, connect the pan to the
        //volume, and connect the volume to the destination.
        o.soundNode.connect(o.volumeNode);
        //If there's no reverb, bypass the convolverNode
        if(!o.reverb) {
          o.volumeNode.connect(o.panNode);
        } else {
          //If there is reverb, connect the `convolverNode` and apply
          //the impulse response
          o.volumeNode.connect(o.convolverNode);
          o.convolverNode.connect(o.panNode);
          o.convolverNode.buffer = o.reverbImpulse;
        }
        //Connect the `panNode` to the destination to complete the chain.
        o.panNode.connect(actx.destination);
        if(o.echo) {
          o.feedbackNode.gain.value = o.feebackValue;
          o.delayNode.delayTime.value = o.delayValue;
          o.filterNode.frequency.value = o.filterValue;
          o.delayNode.connect(o.feedbackNode);
          if (o.filterValue > 0) {
            o.feedbackNode.connect(o.filterNode);
            o.filterNode.connect(o.delayNode);
          } else {
            o.feedbackNode.connect(o.delayNode);
          }
          //Capture the sound from the main node chain, send it to the
          //delay loop, and send the final echo effect to the `panNode` which
          //will then route it to the destination.
          o.volumeNode.connect(o.delayNode);
          o.delayNode.connect(o.panNode);
        }
        o.soundNode.loop = o.loop;
        //Finally, use the `start` method to play the sound.
        //The start time will either be `0`,
        //or a later time if the sound was paused.
        o.soundNode.start(
          0, o.startOffset % o.buffer.duration);

        o.playing = true;
      };
      o.pause = function() {
        if(o.playing) {
          o.soundNode.stop(0);
          o.startOffset += actx.currentTime - o.startTime;
          o.playing = false;
        }
      };
      o.restart = function() {
        if (o.playing) {
          o.soundNode.stop(0);
        }
        o.startOffset = 0;
        o.play();
      };
      o.playFrom = function(value) {
        if (o.playing) {
          o.soundNode.stop(0);
        }
        o.startOffset = value;
        o.play();
      };
      o.setEcho = function(delayValue, feedbackValue, filterValue) {
        if(delayValue === undefined) delayValue = 0.3;
        if(feedbackValue === undefined) feedbackValue = 0.3;
        if(filterValue === undefined) filterValue = 0;
        o.delayValue = delayValue;
        o.feebackValue = feedbackValue;
        o.filterValue = filterValue;
        o.echo = true;
      };
      o.setReverb = function(duration, decay, reverse) {
        if(duration === undefined) duration = 2;
        if(decay === undefined) decay = 2;
        if(reverse === undefined) reverse = false;
        o.reverbImpulse = _impulseResponse(duration, decay, reverse, actx);
        o.reverb = true;
      };
      //A general purpose `fade` method for fading sounds in or out.
      //The first argument is the volume that the sound should
      //fade to, and the second value is the duration, in seconds,
      //that the fade should last.
      o.fade = function(endValue, durationInSeconds) {
        if(o.playing) {
          o.volumeNode.gain.linearRampToValueAtTime(
            o.volumeNode.gain.value, actx.currentTime
          );
          o.volumeNode.gain.linearRampToValueAtTime(
            endValue, actx.currentTime + durationInSeconds
          );
        }
      };
      //Fade a sound in, from an initial volume level of zero.
      o.fadeIn = function(durationInSeconds) {
        //Set the volume to 0 so that you can fade
        //in from silence
        o.volumeNode.gain.value = 0;
        o.fade(1, durationInSeconds);
      };
      //Fade a sound out, from its current volume level to zero.
      o.fadeOut = function (durationInSeconds) {
        o.fade(0, durationInSeconds);
      };
      Object.defineProperties(o, {
        volume: _.pdef({
          get() { return o.volumeValue; },
          set(v) {
            o.volumeNode.gain.value = v;
            o.volumeValue = v;
          } }),
        //The pan node uses the high-efficiency stereo panner, if it's
        //available. But, because this is a new addition to the
        //WebAudio spec, it might not be available on all browsers.
        //So the code checks for this and uses the older 3D panner
        //if 2D isn't available.
        pan: _.pdef({
          get() {
            return actx.createStereoPanner
              ? o.panNode.pan.value : o.panValue; },
          set(v) {
            if(!actx.createStereoPanner) {
              //Panner objects accept x, y and z coordinates for 3D
              //sound. However, because we're only doing 2D left/right
              //panning we're only interested in the x coordinate,
              //the first one. However, for a natural effect, the z
              //value also has to be set proportionately.
              let x = v,
                y = 0, z = 1 - Math.abs(x);
              o.panNode.setPosition(x, y, z);
              o.panValue = v;
            } else {
              o.panNode.pan.value = v;
            }
          } })
      });

      if(shouldLoadSound)
        this.loadSound(o, source, loadHandler, failHandler);

      if(xhr)
        _decodeAudio(o, xhr, loadHandler, failHandler);

      return o;
    };
    /**
     * @public
     * @function
     */
    _A.loadSound=function(o, source, loadHandler, failHandler) {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", source, true);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", () => { _decodeAudio(o, xhr, loadHandler, failHandler); });
      xhr.send();
    };
    /**
     * frequencyValue,      //The sound's fequency pitch in Hertz
     *attack,              //The time, in seconds, to fade the sound in
     *decay,               //The time, in seconds, to fade the sound out
     *type,                //waveform type: "sine", "triangle", "square", "sawtooth"
     *volumeValue,         //The sound's maximum volume
     *panValue,            //The speaker pan. left: -1, middle: 0, right: 1
     *wait,                //The time, in seconds, to wait before playing the sound
     *pitchBendAmount,     //The number of Hz in which to bend the sound's pitch down
     *reverse,             //If `reverse` is true the pitch will bend up
     *randomValue,         //A range, in Hz, within which to randomize the pitch
     *dissonance,          //A value in Hz. It creates 2 dissonant frequencies above and below the target pitch
     *echo,                //An array: [delayTimeInSeconds, feedbackTimeInSeconds, filterValueInHz]
     *reverb,              //An array: [durationInSeconds, decayRateInSeconds, reverse]
     *timeout              //A number, in seconds, which is the maximum duration for sound effects
     * @public
     * @function
     */
    _A.soundEffect=function(options) {
      _.patch(options, {frequencyValue: 200, attack: 0, decay: 1, type: "sine", volumeValue: 1,
                        panValue: 0, wait: 0, pitchBendAmount: 0, reverse: false,
                        randomValue: 0, dissonance: 0, echo: undefined, reverb: undefined, timeout: undefined});
      //Create an oscillator, gain and pan nodes, and connect them
      //together to the destination
      let oscillator = actx.createOscillator(),
        volume = actx.createGain(),
        pan= actx.createStereoPanner ? actx.createStereoPanner() : actx.createPanner();

      oscillator.connect(volume);
      volume.connect(pan);
      pan.connect(actx.destination);
      //Set the supplied values
      volume.gain.value = options.volumeValue;
      if (actx.createStereoPanner) {
        pan.pan.value = options.panValue;
      } else {
        pan.setPosition(options.panValue, 0, 1 - Math.abs(options.panValue));
      }
      oscillator.type = type;
      //Optionally randomize the pitch. If the `randomValue` is greater
      //than zero, a random pitch is selected that's within the range
      //specified by `frequencyValue`. The random pitch will be either
      //above or below the target frequency.
      let frequency = options.frequencyValue;
      if(options.randomValue > 0) {
        frequency = _randXY(
          options.frequencyValue - options.randomValue/2,
          options.frequencyValue + options.randomValue/2
        );
      }
      oscillator.frequency.value = frequency;
      //Apply effects
      if(options.attack > 0) fadeIn(volume);
      fadeOut(volume);
      if(options.pitchBendAmount > 0) pitchBend(oscillator);
      if(options.echo) addEcho(volume);
      if(options.reverb) addReverb(volume);
      if(options.dissonance > 0) addDissonance();
      //Play the sound
      play(oscillator);
      //The helper functions:
      function addReverb(volumeNode) {
        let r=options.reverb,
          convolver = actx.createConvolver();
        convolver.buffer = _impulseResponse(r[0], r[1], r[2], actx);
        volumeNode.connect(convolver);
        convolver.connect(pan);
      }
      function addEcho(volumeNode) {
        let e=options.echo,
          feedback = actx.createGain(),
          delay = actx.createDelay(),
          filter = actx.createBiquadFilter();
        //Set their values (delay time, feedback time and filter frequency)
        delay.delayTime.value = e[0];
        feedback.gain.value = e[1];
        if(e[2]) filter.frequency.value = e[2];
        //Create the delay feedback loop, with
        //optional filtering
        delay.connect(feedback);
        if(e[2]) {
          feedback.connect(filter);
          filter.connect(delay);
        } else {
          feedback.connect(delay);
        }
        //Connect the delay loop to the oscillator's volume
        //node, and then to the destination
        volumeNode.connect(delay);
        //Connect the delay loop to the main sound chain's
        //pan node, so that the echo effect is directed to
        //the correct speaker
        delay.connect(pan);
      }
      //The `fadeIn` function
      function fadeIn(volumeNode) {
        //Set the volume to 0 so that you can fade
        //in from silence
        volumeNode.gain.value = 0;
        volumeNode.gain.linearRampToValueAtTime(
          0, actx.currentTime + options.wait
        );
        volumeNode.gain.linearRampToValueAtTime(
          options.volumeValue,
          actx.currentTime + options.wait + options.attack
        );
      }
      //The `fadeOut` function
      function fadeOut(volumeNode) {
        volumeNode.gain.linearRampToValueAtTime(
          options.volumeValue, actx.currentTime + options.attack + options.wait
        );
        volumeNode.gain.linearRampToValueAtTime(
          0, actx.currentTime + options.wait + options.attack + options.decay
        );
      }
      //The `pitchBend` function
      function pitchBend(oscillatorNode) {
        //If `reverse` is true, make the note drop in frequency. Useful for
        //shooting sounds
        //Get the frequency of the current oscillator
        let frequency = oscillatorNode.frequency.value;
        //If `reverse` is true, make the sound drop in pitch
        if(!options.reverse) {
          oscillatorNode.frequency.linearRampToValueAtTime(
            frequency,
            actx.currentTime + options.wait
          );
          oscillatorNode.frequency.linearRampToValueAtTime(
            frequency - options.pitchBendAmount,
            actx.currentTime + options.wait + options.attack + options.decay
          );
        } else {
          //If `reverse` is false, make the note rise in pitch. Useful for
          //jumping sounds
          oscillatorNode.frequency.linearRampToValueAtTime(
            frequency,
            actx.currentTime + options.wait
          );
          oscillatorNode.frequency.linearRampToValueAtTime(
            frequency + options.pitchBendAmount,
            actx.currentTime + options.wait + options.attack + options.decay
          );
        }
      }
      //The `addDissonance` function
      function addDissonance() {
        //Create two more oscillators and gain nodes
        let d1 = actx.createOscillator(),
          d2 = actx.createOscillator(),
          d1Volume = actx.createGain(),
          d2Volume = actx.createGain();
        //Set the volume to the `volumeValue`
        d1Volume.gain.value = options.volumeValue;
        d2Volume.gain.value = options.volumeValue;
        //Connect the oscillators to the gain and destination nodes
        d1.connect(d1Volume);
        d1Volume.connect(actx.destination);
        d2.connect(d2Volume);
        d2Volume.connect(actx.destination);
        //Set the waveform to "sawtooth" for a harsh effect
        d1.type = "sawtooth";
        d2.type = "sawtooth";
        //Make the two oscillators play at frequencies above and
        //below the main sound's frequency. Use whatever value was
        //supplied by the `dissonance` argument
        d1.frequency.value = frequency + options.dissonance;
        d2.frequency.value = frequency - options.dissonance;
        //Fade in/out, pitch bend and play the oscillators
        //to match the main sound
        if(options.attack > 0) {
          fadeIn(d1Volume);
          fadeIn(d2Volume);
        }
        if(options.decay > 0) {
          fadeOut(d1Volume);
          fadeOut(d2Volume);
        }
        if(options.pitchBendAmount > 0) {
          pitchBend(d1);
          pitchBend(d2);
        }
        if(options.echo) {
          addEcho(d1Volume);
          addEcho(d2Volume);
        }
        if(options.reverb) {
          addReverb(d1Volume);
          addReverb(d2Volume);
        }
        play(d1);
        play(d2);
      }
      //The `play` function
      function play(node) {
        node.start(actx.currentTime + options.wait);
        //Oscillators have to be stopped otherwise they accumulate in
        //memory and tax the CPU. They'll be stopped after a default
        //timeout of 2 seconds, which should be enough for most sound
        //effects. Override this in the `soundEffect` parameters if you
        //need a longer sound
        node.stop(actx.currentTime + options.wait + 2);
      }
    };

    return Mojo.Sound= _A;
  };

}(this));

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF



