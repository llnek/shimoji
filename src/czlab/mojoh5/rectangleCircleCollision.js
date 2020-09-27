(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;
  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    _Z.defScene("level1",{
      setup:function(){
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        let sz=_S.halfSize(blue);
        this.insert(blue);
        _S.putCenter(this,blue, sz.x + 16, sz.y + 16);
        _I.makeDraggable(blue);
        let red = this.red= _S.circle(64, "red");
        this.insert(red);
        sz=_S.halfSize(red);
        _S.putCenter(this,red, -sz.x -16, -sz.y -16);
        _I.makeDraggable(red);

        blue.anchor.set(0.5);
        blue.angle=60;
        red.anchor.set(0.5);
        //red.angle=45;

        this.message = _S.text( "Drag the circles...", {fontFamily:"sans-serif",fontSize:16,fill:"black"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        this.message.mojoh5.content("Drag the shapes...");
        //Check for a collision between the blue and red squares.
        //The collision variable will be `true`
        //if there's a collision and `false` if there isn't
        //let collision = _2d.hit(this.red, this.blue,true,true);
        let col= _2d.hitPolygonCircleEx(this.blue, this.red);
        //Alternatively, you can use the lower-level hitTestRectangle method.
        //`hitTestCircleRectangle` arguments:
        //circularSprite, rectangularSprite
        //let collision = g.hitTestCircleRectangle(red, blue);
        //Change the message if there's a collision between the circles
        if(col){
          let dx= col.overlapV[0];
          let dy=col.overlapV[1];
          //this.red.x += dx;
          //this.red.y += dy;
          this.blue.x -= dx;
          this.blue.y -= dy;
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



