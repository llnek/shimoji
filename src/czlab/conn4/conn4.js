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

    window["io/czlab/conn4/AI"](Mojo);

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           ute:_, is}= Mojo;

    const {Bot,
           Local,Mediator}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      COLS:7,
      ROWS:6,
      X:1,
      O:2,
      playClick(){
        Mojo.sound("click.mp3").play()
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class C4Bot extends Bot{
      constructor(pnum){
        super("c4bot")
        this.pnum=pnum;
        this.ai= _G.AI();
      }
      stateValue(){
        return this.pnum;
      }
      playSound(){
        Mojo.sound("o.mp3").play();
      }
      onPoke(){
        _.delay(848,()=>{
          const move=this.ai.run(_G.mediator.gameState(), this.pnum);
          _G.mediator.updateMove(this.pnum, move);
        });
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class C4Human extends Local{
      constructor(pnum){
        super(`P${pnum}`);
        this.pnum=pnum;
      }
      stateValue(){
        return this.pnum;
      }
      playSound(){
        if(this.pnum===_G.X)
          Mojo.sound("x.mp3").play();
        else
          Mojo.sound("o.mp3").play();
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      postClick(row,col){
        const w=this.check4(this.cells,row,col,this.players[0]);
        if(w){
          this.gameOver=this.players[0];
        }else if(this.checkDraw(this.cells)){
          this.gameOver=911;
        }else{
          this.switchPlayer();
        }
        //console.log("gameOver="+this.gameOver);
      },
      switchPlayer(){
        const cur=this.players[0];
        if(cur===this.players[1]){
          this.players[0]=this.players[2];
        }else if(cur===this.players[2]){
          this.players[0]=this.players[1];
        }
      },
      dropCol(cells,col,turn){
        const row= this.maxY(cells,col);
        if(row>=0)
          cells[row][col]=turn;
      },
      /** get next valid drop in that column */
      maxY(cells,col){
        for(let y=cells.length-1;y>=0;--y){
          if(cells[y][col]===0) return y;
        }
        return -1;
      },
      /** true if a draw */
      checkDraw(cells){
        return _.every(_.map(cells,r=> _.every(r,v=>v!==0)), v=>!!v)
      },
      /** test for win */
      check4(cells,row,col,turn){
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
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.jpg"),Mojo.width,Mojo.height);
      scene.insert(_G.backDropSprite);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("StartMenu",{
      setup(options){
        const self=this,
              K=Mojo.getScaleFactor(),
              cfg={fontName: UI_FONT, fontSize: 64*K};

        let s= _S.bmpText("Player 1 (Blue) Starts? ", cfg);
        let b1=_I.mkBtn(_S.bmpText("Yes", cfg));
        let gap=_S.bmpText(" / ", cfg);
        let b2=_I.mkBtn(_S.bmpText("No", cfg));

        b1.m5.press=
        b2.m5.press=(b)=>{
          options.startsWith= b===b1?1:2;
          _S.tint(b,C_ORANGE);
          _G.playClick();
          _.delay(CLICK_DELAY, ()=> _Z.runSceneEx("PlayGame", options));
        };

        doBackDrop(this);
        self.insert(_Z.layoutX([s, b1, gap, b2],{bg:"transparent"}))
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("MainMenu",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doMenu=function(){
          const cfg={fontSize: 64*K, fontName:UI_FONT};
          const b1=_S.uuid(_I.mkBtn(_S.bmpText("One Player", cfg)),"play#1");
          const b2=_S.uuid(_I.mkBtn(_S.bmpText("Two Player", cfg)),"play#2");
          const gap=_S.bmpText("or", cfg);
          function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
          b1.m5.press=
          b2.m5.press=function(b){
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY,()=>{
              _Z.runSceneEx("StartMenu", {mode: b.m5.uuid == "play#1"?1:2}) }) };
          self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doMenu();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              verb= Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("CONNECT-4",{fontName:TITLE_FONT, fontSize:120*K});
          _S.tint(s, C_TITLE);
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,b,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`, {fontName:UI_FONT, fontSize:72*K});
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          b=_I.mkBtn(s);
          t=_F.throb(b,0.99);
          b.m5.press=(btn)=>{
            _S.tint(btn,C_ORANGE);
            _F.remove(t);
            _G.playClick();
            _.delay(CLICK_DELAY, ()=> _Z.runSceneEx("MainMenu"));
          };
          self.insert(_S.centerAnchor(b));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doTitle();
        this.g.doNext();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("EndGame",{
      setup(options){
        const K=Mojo.getScaleFactor();
        const mode = _G.mode;
        const w= options.win;
        let msg="No Winner!",
            snd="game_over.mp3",
            cfg={fontName:UI_FONT, fontSize:64*K};

        if(w===_G.X){
          msg= mode===1 ? "You win !" : "Player 1 (Blue) wins !";
          snd="game_win.mp3";
        }else if(w===_G.O){
          msg= mode===1 ? "You lose !" : "Player 2 (Red) wins !";
        }

        function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
        let b1=_I.mkBtn(_S.bmpText("Play Again?", cfg));
        let b2=_I.mkBtn(_S.bmpText("Quit", cfg));
        let m1=_S.bmpText("Game Over", cfg);
        let m2=_S.bmpText(msg, cfg);
        let gap=_S.bmpText("or", cfg);
        b1.m5.press=()=>{ _G.playClick(); _Z.runSceneEx("MainMenu") };
        b2.m5.press=()=>{ _G.playClick(); _Z.runSceneEx("Splash") };
        Mojo.sound(snd).play();
        this.insert( _Z.layoutY([m1, m2, space(), space(), b1, gap, b2])) }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(options){
        _G.mode=options.mode;
        this.g.initLevel=()=>{
          let m= _G.mediator= new C4Mediator(options.startsWith);
          if(options.mode===1){
            m.add(new C4Human(1));
            m.add(new C4Bot(2));
          }else{
            m.add(new C4Human(1));
            m.add(new C4Human(2));
          }
          return m;
        };
        this.g.initArena=(scene,M)=>{
          let g= _S.gridXY([_G.COLS,_G.ROWS],0.8,0.8);
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
              _S.centerAnchor(s);
              s.g.row=y;
              s.g.col=x;
              s.width=z;
              s.height=z;
              s.x= int((c.x1+c.x2)/2);
              s.y= int((c.y1+c.y2)/2);
              _I.mkBtn(s);
              s.m5.press=()=>{
                if(!M.isGameOver() &&
                   _G.maxY(M.gameState(),s.g.col)===s.g.row){
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
        };

        doBackDrop(this);
        this.g.initArena(this, this.g.initLevel()).start();
      },
      postUpdate(){
        let m=_G.mediator;
        if(m.isGameOver()){
          this.m5.dead=true;
          _.delay(343,()=>{
            _I.resetAll();
            _Z.runScene("EndGame",{win: m.winner()});
          });
        }else{
          for(let r,x=0,cs=m.gameState();x<_G.COLS;++x){
            r=_G.maxY(cs,x);
            if(r>=0) _G.tiles[r][x].alpha=0.3;
          }
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bg.jpg", "base.png","tiles.png",
                 "images/base.json", "images/tiles.json",
                 "click.mp3","game_over.mp3","game_win.mp3","x.mp3","o.mp3"],
    arena:{width:1024, height:768},
    iconSize: 96,
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





