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
      _sceneFuncs= {};
    let _=Mojo.u,
      is=Mojo.is;
    function _sceneid(id) { return "scene::"+id; }
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
      }
      remove(c) {
        if(c && _.has(this.children,c)) this.removeChild(c);
      }
      insert(c,pos) {
        Mojo.Sprites.extend(c);
        if(pos >=0 && pos < this.children.length) {
          this.addChildAt(c,pos);
        } else {
          this.addChild(c);
        }
      }
      dispose() {
        this.removeChildren();
      }
      update(dt) {
        _.doseq(this.children,c => {
          c.step && c.step(dt);
        });
      }
      runOnce() {
        if(this._setup) {
          Mojo.Sprites.extend(this);
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
      _sceneFuncs[name]=[func, options||{}];
    };
    _S.replaceScene=function(name) {
      let len=Mojo.stage.children.length;
      if(len>0) {
        let c= Mojo.stage.getChildAt(len-1);
        c.dispose();
        Mojo.stage.removeChild(c);
      }
      return this.runScene(name);
    }
    /**
     * @public
     * @function
     */
    _S.removeScene=function(name) {
      let s= Mojo.stage.getChildByName(name);
      if(s) {
        s.dispose();
        Mojo.stage.removeChild(s);
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
        throw `Error: unknown scene id: ${name}`;
      if(is.obj(num)) {
        options = num;
        num = _.dissoc(options,"slot");
      }
      options = _.inject({},_s[1],options);
      if(is.undef(num))
        num= options["slot"] || -1;

      //clean up current?
      if(num >= 0 && num < Mojo.stage.children.length) {
        y= Mojo.stage.getChildAt(num);
        y && y.dispose();
        Mojo.stage.removeChild(y);
      }
      //create new
      y = new Scene(name, _s[0],_.inject(options,{slot: num}));
      //add to where?
      if(num >= 0 && num < Mojo.stage.children.length) {
        Mojo.stage.addChildAt(y,num);
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


