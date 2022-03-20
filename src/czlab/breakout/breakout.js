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
  const int=Math.floor;
  const E_PADDLE=1;
  const E_BLOCK=2;
  const E_BALL=4;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const COLORS = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
    const x=null,g="green",o="orange",b="blue",r="red",v="violet";
    const ROWS=20;
    const COLS=14;//20
    const _ASSETS={
      xxxlevel1: [ [0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0],
                [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
                [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
                [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0]
              ],
      level1: [ [0,1,1,1,1,0,0,0,0,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
                [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,0]
              ]

    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#e4ea1c"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b"),
      C_BG=_S.color("#1e1e1e");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=>Mojo.sound("click.mp3").play() ;
    const bounce=Mojo.sound("coin.mp3");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      //gridCols:9,
      //gridRows:20//16
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          W2=Mojo.width/2,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("BreakOut",TITLE_FONT,120*K);
            _S.tint(s,C_TITLE);
            _V.set(s,W2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,64*K);
            t=_F.throb(s,0.747,0.747);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=> _Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb);
            _V.set(s,W2,Mojo.height*0.8);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let K=Mojo.getScaleFactor(),
          msg="You Lose!",
          snd="game_over.mp3",
          cfg={fontName:UI_FONT, fontSize:64*K};
        if(_G.blockCount==0){
          msg= "You win !";
          snd="game_win.mp3";
        }
        let space=()=> _S.opacity(_S.bmpText("I",cfg),0),
          b1=_I.mkBtn(_S.bmpText("Play Again?", cfg)),
          b2=_I.mkBtn(_S.bmpText("Quit", cfg)),
          m1=_S.bmpText("Game Over", cfg),
          m2=_S.bmpText(msg, cfg),
          gap=_S.bmpText("or", cfg);
        b1.m5.press=()=> playClick() && _Z.runEx("PlayGame");
        b2.m5.press=()=> playClick() && _Z.runEx("Splash");
        Mojo.sound(snd).play();
        this.insert( _Z.layoutY([m1, m2, space(), space(), b1, gap, b2]));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      doCntDown(){
        this.g.cntDownMsg.text="1";
        _G.cntDownOn=true;
        _S.hide(_G.ball);
        _S.show(this.g.cntDownMsg);
        _.delay(1000,()=>{
          this.g.cntDownMsg.text="2";
          _.delay(1000,()=>{
            this.g.cntDownMsg.text="3";
            _.delay(1000,()=>{
              this.g.cntDownMsg.text="Go!";
              _.delay(1000,()=>{
                _S.hide(this.g.cntDownMsg);
                _S.show(_G.ball);
                _G.cntDownOn=false;
              });
            })
          })
        });
      },
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          init(n){
            let f,b,r,h,out={},
                grid= _S.gridXY([COLS,ROWS],0.8,0.8,out);
            h=grid[0][0].y2-grid[0][0].y1;
            r=_S.rect(out.width,out.height,C_BG,C_BG);
            self.insert( _V.copy(r,out));
            _.inject(_G,{
              grid,
              box:r,
              score:0,
              arena:out,
              blockCount:0 });
            this.initLevel(n);
            f=self.insert(_S.bboxFrame(out));
            b=_2d.healthBar({
              width:out.width/3,
              height:h/2,
              borderWidth:2,
              scale:K,
              lives:3,
              line: "white",
              fill: _S.BtnColors.green
            });
            _S.pinAbove(f,b.sprite,2*K,1);
            self.insert(b.sprite);
            _G.health=b;
            return this;
          },
          initLevel(level){
            let offsetY=-1,
              data=_ASSETS[`level${level}`];
            for(let g,r,y=0;y<data.length;++y){
              g=_G.grid[y];
              r=data[y];
              _.assert(r.length==COLS,"bad level width");
              for(let s,p,x=0;x<r.length;++x){
                if(!r[x]){continue}
                p=g[x];
                s=_S.sprite(_.randItem(COLORS));
                s.m5.type=E_BLOCK;
                s.m5.static=true;
                s.height=int(p.y2-p.y1);
                s.width=int(p.x2-p.x1);
                if(offsetY<0)
                  offsetY=s.height*2;
                s.x=p.x1;
                s.y=p.y1+offsetY;
                ++_G.blockCount;
                self.insert(s,true);
              }
            }
            let ball=_S.sprite("ball.png",true);
            ball.m5.cmask=E_BLOCK|E_PADDLE;
            ball.m5.type=E_BALL;
            _S.scaleXY(ball,K,K);
            _S.pinCenter(_G.box,ball);
            _V.set(ball.m5.vel, 320*K, 320*K);
            ball.m5.tick=(dt)=>{
              _G.cntDownOn?0: _S.move(ball,dt)
            };
            self.insert(ball,true);
            let bw=ball.width;
            let paddle=_S.sprite("paddle.png");
            paddle.m5.static=true;
            _S.anchorXY(paddle,0.5);
            paddle.m5.type=E_PADDLE;
            _S.scaleXY(paddle,K,K);
            paddle.width=5*bw;
            _V.set(paddle,_G.arena.x1+_M.ndiv(_G.arena.width,2),
                          _G.arena.y2 - 1.5*paddle.height);
            let pY=paddle.y;
            paddle.m5.speed=10;
            paddle.m5.tick=()=>{
              if(1){
                paddle.x = Mojo.mouse.x;
              }else{
                _S.move(paddle);
              }
              _S.clamp(paddle, _G.arena,false);
              paddle.y = pY;
            };
            self.insert(paddle,true);
            ////
            _.inject(_G,{
              ball,paddle
            });
          },
          ctrl(){
            const s=_G.paddle;
            const goLeft = _I.keybd(_I.LEFT,
            ()=>{ _V.set(s.m5.vel,-s.m5.speed,0) },
            ()=>{ !goRight.isDown && _V.setX(s.m5.vel,0) });
            const goRight =_I.keybd(_I.RIGHT,
            ()=>{ _V.set(s.m5.vel,s.m5.speed,0) },
            ()=>{ !goLeft.isDown && _V.setX(s.m5.vel,0) });
          },
          resetNextPt(){
            let cx=_G.arena.x1+_G.arena.width/2;
            _G.paddle.x=cx;
            _G.ball.x=cx;
            _G.ball.y=_G.arena.y1+_G.arena.height/2;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this)&&this.g.init(1)&&this.g.ctrl();
        this.g.score=_S.bmpText(" 0 ",UI_FONT,48*K);
        self.insert(this.g.score);
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
        this.g.cntDownMsg=_S.bmpText("1",UI_FONT,96*K);
        _S.anchorXY(this.g.cntDownMsg,0.5);
        _V.set(this.g.cntDownMsg,Mojo.width/2,Mojo.height/2);
        this.insert(this.g.cntDownMsg);
        this.doCntDown();
      },
      postUpdate(dt){
        this.g.score.text=`${_G.score}`;
        let objs,col;
        _S.clamp(_G.ball, [_G.arena,{bottom:false}],true);
        if(_G.ball.y > _G.arena.y2){
          if(_G.health.dec()){
            return this.g.resetNextPt();
          }
          this.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame"));
        }
        this.searchSGrid(_G.ball).forEach(o=>{
          if(_G.ball !== o && _S.collide(_G.ball, o)){
            bounce.play();
            switch(o.m5.type){
              case E_PADDLE:
                break;
              case E_BLOCK:
                let c=_S.centerXY(o);
                --_G.blockCount;
                ++_G.score;
                _S.remove(o);
                _F.createParticles(
                  c[0],c[1],
                  ()=>_S.sprite("star.png"),
                  this,
                  [0.3,0.3],
                  {rotate:0.05,alpha:0.005,scale:0.005,angle:0,size:12,speed:5},
                  {rotate:0.1,alpha:0.01,scale:0.01,angle:6.28,size:24,speed:10});
                break;
            }
          }
        });
        if(_G.blockCount==0){
          this.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{msg:"You Win!"}));
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["bg.jpg","star.png","tiles.png","images/tiles.json",
                 "audioOn.png","audioOff.png",
                 "coin.mp3","click.mp3","game_over.mp3","game_win.mp3"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }

  }));

})(this);


