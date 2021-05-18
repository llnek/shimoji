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
      for(let r,y=0;y<_G.ROWS;++y){
        r=state[y];
        for(let s,c,x=0;x<_G.COLS;++x){
          s=_G.board[y][x];
          if(s.m5.showFrame)
            s.m5.showFrame(0);
          c=r[x];
          s=_G.tiles[y][x];
          if(c!==0 &&s){
            let r1,r2,c1,c2;
            if(y===row&&x===col){
              dirY.forEach(dy=>{
                r1=row+dy;
                c1=col+dirX[0];
                c2=col+dirX[1];
                if(state[r1][c1]=="t") _G.board[r1][c1].m5.showFrame(1);
                if(state[r1][c2]=="t") _G.board[r1][c2].m5.showFrame(1);
              });
            }else{
              s.m5.showFrame(0);
            }
          }
        }
      }
    }

    function _calcSlides(ps,tiles){
      let {row,col,dirX,dirY}=ps.g;
      let r,c,out=[];
      dirY.forEach(dy=>{
        r=row+dy;
        dirX.forEach(dx=>{
          c=col+dx;
          if(_coord(r,c) && !tiles[r][c]){
            out.push([r,c,"t"]);
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
              out.push([r2,c2,"t"]);
              out.push([row,col,"j"]);
            }
          }
        });
      });

      if(out.length>0) return out;
    }

    function _calcNextMoves(team,tiles){
      let mask=_newState();
      for(let r,y=0;y<_G.ROWS;++y){
        r=tiles[y];
        for(let s,out,x=0;x<_G.COLS;++x){
          s=r[x];
          out=null;
          if(s && s.g.team==team){
            out=_calcJumps(s,tiles);
            if(!out)
              out= _calcSlides(s,tiles);
          }
          if(out){
            out.forEach(p=>{
              mask[p[0]][p[1]]=p[2]
            });
          }
        }
      }
      return mask;
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
            s=_G.board[y][x];
            if(s.m5.showFrame)
              s.m5.showFrame(0);
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
            s.m5.press=()=>{
              if(M.isGameOver()){return}
              if(M.gameState()[y][x]===0){return}
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
            };
            s.m5.showFrame(0);
            scene.insert(s);
          }
        }
        _G.tiles.push(t);
      }
      scene.insert(_S.bboxFrame(_G.arena,16,"#7f98a6"));
    }

    function _initBoard(scene){
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
        _initBoard(this);
        _initArena(this,m);
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
      //Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





