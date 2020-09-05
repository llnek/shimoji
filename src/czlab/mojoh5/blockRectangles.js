(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    _Z.defScene("level1",{
      setup:function(){
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        let sz=_S.halfSize(blue);
        this.insert(blue);
        blue.pivot.set(0.5, 0.5);
        _S.putCenter(this,blue, sz.x+ 16, sz.y+ 16);
        _I.makeDraggable(blue);

        let red = this.red= _S.rectangle(64, 64, "red");
        sz=_S.halfSize(red);
        this.insert(red);
        red.pivot.set(0.5, 0.5);
        _S.putCenter(this,red, -sz.x-16, -sz.y-16);
        _I.makeDraggable(red);
        //Add some text
        this.message = _S.text("Drag the circles...",{fontFamily:"sans-serif",fontSize:16,fill:"black"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        /*
        Use the universal `hit` method to prevent two rectangles from
        overlapping. It returns a `collision` variable that tells you the side on which
        the first rectangle touched the second rectangle. (The `collision`
        variable will be `undefined` if there's no collision.). The second
        sprite in the argument will block the movement of the first sprite.
        The second sprite in the argument can push the first sprite.
        //`hit` arguments:
        //spriteOne, spriteTwo, reactToCollision?, bounceApart?
        */
        let collision = _2d.hit(this.blue, this.red, true, false);
        /*
        You can alternatively use the lower-level `rectangleCollision`
        method
        `rectangleCollision` arguments:
        sprite1, sprite2, bounce?, useGlobalCoordinates?
        (the third and fourth arguments default to `true`);
        */
        //let collision = g.rectangleCollision(blue, red);

        //Change the message if there's a collision between the rectangles
        if(collision) {
          this.message.mojoh5.content( "Collision on: " + collision);
        } else {
          this.message.mojoh5.content("Drag the squares...");
        }
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    arena: {width:256, height:256},
    scaleToWindow: true,
    start: setup
  };
})(this);



