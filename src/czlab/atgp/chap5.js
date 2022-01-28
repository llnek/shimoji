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
    const _g2d= window["io/czlab/mcfud/geo2d"]();
    const GA= window["io/czlab/mcfud/algo/NNetGA"](Core);
    const {Chromosome}=GA;


    const HALF_PI=Math.PI/2;
    const TWO_PI=Math.PI*2;
    //maximim amount of frames an action may be undertaken
    const MAX_ACTION_DURATION=   30;
    const MASS= 100;
    //approx gravity on moon
    const GRAVITY= 1.63;
    const THRUST= 350;
    const ROTATION=3;
    const GRAVITY_PER_TICK=GRAVITY/60;
    const THRUST_PER_TICK= THRUST/60;
    const ROTATION_PER_TICK= ROTATION/60;

    const ROTATION_PER_SECOND=   3;
    const THRUST_PER_SECOND=     350;

    const LANDER_SCALE=8;
    //this is how close to level the lander has to be when landing
    //to satisfy the landing criteria
    const ROTATION_TOLERANCE=Math.PI/16;
    //this is the maximum speed the ship can be travelling at
    //to satisfy the landing criteria
    const SPEED_TOLERANCE=0.5;
    //the is the maximum distance from the center of the landing pad
    //the ship must be to satisfy the landing criteria
    const DIST_TOLERANCE=10;

    const POP_SIZE=100;
    const SCALE=20;
    const CHROMO_LENGTH=30;
    const MUTATION_RATE=0.01;
    const CROSSOVER_RATE=0.7;
    const SCALING_FACTOR=SCALE;

    //this is the maximum amount of time the duration
    //of an action can be altered by the mutation operator
    const MAX_MUTATION_DURATION= MAX_ACTION_DURATION/2;
    //number of genomes to randomly choose and compare in
    //standard tournament selection
    //NUM_TO_COMPARE  5
    //maximum amount of generations the ga is allowed to run before
    //restarting
    const MAX_GENS= 500;

    //enumerate a type for each different action the Lander can perform
    const ActionType={
      rotate_left:0,
      rotate_right:1,
      thrust:2,
      non:3
    }

    //this defines the vertices for the lander shape
    function SPoint(x,y){
      return {x,y}
    }
    const PAD_VERTS = [SPoint(-25, 0), SPoint(25, 0),
                       SPoint(25, 8), SPoint(-25, 8)];
    const PAD_JSON= JSON.stringify(PAD_VERTS);

    //const NumLanderVerts = 30;
    const LANDER_VERTS = [//middle of lander
                     SPoint(-1, 0),
                     SPoint(1, 0),
                     SPoint(1, -0.5),
                     SPoint(-1, -0.5),
                     //top of lander
                     SPoint(-0.5, 0),
                     SPoint(-1, 0.3),
                     SPoint(-1, 0.7),
                     SPoint(-0.5, 1),
                     SPoint(0.5, 1),
                     SPoint(1, 0.7),
                     SPoint(1, 0.3),
                     SPoint(0.5, 0),
                     //legs
                     SPoint(-1, -0.4),
                     SPoint(-1.3, -0.8),
                     SPoint(-1.3, -1.2),
                     SPoint(-1.5, -1.2),
                     SPoint(-1.1, -1.2),
                     SPoint(-0.9, -0.5),
                     SPoint(-1.3, -0.8),

                     SPoint(1, -0.4),
                     SPoint(1.3, -0.8),
                     SPoint(1.3, -1.2),
                     SPoint(1.5, -1.2),
                     SPoint(1.1, -1.2),
                     SPoint(0.9, -0.5),
                     SPoint(1.3, -0.8),
                     //rocket
                     SPoint(-0.2, -0.5),
                     SPoint(-0.3, -0.8),
                     SPoint(0.3, -0.8),
                     SPoint(0.2, -0.5)];
    const LANDER_JSON=JSON.stringify(LANDER_VERTS);

    //and the vertices for the jet
    //const NumJetVerts = 5;
    const JET_VERTS = [SPoint(-0.1, -0.9),
                  SPoint(-0.2, -1.2),
                  SPoint(0, -1.6),
                  SPoint(0.2, -1.2),
                  SPoint(0.1, -0.9)];
    const JET_JSON= JSON.stringify(JET_VERTS);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function worldTransform(ship, points){
      if(0){
      //rotate -  remember, because the mapping mode is set so that the y
      //axis is pointing up, the rotation is reversed
      //and translate
      //now transform the vertices
      }else{
        _g2d.C2DMatrix.create().
        translate(ship.x, ship.y).
        rotateCCW(-ship.rotation).
        scale(SCALE,SCALE).
        transformPoints(points);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function worldTransformPad(points){
      _g2d.C2DMatrix.create().translate(_G.padPos.x, _G.padPos.y).scale(1,1).transformPoints(points);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class SGenome extends Chromosome{
      constructor(actions){
        super([],new GA.NumFitness(0));
        for(let i=0;i<actions;++i)
          this.genes.push(new SGene());
      }
    }

    class SGene{
      constructor(act,dur){
        if(arguments>0){
          this.action = act;
          this.duration = dur;
        }else{
          this.action = _.randInt2(0,3);
          //duration the action is applied measured in ticks
          this.duration = _.randInt2(1, MAX_ACTION_DURATION);
        }
      }
      eq(b){
        return this.action == b.action && this.duration == b.duration;
      }
    }

    function testForImpact(verts){
      for(let v=0; v<verts.length; ++v){
        if(verts[v].y> Mojo.height-55){
          return true;
        }
      }
      return false;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function decodeActions(ship, chromo){
      ship.g.vecActions.length=0;
      chromo.genes.forEach((g,i)=>{
        for(i=0; i<g.duration; ++i)
          ship.g.vecActions.push(g.action);
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function reset(ship, padPos){
      _G.padPos = {x: padPos.x, y: padPos.y};
      ship.rotation  = Math.PI;
      ship.m5.vel[0]=0;
      ship.m5.vel[1]=0;
      ship.g.tick    = 0;
      ship.g.fitness= new GA.NumFitness(0);
      ship.g.checkedIfLanded = false;
      ship.g.jetOn=false;
      if(ship.g.x !== undefined){
        ship.x=ship.g.x;
        ship.y=ship.g.y;
      }
    }

    //-----------------------CalculateFitness-----------------------------
    //  calculates a fitness score based on how far the lander is away
    //  from the pad, what speed it's travelling when it reaches ground
    //  level and its angle at touchdown.
    //-------------------------------------------------------------------
    function calcFit(ship){
      //calculate distance from pad
      let distFromPad = Math.abs(_G.padPos.x - ship.x),
          distFit = Mojo.width-distFromPad,
          //ship speed
          speed = Math.sqrt(ship.m5.vel[0]*ship.m5.vel[0] + ship.m5.vel[1]*ship.m5.vel[1]),
          //fitness due to rotation
          rotFit = 1/(Math.abs(ship.rotation)+1),
          //fitness due to time in air
          fitAirTime = ship.g.tick/(speed+1);
      //calculate fitness
      let fit= distFit + 400*rotFit + 4* fitAirTime;
      //check if we have a successful landing
      if(distFromPad < DIST_TOLERANCE &&
         speed < SPEED_TOLERANCE &&
         Math.abs(ship.rotation)< ROTATION_TOLERANCE){
        fit= Infinity;
      }
      ship.g.fitness.update(fit);
      return fit;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function create(){
      return new SGenome(CHROMO_LENGTH)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mutate(genes){
      genes.forEach(g=>{
        if(_.rand() < _G.params.mutationRate){
          g.action = _.randInt(4)
        }
        if(_.rand() < _G.params.mutationRate/2){
          g.duration = _M.clamp(0, MAX_ACTION_DURATION,
                                g.duration + _.randMinus1To1()*MAX_MUTATION_DURATION)
        }
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function landedOK(ship){
      //calculate distance from pad
      let distFromPad = Math.abs(_G.padPos.x - ship.x);
      //calculate speed of lander
      let speed = Math.sqrt(ship.m5.vel[0]*ship.m5.vel[0] + ship.m5.vel[1]*ship.m5.vel[1]);
      //check if we have a successful landing
      if(distFromPad    < DIST_TOLERANCE       &&
         speed          < SPEED_TOLERANCE      &&
         Math.abs(ship.rotation)      < ROTATION_TOLERANCE){
        return true;
      }
      return false;
    }

    //----------------------UpdateShipFromAction---------------------------
    //  this is the main workhorse. It reads the ships decoded string of
    //  actions and performs them, updating the lander accordingly. It also
    //  checks for impact and updates the fitness score.
    //----------------------------------------------------------------------
    function updateShip(self,s,cur){
      if(s.g.checkedIfLanded){ return false }
      //check that we still have an action to perform. If not then
      //just let the lander drift til it hits the ground
      let act= s.g.tick >= s.g.vecActions.length? ActionType.non : s.g.vecActions[s.g.tick++];
      //switch the jet graphic off
      s.g.jetOn = false;
      switch(act){
        case ActionType.rotate_left:
          s.rotation -= ROTATION_PER_TICK;
          if(s.rotation < -Math.PI) s.rotation += PI2;
        break;
        case ActionType.rotate_right:
          s.rotation += ROTATION_PER_TICK;
          if(s.rotation > PI2) s.rotation -= PI2;
        break;
        case ActionType.thrust:{
          //the lander's acceleration per tick calculated from
          //the force the thruster exerts and the lander's mass
          let acc = THRUST_PER_TICK/MASS;
          //resolve the acceleration vector into its x, y components
          //and add to the lander's velocity vector
          s.m5.vel[0] += acc * Math.sin(s.rotation);
          s.m5.vel[1] += acc * Math.cos(s.rotation);
          //switch the jet graphic on
          s.g.jetOn = true;
        }
        break;
        case ActionType.non:
        break;
      }
      //now add in the gravity vector
      s.m5.vel[1] += GRAVITY_PER_TICK;
      //update the lander's position
      s.x += s.m5.vel[0];
      s.y += s.m5.vel[1];
      //bounds checking
      if(s.x > Mojo.width){ s.x = 0 }
      if(s.x < 0){ s.x = Mojo.width }
      //now we check to see if the lander has crashed or landed
      //create a copy of the landers verts before we transform them
      let out=JSON.parse(LANDER_JSON);
      //transform the vertices
      worldTransform(s, out);
      if(1 || cur==_G.best){
        self.drawLander(s);
      }
      //if we are lower than the ground then we have finished this run
      if(testForImpact(out)){
        //check if user has landed ship
        if(!s.g.checkedIfLanded){
          let v= calcFit(s);
          //console.log("fitness ==== " + v);
          s.g.checkedIfLanded = true;
          return false;
        }
      }
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function updatePlayer(dt,player){
      if(player.g.checkedIfLanded){ return }
      //switch the jet graphic off
      player.g.jetOn = false;
      //test for user input and update accordingly
      if(_I.keyDown(_I.SPACE)){
        //the lander's acceleration per tick calculated from the force the
        //thruster exerts, the lander's mass and the time elapsed since the
        //last frame
        let acc = (THRUST_PER_SECOND * dt) / MASS;
        //resolve the acceleration vector into its x, y components
        //and add to the lander's velocity vector
        player.m5.vel[0] += acc * Math.sin(player.rotation);
        player.m5.vel[1] += acc * Math.cos(player.rotation);
        //switch the jet graphic on
        player.g.jetOn = true;
      }
      if(_I.keyDown(_I.LEFT)){
        player.rotation -= ROTATION_PER_SECOND * dt;
        if(player.rotation < -Math.PI) player.rotation += PI2;
      }
      if(_I.keyDown(_I.RIGHT)){
        player.rotation += ROTATION_PER_SECOND * dt;
        if(player.rotation > PI2) player.rotation -= PI2;
      }
      //now add in the gravity vector
      player.m5.vel[1] += GRAVITY * dt;
      //update the lander's position
      player.x += player.m5.vel[0] * dt * SCALING_FACTOR;
      player.y += player.m5.vel[1] * dt * SCALING_FACTOR;
      //bounds checking
      if(player.x> Mojo.width){ player.x=0 }
      if(player.x<0){ player.x = Mojo.width }
      //now we check to see if the lander has crashed or landed
      //create a copy of the landers verts before we transform them
      //transform the vertices
      let out= JSON.parse(LANDER_JSON);
      worldTransform(player,out);
      //if we are lower than the ground then we have finished this run
      if(testForImpact(out)){
        //check if user has landed ship
        if(!player.g.checkedIfLanded){
          if(landedOK(player)){
            console.log("YAY    !!!!!!!!!!!!!")
          }else{
            console.log("DEAD   !!!!!!!!!!!!!!!")
          }
          player.g.checkedIfLanded = true;
        }
      }
    }

    let bAllFinished=false;
    let extra={
      maxCycles:1,
      gen:0,
      calcFit(){
        return new GA.NumFitness(0)
      },
      create,
      mutate,
      crossOver(a,b){
        return GA.crossOverRND(a,b)
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            _G.params= GA.config({mutationRate:MUTATION_RATE,crossOverRate: CROSSOVER_RATE});
            _G.padPos={x: 50 + _.rand() * (Mojo.width-100), y: Mojo.height-50};
            _G.batchCount=1;
            self.insert(this.gfx=_S.graphics());
            if(1){
              let px=50 + _.rand() * (Mojo.width-100), py= 50;
              _G.vecShips=_.fill(POP_SIZE, ()=> this.makeShip(px,py));
              _G.vecPop= GA.runGACycle(POP_SIZE,extra)[1];
              _G.vecShips.forEach((s,i)=> decodeActions(s, _G.vecPop[i]));
              _G.gen=0;
              _G.best=0;
            }else{
              _G.player= _S.sprite("lander.png");
              _G.player.visible=false;
              _G.player.x=_.rand()*Mojo.width;
              _G.player.y=50;
              _G.player.g.jetOn=false;
              _G.player.g.checkIfLanded=false;
              reset(_G.player,_G.padPos);
            }
          },
          makeShip(px,py){
            let s= _S.sprite("lander.png");
            s.visible=false;
            s.g.x=px;
            s.g.y=py;
            s.x=px;
            s.y=py;
            s.g.tick=0;
            s.g.jetOn=false;
            s.g.checkedIfLanded=false;
            s.g.vecActions=[];
            s.g.fitness=new GA.NumFitness(0);
            return s;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      drawLander(ship){
        let vs= JSON.parse(LANDER_JSON);
        let gfx=this.g.gfx;

        worldTransform(ship,vs);

        gfx.lineStyle(4,_S.color("white"));
        //draw the vertices for the landers base
        gfx.moveTo(vs[0].x, vs[0].y);
        for(let vert=1; vert<4; ++vert){
          gfx.lineTo(vs[vert].x, vs[vert].y);
        }
        gfx.lineTo(vs[0].x, vs[0].y);

        //landers top
        gfx.moveTo(vs[4].x, vs[4].y);

        for(let vert=5; vert<12; ++vert){
          gfx.lineTo(vs[vert].x, vs[vert].y);
        }

        //left leg
        gfx.moveTo(vs[12].x, vs[12].y);
        gfx.lineTo(vs[13].x, vs[13].y);
        gfx.lineTo(vs[14].x, vs[14].y);
        gfx.moveTo(vs[15].x, vs[15].y);
        gfx.lineTo(vs[16].x, vs[16].y);
        gfx.moveTo(vs[17].x, vs[17].y);
        gfx.lineTo(vs[18].x, vs[18].y);

        //right leg
        gfx.moveTo(vs[19].x, vs[19].y);
        gfx.lineTo(vs[20].x, vs[20].y);
        gfx.lineTo(vs[21].x, vs[21].y);
        gfx.moveTo(vs[22].x, vs[22].y);
        gfx.lineTo(vs[23].x, vs[23].y);
        gfx.moveTo(vs[24].x, vs[24].y);
        gfx.lineTo(vs[25].x, vs[25].y);

        //the burner
        gfx.moveTo(vs[26].x, vs[26].y);
        for(let vert=27; vert<30; ++vert){
          gfx.lineTo(vs[vert].x, vs[vert].y);
        }

        //if the last action was thrust then we need to draw the jet from the burner
        if(ship.g.jetOn){
          vs=JSON.parse(JET_JSON);
          worldTransform(ship,vs);
          gfx.lineStyle(4,_S.color("orange"));
          gfx.moveTo(vs[0].x, vs[0].y);
          for(let vert=1; vert<vs.length; ++vert){
            gfx.lineTo(vs[vert].x, vs[vert].y);
          }
        }
      },
      drawPad(){
        let gfx=this.g.gfx,
            out=JSON.parse(PAD_JSON);
        worldTransformPad(out);
        gfx.lineStyle(4,_S.color("yellow"));
        //draw the lines which describe the landing pad
        gfx.moveTo(out[0].x, out[0].y);
        for(let vert=1; vert<4; ++vert)
          gfx.lineTo(out[vert].x, out[vert].y);
        gfx.lineTo(out[0].x, out[0].y-1);
      },
      doRun(){
        //this is set if all the landers have finished performing all their actions
        if(!bAllFinished){
           bAllFinished = true;
          _G.vecShips.forEach((s,i)=>{
            //ship is done or not?
            if(updateShip(this,s,i)) bAllFinished = false;
           });
         }else{
           //grab the updated fitness scores and insert into the GA
           _G.best=0;
           let bestScoreSoFar = 0;
           _G.vecPop.forEach((p,i)=>{
             p.fitness.update(_G.vecShips[i].g.fitness.score());
             //keep a track of the fittest lander each generation
             if(p.fitness.score() > bestScoreSoFar){
               bestScoreSoFar = p.fitness.score();
               _G.best = i;
             }
             //check for success
             if(p.fitness.score() === Infinity && !_G.success){
               _G.success = true;
               this.onSuccess();
             }
             //reset the landers
             reset(_G.vecShips[i],_G.padPos);
           });
           //reset finished flag
           bAllFinished = false;
           if(!_G.success){
             //do another run
             let [x,pop]=GA.runGACycle(_G.vecPop,extra);
             _.append(_G.vecPop,pop,true);
             //decode actions for the landers
             _G.vecPop.forEach((p,i)=>{
               decodeActions(_G.vecShips[i],p)
             });
             _G.gen++;
           }
        }
        return true;
      },
      onSuccess(){
        //make sure rendering toggles are set so we can see the successful
        //ship land in all its graceful glory
        _G.showBest = true;
        console.log("Landed successfully!");
      },
      nextBatch(){
        console.log("new batch====>"+_G.batchCount++);
        //change position of landing pad
        let pp= {x: 50 + _.rand() * (Mojo.width-100), y: Mojo.height-50};
        //insert the landers genomes
        _G.vecShips.forEach((s,i)=>{
          reset(s,pp);
          decodeActions(s, _G.vecPop[i]);
        });
        _G.gen=0;
        _G.best=0;
        _G.success=false;
      },
      postUpdate(dt){
        this.g.gfx.clear();
        if(_G.player){
          updatePlayer(dt,_G.player);
          this.drawLander(_G.player);
        }else{
          if(_G.gen>=MAX_GENS){
            this.nextBatch();
          }
          this.doRun();
        }
        this.drawPad();
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["lander.png"],
    arena: {width: 1680, height: 1050},
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


