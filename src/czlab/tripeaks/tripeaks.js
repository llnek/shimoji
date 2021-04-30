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

    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    //load in others
    window["io/czlab/tripeaks/models"](Mojo);

    //background
    _Z.defScene("bg",{
      setup(){
        this.insert(_S.sizeXY(_S.sprite("bg.jpg"),
                              Mojo.width,Mojo.height)) } });

    //hud
    _Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        let s= this.score= _S.bitmapText("0",{
          fontName:"unscii",
          fontSize:96*K,
          fill:"white"
        });
        this.insert(s);
      },
      postUpdate(){
        this.score.text= `Score: ${_G.score}` } });

    //end menu
    _Z.defScene("end",{
      dispose(){
        this.btns.forEach(b => _I.undoButton(b)) },
      setup(options){
        let K=Mojo.getScaleFactor();
        let os={fontName:"unscii", fontSize: 32*K, fill:"white"};
        let s1=_S.bitmapText("Game Over", os);
        let s2=_S.bitmapText(options.msg, os);
        let s3=_S.bitmapText(" ",os);
        let s4=_I.makeButton(_S.bitmapText("Replay?",os));
        let s5=_S.bitmapText(" or ",os);
        let s6=_I.makeButton(_S.bitmapText("Quit",os));
        let g=_Z.layoutY([s1,s2,s3,s4,s5,s6],options);
        this.btns= [s4,s6];
        this.insert(g);
        s4.m5.press=()=>{
          _Z.removeScenes();
          _.delay(100,()=>{
            _Z.runScene("bg");
            _Z.runScene("level1");
            _Z.runScene("hud");
          })
        };
      }
    });

    //game scene
    _Z.defScene("level1",{
      _initLevel(peaks=3){
        let m= _G.model= new _G.TriPeak(this);
        _G.score=0;
        m.startGame(m.getDeck());
      },
      clsBoard(){
        const rows= _G.model.getNumRows();
        for(let w,i=0; i<rows; ++i){
          w=_G.model.getRowWidth(i);
          for(let c,j=0; j<w; ++j){
            c= _G.model.getCardAt(i,j);
            if(c)
              _S.remove(c)
          }
        }
        Mojo.mouse.reset();
      },
      drawBoard(){
        let rows= _G.model.getNumRows();
        let K=Mojo.getScaleFactor();
        let lastRow=rows-1;
        let bottom= _G.model.getRowWidth(lastRow);
        let sw=_G.iconSize[0];
        let offsetv= _G.iconSize[1]*0.3*K;
        let gap=0;
        let max_width= bottom*sw + (bottom-1)*gap ;
        let left=MFL((Mojo.width-max_width)/2);
        let top= _G.iconSize[1];
        let stackBottom= top;
        for(let i=0; i<rows; ++i){
          let width=_G.model.getRowWidth(i);
          let row_width= width*sw + (width-1)*gap;
          let pc = MFL((max_width-row_width)/2);
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
              this.insert(c);
              stackBottom = c.y+c.height;
            }
            pc += _G.iconSize[0];
          }
          top += (_G.iconSize[1] - offsetv) }
        _G.pyramidBottom= stackBottom;
      },
      flipDrawCard(){
        let c0,
            dc=_G.model.getDrawCard(),
            {width,height}=dc;
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
        _G.drawCard=c0;
        this.insert(c0);
      },
      _jiggleDC(pile){
        let x= MFL((_G.drawCard.x+_G.drawCard.width - pile.x)/2 - _G.drawCard.width/2);
        x+=pile.x;
        _G.drawCardPos[0]=x;
        _G.drawCard.g.x=x;
        _V.setX(_G.drawCard,x);
        this.future(()=> {_G.checkEnd=true},3);
      },
      drawDrawer(){
        let top= _G.pyramidBottom+ _G.iconSize[1];
        let c0= _G.model.getDrawCard();
        let K=Mojo.getScaleFactor();
        let gap=10*K;
        let len=2;
        let width= len * _G.iconSize[0] + (len-1)*gap;
        let left=MFL((Mojo.width-width)/2);
        let pile= _S.spriteFrom("cardJoker.png",
                                `${Mojo.u.stockPile}.png`);
        _V.set(pile,left,top);
        _S.scaleXY(pile,K,K);
        _I.makeButton(pile);
        pile.m5.showFrame(1);
        pile.m5.press=()=>{
          if(_G.model.getDrawCard())
            this.flipDrawCard();
          if(pile.visible &&
             _G.model.isPileEmpty()){
            pile.visible=false;
            _I.undoButton(pile);
            this._jiggleDC(pile);
          }
        };
        this.insert(_G.stockPile=pile);
        left += gap + _G.iconSize[0];
        _V.set(c0,left,top);
        c0.g.x=c0.x;
        c0.g.y=c0.y;
        c0.visible=true;
        c0.m5.showFrame(1);
        _I.makeDrag(c0);
        _G.drawCard=c0;
        _G.drawCardPos=[left,top];
        this.insert(c0);
      },
      setup(){
        this._initLevel();
        this.clsBoard();
        this.drawBoard();
        this.drawDrawer();
        Mojo.on(["flip.draw",this],"onFlipDraw",this);
      },
      onFlipDraw(){
        this.flipDrawCard();
      },
      postUpdate(){
        let K= Mojo.getScaleFactor();
        let msg;
        if(_G.model.isPeakEmpty()){
          msg="You Win!";
        }else if(_G.checkEnd){
          if(_G.model.isGameStuck()){
            msg="You Lose!";
          }
        }
        if(msg)
          _.delay(100,()=> _Z.runScene("end",
                                       {msg,padding:40*K,fit:60*K})); }
    });
  }

  const _$={
    assetFiles:["bg.jpg","tiles.png","images/tiles.json"],
    //24x140, 10x190
    arena:{width:3360, height:1900},
    stockPile:"cardBack_red5",
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





