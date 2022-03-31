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

  function scenes(Mojo){
    const _M=window["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:G,
           v2:_V,
           ute:_, is}=Mojo;
    const E_PLAYER=1;
    const E_PEG=2;

    _Z.scene("level1",{
      setup(){
        let colors = [ "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF" ];
        let out={x:0,y:0};
        let cw,ch, maxR=0;
        let pegs=_S.gridXY([5,6],0.5,0.8,out);
        _V.set(this,out.x,out.y);
        for(let r,y=1;y<pegs.length-1;++y){
          r=pegs[y];
          for(let rr,c,w4,w9,g,x=0;x<r.length;++x){
            g=r[x];
            cw=g.x2-g.x1;
            ch=g.y2-g.y1;
            rr=cw>ch?ch:cw;
            w4=rr/4;
            w9=0.8*rr;
            rr=_M.ndiv(_.randInt2(w4,w9),2);
            if(rr>maxR) maxR=rr;
            c = _S.circle(rr, colors[_.randInt2(0, 4)]);
            c.m5.static=true;
            c.m5.type=E_PEG;
            _V.set(c, _M.ndiv(g.x1+g.x2,2), _M.ndiv(g.y1+g.y2,2));
            this.insert(c,true);
          }
        }
        let r= _M.ndiv(_.randInt2(4,cw),2);
        let K=Mojo.getScaleFactor();
        let ball = G.ball= _S.circle(r, "red");
        //randomly position ball
        _V.set(ball,_.randInt2(ball.width, this.width - ball.width), _M.ndiv(ball.width,2));
        ball.m5.type=E_PLAYER;
        ball.m5.cmask=E_PEG;
        _V.set(ball.m5.vel, _.randInt2(-15, 15)*K,0);
        _V.set(ball.m5.gravity,0,0.5 * K);
        ball.m5.mass = 0.75 + (ball.width / 32);
        ball.m5.tick=()=>{
          _V.mul$(_V.add$(ball.m5.vel, ball.m5.gravity), ball.m5.friction);
          _S.move(ball);
        };
        this.insert(ball,true);
        //for containment
        G.arena=Mojo.mockStage(0,0, out.width, out.height);
        this.insert(_S.drawGridBox({x1:0,y1:0,x2:out.width,y2:out.height}));
      },
      postUpdate(dt){
        let col = _S.clamp(G.ball, G.arena, true);
        if(col)
          _V.set(G.ball.m5.friction, col.has(Mojo.BOTTOM) ? 0.96 : 1, 1);
        this.searchSGrid(G.ball).forEach(c=>{
          if(c!==G.ball)
            _S.collide(G.ball, c, true)
        });
      }
    },{centerStage:true, sgridX:100,sgridY:100});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:512, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("level1");
      }
    })
  });

})(this);



