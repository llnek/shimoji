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
   * @public
   * @module
   */
  MojoH5.Scenes=function(Mojo) {
    const _S = {},
      _=Mojo.u,
      is=Mojo.is,
      _sceneFuncs= {};

    /**
     * @private
     * @function
     */
    function _sceneid(id) {
      return id.startsWith("scene::") ? id : "scene::"+id;
    }
    /**
     * @public
     * @class
     */
    class Scene extends Mojo.p.Container {
      constructor(id,func,options) {
        super();
        this.name= _sceneid(id);
        this._setup=func;
        //scenes are stages
        this._stage=true;
        this._options=options || {};
        Mojo.Sprites.extend(this);
      }
      remove(c) {
        if(c && _.has(this.children,c)) this.removeChild(c);
      }
      insert(c,pos) {
        if(pos !== undefined &&
          pos >= 0 && pos < this.children.length) {
          this.addChildAt(c,pos);
        } else {
          this.addChild(c);
        }
      }
      dispose() {
        this.removeChildren();
      }
      update(dt) {
        _.doseq(this.children, c => { c.step && c.step(dt); });
      }
      runOnce() {
        if(this._setup) {
          this._setup(this._options);
          this._setup=undefined;
        }
      }
    };
    /**
     * @public
     * @function
     */
    _S.defScene=function(name, func, options) {
      //add a new scene definition
      _sceneFuncs[name]=[func, options||{}];
    };
    function _killScene(s) {
      if(s) {
        s.dispose();
        Mojo.stage.removeChild(s);
      }
    }
    /**
     * @public
     * @function
     */
    _S.replaceScene=function(cur,name,options) {
      //console.log("replacescene: " + cur +", " + _sceneid(cur) + ", name= "+name);
      let c= Mojo.stage.getChildByName(_sceneid(cur));
      if(!c)
        throw `Error: no such scene: ${cur}`;
      let pos= Mojo.stage.getChildIndex(c);
      return this.runScene(name,pos,options);
    }
    /**
     * @public
     * @function
     */
    _S.removeScene=function(arg) {
      if(is.str(arg))
        _killScene(Mojo.stage.getChildByName(_sceneid(arg)));
      else if(arg) {
        _killScene(arg);
      }
    };
    /**
     * @public
     * @function
     */
    _S.removeScenes=function() {
      Mojo.stage.children.forEach(c => c.dispose());
      Mojo.stage.removeChildren();
    };
    /**
     * @public
     * @function
     */
    _S.runScene = function(name,num,options) {
      let y, _s = _sceneFuncs[name];
      if(!_s)
        throw `Error: unknown scene: ${name}`;
      if(is.obj(num)) {
        options = num;
        num = _.dissoc(options,"slot");
      }
      options = _.inject({},_s[1],options);
      if(is.undef(num))
        num= options["slot"] || -1;

      //create new
      y = new Scene(name, _s[0], options);
      //add to where?
      if(num >= 0 && num < Mojo.stage.children.length) {
        let cur= Mojo.stage.getChildAt(num);
        Mojo.stage.addChildAt(y,num);
        _killScene(cur);
      } else {
        Mojo.stage.addChild(y);
      }
      y.runOnce();
      return y;
    };

    _S.Scene=Scene;
    return Mojo.Scenes=_S;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

