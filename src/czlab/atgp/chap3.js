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
    const Bob= window["io/czlab/atgp/bob"](_,is);
    let {ROWS,COLS,LEVEL,GaBob}=Bob;

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
                H=g.y2-g.y1,
                ai= new GaBob();
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
              ai,
              cycles:0,
              tileW:W,
              tileH:H
            });
          },
          mkStep(y,x){
            let s=_S.sprite("green.png");
            _V.set(s,_G.grid[y][x].x1, _G.grid[y][x].y1);
            _S.sizeXY(s,_G.tileW, _G.tileH);
            _G.path.push( self.insert(s));
          },
          runCycle(){
            let p= _G.ai.cycle() && _G.ai.getFittestDirection();
            p && this.showPath(p);
            if(!_G.ai.started()) _G.gameOver=true;
          },
          showPath(dirs){
            let {ai,path,grid,endPos,startPos} = _G;
            let [row,col]= startPos;
            let [ER,EC]= endPos;
            path.forEach(s=>_S.remove(s));
            path.length=0;
            this.mkStep(row,col);
            console.log(`directions = ${dirs.toString()}`);
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
        //this.g.showPath([3,3,3,3,0,3,0,0,3,3,0,0,0,3,0,1,0,3,0,3,0,1,0,3,0,0,1,0,1,3,3,3,0,1,3]);
        //this.g.showPath([3,3,3,0,1,3,3,0,3,0,2,3,0,0,3,0,0,3,0,3,0,0,0,1,0,0,1,3,0,3,1,3,3,3,0]);
        //_I.keybd(_I.SPACE, ()=>{ this.g.runCycle() });
      },
      postUpdate(dt){
        if(_G.ai.cycleCount()<100){
          this.g.runCycle();
        }else{
          _G.ai=new GaBob();
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


