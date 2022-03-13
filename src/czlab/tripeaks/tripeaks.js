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
  //A bit about the game...
  //The origin of this game came from a college school assignment.
  //The aim is to match 2 cards with values added up to 13, upon which
  //the cards will disappear.  You are also allowed to draw a card
  //from a pile, until it runs out.
  //For the special case of a King(K), matching 2 Kings will
  //earn you more points.
  //The game is won when you clear all the cards.

  /**/
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX: _T,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#fff20f"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in game dependencies
    window["io/czlab/tripeaks/models"](Mojo);

    /**/
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.jpg"));
      return scene.insert(_G.backDropSprite);
    }

    /**/
    _Z.defScene("Splash",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor(),
          t,c1,c2, b, s, msg, fz= K * 120,
          verb = Mojo.touchDevice ? "Tap": "Click";
        this.g.doTitle=(s)=>{
          s=_S.bmpText("TriPeaks 13",
                       {fontName:TITLE_FONT, fontSize: 160*K});
          s.tint=C_TITLE;
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          return self.insert(_S.anchorXY(s,0.5));
        };
        this.g.doNext=(msg,t)=>{
          msg=_S.bmpText(`${verb} to play!`,
                         {fontName:UI_FONT, fontSize:124*K});
          msg.tint=_S.color("#ffffff");
          t=_T.throb(msg,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _T.remove(t);
            _S.tint(msg,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame"));
          }
          Mojo.on(["single.tap"],cb);
          _V.set(msg,Mojo.width/2, Mojo.height * 0.7);
          return self.insert( _S.anchorXY(msg,0.5));
        };
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    /**End menu */
    _Z.defScene("EndGame",{
      setup(options){
        let os={fontName:UI_FONT,
                fontSize: 72*Mojo.getScaleFactor()},
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(options.msg, os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=> _Z.runSceneEx("PlayGame");
        s6.m5.press=()=> _Z.runSceneEx("Splash");
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    /**/
    _Z.defScene("PlayGame",{
      flipDrawCard(){
        let dc=_G.model.getDrawCard();
        let c0, {width,height}=dc;
        _S.remove( _I.undoDrag(dc));
        c0=_G.model.discardDraw();
        if(c0){
          let [x,y]=_G.drawCardPos;
          c0.visible=true;
          _V.set(c0,x,y);
          _V.set(c0.g,x,y);
          _S.sizeXY( _I.makeDrag(c0), width,height);
          c0.m5.showFrame(1);
          _G.drawCard=this.insert(c0);
          Mojo.sound("pick.mp3").play();
        }
      },
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          const m= _G.model= new _G.TriPeak(self);
          const rows= m.getNumRows();
          _G.peaks=0;
          _G.score=0;
          _G.gameOver=false;
          m.startGame(m.getDeck());
          for(let w,i=0; i<rows; ++i){
            w=m.getRowWidth(i);
            for(let c,j=0; j<w; ++j){
              c= _G.model.getCardAt(i,j);
              c && _S.remove(c);
            }
          }
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.jiggleDC=(pile)=>{
          let x= int((_G.drawCard.x+_G.drawCard.width - pile.x)/2 - _G.drawCard.width/2);
          x+=pile.x;
          _G.drawCardPos[0]=x;
          _G.drawCard.g.x=x;
          _V.setX(_G.drawCard,x);
          self.futureX(()=> {_G.checkEnd=true}, 3);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHud=(s)=>{
          s= self.g.scoreText= _S.bmpText("Score: 0",{
            fontName:UI_FONT,
            fontSize:84*K
          });
          self.insert(_S.tint(s,C_TEXT));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.drawDrawer=()=>{
          let top= _G.pyramidBottom + _G.iconSize[1];
          let c0= _G.model.getDrawCard();
          let len=2,gap=10*K;
          let width= len * _G.iconSize[0] + (len-1)*gap;
          let left=_M.ndiv(Mojo.width-width,2);
          let pile= _S.spriteFrom("cardJoker.png",
                                  `${Mojo.u.stockPile}.png`);
          _V.set(_I.mkBtn(pile),left,top);
          _S.scaleXY(pile,K,K);
          pile.m5.press=()=>{
            if(_G.model.getDrawCard()) self.flipDrawCard();
            if(pile.visible && _G.model.isPileEmpty()){
              pile.visible=false;
              self.g.jiggleDC( _I.undoBtn(pile));
            }
          };
          pile.m5.showFrame(1);
          _G.stockPile= self.insert(pile);
          left += gap + _G.iconSize[0];
          _V.set(c0,left,top);
          _V.copy(c0.g,c0);
          c0.visible=true;
          c0.m5.showFrame(1);
          _G.drawCardPos=[left,top];
          _G.drawCard= self.insert(_I.makeDrag(c0));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.tweenAndShow=(cards)=>{
          function slide(i){
            let cs=cards[i];
            cs.forEach(c=>{
              let x=c.g.x;
              let y=c.g.y;
              let t=_T.slide(c, _T.BOUNCE_OUT, x, y);
              t.onComplete=()=>{ c.x=x; c.y=y; }
            });
            Mojo.sound("open.mp3").play();
            if(i+1<cards.length)
              _.delay(100, ()=> { slide(i+1) });
          }
          slide(0);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.drawArena=()=>{
          const rows= _G.model.getNumRows();
          const lastRow= _G.model.getRowWidth(rows-1);
          const sw=_G.iconSize[0];
          let offsetv= _G.iconSize[1]*0.3*K;
          let tweens=[];
          let gap=0;
          let maxWidth= lastRow*sw + (lastRow-1)*gap ;
          let left=_M.ndiv(Mojo.width-maxWidth,2);
          let top= _G.iconSize[1];
          let stackBottom= top;
          let offsetX=left+maxWidth;
          for(let pc,rc,width,rowWidth,i=0; i<rows; ++i){
            width=_G.model.getRowWidth(i);
            rowWidth= width*sw + (width-1)*gap;
            pc = _M.ndiv(maxWidth-rowWidth,2);
            rc=[];
            for(let c,e,j=0; j<width; ++j){
              c=_G.model.getCardAt(i,j);
              e=_G.model.isCardExposed(i,j);
              if(c){
                c.m5.showFrame(e?1:0);
                if(e)
                  _I.makeDrag(c);
                _V.set(c,left+pc,top);
                //save the position
                _V.set(c.g,c.x,c.y);
                c.x -= offsetX;
                rc.push(c);
                self.insert(c);
                stackBottom = c.y+c.height;
              }
              pc += _G.iconSize[0];
            }
            tweens.push(rc);
            top += (_G.iconSize[1] - offsetv);
          }
          _G.pyramidBottom= stackBottom;
          self.g.drawDrawer();
          self.g.tweenAndShow(tweens);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.initLevel();
        this.g.initHud();
        this.g.drawArena();
        Mojo.on(["flip.draw",this],"onFlipDraw",this);
        _Z.runScene("AudioIcon",{
          xScale:2*K, yScale:2*K,
          xOffset: -10*K, yOffset:0
        });
      },
      onFlipDraw(){
        this.flipDrawCard();
      },
      postUpdate(){
        if(!_G.gameOver) this.checkEnd();
      },
      checkEnd(){
        let snd="game_over.mp3",
          msg,K= Mojo.getScaleFactor();
        this.g.scoreText.text= `Score: ${_G.score}`;
        if(_G.model.isPeakEmpty()){
          msg="You Win!";
          snd="game_win.mp3";
        }else if(_G.checkEnd){
          if(_G.model.isGameStuck()){
            msg="You Lose!";
          }
        }
        if(msg){
          _G.gameOver=true;
          Mojo.sound(snd).play();
          _.delay(CLICK_DELAY,
            ()=> _Z.runScene("EndGame",
                             {msg,padding:40*K,fit:60*K,bg:C_BG,opacity:1}));
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles:["audioOn.png","audioOff.png",
                "open.mp3","error.mp3",
                "slide.mp3","pick.mp3",
                "click.mp3",
                "game_over.mp3","game_win.mp3",
                "bg.jpg","tiles.png","images/tiles.json"],
    //24x140, 10x190
    arena:{width:3360, height:1900},
    stockPile:"cardBack_red5",
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }

  }));

})(this);





