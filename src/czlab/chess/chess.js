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

    window["io/czlab/chess/AI"](Mojo);

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           ute:_, is}= Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor;
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
    //
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const COLPOSMAP={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7};
    const COLPOS="abcdefgh";
    const ROWPOS=[null,7,6,5,4,3,2,1,0];
    const RPOS=[8,7,6,5,4,3,2,1];

    const VZERO="0".charCodeAt(0);
    const VNINE="9".charCodeAt(0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toLocal(pos){
      let col,row;
      let team=_G.mediator.cur().uuid();
      if(pos=="O-O-O" || pos=="O-O"){
        row= team=="w"? 1: 8;
        col= pos.length>3 ? 2 : 6;
      }else{
        for(let c,i=pos.length-1;i>=0;--i){
          c=pos.charCodeAt(i);
          if(c>VZERO&&c<VNINE){
            col=COLPOSMAP[pos[i-1]];
            row= +pos[i];
            break;
          }
        }
      }
      return [ ROWPOS[row], col];
    }

    function toCPos(row,col){
      return `${COLPOS[col]}${RPOS[row]}` }

    /*
     * [{"color":"b","from":"b8","to":"c6","flags":"n","piece":"n","san":"Nc6"},{"color":"b","from":"b8","to":"a6","flags":"n","piece":"n","san":"Na6"},{"color":"b","from":"g8","to":"h6","flags":"n","piece":"n","san":"Nh6"},{"color":"b","from":"g8","to":"f6","flags":"n","piece":"n","san":"Nf6"},{"color":"b","from":"a7","to":"a6","flags":"n","piece":"p","san":"a6"},{"color":"b","from":"a7","to":"a5","flags":"b","piece":"p","san":"a5"},{"color":"b","from":"b7","to":"b6","flags":"n","piece":"p","san":"b6"},{"color":"b","from":"b7","to":"b5","flags":"b","piece":"p","san":"b5"},{"color":"b","from":"c7","to":"c6","flags":"n","piece":"p","san":"c6"},{"color":"b","from":"c7","to":"c5","flags":"b","piece":"p","san":"c5"},{"color":"b","from":"d7","to":"d6","flags":"n","piece":"p","san":"d6"},{"color":"b","from":"d7","to":"d5","flags":"b","piece":"p","san":"d5"},{"color":"b","from":"e7","to":"e6","flags":"n","piece":"p","san":"e6"},{"color":"b","from":"e7","to":"e5","flags":"b","piece":"p","san":"e5"},{"color":"b","from":"f7","to":"f6","flags":"n","piece":"p","san":"f6"},{"color":"b","from":"f7","to":"f5","flags":"b","piece":"p","san":"f5"},{"color":"b","from":"g7","to":"g6","flags":"n","piece":"p","san":"g6"},{"color":"b","from":"g7","to":"g5","flags":"b","piece":"p","san":"g5"},{"color":"b","from":"h7","to":"h6","flags":"n","piece":"p","san":"h6"},{"color":"b","from":"h7","to":"h5","flags":"b","piece":"p","san":"h5"}]
    */
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
        if(this.owner.state.in_checkmate()){
          this.owner.gameOver(this.owner.other());
          alert("Poo!");
        }else if(this.owner.state.in_draw() ||
                 this.owner.state.in_stalemate()){
          this.owner.gameOver();
        }else{
          if(this.owner.state.in_check()){
            _G.showCheckMsg();
          }else{
            _G.hideCheckMsg();
          }
          _.delay(444,()=> this.doPoke())
        }
      }
      doPoke(){
        let S= _G.mediator.gameState();
        let moves= S.moves({verbose:true});
        console.log("aiMove=======");
        console.log(JSON.stringify(moves));
        let move=this.ai.run(S, this);
        if(move)
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
        _S.tint(_G.selector, this.uuid()=="w"?WCOLOR:BCOLOR);
        if(this.owner.state.in_checkmate()){
          this.owner.gameOver( this.owner.other());
          alert("Poo!!!");
        }else if(this.owner.state.in_draw() ||
                 this.owner.state.in_stalemate()){
          this.owner.gameOver();
        }else{
          console.log(this.owner.state.ascii());
          if(this.owner.state.in_check()){
            _G.showCheckMsg();
          }else{
            _G.hideCheckMsg();
          }
          super.onPoke();
        }
      }
      onWait(){
        super.onWait();
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
      start(cur){
        _.assert(cur.uuid()=="w","White should start first!");
        super.start(cur);
      }
      updateState(who,move){
        let [r,c]= toLocal(move.from);
        let [row,col]= toLocal(move.to);
        let a= _G.tiles[r][c];
        let b= _G.tiles[row][col];
        let p= _G.board[row][col];
        _.assert(a, "aiMove.from is bad");
        if(b){
          _S.remove(b);
        }
        a.g.row=row;
        a.g.col=col;
        _V.copy(a,p);
        _G.tiles[row][col]=a;
        _G.tiles[r][c]=null;
        this.state.move(move);
      }
      postMove(who,move){
        console.log("post-ai========");
        console.log(this.state.ascii());
        _nextToPlay();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkEnd(){

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
    _.inject(_G,{
      COLS:8,
      ROWS:8,
      X:88,
      O:79,
      hideCheckMsg(){
        this.checkMsg.visible=false;
      },
      showCheckMsg(){
        let c= this.mediator.other().uuid()=="w"?WCOLOR:BCOLOR;
        _S.tint(this.checkMsg, c);
        this.checkMsg.visible=true;
      },
      hidePromotion(){
        this.promoteMenu.visible=false;
        this.promoteMenu.children.forEach(c=> _I.undoBtn(c));
        return this.promoteMenu;
      },
      showPromotion(){
        this.promoteMenu.visible=true;
        this.promoteMenu.children.forEach(c=> _I.mkBtn(c));
        return this.promoteMenu;
      }
    });

    function seekPromotion(moves){
      return moves.filter(m=>{
        if(m.san){ m=san }
        if(is.str(m) && m.includes("=")){
          return true;
        }
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bggreen.jpg"), Mojo.width, Mojo.height);
      return scene.insert(_G.backDropSprite);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Chess",{fontName:TITLE_FONT, fontSize: 100*K});
          _S.tint(s,C_TITLE);
          _V.set(s, Mojo.width/2, Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(b,s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT, fontSize: 72*K});
          _V.set(s, Mojo.width/2, Mojo.height*0.7);
          b=_I.mkBtn(s);
          t=_F.throb(b,0.99);
          b.m5.press=(btn)=>{
            _F.remove(t);
            _S.tint(btn,C_ORANGE);
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("MainMenu"));
          };
          self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("MainMenu",{
      setup(){
        let self=this,
            mode=1,
            K=Mojo.getScaleFactor(),
            cfg={fontName:UI_FONT,fontSize:72*K};
        function space(){return _S.opacity(_S.bmpText("I",cfg),0)}
        let b1= _S.uuid(_I.mkBtn(_S.bmpText("One Player",cfg)),"#p1");
        let gap=_S.bmpText("or",cfg);
        let b2= _S.uuid(_I.mkBtn(_S.bmpText("Two Player",cfg)),"#p2");
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2")mode=2;
          _S.tint(btn,C_ORANGE);
          _.delay(CLICK_DELAY,()=>_Z.runSceneEx("StartMenu",{mode}));
        };
        self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("StartMenu",{
      setup(options){
        let self=this,
            K=Mojo.getScaleFactor(),
            cfg={fontName:UI_FONT,fontSize:72*K};
        options.startsWith=1;
        function space(){return _S.opacity(_S.bmpText("I",cfg),0)}
        let msg= _S.bmpText("Player 1 (white) starts? ",cfg);
        let b1= _I.mkBtn(_S.uuid(_S.bmpText("Yes",cfg),"#p1"));
        let gap= _S.bmpText(" / ",cfg);
        let b2= _I.mkBtn(_S.uuid(_S.bmpText("No",cfg), "#p2"));
        b1.m5.press=
        b2.m5.press=(btn)=>{
          if(btn.m5.uuid=="#p2") options.startsWith=2;
          _S.tint(btn,C_ORANGE);
          _.delay(CLICK_DELAY,()=>_Z.runSceneEx("PlayGame", options));
        };
        self.insert(_Z.layoutX([msg,space(), b1, gap, b2],{bg:"transparent"}));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function clsTargets(M){
      _G.curTargets.forEach(t=>dropTarget(t));
      _G.curTargets.length=0;
      _G.board.forEach(r=> r.forEach(c=>{
        c.g.status="";
      }));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropTarget(t){
      let {row,col}=t.g;
      t.visible=false;
      _G.targets.push(t)
      _I.undoBtn( _G.board[row][col] );
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getTarget(){
      let s;
      if(_G.targets.length===0){
        s=_S.sprite("target.png");
        _S.tint(s,C_ORANGE);
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

    function updatePromotion(scene, p,row,col){
      let M= _G.mediator,
          b,z,s,t,pos,team= M.cur().uuid();
      switch(p){
        case "q": pos=3; break;
        case "b": pos=2; break;
        case "n": pos=1; break;
        case "r": pos=0; break;
      }
      s= _makePiece(pos, team);
      z=_G.pieceSize;
      s.g.row=row;
      s.g.col=col;
      t= _G.tiles[row][col];
      _S.remove(t);
      _I.mkBtn(_S.centerAnchor( _S.sizeXY(s,z,z)));
      _V.copy(s,  _G.board[row][col]);
      scene.insert(s);
      s.m5.press=()=>{ M.isGameOver() ? null : _onClick(scene, s,M) };
      return _G.tiles[row][col] =s;
    }

    function doCastling(castle){
      let {rook,row,col}=castle;
      let r= _G.tiles[row][rook];
      let b= _G.board[row][col];
      _G.tiles[row][rook]=null;
      _G.tiles[row][col]=r;
      r.g.row=row;
      r.g.col=col;
      _V.copy(r,b);
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
            if(_G.curSel.g.icon=="k" &&
               r===row && (r===0 || r===_G.ROWS-1) && Math.abs(c-col)==2){
              let rb, rc;
              if(c>col){//o-o-o
                rc=col+1;
                rb=0;
              }else{
                rc=col-1;
                rb=_G.COLS-1;
              }
              castle={ rook: rb, col:rc, row: row };
            }
            if(_G.curSel.g.icon=="p" && (row===0 || row===_G.ROWS-1)){
              p= _G.promoteMenu.getSelectedChoice()[1];
            }
            cfg= {to: toCPos(row,col),from: toCPos(r,c)};
            if(p) cfg["promotion"]=p;
            xxx= board.move(cfg);
            _.assert(xxx,"Bad user move");
            console.log("user moved= " + JSON.stringify(xxx));
            console.log(board.ascii());
            b=_G.board[row][col];
            t= _G.tiles[row][col];
            _S.remove(t);
            clsTargets(M);
            _V.copy(_G.curSel,b);
            _G.curSel.g.row=row;
            _G.curSel.g.col=col;
            _G.tiles[r][c]=null;
            _G.tiles[row][col]=_G.curSel;
            _G.selector.visible=false;
            _G.curSel=null;
            _G.hidePromotion();
            if(p)
              updatePromotion(scene, p,row,col);
            if(castle)
              doCastling(castle);
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
                _G.selector.visible=false;
                _G.curSel=null;
                skip=true;
              }else{
                cpos=toCPos(row,col);
                moves= board.moves({ square: cpos });
                if(moves && moves.length>0){
                  _G.curSel=null;
                }else{
                  skip=true;
                }
              }
              if(!_G.curSel){
                _G.selector.visible=false;
                _G.hidePromotion();
                clsTargets(M);
              }
            }
            if(!_G.curSel && !skip){
              cpos=toCPos(row,col);
              if(!moves)
                moves= board.moves({ square: cpos });
              if(moves && moves.length>0){
                let pms= seekPromotion(moves);
                console.log("p1 moves ==== ");
                console.log(JSON.stringify(moves));
                //valid moves
                _G.curSel=s;
                _V.copy(_G.selector,s);
                _G.selector.visible=true;
                moves.forEach(m=>{
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
    const BCOLOR=_S.color("#cdf011"); //BC="yellow";
    //const WCOLOR="#eeaa11"; //WC="orange";
    const WCOLOR=_S.color("#ffffff"); //WC="orange";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _makePawn(col,team){
      const s=_S.uuid(_S.sprite("pawn.png"),`${team}/p${col+1}`);
      s.g.team=team;
      s.g.icon="p";
      return _S.tint(s,_S.color(team=="b"?BCOLOR:WCOLOR));
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _makePiece(col,team){
      let piece,n,s;
      switch(col){
        case 0: case 7: n="rook.png"; break;
        case 1: case 6: n="knight.png"; break;
        case 2: case 5: n="bishop.png"; break;
        case 3: n="queen.png"; break;
        case 4: n="king.png"; break;
      }
      piece=n[0];
      if(n[0]=="k" && n[1]=="n") piece="n";
      s= _S.uuid(_S.sprite(n), `${team}/${piece}${col+1}`);
      s.g.icon=piece;
      s.g.team=team;
      return _S.tint(s,_S.color(team=="b"?BCOLOR:WCOLOR));
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(options){
        let self=this,
            p1,p2,
            M,K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          M= _G.mediator= new CHMediator();
          _G.curTargets=[];
          _G.targets=[];
          _G.board=[];
          _G.tiles=[];
          _G.redScore=0;
          _G.blackScore=0;
          M.add(p1= new CHHuman("w",_G.X));
          if(options.mode===1){
            M.add(p2=new CHBot("b",_G.O));
            p2.ai= _G.AI(p1,p2);
          }else{
            M.add(p2= new CHHuman("b",_G.O));
          }
          return M;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initBoard=()=>{
          let z,g= _G.grid= _S.gridXY([_G.COLS,_G.ROWS]);
          _G.arena= _S.gridBBox(0,0,g);
          for(let t,y=0;y<_G.ROWS;++y){
            _G.board.push(t=[]);
            for(let s,c,x=0;x<_G.COLS;++x){
              c=_G.grid[y][x];
              s= _S.spriteFrom((_.isEven(y)&&_.isEven(x))||
                               (!_.isEven(y)&&!_.isEven(x))
                               ? ["light.png","light1.png"] : ["dark.png","dark1.png"]);
              t.push( _S.centerAnchor(s));
              s.g.row=y; s.g.col=x;
              z=c.x2-c.x1;
              s.m5.press=()=>{ _onClick(self, s,M) };
              _S.sizeXY(_S.uuid(s,`c:${y},${x}`),z,z);
              self.insert( _V.set(s, int((c.x1+c.x2)/2),
                                     int((c.y1+c.y2)/2)));
            }
          }
          let sel= _G.selector= _S.sprite("select.png");
          sel.visible=false;
          _S.uuid(sel,"selector");
          return self.insert( _S.sizeXY(_S.centerAnchor(sel),z,z));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initArena=()=>{
          for(let r,y=0;y<_G.ROWS;++y){
            _G.tiles.push(r=[]);
            for(let c,s,x=0;x<_G.COLS;++x){
              c=_G.grid[y][x];
              s=null;
              if(y<2){ //black
                s= y===0 ? _makePiece(x,"b") : _makePawn(x,"b")
              }else if(y>5){ //white
                s= y===7 ? _makePiece(x,"w") : _makePawn(x,"w")
              }
              r.push(s);
              if(s){
                let z=int(0.85 * (c.x2-c.x1));
                _G.pieceSize=z;
                z=_.evenN(z,1);
                s.g.row=y;
                s.g.col=x;
                _I.mkBtn(_S.centerAnchor( _S.sizeXY(s,z,z)));
                _V.set(s, int((c.x1+c.x2)/2), int((c.y1+c.y2)/2));
                self.insert(s);
                s.m5.press=()=>{ M.isGameOver() ? null : _onClick(self, s,M) };
              }
            }
          }
          //scene.insert(_S.bboxFrame(_G.arena,16,"#b2b2b2"));//"#4d4d4d"));//"#7f98a6"));
          return self.insert(_G.frame= _S.bboxFrame(_G.arena,16,"#4d4d4d"));//"#7f98a6"));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initPromotion=()=>{
          let ns=["rook","night","bishop","queen"];
          let out=[];
          let cfg={
            defaultChoice:"#queen",
            selectedColor:C_ORANGE,
            disabledColor:"#cccccc",
            bg:"#cccccc",
            opacity:0.3
          };
          for(let p,i=0;i<ns.length;++i){
            p=_makePiece(i,"");
            _S.tint(p,C_ORANGE);
            out.unshift(_S.uuid(p,`#${ns[i]}`));
            _S.sizeXY(p, _G.pieceSize,_G.pieceSize);
          }
          _G.promoteMenu= _Z.choiceMenuY(out,cfg);
          _S.pinRight(_G.frame, _G.promoteMenu,10,0);
          self.insert(_G.promoteMenu);
          return _G.hidePromotion();
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initMsgs=(s)=>{
          let cfg={fontName: UI_FONT, fontSize: 48*K};
          s= _G.checkMsg=_S.bmpText("Check!",cfg);
          _S.pinRight(_G.frame, s, 10);
          s.visible=false;
          self.insert(s);
          //s=_G.checkMate=_S.bmpText("CheckMate!",cfg);
          //_S.pinRight(_G.frame, s, 10);
          //self.insert(s);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() && this.g.initBoard() && this.g.initArena() && this.g.initPromotion();
        this.g.initMsgs();
        M.start(options.startsWith===1?p1:p2);
      },
      postUpdate(){
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("HUD",{
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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["images/tiles.json", "bggreen.jpg", "click.mp3", "x.mp3","o.mp3","game_over.mp3","game_win.mp3"],
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





