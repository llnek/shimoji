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
           FX:_T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const C_TITLE=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const CLICK_DELAY=343;
    const MAX_SCORE=2;


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
    _.inject(_G,{
      msgs:[null,null,null],
      scores:[0,0,0],
      X:1,
      O:2
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              verb= Mojo.touchDevice ? "Tap" : "Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Pong",{fontName:TITLE_FONT, fontSize:96*K});
          _S.tint(s,C_TITLE);
          _V.set(s,Mojo.width/2,Mojo.height *0.3);
          self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,b,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT, fontSize:32*K});
          b=_I.mkBtn(s);
          t=_T.throb(b,0.99);
          b.m5.press=(btn)=>{
            _S.tint(btn, C_ORANGE);
            _T.remove(t);
            playClick();
            _.delay(CLICK_DELAY, ()=> {
              _Z.runSceneEx("PlayGame");
            });
          };
          _V.set(s,Mojo.width/2,Mojo.height * 0.7);
          self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
                         fontSize: 32*Mojo.getScaleFactor()};
        let space=(s)=>{ s=_S.bmpText("I",os); s.alpha=0; return s; };
        s1=_S.bmpText("Game Over", os);
        s2=_S.bmpText(options.msg||"You Lose!",os);
        s4=_I.makeButton(_S.bmpText("Play Again?",os));
        s5=_S.bmpText(" or ",os);
        s6=_I.makeButton(_S.bmpText("Quit",os));
        s4.m5.press=()=>{
          _Z.runSceneEx("PlayGame");
        };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
        if(options.msg)snd="game_win.mp3";
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });



    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame", {
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
        const self=this,
              K=Mojo.getScaleFactor();
        const ball= _G.ball = _S.sprite("ball.png");
        const bounce=_G.bounce= Mojo.sound("pop.mp3");
        const arena=Mojo.mockStage();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHud=()=>{
          let cfg={fontName:UI_FONT,fontSize:36*K};
          let x=_S.bmpText("00",cfg);
          let o=_S.bmpText("00",cfg);

          _G.scores=[0,0,0];
          _G.msgs[_G.X]=x;
          _G.msgs[_G.O]=o;

          let w2=int(Mojo.width/2);
          let d=_S.rect(2,2,0,0,0,w2-1,0);

          _S.pinLeft(d,x,16)
          _S.pinRight(d,o,20);

          x.y=10*K;
          o.y=10*K;

          this.insert(x);
          this.insert(o);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initBg=()=>{
          self.insert(_S.drawBody(g=>{
            g.lineStyle(4*K,0xffffff);
            g.beginFill(0);
            g.drawRect(0,0,Mojo.width-4*K,Mojo.height-4*K);
            g.moveTo(Mojo.width/2,0);
            g.lineTo(Mojo.width/2,Mojo.height);
            g.drawCircle(Mojo.width/2,Mojo.height/2,32*K);
            g.endFill();
          }));
        };
        this.g.initBg();


        this._initPlayer();
        this._initAI();
        _S.scaleXY(ball,K,K);

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
              _.delay(343,()=>{
                _I.resetAll();
                _Z.runScene("EndGame");
              });
            }else{
              _.delay(1000,()=>{
                _V.set(ball.m5.vel, _.randSign()*8*K, _.randSign()*5*K);
              });
            }
          }
        };

        ball.m5.tick=function(dt){
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

        this.g.initHud();
      },
      postUpdate(){
        for(let i=1;i<_G.msgs.length;++i){
          _G.msgs[i].text= _.prettyNumber(_G.scores[i])
        }
      }

    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bg.jpg","ball.png", "paddle.png",
                 "click.mp3","game_over.mp3","game_win.mp3","pop.mp3"],
    arena: {width: 640, height: 480},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


