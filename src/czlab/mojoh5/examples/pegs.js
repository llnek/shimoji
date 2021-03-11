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

    const E_PLAYER=1;
    const E_PEG=2;

    _Z.defScene("level1",{
      setup(){
        let colors = [ "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF" ];
        let cw,ch,pegs=_S.gridXY([5,6],0.8,this);
        let pbox=_S.gridBBox(0,0,pegs);
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
            c.m5.type=E_PEG;
            c.x=MFL((g.x1+g.x2)/2);
            c.y=MFL((g.y1+g.y2)/2);
            this.insert(c);
          }
        }
        let randomDiameter = _.randInt2(4,cw);
        let K=Mojo.contentScaleFactor();
        let ball = this.ball= _S.circle(randomDiameter/2, "red");
        //randomly position ball
        ball.x = _.randInt2(ball.width, this.width - ball.width);
        ball.y = ball.width/2;
        ball.m5.type=E_PLAYER;
        ball.m5.cmask=E_PEG;
        ball.m5.vel[0] = _.randInt2(-15, 15)*K.width;
        ball.m5.vel[1] = 0;
        ball.m5.gravity[1]= 0.5 * K.height;
        ball.m5.mass = 0.75 + (ball.width / 32);
        ball.m5.step=()=>{
          ball.m5.vel[1] += ball.m5.gravity[1];
          ball.m5.vel[0] *= ball.m5.friction[0];
          _S.move(ball);
        };
        this.insert(ball);
        this.arena=Mojo.mockStage(this.x,this.y, pbox.x2-pbox.x1, pbox.y2-pbox.y1);
        this.addChild(_S.drawGridBox(pbox));
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let col = _2d.contain(this.ball, this.arena, true);
        if(col){
          this.ball.m5.friction[0] = col.has(Mojo.BOTTOM) ? 0.96 : 1
        }
        this.m5.sgrid.search(this.ball).forEach(c=>{
          if(c!==this.ball){
            _2d.collide(this.ball, c, true);
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



