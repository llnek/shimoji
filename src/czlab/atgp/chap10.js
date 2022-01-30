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

    const ActionType={
      thrust_left:0,
      thrust_right:1,
      thrust_up:2,
      drift:3
    };

    const BSPEED= 4,
          BSCALE=3,
          BYSCALE=3*BSCALE,
          FPS= 60,
          MASS=100,
          ASCALE=3,
          NumHidden= 1,
          NeuronsPerHiddenLayer= 15,
          activationResponse= 0.2,
          MutationRate= 0.2,
          MaxPerturbation= 1,
          POPSIZE= 200,
          PercentBestToSelectFrom= 0.2,
          NumOnScreen= 10,
          MAX_BULLETS= 3,
          NumTourneyCompetitors= 10,
          PreSpawns= 200,
          MaxTranslationPerTick = 2.5,
          GSCALE= 6,
          FIRING_RATE=60,//15,
          MaxThrustLateral      = 30,
          MaxThrustVertical     = 20,
          MaxVelocity           = 2,
          AlienMass             = 100,
          AlienScale            = 3,
          GRAVITY=  1.63,
          GravityPerTick= GRAVITY/60;

    function SPoint(x,y){ return {x,y} }

    //const BULLET_VERTS=[SPoint(-1,-1), SPoint(0,1), SPoint(1,-1)];
    const BULLET_VERTS=[SPoint(-1,-1),SPoint(-1,1), SPoint(1,1), SPoint(1,-1)];
    const BULLET_JSON=JSON.stringify(BULLET_VERTS);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class CBullet{
      constructor(){
        this.pos=[0,30];
        this.bbox={};
        this.active=false;
      }
      draw(gfx){
        let out=JSON.parse(BULLET_JSON);
        _g2d.C2DMatrix.create().
          translate(this.pos[0],this.pos[1]).
          //rotateCCW(-Math.PI).
          scale(BSCALE,BYSCALE).
          transformPoints(out);
        gfx.lineStyle(2,_S.color("green"));
        gfx.moveTo(out[0].x, out[0].y);
        for(let v=0; v<out.length; ++v)
          gfx.lineTo(out[v].x, out[v].y);
        gfx.lineTo(out[0].x, out[0].y);
      }
      switchOn(posX){
        //activate the bullet
        this.pos[0]  = posX;
        this.pos[1] = Mojo.height-35;
        this.active = true;
        //setup its bounding box
        this.bbox.left  = this.pos[0] - BSCALE;
        this.bbox.right = this.pos[0] + BSCALE;
        this.bbox.top   = this.pos[1] + BYSCALE;
        this.bbox.bottom= this.pos[1] - BYSCALE;
      }
      update(){
        if(this.active){
          this.pos[1] -= BSPEED;
          if(this.pos[1] <0)
            this.active = false;
        }
        //update its bounding box
        this.bbox.top    -= BSPEED;
        this.bbox.bottom -= BSPEED;
      }
    }

    const GUN_VERTS=[SPoint(2,2), SPoint(2,0), SPoint(-2,0), SPoint(-2,2),
                     SPoint(-1,2), SPoint(-1,3), SPoint(1,3), SPoint(1,2)];
    const GUN_JSON=JSON.stringify(GUN_VERTS);

    //how long it will perform each action for
    let gDuration = 0;
    let gAction   = 0;
    class CGun{
      constructor(){
        this.ticksToNextBullet=FIRING_RATE;
        this.autoGun=true;
        this.pos = [Mojo.width/2, Mojo.height-20];
        this.vecBullets=_.fill(MAX_BULLETS,()=> new CBullet());
      }
      pause(){
        this.autoGun=false;
      }
      draw(gfx){
        let out=JSON.parse(GUN_JSON);
        _g2d.C2DMatrix.create().
          translate(this.pos[0],this.pos[1]).
          rotateCCW(-Math.PI).
          scale(GSCALE,GSCALE).
          transformPoints(out);
        gfx.lineStyle(4,_S.color("white"));
        gfx.moveTo(out[0].x, out[0].y);
        for(let v=0; v<out.length; ++v)
          gfx.lineTo(out[v].x, out[v].y);
        gfx.lineTo(out[0].x, out[0].y);
        let bulletCounter = 0;
        for(let blt=0; blt<this.vecBullets.length; ++blt){
          if(this.vecBullets[blt].active){
            this.vecBullets[blt].draw(gfx);
            ++bulletCounter;
          }
        }
      }
      update(){
        if(!this.autoGun){return}
        if(gDuration <= 0){
          //choose another direction and duration
          gDuration = _.randInt2(30, 300);
          gAction   = _.randSign()>0?1:0;
        }
        --gDuration;
        switch(gAction){
          case 0:{ //move left
            if(this.pos[0] > GSCALE){
              this.pos[0] -= MaxTranslationPerTick;
            }else{
              gAction = 1;
            }
          }
            break;
          case 1:{ //move right
            if(this.pos[0] < Mojo.width-GSCALE){
              this.pos[0] += MaxTranslationPerTick;
            }else{
              gAction = 0;
            }
          }
            break;
        }
        for(let blt=0; blt<this.vecBullets.length; ++blt){
          if(!this.vecBullets[blt].active && this.ticksToNextBullet<=0){
            this.vecBullets[blt].switchOn(this.pos[0]);
            this.ticksToNextBullet=FIRING_RATE;
            gDuration = -1;
            break;
          }
        }
        for(let blt=0; blt<this.vecBullets.length; ++blt)
          this.vecBullets[blt].update();
        --this.ticksToNextBullet;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const ALIEN_VERTS=[ SPoint(1,3),
                                          SPoint(4,1),
                                          SPoint(4,-1),
                                          SPoint(2,-4),
                                          SPoint(1,-1),
                                          SPoint(0,-2),
                                          SPoint(-1,-1),
                                          SPoint(-2,-4),
                                          SPoint(-4,-1),
                                          SPoint(-4,1),
                                          SPoint(-1,3),

                                          SPoint(-2,1),
                                          SPoint(-1.5,0.5),
                                          SPoint(-2,0),
                                          SPoint(-2.5,1),

                                          SPoint(2,1),
                                          SPoint(1.5,0.5),
                                          SPoint(2,0),
                                          SPoint(2.5,1)];
    const ALIEN_JSON=JSON.stringify(ALIEN_VERTS);
    //------------------------------------------------------------------------
    class CAlien{
      constructor(){
        this.brain=new GA.NeuralNet(2+MAX_BULLETS*2,3,1,15);
        this.vel=[0,0];
        this.age=0;
        this.bbox={};
        this.warning=false;
        this.pos=[_.randInt2(0, Mojo.width), 50];
        this.bbox.left  = this.pos[0] - (4*ASCALE);
        this.bbox.right = this.pos[0] + (4*ASCALE);
        this.bbox.top   = this.pos[1] + (4*ASCALE);
        this.bbox.bottom= this.pos[1] - (4*ASCALE);
      }
      draw(gfx){
        let out=JSON.parse(ALIEN_JSON);
        _g2d.C2DMatrix.create().
          translate(this.pos[0],this.pos[1]).scale(ASCALE,ASCALE).transformPoints(out);
        gfx.lineStyle(4,_S.color("white"));
        gfx.moveTo(out[0].x, out[0].y);
        for(let v=0; v<11; ++v)
          gfx.lineTo(out[v].x, out[v].y);
        gfx.lineTo(out[0].x, out[0].y);

        gfx.lineStyle(4,_S.color("red"));
        //left eye
        gfx.moveTo(out[11].x, out[11].y);
        for(let v=12; v<15; ++v)
          gfx.lineTo(out[v].x, out[v].y);
        //right eye
        gfx.moveTo(out[15].x, out[15].y);
        for(let v=16; v<19; ++v)
          gfx.lineTo(out[v].x, out[v].y);
      }
      getActionFromNetwork(bullets, gunPos){
        //the inputs into the net
        //add in the vector to the gun turret
        let XComponentToTurret = gunPos[0] - this.pos[0];
        let YComponentToTurret = gunPos[1] - this.pos[1];
        let netInputs=[XComponentToTurret, YComponentToTurret];
        //now any bullets
        for(let blt=0; blt<bullets.length; ++blt){
          if(bullets[blt].active){
            let xComponent = bullets[blt].pos[0] - this.pos[0];
            let yComponent = bullets[blt].pos[1] - this.pos[1];
            netInputs.push(xComponent);
            netInputs.push(yComponent);
          }else{
            //if a bullet is innactive just input the vector to the gun turret
            netInputs.push(XComponentToTurret);
            netInputs.push(YComponentToTurret);
          }
        }
        //feed the inputs into the net and get the outputs
        let outputs = this.brain.update(netInputs);
        //determine which action is valid this frame. The highest valued
        //output over 0.9. If none are over 0.9 then just drift with
        //gravity
        let biggestSoFar = 0;
        let action = ActionType.drift;
        for(let i=0; i<outputs.length; ++i){
          if(outputs[i] > biggestSoFar && outputs[i] > 0.9){
            action = i;
            biggestSoFar = outputs[i];
          }
        }
        return action;
      }
      update(bullets,gunPos){
        //update age
        ++this.age;
        //get the next action from the neural network
        let action = this.getActionFromNetwork(bullets, gunPos);
        switch(action){
          case ActionType.thrust_left:
            this.vel[0] -= MaxThrustLateral/MASS;
            break;
          case ActionType.thrust_right:
            this.vel[0] += MaxThrustLateral/MASS;
            break;
          case ActionType.thrust_up:
            this.vel[1] -= MaxThrustVertical/MASS;
            break;
        }
        let gravity= [0, GravityPerTick];
        this.vel[0] += gravity[0];
        this.vel[1] += gravity[1];
        //clamp the velocity of the alien
        this.vel[0]= _M.clamp(-MaxVelocity, MaxVelocity,this.vel[0]);
        this.vel[1]= _M.clamp(-MaxVelocity, MaxVelocity, this.vel[1]);
        //update the alien's position
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];
        //wrap around window width
        if(this.pos[0] < 0) this.pos[0] = Mojo.width;
        if(this.pos[0] > Mojo.width) this.pos[0] = 0;
        //update the bounding box
        this.bbox.left  = this.pos[0] - (4*ASCALE);
        this.bbox.right = this.pos[0] + (4*ASCALE);
        this.bbox.top   = this.pos[1] + (4*ASCALE);
        this.bbox.bottom= this.pos[1] - (4*ASCALE);
        //an alien dies if it drops below the gun, flys too high
        //or is hit by a bullet
        if(this.pos[1] > (Mojo.height + 5) ||
           this.pos[1] < 15      || this.checkForCollision(bullets)) {
          return false;
        }
        return true;
      }
      checkForCollision(bullets){
        for(let blt=0; blt<bullets.length; ++blt){
          //if bullet is not active goto next bullet
          if(!bullets[blt].active)
          continue;

          let blts = bullets[blt].bbox;
          //test for intersection between bounding boxes
          if(!(blts.bottom > this.bbox.top ||
              blts.top < this.bbox.bottom ||
              blts.left > this.bbox.right ||
              blts.right < this.bbox.left)){
            bullets[blt].active=false;
            return true;
          }
        }
        return false;
      }
      reset(){
        this.age      = 0;
        this.vel=[0,0];
        this.pos= [_.randInt2(0, Mojo.width), 50];
      }
      mutate(){
        //grab the weights for the neural net
        let weights = this.brain.getWeights();
        for(let w=0; w<weights.length; ++w){
          //do we perturb this weight?
          if(_.rand() < MutationRate){
            weights[w] += (_.randMinus1To1() * MaxPerturbation);
          }
        }
        this.brain.putWeights(weights);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            this.gfx=self.insert(_S.graphics());
            this.gun= new CGun();
            this.activeAliens= _.fill(NumOnScreen, ()=> new CAlien());
            this.setAliens=_.fill(POPSIZE, ()=> new CAlien());
            this.aliensCreatedSoFar=NumOnScreen;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      doRun(){
        let tmp=[];
        this.g.gun.update();
        for(let a,i=0; i<this.g.activeAliens.length; ++i){
          //if alien has 'died' replace with a new one
          if(this.g.activeAliens[i].update(this.g.gun.vecBullets, this.g.gun.pos)){
            tmp.push(this.g.activeAliens[i])
          }else{
            //first we need to re-insert into the breeding population so
            //that its fitness score and genes are recorded.
            this.g.setAliens.push(this.g.activeAliens[i]);
            this.g.setAliens.sort((a,b)=>{
              return a.age>b.age?-1:(a.age<b.age?1:0)
            });
            a = this.tournamentSelection();
            a.reset();
            if(_.rand() < 0.8){ a.mutate() }
            tmp.push(a);
          }
        }
        if(tmp.length)
          _.append(this.g.activeAliens,tmp,true);
      },
      tournamentSelection(){
        let hit,bestFitnessSoFar = 0;
        //Select N members from the population at random testing against
        //the best found so far
        for(let cur,i=0; i<NumTourneyCompetitors; ++i){
          cur= this.g.setAliens[_.randInt2(0,this.g.setAliens.length * PercentBestToSelectFrom)];
          //test it to see if it's fitter than any selected so far and that its not already active
          if(cur.age > bestFitnessSoFar){
            hit = cur;
            bestFitnessSoFar = cur.age;
          }
        }
        return hit || this.g.setAliens[0];
      },
      postUpdate(dt){
        this.g.gfx.clear();
        this.doRun();
        for(let i=0; i<this.g.activeAliens.length; ++i){
          this.g.activeAliens[i].draw(this.g.gfx);
        }
        this.g.gun.draw(this.g.gfx);
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


