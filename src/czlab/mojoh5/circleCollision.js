;(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];

    _Z.defScene("level1",{
      setup:function(){
        let blue = _S.circle(64, "blue");
        let sz=_S.halfSize(blue);
        this.blue=blue;
        this.insert(blue);
        _I.makeDraggable(blue);
        _S.putCenter(this, blue, sz.x+16, sz.y+16);
        //Make a red circle
        let red = _S.circle(64, "red");
        this.insert(red);
        this.red=red;
        _I.makeDraggable(red);
        _S.putCenter(this, red, -_S.radius(red)-16, -_S.radius(red)-16);

        //Add some text
        this.message = _S.text("Drag the circles...",
                              {fontSize: 16, fontFamily: "sans-serif", fill:"black"}, 10, 10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        this.message.mojoh5.content("Drag the circles...");
        //Check for a collision between the blue and red circles using
        //the universal `hit` method.
        //The collision variable will be `true`
        //if there's a collision and `false` if there isn't
        //var collision = g.hit(blue, red);
        //Alternatively, you can use the lower-level `hitTestCircle` method.
        //`hitTestCircle` arguments:
        //sprite, sprite
        //let collision = _2d.hitTestCircle(this.blue, this.red);
        let col= _2d.hitCircleCircleEx(this.blue, this.red);
        //Change the message if there's a collision between the circles
        if(col){
          let dx=col.overlapV[0];
          let dy=col.overlapV[1];
          //this.blue.x -= dx; this.blue.y -= dy;
          this.red.x += dx; this.red.y += dy;
          this.message.mojoh5.content("Collision!");
        }
      }
    });
  }

  function setup(Mojo){
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  MojoH5.Config={
    arena: {width:256, height:256},
    scaleToWindow:true,
    start: setup
  };

})(this);



