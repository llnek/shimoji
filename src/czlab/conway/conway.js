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

  function scenes(Mojo){
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Tiles:_T,
           Game:_G,
           v2:_V,
           ute:_, is}= Mojo;

    const SEEDS = {
      diehard: [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 1]
      ],
      glider: [
        [1, 0, 1],
        [0, 1, 1],
        [0, 1, 0]],
      blinker:[
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0]],
      boat: [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 0]],
      r_pentomino: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0]],
      pentadecathlon: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
      ],
      beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]],
      acorn: [
        [0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 1]],
      spaceship: [
        [0, 0, 1, 1, 0],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0]],
      block_switch_engine: [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 1],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0] ],
      infinite: [
        [1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1],
        [0, 1, 1, 0, 1],
        [1, 0, 1, 0, 1]
      ],
      toad: [
        [0, 1, 1, 1],
        [1, 1, 1, 0]],
      lwws: [
        [1, 0, 0, 1, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 1]],
      pulsar: [
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]],
      random: [
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1],
        [0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1]],
      gosper_glider: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    };

    //neighbors
    const NBS= [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const _DELAY=300;

    _Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        let s= _S.bboxFrame(_G.arena,32*K);
        this.insert(s);
      }
    });

    _Z.defScene("level1",{
      _tile(){
        return _S.sprite(_S.frames("tiles.png",
                                   _G.iconSize[0],_G.iconSize[1])) },
      _initLevel(){
        let g= _S.gridSQ(Mojo.u.DIM,0.9);
        let z= _S.sprite("tiles.png");
        let c=g[0][0];
        let cells=[];
        let K=(c.y2-c.y1)/z.height;
        _G.grid=g;
        _G.cells=cells;
        _G.iconScale=[K,K];
        _G.iconSize=[z.height,z.height];
        for(let R,r,y=0;y<g.length;++y){
          r=g[y];
          cells.push(R=[]);
          for(let s,c,x=0;x<r.length;++x){
            s=this._tile();
            c=r[x];
            _V.set(s,c.x1, c.y1);
            _S.scaleXY(s,_G.iconScale[0],_G.iconScale[1]);
            s.m5.showFrame(0);
            R.push({
              icon:s,
              alive: false,
              nextAlive: false
            });
            this.insert(s);
          }
        }
      },
      _cntNbrs(row,col,R,C,cs){
        let sum=0;
        let r;
        let c;
        NBS.forEach(pos=>{
          r=row+pos[0];
          c=col+pos[1];
          if(r>=0&&r<R&&c>=0&&c<C && cs[r][c].alive){
            ++sum;
          }
        });
        return sum;
      },
      onFrame(){
        this._examine();
        this._nextgen();
        _.delay(_DELAY,()=>this.onFrame());
      },
      _examine(){
        let {cells}=_G;
        for(let row,r=0;r<cells.length;++r){
          row=cells[r];
          for(let rc,n,c=0;c<row.length;++c){
            n=this._cntNbrs(r,c,cells.length,row.length,cells);
            rc=row[c];
            if(rc.alive){
              //too few, or too many
              if(n<2 || n>3){
                rc.nextAlive=false;
              }else{
                //stay same
                rc.nextAlive=true;
              }
            }else if(n===3){
              //come alive
              rc.nextAlive=true;
            }
          }
        }
      },
      _nextgen(){
        let {cells}=_G;
        for(let row,r=0;r<cells.length;++r){
          row=cells[r];
          for(let rc,n,c=0;c<row.length;++c){
            rc=row[c];
            rc.alive=rc.nextAlive;
            rc.nextAlive=false;
            rc.icon.m5.showFrame(rc.alive?1:0);
          }
        }
      },
      _seed(which="acorn"){
        let data=SEEDS[which];
        let h=data.length;
        let {cells}=_G;
        let w=-Infinity;
        data.forEach(r=> {
          if(r.length>w)w=r.length; });
        let y=_.max(0,_.floor((cells.length-h)/2));
        let x=_.max(0,_.floor((cells[0].length-w)/2));
        let o;
        data.forEach((r,i)=>{
          r.forEach((c,j)=>{
            if(c!==0){
              o=cells[y+i][x+j];
              o.alive=true;
              o.icon.m5.showFrame(1);
            }
          });
        });
      },
      setup(options){
        this._initLevel();
        let self=this;
        let {grid}=_G;
        let c0=grid[0][0];
        let bx=_S.gridBBox(0,0,grid);
        //let s=_S.group(_S.drawBody((ctx)=>{
          //_S.drawGridBox(bx,1,"white",ctx);
          //_S.drawGridLines(0,0,grid,1,"white",ctx);
        //}));
        _G.arena=bx;
        //_V.set(s,c0.x1,c0.y1);
        //this.insert(s);
        this._seed("random");
        _.delay(_DELAY,()=> this.onFrame());
      }
    });
  }

  const _$={
    assetFiles:["tiles.png"],
    arena:{width:1200, height:960},
    gridLineWidth:1,
    DIM:40,
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





