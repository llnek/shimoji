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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const geo=window["io/czlab/mcfud/geo2d"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const GA= window["io/czlab/mcfud/algo/NEAT"](
    window["io/czlab/mcfud/core"]()
    );
    const NumFIT= GA.NumFitness;
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      //C_TITLE=_S.color("#fff20f"),
      C_BLUE=_S.color("#3e9ad1"),
      C_TITLE=_S.color("#e5e61e"),//"#c93d74"),//"#d1753e"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#bde61e"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const NUM_INPUTS=10+1,//5,
          NUM_OUTPUTS=2,
          NUM_ELITES=10;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const NumSecs= 25,
          NumTicks=1500;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const HALF_PI = Math.PI/2,
          QUAD_PI = Math.PI/4,
          PI2  = Math.PI*2,
          MaxTurnRate = 0.2;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const ROWS=20, COLS=20;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //sensors to detect obstacles
    function mkSensors(s){
      let c=[s.x,s.y];
      return [s.rotation - HALF_PI,
              s.rotation - QUAD_PI,
              s.rotation,
              s.rotation + QUAD_PI,
              s.rotation + HALF_PI].map((a,i)=>{
                return [c,_V.add(c, _V.mul([Math.cos(a),Math.sin(a)],s.g.diag))]
              });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function respawn(s){
      let ok;
      while(1){
        _V.set(s, randX(), randY());
        ok=true;
        for(let o,i=0;i<_G.obstacles.length;++i){
          o=_G.obstacles[i];
          if(_S.hitTest(o,s)){
            ok=false;
            break;
          }
        }
        if(ok)
          break;
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randPos(s){
      let g,n=_.randInt2(0,3);
      n=10;
      switch(n){
        case 0: g=_G.grid[6][11];break;
        case 1: g=_G.grid[7][11];break;
        case 2: g=_G.grid[14][7];break;
        default: g=_G.grid[15][7];break;
      }
      return _V.set(s,_M.ndiv(g.x1+g.x2,2), _M.ndiv(g.y1+g.y2,2));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkBot(brain, scene){
      let s= _S.spriteFrom("tank.png");
      _S.anchorXY(s,0.5);
      _S.sizeXY(s,_.evenN(_G.tileW*0.9),_.evenN(_G.tileH*0.9));
      let h2=s.height/2,
        w2=s.width/2,
        d=Math.sqrt(w2*w2+h2*h2);
      s.rotation= 0;
      s.g.diag= d * 1.2;
      s.g.diagRatio= d/s.g.diag;
      randPos(s);
      s.m5.heading= {x:Math.cos(s.rotation),
                     y: Math.sin(s.rotation)};
      _.inject(s.g,{
        collided:false,
        W2:w2,
        H2:h2,
        lTrack: 0,
        rTrack: 0,
        fitness: NumFIT(0),
        mmap: MapMemory(),
        spinBonus: 0,
        collisionBonus: 0,
        nnet:brain,
        reset(){
          this.fitness = NumFIT(0);
          s.rotation= 0;
          randPos(s);
          _V.set(s.m5.heading,Math.cos(s.rotation), Math.sin(s.rotation));
          this.mmap.reset();
          this.spinBonus = 0;
          this.collisionBonus = 0;
        },
        testSensors(input){
          this.collided = false;
          for(let res,w,ss=mkSensors(s),i=0;i<ss.length;++i){
            w=ss[i];
            res=null;
            for(let o,p,j=0;j<_G.obstacles.length;++j){
              o=_G.obstacles[j];
              p=geo.bodyWrap(_S.toPolygon(o),o.x,o.y);
              res= geo.hitTestLinePolygon(w[0],w[1],p);
              if(res[0]){
                break;
              }else{ res=null }
            }
            if(res && res[0]){
              _.assert(0<= res[1]&&res[1]<=1,"bad sensor result");
              if(res[1]< s.g.diagRatio){
                this.collided=true;
              }
              //console.log("c========"+ res[1]);
              input.push(res[1]);
            }else{
              input.push(-1);
            }
            let v= this.mmap.ticksLingered(w[1][0],w[1][1]);
            //console.log("v===="+v);
            if(v==0){
              input.push(-1)
            }else if(v<10){
              input.push(0)
            }else if(v<20){
              input.push(0.2)
            }else if(v<30){
              input.push(0.4)
            }else if(v<50){
              input.push(0.6)
            }else if(v<80){
              input.push(0.8)
            }else{
              input.push(1)
            }
          }
          input.push(this.collided?1:0);
          //console.log("input length====="+input.length);
          return input;
        },
        endOfRunCalc(){
          this.fitness = NumFIT(this.fitness.score()+ this.mmap.numCellsVisited());
        },
        update(){
          let rotForce,output = this.nnet.update(this.testSensors([]));
          this.lTrack = output[0];
          this.rTrack = output[1];

          rotForce = this.lTrack - this.rTrack;
          // clamp rotation
          rotForce = rotForce < -MaxTurnRate ? -MaxTurnRate : (rotForce > MaxTurnRate?MaxTurnRate : rotForce);
          s.rotation += rotForce;

          _V.set(s.m5.heading, Math.cos(s.rotation), Math.sin(s.rotation));

          if(!this.collided){
            s.m5.speed = this.lTrack + this.rTrack;
            _V.add$(s, _V.mul(s.m5.heading, s.m5.speed));
          }

          let rotationTolerance = 0.03;
          if(-rotationTolerance < rotForce && rotForce < rotationTolerance){
            this.spinBonus += 1;
          }

          if(!this.collided)
			      this.collisionBonus += 1;
          else
            s.rotation += _.randSign()* _.rand()* QUAD_PI;

          s.x > _G.arena.x2? s.x=_G.arena.x2 : (s.x<_G.arena.x1? s.x=_G.arena.x1 : 0);
          s.y > _G.arena.y2? s.y=_G.arena.y2 : (s.y<_G.arena.y1? s.y=_G.arena.y1 : 0);

          this.mmap.update(s.x,s.y);
          //console.log("numcells=="+this.mmap.numCellsVisited());

          //debug show sensors
          if(0){
            scene.g.dbg.lineStyle(1, _S.color("red"));
            mkSensors(s).forEach(p=>{
              scene.g.dbg.moveTo(p[0][0], p[0][1]);
              scene.g.dbg.lineTo(p[1][0], p[1][1]);
              scene.g.dbg.drawCircle(p[1][0], p[1][1], 2);
            });
            //console.log("colll==="+this.collided);
          }
          return true;
        }
      });
      return s;
    }

    const NumBots=50;
    let ticks;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randX(){ return _.randInt2(_G.arena.x1,_G.arena.x2) }
    function randY(){ return _.randInt2(_G.arena.y1,_G.arena.y2) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function MapMemory(){
      let grid= JSON.parse(JSON.stringify(_G.grid));
      let bbox=_S.gridBBox(0,0,grid);
      let {tileW,tileH}=_G;
      let px= -1, py=-1;
      grid.forEach(r=>r.forEach(c=> c.visits=0));
      /////
      function toCell(x,y){
        let cy=_M.ndiv(y-bbox.y1,tileH);
        let cx=_M.ndiv(x-bbox.x1,tileW);
        if(cy<0)
          cy=0;
        else if(cy>=grid.length) cy=grid.length-1;
        if(cx<0)
          cx=0;
        else if(cx>=grid[0].length) cx=grid[0].length-1;

        return grid[cy][cx];
      }
      return{
        update(x,y){
          if(x<bbox.x1 || x>bbox.x2 ||
             y<bbox.y1 || y>bbox.y2){
          }else{
            toCell(x,y).visits += 1
          }
        },
        ticksLingered(x,y){
          return (x<bbox.x1 || x>bbox.x2 ||
                  y<bbox.y1 || y>bbox.y2) ? 999 : toCell(x,y).visits
        },
        reset(){
          grid.forEach(r=> r.forEach(g=> g.visits=0 ))
        },
        numCellsVisited(){
          let total = 0;
          grid.forEach(r=> r.forEach(g=>{
            if(g.visits>0) total +=1
          }));
          return total;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("NEAT/Smart Bot", TITLE_FONT,84*K);
            _S.tint(s,C_TITLE);
            _V.set(s, Mojo.width/2, Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,56*K);
            _V.set(s,Mojo.width/2,Mojo.height*0.5);
            t=_F.throb(s,0.747,0.747);
            _S.oneOffClick("click.mp3",()=>{
              _S.tint(s,C_GREEN);
              _F.remove(t);
              _F.tweenScale(self,_F.EASE_OUT_SINE,0,0,2*60).onComplete=()=>{
                _Z.runEx("PlayGame")
              };
            });
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();

        let gaPop,
            splitPoints,
            numWeightsInNN;

        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initBlocks(grid){
            let g= grid[0][0],
              b, out=[],
              tw=g.x2-g.x1,
              th=g.y2-g.y1;
            //let color="#b1c92c";//"#c4db44";//"#dbb744";
            let color="#737350";
            //square
            b= _S.rect(5*tw,5*th,color);
            _S.uuid(b,"o-square");
            g=grid[ROWS-6-3][COLS-6-3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            // 2 rects
            b= _S.rect(4*tw,8*th,color);
            _S.uuid(b,"o-vrect");
            g=grid[2][3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            b= _S.rect(6*tw,3*th,color);
            _S.uuid(b,"o-hrect");
            g=grid[2][3];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            //iso-tri
            b= _S.triangle(5*tw,4*th,0.5,color,color);
            _S.uuid(b,"isotrig");
            g=grid[3][COLS-7];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));

            //2 tri
            b= _S.triangle(5*tw,2*th,0,color,color);
            _S.uuid(b, "rangtri-up");
            g=grid[ROWS-6][0];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));
            //flipped
            b= _S.triangle(5*tw,-2*th,0,color,color);
            _S.uuid(b, "rangtri-down");
            g=grid[ROWS-4][0];
            _V.set(b,g.x1,g.y1);
            out.push(self.insert(b));
            //
            return _G.obstacles=out;
          },
          initLevel(){
            let out={},
                g,gfx=_S.graphics(),
                grid=_S.gridXY([ROWS,COLS],0.8,0.8,out);
            let g0= grid[0][0];
            _S.drawGridBox(out,1,"white",gfx);
            _S.drawGridLines(0,0,grid,1,"grey",gfx);
            self.insert(gfx);
            this.initBlocks(grid);
            _.inject(_G,{
              arena:out,
              gen:1,
              grid,
              tileW: g0.x2-g0.x1,
              tileH: g0.y2-g0.y1
            });
            //////
            gaPop= new GA.NeatGA(NumBots, NUM_INPUTS, NUM_OUTPUTS);
            let vecBots= gaPop.createPhenotypes().map(b=> mkBot(b,self));
            _.assert(vecBots.length==NumBots, "Bad pop size");
            vecBots.forEach(s=> self.insert(s));
            this.dbg= self.insert(_S.graphics());
            ticks= 0;
            this.letThemRoam=()=> vecBots.forEach(v=> v.g.update());
            this.reGen=()=>{
              vecBots.forEach(v=> v.g.endOfRunCalc());
              gaPop.epoch(vecBots.map(v=> v.g.fitness.score())).forEach((b,i)=>{
                vecBots[i].g.nnet=b;
                vecBots[i].g.reset();
              });
              _G.gen+=1;
              ticks = 0;
              //best are up front
              for(let i=0;i<NUM_ELITES;++i){
                vecBots[i].tint=_S.BtnColors.magenta;
              }
            }
            ///
            return self.insert(_S.bboxFrame(out));
          },
          initHud(){
            if(1){
              let s = _S.scaleBy(_S.sprite("menu.png"), 0.8*K,0.8*K);
              s.anchor.x=1;
              s.m5.press=_S.btnPress(s, _S.BtnColors.green,"white","click.mp3",()=>{
                _Z.runEx("Splash")
              });
              self.insert(_I.mkBtn( _V.set(s, Mojo.width,0)));
            }
            if(1){
              let s=_S.bmpText("0",UI_FONT,24*K);
              this.genMsg=self.insert(s);
              s=_S.bmpText("0",UI_FONT,24*K);
              _S.anchorXY(s,0.5);
              _S.pinAbove(_G.arena,s,s.height*1.5);
              return this.timeMsg=self.insert(s);
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() && this.g.initHud();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      },
      postUpdate(dt){
        this.g.genMsg.text=`Generation: ${_G.gen}`;
        this.g.dbg.clear();
        ++ticks;
        this.g.timeMsg.text= `Training: ${int(100*ticks/NumTicks)}%`;
        if(++ticks<NumTicks){
          this.g.letThemRoam()
        }else{
          this.g.reGen()
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["tank.png","menu.png","click.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }

  }));

})(this);


