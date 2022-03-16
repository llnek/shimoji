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
      setup(){
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _G.H2=Mojo.height/2;
        _G.W2=Mojo.width/2;
        _G.road=[
         {ct:10,tu:0},
         {ct:6,tu:-1},
         {ct:8,tu:0},
         {ct:4,tu:1.5},
         {ct:10,tu:0.2},
         {ct:4,tu:0},
         {ct:5,tu:-1},
        ];
        _G.camx=0;
        _G.camy=0;
        _G.camz=0;
        _G.camcnr=0;
        _G.camseg=0;
        this.insert(this.gfx=_S.graphics());
        this.__draw();
      },
      __draw(){
        let camang=_G.camz*_G.road[_G.camcnr].tu;
        let x=0-_G.camx,y=-_G.camy+1,z=-_G.camz+1;
        let xd=0-camang,yd=0,zd=1;
        let cnr=_G.camcnr,seg=_G.camseg;
        let px,py,scale;
        for(let i=0;i<30;++i){
          [px,py,scale]=this.project(x,y,z);
          let width=3*scale;

          this.gfx.lineStyle(1,_S.color("white"));
          this.gfx.moveTo(px-width,py);
          this.gfx.lineTo(px+width,py);
          console.log(`x1=${px-width},x2=${px+width},y=${py}`);

          x+=xd;
          y+=yd;
          z+=zd;

          xd+=_G.road[cnr].tu;

          [cnr,seg]=this.advance(cnr,seg);
        }
      },
      project(x,y,z){
        let scale=_G.H2/z;
        return [x*scale+_G.W2, y*scale+_G.H2, scale];
      },
      advance(cnr,seg){
        seg+=1;
        if(seg>=_G.road[cnr].ct){
          seg=0;
          cnr+=1;
          if(cnr>=_G.road.length)cnr=0;
        }
        return [cnr,seg];
      },
      __update(){
        _G.camz+=0.1;
        if(_G.camz>1){
          _G.camz-=1;
          [_G.camcnr,_G.camseg]=this.advance(_G.camcnr,_G.camseg);
        }
      },
      postUpdate(dt){
        this.__update();
        this.gfx.clear() && this.__draw();
      }
    },{centerStage:true});
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


