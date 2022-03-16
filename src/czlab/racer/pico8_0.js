(function(window){

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

    const int=Math.floor;
    const ceil=Math.ceil;
    const sin=Math.sin,
          cos=Math.cos;

    _Z.scene("level1",{
      setup(){
        _G.road=[
         {ct:10,tu:0},
         {ct:6,tu:-1},
         {ct:8,tu:0},
         {ct:4,tu:1.5},
         {ct:10,tu:0.2},
         {ct:4,tu:0},
         {ct:5,tu:-1},
        ];
        _G.w2=Mojo.width/2;
        _G.h2=Mojo.height/2;
        _G.cam={cnr:0,seg:0,x:0,y:0,z:0};
        this.insert(this.gfx=_S.graphics());
        this.__draw();
      },
      __draw(){
        this.gfx.clear();
        //direction
        let camang=_G.cam.z* _G.road[_G.cam.cnr].tu;
        let xd=-camang,yd=0,zd=1;
        //skew camera to account for direction
        let cx,cy,cz;
        let px,py,scale;
        [cx,cy,cz]=this.skew(_G.cam.x,_G.cam.y,_G.cam.z,xd,yd);
        //cursor, relative to skewed camera
        let x=-cx,y= -cy+1,z=-cz+1;
        //road position
        let cnr=_G.cam.cnr,seg=_G.cam.seg;
        this.gfx.lineStyle(1,_S.color("red"));
        for(let width, i=0;i<30;++i){
          [px,py,scale]=this.project(x,y,z);
          width=3*scale;
          //console.log(`x=${px},y=${py},scale=${scale},width=${width}`);
          this.gfx.moveTo(px-width,py);
          this.gfx.lineTo(px+width,py);
          x+=xd;
          y+=yd;
          z+=zd;
          xd+=_G.road[cnr].tu;
          [cnr,seg]=this.advance(cnr,seg);
        }
      },
      skew(x,y,z,xd,yd){
        return [x+z*xd,y+z*yd,z];
      },
      project(x,y,z){
        let scale=_G.h2/z;
        return [x*scale+_G.w2,y*scale+_G.h2,scale];
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
      postUpdate(dt){
        _G.cam.z+=0.1;
        if(_G.cam.z>1){
          _G.cam.z-=1;
          [_G.cam.cnr,_G.cam.seg]=this.advance(_G.cam.cnr,_G.cam.seg);
        }
        this.__draw();
      }
    });
  }

  window.addEventListener("load",()=> MojoH5({

    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }

  }));

})(this);

