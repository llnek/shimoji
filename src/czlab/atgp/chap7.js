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
    const Core= window["io/czlab/mcfud/core"]();
    const GA= window["io/czlab/mcfud/algo/NNetGA"](Core);

    const NUM_INPUTS=4,
          NUM_OUTPUTS=2,
          NUM_HIDDEN=1,
          NEURONS_HIDDENLAYER=10;

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const MineScale     = 12,
          NumTicks      = 1000;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const HALF_PI = Math.PI/2,
          PI2  = Math.PI*2,
          StartEnergy = 20,
          SweeperScale= 5,
          MaxTurnRate = 0.3;

    let ticks;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkMine(x,y){
      return _V.set(_S.rect(MineScale,MineScale,false,_S.color("yellow"),1),x,y)
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSWP(){
      let s= _S.spriteFrom("tank.png");
      _S.centerAnchor( _S.sizeXY(s,42,42));
      s.rotation= 0;//_.rand() * PI2;
      _V.set(s, randX(), randY());
      _.inject(s.g,{
        lTrack: 0.16,
        rTrack: 0.16,
        closestMine: 0,
        fitness: new GA.NumFitness(StartEnergy),
        lookAt: {x:Math.cos(s.rotation),y: Math.sin(s.rotation)},
        nnet: new GA.NeuralNet(NUM_INPUTS,NUM_OUTPUTS,NUM_HIDDEN,NEURONS_HIDDENLAYER),
        reset(){
          this.fitness = new GA.NumFitness(StartEnergy);
          s.rotation= 0;//_.rand() * PI2;
          _V.set(s, randX(), randY());
          this.lookAt.x= Math.cos(s.rotation);
          this.lookAt.y= Math.sin(s.rotation);
        },
        getClosestMine(mines){
          let closestObj = [0,0],
              closestSoFar = Infinity;
          mines.forEach((m,i)=>{
            let d = _V.dist(s,m);
            if(d < closestSoFar){
              closestSoFar = d;
              this.closestMine = i;
              closestObj = _V.vecAB(s,m);
            }
          });
          return closestObj;
        },
        checkForMine(mines){
          let d= _V.dist(s, mines[this.closestMine]);
          return (d < MineScale)? this.closestMine: -1;
        },
        getNumberOfWeights(){
          return this.nnet.getNumberOfWeights()
        },
        calcSplitPoints(){
          return this.nnet.calcSplitPoints()
        },
        putWeights(weights){
          this.nnet.putWeights(weights)
        },
        incFitness(n=1){
          this.fitness.update(this.fitness.score()+n)
        },
        update(mines){
          let closestMine = _V.unit$(this.getClosestMine(mines));
          let inputs=[closestMine.x, closestMine.y, this.lookAt.x, this.lookAt.y];
          let output = this.nnet.update(inputs);
          this.lTrack = output[0];
          this.rTrack = output[1];
          let rotForce = this.lTrack - this.rTrack;
          //# Clamp rotation
          rotForce = rotForce < -MaxTurnRate ? -MaxTurnRate : (rotForce > MaxTurnRate?MaxTurnRate : rotForce);
          s.rotation += rotForce;
          s.m5.speed = (this.lTrack + this.rTrack);
          this.lookAt.x = Math.cos(s.rotation);
          this.lookAt.y = Math.sin(s.rotation);
          _V.add$(s, _V.mul(this.lookAt, s.m5.speed));
          s.x = s.x > Mojo.width?0: (s.x < 0?Mojo.width: s.x);
          s.y = s.y > Mojo.height?0: (s.y < 0?Mojo.height: s.y);
          return true;
        }
      });
      return s;
    }

    const NumSweepers=30;
    const NumMines=40;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randX(){ return _.rand() * Mojo.width * 0.9 }
    function randY(){ return _.rand() * Mojo.height * 0.9 }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        let gaPop,
            splitPoints,
            numWeightsInNN;
        function crossOver(a,b){
          return GA.crossOverAtSplits(a,b,splitPoints)
        }
        function mutate(genes){
          genes.forEach((w,i)=>{
            if(_.rand() < _G.params.mutationRate)
              genes[i] =  w + _.randMinus1To1() * _G.params.MAX_PERTURBATION;
          });
        }
        function create(){
          let g= _.fill(numWeightsInNN, ()=> _.randMinus1To1());
          return new GA.Chromosome(g,new GA.NumFitness(20));
        }
        function calcFit(genes,oldf){
          return oldf.clone();
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let vecMines= _.fill(NumMines,()=> self.insert(mkMine(randX(), randY())));
            let vecSweepers= _.fill(NumSweepers,  ()=> self.insert(mkSWP()));

            numWeightsInNN= vecSweepers[0].g.getNumberOfWeights();
            splitPoints = vecSweepers[0].g.calcSplitPoints();

            let [xxx,pop]=GA.runGACycle(NumSweepers,this.extra);
            vecSweepers.forEach((c,i)=> c.g.putWeights(pop[i].genes));
            gaPop=pop;
            ticks= 0;
            this.letThemRoam=()=>{
              for(let hit,i=0;i<NumSweepers;++i){
                if(!vecSweepers[i].g.update(vecMines)) return false;
                hit = vecSweepers[i].g.checkForMine(vecMines);
                if(hit > 0){
                  vecSweepers[i].g.incFitness();
                  _V.set(vecMines[hit], randX(), randY());
                }
                gaPop[i].fitness = vecSweepers[i].g.fitness.clone();
              }
            };
            this.reGen=()=>{
              let [xxx,pop]= GA.runGACycle(gaPop,this.extra);
              ticks = 0;
              gaPop=pop;
              for(let ec=_G.params.NUM_ELITES,i=vecSweepers.length-1; i>=0;--i){
                vecSweepers[i].g.putWeights(pop[i].genes);
                vecSweepers[i].g.reset();
                if(ec>0){
                  vecSweepers[i].tint=_S.color("magenta");
                  --ec;
                }
              }
            }
          }
        });
        _G.params=GA.config({mutationRate:0.1});
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.extra={gen:0,maxCycles:1,create,calcFit,mutate,crossOver};
        this.g.initLevel();
      },
      postUpdate(dt){
        if(++ticks< NumTicks)
          this.g.letThemRoam();
        else
          this.g.reGen();
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    //assetFiles: ["wall.png","ground.png","green.png","water.png"],
    assetFiles: ["tank.png"],
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


