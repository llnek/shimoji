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
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

(function(global,undefined){
  "use strict";
  let window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Dust=function(Mojo){
    const _D= {};
    const _=Mojo.u;
    const is=Mojo.is;
    const _globalParticles = [];
    /**
     * @public
     * @function
     */
    _D.create=function(x, y,
                      spriteFunction,// = () => console.log("Sprite creation function"),
                      container,// = () => new this.Container(),
                      numberOfParticles = 20,
                      gravity = 0,
                      randomSpacing = true,
                      minAngle = 0, maxAngle = 6.28,
                      minSize = 4, maxSize = 16,
                      minSpeed = 0.3, maxSpeed = 3,
                      minScaleSpeed = 0.01, maxScaleSpeed = 0.05,
                      minAlphaSpeed = 0.02, maxAlphaSpeed = 0.02,
                      minRotationSpeed = 0.01, maxRotationSpeed = 0.03){
      //array to store the curent batch of particles
      let angle;
      let angles = [];
      let particles = [];
        //Figure out by how many radians each particle should be separated
      let spacing = (maxAngle - minAngle) / (numberOfParticles - 1);
      _.conj(_globalParticles,particles);
      //Create an angle value for each particle and push that //value into the `angles` array
      for(let i=0; i < numberOfParticles; ++i){
        //If `randomSpacing` is `true`, give the particle any angle
        //value between `minAngle` and `maxAngle`
        if(randomSpacing){
          angle = _.randFloat(minAngle, maxAngle);
          _.conj(angles,angle);
        }else{
          //If `randomSpacing` is `false`, space each particle evenly,
          //starting with the `minAngle` and ending with the `maxAngle`
          if(angle === undefined) angle = minAngle;
          _.conj(angles,angle);
          angle += spacing;
        }
      }
      function makeParticle(angle){
        //Create the particle using the supplied sprite function
        let particle = spriteFunction();
        //Display a random frame if the particle has more than 1 frame
        if(particle.totalFrames > 0){
          particle.gotoAndStop(_.randInt2(0, particle.totalFrames - 1));
        }
        //Set a random width and height
        let size = _.randInt2(minSize, maxSize);
        particle.width = size;
        particle.height = size;
        particle.anchor.set(0.5);
        particle.x = x;
        particle.y = y;
        //Set a random speed to change the scale, alpha and rotation
        particle.mojoh5.scaleSpeed = _.randFloat(minScaleSpeed, maxScaleSpeed);
        particle.mojoh5.alphaSpeed = _.randFloat(minAlphaSpeed, maxAlphaSpeed);
        particle.mojoh5.rotationSpeed = _.randFloat(minRotationSpeed, maxRotationSpeed);
        //Set a random velocity at which the particle should move
        let speed = _.randFloat(minSpeed, maxSpeed);
        particle.mojoh5.vx = speed * Math.cos(angle);
        particle.mojoh5.vy = speed * Math.sin(angle);
        //The `particles` array needs to be updated by the game loop each frame particles.push(particle);
        _.conj(particles,particle);
        container.addChild(particle);
        //The particle's `updateParticle` method is called on each frame of the game loop
        particle.mojoh5.updateParticle = function(){
          particle.mojoh5.vy += gravity;
          //Move the particle
          particle.x += particle.mojoh5.vx;
          particle.y += particle.mojoh5.vy;
          //Change the particle's `scale`
          if(particle.scale.x - particle.mojoh5.scaleSpeed > 0){
            particle.scale.x -= particle.mojoh5.scaleSpeed;
          }
          if(particle.scale.y - particle.mojoh5.scaleSpeed > 0){
            particle.scale.y -= particle.mojoh5.scaleSpeed;
          }
          //Change the particle's rotation
          particle.rotation += particle.mojoh5.rotationSpeed;
          //Change the particle's `alpha`
          particle.alpha -= particle.mojoh5.alphaSpeed;
          //Remove the particle if its `alpha` reaches zero
          if(particle.alpha <= 0){
            container.removeChild(particle);
            _.disj(particles,particle);
          }
        };
      };
      //Make a particle for each angle
      angles.forEach(angle => makeParticle(angle));
      return particles;
    };
    /**
     * @public
     * @function
     */
    _D.emitter=function(interval, particleFunction){
      let intv, emitterObject = {playing:false};
      function emitParticle(){
        particleFunction();
      }
      function play(){
        if(!emitterObject.playing){
          particleFunction();
          intv = _.timer(emitParticle.bind(this), interval);
          emitterObject.playing = true;
        }
      }
      function stop(){
        if(emitterObject.playing){
          _.clear(intv);
          emitterObject.playing = false;
        }
      }
      emitterObject.play = play;
      emitterObject.stop = stop;
      return emitterObject;
    };
    /**
     * @public
     * @function
     */
    _D.update=function(dt){
      if(_globalParticles.length > 0)
        for(let i = _globalParticles.length-1; i >= 0; --i){
          let particles = _globalParticles[i];
          if(particles.length > 0){
            for(let j = particles.length-1; j >= 0; --j)
              particles[j].mojoh5.updateParticle();
          }else{
            //Remove the particle array from the `globalParticles` array if doesn't
            //contain any more sprites
            _.disj(_globalParticles,particles);
          }
        }
    };

    return Mojo.Dust=_D;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF


