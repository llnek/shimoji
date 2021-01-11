;(function(window){
  "use strict";

  function scenes(Mojo){
    let _GS=Mojo.Game.state;
    let _G=Mojo.Game;
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;

    _Z.defScene("bg",{
      setup(){
      }
    });

    _Z.defScene("level1",{
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:["bg.jpg","tiles.png","images/tiles.json"],
      //24x140, 10x190
      arena:{width:3360, height:1900},
      scaleToWindow:"max",
      start: setup
    })
  });

})(this);





