(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;
  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    const _=Mojo.u;

    _Z.defScene("level1",{
      setup:function(){
        let randomDiameter = _.randInt2(16, 64);
        //Create the ball using the random diameter
        let ball = this.ball= _S.circle(randomDiameter, "red");
        this.insert(ball);
        //Position the ball randomly somewhere across the top of the canvas
        ball.x = _.randInt2(0, Mojo.canvas.width - ball.width);
        ball.y = 0;

        //Set the ball's velocity
        ball.mojoh5.vx = _.randInt2(-12, 12);
        ball.mojoh5.vy = 0;

        //Set the ball's gravity, friction and mass
        ball.mojoh5.gravity = _.p2(0.6,0.6);
        ball.mojoh5.friction = _.p2(1,0);

        //Set the mass based on the ball's diameter
        ball.mojoh5.mass = 0.75 + (ball.width / 32);

        //An array of colors that will be chosen randomly for each
        //circular peg in the grid
        let colors = [
          "#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF"
        ];

        let pegs = this.pegs= _S.grid(

          //Set the grid's properties
          5, 4, 96, 96,
          true, 0, 0,

          //A function that describes how to make each peg in the grid
          () => {
            let peg = _S.circle(_.randInt2(16, 64), "blue");
            peg.mojoh5.fillStyle(colors[_.randInt2(0, 4)]);
            return peg;
          },
          //Run any extra code after each peg is made, if you want to
          () => console.log("extra!")
        );
        this.insert(pegs);
        //Position the grid of pegs
        pegs.x=16;
        pegs.y=96;

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(Mojo){
        //Apply gravity to the ball's vertical velocity
        this.ball.mojoh5.vy += this.ball.mojoh5.gravity.y;
        //Apply friction. ball.frictionX will be 0.96 if the ball is
        //on the ground, and 1 if it's in the air
        this.ball.mojoh5.vx *= this.ball.mojoh5.friction.x;

        //Move the ball by applying the new calculated velocity
        //to the ball's x and y position
        _S.move(this.ball);

        //Check for a collision with the ball and the stage's boundary, and
        //make the ball bounce by setting setting the last argument
        //in the `contain` method to `true`
        let stageCollision = _2d.contain(this.ball, this, true);

        //If the ball hit the bottom of the stage, add some so
        //that the ball gradually rolls to a stop
        if(stageCollision){
          if(stageCollision.has(Mojo.BOTTOM)){
            this.ball.mojoh5.friction.x = 0.96;
          } else {
            this.ball.mojoh5.friction.x = 1;
          }
        }
        //Check for a collision between the ball and the pegs using the
        //universal `hit` method.
        //arguments: circle, arrayOfCircles, reactToCollision?,
        //bounceApart?, useGlobalPosition?
        _2d.hit(this.ball, this.pegs.children, true, true, true);
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    arena: {width:512, height:512},
    backgroundColor: "black",
    scaleToWindow:true,
    start: setup
  };
})(this);



