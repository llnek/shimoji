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

  function defScenes(Mojo){
    let S=Mojo.Sprites;
    let Z=Mojo.Scenes;
    let T=Mojo.FX;
    let I=Mojo.Input;
    let G=Mojo.Game;
    let _2d= Mojo["2d"];
    let _=Mojo.ute, is=Mojo.is;

    let gridW= 8,
        gridH= 2,//5,
        cellW= 64,
        cellH= 64;

    Z.defScene("splash",{
      setup(){
        let title = this.insert(S.sprite("title.png")),
            playBtn=this.insert(S.sprite("up.png"));
        S.setXY(playBtn,514,350);
        I.makeButton(playBtn);
        playBtn.m5.press = ()=>{
          let ns= Z.runScene("level1");
          let a= T.slide(this, T.EASE_OUT_CUBIC, 514, 0, 30);
          let b= T.slide(ns, T.EASE_OUT_CUBIC,0, 0, 30);
          a.onComplete= () => { Z.removeScene(this); };
        };
        let msg = S.text("start game", {fontFamily:"puzzler",fontSize:20,fill:"white"}, -200, 300);
        this.insert(msg);
        T.slide(playBtn, T.EASE_OUT_CUBIC, 250, 350, 30);
        T.slide(msg, T.EASE_OUT_CUBIC,250, 300, 30);
      }});

    Z.defScene("end",function(){
      let title = this.insert(S.sprite("title.png")),
          playBtn = this.insert(S.sprite("up.png"));
      S.setXY(playBtn, 514,350);
      I.makeButton(playBtn);
      playBtn.m5.press = ()=>{
        let ns= Z.runScene("level1");
        let a= T.slide(this, T.EASE_OUT_CUBIC, 514, 0, 30);
        let b= T.slide(ns, T.EASE_OUT_CUBIC, 0, 0, 30);
        a.onComplete = () => { Z.removeScene(this); };
      };
      let msg = S.text(`Score: ${G.score}`, {fontFamily:"puzzler",fontSize:20,fill:"white"}, -200, 300);
      this.insert(msg);
      T.slide(playBtn, T.EASE_OUT_CUBIC,250, 350, 30);
      T.slide(msg, T.EASE_OUT_CUBIC,250, 300, 30);
    });

    Z.defScene("level1",function(){
      let topBorder = this.insert(S.rectangle(512, 32, "black")),
          paddle = this.insert(S.sprite("paddle.png"));
      S.pinBottom(this,paddle, -2.5*paddle.height);
      let pY=paddle.y;
      paddle.m5.static=true;
      paddle.m5.step=(dt)=>{
        paddle.x = Mojo.mouse.x - paddle.width/2;
        _2d.contain(paddle, paddle.parent);
        paddle.y = pY;
      };

      let colors = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
      let blocks = S.grid(gridW, gridH, cellW, cellH, false, 0, 0, ()=>{
        let s= S.sprite(_.randItem(colors));
        s.m5.static=true;
        return s;
      });
      blocks.x=0;
      blocks.y = 32;
      this.insert(blocks);

      let msg = S.text("test", {fontFamily: "puzzler", fontSize: 20, fill: "white"});
      S.setXY(msg,8,8);
      this.insert(msg);

      let ball = this.insert(S.sprite("ball.png",true));
      S.pinBottom(this,ball, -128);
      ball.m5.vel[0] = 8;//12;
      ball.m5.vel[1] = 5;//8;
      ball.m5.step=(dt)=>{
        S.move(ball);
        //ballHitsWall
        _2d.contain(ball, Mojo.mockStage(0,32), true, col=>{
          G.bounce.play();
          if(col.has(Mojo.BOTTOM)) --G.score;
        });
        //ballHitsPaddle
        if(_2d.collide(ball, paddle)){
          G.bounce.play();
          if(G.paddleWobble){
            paddle.scale.set(1,1);
            T.remove(G.paddleWobble);
          }
          G.paddleWobble = T.wobble(paddle, {x1:10, x2:10, y1:-10, y2:-10}, 1.3, 1.2, 5);
        }
        //ballHitsBlock
        for(let b,z=blocks.children.length,i=z-1; i>=0; --i){
          b=blocks.children[i];
          if(_2d.collide(ball,b)){
            ++G.score;
            G.bounce.play();
            S.remove(b);
            let c=S.centerXY(b);
            T.createParticles(
              //globalCenterX, globalCenterY,            //x and y position
              c[0],c[1],
              ()=>S.sprite("star.png"),              //Particle function
              this,                                 //The container to add it to
              [0.3,0.3],                                     //Gravity
              {rotate:0.05,alpha:0.005,scale:0.005,angle:0,size:12,speed:5},
              {rotate:0.1,alpha:0.01,scale:0.01,angle:6.28,size:24,speed:10}
            );
          }
        }

        msg.text=`Score: ${G.score}`;
        if(blocks.children.length===0) {
          Mojo.pause();
          _.timer(()=>{
            Z.replaceScene("level1","end");
            Mojo.resume();
          },300);
        }
      };

      //Position the `gameScene` offscreen at -514 so that its
      //not visible when the game starts
      this.x = -514;
      this.y=0;

      let music= G.music;
      //if(!music.playing) music.play();
    });

  }


  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["images/bloxyee/bloxyee.json", "puzzler.otf", "music.wav", "bounce.wav"],
      arena: {width: 512, height: 512},
      scaleToWindow: true,
      load(Mojo,f,p){
        console.log(`breakout- loading: ${f}`);
        console.log(`breakout- progress: ${p}`);
      },
      start(Mojo){
        let G= Mojo.Game;
        G.bounce=Mojo.sound("bounce.wav");
        G.music=Mojo.sound("music.wav");
        G.score=0;
        G.music.loop = true;
        defScenes(Mojo);
        Mojo.Scenes.runScene("splash");
      }
    });
  });

})(this);


