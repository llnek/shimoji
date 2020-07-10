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

(function(global, undefined) {
  "use strict";
  let MojoH5=global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
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
      //if currently being debounced, do nothing
      if(_actives.has(s) &&
         _actives.get(s) > now)
      return true;

      //if debounce - millisecs to debounce this sound
      if(!(options && options["debounce"]))
        _.dissoc(_actives,s);
      else
        _.assoc(_actives, s, now+options["debounce"]);

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
        let ass,now = _.now();
        if(!_debounceQ(now,s,options)) {
          ass=Mojo.asset(s,true);
          _.some(_channels, (c) => {
            if (!c["loop"] && c["finished"] < now) {
              c["channel"].src = ass.src;
              if(options && options["loop"]) {
                c["loop"]=true;
                c["channel"].loop = true;
              } else
                c["finished"]= now + ass.duration*1000;
              c["channel"].load();
              c["channel"].play();
              return true;
            }
          });
        }
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


