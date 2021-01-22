(function(window){
  "use strict";

  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];

    _Z.defScene("level1",{
      setup:function(){
        //Make a square and position it
        let square = _S.rectangle(100, 100, "lightblue", "black", 1);
        square.anchor.set(1,1);
        this.insert(square);
        _S.pinBottom(this,square,-110);

        let square2 = _S.rectangle(60, 40, "lightblue", "black", 1);
        square2.anchor.set(0.5, 0.5);
        this.insert(square2);
        _S.pinTop(square,square2,40,1);

        let square3 = _S.rectangle(20, 40, "lightblue", "black", 1);
        this.insert(square3);
        _S.pinTop(square2,square3,10);





        //If you change the square's `alpha`, the child sprites inside it will
        //be similarly affected
        //square.alpha = 0.2;
        //Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  window.addEventListener("load",()=>{
    MojoH5({
    assetFiles: [ "cat.png", "star.png" ],
    arena: {width:512, height:512},
    start: setup,
    scaleToWindow:true
    })
  });

})(this);



