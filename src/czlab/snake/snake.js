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
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_F,
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
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in dependencies
    window["io.czlab.snake.models"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          t,c1,c2, b, s, msg,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Snake", TITLE_FONT, 100*K);
            s.tint=C_TITLE;
            _V.set(s,Mojo.width/2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(msg,t){
            msg=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT, 36*K);
            t=_F.throb(msg,0.747,0.747);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              msg.tint=C_ORANGE;
              playClick();
              _.delay(CLICK_DELAY, ()=>_Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb)
            _V.set(msg,Mojo.width/2, Mojo.height * 0.7);
            return self.insert( _S.anchorXY(msg,0.5));
          }
        });
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let snd="game_over.mp3",
          os={fontName:UI_FONT,
              fontSize: 24*Mojo.getScaleFactor()},
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(options.msg||"You Lose!", os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=> _Z.runEx("PlayGame");
        s6.m5.press=()=> _Z.runEx("Splash");
        if(options.msg)snd="game_win.mp3";
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      _initGrid(){
        let g= _G.grid = _S.gridSQ(18,0.95);
        let t=g[0][0];
        _G.tileW=t.x2-t.x1;
        _G.tileH=t.y2-t.y1;
        _G.ROWS=g.length;
        _G.COLS=g[0].length;
        return g;
      },
      _drawGrid(){
        let K=Mojo.getScaleFactor(),
          b= _S.drawGridBox(_S.gridBBox(0,0,_G.grid),2*K,"#aad751");
        //let n= _S.drawGridLines(0,0,_G.grid,2,"#aad751");
        //n.alpha=0.1;
        //b.alpha=0.7;
        //this.insert(n);
        this.insert(b);
      },
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        doBackDrop(this);
        _G.timerid=-1;
        _G.score=0;
        _G.item=UNDEF;
        this._initGrid();
        this._drawGrid();
        this._makeSnake();
        this.grow();
        this._makeItem();
        this.g.score=_S.bmpText("0",UI_FONT,24*K);
        this.g.score.tint=C_ORANGE;
        self.insert(this.g.score);
        Mojo.on(["recalc",this],"recalc");
        _.delay(Mojo.u.frameDelay,()=>this.recalc());
      },
      grow(){
        _G.timerid=_.delay(Mojo.u.growthInterval,()=>{
          if(_G.growSnake(this)) this.grow()
        })
      },
      _makeItem(){
        _G.Item(this);
      },
      _makeSnake(){
        _G.Snake(this, _M.ndiv(_G.grid[0].length,2),
                       _M.ndiv(_G.grid.length,2));
      },
      recalc(){
        let c=_G.snakeDir;
        if(_I.keyDown(_I.RIGHT)){
          if(c != Mojo.LEFT)
            _G.snakeMoveRight(this);
        } else if(_I.keyDown(_I.LEFT)){
          if(c != Mojo.RIGHT)
            _G.snakeMoveLeft(this);
        } else if(_I.keyDown(_I.UP)){
          if(c != Mojo.DOWN)
            _G.snakeMoveUp(this);
        } else if(_I.keyDown(_I.DOWN)){
          if(c != Mojo.UP)
            _G.snakeMoveDown(this);
        } else if(c==Mojo.RIGHT){
          _G.snakeMoveRight(this);
        } else if(c==Mojo.LEFT){
          _G.snakeMoveLeft(this);
        } else if(c==Mojo.UP){
          _G.snakeMoveUp(this);
        } else if(c==Mojo.DOWN){
          _G.snakeMoveDown(this);
        }

        if(_G.snakeEatSelf()){
          Mojo.sound("eat.mp3").play();
          _G.snake[0].m5.dead=true;
        }else if(_G.snakeEatItem()){
          Mojo.sound("apple.mp3").play();
          _S.remove(_G.item);
          _G.item=UNDEF;
          ++_G.score;
          _.delay(Mojo.u.itemInterval,()=>{
            _G.Item(this)
          })
        }

        if(_G.snake[0].m5.dead){
          if(!_G.snakeBite)
            Mojo.sound("boing1.mp3").play();
          _.clear(_G.timerid);
          _G.timerid=-1;
          _.delay(343,()=> _Z.modal("EndGame"));
        }else{
          _.delay(Mojo.u.frameDelay,()=> this.recalc());
        }
      },
      postUpdate(dt){
        this.g.score.text=`Score: ${_G.score}`;
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5({

    assetFiles:["bg.jpg","head.png","snake.png","tail.png","apple_00.png",
                "boing1.mp3","apple.mp3","eat.mp3","click.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:640,height:480},
    scaleToWindow: "max",
    //bgColor: 0x51b2ee,
    //bgColor:0x239920,
    //bgColor:0x99CC46,
    //bgColor:0xAAD751,
    frameDelay:500,
    itemInterval:6000,
    growthInterval:3000,
    snakeLength:8,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }
  }));


})(this);


