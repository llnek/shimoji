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
    const { NUM_ELITE,
			      NUM_COPIES_ELITE, gaNNet, NeuralNet }= window["io/czlab/atgp/NNetGA"](_,is);
    const NUM_INPUTS=4,
          NUM_OUTPUTS=2,
          NUM_HIDDEN=1,
          NEURONS_HIDDENLAYER=10;
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const CrossOverRate = 0.7,
          MutationRate  = 0.1,
          MineScale     = 12,
          NumElite      = 6,
          NumTicks      = 1000;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const HALF_PI = Math.PI/2,
          PI2  = Math.PI*2,
          StartEnergy = 20,
          SweeperScale= 5,
          MaxTurnRate = 0.3;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkMine(x,y){
      let s = _S.rect(MineScale,MineScale,false,_S.color("yellow"),1);
      s.x=x;
      s.y=y;
      return s;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSWP(){
      let s= _S.spriteFrom("tank.png");
      _S.sizeXY(s,42,42);
      _S.centerAnchor(s);
      s.rotation= _.rand() * PI2;
      _V.set(s, randX(), randY());
      _.inject(s.g,{
        lTrack: 0.16,
        rTrack: 0.16,
        fitness: StartEnergy,
        closestMine: 0,
        lookAt: {x:Math.cos(s.rotation),y: Math.sin(s.rotation)},
        nnet: NeuralNet(NUM_INPUTS,NUM_OUTPUTS,NUM_HIDDEN,NEURONS_HIDDENLAYER),
        reset(){
          this.fitness = StartEnergy;
          s.rotation= _.rand() * PI2;
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
          this.fitness += n;
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
    function randX(){
      return _.rand() * Mojo.width * 0.9;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randY(){
      return _.rand() * Mojo.height * 0.9;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let vecMines= _.fill(NumMines,()=> self.insert(mkMine(randX(), randY())));
            let vecSweepers= _.fill(NumSweepers,  ()=> self.insert(mkSWP()));
            let numWeightsInNN= vecSweepers[0].g.getNumberOfWeights();
            let splitPoints = vecSweepers[0].g.calcSplitPoints();
            let GA = gaNNet(NumSweepers, MutationRate, CrossOverRate, numWeightsInNN, splitPoints);
            let gaPop = GA.getChromos();
            vecSweepers.forEach((c,i)=> c.g.putWeights(gaPop[i].weights));
            this.numWeightsInNN=numWeightsInNN;
            this.vecSweepers=vecSweepers;
            this.vecMines=vecMines;
            this.gaPop=gaPop;
            this.ticks= 0;
            this.generation=1;
            this.GA=GA;
            this.update=()=>{
              this.ticks += 1;
              if(this.ticks < NumTicks){
                for(let i=0;i<NumSweepers;++i){
                  if(!this.vecSweepers[i].g.update(this.vecMines)) return false;
                  let grabHit = this.vecSweepers[i].g.checkForMine(this.vecMines);
                  if(grabHit > 0){
                    this.vecSweepers[i].g.incFitness();
                    _V.set(this.vecMines[grabHit], randX(), randY());
                  }
                  this.gaPop[i].fitness = this.vecSweepers[i].g.fitness;
                }
              }else{
                let ec= NUM_ELITE * NUM_COPIES_ELITE;
                this.generation += 1;
                this.ticks = 0;
                this.gaPop = this.GA.cycle(this.gaPop);
                for(let i=0;i<NumSweepers;++i){
                  this.vecSweepers[i].g.putWeights(this.gaPop[i].weights);
                  this.vecSweepers[i].g.reset();
                  if(ec>0){
                    this.vecSweepers[i].tint=_S.color("magenta");
                    --ec;
                  }
                }
              }
              return true;
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      postUpdate(dt){
        this.g.update();
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


