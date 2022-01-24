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
  const abs=Math.abs;

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
    const Core=window["io/czlab/mcfud/core"]();
    const GA= window["io/czlab/mcfud/algo/NNetGA"](Core);
    const LEVEL=[
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
      [8, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 5],
      [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    const NUMBITS=70,
          ROWS= LEVEL.length,
          COLS= LEVEL[0].length;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const DIRS=["North","South","East","West"];
    const StartPos= [7,14];
    const EndPos= [2,0];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function create(){
      let g= _.fill(NUMBITS, ()=> _.randSign()>0?1:0);
      return new GA.Chromosome(g, calcFit(0))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function decode(genes){
      function binToInt(bins){
        let val = 0, mult= 1;
        for(let i=bins.length-1;i>=0;--i){
          val += bins[i] * mult;
          mult *= 2;
        }
        return val;
      }
      let g = [0,0], dirs=[];
      for(let i=0;i<genes.length;){
        for(let j=0;j< g.length; ++j){
          g[j]= genes[i+j]
        }
        i += g.length;
        dirs.push(binToInt(g));
      }
      return dirs;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _mutate(genes,mRate){
      for(let i=0; i<genes.length; ++i){
        if(_.rand() < mRate){
          if(genes[i] == 0)
            genes[i] = 1;
          else
            genes[i] = 0;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function calcFit(genes){
      let [endY,endX] = EndPos,
          [posY,posX] = StartPos;
      decode(genes).forEach(d=>{
        switch(d){
          case 0://north
            if(posY-1 >= 0 && LEVEL[posY-1][posX] != 1) posY -= 1;
            break;
          case 1://south
            if(posY+1 < ROWS && LEVEL[posY+1][posX] != 1) posY += 1;
            break;
          case 2://east
            if(posX+1 < COLS && LEVEL[posY][posX+1] != 1) posX += 1;
            break;
          case 3://west
            if(posX-1 >= 0 && LEVEL[posY][posX-1] != 1) posX -= 1;
            break;
          default:
            _.assert(false, `Bad direction: ${d}`);
        }
      });
      let dx = abs(posX - endX);
      let dy = abs(posY - endY);
      return new GA.NumFitness(1/(dx+dy+1));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let endPos,startPos,path=[],out={};
            let grid=_S.gridXY([COLS,ROWS],0.8,0.8,out);
            let s,g = grid[0][0];
            let W=g.x2-g.x1,
                H=g.y2-g.y1;
            //let gfx=_S.graphics();
            //self.insert(gfx);
            //_S.drawGridBox(out,1,"white",gfx);
            //_S.drawGridLines(0,0,grid,1,"white",gfx);
            LEVEL.forEach((r,y)=>{
              r.forEach((c,x)=>{
                g=grid[y][x];
                s=null;
                switch(c){
                  case 1:
                    s=_S.sprite("wall.png");
                    _V.set(s,g.x1,g.y1);
                    break;
                  case 0:
                    s=_S.sprite("ground.png");
                    _V.set(s,g.x1,g.y1);
                    break;
                  case 8:
                    s=_S.sprite("water.png");
                    _V.set(s,g.x1,g.y1);
                    endPos=[y,x];
                    break;
                  case 5:
                    s=_S.sprite("green.png");
                    _V.set(s,g.x1,g.y1);
                    startPos=[y,x];
                    path.push(s);
                    break;
                }
                self.insert(_S.sizeXY(s,W,H));
              })
            });
            _.inject(_G,{
              startPos,
              endPos,
              path,
              grid,
              cycles:0,
              tileW:W,
              tileH:H,
              params: GA.config({mutationRate: 0.015, crossOverRate: 0.7})
            });
          },
          mkStep(y,x){
            let s=_S.sprite("green.png");
            _V.set(s,_G.grid[y][x].x1, _G.grid[y][x].y1);
            _S.sizeXY(s,_G.tileW, _G.tileH);
            _G.path.push( self.insert(s));
          },
          showPath(dirs){
            let {ai,path,grid,endPos,startPos} = _G;
            let [row,col]= startPos;
            let [ER,EC]= endPos;
            path.forEach(s=>_S.remove(s));
            path.length=0;
            this.mkStep(row,col);
            //console.log(`directions = ${dirs.toString()}`);
            for(let i=0;i<dirs.length;++i){
              switch(dirs[i]){
                case 0://n
                  if(row-1>=0 && LEVEL[row-1][col]!=1){
                    row -=1;
                    this.mkStep(row,col);
                  }
                  break;
                case 1://s
                  if(row+1<ROWS && LEVEL[row+1][col]!=1){
                    row +=1;
                    this.mkStep(row,col);
                  }
                  break;
                case 2://e
                  if(col+1<COLS && LEVEL[row][col+1]!=1){
                    col +=1;
                    this.mkStep(row,col);
                  }
                  break;
                case 3://w
                  if(col-1>=0 && LEVEL[row][col-1]!=1){
                    col -=1;
                    this.mkStep(row,col);
                  }
                  break;
              }
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.g.showPath([]);
        this.g.extra={gen:0,maxCycles:5, targetScore:1, create, calcFit,
          mutate:(g)=>{
            return _mutate(g,_G.params.mutationRate)
          },
          crossOver:(b1,b2)=>{
            return GA.crossOverRND(b1,b2,_G.params.crossOverRate)
          }
        };
      },
      postUpdate(dt){
        let [xx, pop]= GA.runGACycle(100,this.g.extra);
        let s= GA.calcStats(pop);
        this.g.showPath(decode(s.best.genes));
        if(s.best.fitness.score()==1){
          this.m5.dead=true;
          console.log(`Gen = ${this.g.extra.gen}`);
          console.log(`Cycles = ${this.g.extra.cycles}`);
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["wall.png","ground.png","green.png","water.png"],
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


