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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const Core=window["io/czlab/mcfud/core"]();
  const GA= window["io/czlab/mcfud/algo/NNetGA"](Core);
  const PI2=Math.PI*2;
  const int=Math.floor;
  const {is,u:_}=Core;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const NUM_CITIES =20,
        CITY_SIZE = 8,
        POP_SIZE = 40;

  let cities=null,
      bestRoute= null;

  function calcA_to_B(c1, c2){
    let dx=c1.x-c2.x,
			  dy=c1.y-c2.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  function create(){
    let g= _.shuffle(_.fill(NUM_CITIES,(i)=> i));
    return new GA.Chromosome(g, calcFit(g));
  }


  function calcFit(genes){
    let sum = 0;
    for(let i=0;i< genes.length-1; ++i)
      sum += calcA_to_B(cities[genes[i]], cities[genes[i+1]]);
    sum += calcA_to_B(cities[_.last(genes)], cities[genes[0]]);
    return new GA.NumFitness(sum,1);
  }

  function calcBestRoute(){
    //sum up 0->second last, then add last->0
    let sum=0;
    for(let c,i=0;i< cities.length-1;++i)
      sum += calcA_to_B(cities[i], cities[i+1]);
    return new GA.NumFitness(sum + calcA_to_B(_.last(cities), cities[0]), true);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    cities= (function(pts){
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
    })(NUM_CITIES);

    bestRoute= calcBestRoute();

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

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
              params:GA.config({
                NUM_ELITES:8,
                mutationRate : 0.2,
                crossOverRate: 0.75
              })
            });
          },
          showPath(c,done){
            let p= c.genes;
            let a,b;
            this.drawMap(done?"green":"white");
            this.gfx.lineStyle(1,_S.color(done?"yellow":"red"));
            for(let i=0;i<p.length-1;++i){
              a=cities[p[i]];
              b=cities[p[i+1]];
              this.gfx.moveTo(a.x,a.y);
              this.gfx.lineTo(b.x,b.y);
            }
            a=cities[_.last(p)];
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
        this.g.drawMap("white");
        function mutate(c){
          GA.mutateSM(c,_G.params.mutationRate);
        }
        function crossOver(b1,b2){
          GA.crossOverPMX(b1,b2,_G.params.crossOverRate);
        }
        this.g.extra={gen:0,maxCycles:250,calcFit,create, mutate, crossOver };
      },
      postUpdate(dt){
        let [xx,pop]= GA.runGACycle(100,this.g.extra);
        let s= GA.calcStats(pop,true);
        let b=s.best.fitness.score()<=bestRoute.score();
        this.g.showPath(s.best,b);
        if(b){
          this.m5.dead=true;
          GA.showBest(s.best,this.g.extra);
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


