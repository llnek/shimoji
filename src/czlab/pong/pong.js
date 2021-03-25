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
           FX:_T,
           Input:I,
           Game:_G,
           "2d":_2d,
           ute:_,is,EventBus}=Mojo;
    let paddleWobble;

    _Z.defScene("bg",{
      setup(){
        let s= _S.drawBody((g)=>{
          g.lineStyle(4,0xffffff);
          g.beginFill(0);
          g.drawRect(0,0,Mojo.width-4,Mojo.height-4);
          g.moveTo(0,Mojo.height/2);
          g.lineTo(Mojo.width,Mojo.height/2);
          //g.drawEllipse(Mojo.canvas.width/2,Mojo.canvas.height/2,100,50);
          g.drawCircle(Mojo.width/2,Mojo.height/2,32);
          g.endFill();
        });
        this.insert(s);
      }
    });

    _Z.defScene("level1", {
      _initPlayer(){
        let paddle = _G.player = _S.sprite("paddle.png");
        let K=Mojo.getScaleFactor();
        //paddle= 96x18
        paddle.m5.static=true;
        _S.scaleXY(paddle,K,K);
        paddle.m5.tick=(dt)=>{
          paddle.x = Mojo.mouse.x - paddle.width/2;
          _2d.contain(paddle, paddle.parent,false);
        };
        _S.pinBottom(this,paddle, -24*K);
        this.insert(paddle);
      },
      _initAI(){
        let paddle = _G.robot = _S.sprite("paddle.png");
        let K=Mojo.getScaleFactor();
        let self=this;
        paddle.m5.static=true;
        _S.scaleXY(paddle,K,K);
        paddle.m5.tick=(dt)=>{
          paddle.x = _G.ball.x - paddle.width/2;
          _2d.contain(paddle, paddle.parent,false);
        };
        _S.setXY(paddle,0,6*K);
        this.insert(paddle);
      },
      setup(){
        const bounce=_G.bounce= Mojo.sound("bounce.wav");
        const ball= _G.ball = _S.sprite("ball.png");
        const K=Mojo.getScaleFactor();
        const arena=Mojo.mockStage();
        const self=this;
        this._initPlayer();
        this._initAI();
        _S.scaleXY(ball,K,K);
        ball.m5.tick=function(dt){
          _S.move(ball);
          _2d.contain(ball, arena,
                      true,
                      (col)=>{
                        //bounce.play();
                        if(col.has(Mojo.BOTTOM)) --_G.score; });
          //ballHitsPaddle
          if(_2d.collide(ball, _G.player)){
            bounce.play();
            /*
            if(_G.playerWobble){
              _G.player.scale.set(1,1);
              _T.remove(_G.playerWobble);
            };
            _G.playerWobble = _T.wobble(_G.player, 1.3, 1.2, 5, 10, 10, -10, -10, 0.96);
            */
          }else if(_2d.collide(ball, _G.robot)){
            bounce.play();
            /*
            if(_G.robotWobble){
              _G.robot.scale.set(1,1);
              _T.remove(_G.robotWobble);
            };
            _G.robotWobble = _T.wobble(_G.robot, 1.3, 1.2, 5, 10, 10, -10, -10, 0.96);
            */
          }
          //message.mojoh5.content(`Score: ${_G.score}`);
        };
        this.insert(ball);
        _S.pinBottom(this,ball, -128*K);
        _S.velXY(ball, 8*K, 5*K);
      }
    });
  }

  const _$={
    assetFiles: ["ball.png", "puzzler.otf", "paddle.png", "bounce.wav"],
    arena: {width: 512, height: 512},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


