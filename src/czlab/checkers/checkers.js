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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load dependencies
    window["io/czlab/checkers/AI"](Mojo);

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_, is}= Mojo;

    const {Bot,
           Local,Mediator}=Mojo;


    const int=Math.floor;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      COLS=8,
      ROWS=8,
      DELAY=343,
      TEAM_RED="red",
      TEAM_BLACK="black";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Checkers",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkStatus(s){
      let out={}, R=0, B=0, RK=0, BK=0;
      for(let r,y=0; y< s.length; ++y){
        r=s[y];
        for(let c,x=0; x < r.length; ++x){
          if(c=r[x]){
            if(c.team==TEAM_BLACK){
              if(c.king) ++BK; else ++B;
            }
            if(c.team==TEAM_RED){
              if(c.king) ++RK; else ++R;
            }
          }
        }
      }
      out[TEAM_BLACK]=[B,BK];
      out[TEAM_RED]=[R,RK];
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isWon(s){
      let R=0, B=0;
      for(let r,y=0; y< s.length; ++y){
        r=s[y];
        for(let x=0; x < r.length; ++x){
          if(r[x]){
            if(r[x].team==TEAM_BLACK) ++B;
            if(r[x].team==TEAM_RED) ++R;
          }
        }
      }
      return R==0&&B>0 ? TEAM_BLACK : (B==0&&R>0? TEAM_RED : "")
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isTie(s){
      return _calcNextMoves(TEAM_RED,s)[2]==0 ||
             _calcNextMoves(TEAM_BLACK,s)[2]==0
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      TEAM_RED,
      TEAM_BLACK,
      X:88,
      O:79,
      isWon,
      isTie,
      checkStatus
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkEnd(){
      let
        S= _G.mediator.gameState(),
        msg,c,o,w= isWon(S);

      if(w || isTie(S)){
        o=_G.mediator.other();
        c=_G.mediator.cur();
        msg="No Winner!";
        if(w==TEAM_RED || _G.redScore>_G.blackScore)
          msg=_G.mode==1?"You Lose!": "Player 2 (red) Wins";
        if(w==TEAM_BLACK || _G.blackScore>_G.redScore)
          msg=_G.mode==1?"You Win!":"Player 1 (black) Wins";
        w= c.uuid()==w ? c : ( o.uuid()==w ? o : UNDEF);
        _G.mediator.gameOver(w);
        _.delay(DELAY,()=> _Z.modal("EndGame",{

          fontSize: 72*Mojo.getScaleFactor(),
          winner: msg.includes("Win"),
          msg,
          replay: {name:"MainMenu"},
          quit: {name:"Splash",cfg: SplashCfg}

        }));
      }

      return msg;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bggreen.jpg")));
    const _new8x8=()=> _.fill(ROWS,()=> _.fill(COLS,0));
    const _posOK=(row,col)=> row>=0&&row<ROWS&&col>=0&&col<COLS;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardStepOn(row,col,M){
      //make target cell clickable
      if(_posOK(row,col) && M[row][col]=="S")
        _I.mkBtn(_G.board[row][col]).m5.showFrame(1)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardJumpOn(team,row,col,dy,dx,M,S){
      //make target cell clickable
      let
        r2,k1,
        s=_posOK(row,col)?S[row][col]:UNDEF;
      if(s && s.team != team){
        r2=row+dy;
        k1=col+dx;
        if(_posOK(r2,k1) && M[r2][k1]=="J")
          _I.mkBtn(_G.board[r2][k1]).m5.showFrame(1)
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardShowTargets(sel,M,S){
      let
        e,r1,r2,c1,c2,
        {row,col,dirY,dirX}= sel;
      _resetBoard();
      for(let t,s,c,y=0;y<ROWS;++y){
        for(let x=0;x<COLS;++x){
          t=_G.tiles[y][x];
          s=S[y][x];
          c=M[y][x];
          if(!s || c==0 || !(y==row&&x==col)){
            if(s){
              _.assert(t,`bad cell[${y},${x}]`);
              t.m5.showFrame(s.king?3:0);
            }
            continue;
          }
          dirY.forEach(dy=>{
            c1=col+dirX[0];
            c2=col+dirX[1];
            r1=row+dy;
            _boardStepOn(r1,c1,M);
            _boardStepOn(r1,c2,M);
            _boardJumpOn(s.team,r1,c1,dy,dirX[0],M,S);
            _boardJumpOn(s.team,r1,c2,dy,dirX[1],M,S);
          });
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //find all the possible cells that can move
    function _calcSteps(row,col,S){
      let
        r,c,out=[],
        {dirX,dirY}= S[row][col];
      dirY.forEach(dy=>{
        r=row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          if(_posOK(r,c) && !S[r][c]){
            out.push([r,c,"S"],
                     [row,col,"s"]);
          }
        });
      });
      if(out.length>0) return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //find all the possible cells that can eat the opponent piece
    function _calcJumps(row,col,S){
      let {team,dirX,dirY}= S[row][col];
      let s,r2,c2,r,c,out=[];
      dirY.forEach(dy=>{
        r= row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          s=_posOK(r,c)?S[r][c]:null;
          if(s && s.team != team){
            r2=r+dy;
            c2=c+dx;
            if(_posOK(r2,c2)&& !S[r2][c2]){
              out.push([r2,c2,"J"]);
              out.push([row,col,"j"]);
            }
          }
        });
      });
      if(out.length>0) return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _calcNextMoves(team,S){
      let
        jumps=[],
        steps=[],
        dict={},
        tmp, total=0, mask=_new8x8();
      S.forEach((r,y)=>{
        r.forEach((s,x)=>{
          if(s && s.team==team){
            if(tmp=_calcJumps(y,x,S)){
              tmp.forEach(o=>jumps.push(o))
            }else if(tmp= _calcSteps(y,x,S)){
              tmp.forEach(o=>steps.push(o))
            }
          }
        });
      })
      _.assert(_.isEven(jumps.length),"Bad jumps");
      _.assert(_.isEven(steps.length),"Bad steps");
      tmp=UNDEF;
      if(jumps.length>0){
        tmp=jumps
      }else if(steps.length>0){
        tmp=steps;
      }
      if(tmp){
        for(let p,i=0;i<tmp.length;++i){
          p=tmp[i];
          if(i%2==1){
            ++total;
            dict[`${p[0]},${p[1]}`]=[p[0],p[1], tmp[i-1]];
          }
          mask[p[0]][p[1]]=p[2];
        }
      }
      return [mask,dict,total];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _resetMask(m){
      (m||_G.mask).forEach(r=>{
        for(let i=0;i<r.lenght;++i)r[i]=0;
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _resetBoard(){
      for(let s,y=0; y<ROWS; ++y)
      for(let x=0;x<COLS;++x){
        s=_G.board[y][x];
        if(s.g.dark)
          _I.undoBtn(s).m5.showFrame(0)
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKBot extends Bot{
      constructor(team,v){
        super(team);
        this.team=team;
        this.pvalue=v;
      }
      checkMoreJumps(move,S){
        let
          ok,t,f,out,
          [row,col,act]=move[2];
        if(act=="J")
          out= _calcJumps(row,col,S);
        if(out && out.length>0){
          t=out[0];
          f=out[1];
          //fake the next move
          move=[f[0],f[1], t];
          _.delay(584, ()=> {
            this.owner.updateMove(this, move)
          });
          ok=true;
        }
        return ok;
      }
      stateValue(){
        return this.pvalue;
      }
      onPoke(){
        _.delay(888,(move)=>{
          move=this.ai.run(_G.mediator.gameState(), this);
          if(move) _G.mediator.updateMove(this,move);
        })
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKHuman extends Local{
      constructor(team,v){
        super(team);
        this.team=team;
        this.pvalue=v;
      }
      stateValue(){
        return this.pvalue;
      }
      onPoke(){
        const
          S= _G.mediator.gameState(),
          mask= _calcNextMoves(this.team,S)[0];
        _G.mask=mask;
        for(let s,t,y=0;y<ROWS;++y)
        for(let x=0;x<COLS;++x){
          t=_G.tiles[y][x];
          s=S[y][x];
          if(s)
            _.assert(t,"Bad cell");
          if(mask[y][x]=="s" || mask[y][x]=="j"){
            t.m5.showFrame(1);
          }else if(s){
            t.m5.showFrame(s.king?3:0);
          }
        }
        super.onPoke();
      }
      onWait(){
        super.onWait();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKMediator extends Mediator{
      constructor(){
        super();
        this.state=_new8x8();
      }
      updateSound(actor){
        Mojo.playSfx(actor.team==TEAM_BLACK?"x.mp3":"o.mp3")
      }
      updateState(from,move){
        let
          [r,c,target]=move,
          [row,col,act]=target,
          S= this.gameState(),
          cur=S[r][c],
          er,ec,t, des=S[row][col];
        switch(act){
          case "J":
            er= row>r? row-1 : row+1;
            ec= col>c? col-1 : col+1;
            t=_G.tiles[er][ec];
            _S.remove(_I.undoBtn(t));
            S[er][ec]=UNDEF;
            _G.tiles[er][ec]=UNDEF;
            _chgScore(from.team==TEAM_RED?TEAM_BLACK:TEAM_RED);
            break;
          //case "S": break;
        }
        _moveTo(r,c, row,col,UNDEF,S);
      }
      postMove(from,move){
        let S= this.gameState();
        if(from instanceof CKBot){
          if(from.checkMoreJumps(move,S)){return}
        }
        _nextToPlay();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _postMove(row,col,S){
      //check if a king is borned!
      const p=S[row][col];
      _.assert(p,"Bad post move");
      if(p.team==TEAM_RED){
        if(p.row==ROWS-1){
          p.dirY=[1,-1];
          p.king=true;
        }
      }else{
        if(p.row==0){
          p.dirY=[-1,1];
          p.king=true;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _chgScore(teamEaten){
      teamEaten==TEAM_RED ? _G.blackScore++ : _G.redScore++ }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //move to target row/col
    function _moveTo(r,c, row,col,M,S){
      let
        s=S[r][c],
        t=_G.tiles[r][c]; //cur
      _.assert(t, "Bad move, current sprite null");
      //move to new cell position
      S[r][c]=UNDEF;
      s.row=row;
      s.col=col;
      S[row][col]=s;
      //move the actual sprite
      _G.tiles[row][col]=t;
      _G.tiles[r][c]=UNDEF;
      t.g.row=row;
      t.g.col=col;
      _V.copy(t,_G.board[row][col]);
      //update state cell
      _postMove(row,col,S);
      t.m5.showFrame(s.king?3:0);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _eatPiece(r,c, row,col,M,S){
      let
        er=row>r? row-1 : row+1,
        ec=col>c? col-1 : col+1,
        s=S[er][ec], t=_G.tiles[er][ec];
      //reset cells
      _G.tiles[er][ec]=UNDEF;
      S[er][ec]=UNDEF;
      _.assert(t&&s, "Bad piece to eat");
      _S.remove(_I.undoBtn(t));
      _chgScore(s.team);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //fake a bunch of stuff to show next jump
    function _nextJump(row,col,out,M,S){
      _.assert(out.length>0, "bad consecutive jump");
      let b,r,c,v,t=_G.tiles[row][col];
      t.m5.showFrame(2);
      _resetMask(M);
      out.forEach(o=>{
        r=o[0];
        c=o[1];
        v=o[2];
        M[r][c]=v;
        if(v=="J")
          _I.mkBtn(_G.board[r][c]).m5.showFrame(1)
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function makeMove(r,c,row,col,M,S){
      _moveTo(r,c,row,col,M,S);
      _resetMask();
      _resetBoard();
      _G.curSel=S[row][col];
      _G.mediator.updateSound( _G.mediator.cur());
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _nextToPlay(){
      if(checkEnd()){
      }else{
        _G.curSel=UNDEF;
        _.delay(100,()=>_G.mediator.takeTurn());
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onClick(t){
      let
        S=_G.mediator.gameState(),
        M=_G.mask,
        {row,col}=t.g, out, s=S[row][col];
      switch(M[row][col]){
        case "S":
          if(_G.curSel){
            makeMove(_G.curSel.row,_G.curSel.col, row, col, M, S);
            _nextToPlay();
          }
          break;
        case "J":
          if(_G.curSel){
            _eatPiece(_G.curSel.row,_G.curSel.col, row, col, M, S);
            makeMove(_G.curSel.row,_G.curSel.col, row, col, M, S);
            if(out=_calcJumps(row,col,S)){
              //more consecutive jumps
              _nextJump(row,col,out,M,S)
            }else{
              _nextToPlay();
            }
          }
          break;
        default:
          if(s){ //clicked on a piece
            _.assert(s.row==row && s.col==col, "Bad row/col on click");
            let undo=false;
            if(_G.curSel){
              if(_G.curSel===s){
                _G.curSel=UNDEF;
                undo=true;
              }
            }
            if(!_G.curSel){
              if(undo){
                _resetBoard();
                _G.mediator.redoTurn();
              }else if(M[row][col]=="s" || M[row][col]=="j"){
                _G.curSel=s;
                t.m5.showFrame(2);
                _boardShowTargets(s,M,S);
              }
            }
          }
          break;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        let
          self=this,
          mode=1,
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT, fontSize: 72*K},
          space=()=> _S.opacity(_S.bmpText("I",cfg),0),
          b1=_I.mkBtn(_S.uuid(_S.bmpText("One Player",cfg),"#p1")),
          gap=_S.bmpText("or",cfg),
          b2=_I.mkBtn(_S.uuid(_S.bmpText("Two Player",cfg),"#p2"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2") mode=2;
          _S.tint(btn,C_ORANGE);
          Mojo.playSfx("click.mp3");
          _.delay(DELAY,()=> _Z.runEx("StartMenu",{mode}));
        };
        doBackDrop(this);
        this.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("StartMenu",{
      setup(options){
        let
          self=this,
          startsWith=1,
          K=Mojo.getScaleFactor(),
          cfg={fontName: UI_FONT, fontSize: 72*K},
          space=()=> _S.opacity(_S.bmpText("I",cfg),0),
          msg= _S.bmpText("Player 1 (Black) starts? ",cfg),
          b1=_I.mkBtn(_S.uuid(_S.bmpText("Yes",cfg),"#yes")),
          gap=_S.bmpText(" / ",cfg),
          b2= _I.mkBtn(_S.uuid(_S.bmpText("No",cfg),"#no"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          _S.tint(btn,C_ORANGE);
          Mojo.playSfx("click.mp3");
          if(btn.m5.uuid=="#no") startsWith=2;
          options.startsWith=startsWith;
          _.delay(DELAY,()=> _Z.runEx("PlayGame",options));
        };
        doBackDrop(this);
        this.insert(_Z.layoutX([msg,space(),b1, gap, b2],{bg:"transparent"}));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(options){
        let
          self=this,
          p1,p2,M,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.calcNextMoves=_calcNextMoves;
        _G.mode=options.mode;
        _G.blackScore=0;
        _G.redScore=0;
        _.inject(this.g,{
          initLevel(){
            M= _G.mediator= new CKMediator();
            M.add(p1= new CKHuman(TEAM_BLACK, _G.X));
            if(options.mode==1){
              M.add(p2= new CKBot(TEAM_RED, _G.O));
              p2.ai= _G.AI(p1,p2);
            }else{
              M.add(p2= new CKHuman(TEAM_RED, _G.O));
            }
            return M;
          },
          initBoard(){
            let g= _G.grid= _S.gridXY([COLS,ROWS]);
            _G.arena= _S.gridBBox(0,0,g);
            _G.board=[];
            g.forEach((r,y)=>{
              let z,t=[];
              r.forEach((c,x)=>{
                let s;
                if((_.isEven(y)&&_.isEven(x))||
                   (!_.isEven(y)&&!_.isEven(x))){
                  s=_S.sprite("light.png");
                }else{
                  s=_S.spriteFrom("dark.png","dark1.png");
                  s.g.dark=true;
                  s.m5.press=()=>M.isGameOver()?0:_onClick(s,M)
                }
                t.push(s);
                z=c.x2-c.x1;
                s.g.row=y;
                s.g.col=x;
                _S.sizeXY(s,z,z);
                _V.set(s, _M.ndiv(c.x1+c.x2,2), _M.ndiv(c.y1+c.y2,2));
                self.insert( _S.anchorXY(s,0.5));
              });
              _G.board.push(t);
            });
            return this;
          },
          initArena(){
            let T=[],S=[];
            _G.grid.forEach((r,y)=>{
              let z,w=[],t=[];
              r.forEach((c,x)=>{
                let k=null, s=null;
                if((_.isEven(y)&&_.isEven(x))||
                   (!_.isEven(y)&&!_.isEven(x))){
                }else{
                  if(y<3){ //red
                    s=_S.spriteFrom("red.png","red1.png","red2.png","red3.png");
                    k={team:TEAM_RED, dirY:[1], dirX:[-1,1]};
                  }else if(y>4){ //black
                    s=_S.spriteFrom("black.png","black1.png","black2.png","black3.png");
                    k={team:TEAM_BLACK, dirY:[-1], dirX:[-1,1]};
                  }
                }
                w.push(k);
                t.push(s);
                if(s){
                  z=_.evenN(0.85*(c.x2-c.x1),1);
                  _I.mkBtn(_S.sizeXY(s,z,z));
                  s.m5.showFrame(0);
                  s.g.row=y;
                  s.g.col=x;
                  s.alpha=0.9;
                  k.row=y;
                  k.col=x;
                  _V.set(s,_M.ndiv(c.x1+c.x2,2), _M.ndiv(c.y1+c.y2,2));
                  self.insert(_S.anchorXY(s,0.5));
                  s.m5.press=()=>M.isGameOver()?0:_onClick(s,M);
                }
              });
              T.push(t);
              S.push(w);
            });
            _G.tiles=T;
            _G.mediator.gameState(S);
            return self.insert(_S.bboxFrame(_G.arena,16*K,"#7f98a6"));
          },
          initHud(){
            let r2= this.red=_S.bmpText("00",UI_FONT,48*K);
            let b2=this.black=_S.bmpText("00",UI_FONT,48*K);
            r2.tint=_S.SomeColors.red;
            b2.tint=_S.SomeColors.black;
            r2.alpha=0.7;
            b2.alpha=0.7;
            _S.pinLeft(_G.arena,r2,24*K,0);
            _S.pinRight(_G.arena,b2,24*K,0);
            self.insert(r2);
            self.insert(b2);
            return this;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() &&
          this.g.initBoard() && this.g.initArena() && this.g.initHud();
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        M.start(options.startsWith==1?p1:p2);
      },
      postUpdate(){
        this.g.red.text=_.prettyNumber(_G.redScore,2);
        this.g.black.text=_.prettyNumber(_G.blackScore,2);
      }
    });


    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["bggreen.jpg","base.png","reds.png","blacks.png",
                 "audioOn.png","audioOff.png",
                 "images/base.json", "images/reds.json","images/blacks.json",
                 "x.mp3", "o.mp3", "click.mp3","game_win.mp3","game_over.mp3"],
    arena: {width: 1344, height: 840},
    iconSize: 96,
    scaleFit:"y",
    scaleToWindow:"max",
    start(...args){ scenes(...args) }
  }));

})(this);





