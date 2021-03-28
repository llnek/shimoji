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
           ute:_,is,EventBus}=Mojo;

    window["io/czlab/tripeaks/models"](Mojo);

    _Z.defScene("bg",{
      setup(){
        this.insert(_S.sizeXY(_S.sprite("bg.jpg"),Mojo.width,Mojo.height))
      }
    });

    _Z.defScene("level1",{
      _initLevel(peaks=3){
        let m= _G.model= new _G.TriPeak(this);
        m.startGame(m.getDeck());
      },
      clsBoard(){
        const numRows= _G.model.getNumRows();
        for(let w,i=0; i<numRows; ++i){
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
        let numRows= _G.model.getNumRows();
        let K=Mojo.getScaleFactor();
        let lastRow=numRows-1;
        let bottom= _G.model.getRowWidth(lastRow);
        let sw=_G.iconSize[0];
        let offsetv= _G.iconSize[1]*0.3*K;
        let gap=0;
        let max_width= bottom*sw + (bottom-1)*gap ;
        let left=MFL((Mojo.width-max_width)/2);
        let top= _G.iconSize[1];
        let stackBottom= top;
        for(let i=0; i<numRows; ++i){
          let width=_G.model.getRowWidth(i);
          let row_width= width*sw + (width-1)*gap;
          let pc = MFL((max_width-row_width)/2);
          for(let j=0; j<width; ++j){
            let c= _G.model.getCardAt(i,j);
            let e=_G.model.isCardExposed(i,j);
            if(c){
              c.m5.showFrame(e?1:0);
              if(e)
                _I.makeDrag(c);
              _S.setXY(c,left+pc,top);
              //save the position
              c.g.x=c.x;
              c.g.y=c.y;
              this.insert(c);
              stackBottom = c.y+c.height;
            }
            pc += _G.iconSize[0];
          }
          top += (_G.iconSize[1] - offsetv);
        }
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
        _S.setXY(c0,x,y);
        c0.g.x=x;
        c0.g.y=y;
        c0.width=width;
        c0.height=height;
        c0.m5.showFrame(1);
        this.insert(c0);
      },
      drawDrawer(){
        let top= _G.pyramidBottom+ _G.iconSize[1];
        let c0= _G.model.getDrawCard();
        let K=Mojo.getScaleFactor();
        let gap=10*K;
        let len=2;
        let width= len * _G.iconSize[0] + (len-1)*gap;
        let left=MFL((Mojo.width-width)/2);
        let pile=_S.sprite(`${Mojo.u.stockPile}.png`);
        _S.setXY(pile,left,top);
        _S.scaleXY(pile,K,K);
        _I.makeButton(pile);
        pile.m5.press=()=>{
          if(_G.model.getDrawCard())
            this.flipDrawCard()
        };
        this.insert(_G.stockPile=pile);
        left += gap + _G.iconSize[0];
        _S.setXY(c0,left,top);
        c0.g.x=c0.x;
        c0.g.y=c0.y;
        c0.visible=true;
        c0.m5.showFrame(1);
        _I.makeDrag(c0);
        _G.drawCardPos=[left,top];
        this.insert(c0);
      },
      setup(){
        this._initLevel();
        this.clsBoard();
        this.drawBoard();
        this.drawDrawer();
        EventBus.sub(["flip.draw",this],"onFlipDraw",this);
      },
      onFlipDraw(){
        this.flipDrawCard();
      },
      postUpdate(){
      }
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
    }

  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





