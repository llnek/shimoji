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

    //window["io/czlab/conn4/AI"](Mojo);

    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           ute:_, is}= Mojo;

    const {Bot,
           Local,Mediator}=Mojo;

    /** @ignore */
    function _newState(){
      let out=[];
      for(let y=0;y<_G.ROWS;++y)
        out.push(_.fill(_G.COLS,0));
      return out;
    }

    /** @ignore */
    function _coord(row,col){
      return row>=0&&row<_G.ROWS&&col>=0&&col<_G.COLS }

    /** @ignore */
    function _showTargets(M){
      let {row,col,dirY,dirX}= _G.curPicked.g;
      let state=M.gameState();
      _resetBoard();
      for(let r,y=0;y<_G.ROWS;++y){
        r=state[y];
        for(let s,c,x=0;x<_G.COLS;++x){
          c=r[x];
          s=_G.tiles[y][x];
          if(c!==0 &&s){
            let e,r1,r2,c1,c2,k1,k2;
            if(y===row&&x===col){
              dirY.forEach(dy=>{
                r1=row+dy;
                c1=col+dirX[0];
                c2=col+dirX[1];
                if(state[r1][c1]=="S") {
                  _G.board[r1][c1].m5.showFrame(1);
                  _I.makeButton(_G.board[r1][c1]);
                }
                if(state[r1][c2]=="S"){
                  _G.board[r1][c2].m5.showFrame(1);
                  _I.makeButton(_G.board[r1][c2]);
                }
                e=_G.tiles[r1][c1];//left
                if(e && e.g.team!=s.g.team){
                  r2=r1+dy;
                  k1=c1+dirX[0];
                  if(_coord(r2,k1) && state[r2][k1]=="J"){
                    _G.board[r2][k1].m5.showFrame(1);
                    _I.makeButton(_G.board[r2][k1]);
                  }
                }
                e=_G.tiles[r1][c2];//right
                if(e && e.g.team!=s.g.team){
                  r2=r1+dy;
                  k1=c2+dirX[1];
                  if(_coord(r2,k1) && state[r2][k1]=="J"){
                    _G.board[r2][k1].m5.showFrame(1);
                    _I.makeButton(_G.board[r2][k1]);
                  }
                }
              });
            }else{
              s.m5.showFrame(0);
            }
          }
        }
      }
    }

    function _calcSteps(ps,tiles){
      let {row,col,dirX,dirY}=ps.g;
      let r,c,out=[];
      dirY.forEach(dy=>{
        r=row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          if(_coord(r,c) && !tiles[r][c]){
            out.push([r,c,"S"]);
            out.push([row,col,"s"]);
          }
        });
      });
      if(out.length>0) return out;
    }

    function _calcJumps(ps,tiles){
      let {row,col,team,dirX,dirY}=ps.g;
      let r2,c2,r,c,s,out=[];

      dirY.forEach(dy=>{
        r= row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          s=_coord(r,c)?tiles[r][c]:null;
          if(s && s.g.team!=team){
            r2=r+dy;
            c2=c+dx;
            if(_coord(r2,c2)&& !tiles[r2][c2]){
              out.push([r2,c2,"J"]);
              out.push([row,col,"j"]);
            }
          }
        });
      });

      if(out.length>0) return out;
    }

    function _calcNextMoves(team,tiles){
      let mask=_newState();
      let jumps=[];
      let steps=[];
      for(let r,y=0;y<_G.ROWS;++y){
        r=tiles[y];
        for(let s,out,x=0;x<_G.COLS;++x){
          s=r[x];
          out=null;
          if(s && s.g.team==team){
            out=_calcJumps(s,tiles);
            if(out){
              out.forEach(o=>jumps.push(o));
            }
            out= _calcSteps(s,tiles);
            if(out){
              out.forEach(o=>steps.push(o));
            }
          }
        }
        if(jumps.length>0){
          jumps.forEach(p=>{ mask[p[0]][p[1]]=p[2] });
        }else if(steps.length>0){
          steps.forEach(p=>{ mask[p[0]][p[1]]=p[2] });
        }
      }
      return mask;
    }

    function _resetBoard(){
      for(let y=0;y<_G.ROWS;++y){
        for(let s,x=0;x<_G.COLS;++x){
          s=_G.board[y][x];
          if(s.g.dark){
            _I.undoButton(s);
            s.m5.showFrame(0);
          }
        }
      }
    }

    function _resetState(s){
      s.forEach(a=>{
        for(let i=0;i<a.length;++i)a[i]=0;
      });
      return s;
    }

    /** @class */
    class CKBot extends Bot{
      constructor(pnum){
        super("ckbot")
        this.pnum=pnum;
        //this.ai= _G.AI();
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        //let move=this.ai.run(_G.mediator.gameState(), this.pnum);
        //_G.mediator.updateMove(this.pnum,move);
      }
    }

    /** @class */
    class CKHuman extends Local{
      constructor(uid,team){
        super(uid);
        this.team=team;
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        let mask=_calcNextMoves(this.team,_G.tiles);
        let state=this.owner.gameState();
        state.length=0;
        mask.forEach(m=>state.push(m));
        for(let y=0;y<_G.ROWS;++y){
          for(let s,x=0;x<_G.COLS;++x){
            //s=_G.board[y][x];
            //if(s.g.dark) s.m5.showFrame(0);
            s=_G.tiles[y][x];
            if(mask[y][x]=="s"){
              s.m5.showFrame(1);
            }else if(mask[y][x]=="j"){
              s.m5.showFrame(1);
            }else if(s){
              s.m5.showFrame(0);
            }
          }
        }
        super.onPoke();
      }
      onWait(){
        super.onWait();
      }
    }

    /** @class */
    class CKMediator extends Mediator{
      constructor(cur){
        super();
        this.state=_newState();
        this.pcur=cur;
      }
      updateState(from,move){
      }
      postMove(from,move){
      }
    }

    /** true if a draw */
    _G.checkDraw=function(cells){
      return false;
    };

    /** test for win */


    _G.COLS=8;
    _G.ROWS=8;
    _G.X=1;
    _G.O=2;

    _Z.defScene("splash",{
      setup(){
      },
      dispose(){
        super.dispose();
      }
    });

    function _onClick(s,M){
      let state=M.gameState();
      let {row,col}=s.g;
      let c=state[row][col];
      switch(c){
        case "S":{

          let r=_G.curPicked.g.row;
          let c=_G.curPicked.g.col;
          _G.tiles[row][col]=_G.curPicked;
          _V.copy(_G.curPicked,_G.board[row][col]);
          _G.tiles[r][c]=null;
          _G.curPicked.g.row=row;
          _G.curPicked.g.col=col;
          _G.curPicked.m5.showFrame(0);
          _G.curPicked=null;
          _resetState(state);
          _resetBoard();
          _.delay(0,()=>M.takeTurn());
        }
          break;
        case "J":{
          let r=_G.curPicked.g.row;
          let c=_G.curPicked.g.col;
          let e,er,ec;
          if(row>r){
            er=row-1;
          }else{
            er=row+1;
          }
          if(col>c){
            ec=col-1;
          }else{
            ec=col+1;
          }
          e=_G.tiles[er][ec];
          _G.tiles[er][ec]=null;
          _I.undoButton(e);
          e.visible=false;
          if(e.g.team=="red")_G.blackScore++;
          else _G.redScore++;
          _G.tiles[row][col]=_G.curPicked;
          _V.copy(_G.curPicked,_G.board[row][col]);
          _G.tiles[r][c]=null;
          _G.curPicked.g.row=row;
          _G.curPicked.g.col=col;
          _G.curPicked.m5.showFrame(0);
          _G.curPicked=null;
          _resetState(state);
          _resetBoard();
          _.delay(0,()=>M.takeTurn());
        }
          break;
        default:{

          if(!_G.tiles[row][col]){return}
          if(_G.curPicked){
            if(_G.curPicked===s){
              _G.curPicked=null;
              s.m5.showFrame(1);
              M.redoTurn();
            }else{
              _G.curPicked.m5.showFrame(1);
              _G.curPicked=s;
              s.m5.showFrame(2);
              _showTargets(M);
            }
          }else{
            _G.curPicked=s;
            s.m5.showFrame(2);
            _showTargets(M);
          }
        }
          break;
      }
    }

    function _initArena(scene,M){
      let g= _G.grid;
      _G.tiles=[];
      for(let t,r,y=0;y<g.length;++y){
        r=g[y];
        t=[];
        for(let z,s,c,x=0;x<r.length;++x){
          if((_.isEven(y)&&_.isEven(x))||
             (!_.isEven(y)&&!_.isEven(x))){
            s=null;
          }else{
            if(y<3){
              //red
              s=_S.spriteFrom("red.png","red1.png","red2.png","red3.png");
              s.g.team="red";
              s.g.dirY=[1];
              s.g.dirX=[-1,1];
            }else if(y>4){
              //black
              s=_S.spriteFrom("black.png","black1.png","black2.png","black3.png");
              s.g.team="black";
              s.g.dirY=[-1];
              s.g.dirX=[-1,1];
            }
          }
          t.push(s);
          if(s){
            c=r[x];
            z=MFL(0.85*(c.x2-c.x1));
            z=_.evenN(z,1);
            _S.centerAnchor(s);
            s.g.row=y;
            s.g.col=x;
            s.width=z;
            s.height=z;
            s.alpha=0.9;
            s.x= MFL((c.x1+c.x2)/2);
            s.y= MFL((c.y1+c.y2)/2);
            _I.makeButton(s);
            s.m5.showFrame(0);
            scene.insert(s);
            s.m5.press=()=>{ if(!M.isGameOver()) _onClick(s,M) };
          }
        }
        _G.tiles.push(t);
      }
      scene.insert(_S.bboxFrame(_G.arena,16,"#7f98a6"));
    }

    function _initBoard(scene,M){
      let g= _S.gridXY([_G.COLS,_G.ROWS]);
      _G.board=[];
      _G.grid=g;
      _G.arena= _S.gridBBox(0,0,g);
      for(let t,r,y=0;y<g.length;++y){
        r=g[y];
        t=[];
        for(let z,s,c,x=0;x<r.length;++x){
          c=r[x];
          if((_.isEven(y)&&_.isEven(x))||
             (!_.isEven(y)&&!_.isEven(x))){
            s=_S.sprite("light.png");
          }else{
            s=_S.spriteFrom("dark.png","dark1.png");
            s.g.dark=true;
            s.m5.press=()=>{
              if(!M.isGameOver()) _onClick(s,M);
            }
          }
          _S.centerAnchor(s);
          z=c.x2-c.x1;
          s.g.row=y;
          s.g.col=x;
          s.width=z;
          s.height=z;
          s.x= MFL((c.x1+c.x2)/2);
          s.y= MFL((c.y1+c.y2)/2);
          t.push(s);
          scene.insert(s);
        }
        _G.board.push(t);
      }
    }

    function _initLevel(mode,level){
      let m= _G.mediator= new CKMediator(1);
      if(mode===2){
        m.add(new CKHuman("P1","black"));
        m.add(new CKHuman("P2","red"));
      }
      return m;
    }

    _Z.defScene("game",{
      setup(){
        let m=_initLevel(2,1);
        _initBoard(this,m);
        _initArena(this,m);
        _G.redScore=0;
        _G.blackScore=0;
        m.start();
      },
      postUpdate(){
        /*
        let m=_G.mediator;
        if(m.isGameOver())
        {return}
        for(let r,x=0,cs=m.gameState();x<_G.COLS;++x){
          r=_G.maxY(cs,x);
          if(r>=0)
            _G.tiles[r][x].alpha=0.3;
        }
        */
      }
    });

    _Z.defScene("hud",{
      setup(){
        let r= this.red=_S.bitmapText("",{fontSize:36,fill:"white"});
        let b=this.black=_S.bitmapText("",{fontSize:36,fill:"white"});
        this.insert(r);
        this.insert(b);
        _S.pinBottom(r,b,100);
      },
      postUpdate(){
        this.red.text=`Red Score: ${_G.redScore}`;
        this.black.text=`Black Score: ${_G.blackScore}`;
      }
    })
  }

  const _$={
    assetFiles: ["images/base.json",
                 "images/reds.json","images/blacks.json"],
    arena:{width:1024, height:768},
    iconSize: 96,
    rendering:false,//"crisp-edges",
    scaleFit:"y",
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      //Mojo.Scenes.runScene("splash");
      Mojo.Scenes.runScene("game");
      Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





