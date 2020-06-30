(function(global, undefined) {
  "use strict";
  let MojoH5=global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded.";

  /**
   * @public
   * @function
   */
  MojoH5.Audio = function(Mojo) {

    let _ = Mojo.u,
        _channels= [],
        _soundId=1,
        _actives= _.jsMap(),
        _audioSounds= _.jsMap(),
        _channelMax= Mojo.o.channelMax || 10,
        _delSound= (id) => { _.dissoc(_audioSounds,id); };

    /**
     * @public
     * @property {object}
     */
    Mojo.audio = {play: function() {},
                  stop: function() {}};

    /**
     * @public
     * @property {boolean}
     */
    Mojo.hasWebAudio = typeof AudioContext !== "undefined" ||
                       typeof webkitAudioContext !== "undefined";

    if(Mojo.hasWebAudio)
      Mojo.audioContext = (typeof AudioContext !== "undefined")
                          ? new AudioContext() : new window.webkitAudioContext();

    let _debounceQ= (now,s,options) => {
      // if currently being debounced, do nothing
      if(_actives.has(s) &&
         _actives.get(s) > now)
      return true;

      // if debounce - millisecs to debounce this sound
      if(options && options["debounce"])
        _.assoc(_actives, s, now+options["debounce"]);
      else
        _.dissoc(_actives,s);

      return false;
    };

    /**
     * @public
     * @function
     */
    Mojo.enableWebAudioSound = function() {
      Mojo.audio.type = "WebAudio";
      //Play a single sound, optionally debounced
      //to prevent repeated plays in a short time
      Mojo.audio.play = function(s,options) {
        let now = _.now();
        if (!_debounceQ(now, s,options)) {
          let sid = _soundId++,
              src = Mojo.audioContext.createBufferSource();
          src.buffer = Mojo.asset(s);
          src.connect(Mojo.audioContext.destination);
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

      Mojo.audio.stop = (s) => {
        _.doseq(_audioSounds, (snd,k) => {
          if(!s || s === snd.assetName)
            snd.stop ? snd.stop(0) : snd.noteOff(0);
        });
      };
    };

    /**
     * @public
     * @function
     */
    Mojo.enableHTML5Sound = function() {
      Mojo.audio.type = "HTML5";
      for(let i=0;i<_channelMax;++i)
        _channels.push({finished: -1,
                        loop: false,
                        channel: new Audio()});
      // Play a single sound, optionally debounced
      // to prevent repeated plays in a short time
      Mojo.audio.play = function(s,options) {
        let now = _.now();
        if (!_debounceQ(now,s,options))
          _.some(_channels, (c) => {
            if (!c["loop"] && c["finished"] < now) {
              c["channel"].src = Mojo.asset(s).src;
              if(options && options["loop"]) {
                c["loop"]=true;
                c["channel"].loop = true;
              } else
                c["finished"]= now + Mojo.asset(s).duration*1000;
              c["channel"].load();
              c["channel"].play();
              return true;
            }
          });
      };

      Mojo.audio.stop = function(s) {
        let src,tm = _.now();
        if(s)
          src= Mojo.asset(s).src;
        _.doseq(_channels, (c) => {
          if((!src || c["channel"].src === src) &&
             (c["loop"] || c["finished"] >= tm)) {
            c["loop"]= false;
            c["channel"].pause();
          }
        });
      };
    };

    return Mojo;
  };

})(this);


