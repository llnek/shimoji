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

  const MFL=Math.floor;
  const E_PADDLE=1;
  const E_BLOCK=2;
  const E_BALL=4;

  function scenes(Mojo){
    let {ute:_,is,EventBus}=Mojo;
    let S=Mojo.Sprites;
    let Z=Mojo.Scenes;
    let T=Mojo.FX;
    let I=Mojo.Input;
    let G=Mojo.Game;
    let _2d= Mojo["2d"];

    G.bounce=Mojo.sound("bounce.wav");
    G.music=Mojo.sound("music.wav");
    G.music.loop = true;

    G.gridCols=8;
    G.gridRows=16;

    Z.defScene("splash",{
      setup(){
        let out={x:0,y:0},
            K=Mojo.contentScaleFactor();
        G.grid= S.gridXY([G.gridCols,G.gridRows],0.4,1,out);
        G.arena=Mojo.mockStage(out);
        this.x=out.x;
        this.y=out.y;
        let play=S.sprite("up.png"),
            title=S.sprite("title.png");
        title.width=G.arena.width;
        title.height=G.arena.height;
        this.addit(title);
        play.scale.x=K.height;
        play.scale.y=K.height;
        S.pinBottom(title,play,-play.height*1.2);
        play.x = S.rightSide(title)-play.width*1.2;
        I.makeButton(play);
        play.m5.press=()=>{
          T.fadeOut(this).onComplete(()=>{
            I.undoButton(play);
            Z.replaceScene(this.name,"level1");
          })
        };
        this.addit(play);
        let msg = S.text("start game",
                         {fontFamily:"puzzler",
                          fontSize:20*K.height,fill:"white"});
        S.pinTop(play,msg,msg.height*1.2,1);
        this.addit(msg);
      }
    },{centerStage:true});

    Z.defScene("level1",{
      setup(){
        let colors = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
        let K=Mojo.contentScaleFactor();
        let offsetY= MFL(32 * K.height);
        let pbox={x1:0,y1:0,
                  x2:G.arena.width,
                  y2:G.arena.height};
        let grid=G.grid;
        this.x=G.arena.x;
        this.y=G.arena.y;
        let topBorder = S.rectangle(G.arena.width, offsetY, "black");
        this.addit(topBorder);
        G.score=0;
        G.blockCount=0;
        for(let r,y=0;y<2;++y){
          r=grid[y];
          for(let s,g,x=0;x<r.length;++x){
            g=r[x];
            s= S.sprite(_.randItem(colors));
            s.m5.type=E_BLOCK;
            s.m5.static=true;
            s.x=g.x1;
            s.y=g.y1+offsetY;
            s.width=MFL(1*(g.x2-g.x1));
            s.height=MFL(1*(g.y2-g.y1));
            ++G.blockCount;
            this.insert(s);
          }
        }
        let msg =G.msg= S.text("test", {fontFamily: "puzzler",
                                        fontSize: 20*K.height, fill: "white"});
        S.setXY(msg,8*K.width,8*K.height);
        topBorder.addChild(msg);
        let ball = G.ball=S.sprite("ball.png",true);
        ball.m5.cmask=E_BLOCK|E_PADDLE;
        ball.m5.type=E_BALL;
        ball.scale.x=K.height;
        ball.scale.y=K.height;
        S.pinCenter(G.arena,ball);
        ball.m5.vel[1] = 8*K.height;//12;
        ball.m5.vel[0] = 5*K.width;//8;
        ball.m5.step=(dt)=>{
          S.move(ball);
          //this.m5.sgrid.engrid(ball);
        };
        this.insert(ball);
        let paddle = G.paddle=S.sprite("paddle.png");
        paddle.m5.static=true;
        paddle.anchor.set(0.5);
        paddle.m5.type=E_PADDLE;
        paddle.scale.x=K.height;
        paddle.scale.y=K.height;
        paddle.y=pbox.y2 - 1.5*paddle.height;
        paddle.x=MFL(G.arena.width/2);
        let pY=paddle.y;
        paddle.m5.step=(dt)=>{
          paddle.x = Mojo.mouse.x - this.x;// - MFL(paddle.width/2);
          _2d.contain(paddle, G.arena,false);
          paddle.y = pY;
          //this.m5.sgrid.engrid(ball);
        };
        paddle.oldsx=paddle.scale.x;
        paddle.oldsy=paddle.scale.y;
        this.insert(paddle);
        //let music= G.music;
        //if(!music.playing) music.play();
        this.addit(S.drawGridBox(pbox));
        G.arena.height -= offsetY;
        G.arena.y=offsetY;
        G.arena.x=0;
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let objs,col;
        if(col=_2d.contain(G.ball, G.arena,true)){
          G.bounce.play();
          if(col.has(Mojo.BOTTOM)) --G.score;
        }
        objs=this.m5.sgrid.search(G.ball);
        objs.forEach(o=>{
          if(G.ball !== o && _2d.collide(G.ball, o)){
            G.bounce.play();
            if(o.m5.type===E_PADDLE){
              if(G.paddleWobble){
                G.paddleWobble.dispose();
                o.scale.set(o.oldsx,o.oldsy);
                G.paddleWobble=null;
              }else{
                G.paddleWobble = T.wobble(o,{x1:10,x2:10,y1:-10,y2:-10},o.scale.x*1.3,o.scale.y*1.2, 5);
              }
            }else if(o.m5.type===E_BLOCK){
              --G.blockCount;
              ++G.score;
              this.remove(o);
              if(true){
                let c=S.centerXY(o);
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
          }
        });
        G.msg.text=`Score: ${G.score}`;
        if(G.blockCount===0){
          Mojo.pause();
          _.timer(()=>{
            Z.replaceScene("level1","splash");
            Mojo.resume();
          },300);
        }
      }
    },{sgridX:100,sgridY:100,centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["images/bloxyee/bloxyee.json", "puzzler.otf", "music.wav", "bounce.wav"],
      arena: {width: 512, height: 512},
      scaleToWindow:"max",
      load(Mojo,f,p){
        console.log(`breakout- loading: ${f}`);
        console.log(`breakout- progress: ${p}`);
      },
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("splash");
      }
    });
  });

})(this);


