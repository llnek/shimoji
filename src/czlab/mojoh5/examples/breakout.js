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

;(function(window){

  "use strict";

  const MFL=Math.floor;
  const E_PADDLE=1;
  const E_BLOCK=2;
  const E_BALL=4;

  function scenes(Mojo){
    const {Sprites:S,
           Scenes:Z,
           FX:T,
           Input:I,
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    G.bounce=Mojo.sound("bounce.mp3");
    //G.music=Mojo.sound("music.wav");
    //G.music.loop = true;
    G.gridCols=8;
    G.gridRows=16;

    Z.scene("splash",{
      setup(){
        let out={x:0,y:0},
            K=Mojo.getScaleFactor();
        G.grid= S.gridXY([G.gridCols,G.gridRows],0.4,1,out);//tall but narrow
        G.arena=Mojo.mockStage(out);//playable area
        _V.copy(this,out);
        let play=S.sprite("up.png"),
            title=S.sprite("title.png");

        //fill the whole area
        S.sizeXY(title, G.arena.width, G.arena.height);
        this.insert(title);

        _V.set(play.scale,K,K);
        S.pinBelow(title,play,-play.height*1.2);

        _V.setX(play, S.rightSide(title)-play.width*1.2);
        I.makeButton(play);
        play.m5.press=()=>{
          T.fadeOut(this).onComplete=()=>{
            Z.replace(this.name,"level1");
          }
          I.undoButton(play);
        };
        this.insert(play);
        let msg = S.bitmapText("start game",
                         {fontName:"unscii", fontSize:20*K,fill:"white"});
        S.pinTop(play,msg,msg.height*1.2,1);
        this.insert(msg);
      }
    },{centerStage:true});

    Z.scene("level1",{
      setup(){
        let colors = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
        let K=Mojo.getScaleFactor();
        let offsetY= MFL(32 * K);
        let grid=G.grid;
        let pbox={x1:0,y1:0,
                  x2:G.arena.width,
                  y2:G.arena.height};

        G.score=0;
        G.blockCount=0;

        //make scene as big as the play area
        _V.set(this,G.arena.x,G.arena.y);

        //make place to show msg
        let msgRow = S.rect(G.arena.width, offsetY, "black");
        this.insert(msgRow);

        //fill blocks via grid
        for(let r,y=0;y<2;++y){
          r=grid[y];
          for(let s,g,x=0;x<r.length;++x){
            g=r[x];
            s= S.sprite(_.randItem(colors));
            s.m5.type=E_BLOCK;
            s.m5.static=true;
            _V.set(s,g.x1,
                     g.y1+offsetY);
            S.sizeXY(s,MFL(1*(g.x2-g.x1)),
                       MFL(1*(g.y2-g.y1)));
            ++G.blockCount;
            this.insert(s,true);
          }
        }

        let msg =G.msg= S.bitmapText("test", {fontName: "unscii",
                                              fontSize: 20*K, fill: "white"});
        _V.set(msg,8*K,8*K);
        msgRow.addChild(msg);
        let ball = G.ball=S.sprite("ball.png",true);
        ball.m5.cmask=E_BLOCK|E_PADDLE;
        ball.m5.type=E_BALL;
        _V.set(ball.scale,K,K);
        S.pinCenter(G.arena,ball);
        _V.set(ball.m5.vel, 5*K, 8*K);
        ball.m5.tick=()=>{ S.move(ball) };
        this.insert(ball,true);
        let paddle = G.paddle=S.sprite("paddle.png");
        paddle.m5.static=true;
        S.centerAnchor(paddle);
        paddle.m5.type=E_PADDLE;
        _V.set(paddle.scale,K,K);
        _V.set(paddle,MFL(G.arena.width/2),
                      pbox.y2 - 1.5*paddle.height);
        let pY=paddle.y;
        paddle.m5.tick=()=>{
          _V.setX(paddle, Mojo.mouse.x - this.x);
          S.clamp(paddle, G.arena,false);
          _V.setY(paddle, pY);
        };
        paddle.oldsx=paddle.scale.x;
        paddle.oldsy=paddle.scale.y;
        this.insert(paddle,true);
        this.insert(S.drawGridBox(pbox));
        pbox.y1 += offsetY;
        this.insert(S.drawGridBox(pbox));
        G.arena.height -= offsetY;
        _V.set(G.arena,0, offsetY);
      },
      postUpdate(dt){
        let objs,col;
        if(col=S.clamp(G.ball, G.arena,true)){
          //G.bounce.play();
          if(col.has(Mojo.BOTTOM)) --G.score;
        }
        this.searchSGrid(G.ball).forEach(o=>{
          if(G.ball !== o && S.collide(G.ball, o)){
            //G.bounce.play();
            switch(o.m5.type){
              case E_PADDLE:
                if(G.paddleWobble){
                  G.paddleWobble.dispose();
                  G.paddleWobble=null;
                  o.scale.set(o.oldsx,o.oldsy);
                }else{
                  G.paddleWobble = T.wobble(o,{x1:10,x2:10,y1:-10,y2:-10},
                                            o.scale.x*1.3,o.scale.y*1.2, 5);
                }
                G.bounce.play();
                break;
              case E_BLOCK:
                let c=S.centerXY(o);
                --G.blockCount;
                ++G.score;
                S.remove(o);
                T.createParticles(
                  c[0],c[1],
                  ()=>S.sprite("star.png"),
                  this,
                  [0.3,0.3],
                  {rotate:0.05,alpha:0.005,scale:0.005,angle:0,size:12,speed:5},
                  {rotate:0.1,alpha:0.01,scale:0.01,angle:6.28,size:24,speed:10});
                break;
            }
          }
        });
        G.msg.text=`Score: ${G.score}`;
        if(G.blockCount==0){
          Mojo.pause();
          _.timer(()=>{
            Z.replace("level1","splash");
            Mojo.resume();
          },300);
        }
      }
    },{sgridX:160,sgridY:160,centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["images/bloxyee/bloxyee.json", "bounce.mp3"],
      arena: {width: 512, height: 512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("splash");
      }
    });
  });

})(this);


