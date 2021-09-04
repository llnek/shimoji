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
  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input: _I,
           FX:_X,
           Game:_G,
           v2:_V,
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
      Boat: [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 0]],
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
    const NBS= [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const _DELAY=300;

    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BLACK=_S.color("#000000");
    const C_WHITE=_S.color("#ffffff");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const C_TILE=_S.color("#b7d150");
    //const C_TILE=_S.color("#59bdda");//blue
    //const C_TILE=_S.color("#db605a");//red
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){
      Mojo.sound("click.mp3").play()
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.jpg"),Mojo.width,Mojo.height);
      return scene.insert(_G.backDropSprite);
    }

    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Conway's Game Of Life",{fontName:TITLE_FONT,fontSize:84*K});
          _V.set(_S.tint(s,C_TITLE),Mojo.width/2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,b,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT, fontSize:48*K});
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          b=_I.mkBtn(s);
          t=_X.throb(b,0.99);
          b.m5.press=(btn)=>{
            _X.remove(t);
            _S.tint(btn,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=>_Z.runSceneEx("MainMenu"));
          };
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("MainMenu",{
      setup(){
        const self=this,
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
          btns.push(s=_S.bmpText(k,cfg));
          _S.uuid(s,k);
        });
        m=_Z.choiceMenuY(btns, {bg:"#cccccc",
          defaultChoice: _G.curPattern,
          disabledColor:_S.color("#cccccc"),
          selectedColor:C_ORANGE,
          padding:18,
          onClick: doClicked});
        this.insert(m);
        //////
        s=_S.bmpText("Run simulation with this pattern", {fontName:UI_FONT,fontSize:36*K});
        _I.mkBtn(s).m5.press=(btn)=>{
          playClick();
          btn.tint=C_ORANGE;
          _I.resetAll();
          _.delay(CLICK_DELAY,()=>_Z.runSceneEx("PlayGame"));
        };
        _S.centerAnchor(s);
        _S.pinBottom(m,s,20);
        this.insert(s);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      _tile(){
        let s= _S.sprite(_S.frames("tiles.png",
                                   _G.iconSize[0],_G.iconSize[1]));
        _G.tint=s.tint;
        return s;
      },
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
            if(rc.alive)
              rc.icon.tint=C_TILE;
            else
              rc.icon.tint=_G.tint;
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
        let y=_.max(0,_.floor((cells.length-h)/2));
        let x=_.max(0,_.floor((cells[0].length-w)/2));
        let o;
        data.forEach((r,i)=>{
          r.forEach((c,j)=>{
            if(c!==0){
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
        let {grid}=_G;
        let c0=grid[0][0];
        let bx=_S.gridBBox(0,0,grid);
        //let s=_S.group(_S.drawBody((ctx)=>{
          //_S.drawGridBox(bx,1,"white",ctx);
          //_S.drawGridLines(0,0,grid,1,"white",ctx);
        //}));
        _G.arena=bx;

        let s= _S.bboxFrame(_G.arena,32*K);
        this.insert(s);
        //
        s=_I.mkBtn(_S.sprite("menu.png"));
        _V.set(s,Mojo.width-s.width-10,0);
        s.alpha=0.5;
        s.m5.press=(btn)=>{
          btn.tint=C_ORANGE;
          _.delay(343,()=>{
            _I.resetAll();
            _Z.runSceneEx("MainMenu");
          });
        };
        this.insert(s);

        this._seed(_G.curPattern);
        _.delay(_DELAY,()=> this.onFrame());
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles:["tiles.png","click.mp3","bg.jpg","menu.png"],
    arena:{width:1200, height:960},
    gridLineWidth:1,
    defPattern:"Acorn",
    DIM:40,
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


