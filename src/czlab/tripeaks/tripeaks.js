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
           ute:_,is}=Mojo;

    const int=Math.floor;
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    function playClick(){
      Mojo.sound("click.mp3").play()
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in dependencies
    window["io/czlab/tripeaks/models"](Mojo);

    /**/
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.jpg"), Mojo.width,Mojo.height);
      scene.insert(_G.backDropSprite);
    }

    /**/
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        let t,c1,c2, b, s, msg, fz= K * 120,
            verb = Mojo.touchDevice ? "Tap": "Click";

        this.g.doTitle=(s)=>{
          s=_S.bitmapText("TriPeaks 13",
                          {fontName:TITLE_FONT, fontSize: 120*K});
          s.tint=C_TITLE;
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          self.insert(_S.centerAnchor(s));
        };

        this.g.doNext=(msg,b,t)=>{
          msg=_S.bitmapText(`${verb} to play!`,
                            {fontName:UI_FONT, fontSize:72*K});
          msg.tint=_S.color("#ffffff");
          b=_I.makeButton(msg);
          t=_T.throb(b);
          b.m5.press= ()=>{
            _T.remove(t);
            b.tint=_G.C_ORANGE;
            playClick();
            _.delay(CLICK_DELAY, ()=>_Z.replaceScene(self,"PlayGame"));
          }
          _V.set(b,Mojo.width/2, Mojo.height * 0.7);
          self.insert( _S.centerAnchor(b));
        };

        doBackDrop(this);
        this.g.doTitle();
        this.g.doNext();
      }
    });

    /**End menu */
    _Z.defScene("EndGame",{
      setup(options){
        let s1,s2,
            s4,s5,s6,os={fontName:UI_FONT,
                         fontSize: 72*Mojo.getScaleFactor()};
        let space=(s)=>{ s=_S.bmpText("I",os); s.alpha=0; return s; };
        s1=_S.bmpText("Game Over", os);
        s2=_S.bmpText(options.msg, os);
        s4=_I.makeButton(_S.bmpText("Play Again?",os));
        s5=_S.bmpText(" or ",os);
        s6=_I.makeButton(_S.bmpText("Quit",os));
        s4.m5.press=()=>{ _Z.runSceneEx("PlayGame") };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });



    /**/
    _Z.defScene("PlayGame",{
      flipDrawCard(){
        let dc=_G.model.getDrawCard();
        let c0, {width,height}=dc;
        _I.undoDrag(dc);
        _S.remove(dc);
        c0=_G.model.discardDraw();
        if(!c0){
          //game over
          return;
        }
        let [x,y]=_G.drawCardPos;
        _I.makeDrag(c0);
        c0.visible=true;
        _V.set(c0,x,y);
        c0.g.x=x;
        c0.g.y=y;
        c0.width=width;
        c0.height=height;
        c0.m5.showFrame(1);
        this.insert(_G.drawCard=c0);
        Mojo.sound("pick.mp3").play();
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
          self.future(()=> {_G.checkEnd=true}, 3);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHud=(s)=>{
          s= self.g.scoreText= _S.bitmapText("Score: 0",{
            fontName:UI_FONT,
            fontSize:84*K
          });
          self.insert(_S.tint(s,C_TEXT));
          ///////////////
          s=_S.spriteFrom("audioOn.png","audioOff.png");
          _S.scaleXY(_S.opacity(s,0.343),K*2,K*2);
          _V.set(s,Mojo.width-s.width-10*K,0);
          s.m5.showFrame(Mojo.Sound.sfx()?0:1);
          _I.mkBtn(s).m5.press=()=>{
            if(Mojo.Sound.sfx()){
              Mojo.Sound.mute();
              s.m5.showFrame(1);
            }else{
              Mojo.Sound.unmute();
              s.m5.showFrame(0);
            }
          };
          self.insert(s);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.drawDrawer=()=>{
          let top= _G.pyramidBottom + _G.iconSize[1];
          let c0= _G.model.getDrawCard();
          let len=2,gap=10*K;
          let width= len * _G.iconSize[0] + (len-1)*gap;
          let left=int((Mojo.width-width)/2);
          let pile= _S.spriteFrom("cardJoker.png",
                                  `${Mojo.u.stockPile}.png`);
          _V.set(pile,left,top);
          _I.mkBtn(_S.scaleXY(pile,K,K)).m5.press=()=>{
            if(_G.model.getDrawCard()) self.flipDrawCard();
            if(pile.visible && _G.model.isPileEmpty()){
              pile.visible=false;
              self.g.jiggleDC( _I.undoBtn(pile));
            }
          };
          pile.m5.showFrame(1);
          self.insert(_G.stockPile=pile);
          left += gap + _G.iconSize[0];
          _V.set(c0,left,top);
          c0.g.x=c0.x;
          c0.g.y=c0.y;
          c0.visible=true;
          c0.m5.showFrame(1);
          _G.drawCardPos=[left,top];
          self.insert(_I.makeDrag(_G.drawCard=c0));
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
          let left=int((Mojo.width-maxWidth)/2);
          let top= _G.iconSize[1];
          let stackBottom= top;
          let offsetX=left+maxWidth;
          for(let pc,rc,width,rowWidth,i=0; i<rows; ++i){
            width=_G.model.getRowWidth(i);
            rowWidth= width*sw + (width-1)*gap;
            pc = int((maxWidth-rowWidth)/2);
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
                c.g.x=c.x;
                c.g.y=c.y;
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
      },
      onFlipDraw(){
        this.flipDrawCard();
      },
      postUpdate(){
        if(!_G.gameOver) this.checkEnd();
      },
      checkEnd(){
        let msg,
            snd="game_over.mp3",
            K= Mojo.getScaleFactor();
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
          _.delay(CLICK_DELAY,()=> { _Z.runScene("EndGame", {msg,padding:40*K,fit:60*K,bg:C_BG,opacity:1});
          });
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles:["audioOn.png","audioOff.png",
                "open.mp3","error.mp3",
                "slide.mp3","pick.mp3", "click.mp3", "game_over.mp3","game_win.mp3",
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
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





