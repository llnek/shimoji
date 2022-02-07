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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const int=Math.floor;
  const sin=Math.sin;
  const cos=Math.cos;
  const PI2= Math.PI*2;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const Core= window["io/czlab/mcfud/core"]();
    const _M= window["io/czlab/mcfud/math"]();
    const GA= window["io/czlab/mcfud/algo/NEAT"](Core);
    //const GA= window["io/czlab/mcfud/algo/NEAT2"](Core);

    const UI_FONT="Doki Lowercase";

    function Pipes(K,[x1,y1,h1],[x2,y2,h2]){
      let st= _S.sprite("pipetop.png"),
          sb= _S.sprite("pipebottom.png");
      _S.scaleXY(st,K,K);
      _S.scaleXY(sb,K,K);
      st.height=h1;
      sb.height=h2;
      st.x=x1;
      st.y=y1;
      sb.x=x2;
      sb.y=y2;
      st.m5.speed=3*K;
      sb.m5.speed=3*K;
      return [st,sb];
    }

    function Bird(self,K){
      let s= _S.sprite("bird.png");
      _S.centerAnchor(s);
      _S.scaleXY(s,K,K);
      s.x = 80;
      s.y = 250;
      s.m5.gravity = 0;
      s.m5.speed = 0.3;
      s.m5.jump = -6;
      s.g.score=0;
      s.g.flap=()=>{
        s.m5.gravity = s.m5.jump
      };
      s.g.update=()=>{
        s.m5.gravity += s.m5.speed;
        s.y += s.m5.gravity;
      };
      s.g.isDead=(height, pipes)=>{
        if(s.y >= height || s.y + s.height <= 0){ return true }
        for(let i=0;i<pipes.length;++i){
          if(!( s.x > pipes[i].x + pipes[i].width ||
                s.x + s.width < pipes[i].x ||
                s.y > pipes[i].y + pipes[i].height ||
                s.y + s.height < pipes[i].y)){
            return true
          }
        }
      };
      return self.insert(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            this.bgs=_.fill(2, ()=> _S.sprite("background.png"));
            this.bgs.forEach(s=>{
              _S.scaleToCanvas(self.insert(s))
            });
            this.pipes = [];
            this.birds = [];
            this.spawnInterval = 90;
            this.interval = 0;
            this.bgSpeed = 0.5;
            this.bgX = 0;

            this.neatObj= new GA.NeatGA(50,2,1);
            this.gen= this.neatObj.createPhenotypes();
            this.birds=this.gen.map(g=> new Bird(self,K,g));
            this.generation=1;
            this.alives = this.birds.length;
          },
          resetNext(){
            let scores=[];
            this.interval = 0;
            this.pipes.forEach(s=> _S.remove(s));
            this.birds.forEach(s=>{
              scores.push(s.g.score);
              _S.remove(s);
            });
            this.gen = this.neatObj.epoch(scores);
            this.birds=this.gen.map(g=> new Bird(self,K,g));
            this.generation++;
            this.pipes=[];
            this.alives = this.birds.length;
          },
          tick(dt){
            this.bgX += this.bgSpeed;
            let nextGap = 0;
            if(this.birds.length > 0){
              for(let i=0; i<this.pipes.length; i+=2){
                if(this.pipes[i].x + this.pipes[i].width > this.birds[0].x){
                  nextGap = this.pipes[i].height/Mojo.height;
                  break;
                }
              }
            }
            this.birds.forEach((b,i)=>{
              if(!b.m5.dead){
                let inputs = [ b.y / Mojo.height, nextGap ];
                let [res] = this.gen[i].update(inputs);
                if(res>0.5){ b.g.flap() }
                b.g.update();
                if(b.g.isDead(Mojo.height, this.pipes)){
                  b.m5.dead=true;
                  this.alives--;
                }else{
                  b.rotation= Math.PI/2 * b.m5.gravity/20;
                  b.g.score+=1;
                }
              }else{
                b.visible=false;
              }
            });
            this.isItEnd() && this.resetNext();
            for(let p,i=0; i<this.pipes.length; ++i){
              p=this.pipes[i];
              p.x -= p.m5.speed;
              if(p.x+p.width < 0){
                this.pipes.splice(i, 1);
                _S.remove(p);
                i--;
              }
            }
            if(this.interval == 0){
              let deltaBord = 50*K,
                  pipeHoll = 120*K,
                  hollPos= Math.round(_.rand() * (Mojo.height - deltaBord * 2 - pipeHoll)) +  deltaBord,
                  ps= Pipes(K,[Mojo.width, 0, hollPos], [Mojo.width, hollPos+pipeHoll, Mojo.height]);
              ps.forEach(s=>{
                this.pipes.push(self.insert(s))
              });
            }
            if(++this.interval >= this.spawnInterval){
              this.interval = 0;
            }
          },
          isItEnd(){
            for(let i=0; i<this.birds.length;++i){
              if(!this.birds[i].m5.dead) return false;
            }
            return true;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.g.genText=_S.bmpText("",{fontName:UI_FONT,fontSize:24*K});
        this.insert(this.g.genText);
      },
      postUpdate(dt){
        this.g.bgs.forEach((s,i)=>{
          s.x= i * s.width - int(this.g.bgX % s.width);
          s.y=0;
        });
        this.g.tick();
        this.g.genText.text= `Generation: ${this.g.generation}`;
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bird.png","pipetop.png","pipebottom.png","background.png"],
    arena: {width: 500, height: 512},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


