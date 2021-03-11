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
    const _Z=Mojo.Scenes,
          _S=Mojo.Sprites,
          _I=Mojo.Input,
          _2d=Mojo["2d"];
    const MFL=Math.floor;
    const {ute:_, EventBus}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let colors = [ "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF" ];
        let C,cw,ch;
        let pegs=_S.gridXY([5,6],0.8,C=_S.container());
        let pbox=_S.gridBBox(C.x,C.y,pegs);
        for(let r,y=1;y<pegs.length-1;++y){
          r=pegs[y];
          for(let c,w4,w9,g,x=0;x<r.length;++x){
            g=r[x];
            cw=g.x2-g.x1;
            ch=g.y2-g.y1;
            w4=cw/4;
            w9=0.8*cw;
            c = _S.circle(_.randInt2(w4,w9)/2,
                          colors[_.randInt2(0, 4)]);
            c.m5.static=true;
            c.x=MFL((g.x1+g.x2)/2);
            c.y=MFL((g.y1+g.y2)/2);
            C.addChild(c);
          }
        }
        this.insert(C);
        let randomDiameter = _.randInt2(4,cw);
        let K=Mojo.contentScaleFactor();
        let ball = this.ball= _S.circle(randomDiameter/2, "red");
        C.addChild(ball);
        //randomly position ball
        ball.x = _.randInt2(ball.width, C.width - ball.width);
        ball.y = ball.width/2;
        ball.m5.vel[0] = _.randInt2(-12, 12)*K.width;
        ball.m5.vel[1] = 0;
        ball.m5.gravity[1]= 0.6 * K.height;
        ball.m5.friction[0]=1;
        ball.m5.mass = 0.75 + (ball.width / 32);
        this.pegs=C;
        this.arena=Mojo.mockStage(C.x,C.y, pbox.x2-pbox.x1, pbox.y2-pbox.y1);
        this.addChild(_S.drawGridBox(pbox));
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.ball.m5.vel[1] += this.ball.m5.gravity[1];
        this.ball.m5.vel[0] *= this.ball.m5.friction[0];
        _S.move(this.ball);
        let col = _2d.contain(this.ball, this.arena, true);
        //make the ball gradually rolls to a stop at the bottom
        if(col){
          this.ball.m5.friction[0] = col.has(Mojo.BOTTOM) ? 0.96 : 1
        }
        _.rseq(this.pegs.children,c=> {
          if(c !== this.ball)
            _2d.collide(this.ball, c, true);
        });
      }
    });
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



