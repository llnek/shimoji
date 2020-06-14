(function(global, undefined) {

  "use strict";
  let Mojo=global.Mojo, _= Mojo._;

  Mojo.Audio = function(Mo) {

    let _channels= [],
        _actives= _.jsMap(),
        _channelMax= Mo.options.channelMax || 10;

    let _soundId=1,
        _audioSounds= _.jsMap(),
        _delSound= (id) => { _.dissoc(_audioSounds,id); };

    Mo.audio = {play: function() {},
                stop: function() {}};

    Mo.hasWebAudio = typeof AudioContext !== "undefined" ||
                     typeof webkitAudioContext !== "undefined";

    if(Mo.hasWebAudio)
      Mo.audioContext = (typeof AudioContext !== "undefined")
                        ? new AudioContext() : new window.webkitAudioContext();

    let _debounceQ= (now,s,options) => {
      // if currently being debounced, do nothing
      if(_actives.has(s) &&
         _actives.get(s) > now)
      return true;

      // if debounce - millisecs to debounce this sound
      if(options && options["debounce"])
        _.assoc(_actives,
                s, now + options["debounce"]);
      else
        _.dissoc(_actives,s);

      return false;
    };

    let _enableWebAudioSound = function() {
      Mo.audio.type = "WebAudio";
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Mo.audio.play = function(s,options) {
        let now = _.now();
        if (!_debounceQ(now, s,options)) {
          let sid = _soundId++,
              src = Mo.audioContext.createBufferSource();
          src.buffer = Mo.asset(s);
          src.connect(Mo.audioContext.destination);
          if(options && options["loop"])
            source.loop = true;
          else
            _.timer(() => {_delSound(sid);},
                    src.buffer.duration * 1000);
          src.assetName = s;
          src.start ? src.start(0) : src.noteOn(0);
          _.assoc(_audioSounds, sid, src);
        }
      };

      Mo.audio.stop = (s) => {
        _.doseq(_audioSounds, (snd,k) => {
          if(!s || s === snd.assetName)
            snd.stop ? snd.stop(0) : snd.noteOff(0);
        });
      };
    };

    let _enableHTML5Sound = function() {
      Mo.audio.type = "HTML5";
      for(let i=0;i<_channelMax;++i) {
        _channels.push({finished: -1,
                        loop: false,
                        channel: new Audio()});
      }
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Mo.audio.play = function(s,options) {
        let now = _.now();
        if (!_debounceQ(now,s,options))
          _.some(_channels, (c) => {
            if (!c["loop"] && c["finished"] < now) {
              c["channel"].src = Mo.asset(s).src;
              if(options && options["loop"]) {
                c["loop"]=true;
                c["channel"].loop = true;
              } else
                c["finished"]= now + Mo.asset(s).duration*1000;
              c["channel"].load();
              c["channel"].play();
              return true;
            }
          });
      };

      Mo.audio.stop = function(s) {
        let src,tm = _.now();
        if(s)
          src= Mo.asset(s).src;
        _.doseq(_channels, (c) => {
          if((!src || c["channel"].src === src) &&
             (c["loop"] || c["finished"] >= tm)) {
            c["loop"]= false;
            c["channel"].pause();
          }
        });
      };
    };

    Mo.enableSound = () => {
      Mo.hasWebAudio ? _enableWebAudioSound() : _enableHTML5Sound();
      return Mo;
    };

  };

})(this);


