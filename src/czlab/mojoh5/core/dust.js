(function(global,undefined){
  "use strict";
  let window=global,
    MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  MojoH5.Dust=function(Mojo) {
    const _D= {},
      _=Mojo.u,
      is=Mojo.is,
      _globalParticles = [];

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
                      minRotationSpeed = 0.01, maxRotationSpeed = 0.03) {
      //An array to store the curent batch of particles
      let angle,
        angles = [],
        particles = [],
        //Figure out by how many radians each particle should be separated
        spacing = (maxAngle - minAngle) / (numberOfParticles - 1);

      _.conj(_globalParticles,particles);
      //Create an angle value for each particle and push that //value into the `angles` array
      for(let i=0; i < numberOfParticles; ++i) {
        //If `randomSpacing` is `true`, give the particle any angle
        //value between `minAngle` and `maxAngle`
        if(randomSpacing) {
          angle = _.randFloat(minAngle, maxAngle);
          _.conj(angles,angle);
        } else {
          //If `randomSpacing` is `false`, space each particle evenly,
          //starting with the `minAngle` and ending with the `maxAngle`
          if(angle === undefined) angle = minAngle;
          _.conj(angles,angle);
          angle += spacing;
        }
      }
      let makeParticle = (angle) => {
        //Create the particle using the supplied sprite function
        let particle = spriteFunction();
        //Display a random frame if the particle has more than 1 frame
        if(particle.totalFrames > 0) {
          particle.gotoAndStop(_.randInt2(0, particle.totalFrames - 1));
        }
        //Set a random width and height
        let size = _.randInt2(minSize, maxSize);
        particle.width = size;
        particle.height = size;
        //Set the particle's `anchor` to its center
        particle.anchor.set(0.5, 0.5);
        particle.x = x;
        particle.y = y;
        //Set a random speed to change the scale, alpha and rotation
        particle.scaleSpeed = _.randFloat(minScaleSpeed, maxScaleSpeed);
        particle.alphaSpeed = _.randFloat(minAlphaSpeed, maxAlphaSpeed);
        particle.rotationSpeed = _.randFloat(minRotationSpeed, maxRotationSpeed);
        //Set a random velocity at which the particle should move
        let speed = _.randFloat(minSpeed, maxSpeed);
        particle.vx = speed * Math.cos(angle);
        particle.vy = speed * Math.sin(angle);
        //The `particles` array needs to be updated by the game loop each frame particles.push(particle);
        _.conj(particles,particle);
        container.addChild(particle);
        //The particle's `updateParticle` method is called on each frame of the game loop
        particle.updateParticle = () => {
          particle.vy += gravity;
          //Move the particle
          particle.x += particle.vx;
          particle.y += particle.vy;
          //Change the particle's `scale`
          if(particle.scale.x - particle.scaleSpeed > 0) {
            particle.scale.x -= particle.scaleSpeed;
          }
          if(particle.scale.y - particle.scaleSpeed > 0) {
            particle.scale.y -= particle.scaleSpeed;
          }
          //Change the particle's rotation
          particle.rotation += particle.rotationSpeed;
          //Change the particle's `alpha`
          particle.alpha -= particle.alphaSpeed;
          //Remove the particle if its `alpha` reaches zero
          if(particle.alpha <= 0) {
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
    _D.emitter=function(interval, particleFunction) {
      let emitterObject = {},
        timerInterval = undefined;

      emitterObject.playing = false;
      function play() {
        if(!emitterObject.playing) {
          particleFunction();
          timerInterval = setInterval(emitParticle.bind(this), interval);
          emitterObject.playing = true;
        }
      }
      function stop() {
        if(emitterObject.playing) {
          clearInterval(timerInterval);
          emitterObject.playing = false;
        }
      }
      function emitParticle() {
        particleFunction();
      }
      emitterObject.play = play;
      emitterObject.stop = stop;
      return emitterObject;
    };
    /**
     * @public
     * @function
     */
    _D.update=function(dt) {
      if(_globalParticles.length > 0)
        for(let i = _globalParticles.length-1; i >= 0; --i) {
          let particles = _globalParticles[i];
          if(particles.length > 0) {
            for(let j = particles.length-1; j >= 0; --j)
              particles[j].updateParticle();
          } else {
            //Remove the particle array from the `globalParticles` array if doesn't
            //contain any more sprites
            _.disj(_globalParticles,particles);
          }
        }
    };

    return Mojo.Dust=_D;
  };

})(this);

