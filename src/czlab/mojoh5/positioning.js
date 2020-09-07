(function(window,undefiend){
  "use strict";
  const MojoH5=window.MojoH5;
  function scenes(Mojo){
const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];

    _Z.defScene("level1",{
      setup:function(){
        let box = this.box= _S.rectangle(64, 64, "seaGreen", "hotPink", 4);
        box.anchor.set(0.5, 0.5);
        this.insert(box);
        _S.putCenter(this,box);

        //Create a cat sprite and center its rotation pivot point
        let cat = this.cat= _S.sprite("cat.png");
        cat.anchor.set(0.5, 0.5);
        this.insert(cat);
        //Position the cat to the
        //left of the box, with an additional x offset of -16 pixels
        _S.putLeft(box,cat, -16);

        let tiger = this.tiger= _S.sprite("tiger.png");
        tiger.anchor.set(0.5, 0.5);
        this.insert(tiger);
        _S.putRight(box,tiger);

        let hedgehog = this.hedgehog=  _S.sprite("hedgehog.png");
        hedgehog.anchor.set(0.5, 0.5);
        this.insert(hedgehog);
        _S.putBottom(box,hedgehog);

        let rocket = this.rocket= _S.sprite("images/rocket.png");
        rocket.anchor.set(0.5, 0.5);
        this.insert(rocket);

        //Position the rocket on top of the box with a y offset of -20
        //pixels
        //_S.putTop(box,rocket, 0, -20);
        _S.putBottom(hedgehog,rocket);

        //Create a star and position it in the center of the box
        let star = this.star= _S.sprite("images/star.png");
        star.anchor.set(0.5, 0.5);
        this.insert(star);
        _S.putCenter(box,star);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        this.cat.rotation -= 0.01;
        this.tiger.rotation -= 0.01;
        this.hedgehog.rotation += 0.01;
        this.rocket.rotation += 0.01;
        this.star.rotation += 0.01;
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    assetFiles: [ "rocket.png", "images/animals.json", "star.png" ],
    arena: {width:256, height:256},
    scaleToWindow:true,
    start: setup
  };
})(this);

