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

    const COLPOSMAP={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7};
    const COLPOS="abcdefgh";
    const ROWPOS=[null,7,6,5,4,3,2,1,0];
    const RPOS=[8,7,6,5,4,3,2,1];

    const VZERO="0".charCodeAt(0);
    const VNINE="9".charCodeAt(0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toLocal(pos){
      let col,row;
      for(let c,i=pos.length-1;i>=0;--i){
        c=pos.charCodeAt(i);
        if(c>VZERO&&c<VNINE){
          col=COLPOSMAP[pos[i-1]];
          row= +pos[i];
          break;
        }
      }
      row=ROWPOS[row];
      return [row,col];
    }

    function toCPos(row,col){
      return `${COLPOS[col]}${RPOS[row]}` }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;




    /** @class */
    class CHBot extends Bot{
      constructor(pnum){
        super("chbot")
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
    class CHHuman extends Local{
      constructor(uid,team){
        super(uid);
        this.team=team;
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        console.log(this.owner.board.ascii());
        super.onPoke();
      }
      onWait(){
        super.onWait();
      }
    }

    function _newState(){
      return _.fill(_G.ROWS,()=> _.fill(_G.COLS,0)) }

    /** @class */
    class CHMediator extends Mediator{
      constructor(cur){
        super();
        this.pcur=cur;
        this.state=_newState();
      }
      isGameOver(){
        this.end=this.board.game_over();
        return super.isGameOver();
      }
      start(){
        this.board=new Chess();
        super.start();
      }
      updateState(from,move){
      }
      postMove(from,move){
      }
    }

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

    function clsTargets(M){
      _G.curTargets.forEach(t=>dropTarget(t));
      //_G.targets.forEach(t=>t.visible=false)
      _G.curTargets.length=0;
      M.gameState().forEach(r=>{
        r.forEach((v,i)=> r[i]=0)
      });
    }

    function dropTarget(t){
      let {row,col}=t.g;
      t.visible=false;
      _G.targets.push(t)
      _I.undoButton( _G.board[row][col] );
    }

    function getTarget(){
      let s;
      if(_G.targets.length===0){
        s=_S.sprite("target.png");
        s.visible=false;
        _S.centerAnchor(s);
        _S.sizeXY(s,_G.selector.width,_G.selector.height);
        _G.targets.push(s);
        _G.selector.parent.insert(s);
      }
      s=_G.targets.pop();
      s.visible=true;
      return s;
    }

    /** @ignore */
    function _onClick(s,M){
      let {row,col,team}=s.g;
      let skip;
      let b,t,cpos;
      let moves;
      let state=M.gameState();
      let c= state[row][col];
      switch(c){
        case "t":
          let r=_G.curSel.g.row;
          let c= _G.curSel.g.col;
          let xxx= M.board.move({to: toCPos(row,col),from: toCPos(r,c)});
          console.log(M.board.ascii());
          b=_G.board[row][col];
          t= _G.tiles[row][col];
          if(t){
            _S.remove(t);
          }
          clsTargets(M);
          _V.copy(_G.curSel,b);
          _G.curSel.g.row=row;
          _G.curSel.g.col=col;
          _G.tiles[r][c]=null;
          _G.tiles[row][col]=_G.curSel;
          _G.selector.visible=false;
          _G.curSel=null;
          M.takeTurn();
          break;
        default:
          if(_G.curSel){
            if(_G.curSel===s){
              _G.selector.visible=false;
              skip=true;
            }
            _G.curSel=null;
            clsTargets(M);
          }
          if(!_G.curSel && !skip){
            cpos=toCPos(row,col);
            moves= M.board.moves({ square: cpos });
            if(moves && moves.length>0){
              //valid moves
              _G.curSel=s;
              _V.copy(_G.selector,s);
              _G.selector.visible=true;
              moves.forEach(m=>{
                let [row,col]= toLocal(m);
                let c=_G.grid[row][col];
                let t= getTarget();
                t.g.row=row;
                t.g.col=col;
                M.gameState()[row][col]="t";
                _V.set(t,MFL((c.x1+c.x2)/2),
                         MFL((c.y1+c.y2)/2));
                _G.curTargets.push(t);
                let bb=_G.board[row][col];
                let tt=_G.tiles[row][col];
                if(!tt){
                  _I.makeButton(bb);
                }
              });
            }else{
              console.log("GAME OVER!");
            }
          }
          break;
      }
    }

    const BCOLOR="#cdf011"; //BC="yellow";
    const WCOLOR="#eeaa11"; //WC="orange";

    function _makePawn(col,team){
      let s= _S.sprite("pawn.png");
      s.m5.uuid=`${team}/p${col+1}`;
      s.g.team=team;
      s.tint=_S.color(team=="b"?BCOLOR:WCOLOR);
      return s;
    }

    function _makePiece(col,team){
      let piece,s;
      switch(col){
        case 0:
        case 7:
          s=_S.sprite("rook.png");
          piece="r";
          break;
        case 1:
        case 6:
          s=_S.sprite("knight.png");
          piece="n";
          break;
        case 2:
        case 5:
          s=_S.sprite("bishop.png");
          piece="b";
          break;
        case 3:
          s=_S.sprite("queen.png");
          piece="q";
          break;
        case 4:
          s=_S.sprite("king.png");
          piece="k";
          break;
      }
      s.m5.uuid=`${team}/${piece}${col+1}`;
      s.g.team=team;
      s.tint=_S.color(team=="b"?BCOLOR:WCOLOR);
      return s;
    }

    function _initArena(scene,M){
      let gr,g= _G.grid;
      let ts= _G.tiles= [];
      for(let r,y=0;y<_G.ROWS;++y){
        gr=g[y];
        r=[];
        for(let c,s,x=0;x<_G.COLS;++x){
          c=gr[x];
          s=null;
          if(y<2){
            //black
            if(y===0){
              s=_makePiece(x,"b");
            }else{
              s=_makePawn(x,"b");
            }
          }else if(y>5){
            //white
            if(y===7){
              s=_makePiece(x,"w");
            }else{
              s=_makePawn(x,"w");
            }
          }
          r.push(s);
          if(s){
            let z=MFL(0.85*(c.x2-c.x1));
            z=_.evenN(z,1);
            _S.centerAnchor(s);
            s.g.row=y;
            s.g.col=x;
            s.width=z;
            s.height=z;
            s.x= MFL((c.x1+c.x2)/2);
            s.y= MFL((c.y1+c.y2)/2);
            _I.makeButton(s);
            scene.insert(s);
            s.m5.press=()=>{ if(!M.isGameOver()) _onClick(s,M) };
          }
        }
        ts.push(r);
      }
      //scene.insert(_S.bboxFrame(_G.arena,16,"#b2b2b2"));//"#4d4d4d"));//"#7f98a6"));
      scene.insert(_S.bboxFrame(_G.arena,16,"#4d4d4d"));//"#7f98a6"));
    }

    function _initBoard(scene,M){
      let g= _S.gridXY([_G.COLS,_G.ROWS]);
      let z;
      _G.board=[];
      _G.grid=g;
      _G.arena= _S.gridBBox(0,0,g);
      for(let t,r,y=0;y<g.length;++y){
        r=g[y];
        t=[];
        for(let s,c,x=0;x<r.length;++x){
          c=r[x];
          if((_.isEven(y)&&_.isEven(x))||
             (!_.isEven(y)&&!_.isEven(x))){
            s=_S.spriteFrom("light.png","light1.png");
          }else{
            s=_S.spriteFrom("dark.png","dark1.png");
            s.g.dark=true;
          }
          _S.centerAnchor(s);
          z=c.x2-c.x1;
          s.g.row=y;
          s.g.col=x;
          s.m5.uuid=`c:${y},${x}`;
          _S.sizeXY(s,z,z);
          s.x= MFL((c.x1+c.x2)/2);
          s.y= MFL((c.y1+c.y2)/2);
          s.m5.press=function(){
            _onClick(s,M);
          }
          t.push(s);
          scene.insert(s);
        }
        _G.board.push(t);
      }
      let sel=_S.sprite("select.png");
      sel.m5.uuid="selector";
      sel.visible=false;
      _S.centerAnchor(sel);
      _S.sizeXY(sel,z,z);
      _G.selector=sel;
      scene.insert(sel);
    }

    function _initLevel(mode,level){
      let m= _G.mediator= new CHMediator(1);
      _G.targets=[];
      _G.curTargets=[];
      if(mode===2){
        m.add(new CHHuman("P1","w"));
        m.add(new CHHuman("P2","b"));
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
        //this.red.text=`Red Score: ${_G.redScore}`;
        //this.black.text=`Black Score: ${_G.blackScore}`;
      }
    })
  }

  const _$={
    assetFiles: ["images/tiles.json"],
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





