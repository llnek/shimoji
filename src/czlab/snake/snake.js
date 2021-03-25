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

    window["io.czlab.snake.models"](Mojo);

    _Z.defScene("bg",{
      setup(){
      }
    });

    _Z.defScene("level1",{
      _initGrid(){
        let g= _G.grid = _S.gridSQ(30,0.95);
        let t=g[0][0];
        _G.tileW=t.x2-t.x1;
        _G.tileH=t.y2-t.y1;
        _G.ROWS=g.length;
        _G.COLS=g[0].length;
        return g;
      },
      _drawGrid(){
        let b= _S.drawGridBox(_S.gridBBox(0,0,_G.grid),2,"#fff");
        let n= _S.drawGridLines(0,0,_G.grid,2,"#fff");
        this.insert(n);
        this.insert(b);
      },
      setup(){
        _G.timerid=-1;
        _G.score=0;
        _G.item=null;
        this._initGrid();
        this._drawGrid();
        this._makeSnake();
        this.grow();
        this._makeItem();
        EventBus.sub(["recalc",this],"recalc");
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
        _G.Snake(this, MFL(_G.grid[0].length/2),
                       MFL(_G.grid.length/2));
      },
      recalc(){
        let c=_G.snakeDir;
        if(_I.keyDown(_I.keyRIGHT)){
          if(c !== Mojo.LEFT)
            _G.snakeMoveRight(this);
        } else if(_I.keyDown(_I.keyLEFT)){
          if(c !== Mojo.RIGHT)
            _G.snakeMoveLeft(this);
        } else if(_I.keyDown(_I.keyUP)){
          if(c !== Mojo.DOWN)
            _G.snakeMoveUp(this);
        } else if(_I.keyDown(_I.keyDOWN)){
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
          _G.snake[0].m5.dead=true;
        }else if(_G.snakeEatItem()){
          _S.remove(_G.item);
          _G.item=null;
          ++_G.score;
          _.delay(Mojo.u.itemInterval,()=>{
            _G.Item(this)
          })
        }

        if(_G.snake[0].m5.dead){
          _.clear(_G.timerid);
          _G.timerid=-1;
          Mojo.pause();
        }else{
          _.delay(Mojo.u.frameDelay,()=> this.recalc());
        }
      }
    });
  }

  const _$={
    assetFiles:["head.png","snake.png","apple.png"],
    arena: {width:640,height:480},
    scaleToWindow: "max",
    //bgColor: 0x51b2ee,
    bgColor:0x239920,
    frameDelay:500,
    itemInterval:6000,
    growthInterval:3000,
    snakeLength:8,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load", ()=> MojoH5(_$));

})(this);


