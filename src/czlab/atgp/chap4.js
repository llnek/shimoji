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

;(function(window){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const int=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TSP= window["io/czlab/atgp/TSP"](_,is);
    const PI2=Math.PI*2;
    let {NUM_CITIES,CITY_SIZE, gaTSP}= TSP;
    const cities= makeCirclePoints(NUM_CITIES);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function makeCirclePoints(pts){
      let seg= PI2 / pts,
          cx= int(Mojo.width/2),
          cy= int(Mojo.height/2),
          center = {x:cx, y:cy},
          out=[],angle=0,r= int(Mojo.height * 0.4);
      for(let angle=0; angle < PI2; angle += seg){
        out.push({x:r*Math.sin(angle) + cx,
                  y:r* Math.cos(angle) + cy, radius:CITY_SIZE});
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            this.gfx=self.insert(_S.graphics());
            _.inject(_G,{
              cities,
              ai: new gaTSP(cities)
            });
          },
          runCycle(){
            let p= _G.ai.cycle() && _G.ai.getFittestRoute();
            p && this.showPath(p);
            if(!_G.ai.started()) _G.gameOver=true;
          },
          showPath(p){
            let done=!_G.ai.started();
            let a,b;
            this.drawMap(done?"green":"white");
            this.gfx.lineStyle(1,_S.color(done?"yellow":"red"));
            for(let i=0;i<p.length-1;++i){
              a=cities[p[i]];
              b=cities[p[i+1]];
              this.gfx.moveTo(a.x,a.y);
              this.gfx.lineTo(b.x,b.y);
            }
            a=cities[p[p.length-1]];
            b=cities[p[0]];
            this.gfx.moveTo(a.x,a.y);
            this.gfx.lineTo(b.x,b.y);
          },
          drawMap(color){
            this.gfx.clear();
            cities.forEach(c=>{
              this.gfx.beginFill(_S.color(color));
              this.gfx.drawCircle(c.x,c.y,c.radius);
              this.gfx.endFill();
            });
          }
        });
        this.g.initLevel();
        this.g.drawMap(cities);
      },
      postUpdate(dt){
        if(_G.ai.cycleCount()<200){
          this.g.runCycle();
        }else{
          _G.ai=new gaTSP(cities);
        }
        if(_G.gameOver){
          this.m5.dead=true;
          console.log(`Cycles = ${_G.ai.cycleCount()}`);
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    //assetFiles: ["wall.png","ground.png","green.png","water.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


