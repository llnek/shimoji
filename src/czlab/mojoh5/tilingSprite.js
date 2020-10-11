(function(window){
  "use strict";

  function scenes(Mojo){
    let _S=Mojo.Sprites;
    Mojo.Scenes.defScene("level1",{
      setup(){
        let box = this.box= _S.tilingSprite("tile.png", 128, 128);
        this.insert(box);
        _S.pinCenter(this,box);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        //this.box.tilePosition.x += 0.5;
        this.box.tilePosition.y -= 0.5;
        //Optionally use the `tileScaleX` and `tileScaleY` properties to
        //change the tiling sprite's scale
        //box.tileScaleX += 0.001;
        //box.tileScaleY += 0.001;
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  window.addEventListener("load",()=>{
    window.MojoH5({
      arena: {width:256, height:256},
      assetFiles: ["tile.png"],
      scaleToWindow:true,
      start: setup
    });
  });

})(this);

