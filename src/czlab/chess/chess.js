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

    window["io/czlab/chess/AI"](Mojo);

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Sound:_D,
           Game:_G,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_, is}= Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor;
    const {Bot,
           Local,Mediator}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Chess",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playSnd=(team)=> Mojo.sound(team=="w"?"x.mp3":"o.mp3").play();
    const playClick=()=> Mojo.sound("click.mp3").play();
    const DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const F_COLPOSMAP={a:7,b:6,c:5,d:4,e:3,f:2,g:1,h:0};
    const COLPOSMAP={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7};

    const ROWPOS=[null,7,6,5,4,3,2,1,0],
      RPOS=[8,7,6,5,4,3,2,1],
      F_COLPOS="hgfedcba",
      COLPOS="abcdefgh",
      VZERO="0".charCodeAt(0),
      VNINE="9".charCodeAt(0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toLocal(pos){
      let M=_G.mediator,
        row, col,team=M.cur().uuid();
      if(pos=="O-O-O" || pos=="O-O"){
        row= team=="w"? 1 : 8;
        col= pos.length>3 ? 2 : 6;
      }else{
        for(let c,i=pos.length-1;i>=0;--i){
          c=pos.charCodeAt(i);
          if(c>VZERO&&c<VNINE){
            col=(M.flipped()? F_COLPOSMAP: COLPOSMAP)[pos[i-1]];
            row= +pos[i];
            break;
          }
        }
      }
      return M.flipped() ? [row-1, col] : [ ROWPOS[row], col];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toCPos(row,col){
      if(_G.mediator.flipped()){
        return `${F_COLPOS[col]}${row+1}`
      }else{
        return `${COLPOS[col]}${RPOS[row]}`
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkEnd(){
      let M=_G.mediator,
        msg,e,w,S=M.gameState();
      if(S.in_draw() || S.in_stalemate()){
        e=M.gameOver();
      }else if(S.in_checkmate()){
        e=M.gameOver(M.other());
      }
      if(e){
        msg="No Winner!";
        if(w=M.winner()){
          if(w.stateValue()==_G.X)
            msg= _G.mode==1? "You Win!" : "Player 1 Win!";
          else
            msg= _G.mode==1? "You Lose!" : "Player 2 Win!";
        }
        _.delay(DELAY,()=> _Z.modal("EndGame",{

          fontSize:64*Mojo.getScaleFactor(),
          replay:{name:"MainMenu"},
          quit:{name:"Splash", cfg:SplashCfg},
          msg,
          winner: msg.includes("Win")

        }));
      }
      return e;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @class */
    class CHBot extends Bot{
      constructor(uid,v){
        super(uid)
        this.pvalue=v;
      }
      stateValue(){
        return this.pvalue;
      }
      onPoke(){
        if(!checkEnd()){
          _G[this.owner.state.in_check()?"showCheckMsg":"hideCheckMsg"]();
          _.delay(242,()=> this.doPoke());
        }
      }
      doPoke(){
        let S= _G.mediator.gameState(),
            move, moves= S.moves({verbose:true});
        //console.log("aiMove=======");
        //console.log(JSON.stringify(moves));
        if(moves && moves.length>0){
          move= moves.length==1?moves[0]: this.ai.run(S, this)
        }
        _G.mediator.updateMove(this,move);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @class */
    class CHHuman extends Local{
      constructor(uid,v){
        super(uid);
        this.pvalue=v;
      }
      stateValue(){
        return this.pvalue;
      }
      onPoke(){
        if(!checkEnd()){
          _S.tint(_G.selector, this.uuid()=="w"?WCOLOR:BCOLOR);
          console.log(this.owner.state.ascii());
          _G[this.owner.state.in_check()?"showCheckMsg":"hideCheckMsg"]();
          super.onPoke();
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @class */
    class CHMediator extends Mediator{
      constructor(){
        super();
        this.state= new Chess();
      }
      isGameOver(){
        this.end=this.state.game_over();
        return super.isGameOver();
      }
      flipped(b) {
        if(b !== undefined) this._flipped=b;
        return this._flipped;
      }
      start(cur){
        _.assert(cur && cur.uuid()=="w","White always starts!");
        super.start(cur);
      }
      updateState(who,move){
        if(move){
          let xxx=this.state.move(move);
          _.assert(xxx, "Bad AI move!");
          //console.log("ai moved= " + JSON.stringify(xxx));
          updateInfo(xxx);
          playSnd(who.uuid());
          repaint();
        }
      }
      postMove(who,move){
        //console.log("post-ai========");
        //console.log(this.state.ascii());
        _nextToPlay();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _nextToPlay(){
      _G.curSel=null;
      _.delay(100,()=>_G.mediator.takeTurn());
    }


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const COLS=8;
    const ROWS=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      X:88,
      O:79,
      hideCheckMsg(){
        _S.hide(this.checkMsg)
      },
      showCheckMsg(){
        let c= this.mediator.other().uuid()=="w"?WCOLOR:BCOLOR;
        _S.tint(this.checkMsg, c);
        _S.show(this.checkMsg);
      },
      hidePromotion(){
        _S.hide(this.promoteMenu);
        this.promoteMenu.children.forEach(c=> _I.undoBtn(c));
        return this.promoteMenu;
      },
      showPromotion(){
        _S.show(this.promoteMenu);
        this.promoteMenu.children.forEach(c=> _I.mkBtn(c));
        return this.promoteMenu;
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function seekPromotion(moves){
      return moves.filter(m=>{
        if(m.san){ m=m.san }
        if(is.str(m) && m.includes("=")){
          return true;
        }
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bggreen.jpg")));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        let self=this,
          mode=1,
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT,fontSize:72*K},
          space=()=>_S.opacity(_S.bmpText("I",cfg),0),
          b1= _S.uuid(_I.mkBtn(_S.bmpText("1 PLAYER",cfg)),"#p1"),
          gap=_S.bmpText("or",cfg),
          b2= _S.uuid(_I.mkBtn(_S.bmpText("2 PLAYER",cfg)),"#p2");
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2")mode=2;
          _S.tint(btn,C_ORANGE);
          playClick();
          _.delay(DELAY,()=>_Z.runEx("StartMenu",{mode}));
        };
        doBackDrop(this);
        self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"#cccccc",fit: 80,opacity:0.3}));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("StartMenu",{
      setup(options){
        let self=this,
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT,fontSize:72*K};
        options.startsWith=1;
        let space=()=> _S.opacity(_S.bmpText("I",cfg),0),
          msg= _S.bmpText("Player 1 starts? ",cfg),
          b1= _I.mkBtn(_S.uuid(_S.bmpText("Yes",cfg),"#p1")),
          gap= _S.bmpText(" / ",cfg),
          b2= _I.mkBtn(_S.uuid(_S.bmpText("No",cfg), "#p2"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2") options.startsWith=2;
          _S.tint(btn,C_ORANGE);
          playClick();
          _.delay(DELAY,()=>_Z.runEx("PlayGame", options));
        };
        self.insert(_Z.layoutX([msg,space(), b1, gap, b2],{bg:"transparent"}));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function clsTargets(M){
      _G.curTargets.forEach(t=>dropTarget(t));
      _G.curTargets.length=0;
      _G.board.forEach(r=> r.forEach(c=>{
        c.g.status=""
      }));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropTarget(t){
      let {row,col}=t.g;
      _S.hide(t);
      _G.targets.push(t)
      _I.undoBtn( _G.board[row][col] );
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getTarget(){
      let s;
      if(_G.targets.length==0){
        s=_S.sprite("target.png");
        _S.tint(s,C_ORANGE);
        _S.hide(s);
        _S.anchorXY(s,0.5);
        _S.sizeXY(s,_G.selector.width,_G.selector.height);
        _G.targets.push(s);
        _G.selector.parent.insert(s);
      }
      s=_G.targets.pop();
      return _S.show(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function repaint(){
      let M=_G.mediator,
          S=M.gameState();
      clearTiles();
      if(M.flipped()){
        flipMask(S);
      }else{
        setMask(S);
      }
      //console.log(S.ascii());
    }

    //promotion moves
    //["e8=Q","e8=R","e8=B","e8=N+","exf8=Q+","exf8=R","exf8=B+","exf8=N"]
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onClick(scene, s,M){
      let {row,col,team}=s.g;
      let skip;
      let b,t;
      let board=M.gameState();
      switch(_G.board[row][col].g.status){
        case "t":
          if(1){
            let castle;
            let p,xxx,cfg;
            let r=_G.curSel.g.row;
            let c= _G.curSel.g.col;
            if((_G.curSel.g.icon=="k" || _G.curSel.g.icon=="K") &&
               r==row && (r==0 || r==ROWS-1) && Math.abs(c-col)==2){
              let rb, rc;
              if(c>col){//o-o-o
                rc=col+1;
                rb=0;
              }else{
                rc=col-1;
                rb=COLS-1;
              }
              castle={ rook: rb, col:rc, row: row };
            }
            if((_G.curSel.g.icon=="p"||_G.curSel.g.icon=="P") && (row==0 || row==ROWS-1)){
              p= _G.promoteMenu.getSelectedChoice()[1];
            }
            cfg= {to: toCPos(row,col),from: toCPos(r,c)};
            if(p) cfg["promotion"]=p;
            xxx=board.move(cfg);
            if(!xxx){
              _.assert(false,"Bad user move");
            }
            updateInfo(xxx);
            //console.log("user moved= " + JSON.stringify(xxx));
            playSnd(_G.curSel.g.team);
            clsTargets(M);
            repaint();
            _S.hide(_G.selector);
            _G.curSel=null;
            _G.hidePromotion();
            M.takeTurn();
          }
          break;
        default:
          if(1){
            let skip, cpos,moves;
            if(_G.curSel){
              if(s.g.team != _G.curSel.g.team){
                skip=true;
              }
              else if(_G.curSel===s){
                _S.hide(_G.selector);
                _G.curSel=null;
                skip=true;
              }else{
                cpos=toCPos(row,col);
                moves= board.moves({ square: cpos, verbose:true });
                if(moves && moves.length>0){
                  _G.curSel=null;
                }else{
                  skip=true;
                }
              }
              if(!_G.curSel){
                clsTargets(M);
                _G.hidePromotion();
                _S.hide(_G.selector);
              }
            }
            if(!_G.curSel && !skip){
              cpos=toCPos(row,col);
              if(!moves)
                moves= board.moves({ square: cpos, verbose:true });
              if(moves && moves.length>0){
                let pms= seekPromotion(moves);
                playSnd(s.g.team);
                //console.log("p1 moves ==== ");
                //console.log(JSON.stringify(moves));
                //valid moves
                _G.curSel=s;
                _V.copy(_G.selector,s);
                _S.show(_G.selector);
                moves.forEach(m=>{
                  if(m.san){m=m.san}
                  let [row,col]= toLocal(m);
                  let b= _G.board[row][col];
                  let t= getTarget();
                  t.g.row=row;
                  t.g.col=col;
                  b.g.status="t";
                  _V.copy(t,b);
                  _G.curTargets.push(t);
                  let tt=_G.tiles[row][col];
                  if(!tt)
                    _I.mkBtn(b);
                });
                if(pms && pms.length>0){
                  _G.showPromotion()
                }
              }else{
                console.log("GAME OVER!");
              }
            }
          }
          break;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _PIECES="rRnNbBqQkKpP";
    const _NUMS="12345678";
    function PNG(piece){
      switch(piece){
        case "p": case "P": return "pawn.png";
        case "r": case "R": return "rook.png";
        case "n": case "N": return "knight.png";
        case "b": case "B": return "bishop.png";
        case "q": case "Q": return "queen.png";
        case "k": case "K": return "king.png";
      }
    }
    const CACHE=(function(c){
      c.p=[]; c.P=c.p;
      c.r=[]; c.R=c.r;
      c.n=[]; c.N=c.n;
      c.b=[]; c.B=c.b;
      c.q=[]; c.Q=c.q;
      c.k=[]; c.K=c.k;
      return c;
    })({});
    function cacheIcons(scene){
      _.dotimes(16, ()=> CACHE.p.push(scene.insert(makeIcon("p"))));
      _.dotimes(8, ()=> CACHE.r.push(scene.insert(makeIcon("r"))));
      _.dotimes(8, ()=> CACHE.n.push(scene.insert(makeIcon("n"))));
      _.dotimes(8, ()=> CACHE.b.push(scene.insert(makeIcon("b"))));
      _.dotimes(6, ()=> CACHE.q.push(scene.insert(makeIcon("q"))));
      _.dotimes(2, ()=> CACHE.k.push(scene.insert(makeIcon("k"))));
      CACHE.scene=scene;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function makeIcon(piece, uid){
      let s= _S.sprite(PNG(piece));
      _S.hide(s);
      s.g.icon=piece;
      s.g.team="";
      s.g.row=0;
      s.g.col=0;
      if(uid){
        _S.uuid(s, uid);
      }else{
        _S.anchorXY(s,0.5);
        s.m5.press=function(){
          !_G.mediator.isGameOver() &&
            _onClick(_G.gameScene, s, _G.mediator) };
      }
      return _S.sizeXY(s,_G.pieceSize, _G.pieceSize);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function makeTiles(){
      return _.fill(ROWS,()=> _.fill(COLS,null))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropTile(t){
      if(t){
        _S.hide(t);
        t.x=0;
        t.y=0;
        _I.undoBtn(t);
        CACHE[t.g.icon].push(t);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function clearTiles(){
      _G.tiles.forEach(r=>r.forEach((t,x)=> {
        dropTile(t);
        r[x]=null;
      }));
      return _G.tiles;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function fenDecode(fen, M){
      let fs= fen.substring(0,fen.indexOf(" ")).split("/");
      M.forEach(r=> r.forEach((c,x)=> r[x]=0));
      fs.forEach((s,y)=>{
        let x= 0;
        for(let n,i=0;i<s.length;++i){
          if(_NUMS.indexOf(s[i])>=0){
            n=parseInt(s[i]);
            x+=n;
          }else{
            M[y][x]=s[i];
            ++x;
          }
        }
      });
      return M;
    }
    _G.fenDecode=fenDecode;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getTile(c){
      let rc, a=c?CACHE[c]:null;
      if(a){
        rc= a.length>0? a.pop() : makeIcon(c)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function flipMask(S){
      let t,w,r,T= clearTiles();
      let board=S.board();
      for(let row=0,y=ROWS-1;y>=0;--y){
        for(let col=0,c,x=COLS-1;x>=0;--x){
          if(c=board[y][x]){
            t=getTile(c.type);
            _V.copy(t,_G.board[row][col]);
            w= c.color=="w";
            t.g.icon= w? c.type.toUpperCase() : c.type;
            t.g.row=row;
            t.g.col=col;
            _S.show(t);
            t.g.team=w?"w":"b";
            _S.tint(t,w?WCOLOR:BCOLOR);
            _G.tiles[row][col]=_I.mkBtn(t);
          }
          ++col;
        }
        ++row;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function setMask(S){
      let t,w,r,T= clearTiles();
      let board=S.board();
      board.forEach((r,y)=> r.forEach((c,x)=>{
        if(c){
          t=getTile(c.type);
          _V.copy(t,_G.board[y][x]);
          w= c.color=="w";
          t.g.icon= w? c.type.toUpperCase() : c.type;
          t.g.row=y;
          t.g.col=x;
          _S.show(t);
          t.g.team=w?"w":"b";
          _S.tint(t,w?WCOLOR:BCOLOR);
          _G.tiles[y][x]=_I.mkBtn(t);
        }
      }));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const BCOLOR=_S.color("#cdf011"); //BC="yellow";
    //const WCOLOR="#eeaa11"; //WC="orange";
    const WCOLOR=_S.color("#ffffff"); //WC="orange";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(options){
        let self=this,
          p1,p2,
          team=[0,"w","b"],
          M,K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          M= _G.mediator= new CHMediator();
          _G.dispInfo=(Mojo.width> 1100 && Mojo.height > 740);
          _G.curTargets=[];
          _G.targets=[];
          _G.board=[];
          _G.tiles=[];
          _G.redScore=0;
          _G.blackScore=0;
          _G.gameScene=self;
          _G.tiles= makeTiles();
          if(options.startsWith==2){
            team[1]="b";team[2]="w";
          }
          p1= new CHHuman(team[1],_G.X);
          if(options.mode==1){
            p2=new CHBot(team[2],_G.O);
            p2.ai= _G.AI(p1,p2);
          }else{
            p2= new CHHuman(team[2],_G.O);
          }
          return M.add(p1).add(p2);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initBoard=()=>{
          let z,g= _G.grid= _S.gridXY([COLS,ROWS],0.9,0.75);
          _G.arena= _S.gridBBox(0,0,g);
          for(let t,y=0;y<ROWS;++y){
            _G.board.push(t=[]);
            for(let s,c,x=0;x<COLS;++x){
              c=_G.grid[y][x];
              s= _S.spriteFrom((_.isEven(y)&&_.isEven(x))||
                               (!_.isEven(y)&&!_.isEven(x))
                               ? ["light.png","light1.png"] : ["dark.png","dark1.png"]);
              t.push( _S.anchorXY(s,0.5));
              s.g.row=y; s.g.col=x;
              z=c.x2-c.x1;
              s.m5.press=()=>{ _onClick(self, s,M) };
              _S.sizeXY(_S.uuid(s,`c:${y},${x}`),z,z);
              self.insert( _V.set(s, _M.ndiv(c.x1+c.x2,2),
                                     _M.ndiv(c.y1+c.y2,2)));
              if(!_G.pieceSize)
                _G.pieceSize= _.evenN(z*0.85,1);
            }
          }
          cacheIcons(self);
          let sel= _G.selector= _S.sprite("select.png");
          _S.hide(sel);
          _S.uuid(sel,"selector");
          self.insert( _S.sizeXY(_S.anchorXY(sel,0.5),z,z));
          //scene.insert(_S.bboxFrame(_G.arena,16,"#b2b2b2"));//"#4d4d4d"));//"#7f98a6"));
          return self.insert(_G.frame= _S.bboxFrame(_G.arena,16,"#4d4d4d"));//"#7f98a6"));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initMarks=()=>{
          let M=_G.mediator,
            cfg={fontName:UI_FONT,fontSize:36*K};
          let s,color,rows,cols,row=ROWS-1;
          if(M.flipped()){
            rows= RPOS.reverse();
            cols= F_COLPOS;
            color=BCOLOR;
          }else{
            color=WCOLOR;
            rows= RPOS;
            cols= COLPOS;
          }
          cols.split("").forEach((c,x)=>{
            s= _S.tint(_S.bmpText(c,cfg),color);
            _S.pinBelow(_G.board[row][x],s,24,0.5);
            self.insert(s);
          });
          rows.forEach((c,x)=>{
            s= _S.tint(_S.bmpText(`${c}`,cfg),color);
            _S.pinLeft(_G.board[x][0],s,24,0.5);
            self.insert(s);
          });
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initPromotion=()=>{
          let cfg={
            bg:"#cccccc",
            opacity:0.3,
            defaultChoice:"#queen",
            selectedColor:C_ORANGE,
            disabledColor:"#cccccc"
          };
          let out=[makeIcon("q","#queen"),
                   makeIcon("b","#bishop"),
                   makeIcon("n","#night"),makeIcon("r","#rook")];
          out.forEach(c=> _S.show(_S.tint(c,C_ORANGE)));
          _G.promoteMenu= _Z.choiceMenuY(out,cfg);
          _S.pinRight(_G.frame, _G.promoteMenu,10,0);
          self.insert(_G.promoteMenu);
          return _G.hidePromotion();
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initMsgs=(s)=>{
          s= _G.checkMsg=_S.bmpText("Check!",UI_FONT, 48*K);
          _S.pinRight(_G.frame, s, 10);
          _S.hide(s);
          self.insert(s);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initInfo=()=>{
          let x= _S.leftSide(_G.frame)/2,
              out,prev,m,s,c1,c2,
              p2moves=[],p1moves=[],
              xxx={fontName: UI_FONT, fontSize: 48*K},
              cfg={fontName: UI_FONT, fontSize: 64*K};
          _G.moves={};
          if(_G.mediator.flipped()){
            _G.moves["w"]=p2moves;
            _G.moves["b"]=p1moves;
            c1=BCOLOR;
            c2=WCOLOR;
          }else{
            _G.moves["w"]=p1moves;
            _G.moves["b"]=p2moves;
            c2=BCOLOR;
            c1=WCOLOR;
          }
          ///////
          s= _S.bmpText("PLAYER 2",cfg);
          _S.pinLeft(_G.frame,s, 100,0);
          s.x=x;
          s.y += s.height/2;
          _S.anchorXY(_S.tint(s,c2),0.5);
          self.insert(s);
          prev=s;
          out=p2moves;
          _.dotimes(5,()=>{
            m=_S.bmpText("AAA",xxx);
            _S.tint(m,c2);
            _S.pinBelow(prev,m,16,0);
            out.push(self.insert(m));
            prev=m;
          });
          out.forEach(m=>m.text="--");
          ////////
          s= _S.bmpText("PLAYER 1",cfg);
          _S.pinLeft(_G.frame,s, 100,1);
          s.x=x;
          s.y += s.height/2;
          _S.anchorXY(_S.tint(s,c1),0.5);
          self.insert(s);
          prev=s;
          out=p1moves;
          _.dotimes(5,()=>{
            m=_S.bmpText("AAA",xxx);
            _S.tint(m,c1);
            _S.pinAbove(prev,m,16,0);
            out.push(self.insert(m));
            prev=m;
          });
          out.forEach(m=>m.text="--");
        };
        this.g.initMisc=(s)=>{
          s= _S.spriteFrom("audioOn.png","audioOff.png");
          _I.mkBtn(_S.scaleXY(s,1.2*K,1.2*K));
          s.anchor.x=1;
          s.anchor.y=0;
          s.alpha=0.5;
          s.m5.showFrame(_D.sfx()?0:1);
          s.m5.press=(btn)=>{
            if(_D.sfx()){
              _D.mute();
            }else{
              _D.unmute();
            }
            s.m5.showFrame(_D.sfx()?0:1);
          };
          self.insert( _V.set(s,Mojo.width,0));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() && this.g.initBoard() && this.g.initPromotion();
        M.flipped(p1.uuid()=="b");
        this.g.initMarks();
        this.g.initMsgs();
        if(_G.dispInfo)
          this.g.initInfo();
        this.g.initMisc();
        repaint();
        M.start(options.startsWith==1?p1:p2);
      },
      postUpdate(){
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function pieceName(piece){
      switch(piece){
        case "p": return "pawn";
        case "r": return "rook";
        case "n": return "knight";
        case "b": return "bishop";
        case "q": return "queen";
        case "k": return "king";
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function updateInfo(move){
      if(!_G.dispInfo){ return }
      let {color,from,to,piece}= move;
      let moves= _G.moves[color];
      let m,i,
          sz=moves.length,
          fmt=`${from}${to}(${piece})`;
      for(i=0;i<sz;++i){
        m=moves[i];
        if(m.text=="--"){
          m.text=fmt;
          return;
        }
      }
      for(i=1;i<sz;++i){
        m=moves[i];
        moves[i-1].text=m.text;
      }
      moves[sz-1].text=fmt;
    }


    Mojo.Scenes.run("Splash",SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["images/tiles.json", "bggreen.jpg",
                 "audioOff.png","audioOn.png",
                 "click.mp3", "x.mp3","o.mp3","game_over.mp3","game_win.mp3"],
    arena:{width:1344, height:840},
    iconSize: 96,
    scaleFit:"x",
    scaleToWindow:"max",
    start(...args){ scenes(...args) }

  }));

})(this);





