(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input;

    _Z.defScene("level1",{
      setup(){
        let forest=this.forest= _S.sprite("forest.png");
        let walking= this.walking=_S.animation("walkcycle.png", 64, 64);
        let elf = this.elf= _S.sprite(walking);
        this.insert(forest);
        //this.insert(walking);
        this.insert(elf);
        _S.setXY(elf,32, 128);
        elf.states = {
          up: 0,
          left: 9,
          down: 18,
          right: 27,
          walkUp: [0, 8],
          walkLeft: [10, 17],
          walkDown: [19, 26],
          walkRight: [28, 35]
        };
        elf.mojoh5.showFrame(elf.states.right);
        let leftArrow = _I.keyboard(37);
        let upArrow = _I.keyboard(38);
        let rightArrow = _I.keyboard(39);
        let downArrow = _I.keyboard(40);
        leftArrow.press = () => {
          elf.mojoh5.playFrames(elf.states.walkLeft);
          elf.mojoh5.vel[0] = -1;
          elf.mojoh5.vel[1] = 0;
        };
        leftArrow.release = () => {
          if (!rightArrow.isDown && elf.mojoh5.vel[1] === 0) {
            elf.mojoh5.vel[0] = 0;
            elf.mojoh5.showFrame(elf.states.left);
          }
        };
        upArrow.press = () => {
          elf.mojoh5.playFrames(elf.states.walkUp);
          elf.mojoh5.vel[1] = -1;
          elf.mojoh5.vel[0] = 0;
        };
        upArrow.release = () => {
          if (!downArrow.isDown && elf.mojoh5.vel[0] === 0) {
            elf.mojoh5.vel[1] = 0;
            elf.mojoh5.showFrame(elf.states.up);
          }
        };
        rightArrow.press = () => {
          elf.mojoh5.playFrames(elf.states.walkRight);
          elf.mojoh5.vel[0] = 1;
          elf.mojoh5.vel[1] = 0;
        };
        rightArrow.release = () => {
          if (!leftArrow.isDown && elf.mojoh5.vel[1] === 0) {
            elf.mojoh5.vel[0] = 0;
            elf.mojoh5.showFrame(elf.states.right);
          }
        };
        downArrow.press = () => {
          elf.mojoh5.playFrames(elf.states.walkDown);
          elf.mojoh5.vel[1] = 1;
          elf.mojoh5.vel[0] = 0;
        };
        downArrow.release = () => {
          if (!upArrow.isDown && elf.mojoh5.vel[0] === 0) {
            elf.mojoh5.vel[1] = 0;
            elf.mojoh5.showFrame(elf.states.down);
          }
        };
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //Move the elf and constrain it to the canvas boundaries
        //(-18 and +18 are to compensate for image padding around the sprite)
        this.elf.x = Math.max(-18, Math.min(this.elf.x + this.elf.mojoh5.vel[0],
          Mojo.canvas.width - this.elf.width + 18));
        this.elf.y = Math.max(64, Math.min(this.elf.y + this.elf.mojoh5.vel[1],
          Mojo.canvas.height - this.elf.height));
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:[ "forest.png", "walkcycle.png" ],
      arena:{width:256,height:256},
      scaleToWindow:true,
      start:setup
    });
  });
})(this);


