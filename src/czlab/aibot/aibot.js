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
  const int=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const geo=window["io/czlab/mcfud/geo2d"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Core= window["io/czlab/mcfud/core"]();
    const GA= window["io/czlab/mcfud/algo/NEAT"](Core);
    const NumFIT= GA.NumFitness;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#fff20f"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    const NUM_INPUTS=10+1,//5,
          NUM_OUTPUTS=2,
          NUM_ELITES=6,
          NUM_HIDDEN=1,
          NEURONS_HIDDENLAYER=10;

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const CrossOverRate = 0.7,
          MutationRate  = 0.1,
          MineScale     = 12,
          NumTicks      = 1500;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const HALF_PI = Math.PI/2,
          QUAD_PI = Math.PI/4,
          PI2  = Math.PI*2,
          StartEnergy = 0,//20,
          MaxTurnRate = 0.2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSensors(s){
      let c=[s.x,s.y];
      //let L=[s.g.H2,s.g.D2,s.g.W2,s.g.D2,s.g.H2];
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
      return _V.set(s,int((g.x1+g.x2)/2), int((g.y1+g.y2)/2));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSWP(brain, scene){
      let s= _S.spriteFrom("tank.png");
      _S.centerAnchor(s);
      _S.sizeXY(s,_.evenN(_G.tileW*0.9),_.evenN(_G.tileH*0.9));
      let h2=s.height/2;
      let w2=s.width/2;
      let d=Math.sqrt(w2*w2+h2*h2);

      s.rotation= 0;//_.rand() * PI2;
      s.g.diag= d * 1.2;
      s.g.diagRatio= d/s.g.diag;
      randPos(s);

      _.inject(s.g,{
        collided:false,
        W2:w2,
        H2:h2,
        lTrack: 0,//0.16,
        rTrack: 0,//0.16,
        fitness: NumFIT(0),
        lookAt: {x:Math.cos(s.rotation),
                 y: Math.sin(s.rotation)},
        cmap: CMapper(),
        spinBonus: 0,
        collisionBonus: 0,
        nnet:brain,
        reset(){
          this.fitness = NumFIT(0);
          s.rotation= 0;//_.rand() * PI2;
          randPos(s);
          this.lookAt.x= Math.cos(s.rotation);
          this.lookAt.y= Math.sin(s.rotation);
          this.cmap.reset();
          this.spinBonus = 0;
          this.collisionBonus = 0;
        },
        testSensors(input){
          this.collided = false;
          for(let res,w,ss=mkSensors(s),i=0;i<ss.length;++i){
            w=ss[i];
            res=null;
            if(1)
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
            let v= this.cmap.ticksLingered(w[1][0],w[1][1]);
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
          this.fitness = NumFIT(this.fitness.score()+ this.cmap.numCellsVisited());// + this.spinBonus + this.collisionBonus
        },
        update(){
          let rotForce,output = this.nnet.update(this.testSensors([]));
          this.lTrack = output[0];
          this.rTrack = output[1];

          rotForce = this.lTrack - this.rTrack;
          // clamp rotation
          rotForce = rotForce < -MaxTurnRate ? -MaxTurnRate : (rotForce > MaxTurnRate?MaxTurnRate : rotForce);
          s.rotation += rotForce;

          this.lookAt.x = Math.cos(s.rotation);
          this.lookAt.y = Math.sin(s.rotation);

          if(!this.collided){
            s.m5.speed = this.lTrack + this.rTrack;
            _V.add$(s, _V.mul(this.lookAt, s.m5.speed));
          }

          let rotationTolerance = 0.03;
          if(-rotationTolerance < rotForce && rotForce < rotationTolerance){
            this.spinBonus += 1;
          }

          if(!this.collided)
			      this.collisionBonus += 1;
          else
            s.rotation += _.randSign()* _.rand()* QUAD_PI;

          //s.x > _G.arena.x2? respawn(s): (s.x < _G.arena.x1? respawn(s): null);
          //s.y > _G.arena.y2? respawn(s): (s.y < _G.arena.y1? respawn(s): null);

          s.x > _G.arena.x2? s.x=_G.arena.x2 : (s.x<_G.arena.x1? s.x=_G.arena.x1 : null);
          s.y > _G.arena.y2? s.y=_G.arena.y2 : (s.y<_G.arena.y1? s.y=_G.arena.y1 : null);

          this.cmap.update(s.x,s.y);
          //console.log("numcells=="+this.cmap.numCellsVisited());

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

    const NumSweepers=50;
    let ticks;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randX(){ return _.randInt2(_G.arena.x1,_G.arena.x2) }
    function randY(){ return _.randInt2(_G.arena.y1,_G.arena.y2) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CMapper(){
      let grid= JSON.parse(JSON.stringify(_G.grid));
      let bbox=_S.gridBBox(0,0,grid);
      let {tileW,tileH}=_G;
      let px= -1, py=-1;
      grid.forEach(r=>r.forEach(c=> c.visits=0));
      /////
      function toCell(x,y){
        let cy=int((y-bbox.y1)/tileH);
        let cx=int((x-bbox.x1)/tileW);
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

    const ROWS=20, COLS=20;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("NEAT AiBot", TITLE_FONT,100*K);
            _S.tint(s,C_TITLE);
            _V.set(s, Mojo.width/2, Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,64*K);
            _V.set(s,Mojo.width/2,Mojo.height*0.7);
            t=_F.throb(s,0.747,0.747);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY, ()=> _Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb);
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

            let color="#b1c92c";//"#c4db44";//"#dbb744";
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
                grid=_S.gridXY([ROWS,COLS],0.9,0.9,out);
            let g0= grid[0][0];
            _S.drawGridBox(out,1,"white",gfx);
            _S.drawGridLines(0,0,grid,1,"grey",gfx);
            self.insert(gfx);
            this.initBlocks(grid);
            _.inject(_G,{
              arena:out,
              grid,
              tileW: g0.x2-g0.x1,
              tileH: g0.y2-g0.y1
            });
            //////
            gaPop= new GA.NeatGA(NumSweepers, NUM_INPUTS, NUM_OUTPUTS);
            let vecSweepers= gaPop.createPhenotypes().map(b=> mkSWP(b,self));
            _.assert(vecSweepers.length==NumSweepers, "Bad pop size");
            vecSweepers.forEach(s=> self.insert(s));
            this.dbg= self.insert(_S.graphics());
            ticks= 0;
            this.letThemRoam=()=>{
              vecSweepers.forEach(v=> v.g.update())
            };
            this.reGen=()=>{
              vecSweepers.forEach(v=> v.g.endOfRunCalc());
              gaPop.epoch(vecSweepers.map(v=> v.g.fitness.score())).forEach((b,i)=>{
                vecSweepers[i].g.nnet=b;
                vecSweepers[i].g.reset();
              });
              ticks = 0;
              //best are up front
              for(let i=0;i<10;++i){
                vecSweepers[i].tint=_S.SomeColors.magenta;
              }
            }
            ///
            self.insert(_S.bboxFrame(out));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.menu= _S.sprite("menu.png");
        this.g.menu.anchor.x=1;
        this.g.menu.m5.press=()=>{
          _Z.runEx("Splash")
        };
        _V.set(this.g.menu, Mojo.width,0);
        this.insert(_I.mkBtn(this.g.menu));
      },
      postUpdate(dt){
        this.g.dbg.clear();
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
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }

  }));

})(this);

