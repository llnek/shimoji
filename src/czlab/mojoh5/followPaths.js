(function(window){
  "use strict";

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_W=Mojo.Effects,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _=Mojo.u,is=Mojo.is;
    _Z.defScene("level1",function(){
      let cat = this.cat= _S.sprite("cat.png",32,32);
      this.insert(cat);
      let catPath = _W.walkPath(cat,                   //The sprite
                                _W.SMOOTH,
                                //An array of x/y waypoints to connect in sequence
                                [
                                  [32, 32],            //First x/y point
                                  [32, 128],           //Next x/y point
                                  [300, 128],          //Next x/y point
                                  [300, 32],           //Next x/y point
                                  [32, 32]             //Last x/y point
                                ],
                                300,                   //Total duration, in frames
                                true,                  //Should the path loop?
                                true,                  //Should the path reverse?
                                1000                   //Delay in milliseconds between segments
                              );
      let hedgehog = _S.sprite("hedgehog.png",32,256);
      this.insert(hedgehog);
        //Use `walkCurve` to make the hedgehog follow a curved path
        //between a series of connected waypoints. Here's how to use it:
      let hedgehogPath = _W.walkCurve(hedgehog,              //The sprite
                                      _W.SMOOTH,
                                      //An array of Bezier curve points that
                                      //you want to connect in sequence
                                      [
                                        [[hedgehog.x, hedgehog.y],[75, 500],[200, 500],[300, 300]],
                                        [[300, 300],[250, 100],[100, 100],[hedgehog.x, hedgehog.y]]
                                      ],
                                      300,                   //Total duration, in frames
                                      true,                  //Should the path loop?
                                      true,                  //Should the path yoyo?
                                      1000                   //Delay in milliseconds between segments
                                    );
    });
  }

  function setup(Mojo){
    defScenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: ["cat.png","hedgehog.png"],
    arena: {width:512, height:600},
    scaleToWindow: true,
    start: setup
  };

})(this);


