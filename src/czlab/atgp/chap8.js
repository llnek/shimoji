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

    const geo=window["io/czlab/mcfud/geo2d"]();
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
    const NUM_INPUTS=10,//5,
          NUM_OUTPUTS=2,
          NUM_HIDDEN=1,
          NEURONS_HIDDENLAYER=10;

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const MineScale     = 12,
          NumTicks      = 1000;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const HALF_PI = Math.PI/2,
          QUAD_PI = Math.PI/4,
          PI2  = Math.PI*2,
          StartEnergy = 20,
          MaxTurnRate = 0.2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSensors(s){
      let c=[s.x,s.y];
      //let L=[s.g.H2,s.g.D2,s.g.W2,s.g.D2,s.g.H2];
      return [s.rotation - HALF_PI,
              s.rotation - QUAD_PI,
              s.rotation,
              s.rotation + QUAD_PI,
              s.rotation + HALF_PI].map((a,i)=>{
                return [c,_V.add(c, _V.mul([Math.cos(a),Math.sin(a)],s.g.diag))]
              });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function respawn(s){
      let ok;
      while(1){
        _V.set(s, randX(), randY());
        ok=true;
        for(let o,i=0;i<_G.obstacles.length;++i){
          o=_G.obstacles[i];
          if(_S.hitTest(o,s)){
            ok=false;
            break;
          }
        }
        if(ok)
          break;
      }
      return s;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randPos(s){
      let g,n=_.randInt2(0,3);
      n=1;
      switch(n){
        case 0: g=_G.grid[6][11];break;
        case 1: g=_G.grid[7][11];break;
        case 2: g=_G.grid[14][7];break;
        default: g=_G.grid[15][7];break;
      }
      return _V.set(s,int((g.x1+g.x2)/2), int((g.y1+g.y2)/2));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSWP(){
      let s= _S.spriteFrom("tank.png");
      _S.centerAnchor(s);
      _S.sizeXY(s,_.evenN(_G.tileW*0.9),_.evenN(_G.tileH*0.9));
      let h2=s.height/2;
      let w2=s.width/2;
      s.g.diag=Math.sqrt(w2*w2+h2*h2) * 1.25;
      s.rotation= 0;//_.rand() * PI2;
      s.g.diagRatio= s.width/s.g.diag;
      randPos(s);
      _.inject(s.g,{
        collided:false,
        W2:w2,
        H2:h2,
        lTrack: 0.16,
        rTrack: 0.16,
        fitness: new GA.NumFitness(StartEnergy),
        lookAt: {x:Math.cos(s.rotation),y: Math.sin(s.rotation)},
        nnet: new GA.NeuralNet(NUM_INPUTS,NUM_OUTPUTS,NUM_HIDDEN,NEURONS_HIDDENLAYER),
        cmap: CMapper(),
        spinBonus: 0,
        collisionBonus: 0,
        reset(){
          this.fitness = new GA.NumFitness(StartEnergy);
          s.rotation= 0;//_.rand() * PI2;
          randPos(s);
          this.lookAt.x= Math.cos(s.rotation);
          this.lookAt.y= Math.sin(s.rotation);
          this.cmap.reset();
          this.spinBonus = 0;
          this.collisionBonus = 0;
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
          this.fitness.update(this.fitness.score()+n);
        },
        testSensors(input){
          this.collided = false;
          for(let res,w,ss=mkSensors(s),i=0;i<ss.length;++i){
            w=ss[i];
            res=null;
            for(let p,j=0;j<_G.obstacles.length;++j){
              p=_S.toPolygon(_G.obstacles[j]);
              res= geo.hitTestLinePolygon(w[0],w[1],p);
              if(res[0]){
                break;
              }
            }
            if(res && res[0]){
              _.assert(0<= res[1]&&res[1]<=1,"bad sensor result");
              if(res[1]< s.g.diagRatio){
                this.collided=true;
              }
              input.push(res[1]);
            }else{
              input.push(-1);
            }
            let v= this.cmap.ticksLingered(w[1][0],w[1][1]);
            //console.log("v===="+v);
            if(v==0)
              input.push(-1);
            else if(v<10)
              input.push(0);
            else if(v<20)
              input.push(0.2);
            else if(v<30)
              input.push(0.4);
            else if(v<50)
              input.push(0.6);
            else if(v<80)
              input.push(0.8);
            else
              input.push(1);
          }
          //console.log("input length====="+input.length);
          return input;
        },
        endOfRunCalc(){
          this.fitness.update(this.fitness.score() + this.spinBonus + this.collisionBonus)
        },
        update(){
          let inputs=this.testSensors([]);
          let output = this.nnet.update(inputs);
          this.lTrack = output[0];
          this.rTrack = output[1];
          let rotForce = this.lTrack - this.rTrack;
          //# Clamp rotation
          rotForce = rotForce < -MaxTurnRate ? -MaxTurnRate : (rotForce > MaxTurnRate?MaxTurnRate : rotForce);
          s.rotation += rotForce;
          //s.m5.speed = (this.lTrack + this.rTrack);
          this.lookAt.x = Math.cos(s.rotation);
          this.lookAt.y = Math.sin(s.rotation);

          if(!this.collided){
            s.m5.speed = this.lTrack + this.rTrack;
            _V.add$(s, _V.mul(this.lookAt, s.m5.speed));
          }

          let rotationTolerance = 0.03;
          if(-rotationTolerance < rotForce && rotForce < rotationTolerance){
            this.spinBonus += 1;
          }
          if(!this.collided)
			      this.collisionBonus += 1;

          this.cmap.update(s.x,s.y);

          s.x > _G.arena.x2? s.x=_G.arena.x2: (s.x < _G.arena.x1? s.x=_G.arena.x1: null);
          s.y > _G.arena.y2? s.y=_G.arena.y2: (s.y < _G.arena.y1? s.y=_G.arena.y1: null);

          return true;
        }
      });
      return s;
    }

    const NumSweepers=30;
    let ticks;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randX(){ return _.randInt2(_G.arena.x1,_G.arena.x2) }
    function randY(){ return _.randInt2(_G.arena.y1,_G.arena.y2) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CMapper(){
      let grid= JSON.parse(JSON.stringify(_G.grid));
      let bbox=_S.gridBBox(0,0,grid);
      let {tileW,tileH}=_G;
      grid.forEach(r=>r.forEach(c=> c.visits=0));
      /////
      function toCell(x,y){
        let cy=int((y-bbox.y1)/tileH);
        let cx=int((x-bbox.x1)/tileW);
        if(cy<0)cy=0;
        if(cy>=grid.length) cy=grid.length-1;
        if(cx<0)cx=0;
        if(cx>=grid[0].length) cx=grid[0].length-1;
        return grid[cy][cx];
      }
      return{
        update(x,y){
          if(x<bbox.x1 || x>bbox.x2 ||
             y<bbox.y1 || y>bbox.y2){
          }else{
            toCell(x,y).visits += 1
          }
        },
        ticksLingered(x,y){
          return (x<bbox.x1 || x>bbox.x2 ||
                  y<bbox.y1 || y>bbox.y2) ? 999 : toCell(x,y).visits
        },
        reset(){
          grid.forEach(r=> r.forEach(g=>{ g.visits=0 }))
        },
        numCellsVisited(){
          let total = 0;
          grid.forEach(r=> r.forEach(g=>{
            if(g.visits>0) total +=1
          }));
          return total;
        }
      }
    }

    const ROWS=20, COLS=20;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();

        let gaPop,
            splitPoints,
            numWeightsInNN;

        function mutate(genes){
					genes.forEach((w,i)=>{
						if(_.rand() < _G.params.mutationRate)
							genes[i] =  w + _.randMinus1To1() * _G.params.MAX_PERTURBATION;
					});
        }
        function crossOver(b1,b2){
          return GA.crossOverAtSplits(b1,b2,splitPoints)
        }
        function calcFit(genes,old){
          return old.clone()
        }

        function create(){
          let g= _.fill(numWeightsInNN, ()=> _.randMinus1To1());
          return new GA.Chromosome(g, new GA.NumFitness(StartEnergy))
        }

        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initBlocks(grid){
            let g= grid[0][0],
                b, out=[],
                tw=g.x2-g.x1,
                th=g.y2-g.y1;

            //square
            b= _S.rect(6*tw,6*th,"white");
            _S.uuid(b,"o-square");
            g=grid[ROWS-6-3][COLS-6-3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            // 2 rects
            b= _S.rect(4*tw,10*th,"white");
            _S.uuid(b,"o-vrect");
            g=grid[2][3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            b= _S.rect(6*tw,3*th,"white");
            _S.uuid(b,"o-hrect");
            g=grid[2][3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            //iso-tri
            b= _S.triangle(5*tw,4*th,0.5,"white","white");
            _S.uuid(b,"isotrig");
            g=grid[4][COLS-6];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            //2 tri
            b= _S.triangle(5*tw,2*th,0,"white","white");
            _S.uuid(b, "rangtri-up");
            g=grid[ROWS-6][0];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));
            //flipped
            b= _S.triangle(5*tw,-2*th,0,"white","white");
            _S.uuid(b, "rangtri-down");
            g=grid[ROWS-4][0];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));
            //
            return _G.obstacles=out;
          },
          initLevel(){
            let out={},
                g,gfx=_S.graphics(),
                grid=_S.gridXY([ROWS,COLS],0.9,0.9,out);
            let g0= grid[0][0];
            _S.drawGridBox(out,1,"white",gfx);
            _S.drawGridLines(0,0,grid,1,"white",gfx);
            self.insert(gfx);
            this.initBlocks(grid);
            _.inject(_G,{
              params:GA.config({mutationRate:0.1,crossOverRate: 0.7, NUM_ELITES:6}),
              arena:out,
              grid,
              tileW: g0.x2-g0.x1,
              tileH: g0.y2-g0.y1
            });
            this.extra={gen:0,maxCycles:1,
                        calcFit,create,mutate,crossOver};
            //////
            let vecSweepers= _.fill(NumSweepers,  ()=> self.insert(mkSWP()));
            numWeightsInNN= vecSweepers[0].g.getNumberOfWeights();
            splitPoints = vecSweepers[0].g.calcSplitPoints();
            let [xxx,pop] = GA.runGACycle(NumSweepers, this.extra);
            vecSweepers.forEach((c,i)=> c.g.putWeights(pop[i].genes));
            gaPop=pop;
            ticks= 0;
            this.letThemRoam=()=>{
              for(let i=0;i<NumSweepers;++i){
                if(!vecSweepers[i].g.update()) return false;
              }
            }
            this.reGen=()=>{
              for(let i=0; i<NumSweepers;++i){
                vecSweepers[i].g.endOfRunCalc();
                gaPop[i].fitness = vecSweepers[i].g.fitness.clone();
              }
              ticks = 0;
              let [xxx,pop]= GA.runGACycle(gaPop,this.extra);
              gaPop=pop;
              for(let ec=_G.params.NUM_ELITES, i=vecSweepers.length-1;i>=0;--i){
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
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      postUpdate(dt){
        //let s=this.getChildById("o-square");
        //let p= _S.toPolygon(s);
        //let vs=geo.Polygon.translateCalcPoints(p);
        //let res= geo.hitTestLinePolygon([800,500], [900,600],p);
        if(++ticks<NumTicks){
          this.g.letThemRoam()
        }else{
          this.g.reGen()
        }
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


