/*global Quintus:false, AudioContext:false, window:false, module: false */

var quintusAudio = function(Quintus) {
  "use strict";
  Quintus.Audio = function(Q) {
    let _= Q._;
    Q.audio = {
      channels: [],
      channelMax:  Q.options.channelMax || 10,
      active: {},
      play: function() {}
    };

    Q.hasWebAudio = (typeof AudioContext !== "undefined") ||
                    (typeof webkitAudioContext !== "undefined");

    if(Q.hasWebAudio) {
      if(typeof AudioContext !== "undefined")
        Q.audioContext = new AudioContext();
      else
        Q.audioContext = new window.webkitAudioContext();
    }

    Q.enableSound = function() {
      let hasTouch = (typeof window !== "undefined") &&
                     !!('ontouchstart' in window);

      if(Q.hasWebAudio)
        Q.audio.enableWebAudioSound();
      else
        Q.audio.enableHTML5Sound();

      return Q;
    };

    Q.audio.enableWebAudioSound = function() {
      Q.audio.type = "WebAudio";
      Q.audio.soundID = 0;
      Q.audio.playingSounds = {};
      Q.audio.removeSound = (id) => {
        delete Q.audio.playingSounds[id];
      };
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Q.audio.play = function(s,options) {
        let now = _.now();
        // See if this audio file is currently being debounced, if
        // it is, don't do anything and just return
        if(Q.audio.active[s] &&
           Q.audio.active[s] > now) { return; }
        // If any options were passed in, check for a debounce,
        // which is the number of milliseconds to debounce this sound
        if(options && options['debounce'])
          Q.audio.active[s] = now + options['debounce'];
        else
          delete Q.audio.active[s];

        let soundID = Q.audio.soundID++;
        let source = Q.audioContext.createBufferSource();
        source.buffer = Q.asset(s);
        source.connect(Q.audioContext.destination);
        if(options && options['loop']) {
          source.loop = true;
        } else {
          setTimeout(() => {
            Q.audio.removeSound(soundID);
          }, source.buffer.duration * 1000);
        }
        source.assetName = s;
        if(source.start)
          source.start(0);
        else
          source.noteOn(0);
        Q.audio.playingSounds[soundID] = source;
      };

      Q.audio.stop = function(s) {
        for(let key in Q.audio.playingSounds) {
          let snd = Q.audio.playingSounds[key];
          if(!s || s === snd.assetName) {
            if(snd.stop)
              snd.stop(0);
            else
              snd.noteOff(0);
          }
        }
      };
    };

    Q.audio.enableHTML5Sound = function() {
      Q.audio.type = "HTML5";

      for (let i=0;i<Q.audio.channelMax;++i) {
        Q.audio.channels[i] = {};
        Q.audio.channels[i]['channel'] = new Audio();
        Q.audio.channels[i]['finished'] = -1;
      }

      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Q.audio.play = function(s,options) {
        let now = _.now();
        // See if this audio file is currently being debounced, if
        // it is, don't do anything and just return
        if(Q.audio.active[s] &&
           Q.audio.active[s] > now) { return; }
        // If any options were passed in, check for a debounce,
        // which is the number of milliseconds to debounce this sound
        if(options && options['debounce'])
          Q.audio.active[s] = now + options['debounce'];
        else
          delete Q.audio.active[s];

        // Find a free audio channel and play the sound
        for (let i=0;i<Q.audio.channels.length;++i) {
          // Check the channel is either finished or not looping
          if (!Q.audio.channels[i]['loop'] &&
              Q.audio.channels[i]['finished'] < now) {

            Q.audio.channels[i]['channel'].src = Q.asset(s).src;
            // If we're looping - just set loop to true to prevent this channcel
            // from being used.
            if(options && options['loop']) {
              Q.audio.channels[i]['loop'] = true;
              Q.audio.channels[i]['channel'].loop = true;
            } else {
              Q.audio.channels[i]['finished'] = now + Q.asset(s).duration*1000;
            }
            Q.audio.channels[i]['channel'].load();
            Q.audio.channels[i]['channel'].play();
            break;
          }
        }
      };

      // Stop a single sound asset or stop all sounds currently playing
      Q.audio.stop = function(s) {
        let src = s ? Q.asset(s).src : null;
        let tm = _.now();
        for (let i=0;i<Q.audio.channels.length;++i) {
          if ((!src ||
               Q.audio.channels[i]['channel'].src === src) &&
              (Q.audio.channels[i]['loop'] ||
               Q.audio.channels[i]['finished'] >= tm)) {
            Q.audio.channels[i]['channel'].pause();
            Q.audio.channels[i]['loop'] = false;
          }
        }
      };

    };

  };

};

if(typeof Quintus === 'undefined') {
  module.exports = quintusAudio;
} else {
  quintusAudio(Quintus);
}
