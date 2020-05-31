(function(global) {
  "use strict";
  let Mojo=global.Mojo, _= Mojo._;
  Mojo.Audio = function(Mo) {
    Mo.audio = {channels: [],
                active: {},
                play: function() {},
                channelMax:  Mo.options.channelMax || 10};

    Mo.hasWebAudio = (typeof AudioContext !== "undefined") ||
                     (typeof webkitAudioContext !== "undefined");

    if(Mo.hasWebAudio)
      Mo.audioContext = (typeof AudioContext !== "undefined") ? new AudioContext() : new window.webkitAudioContext();

    Mo.enableSound = () => {
      let hasTouch = ("ontouchstart" in global);
      if(Mo.hasWebAudio)
        Mo.audio.enableWebAudioSound();
      else
        Mo.audio.enableHTML5Sound();
      return Mo;
    };

    Mo.audio.enableWebAudioSound = function() {
      Mo.audio.type = "WebAudio";
      Mo.audio.soundID = 0;
      Mo.audio.playingSounds = {};
      Mo.audio.removeSound = (id) => {
        delete Mo.audio.playingSounds[id];
      };
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Mo.audio.play = function(s,options) {
        let now = _.now();
        // if this file is currently being debounced, don't do anything and just return
        if(Mo.audio.active[s] &&
           Mo.audio.active[s] > now) { return; }
        // If any options were passed in, check for a debounce,
        // which is the number of milliseconds to debounce this sound
        if(options && options['debounce'])
          Mo.audio.active[s] = now + options['debounce'];
        else
          delete Mo.audio.active[s];

        let soundID = ++Mo.audio.soundID;
        let source = Mo.audioContext.createBufferSource();
        source.buffer = Mo.asset(s);
        source.connect(Mo.audioContext.destination);
        if(options && options['loop']) {
          source.loop = true;
        } else {
          setTimeout(() => { Mo.audio.removeSound(soundID); }, source.buffer.duration * 1000);
        }
        source.assetName = s;
        source.start ? source.start(0) : source.noteOn(0);
        Mo.audio.playingSounds[soundID] = source;
      };

      Mo.audio.stop = (s) => {
        for(let key in Mo.audio.playingSounds) {
          let snd = Mo.audio.playingSounds[key];
          if(!s || s === snd.assetName)
            snd.stop ? snd.stop(0) : snd.noteOff(0);
        }
      };
    };

    Mo.audio.enableHTML5Sound = function() {
      Mo.audio.type = "HTML5";
      for (let i=0;i<Mo.audio.channelMax;++i) {
        Mo.audio.channels[i] = {};
        Mo.audio.channels[i]['channel'] = new Audio();
        Mo.audio.channels[i]['finished'] = -1;
      }
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Mo.audio.play = function(s,options) {
        let now = _.now();
        if(Mo.audio.active[s] &&
           Mo.audio.active[s] > now) { return; }
        if(options && options['debounce'])
          Mo.audio.active[s] = now + options['debounce'];
        else
          delete Mo.audio.active[s];
        // Find a free audio channel and play the sound
        for (let i=0;i<Mo.audio.channels.length;++i) {
          // Check the channel is either finished or not looping
          if (!Mo.audio.channels[i]['loop'] &&
              Mo.audio.channels[i]['finished'] < now) {
            Mo.audio.channels[i]['channel'].src = Mo.asset(s).src;
            // If we're looping - just set loop to true to prevent this channcel
            // from being used.
            if(options && options['loop']) {
              Mo.audio.channels[i]['loop'] = true;
              Mo.audio.channels[i]['channel'].loop = true;
            } else {
              Mo.audio.channels[i]['finished'] = now + Mo.asset(s).duration*1000;
            }
            Mo.audio.channels[i]['channel'].load();
            Mo.audio.channels[i]['channel'].play();
            break;
          }
        }
      };

      // Stop a single sound asset or stop all sounds currently playing
      Mo.audio.stop = function(s) {
        let src = s ? Mo.asset(s).src : null;
        let tm = _.now();
        for (let i=0;i<Mo.audio.channels.length;++i) {
          if ((!src ||
               Mo.audio.channels[i]['channel'].src === src) &&
              (Mo.audio.channels[i]['loop'] ||
               Mo.audio.channels[i]['finished'] >= tm)) {
            Mo.audio.channels[i]['channel'].pause();
            Mo.audio.channels[i]['loop'] = false;
          }
        }
      };

    };

  };

})(this);


