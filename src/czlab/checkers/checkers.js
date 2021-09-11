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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load dependencies
    window["io/czlab/checkers/AI"](Mojo);

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_X,
           v2:_V,
           ute:_, is}= Mojo;

    const {Bot,
           Local,Mediator}=Mojo;

    const TEAM_RED="red",
          TEAM_BLACK="black";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;
    function playClick(){
      Mojo.sound("click.mp3").play()
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      TEAM_BLACK: TEAM_BLACK,
      TEAM_RED: TEAM_RED,
      COLS:8,
      ROWS:8,
      X:1,
      O:2,
      checkStatus(s){
        let out={}, R=0, B=0, RK=0, BK=0;
        for(let r,y=0; y< s.length; ++y){
          r=s[y];
          for(let c,x=0; x < r.length; ++x){
            if(c=r[x]){
              if(c.team===TEAM_BLACK){
                if(c.king) ++BK; else ++B;
              }
              if(c.team===TEAM_RED){
                if(c.king) ++RK; else ++R;
              }
            }
          }
        }
        out[TEAM_BLACK]=[B,BK];
        out[TEAM_RED]=[R,RK];
        return out;
      },
      isWon(s){
        let R=0, B=0;
        for(let r,y=0; y< s.length; ++y){
          r=s[y];
          for(let x=0; x < r.length; ++x){
            if(r[x]){
              if(r[x].team===TEAM_BLACK) ++B;
              if(r[x].team===TEAM_RED) ++R;
            }
          }
        }
        return R===0&&B>0 ? TEAM_BLACK : (B===0&&R>0? TEAM_RED : "")
      },
      isTie(s){
        return _calcNextMoves(TEAM_RED,s)[2]===0 &&
               _calcNextMoves(TEAM_BLACK,s)[2]===0
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkEnd(){
      let S= _G.mediator.gameState();
      let msg,w= _G.isWon(S);
      if(w || _G.isTie(S)){
        msg="No Winner!";
        if(_G.redScore>11){
          msg=_G.mode===1?"You Lose!": "Player 2 (red) Wins";
        }else if(_G.blackScore>11){
          msg=_G.mode===1?"You Win!":"Player 1 (black) Wins";
        }
        _G.mediator.gameOver(w);
        _I.resetAll();
        _.delay(100,()=> _Z.runScene("EndGame",{msg}));
      }
      return msg;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bggreen.jpg"),Mojo.width,Mojo.height);
      return scene.insert(_G.backDropSprite);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _new8x8(){
      return _.fill(_G.ROWS,()=> _.fill(_G.COLS,0)) }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _posOK(row,col){
      return row>=0&&row<_G.ROWS&&col>=0&&col<_G.COLS }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardStepOn(row,col,M){
      //make target cell clickable
      if(_posOK(row,col) && M[row][col]=="S")
        _I.mkBtn(_G.board[row][col]).m5.showFrame(1)
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardJumpOn(team,row,col,dy,dx,M,S){
      //make target cell clickable
      let r2,k1,
          s=_posOK(row,col)?S[row][col]:null;
      if(s && s.team != team){
        r2=row+dy;
        k1=col+dx;
        if(_posOK(r2,k1) && M[r2][k1]=="J")
          _I.mkBtn(_G.board[r2][k1]).m5.showFrame(1)
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardShowTargets(sel,M,S){
      let {row,col,dirY,dirX}= sel;
      let e,r1,r2,c1,c2;
      _resetBoard();
      for(let t,s,c,y=0;y<_G.ROWS;++y){
        for(let x=0;x<_G.COLS;++x){
          t=_G.tiles[y][x];
          s=S[y][x];
          c=M[y][x];
          if(!s || c===0 || !(y===row&&x===col)){
            if(s){
              _.assert(t,"Bad cell");
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
      let {dirX,dirY}= S[row][col];
      let r,c,out=[];
      dirY.forEach(dy=>{
        r=row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          if(_posOK(r,c) && !S[r][c]){
            out.push([r,c,"S"]);
            out.push([row,col,"s"]);
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
      let jumps=[],
          steps=[],
          dict={},
          tmp,
          total=0,
          mask=_new8x8();
      S.forEach((r,y)=>{
        r.forEach((s,x)=>{
          tmp=null;
          if(s && s.team==team){
            if(tmp=_calcJumps(y,x,S)){
              tmp.forEach(o=>jumps.push(o));
            }else if(tmp= _calcSteps(y,x,S)){
              tmp.forEach(o=>steps.push(o));
            }
          }
        });
      })
      _.assert(_.isEven(jumps.length),"Bad jumps");
      _.assert(_.isEven(steps.length),"Bad steps");
      tmp=null;
      if(jumps.length>0){
        tmp=jumps
      }else if(steps.length>0){
        tmp=steps;
      }
      if(tmp){
        for(let p,i=0;i<tmp.length;++i){
          p=tmp[i];
          if(i%2===1){
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
      for(let s,y=0; y<_G.ROWS; ++y)
      for(let x=0;x<_G.COLS;++x){
        s=_G.board[y][x];
        if(s.g.dark)
          _I.undoBtn(s).m5.showFrame(0)
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKBot extends Bot{
      constructor(pnum,team){
        super("ckbot")
        this.pnum=pnum;
        this.team=team;
        let p,t2=team==TEAM_RED? TEAM_BLACK : TEAM_RED;
        if(pnum===2){
          this.ai= _G.AI([_G.X,t2],p=[_G.O,team, this]);
        }else{
          this.ai= _G.AI([_G.O,team],p=[_G.X,t2,this]);
        }
        this.pobj=p;
      }
      checkMoreJumps(from, move,S){
        let ok,t,f,out,
            [row,col,act]=move[2];
        if(act=="J")
          out= _calcJumps(row,col,S);
        if(out && out.length>0){
          t=out[0];//[r2,c2,"J"]
          f=out[1];//[row,col,"j"]
          //fake the next move
          move=[f[0],f[1], t];
          _.delay(584, ()=>{
            this.owner.updateMove(from, move)
          });
          ok=true;
        }
        return ok;
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        _.delay(888,()=>{
          let move=this.ai.run(_G.mediator.gameState(), this.pobj);
          if(move) _G.mediator.updateMove(this.pobj,move);
        })
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKHuman extends Local{
      constructor(pnum,team){
        super(`P${pnum}`);
        this.pnum=pnum;
        this.team=team;
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        const S= _G.mediator.gameState(),
              mask= _calcNextMoves(this.team,S)[0];
        _G.mask=mask;
        for(let s,t,y=0;y<_G.ROWS;++y)
        for(let x=0;x<_G.COLS;++x){
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
      constructor(cur){
        super();
        this.pcur=cur;
        this.state=_new8x8();
      }
      updateSound(actor){
        if(actor[0]===1)
          Mojo.sound("x.mp3").play();
        if(actor[0]===2)
          Mojo.sound("o.mp3").play();
      }
      updateState(from,move){
        let [r,c,target]=move;
        let [row,col,act]=target;
        let S= this.gameState();
        let cur=S[r][c];
        let des=S[row][col];
        let er,ec,t;
        switch(act){
          case "J":
            er= row>r? row-1 : row+1;
            ec= col>c? col-1 : col+1;
            t=_G.tiles[er][ec];
            _S.remove(_I.undoBtn(t));
            S[er][ec]=null;
            _G.tiles[er][ec]=null;
            _chgScore(from[1]==TEAM_RED?TEAM_BLACK:TEAM_RED);
            break;
          case "S":
            break;
        }
        _moveTo(r,c, row,col,null,S);
      }
      postMove(from,move){
        let S= this.gameState();
        if(from[2] instanceof CKBot){
          if(from[2].checkMoreJumps(from, move,S)){return}
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
        if(p.row===_G.ROWS-1){
          p.dirY=[1,-1];
          p.king=true;
        }
      }else{
        if(p.row===0){
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
      let s=S[r][c],
          t=_G.tiles[r][c]; //cur
      _.assert(t, "Bad move, current sprite null");
      //move to new cell position
      S[r][c]=null;
      s.row=row;
      s.col=col;
      S[row][col]=s;
      //move the actual sprite
      _G.tiles[row][col]=t;
      _G.tiles[r][c]=null;
      t.g.row=row;
      t.g.col=col;
      _V.copy(t,_G.board[row][col]);
      //update state cell
      _postMove(row,col,S);
      t.m5.showFrame(s.king?3:0);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _eatPiece(r,c, row,col,M,S){
      let er=row>r? row-1 : row+1;
      let ec=col>c? col-1 : col+1;
      let t=_G.tiles[er][ec];
      let s=S[er][ec];
      //reset cells
      _G.tiles[er][ec]=null;
      S[er][ec]=null;
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
      let p= _G.mediator.player();
      _moveTo(r,c,row,col,M,S);
      _resetMask();
      _resetBoard();
      _G.curSel=S[row][col];
      Mojo.sound(p.team==TEAM_BLACK?"x.mp3":"o.mp3").play();
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _nextToPlay(){
      if(checkEnd()){
      }else{
        _G.curSel=null;
        _.delay(100,()=>_G.mediator.takeTurn());
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onClick(t){
      let S=_G.mediator.gameState();
      let M=_G.mask;
      let {row,col}=t.g;
      let out, s=S[row][col];
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
            _.assert(s.row===row && s.col===col, "Bad row/col on click");
            let undo=false;
            if(_G.curSel){
              if(_G.curSel===s){
                _G.curSel=null;
                undo=true;
              }
              //if(_G.curSel){ _G.tiles[_G.curSel.row][_G.curSel.col].m5.showFrame(1); }
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
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Checkers",{fontName:TITLE_FONT, fontSize: 100*K});
          _S.tint(s,C_TITLE);
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,b,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT, fontSize: 48*K});
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          b=_I.mkBtn(s);
          t=_X.throb(b,0.99);
          b.m5.press=(btn)=>{
            _X.remove(t);
            btn.tint=C_ORANGE;
            playClick();
            _.delay(CLICK_DELAY, ()=> _Z.runSceneEx("MainMenu"));
          };
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      },
    });
    _Z.defScene("MainMenu",{
      setup(){
        let self=this,
            mode=1,
            K=Mojo.getScaleFactor(),
            cfg={fontName:UI_FONT, fontSize: 72*K};
        function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
        let b1=_I.mkBtn(_S.uuid(_S.bmpText("One Player",cfg),"#p1"));
        let gap=_S.bmpText("or",cfg);
        let b2=_I.mkBtn(_S.uuid(_S.bmpText("Two Player",cfg),"#p2"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2") mode=2;
          _S.tint(btn,C_ORANGE);
          playClick();
          _.delay(CLICK_DELAY,()=> _Z.runSceneEx("StartMenu",{mode}));
        };
        doBackDrop(this);
        this.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("StartMenu",{
      setup(options){
        let self=this,
            startsWith=1,
            K=Mojo.getScaleFactor(),
            cfg={fontName: UI_FONT, fontSize: 72*K};
        function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
        let msg= _S.bmpText("Player 1 (Black) starts? ",cfg);
        let b1=_I.mkBtn(_S.uuid(_S.bmpText("Yes",cfg),"#yes"));
        let gap=_S.bmpText(" / ",cfg);
        let b2= _I.mkBtn(_S.uuid(_S.bmpText("No",cfg),"#no"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          _S.tint(btn,C_ORANGE);
          playClick();
          if(btn.m5.uuid=="#no") startsWith=2;
          options.startsWith=startsWith;
          _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame",options));
        };
        doBackDrop(this);
        this.insert(_Z.layoutX([msg,space(),b1, gap, b2],{bg:"transparent"}));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("EndGame",{
      setup(options){
        let s1,s2,
            snd="game_over.mp3",
            s4,s5,s6,os={fontName:UI_FONT,
                         fontSize: 72*Mojo.getScaleFactor()};
        let space=(s)=>{ s=_S.bmpText("I",os); s.alpha=0; return s; };
        s1=_S.bmpText("Game Over", os);
        s2=_S.bmpText(options.msg||"No Winner!", os);
        s4=_I.makeButton(_S.bmpText("Play Again?",os));
        s5=_S.bmpText(" or ",os);
        s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=>{ _Z.runSceneEx("MainMenu") };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
        if(options.msg) snd="game_win.mp3";
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(options){
        const self=this,
              K=Mojo.getScaleFactor();
        let M;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.calcNextMoves=_calcNextMoves;
        _G.mode=options.mode;
        _G.blackScore=0;
        _G.redScore=0;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          M= _G.mediator= new CKMediator(options.startsWith);
          if(options.mode===1){
            M.add(new CKHuman(1,TEAM_BLACK));
            M.add(new CKBot(2,TEAM_RED));
          }else{
            M.add(new CKHuman(1,TEAM_BLACK));
            M.add(new CKHuman(2,TEAM_RED));
          }
          return M;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initBoard=()=>{
          let g= _G.grid= _S.gridXY([_G.COLS,_G.ROWS]);
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
              _V.set(s, int((c.x1+c.x2)/2), int((c.y1+c.y2)/2));
              self.insert( _S.centerAnchor(s));
            });
            _G.board.push(t);
          });
          return this;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initArena=()=>{
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
                _V.set(s,int((c.x1+c.x2)/2), int((c.y1+c.y2)/2));
                self.insert(_S.centerAnchor(s));
                s.m5.press=()=>M.isGameOver()?0:_onClick(s,M);
              }
            });
            T.push(t);
            S.push(w);
          });
          _G.tiles=T;
          _G.mediator.gameState(S);
          return self.insert(_S.bboxFrame(_G.arena,16*K,"#7f98a6"));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHud=(r,b)=>{
          r= this.g.red=_S.bitmapText("00",{fontName:UI_FONT,fontSize:36*K});
          b=this.g.black=_S.bitmapText("00",{fontName:UI_FONT,fontSize:36*K});
          this.insert(r);
          this.insert(b);
          return _S.pinBottom(r,b);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() &&
          this.g.initBoard() && this.g.initArena() && this.g.initHud();
        M.start();
      },
      postUpdate(){
        this.g.red.text=  `  Red Score: ${_.prettyNumber(_G.redScore,2)}`;
        this.g.black.text=`Black Score: ${_.prettyNumber(_G.blackScore,2)}`;
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bggreen.jpg","images/base.json",
                 "images/reds.json","images/blacks.json", "x.mp3", "o.mp3", "click.mp3","game_win.mp3","game_over.mp3"],
    arena:{width:1024, height:768},
    iconSize: 96,
    rendering:false,//"crisp-edges",
    scaleFit:"y",
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





