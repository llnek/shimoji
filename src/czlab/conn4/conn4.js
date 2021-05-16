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

    class Mediator{
      constructor(players,cur){
        this.players=players.slice();
        this.cur=cur;
      }
      start(){
      }
      updateMove(from,move){
      }
    }

    class Player(){
      constructor(){}
      pokeMove(){
        console.log(`player ${this.uid}: poked`);
        this.onPoke();
      }
      pokeWait(){
        console.log(`player ${this.uid}: wait`);
        this.onWait();
      }
    }

    class Local() extends Player{
      constructor(uid="p1"){
        super(uid)
      }
      onPoke(){
        //wait for user click
      }
      onWait(){
        //stop all ui actions
        Input.pause();
      }
    }

    /** @abstract */
    class Bot() extends Player{
      constructor(uid="p2"){
        super(uid)
      }
      onPoke(){
        //run ai code
      }
      onWait(){
        //do nothing
      }
    }

    /** @abstract */
    class Remote() extends Player{
      constructor(uid="p2"){
        super(uid)
      }
      onPoke(){
      }
      onWait(){
      }
    }

    class C4Bot extends Bot{
      constructor(){
        super("c4bot")
        this.ai= _G.AI(_G.O)
      }
      onPoke(){
        let cells= _G.cells;
        let pos,rc;
        this.ai.syncState(cells, this.pnum);
        pos= this.ai.getFirstMove();
        if(pos<0)
          pos= this.ai.run();//_N.evalNegaMax(this.ai);
        cells[pos] = this.pnum;
        _G.mediator.updateMove(this.pnum, pos);
        //Mojo.emit(["ai.moved",this.scene],pos);
        _G.playSnd();
        /*
        rc= _G.checkState();
        if(rc===0)
          _G.switchPlayer();
        else{
          _G.lastWin= rc===1 ? _G.pcur : 0;
          _Z.runScene("EndGame",5);
        }
        */
      }
    }
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           ute:_, is}= Mojo;

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

    function _initArena(scene){
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
            if(_G.gameOver ||
               _G.maxY(_G.cells,s.g.col)!==s.g.row){
              return;
            }
            _G.cells[s.g.row][s.g.col]=_G.players[0];
            _I.undoButton(s);
            s.alpha=1;
            s.m5.showFrame(_G.players[0]);
            _.delay(0,()=> _G.postClick(s.g.row,s.g.col));
          };
          s.alpha=0.1;
          t.push(s);
          scene.insert(s);
        }
        _G.tiles.push(t);
      }
      scene.insert(_S.bboxFrame(_G.arena));
    }

    function _initLevel(){
      _G.players=[null,null,null];
      _G.cells=[];

      for(let y=0;y<_G.ROWS;++y)
        _G.cells.push(_.fill(_G.COLS,0));

      _G.players[1]=new Local();
      _G.players[2]=new Bot();

      _G.pcur=1;
    }

    _Z.defScene("game",{
      onAI(){

      }
      setup(){
        _initArena(this);
        _initLevel();
        if(_G.mode===1){
          let a= _G.ai= _G.AI(_G.X,_G.O);
          a.scene=this;
          Mojo.on(["ai.moved",this],"onAI");
          //ai starts?
          if(_G.pcur===_G.O){
            _.delay(100, () => Mojo.emit(["ai.move", a])) } }
      },
      postUpdate(){
        if(_G.gameOver){return}
        for(let r,x=0;x<_G.COLS;++x){
          r=_G.maxY(_G.cells,x);
          if(r>=0){
            _G.tiles[r][x].alpha=0.3;
          }
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





