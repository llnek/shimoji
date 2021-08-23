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

  /**/
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor;
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in others
    window["io/czlab/tripeaks/models"](Mojo);

    /**/
    _Z.defScene("Splash",{
      setup(){
        let fn="Big Shout Bob",
            K=Mojo.getScaleFactor(),
            c1,c2, b, s, msg, fz= K * 120,
            verb = Mojo.touchDevice ? "Tap": "Click";
        ////////////
        this.insert(_S.sizeXY(_S.sprite("bg.jpg"),
                              Mojo.width,Mojo.height));
        s=_S.bitmapText("TriPeaks 13",
                        {fontName:fn, fontSize:fz, align:"center"});
        s.tint=C_TITLE;
        s.x=Mojo.width/2;
        s.y=Mojo.height*0.3;
        this.insert( _S.centerAnchor(s));
        ///////////
        msg=_S.bitmapText(`${verb} to play!`,
                          {fontName:"NineteenOhFive",
                           align:"center", fontSize:64*K});
        msg.tint=_S.color("#ffffff");
        //in pixi, no fontSize, defaults to 26, left-align
        b=_I.makeButton(msg);
        b.m5.press= ()=> _Z.replaceScene(this,"PlayGame");
        b.x=Mojo.width/2;
        b.y=Mojo.height * 0.7;
        this.insert( _S.centerAnchor(b));
        //////////////
        /*
        let suits=["Spades","Diamonds","Hearts","Clubs"];
        let pos=[[0.1,0.3],[0.1,0.7],[0.5,0.5],[0.8,0.3],[0.8,0.7]];
        for(let n,r,i=0; i<pos.length; ++i){
          r=_.randInt2(1,4)-1;
          n=_.randSign()>0?10:3;
          c1=_S.centerAnchor(_S.sprite(`card${suits[r]}${n}.png`));
          r=_.randInt2(1,4)-1;
          n=n>3?3:10;
          c2=_S.centerAnchor(_S.sprite(`card${suits[r]}${n}.png`));
          _S.scaleBy(c1, 0.5,0.5);
          _S.scaleBy(c2, 0.5,0.5);
          c1.x=Mojo.width * pos[i][0];
          c1.y=Mojo.height * pos[i][1];
          _S.pinRight(c1,c2);
          c1.angle=_.randSign() * _.randInt(360);
          c2.angle=_.randSign() * _.randInt(360);
          this.insert(c1);
          this.insert(c2);
        }
        */
      }
    });

    //end menu
    _Z.defScene("EndGame",{
      setup(options){
        let K=Mojo.getScaleFactor();
        let os={fontName:"NineteenOhFive", fontSize: 72*K};
        let s1=_S.bitmapText("Game Over", os);
        let s2=_S.bitmapText(options.msg||"poo", os);
        let space=()=>{ let s=_S.bitmapText("I",os); s.alpha=0; return s; };
        let s4=_I.makeButton(_S.bitmapText("Play Again?",os));
        let s5=_S.bitmapText(" or ",os);
        let s6=_I.makeButton(_S.bitmapText("Quit",os));
        let m=_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options);
        this.insert(m);
        s4.m5.press=()=>{ _Z.runSceneEx("PlayGame") };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
      }
    });

    /**/
    function initLevel(scene,peaks=3){
      const m= _G.model= new _G.TriPeak(scene);
      _G.score=0;
      _G.gameOver=false;
      m.startGame(m.getDeck());
    }

    /**/
    function clrArena(scene){
      const rows= _G.model.getNumRows();
      for(let w,i=0; i<rows; ++i){
        w=_G.model.getRowWidth(i);
        for(let c,j=0; j<w; ++j){
          c= _G.model.getCardAt(i,j);
          c && _S.remove(c);
        }
      }
      _I.reset();
      Mojo.mouse.reset();
    }

    /**/
    function drawBoard(scene){
      let rows= _G.model.getNumRows();
      let K=Mojo.getScaleFactor();
      let lastRow=rows-1;
      let bottom= _G.model.getRowWidth(lastRow);
      let sw=_G.iconSize[0];
      let offsetv= _G.iconSize[1]*0.3*K;
      let gap=0;
      let max_width= bottom*sw + (bottom-1)*gap ;
      let left=int((Mojo.width-max_width)/2);
      let top= _G.iconSize[1];
      let stackBottom= top;
      for(let i=0; i<rows; ++i){
        let width=_G.model.getRowWidth(i);
        let row_width= width*sw + (width-1)*gap;
        let pc = int((max_width-row_width)/2);
        for(let j=0; j<width; ++j){
          let c=_G.model.getCardAt(i,j);
          let e=_G.model.isCardExposed(i,j);
          if(c){
            c.m5.showFrame(e?1:0);
            if(e)
              _I.makeDrag(c);
            _V.set(c,left+pc,top);
            //save the position
            c.g.x=c.x;
            c.g.y=c.y;
            scene.insert(c);
            stackBottom = c.y+c.height;
          }
          pc += _G.iconSize[0];
        }
        top += (_G.iconSize[1] - offsetv)
      }
      _G.pyramidBottom= stackBottom;
    }

    /**/
    function jiggleDC(scene,pile){
      let x= int((_G.drawCard.x+_G.drawCard.width - pile.x)/2 - _G.drawCard.width/2);
      x+=pile.x;
      _G.drawCardPos[0]=x;
      _G.drawCard.g.x=x;
      _V.setX(_G.drawCard,x);
      scene.future(()=> {_G.checkEnd=true},3);
    }

    /**/
    function drawDrawer(scene){
      let top= _G.pyramidBottom+ _G.iconSize[1];
      let c0= _G.model.getDrawCard();
      let K=Mojo.getScaleFactor();
      let gap=10*K;
      let len=2;
      let width= len * _G.iconSize[0] + (len-1)*gap;
      let left=int((Mojo.width-width)/2);
      let pile= _S.spriteFrom("cardJoker.png",
                              `${Mojo.u.stockPile}.png`);
      _V.set(pile,left,top);
      _S.scaleXY(pile,K,K);
      _I.makeButton(pile);
      pile.m5.showFrame(1);
      pile.m5.press=()=>{
        if(_G.model.getDrawCard()) scene.flipDrawCard();
        if(pile.visible && _G.model.isPileEmpty()){
          pile.visible=false;
          _I.undoButton(pile);
          jiggleDC(scene,pile);
        }
      };
      scene.insert(_G.stockPile=pile);
      left += gap + _G.iconSize[0];
      _V.set(c0,left,top);
      c0.g.x=c0.x;
      c0.g.y=c0.y;
      c0.visible=true;
      c0.m5.showFrame(1);
      _I.makeDrag(c0);
      _G.drawCard=c0;
      _G.drawCardPos=[left,top];
      scene.insert(c0);
    }

    /**/
    function initHud(scene){
      let K=Mojo.getScaleFactor();
      let s= scene.g.scoreText= _S.bitmapText("Score: 0",{
        fontName:"unscii",
        fontSize:84*K
      });
      s.tint=C_TEXT;
      scene.insert(s);
    }

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
        Mojo.sound("pick.ogg").play();
      },
      setup(){
        this.insert(_S.sizeXY(_S.sprite("bg.jpg"),
                              Mojo.width,Mojo.height));
        initLevel(this);
        clrArena(this);
        drawBoard(this);
        drawDrawer(this);
        initHud(this);
        Mojo.sound("open.ogg").play();
        Mojo.on(["flip.draw",this],"onFlipDraw",this);
      },
      onFlipDraw(){
        this.flipDrawCard();
      },
      postUpdate(){
        if(!_G.gameOver) this.checkEnd();
      },
      checkEnd(){
        let msg,K= Mojo.getScaleFactor();
        this.g.scoreText.text= `Score: ${_G.score}`;
        if(_G.model.isPeakEmpty()){
          msg="You Win!";
        }else if(_G.checkEnd){
          if(_G.model.isGameStuck()){
            msg="You Lose!";
          }
        }
        if(msg){
          Mojo.mouse.reset();
          _G.gameOver=true;
          _.delay(100,()=> {
            _Z.runScene("EndGame", {msg,padding:40*K,fit:60*K,bg:C_BG,opacity:1});
          });
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles:["open.ogg","error.ogg","slide.ogg","pick.ogg","bg.jpg","tiles.png","images/tiles.json"],
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





