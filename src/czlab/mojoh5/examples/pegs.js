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
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:G,
           "2d":_2d,
           ute:_, is, EventBus}=Mojo;
    const MFL=Math.floor;
    const E_PLAYER=1;
    const E_PEG=2;

    _Z.defScene("level1",{
      setup(){
        let colors = [ "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF" ];
        let out={x:0,y:0};
        let cw,ch,pegs=_S.gridXY([5,6],0.5,0.8,out);
        let pbox=_S.gridBBox(0,0,pegs);
        let maxR=0;
        _S.setXY(this,out.x,out.y);
        for(let r,y=1;y<pegs.length-1;++y){
          r=pegs[y];
          for(let rr,c,w4,w9,g,x=0;x<r.length;++x){
            g=r[x];
            cw=g.x2-g.x1;
            ch=g.y2-g.y1;
            rr=cw>ch?ch:cw;
            w4=rr/4;
            w9=0.8*rr;
            rr=Math.floor(_.randInt2(w4,w9)/2);
            if(rr>maxR) maxR=rr;
            c = _S.circle(rr, colors[_.randInt2(0, 4)]);
            c.m5.static=true;
            c.m5.type=E_PEG;
            _S.setXY(c,MFL((g.x1+g.x2)/2), MFL((g.y1+g.y2)/2));
            this.insert(c,true);
          }
        }
        let r= maxR;//Math.floor(_.randInt2(4,cw)/2);
        let K=Mojo.getScaleFactor();
        let ball = G.ball= _S.circle(r, "red");
        //randomly position ball
        ball.x = _.randInt2(ball.width, this.width - ball.width);
        ball.y = Math.floor(ball.width/2);
        ball.m5.type=E_PLAYER;
        ball.m5.cmask=E_PEG;
        _S.velXY(ball, _.randInt2(-15, 15)*K,0);
        _S.gravityXY(ball,null,0.5 * K);
        ball.m5.mass = 0.75 + (ball.width / 32);
        ball.m5.tick=()=>{
          ball.m5.vel[1] += ball.m5.gravity[1];
          ball.m5.vel[0] *= ball.m5.friction[0];
          _S.move(ball);
        };
        this.insert(ball,true);
        G.arena=Mojo.mockStage(this.x,this.y, pbox.x2-pbox.x1, pbox.y2-pbox.y1);
        G.arena.height -= G.arena.y;
        G.arena.width -= G.arena.x;
        this.insert(_S.drawGridBox(pbox));
      },
      postUpdate(dt){
        let col = _2d.contain(G.ball, G.arena, true);
        if(col){
          G.ball.m5.friction[0] = col.has(Mojo.BOTTOM) ? 0.96 : 1
        }
        this.searchSGrid(G.ball).forEach(c=>{
          if(c!==G.ball){
            _2d.collide(G.ball, c, true)
          }
        });
      }
    },{sgridX:100,sgridY:100,centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:512, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



