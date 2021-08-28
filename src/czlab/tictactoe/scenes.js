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

  window["io/czlab/tictactoe/Scenes"]=function(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_T,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;
    const int=Math.floor;
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    /**/
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bgblack.jpg"),Mojo.width,Mojo.height);
      scene.insert(_G.backDropSprite);
    }

    /**/
    function doSoundIcon(scene){
      const K=Mojo.getScaleFactor(),
            X=Mojo.Sound,
            s= _S.spriteFrom("audioOn.png","audioOff.png");
      _I.mkBtn(s, _S.scaleBy(s,K,K));
      s.x=Mojo.width-s.width - 10;
      s.y=0;
      s.alpha=0.343;
      s.m5.showFrame(X.sfx()?0:1);
      s.m5.press=()=>{
        X.sfx()?X.mute():X.unmute();
        s.m5.showFrame(X.sfx()?0:1);
      }
      scene.insert(s);
    }

    /**/
    _Z.defScene("Splash",{
      setup(){
        const verb = Mojo.touchDevice ? "Tap": "Click";
        const K= Mojo.getScaleFactor();
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=function(s){
          s=_S.bmpText("Tic Tac Toe",{fontName:_G.TITLE_FONT, fontSize: 120*K});
          _S.centerAnchor(s).tint=C_TITLE;
          self.insert(_V.set(s,Mojo.width/2, Mojo.height*0.3));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doPlayBtn=function(s,b,t){
          s=_S.bmpText(`${verb} to PLAY!`, {fontName:_G.UI_FONT,fontSize:72*K});
          _S.centerAnchor(s).tint=_S.color("white");
          b=_I.makeButton(s);
          t=_T.throb(b,0.99);
          b.m5.press=function(){
            _T.remove(t);
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY, ()=>_Z.replaceScene(self, "MainMenu"));
          };
          self.insert(_V.set(b,Mojo.width/2, Mojo.height * 0.7));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doTitle();
        this.g.doPlayBtn();
      }
    });

    /**/
    _Z.defScene("EndGame",{
      setup(){
        const K=Mojo.getScaleFactor();
        const mode = _G.mode;
        const w= _G.lastWin;
        let msg="No Winner!",
            cfg={fontName:_G.UI_FONT, fontSize:72*K};

        if(w===_G.X)
          msg= mode===1 ? "You win !" : "X wins !";
        if(w===_G.O)
          msg= mode===1 ? "You lose !" : "O wins !";

        function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
        let b1=_I.mkBtn(_S.bmpText("Play Again?", cfg));
        let b2=_I.mkBtn(_S.bmpText("Quit", cfg));
        let m1=_S.bmpText("Game Over", cfg);
        let m2=_S.bmpText(msg, cfg);
        let gap=_S.bmpText("or", cfg);
        b1.m5.press=()=>{ _G.playClick(); _Z.runSceneEx("MainMenu") };
        b2.m5.press=()=>{ _G.playClick(); _Z.runSceneEx("Splash") };
        _G.playSnd("game_over.wav");
        this.insert( _Z.layoutY([m1, m2, space(), space(), b1, gap, b2])) }
    });

    /**/
    _Z.defScene("Start1",{
      setup(){
        const K=Mojo.getScaleFactor();
        const self=this;
        let m1,m2;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doChoices=function(){
          const cfg={fontSize:64*K,fontName:_G.UI_FONT};
          function space(){
            return _S.opacity(_S.bmpText("I", cfg),0)}
          m1=_Z.choiceMenuY([
            _I.mkBtn(_S.uuid(_S.bmpText("Easy",cfg),"#easy")),
            space(),
            _I.mkBtn(_S.uuid(_S.bmpText("Normal",cfg),"#normal")),
            space(),
            _I.mkBtn(_S.uuid(_S.bmpText("Hard",cfg),"#hard"))],
            {bg:"#cccccc",opacity:0.3, onClick: ()=>{_G.playClick()},
             defaultChoice:"#easy", selectedColor:C_ORANGE, disabledColor:"#dddddd"});
          self.insert(_V.set(m1,(Mojo.width-m1.width)/2, Mojo.height * 0.1));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=function(){
          const cfg={fontSize:72*K,fontName:_G.UI_FONT};
          function space(){
            return _S.opacity(_S.bmpText("I", cfg),0)}
          const c1=_S.uuid(_I.mkBtn(_S.bmpText("Yes",cfg)),"play#x");
          const c2=_S.uuid(_I.mkBtn(_S.bmpText("No", cfg)),"play#o");
          m2= _Z.layoutX([_S.bmpText("Player (X) starts?",cfg),
                          space(),
                          c1, _S.bmpText(" /  ",cfg), c2], {bg:"transparent"});
          _V.set(m2,(Mojo.width-m2.width)/2, Mojo.height*0.6);
          function cbFunc(b){
            let who,id=b.m5.uuid;
            if(id=="play#x") who=_G.X;
            if(id=="play#o") who=_G.O;
            _Z.replaceScene(self,"PlayGame",
                            {mode:1, startsWith: who, level: m1.getSelectedChoice()})
          }
          c1.m5.press=
          c2.m5.press=function(b){
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY,()=>cbFunc(b))
          };
          self.insert(m2);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doChoices();
        this.g.doNext();
      }
    });

    /**/
    _Z.defScene("Start2",{
      setup(options){
        const K=Mojo.getScaleFactor();
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doMenu=function(){
          function cbFunc(btn){
            let who,id=btn.m5.uuid;
            if(id=="play#x") who=_G.X;
            if(id=="play#o") who=_G.O;
            _Z.replaceScene(self,"PlayGame", {mode:2, startsWith: who}) }
          const cfg={fontSize:72*K, fontName:_G.UI_FONT};
          const c1=_S.uuid(_I.mkBtn(_S.bmpText("Yes",cfg)),"play#x");
          const c2=_S.uuid(_I.mkBtn(_S.bmpText("No", cfg)),"play#o");
          function space(){ return _S.opacity(_S.bmpText("I", cfg),0) }
          const m2= _Z.layoutX([_S.bmpText("Player (X) starts?",cfg),
                                space(), c1, _S.bmpText(" /  ",cfg), c2], {bg:"transparent"});
          _V.set(m2,(Mojo.width-m2.width)/2, Mojo.height*0.6);
          c1.m5.press=
          c2.m5.press=function(b){
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY,()=>cbFunc(b));
          };
          self.insert(m2);
        };

        doBackDrop(this);
        this.g.doMenu();
      }
    });

    /**/
    _Z.defScene("MainMenu",{
      setup(){
        const K=Mojo.getScaleFactor();
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doMenu=function(){
          const cfg={fontSize: 64*K, fontName:_G.UI_FONT};
          const b1=_S.uuid(_I.mkBtn(_S.bmpText("One Player", cfg)),"play#1");
          const b2=_S.uuid(_I.mkBtn(_S.bmpText("Two Player", cfg)),"play#2");
          const gap=_S.bmpText("or", cfg);
          function space(){ return _S.opacity(_S.bmpText("I",cfg),0) }
          function cbFunc(btn){
            _Z.replaceScene(self, btn.m5.uuid == "play#1"?"Start1":"Start2")
          }
          b1.m5.press=
          b2.m5.press=function(b){
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY,()=>cbFunc(b));
          };
          self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}))
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doMenu();
      }
    });

    /**/
    function _drawBox(ctx){
      const K=Mojo.getScaleFactor();
      let grid=_G.grid,
          gf= grid[0],
          gl= grid[grid.length-1];

      ctx.beginFill("#000000");
      ctx.strokeStyle= "white";
      ctx.lineWidth=4*K;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      ctx.endFill();
    }

    /**/
    function _drawGrid(ctx){
      const K=Mojo.getScaleFactor();
      let grid=_G.grid,
          gf= grid[0][0];
      _S.drawGridLines(gf.x1,gf.y1,grid,4*K,"white",ctx)
    }

    /**/
    function _seeder(){
      return _.fill(new Array(_G.DIM*_G.DIM),0)
    }

    /**/
    _Z.defScene("PlayGame",{
      onAI(pos){
        const y=int(pos/_G.DIM);
        const x=pos%_G.DIM;
        const t= this.getChildById(`tile,${x},${y}`);
        //tell the selected tile to do work
        Mojo.emit(["ai.moved",t]);
      },
      _initLevel(options){
        let mode=options.mode,
            grid= _S.gridSQ(3,0.8),
            s=_S.sprite("icons.png"),
            cz= _S.bboxSize(grid[0][0]);
        _G.iconSize=[int(s.width/3), s.height];
        //o == 79, x= 88
        _.inject(_G,{lastWin: 0,
                     ai: null,
                     mode: mode,
                     pnum: _G.X,
                     grid: grid,
                     cells: _seeder(),
                     goals: _G.mapGoalSpace(),
                     level: options.level,
                     pcur: options.startsWith,
                     players: _.jsVec(null,null,null),
                     iconScale: Mojo.scaleXY(_G.iconSize,cz) });
        return mode;
      },
      setup(options){
        const mode=this._initLevel(options);
        const scale= _G.iconScale;
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doArena=function(){
          let grid=_G.grid,
              dim=grid.length;
          let box=_S.group(_S.drawBody(_drawGrid));
          _S.centerAnchor(box.children[0]);
          _V.set(box,int(Mojo.width/2),
                     int(Mojo.height/2));
          self.insert(box);
          grid.forEach((r,y)=>{
            r.forEach((o,x)=>{
              const b=_S.bboxCenter(o);
              const id= `tile,${x},${y}`;
              const s=_G.Tile(b[0],b[1],_G.iconSize[0],_G.iconSize[1],
                              {uuid: id, scale: scale, gpos: y*dim+x, gval: 0});
              self.insert(s);
            });
          });
        };

        doBackDrop(this);
        doSoundIcon(this);
        this.g.doArena();
        //decide who plays X and who starts
        if(mode===1){
          let a= _G.ai=_G.AI(_G.O);
          a.scene=this;
          Mojo.on(["ai.moved",this],"onAI");
          //ai starts?
          if(_G.pcur===_G.O)
            _.delay(100, ()=> Mojo.emit(["ai.move", a]))
        }
      }
    });

  };

})(this);











