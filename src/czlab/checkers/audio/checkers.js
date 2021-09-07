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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bggreen.jpg"),Mojo.width,Mojo.height);
      return scene.insert(_G.backDropSprite);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _newState(){
      return _.fill(_G.ROWS,()=> _.fill(_G.COLS,0)) }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _posOK(row,col){
      return row>=0&&row<_G.ROWS&&col>=0&&col<_G.COLS }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardStepOn(row,col,M){
      if(M.gameState()[row][col]=="S"){
        _G.board[row][col].m5.showFrame(1);
        _I.mkBtn(_G.board[row][col]);
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _boardJumpOn(s,row,col,dy,dx,M){
      let r2,k1,e=_G.tiles[row][col];
      if(e && e.g.team!=s.g.team){
        r2=row+dy;
        k1=col+dx;
        if(_posOK(r2,k1) && M.gameState()[r2][k1]=="J"){
          _G.board[r2][k1].m5.showFrame(1);
          _I.mkBtn(_G.board[r2][k1]);
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _showTargets(M){
      let {row,col,dirY,dirX}= _G.curSel.g;
      let e,r1,r2,c1,c2;
      let state=M.gameState();
      _resetBoard();
      for(let s,c,r,y=0;y<_G.ROWS;++y){
        r=state[y];
        for(let s,c,x=0;x<_G.COLS;++x){
          s=_G.tiles[y][x];
          c=r[x];
          if(!s || c===0 || !(y===row&&x===col)){
            if(s)
              s.m5.showFrame(s.g.king?3:0);
            continue;
          }
          dirY.forEach(dy=>{
            c1=col+dirX[0];
            c2=col+dirX[1];
            r1=row+dy;
            _boardStepOn(r1,c1,M);
            _boardStepOn(r1,c2,M);
            _boardJumpOn(s,r1,c1,dy,dirX[0],M);
            _boardJumpOn(s,r1,c2,dy,dirX[1],M);
          });
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _calcSteps(ps){
      let {row,col,dirX,dirY}=ps.g;
      let r,c,out=[];
      dirY.forEach(dy=>{
        r=row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          if(_posOK(r,c) && !_G.tiles[r][c]){
            out.push([r,c,"S"]);
            out.push([row,col,"p"]);
          }
        });
      });
      if(out.length>0) return out;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _calcJumps(ps){
      let {row,col,team,dirX,dirY}=ps.g;
      let r2,c2,r,c,s,out=[];
      dirY.forEach(dy=>{
        r= row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          s=_posOK(r,c)?_G.tiles[r][c]:null;
          if(s && s.g.team!=team){
            r2=r+dy;
            c2=c+dx;
            if(_posOK(r2,c2)&& !_G.tiles[r2][c2]){
              out.push([r2,c2,"J"]);
              out.push([row,col,"j"]);
            }
          }
        });
      });
      if(out.length>0) return out;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _calcNextMoves(team){
      let jumps=[],
          steps=[],
          dict={},
          tmp,
          mask=_newState();
      for(let r,y=0;y<_G.ROWS;++y){
        r=_G.tiles[y];
        for(let s,out,x=0;x<_G.COLS;++x){
          s=r[x];
          out=null;
          if(s && s.g.team==team){
            out=_calcJumps(s);
            if(out){
              out.forEach(o=>jumps.push(o));
            }
            out= _calcSteps(s);
            if(out){
              out.forEach(o=>steps.push(o));
            }
          }
        }
      }
      _.assert(_.isEven(jumps.length),"Bad jumps");
      _.assert(_.isEven(steps.length),"Bad steps");
      if(jumps.length>0){
        tmp=jumps
      }else if(steps.length>0){
        tmp=steps;
      }
      if(tmp){
        for(let p,i=0;i<tmp.length;++i){
          p=tmp[i];
          if(i%2===1)
            dict[`${p[0]},${p[1]}`]=tmp[i-1];
          mask[p[0]][p[1]]=p[2];
        }
      }
      return [mask,dict];
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _resetBoard(){
      for(let s,y=0;y<_G.ROWS;++y)
      for(let x=0;x<_G.COLS;++x){
        s=_G.board[y][x];
        if(s.g.dark){
          _I.undoBtn(s);
          s.m5.showFrame(0);
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _resetState(s){
      s.forEach(a=>{
        for(let i=0;i<a.length;++i)a[i]=0;
      });
      return s;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _diag2(row,col){ return _diagXY(row,col,2) }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _diag1(row,col){ return _diagXY(row,col,1) }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _diagXY(row,col,n){
      let r=row-n,
          c=col-n,
          out=[null,null,null,null];
      out[0]=_posOK(r,c)?[r,c]:null;
      c=col+n;
      out[1]=_posOK(r,c)?[r,c]:null;
      r=row+n;
      c=col-n;
      out[2]=_posOK(r,c)?[r,c]:null;
      c=col+n;
      out[3]=_posOK(r,c)?[r,c]:null;
      return out;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CKBot extends Bot{
      constructor(pnum,team){
        super("ckbot")
        this.pnum=pnum;
        this.team=team;
        let p,t2=team=="red"?"black":"red";
        if(pnum===2){
          this.ai= _G.AI([_G.X,t2],p=[_G.O,team]);
        }else{
          this.ai= _G.AI([_G.O,team],p=[_G.X,t2]);
        }
        this.pobj=p;
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        let move=this.ai.run(_G.mediator.gameState(), this.pobj);
        _G.mediator.updateMove(this.pobj,move);
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
        let mask=_calcNextMoves(this.team)[0];
        let state=this.owner.gameState();
        state.length=0;
        mask.forEach(m=>state.push(m));
        for(let y=0;y<_G.ROWS;++y){
          for(let s,x=0;x<_G.COLS;++x){
            s=_G.tiles[y][x];
            if(mask[y][x]=="p"){
              s.m5.showFrame(1);
            }else if(mask[y][x]=="j"){
              s.m5.showFrame(1);
            }else if(s){
              s.m5.showFrame(s.g.king?3:0);
            }
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
        this.state=_newState();
        this.pcur=cur;
      }
      updateState(from,move){
        let i=0;
        ++i;
      }
      postMove(from,move){
        let x=0;
        ++x;
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.checkDraw=function(cells){
      return false;
    };
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
    _G.COLS=8;
    _G.ROWS=8;
    _G.X=1;
    _G.O=2;

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
            _.delay(CLICK_DELAY, ()=> _Z.runSceneEx("MainMenu",{mode:2,startsWith:1}));
          };
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      },
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _postMove(){
      //check if a king is borned!
      const p=_G.curSel;
      if(p.g.team=="red"){
        if(p.g.row===_G.ROWS-1){
          p.g.dirY=[1,-1];
          p.g.king=true;
        }
      }else{
        if(p.g.row===0){
          p.g.dirY=[-1,1];
          p.g.king=true;
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _chgScore(s){
      s.g.team=="red" ? _G.blackScore++ : _G.redScore++ }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _moveTo(row,col){
      let {row:r,col:c}=_G.curSel.g;
      //move to new cell
      _G.tiles[row][col]=_G.curSel;
      _G.tiles[r][c]=null;
      _V.copy(_G.curSel,_G.board[row][col]);
      _G.curSel.g.row=row;
      _G.curSel.g.col=col;
      _postMove();
      _G.curSel.m5.showFrame(_G.curSel.g.king?3:0);
      _G.curSel=null;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _eatPiece(row,col){
      let {row:r,col:c}=_G.curSel.g;
      let er=row>r? row-1 : row+1;
      let ec=col>c? col-1 : col+1;
      let e=_G.tiles[er][ec];
      _G.tiles[er][ec]=null;
      _I.undoBtn(e);
      _chgScore(e);
      _S.remove(e);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _nextJump(row,col,out,M){
      let b,r,c,v,state=M.gameState();
      _G.curSel= _G.tiles[row][col];
      _G.curSel.m5.showFrame(2);
      out.forEach(o=>{
        r=o[0];
        c=o[1];
        v=o[2];
        state[r][c]=v;
        if(v=="J"){
          b=_G.board[r][c];
          b.m5.showFrame(1);
          _I.mkBtn(b);
        }
      });
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onClick(s,M){
      let {row,col}=s.g,
          state=M.gameState(),
          out,c=state[row][col];
      function next(){
        _.delay(100,()=>M.takeTurn())
      }
      switch(c){
        case "S":
          _moveTo(row,col);
          _resetState(state);
          _resetBoard();
          next();
          break;
        case "J":
          _eatPiece(row,col);
          _moveTo(row,col);
          _resetState(state);
          _resetBoard();
          if(out=_calcJumps(_G.tiles[row][col])){
            _nextJump(row,col,out,M)
          }else{
            next();
          }
          break;
        default:
          if(_G.tiles[row][col]){
            //clicked on a piece
            let undo=false;
            if(_G.curSel){
              if(_G.curSel===s){
                _G.curSel=null;
                undo=true;
              }
              if(_G.curSel)
                _G.curSel.m5.showFrame(1);
            }
            if(!_G.curSel){
              if(undo){
                _resetBoard();
                M.redoTurn();
              }else{
                _G.curSel=s;
                s.m5.showFrame(2);
                _showTargets(M);
              }
            }
          }
          break;
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("MainMenu",{
      setup(options){
        const self=this,
              K=Mojo.getScaleFactor();
        let M;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.calcNextMoves=_calcNextMoves;
        _G.blackScore=0;
        _G.redScore=0;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          M= _G.mediator= new CKMediator(options.startsWith);
          if(options.mode===1){
            M.add(new CKHuman(1,"black"));
            M.add(new CKBot(2,"red"));
          }else{
            M.add(new CKHuman(1,"black"));
            M.add(new CKHuman(2,"red"));
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
          _G.tiles=[];
          _G.grid.forEach((r,y)=>{
            let z,t=[];
            r.forEach((c,x)=>{
              let s=null;
              if((_.isEven(y)&&_.isEven(x))||
                 (!_.isEven(y)&&!_.isEven(x))){
              }else{
                if(y<3){ //red
                  s=_S.spriteFrom("red.png","red1.png","red2.png","red3.png");
                  s.g.team="red";
                  s.g.dirY=[1];
                  s.g.dirX=[-1,1];
                }else if(y>4){ //black
                  s=_S.spriteFrom("black.png","black1.png","black2.png","black3.png");
                  s.g.team="black";
                  s.g.dirY=[-1];
                  s.g.dirX=[-1,1];
                }
              }
              t.push(s);
              if(s){
                z=_.evenN(0.85*(c.x2-c.x1),1);
                _I.mkBtn(_S.sizeXY(s,z,z));
                s.m5.showFrame(0);
                s.g.row=y;
                s.g.col=x;
                s.alpha=0.9;
                _V.set(s,int((c.x1+c.x2)/2), int((c.y1+c.y2)/2));
                self.insert(_S.centerAnchor(s));
                s.m5.press=()=>M.isGameOver()?0:_onClick(s,M);
              }
            });
            _G.tiles.push(t);
          });
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
        this.g.red.text=`   Red Score: ${_.prettyNumber(_G.redScore,2)}`;
        this.g.black.text=`Black Score: ${_.prettyNumber(_G.blackScore,2)}`;
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bggreen.jpg","images/base.json",
                 "images/reds.json","images/blacks.json", "click.mp3","game_win.mp3","game_over.mp3"],
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





