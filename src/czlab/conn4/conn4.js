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

    window["io/czlab/conn4/AI"](Mojo);

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           Game:_G,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_, is}= Mojo;

    const {Bot,
           Local,Mediator}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Connect/4",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const COLS=7, ROWS=6;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      X:88,
      O:79
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class C4Bot extends Bot{
      constructor(uid,v){
        super(uid);
        this.pvalue=v;
      }
      stateValue(){
        return this.pvalue;
      }
      onPoke(){
        _.delay(848,()=>{
          const move=this.ai.run(_G.mediator.gameState(), this);
          _G.mediator.updateMove(this, move);
        });
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class C4Human extends Local{
      constructor(uid,v){
        super(uid);
        this.pvalue=v;
      }
      stateValue(){
        return this.pvalue;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class C4Mediator extends Mediator{
      constructor(){
        super();
        this.state=[];
        for(let y=0;y<ROWS;++y)
          this.state.push(_.fill(COLS,0));
      }
      updateSound(player){
        Mojo.sound(player.stateValue()==_G.X?"x.mp3":"o.mp3").play()
      }
      updateState(from,move){
        let [row,col]=move,
            s= _G.tiles[row][col],
            v=from.stateValue();
        this.state[row][col]=v;
        s.alpha=1;
        s.m5.showFrame(v==_G.X?1:2);
      }
      postMove(from,move){
        let d,w=_G.check4(this.state,
                          move[0],move[1],
                          from.stateValue());
        if(w){
          this.gameOver(from);
        }else if(_G.checkDraw(this.state)){
          this.gameOver();
        }else{
          this.takeTurn();
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      dropCol(cells,col,turn){
        const row= this.maxY(cells,col);
        if(row>=0)
          cells[row][col]=turn;
      },
      /** get next valid drop in that column */
      maxY(cells,col){
        for(let y=cells.length-1;y>=0;--y){
          if(cells[y][col]==0) return y;
        }
        return -1;
      },
      /** true if a draw */
      checkDraw(cells){
        return _.every(_.map(cells,r=> _.every(r,v=>v!=0)), v=>!!v)
      },
      checkAnyWin(cells,who){
        for(let r,y=0; y<cells.length; ++y){
          r=cells[y];
          for(let x=0; x<r.length; ++x){
            if(this.check4(cells,y,x,who.stateValue())) return who;
          }
        }
      },
      /** test for win */
      check4(cells,row,col,turn){
        let width=cells[0].length;
        let height=cells.length;
        let i,j,out=[];
        //test the row
        //left
        for(j=col;j>=0;--j){
          if(cells[row][j]!=turn){ break }
          out.push([row,j]);
        }
        if(out.length>=4){ return out }
        //right
        for(j=col;j<width;++j){
          if(cells[row][j]!=turn){ break }
          if(j!=col) out.push([row,j]);
        }
        if(out.length>=4){ return out }
        //test the column
        //up
        out.length=0;
        for(i=row;i>=0;--i){
          if(cells[i][col]!=turn){ break }
          out.push([i,col]);
        }
        if(out.length>=4){ return out }
        //down
        for(i=row;i<height;++i){
          if(cells[i][col]!=turn){ break }
          if(i!=row) out.push([i,col]);
        }
        if(out.length>=4){ return out }
        //test pos slope
        out.length=0;
        i=row;
        j=col;
        //upward
        while(i>=0 && j>=0 && j<width){
          if(cells[i][j]!=turn){ break }
          out.push([i,j]);
          ++j;
          --i;
        }
        if(out.length>=4){ return out }
        i=row;
        j=col;
        //downward
        while(i<height && j>=0){
          if(cells[i][j]!=turn){ break }
          if(!(i==row && j==col)) out.push([i,j]);
          --j;
          ++i;
        }
        if(out.length>=4){ return out }
        //test neg slope
        out.length=0;
        i=row;
        j=col;
        //upward
        while(i>=0 && j>=0){
          if(cells[i][j]!=turn){ break }
          out.push([i,j]);
          --j;
          --i;
        }
        if(out.length>=4){ return out }
        i=row;
        j=col;
        //downward
        while(i<height && j<width){
          if(cells[i][j]!=turn){ break }
          if(!(i==row && j==col)) out.push([i,j]);
          ++j;
          ++i;
        }
        if(out.length>=4){ return out }
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("StartMenu",{
      setup(options){
        const self=this,
          K=Mojo.getScaleFactor(),
          cfg={fontName: UI_FONT, fontSize: 64*K};
        let s= _S.bmpText("Player 1 (Blue) Starts? ", cfg),
          gap=_S.bmpText(" / ", cfg),
          b2=_I.mkBtn(_S.bmpText("No", cfg)),
          b1=_I.mkBtn(_S.bmpText("Yes", cfg));

        b1.m5.press=
        b2.m5.press=(b)=>{
          options.startsWith= b===b1?1:2;
          _S.tint(b,C_ORANGE);
          playClick();
          _.delay(CLICK_DELAY, ()=> _Z.runEx("PlayGame", options));
        };

        doBackDrop(this);
        self.insert(_Z.layoutX([s, b1, gap, b2],{bg:"transparent"}))
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doMenu=function(){
          const cfg={fontSize: 64*K, fontName:UI_FONT},
            gap=_S.bmpText("or", cfg),
            space=()=> _S.opacity(_S.bmpText("I",cfg),0),
            b1=_S.uuid(_I.mkBtn(_S.bmpText("One Player", cfg)),"play#1"),
            b2=_S.uuid(_I.mkBtn(_S.bmpText("Two Player", cfg)),"play#2");
          b1.m5.press=
          b2.m5.press=function(b){
            b.tint=C_ORANGE;
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runEx("StartMenu", {mode: b.m5.uuid == "play#1"?1:2}) );
          };
          self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doMenu();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(options){
        let m,p1,p2,K=Mojo.getScaleFactor();
        _G.mode=options.mode;
        _.inject(this.g,{
          initLevel(){
            m= _G.mediator= new C4Mediator();
            m.add(p1=new C4Human("blue",_G.X));
            if(options.mode==1){
              m.add(p2=new C4Bot("red",_G.O));
              p2.ai=_G.AI(p1,p2);
            }else{
              m.add(p2=new C4Human("red",_G.O));
            }
            return m;
          },
          initArena(scene,M){
            let g= _S.gridXY([COLS,ROWS],0.8,0.8);
            _G.tiles=[];
            _G.grid=g;
            _G.arena= _S.gridBBox(0,0,g);
            for(let t,r,y=0;y<g.length;++y){
              r=g[y];
              t=[];
              for(let z,s,c,x=0;x<r.length;++x){
                s=_S.spriteFrom("white.png",
                                //"green.png","orange.png"
                                "blue.png","red.png");
                c=r[x];
                z=int(0.9*(c.x2-c.x1));
                z=_.evenN(z,1);
                _I.mkBtn( _S.anchorXY(s,0.5));
                s.g.row=y;
                s.g.col=x;
                s.width=z;
                s.height=z;
                s.x= _M.ndiv(c.x1+c.x2,2);
                s.y= _M.ndiv(c.y1+c.y2,2);
                s.m5.press=()=>{
                  if(!M.isGameOver() &&
                     _G.maxY(M.gameState(),s.g.col)==s.g.row){
                    _I.undoButton(s);
                    M.updateMove(M.cur(),[s.g.row,s.g.col]);
                  }
                };
                s.alpha=0.1;
                t.push(s);
                scene.insert(s);
              }
              _G.tiles.push(t);
            }
            scene.insert(_S.bboxFrame(_G.arena));
            return M;
          }
        });

        doBackDrop(this) &&
          this.g.initArena(this, this.g.initLevel()).start(options.startsWith==1?p1:p2);
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
      },
      postUpdate(){
        let m=_G.mediator;
        if(m.isGameOver()){
          this.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{win: m.winner()}));
        }else{
          for(let r,x=0,cs=m.gameState();x<COLS;++x){
            r=_G.maxY(cs,x);
            if(r>=0) _G.tiles[r][x].alpha=0.3;
          }
        }
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["bg.jpg", "base.png","tiles.png",
                 "images/base.json", "images/tiles.json",
                 "audioOn.png","audioOff.png",
                 "click.mp3","game_over.mp3","game_win.mp3","x.mp3","o.mp3"],
    arena:{width:1344, height:840},
    iconSize: 96,
    scaleFit:"x",
    scaleToWindow:"max",
    start(...args){ scenes(...args) }

  }));

})(this);





