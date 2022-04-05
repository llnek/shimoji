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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input: _I,
           FX:_X,
           Game:_G,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_, is}= Mojo;

    const SEEDS = {
      DieHard: [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 1]
      ],
      Glider: [
        [1, 0, 1],
        [0, 1, 1],
        [0, 1, 0]],
      Blinker:[
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0]],
      /*
      Boat: [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 0]],
        */
      "R-Pentomino": [
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0]],
      Pentadecathlon: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
      ],
      Beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]],
      Acorn: [
        [0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 1]],
      Spaceship: [
        [0, 0, 1, 1, 0],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0]],
      "Block-Switch-Engine": [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 1],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0] ],
      Infinite: [
        [1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1],
        [0, 1, 1, 0, 1],
        [1, 0, 1, 0, 1]
      ],
      Toad: [
        [0, 1, 1, 1],
        [1, 1, 1, 0]],
      LWWS: [
        [1, 0, 0, 1, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 1]],
      Pulsar: [
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
      Random: [
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
      "Gosper-Glider": [
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //neighbors
    const NBS= [[-1,-1],[-1,0],[-1,1],[0,-1],
      [0,1],[1,-1],[1,0],[1,1]],
      _DELAY=300,
      UI_FONT="Doki Lowercase",
      C_TILE=_S.color("#b7d150"),
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Game of Life",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        let
          self=this,
          btns=[],
          K=Mojo.getScaleFactor();
        if(!_G.curPattern)
          _G.curPattern=Mojo.u.defPattern;
        doBackDrop(this);
        let s,m,cfg= {fontName:UI_FONT,fontSize:32*K};
        function doClicked(btn){
          _G.curPattern=btn.m5.uuid;
          playClick();
        }
        _.keys(SEEDS).forEach(k=> {
          btns.push(s=_I.mkBtn(_S.bmpText(k,cfg)));
          _S.uuid(s,k);
        });
        m=_Z.choiceMenuY(btns, {
          bg:"#cccccc",
          defaultChoice: _G.curPattern,
          disabledColor:_S.color("#cccccc"),
          selectedColor:C_ORANGE,
          padding:18,
          onClick: doClicked});
        this.insert(m);
        //////
        s=_S.bmpText("Run simulation with this pattern", UI_FONT,36*K);
        _I.mkBtn(s).m5.press=(btn)=>{
          playClick();
          btn.tint=C_ORANGE;
          _.delay(CLICK_DELAY,()=>_Z.runEx("PlayGame"));
        };
        _S.anchorXY(s,0.5);
        _S.pinBelow(m,s,20);
        this.insert(s);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      _tile(){
        let s= _S.sprite(_S.frames("tiles.png",
                                   _G.iconSize[0],_G.iconSize[1]));
        _G.tint=s.tint;
        return s;
      },
      _initLevel(){
        let
          g= _S.gridSQ(Mojo.u.DIM,0.9),
          z= _S.sprite("tiles.png"),
          c=g[0][0],
          cells=[],
          K=(c.y2-c.y1)/z.height;
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
        let c,r,sum=0;
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
            }else if(n==3){
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
            rc.icon.tint= rc.alive? C_TILE : _G.tint;
          }
        }
      },
      _seed(which){
        let data=SEEDS[which];
        let h=data.length;
        let {cells}=_G;
        let w=-Infinity;
        data.forEach(r=> {
          if(r.length>w)w=r.length; });
        let y=_.max(0,_M.ndiv(cells.length-h,2));
        let x=_.max(0,_M.ndiv(cells[0].length-w,2));
        let o;
        data.forEach((r,i)=>{
          r.forEach((c,j)=>{
            if(c!=0){
              o=cells[y+i][x+j];
              o.alive=true;
              o.icon.m5.showFrame(1);
              o.icon.tint=C_TILE;
            }
          });
        });
      },
      setup(options){
        const self=this,
              K=Mojo.getScaleFactor();
        doBackDrop(this);
        this._initLevel();
        let
          {grid}=_G,
          c0=grid[0][0],
          s, bx=_S.gridBBox(0,0,grid);
        _G.arena=bx;
        s= _S.bboxFrame(_G.arena,32*K);
        this.insert(s);
        if(1){
          let s=_I.mkBtn(_S.sprite("menu.png"));
          _V.set(s,Mojo.width-s.width-10,0);
          s.alpha=0.5;
          s.m5.press=(btn)=>{
            btn.tint=C_ORANGE;
            _.delay(CLICK_DELAY,()=> _Z.runEx("MainMenu"));
          };
          this.insert(s);
        }
        this._seed(_G.curPattern);
        _.delay(_DELAY,()=> this.onFrame());
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles:["tiles.png","click.mp3","bg.jpg","menu.png"],
    arena:{width:1344, height:840},
    gridLineWidth:1,
    defPattern:"Acorn",
    DIM:40,
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


