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
           FX:_T,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"PONG",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const MAX_SCORE=2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      msgs: _.fill(3,UNDEF),
      scores: _.fill(3,0),
      X:1,
      O:2
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
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
        let r,self=this;
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
        const self=this,
          K=Mojo.getScaleFactor(),
          ball= _G.ball = _S.sprite("ball.png"),
          bounce=_G.bounce= Mojo.sound("pop.mp3"),
          arena=Mojo.mockStage();
        _.inject(this.g,{
          initBg(){
            self.insert(_S.drawBody(g=>{
              g.lineStyle(4*K,0xffffff);
              g.beginFill(0);
              g.drawRect(0,0,Mojo.width-4*K,Mojo.height-4*K);
              g.moveTo(Mojo.width/2,0);
              g.lineTo(Mojo.width/2,Mojo.height);
              //g.drawCircle(Mojo.width/2,Mojo.height/2,32*K);
              g.endFill();
            }));
          }
        });
        this.g.initBg();
        this._initPlayer();
        this._initAI();
        _S.scaleXY(ball,K,K);
        _S.anchorXY(ball,0.5);
        let onHit=(col)=>{
          let n=0,b;
          if(col.has(Mojo.RIGHT)){
            n = ++_G.scores[_G.X];
            b=true;
          }
          if(col.has(Mojo.LEFT)){
            n= ++_G.scores[_G.O];
            b=true;
          }
          if(b){
            _S.pinCenter(this,ball);
            _V.set(ball.m5.vel, 0,0);
            if(n>MAX_SCORE){
              _.delay(343,()=> _Z.modal("EndGame",{

                fontSize:64*Mojo.getScaleFactor(),
                replay:{name:"PlayGame"},
                quit:{name:"Splash", cfg:SplashCfg},
                msg:"",
                winner:0

              }));
            }else{
              _V.set(ball.m5.vel, _.randSign()*12*K, _.randSign()*8*K);
              _G.cntDown();
            }
          }
        };
        ball.m5.tick=function(dt){
          if(_G.pauseForCDown){return}
          _S.move(ball);
          _S.clamp(ball, arena, true, onHit);
          //ballHitsPaddle
          if(_S.collide(ball, _G.player)){
            bounce.play();
          }else if(_S.collide(ball, _G.robot)){
            bounce.play();
          }
        };
        this.insert(ball);
        _S.pinCenter(this,ball);
        _V.set(ball.m5.vel, _.randSign()*8*K, _.randSign()*5*K);
        //////
        _Z.run("HUD");
      },
      postUpdate(){
        for(let i=1;i<_G.msgs.length;++i){
          _G.msgs[i].text= `${_G.scores[i]}`;
          //_.prettyNumber(_G.scores[i])
        }
      }

    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT,fontSize:36*K},
          x=_S.bmpText("0",cfg),
          o=_S.bmpText("0",cfg),
          d=_S.rect(2,2,0,0,0),
          w2=_M.ndiv(Mojo.width,2);
        _G.scores=[0,0,0];
        _G.msgs[_G.X]=x;
        _G.msgs[_G.O]=o;
        _V.set(d,w2-1,0);
        _S.pinLeft(d,x,16)
        _S.pinRight(d,o,20);
        x.y=10*K;
        o.y=10*K;
        this.insert(x);
        this.insert(o);

        let ctext=_S.bmpText("0",UI_FONT,64*K);
        ctext.tint=_S.SomeColors.orange;
        _S.hide(ctext);
        _S.anchorXY(ctext,0.5);
        _V.set(ctext,Mojo.width/2,Mojo.height/2);
        this.insert(ctext);
        _G.cntDown=()=>{
          _G.pauseForCDown=true;
          _S.hide(_G.ball);
          ctext.text="1";
          _S.show(ctext);
          _.delay(1000,()=> {
            ctext.text="2";
            playClick();
          });
          _.delay(2000,()=>{
            ctext.text="3";
            playClick();
          });
          _.delay(3000,()=>{
            ctext.text="GO!";
            playClick();
          });
          _.delay(3500,()=>{
            _S.hide(ctext);
            _S.show(_G.ball);
            _G.pauseForCDown=false;
          });
        };
        _G.cntDown();
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["bg.jpg","ball.png", "paddle.png",
                 "click.mp3","game_over.mp3","game_win.mp3","pop.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow: "max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);


