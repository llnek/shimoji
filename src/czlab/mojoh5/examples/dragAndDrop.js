(function(window){
  "use strict";

  function scenes(Mojo){
    let _S=Mojo.Sprites, _I=Mojo.Input;

    Mojo.Scenes.defScene("level1", function(){
      let cat = _S.sprite("cat.png");
      _I.makeDraggable(cat);
      let tiger = _S.sprite("tiger.png");
      _I.makeDraggable(tiger);
      _S.setXY(tiger,64, 64);
      let hedgehog = _S.sprite("hedgehog.png");
      _I.makeDraggable(hedgehog);
      _S.setXY(hedgehog,128, 128);
      this.insert(cat);
      this.insert(tiger);
      this.insert(hedgehog);
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:512, height:512},
      assetFiles: ["images/animals.json"],
      scaleToWindow: true,
      start: setup
    })
  });

})(this);

