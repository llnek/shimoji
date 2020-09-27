;(function(window){
  "use strict";

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    _Z.defScene("level1",{
      setup:function(){
        let blue = this.blue= _S.rectangle(64, 64, "blue");
        //blue.anchor.set(0.5);
        blue.mojoh5.step=function(dt){
          _S.move(blue,dt);
        };
        let sz=_S.halfSize(blue);
        this.insert(blue);
        _S.putCenter(this,blue, sz[0] + 16, sz[1] + 16);
        _I.makeDraggable(blue);
        let red = this.red= _S.circle(64, "red");
        _S.setAnchorCenter(red);
        red.mojoh5.step=function(dt){
          _S.move(red,dt);
        };
        this.insert(red);
        sz=_S.halfSize(red);
        _S.putCenter(this,red, -sz[0] -16, -sz[1] -16);
        _I.makeDraggable(red);

        blue.angle=60;
        red.angle=45;
        red.mojoh5.vel[0]=red.mojoh5.vel[1]=100;
        blue.mojoh5.vel[0]=blue.mojoh5.vel[1]=-100;

        this.message = _S.text( "Drag the circles...", {fontFamily:"sans-serif",fontSize:16,fill:"black"},10,10);
        this.insert(this.message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        //this.message.mojoh5.content("Drag the shapes...");
        //Check for a collision between the blue and red squares.
        //The collision variable will be `true`
        //if there's a collision and `false` if there isn't
        //let collision = _2d.hit(this.red, this.blue,true,true);
        let col= _2d.collide(this.blue, this.red,true);
        _2d.contain(this.blue,this,true);
        _2d.contain(this.red,this,true);
        //this.blue.rotation += 0.05;
        //Alternatively, you can use the lower-level hitTestRectangle method.
        //`hitTestCircleRectangle` arguments:
        //circularSprite, rectangularSprite
        //let collision = g.hitTestCircleRectangle(red, blue);
        //Change the message if there's a collision between the circles
        if(col){
          //let dx= col.overlapV[0];
          //let dy=col.overlapV[1];
          //this.red.x += dx;
          //this.red.y += dy;
          //this.blue.x -= dx;
          //this.blue.y -= dy;
          //this.message.mojoh5.content("Collision!");
        }
      }
    });
  }
  function setup(Mojo){
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window["io.czlab.mojoh5.AppConfig"]={
    arena: {width:256, height:256},
    scaleToWindow:true,
    start: setup
  };

})(this);



