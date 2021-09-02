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
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_F,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;
    function playClick(){
      Mojo.sound("click.mp3").play()
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.jpg"),Mojo.width,Mojo.height);
      scene.insert(_G.backDropSprite);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in dependencies
    window["io.czlab.snake.models"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        let t,c1,c2, b, s, msg,
            verb = Mojo.touchDevice ? "Tap": "Click";

        this.g.doTitle=(s)=>{
          s=_S.bmpText("Snake", {fontName:TITLE_FONT, fontSize: 100*K});
          s.tint=C_TITLE;
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          self.insert(_S.centerAnchor(s));
        };

        this.g.doNext=(msg,b,t)=>{
          msg=_S.bmpText(`${verb} to play!`, {fontName:UI_FONT, fontSize:36*K});
          b=_I.mkBtn(msg);
          t=_F.throb(b,0.99);
          b.m5.press= ()=>{
            _F.remove(t);
            b.tint=C_ORANGE;
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
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("EndGame",{
      setup(options){
        let s1,s2,
            snd="game_over.mp3",
            s4,s5,s6,os={fontName:UI_FONT,
                         fontSize: 24*Mojo.getScaleFactor()};
        function space(s){ return _S.opacity(_S.bmpText("I",os),0) }
        s1=_S.bmpText("Game Over", os);
        s2=_S.bmpText(options.msg||"You Lose!", os);
        s4=_I.makeButton(_S.bmpText("Play Again?",os));
        s5=_S.bmpText(" or ",os);
        s6=_I.makeButton(_S.bmpText("Quit",os));
        s4.m5.press=()=>{ _Z.runSceneEx("PlayGame") };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
        if(options.msg)snd="game_win.mp3";
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      _initGrid(){
        let g= _G.grid = _S.gridSQ(18,0.95);
        let t=g[0][0];
        _G.tileW=t.x2-t.x1;
        _G.tileH=t.y2-t.y1;
        _G.ROWS=g.length;
        _G.COLS=g[0].length;
        return g;
      },
      _drawGrid(){//bgColor:0xAAD751,
        let K=Mojo.getScaleFactor(),
            b= _S.drawGridBox(_S.gridBBox(0,0,_G.grid),2*K,"#aad751");
        //let n= _S.drawGridLines(0,0,_G.grid,2,"#aad751");
        //n.alpha=0.1;
        //b.alpha=0.7;
        //this.insert(n);
        this.insert(b);
      },
      setup(){
        doBackDrop(this);
        _G.timerid=-1;
        _G.score=0;
        _G.item=null;
        this._initGrid();
        this._drawGrid();
        this._makeSnake();
        this.grow();
        this._makeItem();
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
        _G.Snake(this, int(_G.grid[0].length/2),
                       int(_G.grid.length/2));
      },
      recalc(){
        let c=_G.snakeDir;
        if(_I.keyDown(_I.RIGHT)){
          if(c !== Mojo.LEFT)
            _G.snakeMoveRight(this);
        } else if(_I.keyDown(_I.LEFT)){
          if(c !== Mojo.RIGHT)
            _G.snakeMoveLeft(this);
        } else if(_I.keyDown(_I.UP)){
          if(c !== Mojo.DOWN)
            _G.snakeMoveUp(this);
        } else if(_I.keyDown(_I.DOWN)){
          if(c !== Mojo.UP)
            _G.snakeMoveDown(this);
        } else if(c===Mojo.RIGHT){
          _G.snakeMoveRight(this);
        } else if(c===Mojo.LEFT){
          _G.snakeMoveLeft(this);
        } else if(c===Mojo.UP){
          _G.snakeMoveUp(this);
        } else if(c===Mojo.DOWN){
          _G.snakeMoveDown(this);
        }

        if(_G.snakeEatSelf()){
          Mojo.sound("eat.mp3").play();
          _G.snake[0].m5.dead=true;
        }else if(_G.snakeEatItem()){
          Mojo.sound("apple.mp3").play();
          _S.remove(_G.item);
          _G.item=null;
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
          _.delay(343,()=>{
            _I.resetAll();
            _Z.runScene("EndGame");
          });
        }else{
          _.delay(Mojo.u.frameDelay,()=> this.recalc());
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
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
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5(_$));

})(this);


