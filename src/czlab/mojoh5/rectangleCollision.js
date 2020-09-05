(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_2d=Mojo["2d"],_I=Mojo.Input;

    _Z.defScene("level1",{
      setup:function(){
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        this.insert(blue);
        let sz=_S.halfSize(blue);
        _S.putCenter(this, blue,sz.x+16, sz.y+16);
        _I.makeDraggable(blue);
        //Make a red square
        let red = this.red= _S.rectangle(64, 64, "red");
        this.insert(red);
        sz=_S.halfSize(red);
        _S.putCenter(this,red, -sz.x-16, -sz.y -16);
        _I.makeDraggable(red);
        //Add some text
        this.message = _S.text( "Drag the circles...", {fontFamily:"sans-serif",fontSize:16, fill:"black"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        this.message.mojoh5.content("Drag the squares...");
        //Check for a collision between the blue and red squares.
        //The collision variable will be `true`
        //if there's a collision and `false` if there isn't
        //let collision = _2d.hit(this.red, this.blue,true,true); // blue hits red moves, red hits blue no
        let collision = _2d.hit(this.blue, this.red,true,true); // red hits blue moves, blue hits red no
        //Alternatively, you can use the lower-level hitTestRectangle method.
        //`hitTestRectangle` arguments:
        //spriteOne, spriteTwo
        //let collision = g.hitTestRectangle(blue, red);
        //Change the message if there's a collision between the circles
        if(collision) {
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
    arena: { width:256, height:256},
    scaleToWindow: true,
    start: setup
  };

})(this);


