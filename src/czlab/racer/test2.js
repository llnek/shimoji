;(function(window,UNDEF){

  "use strict";

  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    const GREEN=_S.color("green");
    const GREY=_S.color("grey");
    const RED=_S.color("red");

    _Z.scene("level1",{
      __init(){
        //let road= 0.6; //width of road, 60% of screen width
        _G.middle=0.5;
        _G.carPos=0;
        //_G.clipWidth= road * 0.15;
        //_G.roadWidth= road  / 2; //half of road
        //_G.leftGrass= (_G.middle- _G.roadWidth - _G.clipWidth) * _G.arena.width;
        //_G.leftClip= (_G.middle- _G.roadWidth) * _G.arena.width;
        //_G.rightClip= (_G.middle+ _G.roadWidth) * _G.arena.width;
        //_G.rightGrass= (_G.middle+ _G.roadWidth + _G.clipWidth) * _G.arena.width;
      },
      project(y){
        let scale= y/_G.arena.height/2;
        _G.roadWidth= 0.1 + scale*0.8;
        _G.clipWidth= _G.roadWidth * 0.15;
        _G.roadWidth= _G.roadWidth*0.5; //half of road
        _G.middle= 0.5;
        _G.leftGrass= (_G.middle- _G.roadWidth - _G.clipWidth) * _G.arena.width;
        _G.leftClip= (_G.middle- _G.roadWidth) * _G.arena.width;
        _G.rightClip= (_G.middle+ _G.roadWidth) * _G.arena.width;
        _G.rightGrass= (_G.middle+ _G.roadWidth + _G.clipWidth) * _G.arena.width;
        return scale;
      },
      __draw(){
        let W=_G.arena.width,
            H=_G.arena.height,
            W2=W/2,
            H2= _G.arena.height/2;
        for(let scale,row,y=0; y < H2;++y){
          scale= this.project(y);
          row= H2+y;
          this.__drawLine(0,row,_G.leftGrass,row,GREEN);
          this.__drawLine(_G.leftGrass,row,_G.leftClip,row,RED);
          this.__drawLine(_G.leftClip,row,_G.rightClip,row,GREY);
          this.__drawLine(_G.rightClip,row,_G.rightGrass,row,RED);
          this.__drawLine(_G.rightGrass,row,W,row,GREEN);
        }
        let carX= W2 + W*_G.carPos/2 - _G.car.width/2;
        _G.car.x=carX;
        _G.car.y=H*0.9 - _G.car.height;
      },
      __drawLine(x1,y1,x2,y2,c){
        this.gfx.lineStyle(1,c);
        this.gfx.moveTo(x1,y1);
        this.gfx.lineTo(x2,y2);
      },
      setup(){
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _G.car=_S.rect(40,60,_S.color("white"));
        this.__init();
        this.insert(this.gfx=_S.graphics());
        this.insert(_G.car);
      },
      postUpdate(dt){
        this.gfx.clear() && this.__draw();
      }
    },{});
  }

  window.addEventListener("load",()=> MojoH5({

    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }

  }));

})(this);


