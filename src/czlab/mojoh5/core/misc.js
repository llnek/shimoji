/* Licensed under the Apache License, Version 2.0 (the "License");
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

  /**Create the module. */
  function _module(Mojo){
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {EventBus, is, ute:_}=Mojo;
    const ABS=Math.abs,
          MFL=Math.floor;
    const WHITE=Mojo.Sprites.color("white");

    /**
     * @module mojoh5/2d
     */

    //https://github.com/dwmkerr/starfield/blob/master/starfield.js
    Mojo.Scenes.defScene("StarfieldBg",{
      setup(options){
        if(!options.minVel) options.minVel=15;
        if(!options.maxVel) options.maxVel=30;
        if(!options.count) options.count=100;
        if(!options.width) options.width=Mojo.width;
        if(!options.height) options.height=Mojo.height;

        let gfx= new Mojo.PXGraphics();
        let stars=[];

        gfx.m5={uuid:_.nextId()};

        this.g.fps= 1.0/options.fps;
        this.g.stars=stars;
        this.g.gfx=gfx;
        this.g.lag=0;

        for(let i=0; i<options.count; ++i){
          stars[i] = {x: _.rand()*options.width,
                      y: _.rand()*options.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(options.maxVel- options.minVel))+options.minVel};
        }
        this._draw();
        this.insert(gfx);
      },
      _draw(){
        this.g.gfx.clear();
        this.g.stars.forEach(s=>{
          this.g.gfx.beginFill(WHITE);
          this.g.gfx.drawRect(s.x,s.y,s.size,s.size);
          this.g.gfx.endFill();
        });
      },
      postUpdate(dt){
        this.g.lag +=dt;
        if(this.g.lag<this.g.fps){
          return;
        }else{
          this.g.lag=0;
        }
        for(let s,i=0;i<this.g.stars.length;++i){
          s=this.g.stars[i];
          s.y += dt * s.vel;
          if(s.y > this.m5.options.height){
            s.x=_.rand()*this.m5.options.width;
            s.y=0;
            s.size=_.rand()*3+1;
            s.vel=(_.rand()*(this.m5.options.maxVel- this.m5.options.minVel))+this.m5.options.minVel;
          }
        }
        this._draw();
      }
    },{fps:30, count:100, minVel:15, maxVel:30 });

    const _$={
    };

    return (Mojo["Misc"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Misc"]=function(M){
      return M["Misc"] ? M["Misc"] : _module(M)
    }
  }

})(this);


