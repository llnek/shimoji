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
    const {ute:_, EventBus}=Mojo;

    _Z.defScene("level1",{
      setup(){
        let randomDiameter = _.randInt2(16, 64);
        //Create the ball using the random diameter
        let ball = this.ball= _S.circle(randomDiameter/2, "red");
        this.insert(ball);
        //Position the ball randomly somewhere across the top of the canvas
        ball.x = _.randInt2(ball.width, Mojo.width - ball.width);
        ball.y = ball.width/2;

        //Set the ball's velocity
        ball.m5.vel[0] = _.randInt2(-12, 12);
        ball.m5.vel[1] = 0;

        //Set the ball's gravity, friction and mass
        ball.m5.gravity[0]=
        ball.m5.gravity[1]= 0.6;
        ball.m5.friction[0]=1;

        //Set the mass based on the ball's diameter
        ball.m5.mass = 0.75 + (ball.width / 32);

        //peg colors
        let colors = [
          "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF"
        ];

        let pegs = this.pegs= _S.grid(

          5, 4, 96, 96,
          true, 0, 0,

          ()=>{
            let peg = _S.circle(_.randInt2(16, 64)/2, "blue");
            peg.m5.static=true;
            peg.m5.fillStyle(colors[_.randInt2(0, 4)]);
            return peg;
          },

          () => console.log("example cb")
        );
        this.insert(pegs);
        pegs.x=16;
        pegs.y=96;

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.ball.m5.vel[1] += this.ball.m5.gravity[1];
        this.ball.m5.vel[0] *= this.ball.m5.friction[0];
        _S.move(this.ball);
        let col = _2d.contain(this.ball, this, true);

        //make the ball gradually rolls to a stop at the bottom
        if(col){
          this.ball.m5.friction[0] = col.has(Mojo.BOTTOM) ? 0.96 : 1
        }

        _.rseq(this.pegs.children,c=> _2d.collide(this.ball, c, true))
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:512, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);



