MojoH5.Config = {
  assetFiles: ["images/bgblack.jpg"],
  start: function(Mojo) {
    let S= Mojo.Sprites;
    let Z=Mojo.Scenes;
    Z.defScene("splash",function(options) {
      let s= S.sprite("images/bgblack.jpg", Mojo.canvas.width/2,Mojo.canvas.height/2);
      s.anchor.set(0.5);
      s.name="1";
      this.insert(s);
      s= S.sprite("images/bgblack.jpg", Mojo.canvas.width/2,Mojo.canvas.height/2);
      s.anchor.set(0.5);
      s.name="2";
      this.insert(s);
      s= S.sprite("images/bgblack.jpg", Mojo.canvas.width/2,Mojo.canvas.height/2);
      s.anchor.set(0.5);
      s.name="3";
      this.insert(s);
      s= S.sprite("images/bgblack.jpg", Mojo.canvas.width/2,Mojo.canvas.height/2);
      s.anchor.set(0.5);
      s.name="4";
      s.step=(dt) => {
      };
      this.insert(s,0);
    });

    Z.runScene("splash", {dude: "off"});

    //setTimeout(() => { Z.removeScene("splash"); }, 2000);
  }
};
