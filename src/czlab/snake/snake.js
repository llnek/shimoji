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
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    const
      UI_FONT="Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Snake",
        titleSize: 56*Mojo.getScaleFactor(),
        action: {name:"PlayGame"},
        clickSnd:"click.mp3",
        playMsgSize:32*Mojo.getScaleFactor()
      };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in dependencies
    window["io.czlab.snake.models"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      _initGrid(){
        let out={};
        let g= _G.grid = _S.gridSQ(18,0.8,out);
        let t=g[0][0];
        _G.tileW=t.x2-t.x1;
        _G.tileH=t.y2-t.y1;
        _G.ROWS=g.length;
        _G.COLS=g[0].length;
        _G.arena=out;
        return g;
      },
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        doBackDrop(this);
        _G.timerid=-1;
        _G.score=0;
        _G.item=UNDEF;
        this._initGrid();
        _G.Snake(this, _M.ndiv(_G.grid[0].length,2), _M.ndiv(_G.grid.length,2));
        _G.Item(this);
        this.g.score=_S.bmpText("0",UI_FONT,24*K);
        this.g.score.tint=C_ORANGE;
        self.insert(this.g.score);
        if(1){
          let s= _S.bboxFrame(_G.arena,16*K);
          s.alpha=0.5;
          self.insert(s);
        }
        ///
        _Z.run("AudioIcon",{
          xScale:0.6*K, yScale:0.6*K,
          xOffset: -10*K, yOffset:0
        });
        ////
        _Z.run("HotKeys",{
          fontSize:32*K,
          radius:24*K,
          alpha:0.5,
          cb(obj){
            _V.set(obj.right,Mojo.width-obj.right.width,Mojo.height-obj.right.height);
            _S.pinLeft(obj.right,obj.left,obj.right.width/4);
            _V.set(obj.up,obj.up.width,Mojo.height-obj.up.height);
            _S.pinRight(obj.up,obj.down,obj.up.width/4);
            return obj;
          }
        });
        ////
        this.doMove();
        _G.growSnake(this);
      },
      doMove(){
        this.future(()=>{
          this.recalc();
        }, Mojo.u.frameDelay);
      },
      recalc(){

        if(_I.keyDown(_I.RIGHT)){
          (_G.snakeDir != Mojo.LEFT) && _G.snakeMoveRight(this)
        }else if(_I.keyDown(_I.LEFT)){
          (_G.snakeDir != Mojo.RIGHT) && _G.snakeMoveLeft(this)
        }else if(_I.keyDown(_I.UP)){
          (_G.snakeDir != Mojo.DOWN) && _G.snakeMoveUp(this)
        }else if(_I.keyDown(_I.DOWN)){
          (_G.snakeDir != Mojo.UP) && _G.snakeMoveDown(this)
        }else{
          _G[_G.snakeMove[_G.snakeDir]](this);
        }

        if(_G.snakeEatSelf()){
          Mojo.sound("eat.mp3").play();
          _G.snake[0].m5.dead=true;
        }else if(_G.snakeEatItem()){
          Mojo.sound("apple.mp3").play();
          _S.remove(_G.item);
          _G.item=UNDEF;
          ++_G.score;
          this.future(()=> _G.Item(this) ,Mojo.u.itemInterval);
        }

        if(_G.snake[0].m5.dead){
          if(!_G.snakeBite)
            Mojo.sound("boing1.mp3").play();
          _.clear(_G.timerid);
          _G.timerid=UNDEF;
          this.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{

            fontSize:32*Mojo.getScaleFactor(),
            replay:{name:"PlayGame"},
            quit:{name:"Splash", cfg:SplashCfg},
            msg:"You Lose!",
            winner:0

          }));
        }else{
          this.doMove();
        }
      },
      postUpdate(dt){
        this.g.score.text=`Score: ${_G.score}`;
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5({

    assetFiles:["bg.jpg","head.png","snake.png","tail.png","apple_00.png",
                "boing1.mp3","apple.mp3",
                "audioOn.png","audioOff.png",
                "eat.mp3","click.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:640,height:480},
    scaleToWindow: "max",
    scaleFit:"x",
    //bgColor: 0x51b2ee,
    //bgColor:0x239920,
    //bgColor:0x99CC46,
    //bgColor:0xAAD751,
    frameDelay:500,
    itemInterval:6000,
    growthInterval:5000,
    snakeLength:5,
    start(...args){ scenes(...args) }

  }));


})(this);


