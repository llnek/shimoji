(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_2d=Mojo["2d"],_I=Mojo.Input;

    _Z.defScene("level1",{
      setup:function(){
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        blue.mojoh5.step=function(){
          _S.move(blue);
        }
        this.insert(blue);
        let sz=_S.halfSize(blue);
        _S.putCenter(this, blue,sz.x+16, sz.y+16);
        _I.makeDraggable(blue);
        //Make a red square
        let red = this.red= _S.rectangle(64, 64, "red");
        red.mojoh5.step=function(){
          _S.move(red);
        }
        this.insert(red);
        sz=_S.halfSize(red);
        _S.putCenter(this,red, -sz.x-16, -sz.y -16);
        _I.makeDraggable(red);

        blue.anchor.set(0.5);
        red.anchor.set(0.5);
        //blue.angle=35;
        //red.angle=60;
        red.mojoh5.vx=red.mojoh5.vy=1;
        //blue.mojoh5.vx=blue.mojoh5.vy=-1;

        //Add some text
        this.message = _S.text( "Drag the circles...", {fontFamily:"sans-serif",fontSize:16, fill:"black"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        _2d.collidePolygonPolygon(this.red,this.blue,true);
        _2d.containEx(this.blue,this);
        _2d.containEx(this.red,this);
        //this.message.mojoh5.content("Drag the squares...");
        //Check for a collision between the blue and red squares.
        //The collision variable will be `true`
        //if there's a collision and `false` if there isn't
        //let collision = _2d.hit(this.red, this.blue,true,true); // blue hits red moves, red hits blue no
        let col= null;//_2d.hitPolygonPolygonEx(this.blue, this.red);
        //Alternatively, you can use the lower-level hitTestRectangle method.
        //`hitTestRectangle` arguments:
        //spriteOne, spriteTwo
        //let collision = g.hitTestRectangle(blue, red);
        //Change the message if there's a collision between the circles
        if(col) {
          let dx=col.overlapV[0];
          let dy=col.overlapV[1];
          this.blue.x -= dx;
          this.blue.y -= dy;
          //this.red.x += dx;
          //this.red.y += dy;
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


