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

    window["io/czlab/conn4/AI"](Mojo);

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

    /** @class */
    class C4Bot extends Bot{
      constructor(pnum){
        super("c4bot")
        this.pnum=pnum;
        this.ai= _G.AI();
      }
      stateValue(){
        return this.pnum;
      }
      onPoke(){
        let move=this.ai.run(_G.mediator.gameState(), this.pnum);
        _G.mediator.updateMove(this.pnum,move);
      }
    }

    /** @class */
    class C4Human extends Local{
      constructor(pnum){
        super("P1");
        this.pnum=1;
      }
      stateValue(){
        return this.pnum;
      }
    }

    /** @class */
    class C4Mediator extends Mediator{
      constructor(cur){
        super();
        this.state=[];
        this.pcur=cur;
        for(let y=0;y<_G.ROWS;++y)
          this.state.push(_.fill(_G.COLS,0));
      }
      updateState(from,move){
        let [row,col]=move,
            s= _G.tiles[row][col],
            p= this.players[from],
            v=p.stateValue();
        this.state[row][col]=v;
        s.alpha=1;
        s.m5.showFrame(v);
      }
      postMove(from,move){
        let d,w=_G.check4(this.state,
                          move[0],move[1],
                          this.players[from].stateValue());
        if(w){
          this.gameOver(from);
        }else if(_G.checkDraw(this.state)){
          this.gameOver();
        }else{
          this.takeTurn();
        }
      }
    }

    _G.postClick=function(row,col){
      let w=_G.check4(_G.cells,row,col,_G.players[0]);
      if(w){
        _G.gameOver=_G.players[0];
      }else if(_G.checkDraw(_G.cells)){
        _G.gameOver=911;
      }else{
        _G.switchPlayer();
      }
      console.log("gameOver="+_G.gameOver);
    };

    /** @ignore */
    _G.switchPlayer=function(){
      let cur=_G.players[0];
      if(cur===_G.players[1])
        _G.players[0]=_G.players[2];
      else if(cur===_G.players[2])
        _G.players[0]=_G.players[1];
    };

    /** make a move */
    _G.dropCol=function(cells,col,turn){
      let row= this.maxY(cells,col);
      if(row>=0){
        cells[row][col]=turn;
      }
    };

    /** get next valid drop in that column */
    _G.maxY=function(cells,col){
      for(let y=cells.length-1;y>=0;--y){
        if(cells[y][col]===0){
          return y;
        }
      }
      return -1;
    };

    /** true if a draw */
    _G.checkDraw=function(cells){
      return _.every(_.map(cells,r=> _.every(r,v=>v!==0)), v=>!!v) };

    /** test for win */
    _G.check4=function(cells,row,col,turn){
      let width=cells[0].length;
      let height=cells.length;
      let out=[];
      let i,j;

      //test the row
      for(j=col;j>=0;--j){
        if(cells[row][j]!==turn){ break }
        out.push([row,j]);
      }
      if(out.length>=4){ return out }
      for(j=col;j<width;++j){
        if(cells[row][j]!==turn){ break }
        if(j!==col) out.push([row,j]);
      }
      if(out.length>=4){ return out }

      //test the column
      out.length=0;
      for(i=row;i>=0;--i){
        if(cells[i][col]!==turn){ break }
        out.push([i,col]);
      }
      if(out.length>=4){ return out }
      for(i=row;i<height;++i){
        if(cells[i][col]!==turn){ break }
        if(i!==row) out.push([i,col]);
      }
      if(out.length>=4){ return out }

      //test pos slope
      out.length=0;
      i=row;
      j=col;
      while(i>=0 && i<height && j>=0 && j<width){
        if(cells[i][j]!==turn){ break }
        out.push([i,j]);
        ++j;
        --i;
      }
      if(out.length>=4){ return out }
      i=row;
      j=col;
      while(i>=0 && i<height && j>=0 && j<width){
        if(cells[i][j]!==turn){ break }
        if(!(i===row && j===col)) out.push([i,j]);
        --j;
        ++i;
      }
      if(out.length>=4){ return out }

      //test neg slope
      out.length=0;
      i=row;
      j=col;
      while(i>=0 && i<height && j>=0 && j<width){
        if(cells[i][j]!==turn){ break }
        out.push([i,j]);
        --j;
        --i;
      }
      if(out.length>=4){ return out }
      i=row;
      j=col;
      while(i>=0 && i<height && j>=0 && j<width){
        if(cells[i][j]!==turn){ break }
        if(!(i===row && j===col)) out.push([i,j]);
        ++j;
        --i;
      }
      if(out.length>=4){ return out }
    };


    _G.COLS=7;
    _G.ROWS=6;
    _G.X=1;
    _G.O=2;

    _G.server={
      run(){
      }
    };

    _Z.defScene("splash",{
      setup(){
        let s= _S.sprite("boot/tap-touch.png");
        let K=Mojo.getScaleFactor();
        let n=K*0.2;
        s.tint=_S.color("orange");
        _S.centerAnchor(s);
        _S.scaleXY(s,n,n);
        _S.pinCenter(this,s);
        //this.insert(s);
        //this.g.tappy=_F.breathe(s,n*0.9,n*0.9);

        let c=_S.bitmapText("CONNECT",{fontName:"Big Shout Bob",
                                       fontSize:96,fill:"white"});
        _S.centerAnchor(c);
        c.x = Mojo.width/2-c.width/2;
        c.y = Mojo.height/2-c.height;
        let f=_S.bitmapText("FOUR",{fontName:"Big Shout Bob",
                                    fontSize:96,fill:"white"});
        _S.centerAnchor(f);
        f.angle=20;
        _S.pinRight(c,f,-f.width/4);
        f.y -= f.height/2;

        this.insert(c);
        this.insert(f);
      },
      dispose(){
        this.g.tappy.dispose();
        super.dispose();
      }
    });

    function _initArena(scene,M){
      let g= _S.gridXY([_G.COLS,_G.ROWS],0.8,0.8);
      _G.tiles=[];
      _G.grid=g;
      _G.arena= _S.gridBBox(0,0,g);
      for(let t,r,y=0;y<g.length;++y){
        r=g[y];
        t=[];
        for(let z,s,c,x=0;x<r.length;++x){
          s=_S.spriteFrom("white.png",
                          "orange.png","green.png");
          c=r[x];
          z=MFL(0.9*(c.x2-c.x1));
          z=_.evenN(z,1);
          _S.centerAnchor(s);
          s.g.row=y;
          s.g.col=x;
          s.width=z;
          s.height=z;
          s.x= MFL((c.x1+c.x2)/2);
          s.y= MFL((c.y1+c.y2)/2);
          _I.makeButton(s);
          s.m5.press=()=>{
            if(!M.isGameOver() &&
               _G.maxY(M.gameState(),s.g.col)===s.g.row){
              _I.undoButton(s);
              //s.alpha=1;
              //s.m5.showFrame(M.cur());
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
    }

    function _initLevel(mode,level){
      let m= _G.mediator= new C4Mediator(1);
      if(mode===1){
        m.add(new C4Human(1));
        m.add(new C4Bot(2));
      }
      return m;
    }

    _Z.defScene("game",{
      setup(){
        let m=_initLevel(1,1);
        _initArena(this,m);
        m.start();
      },
      postUpdate(){
        let m=_G.mediator;
        if(m.isGameOver())
        {return}
        for(let r,x=0,cs=m.gameState();x<_G.COLS;++x){
          r=_G.maxY(cs,x);
          if(r>=0)
            _G.tiles[r][x].alpha=0.3;
        }
      }
    });
  }

  const _$={
    assetFiles: ["images/base.json",
                 "images/tiles.json"],
    arena:{width:1024, height:768},
    iconSize: 96,
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





