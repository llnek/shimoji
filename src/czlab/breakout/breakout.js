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
    const {Sprites:S,
           Scenes:Z,
           FX:T,
           Input:I,
           Game:G,
           "2d":_2d,
           ute:_,is,EventBus}=Mojo;

    const COLORS = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
    const x=null,g="green",o="orange",b="blue",r="red",v="violet";
    const _ASSETS={
      level1: [ [x,x,g,o,g,x,x],
                [o,b,g,g,g,b,o],
                [x,b,b,b,b,b,x]
              ]
    };

    //G.bounce=Mojo.sound("bounce.wav");
    //G.music=Mojo.sound("music.wav");
    //G.music.loop = true;
    G.gridCols=9;
    G.gridRows=20;//16;

    Z.defScene("splash",{
      setup(){
        let out={x:0,y:0},
            K=Mojo.getScaleFactor();
        G.grid= S.gridXY([G.gridCols,G.gridRows],0.4,1,out);//tall but narrow
        G.arena=Mojo.mockStage(out);//playable area
      }
    },{centerStage:true});

    Z.defScene("level1",{
      setup(){
        let K=Mojo.getScaleFactor();
        let offsetY= -1;
        let grid=G.grid;
        let pbox={x1:0,y1:0,
                  x2:G.arena.width,
                  y2:G.arena.height};

        G.score=0;
        G.blockCount=0;

        //make scene as big as the play area
        S.setXY(this,G.arena.x,G.arena.y);

        //make place to show msg
        //let msgRow = S.rectangle(G.arena.width, offsetY, "black");
        //this.insert(msgRow);

        let data=_ASSETS["level1"];
        for(let g,r,y=0;y<data.length;++y){
          g=grid[y];
          r=data[y];
          for(let s,p,k=1,x=0;x<r.length;++x){
            if(!r[x]){continue}
            p=g[x+k];
            s= S.sprite(`${r[x]}.png`);
            s.m5.type=E_BLOCK;
            s.m5.static=true;
            s.height=MFL(1*(p.y2-p.y1));
            s.width=MFL(1*(p.x2-p.x1));
            if(offsetY<0){
              offsetY=s.height*2;
            }
            s.x=p.x1;
            s.y=p.y1+offsetY;
            ++G.blockCount;
            this.insert(s,true);
          }
        }

        //let msg =G.msg= S.text("test", {fontFamily: "puzzler", fontSize: 20*K, fill: "white"});
        //S.setXY(msg,8*K,8*K);
        //msgRow.addChild(msg);
        let ball = G.ball=S.sprite("ball.png",true);
        ball.m5.cmask=E_BLOCK|E_PADDLE;
        ball.m5.type=E_BALL;
        S.scaleXY(ball,K*0.2,K*0.2);
        S.pinCenter(G.arena,ball);
        S.velXY(ball, 50*K, 80*K);
        ball.m5.tick=(dt)=>{
          S.move(ball,dt)
        };
        this.insert(ball,true);
        let bw=ball.width;
        let paddle = G.paddle=S.sprite("paddle.png");
        paddle.m5.static=true;
        S.centerAnchor(paddle);
        paddle.m5.type=E_PADDLE;
        S.scaleXY(paddle,K*0.2,K*0.2);
        paddle.width=4*bw;
        S.setXY(paddle,MFL(G.arena.width/2), pbox.y2 - 1.5*paddle.height);
        let pY=paddle.y;
        paddle.m5.speed=5;
        paddle.m5.tick=()=>{
          S.move(paddle);
          //paddle.x = Mojo.mouse.x - this.x;
          _2d.contain(paddle, G.arena,false);
          paddle.y = pY;
        };
        //paddle.oldsx=paddle.scale.x;
        //paddle.oldsy=paddle.scale.y;
        this.insert(paddle,true);
        this.insert(S.drawGridBox(pbox));
        pbox.y1 += offsetY;
        //this.insert(S.drawGridBox(pbox));
        //G.arena.height -= offsetY;
        //G.arena.y=offsetY;
        G.arena.y=0;
        G.arena.x=0;
        this._ctrl();


        let tt=S.bitmapText("Pooface_123!",{fontName:"unscii",fontSize:36});
        this.insert(tt);

      },
      _ctrl(){
        const s=G.paddle;
        const goLeft = I.keybd(I.keyLEFT,
        ()=>{ S.velXY(s,-s.m5.speed,0) },
        ()=>{ !goRight.isDown && S.velXY(s,0) });
        const goRight =I.keybd(I.keyRIGHT,
        ()=>{ S.velXY(s,s.m5.speed,0) },
        ()=>{ !goLeft.isDown && S.velXY(s,0) });
      },
      postUpdate(dt){
        let objs,col;
        if(col=_2d.contain(G.ball, G.arena,true)){
          //G.bounce.play();
          if(col.has(Mojo.BOTTOM)) --G.score;
        }
        this.searchSGrid(G.ball).forEach(o=>{
          if(G.ball !== o && _2d.collide(G.ball, o)){
            //G.bounce.play();
            switch(o.m5.type){
              case E_PADDLE:
                break;
              case E_BLOCK:
                let c=S.centerXY(o);
                --G.blockCount;
                ++G.score;
                S.remove(o);
                break;
            }
          }
        });
        //G.msg.text=`Score: ${G.score}`;
        if(G.blockCount===0){
          Mojo.pause();
        }
      }
    },{sgridX:160,sgridY:160,centerStage:true});
  }

  const _$={
    assetFiles: ["unscii.fnt","tiles.json"],
    arena: {width: 9*32, height: 16*32},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("splash");
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


