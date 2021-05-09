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

  /** @ignore */
  function scenes(Mojo){
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           FX:_T,
           Input:I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    _G.msgs=[null,null,null];
    _G.scores=[0,0,0];
    _G.X=1;
    _G.O=2;

    /** @ignore */
    _Z.defScene("bg",{
      setup(){
        this.insert(_S.drawBody((g)=>{
          g.lineStyle(4,0xffffff);
          g.beginFill(0);
          g.drawRect(0,0,Mojo.width-4,Mojo.height-4);
          g.moveTo(Mojo.width/2,0);
          g.lineTo(Mojo.width/2,Mojo.height);
          g.drawCircle(Mojo.width/2,Mojo.height/2,32);
          g.endFill();
        }));
      }
    });

    _Z.defScene("hud",{
      setup(){
        let args={fontSize:64,fill:"white"};
        let x=_S.bitmapText("0",args);
        let o=_S.bitmapText("0",args);
        let K=Mojo.getScaleFactor();
        _G.scores=[0,0,0];
        _G.msgs[_G.X]=x;
        _G.msgs[_G.O]=o;

        let w2=MFL(Mojo.width/2);
        let d=_S.rect(2,2,0,0,0,w2-1,0);

        _S.pinLeft(d,x,16)
        _S.pinRight(d,o,20);

        x.y=10*K;
        o.y=10*K;

        this.insert(x);
        this.insert(o);
      },
      postUpdate(){
        for(let i=1;i<_G.msgs.length;++i){
          _G.msgs[i].text=`${_G.scores[i]}`
        }
      }
    });

    _Z.defScene("level1", {
      _initPlayer(){
        let paddle = _G.player = _S.sprite("paddle.png");
        let K=Mojo.getScaleFactor();
        //paddle= 18x96
        paddle.m5.static=true;
        _S.scaleXY(paddle,K,K);
        paddle.m5.tick=(dt)=>{
          paddle.y = Mojo.mouse.y - paddle.height/2;
          _S.clamp(paddle, paddle.parent,false);
        };
        _S.pinLeft(this,paddle, -24*K);
        this.insert(paddle);
      },
      _initAI(){
        let paddle = _G.robot = _S.sprite("paddle.png");
        let K=Mojo.getScaleFactor();
        let self=this;
        paddle.m5.static=true;
        _S.scaleXY(paddle,K,K);
        paddle.m5.tick=(dt)=>{
          paddle.y = _G.ball.y - paddle.height/2;
          _S.clamp(paddle, paddle.parent,false);
        };
        _V.set(paddle,Mojo.width- 24*K,0);
        this.insert(paddle);
      },
      setup(){
        const ball= _G.ball = _S.sprite("ball.png");
        const bounce=_G.bounce= Mojo.sound("pop.mp3");
        const K=Mojo.getScaleFactor();
        const arena=Mojo.mockStage();
        const self=this;
        this._initPlayer();
        this._initAI();
        _S.scaleXY(ball,K,K);
        ball.m5.tick=function(dt){
          _S.move(ball);
          _S.clamp(ball, arena,
                      true,
                      (col)=>{
                        if(col.has(Mojo.RIGHT)) ++_G.scores[_G.X];
                        if(col.has(Mojo.LEFT)) ++_G.scores[_G.O];
                      });
          //ballHitsPaddle
          if(_S.collide(ball, _G.player)){
            bounce.play();
          }else if(_S.collide(ball, _G.robot)){
            bounce.play();
          }
        };
        this.insert(ball);
        _S.pinCenter(this,ball);
        _V.set(ball.m5.vel, 8*K, 5*K);
      }
    });
  }

  const _$={
    assetFiles: ["ball.png", "paddle.png", "pop.mp3"],
    arena: {width: 640, height: 480},
    scaleToWindow: "max",
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


